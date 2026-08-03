const mongoose = require("mongoose");

const machineCostSchema = new mongoose.Schema({
  ID: {
    type: String,
    default: "MC1",
  },
  machineCost: {
    type: Number,
    default: 1,
  },
});

const MachineCost = new mongoose.model("MachineCosts", machineCostSchema);

module.exports = MachineCost;
