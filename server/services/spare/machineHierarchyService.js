const Machine = require("../../model/machineSchema");
const Line = require("../../model/lineSchema");

/**
 * Required for their side effect: populating through a level needs that level's
 * model registered, and a caller that never touches Cells or SubSections itself
 * would otherwise fail with "Schema hasn't been registered".
 */
require("../../model/cellSchema");
require("../../model/subSectionSchema");
require("../../model/sectionSchema");
require("../../model/plantSchema");

/**
 * Resolves a machine and the Plant → Line hierarchy above it, which every Spare
 * sheet is stamped with.
 *
 * A machine carries its own denormalised plant/section/subSection/cell refs, but
 * only ones registered through `addNewMachine` after those fields were added
 * ever received them: in the current data every machine holds nothing but
 * `line_names`, so reading the hierarchy straight off the machine rejected every
 * request sheet with "Plant/Section/Sub-section/Cell/Line/Machine not exist".
 *
 * The line is the one link a machine is always given, so the hierarchy is read
 * through it — Line → Cell → SubSection → Section → Plant — the way
 * `globalReqSheetNo` already numbers BM and CM sheets. A machine's own refs are
 * still preferred where present, so nothing changes for machines that carry
 * them and both sources stay supported.
 */

const MACHINE_FIELDS = {
  machine_code: 1,
  machine_name: 1,
  machine_nickname: 1,
  plant_names: 1,
  section_names: 1,
  subSection_names: 1,
  cell_names: 1,
  line_names: 1,
};

const PLANT_SELECT = "plant_id plant_name";
const SECTION_SELECT = "section_id section_name dashboardLevel";
const SUB_SECTION_SELECT = "subSection_id subSection_name";
const CELL_SELECT = "cell_id cell_name";
const LINE_SELECT = "line_id line_name";

/**
 * The walk up from the line. Each level also carries the ref to its parent so
 * the next populate has something to follow, and the whole hierarchy arrives in
 * the single machine query rather than one round trip per level.
 */
const LINE_POPULATE = {
  path: "line_names",
  select: `${LINE_SELECT} cell_names`,
  populate: {
    path: "cell_names",
    select: `${CELL_SELECT} subSection_names`,
    populate: {
      path: "subSection_names",
      select: `${SUB_SECTION_SELECT} section_names`,
      populate: {
        path: "section_names",
        select: `${SECTION_SELECT} plant_names`,
        populate: { path: "plant_names", select: PLANT_SELECT },
      },
    },
  },
};

/** Trims a populated document to the fields a sheet stores, dropping the refs
 *  that were only needed to climb to the next level. */
const pick = (document, keys) => {
  if (!document?._id) return null;
  const picked = { _id: document._id };
  for (const key of keys) picked[key] = document[key];
  return picked;
};

/**
 * @returns {{ isError: true, message: string }} when a level cannot be resolved,
 *   naming the level so master data can be corrected, otherwise
 *   `{ machine, line, cell, subSection, section, plant }` shaped as
 *   `plantToMachineHierarchyObj` stores them.
 */
const resolveMachineHierarchy = async (machineId) => {
  if (!machineId)
    return { isError: true, message: "Please provide the Machine value" };

  const machine = await Machine.findOne({ _id: machineId }, MACHINE_FIELDS)
    .populate({ path: "plant_names", select: PLANT_SELECT })
    .populate({ path: "section_names", select: SECTION_SELECT })
    .populate({ path: "subSection_names", select: SUB_SECTION_SELECT })
    .populate({ path: "cell_names", select: CELL_SELECT })
    .populate(LINE_POPULATE)
    .lean();

  if (!machine) return { isError: true, message: "Machine does not exist" };

  const line = machine.line_names;
  if (!line?._id)
    return {
      isError: true,
      message: `Line is not mapped to machine ${machine.machine_name ?? ""}`.trim(),
    };

  const cell = machine.cell_names?._id ? machine.cell_names : line.cell_names;
  if (!cell?._id)
    return {
      isError: true,
      message: `Cell is not mapped to line ${line.line_name ?? ""}`.trim(),
    };

  const subSection = machine.subSection_names?._id
    ? machine.subSection_names
    : cell.subSection_names;
  if (!subSection?._id)
    return {
      isError: true,
      message: `Sub-section is not mapped to cell ${cell.cell_name ?? ""}`.trim(),
    };

  const section = machine.section_names?._id
    ? machine.section_names
    : subSection.section_names;
  if (!section?._id)
    return {
      isError: true,
      message:
        `Section is not mapped to sub-section ${subSection.subSection_name ?? ""}`.trim(),
    };

  const plant = machine.plant_names?._id
    ? machine.plant_names
    : section.plant_names;
  if (!plant?._id)
    return {
      isError: true,
      message: `Plant is not mapped to section ${section.section_name ?? ""}`.trim(),
    };

  return {
    machine: pick(machine, [
      "machine_code",
      "machine_name",
      "machine_nickname",
    ]),
    line: pick(line, ["line_id", "line_name"]),
    cell: pick(cell, ["cell_id", "cell_name"]),
    subSection: pick(subSection, ["subSection_id", "subSection_name"]),
    section: pick(section, [
      "section_id",
      "section_name",
      "dashboardLevel",
    ]),
    plant: pick(plant, ["plant_id", "plant_name"]),
  };
};

/**
 * Two letters identifying where the sheet came from: the section for a section
 * that is itself a dashboard level, otherwise the sub-section under it.
 */
const requestSheetNoPrefix = ({ section, subSection }) =>
  (section?.dashboardLevel === "Yes"
    ? (section?.section_name ?? "")
    : (subSection?.subSection_name ?? "")
  )
    .trim()
    .substring(0, 2)
    .toUpperCase();

/**
 * Takes the next Spare sheet number on a line. `$inc` is atomic, so two sheets
 * raised at the same moment cannot read the same count; a line that has never
 * numbered a Spare sheet starts at 1.
 */
const nextSpareRequestSheetCount = async (lineId) => {
  const line = await Line.findOneAndUpdate(
    { _id: lineId },
    { $inc: { requestSheetNoSpare: 1 } },
    { new: true, projection: { requestSheetNoSpare: 1 } },
  );

  return line?.requestSheetNoSpare;
};

module.exports = {
  resolveMachineHierarchy,
  requestSheetNoPrefix,
  nextSpareRequestSheetCount,
};
