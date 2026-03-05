const mongoose = require("mongoose");
const { approvalSchemaObj, plantToMachineHierarchyObj } = require("./common");
const { spareApprovalStatus } = require("../utils/spareManagementUtils");

const requestSheetOfSpareSchema = new mongoose.Schema(
  {
    requestSheetNo: {
      type: String,
    },
    whichParts: {
      type: [String],
    },
    newPartFor: {
      type: String,
    },
    partQty: {
      type: String,
    },
    requestSheetStatus: {
      type: String,
      default: spareApprovalStatus?.[1],
    },
    requestSheetCreatedBy: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
      },
      tm_no: Number,
      tm_name: String,
      email: String,
    },
    budget: {
      budgetStatus: {
        type: String,
      },
      requiredBudget: {
        type: Number,
      },
    },
    changeParts: [
      {
        partName: String,
        partModel: String,
        minQuantity: Number,
        quantityRequired: Number, // OR Max quantity
        manufacture: String,
        supplier: String,
        approxUnitPrice: Number,
        standerOrManufacturingPart: String,
        drawingAttach: String,
        drawingAttachOriginalName: String,
      },
    ],

    ifBudgetIsNG: {
      remarkByRequestGenerator: String,
      documentByRequestGenerator: {
        filename: String,
        originalname: String,
      },
    },

    mtdHODApprovalIfBudgetIsNG: approvalSchemaObj,
    approvalOfMTD_TL: approvalSchemaObj,
    approvalOfMTD_HOSS: approvalSchemaObj,
    approvalOfPRD_TL: approvalSchemaObj,
    approvalOfMTD_HOS: approvalSchemaObj,
    approvalOfPRD_HOS: approvalSchemaObj,
    approvalOfMTD_HOD: approvalSchemaObj,
    approvalOfPRD_HOD: approvalSchemaObj,

    ...plantToMachineHierarchyObj,
  },
  {
    timestamps: true,
  }
);

const RequestSheetOfSpare = new mongoose.model(
  "RequestSheetOfSpare",
  requestSheetOfSpareSchema
);
module.exports = RequestSheetOfSpare;
