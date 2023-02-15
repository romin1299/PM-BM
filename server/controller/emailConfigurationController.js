const mongoose = require('mongoose')
const EmailConfigurations = require("../model/emailConfiguration")

const EmailConfigurationController = async () => {

    let getEmailConfData = await EmailConfigurations.findOne(
        {
            emailConfID: "EmailConf1"
        }
    )

    // console.log(getEmailConfData)
    return getEmailConfData
}

module.exports = EmailConfigurationController