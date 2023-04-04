var cron = require('node-cron');
require('../db/conn')

const User = require('../model/userSchema')
const Plant = require('../model/plantSchema')
const Section = require('../model/sectionSchema')
const SubSection = require('../model/subSectionSchema')
const Cell = require('../model/cellSchema')
const Line = require('../model/lineSchema')
const Machine = require('../model/machineSchema')

const autoMailSendForSixMonthApproval = require("../sendMail/autoMailSendForSixMonthApproval")


// console.log("===================>", lastDay.getDate())
// cron.schedule(`59 ${a},${b} * * * *`, async () => {
cron.schedule(`00 01 ${(new Date((new Date()).getFullYear(), (new Date()).getMonth() + 1, 0)).getDate()} Sep,Mar *`, async (req, res) => {
    // cron.schedule(`59 * * * * *`, async (req, res) => {

    // console.log("Six-Month Approval")
    try {

        let currentYear =
            new Date().getMonth() < 3 ?
                `${new Date().getFullYear() - 1}-${new Date().getFullYear()}` :
                `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;


        let plantInfo = await Plant.find({})

        let subSectionsData,
            cellData,
            lineData,
            MachineInfo,
            userInfo

        let KeyFor6MonthApproval = {

            Sep: [],

            Mar: [],

        }


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
        let currentMonth = monthKeyArray[new Date().getMonth()];

        // console.log(currentMonth)


        //  ------------------------------------- Real --------------------------------------------
        let keyOfImplementation_assign_MTD_HOD = `checkSheet_data.$[outer].implementation_assign_MTD_HOD.${currentMonth}`;
        let keyOfImplemetation_mtd_hod_approval_status = `checkSheet_data.$[outer].implemetation_mtd_hod_approval_status.${currentMonth}`
        let keyOfImplementation_assign_MTD_HOD_name = `checkSheet_data.$[outer].implementation_assign_MTD_HOD_name.${currentMonth}`;



        //  ------------------------------------- For Testing --------------------------------------------
        // let keyOfImplementation_assign_MTD_HOD = `checkSheet_data.$[outer].implementation_assign_MTD_HOD.Sep`;
        // let keyOfImplemetation_mtd_hod_approval_status = `checkSheet_data.$[outer].implemetation_mtd_hod_approval_status.Sep`
        // let keyOfImplementation_assign_MTD_HOD_name = `checkSheet_data.$[outer].implementation_assign_MTD_HOD_name.Sep`;



        const funForUpdateParticularMachine = async (sectionOrSubSectionData, userInfo, particularMachineData) => {

            // console.log(sectionOrSubSectionData, "=============>", particularMachineData)


            // console.log(particularMachineData)



            if (!particularMachineData?.checkSheet_data?.implementation_assign_MTD_HOD_name) {
                await Machine.updateOne({ machine_code: particularMachineData.machine_code }, {
                    $set: {
                        //  ------------------------------------- Real --------------------------------------------
                        "checkSheet_data.$[outer].implementation_approval_month_of_hod": currentMonth,


                        //  ------------------------------------- For Testing --------------------------------------------
                        // "checkSheet_data.$[outer].implementation_approval_month_of_hod": "Sep",

                        "checkSheet_data.$[outer].implementation_assign_MTD_HOD": KeyFor6MonthApproval,
                        "checkSheet_data.$[outer].implementation_assign_MTD_HOD_name": KeyFor6MonthApproval,
                        // "checkSheet_data.$[outer].implementation_approved_by_MTD_HOD": KeyFor6MonthApproval,
                        "checkSheet_data.$[outer].implemetation_mtd_hod_approval_status": KeyFor6MonthApproval,
                    }
                }, {
                    arrayFilters: [{ 'outer.current_year': currentYear }],
                })
                // console.log(updateImplementationData)
            }



            await Machine.updateOne({ machine_code: particularMachineData.machine_code }, {
                $set: {

                    //  ------------------------------------- Real --------------------------------------------
                    "checkSheet_data.$[outer].implementation_approval_month_of_hod": currentMonth,


                    //  ------------------------------------- For Testing --------------------------------------------
                    // "checkSheet_data.$[outer].implementation_approval_month_of_hod": "Sep",
                },
                $push: {

                    [keyOfImplemetation_mtd_hod_approval_status]: "Pending",
                    [keyOfImplementation_assign_MTD_HOD]: userInfo.email,
                    [keyOfImplementation_assign_MTD_HOD_name]: userInfo.tm_name,
                }
            }, {
                arrayFilters: [{ 'outer.current_year': currentYear }],
            })



            // console.log(updateImplementationCompletionPhase)


        }



        for (let i = 0; i < plantInfo?.length; i++) {




            // userInfo = await User.find({ section_data: `${sectionInfo[i]?.section_id}-${sectionInfo[i]?.section_name}` });

            userInfo = await User.find(
                {
                    plant_data: `${plantInfo[i]?.plant_id}-${plantInfo[i]?.plant_name}`,
                    tm_grade: "HOD",
                    tm_department: "MTD"
                },

            )


            // console.log(`${sectionInfo[i]?.section_id}-${sectionInfo[i]?.section_name}`, userInfo?.[0])



            sectionInfo = await Section.find({ plant_names: plantInfo[i]?._id })

            subSectionsData = await SubSection.find({ section_names: { $in: sectionInfo?.map((item) => item._id) } }).sort({ subSection_sequence: 1 })

            cellData = await Cell.find({ subSection_names: { $in: subSectionsData?.map((item) => item._id) } }).sort({ cell_sequence: 1 });

            lineData = await Line.find({ cell_names: { $in: cellData?.map((item) => item._id) } }).sort({ line_sequence: 1 });


            // console.log("=========>  ", i, "<============", lineData)



            MachineInfo = await Machine.aggregate([{
                $match: {
                    line_names: { $in: lineData?.map((item) => item?._id) },
                    $or: [
                        {
                            "checkSheet_data": { $ne: [] }

                        },
                        {
                            "checkSheet_data.current_year": currentYear

                        },

                    ]
                }
            },
            {
                $project: {
                    machine_code: 1,
                    machine_name: 1,
                    machine_nickname: 1,
                    machine_sequence: 1,
                    // installation_date: 1,
                    // maker_name: 1,
                    // maker_sr_no: 1,
                    // manufacturingDate: 1,
                    // isPM: 1,
                    line_names: 1,
                    // checkSheet_data: 1
                    checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] }
                }
            }
            ])

            MachineInfo = await Machine.populate(MachineInfo, { path: "line_names", populate: { path: "cell_names", populate: { path: "subSection_names", populate: { path: "section_names", model: "Sections" } } } })

            await MachineInfo?.map(item => {
                if (userInfo?.length > 0) {

                    funForUpdateParticularMachine(sectionInfo[i], userInfo?.[0], item)
                }

            })



            autoMailSendForSixMonthApproval(userInfo?.[0]?.email)



        }


    } catch (error) {
        console.log(error)
    }


});

module.exports = cron;
