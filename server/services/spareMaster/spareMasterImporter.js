const SpareMaster = require("../../model/spareMasterSchema");

const { readMappedRows } = require("./excelReader");
const { loadReferenceData, resolveCreatedBy } = require("./referenceResolver");
const { transformRow } = require("./rowTransformer");
const { validateRow } = require("./rowValidator");
const { createImportResult } = require("./importResult");
const { seedCatalogues, syncPlantCurrencies } = require("./referenceSeeder");
const {
  resolvePlantIdentity,
  reserveMasterUniqueIds,
  formatMasterUniqueId,
} = require("./masterUniqueIdService");

/**
 * Reusable Spare Master import service.
 *
 * Excel -> read -> map -> transform -> validate -> resolve -> upsert, driven by
 * the versioned column map so a future export with renamed headers is handled by
 * editing columnMapping.js alone.
 *
 * Rows stream through in batches rather than being collected: the file in hand is
 * 17.6k rows and these exports grow, so neither the row set nor the write set is
 * ever held whole in memory.
 */

const WRITE_BATCH_SIZE = 1000;

/**
 * Fields an existing master accepts from a re-import.
 *
 * Deliberately specification-only. Stock, cost, ownership and the creation stamps
 * belong to the receipt and issuance flows once a part is live, so re-running a
 * file corrects part details without restating anything about inventory.
 */
const UPDATABLE_FIELDS = [
  "partName",
  "partModel",
  "partGroup",
  "maker",
  "supplierName",
  "unit",
  "registerSection",
  "leadTime",
  "minQuantity",
  "maxQuantity",
  "orderPoint",
  "orderQty",
  "orderType",
  "controlType",
  "stockTaking",
  "remarks",
  "lastIssuedDate",
  "previousIssuedDate",
  "totalIssuedQty",
  "secondaryTotalIssuedQty",
  "legacyRef",
  "additionalMachineCodes",
  "machine",
  "line",
  "cell",
  "subSection",
  "section",
  "plant",
];

const pick = (source, fields) =>
  fields.reduce((acc, field) => {
    if (source[field] !== undefined && source[field] !== null) acc[field] = source[field];
    return acc;
  }, {});

/**
 * `partNumber` (the legacy PartsNumber) is the business key: it is unique and
 * populated across every row of the source, and it is the key people search by.
 * Upserting on it is what makes repeated imports safe — the same file applied
 * twice updates in place instead of doubling the catalogue.
 *
 * `uniqueID` is this application's own identity for the part and is generated
 * here, so it goes in $setOnInsert alone: a re-import must never reassign the id
 * of a part that already has one.
 */
const buildUpsertOperation = ({ document, costDetails, createdBy, uniqueID }) => ({
  updateOne: {
    filter: { partNumber: document.partNumber },
    update: {
      $set: pick(document, UPDATABLE_FIELDS),
      $setOnInsert: {
        partNumber: document.partNumber,
        ...(uniqueID ? { uniqueID } : {}),
        status: "masterCreated",
        costDetails,
        createdBy,
        dateTime: document.dateTime,
        rsTimeStamp: document.rsTimeStamp,
      },
    },
    upsert: true,
  },
});

