const { SPARE_MASTER_COLUMNS } = require("./columnMapping");

/**
 * Validates a transformed row before it is queued for writing.
 *
 * Returns every problem it finds rather than the first, so one pass over a file
 * tells the Tool Room everything that needs correcting instead of surfacing one
 * error per re-run. Each issue names the Excel row, the column and the offending
 * value, which is what makes the result actionable against the source file.
 */

const NON_NEGATIVE_NUMERIC_FIELDS = [
  { field: "leadTime", column: "LeadTime" },
  { field: "minQuantity", column: "MinOrder" },
  { field: "maxQuantity", column: "MaxStock" },
];

const columnFor = (canonical) => SPARE_MASTER_COLUMNS[canonical]?.aliases?.[0] ?? canonical;

/** Date columns; each lands on the master under its own canonical name. */
const DATE_FIELDS = ["createDate", "changeDate", "lastIssuedDate", "previousIssuedDate"];

const isBlank = (value) => value === null || value === undefined || String(value).trim() === "";

const validateRow = ({ excelRow, document, costDetails, currency, raw }) => {
  const errors = [];
  const warnings = [];

  const fail = (column, value, message) =>
    errors.push({ excelRow, column, value: value ?? null, message });
  const warn = (column, value, message) =>
    warnings.push({ excelRow, column, value: value ?? null, message });

  if (!document.location)
    fail(
      columnFor("location"),
      raw.location,
      "Location (PartsNumber) is required and is the key used to match existing masters",
    );

  if (!document.partName)
    fail(columnFor("partName"), raw.partName, "Part name is required");

  // A date that was written but could not be read would otherwise be dropped
  // without a trace, and CreateDate decides the master's place in the id sequence.
  DATE_FIELDS.forEach((canonical) => {
    if (!isBlank(raw[canonical]) && !document[canonical])
      warn(columnFor(canonical), raw[canonical],
        "Date could not be read (expected e.g. 17-05-2025 08:28:00 or 17-05-2025); it was left blank");
  });

  NON_NEGATIVE_NUMERIC_FIELDS.forEach(({ field, column }) => {
    const value = document[field];
    if (value === null || value === undefined) return;
    if (!Number.isFinite(value)) fail(column, raw[field], "Value is not a valid number");
    else if (value < 0) fail(column, value, "Value cannot be negative");
  });

  if (
    Number.isFinite(document.minQuantity) &&
    Number.isFinite(document.maxQuantity) &&
    document.minQuantity > document.maxQuantity
  )
    warn("MinOrder / MaxStock", `${document.minQuantity} / ${document.maxQuantity}`,
      "Minimum quantity is greater than maximum quantity");

  const tranche = costDetails?.[0];

  if (tranche) {
    if (!Number.isFinite(tranche.quantity) || tranche.quantity < 0)
      fail("Quantity1", tranche.quantity, "Stock quantity is not a valid non-negative number");
    if (!Number.isFinite(tranche.costInINR) || tranche.costInINR < 0)
      fail("UnitPrice in INR", tranche.costInINR, "Cost in INR is not a valid non-negative number");

    if (tranche.quantity === 0)
      warn("Quantity1", 0, "Part is imported with zero opening stock");
    if (tranche.costInINR === 0)
      warn("UnitPrice in INR", 0, "Part is imported with zero cost");
  }

  /**
   * The legacy file states both the native price and the INR price alongside the
   * rate, so the three can be checked against each other. A row that disagrees
   * means the export is internally inconsistent and its cost cannot be trusted.
   */
  const { unitPrice, unitPriceInINR, currencyRate } = {
    unitPrice: tranche?.cost,
    unitPriceInINR: tranche?.costInINR,
    currencyRate: currency?.currencyRate,
  };

  if ([unitPrice, unitPriceInINR, currencyRate].every(Number.isFinite) && currencyRate > 0) {
    const expected = unitPrice * currencyRate;
    const tolerance = Math.max(0.02, Math.abs(unitPriceInINR) * 0.001);
    if (Math.abs(expected - unitPriceInINR) > tolerance)
      fail("UnitPrice in INR", unitPriceInINR,
        `Does not match UnitPrice1 (${unitPrice}) x CurrencyRate (${currencyRate}) = ${expected.toFixed(2)}`);
  }

  return { errors, warnings };
};

module.exports = { validateRow };
