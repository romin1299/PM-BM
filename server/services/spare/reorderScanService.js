const path = require("path");
const ExcelJS = require("exceljs");

const SpareMaster = require("../../model/spareMasterSchema");
const RequestSheetOfSpare = require("../../model/requestSheetDataOfSpare");
const {
  generateTimeStampWithBothFormat,
} = require("../../utils/spareTimestamp");
const {
  availableQtyOf,
  reorderQuantityFor,
  canBuildSheetNumber,
  findMastersWithOpenReorder,
  reserveSheetNumbers,
  formatSheetNo,
  buildReorderSheet,
} = require("./reorderSheetService");

/**
 * Sweeps the Spare Master catalogue and raises a reorder request-sheet for every
 * part that has fallen to its minimum level.
 *
 * The per-issuance trigger only ever looks at the one master just issued, so a
 * catalogue loaded in bulk — where thousands of parts arrive already at or below
 * their minimum — has no way to catch up. This is that catch-up pass, and it is
 * safe to re-run: the same open-reorder guard the issuance path uses stops a
 * second sheet being raised while one is still in flight.
 */

const CANDIDATE_BATCH = 1000;

const SKIP_REASONS = {
  noHierarchy:
    "No machine/line resolved, so a request-sheet number cannot be formed and the sheet would be invisible to every hierarchy-filtered dashboard",
  nothingToOrder:
    "Maximum quantity is not above available quantity, so the reorder amount would be zero or negative",
  openReorder: "An open reorder request-sheet already exists for this part",
};

/**
 * Masters at or below their minimum level, resolved in the database rather than
 * in Node: the catalogue is ~18k documents and only a fraction ever qualify.
 */
const findCandidates = () =>
  SpareMaster.aggregate([
    { $match: { status: "masterCreated" } },
    { $addFields: { availableQty: { $sum: "$costDetails.availableQty" } } },
    {
      $match: {
        $expr: { $lte: ["$availableQty", { $ifNull: ["$minQuantity", 0] }] },
      },
    },
    {
      $project: {
        uniqueID: 1,
        partNumber: 1,
        partName: 1,
        partModel: 1,
        maker: 1,
        supplierName: 1,
        supplierCategory: 1,
        registerSection: 1,
        minQuantity: 1,
        maxQuantity: 1,
        availableQty: 1,
        costDetails: 1,
        additionalMachineCodes: 1,
        machine: 1,
        line: 1,
        cell: 1,
        subSection: 1,
        section: 1,
        plant: 1,
      },
    },
  ]);

/**
 * Excel report of the parts that could not be reordered, so Tool Room can fix the
 * underlying data (usually an unresolved machine) and re-run the scan.
 */
const writeSkippedReport = async (skipped = [], filePath) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Skipped Reorder Masters");

  sheet.columns = [
    { header: "Part No", key: "partNumber", width: 16 },
    { header: "Unique ID", key: "uniqueID", width: 18 },
    { header: "Part Name", key: "partName", width: 38 },
    { header: "Part Model", key: "partModel", width: 28 },
    { header: "Maker", key: "maker", width: 22 },
    { header: "Supplier", key: "supplierName", width: 34 },
    { header: "Register Section", key: "registerSection", width: 20 },
    { header: "Machine Code (unresolved)", key: "machineCode", width: 24 },
    { header: "Machine Name (unresolved)", key: "machineName", width: 30 },
    { header: "Other M/C Codes", key: "additionalMachineCodes", width: 24 },
    { header: "Min Qty", key: "minQuantity", width: 10 },
    { header: "Max Qty", key: "maxQuantity", width: 10 },
    { header: "Available Qty", key: "availableQty", width: 14 },
    { header: "Reason", key: "reason", width: 90 },
  ];

  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  skipped.forEach((entry) => sheet.addRow(entry));

  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: sheet.columns.length },
  };

  await workbook.xlsx.writeFile(filePath);
  return filePath;
};

/**
 * Most recent request-sheet per master, in one query rather than one per master.
 *
 * Only feeds the narrow carry-over the builder accepts (part type, urgency, the
 * MTD/PRD split) — everything that moves is recomputed from the master — so it is
 * enough to keep the newest sheet per master and the matching change-part.
 */
const findLatestSheetPerMaster = async (masterIds = []) => {
  if (!masterIds.length) return new Map();

  const rows = await RequestSheetOfSpare.aggregate([
    { $match: { "changeParts.masterId": { $in: masterIds } } },
    { $sort: { createdAt: -1 } },
    { $unwind: "$changeParts" },
    { $match: { "changeParts.masterId": { $in: masterIds } } },
    {
      $group: {
        _id: "$changeParts.masterId",
        partRequestFor: { $first: "$partRequestFor" },
        newPartFor: { $first: "$newPartFor" },
        partQty: { $first: "$partQty" },
        changePart: { $first: "$changeParts" },
      },
    },
  ]);

  // carryOverFromSourceSheet reads a sheet-shaped object, so put the single
  // matching change-part back into the array it expects.
  return new Map(
    rows.map((row) => [
      String(row._id),
      { ...row, changeParts: row.changePart ? [row.changePart] : [] },
    ]),
  );
};

