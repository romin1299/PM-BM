const mongoose = require('mongoose')

const handlingActionsSchema = mongoose.Schema({

    plant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Plants'
    },

    financialYears: {
        type: [String]
    }
})

const HandlingOtherActions = new mongoose.model('OtherActionsHandle', handlingActionsSchema);
module.exports = HandlingOtherActions;