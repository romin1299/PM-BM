const mongoose = require("mongoose");

const userObj = {
  userRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },
  user_type: { type: String },
  tm_no: { type: Number },
  tm_name: { type: String },
  email: { type: String },
};

const approvalObj = {
  approvalStatus: { type: String },
  approvalDateAndTime: { type: String },
  rejectedRemarks: { type: String },
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

  //If require else byDefault is BM
  maintenanceType: {
    type: String,
    default: "BM",
  },
  priorityCode: {
    type: String,
  },

  sheetIssuedDateAndTimeOfCM: { type: String },

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
    other_categories: {
      type: String,
    },
    plannedDateAndTimeOfCM: { type: String },
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

  requestSheetCreatedBy: userObj,

  commonDataFilledByAssignUser: [
    {
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
          targetDateOfCM: { type: String },
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
              // tmId: {
              //   type: mongoose.Schema.Types.ObjectId,
              //   ref: "Users",
              // },
              // tmName: {
              //   type: String,
              // },
              user: [userObj],
              fromDate: {
                type: Date,
              },
              toDate: {
                type: Date,
              },
            },
          ],

          totalTimeBasedOnWork: {
            type: Number,
            default: 0,
          },
          //Action related fields
          actionAndCounterMeasureStep: [
            {
              id: { type: Date },
              action: { type: String },
              status: { type: String },
            },
          ],
          statusOfPlannedCM: { type: String },

          assignUserForCM: [userObj],
          approvalOfMTD_TL: [
            {
              ...userObj,
              ...approvalObj,
            },
          ],

          approvalOfMTD_HOSS: [
            {
              ...userObj,
              ...approvalObj,
            },
          ],
          approvalOfMTD_HOS: [
            {
              ...userObj,
              ...approvalObj,
            },
          ],
          approvalOfPRD_TL: [
            {
              ...userObj,
              ...approvalObj,
            },
          ],
          approvalOfMTD_HOD: [
            {
              ...userObj,
              ...approvalObj,
            },
          ],

          isPermissionOfMTDTL: {
            type: String,
          },

          isPermissionOfPRDTL: {
            type: String,
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

          attachedFileByAssignedUser: {
            type: String,
          },

          rejectedRemarksOfRequestSheet: {
            type: [String],
          },

          requestSheetStatusOfCM: {
            type: String,
            default: "Generated",
          },
        },
      ],
    },
  ],
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

  plantToMachineHierarchyRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PlantToMachineHierarchy",
  },
});

const RequestSheetOfCM = new mongoose.model(
  "CM_RequestSheetData",
  requestSheetOfCMSchema
);
module.exports = RequestSheetOfCM;
