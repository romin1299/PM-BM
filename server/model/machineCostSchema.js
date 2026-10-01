const mongoose = require("mongoose");

const machineCostSchema = new mongoose.Schema({
  ID: {
    type: String,
    default: "MC1",
  },
  /**
   * In millions, the unit it is entered and displayed in, so the holding ratio
   * divides two figures of the same scale: Inventory Cost (Mil.) / Machine Cost
   * (Mil.) x 100. It was previously kept in rupees.
   */
  machineCost: {
    type: Number,
    default: 1,
  },
});

const MachineCost = new mongoose.model("MachineCosts", machineCostSchema);

module.exports = MachineCost;
