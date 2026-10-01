/**
 * Reflections: a CM sheet raised automatically from another module's sheet.
 *
 * The plant already had one — a BM sheet raising CM sheets for follow-up work.
 * Two more work the same way and are built here:
 *
 *   PED reflection — a New-Machine modification request, once MTD HOD approves.
 *   PM  reflection — a PM check point found NG during implementation.
 *
 * What they share is everything except the words: nothing is asked of the user,
 * because the originating sheet already knows the machine, the work and the
 * date; the category is fixed rather than chosen; the work happens once; and
 * the sheet opens at "Generated" so it enters the ordinary CM flow at assigning
 * and is approved from there.
 *
 * Each caller supplies only what differs — see raiseReflectedCM below.
 */
const moment = require("moment-timezone");

const RequestSheetOfCM = require("../../model/requestSheetDataOfCM");
const PlantToMachineHierarchy = require("../../model/plantToMachineHierarchySchema");
const {
  newRequestSheetDataStore,
  findMachineWithParentHierarchy,
} = require("../../middleware/findMachineDataForNewRequestSheetOfCM");

/** Reflected work is done once; it is never a recurring schedule. */
const REFLECTION_FREQUENCY_TYPE = "One-time";

/** The status a reflected CM opens at: it still has to be assigned. */
const REFLECTION_STATUS = "Generated";

const generalDateFormat = (propDate = new Date()) =>
  moment(propDate).tz("Asia/Kolkata").format("YYYY-MM-DDTHH:mm");

/**
 * The hierarchy document for a machine, reused when the originating sheet
 * already holds one rather than looked up again.
 */
const resolvePlantToMachineHierarchyRef = async (existingRef, machine) => {
  if (existingRef) return existingRef;

  let hierarchy = await PlantToMachineHierarchy.findOne({
    "machine._id": machine?._id,
  });

  if (!hierarchy) {
    hierarchy = await new PlantToMachineHierarchy({
      machine,
      line: machine?.line_names,
      cell: machine?.line_names?.cell_names,
      subSection: machine?.line_names?.cell_names?.subSection_names,
      section: machine?.line_names?.cell_names?.subSection_names?.section_names,
      plant:
        machine?.line_names?.cell_names?.subSection_names?.section_names
          ?.plant_names,
    }).save();
  }

  return hierarchy?._id;
};

/**
 * Raises one reflected CM.
 *
 * @param {object}  source
 * @param {object}  source.machineQuery  how to find the machine — `{ _id }` or
 *   `{ machine_code }`, whichever the originating module holds.
 * @param {object}  source.alreadyRaised the query that finds a CM already
 *   raised from this source. Reflection happens once: a repeated submit finds
 *   that sheet instead of raising a second one against the same thing.
 * @param {object}  source.backReference  what to store on the new CM so the
 *   `alreadyRaised` query can find it next time.
 * @param {string}  source.category       the fixed category, e.g. "PM Reflection".
 * @param {string}  [source.priorityCode] e.g. "KAIZEN"; omitted where the
 *   originating module does not set one.
 * @param {string}  [source.targetDate]   when the work is wanted. Falls back to
 *   now, so a source saved without one still reflects rather than failing.
 * @param {string}  [source.shiftOfCM]
 * @param {string}  [source.qualityRelated]
 * @param {string}  [source.activityOfCM]
 * @param {string}  [source.problemBackgroundOfCM]
 * @param {object}  [source.hierarchyRef] the originating sheet's own
 *   plantToMachineHierarchyRef, when it has one.
 * @param {object}  source.rootUser       who is on the sheet as its creator.
 *
 * @returns the CM sheet, or null when there is nothing to raise one from.
 */
const raiseReflectedCM = async ({
  machineQuery,
  alreadyRaised,
  backReference,
  category,
  priorityCode,
  targetDate,
  shiftOfCM,
  qualityRelated,
  activityOfCM,
  problemBackgroundOfCM,
  hierarchyRef,
  rootUser,
}) => {
  if (!machineQuery || !alreadyRaised) return null;

  const existing = await RequestSheetOfCM.findOne(alreadyRaised);
  if (existing) return existing;

  const machine = await findMachineWithParentHierarchy(machineQuery);
  if (!machine) return null;

  return newRequestSheetDataStore(
    machine,
    null, // no BM sheet behind a PED or PM reflection
    shiftOfCM,
    {
      targetDateOfCM: generalDateFormat(targetDate || new Date()),
      sheetIssuedDateAndTimeOfCM: generalDateFormat(),
      ...(priorityCode ? { priorityCode } : {}),
      ...(qualityRelated ? { qualityRelated } : {}),
      cmBasicDataFilledByMTD_TL: {
        // Carried from the originating sheet, so the CM says what it was raised
        // for rather than arriving blank for someone to work out.
        activityOfCM,
        problemBackgroundOfCM,
        categories: category,
        frequencyType: REFLECTION_FREQUENCY_TYPE,
        frequencyValue: "",
        plannedDateAndTimeOfCM: generalDateFormat(),
      },
    },
    await resolvePlantToMachineHierarchyRef(hierarchyRef, machine),
    rootUser,
    [],
    {
      requestSheetStatusOfCM: REFLECTION_STATUS,
      extraFields: backReference,
    },
  );
};

module.exports = {
  raiseReflectedCM,
  generalDateFormat,
  REFLECTION_FREQUENCY_TYPE,
  REFLECTION_STATUS,
};
