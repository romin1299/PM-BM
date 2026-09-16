/**
 * Who may add whom in User Management — shared by the add and edit popups so
 * the two cannot drift apart again (they had: PED existed in one and not the
 * other).
 *
 * A user's place is the pair (tm_department, tm_grade | user_type), and each
 * department has the same ladder:
 *
 *   HOD        user_type Plant-Admin,   tm_grade HOD    added by Admin
 *   HOS        user_type Section-Admin, tm_grade HOS    added by an MTD Section-Admin
 *   TL/HOSS    user_type TL/HOSS                        added by an MTD Section-Admin or MTD TL/HOSS
 *   Operator   user_type Operator                       added by an MTD Section-Admin or MTD TL/HOSS
 *
 * The interlock is that MTD adds the next level down and its counterparts in
 * the other departments; nothing here lets a department add above itself.
 */

export const DEPARTMENTS = ["PRD", "MTD", "PED"];

export const TM_GRADES = ["HOS", "HOD"];

export const USER_TYPE = {
  TL_HOSS: { label: "TL/HOSS", value: "TL/HOSS" },
  SECTION_ADMIN: { label: "Section-Admin", value: "Section-Admin" },
  OPERATOR: { label: "Operator/Office Person", value: "Operator" },
};

/**
 * What an MTD Section-Admin may add into each department.
 *
 * Section-Admin here means the department's HOS: it is stored with tm_grade HOS,
 * which is how the approval lists pick a "PRD HOS" or "PED HOS" out.
 */
const SECTION_ADMIN_ADDABLE_TYPES = {
  PRD: [USER_TYPE.TL_HOSS, USER_TYPE.SECTION_ADMIN],
  MTD: [USER_TYPE.TL_HOSS, USER_TYPE.OPERATOR],
  PED: [USER_TYPE.TL_HOSS, USER_TYPE.SECTION_ADMIN, USER_TYPE.OPERATOR],
};

/** What an MTD TL/HOSS may add. */
const TL_HOSS_ADDABLE_TYPES = [USER_TYPE.TL_HOSS, USER_TYPE.OPERATOR];

/**
 * The departments an MTD TL/HOSS may place a new TL/HOSS in. Their operators
 * always land in MTD.
 */
export const TL_HOSS_COUNTERPART_DEPARTMENTS = ["PRD", "PED"];

export const useRole = (context) => ({
  isSectionAdmin: context.user_type === "Section-Admin",
  isTLHOSS: context.user_type === "TL/HOSS",
  isPlantAdmin: context.user_type === "Plant-Admin",
  isAdmin: context.user_type === "Admin",
  isMTD: context.tm_department === "MTD",
});

export const getUserTypeOptions = (role, tmDepartment) => {
  if (role.isSectionAdmin) return SECTION_ADMIN_ADDABLE_TYPES[tmDepartment] ?? [];
  if (role.isTLHOSS && role.isMTD) return TL_HOSS_ADDABLE_TYPES;
  return [];
};

/** A Section-Admin picked by a Section-Admin is that department's HOS. */
export const isAddingDepartmentHOS = (role, userType) =>
  role.isSectionAdmin && userType === USER_TYPE.SECTION_ADMIN.value;
