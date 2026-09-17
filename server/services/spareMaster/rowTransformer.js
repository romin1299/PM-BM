const moment = require("moment-timezone");

const { generateTimestampIndividually } = require("../../utils/spareTimestamp");
const { resolveMachine, buildHierarchy } = require("./referenceResolver");

/**
 * Turns one mapped Excel row into a candidate SpareMaster document.
 *
 * Pure: it reads the preloaded reference caches and returns a document plus notes,
 * and touches neither the database nor the file. That keeps the legacy-shape
 * knowledge in one testable place and lets the importer decide what to do with a
 * row that only partly resolved.
 */

const EXCEL_EPOCH_OFFSET_DAYS = 25569; // days between 1899-12-30 and 1970-01-01
const MS_PER_DAY = 86400000;

/**
 * Text dates as the legacy export writes them: "17-05-2025 08:28:00",
 * "17-05-2025", "17/05/2025 08:28", optionally with AM/PM; year-first
 * "2025-05-17 08:28:00" is accepted too. Read in the server's local time, which
 * is the time the export shows.
 */
const TIME_PART = String.raw`(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AP]M)?)?`;
const DAY_FIRST = new RegExp(String.raw`^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})${TIME_PART}$`, "i");
const YEAR_FIRST = new RegExp(String.raw`^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})${TIME_PART}$`, "i");

const buildLocalDate = ({ year, month, day, hour = 0, minute = 0, second = 0, meridiem }) => {
  let hours = hour;
  if (meridiem) {
    if (hours < 1 || hours > 12) return null;
    hours = (hours % 12) + (meridiem.toUpperCase() === "PM" ? 12 : 0);
  }

  const date = new Date(year, month - 1, day, hours, minute, second);
  // A rolled-over date ("31-02-2025" becoming 3 March) is rejected, not kept.
  const intact =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day &&
    date.getHours() === hours &&
    date.getMinutes() === minute &&
    date.getSeconds() === second;
  return intact ? date : null;
};

const parseTextDate = (text) => {
  const num = (part) => (part === undefined ? undefined : Number(part));

  const dayFirst = text.match(DAY_FIRST);
  if (dayFirst) {
    const [, a, b, year, hour, minute, second, meridiem] = dayFirst;
    const time = { year: num(year), hour: num(hour), minute: num(minute), second: num(second), meridiem };
    // Day first, as the export writes it; month first only when that cannot be
    // what was meant (a "month" above 12).
    return (
      buildLocalDate({ ...time, day: num(a), month: num(b) }) ??
      buildLocalDate({ ...time, day: num(b), month: num(a) })
    );
  }

  const yearFirst = text.match(YEAR_FIRST);
  if (yearFirst) {
    const [, year, month, day, hour, minute, second, meridiem] = yearFirst;
    return buildLocalDate({
      year: num(year), month: num(month), day: num(day),
      hour: num(hour), minute: num(minute), second: num(second), meridiem,
    });
  }

  const iso = moment(text, moment.ISO_8601, true);
  return iso.isValid() ? iso.toDate() : null;
};

/**
 * Excel has no time zone: a cell holding "06-05-2013 14:17" is handed over as
 * 14:17 UTC. Re-read as 14:17 local so what is stored — and shown back in
 * dateTime.inString — is the time the sheet shows, the same as a text date.
 */
const fromExcelWallTime = (date) =>
  new Date(
    date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),
    date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(),
  );

/**
 * The streaming reader returns dates as raw Excel serials where the buffered
 * reader would have returned Date objects, and a column typed as text in the
 * source arrives as a string, so all three shapes have to be accepted.
 */
const toDate = (value) => {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return fromExcelWallTime(value);

  if (typeof value === "number") {
    if (!Number.isFinite(value) || value <= 0) return null;
    return fromExcelWallTime(
      new Date(Math.round((value - EXCEL_EPOCH_OFFSET_DAYS) * MS_PER_DAY)),
    );
  }

  const text = String(value).trim();
  return text ? parseTextDate(text) : null;
};

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const num = typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
  return Number.isFinite(num) ? num : null;
};

const toText = (value) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim().replace(/\s+/g, " ");
  return text === "" ? null : text;
};

/**
 * The legacy master holds five cost columns per part; the current schema holds a
 * FIFO tranche array. One imported part becomes exactly one opening tranche.
 *
 * `partId` is deliberately absent: real tranches carry the request-sheet part id
 * that receipt and issuance key on, and imported opening stock has no sheet.
 * Inventing an id would create a reference to a part that does not exist, so the
 * field is left unset pending the client decision on how opening stock should be
 * identified.
 */
