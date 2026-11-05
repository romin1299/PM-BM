/**
 * Rules for the per-cell inventory target (Each Cell Wise Inventory
 * Bifurcation). Kept apart from the handler so they read, and test, without a
 * database.
 */
const mongoose = require("mongoose");

const MONTHS_IN_YEAR = 12;
const FINANCIAL_YEAR_PATTERN = /^(\d{4})-(\d{4})$/;

/** @returns {string|null} what is wrong with the input, or null when it is fine. */
const validateCellTargetInput = ({ selectedYear, cellId, target }) => {
  const match = FINANCIAL_YEAR_PATTERN.exec(String(selectedYear ?? ""));
  if (!match || Number(match[2]) !== Number(match[1]) + 1)
    return "Please select a valid financial year";

  if (!mongoose.isValidObjectId(cellId)) return "Please select a cell";

  if (!Array.isArray(target) || target.length !== MONTHS_IN_YEAR)
    return "A target is needed for each of the 12 months";

  const bad = target.findIndex(
    (value) =>
      value === null ||
      value === "" ||
      !Number.isFinite(Number(value)) ||
      Number(value) < 0,
  );
  if (bad !== -1)
    return `Target for month ${bad + 1} must be a number, zero or more`;

  return null;
};

/** Targets as numbers, ready to store. */
const normalizedTarget = (target) => target.map((value) => Number(value));

module.exports = {
  MONTHS_IN_YEAR,
  validateCellTargetInput,
  normalizedTarget,
};
