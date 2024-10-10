const mongoose = require("mongoose");

const requestSheetOfCMSchema = new mongoose.Schema({
  requestSheetNoOfCM: {
    type: String,
  },
  requestSheetOfBMRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "RequestSheetOfBM",
    default: null,
  },
  // partSuggestionByMTDTL: {
  //   type: String,
  // },

  //If require else byDefault is BM
  maintenanceType: {
    type: String,
    default: "BM",
  },
  priorityCode: {
    type: String,
  },

  // partSuggestionByMTDTL: {
  //   type: String,
  // },

  preAggregationTimeStampOfRequestSheet: {
    requestSheet_year: {
      type: String,
    },
    requestSheet_month: {
      type: String,
    },
  },

  plannedDateAndTimeOfCM: {
    type: Date,
  },
  sheetIssuedDateAndTimeOfCM: {
    type: Date,
  },

  attachedFilesByMTDUser: { type: [String] },

  attchedFileByAssignedUser: { type: [String] },

  cmBasicDataFilledByMTD_TL: {
    activityOfCM: { type: String },
    problemBackgroundOfCM: { type: String },
    // frequencyOfCM: {
    frequencyType: { type: String },
    frequencyValue: { type: String },
    // },

    categories: {
      type: String,
    },
    targetDateOfCM: { type: Date },
    inspectionItem: {
      type: String,
    },
    actionForLTPM: {
      type: String,
    },
    personForLTPM: {
      type: String,
    },
    partSuggestionByMTDTL: {
      type: String,
    },
  },

  shiftOfCM: {
    type: String,
  },
  qualityRelated: {
    type: String, //if string required then change value: Yes/No
  },

  //this field for requestSheet created by MTD TL user
  requestSheetCreatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },

  breakDownAttendedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },

  assignUserForCM: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Users",
  },

  // handOverUser: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "Users",
  // },

  supportingTM: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Users",
  },

  //for MTD TL approval
  approvalOfMTD_TL: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Users",
  },
  approvalStatusOfMTD_TL: {
    type: [String],
  },
  approvalDateAndTimeOfMTD_TL: {
    type: [Date], //If need String change it.
  },

  //for MTD TL approval for Log(History)
  approverNameLogOfMTD_TL: {
    type: [String],
  },
  // approvalStatusLogOfMTD_TL: {
  //   type: [String],
  // },
  // approvalDateAndTimeLogOfMTD_TL: {
  //   type: [Date], //If need String change it.
  // },

  //for MTD Sl
  // approvalOfMTD_SL: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "Users",
  // },
  // approvalStatusOfMTD_SL: {
  //   type: [String],
  // },
  // approvalDateAndTimeOfMTD_SL: {
  //   type: Date, //If need String change it.
  // },

  //for MTD HOSS
  approvalOfMTD_HOSS: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Users",
  },
  approvalStatusOfMTD_HOSS: {
    type: [String],
  },
  approvalDateAndTimeOfMTD_HOSS: {
    type: [Date], //If need String change it.
  },

  //for MTD HOSS for Log(History)
  approverNameLogOfMTD_HOSS: {
    type: [String],
  },
  // approvalStatusLogOfMTD_HOSS: {
  //   type: [String],
  // },
  // approvalDateAndTimeLogOfMTD_HOSS: {
  //   type: [Date], //If need String change it.
  // },

  //for section incharge MTD HOS approval
  approvalOfMTD_HOS: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Users",
  },
  approvalStatusOfMTD_HOS: {
    type: [String],
  },
  approvalDateAndTimeOfMTD_HOS: {
    type: [Date], //If need String change it.
  },

  //for section incharge MTD HOS approval for Log(History)
  approverNameLogOfMTD_HOS: {
    type: [String],
  },
  // approvalStatusLogOfMTD_HOS: {
  //   type: [String],
  // },
  // approvalDateAndTimeLogOfMTD_HOS: {
  //   type: [Date], //If need String change it.
  // },

  //for PRD TL approval
  approvalOfPRD_TL: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Users",
  },
  approvalStatusOfPRD_TL: {
    type: [String],
  },
  approvalDateAndTimeOfPRD_TL: {
    type: [Date], //If need String change it.
  },

  //for PRD TL approval for Log(History)
  approverNameLogOfPRD_TL: {
    type: [String],
  },
  // approvalStatusOfLogPRD_TL: {
  //   type: [String],
  // },
  // approvalDateAndTimeOfLogPRD_TL: {
  //   type: [Date], //If need String change it.
  // },

  rejectedRemarksOfRequestSheet: {
    type: [String],
  },

  dataSheetOfRequestSheet: {
    type: String,
  },
  attachedDataSheets: {
    type: String,
  },

  drawingOfRequestSheet: {
    type: String,
  },
  attachedDrawings: {
    type: [String],
  },

  //Spare parts related fields
  sparePartUsedOrNot: { type: String },
  changedParts: [
    {
      partNo: { type: String },
      partName: { type: String },
      makerName: { type: String },
      quantity: { type: Number },
      cost: { type: Number },
    },
  ],
  //Work details related fields
  workDetails: [
    {
      work: { type: String },
      tmId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
      },
      tmName: {
        type: String,
      },
      fromDate: {
        type: Date,
      },
      toDate: {
        type: Date,
      },
    },
  ],

  //Action related fields
  actionAndCounterMeasureStep: [
    {
      id: { type: Date },
      action: { type: String },
      status: { type: String },
    },
  ],

  //This approval used when major(> 2 hours) BD occurred

  //for section incharge PRD HOS approval
  // approvalOfPRD_HOS: {
  //   type: [mongoose.Schema.Types.ObjectId],
  //   ref: "Users",
  // },
  // approvalStatusOfPRD_HOS: {
  //   type: [String],
  // },
  // approvalDateAndTimeOfPRD_HOS: {
  //   type: [Date], //If need String change it.
  // },

  //for section incharge PRD HOS approval for Log(History)
  // approverNameLogOfPRD_HOS: {
  //   type: [String],
  // },
  // approvalStatusLogOfPRD_HOS: {
  //   type: [String],
  // },
  // approvalDateAndTimeLogOfPRD_HOS: {
  //   type: [Date], //If need String change it.
  // },

  //for PRD HOD approval
  // approvalOfPRD_HOD: {
  //   type: [mongoose.Schema.Types.ObjectId],
  //   ref: "Users",
  // },
  // approvalStatusOfPRD_HOD: {
  //   type: [String],
  // },
  // approvalDateAndTimeOfPRD_HOD: {
  //   type: [Date], //If need String change it.
  // },

  //for PRD HOD approval for Log(History)
  // approverNameLogOfPRD_HOD: {
  //   type: [String],
  // },
  // approvalStatusOfLogPRD_HOD: {
  //   type: [String],
  // },
  // approvalDateAndTimeLogOfPRD_HOD: {
  //   type: [Date], //If need String change it.
  // },

  //for MTD HOD approval
  approvalOfMTD_HOD: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Users",
  },
  approvalStatusOfMTD_HOD: {
    type: [String],
  },
  approvalDateAndTimeOfMTD_HOD: {
    type: [Date], //If need String change it.
  },

  //for MTD HOD approval for Log(History)
  approverNameLogOfMTD_HOD: {
    type: [String],
  },
  // approvalStatusLogOfMTD_HOD: {
  //   type: [String],
  // },
  // approvalDateAndTimeOfLogMTD_HOD: {
  //   type: [Date], //If need String change it.
  // },

  //Remaining fields for get data which will use on CM (Filled by MTD TL/Hoss)
  //Need to add activity,problem background, frequency, category.
  //With multi lines and machines selection. (Need to discussion on it).

  machineRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MachinesAllData",
  },
  lineRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lines",
  },
  cellRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cells",
  },
  subSectionRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubSections",
  },
  sectionRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Sections",
  },
  plantRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Plants",
  },

  requestSheetStatusOfCM: {
    type: String,
    default: "Generated",
  },

  getDataForApprovalDashboard: {
    Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    },
    departmentAndGradeOfUser: {
      type: String,
    },
  },

  preventive_corrective_maintenance: {
    type: String,
  },

  yokotenkai: {
    type: String,
  },
});

const RequestSheetOfCM = new mongoose.model(
  "CM_RequestSheetData",
  requestSheetOfCMSchema
);
module.exports = RequestSheetOfCM;
