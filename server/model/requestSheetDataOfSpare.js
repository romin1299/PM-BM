const mongoose = require("mongoose");
const { approvalSchemaObj, plantToMachineHierarchyObj } = require("./common");
const { spareApprovalStatus } = require("../utils/spareManagementUtils");

const orderTrackingTimestamp = {
  inString: String,
  inDate: Date,
};

const requestSheetOfSpareSchema = new mongoose.Schema(
  {
    requestSheetNo: {
      type: String,
    },
    // whichParts: {
    //   type: [String],
    // },
    newPartFor: {
      type: String,
    },
    partQty: {
      type: String,
    },
    partRequestFor: {
      type: String,
      enum: ["MTD", "PRD"],
      default: "MTD",
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
    newOrReOrderRequest: {
      type: String,
      default: "NEW",
      enum: ["NEW", "REORDER"],
    },
    changeParts: [
      {
        masterId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SpareMaster",
        },
        partName: String,
        partModel: String,
        minQuantity: Number,
        maxQuantity: Number,
        quantityRequired: Number,
        maker: String,
        supplierName: String,
        supplierCategory: String,
        approxUnitPrice: Number,
        standerOrManufacturingPart: String,
        normalOrUrgentPart: String,
        /**
         * Drawings for the part. An array like additionalAttachments because a
         * part can need several drawings; it replaced a single filename plus a
         * drawingAttachOriginalName companion field, which could only ever hold
         * one and had no way to be added to.
         */
        drawingAttach: [
          {
            filename: String,
            originalname: String,
          },
        ],
        additionalAttachments: [
          {
            filename: String,
            originalname: String,
          },
        ],
        //Batch wise
        batchId: {
          type: mongoose.Schema.Types.ObjectId,
        },
        rsPRGenerationTimeStamp: orderTrackingTimestamp,
        rsPRGenerationRemarks: String,
        rsPRAssignToAllBuyersTimeStamp: orderTrackingTimestamp,
        rsPRAssignToAllBuyersRemarks: String,
        rsPOIssueToVendorTimeStamp: orderTrackingTimestamp,
        rsPOIssueToVendorRemarks: String,

        //Part wise
        rsPartReceiveTimeStamp: orderTrackingTimestamp,
        rsPartReceiveRemarks: String,
        rsPartInspectionTimeStamp: orderTrackingTimestamp,
        rsPartInspectionRemarks: String,
        rsMRNIssuedTimeStamp: orderTrackingTimestamp,
        rsMRNIssuedRemarks: String,
        rsMRNApprovedTimeStamp: orderTrackingTimestamp,
        rsMRNApprovedRemarks: String,
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
    approvalOfPRD_HOSS: approvalSchemaObj,
    approvalOfMTD_HOS: approvalSchemaObj,
    approvalOfPRD_HOS: approvalSchemaObj,
    approvalOfMTD_HOD: approvalSchemaObj,
    approvalOfPRD_HOD: approvalSchemaObj,
    approvalOfTOOL_ROOM: approvalSchemaObj,

    mtdHODApprovalIfBudgetIsNGApprovalLogs: [approvalSchemaObj],
    approvalOfMTD_TLApprovalLogs: [approvalSchemaObj],
    approvalOfMTD_HOSSApprovalLogs: [approvalSchemaObj],
    approvalOfPRD_TLApprovalLogs: [approvalSchemaObj],
    approvalOfPRD_HOSSApprovalLogs: [approvalSchemaObj],
    approvalOfMTD_HOSApprovalLogs: [approvalSchemaObj],
    approvalOfPRD_HOSApprovalLogs: [approvalSchemaObj],
    approvalOfMTD_HODApprovalLogs: [approvalSchemaObj],
    approvalOfPRD_HODApprovalLogs: [approvalSchemaObj],
    approvalOfTOOL_ROOMApprovalLogs: [approvalSchemaObj],

    ...plantToMachineHierarchyObj,

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

    rsSubmittedTimeStamp: orderTrackingTimestamp,
    rsHODApprovalTimeStamp: orderTrackingTimestamp,
    rsToolroomApprovalTimeStamp: orderTrackingTimestamp,
  },
  {
    timestamps: true,
  },
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
    "approvalOfPRD_HOSSApprovalLogs.user.tm_name": "text",
    "approvalOfMTD_HOSApprovalLogs.user.tm_name": "text",
    "approvalOfPRD_HOSApprovalLogs.user.tm_name": "text",
    "approvalOfMTD_HODApprovalLogs.user.tm_name": "text",
    "approvalOfPRD_HODApprovalLogs.user.tm_name": "text",
    "approvalOfTOOL_ROOMApprovalLogs.user.tm_name": "text",

    // "mtdHODApprovalIfBudgetIsNGApprovalLogs.approvalStatus": "text",
    // "approvalOfMTD_TLApprovalLogs.approvalStatus": "text",
    // "approvalOfMTD_HOSSApprovalLogs.approvalStatus": "text",
    // "approvalOfPRD_TLApprovalLogs.approvalStatus": "text",
    // "approvalOfMTD_HOSApprovalLogs.approvalStatus": "text",
    // "approvalOfPRD_HOSApprovalLogs.approvalStatus": "text",
    // "approvalOfMTD_HODApprovalLogs.approvalStatus": "text",
    // "approvalOfPRD_HODApprovalLogs.approvalStatus": "text",
    // "approvalOfTOOL_ROOMApprovalLogs.approvalStatus": "text",

    "mtdHODApprovalIfBudgetIsNGApprovalLogs.approvalDateAndTime": "text",
    "approvalOfMTD_TLApprovalLogs.approvalDateAndTime": "text",
    "approvalOfMTD_HOSSApprovalLogs.approvalDateAndTime": "text",
    "approvalOfPRD_TLApprovalLogs.approvalDateAndTime": "text",
    "approvalOfPRD_HOSSApprovalLogs.approvalDateAndTime": "text",
    "approvalOfMTD_HOSApprovalLogs.approvalDateAndTime": "text",
    "approvalOfPRD_HOSApprovalLogs.approvalDateAndTime": "text",
    "approvalOfMTD_HODApprovalLogs.approvalDateAndTime": "text",
    "approvalOfPRD_HODApprovalLogs.approvalDateAndTime": "text",
    "approvalOfTOOL_ROOMApprovalLogs.approvalDateAndTime": "text",

    "rsSubmittedTimeStamp.inString": "text",
    "rsHODApprovalTimeStamp.inString": "text",
    "rsToolroomApprovalTimeStamp.inString": "text",
    "rsPRAssignToAllBuyersTimeStamp.inString": "text",
    "rsPOIssueToVendorTimeStamp.inString": "text",
    "changeParts.rsPartReceiveTimeStamp.inString": "text",
    "changeParts.rsPartInspectionTimeStamp.inString": "text",
    "changeParts.rsMRNIssuedTimeStamp.inString": "text",
    "changeParts.rsMRNApprovedTimeStamp.inString": "text",
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
  },
);
requestSheetOfSpareSchema.index(
  { requestSheetNo: 1 },
  { unique: true, sparse: true },
);
requestSheetOfSpareSchema.index({ createdAt: -1 });
requestSheetOfSpareSchema.index({ requestSheetStatus: 1, createdAt: -1 });
requestSheetOfSpareSchema.index({ pendingApprovalBy: 1, createdAt: -1 });
requestSheetOfSpareSchema.index(
  {
    "rsTimeStamp.year.inString": -1,
    "rsTimeStamp.month.inString": -1,
  },
  {
    name: "YearMonthIndex",
    background: true,
  },
);
requestSheetOfSpareSchema.index({ "plant._id": 1, createdAt: -1 });
requestSheetOfSpareSchema.index({ "section._id": 1, createdAt: -1 });
requestSheetOfSpareSchema.index({ "subSection._id": 1, createdAt: -1 });
requestSheetOfSpareSchema.index({ "cell._id": 1, createdAt: -1 });
requestSheetOfSpareSchema.index({ "line._id": 1, createdAt: -1 });
requestSheetOfSpareSchema.index({ "machine._id": 1, createdAt: -1 });

const RequestSheetOfSpare = new mongoose.model(
  "RequestSheetOfSpare",
  requestSheetOfSpareSchema,
);
module.exports = RequestSheetOfSpare;
