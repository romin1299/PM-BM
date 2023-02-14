const mongoose = require('mongoose')

const handlingActionsSchema = mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users'
    },

    financialYears: {
        type: [String]
    }
})

const HandlingOtherActions = new mongoose.model('OtherActionsHandle', handlingActionsSchema);
module.exports = HandlingOtherActions;