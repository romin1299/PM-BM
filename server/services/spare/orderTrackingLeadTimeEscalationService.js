const RequestSheetOfSpare = require("../../model/requestSheetDataOfSpare");
const Plant = require("../../model/plantSchema");
const logger = require("../../utils/LoggingController/loggers");
const { spareRejectedStatus, partReceiveLeadTimeFor } = require("../../utils/spareManagementUtils");
const {
  sendSpareMail,
  layout,
  detailsTable,
  sectionHeading,
  escapeHtml,
  baseUrl,
} = require("../../sendMail/spare/spareMailer");

/**
 * Daily escalation for the Ordered Spare Part Tracking dashboard.
 *
 * Three ordering stages carry a lead time: PO Made, Part Receipt and Part
 * Inspection. When a part's previous stage is done, that stage's lead time has
 * elapsed and the stage itself is still not submitted, the dashboard already
 * paints the cell red ("running late"). This job turns that same state into a
 * one-off mail to the TL and the HOSS who sit in the sheet's approval chain, so
 * the hold-up is chased without anyone watching the board.
 *
 * The "running late" test mirrors generateTrackingValueProjection in
 * sparePartOrderTrackingController.js so the mail and the red cell always agree:
 * previous.inDate set, current.inDate unset, previous.inDate + leadTime <= now.
 */

/**
 * The stages that escalate, in chain order. `prevTimeStampField` and
 * `timeStampField` are changePart fields; `leadTimeKey` indexes plant.leadTime.
 * A stage whose allowance depends on the part rather than only on the plant
 * supplies `resolveLeadTime` instead — part receipt is timed by the part's
 * supplier category. Part Inspection does not apply to a "For use" part — it
 * is consumed on the machine and never inspected into stock — so it is
 * skipped for those.
 */
const ESCALATION_STAGES = [
  {
    key: "rsPOIssueToVendor",
    label: "PO Made",
    prevLabel: "PR assigned to all buyers",
    prevTimeStampField: "rsPRAssignToAllBuyersTimeStamp",
    timeStampField: "rsPOIssueToVendorTimeStamp",
    leadTimeKey: "PRAssignToAllBuyersToPOIssueToVendor",
  },
  {
    key: "rsPartReceive",
    label: "Part Receipt",
    prevLabel: "PO Made",
    prevTimeStampField: "rsPOIssueToVendorTimeStamp",
    timeStampField: "rsPartReceiveTimeStamp",
    // Local and imported parts carry their own allowance; the pre-split single
    // value is the fallback until a plant configures both.
    resolveLeadTime: (leadTime, part) =>
      partReceiveLeadTimeFor(leadTime, part?.supplierCategory),
  },
  {
    key: "rsPartInspection",
    label: "Part Inspection",
    prevLabel: "Part Receipt",
    prevTimeStampField: "rsPartReceiveTimeStamp",
    timeStampField: "rsPartInspectionTimeStamp",
    leadTimeKey: "partReceiveToPartInspection",
    skipForUse: true,
  },
];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const addDays = (date, days) => new Date(date.getTime() + days * MS_PER_DAY);

/**
 * The same condition the dashboard uses for a red cell. A lead time of 0 is
 * treated as "not configured" and never escalates: a plant that has not set its
 * lead times keeps every default at 0, and mailing on those would be noise, not
 * a real breach.
 */
const isRunningLate = (prevDate, currentDate, leadTimeDays, now) => {
  if (!prevDate || currentDate) return false;
  if (!(Number(leadTimeDays) > 0)) return false;
  return addDays(prevDate, Number(leadTimeDays)) <= now;
};

/**
 * The TL and HOSS the sheet was routed to, for its department (MTD/PRD). Only
 * slots that carry an email can be mailed; an unregistered slot is dropped and
 * logged, matching how the approval dropdowns tolerate a missing hierarchy.
 */
const resolveTLAndHOSSRecipients = (sheet) => {
  const department = sheet.partRequestFor === "PRD" ? "PRD" : "MTD";
  return [
    { role: "TL", slot: sheet[`approvalOf${department}_TL`] },
    { role: "HOSS", slot: sheet[`approvalOf${department}_HOSS`] },
  ]
    .map(({ role, slot }) => ({
      role,
      name: slot?.user?.tm_name,
      email: slot?.user?.email,
    }))
    .filter((recipient) => Boolean(recipient.email));
};

const dateToDate = (timeStamp) =>
  timeStamp?.inDate ? new Date(timeStamp.inDate) : null;

const hierarchy = (sheet) =>
  [
    sheet.plant?.plant_name,
    sheet.section?.section_name,
    sheet.cell?.cell_name,
    sheet.line?.line_name,
  ]
    .filter(Boolean)
    .join(" / ");

const machineText = (sheet) =>
  [sheet.machine?.machine_code, sheet.machine?.machine_name]
    .filter(Boolean)
    .join(" - ");

const trackingUrl = () =>
  `${baseUrl()}/spare/spareOrderingDashboard`;

