const SubSection = require("../../model/subSectionSchema");
const Cell = require("../../model/cellSchema");

/**
 * Builds the section / sub-section part of a maintenance-sheet filter.
 *
 * A sheet records where it was raised by filling in the ref for whichever
 * level its section's `dashboardLevel` named at the time: `sectionRef` when
 * the section was drawn at section level, `subSectionRef` when it was drawn at
 * sub-section level. No-Loss BD sheets show this plainly — almost every one
 * has exactly one of the two set and the other null, and which one depends on
 * when it was raised.
 *
 * Matching a single ref therefore finds only the sheets raised while that
 * level happened to be the current one, which is why a dashboard shows this
 * year and comes up short for the years before a section was last moved
 * between levels.
 *
 * So the scope is matched as a union of every ref that unambiguously sits
 * inside the chosen node: its own ref, the refs of the levels below it, and
 * the cells underneath. Each branch is strictly inside the node, so nothing
 * from a sibling is pulled in, and the union can only add sheets a single-ref
 * match would have missed — never drop one it already found.
 */

const idsOf = (docs) => docs.map((doc) => doc._id);

/** `$or` over the branches that actually resolved, so an empty level cannot match everything. */
const unionOf = (branches) => {
  const usable = branches.filter(Boolean);
  return usable.length ? { $or: usable } : {};
};

const cellIdsUnder = async (subSectionIds) =>
  idsOf(
    await Cell.find(
      { subSection_names: { $in: subSectionIds } },
      { _id: 1 },
    ).lean(),
  );

/** Everything inside one section: the section itself, its sub-sections, their cells. */
const sectionScopeFilter = async (sectionId) => {
  const subSectionIds = idsOf(
    await SubSection.find({ section_names: sectionId }, { _id: 1 }).lean(),
  );
  const cellIds = await cellIdsUnder(subSectionIds);

  return unionOf([
    { sectionRef: sectionId },
    subSectionIds.length ? { subSectionRef: { $in: subSectionIds } } : null,
    cellIds.length ? { cellRef: { $in: cellIds } } : null,
  ]);
};

/**
 * Everything inside one sub-section: the sub-section itself and its cells.
 *
 * A sheet that only recorded `sectionRef` is deliberately left out — the
 * parent section covers several sub-sections, so there is nothing on the sheet
 * that places it in this one, and claiming it here would show it under each of
 * its siblings too.
 */
const subSectionScopeFilter = async (subSectionId) => {
  const cellIds = await cellIdsUnder([subSectionId]);

  return unionOf([
    { subSectionRef: subSectionId },
    cellIds.length ? { cellRef: { $in: cellIds } } : null,
  ]);
};

module.exports = { sectionScopeFilter, subSectionScopeFilter };
