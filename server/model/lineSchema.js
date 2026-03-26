const mongoose = require("mongoose");

const { allTargetData, userObj, approvalObj } = require("./common");

const commonUserApprovalObj = {
  ...userObj,
  ...approvalObj,
};

const commonVarForTypeString = {
  type: String,
};
const commonVarForObjectIdOfUser = {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Users",
};

const commonVarForMonthlyApproval = {
  checkedByTL: commonVarForObjectIdOfUser,

  assignHOS: commonVarForObjectIdOfUser,
  approvedByHOS: commonVarForTypeString,

  assignHOD: commonVarForObjectIdOfUser,
  approvedByHODIfDelay: commonVarForTypeString,
  remarksIfDelay: commonVarForTypeString,
};

const lineSchema = new mongoose.Schema({
  line_id: commonVarForTypeString,

  line_name: commonVarForTypeString,
  plant_names: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Plants",
  },
  section_names: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Sections",
  },
  subSection_names: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubSections",
  },

  cell_names: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cells",
  },
  line_sequence: {
    type: Number,
  },

  annualPmScheduleApproval: [
    {
      current_year: commonVarForTypeString,

      mtdTlId: commonVarForObjectIdOfUser,

      mtdHos: {
        mtdHosId: commonVarForObjectIdOfUser,
        mtdHosApprovalStatus: commonVarForTypeString,
      },

      mtdHod: {
        mtdHodId: commonVarForObjectIdOfUser,
        mtdHodApprovalStatus: commonVarForTypeString,
      },

      prdHos: {
        prdHosId: commonVarForObjectIdOfUser,
        prdHosApprovalStatus: commonVarForTypeString,
      },
      monthlyApprovalData: {
        Apr: commonVarForMonthlyApproval,

        May: commonVarForMonthlyApproval,

        June: commonVarForMonthlyApproval,

        July: commonVarForMonthlyApproval,

        Aug: commonVarForMonthlyApproval,

        Sep: commonVarForMonthlyApproval,

        Oct: commonVarForMonthlyApproval,

        Nov: commonVarForMonthlyApproval,

        Dec: commonVarForMonthlyApproval,

        Jan: commonVarForMonthlyApproval,

        Feb: commonVarForMonthlyApproval,

        Mar: commonVarForMonthlyApproval,
      },
    },
  ],

  allTargetData,

  requestSheetNos: {
    type: Number,
  },

  requestSheetNoOfCM: {
    type: Number,
  },

  requestSheetNoSpare: {
    type: Number,
  },

  LTPMApproval: {
    preparationApproval: {
      status: commonVarForTypeString,
      preparedByMTD_TL: commonUserApprovalObj,
      checkByMTD_TL: commonUserApprovalObj,
      // approvedByMTD_HOS: commonUserApprovalObj,
    },
    planningApproval: {
      status: commonVarForTypeString,
      // planPreparedByMTD_HOS: commonUserApprovalObj,
      planAcceptedByPRD_HOS: commonUserApprovalObj,
    },
    preparationApprovalAndPlanPreparationMTD_HOS: commonUserApprovalObj,
    quarterlyApproval: [
      {
        preAggregationTimeStampOfRequestSheet: {
          requestSheet_year: {
            type: String,
          },
          requestSheet_quarter: {
            type: String,
          },
        },
        status: commonVarForTypeString,
        checkAndVerifyByMTD_TL: commonUserApprovalObj,
        approveByHOD: commonUserApprovalObj,
      },
    ],
  },
});

const Line = new mongoose.model("Lines", lineSchema);
module.exports = Line;
