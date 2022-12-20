const mongoose = require('mongoose')

const handlingActionsSchema = mongoose.Schema({
    yearId: {
        type: String
    },
    financialYears : {
        type: [String]
    }
})

const HandlingOtherActions = new mongoose.model('OtherActionsHandle', handlingActionsSchema);
module.exports = HandlingOtherActions;