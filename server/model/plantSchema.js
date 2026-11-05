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

  spareIssuanceDynamicApproval: {
    MTD: [String],
    PRD: [String],
  },

  leadTime: {
    orderRSSubmittedToHODApproval: { type: Number, default: 0 },
    HODApprovalToToolRoomApproval: { type: Number, default: 0 },
    ToolroomApprovalToPRSubmittedByToolroomToPPD: { type: Number, default: 0 },
    PRSubmittedByToolroomToPPDToPRAssignToAllBuyers: {
      type: Number,
      default: 0,
    },
    PRAssignToAllBuyersToPOIssueToVendor: { type: Number, default: 0 },
    /**
     * Part receipt is timed by the part's supplier category, because an
     * imported part spends longer in transit than a local one. The single
     * value below is what every part was timed with before the split and
     * remains the fallback until a plant saves both halves - see
     * partReceiveLeadTimeFor in utils/spareManagementUtils.js.
     */
    POIssueToVendorToPartReceive: { type: Number, default: 0 },
    localPOIssueToVendorToPartReceive: { type: Number, default: 0 },
    importedPOIssueToVendorToPartReceive: { type: Number, default: 0 },
    partReceiveToPartInspection: { type: Number, default: 0 },
    partInspectionToMRNIssued: { type: Number, default: 0 },
    MRNIssuedToMRNApproved: { type: Number, default: 0 },
  },

  /**
   * Last sequence number handed out for a Spare Master uniqueID in this plant.
   * Incremented with $inc so concurrent registrations cannot be given the same
   * number; gaps are acceptable, collisions are not.
   */
  spareMasterUniqueIDSeq: {
    type: Number,
    default: 0,
  },

  /**
   * Last sequence number handed out for a Spare Change Request in this plant
   * ("CR-0001"). Incremented with $inc so concurrent requests cannot collide;
   * gaps are acceptable.
   */
  spareChangeRequestSeq: {
    type: Number,
    default: 0,
  },

  /**
   * Last sequence number handed out for a Spare Delete Request in this plant
   * ("DR-0001"). Same atomic counter pattern as the change requests.
   */
  spareDeleteRequestSeq: {
    type: Number,
    default: 0,
  },

  spareCurrenciesWithUnit: [
    {
      currencyUnit: String,
      currencyRate: Number,
    },
  ],

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
