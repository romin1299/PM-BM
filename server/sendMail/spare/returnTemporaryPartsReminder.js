const cron = require("node-cron");
const moment = require("moment");
const nodemailer = require("nodemailer");
const SpareIssuanceSummary = require("../../model/spareIssuanceSummarySchema");
const EmailConfigurationController = require("../../controller/emailConfigurationController");
const logger = require("../../utils/LoggingController/loggers");

const REMINDER_LEVELS = [
  { level: 1, daysAfterTarget: 1, recipientRole: "user" },
  { level: 2, daysAfterTarget: 3, recipientRole: "hoss" },
  { level: 3, daysAfterTarget: 5, recipientRole: "hos" },
  { level: 4, daysAfterTarget: 7, recipientRole: "hod" },
];

const REMINDER_COPY = {
  1: {
    subject: "Reminder: Please return the borrowed spare part",
    message: "Kindly return the borrowed spare part at the earliest.",
  },
  2: {
    subject: "Escalation: Overdue spare part return (3 days)",
    message:
      "This part is now 3 days overdue. Please follow up with the concerned user.",
  },
  3: {
    subject: "Escalation: Overdue spare part return (5 days)",
    message: "This part is now 5 days overdue and requires your attention.",
  },
  4: {
    subject: "Final Escalation: Overdue spare part return (7 days)",
    message: "This part is now 7 days overdue. Immediate action required.",
  },
};

function resolveRecipientEmail(reminderLevel, doc) {
  const email = doc.reminderEmails?.[reminderLevel - 1];

  if (!email) {
    logger.error(`No reminderEmails[${reminderLevel - 1}] found on document`, {
      spareIssuanceId: doc._id,
    });
    return null;
  }

  return email;
}

let cachedTransporter = null;
let cachedHost = null;

async function getTransporter() {
  const emailConfData = await EmailConfigurationController();

  if (cachedTransporter && cachedHost === emailConfData.serverIP) {
    return { transporter: cachedTransporter, emailConfData };
  }

  cachedTransporter = nodemailer.createTransport({
    host: emailConfData.serverIP,
    port: emailConfData.emailPort,
    secure: false,
    pool: true,
    maxConnections: 3,
  });
  cachedHost = emailConfData.serverIP;

  return { transporter: cachedTransporter, emailConfData };
}

function buildReminderHtml({ copy, part }) {
  return `
    <!doctype html>
    <html lang="en-US">
    <head><meta content="text/html; charset=utf-8" http-equiv="Content-Type" /></head>
    <body style="margin:0; background-color:#F2F3F8; font-family:'Open Sans',sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="text-align:center;"><h1>DENSO-PM</h1></td></tr>
        <tr>
          <td>
            <table width="95%" align="center" style="background:#fff; border-radius:3px; box-shadow:0 6px 18px 0 rgba(0,0,0,.06);">
              <tr><td style="height:40px;">&nbsp;</td></tr>
              <tr>
                <td style="padding:0 35px;">
                  <h3>Dear Sir/Mam,</h3>
                  <p>${copy.message}</p>
                  <p><strong>Part:</strong> ${part.partName || "-"} (${part.partModel || "-"})</p>
                  <p><strong>Target Return Date:</strong> ${part.returnTargetDateIfTemporary?.inString || "-"}</p>
                </td>
              </tr>
              <tr><td style="height:40px;">&nbsp;</td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="text-align:center;">
            <a href="${process.env.BASE_URL}" style="font-size:14px; color:black;">
              <strong>${process.env.BASE_URL}</strong>
            </a>
          </td>
        </tr>
        <tr>
          <td style="text-align:center;">
            <p style="font-size:14px; color:black;">&copy; <strong>All Rights Reserved By DENSO(DNHA)</strong></p>
          </td>
        </tr>
      </table>
    </body>
    </html>`;
}

async function sendReturnReminderMail({ to, part, doc, reminderLevel }) {
  const { transporter, emailConfData } = await getTransporter();
  const copy = REMINDER_COPY[reminderLevel];

  const mailOptions = {
    from: emailConfData.fromEmailId,
    to,
    subject: copy.subject,
    html: buildReminderHtml({ copy, part }),
  };

  const info = await transporter.sendMail(mailOptions);
  logger.info(`Reminder level ${reminderLevel} sent: ${info.response}`, {
    spareIssuanceId: doc._id,
    partId: part._id,
  });
}

async function runSpareReturnReminderJob() {
  const today = moment().startOf("day");
  const earliestTargetDate = today.clone().subtract(7, "days").toDate();
  const latestTargetDate = today.clone().subtract(1, "days").toDate();

  const candidates = await SpareIssuanceSummary.find({
    changeParts: {
      $elemMatch: {
        temporaryOrPermanent: "Temporary",
        closingStatusIfTemporary: "Open",
        "returnTargetDateIfTemporary.inDate": {
          $gte: earliestTargetDate,
          $lte: latestTargetDate,
        },
      },
    },
  })
    .select("changeParts requestedDepartment createdBy reminderEmails")
    .lean();

  let sentCount = 0;
  let skippedCount = 0;

  for (const doc of candidates) {
    for (const part of doc.changeParts) {
      if (
        part.temporaryOrPermanent !== "Temporary" ||
        part.closingStatusIfTemporary !== "Open" ||
        !part.returnTargetDateIfTemporary?.inDate
      ) {
        continue;
      }

      const daysOverdue = today.diff(
        moment(part.returnTargetDateIfTemporary.inDate).startOf("day"),
        "days",
      );

      const reminder = REMINDER_LEVELS.find(
        (r) => r.daysAfterTarget === daysOverdue,
      );
      if (!reminder) continue;

      const alreadySent = (part.reminderTracking || []).some(
        (r) => r.level === reminder.level,
      );
      if (alreadySent) {
        skippedCount++;
        continue;
      }

      try {
        const recipientEmail = resolveRecipientEmail(reminder.level, doc);
        if (!recipientEmail) continue;

        await sendReturnReminderMail({
          to: recipientEmail,
          part,
          doc,
          reminderLevel: reminder.level,
        });

        await SpareIssuanceSummary.updateOne(
          { _id: doc._id, "changeParts._id": part._id },
          {
            $push: {
              "changeParts.$.reminderTracking": {
                level: reminder.level,
                sentAt: new Date(),
              },
            },
          },
        );
        sentCount++;
      } catch (err) {
        logger.error(err, { spareIssuanceId: doc._id, partId: part._id });
      }
    }
  }

  logger.info(
    `Return reminder job complete: ${sentCount} sent, ${skippedCount} already-sent`,
  );
}

cron.schedule("0 9 * * *", () => {
  runSpareReturnReminderJob().catch((err) => logger.error(err));
});

module.exports = cron;
