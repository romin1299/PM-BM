export const SPARE_SHEET_REJECTED_STATUS = "Rejected";

/**
 * Statuses in which the sheet still belongs to the person who raised it: only
 * while freshly generated. Once sent it sits with an approver, and a rejection
 * is final — the sheet is closed, not handed back for another attempt.
 *
 * Mirrors spareRequesterEditableStatuses in
 * server/utils/spareManagementUtils.js.
 */
export const SPARE_SHEET_REQUESTER_EDITABLE_STATUSES = ["Generated"];

/**
 * Every approval slot a request-sheet can carry, in chain order.
 *
 * Mirrors hooksFormReferenceOfApproval plus the NG-budget slot in
 * server/utils/spareManagementUtils.js.
 */
/** Stage shown for a slot whose stored userType is missing. */
export const SPARE_APPROVAL_STAGE_LABELS = {
  mtdHODApprovalIfBudgetIsNG: "NG Budget - MTD HOD",
  approvalOfMTD_TL: "MTD TL",
  approvalOfMTD_HOSS: "MTD HOSS",
  approvalOfPRD_TL: "PRD TL",
  approvalOfPRD_HOSS: "PRD HOSS",
  approvalOfMTD_HOS: "MTD HOS",
  approvalOfPRD_HOS: "PRD HOS",
  approvalOfMTD_HOD: "MTD HOD",
  approvalOfPRD_HOD: "PRD HOD",
  approvalOfTOOL_ROOM: "Tool Room",
};

export const SPARE_APPROVAL_FIELD_KEYS = [
  "mtdHODApprovalIfBudgetIsNG",
  "approvalOfMTD_TL",
  "approvalOfMTD_HOSS",
  "approvalOfPRD_TL",
  "approvalOfPRD_HOSS",
  "approvalOfMTD_HOS",
  "approvalOfPRD_HOS",
  "approvalOfMTD_HOD",
  "approvalOfPRD_HOD",
  "approvalOfTOOL_ROOM",
];

/**
 * Per-slot approval history, append-only: one entry per time the sheet was put
 * in front of that approver. The slots themselves hold the latest decision.
 */
export const SPARE_APPROVAL_LOG_FIELD_KEYS = SPARE_APPROVAL_FIELD_KEYS.map(
  (key) => `${key}ApprovalLogs`,
);

export const partFor = [
  {
    label: "Stock-in Parts",
    value: "Stock-in Parts",
  },
  {
    label: "Recycle Parts",
    value: "Recycle Parts",
  },
  {
    label: "Repaired Parts",
    value: "Repaired Parts",
  },
];

export const newPartRequestForRadioOptions = [
  {
    label: "For use",
    value: "For use",
  },
  {
    label: "For stock in",
    value: "For stock in",
  },
];

export const partQtyOptions = [
  {
    label: "Single Part",
    value: "Single Part",
  },
  {
    label: "Multiple Part",
    value: "Multiple Part",
  },
];

export const partTypes = [
  {
    label: "Standard Parts",
    value: "Standard Parts",
  },
  {
    label: "Manufacturing Parts",
    value: "Manufacturing Parts",
  },
];

export const supplierCategoryTypes = [
  {
    label: "Local",
    value: "Local",
  },
  {
    label: "Imported",
    value: "Imported",
  },
];

export const partRequirementTypes = [
  {
    label: "Normal Part",
    value: "Normal",
  },
  {
    label: "Urgent Part",
    value: "Urgent",
  },
];

export const partRequestDepartmentList = [
  {
    label: "MTD",
    value: "MTD",
  },
  {
    label: "PRD",
    value: "PRD",
  },
];
