/* *********************************************************************************
 *      NOT USING, THIS FILE IS FOR TESTING
 ***********************************************************************************
 */

require("./loggers");
const winston = require("winston");

exports.userLogger = userLogger = winston.loggers.get("UserLogger");
exports.checkSheetLogger = checkSheetLogger =
  winston.loggers.get("CheckSheetLogger");

userLogger.info("User added successfully!!!");
checkSheetLogger.error(new Error("CheckSheet doesn't exist!!!"));
checkSheetLogger.info("CheckSheet created successfully!!!");

let requestLogger = (apiPath) => {
  let logger = userLogger.startTimer();

  for (let i = 0; i < 10000000; i++) {
    let j = i * 10;
  }

  logger.done({ message: "API executed", apiStatus: "Completed", apiPath });
};

// requestLogger("/getUserDetails");