const importSpareMasterFromExcel = async (filePath, options = {}) => {
  const {
    sheetName,
    dryRun = false,
    createdBy: createdByCandidate = null,
    seedCatalogueValues = true,
    syncCurrencies = true,
    detailLimit,
  } = options;

  const result = createImportResult({ detailLimit });
  result.setMeta("file", filePath);
  result.setMeta("dryRun", dryRun);

  const [references, createdBy] = await Promise.all([
    loadReferenceData(),
    resolveCreatedBy(createdByCandidate),
  ]);

  result.setMeta("createdBy", createdBy ? { tm_no: createdBy.tm_no, tm_name: createdBy.tm_name } : null);

  const seenPartNumbers = new Map();
  const catalogueValues = {
    maker: new Set(),
    supplierName: new Set(),
    unit: new Set(),
    partGroup: new Set(),
  };
  const currencies = new Map();
  const touchedPlantIds = new Set();

  let batch = [];

  /**
   * Ids are reserved per batch, and only for part numbers the catalogue does not
   * already hold — an existing master keeps the id it was given. One extra query
   * and one counter update per batch, rather than per row.
   */
  const assignUniqueIds = async (pending) => {
    const partNumbers = pending.map(({ document }) => document.partNumber);

    const existing = new Set(
      (
        await SpareMaster.find(
          { partNumber: { $in: partNumbers } },
          { partNumber: 1 },
        ).lean()
      ).map((doc) => doc.partNumber),
    );

    const needingId = pending.filter(
      ({ document }) => !existing.has(document.partNumber),
    );

    if (!needingId.length) return;

    const { plantId, plantName } = resolvePlantIdentity({
      master: needingId[0].document,
      fallbackUser: createdBy,
    });

    const reserved = await reserveMasterUniqueIds({
      plantId,
      plantName,
      count: needingId.length,
    });

    if (!reserved) return;

    needingId.forEach((entry, index) => {
      entry.uniqueID = formatMasterUniqueId(
        reserved.prefix,
        reserved.firstSequence + index,
      );
    });
  };

  const flush = async () => {
    if (!batch.length) return;
    if (dryRun) {
      batch = [];
      return;
    }
    try {
      await assignUniqueIds(batch);

      const bulkResult = await SpareMaster.bulkWrite(
        batch.map(buildUpsertOperation),
        { ordered: false },
      );
      result.applyBulkWriteResult(bulkResult);
    } catch (error) {
      // An unordered bulkWrite applies what it can and reports the rest, so the
      // successes are still counted and only genuinely rejected rows are failures.
      result.applyBulkWriteResult(error?.result);
      const writeErrors = error?.writeErrors ?? [];
      result.markFailed(writeErrors.length || batch.length);
      result.addErrors(
        writeErrors.slice(0, 25).map((writeError) => ({
          excelRow: null,
          column: "partNumber",
          value: writeError?.err?.op?.q?.partNumber ?? null,
          message: `Database rejected the record: ${writeError?.errmsg ?? writeError?.err?.errmsg ?? "unknown error"}`,
        })),
      );
    }
    batch = [];
  };

  for await (const { excelRow, raw } of readMappedRows(filePath, {
    sheetName,
    onHeader: ({ sheetName: name, headerRow, headerIndex }) => {
      result.setMeta("sheet", name);
      result.setMeta("headerRow", headerRow);
      result.setMeta("mappedColumns", Object.keys(headerIndex));
    },
  })) {
    result.countRow();

    const transformed = transformRow({ raw, references });
    const { document, costDetails, currency, hasMachine, notes } = transformed;

    const { errors, warnings } = validateRow({ excelRow, document, costDetails, currency, raw });

    if (errors.length) {
      result.addErrors(errors);
      result.markFailed();
      continue;
    }

    result.addWarnings(warnings);
    result.countMachine(hasMachine);

    notes
      .filter((note) => note.type === "unresolvedMachine" || note.type === "incompleteHierarchy")
      .forEach((note) =>
        result.addWarnings([
          { excelRow, column: "MachineName / Equipment1", value: raw.machineName ?? raw.equipment1 ?? null, message: note.message },
        ]),
      );

    // A part number repeated inside one file would make two operations in the
    // same batch target one document, which an unordered bulkWrite may apply in
    // either order. Keep the first and report the rest.
    const duplicateOf = seenPartNumbers.get(document.partNumber);
    if (duplicateOf) {
      result.addDuplicate({
        excelRow,
        column: "PartsNumber",
        value: document.partNumber,
        message: `Duplicate part number, first seen on Excel row ${duplicateOf}`,
      });
      continue;
    }
    seenPartNumbers.set(document.partNumber, excelRow);

    if (document.maker) catalogueValues.maker.add(document.maker);
    if (document.supplierName) catalogueValues.supplierName.add(document.supplierName);
    if (document.unit) catalogueValues.unit.add(document.unit);
    if (document.partGroup) catalogueValues.partGroup.add(document.partGroup);

    if (currency.currencyUnit && Number.isFinite(currency.currencyRate) && !currencies.has(currency.currencyUnit))
      currencies.set(currency.currencyUnit, currency.currencyRate);

    if (document.plant?._id) touchedPlantIds.add(String(document.plant._id));

    batch.push({ document, costDetails, createdBy });

    if (batch.length >= WRITE_BATCH_SIZE) await flush();
  }

  await flush();

  if (!dryRun && seedCatalogueValues)
    result.setMeta("catalogues", await seedCatalogues(catalogueValues));

  if (!dryRun && syncCurrencies) {
    const plantIds = options.plantId ? [options.plantId] : [...touchedPlantIds];
    result.setMeta("currencies", await syncPlantCurrencies(plantIds, currencies));
  }

  if (dryRun) {
    result.setMeta("wouldSeedCatalogues", Object.fromEntries(
      Object.entries(catalogueValues).map(([field, values]) => [field, values.size]),
    ));
    result.setMeta("wouldSyncCurrencies", Object.fromEntries(currencies));
  }

  return result.toJSON();
};

module.exports = { importSpareMasterFromExcel, UPDATABLE_FIELDS, WRITE_BATCH_SIZE };
