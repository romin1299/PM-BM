const nodemailer = require("nodemailer");
const EmailConfigurationController = require("../../controller/emailConfigurationController");
const logger = require("../../utils/LoggingController/loggers");

/**
 * One transporter and one page layout for every mail the Spare module sends,
 * so a sender only supplies the recipient, the subject and the body of the
 * card. Configuration comes from the stored EmailConfigurations document, as
 * the other senders read it.
 */

let cachedTransporter = null;
let cachedHost = null;

const getTransporter = async () => {
  const emailConfData = await EmailConfigurationController();
  if (!emailConfData?.serverIP)
    throw new Error("Email configuration is missing");

  if (!cachedTransporter || cachedHost !== emailConfData.serverIP) {
    cachedTransporter = nodemailer.createTransport({
      service: "smtp-mail.outlook.com",
      host: emailConfData.serverIP,
      port: emailConfData.emailPort,
      secure: false,
      pool: true,
      maxConnections: 3,
      tls: {
        ciphers: "SSLv3",
      },
    });
    cachedHost = emailConfData.serverIP;
  }

  return { transporter: cachedTransporter, emailConfData };
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** A value as it goes into a cell: escaped, "-" when there is nothing. */
const cell = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  return escapeHtml(value);
};

const CELL_STYLE = "border:1px solid #d9d9d9;padding:6px 10px;font-size:13px;";
const HEAD_STYLE = `${CELL_STYLE}background:#eef3fa;text-align:left;font-weight:600;`;

/** Two-column label / value table. */
const detailsTable = (rows) => `
  <table cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;margin:8px 0 16px;">
    ${rows
      .map(
        ([label, value]) => `
      <tr>
        <th style="${HEAD_STYLE}width:38%;">${escapeHtml(label)}</th>
        <td style="${CELL_STYLE}">${cell(value)}</td>
      </tr>`,
      )
      .join("")}
  </table>`;

/** Column table with a header row. */
const gridTable = (headers, rows) => `
  <table cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;margin:8px 0 16px;">
    <tr>${headers.map((h) => `<th style="${HEAD_STYLE}">${escapeHtml(h)}</th>`).join("")}</tr>
    ${rows
      .map(
        (row) =>
          `<tr>${row.map((value) => `<td style="${CELL_STYLE}">${cell(value)}</td>`).join("")}</tr>`,
      )
      .join("")}
  </table>`;

const sectionHeading = (text) =>
  `<h4 style="margin:18px 0 4px;font-size:15px;color:#1e1e2d;">${escapeHtml(text)}</h4>`;

const baseUrl = () => String(process.env.BASE_URL ?? "").replace(/\/+$/, "");

const layout = ({ title, greeting, intro, body, actionUrl, actionText }) => `
<!doctype html>
<html lang="en-US">
<head><meta content="text/html; charset=utf-8" http-equiv="Content-Type" /></head>
<body style="margin:0;background-color:#F2F3F8;font-family:'Open Sans',Arial,sans-serif;color:#1e1e2d;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="text-align:center;"><h1 style="margin:24px 0 12px;">DENSO-IMOPS Spare</h1></td></tr>
    <tr>
      <td>
        <table width="95%" align="center" cellpadding="0" cellspacing="0"
          style="max-width:720px;background:#fff;border-radius:3px;box-shadow:0 6px 18px 0 rgba(0,0,0,.06);">
          <tr><td style="height:28px;">&nbsp;</td></tr>
          <tr>
            <td style="padding:0 35px;">
              <h3 style="margin:0 0 12px;">Dear ${escapeHtml(greeting)},</h3>
              <h3 style="text-align:center;font-weight:500;margin:0;font-size:20px;">${escapeHtml(title)}</h3>
              <div style="text-align:center;"><span style="display:inline-block;margin:10px 0 18px;border-bottom:1px solid #CECECE;width:100px;"></span></div>
              <p style="font-size:14px;line-height:22px;">${intro}</p>
              ${body}
              ${
                actionUrl
                  ? `<p style="text-align:center;margin:24px 0 8px;">
                       <a href="${escapeHtml(actionUrl)}" target="_blank"
                          style="background:#1e6fd9;color:#fff;text-decoration:none;padding:10px 22px;border-radius:4px;font-size:14px;display:inline-block;">
                         ${escapeHtml(actionText ?? "Open request sheet")}
                       </a>
                     </p>`
                  : ""
              }
            </td>
          </tr>
          <tr><td style="height:28px;">&nbsp;</td></tr>
        </table>
      </td>
    </tr>
    <tr><td style="height:16px;">&nbsp;</td></tr>
    <tr>
      <td style="text-align:center;">
        <a href="${escapeHtml(baseUrl())}" target="_blank" style="font-size:14px;color:black;"><strong>${escapeHtml(baseUrl())}</strong></a>
      </td>
    </tr>
    <tr>
      <td style="text-align:center;">
        <p style="font-size:13px;color:black;">This is an automated message from IMOPS; please do not reply.</p>
        <p style="font-size:14px;color:black;">&copy; <strong>All Rights Reserved By DENSO(DNHA)</strong></p>
      </td>
    </tr>
    <tr><td style="height:40px;">&nbsp;</td></tr>
  </table>
</body>
</html>`;

/**
 * Sends one mail. Resolves true when accepted by the server, false otherwise;
 * a failure is logged rather than thrown, because no request should fail for
 * want of a notification.
 */
const sendSpareMail = async ({ to, cc, subject, html }) => {
  const recipients = [].concat(to).filter(Boolean);
  if (!recipients.length) {
    logger.warn(`Spare mail "${subject}" not sent: no recipient`);
    return false;
  }

  try {
    const { transporter, emailConfData } = await getTransporter();
    const info = await transporter.sendMail({
      from: emailConfData.fromEmailId,
      to: recipients.join(", "),
      ...(cc?.length ? { cc: [].concat(cc).filter(Boolean).join(", ") } : {}),
      subject,
      html,
    });
    logger.info(
      `Spare mail sent: "${subject}" -> ${recipients.join(", ")} (${info?.response ?? "ok"})`,
    );
    return true;
  } catch (error) {
    logger.error(error, { spareMail: subject, to: recipients });
    return false;
  }
};

module.exports = {
  sendSpareMail,
  layout,
  detailsTable,
  gridTable,
  sectionHeading,
  escapeHtml,
  baseUrl,
};
