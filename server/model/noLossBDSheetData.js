const mongoose = require("mongoose");

const noLossBDSheetDataSchema = new mongoose.Schema({
  noLossBDNo: {
    type: String,
  },
  DateOfNoLossBD: {
    type: Date,
  },
  // for main category
  maintenanceType: {
    type: String,
  },
  problemsOfBM: [{ id: { type: Date }, problem: { type: String } }],

  shiftOfBM: {
    type: String,
  },

  //for sheet issued
  problemOccurredDateAndTimeOfBM: {
    type: Date,
  },
  sheetIssuedDateAndTimeOfBM: {
    type: Date,
  },

  //for from and to date and time
  workStartedDateOfBM: { type: Date }, //If need String change it.
  workEndedDateOfBM: { type: Date }, //If need String change it.

  breakDownTime: { type: Number },

  //for cause
  causeOfNoLoss: {
    type: String,
  },

  //preventive_corrective_maintenance as on BM
  counterMeasureStep: {
    type: String,
  },

  //   whyAnalysis: {
  //     why1: { type: String },
  //     why2: { type: String },
  //     why3: { type: String },
  //     why4: { type: String },
  //     why5: { type: String },
  //   },

  actionAndCounterMeasureStep: [
    {
      id: { type: Date },
      action: { type: String },
      status: { type: String },
    },
  ],

  //for done by
  assignUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },

  preAggregationTimeStampOfRequestSheet: {
    requestSheet_year: {
      type: String,
    },
    requestSheet_month: {
      type: String,
    },
  },

  //for first time or repeat / Temp or Perma
  firstTimeOrRepeat: { type: String },

  categoriesOfRequestSheet: [
    {
      category: { type: String },
      subCategory: { type: String },
    },
  ],

  doneByNoLossBD: {
    type: String,
  },

  supportingTM: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Users",
  },

  machineStatus: {
    type: String,
  },

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
});

const noLossBDData = new mongoose.model(
  "noLossBDData",
  noLossBDSheetDataSchema
);
module.exports = noLossBDData;
