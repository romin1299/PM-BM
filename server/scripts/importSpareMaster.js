const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config({ path: path.join(__dirname, "../config.env") });

const User = require("../model/userSchema");
const {
  importSpareMasterFromExcel,
} = require("../services/spareMaster/spareMasterImporter");

/**
 * Directly callable runner for the Spare Master importer.
 *
 * The HTTP route is for Tool Room uploads; this is for running an import from the
 * backend itself — a node one-liner, an npm script, or a require from any other
 * server code. It is the same service underneath, so both paths apply identical
 * mapping, validation and write rules.
 *
 * Opens its own database connection only when there is not already one, and
 * closes only what it opened, so calling it from inside a running server does not
 * disturb the app's connection.
 */

const formatSummary = (result) => {
  const { summary } = result;
  const line = (label, value) => `  ${String(label).padEnd(24)} ${value}`;

  return [
    "",
    `Spare Master import ${result.dryRun ? "(DRY RUN — nothing written)" : "(COMMITTED)"}`,
    `  file: ${result.file}`,
    `  sheet: ${result.sheet} (header row ${result.headerRow}, ${result.mappedColumns?.length ?? 0} columns mapped)`,
    `  createdBy: ${result.createdBy ? `${result.createdBy.tm_name} (${result.createdBy.tm_no})` : "null"}`,
    "",
    line("total rows", summary.totalRows),
    line("created", summary.created),
    line("updated", summary.updated),
    line("unchanged", summary.unchanged),
    line("failed", summary.failed),
    line("duplicate in file", summary.duplicateInFile),
    line("validation errors", summary.validationErrors),
    line("warnings", summary.warnings),
    line("machine resolved", summary.withMachine),
    line("machine unresolved", summary.withoutMachine),
    "",
  ].join("\n");
};

const runSpareMasterImport = async ({
  filePath,
  commit = false,
  sheetName,
  plantId,
  tmNo,
  createdBy,
  verbose = true,
  errorSampleSize = 20,
} = {}) => {
  if (!filePath) throw new Error("filePath is required");

  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.join(__dirname, "..", filePath);

  // readyState 0 means nothing has connected yet, so this call owns the connection.
  const ownsConnection = mongoose.connection.readyState === 0;
  if (ownsConnection) await mongoose.connect(process.env.DATABASE);

  try {
    let importUser = createdBy ?? null;

    if (!importUser && tmNo)
      importUser = await User.findOne({ tm_no: tmNo }, { tm_no: 1, tm_name: 1, email: 1, plant_data: 1 }).lean();

    const result = await importSpareMasterFromExcel(absolutePath, {
      dryRun: !commit,
      sheetName,
      plantId,
      createdBy: importUser,
    });

    if (verbose) {
      console.log(formatSummary(result));

      if (result.errors.length) {
        console.log(`First ${Math.min(errorSampleSize, result.errors.length)} error(s):`);
        result.errors.slice(0, errorSampleSize).forEach((error) =>
          console.log(`  row ${error.excelRow} | ${error.column} | ${JSON.stringify(error.value)} | ${error.message}`),
        );
        if (result.truncated.errors)
          console.log(`  ...and ${result.truncated.errors} more not listed`);
        console.log("");
      }

      if (result.catalogues) console.log("catalogues:", JSON.stringify(result.catalogues));
      if (result.currencies) console.log("currencies:", JSON.stringify(result.currencies));
      if (result.wouldSeedCatalogues)
        console.log("would seed catalogues:", JSON.stringify(result.wouldSeedCatalogues));
      if (result.wouldSyncCurrencies)
        console.log("would sync currencies:", JSON.stringify(result.wouldSyncCurrencies));
    }

    return result;
  } finally {
    if (ownsConnection) await mongoose.disconnect();
  }
};

/**
 * CLI entry:
 *   node scripts/importSpareMaster.js "Old Master data/file.xlsx"
 *   node scripts/importSpareMaster.js "Old Master data/file.xlsx" --commit --tm-no=89898
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  const flag = (name) => args.find((arg) => arg.startsWith(`--${name}=`))?.split("=").slice(1).join("=");

  runSpareMasterImport({
    filePath: args.find((arg) => !arg.startsWith("--")),
    commit: args.includes("--commit"),
    sheetName: flag("sheet"),
    plantId: flag("plant-id"),
    tmNo: flag("tm-no") ? Number(flag("tm-no")) : undefined,
  })
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error?.message ?? error);
      process.exit(1);
    });
}

module.exports = { runSpareMasterImport };
