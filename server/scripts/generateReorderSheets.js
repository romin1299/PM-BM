const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config({ path: path.join(__dirname, "../config.env") });

const User = require("../model/userSchema");
const {
  generateReorderSheets,
  backfillReorderTrackingTimestamps,
} = require("../services/spare/reorderScanService");

/**
 * Directly callable runner for the reorder sweep.
 *
 * Mirrors scripts/importSpareMaster.js: opens a connection only when there is not
 * already one, closes only what it opened, and dry-runs unless told to commit.
 */

const DEFAULT_REPORT = "Old Master data/reorder-skipped.xlsx";

const runReorderGeneration = async ({
  commit = false,
  tmNo,
  createdBy,
  skippedReportPath = DEFAULT_REPORT,
  repairTimestamps = false,
  verbose = true,
} = {}) => {
  const ownsConnection = mongoose.connection.readyState === 0;
  if (ownsConnection) await mongoose.connect(process.env.DATABASE);

  try {
    let sheetCreator = createdBy ?? null;

    if (!sheetCreator && tmNo)
      sheetCreator = await User.findOne(
        { tm_no: tmNo },
        { tm_no: 1, tm_name: 1, email: 1 },
      ).lean();

    /**
     * Repair pass for reorder sheets raised before buildReorderSheet stamped the
     * tracking timestamps. Runs on its own — a repair is not a generation run.
     */
    if (repairTimestamps) {
      const repaired = await backfillReorderTrackingTimestamps({ dryRun: !commit });
      if (verbose)
        console.log(
          `
Tracking-timestamp repair ${repaired.dryRun ? "(DRY RUN)" : "(COMMITTED)"}: ` +
            `${repaired.matched} sheet(s) missing timestamps, ${repaired.updated} updated`,
        );
      return repaired;
    }

    const result = await generateReorderSheets({
      dryRun: !commit,
      createdBy: sheetCreator,
      skippedReportPath,
    });

    if (verbose) {
      console.log(
        `\nReorder generation ${result.dryRun ? "(DRY RUN — nothing written)" : "(COMMITTED)"}`,
      );
      console.log(
        `  createdBy: ${sheetCreator ? `${sheetCreator.tm_name} (${sheetCreator.tm_no})` : "null"}\n`,
      );
      console.log(`  ${"below minimum level".padEnd(24)} ${result.candidates}`);
      console.log(`  ${"eligible".padEnd(24)} ${result.eligible}`);
      console.log(`  ${"sheets created".padEnd(24)} ${result.created}`);
      console.log(`  ${"skipped".padEnd(24)} ${result.skipped}\n`);

      Object.entries(result.skippedByReason).forEach(([reason, count]) =>
        console.log(`  skipped ${String(count).padStart(5)} — ${reason}`),
      );

      if (result.skippedReportPath)
        console.log(`\n  skipped report written to: ${result.skippedReportPath}`);
      if (result.reportError)
        console.log("\n  " + result.reportError);
    }

    return result;
  } finally {
    if (ownsConnection) await mongoose.disconnect();
  }
};

/**
 * CLI:
 *   node scripts/generateReorderSheets.js
 *   node scripts/generateReorderSheets.js --commit --tm-no=89898
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  const flag = (name) =>
    args.find((arg) => arg.startsWith(`--${name}=`))?.split("=").slice(1).join("=");

  runReorderGeneration({
    commit: args.includes("--commit"),
    tmNo: flag("tm-no") ? Number(flag("tm-no")) : undefined,
    skippedReportPath: flag("report") ?? DEFAULT_REPORT,
    repairTimestamps: args.includes("--repair-timestamps"),
  })
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error?.message ?? error);
      process.exit(1);
    });
}

module.exports = { runReorderGeneration };
