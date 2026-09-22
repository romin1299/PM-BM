const logger = require("../../utils/LoggingController/loggers");
const {
  spareRejectedStatus,
  hooksFormReferenceOfApproval,
} = require("../../utils/spareManagementUtils");
const {
  sendSpareMail,
  layout,
  detailsTable,
  gridTable,
  sectionHeading,
  escapeHtml,
  baseUrl,
} = require("../../sendMail/spare/spareMailer");

/**
 * Mails that follow a Spare Part Request sheet through its approval chain.
 *
 * Two events are announced:
 *  - the sheet lands with an approver — on being sent for approval, and again
 *    each time the previous approver accepts — so that approver hears about it
 *    without watching the dashboard;
 *  - an approver rejects it — the requester is told, with the remark, because
 *    a rejection is final and the sheet comes back to them.
 *
 * Both are decided by comparing the sheet before and after a save, so the one
 * hook covers every path that moves the sheet: creation, NG-budget HOD
 * approval, and each dynamic-chain decision.
 */

const STAGE_LABELS = {
  mtdHODApprovalIfBudgetIsNG: "MTD HOD (NG budget)",
  ...Object.fromEntries(
    Object.values(hooksFormReferenceOfApproval).map(
      ({ approvalKey, displayName }) => [approvalKey, displayName],
    ),
  ),
};

/** Every slot key, chain order, for the approval-track table. */
const APPROVAL_KEYS = Object.keys(STAGE_LABELS);

const stageLabel = (key) => STAGE_LABELS[key] ?? key;

const sheetUrl = (sheet) =>
  `${baseUrl()}/spare/spareNewPartRequest/?_id=${sheet._id}`;

const hierarchy = (sheet) =>
  [
    sheet.plant?.plant_name,
    sheet.section?.section_name,
    sheet.subSection?.subSection_name,
    sheet.cell?.cell_name,
    sheet.line?.line_name,
  ]
    .filter(Boolean)
    .join(" / ");

const machineText = (sheet) =>
  [sheet.machine?.machine_code, sheet.machine?.machine_name]
    .filter(Boolean)
    .join(" - ");

const partsTable = (sheet) =>
  gridTable(
    ["#", "Part name", "Part model", "Maker", "Qty", "Approx. unit price (INR)", "Type"],
    (sheet.changeParts ?? []).map((part, index) => [
      index + 1,
      part.partName,
      part.partModel,
      part.maker,
      part.quantityRequired,
      part.approxUnitPrice,
      [part.standerOrManufacturingPart, part.normalOrUrgentPart]
        .filter(Boolean)
        .join(", "),
    ]),
  );

/** Everything an approver or requester needs to recognise the sheet. */
const sheetDetails = (sheet) =>
  sectionHeading("Request sheet details") +
  detailsTable([
    ["Request No", sheet.requestSheetNo],
    ["Current status", sheet.requestSheetStatus],
    ["Request type", `${sheet.newOrReOrderRequest ?? "NEW"} — ${sheet.newPartFor ?? "-"}`],
    ["Department", sheet.partRequestFor],
    [
      "Requested by",
      [sheet.requestSheetCreatedBy?.tm_name, sheet.requestSheetCreatedBy?.tm_no]
        .filter(Boolean)
        .join(" / "),
    ],
    ["Hierarchy", hierarchy(sheet)],
    ["Machine", machineText(sheet)],
    [
      "Budget",
      `${sheet.budget?.budgetStatus ?? "-"} (required ₹ ${sheet.budget?.requiredBudget ?? 0})`,
    ],
    ["Submitted on", sheet.rsSubmittedTimeStamp?.inString],
  ]) +
  sectionHeading(`Parts (${sheet.changeParts?.length ?? 0})`) +
  partsTable(sheet);

/** Who has decided what so far, in chain order; pending stages included. */
const approvalTrack = (sheet) => {
  const rows = APPROVAL_KEYS.filter((key) => sheet[key]?.user?.tm_name).map(
    (key) => {
      const slot = sheet[key];
      return [
        stageLabel(key),
        slot.user.tm_name,
        slot.approvalStatus ?? "Pending",
        slot.approvalDateAndTime,
        slot.rejectedRemarks,
      ];
    },
  );
  if (!rows.length) return "";
  return (
    sectionHeading("Approval tracking") +
    gridTable(["Stage", "Approver", "Status", "Date & time", "Remarks"], rows)
  );
};

/** The slot the sheet is currently waiting on, with its key. */
const pendingSlot = (sheet) => {
  const key = sheet.dynamicApprovalKeys?.[0];
  const slot = key ? sheet[key] : null;
  if (slot?.user?._id && String(slot.user._id) === String(sheet.pendingApprovalBy))
    return { key, slot };
  // Fall back to whichever slot names the pending user.
  const found = APPROVAL_KEYS.find(
    (k) => String(sheet[k]?.user?._id ?? "") === String(sheet.pendingApprovalBy),
  );
  return found ? { key: found, slot: sheet[found] } : null;
};

