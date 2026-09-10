const mongoose = require("mongoose");

const RequestSheetOfCM = require("../../model/requestSheetDataOfCM");

const {
  getFinancialQuarter,
  gettingMonthForSelectedDate,
} = require("../../middleware/gettingFYMonthForPreAgg");
const { gettingFYYear } = require("../../middleware/gettingFYYear");

const {
  CM_RESCHEDULABLE_STATUSES,
  toCMMoment,
  formatCMDate,
  isRecurring,
  addFrequencyInterval,
  shiftPreservingDuration,
} = require("../../utils/cmFrequency");

/**
 * CM schedule service.
 *
 * Owns the business rules for "the user moved an occurrence's Target Date, so
 * the schedule that follows it has to be re-derived". The controller stays thin
 * and only translates HTTP <-> service.
 *
 * SCHEDULING MODEL (unchanged, discovered from the existing implementation)
 *   An occurrence lives at
 *     commonDataFilledByAssignUser[i].quarterlyDataOfTheCM[j]
 *   and carries its own targetDateOfCM. The frequency is stored once per sheet
 *   at cmBasicDataFilledByMTD_TL.frequencyValue, and the next occurrence has
 *   always been "previous target date + one frequency interval".
 *
 * WHAT THIS SERVICE CHANGES
 *   - The edited occurrence gets the new target date.
 *   - Every LATER occurrence that is still pending is re-derived from the new
 *     date as newTargetDate + (position x interval), so the spacing the
 *     frequency describes is preserved end to end.
 *   - Occurrences that are not pending (Completed, Ongoing, Fill Sheet,
 *     Rejected, or sitting in any Under-* Approval state) are never touched, and
 *     neither is anything scheduled before the edited occurrence.
 */

/**
 * Flatten the two-level occurrence structure into a single addressable list.
 * The numeric indices are kept because both arrays are only ever appended to
 * ($push), never spliced, so an index stays valid for the life of a document.
 */
const flattenOccurrences = (requestSheet) => {
  const occurrences = [];

  (requestSheet?.commonDataFilledByAssignUser || []).forEach(
    (bucket, bucketIndex) => {
      (bucket?.quarterlyDataOfTheCM || []).forEach(
        (occurrence, occurrenceIndex) => {
          occurrences.push({
            bucketIndex,
            occurrenceIndex,
            bucket,
            occurrence,
            occurrenceCountInBucket: bucket?.quarterlyDataOfTheCM?.length || 0,
          });
        },
      );
    },
  );

  return occurrences;
};

/** Schedule order is date order; array order is the tie-break for equal dates. */
const bySchedule = (a, b) => {
  const aDate = toCMMoment(a.occurrence?.targetDateOfCM);
  const bDate = toCMMoment(b.occurrence?.targetDateOfCM);

  if (aDate && bDate && !aDate.isSame(bDate)) return aDate.diff(bDate);
  if (aDate && !bDate) return -1;
  if (!aDate && bDate) return 1;

  if (a.bucketIndex !== b.bucketIndex) return a.bucketIndex - b.bucketIndex;
  return a.occurrenceIndex - b.occurrenceIndex;
};

const isPending = (occurrence) =>
  CM_RESCHEDULABLE_STATUSES.includes(occurrence?.requestSheetStatusOfCM);

/**
 * Array filters that address exactly ONE planned occurrence for the CM update
 * endpoints that write in place through
 *   commonDataFilledByAssignUser.$[yearFilter].quarterlyDataOfTheCM.$[quarterFilter]
 *
 * The financial year is derived from the occurrence's own target date, the same
 * source the quarter filter has always used. It must not come from a global
 * "current financial year" value: an occurrence keeps living in the bucket for
 * the year it is planned in, so pinning the filter to today's year makes every
 * occurrence outside it unaddressable and the update silently writes nothing.
 *
 * When the caller knows the occurrence's _id, that is used instead and the year
 * filter is relaxed to "any bucket". _id is unique within the document and,
 * unlike a derived year/quarter, stays correct when the same submit also moves
 * the target date across a quarter or financial-year boundary.
 */
