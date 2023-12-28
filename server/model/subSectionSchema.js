const mongoose = require("mongoose");
const { allTargetData } = require("./common");

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

  allTargetData,
});

const SubSection = new mongoose.model("SubSections", subSectionSchema);
module.exports = SubSection;
