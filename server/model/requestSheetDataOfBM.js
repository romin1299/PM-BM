const mongoose = require("mongoose");

const requestSheetOfBMSchema = new mongoose.Schema({
  requestSheetNoOfBM: {
    type: String,
  },

  //If require else byDefault is BM
  maintenanceType: {
    type: String,
  },
  priorityCode: {
    type: String,
  },
  problemOccurredDateAndTimeOfBM: {
    type: Date,
  },
  sheetIssuedDateAndTimeOfBM: {
    type: Date,
  },
  sheetCompletedDateAndTime: {
    type: Date,
    default: new Date(),
  },
  breakDownBasicDataFilledByPRD: {
    problemFaced: { type: String },
    PRD_ObservationForProblem_5Why_1How: { type: String },
    why_5M_1E: { type: String },
    where_process: { type: String },
    when_frequency: { type: String },
    who_person: { type: String }, //if require _id then put ref id of the user
    which_defectLocation: { type: String },
    how_details: { type: String },
  },
  maintenanceReportFilledByMTD: {
    workStartedDateOfBM: { type: Date }, //If need String change it.
    workEndedDateOfBM: { type: Date }, //If need String change it.
    problemsOfBM: [{ id: { type: Date }, problem: { type: String } }], // If array of object [{}] require change it.
    whyAnalysis: {
      why1: { type: String },
      why2: { type: String },
      why3: { type: String },
      why4: { type: String },
      why5: { type: String },
    }, //If array of object [{}] require change it.

    //Mostly use fields for charts
    breakDownTime: { type: Number },
    maintenanceTime: { type: Number },
    qualityCheckTime: { type: Number },
    breakTime: { type: Number },

    minorBD: { type: String },
    majorBD: { type: String },

    firstTime: { type: String }, // need to change if new func. occurred for this
    repeat: { type: String }, // need to change if new func. occurred for this

    actionAndCounterMeasureStep: [
      {
        id: { type: Date },
        action: { type: String },
        status: { type: String },
      },
    ],
  },

  requestReceivedMTD: {
    type: String,
  },

  MTD_TL: {
    type: String,
  },

  sectionIncharge: {
    type: String,
  },

  feedbackMTD: {
    type: String,
  },

  // partQualityByPRD: {
  //   type: String,
  // },
  // partQualityByMTD: {
  //   type: String,
  // },

  teamLeaderPRD: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },
  shiftOfBM: {
    type: String,
  },
  qualityRelated: {
    type: String, //if string required then change value: Yes/No
  },

  //optional
  requestSheetCreatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },

  breakDownAttendedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },
  breakDownAttendedStatus: {
    type: String,
  },

  assignOperator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },

  handOverUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },

  finalActivity: {
    type: String,
  },

  statusPRD_TL: {
    type: String,
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
  approvalLogOfMTD_TL: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Users",
  },
  approvalStatusLogOfMTD_TL: {
    type: [String],
  },
  approvalDateAndTimeLogOfMTD_TL: {
    type: [Date], //If need String change it.
  },

  //for MTD Sl
  approvalOfMTD_SL: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Users",
  },
  approvalStatusOfMTD_SL: {
    type: [String],
  },
  approvalDateAndTimeOfMTD_SL: {
    type: [Date], //If need String change it.
  },

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
  approvalLogOfMTD_HOSS: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Users",
  },
  approvalStatusLogOfMTD_HOSS: {
    type: [String],
  },
  approvalDateAndTimeLogOfMTD_HOSS: {
    type: [Date], //If need String change it.
  },

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
  approvalOfLogMTD_HOS: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Users",
  },
  approvalStatusLogOfMTD_HOS: {
    type: [String],
  },
  approvalDateAndTimeLogOfMTD_HOS: {
    type: [Date], //If need String change it.
  },

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
  approvalOfLogPRD_TL: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Users",
  },
  approvalStatusOfLogPRD_TL: {
    type: [String],
  },
  approvalDateAndTimeOfLogPRD_TL: {
    type: [Date], //If need String change it.
  },

  rejectedRemarksOfRequestSheet: {
    type: [String],
  },

  feedbackMTD_HOS: { type: String }, //need to add who is add feedback

  qualityConfirmed: { type: String },
  //part quality checked by PRD
  partQualityCheckedByPRD: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },
  partQualityStatusOfPRD: {
    type: String, //yes no
  },
  partQualityDateAndTimeOfPRD: {
    type: Date, //If need String change it.
  },

  //part quality checked by MTD
  partQualityCheckedByMTD: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },
  partQualityStatusOfMTD: {
    type: String,
  },
  partQualityDateAndTimeOfMTD: {
    type: Date, //If need String change it.
  },

  dataSheetOfBM: {
    type: String,
  },
  drawingOfBM: {
    type: String,
  },

  //Spare parts related fields
  sparePartUsedOrNot: { type: Boolean },
  changedParts: [
    {
      partNo: { type: String },
      partName: { type: String },
      makerName: { type: String },
      quantity: { type: Number },
      cost: { type: Number },
    },
  ],

  //This approval used when major(> 2 hours) BD occurred

  //for section incharge PRD HOS approval
  approvalOfPRD_HOS: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Users",
  },
  approvalStatusOfPRD_HOS: {
    type: [String],
  },
  approvalDateAndTimeOfPRD_HOS: {
    type: [Date], //If need String change it.
  },

  //for section incharge PRD HOS approval for Log(History)
  approvalLogOfPRD_HOS: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Users",
  },
  approvalStatusLogOfPRD_HOS: {
    type: [String],
  },
  approvalDateAndTimeLogOfPRD_HOS: {
    type: [Date], //If need String change it.
  },

  //for PRD HOD approval
  approvalOfPRD_HOD: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Users",
  },
  approvalStatusOfPRD_HOD: {
    type: [String],
  },
  approvalDateAndTimeOfPRD_HOD: {
    type: [Date], //If need String change it.
  },

  //for PRD HOD approval for Log(History)
  approvalOfLogPRD_HOD: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Users",
  },
  approvalStatusOfLogPRD_HOD: {
    type: [String],
  },
  approvalDateAndTimeLogOfPRD_HOD: {
    type: [Date], //If need String change it.
  },

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
  approvalOfLogMTD_HOD: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Users",
  },
  approvalStatusLogOfMTD_HOD: {
    type: [String],
  },
  approvalDateAndTimeOfLogMTD_HOD: {
    type: [Date], //If need String change it.
  },

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

  // assignOperator: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "Users",
  // },

  // finalActivity: {
  //   type: String,
  // },

  // statusPRD_TL: {
  //   type: String,
  // },
});

const RequestSheetOfBM = new mongoose.model(
  "RequestSheetOfBM",
  requestSheetOfBMSchema
);
module.exports = RequestSheetOfBM;
