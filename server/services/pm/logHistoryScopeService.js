const Section = require("../../model/sectionSchema");
const SubSection = require("../../model/subSectionSchema");
const Cell = require("../../model/cellSchema");

/**
 * Resolves what a PM log dashboard should show for the section the user picked.
 *
 * A log row records where it was raised by copying one id into
 * `sectionOrSubSectionInfo` — the section's or the sub-section's, whichever
 * level that section's `dashboardLevel` named at the moment the row was
 * written. Move a section to sub-section level later and every row written
 * before the move keeps the old id, so matching on the id the section carries
 * today hides all of it. That is why the current financial year shows and the
 * earlier ones come back empty: only the rows written since the move match.
 *
 * A cell is the same cell whichever level the dashboard is drawn at, so the
 * scope is resolved down to cell ids and the rows are matched on
 * `cellInfo.cell_Id` instead. That reads the whole history regardless of when
 * the levels were last rearranged, and it picks up rows the old filter missed
 * even within the current year.
 */

/** The sub-sections the chosen dashboard node covers. */
const subSectionIdsInScope = async ({ section, rootUser }) => {
  const idsOf = (docs) => docs.map((doc) => doc._id);

  // The Plant-Admin dropdown posts the section or sub-section document itself;
  // every other user posts their own assigned "<id>-<name>" string.
  if (typeof section === "object") {
    if (!section?._id) return [];

    if (section?.dashboardLevel === "Yes")
      return idsOf(
        await SubSection.find({ section_names: section._id }, { _id: 1 }).lean(),
      );

    return [section._id];
  }

  const sectionInfo = await Section.findOne(
    { section_id: section?.split("-")?.[0] },
    { _id: 1, dashboardLevel: 1 },
  ).lean();

  if (!sectionInfo) return [];

  if (sectionInfo.dashboardLevel === "Yes")
    return idsOf(
      await SubSection.find(
        { section_names: sectionInfo._id },
        { _id: 1 },
      ).lean(),
    );

  // Drawn at sub-section level, the user sees the sub-sections assigned to
  // them — the same rule the dashboard has always applied.
  return idsOf(
    await SubSection.find(
      {
        subSection_id: {
          $in: (rootUser?.subSection_data ?? []).map(
            (item) => item?.split("-")?.[0],
          ),
        },
      },
      { _id: 1 },
    ).lean(),
  );
};

/**
 * @param {object} options
 * @param {object|string} options.section  the dashboard node: a section or
 *   sub-section document from the Plant-Admin dropdown, or an "<id>-<name>"
 *   string for a user scoped to their own section
 * @param {object} options.rootUser  the authenticated user, for the
 *   sub-sections assigned to them
 * @returns {Promise<string[]>} the `cell_id`s to match log rows on; empty when
 *   the node resolves to no cells, which correctly shows nothing
 */
const logHistoryCellScope = async ({ section, rootUser }) => {
  const subSectionIds = await subSectionIdsInScope({ section, rootUser });

  if (!subSectionIds.length) return [];

  const cells = await Cell.find(
    { subSection_names: { $in: subSectionIds } },
    { cell_id: 1 },
  ).lean();

  return cells.map((cell) => cell.cell_id).filter(Boolean);
};

module.exports = { logHistoryCellScope };
