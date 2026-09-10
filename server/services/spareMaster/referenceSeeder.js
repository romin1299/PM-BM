const {
  Maker,
  Supplier,
  Unit,
  PartGroup,
  VendorGroup,
  SupplierCategory,
} = require("../../model/customizedFieldSchema");
const Plant = require("../../model/plantSchema");

/**
 * Keeps the Spare dropdown catalogues and the plant currency table in step with
 * imported data.
 *
 * The master stores maker / supplier / unit / part group as plain strings, and
 * these collections exist only to back the searchable dropdowns behind
 * /v1/spare/customization/customizeField. Importing 17k masters without seeding
 * them would leave every imported record holding a value its own dropdown cannot
 * offer, so the importer tops them up from the file it just read.
 *
 * Exported separately from the importer so the same top-up can be run on its own
 * against catalogues that have drifted.
 */

/** Catalogue field name -> model. Mirrors the map in spareCustomizeFieldsController. */
const CATALOGUE_MODELS = {
  maker: Maker,
  supplierName: Supplier,
  unit: Unit,
  partGroup: PartGroup,
  vendorGroup: VendorGroup,
  supplierCategory: SupplierCategory,
};

const CATALOGUE_INSERT_BATCH = 1000;

const normalize = (value) => String(value ?? "").trim().toUpperCase().replace(/\s+/g, " ");

/**
 * Adds any value the catalogue does not already hold. Comparison is
 * case-insensitive so an import cannot introduce "Pro-Face" beside "PRO-FACE",
 * but the value is stored exactly as the source wrote it.
 */
const seedCatalogue = async (fieldName, values = []) => {
  const model = CATALOGUE_MODELS[fieldName];
  if (!model) throw new Error(`Unknown Spare catalogue "${fieldName}"`);

  const wanted = new Map();
  values.forEach((value) => {
    const key = normalize(value);
    if (key && !wanted.has(key)) wanted.set(key, String(value).trim());
  });

  if (!wanted.size) return { field: fieldName, added: 0, alreadyPresent: 0 };

  const existing = await model.find({}, { [fieldName]: 1 }).lean();
  existing.forEach((doc) => wanted.delete(normalize(doc[fieldName])));

  const toInsert = [...wanted.values()].map((value) => ({ [fieldName]: value }));

  for (let i = 0; i < toInsert.length; i += CATALOGUE_INSERT_BATCH)
    await model.insertMany(toInsert.slice(i, i + CATALOGUE_INSERT_BATCH), { ordered: false });

  return {
    field: fieldName,
    added: toInsert.length,
    alreadyPresent: existing.length,
  };
};

const seedCatalogues = async (valuesByField = {}) => {
  const results = [];
  for (const [fieldName, values] of Object.entries(valuesByField)) {
    if (!CATALOGUE_MODELS[fieldName]) continue;
    results.push(await seedCatalogue(fieldName, [...values]));
  }
  return results;
};

/**
 * Adds currencies the file uses but the plant has not configured.
 *
 * Existing rates are never overwritten: the configured rate is the one the Spare
 * module already values live stock with, and silently replacing it from a legacy
 * export would restate the value of everything on hand.
 */
const syncPlantCurrencies = async (plantIds = [], currencies = new Map()) => {
  if (!plantIds.length || !currencies.size) return [];

  const results = [];

  for (const plantId of plantIds) {
    const plant = await Plant.findOne({ _id: plantId }, { plant_name: 1, spareCurrenciesWithUnit: 1 }).lean();
    if (!plant) continue;

    const configured = new Set(
      (plant.spareCurrenciesWithUnit || []).map((entry) => normalize(entry.currencyUnit)),
    );

    const missing = [...currencies.entries()]
      .filter(([unit]) => !configured.has(normalize(unit)))
      .map(([currencyUnit, currencyRate]) => ({ currencyUnit, currencyRate }));

    if (missing.length)
      await Plant.updateOne(
        { _id: plantId },
        { $push: { spareCurrenciesWithUnit: { $each: missing } } },
      );

    results.push({
      plant: plant.plant_name,
      added: missing.map((entry) => `${entry.currencyUnit}@${entry.currencyRate}`),
      alreadyConfigured: configured.size,
    });
  }

  return results;
};

module.exports = {
  CATALOGUE_MODELS,
  seedCatalogue,
  seedCatalogues,
  syncPlantCurrencies,
};
