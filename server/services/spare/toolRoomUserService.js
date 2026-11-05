/**
 * Rules for creating and editing Spare tool-room users.
 *
 * A tool-room user belongs to the plant, not to a section: the store serves
 * every section, and they are scoped to the plant everywhere else in Spare (see
 * utils/userScope.js). So the user-management form no longer asks for a section,
 * sub-section or cell, and these rules never read or write them.
 *
 * Only the fields listed in EDITABLE_FIELDS are ever taken from a request. The
 * routes used to hand req.body straight to the model, which let a caller set
 * anything on the document - including user_type, toolRoomPerson and a
 * plain-text password that findOneAndUpdate would have stored unhashed.
 */

/**
 * Who may create and manage whom. It is the whole hierarchy of the tool room,
 * and the list screen, the by-id routes and the create/edit validation all read
 * it, so they cannot disagree about it.
 */
const MANAGEABLE_USER_TYPES = {
  "Plant-Admin": ["Section-Admin"],
  "Section-Admin": ["HOSS", "Supervisor", "Office Person"],
  HOSS: ["Supervisor", "Office Person"],
  Supervisor: ["Office Person"],
};

const manageableUserTypes = (callerUserType) =>
  MANAGEABLE_USER_TYPES[callerUserType] ?? [];

/** The grade a Section-Admin carries; the other tool-room types have none. */
const GRADE_BY_USER_TYPE = { "Section-Admin": "HOS" };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Digits with the separators people actually type: 98765 43210, +91-98765-43210, (011) 2345678 */
const CONTACT_PATTERN = /^[0-9+()\-\s]{7,20}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const isText = (value) => typeof value === "string";
const cleaned = (value) => (isText(value) ? value.trim() : value);
const isBlank = (value) =>
  value === undefined || value === null || (isText(value) && !value.trim());

const isRealDate = (text) => {
  if (!DATE_PATTERN.test(text)) return false;
  const parsed = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(text);
};

/**
 * Checks and normalises the body of a create or an edit.
 *
 * @param {object} args
 * @param {object} args.body          req.body
 * @param {"create"|"edit"} args.mode
 * @param {string} args.callerUserType  the logged-in user's user_type
 * @param {object} [args.existing]    the stored user, for an edit
 * @returns {{error: string} | {values: object}}
 *   `values` holds only fields that may be written. On an edit it holds only
 *   the fields the request actually carried, so an edit can never blank a field
 *   by leaving it out.
 */
const validateToolRoomUserInput = ({
  body = {},
  mode,
  callerUserType,
  existing = {},
}) => {
  const isCreate = mode === "create";
  const values = {};
  const has = (key) => body[key] !== undefined;

  // ---- TM name --------------------------------------------------------------
  if (isCreate || has("tm_name")) {
    const tmName = cleaned(body.tm_name);
    if (!isText(tmName) || !tmName)
      return { error: "Please enter TM name" };
    values.tm_name = tmName;
  }

  // ---- TM number ------------------------------------------------------------
  if (isCreate || (has("tm_no") && !isBlank(body.tm_no))) {
    const tmNo = Number(body.tm_no);
    if (isBlank(body.tm_no) || !Number.isInteger(tmNo) || tmNo <= 0)
      return { error: "TM number must be a positive whole number" };
    values.tm_no = tmNo;
  }

  // ---- user type ------------------------------------------------------------
  if (isCreate || has("user_type")) {
    const allowed = manageableUserTypes(callerUserType);
    if (!allowed.includes(body.user_type))
      return {
        error: isBlank(body.user_type)
          ? "Please select user type"
          : `You cannot assign the user type "${body.user_type}"`,
      };
    values.user_type = body.user_type;
  }

  // ---- email, contact: only checked when they change, so a stored value in an
  //      older format never stops someone editing the rest of the record ------
  if (has("email")) {
    const email = cleaned(body.email) ?? "";
    if (email && email !== existing.email && !EMAIL_PATTERN.test(email))
      return { error: "Please enter a valid email address" };
    values.email = email;
  }

  if (has("contact_no")) {
    const contact = cleaned(body.contact_no) ?? "";
    if (contact && contact !== existing.contact_no && !CONTACT_PATTERN.test(contact))
      return { error: "Please enter a valid contact number" };
    values.contact_no = contact;
  }

  // ---- joining date ---------------------------------------------------------
  if (isCreate || has("joining_date")) {
    const joining = cleaned(body.joining_date);
    if (isBlank(joining)) {
      if (isCreate) return { error: "Please select joining date" };
    } else if (joining !== existing.joining_date && !isRealDate(joining)) {
      return { error: "Please enter a valid joining date" };
    } else {
      values.joining_date = joining;
    }
  }

  // ---- address --------------------------------------------------------------
  if (has("address")) values.address = cleaned(body.address) ?? "";

  // The grade follows from the type; it is not something the form decides.
  if (isCreate && GRADE_BY_USER_TYPE[values.user_type])
    values.tm_grade = GRADE_BY_USER_TYPE[values.user_type];

  return { values };
};

/**
 * The part of a user that the table and the edit form show. Built explicitly so
 * that nothing else on the document - the password hash, the stored login
 * tokens - can reach the browser, which returning the saved document did.
 */
const toToolRoomUserRow = (user) => ({
  _id: user._id,
  tm_no: user.tm_no,
  tm_name: user.tm_name,
  email: user.email,
  user_type: user.user_type,
  tm_grade: user.tm_grade,
  plant_data: user.plant_data,
});

module.exports = {
  MANAGEABLE_USER_TYPES,
  manageableUserTypes,
  validateToolRoomUserInput,
  toToolRoomUserRow,
};
