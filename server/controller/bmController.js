const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const moment = require("moment-timezone");
const timezone = "Asia/Kolkata";

const RequestSheetOfBM = require("../model/requestSheetDataOfBM");
const Machine = require("../model/machineSchema");
const User = require("../model/userSchema");
const Section = require("../model/sectionSchema");
const SubSection = require("../model/subSectionSchema");

const authenticate = require("../middleware/authenticate");
const cookieParser = require("cookie-parser");
const Plant = require("../model/plantSchema");
const factory = require("./handleFactory");

router.use(cookieParser());
router.use(authenticate);

router.get(
  "/getDataBasedOnScanningRequest/:sheetType/:machineCode",
  async (req, res, next) => {
    let sheet;
    if (req.params?.sheetType === "BM") {
      sheet = await RequestSheetOfBM.findOne({
        machineRef: req.params?.machineCode,
      }).sort({ _id: -1 });
    } else {
      let currentYear =
        new Date().getMonth() < 3
          ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
          : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

      sheet = await Machine.aggregate([
        {
          $match: {
            _id: mongoose.Types.ObjectId(req.params?.machineCode),
          },
        },
        {
          $unwind: "$checkSheet_data",
        },
        {
          $match: {
            "checkSheet_data.current_year": currentYear,
          },
        },
      ]);
    }
    if (!sheet) {
      return res.status(400).json({
        message: "No sheet found for the scanned QR",
      });
    }
    res.status(201).json({
      message: "Sheet data get successfully",
      sheet,
    });
  }
);

