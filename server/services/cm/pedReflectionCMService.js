/**
 * PED reflection: the CM sheet a New-Machine (modification) request turns into
 * once MTD HOD has approved it.
 *
 * Only what is particular to this reflection lives here — which sheet it came
 * from, how its fields map onto a CM. Everything a reflection has in common
 * with the others is in reflectedCMService.
 */
const {
  raiseReflectedCM,
  REFLECTION_FREQUENCY_TYPE,
  REFLECTION_STATUS,
} = require("./reflectedCMService");

/** What the reflected CM is always categorised as. */
const PED_REFLECTION_CATEGORY = "PED Reflection";

/**
 * A modification request is improvement work, like the PM reflection, so it
 * carries the same priority code.
 *
 * It is set here because the CM sheet requires one before the assigned user
 * can send it for approval, and the modification sheet has no priority field
 * of its own to carry over — left empty, the sheet could not be submitted.
 */
const PED_REFLECTION_PRIORITY_CODE = "KAIZEN";

/**
 * Raises the CM sheet for an approved modification request.
 *
 * TARGET DATE is the form's REQUIRED ON — the date the requester asked the
 * work to be done by — falling back to REQUEST ON.
 *
 * Returns the CM sheet, or null when there is nothing to raise one from.
 */
const generatePEDReflectionCM = async ({ sheet, rootUser }) => {
  if (!sheet?._id || !sheet?.machineRef) return null;

  const ped = sheet?.newMachineRequestFilledByPED ?? {};

  return raiseReflectedCM({
    machineQuery: { _id: sheet.machineRef },
    alreadyRaised: { requestSheetOfNewMachineCMRef: sheet._id },
    backReference: { requestSheetOfNewMachineCMRef: sheet._id },
    category: PED_REFLECTION_CATEGORY,
    priorityCode: PED_REFLECTION_PRIORITY_CODE,
    targetDate: ped?.requiredOn || ped?.requestOn,
    shiftOfCM: ped?.shiftOfNewCM,
    // The form's own Yes/No declaration; "No" when it was never answered, so
    // the CM sheet is not blocked on a question its source already settled.
    qualityRelated: ped?.qualityRelated === "Yes" ? "Yes" : "No",
    // The request as the modification sheet words it.
    activityOfCM: ped?.modificationWorkRequest || ped?.scopeOfCM,
    problemBackgroundOfCM: ped?.background,
    hierarchyRef: sheet?.plantToMachineHierarchyRef,
    rootUser,
  });
};

module.exports = {
  generatePEDReflectionCM,
  PED_REFLECTION_CATEGORY,
  PED_REFLECTION_PRIORITY_CODE,
  PED_REFLECTION_FREQUENCY_TYPE: REFLECTION_FREQUENCY_TYPE,
  PED_REFLECTION_STATUS: REFLECTION_STATUS,
};
