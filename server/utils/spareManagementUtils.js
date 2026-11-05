const spareApprovalStatus = [
  "NG Budget - Under MTD HOD Approval",
  "Generated",
  "Under MTD TL approval",
  "Under MTD HOSS approval",
  "Under PRD TL approval",
  "Under PRD HOSS approval",
  "Under MTD HOS approval",
  "Under PRD HOS approval",
  "Under MTD HOD approval",
  "Under PRD HOD approval",
  "Under TOOL ROOM approval",
  "Completed",
];

/**
 * Status a sheet lands in when any approver in the chain rejects it. Final: a
 * rejected sheet is not edited or sent for approval again; a fresh sheet is
 * raised instead.
 *
 * Deliberately NOT appended to spareApprovalStatus: three call sites read that
 * array's last element positionally to mean "Completed"
 * (spareCRUDController and spareIssuanceSummaryController), so growing it would
 * silently rename every completion.
 */
const spareRejectedStatus = "Rejected";

/**
 * Statuses in which a request-sheet still belongs to the person who raised it:
 * only while newly generated. Once sent it is the approvers', and a rejection
 * closes it for good.
 */
const spareRequesterEditableStatuses = [spareApprovalStatus[1]];

const spareApprovalUserType = [
  "NG Budget - Under MTD HOD",
  "MTD TL",
  "MTD HOSS",
  "PRD TL",
  "MTD HOS",
  "PRD HOSS",
  "PRD HOS",
  "MTD HOD",
  "PRD HOD",
  "TOOL ROOM",
];

const dynamicApprovalStatus = {
  MTD_TL: spareApprovalStatus[2],
  MTD_HOSS: spareApprovalStatus[3],
  PRD_TL: spareApprovalStatus[4],
  PRD_HOSS: spareApprovalStatus[5],
  MTD_HOS: spareApprovalStatus[6],
  PRD_HOS: spareApprovalStatus[7],
  MTD_HOD: spareApprovalStatus[8],
  PRD_HOD: spareApprovalStatus[9],
  TOOL_ROOM: spareApprovalStatus[10],
};

const mongoDBUserFilters = {
  MTD_TL: {
    tm_department: "MTD",
    user_type: "TL/HOSS",
  },
  MTD_HOSS: {
    tm_department: "MTD",
    user_type: "TL/HOSS",
  },
  PRD_TL: {
    tm_department: "PRD",
    user_type: "TL/HOSS",
  },
  PRD_HOSS: {
    tm_department: "PRD",
    user_type: "TL/HOSS",
  },
  MTD_HOS: {
    tm_department: "MTD",
    tm_grade: "HOS",
  },
  PRD_HOS: {
    tm_department: "PRD",
    tm_grade: "HOS",
  },
  MTD_HOD: {
    tm_department: "MTD",
    tm_grade: "HOD",
  },
  PRD_HOD: {
    tm_department: "PRD",
    tm_grade: "HOD",
  },
  /**
   * The tool room's own approval step: everyone registered for the tool room,
   * whatever their level.
   *
   * Tool-room staff are made at every level of the tool-room hierarchy - HOD,
   * HOS, HOSS, Supervisor and Office Person - and a PM user who also works
   * there keeps their PM user_type. The one thing they share is the tool-room
   * flag, so that is what is matched (and Office Person, which only the tool
   * room uses, in case the flag was never set on an older account). Matching on
   * Office Person alone left a plant whose tool room had no Office Person with
   * an empty dropdown.
   *
   * Scoped to the plant, not the requester's section, by
   * PLANT_WIDE_APPROVAL_KEYS in controller/spareManagement/userController.js.
   */
  TOOL_ROOM: {
    $or: [
      { user_type: "Office Person" },
      { toolRoomPerson: "Yes" },
      { alsoToolRoomPerson: "Yes" },
    ],
  },
};