const buildOccurrenceArrayFilters = ({ targetDateOfCM, occurrenceId } = {}) => {
  if (occurrenceId && mongoose.Types.ObjectId.isValid(occurrenceId))
    return [
      {
        "yearFilter.preAggregationTimeStampOfRequestSheet.requestSheet_year": {
          $exists: true,
        },
      },
      { "quarterFilter._id": mongoose.Types.ObjectId(occurrenceId) },
    ];

  return [
    {
      "yearFilter.preAggregationTimeStampOfRequestSheet.requestSheet_year":
        gettingFYYear(targetDateOfCM),
    },
    {
      "quarterFilter.requestSheet_quarter":
        getFinancialQuarter(targetDateOfCM),
    },
  ];
};

/**
 * Did the update above actually address an occurrence?
 *
 * findOneAndUpdate returns the document whenever the _id matched, even when the
 * arrayFilters matched no array element, so the caller cannot tell a real write
 * from a no-op. Checking the returned document for the addressed occurrence
 * turns that silent no-op into a visible error, and costs no extra query.
 */
const hasAddressableOccurrence = (
  requestSheet,
  { targetDateOfCM, occurrenceId } = {},
) => {
  if (!requestSheet) return false;

  if (occurrenceId)
    return flattenOccurrences(requestSheet).some(
      ({ occurrence }) =>
        occurrence?._id?.toString() === occurrenceId.toString(),
    );

  const year = gettingFYYear(targetDateOfCM);
  const quarter = getFinancialQuarter(targetDateOfCM);

  return flattenOccurrences(requestSheet).some(
    ({ bucket, occurrence }) =>
      bucket?.preAggregationTimeStampOfRequestSheet?.requestSheet_year ===
        year && occurrence?.requestSheet_quarter === quarter,
  );
};

/**
 * Who may move a Target Date.
 *
 * Mirrors the rule the CM report grid already applies through its isEditable
 * check (MTD department, TL/HOSS user type), enforced here so the rule holds
 * for the API and not only for the button.
 */
const canRescheduleCM = (actingUser) =>
  actingUser?.tm_department === "MTD" && actingUser?.user_type === "TL/HOSS";

/**
 * Build the $set for one occurrence moving to a new target date.
 *
 * Beyond the date itself this keeps the derived fields consistent:
 *   - requestSheet_quarter, because every existing arrayFilter in the CM module
 *     addresses an occurrence by quarter. Leaving a stale quarter behind after a
 *     cross-quarter move would make the occurrence unreachable by those filters.
 *   - activityEndDateOfCM, shifted by the same offset so the activity window
 *     keeps its length instead of ending before it starts.
 *   - The bucket's year/month label, but ONLY when the bucket holds this single
 *     occurrence. Buckets created by the multi-year expansion hold up to four
 *     occurrences and their label must not be rewritten on behalf of one of them.
 */
