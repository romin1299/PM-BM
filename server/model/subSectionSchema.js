const mongoose = require("mongoose");
const { productionHrs } = require("./common");

const subSectionSchema = new mongoose.Schema({
  subSection_id: {
    type: String,
  },
  subSection_name: {
    type: String,
  },
  section_names: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Sections",
  },
  subSection_sequence: {
    type: Number,
  },
  remarksOnMainDashboard: {
    type: String,
  },

  productionHrs,
});

const SubSection = new mongoose.model("SubSections", subSectionSchema);
module.exports = SubSection;
