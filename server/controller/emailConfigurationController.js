const mongoose = require("mongoose");
const EmailConfigurations = require("../model/emailConfiguration");
const logger = require("../utils/LoggingController/loggers");
const maintenanceType = require("../utils/maintenanceType");

const EmailConfigurationController = async () => {
  try {
    let getEmailConfData = await EmailConfigurations.findOne({
      emailConfID: "EmailConf1",
    });

    // console.log(getEmailConfData)
    return getEmailConfData;
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
  }
};

module.exports = EmailConfigurationController;
