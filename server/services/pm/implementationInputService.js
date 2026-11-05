/**
 * Input rules for recording PM work (/postImplementationWorkedData).
 *
 * Kept out of the route so the rules can be read, and tested, without a
 * database. The route used to trust the body: a bad value either reached
 * mongoose as a CastError or crashed on `undefined`, and the catch block then
 * answered nothing at all.
 */
const { jsonUploadErrors: jsonUploadErrorsFor } = require("../../utils/jsonUploadErrors");

const WORKED_ON_PM_VALUES = ["Yes", "No", "Rectify"];
const MONTH_KEYS = [
  "Apr", "May", "June", "July", "Aug", "Sep",
  "Oct", "Nov", "Dec", "Jan", "Feb", "Mar",
];
const MAX_PHOTO_MB = 5;

const isBlank = (value) => String(value ?? "").trim() === "";

/**
 * @returns {string|null} the first problem found, worded for the operator, or
 * null when the input is acceptable.
 */
const validateImplementationInput = (body = {}) => {
  const {
    workedOnPM,
    machineId,
    tableRowId,
    yearOfCheckSheet,
    monthForCompareSystemMonth,
    previousMonth,
    abnormalityRemarks,
    targetDate,
    spareParts,
    partName,
    partNo,
    cost,
  } = body;

  if (!WORKED_ON_PM_VALUES.includes(workedOnPM))
    return "Please select whether the PM was done (Yes / No / Rectify)";

  if (isBlank(machineId) || isBlank(tableRowId) || isBlank(yearOfCheckSheet))
    return "Machine, check sheet row and year are required";

  if (!MONTH_KEYS.includes(monthForCompareSystemMonth))
    return "A valid PM month is required";

  if (!MONTH_KEYS.includes(previousMonth))
    return "A valid previous month is required";

  if (workedOnPM !== "Yes" && isBlank(abnormalityRemarks))
    return "Please enter abnormality remarks";

  if (workedOnPM === "No" && isBlank(targetDate))
    return "Please select the target date";

  if (workedOnPM !== "Yes" && !["Yes", "No"].includes(spareParts))
    return "Please select spare part option";

  if (spareParts === "Yes") {
    if (isBlank(partName)) return "Please enter part name";
    if (isBlank(partNo)) return "Please enter part no";
    if (isBlank(cost) || !Number.isFinite(Number(cost)) || Number(cost) < 0)
      return "Please enter the cost as a number (INR)";
  }

  return null;
};

/** Multer failures as JSON; see utils/jsonUploadErrors.js. */
const jsonUploadErrors = (uploadMiddleware) =>
  jsonUploadErrorsFor(uploadMiddleware, {
    fileLabel: "Photo",
    maxMb: MAX_PHOTO_MB,
  });

module.exports = {
  WORKED_ON_PM_VALUES,
  MONTH_KEYS,
  MAX_PHOTO_MB,
  validateImplementationInput,
  jsonUploadErrors,
};