const buildEscalationHtml = ({ sheet, part, stage, prevDate, recipients }) => {
  const greeting = recipients.map((r) => r.name).filter(Boolean).join(", ");
  const partText = [part.partName, part.partModel].filter(Boolean).join(" / ");

  return layout({
    title: `${stage.label} is overdue`,
    greeting: greeting || "Team",
    intro: `The <b>${escapeHtml(stage.label)}</b> step for spare part <b>${escapeHtml(partText || "-")}</b> on request sheet <b>${escapeHtml(sheet.requestSheetNo ?? "-")}</b> is pending. Its previous step (<b>${escapeHtml(stage.prevLabel)}</b>) is complete and the allowed lead time has passed, but <b>${escapeHtml(stage.label)}</b> has not been done yet. Please take the necessary action.`,
    body:
      sectionHeading("Pending step") +
      detailsTable([
        ["Request No", sheet.requestSheetNo],
        ["Part", partText],
        ["Pending step", stage.label],
        ["Previous step", `${stage.prevLabel} — completed on ${prevDate ? prevDate.toLocaleString("en-IN") : "-"}`],
        ["Department", sheet.partRequestFor],
        ["Hierarchy", hierarchy(sheet)],
        ["Machine", machineText(sheet)],
      ]),
    actionUrl: trackingUrl(),
    actionText: "Open Order Tracking",
  });
};

/**
 * Sends the escalation mail for one (sheet, part, stage) and records it so the
 * same overdue step is never mailed twice. Resolves true when a mail was sent.
 */
const escalateStage = async ({ sheet, part, stage, prevDate, now }) => {
  const recipients = resolveTLAndHOSSRecipients(sheet);
  if (!recipients.length) {
    logger.warn(
      `Spare order-tracking escalation ${sheet.requestSheetNo} / ${stage.label}: no TL or HOSS with an email`,
    );
    return false;
  }

  const sent = await sendSpareMail({
    to: recipients.map((r) => r.email),
    subject: `Overdue: ${stage.label} pending for spare request ${sheet.requestSheetNo ?? ""}`.trim(),
    html: buildEscalationHtml({ sheet, part, stage, prevDate, recipients }),
  });

  // Record only on success, so a transient mail failure is retried next run.
  if (sent)
    await RequestSheetOfSpare.updateOne(
      { _id: sheet._id, "changeParts._id": part._id },
      {
        $push: {
          "changeParts.$.leadTimeEscalationMails": {
            stage: stage.key,
            sentAt: now,
          },
        },
      },
    );

  return sent;
};

/**
 * Scans the sheets on the Order Tracking dashboard and escalates every stage
 * that is running late and has not been escalated before.
 */
const runOrderTrackingLeadTimeEscalationJob = async () => {
  const now = new Date();

  // leadTime is per plant; load them once and key by plant _id for the sheets.
  const plants = await Plant.find({}, { leadTime: 1 }).lean();
  const leadTimeByPlantId = new Map(
    plants.map((plant) => [String(plant._id), plant.leadTime ?? {}]),
  );

  // Only sheets on the dashboard (budget OK, or NG with HOD approval) that have
  // reached at least the first escalating stage's predecessor; the rest cannot
  // be late on any of these three steps.
  const candidates = await RequestSheetOfSpare.find({
    $or: [
      { "budget.budgetStatus": "OK" },
      {
        "budget.budgetStatus": "NG",
        "mtdHODApprovalIfBudgetIsNG.approvalStatus": "Accepted",
      },
    ],
    requestSheetStatus: { $ne: spareRejectedStatus },
    changeParts: {
      $elemMatch: { "rsPRAssignToAllBuyersTimeStamp.inDate": { $ne: null } },
    },
  })
    .select(
      "requestSheetNo partRequestFor newPartFor plant section cell line machine changeParts approvalOfMTD_TL approvalOfMTD_HOSS approvalOfPRD_TL approvalOfPRD_HOSS",
    )
    .lean();

  let sentCount = 0;
  let skippedCount = 0;

  for (const sheet of candidates) {
    const leadTime = leadTimeByPlantId.get(String(sheet.plant?._id)) ?? {};
    const isForUse = sheet.newPartFor === "For use";

    for (const part of sheet.changeParts ?? []) {
      const alreadyMailed = new Set(
        (part.leadTimeEscalationMails ?? []).map((entry) => entry.stage),
      );

      for (const stage of ESCALATION_STAGES) {
        if (stage.skipForUse && isForUse) continue;
        if (alreadyMailed.has(stage.key)) {
          skippedCount++;
          continue;
        }

        const prevDate = dateToDate(part[stage.prevTimeStampField]);
        const currentDate = dateToDate(part[stage.timeStampField]);

        // Part receipt resolves per part (supplier category); the other stages
        // read the plant's single allowance.
        const leadTimeDays = stage.resolveLeadTime
          ? stage.resolveLeadTime(leadTime, part)
          : leadTime?.[stage.leadTimeKey];

        if (!isRunningLate(prevDate, currentDate, leadTimeDays, now)) continue;

        try {
          if (await escalateStage({ sheet, part, stage, prevDate, now }))
            sentCount++;
        } catch (error) {
          logger.error(error, {
            spareOrderTrackingEscalation: sheet.requestSheetNo,
            partId: part._id,
            stage: stage.key,
          });
        }
      }
    }
  }

  logger.info(
    `Spare order-tracking escalation complete: ${sentCount} sent, ${skippedCount} already-sent`,
  );
  return { sentCount, skippedCount };
};

module.exports = {
  runOrderTrackingLeadTimeEscalationJob,
  // exposed for tests
  ESCALATION_STAGES,
  isRunningLate,
  resolveTLAndHOSSRecipients,
};
