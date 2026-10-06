const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config({ path: path.join(__dirname, "../config.env") });

/**
 * Required for their side effect: the repair walks a machine up to its plant,
 * and populating through a level needs that level's model registered.
 */
require("../model/machineSchema");
require("../model/lineSchema");
require("../model/cellSchema");
require("../model/subSectionSchema");
require("../model/sectionSchema");
require("../model/plantSchema");

const {
  repairCMSheetHierarchy,
} = require("../services/cm/cmHierarchyRepairService");

/**
 * Re-derives every CM sheet's hierarchy from the machine its machineRef names,
 * so the sheet's parents and the machine it reports are the same place.
 *
 * Dry run by default; pass --commit to write. Safe to run again — a sheet
 * already in step is counted and skipped.
 *
 *   node scripts/repairCMHierarchyRefs.js
 *   node scripts/repairCMHierarchyRefs.js --commit
 */
const run = async ({ commit = false } = {}) => {
  const ownsConnection = mongoose.connection.readyState === 0;
  if (ownsConnection) await mongoose.connect(process.env.DATABASE);

  try {
    console.log(`database: ${mongoose.connection.name}`);
    return await repairCMSheetHierarchy({ commit });
  } finally {
    if (ownsConnection) await mongoose.disconnect();
  }
};

if (require.main === module) {
  run({ commit: process.argv.includes("--commit") })
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error?.message ?? error);
      process.exit(1);
    });
}

module.exports = { run };
