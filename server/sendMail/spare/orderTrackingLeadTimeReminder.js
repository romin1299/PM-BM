const cron = require("node-cron");
const logger = require("../../utils/LoggingController/loggers");
const {
  runOrderTrackingLeadTimeEscalationJob,
} = require("../../services/spare/orderTrackingLeadTimeEscalationService");

/**
 * Runs the Order Tracking lead-time escalation once a day (08:00), the same
 * shape as returnTemporaryPartsReminder: a thin scheduler over a service that
 * holds the logic. Registered on one process only (see app.js), so the mail is
 * never duplicated across cluster workers.
 */
cron.schedule("0 8 * * *", () => {
  runOrderTrackingLeadTimeEscalationJob().catch((error) => logger.error(error));
});

module.exports = cron;
