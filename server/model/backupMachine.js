const mongoose = require('mongoose')

const backupMachineSchema = mongoose.Schema({
    machine_code: {
        type: String
    },
    machine_name: {
        type: String
    },
    line_names: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lines"
    },
    checkSheet_data: [
        {
            current_year: { type: String },
            checkSheet: [
                {
                    tableRowId: {
                        type: Number
                    },
                    category: {
                        type: String
                    },
                    inspection_parent_name: {
                        type: String
                    },
                    inspection_point: {
                        type: String
                    },
                    judgement_criteria: {
                        type: String
                    },
                    action: {
                        type: String
                    },
                    cycle: {
                        type: String
                    },
                    personInCharge: {
                        type: String
                    },
                    PM_time: {
                        type: String
                    },
                    start_month: {
                        type: String
                    }
                }
            ]
        }
    ]
})

const BackupMachineData = new mongoose.model('backupMachineData', backupMachineSchema);
module.exports = BackupMachineData;