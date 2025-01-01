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

exports.getFinancialQuarter = (date) => 
  `Q${Math.ceil((((moment(date).month() + 1 - 4 + 12) % 12) + 1) / 3)}`;

exports.getFinancialQuarterByMonth = (selectedMonth) =>
  `Q${Math.floor(((selectedMonth - 3 + 12) % 12) / 3) + 1}`;
