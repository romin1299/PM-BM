const commonVarForTypeString = {
  type: String,
};

const production_hrs_refObj = {
  type: Number,
  default: 0,
};

exports.productionHrs = [
  {
    current_year: commonVarForTypeString,
    yearTotalProductionHrs: production_hrs_refObj,
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
  },
];