router.post("/newRequestSheetRegistration", async (req, res, next) => {
  try {
    const machine = await Machine.findOne({
      _id: req.query?.machineRef,
    })
      .populate({
        path: "line_names",
        populate: {
          path: "cell_names",
          populate: {
            path: "subSection_names",
            populate: {
              path: "section_names",
              populate: {
                path: "plant_names",
                model: "Plants",
              },
            },
          },
        },
      })
      .exec();

    if (machine) {
      const _idObject = {
        machineRef: machine._id,
        lineRef: machine.line_names._id,
        cellRef: machine.line_names.cell_names._id,
        subSectionRef: machine.line_names.cell_names.subSection_names._id,
        sectionRef:
          machine.line_names.cell_names.subSection_names.section_names._id,
        plantRef:
          machine.line_names.cell_names.subSection_names.section_names
            .plant_names._id,
      }

    let requestSheet;


      if (req.rootUser.user_type === "Operator") {
        const {
          workStartedDateOfBM,
          workEndedDateOfBM,
          workStartedTimeOfBM,
          workEndedTimeOfBM,
          breakTime,
          qualityCheckTime,
          maintenanceTime,
          problemsOfBM,
          actionAndCounterMeasureStep,
          minorBD,
          majorBD,
          firstTime,
          repeat,
          breakDownTime,
          why1,
          why2,
          why3,
          why4,
          why5,
        } = req.body;

      const startDateTimeBM = `${workStartedDateOfBM}T${workStartedTimeOfBM}`;
      const endDateTimeBM = `${workEndedDateOfBM}T${workEndedTimeOfBM}`;
      const requestSheetStartDateTime = new Date(startDateTimeBM);
      const requestSheetEndDateTime = new Date(endDateTimeBM);

        let queryObj = {
          ...req.body,
          ..._idObject,
          "maintenanceReportFilledByMTD.workStartedDateOfBM":
            requestSheetStartDateTime,
          "maintenanceReportFilledByMTD.workEndedDateOfBM":
            requestSheetEndDateTime,
          "maintenanceReportFilledByMTD.actionAndCounterMeasureStep":
            actionAndCounterMeasureStep,
          "maintenanceReportFilledByMTD.maintenanceTime": maintenanceTime,
          "maintenanceReportFilledByMTD.problemsOfBM": problemsOfBM,
          "maintenanceReportFilledByMTD.breakTime": breakTime,
          "maintenanceReportFilledByMTD.breakDownTime": breakDownTime,
          "maintenanceReportFilledByMTD.whyAnalysis.why1": why1,
          "maintenanceReportFilledByMTD.whyAnalysis.why2": why2,
          "maintenanceReportFilledByMTD.whyAnalysis.why3": why3,
          "maintenanceReportFilledByMTD.whyAnalysis.why4": why4,
          "maintenanceReportFilledByMTD.whyAnalysis.why5": why5,
          "maintenanceReportFilledByMTD.whyAnalysis.breakDownTime":
            breakDownTime,
          "maintenanceReportFilledByMTD.whyAnalysis.maintenanceTime":
            maintenanceTime,
          "maintenanceReportFilledByMTD.whyAnalysis.qualityCheckTime":
            qualityCheckTime,
          "maintenanceReportFilledByMTD.whyAnalysis.breakTime": breakTime,
          "maintenanceReportFilledByMTD.whyAnalysis.minorBD": minorBD,
          "maintenanceReportFilledByMTD.whyAnalysis.majorBD": majorBD,
          "maintenanceReportFilledByMTD.whyAnalysis.firstTime": firstTime,
          "maintenanceReportFilledByMTD.whyAnalysis.repeat": repeat,
        };

        requestSheet = await RequestSheetOfBM.findOneAndUpdate(
          { _id: req.query.reqId },
          {
            $set: queryObj,
          },
          {
            new: true,
          }
        );
      } else {
        const {
          problemFaced,
          PRD_ObservationForProblem_5Why_1How,
          why_5M_1E,
          where_process,
          when_frequency,
          who_person,
          which_defectLocation,
          how_details,
          requestSheetdate,
          requestSheettime,
          maintenanceType,
          priorityCode,
          qualityRelated,
          shiftOfBM,
          sheetIssuedTime,
        } = req.body;

        const combinedDateTimeString = `${requestSheetdate}T${requestSheettime}`;
        const requestSheetDateTime = new Date(combinedDateTimeString);
        const currentDateTime = new Date();

        requestSheet = new RequestSheetOfBM({
          ...req.query,
          ..._idObject,
          requestSheetCreatedBy: req.rootUser._id,
          ...req.body,
          priorityCode: priorityCode,
          qualityRelated: qualityRelated,
          shiftOfBM: shiftOfBM,
          breakDownAttendedBy: req.rootUser._id,
          maintenanceType: maintenanceType || "BM",
          problemOccurredDateAndTimeOfBM: requestSheetDateTime,
          sheetIssuedDateAndTimeOfBM: sheetIssuedTime,
          breakDownBasicDataFilledByPRD: {
            problemFaced,
            PRD_ObservationForProblem_5Why_1How,
            why_5M_1E,
            where_process,
            when_frequency,
            who_person,
            which_defectLocation,
            how_details,
          },
        });

        await requestSheet.save();
      }
    }

    res
      .status(201)
      .json({ message: "Request-sheet generated successfully", requestSheet });
  } catch (error) {
    res.status(500).json({ message: error?.message, error });
  }
});

router.patch("/updateRequestSheet", async (req, res, next) => {
  let queryObj = {
    assignOperator: req.body?.assign_user_name,
  };

  if (
    req.rootUser?.tm_department === "PRD" &&
    req.rootUser?.user_type === "TL/HOSS"
  ) {
    queryObj = {
      finalActivity: req.body?.finalActivity,
      "maintenanceReportFilledByMTD.partQualityCheckedByPRD": req.rootUser?._id,
      workEndedDateOfBM: new Date(req.body?.problemOccurredDateAndTimeOfBM),
      partQualityStatusOfPRD: req.body?.PRDUser,
      partQualityCheckedByMTD: req.body?.MTDUser,
      statusPRD_TL: req.body?.statusPRD_TL,
    };
  }
  const requestSheet = await RequestSheetOfBM.findOneAndUpdate(
    req.query,
    {
      $set: queryObj,
    },
    {
      new: true,
    }
  );

  res
    .status(201)
    .json({ message: "Request-sheet updated successfully", requestSheet });
});

