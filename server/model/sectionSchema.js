const mongoose = require("mongoose");

const { TmMttrSkillScoresAndLimit } = require("./common");

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

  TmMttrSkillScoresAndLimit,

  yearGroup: [
    {
      group: { type: String },
      from: { type: Number },
      to: { type: Number, default: Number.MAX_VALUE },
    },
  ],
});

const Section = new mongoose.model("Sections", sectionSchema);
module.exports = Section;
