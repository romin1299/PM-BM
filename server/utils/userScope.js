/**
 * Who counts as a tool-room user, and what that means for dashboard scope.
 *
 * Two kinds of user work in the tool room, and they are deliberately not the
 * same thing:
 *
 *   - Dedicated tool-room staff - `toolRoomPerson: "Yes"`. They have no PM
 *     role at all: App.js gives them the Spare tab and nothing else, and they
 *     are stored against the plant with no section.
 *   - PM users who ALSO work in the tool room - `alsoToolRoomPerson: "Yes"`.
 *     The section's HOD who is also the tool room's HOD, or a TL/HOSS who is
 *     also the tool room's HOS. They keep every PM tab and their own section,
 *     and gain the tool-room rights inside Spare.
 *
 * That difference is what the two scope helpers below are for. A dedicated
 * tool-room user has no section that is meaningfully theirs, so every dashboard
 * they open spans the plant. A dual-role user still does the same PM job, so
 * their PM and BM dashboards stay scoped to their section exactly as before and
 * only Spare opens plant-wide - which is why those helpers take the module the
 * request came from.
 *
 * Mirrored by client/src/Utils/userScope.js, which decides whether to render
 * the Section dropdown at all. Both must agree, or the list arrives and stays
 * hidden.
 */

/** Spare rights: the configuration screens, master edits, approver eligibility. */
const isToolRoomUser = (user) =>
  user?.toolRoomPerson === "Yes" || user?.alsoToolRoomPerson === "Yes";

/**
 * Tool room and nothing else. This is what hides the PM, BM and CM tabs, and
 * what clears the section on save - neither of which may happen to a user who
 * still has a PM job.
 */
const isSpareOnlyUser = (user) => user?.toolRoomPerson === "Yes";

/**
 * The filtration endpoint under /getFiltrationValue is shared by PM, BM, CM and
 * Spare, so the module has to come from the request.
 *
 * `moduleType=Spare` is the existing signal, already read by
 * responseFilterMiddleWareForSpare - but that one also changes the shape of the
 * response, so pages that only need the wider scope send `scopeModule=Spare`
 * instead and leave their response shape alone.
 */
const isSpareRequest = (query) =>
  query?.scopeModule === "Spare" || query?.moduleType === "Spare";

/**
 * Whether the filter dropdowns offer every section in the plant rather than
 * only the one on the user's profile.
 *
 * @param {object} user   req.rootUser
 * @param {object} [query] req.query - omit it and a dual-role user is treated
 *                         as the section-scoped PM user they are.
 */
const isPlantWideFiltrationUser = (user, query) =>
  user?.tm_grade === "HOD" ||
  isSpareOnlyUser(user) ||
  (isToolRoomUser(user) && isSpareRequest(query));

/**
 * Whether the filters open with nothing pre-selected.
 *
 * An HOD is plant-wide but still lands on a default section. A dedicated
 * tool-room user has no section of their own, so they open across the plant and
 * narrow down by hand; so does a dual-role user, but only in Spare.
 */
const hasNoDefaultFilterSelection = (user, query) =>
  isSpareOnlyUser(user) || (isToolRoomUser(user) && isSpareRequest(query));

module.exports = {
  isToolRoomUser,
  isSpareOnlyUser,
  isSpareRequest,
  isPlantWideFiltrationUser,
  hasNoDefaultFilterSelection,
};
