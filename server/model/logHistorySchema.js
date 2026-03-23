const mongoose = require('mongoose')

const commonVarForTypeString = {
    type: String
}

const commonVarForTypeNumber = {
    type: Number
}

const commonVarForTypeArray = {
    type: [String]
}

const logHistorySchema = new mongoose.Schema({

    current_year: commonVarForTypeString,

    schedule_month: commonVarForTypeString,


    plantInfo: {
        plant_Id: commonVarForTypeString,
        plant_name: commonVarForTypeString,
    },

    //Because Of Dashboard Level
    sectionOrSubSectionInfo: {
        sectionOrSubSection_Id: commonVarForTypeString,
        sectionOrSubSection_name: commonVarForTypeString,
    },

    cellInfo: {
        cell_Id: commonVarForTypeString,
        cell_name: commonVarForTypeString,
    },

    lineInfo: {
        line_Id: commonVarForTypeString,
        line_name: commonVarForTypeString,
    },

    machineInfo: {
        machine_Id: commonVarForTypeString,
        machine_name: commonVarForTypeString,
    },

    // cell_id: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Cells"
    // },

    // line_id: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Lines"
    // },

    // machine_id: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "MachinesAllData"
    // },

    inception_point: commonVarForTypeString,

    date: commonVarForTypeString,

    remarks: commonVarForTypeString,

    abnormality: commonVarForTypeString,

    abnormality_remarks: commonVarForTypeString,

    abnormality_status: commonVarForTypeString,

    target: commonVarForTypeArray,

    spare_used: commonVarForTypeString,

    part_name: commonVarForTypeString,

    part_no: commonVarForTypeString,

    part_cost: commonVarForTypeNumber,

    done_by: commonVarForTypeString,

    uploaded_file_name: commonVarForTypeString,

    reason_for_delay: commonVarForTypeString,

    actionDetailsOfAbnormalityClose : commonVarForTypeString
})

const LogHistory = new mongoose.model('LogHistory', logHistorySchema);
module.exports = LogHistory;