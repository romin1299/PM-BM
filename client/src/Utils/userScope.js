/**
 * Whether a user's dashboard filters span the whole plant instead of the
 * section / sub-section assigned to their profile.
 *
 * HOD grade has always been plant-wide. Tool-room users are too: the store
 * serves every section, so limiting their Spare dashboards to the one section on
 * their profile would hide most of the inventory they are accountable for.
 *
 * Mirrors isPlantWideFiltrationUser in server/utils/userScope.js — the server
 * decides which sections to return, this decides whether to offer the dropdown.
 * Both must agree or the list arrives and stays hidden.
 */
export const isPlantWideFiltrationUser = (user) =>
  user?.tm_grade === "HOD" || user?.toolRoomPerson === "Yes";

/**
 * Whether the filters open with nothing pre-selected.
 *
 * An HOD is plant-wide but still lands on a default section. A tool-room user
 * has no section that is meaningfully theirs, so their dashboards open across
 * the whole plant and they narrow down by hand.
 *
 * Mirrors hasNoDefaultFilterSelection in server/utils/userScope.js.
 */
export const hasNoDefaultFilterSelection = (user) =>
  user?.toolRoomPerson === "Yes";

export default isPlantWideFiltrationUser;
