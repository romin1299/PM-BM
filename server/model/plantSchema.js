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

  categories: [
    {
      name: { type: String },
      subCategories: [
        {
          name: { type: String },
        },
      ],
    },
  ],
  approvalListOfMinorAndMajor: {
    minorApprovalList: { type: [String] },
    majorApprovalList: { type: [String] },
  },

  spareSheetDynamicApproval: {
    MTD: [String],
    PRD: [String],
  },

  leadTime: {
    orderRSSubmittedToHODApproval: { type: Number, default: 0 },
    HODApprovalToPRSubmittedByToolroomToPPD: { type: Number, default: 0 },
    PRSubmittedByToolroomToPPDToPRAssignToAllBuyers: {
      type: Number,
      default: 0,
    },
    PRAssignToAllBuyersToPOIssueToVendor: { type: Number, default: 0 },
    POIssueToVendorToPartReceive: { type: Number, default: 0 },
  },

  // hourly filter options for product/line report
  lessThanValue: {
    type: [Number],
  },
  greaterThan: {
    type: Number,
    default: 0,
  },
});

const Plant = new mongoose.model("Plants", plantSchema);
module.exports = Plant;