const generateReorderSheets = async ({
  dryRun = true,
  createdBy = null,
  skippedReportPath,
} = {}) => {
  const candidates = await findCandidates();

  const openReorderMasterIds = await findMastersWithOpenReorder(
    candidates.map((master) => master._id),
  );

  const skipped = [];
  const eligible = [];

  const skip = (master, reason) =>
    skipped.push({
      partNumber: master.partNumber,
      uniqueID: master.uniqueID,
      partName: master.partName,
      partModel: master.partModel,
      maker: master.maker,
      supplierName: master.supplierName,
      registerSection: master.registerSection,
      machineCode: master.machine?.machine_code ?? "",
      machineName: master.machine?.machine_name ?? "",
      additionalMachineCodes: (master.additionalMachineCodes ?? []).join(", "),
      minQuantity: master.minQuantity ?? 0,
      maxQuantity: master.maxQuantity ?? 0,
      availableQty: availableQtyOf(master),
      reason,
    });

  candidates.forEach((master) => {
    if (openReorderMasterIds.has(String(master._id)))
      return skip(master, SKIP_REASONS.openReorder);
    if (reorderQuantityFor(master) <= 0)
      return skip(master, SKIP_REASONS.nothingToOrder);
    if (!canBuildSheetNumber(master))
      return skip(master, SKIP_REASONS.noHierarchy);
    return eligible.push(master);
  });

  const summary = {
    candidates: candidates.length,
    eligible: eligible.length,
    created: 0,
    skipped: skipped.length,
    skippedByReason: skipped.reduce((acc, entry) => {
      acc[entry.reason] = (acc[entry.reason] ?? 0) + 1;
      return acc;
    }, {}),
  };

  let reportPath = null;
  let reportError = null;

  /**
   * The report is a convenience, not the point of the run. Writing it can fail for
   * reasons that have nothing to do with the data — most often the previous copy
   * is still open in Excel and the file is locked — and that must not stop reorder
   * sheets being raised. The failure is reported instead.
   */
  if (skipped.length && skippedReportPath) {
    try {
      reportPath = await writeSkippedReport(
        skipped,
        path.isAbsolute(skippedReportPath)
          ? skippedReportPath
          : path.join(__dirname, "../..", skippedReportPath),
      );
    } catch (error) {
      reportError = `Could not write the skipped-parts report: ${error?.message ?? error}`;
    }
  }

  // Named skippedDetails, not skipped: summary.skipped is the count, and a
  // shorthand `skipped` here would silently overwrite it with the array.
  if (dryRun)
    return {
      ...summary,
      dryRun: true,
      skippedReportPath: reportPath,
      reportError,
      skippedDetails: skipped,
    };

  const sourceSheetByMaster = await findLatestSheetPerMaster(
    eligible.map((master) => master._id),
  );

  const sequenceByLine = await reserveSheetNumbers(eligible);
  const usedByLine = new Map();

  for (let i = 0; i < eligible.length; i += CANDIDATE_BATCH) {
    const batch = eligible.slice(i, i + CANDIDATE_BATCH).map((master) => {
      const lineId = String(master.line._id);
      const offset = usedByLine.get(lineId) ?? 0;
      usedByLine.set(lineId, offset + 1);

      return buildReorderSheet({
        master,
        sourceSheet: sourceSheetByMaster.get(String(master._id)) ?? null,
        requestSheetNo: formatSheetNo(
          master,
          (sequenceByLine.get(lineId) ?? 1) + offset,
        ),
        createdBy,
      });
    });

    const inserted = await RequestSheetOfSpare.insertMany(batch, {
      ordered: false,
    });
    summary.created += inserted.length;
  }

  return {
    ...summary,
    dryRun: false,
    skippedReportPath: reportPath,
    reportError,
    skippedDetails: skipped,
  };
};

/**
 * Stamps the submitted / HOD / tool-room timestamps onto reorder sheets that were
 * raised without them.
 *
 * The Ordering Dashboard derives each tracking stage from the timestamp of the
 * stage before it, so a sheet missing these three shows no PR-generation step and
 * cannot be acted on at all. Sheets cloned from an earlier request inherit them;
 * sheets built straight from a master did not, until buildReorderSheet started
 * setting them. This repairs the ones raised before that.
 *
 * The sheet's own createdAt is used rather than "now", so the record reflects
 * when the reorder was actually raised.
 */
const backfillReorderTrackingTimestamps = async ({ dryRun = true } = {}) => {
  const filter = {
    newOrReOrderRequest: "REORDER",
    "rsSubmittedTimeStamp.inDate": { $in: [null, undefined] },
  };

  const sheets = await RequestSheetOfSpare.find(filter, {
    createdAt: 1,
    requestSheetNo: 1,
  }).lean();

  if (dryRun) return { dryRun: true, matched: sheets.length, updated: 0 };

  const writes = sheets.map((sheet) => {
    const raisedAt = generateTimeStampWithBothFormat(sheet.createdAt);
    return {
      updateOne: {
        filter: { _id: sheet._id },
        update: {
          $set: {
            rsSubmittedTimeStamp: raisedAt,
            rsHODApprovalTimeStamp: raisedAt,
            rsToolroomApprovalTimeStamp: raisedAt,
          },
        },
      },
    };
  });

  if (!writes.length) return { dryRun: false, matched: 0, updated: 0 };

  const result = await RequestSheetOfSpare.bulkWrite(writes, { ordered: false });

  return {
    dryRun: false,
    matched: sheets.length,
    updated: result?.modifiedCount ?? 0,
  };
};

module.exports = {
  generateReorderSheets,
  findLatestSheetPerMaster,
  backfillReorderTrackingTimestamps,
  writeSkippedReport,
  SKIP_REASONS,
};
