const mongoose = require('mongoose')

const financialYearSchema = mongoose.Schema({

    yearDropdownID: {
        type: String
    },

    financialYears: {
        type: [String]
    }
})

const FinancialYear = new mongoose.model('FinancialYear', financialYearSchema);
module.exports = FinancialYear;