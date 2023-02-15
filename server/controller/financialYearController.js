var cron = require('node-cron');
require('../db/conn')

const FinancialYear = require('../model/financialYearSchema')



// cron.schedule(`30 * * * * *`, async (req, res) => {
    cron.schedule(`00 00 00 1 Apr *`, async (req, res) => {


    console.log("........... Financial Year Controller ...........")


    const findFinancialYear = await FinancialYear.findOne({ yearDropdownID: "FY01" })

    let current_year = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
    // let current_year = `2022-2023`


    if (findFinancialYear) {
        if (!findFinancialYear?.financialYears?.includes(current_year)) {
            addNewFinancialYears = await FinancialYear.updateOne({ yearDropdownID: "FY01" }, {
                $push: {
                    financialYears: current_year
                }
            })
        }
        console.log("true")


    } else {
        addNewFinancialYears = await new FinancialYear({
            yearDropdownID: "FY01",
            financialYears: current_year
        })
        addNewFinancialYears.save()
        console.log("false")

    }

});

module.exports = cron;
