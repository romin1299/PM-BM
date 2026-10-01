/**
 * The categories a CM sheet can be filed under, and the counter each is
 * returned to the report dashboards as.
 *
 * Kept as one list so a category offered on the sheet is also counted and
 * filterable: LTPM and FIOT could be chosen on a sheet but were counted
 * nowhere, so neither appeared on any dashboard.
 *
 * The counter names are irregular because they were added one at a time. They
 * are what the dashboards already read, so they are kept as they are.
 * Twin of CATEGORIES_OF_CM / cmCategoryCards on the client.
 */
const CM_CATEGORIES = [
  { category: "Overhauling", counterKey: "overhaulingCMCategory" },
  { category: "Upgradation", counterKey: "upgradationCMCategory" },
  { category: "BM Reflection", counterKey: "BM_ReflectionCMCategory" },
  { category: "PED Reflection", counterKey: "PED_ReflectionCMCategory" },
  { category: "PM Reflection", counterKey: "PM_ReflectionCMCategory" },
  { category: "LTPM", counterKey: "LTPM_CMCategory" },
  { category: "FIOT", counterKey: "FIOT_CMCategory" },
  { category: "Others", counterKey: "othersCMCategory" },
];

/** The category counters of a report $group stage, one accumulator each. */
const cmCategoryCounters = (
  categoryField = "$cmBasicDataFilledByMTD_TL.categories",
) =>
  Object.fromEntries(
    CM_CATEGORIES.map(({ category, counterKey }) => [
      counterKey,
      { $sum: { $cond: [{ $eq: [categoryField, category] }, 1, 0] } },
    ]),
  );

module.exports = { CM_CATEGORIES, cmCategoryCounters };
