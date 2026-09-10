const moment = require("moment-timezone");

const RequestSheetOfSpare = require("../../model/requestSheetDataOfSpare");
const Line = require("../../model/lineSchema");
const {
  spareApprovalStatus,
} = require("../../utils/spareManagementUtils");
const {
  generateTimestampIndividually,
  generateTimeStampWithBothFormat,
} = require("../../utils/spareTimestamp");

/**
 * Reorder request-sheet generation.
 *
 * Extracted from the issuance flow so the same rules serve both callers:
 * issuance, which reorders one master after its stock is deducted, and the bulk
 * scan, which sweeps the whole master catalogue.
 *
 * The original logic could only build a reorder sheet by cloning an earlier
 * request sheet for that master. Masters loaded from the legacy Excel have never
 * had a request sheet, so that path found no source and silently did nothing —
 * which is why an imported catalogue never reorders. The service keeps the clone
 * as the preferred route, because a real sheet carries context the master does
 * not, and falls back to building from the master when there is none.
 */

const REORDER = "REORDER";
const COMPLETED_STATUS = spareApprovalStatus[spareApprovalStatus.length - 1];

/** Sum of stock still on hand across the FIFO tranches. */
const availableQtyOf = (master) =>
  (master?.costDetails ?? []).reduce(
    (sum, tranche) => sum + (tranche?.availableQty ?? 0),
    0,
  );

/**
 * A part is due for reorder when what is left on hand has fallen to its minimum.
 * Kept as one predicate so the issuance trigger and the bulk scan can never drift
 * apart on what "below minimum" means.
 */
const isBelowReorderLevel = (master) =>
  availableQtyOf(master) <= (master?.minQuantity ?? 0);

/**
 * Order enough to bring the part back up to its maximum stock level.
 * Returns 0 when there is nothing to top up, which the callers treat as "no sheet
 * to raise" rather than creating an order for zero parts.
 */
const reorderQuantityFor = (master) =>
  Math.max(0, (master?.maxQuantity ?? 0) - availableQtyOf(master));

/**
 * The unit price to carry onto the sheet: the most recent tranche that actually
 * has a price. Older tranches are kept because a part's price changes over time
 * and the newest is the best estimate for the next order.
 */
const approxUnitPriceOf = (master) => {
  const priced = (master?.costDetails ?? []).filter(
    (tranche) => (tranche?.costInINR ?? 0) > 0,
  );
  return priced.length ? priced[priced.length - 1].costInINR : 0;
};

/**
 * MTD or PRD, read off the master's register section ("MTD", "PRD-ECU(Direct)",
 * …). The field is free text from the legacy system, so anything that is not
 * recognisably PRD stays on the MTD default the schema already declares.
 */
const partRequestForOf = (master) =>
  String(master?.registerSection ?? "")
    .trim()
    .toUpperCase()
    .startsWith("PRD")
    ? "PRD"
    : "MTD";

/**
 * An open reorder is one that has not yet been received all the way through MRN
 * approval. Raising a second sheet while one is still in flight would double the
 * order, so this is the guard both callers use.
 */
const openReorderFilterFor = (masterIds = []) => ({
  newOrReOrderRequest: REORDER,
  changeParts: {
    $elemMatch: {
      masterId: { $in: masterIds },
      $or: [
        { "rsMRNApprovedTimeStamp.inString": { $exists: false } },
        { "rsMRNApprovedTimeStamp.inString": null },
        { "rsMRNApprovedTimeStamp.inString": "" },
      ],
    },
  },
});

const findMastersWithOpenReorder = async (masterIds = []) => {
  if (!masterIds.length) return new Set();

  const sheets = await RequestSheetOfSpare.find(
    openReorderFilterFor(masterIds),
    { "changeParts.masterId": 1 },
  ).lean();

  const open = new Set();
  sheets.forEach((sheet) =>
    (sheet.changeParts ?? []).forEach((part) => {
      if (part?.masterId) open.add(String(part.masterId));
    }),
  );
  return open;
};

const changePartFromMaster = (master) => ({
  masterId: master._id,
  partName: master.partName,
  partModel: master.partModel,
  minQuantity: master.minQuantity,
  maxQuantity: master.maxQuantity,
  quantityRequired: reorderQuantityFor(master),
  maker: master.maker,
  supplierName: master.supplierName,
  supplierCategory: master.supplierCategory,
  approxUnitPrice: approxUnitPriceOf(master),
});

/**
 * Request-sheet numbers are `<2-letter section>-<line>-<month>-SPARE-<n>`, where
 * n comes from a per-line counter. A master with no resolved line therefore
 * cannot be numbered at all, and would also be invisible to every
 * hierarchy-filtered dashboard, so those are reported instead of guessed at.
 */
const canBuildSheetNumber = (master) =>
  Boolean(master?.line?.line_name && (master?.section?.section_name || master?.subSection?.subSection_name));

