const moment = require("moment-timezone");

/**
 * Shared CM frequency / scheduling date helpers.
 *
 * WHY THIS FILE EXISTS
 * The "next occurrence = base target date + frequency interval" rule was
 * implemented three times with the same semantics but three different pieces of
 * code:
 *   - middleware/findMachineDataForNewRequestSheetOfCM.js (creation-time expansion)
 *   - middleware/cronRunForRequestSheetOfCM.js            (monthly / yearly cron append)
 *   - controller/cmcontroller.js -> completeApproval()    (hardcoded for "1/3 M")
 *
 * This module is the single definition of that rule. It is intentionally pure
 * (no DB, no req/res) so it can be reused from a controller, a service, a cron
 * or a one-off script, and unit tested on its own.
 *
 * FREQUENCY FORMAT (unchanged, read from cmBasicDataFilledByMTD_TL.frequencyValue)
 *   "1/1 M" -> every 1 month      "1/Y"   -> every 1 year
 *   "1/3 M" -> every 3 months     "1/2 Y" -> every 2 years
 *   "1/6 M" -> every 6 months     "1/3 Y" -> every 3 years
 *                                 "1/4 Y" -> every 4 years
 *                                 "1/5 Y" -> every 5 years
 * Anything whose unit token is not "M" is treated as years, which is exactly
 * how the existing cron parses it.
 */

const TIMEZONE = "Asia/Kolkata";

// The on-disk format for every CM date string.
const CM_DATE_FORMAT = "YYYY-MM-DDTHH:mm";

// Occurrence statuses whose target date may still be moved. Mirrors the
// isEditHidden rule already enforced by the CM report grid on the client.
const CM_RESCHEDULABLE_STATUSES = ["Generated", "Assigned"];

/**
 * Parse a stored CM date into a moment anchored to Asia/Kolkata.
 *
 * Stored values are usually "YYYY-MM-DDTHH:mm" (no zone), but completeApproval()
 * historically stored a raw moment which Mongoose cast to a full ISO string, so
 * both shapes have to be accepted.
 *
 * Anchoring explicitly to Asia/Kolkata (rather than moment(value), which parses
 * in the server's local zone) keeps the wall-clock date stable no matter what
 * timezone the Node process runs in. On the IST production hosts this is
 * identical to the current behaviour; elsewhere it removes an off-by-one-day.
 */
const toCMMoment = (value) => {
  if (value === null || value === undefined || value === "") return null;

  const parsed = moment.tz(value, [CM_DATE_FORMAT, moment.ISO_8601], TIMEZONE);
  return parsed.isValid() ? parsed : null;
};

/** Format any date-ish value into the CM storage format. Returns null if unparseable. */
const formatCMDate = (value = new Date()) => {
  const parsed = toCMMoment(value);
  return parsed ? parsed.format(CM_DATE_FORMAT) : null;
};

/**
 * Split "1/3 M" into { amount: 3, unit: "months" }.
 * Returns null for One-time sheets, empty values and unparseable input.
 */
const parseFrequency = (frequencyValue) => {
  if (!frequencyValue || typeof frequencyValue !== "string") return null;

  const [interval, unitToken] = frequencyValue.trim().split(" ");
  if (!interval) return null;

  const rawAmount = interval.split("/")[1];
  if (!rawAmount) return null;

  // "1/Y" carries no number, and the existing cron reads it as 1 year.
  const amount = rawAmount === "Y" ? 1 : Number(rawAmount);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  return { amount, unit: unitToken === "M" ? "months" : "years" };
};

/** A sheet repeats only when it is not One-time and its frequency parses. */
const isRecurring = ({ frequencyType, frequencyValue } = {}) =>
  frequencyType !== "One-time" && parseFrequency(frequencyValue) !== null;

/**
 * The core scheduling rule: base target date + (interval x times).
 *
 * moment's month arithmetic clamps to the end of a shorter month, so
 * 31-Jan + 1 month = 28/29-Feb and 29-Feb + 1 year = 28-Feb. That is the
 * existing behaviour and is preserved deliberately.
 *
 * @returns {string|null} formatted date, or null if base/frequency is unusable
 */
const addFrequencyInterval = (baseDate, frequencyValue, times = 1) => {
  const base = toCMMoment(baseDate);
  const frequency = parseFrequency(frequencyValue);

  if (!base || !frequency || !Number.isFinite(times) || times < 1) return null;

  return base
    .clone()
    .add(frequency.amount * times, frequency.unit)
    .format(CM_DATE_FORMAT);
};

/**
 * Move a dependent date so that its distance from its anchor is preserved.
 *
 * Used for activityEndDateOfCM, which is created as "target date + N days".
 * When the target date moves, the activity window has to move with it or the
 * end date can land before the start date.
 */
const shiftPreservingDuration = ({ oldAnchor, newAnchor, dependentDate }) => {
  const oldAnchorMoment = toCMMoment(oldAnchor);
  const newAnchorMoment = toCMMoment(newAnchor);
  const dependentMoment = toCMMoment(dependentDate);

  if (!oldAnchorMoment || !newAnchorMoment || !dependentMoment) return null;

  const offsetInMinutes = dependentMoment.diff(oldAnchorMoment, "minutes");

  return newAnchorMoment
    .clone()
    .add(offsetInMinutes, "minutes")
    .format(CM_DATE_FORMAT);
};

module.exports = {
  TIMEZONE,
  CM_DATE_FORMAT,
  CM_RESCHEDULABLE_STATUSES,
  toCMMoment,
  formatCMDate,
  parseFrequency,
  isRecurring,
  addFrequencyInterval,
  shiftPreservingDuration,
};
