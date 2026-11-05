const { isSpareOnlyUser } = require("../../utils/userScope");

/**
 * Rules shared by /postUserAssign and /updateAssignUser.
 *
 * Two different people can work in the tool room, and only one of them loses
 * their section:
 *
 *   - Dedicated tool-room staff (`toolRoomPerson: "Yes"`) belong to the plant,
 *     not to a section. The store serves every section, and Spare already
 *     treats them that way, so the section, sub-section and cell on their
 *     profile are not just unused - a stale one is misleading, and is cleared.
 *   - A PM user who ALSO works in the tool room (`alsoToolRoomPerson: "Yes"`)
 *     keeps their section. PM and BM dashboards are scoped by it, so clearing
 *     it would leave their PM tabs loading nothing at all.
 *
 * Enforced on the server as well as hidden on the form, because the two PM
 * popups send a payload built from whatever the form happened to hold: the add
 * form falls back to the logged-in Admin's own section when the field is blank,
 * which is how a tool-room HOD ended up filed under the Admin's section.
 */

const YES = "Yes";
const NO = "No";
const TOOL_ROOM_VALUES = [YES, NO];

/** Only an Admin creates or changes either tool-room setting in PM. */
const MAY_SET_TOOL_ROOM = "Admin";

/**
 * What to force onto a dedicated tool-room person's record, and nothing at all
 * for anyone else - including a dual-role user, who keeps their section.
 *
 * Returning an empty object for everyone else is what makes this safe to spread
 * into an existing update: the four branches of /updateAssignUser each set a
 * deliberately different set of fields (a HOD gets no cell, and so on), and
 * this must not quietly add one back.
 */
const toolRoomHierarchyOverride = (toolRoomPerson) =>
  isSpareOnlyUser({ toolRoomPerson })
    ? { section_data: "", subSection_data: [], cell_data: [] }
    : {};

/**
 * The hierarchy fields to store for a new user: cleared for dedicated
 * tool-room staff, otherwise exactly what was sent.
 */
const hierarchyFieldsFor = ({
  toolRoomPerson,
  section_data,
  subSection_data,
  cell_data,
}) =>
  isSpareOnlyUser({ toolRoomPerson })
    ? toolRoomHierarchyOverride(toolRoomPerson)
    : { section_data, subSection_data, cell_data };

/**
 * Whether this request may change a tool-room setting, and to what.
 *
 * Returns `undefined` when the setting must be left alone - the caller then
 * omits it from the update rather than writing `undefined`, which would
 * otherwise clear it for every user a Section-Admin or TL/HOSS edits, since
 * their edit popup has no such field to send.
 */
const toolRoomSettingUpdate = ({ caller, requested }) => {
  if (caller?.user_type !== MAY_SET_TOOL_ROOM) return undefined;
  if (!TOOL_ROOM_VALUES.includes(requested)) return undefined;
  return requested;
};

/**
 * The two settings a request is asking for, with the pair made coherent.
 *
 * They are mutually exclusive: "tool room only" already includes every
 * tool-room right, so a record carrying both would be contradictory. Dedicated
 * wins, because that is the stronger statement - it also removes PM access.
 */
const resolveToolRoomSettings = ({ caller, body, stored }) => {
  const dedicated = toolRoomSettingUpdate({
    caller,
    requested: body?.toolRoomPerson,
  });
  const alsoRequested = toolRoomSettingUpdate({
    caller,
    requested: body?.alsoToolRoomPerson,
  });

  const effectiveDedicated = dedicated ?? stored?.toolRoomPerson;
  const also =
    effectiveDedicated === YES && alsoRequested === YES ? NO : alsoRequested;

  return {
    /** Only the fields that may be written, ready to spread into a $set. */
    fields: {
      ...(dedicated === undefined ? {} : { toolRoomPerson: dedicated }),
      ...(also === undefined ? {} : { alsoToolRoomPerson: also }),
    },
    /** Which kind of tool-room user this will leave them as. */
    effectiveToolRoomPerson: effectiveDedicated,
  };
};

module.exports = {
  TOOL_ROOM_YES: YES,
  TOOL_ROOM_NO: NO,
  TOOL_ROOM_VALUES,
  MAY_SET_TOOL_ROOM,
  hierarchyFieldsFor,
  toolRoomHierarchyOverride,
  toolRoomSettingUpdate,
  resolveToolRoomSettings,
};
