const PlantToMachineHierarchy = require("../model/plantToMachineHierarchySchema");

/**
 * The Plant → Machine hierarchy snapshot a BM or CM sheet points at.
 *
 * Sheets keep a reference to one of these rather than joining five collections
 * on every report row. The snapshot copies the names, which is the whole point
 * — but it used to be written once per machine and never touched again, so
 * renaming a machine or a line left every sheet on that machine reporting the
 * old name while its own `machineRef` pointed at the renamed one. That is what
 * made the CM reports disagree with the actual machine.
 *
 * So the snapshot is refreshed from the live documents each time it is
 * resolved, and `syncMachineRename` / `syncLineRename` bring it up to date the
 * moment a name actually changes, rather than waiting for the next sheet.
 */

/** The snapshot fields for one level, or undefined when it is not loaded. */
const levelOf = (document, keys) => {
  if (!document?._id) return undefined;

  return keys.reduce((level, key) => {
    if (document[key] !== undefined) level[key] = document[key];
    return level;
  }, { _id: document._id });
};

/**
 * `$set` for the levels the caller actually loaded. A level that was not
 * populated is left out rather than written as undefined, so a partially
 * populated machine cannot blank out a snapshot that was already complete.
 */
const snapshotOf = (machine) => {
  const line = machine?.line_names;
  const cell = line?.cell_names;
  const subSection = cell?.subSection_names;
  const section = subSection?.section_names;
  const plant = section?.plant_names;

  const levels = {
    machine: levelOf(machine, [
      "machine_code",
      "machine_name",
      "machine_nickname",
    ]),
    line: levelOf(line, ["line_name"]),
    cell: levelOf(cell, ["cell_name"]),
    subSection: levelOf(subSection, ["subSection_name"]),
    section: levelOf(section, ["section_name", "dashboardLevel"]),
    plant: levelOf(plant, ["plant_name"]),
  };

  return Object.entries(levels).reduce((set, [key, value]) => {
    if (value) set[key] = value;
    return set;
  }, {});
};

/**
 * The snapshot for `machine`, created if it does not exist yet and otherwise
 * brought back in step with the machine passed in.
 *
 * `machine` is expected to carry its line → cell → sub-section → section →
 * plant chain populated, as `findMachineWithParentHierarchy` returns it.
 *
 * @returns the document, or null when there is no machine to key it on —
 *   never a match on a missing id, which `{ "machine._id": undefined }` would
 *   have quietly returned.
 */
const resolvePlantToMachineHierarchy = async (machine) => {
  if (!machine?._id) return null;

  return PlantToMachineHierarchy.findOneAndUpdate(
    { "machine._id": machine._id },
    { $set: snapshotOf(machine) },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
};

/** Just the reference, which is all a sheet stores. */
const resolvePlantToMachineHierarchyRef = async (machine) =>
  (await resolvePlantToMachineHierarchy(machine))?._id;

/**
 * Carries a machine's new names into every snapshot of it. Keyed on the code
 * because that is what identifies the machine being edited.
 */
const syncMachineRename = async (machine_code, fields = {}) => {
  if (!machine_code) return 0;

  const $set = {};
  for (const key of ["machine_name", "machine_nickname"])
    if (fields[key] !== undefined) $set[`machine.${key}`] = fields[key];

  if (!Object.keys($set).length) return 0;

  const { modifiedCount } = await PlantToMachineHierarchy.updateMany(
    { "machine.machine_code": machine_code },
    { $set },
  );

  return modifiedCount ?? 0;
};

/** The same for a line, which every machine under it also reports. */
const syncLineRename = async (lineId, line_name) => {
  if (!lineId || line_name === undefined) return 0;

  const { modifiedCount } = await PlantToMachineHierarchy.updateMany(
    { "line._id": lineId },
    { $set: { "line.line_name": line_name } },
  );

  return modifiedCount ?? 0;
};

module.exports = {
  snapshotOf,
  resolvePlantToMachineHierarchy,
  resolvePlantToMachineHierarchyRef,
  syncMachineRename,
  syncLineRename,
};
