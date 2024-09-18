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
