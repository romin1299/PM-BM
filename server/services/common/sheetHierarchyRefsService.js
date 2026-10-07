const mongoose = require("mongoose");

const Machine = require("../../model/machineSchema");
const Line = require("../../model/lineSchema");
const Cell = require("../../model/cellSchema");
const SubSection = require("../../model/subSectionSchema");
const Section = require("../../model/sectionSchema");

/**
 * Completes the hierarchy ref-set a maintenance sheet is stored with.
 *
 * An entry form only asks for as much of the hierarchy as the user's dashboard
 * level shows, so what it posts back is partial — a section and no
 * sub-section, or a sub-section and no section. Stored verbatim, that leaves
 * each sheet carrying one of the two, and a dashboard filtering on the other
 * cannot see it. Flip a section between levels and every sheet raised before
 * the flip disappears from the level now in use, which is why a report shows
 * the current year and comes up short for the ones before it.
 *
 * The cure is to fill in what the form was never asked. The chain is walked up
 * from the deepest node the form did send — machine, then line, then cell — and
 * each level the form left empty is read from the master data, which knows the
 * whole hierarchy whatever level the form was drawn at.
 *
 * Only empty levels are filled; a ref the form supplied is never replaced. A
 * machine that has since been moved to another line would otherwise drag every
 * sheet ever raised against it onto its new line each time one was edited,
 * rewriting where those breakdowns actually happened. So the sheet keeps the
 * place it recorded, and the walk only adds the levels that place implies.
 */

/** Accepts an id, an id string, or a populated document. */
const asRef = (value) => value?._id ?? value ?? null;

/** One step up: the parent that the master record of `id` points at. */
const parentOf = async (Model, id, parentField) => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;

  const record = await Model.findOne({ _id: id }, { [parentField]: 1 }).lean();
  return asRef(record?.[parentField]);
};

/**
 * Child → parent, in order, so a level derived in one step is the starting
 * point for the next: a machine alone is enough to reach the plant.
 */
const CLIMB = [
  ["lineRef", "machineRef", Machine, "line_names"],
  ["cellRef", "lineRef", Line, "cell_names"],
  ["subSectionRef", "cellRef", Cell, "subSection_names"],
  ["sectionRef", "subSectionRef", SubSection, "section_names"],
  ["plantRef", "sectionRef", Section, "plant_names"],
];

/**
 * @param {object} posted  whatever refs the form supplied, under their stored
 *   names (`machineRef`, `lineRef`, `cellRef`, `subSectionRef`, `sectionRef`,
 *   `plantRef`); ids, id strings and populated documents are all accepted
 * @returns {Promise<object>} the full ref-set, each level null where neither
 *   the form nor the masters could supply it
 */
const resolveSheetHierarchyRefs = async (posted = {}) => {
  const refs = {
    machineRef: asRef(posted.machineRef),
    lineRef: asRef(posted.lineRef),
    cellRef: asRef(posted.cellRef),
    subSectionRef: asRef(posted.subSectionRef),
    sectionRef: asRef(posted.sectionRef),
    plantRef: asRef(posted.plantRef),
  };

  for (const [level, childLevel, Model, parentField] of CLIMB) {
    if (refs[level]) continue;

    refs[level] =
      (await parentOf(Model, refs[childLevel], parentField)) ?? refs[level];
  }

  return refs;
};

/**
 * The same ref-set with the unresolved levels dropped — for an update, where a
 * `$set` of a null would blank a ref the stored sheet already has right.
 */
const definedRefsOnly = (refs = {}) =>
  Object.fromEntries(Object.entries(refs).filter(([, ref]) => ref));

module.exports = { resolveSheetHierarchyRefs, definedRefsOnly };