const sheetNoPrefixOf = (master) =>
  (master?.section?.dashboardLevel === "Yes"
    ? master?.section?.section_name
    : master?.subSection?.subSection_name || master?.section?.section_name
  )
    ?.trim()
    ?.substring(0, 2)
    ?.toUpperCase();

const formatSheetNo = (master, sequence) =>
  `${sheetNoPrefixOf(master)}-${String(master.line.line_name).trim()}-${
    moment().tz("Asia/Kolkata").month() + 1
  }-SPARE-${sequence}`.trim();

/**
 * Reserves a block of sheet numbers per line in one update instead of one update
 * per sheet. A bulk scan raising hundreds of sheets across the same handful of
 * lines would otherwise serialise on that counter.
 */
const reserveSheetNumbers = async (masters = []) => {
  const perLine = new Map();
  masters.forEach((master) => {
    const lineId = String(master.line._id);
    perLine.set(lineId, (perLine.get(lineId) ?? 0) + 1);
  });

  const nextByLine = new Map();

  for (const [lineId, count] of perLine.entries()) {
    const line = await Line.findOneAndUpdate(
      { _id: lineId },
      { $inc: { requestSheetNoSpare: count } },
      { new: true, projection: { requestSheetNoSpare: 1 } },
    );
    // After incrementing by count, the reserved block is the `count` numbers
    // ending at the new value.
    nextByLine.set(lineId, (line?.requestSheetNoSpare ?? count) - count + 1);
  }

  return nextByLine;
};

/**
 * The few things a previous request-sheet knows that the master does not.
 *
 * Deliberately narrow. Everything that moves — quantity, price, budget, the
 * tracking timestamps — is recomputed from the master on every cycle, because a
 * reorder raised months later must reflect today's stock and today's dates. Only
 * the standing choices a person made about the part are carried forward.
 */
const carryOverFromSourceSheet = (sourceSheet, masterId) => {
  if (!sourceSheet) return { sheet: {}, part: {} };

  const sourcePart = (sourceSheet.changeParts ?? []).find(
    (part) => String(part?.masterId) === String(masterId),
  );

  const defined = (obj) =>
    Object.fromEntries(
      Object.entries(obj).filter(([, value]) => value !== undefined && value !== null),
    );

  return {
    sheet: defined({
      partRequestFor: sourceSheet.partRequestFor,
      newPartFor: sourceSheet.newPartFor,
      partQty: sourceSheet.partQty,
    }),
    part: defined({
      standerOrManufacturingPart: sourcePart?.standerOrManufacturingPart,
      normalOrUrgentPart: sourcePart?.normalOrUrgentPart,
    }),
  };
};

/**
 * Builds the reorder sheet document for one master.
 *
 * Status mirrors what the issuance-triggered path already produces: a completed,
 * unapproved sheet with an OK budget, so it goes straight to the Ordering
 * Dashboard rather than back through an approval chain.
 *
 * The submitted / HOD / tool-room timestamps are stamped rather than left empty
 * because the Ordering Dashboard derives each tracking stage from the one before
 * it: with no preceding timestamp every stage projects a null taskStatus, and the
 * row renders with no PR-generation step, no selection checkbox and no usable
 * master link. A sheet cloned from an earlier request inherits these three from
 * its source; one built from the master has to set them itself, and "now" is
 * correct for all three since this route deliberately skips approval.
 */
const buildReorderSheet = ({ master, requestSheetNo, createdBy, sourceSheet = null }) => {
  const carried = carryOverFromSourceSheet(sourceSheet, master._id);
  const changePart = { ...changePartFromMaster(master), ...carried.part };
  const raisedAt = generateTimeStampWithBothFormat();

  return {
    requestSheetNo,
    rsSubmittedTimeStamp: raisedAt,
    rsHODApprovalTimeStamp: raisedAt,
    rsToolroomApprovalTimeStamp: raisedAt,
    newOrReOrderRequest: REORDER,
    requestSheetStatus: COMPLETED_STATUS,
    pendingApprovalBy: null,
    dynamicApprovalKeys: [],
    isSpareSheetSendForApproval: false,
    newPartFor: "For stock in",
    partQty: "Single Part",
    partRequestFor: partRequestForOf(master),
    ...carried.sheet,
    budget: {
      budgetStatus: "OK",
      requiredBudget: changePart.quantityRequired * (changePart.approxUnitPrice ?? 0),
    },
    requestSheetCreatedBy: createdBy ?? undefined,
    rsTimeStamp: generateTimestampIndividually(),
    changeParts: [changePart],
    plant: master.plant,
    section: master.section,
    subSection: master.subSection,
    cell: master.cell,
    line: master.line,
    machine: master.machine,
  };
};

module.exports = {
  REORDER,
  carryOverFromSourceSheet,
  COMPLETED_STATUS,
  availableQtyOf,
  isBelowReorderLevel,
  reorderQuantityFor,
  approxUnitPriceOf,
  partRequestForOf,
  canBuildSheetNumber,
  changePartFromMaster,
  findMastersWithOpenReorder,
  openReorderFilterFor,
  reserveSheetNumbers,
  formatSheetNo,
  buildReorderSheet,
};
