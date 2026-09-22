const SpareMaster = require("../../model/spareMasterSchema");

const { readMappedRows } = require("./excelReader");
const { loadReferenceData, resolveCreatedBy } = require("./referenceResolver");
const { transformRow } = require("./rowTransformer");
const { validateRow } = require("./rowValidator");
const { createImportResult } = require("./importResult");
const { seedCatalogues, syncPlantCurrencies } = require("./referenceSeeder");
const { planUniqueIds } = require("./uniqueIdPlanner");
const { resetMasterUniqueIdSequences } = require("./masterUniqueIdService");
const {
  defaultReportPath,
  collectUnresolvedMachines,
  writeUnresolvedMachinesReport,
} = require("./unresolvedMachinesReport");

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
  "createDate",
  "changeDate",
  "currencyRate",
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
 * `location` (the legacy PartsNumber, a storage location code) is the import
 * key: it is unique and populated across every row of the source, and it was the
 * legacy system's own key for the part. Upserting on it is what makes repeated
 * imports safe — the same file applied twice updates in place instead of
 * doubling the catalogue. It is not among UPDATABLE_FIELDS: matching on a field
 * and rewriting it in the same operation would be a no-op at best.
 *
 * `uniqueID` is this application's own identity for the part and is generated
 * here, so it goes in $setOnInsert alone: a re-import must never reassign the id
 * of a part that already has one.
 */
const buildUpsertOperation = ({ document, costDetails, createdBy, uniqueID }) => ({
  updateOne: {
    filter: { location: document.location },
    update: {
      $set: pick(document, UPDATABLE_FIELDS),
      $setOnInsert: {
        location: document.location,
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

/**
 * `model` picks the catalogue: the stock-in master by default, or one of the
 * uploaded masters (see model/spareMasterTypes.js). Every step — mapping,
 * validation, machine resolution, the location upsert, unique ids — is the
 * same; only the collection written differs.
 *
 * `resetSequencesWhenEmpty` restarts the plant id counters when the target
 * catalogue is empty. Meant for the one-off legacy load of the stock-in master
 * and off by default: the counters are shared by all three masters, so an
 * empty recycle catalogue says nothing about ids already issued elsewhere.
 */
const importSpareMasterFromExcel = async (filePath, options = {}) => {
  const {
    sheetName,
    dryRun = false,
    createdBy: createdByCandidate = null,
    seedCatalogueValues = true,
    syncCurrencies = true,
    detailLimit,
    unresolvedMachinesReportPath = defaultReportPath(filePath),
    model: Model = SpareMaster,
    resetSequencesWhenEmpty = false,
  } = options;

  const result = createImportResult({ detailLimit });
  result.setMeta("file", filePath);
  result.setMeta("dryRun", dryRun);
  result.setMeta("collection", Model.collection.name);

  const [references, createdBy] = await Promise.all([
    loadReferenceData(),
    resolveCreatedBy(createdByCandidate),
  ]);

  result.setMeta("createdBy", createdBy ? { tm_no: createdBy.tm_no, tm_name: createdBy.tm_name } : null);

  const seenLocations = new Map();
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
   * An import into an empty catalogue is a fresh start, so the plant counters
   * restart at 1 rather than continuing from ids that no longer exist. Guarded
   * on emptiness because resetting while masters exist would reissue their ids.
   */
  const catalogueIsEmpty = !(await Model.exists({}));
  if (catalogueIsEmpty && !dryRun && resetSequencesWhenEmpty) {
    const plantsReset = await resetMasterUniqueIdSequences();
    result.setMeta("sequencesReset", { plants: plantsReset });
  }

  /**
   * Ids come from a plan made over the whole file before any row is written,
   * ordered by the source's CreateDate — blank dates first, then oldest to
   * newest — rather than being reserved batch by batch in row order. Only
   * locations the catalogue does not hold are in the plan; an existing
   * master keeps its id. In a dry run the plan is made but nothing reserved.
   */
  const plan = await planUniqueIds(filePath, {
    sheetName,
    references,
    createdBy,
    reserve: !dryRun,
    model: Model,
  });
  result.setMeta("uniqueIdPlan", plan.summary);

  const assignUniqueIds = (pending) =>
    pending.forEach((entry) => {
      entry.uniqueID = plan.idByLocation.get(entry.document.location);
    });

  const unresolvedMachines = collectUnresolvedMachines();

  const flush = async () => {
    if (!batch.length) return;
    if (dryRun) {
      batch = [];
      return;
    }
    try {
      assignUniqueIds(batch);

      const bulkResult = await Model.bulkWrite(
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
          column: "PartsNumber",
          value: writeError?.err?.op?.q?.location ?? null,
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
    const { document, costDetails, currency, hasMachine, machineSource, notes, createDate } =
      transformed;

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
      .forEach((note) => {
        result.addWarnings([
          { excelRow, column: "MachineName / Equipment1", value: raw.machineName ?? raw.equipment1 ?? null, message: note.message },
        ]);
        if (note.type === "unresolvedMachine")
          unresolvedMachines.add({
            excelRow,
            location: document.location,
            partName: document.partName,
            machineSource,
            reason: note.message,
          });
      });

    // A location repeated inside one file would make two operations in the
    // same batch target one document, which an unordered bulkWrite may apply in
    // either order. Keep the first and report the rest.
    const duplicateOf = seenLocations.get(document.location);
    if (duplicateOf) {
      result.addDuplicate({
        excelRow,
        column: "PartsNumber",
        value: document.location,
        message: `Duplicate location (PartsNumber), first seen on Excel row ${duplicateOf}`,
      });
      continue;
    }
    seenLocations.set(document.location, excelRow);

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

  /**
   * The machines the file names that the catalogue lacks, written beside the
   * source file on every run (a dry run is exactly when this list is wanted).
   * A locked or unwritable path must not fail the import itself.
   */
  if (unresolvedMachinesReportPath && unresolvedMachines.rows.length) {
    try {
      await writeUnresolvedMachinesReport(unresolvedMachines, unresolvedMachinesReportPath);
      result.setMeta("unresolvedMachinesReport", {
        path: unresolvedMachinesReportPath,
        machines: unresolvedMachines.machines.length,
        rows: unresolvedMachines.rows.length,
      });
    } catch (error) {
      result.setMeta("unresolvedMachinesReport", {
        path: unresolvedMachinesReportPath,
        machines: unresolvedMachines.machines.length,
        rows: unresolvedMachines.rows.length,
        error: error?.message ?? String(error),
      });
    }
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
