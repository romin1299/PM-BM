const mongoose = require("mongoose");

const requestSheetOfSpareSchema = new mongoose.Schema(
  {
    requestSheetNo: {
      type: String,
    },
    whichParts: {
      type: [String],
    },
    partQty: {
      type: String,
    },
    requestSheetStatus: {
      type: String,
      default: "Generated",
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
      },
    ],

    remarkByRequestGeneratorIfBudgetIsNG: String,

    mtdHODApprovalIfBudgetIsNG: {
      user: {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Users",
        },
        tm_no: Number,
        tm_name: String,
        email: String,
      },
      status: {
        type: String,
        default: "Pending",
      },
    },

    machine: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MachinesAllData",
      },
      machine_code: String,
      machine_name: String,
      machine_nickname: String,
    },
    line: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lines",
      },
      line_id: String,
      line_name: String,
    },
    cell: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cells",
      },
      cell_id: String,
      cell_name: String,
    },
    subSection: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubSections",
      },
      subSection_id: String,
      subSection_name: String,
    },
    section: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Sections",
      },
      section_id: String,
      section_name: String,
      dashboardLevel: String,
    },
    plant: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Plants",
      },
      plant_id: String,
      plant_name: String,
    },
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
