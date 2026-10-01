/**
 * The extra approvals a PED-reflection CM carries.
 *
 * A CM raised from an approved New-Machine modification request belongs to the
 * department that asked for the modification, so MTD finishing the work is not
 * the end of it: the requesting department checks the work (PED TL/HOSS) and
 * approves it (PED HOS) before the sheet can be closed. An ordinary CM has no
 * such tail and completes as it always did.
 *
 * Named once here because three places need the same order: the middleware
 * that builds the nested update paths, the handler that files an approver's
 * decision, and the one that hands the sheet to the next approver.
 */
const PED_REFLECTION_APPROVALS = [
  {
    /** The approval array on the occurrence, minus its "approvalOf" prefix. */
    key: "PED_TL",
    /** The sheet's status while it waits here. */
    status: "Under PED TL Approval",
    /** How the sheet words it. */
    caption: "Checked by PED TL/HOSS",
  },
  {
    key: "PED_HOS",
    status: "Under PED HOS Approval",
    caption: "Approved by PED HOS",
  },
];

/**
 * Whether this CM was raised from an approved New-Machine request, and so owes
 * the requesting department its two closing approvals.
 */
const isPEDReflectionSheet = (sheet) =>
  Boolean(sheet?.requestSheetOfNewMachineCMRef);

module.exports = { PED_REFLECTION_APPROVALS, isPEDReflectionSheet };
