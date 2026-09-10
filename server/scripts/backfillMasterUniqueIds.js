const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config({ path: path.join(__dirname, "../config.env") });

const SpareMaster = require("../model/spareMasterSchema");
const {
  resolvePlantIdentity,
  reserveMasterUniqueIds,
  formatMasterUniqueId,
} = require("../services/spareMaster/masterUniqueIdService");

/**
 * One-off migration for masters created before partNumber and uniqueID were
 * separated.
 *
 * Those records were loaded with the manufacturer's part number stored in
 * uniqueID. This moves it to partNumber, where it belongs, and issues each master
 * a real system id from its plant counter.
 *
 * Ordered by _id so a re-run is deterministic, and each step is skipped when it
 * has already been applied, so the script is safe to run twice.
 */

const BATCH = 1000;

/** A legacy id is the raw part number; a generated one always has the plant prefix. */
const LEGACY_UNIQUE_ID = { $not: /^[A-Z0-9]+-\d{7}$/ };

const runBackfill = async ({ commit = false, verbose = true } = {}) => {
  const ownsConnection = mongoose.connection.readyState === 0;
  if (ownsConnection) await mongoose.connect(process.env.DATABASE);

  try {
    // Step 1 — copy the legacy uniqueID into partNumber where it is still missing.
    const needingPartNumber = await SpareMaster.countDocuments({
      partNumber: { $in: [null, ""] },
      uniqueID: { $nin: [null, ""] },
    });

    if (commit && needingPartNumber)
      await SpareMaster.updateMany(
        { partNumber: { $in: [null, ""] }, uniqueID: { $nin: [null, ""] } },
        [{ $set: { partNumber: "$uniqueID" } }],
      );

    // Step 2 — issue a system id to every master that does not have one yet.
    const pending = await SpareMaster.find(
      { uniqueID: LEGACY_UNIQUE_ID },
      { plant: 1, createdBy: 1 },
    )
      .sort({ _id: 1 })
      .lean();

    const result = {
      dryRun: !commit,
      partNumberBackfilled: commit ? needingPartNumber : 0,
      partNumberPending: needingPartNumber,
      uniqueIdPending: pending.length,
      uniqueIdAssigned: 0,
      unassigned: 0,
      sample: [],
    };

    if (commit) {
      for (let i = 0; i < pending.length; i += BATCH) {
        const slice = pending.slice(i, i + BATCH);

        const { plantId, plantName } = resolvePlantIdentity({
          master: slice[0],
          fallbackUser: slice[0]?.createdBy,
        });

        const reserved = await reserveMasterUniqueIds({
          plantId,
          plantName,
          count: slice.length,
        });

        if (!reserved) {
          result.unassigned += slice.length;
          continue;
        }

        const writes = slice.map((master, index) => {
          const uniqueID = formatMasterUniqueId(
            reserved.prefix,
            reserved.firstSequence + index,
          );
          if (result.sample.length < 5) result.sample.push(uniqueID);
          return {
            updateOne: {
              filter: { _id: master._id },
              update: { $set: { uniqueID } },
            },
          };
        });

        const written = await SpareMaster.bulkWrite(writes, { ordered: false });
        result.uniqueIdAssigned += written?.modifiedCount ?? 0;
      }
    }

    if (verbose) {
      console.log(`\nSpare Master id migration ${commit ? "(COMMITTED)" : "(DRY RUN)"}`);
      console.log(`  ${"partNumber to backfill".padEnd(26)} ${result.partNumberPending}`);
      console.log(`  ${"uniqueID to assign".padEnd(26)} ${result.uniqueIdPending}`);
      if (commit) {
        console.log(`  ${"partNumber backfilled".padEnd(26)} ${result.partNumberBackfilled}`);
        console.log(`  ${"uniqueID assigned".padEnd(26)} ${result.uniqueIdAssigned}`);
        console.log(`  ${"could not assign".padEnd(26)} ${result.unassigned}`);
        console.log(`  sample ids: ${result.sample.join(", ")}`);
      }
    }

    return result;
  } finally {
    if (ownsConnection) await mongoose.disconnect();
  }
};

if (require.main === module) {
  runBackfill({ commit: process.argv.includes("--commit") })
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error?.message ?? error);
      process.exit(1);
    });
}

module.exports = { runBackfill };