router.get("/getRequestSheetData", async (req, res, next) => {
  try {
    const requestSheetData = await RequestSheetOfBM.aggregate([
      {
        $lookup: {
          from: "machinesalldatas",
          localField: "machineRef",
          foreignField: "_id",
          as: "machines",
        },
      },
      {
        $lookup: {
          from: "lines",
          localField: "lineRef",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                line_name: 1,
              },
            },
          ],
          as: "lines",
        },
      },
      {
        $lookup: {
          from: "cells",
          localField: "cellRef",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                cell_name: 1,
              },
            },
          ],
          as: "cells",
        },
      },
      // // {
      // //   $lookup: {
      // //     from: "subsections",
      // //     localField: "subSectionRef",
      // //     foreignField: "_id",
      // //     pipeline: [
      // //       {
      // //         $project: {
      // //           subSection_name: 1,
      // //         },
      // //       },
      // //     ],
      // //     as: "subSections",
      // //   },
      // // },
      // // {
      // //   $lookup: {
      // //     from: "sections",
      // //     localField: "sectionRef",
      // //     foreignField: "_id",
      // //     pipeline: [
      // //       {
      // //         $project: {
      // //           section_name: 1,
      // //         },
      // //       },
      // //     ],
      // //     as: "sections",
      // //   },
      // // },

      {
        $lookup: {
          from: "users",
          localField: "partQualityCheckedByPRD",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                tm_name: 1,
              },
            },
          ],
          as: "namesPRD",
        },
      },
      {
        $lookup: {
          from: "users",
          let: { mtdUserId: "$partQualityCheckedByMTD" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$user_type", "TL/HOSS"] },
                    { $eq: ["$tm_department", "MTD"] },
                    { $eq: ["$_id", "$$mtdUserId"] },
                  ],
                },
              },
            },
            {
              $project: {
                user_type: 1,
                tm_department: 1,
                tm_name: 1,
              },
            },
          ],
          as: "namesMTD",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "assignOperator",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                user_type: 1,
                tm_name: 1,
              },
            },
          ],
          as: "namesOperators",
        },
      },

      {
        $project: {
          machines: 1,
          requestSheetCreatedBy: 1,
          requestSheetNoOfBM: 1,
          cell: { $arrayElemAt: ["$cells.cell_name", 0] },
          line: { $arrayElemAt: ["$lines.line_name", 0] },
          machineNo: { $arrayElemAt: ["$machines.machine_code", 0] },
          machineName: { $arrayElemAt: ["$machines.machine_name", 0] },
          PRDUser: { $arrayElemAt: ["$namesPRD.tm_name", 0] },
          Operator: {
            $arrayElemAt: ["$namesOperators.tm_name", 0],
          },
          MTDUser: { $arrayElemAt: ["$namesMTD.tm_name", 0] },
          problem: "$breakDownBasicDataFilledByPRD.problemFaced",
          problemOccurredDateAndTimeOfBM: 1,
          "maintenanceReportFilledByMTD.workEndedDateOfBM": 1,
          partQualityStatusOfPRD: 1,
          finalActivity: 1,
          statusPRD_TL: 1,
          PRDUser: {
            $concat: [
              "$partQualityStatusOfPRD",
              " - ",
              { $arrayElemAt: ["$namesPRD.tm_name", 0] },
            ],
          },
        },
      },
    ]);

    if (requestSheetData?.length === 0) {
      return res.status(400).json({
        message: "No data to display",
      });
    }

    const counters = await RequestSheetOfBM.aggregate([
      {
        $match: {
          requestSheetCreatedBy: req.rootUser?._id,
        },
      },
      {
        $group: {
          _id: null,
          open_request_sheet_count: {
            $sum: {
              $cond: [{ $eq: ["$breakDownAttendedStatus", "Open"] }, 1, 0],
            },
          },
          closed_request_sheet_count: {
            $sum: {
              $cond: [{ $eq: ["$breakDownAttendedStatus", "Closed"] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
    ]);

    res.status(201).json({
      message: "Request-sheet data get successfully",
      requestSheetData,
      counters: {
        ...counters?.[0],
        total_request_sheet_count: requestSheetData?.length,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error?.message, error });
  }
});

router.get(
  "/getUserDetails",
  async (req, res, next) => {
    try {
      const section = await Section.findOne({
        section_id: req?.rootUser?.section_data?.split("-")?.[0],
      });

      let queryObj = {
        plant_data: req?.rootUser?.plant_data,
      };

      if (req?.query?.tm_grade !== "HOD") {
        if (section.dashboardLevel === "Yes") {
          queryObj = {
            ...queryObj,
            section_data: req?.rootUser?.section_data,
          };
        } else {
          queryObj = {
            ...queryObj,
            section_data: req?.rootUser?.section_data,
            subSection_data: { $in: req?.rootUser?.subSection_data },
          };
        }
      }

      next();
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  },
  async (req, res, next) => {
    try {
      const users = await User.find({
        ...req?.query,
        ...req.queryObj,
        tm_no: { $ne: req?.rootUser?.tm_no },
      });

      res.status(201).json({ message: "User details get successfully", users });
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  }
);

// -------------------------------------------------------------------------------
//        Generate RequestSheet Dashboard APIS
// -------------------------------------------------------------------------------

const queryMiddleWareFunction = async (req, res, next) => {
  try {
    req.pipelineQueryObj = [
      {
        $lookup: {
          from: "cells",
          localField: "_id",
          foreignField: "subSection_names",
          pipeline: [
            {
              $lookup: {
                from: "lines",
                localField: "_id",
                foreignField: "cell_names",
                pipeline: [
                  {
                    $lookup: {
                      from: "machines",
                      localField: "_id",
                      foreignField: "line_names",
                      pipeline: [
                        {
                          $project: {
                            machine_code: 1,
                            machine_name: 1,
                            machine_nickname: 1,
                          },
                        },
                      ],
                      as: "machines",
                    },
                  },
                  { $project: { line_name: 1, machines: 1 } },
                ],
                as: "lines",
              },
            },
            { $project: { cell_name: 1, lines: 1 } },
          ],
          as: "cells",
        },
      },
      { $project: { subSection_name: 1, cells: 1 } },
    ];
    next();
  } catch (error) {
    res.status(500).json({ message: error?.message, error });
  }
};
const functionForGettingAllDataOfRequestSheetBasedOnDashboardLevel_NO = async (
  req,
  res,
  next
) => {
  try {
    let subSectionArr = [];
    const allDataBasedOnDashboardLevel = await SubSection.aggregate([
      {
        $match: {
          subSection_id: req.subSection?.split("-")?.[0],
        },
      },
      ...req.pipelineQueryObj,
    ]);

    if (req.rootUser?.subSection_data?.length > 1) {
      subSectionArr = req.rootUser?.subSection_data;
    }

    return res.status(201).json({
      message: "Main dashboard data get successfully",
      dashboardLevel: req?.dashboardLevel,
      selectedSubSection: req.subSection,
      subSectionArr,
      allDataBasedOnDashboardLevel: allDataBasedOnDashboardLevel?.[0],
    });
  } catch (error) {
    res.status(500).json({ message: error?.message, error });
  }
};

router.get(
  "/getAllDataForGenerateNewRequestSheetDashboardBasedOnDashboardLevel",
  queryMiddleWareFunction,
  async (req, res, next) => {
    try {
      const section = await Section.findOne({
        section_id: req?.rootUser?.section_data?.split("-")?.[0],
      });

      let allDataBasedOnDashboardLevel;

      if (section?.dashboardLevel === "Yes") {
        allDataBasedOnDashboardLevel = await Section.aggregate([
          {
            $match: {
              _id: section?._id,
            },
          },
          {
            $lookup: {
              from: "subsections",
              localField: "_id",
              foreignField: "section_names",
              pipeline: req.pipelineQueryObj,
              as: "subSections",
            },
          },
          { $project: { section_name: 1, subSections: 1 } },
        ]);

        return res.status(201).json({
          message: "Main dashboard data get successfully",
          dashboardLevel: section?.dashboardLevel,
          allDataBasedOnDashboardLevel: allDataBasedOnDashboardLevel?.[0],
        });
      }

      req.subSection = req.rootUser?.subSection_data?.[0];
      req.dashboardLevel = section?.dashboardLevel;
      return next();

      // allDataBasedOnDashboardLevel = await SubSection.aggregate([
      //   {
      //     $match: {
      //       subSection_id:
      //         req.rootUser?.subSection_data?.[0]?.split("-")?.[0],
      //     },
      //   },
      //   ...req.pipelineQueryObj,
      // ]);
      // pipeline: [
      //   {
      //     $match: {
      //       cell_id: {
      //         $in: req.rootUser?.cell_data?.map(
      //           (item) => item?.split("-")?.[0]
      //         ),
      //       },
      //     },
      //   },
      //   {
      //     $lookup: {
      //       from: "lines",
      //       localField: "_id",
      //       foreignField: "cell_names",
      //       pipeline: [
      //         {
      //           $lookup: {
      //             from: "machines",
      //             localField: "_id",
      //             foreignField: "line_names",
      //             pipeline: [
      //               {
      //                 $project: {
      //                   machine_code: 1,
      //                   machine_name: 1,
      //                   machine_nickname: 1,
      //                 },
      //               },
      //             ],
      //             as: "machines",
      //           },
      //         },
      //         { $project: { line_name: 1, machines: 1 } },
      //       ],
      //       as: "lines",
      //     },
      //   },
      //   { $project: { cell_name: 1, lines: 1 } },
      // ],
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  },
  functionForGettingAllDataOfRequestSheetBasedOnDashboardLevel_NO
);

router.get(
  "/getAllDataBasedOnSelectedSubSection/:subSection/:dashboardLevel",
  queryMiddleWareFunction,
  async (req, res, next) => {
    try {
      req.subSection = req.params?.subSection;
      req.dashboardLevel = req.params?.dashboardLevel;
      return next();
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  },
  functionForGettingAllDataOfRequestSheetBasedOnDashboardLevel_NO
);
// router.get(
//   "/getMachineDetailsOnScanningRequest/:generateType",
//   async (req, res, next) => {
//     const machine = await Machine.findOne(req.query)
//       .populate({
//         path: "line_names",
//         populate: {
//           path: "cell_names",
//           populate: {
//             path: "subSection_names",
//             populate: {
//               path: "section_names",
//               populate: {
//                 path: "plant_names",
//                 model: "Plants",
//               },
//             },
//           },
//         },
//       })
//       .exec();

//     const section = await Section.findOne({
//       section_id: req?.rootUser?.section_data?.split("-")?.[0],
//     });

//     let queryObj = {
//       plant_data: req?.rootUser?.plant_data,
//     };

//     if (req?.query?.tm_grade !== "HOD") {
//       if (section.dashboardLevel === "Yes") {
//         queryObj = {
//           ...queryObj,
//           section_data: req?.rootUser?.section_data,
//         };
//       } else {
//         queryObj = {
//           ...queryObj,
//           section_data: req?.rootUser?.section_data,
//           subSection_data: { $in: req?.rootUser?.subSection_data },
//         };
//       }
//     }

//     console.log("queryObj", queryObj);

//     // const mtdUser = await User.find({
//     //   tm_department: req.query.tm_department,
//     //   tm_grade: req.query.tm_grade,
//     // });
//     const mtdUser = await User.find({
//       ...queryObj,
//     });

//     // const mtdUserTL = await User.find({
//     //   tm_department: req.query.tm_department,
//     //   user_type: req.query.user_type,
//     // });

//     if (machine) {
//       res.status(201).json({
//         message: "Sheet data get successfully",
//         machine,
//         breakDownAttendedBy: req.rootUser.tm_name,
//         mtdUser,
//         // mtdUserTL,
//       });
//     } else {
//       res.status(404).json({ message: "Machine not found" });
//     }
//   }
// );

router.get("/getMtdUserDetails", async (req, res, next) => {
  const mtdUser = await User.find({
    tm_department: req.query.tm_department,
    tm_grade: req.query.tm_grade,
  });

  const mtdUserTL = await User.find({
    tm_department: req.query.tm_department,
    user_type: req.query.user_type,
  });

  const mtdHod = await User.find({
    tm_department: req.query.tm_department,
    tm_grade: "HOD",
  });
  const prdHod = await User.find({
    tm_department: "PRD",
    tm_grade: "HOD",
  });
  const prdHos = await User.find({
    tm_department: "PRD",
    tm_grade: "HOS",
  });
  const prdTL = await User.find({
    tm_department: "PRD",
    user_type: "TL/HOSS",
  });

  res.status(201).json({
    message: "Mtd User get successfully",
    mtdUser,
    mtdUserTL,
    mtdHod,
    prdHod,
    prdHos,
    prdTL,
  });
});

// -------------------------------------------------------------------------------
//        Monitoring RequestSheet APIS
// -------------------------------------------------------------------------------

router.get("/getRequestSheetMonitoringData/:id", async (req, res, next) => {
  const functionForQueryObject = (status) => ({
    $sum: {
      $cond: [{ $eq: ["$requestSheetStatus", status] }, 1, 0],
    },
  });
  try {
    const allStatusCounterForGraph = await RequestSheetOfBM.aggregate([
      {
        $lookup: {
          from: "lines",
          localField: "lineRef",
          foreignField: "_id",
          as: "lines",
        },
      },
      {
        $match: {
          lineRef: mongoose.Types.ObjectId(req.params?.id),
        },
      },
      {
        $group: {
          _id: null,
          total_generated: functionForQueryObject(statusArray[0]), // "Generated",
          total_assigned: functionForQueryObject(statusArray[1]), // "Assigned",
          total_work_order_open: functionForQueryObject(statusArray[2]), // "Work Order Open",
          total_work_order_pending: functionForQueryObject(statusArray[3]), // "Work Order Pending",
          total_work_order_closed: functionForQueryObject(statusArray[4]), // "Work Order Closed",
          // "Fill sheet",
          // "Under MTD TL approval",
          // "Under MTD HOSS approval",
          // "Under MTD HOS approval",
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
    ]);

    const allMonths = Array.from({ length: 12 }, (_, monthIndex) => ({
      monthName: moment().month(monthIndex).format("MMMM"),
      monthInDecimal: `${monthIndex + 1}`,
    }));

    const generatedAndCompletedStatusMonthlyData =
      await RequestSheetOfBM.aggregate([
        {
          $lookup: {
            from: "lines",
            localField: "lineRef",
            foreignField: "_id",
            as: "lines",
          },
        },
        {
          $match: {
            lineRef: mongoose.Types.ObjectId(req.params?.id),
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%m",
                date: "$sheetIssuedDateAndTimeOfBM",
                timezone: timezone,
              },
            },
            generated: functionForQueryObject(statusArray[0]),
            completed: functionForQueryObject(statusArray[4]),
          },
        },

        {
          $project: {
            month: {
              $function: {
                body: function (month) {
                  return [
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "July",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec",
                  ]?.[month - 1];
                },
                args: ["$_id"],
                lang: "js",
              },
            },
            generated: 1,
            completed: 1,
          },
        },
        // {
        //   $group: {
        //     _id: null,
        //     array: { $push: "$$ROOT" },
        //   },
        // },
        // {
        //   $project: {
        //     _id: 0,
        //     array: {
        //       $map: {
        //         input: allMonths,
        //         as: "month",
        //         in: {
        //           $cond: [
        //             { $in: ["$$month.monthInDecimal", "$array._id"] },
        //             {
        //               month: "$$month.monthName",
        //               data: {
        //                 $arrayElemAt: [
        //                   "$array",
        //                   {
        //                     $indexOfArray: [
        //                       "$array._id",
        //                       "$$month.monthInDecimal",
        //                     ],
        //                   },
        //                 ],
        //               },
        //             },
        //             {
        //               month: "$$month.monthName",
        //               data: {
        //                 _id: "$$month.monthInDecimal",
        //                 generated: 0,
        //                 completed: 0,
        //               },
        //             },
        //           ],
        //         },
        //       },
        //     },
        //   },
        // },
        // { $unwind: "$array" },
        // {
        //   $replaceRoot: { newRoot: "$array" },
        // },
      ]);
    // .explain("executionStats");

    return res.status(201).json({
      message: "Monitoring request-sheet data get successfully",
      allStatusCounterForGraph,
      generatedAndCompletedStatusMonthlyData,
    });
  } catch (error) {
    res.status(500).json({ message: error?.message, error });
  }
});
router.post(
  "/addDynamicApprovalListOfBM",
  authenticate,
  async (req, res, next) => {
    const approvalListOfMinorAndMajor = req.body;

    const addDynamicApprovalListInPlant = await Plant.findOneAndUpdate(
      {
        plant_id: req?.rootUser?.plant_data?.split("-")?.[0],
      },
      {
        $set: {
          ...approvalListOfMinorAndMajor,
        },
      },
      { new: true }
    );

    if (!addDynamicApprovalListInPlant) {
      return res.status(400).json({
        message: "Approval list not added",
      });
    } else {
      return res.status(201).json({
        message: "Approval list added successfully",
        addDynamicApprovalListInPlant,
      });
    }
  }
);

router.get(
  "/getMachineDetailsOnScanningRequest/:generateType",
  factory.getUserData(Machine, Section, User)
);

// router.get(
//   "/getMachineDetailsOnScanningRequest/:generateType",
//   async (req, res, next) => {
//     const machine = await Machine.findOne(req.query)
//       .populate({
//         path: "line_names",
//         populate: {
//           path: "cell_names",
//           populate: {
//             path: "subSection_names",
//             populate: {
//               path: "section_names",
//               populate: {
//                 path: "plant_names",
//                 model: "Plants",
//               },
//             },
//           },
//         },
//       })
//       .exec();

//     const section = await Section.findOne({
//       section_id: req?.rootUser?.section_data?.split("-")?.[0],
//     });

//     let queryObj = {
//       plant_data: req?.rootUser?.plant_data,
//     };

//     if (req?.query?.tm_grade !== "HOD") {
//       if (section.dashboardLevel === "Yes") {
//         queryObj = {
//           ...queryObj,
//           section_data: req?.rootUser?.section_data,
//         };
//       } else {
//         queryObj = {
//           ...queryObj,
//           section_data: req?.rootUser?.section_data,
//           subSection_data: { $in: req?.rootUser?.subSection_data },
//         };
//       }
//     }

//     console.log("queryObj", queryObj);

//     // const mtdUser = await User.find({
//     //   tm_department: req.query.tm_department,
//     //   tm_grade: req.query.tm_grade,
//     // });
//     const mtdUser = await User.find({
//       queryObj,
//     });

//     // const mtdUserTL = await User.find({
//     //   tm_department: req.query.tm_department,
//     //   user_type: req.query.user_type,
//     // });

//     if (machine) {
//       res.status(201).json({
//         message: "Sheet data get successfully",
//         machine,
//         breakDownAttendedBy: req.rootUser.tm_name,
//         mtdUser,
//         // mtdUserTL,
//       });
//     } else {
//       res.status(404).json({ message: "Machine not found" });
//     }
//   }
// );

module.exports = router;