const buildOccurrenceUpdate = ({
  bucketIndex,
  occurrenceIndex,
  bucket,
  occurrence,
  occurrenceCountInBucket,
  newTargetDate,
}) => {
  const occurrencePath = `commonDataFilledByAssignUser.${bucketIndex}.quarterlyDataOfTheCM.${occurrenceIndex}`;
  const bucketPath = `commonDataFilledByAssignUser.${bucketIndex}.preAggregationTimeStampOfRequestSheet`;

  const $set = {
    [`${occurrencePath}.targetDateOfCM`]: newTargetDate,
    [`${occurrencePath}.requestSheet_quarter`]:
      getFinancialQuarter(newTargetDate),
  };

  if (occurrence?.activityEndDateOfCM) {
    const shiftedActivityEndDate = shiftPreservingDuration({
      oldAnchor: occurrence?.targetDateOfCM,
      newAnchor: newTargetDate,
      dependentDate: occurrence?.activityEndDateOfCM,
    });

    if (shiftedActivityEndDate)
      $set[`${occurrencePath}.activityEndDateOfCM`] = shiftedActivityEndDate;
  }

  let bucketRelabelled = false;

  if (occurrenceCountInBucket === 1) {
    const newYear = gettingFYYear(newTargetDate);
    const newMonth = gettingMonthForSelectedDate(newTargetDate);

    if (
      bucket?.preAggregationTimeStampOfRequestSheet?.requestSheet_year !==
        newYear ||
      bucket?.preAggregationTimeStampOfRequestSheet?.requestSheet_month !==
        newMonth
    ) {
      $set[`${bucketPath}.requestSheet_year`] = newYear;
      $set[`${bucketPath}.requestSheet_month`] = newMonth;
      bucketRelabelled = true;
    }
  }

  return { $set, bucketRelabelled };
};

/**
 * Pure planner. Given a loaded sheet, work out every field that must change.
 * Does not touch the database, so it can be exercised in isolation.
 *
 * @returns {{isError: boolean, statusCode: number, message: string, $set?: object, summary?: object}}
 */
const planTargetDateChange = ({
  requestSheet,
  occurrenceId,
  newTargetDate: rawNewTargetDate,
}) => {
  const newTargetDate = formatCMDate(rawNewTargetDate);

  if (!newTargetDate)
    return {
      isError: true,
      statusCode: 400,
      message: "Please provide a valid target date",
    };

  const occurrences = flattenOccurrences(requestSheet);

  if (occurrences.length === 0)
    return {
      isError: true,
      statusCode: 400,
      message: "This request-sheet has no planned occurrence to update",
    };

  const scheduleOrder = [...occurrences].sort(bySchedule);
  const editedPosition = scheduleOrder.findIndex(
    ({ occurrence }) => occurrence?._id?.toString() === occurrenceId?.toString(),
  );

  if (editedPosition === -1)
    return {
      isError: true,
      statusCode: 404,
      message: "The selected planned occurrence was not found",
    };

  const edited = scheduleOrder[editedPosition];

  // Same guard the CM report grid already applies on the client, enforced here
  // so the rule holds for any caller.
  if (!isPending(edited.occurrence))
    return {
      isError: true,
      statusCode: 400,
      message: `Target date can be changed only while the occurrence is ${CM_RESCHEDULABLE_STATUSES.join(
        " or ",
      )}. This one is "${edited.occurrence?.requestSheetStatusOfCM}".`,
    };

  if (formatCMDate(edited.occurrence?.targetDateOfCM) === newTargetDate)
    return {
      isError: true,
      statusCode: 400,
      message: "The target date is unchanged",
    };

  const frequencyValue =
    requestSheet?.cmBasicDataFilledByMTD_TL?.frequencyValue;
  const frequencyType = requestSheet?.cmBasicDataFilledByMTD_TL?.frequencyType;
  const recurring = isRecurring({ frequencyType, frequencyValue });

  const editedUpdate = buildOccurrenceUpdate({
    ...edited,
    newTargetDate,
  });

  let $set = { ...editedUpdate.$set };

  const rescheduled = [];
  const preserved = [];

  if (recurring) {
    // Position is counted against the full schedule, not just the pending ones,
    // so a completed occurrence in the middle still consumes its slot and the
    // spacing described by the frequency is preserved.
    for (
      let position = editedPosition + 1;
      position < scheduleOrder.length;
      position += 1
    ) {
      const candidate = scheduleOrder[position];
      const step = position - editedPosition;

      if (!isPending(candidate.occurrence)) {
        preserved.push({
          _id: candidate.occurrence?._id,
          targetDateOfCM: candidate.occurrence?.targetDateOfCM,
          requestSheetStatusOfCM: candidate.occurrence?.requestSheetStatusOfCM,
          reason: "Not in a reschedulable status",
        });
        continue;
      }

      const derivedDate = addFrequencyInterval(
        newTargetDate,
        frequencyValue,
        step,
      );

      if (!derivedDate) {
        preserved.push({
          _id: candidate.occurrence?._id,
          targetDateOfCM: candidate.occurrence?.targetDateOfCM,
          requestSheetStatusOfCM: candidate.occurrence?.requestSheetStatusOfCM,
          reason: "Frequency could not be applied",
        });
        continue;
      }

      const candidateUpdate = buildOccurrenceUpdate({
        ...candidate,
        newTargetDate: derivedDate,
      });

      $set = { ...$set, ...candidateUpdate.$set };

      rescheduled.push({
        _id: candidate.occurrence?._id,
        previousTargetDateOfCM: candidate.occurrence?.targetDateOfCM,
        targetDateOfCM: derivedDate,
        requestSheetStatusOfCM: candidate.occurrence?.requestSheetStatusOfCM,
        bucketRelabelled: candidateUpdate.bucketRelabelled,
      });
    }
  }

  return {
    isError: false,
    statusCode: 201,
    message: recurring
      ? `Target date updated and ${rescheduled.length} later occurrence(s) recalculated`
      : "Target date updated",
    $set,
    summary: {
      frequencyType: frequencyType || null,
      frequencyValue: frequencyValue || null,
      isRecurring: recurring,
      edited: {
        _id: edited.occurrence?._id,
        previousTargetDateOfCM: edited.occurrence?.targetDateOfCM,
        targetDateOfCM: newTargetDate,
        bucketRelabelled: editedUpdate.bucketRelabelled,
      },
      rescheduled,
      preserved,
    },
  };
};

