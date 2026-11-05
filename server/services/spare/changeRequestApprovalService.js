const moment = require("moment");

const User = require("../../model/userSchema");
const { sortedByName } = require("../../utils/userSort");
const {
  mongoDBUserFilters,
  hooksFormReferenceOfApproval,
  dynamicApprovalStatus,
  spareRejectedStatus,
} = require("../../utils/spareManagementUtils");

/**
 * The change-request approval route, fixed per department and ending at the
 * Tool Room (which serves both departments).
 *
 * The route is the one the paper form names: TL -> HOSS -> HOS -> HOD -> Tool
 * Room. TL and HOSS are separate slots even though both are filled from the
 * "TL/HOSS" user type — they are two approvals, and the requester may name the
 * same person twice or two different people.
 *
 * Defined here so the dropdowns, the saved chain and any future mail job all
 * draw the same order.
 */
const CHANGE_REQUEST_CHAINS = {
  MTD: ["MTD_TL", "MTD_HOSS", "MTD_HOS", "MTD_HOD", "TOOL_ROOM"],
  PRD: ["PRD_TL", "PRD_HOSS", "PRD_HOS", "PRD_HOD", "TOOL_ROOM"],
};

/** Steps whose users belong to the requester's section; HOD and Tool Room are plant-wide. */
const SECTION_SCOPED_KEYS = new Set([
  "MTD_TL",
  "MTD_HOSS",
  "MTD_HOS",
  "PRD_TL",
  "PRD_HOSS",
  "PRD_HOS",
]);

const USER_PROJECTION = {
  _id: 1,
  tm_no: 1,
  tm_name: 1,
  email: 1,
};

/** The display name the paper form and the approval track use for a step. */
const displayNameOf = (key) =>
  hooksFormReferenceOfApproval?.[key]?.displayName || key;

/**
 * Everyone who may fill one step, for its dropdown. TL / HOSS / HOS are drawn
 * from the requester's section first and fall back to the plant when that
 * section has nobody registered, so the dropdown is never silently empty.
 */
const listApproversForStep = async (key, { plantData, sectionData }) => {
  const base = mongoDBUserFilters?.[key];
  if (!base) return [];

  // Tool Room is the only step expressed as an $or of flags.
  if (base.$or)
    return sortedByName(
      User.find(
        { $and: [{ $or: base.$or }, { plant_data: plantData }] },
        USER_PROJECTION,
      ),
    ).lean();

  const plantFilter = { ...base, plant_data: plantData };

  if (SECTION_SCOPED_KEYS.has(key) && sectionData) {
    const scoped = await sortedByName(
      User.find(
        { ...plantFilter, section_data: sectionData },
        USER_PROJECTION,
      ),
    ).lean();
    if (scoped.length) return scoped;
  }

  return sortedByName(User.find(plantFilter, USER_PROJECTION)).lean();
};

/**
 * Turns the requester's five choices into the chain that is saved on the
 * request. Every choice is checked against the same list its dropdown offered,
 * so a forged id cannot put someone outside the route into an approval slot.
 *
 * `selections` is keyed by approval key: { MTD_TL: "<user id>", ... }.
 */
const resolveApprovalSelection = async ({ requestFor, user, selections = {} }) => {
  const keys = CHANGE_REQUEST_CHAINS[requestFor];
  if (!keys) return { error: `Unknown department "${requestFor}"` };

  const steps = [];

  for (const key of keys) {
    const allowed = await listApproversForStep(key, {
      plantData: user?.plant_data,
      sectionData: user?.section_data,
    });

    const selectedId = selections?.[key];
    if (!selectedId)
      return { error: `Please select the ${displayNameOf(key)} approval` };

    const approver = allowed.find(
      (item) => String(item._id) === String(selectedId),
    );
    if (!approver)
      return {
        error: `The selected ${displayNameOf(key)} user is not eligible for this step`,
      };

    steps.push({
      key,
      userType: displayNameOf(key),
      user: {
        _id: approver._id,
        tm_no: approver.tm_no,
        tm_name: approver.tm_name,
        email: approver.email,
      },
      approvalStatus: "Pending",
    });
  }

  return { steps };
};

/**
 * Records one approver's decision on a request document and moves the route on
 * — or closes it. Shared by the change and delete request controllers so both
 * advance identically.
 *
 * Returns an error string when the step cannot be decided, otherwise null.
 */
const applyApprovalDecision = (request, { isApproved, remarks }) => {
  const step = request?.approvals?.[request?.currentApprovalIndex];
  if (!step || step.approvalStatus !== "Pending")
    return "This step has already been decided";

  step.approvalStatus = isApproved === "Yes" ? "Accepted" : "Rejected";
  step.approvalDateAndTime = moment().format("D/M/YYYY - h:mm a");
  step.rejectedRemarks =
    isApproved === "Yes" ? "" : String(remarks ?? "").trim();

  if (isApproved === "No") {
    request.requestStatus = spareRejectedStatus;
    request.pendingApprovalBy = null;
    return null;
  }

  const next = request.approvals?.[request.currentApprovalIndex + 1];
  if (next) {
    request.currentApprovalIndex += 1;
    request.pendingApprovalBy = next.user?._id ?? null;
    request.requestStatus = dynamicApprovalStatus?.[next.key] ?? next.userType;
  } else {
    request.requestStatus = "Completed";
    request.pendingApprovalBy = null;
  }

  return null;
};

module.exports = {
  CHANGE_REQUEST_CHAINS,
  listApproversForStep,
  resolveApprovalSelection,
  applyApprovalDecision,
  // exposed for tests
  displayNameOf,
};
