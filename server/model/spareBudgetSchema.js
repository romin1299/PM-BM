const mongoose = require("mongoose");

const spareBudgetSchema = new mongoose.Schema({
  isSectionWise: {
    type: Boolean,
    default: false,
  },

  section: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sections",
    },
    section_id: String,
    section_name: String,
    dashboardLevel: String,
  },
  subSection: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubSections",
    },
    subSection_id: String,
    subSection_name: String,
  },
  cell: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cells",
    },
    cell_id: String,
    cell_name: String,
  },

  financialYear: {
    inString: String,
    inNumber: Number,
  },

  plan: { type: [Number], default: () => Array(12).fill(0) },
  actual: { type: [Number], default: () => Array(12).fill(0) },
  BPDActual: { type: [Number], default: () => Array(12).fill(0) },
  /**
   * A month is open while it runs: its actual accumulates from every issuance
   * stock-out. Entering the month-end BPD figure closes it — the BPD value
   * becomes the month's actual and issuances no longer move it.
   */
  closedMonths: { type: [Boolean], default: () => Array(12).fill(false) },

  cumulativePlan: { type: [Number], default: () => Array(12).fill(0) },
  cumulativeActual: { type: [Number], default: () => Array(12).fill(0) },

  remarks: {
    type: [String],
    default: () => Array(12).fill(""),
  },
});

const SpareBudget = new mongoose.model("SpareBudget", spareBudgetSchema);
module.exports = SpareBudget;
