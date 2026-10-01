export const FREQUENCY_OF_CM = [
  {
    frequencyType: "One-time",
  },
  {
    frequencyType: "Scheduled",
    frequencyValue: [
      "1/1 M",
      "1/3 M",
      "1/6 M",
      "1/Y",
      "1/2 Y",
      "1/3 Y",
      "1/4 Y",
      "1/5 Y",
    ],
  },
];

export const CATEGORIES_OF_CM = [
  "Overhauling",
  "Upgradation",
  "BM Reflection",
  // Set on the CM raised from an approved New-Machine modification request.
  "PED Reflection",
  // Set on the CM raised from a PM check point found NG.
  "PM Reflection",
  "LTPM",
  "FIOT",
  "Others",
];

export const FIOtSubCategories = ["Abnormality Closing", "Spec Revise"];

/** The colour each category is drawn in on the report dashboards' cards. */
const CM_CATEGORY_BACKGROUND = {
  Overhauling: "#ffb4a1ff",
  Upgradation: "#FFFF9D",
  "BM Reflection": "#BEEB9F",
  "PED Reflection": "#C8B6E2",
  "PM Reflection": "#F7C6D9",
  LTPM: "#FFD9A0",
  FIOT: "#A8E6E2",
  Others: "#9fbfe0ff",
};

/**
 * What the request-sheet API returns each category's count as. The names are
 * irregular because they were added one at a time; they are what the dashboards
 * already read, so they are kept.
 */
const CM_CATEGORY_COUNTER_KEY = {
  Overhauling: "overhaulingCMCategory",
  Upgradation: "upgradationCMCategory",
  "BM Reflection": "BM_ReflectionCMCategory",
  "PED Reflection": "PED_ReflectionCMCategory",
  "PM Reflection": "PM_ReflectionCMCategory",
  LTPM: "LTPM_CMCategory",
  FIOT: "FIOT_CMCategory",
  Others: "othersCMCategory",
};

/**
 * The categories as the report dashboards want them — a card and a filter
 * entry per CATEGORIES_OF_CM value, with the counts from the API.
 *
 * Built from that one list rather than written out per dashboard: hand-kept
 * copies are how FIOT and LTPM came to be offered on the sheet but missing
 * from every dashboard's category filter.
 */
export const cmCategoryCards = (counters) =>
  CATEGORIES_OF_CM.map((title) => ({
    title,
    background: CM_CATEGORY_BACKGROUND[title],
    count: counters?.[CM_CATEGORY_COUNTER_KEY[title]],
  }));