const hooksFormReferenceOfEmailReminder = {
  MTD_TL: { displayName: "MTD TL", approvalKey: "emailReminderMTL" },
  MTD_HOSS: { displayName: "MTD HOSS", approvalKey: "emailReminderHOSS" },
  PRD_TL: { displayName: "PRD TL", approvalKey: "emailReminderMTL" },
  PRD_HOSS: { displayName: "PRD HOSS", approvalKey: "emailReminderHOSS" },
  MTD_HOS: { displayName: "MTD HOS", approvalKey: "emailReminderHOS" },
  PRD_HOS: { displayName: "PRD HOS", approvalKey: "emailReminderHOS" },
  MTD_HOD: { displayName: "MTD HOD", approvalKey: "emailReminderHOD" },
  PRD_HOD: { displayName: "PRD HOD", approvalKey: "emailReminderHOD" },
};

const hooksFormReferenceOfApproval = {
  MTD_TL: { displayName: "MTD TL", approvalKey: "approvalOfMTD_TL" },
  MTD_HOSS: { displayName: "MTD HOSS", approvalKey: "approvalOfMTD_HOSS" },
  PRD_TL: { displayName: "PRD TL", approvalKey: "approvalOfPRD_TL" },
  PRD_HOSS: { displayName: "PRD HOSS", approvalKey: "approvalOfPRD_HOSS" },
  MTD_HOS: { displayName: "MTD HOS", approvalKey: "approvalOfMTD_HOS" },
  PRD_HOS: { displayName: "PRD HOS", approvalKey: "approvalOfPRD_HOS" },
  MTD_HOD: { displayName: "MTD HOD", approvalKey: "approvalOfMTD_HOD" },
  PRD_HOD: { displayName: "PRD HOD", approvalKey: "approvalOfPRD_HOD" },
  TOOL_ROOM: {
    displayName: "Tool Room",
    approvalKey: "approvalOfTOOL_ROOM",
  },
};

const allMonths = [
  {
    monthName: "Apr",
    monthInDecimal: 4,
  },
  {
    monthName: "May",
    monthInDecimal: 5,
  },
  {
    monthName: "Jun",
    monthInDecimal: 6,
  },
  {
    monthName: "Jul",
    monthInDecimal: 7,
  },
  {
    monthName: "Aug",
    monthInDecimal: 8,
  },
  {
    monthName: "Sep",
    monthInDecimal: 9,
  },
  {
    monthName: "Oct",
    monthInDecimal: 10,
  },
  {
    monthName: "Nov",
    monthInDecimal: 11,
  },
  {
    monthName: "Dec",
    monthInDecimal: 12,
  },
  {
    monthName: "Jan",
    monthInDecimal: 1,
  },
  {
    monthName: "Feb",
    monthInDecimal: 2,
  },
  {
    monthName: "Mar",
    monthInDecimal: 3,
  },
];

const allMonthsStr = [
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
];

const paginationRowLimit = 50;

/**
 * The budget check (OK / NG against the section's monthly budget, and the MTD
 * HOD's approval of an NG) belongs to MTD parts only. A PRD part is not weighed
 * against the budget: its sheet is simply recorded as budget OK, with no
 * required amount, and goes straight to the approval chain. Recording OK is
 * what lets it through everything that admits a sheet on its budget - the
 * Ordering dashboard above all - with no special case.
 */

/** Whether a request-sheet for this department is subject to the budget check. */
const isBudgetChecked = (partRequestFor) => partRequestFor !== "PRD";

const timezone = "Asia/Kolkata";

const generateRegexSearchString = (search) => {
  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(escapeRegex(search.trim()), "i");
};

/**
 * Case-insensitive "contains" match across several fields.
 *
 * Regex rather than a $text search. $text only reads the fields named in the
 * text index — part name and model were never in it, so searching for them
 * matched nothing — and it matches whole words, which part numbers and models
 * do not survive: "SET-AO-PCI(51)-C11" is tokenised on its punctuation, so a
 * partial like "PCI(51" could never be found. generateRegexSearchString escapes
 * the input, so those symbols are matched literally instead.
 *
 * The trade-off is that an unanchored regex cannot use an index; acceptable
 * here because the surrounding query already narrows to one financial year.
 */
const buildRegexSearchFilter = (search, fields = []) => {
  const searchRegex = generateRegexSearchString(search);

  return { $or: fields.map((field) => ({ [field]: searchRegex })) };
};

const filterKeys = {
  "based-on-section": "section",
  "based-on-subSection": "subSection",
  "based-on-cell": "cell",
};

