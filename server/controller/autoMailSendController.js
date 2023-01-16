var cron = require('node-cron');
const User = require('../model/userSchema')

cron.schedule('1 38 * * * *', async () => {
    // cron.schedule('* * * * * *', async (req, res) => {


    console.log("Calling ......")
    const userLogin = await User.find({});

    let abc = `<tr>
                <td style="border: 1px solid black;text-align: left;padding: 8px;">Cell/Product</td>
                </tr>`

    const refFunc = (item) => {
        return `<tr>
            <td style="border: 1px solid black;text-align: left;padding: 8px;">Email Value</td>
            <td style="border: 1px solid black;text-align: left;padding: 8px;">${item?.email}</td>
        </tr>`
    }

    let bodyTable = `<table style="font-family: arial, sans-serif;border-collapse: collapse;width: 100%;">
                <tr>
                    <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>Cell/Product</b></td>
                    <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>Plan</b></td>
                    <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>Last Month Pending</b></td>
                    <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>Completed</b></td>
                    <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>Ongoing</b></td>
                    <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>Remaining</b></td>
                    <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>Completion %</b></td>
                </tr>

                ${await userLogin?.map((item) => refFunc(item))}
    </table>`


    console.log(bodyTable)


    // userLogin?.map((result) => console.log(result?.email))


    // ********************************************************************************************************** //

    // try {
    //     let { section, currentMonth, selectedYear } = req.body
    //     let loggedUserData = req.rootUser;
    //     let skipMachineDataWithEveryMonth = []

    //     const monthKeyArray = [
    //         "Jan",
    //         "Feb",
    //         "Mar",
    //         "Apr",
    //         "May",
    //         "June",
    //         "July",
    //         "Aug",
    //         "Sep",
    //         "Oct",
    //         "Nov",
    //         "Dec",
    //     ];

    //     let currentYear =
    //         new Date().getMonth() <= 3 ?
    //             `${new Date().getFullYear() - 1}-${new Date().getFullYear()}` :
    //             `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

    //     let previousMonth = monthKeyArray[new Date().getMonth() - 1] === undefined ?
    //         monthKeyArray.splice(-1)[0] :
    //         monthKeyArray[new Date().getMonth() - 1];

    //     let monthForCompareSystemMonth = monthKeyArray[new Date().getMonth()];
    //     let currentMonthInNumber = new Date().getMonth()

    //     let keyForCurrentMonthPMStatus = `checkSheet_data.PMStatus.${currentMonth}`
    //     let keyForPreviousMonthPMStatus = `checkSheet_data.carriedPMStatus.${currentMonth}`

    //     const financialYearWiseMonthKeyArray = ['Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']


    //     let selectedYearOfCheckSheet =
    //         selectedYear === currentYear ? [{
    //             "checkSheet_data.current_year": selectedYear

    //         },
    //         {
    //             "checkSheet_data": []

    //         }
    //         ] : [{
    //             "checkSheet_data.current_year": selectedYear

    //         },

    //         ]

    //     // console.log(currentMonth, selectedYear)
    //     // console.log(monthKeyArray[monthKeyArray.indexOf(currentMonth) - 1], monthKeyArray.splice(-1)[0])

    //     // console.log(section);
    //     let sectionSplit = section.split("-")
    //     const sectionInfo = await Section.findOne({ section_id: sectionSplit[0] })
    //     // console.log("____________", sectionInfo[0]._id)
    //     let subSectionsData, subSectionIdArray = [],
    //         cellData, cellIdArray = [],
    //         lineData, lineIdArray = [],
    //         machineData, machineDataForChecksheet, subsectionSplitIdArrayForChecksheet = []
    //     let machineDataForPreviousMonth, machineDataForCurrentMonth

    //     if (sectionInfo.dashboardLevel === "Yes") {
    //         subSectionsData = await SubSection.find({ section_names: sectionInfo._id }).sort({ subSection_sequence: 1 })


    //         for (let i = 0; i < subSectionsData.length; i++) {
    //             subSectionIdArray.push(subSectionsData[i]._id);
    //         }

    //         cellData = await Cell.find({ subSection_names: { $in: subSectionIdArray } }).sort({ cell_sequence: 1 });

    //         for (let i = 0; i < cellData.length; i++) {
    //             cellIdArray.push(cellData[i]._id);
    //         }

    //         lineData = await Line.find({ cell_names: { $in: cellIdArray } }).sort({ line_sequence: 1 });

    //         for (let i = 0; i < lineData.length; i++) {
    //             lineIdArray.push(lineData[i]._id);
    //         }

    //         // machineDataForCurrentMonth = await Machine.find({ line_names: { $in: lineIdArray }, [keyForCurrentMonthPMStatus]: { $ne: "" }, PMStatus: { $exists: true } }).populate({ path: "line_names", populate: { path: "cell_names", model: "Cells" } })


    //         // console.log("========>", machineDataForCurrentMonth)

    //         machineDataForPreviousMonth = await Machine.aggregate([{
    //             $match: {
    //                 line_names: { $in: lineIdArray },
    //                 $or: selectedYearOfCheckSheet,
    //                 "checkSheet_data": { $ne: [] },
    //             }
    //         },
    //         {
    //             $project: {
    //                 machine_code: 1,
    //                 machine_name: 1,
    //                 machine_nickname: 1,
    //                 machine_sequence: 1,
    //                 installation_date: 1,
    //                 maker_name: 1,
    //                 maker_sr_no: 1,
    //                 manufacturingDate: 1,
    //                 isPM: 1,
    //                 line_names: 1,
    //                 checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] }
    //             }
    //         },
    //         {
    //             $match: {
    //                 // [keyForPreviousMonthPMStatus]: { $ne: "" },
    //                 "checkSheet_data.PMStatus": { $ne: undefined },
    //             }
    //         },
    //         ])

    //         machineDataForPreviousMonth = await Machine.populate(machineDataForPreviousMonth, { path: "line_names", populate: { path: "cell_names", model: "Cells" } })

    //         machineDataForPreviousMonth.map((keyForCheckSheet) => {

    //             for (let i = 0; i < Object.keys(keyForCheckSheet?.checkSheet_data?.PMStatus)?.length; i++) {
    //                 let month = financialYearWiseMonthKeyArray[i]

    //                 if (keyForCheckSheet?.checkSheet_data?.PMStatus[month] === "PM Skip") {
    //                     for (let j = 0; j < keyForCheckSheet?.checkSheet_data?.checkSheet?.length; j++) {

    //                         if (
    //                             // (keyForCheckSheet?.checkSheet_data?.checkSheet[j]?.cycle !== '1/1M' ||
    //                             //     keyForCheckSheet?.checkSheet_data?.checkSheet[j]?.cycle !== '1/2M')
    //                             (keyForCheckSheet?.checkSheet_data?.checkSheet[j]?.cycle === "1/3M" ||
    //                                 keyForCheckSheet?.checkSheet_data?.checkSheet[j]?.cycle === "1/4M" ||
    //                                 keyForCheckSheet?.checkSheet_data?.checkSheet[j]?.cycle === "1/6M" ||
    //                                 keyForCheckSheet?.checkSheet_data?.checkSheet[j]?.cycle === "1/Y")
    //                             &&
    //                             (keyForCheckSheet?.checkSheet_data?.checkSheet[j]?.planningTableAnimationArray2[month][1] === "skip" &&
    //                                 keyForCheckSheet?.checkSheet_data?.checkSheet[j]?.planningTableAnimationArray2[month][0] === "1")
    //                         ) {
    //                             // console.log(keyForCheckSheet?.checkSheet_data?.checkSheet[j]?.tableRowId, "-----", keyForCheckSheet?.machine_code, "--->", keyForCheckSheet?.checkSheet_data?.checkSheet[j]?.cycle, "---", j, "month---", month)


    //                             skipMachineDataWithEveryMonth.push(
    //                                 new Object({
    //                                     machine_name: keyForCheckSheet?.machine_name,
    //                                     machine_code: keyForCheckSheet?.machine_code,
    //                                     yearOfCheckSheet: keyForCheckSheet?.checkSheet_data?.current_year,
    //                                     schedule_month: month,
    //                                     line_name: keyForCheckSheet?.line_names?.line_name,
    //                                     cell_name: keyForCheckSheet?.line_names?.cell_names?.cell_name,
    //                                     PMStatus: keyForCheckSheet?.checkSheet_data?.PMStatus[month]
    //                                 })
    //                             );
    //                             break;
    //                         }

    //                     }

    //                 }
    //                 // console.log(keyForCheckSheet?.checkSheet_data?.PMStatus[month], "----", keyForCheckSheet?.machine_name)
    //                 if ((keyForCheckSheet?.checkSheet_data?.PMStatus[month] === "Done with delay" &&
    //                     keyForCheckSheet?.checkSheet_data?.flagOfDoneWithDelayForOneMonth?.[month] === currentMonthInNumber)) {
    //                     skipMachineDataWithEveryMonth.push(
    //                         new Object({
    //                             machine_name: keyForCheckSheet?.machine_name,
    //                             machine_code: keyForCheckSheet?.machine_code,
    //                             yearOfCheckSheet: keyForCheckSheet?.checkSheet_data?.current_year,
    //                             schedule_month: month,
    //                             line_name: keyForCheckSheet?.line_names?.line_name,
    //                             cell_name: keyForCheckSheet?.line_names?.cell_names?.cell_name,
    //                             PMStatus: keyForCheckSheet?.checkSheet_data?.PMStatus[month],
    //                             checkSheet_data: keyForCheckSheet?.checkSheet_data
    //                         })
    //                     );
    //                 }

    //             }
    //             if (previousMonth != "Mar") {
    //                 if (keyForCheckSheet?.checkSheet_data?.carriedPMStatus?.[monthForCompareSystemMonth] != "" && keyForCheckSheet?.checkSheet_data?.carriedPMStatus != undefined) {
    //                     skipMachineDataWithEveryMonth.push(
    //                         new Object({
    //                             machine_name: keyForCheckSheet?.machine_name,
    //                             machine_code: keyForCheckSheet?.machine_code,
    //                             yearOfCheckSheet: keyForCheckSheet?.checkSheet_data?.current_year,
    //                             line_name: keyForCheckSheet?.line_names?.line_name,
    //                             cell_name: keyForCheckSheet?.line_names?.cell_names?.cell_name,
    //                             schedule_month: previousMonth,
    //                             PMStatus: keyForCheckSheet?.checkSheet_data?.PMStatus[previousMonth],
    //                             checkSheet_data: keyForCheckSheet?.checkSheet_data
    //                         })
    //                     )
    //                 }
    //             }

    //         })

    //         // console.log("========>", machineDataForCurrentMonth)
    //         // console.log("========>", machineDataForPreviousMonth)


    //         // machineDataForChecksheet = await Machine.find({ line_names: { $in: lineIdArray } }).populate({ path: "line_names", populate: { path: "cell_names", model: "Cells" } })

    //     }



    //     res.json({
    //         skipMachineDataWithEveryMonth,
    //     })
    // } catch (error) {
    //     console.log(error)
    //     console.log("User id not received!!!");
    // }


});

module.exports = cron;
