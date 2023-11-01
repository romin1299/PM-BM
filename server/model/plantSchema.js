const mongoose = require("mongoose");

const plantSchema = new mongoose.Schema({
  plant_id: {
    type: String,
  },
  plant_name: {
    type: String,
  },

  shiftOfBM: [
    {
      shiftName: { type: String },
      shiftStartTime: { type: String },
      shiftEndTime: { type: String },
    },
  ],

  differentCategories: [
    {
      categoryName: { type: String },
      categories: { type: [String] },
    },
  ],
  approvalListOfMinorAndMajor: {
    minorApprovalList: { type: [String] },
    majorApprovalList: { type: [String] },
  },
});

const Plant = new mongoose.model("Plants", plantSchema);
module.exports = Plant;