function sumArrayField(fieldName) {
  return {
    $map: {
      input: { $range: [0, 12] },
      as: "i",
      in: {
        $sum: {
          $map: {
            input: `$${fieldName}Arr`,
            as: "arr",
            in: { $arrayElemAt: ["$$arr", "$$i"] },
          },
        },
      },
    },
  };
}

const oneMil = 1000000;

const convertCostInMilUnitInJS = (cost = 0) =>
  Number((cost / oneMil).toFixed(2));

const convertCostInMilUnitInMongoose = (costKey = "") => ({
  $round: [{ $divide: [costKey, oneMil] }, 2],
});

/** A non-negative number, or null for blank / invalid input. */
const numberOrNull = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
};

/**
 * Lead time for "PO issue to vendor - Part receive", split by the part's
 * supplier category.
 *
 * The single POIssueToVendorToPartReceive value predates the split and stays
 * the fallback, so an upgrade never re-times orders already in flight and a
 * plant that has not configured the pair behaves exactly as before. A category
 * that is not "Imported" - "Local", blank on older records, anything else -
 * is timed as local, which is also the form's default choice.
 */
const partReceiveLeadTimeKeys = {
  local: "localPOIssueToVendorToPartReceive",
  imported: "importedPOIssueToVendorToPartReceive",
  legacy: "POIssueToVendorToPartReceive",
};

/** A lead time counts only when it is a positive number; 0 means "not set". */
const leadTimeInDays = (value) => {
  const days = Number(value);
  return Number.isFinite(days) && days > 0 ? days : 0;
};

const isImportedSupplierCategory = (supplierCategory) =>
  String(supplierCategory ?? "").trim().toLowerCase() === "imported";

/**
 * The part-receipt allowance for one part, in JavaScript. The Order Tracking
 * dashboard's red cell and the escalation mail must never disagree on this, so
 * both read the rule from here; the aggregation form below mirrors it.
 */
const partReceiveLeadTimeFor = (leadTime = {}, supplierCategory) => {
  const specificKey = isImportedSupplierCategory(supplierCategory)
    ? partReceiveLeadTimeKeys.imported
    : partReceiveLeadTimeKeys.local;

  return (
    leadTimeInDays(leadTime?.[specificKey]) ||
    leadTimeInDays(leadTime?.[partReceiveLeadTimeKeys.legacy])
  );
};

/**
 * The same rule as an aggregation expression, for the ordering projection.
 * Supplier categories are compared case- and space-insensitively, matching
 * isImportedSupplierCategory above; 0 is assembled here as a literal because
 * the plant's lead times do not vary per document.
 */
const partReceiveLeadTimeExpression = (
  leadTime = {},
  supplierCategoryField = "$changeParts.supplierCategory",
) => {
  const local =
    leadTimeInDays(leadTime?.[partReceiveLeadTimeKeys.local]) ||
    leadTimeInDays(leadTime?.[partReceiveLeadTimeKeys.legacy]);
  const imported =
    leadTimeInDays(leadTime?.[partReceiveLeadTimeKeys.imported]) ||
    leadTimeInDays(leadTime?.[partReceiveLeadTimeKeys.legacy]);

  return {
    $cond: [
      {
        $eq: [
          {
            $toLower: {
              $trim: { input: { $ifNull: [supplierCategoryField, ""] } },
            },
          },
          "imported",
        ],
      },
      imported,
      local,
    ],
  };
};

module.exports = {
  spareApprovalStatus,
  spareRejectedStatus,
  spareRequesterEditableStatuses,
  spareApprovalUserType,
  dynamicApprovalStatus,
  mongoDBUserFilters,
  hooksFormReferenceOfApproval,
  allMonths,
  allMonthsStr,
  paginationRowLimit,
  timezone,
  generateRegexSearchString,
  buildRegexSearchFilter,
  filterKeys,
  sumArrayField,
  convertCostInMilUnitInJS,
  convertCostInMilUnitInMongoose,
  numberOrNull,
  partReceiveLeadTimeKeys,
  isImportedSupplierCategory,
  partReceiveLeadTimeFor,
  partReceiveLeadTimeExpression,
  hooksFormReferenceOfEmailReminder,
  isBudgetChecked,
};
