/**
 * Who can reach what in the Spare module.
 *
 * The route table and the sidebar each used to carry their own copy of the role
 * list, and the two have to agree: a menu item with no matching route opens a
 * blank page, and a route with no menu item cannot be reached from the UI at
 * all. Keeping one source means granting a role is a single edit, and the
 * sidebar can never drift from what is actually routed.
 *
 * Access is enforced here, on the client. The Spare endpoints do not check
 * user_type - spareMiddleware authorises a write by ownership (the sheet is in
 * a requester-editable status) or by being the approver named in
 * pendingApprovalBy - so these lists decide what a user is offered, not what
 * the server will accept.
 */

/**
 * The roles the module was built for: the three PM levels that sit above the
 * shop floor, plus the Spare tool room's own hierarchy.
 *
 * "Admin" is deliberately absent. The route table used to list it, but App.js
 * gives an Admin only the PM tab and SPARE_MODULE_ROLES below excludes them, so
 * the entry never had any effect.
 */
export const SPARE_CORE_ROLES = [
  // from PM
  "Plant-Admin",
  "Section-Admin",
  "TL/HOSS",
  // from the Spare tool room
  "HOSS",
  "Supervisor",
  "Office Person",
];

/**
 * Operators sit below TL/HOSS and approve nothing, but they raise part requests
 * and read the dashboards, so they get every page except the approver's inbox
 * and the configuration screens.
 *
 * This includes the master registration form. It has no menu item of its own -
 * it is opened by the edit action on the Master and Ordering dashboards, and on
 * Ordering that action is offered on data, not on role (canConfigureMaster is
 * `newPartFor === "For stock in"`). Leaving the route out would give an
 * Operator a button that goes nowhere.
 */
export const SPARE_ROLES_WITH_OPERATOR = [...SPARE_CORE_ROLES, "Operator"];

/**
 * The approver's inbox. Its list is filtered server-side to sheets where
 * pendingApprovalBy is the caller, so an Operator would only ever see it empty;
 * offering it would imply an authority they do not have.
 */
export const SPARE_APPROVER_ROLES = SPARE_CORE_ROLES;

/** Approval chains, lead times, currency, custom fields and targets. */
export const SPARE_CONFIGURATION_ROLES = [
  "Plant-Admin",
  "Section-Admin",
  // from the Spare tool room
  "HOSS",
  "Supervisor",
  "Office Person",
];

/** Creating and editing users - narrower still: no Office Person. */
export const SPARE_USER_MANAGEMENT_ROLES = [
  "Plant-Admin",
  "Section-Admin",
  "HOSS",
  "Supervisor",
];

/**
 * The gate on the module itself. A user_type outside this set gets no routes at
 * all, which is what left an Operator looking at an empty Spare tab: the tab is
 * offered to everyone once REACT_APP_MODE is UP_TO_SPARE, but nothing rendered
 * inside it.
 */
export const SPARE_MODULE_ROLES = new Set(SPARE_ROLES_WITH_OPERATOR);
