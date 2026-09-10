export const SPARE_SHEET_REJECTED_STATUS = "Rejected";

/**
 * Statuses in which the sheet still belongs to the person who raised it — a
 * freshly generated sheet, or one an approver has handed back. Every other
 * status means it is sitting with an approver or has finished its chain, and is
 * no longer theirs to change.
 *
 * Mirrors spareRequesterEditableStatuses in
 * server/utils/spareManagementUtils.js.
 */
export const SPARE_SHEET_REQUESTER_EDITABLE_STATUSES = [
  "Generated",
  SPARE_SHEET_REJECTED_STATUS,
];

/**
 * Every approval slot a request-sheet can carry, in chain order.
 *
 * Mirrors hooksFormReferenceOfApproval plus the NG-budget slot in
 * server/utils/spareManagementUtils.js.
 */
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
 * Per-slot approval history. A rejection clears the approval slots themselves so
 * the requester re-picks the whole chain, but the logs are append-only, so the
 * last entry of each is where the rejecting approver and their remarks survive.
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
