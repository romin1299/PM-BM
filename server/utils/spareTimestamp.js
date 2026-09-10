const moment = require("moment-timezone");

/**
 * Financial-year stamp for a point in time. Defaults to now, so every existing
 * caller is unaffected; the Spare Master importer passes the legacy CreateDate so
 * imported records land in the financial year they were actually created in
 * rather than the year of the import run.
 */
const generateTimestampIndividually = (propDate = undefined) => {
  const now = propDate ? moment(propDate) : moment();
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
