var cron = require('node-cron');
const { exec } = require('child_process');

cron.schedule('0 0 * * *', async (req, res) => {

    // define the folder and command you want to run
    const folderPath = process.env.BACKUP_DATA_LOCATION;
    const command = 'mongodump --host localhost --port 27017 --db DENSO-PM-BM';

    // run the command in the specified folder
    exec(command, { cwd: folderPath }, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error running command of backup: ${error}`);
            return;
        }
        console.log(`Data backup successfully - ${new Date().toLocaleString()}`);
    });


})

module.exports = cron;


