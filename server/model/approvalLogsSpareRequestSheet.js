const mongoose = require("mongoose");

const { approvalSchemaObj, plantToMachineHierarchyObj } = require("./common");

const approvalLogsSpareRequestSheetSchema = new mongoose.Schema(
  {
    requestSheetNo: {
      type: String,
    },
    approvalOfMTD_TL: [approvalSchemaObj],
    approvalOfMTD_HOSS: [approvalSchemaObj],
    approvalOfPRD_TL: [approvalSchemaObj],
    approvalOfMTD_HOS: [approvalSchemaObj],
    approvalOfPRD_HOS: [approvalSchemaObj],
    approvalOfMTD_HOD: [approvalSchemaObj],
    approvalOfPRD_HOD: [approvalSchemaObj],
    ...plantToMachineHierarchyObj,
  },
  {
    timestamps: true,
  }
);

const ApprovalLogsSpareRequestSheet = new mongoose.model(
  "ApprovalLogsSpareRequestSheet",
  approvalLogsSpareRequestSheetSchema
);
module.exports = ApprovalLogsSpareRequestSheet;
