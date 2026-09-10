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
 * Status a sheet lands in when any approver in the chain rejects it.
 *
 * Deliberately NOT appended to spareApprovalStatus: three call sites read that
 * array's last element positionally to mean "Completed"
 * (spareCRUDController and spareIssuanceSummaryController), so growing it would
 * silently rename every completion.
 */
const spareRejectedStatus = "Rejected";

/**
 * Statuses in which a request-sheet still belongs to the person who raised it —
 * newly generated, or handed back by a rejection. In both the requester may
 * edit it and send it for approval again.
 */
const spareRequesterEditableStatuses = [
  spareApprovalStatus[1],
  spareRejectedStatus,
];

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
  TOOL_ROOM: {
    user_type: "Office Person",
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
  hooksFormReferenceOfEmailReminder,
};
