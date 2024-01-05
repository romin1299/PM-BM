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
  },
];

exports.TmMttrSkillScoresAndLimit = [
  {
    from:production_hrs_refObj,
    to:production_hrs_refObj,
    score:production_hrs_refObj
  }
]