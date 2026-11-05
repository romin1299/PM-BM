const mongoose = require("mongoose");

/**
 * The inventory target of one cell for one financial year: an available-quantity
 * figure per month (Apr ... Mar), drawn as a line over that cell's bars on the
 * Each Cell Wise Inventory Bifurcation.
 */
const spareCellInventoryTargetSchema = new mongoose.Schema(
  {
    financialYear: { type: String, required: true },
    cell: { type: mongoose.Schema.Types.ObjectId, ref: "Cells", required: true },
    target: { type: [Number], default: () => Array(12).fill(0) },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

// One target per cell per year; also what makes the save an upsert.
spareCellInventoryTargetSchema.index(
  { financialYear: 1, cell: 1 },
  { unique: true },
);

module.exports = mongoose.model(
  "SpareCellInventoryTarget",
  spareCellInventoryTargetSchema,
);