/**
 * Load -> plan -> apply. One atomic updateOne per request.
 *
 * Explicit numeric paths are used instead of arrayFilters on purpose: the CM
 * module's existing quarter-based arrayFilters can match several occurrences at
 * once (a monthly sheet puts three occurrences into the same quarter, and the
 * cron pushes each into its own bucket carrying the same financial year), which
 * would silently rewrite siblings. Indices computed from the document we just
 * read address exactly one occurrence each, and stay valid because both arrays
 * are append-only.
 */
const updateCMTargetDate = async ({
  requestSheetId,
  occurrenceId,
  newTargetDate,
  actingUser,
}) => {
  if (!canRescheduleCM(actingUser))
    return {
      isError: true,
      statusCode: 403,
      message: "Only an MTD TL/HOSS user can change the target date",
    };

  if (!mongoose.Types.ObjectId.isValid(requestSheetId))
    return {
      isError: true,
      statusCode: 400,
      message: "Please provide a valid request-sheet",
    };

  if (!mongoose.Types.ObjectId.isValid(occurrenceId))
    return {
      isError: true,
      statusCode: 400,
      message: "Please provide the planned occurrence to update",
    };

  const requestSheet = await RequestSheetOfCM.findById(requestSheetId, {
    "cmBasicDataFilledByMTD_TL.frequencyType": 1,
    "cmBasicDataFilledByMTD_TL.frequencyValue": 1,
    commonDataFilledByAssignUser: 1,
  }).lean();

  if (!requestSheet)
    return {
      isError: true,
      statusCode: 404,
      message: "Request-sheet not found",
    };

  const plan = planTargetDateChange({
    requestSheet,
    occurrenceId,
    newTargetDate,
  });

  if (plan.isError) return plan;

  await RequestSheetOfCM.updateOne(
    { _id: mongoose.Types.ObjectId(requestSheetId) },
    { $set: plan.$set },
  );

  return {
    isError: false,
    statusCode: plan.statusCode,
    message: plan.message,
    data: { schedule: plan.summary },
  };
};

module.exports = {
  flattenOccurrences,
  buildOccurrenceArrayFilters,
  hasAddressableOccurrence,
  canRescheduleCM,
  planTargetDateChange,
  updateCMTargetDate,
};
