const logger = require("../utils/LoggingController/loggers");
const maintenanceType = require("../utils/maintenanceType");

module.exports = (func) => (req, res, next) =>
  func(req, res, next).catch((error) => {
    logger.error(error, { maintenanceType: maintenanceType?.[2] });
    return res.status(500).json({ message: error?.message, error });
  });