const notifyPendingApprover = async ({ sheet, previousApprover }) => {
  const pending = pendingSlot(sheet);
  if (!pending?.slot?.user?.email) {
    logger.warn(`Spare sheet ${sheet.requestSheetNo}: pending approver has no email`);
    return false;
  }

  const { key, slot } = pending;
  const intro = previousApprover
    ? `${escapeHtml(previousApprover.tm_name)} (${escapeHtml(previousApprover.stage)}) has approved spare part request sheet <b>${escapeHtml(sheet.requestSheetNo)}</b>. It is now waiting for your approval as <b>${escapeHtml(stageLabel(key))}</b>.`
    : `Spare part request sheet <b>${escapeHtml(sheet.requestSheetNo)}</b> has been sent for your approval as <b>${escapeHtml(stageLabel(key))}</b>.`;

  return sendSpareMail({
    to: slot.user.email,
    subject: `Approval pending: Spare part request ${sheet.requestSheetNo} (${stageLabel(key)})`,
    html: layout({
      title: "Spare part request awaiting your approval",
      greeting: slot.user.tm_name,
      intro,
      body: sheetDetails(sheet) + approvalTrack(sheet),
      actionUrl: sheetUrl(sheet),
      actionText: "Review and approve",
    }),
  });
};

const notifyRequesterOfRejection = async ({ sheet, rejectedBy, remarks }) => {
  const requester = sheet.requestSheetCreatedBy;
  if (!requester?.email) {
    logger.warn(`Spare sheet ${sheet.requestSheetNo}: requester has no email`);
    return false;
  }

  const who = rejectedBy
    ? `<b>${escapeHtml(rejectedBy.tm_name)}</b> (${escapeHtml(rejectedBy.stage)})`
    : "an approver";

  return sendSpareMail({
    to: requester.email,
    subject: `Rejected: Spare part request ${sheet.requestSheetNo}`,
    html: layout({
      title: "Spare part request rejected",
      greeting: requester.tm_name,
      intro: `Your spare part request sheet <b>${escapeHtml(sheet.requestSheetNo)}</b> has been rejected by ${who}. A rejection is final for this sheet; please raise a fresh request if the parts are still needed.`,
      body:
        sectionHeading("Rejection remark") +
        `<p style="border-left:4px solid #d9534f;background:#fdf3f2;padding:10px 14px;margin:6px 0 16px;font-size:14px;">${escapeHtml(remarks || "-")}</p>` +
        sheetDetails(sheet) +
        approvalTrack(sheet),
      actionUrl: sheetUrl(sheet),
      actionText: "View request sheet",
    }),
  });
};

/** The stage `user` decided at, read from the sheet as it stood before. */
const stageOf = (sheet, user) => {
  if (!sheet || !user) return null;
  const key = APPROVAL_KEYS.find(
    (k) => String(sheet[k]?.user?._id ?? "") === String(user._id),
  );
  return { tm_name: user.tm_name, stage: key ? stageLabel(key) : "approver" };
};

/**
 * Works out from a before/after pair which mail, if any, the save calls for,
 * and sends it without holding up the response.
 */
const notifyApprovalChange = ({ before, after, actor, rejectedRemarks }) => {
  if (!after) return;

  const run = async () => {
    const becameRejected =
      after.requestSheetStatus === spareRejectedStatus &&
      before?.requestSheetStatus !== spareRejectedStatus;

    if (becameRejected)
      return notifyRequesterOfRejection({
        sheet: after,
        rejectedBy: stageOf(before, actor),
        remarks: rejectedRemarks,
      });

    const pendingNow = after.pendingApprovalBy ? String(after.pendingApprovalBy) : null;
    const pendingBefore = before?.pendingApprovalBy ? String(before.pendingApprovalBy) : null;

    if (pendingNow && pendingNow !== pendingBefore) {
      // Someone other than the requester moved it on: that is the approver who
      // just accepted. The requester sending it announces nothing to credit.
      const actorIsApprover =
        actor && before && String(before.pendingApprovalBy ?? "") === String(actor._id);
      return notifyPendingApprover({
        sheet: after,
        previousApprover: actorIsApprover ? stageOf(before, actor) : null,
      });
    }
    return false;
  };

  run().catch((error) =>
    logger.error(error, { spareApprovalMail: after.requestSheetNo }),
  );
};

module.exports = {
  notifyApprovalChange,
  notifyPendingApprover,
  notifyRequesterOfRejection,
  // exposed for tests
  sheetDetails,
  approvalTrack,
};
