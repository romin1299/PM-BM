const mongoose = require('mongoose')

const emailConfigurationSchema = mongoose.Schema({
    emailConfID: {
        type: String
    },
    serverIP: {
        type: String
    },
    emailPort: {
        type: Number
    },
    fromEmailId: {
        type: String
    },
    emailForSpareRequest: {
        type: String
    }
})

const EmailConfigurations = new mongoose.model('EmailConfigurations', emailConfigurationSchema);
module.exports = EmailConfigurations;