const winston = require("winston");
const { combine, timestamp, json, prettyPrint, errors, printf } =
  winston.format;

winston.loggers.add("UserLogger", {
  level: "debug",
  // format: combine(timestamp(), json(), prettyPrint(), errors()),
  format: combine(
    timestamp(),
    prettyPrint(),
    errors({ stack: true }),
    printf((info) => {
      console.log("====>", info);
      return `${info.timestamp} ${info.message}\n\t\t${info.stack}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "users.log" }),
  ],
  defaultMeta: { service: "User Management" },
});

winston.loggers.add("CheckSheetLogger", {
  level: "debug",
  format: combine(
    timestamp(),
    prettyPrint(),
    errors({ stack: true }),
    printf((info) => {
      console.log("====>", info);
      return `${info.timestamp} ${info.message}\n\t\t${info.stack}`;
    })
  ),
  // format: combine(timestamp(), json(), prettyPrint(), errors({ stack: false })),   note working: errors({ stack: false })
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "checkSheet.log" }),
  ],
  defaultMeta: { service: "CheckSheet Management" },
});

/* 

 ********************************* BASIC EXAMPLE *********************************
const logger = winston.createLogger({
  level: "debug",
  format: combine(timestamp(), json(), prettyPrint(), errors({ stack: false })),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "logs.log" }),
  ],
});

const defaultObjToIncludeInLogs = {
  a: "A",
  b: "B",
};

const childLoggerIncludingDefaultValue = logger.child(
  defaultObjToIncludeInLogs
);

logger.info("Info log ...");
logger.error(new Error("Something went wrong!!!"));

childLoggerIncludingDefaultValue.info("Info log ...");
childLoggerIncludingDefaultValue.error(new Error("Something went wrong!!!"));
 */
