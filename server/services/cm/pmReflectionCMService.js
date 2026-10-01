/**
 * PM reflection: the CM sheet a PM check point turns into when the operator
 * working the implementation sheet marks it NG.
 *
 * An NG means the check point could not be put right during the PM itself, so
 * the work has to be carried as its own job — which is what a CM sheet is. The
 * operator is asked for nothing extra: the check sheet already knows the
 * machine and its hierarchy, and the popup already asks for the target date by
 * which the abnormality is to be closed.
 *
 * Only what is particular to this reflection lives here; the rest is in
 * reflectedCMService.
 */
const { raiseReflectedCM } = require("./reflectedCMService");

/** What the reflected CM is always categorised as. */
const PM_REFLECTION_CATEGORY = "PM Reflection";

/**
 * Improvement work off the back of a PM finding, not a breakdown — so it
 * carries the priority code the plant uses for improvement.
 */
const PM_REFLECTION_PRIORITY_CODE = "KAIZEN";

/**
 * The check sheet classifies every point it holds: B, Q, S or P. Q is the
 * quality one, which is the same question the CM sheet asks as "QUALITY
 * RELATED" — so the answer is carried over rather than left for the assigned
 * user to guess at, which is what stopped them sending the sheet for approval.
 */
const PM_QUALITY_CATEGORY = "Q";

const qualityRelatedFromCheckPoint = (checkSheetRow) =>
  String(checkSheetRow?.category ?? "")
    .trim()
    .toUpperCase() === PM_QUALITY_CATEGORY
    ? "Yes"
    : "No";

/**
 * Where the CM says it came from, in the words of the check sheet: which point
 * failed, on which row, in which month.
 */
const backgroundFromCheckPoint = ({ checkSheetRow, month, year }) => {
  const point = [
    checkSheetRow?.inspection_parent_name,
    checkSheetRow?.inspection_point,
  ]
    .filter(Boolean)
    .join(" - ");

  return [
    "Raised from a PM check point found NG",
    point && `Check point: ${point}`,
    checkSheetRow?.judgement_criteria &&
      `Judgement criteria: ${checkSheetRow.judgement_criteria}`,
    checkSheetRow?.tableRowId != null && `Sr. No. ${checkSheetRow.tableRowId}`,
    month && year && `PM of ${month} ${year}`,
  ]
    .filter(Boolean)
    .join(". ");
};

/**
 * Raises the CM sheet for a check point marked NG.
 *
 * TARGET DATE is the one the operator entered on the popup — the date the
 * abnormality is to be closed by.
 *
 * @param {object} machine        the machine the check sheet belongs to, as
 *   held by the caller; only its code is needed to find it again.
 * @param {object} checkSheetRow  the check point that failed.
 * @param {string} abnormalityRemarks what the operator found.
 * @param {string} targetDate     when it is to be closed by.
 *
 * Returns the CM sheet, or null when there is nothing to raise one from.
 */
const generatePMReflectionCM = async ({
  machineCode,
  machineRef,
  tableRowId,
  checkSheetRow,
  abnormalityRemarks,
  targetDate,
  checkSheetYear,
  checkSheetMonth,
  rootUser,
}) => {
  if (!machineCode && !machineRef) return null;
  if (!checkSheetYear || !checkSheetMonth || tableRowId == null) return null;

  /**
   * The check point, named by the four things that identify one occurrence of
   * it. The row number comes from the submission rather than from the stored
   * check sheet, so a reflection still happens if the row cannot be read back.
   */
  const pmAbnormalityRef = {
    machineRef,
    checkSheetYear,
    checkSheetMonth,
    tableRowId: Number(tableRowId),
  };

  return raiseReflectedCM({
    // The PM module holds the machine by its code, not its id.
    machineQuery: machineRef ? { _id: machineRef } : { machine_code: machineCode },
    alreadyRaised: {
      "pmAbnormalityRef.machineRef": machineRef,
      "pmAbnormalityRef.checkSheetYear": checkSheetYear,
      "pmAbnormalityRef.checkSheetMonth": checkSheetMonth,
      "pmAbnormalityRef.tableRowId": pmAbnormalityRef.tableRowId,
    },
    backReference: { pmAbnormalityRef },
    category: PM_REFLECTION_CATEGORY,
    priorityCode: PM_REFLECTION_PRIORITY_CODE,
    qualityRelated: qualityRelatedFromCheckPoint(checkSheetRow),
    targetDate,
    // What the operator found is the work the CM has to carry out; the check
    // point it was found on is the background.
    activityOfCM: abnormalityRemarks,
    problemBackgroundOfCM: backgroundFromCheckPoint({
      checkSheetRow: { ...checkSheetRow, tableRowId },
      month: checkSheetMonth,
      year: checkSheetYear,
    }),
    rootUser,
  });
};

module.exports = {
  generatePMReflectionCM,
  PM_REFLECTION_CATEGORY,
  PM_REFLECTION_PRIORITY_CODE,
};
