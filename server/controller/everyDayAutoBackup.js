var cron = require("node-cron");
const fs = require("fs-extra");
const { exec } = require("child_process");
const moment = require("moment");
const path = require("path");
const logger = require("../utils/LoggingController/loggers");
const maintenanceType = require("../utils/maintenanceType");

cron.schedule("0 0 * * *", async (req, res) => {
  try {
    const current_date = new Date();

    fs.removeSync(
      path.join(
        process.env.BACKUP_DATA_LOCATION,
        moment(current_date).subtract(30, "days").format("DD-MM-YYYY")
      )
    );

    let folderPath = path.join(
      process.env.BACKUP_DATA_LOCATION,
      // moment(current_date).format("MMM"),
      moment(current_date).format("DD-MM-YYYY")
    );

    await fs.ensureDir(folderPath);

    const command = "mongodump --host localhost --port 27017 --db DENSO-PM-BM";

    // run the command in the specified folder
    exec(command, { cwd: folderPath }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error running command of backup: ${error}`);
        return;
      }
      console.log(`Data backup successfully - ${new Date().toLocaleString()}`);
    });
  } catch (error) {
    console.log(error);
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
  }
});

module.exports = cron;
