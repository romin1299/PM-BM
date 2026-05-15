const spareApprovalStatus = [
  "NG Budget - Under MTD HOD Approval",
  "Generated",
  "Under MTD TL approval",
  "Under MTD HOSS approval",
  "Under PRD TL approval",
  "Under MTD HOS approval",
  "Under PRD HOS approval",
  "Under MTD HOD approval",
  "Under PRD HOD approval",
  "Under TOOL ROOM approval",
  "Completed",
];

const spareApprovalUserType = [
  "NG Budget - Under MTD HOD",
  "MTD TL",
  "MTD HOSS",
  "PRD TL",
  "MTD HOS",
  "PRD HOS",
  "MTD HOD",
  "PRD HOD",
  "TOOL ROOM",
];

const dynamicApprovalStatus = {
  MTD_TL: spareApprovalStatus[2],
  MTD_HOSS: spareApprovalStatus[3],
  PRD_TL: spareApprovalStatus[4],
  MTD_HOS: spareApprovalStatus[5],
  PRD_HOS: spareApprovalStatus[6],
  MTD_HOD: spareApprovalStatus[7],
  PRD_HOD: spareApprovalStatus[8],
  TOOL_ROOM: spareApprovalStatus[9],
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

const hooksFormReferenceOfApproval = {
  MTD_TL: { displayName: "MTD TL", approvalKey: "approvalOfMTD_TL" },
  MTD_HOSS: { displayName: "MTD HOSS", approvalKey: "approvalOfMTD_HOSS" },
  PRD_TL: { displayName: "PRD TL", approvalKey: "approvalOfPRD_TL" },
  MTD_HOS: { displayName: "MTD HOS", approvalKey: "approvalOfMTD_HOS" },
  PRD_HOS: { displayName: "PRD HOS", approvalKey: "approvalOfPRD_HOS" },
  MTD_HOD: { displayName: "MTD HOD", approvalKey: "approvalOfMTD_HOD" },
  PRD_HOD: { displayName: "PRD HOD", approvalKey: "approvalOfPRD_HOD" },
  TOOL_ROOM: {
    displayName: "Tool Room Office Person",
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

const buildSearchQuery = (searchText) => {
  const search = searchText.trim();
  const formattedSearch =
    search.includes("-") || search.includes("/") ? `"${search}"` : search;
  return formattedSearch;
};

module.exports = {
  spareApprovalStatus,
  spareApprovalUserType,
  dynamicApprovalStatus,
  mongoDBUserFilters,
  hooksFormReferenceOfApproval,
  allMonths,
  allMonthsStr,
  paginationRowLimit,
  timezone,
  buildSearchQuery,
};
