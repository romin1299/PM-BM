const mongoose = require("mongoose");

const userObj = {
  user_type: { type: String },
  tm_no: { type: Number },
  tm_name: { type: String },
  email: { type: String },
};

const approvalObj = {
  approvalStatus: { type: String },
  approvalDateAndTime: { type: Date },
};

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

  sheetIssuedDateAndTimeOfCM: {
    type: Date,
  },

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
    attachedFilesByMTDUser: { type: [String] },
  },

  shiftOfCM: {
    type: String,
  },
  qualityRelated: {
    type: String, //if string required then change value: Yes/No
  },

  //this field for requestSheet created by MTD TL user
  // requestSheetCreatedBy: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "Users",
  // },

  requestSheetCreatedBy: userObj,

  // assignUserForCM: {
  //   type: [mongoose.Schema.Types.ObjectId],
  //   ref: "Users",
  // },

  assignUserForCM: [userObj],

  // handOverUser: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "Users",
  // },

  // supportingTM: {
  //   type: [mongoose.Schema.Types.ObjectId],
  //   ref: "Users",
  // },

  supportingTM: [userObj],

  //for MTD TL approval
  // approvalOfMTD_TL: {
  //   type: [mongoose.Schema.Types.ObjectId],
  //   ref: "Users",
  // },
  // approvalStatusOfMTD_TL: {
  //   type: [String],
  // },
  // approvalDateAndTimeOfMTD_TL: {
  //   type: [Date], //If need String change it.
  // },

  // //for MTD TL approval for Log(History)
  // approverNameLogOfMTD_TL: {
  //   type: [String],
  // },

  approvalOfMTD_TL: [
    {
      ...userObj,
      ...approvalObj,
    },
  ],

  //for MTD HOSS
  // approvalOfMTD_HOSS: {
  //   type: [mongoose.Schema.Types.ObjectId],
  //   ref: "Users",
  // },
  // approvalStatusOfMTD_HOSS: {
  //   type: [String],
  // },
  // approvalDateAndTimeOfMTD_HOSS: {
  //   type: [Date], //If need String change it.
  // },

  // //for MTD HOSS for Log(History)
  // approverNameLogOfMTD_HOSS: {
  //   type: [String],
  // },

  approvalOfMTD_HOSS: [
    {
      ...userObj,
      ...approvalObj,
    },
  ],

  //for section incharge MTD HOS approval
  // approvalOfMTD_HOS: {
  //   type: [mongoose.Schema.Types.ObjectId],
  //   ref: "Users",
  // },
  // approvalStatusOfMTD_HOS: {
  //   type: [String],
  // },
  // approvalDateAndTimeOfMTD_HOS: {
  //   type: [Date], //If need String change it.
  // },

  // //for section incharge MTD HOS approval for Log(History)
  // approverNameLogOfMTD_HOS: {
  //   type: [String],
  // },

  approvalOfMTD_HOS: [
    {
      ...userObj,
      ...approvalObj,
    },
  ],

  //for PRD TL approval
  // approvalOfPRD_TL: {
  //   type: [mongoose.Schema.Types.ObjectId],
  //   ref: "Users",
  // },
  // approvalStatusOfPRD_TL: {
  //   type: [String],
  // },
  // approvalDateAndTimeOfPRD_TL: {
  //   type: [Date], //If need String change it.
  // },

  // //for PRD TL approval for Log(History)
  // approverNameLogOfPRD_TL: {
  //   type: [String],
  // },

  approvalOfPRD_TL: [
    {
      ...userObj,
      ...approvalObj,
    },
  ],

  rejectedRemarksOfRequestSheet: {
    type: [String],
  },

  commonDataFilledByAssignUser: [
    {
      plannedDateAndTimeOfCM: {
        type: Date,
      },
      preAggregationTimeStampOfRequestSheet: {
        requestSheet_year: {
          type: String,
        },
        requestSheet_month: {
          type: String,
        },
      },

      quarterlyDataOfTheCM: [
        {
          requestSheet_quarter: {
            type: String,
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
              id: { type: Date },
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
          statusOfPlannedCM: { type: String },
        },
      ],
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
  // approvalOfMTD_HOD: {
  //   type: [mongoose.Schema.Types.ObjectId],
  //   ref: "Users",
  // },
  // approvalStatusOfMTD_HOD: {
  //   type: [String],
  // },
  // approvalDateAndTimeOfMTD_HOD: {
  //   type: [Date], //If need String change it.
  // },

  // //for MTD HOD approval for Log(History)
  // approverNameLogOfMTD_HOD: {
  //   type: [String],
  // },

  approvalOfMTD_HOD: [
    {
      ...userObj,
      ...approvalObj,
    },
  ],

  getDataForApprovalDashboard: {
    Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    },
    departmentAndGradeOfUser: {
      type: String,
    },
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
});

const RequestSheetOfCM = new mongoose.model(
  "CM_RequestSheetData",
  requestSheetOfCMSchema
);
module.exports = RequestSheetOfCM;
