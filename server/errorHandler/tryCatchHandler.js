const logger = require("../utils/LoggingController/loggers");
const maintenanceType = require("../utils/maintenanceType");

module.exports =
  (func, propMaintenanceType = maintenanceType?.[3]) =>
  (req, res, next) =>
    func(req, res, next).catch((error) => {
      console.log(error);
      logger.error(error, { maintenanceType: propMaintenanceType });
      return res.status(500).json({ message: error?.message, error });
    });
