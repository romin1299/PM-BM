const mongoose = require("mongoose");

const { productionHrs } = require("./common");

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

  productionHrs,

  requestSheetNos: {
    type: Number,
  },
});

const Line = new mongoose.model("Lines", lineSchema);
module.exports = Line;