const buildOpeningCostTranche = (raw) => {
  const quantity = toNumber(raw.stockQuantity) ?? 0;
  const cost = toNumber(raw.unitPrice) ?? 0;
  const costInINR = toNumber(raw.unitPriceInINR) ?? 0;

  return {
    quantity,
    currencyUnit: toText(raw.currencyUnit) || "INR",
    cost,
    costInINR,
    issuedQty: 0,
    issuedCost: 0,
    balanceQty: 0,
    availableQty: quantity,
    overAllCost: quantity * costInINR,
  };
};

/**
 * Canonical field -> master field, grouped by the conversion each needs. Kept as
 * data so a newly mapped column is added in one line here rather than another
 * hand-written assignment in the document literal below. Every column in
 * columnMapping lands somewhere: these lists, costDetails[0], the machine block,
 * or legacyRef.
 */
const TEXT_FIELDS = [
  "partNumber",
  "partName",
  "partModel",
  "partGroup",
  "maker",
  "supplierName",
  "unit",
  "registerSection",
  "orderType",
  "controlType",
  "stockTaking",
  "remarks",
];

const NUMBER_FIELDS = [
  "leadTime",
  "minQuantity",
  "maxQuantity",
  "orderPoint",
  "orderQty",
  "totalIssuedQty",
  "secondaryTotalIssuedQty",
  "currencyRate",
];

const DATE_FIELDS = ["createDate", "changeDate", "lastIssuedDate", "previousIssuedDate"];

const LEGACY_TEXT_FIELDS = [
  "supplierCode",
  "makerCode",
  "unitCode",
  "currencyCode",
  "sectionCode",
  "mcSectionCode",
  "mcSectionName",
  "drawingYN",
  "drawingPrintYN",
  "subPartsSwitch",
];

const LEGACY_NUMBER_FIELDS = ["secondaryUnitPrice", "drawingPrintQty"];

const assign = (target, fields, raw, convert) => {
  fields.forEach((field) => {
    const value = convert(raw[field]);
    if (value !== null) target[field] = value;
  });
};

const transformRow = ({ raw, references }) => {
  const notes = [];

  const equipmentCodes = [raw.equipment1, raw.equipment2, raw.equipment3]
    .map(toText)
    .filter(Boolean);

  const machineName = toText(raw.machineName);

  const document = {};

  assign(document, TEXT_FIELDS, raw, toText);
  assign(document, NUMBER_FIELDS, raw, toNumber);
  assign(document, DATE_FIELDS, raw, toDate);

  const legacyRef = {};
  assign(legacyRef, LEGACY_TEXT_FIELDS, raw, toText);
  assign(legacyRef, LEGACY_NUMBER_FIELDS, raw, toNumber);
  // The source's machine columns as written, independent of resolution.
  if (machineName) legacyRef.machineName = machineName;
  if (equipmentCodes.length) legacyRef.equipmentCodes = equipmentCodes;
  if (Object.keys(legacyRef).length) document.legacyRef = legacyRef;

  // Equipment2 / Equipment3 are recorded as codes only and never resolved — a
  // part serving several machines still belongs to one place in the hierarchy.
  const additionalMachineCodes = equipmentCodes.slice(1);
  if (additionalMachineCodes.length)
    document.additionalMachineCodes = additionalMachineCodes;

  const { machine, matchedBy, reason } = resolveMachine(references, {
    machineName,
    equipmentCodes,
  });

  if (machine) {
    const { hierarchy, isComplete, missingAt } = buildHierarchy(references, machine);
    Object.assign(document, hierarchy);
    if (!isComplete)
      notes.push({
        type: "incompleteHierarchy",
        message: `Machine "${machine.machine_code}" resolved but its hierarchy stops at ${missingAt}`,
      });
    notes.push({ type: "machineMatched", message: `Machine matched by ${matchedBy}` });
  } else {
    // Keep what the legacy file knew rather than dropping it, but attach no _id:
    // an unmatched name must not become a reference to the wrong machine.
    if (equipmentCodes[0] || machineName)
      document.machine = {
        machine_code: equipmentCodes[0] || null,
        machine_name: machineName || null,
      };
    notes.push({ type: "unresolvedMachine", message: reason });
  }

  const createDate = document.createDate ?? null;

  document.dateTime = {
    inString: moment(createDate ?? undefined).format("YYYY-MM-DDTHH:mm"),
    inDate: createDate ?? new Date(),
  };
  document.rsTimeStamp = generateTimestampIndividually(createDate ?? undefined);

  return {
    document,
    costDetails: [buildOpeningCostTranche(raw)],
    currency: {
      currencyUnit: toText(raw.currencyUnit),
      currencyRate: toNumber(raw.currencyRate),
    },
    hasMachine: Boolean(machine),
    // The source's own creation date, null when the cell was blank. The id
    // sequence is ordered by it, so it is exposed as parsed rather than as the
    // "now" that dateTime falls back to.
    createDate,
    // What the row said about its machine, for the unresolved-machine report.
    machineSource: { machineName, equipmentCodes },
    notes,
  };
};

module.exports = { transformRow, toDate, toNumber, toText };
