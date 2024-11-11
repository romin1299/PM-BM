const moment = require("moment-timezone");
const monthKeyArray = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "June",
  "July",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
exports.gettingMonthForSelectedDate = (date) => {
  return monthKeyArray[moment(new Date(date)).tz("Asia/Kolkata").month()];
};

exports.getFinancialQuarter = (date) => {
  const financialYearStartMonth = 4; // April is the 4th month
  const month = moment(date).month() + 1; // moment().month() is zero-based, so adding 1
  return Math.ceil((((month - financialYearStartMonth + 12) % 12) + 1) / 3);
};
