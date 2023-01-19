var cron = require('node-cron');
require('../db/conn')

const User = require('../model/userSchema')
const Plant = require('../model/plantSchema')
const Section = require('../model/sectionSchema')
const SubSection = require('../model/subSectionSchema')
const Cell = require('../model/cellSchema')
const Line = require('../model/lineSchema')
const Machine = require('../model/machineSchema')

const autoSendMail = require("../sendMail/autoSendMail")


// console.log("===================>", lastDay.getDate())
// cron.schedule(`59 ${a},${b} * * * *`, async () => {
cron.schedule(`00 00 01 15,${(new Date((new Date()).getFullYear(), (new Date()).getMonth() + 1, 0)).getDate()} * *`, async (req, res) => {

    console.log("...........Send mail at 015st and End of every Month...........")

    const monthKeyArray = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "June",
        "July",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
    ];

    let monthForCompareSystemMonth = monthKeyArray[new Date().getMonth()];
    let currentMonthInNumber = new Date().getMonth()

    const financialYearWiseMonthKeyArray = ['Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']
    // console.log(monthForCompareSystemMonth)

    let currentYear =
        new Date().getMonth() <= 3 ?
            `${new Date().getFullYear() - 1}-${new Date().getFullYear()}` :
            `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

    let previousMonth = monthKeyArray[new Date().getMonth() - 1] === undefined ?
        monthKeyArray.splice(-1)[0] :
        monthKeyArray[new Date().getMonth() - 1];


    // console.log(currentYear)
    let userInfo, toEmailArray, ccEmailArray, currentMonthTable, previousMonthTable, planVsActualTable,
        subSectionsData, cellData, lineData, machineDataForCurrentMonth, machineDataForPreviousMonth, groupData
    let skipMachineDataWithEveryMonth = []


    let sumVariableForTotalSchedule = 0
    let sumVariableForTotalCompleted = 0
    let sumVariableForTotalOngoing = 0
    let sumVariableForTotalPreviousPending = 0

    let keyForSelectedMonth = `$checkSheet_data.PMStatus.${monthForCompareSystemMonth}`
    let keyForPreviousMonth = `$checkSheet_data.carriedPMStatus.${monthForCompareSystemMonth}`


    let keyForCurrentMonthPMStatus = `checkSheet_data.PMStatus.${monthForCompareSystemMonth}`


    const sectionInfo = await Section.find({})


    // console.log("=========>", sectionInfo)

    for (let i = 0; i < sectionInfo?.length; i++) {

        if (sectionInfo[i].dashboardLevel === "Yes") {

            // console.log(sectionInfo[i].dashboardLevel, "=======>", sectionInfo[i])

            // console.log(`${sectionInfo[i]?.section_id}-${sectionInfo[i]?.section_name}`)




            //for User Email

            userInfo = await User.find({ section_data: `${sectionInfo[i]?.section_id}-${sectionInfo[i]?.section_name}` });


            toEmailArray = userInfo?.map((result) => {
                if (result.tm_department === "PRD" && result.user_type === "TL/HOSS") {
                    // return result
                    return result?.email ? result?.email : undefined
                }
            })

            ccEmailArray = userInfo?.map((result) => {
                if (
                    (
                        (result.tm_department === "PRD" || result.tm_department === "MTD")
                        && result.user_type === "HOS"
                    )
                    ||
                    (
                        result.tm_department === "MTD" &&
                        (result.user_type === "TL/HOSS" || result.user_type === "HOD")
                    )

                    // (result.tm_department === "PRD" || result.tm_department === "MTD")
                    // && (result.user_type === "TL/HOSS" || result.user_type === "HOS" || result.user_type === "HOD")
                ) {
                    return result
                    // return result?.email ? result?.email : undefined
                }
            })
            // console.log("=====>101", ccEmailArray)





            // for Data

            subSectionsData = await SubSection.find({ section_names: sectionInfo[i]._id }).sort({ subSection_sequence: 1 })

            cellData = await Cell.find({ subSection_names: { $in: subSectionsData?.map((item) => item._id) } }).sort({ cell_sequence: 1 });

            lineData = await Line.find({ cell_names: { $in: cellData?.map((item) => item._id) } }).sort({ line_sequence: 1 });
            // lineData = await Line.find({ cell_names: { $in: cellData?.map((item) => item._id) } }).populate({ path: "cell_names" }).sort({ line_sequence: 1 });

            // console.log("102", lineData)




            /* ***************************************************************************
                       
                       
                                                   Status of PM Plan vs Actual
                       
                       
            *************************************************************************** */


            let monthlyChartDataOfSummery = []


            for (let k = 0; k < lineData.length; k++) {

                groupData = await Machine.aggregate([

                    {

                        $match: {
                            line_names: lineData[k]._id,
                            // "checkSheet_data": { $ne: undefined },
                            $or: [{
                                "checkSheet_data.current_year": currentYear
                            },
                            {
                                "checkSheet_data": []
                            }
                            ],
                        }
                    },
                    {
                        $project: {
                            machine_code: 1,
                            machine_name: 1,
                            machine_nickname: 1,
                            machine_sequence: 1,
                            installation_date: 1,
                            maker_name: 1,
                            maker_sr_no: 1,
                            manufacturingDate: 1,
                            isPM: 1,
                            line_names: 1,
                            checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] }
                        }
                    },
                    {
                        $match: {
                            "checkSheet_data.PMStatus": { $ne: undefined },
                            "checkSheet_data": { $ne: undefined }
                        }
                    },
                    {
                        $group: {
                            _id: "$line_names",
                            machine: { $push: { machine_code: "$machine_code", machine_name: "$machine_name" } },
                            total_pmSchedule: {
                                $sum: {
                                    $cond: [{
                                        $ne: [keyForSelectedMonth, ""]
                                    },
                                        1, 0
                                    ]
                                }
                            },
                            total_completed: {
                                $sum: {
                                    $cond: [{
                                        $eq: [keyForSelectedMonth, "Completed"]
                                    },
                                        1, 0
                                    ]
                                }
                            },
                            total_ongoing: {
                                $sum: {
                                    $cond: [{
                                        $eq: [keyForSelectedMonth, "Ongoing"]
                                    },
                                        1, 0
                                    ]
                                }
                            },
                            total_previous_pending: {
                                $sum: {
                                    $cond: [{
                                        $and: [{
                                            $eq: [keyForPreviousMonth, "CarriedPM"]
                                        },
                                        {
                                            $eq: [keyForSelectedMonth, ""]
                                        }
                                        ]
                                    },
                                        1, 0
                                    ]
                                }
                            },

                        },
                    },

                    {
                        $project: {
                            _id: 0,
                            line_names: "$_id",
                            machine: 1,
                            "total_pmSchedule": 1,
                            "total_completed": 1,
                            "total_ongoing": 1,
                            "total_previous_pending": 1
                        }
                    },


                ])
                // console.log("219+++++++++++++++++", groupData)
                if (groupData.length > 0) {
                    // console.log(plants[j]?.plant_name, "---->", SectionInfo[i]?.section_name, "--->", SectionInfo[i]?.dashboardLevel)

                    // console.log("---------------------------", groupData)
                    sumVariableForTotalSchedule = sumVariableForTotalSchedule + groupData?.[0]?.total_pmSchedule
                    sumVariableForTotalCompleted = sumVariableForTotalCompleted + groupData?.[0]?.total_completed
                    sumVariableForTotalOngoing = sumVariableForTotalOngoing + groupData?.[0]?.total_ongoing
                    sumVariableForTotalPreviousPending = sumVariableForTotalPreviousPending + groupData?.[0]?.total_previous_pending

                    monthlyChartDataOfSummery.push(
                        new Object({
                            chartData: {
                                sumVariableForTotalSchedule: sumVariableForTotalSchedule,
                                sumVariableForTotalCompleted: sumVariableForTotalCompleted,
                                sumVariableForTotalOngoing: sumVariableForTotalOngoing,
                                sumVariableForTotalPreviousPending: sumVariableForTotalPreviousPending,
                            },
                            // plant_name: plants[j]?._id,
                            section_name: sectionInfo[i]?.section_name,
                            section_id: sectionInfo[i]?._id,
                            line_names: lineData[k]._id

                        })
                    )
                    // console.log(groupData)
                }
            }
            monthlyChartDataOfSummery = await Machine.populate(monthlyChartDataOfSummery, { path: "line_names", populate: { path: "cell_names", model: "Cells" } })

            // console.log("247 =============> ", monthlyChartDataOfSummery)

            const planVsActualTableBodyMappingFunction = (item, index) => {
                return `<tr>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${index + 1}</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${item?.line_names?.cell_names?.cell_name}</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${item?.line_names?.line_name}</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${item?.chartData?.sumVariableForTotalSchedule}</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${item?.chartData?.sumVariableForTotalPreviousPending}</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${item?.chartData?.sumVariableForTotalCompleted}</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${item?.chartData?.sumVariableForTotalOngoing}</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${item?.chartData?.sumVariableForTotalSchedule - item?.chartData?.sumVariableForTotalCompleted - item?.chartData?.sumVariableForTotalOngoing}</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${(
                        (item?.chartData?.sumVariableForTotalCompleted * 100) /
                        (item?.chartData?.sumVariableForTotalSchedule +
                            item?.chartData?.sumVariableForTotalPreviousPending)
                    ).toFixed(2)} %</td>
                        </tr>`
            }




            planVsActualTable = `<table style="font-family: arial, sans-serif;border-collapse: collapse;width: 100%;">
                        <tr>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>Serial No</b></td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>Cell/Product</b></td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>Line</b></td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>Plan</b></td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>Last Month Pending</b></td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>Completed</b></td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>Ongoing</b></td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>Remaining</b></td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>Completion %</b></td>
                        </tr>
                        
                        ${await monthlyChartDataOfSummery?.map((item, index) => planVsActualTableBodyMappingFunction(item, index))?.join("")}
                        </table>`



            // for (let m = 0; m < monthlyChartDataOfSummery.length; m++) {

            //     if (monthlyChartDataOfSummery[m]?.line_names?.cell_names?._id === monthlyChartDataOfSummery[m + 1]?.line_names?.cell_names?._id) {
            //         console.log(monthlyChartDataOfSummery[m]?.line_names?.cell_names?._id, monthlyChartDataOfSummery[m + 1]?.line_names?.cell_names?._id)
            //     }



            // }

            // monthlyChartDataOfSummery.map((item) => {
            //     item.line_names
            // })




            /* ***************************************************************************
             
             
                                                    for CurrentMonth
             
             
            *************************************************************************** */



            machineDataForCurrentMonth = await Machine.aggregate([{

                $match: {

                    line_names: { $in: lineData?.map((item) => item._id) },

                    $or: [{
                        "checkSheet_data.current_year": currentYear
                    },
                    {
                        "checkSheet_data": []
                    }
                    ],
                    "checkSheet_data": { $ne: [] },

                }

            },

            { $addFields: { checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] } } },

            {

                $match: {

                    [keyForCurrentMonthPMStatus]: { $ne: "" },

                    "checkSheet_data.PMStatus": { $ne: undefined },

                }

            },
            {

                $project: {
                    machine_code: 1,
                    machine_name: 1,
                    machine_nickname: 1,
                    machine_sequence: 1,
                    installation_date: 1,
                    maker_name: 1,
                    maker_sr_no: 1,
                    manufacturingDate: 1,
                    isPM: 1,
                    line_names: 1,
                    // checkSheet_data: 1,
                    checkSheetPMStatus: "$checkSheet_data.PMStatus"

                }

            },


            ])


            machineDataForCurrentMonth = await Machine.populate(machineDataForCurrentMonth, { path: "line_names", populate: { path: "cell_names", model: "Cells" } })

            // console.log("===========>151", machineDataForCurrentMonth)


            const currentMonthTableBodyMappingFunction = (item, index) => {
                return `<tr>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${index + 1}</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${item?.line_names?.cell_names?.cell_name}</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${item?.line_names?.line_name}</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${item.machine_name}</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${item?.machine_code}</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${item?.checkSheetPMStatus?.[monthForCompareSystemMonth]}</td>
                        </tr>`
            }


            currentMonthTable = `<table style="font-family: arial, sans-serif;border-collapse: collapse;width: 100%;">
                        <tr>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>Serial No</b></td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>Cell/Product</b></td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>Line</b></td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>Machine</b></td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>Machine No.</b></td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>PM Status</b></td>
                        </tr>
                        
                        ${await machineDataForCurrentMonth?.map((item, index) => currentMonthTableBodyMappingFunction(item, index))?.join("")}
                        </table>`



            // console.log(
            //     "180===================>", toEmailArray?.length > 0 ? toEmailArray : [undefined],
            //     "+++++++++++++++++++++++++++++++++++", sectionInfo[i],
            //     "================================>", machineDataForCurrentMonth)

            // autoSendMail(toEmailArray?.length > 0 ? toEmailArray : [undefined], `Monthly PM Plan (${monthForCompareSystemMonth}- Month)`, "Current Month Scheduled", currentMonthTable)
            // autoSendMail([
            //     'emailgen50@gmail.com',
            //     'romin301.osl@gmail.com'
            // ], `Monthly PM Plan (${monthForCompareSystemMonth}- Month)`, "Current Month Scheduled", currentMonthTable)



            /* ***************************************************************************
             
             
                                                   for PreviousMonth
             
             
            *************************************************************************** */


            machineDataForPreviousMonth = await Machine.aggregate([{
                $match: {
                    line_names: { $in: lineData?.map((item) => item._id) },
                    $or: [{
                        "checkSheet_data.current_year": currentYear
                    },
                    {
                        "checkSheet_data": []
                    }
                    ],
                    "checkSheet_data": { $ne: [] },
                }
            },
            {
                $project: {
                    machine_code: 1,
                    machine_name: 1,
                    machine_nickname: 1,
                    machine_sequence: 1,
                    installation_date: 1,
                    maker_name: 1,
                    maker_sr_no: 1,
                    manufacturingDate: 1,
                    isPM: 1,
                    line_names: 1,
                    checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] }
                }
            },
            {
                $match: {
                    // [keyForPreviousMonthPMStatus]: { $ne: "" },
                    "checkSheet_data.PMStatus": { $ne: undefined },
                }
            },
            ])
            machineDataForPreviousMonth = await Machine.populate(machineDataForPreviousMonth, { path: "line_names", populate: { path: "cell_names", model: "Cells" } })

            // console.log("238===============>", sectionInfo[i], "++++++++++++++++++=", machineDataForPreviousMonth)

            machineDataForPreviousMonth.map((keyForCheckSheet) => {

                for (let i = 0; i < Object.keys(keyForCheckSheet?.checkSheet_data?.PMStatus)?.length; i++) {
                    let month = financialYearWiseMonthKeyArray[i]

                    if (keyForCheckSheet?.checkSheet_data?.PMStatus[month] === "PM Skip") {
                        for (let j = 0; j < keyForCheckSheet?.checkSheet_data?.checkSheet?.length; j++) {

                            if (
                                // (keyForCheckSheet?.checkSheet_data?.checkSheet[j]?.cycle !== '1/1M' ||
                                //     keyForCheckSheet?.checkSheet_data?.checkSheet[j]?.cycle !== '1/2M')
                                (keyForCheckSheet?.checkSheet_data?.checkSheet[j]?.cycle === "1/3M" ||
                                    keyForCheckSheet?.checkSheet_data?.checkSheet[j]?.cycle === "1/4M" ||
                                    keyForCheckSheet?.checkSheet_data?.checkSheet[j]?.cycle === "1/6M" ||
                                    keyForCheckSheet?.checkSheet_data?.checkSheet[j]?.cycle === "1/Y")
                                &&
                                (keyForCheckSheet?.checkSheet_data?.checkSheet[j]?.planningTableAnimationArray2[month][1] === "skip" &&
                                    keyForCheckSheet?.checkSheet_data?.checkSheet[j]?.planningTableAnimationArray2[month][0] === "1")
                            ) {


                                skipMachineDataWithEveryMonth.push(
                                    new Object({
                                        machine_name: keyForCheckSheet?.machine_name,
                                        machine_code: keyForCheckSheet?.machine_code,
                                        yearOfCheckSheet: keyForCheckSheet?.checkSheet_data?.current_year,
                                        schedule_month: month,
                                        line_name: keyForCheckSheet?.line_names?.line_name,
                                        cell_name: keyForCheckSheet?.line_names?.cell_names?.cell_name,
                                        PMStatus: keyForCheckSheet?.checkSheet_data?.PMStatus?.[month],
                                        completionTargetDate: keyForCheckSheet?.checkSheet_data?.completionTargetDate?.[month],
                                        checkSheet_data: keyForCheckSheet?.checkSheet_data,

                                    })
                                );
                                break;
                            }

                        }

                    }
                    // console.log(keyForCheckSheet?.checkSheet_data?.PMStatus[month], "----", keyForCheckSheet?.machine_name)
                    if ((keyForCheckSheet?.checkSheet_data?.PMStatus[month] === "Done with delay" &&
                        keyForCheckSheet?.checkSheet_data?.flagOfDoneWithDelayForOneMonth?.[month] === currentMonthInNumber)) {
                        skipMachineDataWithEveryMonth.push(
                            new Object({
                                machine_name: keyForCheckSheet?.machine_name,
                                machine_code: keyForCheckSheet?.machine_code,
                                yearOfCheckSheet: keyForCheckSheet?.checkSheet_data?.current_year,
                                schedule_month: month,
                                line_name: keyForCheckSheet?.line_names?.line_name,
                                cell_name: keyForCheckSheet?.line_names?.cell_names?.cell_name,
                                PMStatus: keyForCheckSheet?.checkSheet_data?.PMStatus[month],
                                checkSheet_data: keyForCheckSheet?.checkSheet_data,
                                completionTargetDate: keyForCheckSheet?.checkSheet_data?.completionTargetDate?.[month]

                            })
                        );
                    }

                }
                if (previousMonth != "Mar") {
                    if (keyForCheckSheet?.checkSheet_data?.carriedPMStatus?.[monthForCompareSystemMonth] != "" && keyForCheckSheet?.checkSheet_data?.carriedPMStatus != undefined) {
                        skipMachineDataWithEveryMonth.push(
                            new Object({
                                machine_name: keyForCheckSheet?.machine_name,
                                machine_code: keyForCheckSheet?.machine_code,
                                yearOfCheckSheet: keyForCheckSheet?.checkSheet_data?.current_year,
                                line_name: keyForCheckSheet?.line_names?.line_name,
                                cell_name: keyForCheckSheet?.line_names?.cell_names?.cell_name,
                                schedule_month: previousMonth,
                                PMStatus: keyForCheckSheet?.checkSheet_data?.PMStatus[previousMonth],
                                checkSheet_data: keyForCheckSheet?.checkSheet_data
                            })
                        )
                    }
                }

            })

            // console.log("318===============>", sectionInfo[i], "++++++++++++++++++=", machineDataForPreviousMonth)

            const previousMonthTableBodyMappingFunction = (item, index) => {
                return `<tr>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${index + 1}</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${item?.line_names?.cell_names?.cell_name}</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${item?.line_names?.line_name}</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${item.machine_name}</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${item?.machine_code}</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${item?.checkSheet_data?.PMStatus?.[previousMonth]}</td>
                        </tr>`
            }

            previousMonthTable = `<table style="font-family: arial, sans-serif;border-collapse: collapse;width: 100%;">
                        <tr>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>Serial No</b></td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>Cell/Product</b></td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>Line</b></td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>Machine</b></td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>Machine No.</b></td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>PM Status</b></td>
                        </tr>
                        
                        ${await machineDataForPreviousMonth?.map((item, index) => previousMonthTableBodyMappingFunction(item, index))?.join("")}
                        </table>`





            // autoSendMail(

            // toEmailArray?.length > 0 ? toEmailArray : [undefined],
            // ccEmailArray?.length > 0 ? ccEmailArray : [undefined],
            //     sectionInfo[i]?.section_name,
            //     `Status of Monthly PM Plan (${monthForCompareSystemMonth}- Month)`,
            //     "Status of PM Plan vs Actual",
            //     planVsActualTable,
            //     "Current Month Scheduled",
            //     currentMonthTable,
            //     "Last Month Pending PM",
            //     previousMonthTable
            // )

        } else if (sectionInfo[i].dashboardLevel === "No") {


            subSectionsData = await SubSection.find({ section_names: sectionInfo[i]._id }).sort({ subSection_sequence: 1 })


            for (let subIterator = 0; subIterator < subSectionsData?.length; subIterator++) {

                let ssKey = `${subSectionsData[subIterator]?.subSection_id}-${subSectionsData[subIterator]?.subSection_name}`
                // console.log(ssKey)

                userInfo = await User.find({ subSection_data: ssKey });
                // userInfo = await User.find({ subSection_data: { $in: [ssKey] } });
                // console.log(
                //     userInfo
                // )

                toEmailArray = userInfo?.map((result) => {
                    if (result.tm_department === "PRD" && result.user_type === "TL/HOSS") {
                        // return result
                        return result?.email ? result?.email : undefined
                    }
                })

                ccEmailArray = userInfo?.map((result) => {
                    if (
                        (
                            (result.tm_department === "PRD" || result.tm_department === "MTD")
                            && result.user_type === "HOS"
                        )
                        ||
                        (
                            result.tm_department === "MTD" &&
                            (result.user_type === "TL/HOSS" || result.user_type === "HOD")
                        )

                        // (result.tm_department === "PRD" || result.tm_department === "MTD")
                        // && (result.user_type === "TL/HOSS" || result.user_type === "HOS" || result.user_type === "HOD")
                    ) {
                        return result
                        // return result?.email ? result?.email : undefined
                    }
                })



                cellData = await Cell.find({ subSection_names: subSectionsData[subIterator]._id }).sort({ cell_sequence: 1 });
                // cellData = await Cell.find({ subSection_names: { $in: subSectionsData?.map((item) => item._id) } }).sort({ cell_sequence: 1 });

                lineData = await Line.find({ cell_names: { $in: cellData?.map((item) => item._id) } }).sort({ line_sequence: 1 });
                // lineData = await Line.find({ cell_names: { $in: cellData?.map((item) => item._id) } }).populate({ path: "cell_names" }).sort({ line_sequence: 1 });

                // console.log("644 ", lineData)




                /* ***************************************************************************
                           
                           
                                                       Status of PM Plan vs Actual
                           
                           
                *************************************************************************** */


                let monthlyChartDataOfSummery = []


                if (lineData?.length > 0) {

                    for (let k = 0; k < lineData.length; k++) {

                        groupData = await Machine.aggregate([

                            {

                                $match: {
                                    line_names: lineData[k]._id,
                                    // "checkSheet_data": { $ne: undefined },
                                    $or: [{
                                        "checkSheet_data.current_year": currentYear
                                    },
                                    {
                                        "checkSheet_data": []
                                    }
                                    ],
                                }
                            },
                            {
                                $project: {
                                    machine_code: 1,
                                    machine_name: 1,
                                    machine_nickname: 1,
                                    machine_sequence: 1,
                                    installation_date: 1,
                                    maker_name: 1,
                                    maker_sr_no: 1,
                                    manufacturingDate: 1,
                                    isPM: 1,
                                    line_names: 1,
                                    checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] }
                                }
                            },
                            {
                                $match: {
                                    "checkSheet_data.PMStatus": { $ne: undefined },
                                    "checkSheet_data": { $ne: undefined }
                                }
                            },
                            {
                                $group: {
                                    _id: "$line_names",
                                    machine: { $push: { machine_code: "$machine_code", machine_name: "$machine_name" } },
                                    total_pmSchedule: {
                                        $sum: {
                                            $cond: [{
                                                $ne: [keyForSelectedMonth, ""]
                                            },
                                                1, 0
                                            ]
                                        }
                                    },
                                    total_completed: {
                                        $sum: {
                                            $cond: [{
                                                $eq: [keyForSelectedMonth, "Completed"]
                                            },
                                                1, 0
                                            ]
                                        }
                                    },
                                    total_ongoing: {
                                        $sum: {
                                            $cond: [{
                                                $eq: [keyForSelectedMonth, "Ongoing"]
                                            },
                                                1, 0
                                            ]
                                        }
                                    },
                                    total_previous_pending: {
                                        $sum: {
                                            $cond: [{
                                                $and: [{
                                                    $eq: [keyForPreviousMonth, "CarriedPM"]
                                                },
                                                {
                                                    $eq: [keyForSelectedMonth, ""]
                                                }
                                                ]
                                            },
                                                1, 0
                                            ]
                                        }
                                    },

                                },
                            },

                            {
                                $project: {
                                    _id: 0,
                                    line_names: "$_id",
                                    machine: 1,
                                    "total_pmSchedule": 1,
                                    "total_completed": 1,
                                    "total_ongoing": 1,
                                    "total_previous_pending": 1
                                }
                            },


                        ])
                        // console.log("219+++++++++++++++++", groupData)
                        if (groupData.length > 0) {
                            // console.log(plants[j]?.plant_name, "---->", SectionInfo[i]?.section_name, "--->", SectionInfo[i]?.dashboardLevel)

                            // console.log("---------------------------", groupData)
                            sumVariableForTotalSchedule = sumVariableForTotalSchedule + groupData?.[0]?.total_pmSchedule
                            sumVariableForTotalCompleted = sumVariableForTotalCompleted + groupData?.[0]?.total_completed
                            sumVariableForTotalOngoing = sumVariableForTotalOngoing + groupData?.[0]?.total_ongoing
                            sumVariableForTotalPreviousPending = sumVariableForTotalPreviousPending + groupData?.[0]?.total_previous_pending

                            monthlyChartDataOfSummery.push(
                                new Object({
                                    chartData: {
                                        sumVariableForTotalSchedule: sumVariableForTotalSchedule,
                                        sumVariableForTotalCompleted: sumVariableForTotalCompleted,
                                        sumVariableForTotalOngoing: sumVariableForTotalOngoing,
                                        sumVariableForTotalPreviousPending: sumVariableForTotalPreviousPending,
                                    },
                                    // plant_name: plants[j]?._id,
                                    section_name: sectionInfo[i]?.section_name,
                                    section_id: sectionInfo[i]?._id,
                                    line_names: lineData[k]._id

                                })
                            )
                            // console.log(groupData)
                        }
                    }

                }

                monthlyChartDataOfSummery = await Machine.populate(monthlyChartDataOfSummery, { path: "line_names", populate: { path: "cell_names", model: "Cells" } })

                // console.log("794 =============> ", monthlyChartDataOfSummery)

                const planVsActualTableBodyMappingFunction = (item, index) => {
                    return `<tr>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${index + 1}</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${item?.line_names?.cell_names?.cell_name}</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${item?.line_names?.line_name}</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${item?.chartData?.sumVariableForTotalSchedule}</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${item?.chartData?.sumVariableForTotalPreviousPending}</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${item?.chartData?.sumVariableForTotalCompleted}</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${item?.chartData?.sumVariableForTotalOngoing}</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${item?.chartData?.sumVariableForTotalSchedule - item?.chartData?.sumVariableForTotalCompleted - item?.chartData?.sumVariableForTotalOngoing}</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${(
                            (item?.chartData?.sumVariableForTotalCompleted * 100) /
                            (item?.chartData?.sumVariableForTotalSchedule +
                                item?.chartData?.sumVariableForTotalPreviousPending)
                        ).toFixed(2)} %</td>
                        </tr>`
                }




                planVsActualTable = `<table style="font-family: arial, sans-serif;border-collapse: collapse;width: 100%;">
                        <tr>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>Serial No</b></td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>Cell/Product</b></td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>Line</b></td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>Plan</b></td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>Last Month Pending</b></td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>Completed</b></td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>Ongoing</b></td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>Remaining</b></td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>Completion %</b></td>
                        </tr>
                        
                        ${await monthlyChartDataOfSummery?.map((item, index) => planVsActualTableBodyMappingFunction(item, index))?.join("")}
                        </table>`



                // for (let m = 0; m < monthlyChartDataOfSummery.length; m++) {

                //     if (monthlyChartDataOfSummery[m]?.line_names?.cell_names?._id === monthlyChartDataOfSummery[m + 1]?.line_names?.cell_names?._id) {
                //         console.log(monthlyChartDataOfSummery[m]?.line_names?.cell_names?._id, monthlyChartDataOfSummery[m + 1]?.line_names?.cell_names?._id)
                //     }



                // }

                // monthlyChartDataOfSummery.map((item) => {
                //     item.line_names
                // })




                /* ***************************************************************************
                 
                 
                                                        for CurrentMonth
                 
                 
                *************************************************************************** */



                machineDataForCurrentMonth = await Machine.aggregate([{

                    $match: {

                        line_names: { $in: lineData?.map((item) => item._id) },

                        $or: [{
                            "checkSheet_data.current_year": currentYear
                        },
                        {
                            "checkSheet_data": []
                        }
                        ],
                        "checkSheet_data": { $ne: [] },

                    }

                },

                { $addFields: { checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] } } },

                {

                    $match: {

                        [keyForCurrentMonthPMStatus]: { $ne: "" },

                        "checkSheet_data.PMStatus": { $ne: undefined },

                    }

                },
                {

                    $project: {
                        machine_code: 1,
                        machine_name: 1,
                        machine_nickname: 1,
                        machine_sequence: 1,
                        installation_date: 1,
                        maker_name: 1,
                        maker_sr_no: 1,
                        manufacturingDate: 1,
                        isPM: 1,
                        line_names: 1,
                        // checkSheet_data: 1,
                        checkSheetPMStatus: "$checkSheet_data.PMStatus"

                    }

                },


                ])


                machineDataForCurrentMonth = await Machine.populate(machineDataForCurrentMonth, { path: "line_names", populate: { path: "cell_names", model: "Cells" } })

                // console.log("===========>151", machineDataForCurrentMonth)


                const currentMonthTableBodyMappingFunction = (item, index) => {
                    return `<tr>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${index + 1}</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${item?.line_names?.cell_names?.cell_name}</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${item?.line_names?.line_name}</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${item.machine_name}</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${item?.machine_code}</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${item?.checkSheetPMStatus?.[monthForCompareSystemMonth]}</td>
                        </tr>`
                }


                currentMonthTable = `<table style="font-family: arial, sans-serif;border-collapse: collapse;width: 100%;">
                        <tr>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>Serial No</b></td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>Cell/Product</b></td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>Line</b></td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>Machine</b></td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>Machine No.</b></td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>PM Status</b></td>
                        </tr>
                        
                        ${await machineDataForCurrentMonth?.map((item, index) => currentMonthTableBodyMappingFunction(item, index))?.join("")}
                        </table>`



                /* ***************************************************************************
                 
                 
                                                       for PreviousMonth
                 
                 
                *************************************************************************** */


                machineDataForPreviousMonth = await Machine.aggregate([{
                    $match: {
                        line_names: { $in: lineData?.map((item) => item._id) },
                        $or: [{
                            "checkSheet_data.current_year": currentYear
                        },
                        {
                            "checkSheet_data": []
                        }
                        ],
                        "checkSheet_data": { $ne: [] },
                    }
                },
                {
                    $project: {
                        machine_code: 1,
                        machine_name: 1,
                        machine_nickname: 1,
                        machine_sequence: 1,
                        installation_date: 1,
                        maker_name: 1,
                        maker_sr_no: 1,
                        manufacturingDate: 1,
                        isPM: 1,
                        line_names: 1,
                        checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] }
                    }
                },
                {
                    $match: {
                        // [keyForPreviousMonthPMStatus]: { $ne: "" },
                        "checkSheet_data.PMStatus": { $ne: undefined },
                    }
                },
                ])
                machineDataForPreviousMonth = await Machine.populate(machineDataForPreviousMonth, { path: "line_names", populate: { path: "cell_names", model: "Cells" } })

                // console.log("238===============>", sectionInfo[i], "++++++++++++++++++=", machineDataForPreviousMonth)

                machineDataForPreviousMonth.map((keyForCheckSheet) => {

                    for (let i = 0; i < Object.keys(keyForCheckSheet?.checkSheet_data?.PMStatus)?.length; i++) {
                        let month = financialYearWiseMonthKeyArray[i]

                        if (keyForCheckSheet?.checkSheet_data?.PMStatus[month] === "PM Skip") {
                            for (let j = 0; j < keyForCheckSheet?.checkSheet_data?.checkSheet?.length; j++) {

                                if (
                                    // (keyForCheckSheet?.checkSheet_data?.checkSheet[j]?.cycle !== '1/1M' ||
                                    //     keyForCheckSheet?.checkSheet_data?.checkSheet[j]?.cycle !== '1/2M')
                                    (keyForCheckSheet?.checkSheet_data?.checkSheet[j]?.cycle === "1/3M" ||
                                        keyForCheckSheet?.checkSheet_data?.checkSheet[j]?.cycle === "1/4M" ||
                                        keyForCheckSheet?.checkSheet_data?.checkSheet[j]?.cycle === "1/6M" ||
                                        keyForCheckSheet?.checkSheet_data?.checkSheet[j]?.cycle === "1/Y")
                                    &&
                                    (keyForCheckSheet?.checkSheet_data?.checkSheet[j]?.planningTableAnimationArray2[month][1] === "skip" &&
                                        keyForCheckSheet?.checkSheet_data?.checkSheet[j]?.planningTableAnimationArray2[month][0] === "1")
                                ) {


                                    skipMachineDataWithEveryMonth.push(
                                        new Object({
                                            machine_name: keyForCheckSheet?.machine_name,
                                            machine_code: keyForCheckSheet?.machine_code,
                                            yearOfCheckSheet: keyForCheckSheet?.checkSheet_data?.current_year,
                                            schedule_month: month,
                                            line_name: keyForCheckSheet?.line_names?.line_name,
                                            cell_name: keyForCheckSheet?.line_names?.cell_names?.cell_name,
                                            PMStatus: keyForCheckSheet?.checkSheet_data?.PMStatus?.[month],
                                            completionTargetDate: keyForCheckSheet?.checkSheet_data?.completionTargetDate?.[month],
                                            checkSheet_data: keyForCheckSheet?.checkSheet_data,

                                        })
                                    );
                                    break;
                                }

                            }

                        }
                        // console.log(keyForCheckSheet?.checkSheet_data?.PMStatus[month], "----", keyForCheckSheet?.machine_name)
                        if ((keyForCheckSheet?.checkSheet_data?.PMStatus[month] === "Done with delay" &&
                            keyForCheckSheet?.checkSheet_data?.flagOfDoneWithDelayForOneMonth?.[month] === currentMonthInNumber)) {
                            skipMachineDataWithEveryMonth.push(
                                new Object({
                                    machine_name: keyForCheckSheet?.machine_name,
                                    machine_code: keyForCheckSheet?.machine_code,
                                    yearOfCheckSheet: keyForCheckSheet?.checkSheet_data?.current_year,
                                    schedule_month: month,
                                    line_name: keyForCheckSheet?.line_names?.line_name,
                                    cell_name: keyForCheckSheet?.line_names?.cell_names?.cell_name,
                                    PMStatus: keyForCheckSheet?.checkSheet_data?.PMStatus[month],
                                    checkSheet_data: keyForCheckSheet?.checkSheet_data,
                                    completionTargetDate: keyForCheckSheet?.checkSheet_data?.completionTargetDate?.[month]

                                })
                            );
                        }

                    }
                    if (previousMonth != "Mar") {
                        if (keyForCheckSheet?.checkSheet_data?.carriedPMStatus?.[monthForCompareSystemMonth] != "" && keyForCheckSheet?.checkSheet_data?.carriedPMStatus != undefined) {
                            skipMachineDataWithEveryMonth.push(
                                new Object({
                                    machine_name: keyForCheckSheet?.machine_name,
                                    machine_code: keyForCheckSheet?.machine_code,
                                    yearOfCheckSheet: keyForCheckSheet?.checkSheet_data?.current_year,
                                    line_name: keyForCheckSheet?.line_names?.line_name,
                                    cell_name: keyForCheckSheet?.line_names?.cell_names?.cell_name,
                                    schedule_month: previousMonth,
                                    PMStatus: keyForCheckSheet?.checkSheet_data?.PMStatus[previousMonth],
                                    checkSheet_data: keyForCheckSheet?.checkSheet_data
                                })
                            )
                        }
                    }

                })

                // console.log("318===============>", sectionInfo[i], "++++++++++++++++++=", machineDataForPreviousMonth)

                const previousMonthTableBodyMappingFunction = (item, index) => {
                    return `<tr>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${index + 1}</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${item?.line_names?.cell_names?.cell_name}</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${item?.line_names?.line_name}</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${item.machine_name}</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${item?.machine_code}</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${item?.checkSheet_data?.PMStatus?.[previousMonth]}</td>
                        </tr>`
                }

                previousMonthTable = `<table style="font-family: arial, sans-serif;border-collapse: collapse;width: 100%;">
                        <tr>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>Serial No</b></td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>Cell/Product</b></td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>Line</b></td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>Machine</b></td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>Machine No.</b></td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>PM Status</b></td>
                        </tr>
                        
                        ${await machineDataForPreviousMonth?.map((item, index) => previousMonthTableBodyMappingFunction(item, index))?.join("")}
                        </table>`



                // autoSendMail(

                // toEmailArray?.length > 0 ? toEmailArray : [undefined],
                // ccEmailArray?.length > 0 ? ccEmailArray : [undefined],
                //     subSectionsData[subIterator]?.subSection_name,
                //     `Status of Monthly PM Plan (${monthForCompareSystemMonth}- Month)`,
                //     "Status of PM Plan vs Actual",
                //     planVsActualTable,
                //     "Current Month Scheduled",
                //     currentMonthTable,
                //     "Last Month Pending PM",
                //     previousMonthTable
                // )

            }




        }


    }

    // cellData = await Cell.find({ subSection_names: { $in: sectionInfo?.map((item) => item._id) } }).sort({ cell_sequence: 1 });
    subSectionsData = await SubSection.find({ section_names: { $in: sectionInfo?.map((item) => item._id) } }).sort({ subSection_sequence: 1 })




});

module.exports = cron;
