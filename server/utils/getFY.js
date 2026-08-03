const moment = require("moment");

const getFY = () => {
  const now = moment();
  const monthNum = now.month() + 1;
  const fyStartYear = monthNum >= 4 ? now.year() : now.year() - 1;

  return {
    inString: `${fyStartYear}-${fyStartYear + 1}`,
    inNumber: fyStartYear,
  };
};

module.exports = getFY;
