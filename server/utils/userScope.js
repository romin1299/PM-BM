/**
 * Whether a user's dashboard filters span the whole plant instead of the
 * section / sub-section assigned to their profile.
 *
 * Two kinds of user qualify:
 *
 *   - HOD grade, which has always been plant-wide.
 *   - Tool-room users. The store serves every section, so scoping their Spare
 *     dashboards to the single section on their profile would hide most of the
 *     inventory they are accountable for.
 *
 * Kept in one place because the same rule is applied by several filtration
 * middlewares and mirrored by client/src/Utils/userScope.js, which decides
 * whether to render the Section dropdown at all.
 */
const isPlantWideFiltrationUser = (user) =>
  user?.tm_grade === "HOD" || user?.toolRoomPerson === "Yes";

/**
 * Whether the filters should open with nothing pre-selected.
 *
 * An HOD is plant-wide but still lands on a sensible default section. A
 * tool-room user has no section that is meaningfully "theirs", so picking one
 * for them would just be an arbitrary starting point: their dashboards open
 * across the whole plant and they narrow down by hand.
 */
const hasNoDefaultFilterSelection = (user) => user?.toolRoomPerson === "Yes";

module.exports = { isPlantWideFiltrationUser, hasNoDefaultFilterSelection };
