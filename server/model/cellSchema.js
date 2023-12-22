const mongoose = require("mongoose");
const { productionHrs } = require("./common");

const production_hrs_refObj = {
  type: Number,
  default: 0,
};

productionHrs.push({
  monthlyMBDCountTarget: {
    Apr: production_hrs_refObj,
    May: production_hrs_refObj,
    June: production_hrs_refObj,
    July: production_hrs_refObj,
    Aug: production_hrs_refObj,
    Sep: production_hrs_refObj,
    Oct: production_hrs_refObj,
    Nov: production_hrs_refObj,
    Dec: production_hrs_refObj,
    Jan: production_hrs_refObj,
    Feb: production_hrs_refObj,
    Mar: production_hrs_refObj,
  },
})

const cellSchema = new mongoose.Schema({
  cell_id: {
    type: String,
  },
  cell_name: {
    type: String,
  },
  subSection_names: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubSections",
  },
  cell_sequence: {
    type: Number,
  },

  productionHrs,
});

const Cell = new mongoose.model("Cells", cellSchema);
module.exports = Cell;
