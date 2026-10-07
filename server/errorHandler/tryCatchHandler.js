const logger = require("../utils/LoggingController/loggers");
const maintenanceType = require("../utils/maintenanceType");

module.exports =
  (func, propMaintenanceType = maintenanceType?.[3]) =>
  (req, res, next) =>
    Promise.resolve()
      .then(() => func(req, res, next))
      .catch((error) => {
        console.log(error);
        logger.error(error, { maintenanceType: propMaintenanceType });

        /**
         * Not every one of these is Express middleware. Several wrap a plain
         * helper that gets called with a single argument — bmController does
         * `await findPlantToMachineHierarchyObj(machine)` — so `res` is
         * undefined and there is no response to answer with.
         *
         * Reaching for `res.status` in that case threw a TypeError inside this
         * catch block, and that second error had nothing left to handle it: an
         * unhandled rejection, which Node answers by terminating the process.
         * One failed hierarchy lookup while raising a sheet took the whole
         * server down, minutes or hours after a clean start.
         *
         * Re-throwing gives the error back to the caller, which for a plain
         * helper is a route with its own try/catch.
         */
        if (typeof res?.status !== "function") throw error;

        return res.status(500).json({ message: error?.message, error });
      });
