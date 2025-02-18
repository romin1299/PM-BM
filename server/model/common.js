const mongoose = require("mongoose");

const commonVarForTypeString = {
  type: String,
};

const production_hrs_refObj = {
  type: Number,
  default: 0,
};

exports.allTargetData = [
  {
    current_year: commonVarForTypeString,
    monthlyProductionHrs: {
      Apr: production_hrs_refObj,
      May: production_hrs_refObj,
      June: production_hrs_refObj,
      July: production_hrs_refObj,
      Aug: production_hrs_refObj,
      Sep: production_hrs_refObj,
      Oct: production_hrs_refObj,
      Nov: production_hrs_refObj,
      Dec: production_hrs_refObj,
      Jan: production_hrs_refObj,
      Feb: production_hrs_refObj,
      Mar: production_hrs_refObj,
    },
    yearTotalProductionHrs: production_hrs_refObj,

    monthlyBDHrsTarget: {
      Apr: production_hrs_refObj,
      May: production_hrs_refObj,
      June: production_hrs_refObj,
      July: production_hrs_refObj,
      Aug: production_hrs_refObj,
      Sep: production_hrs_refObj,
      Oct: production_hrs_refObj,
      Nov: production_hrs_refObj,
      Dec: production_hrs_refObj,
      Jan: production_hrs_refObj,
      Feb: production_hrs_refObj,
      Mar: production_hrs_refObj,
    },
    yearTotalBDHrsTarget: production_hrs_refObj,

    monthlyMTTRTarget: {
      Apr: production_hrs_refObj,
      May: production_hrs_refObj,
      June: production_hrs_refObj,
      July: production_hrs_refObj,
      Aug: production_hrs_refObj,
      Sep: production_hrs_refObj,
      Oct: production_hrs_refObj,
      Nov: production_hrs_refObj,
      Dec: production_hrs_refObj,
      Jan: production_hrs_refObj,
      Feb: production_hrs_refObj,
      Mar: production_hrs_refObj,
    },
    yearTotalMTTRTarget: production_hrs_refObj,

    monthlyMTBFTarget: {
      Apr: production_hrs_refObj,
      May: production_hrs_refObj,
      June: production_hrs_refObj,
      July: production_hrs_refObj,
      Aug: production_hrs_refObj,
      Sep: production_hrs_refObj,
      Oct: production_hrs_refObj,
      Nov: production_hrs_refObj,
      Dec: production_hrs_refObj,
      Jan: production_hrs_refObj,
      Feb: production_hrs_refObj,
      Mar: production_hrs_refObj,
    },
    yearTotalMTBFTarget: production_hrs_refObj,

    monthlyBDPercentageTarget: {
      Apr: production_hrs_refObj,
      May: production_hrs_refObj,
      June: production_hrs_refObj,
      July: production_hrs_refObj,
      Aug: production_hrs_refObj,
      Sep: production_hrs_refObj,
      Oct: production_hrs_refObj,
      Nov: production_hrs_refObj,
      Dec: production_hrs_refObj,
      Jan: production_hrs_refObj,
      Feb: production_hrs_refObj,
      Mar: production_hrs_refObj,
    },
    yearTotalBDPercentageTarget: production_hrs_refObj,
  },
];

exports.TmMttrSkillScoresAndLimit = [
  {
    from: production_hrs_refObj,
    to: production_hrs_refObj,
    score: production_hrs_refObj,
  },
];

exports.userObj = {
  userRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },
  user_type: { type: String },
  tm_no: { type: Number },
  tm_name: { type: String },
  email: { type: String },
};

exports.approvalObj = {
  approvalStatus: { type: String },
  approvalDateAndTime: { type: String },
  rejectedRemarks: { type: String },
};
