const mongoose = require("mongoose");
const { allTargetData } = require("./common");

const production_hrs_refObj = {
  type: Number,
  default: 0,
};

allTargetData.push({
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
  yearTotalMBDCountTarget: production_hrs_refObj,
});

const sectionSchema = new mongoose.Schema({
  section_id: {
    type: String,
  },
  section_name: {
    type: String,
  },
  dashboardLevel: {
    type: String,
  },
  plant_names: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Plants",
  },
  remarksOnMainDashboard: {
    type: String,
  },

  allTargetData,
});

const Section = new mongoose.model("Sections", sectionSchema);
module.exports = Section;
