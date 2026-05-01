const moment = require("moment-timezone");

const generateTimestampIndividually = () => {
  const now = moment();
  const monthNum = now.month() + 1;
  const fyStartYear = monthNum >= 4 ? now.year() : now.year() - 1;

  return {
    date: now.date(),
    year: {
      inString: `${fyStartYear}-${fyStartYear + 1}`,
      inNumber: fyStartYear,
    },
    month: {
      inString: now.format("MMM"),
      inNumber: monthNum,
    },
  };
};

const generateTimeStampWithBothFormat = (propDate = new Date()) => {
  const now = moment(propDate);
  return {
    inString: moment(now).format("D/M/YYYY - h:mm a"),
    inDate: now,
  };
};

module.exports = {
  generateTimestampIndividually,
  generateTimeStampWithBothFormat,
};
