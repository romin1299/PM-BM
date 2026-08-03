const mongoose = require("mongoose");
const { approvalSchemaObj, plantToMachineHierarchyObj } = require("./common");

const spareIssuanceSummarySchema = new mongoose.Schema(
  {
    changeParts: [
      {
        masterId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SpareMaster",
        },
        whichParts: String,
        location: String,
        partName: String,
        partModel: String,
        maker: String, //Maker
        quantityRequired: Number,
        temporaryOrPermanent: {
          type: String,
          enum: ["Temporary", "Permanent"],
        },
        returnTargetDateIfTemporary: {
          inString: String,
          inDate: Date,
        },
        returnTargetDateRevision: [String],
        closingStatusIfTemporary: String,

        issuanceApprovalStatus: String,
        pendingApprovalBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Users",
        },
        dynamicApprovalKeys: [String],
        currentApprovalIndex: {
          type: Number,
          default: 0,
        },

        approvalOfMTD_TL: approvalSchemaObj,
        approvalOfMTD_HOSS: approvalSchemaObj,
        approvalOfPRD_TL: approvalSchemaObj,
        approvalOfPRD_HOSS: approvalSchemaObj,
        approvalOfMTD_HOS: approvalSchemaObj,
        approvalOfPRD_HOS: approvalSchemaObj,
        approvalOfMTD_HOD: approvalSchemaObj,
        approvalOfPRD_HOD: approvalSchemaObj,
        approvalOfTOOL_ROOM: approvalSchemaObj,
      },
    ],

    ...plantToMachineHierarchyObj,

    issuedFrom: String,
    requestedDepartment: {
      type: String,
      enum: ["MTD", "PRD"],
      default: "MTD",
    },

    createdBy: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
      },
      tm_no: Number,
      tm_name: String,
      email: String,
      plant_data: String,
    },

    rsTimeStamp: {
      year: {
        inString: String, //financial
        inNumber: Number,
      },
      month: {
        inString: String,
        inNumber: Number,
      },
    },
  },
  {
    timestamps: true,
  },
);

const SpareIssuanceSummary = new mongoose.model(
  "SpareIssuanceSummary",
  spareIssuanceSummarySchema,
);

module.exports = SpareIssuanceSummary;
