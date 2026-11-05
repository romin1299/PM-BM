/**
 * Who counts as a tool-room user, and what that means for dashboard scope.
 *
 * Two kinds of user work in the tool room, and they are deliberately not the
 * same thing:
 *
 *   - Dedicated tool-room staff — `toolRoomPerson: "Yes"`. They have no PM role
 *     at all: App.js gives them the Spare tab and nothing else.
 *   - PM users who ALSO work in the tool room — `alsoToolRoomPerson: "Yes"`.
 *     The section's HOD who is also the tool room's HOD, or a TL/HOSS who is
 *     also the tool room's HOS. They keep every PM tab and their own section,
 *     and gain the tool-room rights inside Spare.
 *
 * Mirrors server/utils/userScope.js — the server decides which sections to
 * return, this decides whether to offer the dropdown. Both must agree or the
 * list arrives and stays hidden.
 */

/** Spare rights: the configuration screens, master edits, approver eligibility. */
export const isToolRoomUser = (user) =>
  user?.toolRoomPerson === "Yes" || user?.alsoToolRoomPerson === "Yes";

/**
 * Tool room and nothing else — what hides the PM, BM and CM tabs. A dual-role
 * user must never match this.
 */
export const isSpareOnlyUser = (user) => user?.toolRoomPerson === "Yes";

/**
 * Whether a user's dashboard filters span the whole plant instead of the
 * section / sub-section assigned to their profile.
 *
 * HOD grade has always been plant-wide, and so is dedicated tool-room staff:
 * the store serves every section, so limiting them to the one section on their
 * profile would hide most of the inventory they are accountable for.
 *
 * A dual-role user is NOT included. Their PM and BM filters stay scoped to
 * their own section, and Spare widens them by sending `moduleType=Spare`, which
 * the server reads.
 */
export const isPlantWideFiltrationUser = (user) =>
  user?.tm_grade === "HOD" || isSpareOnlyUser(user);

/**
 * Whether the filters open with nothing pre-selected.
 *
 * An HOD is plant-wide but still lands on a default section. A tool-room user
 * has no section that is meaningfully theirs, so their Spare dashboards open
 * across the whole plant and they narrow down by hand — including a dual-role
 * user, since this is only read by Spare's own WithFilters.
 */
export const hasNoDefaultFilterSelection = (user) => isToolRoomUser(user);

/**
 * Whether this user may decide the given approval step.
 *
 * Mirrors the server's `mongoDBUserFilters` (utils/spareManagementUtils.js):
 * TL and HOSS share the department's "TL/HOSS" pool, HOS and HOD are matched by
 * grade, and the Tool Room step is open to anyone carrying a tool-room flag.
 *
 * Kept in step with the server deliberately: the server re-checks the same
 * rule before recording a decision, so the client only decides whether to
 * offer the Approve action.
 */
export const canDecideApprovalStep = (user, approvalKey) => {
  if (!user || !approvalKey) return false;

  const key = String(approvalKey);

  if (key === "TOOL_ROOM")
    return (
      isToolRoomUser(user) ||
      user?.user_type === "Office Person"
    );

  const [department, level] = key.split("_");
  if (!department || department !== user?.tm_department) return false;

  if (level === "TL" || level === "HOSS") return user?.user_type === "TL/HOSS";
  if (level === "HOS") return user?.tm_grade === "HOS";
  if (level === "HOD") return user?.tm_grade === "HOD";

  return false;
};

export default isPlantWideFiltrationUser;
