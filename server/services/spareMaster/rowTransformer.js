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
 * The streaming reader returns dates as raw Excel serials where the buffered
 * reader would have returned Date objects, so both shapes have to be accepted.
 */
const toDate = (value) => {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return value;

  if (typeof value === "number") {
    if (!Number.isFinite(value) || value <= 0) return null;
    return new Date(Math.round((value - EXCEL_EPOCH_OFFSET_DAYS) * MS_PER_DAY));
  }

  const parsed = moment(value, [moment.ISO_8601, "DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"], true);
  return parsed.isValid() ? parsed.toDate() : null;
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
 * hand-written assignment in the document literal below.
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
];

const DATE_FIELDS = ["lastIssuedDate", "previousIssuedDate"];

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

const LEGACY_DATE_FIELDS = ["changedOn"];

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
  assign(legacyRef, LEGACY_DATE_FIELDS, raw, toDate);
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

  const createDate = toDate(raw.createDate);

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
    notes,
  };
};

module.exports = { transformRow, toDate, toNumber, toText };
