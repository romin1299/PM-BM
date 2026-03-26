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
    pendingApprovalBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    },
    dynamicApprovalKeys: [String],
    isSpareSheetSendForApproval: {
      type: Boolean,
      default: false,
    },

    approvalOfMTD_TL: approvalSchemaObj,
    approvalOfMTD_HOSS: approvalSchemaObj,
    approvalOfPRD_TL: approvalSchemaObj,
    approvalOfMTD_HOS: approvalSchemaObj,
    approvalOfPRD_HOS: approvalSchemaObj,
    approvalOfMTD_HOD: approvalSchemaObj,
    approvalOfPRD_HOD: approvalSchemaObj,

    mtdHODApprovalIfBudgetIsNGApprovalLogs: [approvalSchemaObj],
    approvalOfMTD_TLApprovalLogs: [approvalSchemaObj],
    approvalOfMTD_HOSSApprovalLogs: [approvalSchemaObj],
    approvalOfPRD_TLApprovalLogs: [approvalSchemaObj],
    approvalOfMTD_HOSApprovalLogs: [approvalSchemaObj],
    approvalOfPRD_HOSApprovalLogs: [approvalSchemaObj],
    approvalOfMTD_HODApprovalLogs: [approvalSchemaObj],
    approvalOfPRD_HODApprovalLogs: [approvalSchemaObj],

    ...plantToMachineHierarchyObj,
  },
  {
    timestamps: true,
  }
);

requestSheetOfSpareSchema.index(
  {
    requestSheetNo: "text",
    requestSheetStatus: "text",
    "requestSheetCreatedBy.tm_name": "text",
    "cell.cell_name": "text",
    "line.line_name": "text",
    "machine.machine_name": "text",
    "machine.machine_code": "text",

    "mtdHODApprovalIfBudgetIsNGApprovalLogs.user.tm_name": "text",
    "approvalOfMTD_TLApprovalLogs.user.tm_name": "text",
    "approvalOfMTD_HOSSApprovalLogs.user.tm_name": "text",
    "approvalOfPRD_TLApprovalLogs.user.tm_name": "text",
    "approvalOfMTD_HOSApprovalLogs.user.tm_name": "text",
    "approvalOfPRD_HOSApprovalLogs.user.tm_name": "text",
    "approvalOfMTD_HODApprovalLogs.user.tm_name": "text",
    "approvalOfPRD_HODApprovalLogs.user.tm_name": "text",

    "mtdHODApprovalIfBudgetIsNGApprovalLogs.approvalStatus": "text",
    "approvalOfMTD_TLApprovalLogs.approvalStatus": "text",
    "approvalOfMTD_HOSSApprovalLogs.approvalStatus": "text",
    "approvalOfPRD_TLApprovalLogs.approvalStatus": "text",
    "approvalOfMTD_HOSApprovalLogs.approvalStatus": "text",
    "approvalOfPRD_HOSApprovalLogs.approvalStatus": "text",
    "approvalOfMTD_HODApprovalLogs.approvalStatus": "text",
    "approvalOfPRD_HODApprovalLogs.approvalStatus": "text",

    "mtdHODApprovalIfBudgetIsNGApprovalLogs.approvalDateAndTime": "text",
    "approvalOfMTD_TLApprovalLogs.approvalDateAndTime": "text",
    "approvalOfMTD_HOSSApprovalLogs.approvalDateAndTime": "text",
    "approvalOfPRD_TLApprovalLogs.approvalDateAndTime": "text",
    "approvalOfMTD_HOSApprovalLogs.approvalDateAndTime": "text",
    "approvalOfPRD_HOSApprovalLogs.approvalDateAndTime": "text",
    "approvalOfMTD_HODApprovalLogs.approvalDateAndTime": "text",
    "approvalOfPRD_HODApprovalLogs.approvalDateAndTime": "text",
  },
  {
    name: "SpareSheetFullTextIndex",
    weights: {
      requestSheetNo: 10,
      "requestSheetCreatedBy.tm_name": 8,
      requestSheetStatus: 6,
      "cell.cell_name": 5,
      "line.line_name": 5,
      "machine.machine_name": 5,
    },
  }
);
requestSheetOfSpareSchema.index(
  { requestSheetNo: 1 },
  { unique: true, sparse: true }
);
requestSheetOfSpareSchema.index({ createdAt: -1 });
requestSheetOfSpareSchema.index({ requestSheetStatus: 1, createdAt: -1 });
requestSheetOfSpareSchema.index({ pendingApprovalBy: 1, createdAt: -1 });
requestSheetOfSpareSchema.index({ "plant._id": 1, createdAt: -1 });
requestSheetOfSpareSchema.index({ "section._id": 1, createdAt: -1 });
requestSheetOfSpareSchema.index({ "subSection._id": 1, createdAt: -1 });
requestSheetOfSpareSchema.index({ "cell._id": 1, createdAt: -1 });
requestSheetOfSpareSchema.index({ "line._id": 1, createdAt: -1 });
requestSheetOfSpareSchema.index({ "machine._id": 1, createdAt: -1 });

const RequestSheetOfSpare = new mongoose.model(
  "RequestSheetOfSpare",
  requestSheetOfSpareSchema
);
module.exports = RequestSheetOfSpare;
