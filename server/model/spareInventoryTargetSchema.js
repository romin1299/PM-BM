const mongoose = require("mongoose");

const spareInventoryTargetSchema = new mongoose.Schema({
  financialYear: {
    inString: String,
    inNumber: Number,
  },

  inventoryTarget: { type: [Number], default: () => Array(12).fill(0) },
});

const SpareInventoryTarget = new mongoose.model(
  "SpareInventoryTarget",
  spareInventoryTargetSchema,
);
module.exports = SpareInventoryTarget;
