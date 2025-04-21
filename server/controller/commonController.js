const express = require("express");
const router = express.Router();

const RequestSheetOfBM = require("../model/requestSheetDataOfBM");
const Machine = require("../model/machineSchema");
const User = require("../model/userSchema");
const Section = require("../model/sectionSchema");

const NoLossBD = require("../model/noLossBDSheetData");

const authenticate = require("../middleware/authenticate");
const cookieParser = require("cookie-parser");
const Plant = require("../model/plantSchema");

const tryCatchHandler = require("../errorHandler/tryCatchHandler");
const filterMiddleware = require("../middleware/filterMiddleware");
const truncValue = require("../utils/truncValue");
const logger = require("../utils/LoggingController/loggers");
const maintenanceType = require("../utils/maintenanceType");

router.use(cookieParser());
router.use(authenticate);

const successResponse = (res, message, data) => {
  try {
    res.status(201).json({
      message,
      ...data,
    });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[2] });
    res.status(500).json({ message: error?.message, error });
  }
};

const machineCommonInitialPipeline = (matchObj, selectedYear) => [
  {
    $match: matchObj,
  },
  {
    $unwind: "$checkSheet_data",
  },
  {
    $match: {
      "checkSheet_data.current_year": selectedYear,
      "checkSheet_data.PMStatus": { $ne: undefined },
      checkSheet_data: { $ne: undefined },
    },
  },
];

router.get(
  "/masterLog/:filter/:selectedId",
  filterMiddleware,
  tryCatchHandler(async (req, res, next) => {
    let queryPipelineForPm = [
      {
        $addFields: {
          //   data: {
          //     $map: {
          //       input: {
          //         $objectToArray: "$checkSheet_data.implemetation_completed_date",
          //       },
          //       as: "firstItem",
          //       in: {
          //         month: "$$firstItem.k",
          //         date: {
          //           $arrayElemAt: ["$$firstItem.v", -1],
          //         },
          //         time: {
          //           $getField: {
          //             field: "totalWorkedPMTime",
          //             input: {
          //               $getField: {
          //                 field: "v",
          //                 input: {
          //                   $arrayElemAt: [
          //                     {
          //                       $filter: {
          //                         input: {
          //                           $objectToArray:
          //                             "$checkSheet_data.totalPMTime",
          //                         },
          //                         as: "secondItem",
          //                         cond: {
          //                           $eq: ["$$secondItem.k", "$$firstItem.k"],
          //                         },
          //                       },
          //                     },
          //                     0,
          //                   ],
          //                 },
          //               },
          //             },
          //           },
          //         },
          //       },
          //     },
          //   },

          data: {
            $map: {
              input: {
                $objectToArray: "$checkSheet_data.totalPMTime",
              },
              as: "firstItem",
              in: {
                month: "$$firstItem.k",
                time: "$$firstItem.v.totalWorkedPMTime",
                date: {
                  $arrayElemAt: [
                    {
                      $getField: {
                        field: "v",
                        input: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: {
                                  $objectToArray:
                                    "$checkSheet_data.implemetation_completed_date",
                                },
                                as: "secondItem",
                                cond: {
                                  $eq: ["$$secondItem.k", "$$firstItem.k"],
                                },
                              },
                            },
                            0,
                          ],
                        },
                      },
                    },
                    -1,
                  ],
                },
                pmStatus: {
                  $getField: {
                    field: "v",
                    input: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: {
                              $objectToArray: "$checkSheet_data.PMStatus",
                            },
                            as: "secondItem",
                            cond: {
                              $eq: ["$$secondItem.k", "$$firstItem.k"],
                            },
                          },
                        },
                        0,
                      ],
                    },
                  },
                },
                doneBy: {
                  $getField: {
                    field: "v",
                    input: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: {
                              $objectToArray: "$checkSheet_data.PMworkedTMName",
                            },
                            as: "secondItem",
                            cond: {
                              $eq: ["$$secondItem.k", "$$firstItem.k"],
                            },
                          },
                        },
                        0,
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      },
      {
        $unwind: "$data",
      },
    ];

    const commonLookupPipeline = [
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
      {
        $lookup: {
          from: "machinesalldatas",
          localField: "machineRef",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                machine_code: 1,
                machine_name: 1,
              },
            },
          ],
          as: "machines",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "users",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                tm_name: 1,
              },
            },
          ],
          as: "doneBy",
        },
      },
    ];

    if (req.query?.selectedMonth) {
      queryPipelineForPm = [
        {
          $addFields: {
            data: {
              month: req.query?.selectedMonth,
              time: `$checkSheet_data.totalPMTime.${req.query?.selectedMonth}.totalWorkedPMTime`,
              date: {
                $arrayElemAt: [
                  `$checkSheet_data.implemetation_completed_date.${req.query?.selectedMonth}`,
                  -1,
                ],
              },
              pmStatus: `$checkSheet_data.PMStatus.${req.query?.selectedMonth}`,
              doneBy: `$checkSheet_data.PMworkedTMName.${req.query?.selectedMonth}`,
            },
          },
        },
      ];
    }

    const pmLog = Machine.aggregate([
      // {
      //   $match: req.queryObjForPM,
      // },
      // {
      //   $unwind: "$checkSheet_data",
      // },
      // {
      //   $match: {
      //     "checkSheet_data.current_year": req.query?.selectedYear,
      //   },
      // },
      ...machineCommonInitialPipeline(
        req.queryObjForPM,
        req.query?.selectedYear
      ),
      {
        $lookup: {
          from: "lines",
          localField: "line_names",
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
          localField: "cell_names",
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
      ...queryPipelineForPm,
      {
        $project: {
          month: "$data.month",
          date: "$data.date",
          cell: { $arrayElemAt: ["$cells.cell_name", 0] },
          line: { $arrayElemAt: ["$lines.line_name", 0] },
          // shiftOfBM: 1,
          maintenanceType: "PM",
          time: "$data.time",
          // firstTimeOrRepeat: 1,
          doneBy: {
            $map: {
              input: "$data.doneBy",
              as: "tm_name",
              in: {
                tm_name: "$$tm_name",
              },
            },
          },
          status: "$data.pmStatus",

          machine_code: 1,
          machine_name: 1,
        },
      },
      //   {
      //     $unwind: {
      //       $map: {
      //         input: {
      //           $objectToArray: "$checkSheet_data.implemetation_completed_date",
      //         },
      //         as: "firstItem",
      //         in: {
      //           month: "$$firstItem.k",
      //           date: "$$firstItem.v",
      //           time: {
      //             $arrayElemAt: [
      //               {
      //                 $filter: {
      //                   input: {
      //                     $objectToArray: "$checkSheet_data.totalPMTime",
      //                   },
      //                   as: "secondItem",
      //                   cond: { $eq: ["$$secondItem.k", "$$firstItem.k"] },
      //                 },
      //               },
      //               0,
      //             ],
      //           },
      //         },
      //       },
      //     },
      //   },
    ]);

    const bmLog = RequestSheetOfBM.aggregate([
      {
        $match: req.queryObj,
      },

      {
        $addFields: {
          users: {
            $setUnion: [["$assignUser"], ["$handOverUser"], "$supportingTM"],
          },
        },
      },

      ...commonLookupPipeline,

      {
        $project: {
          month: "$preAggregationTimeStampOfRequestSheet.requestSheet_month",
          date: {
            $dateToString: {
              format: "%d-%m-%Y T%H:%M",
              date: "$problemOccurredDateAndTimeOfBM",
              timezone: "Asia/Kolkata",
            },
          },
          cell: { $arrayElemAt: ["$cells.cell_name", 0] },
          line: { $arrayElemAt: ["$lines.line_name", 0] },
          machine_name: { $arrayElemAt: ["$machines.machine_name", 0] },
          machine_code: { $arrayElemAt: ["$machines.machine_code", 0] },
          shift: "$shiftOfBM",
          maintenanceType: "$maintenanceType",
          time: "$maintenanceReportFilledByMTD.breakDownTime",

          problem: "$maintenanceReportFilledByMTD.problemsOfBM",
          cause: "$maintenanceReportFilledByMTD.whyAnalysis",
          action: "$maintenanceReportFilledByMTD.actionAndCounterMeasureStep",
          counterMeasure: "$preventive_corrective_maintenance",
          category: "$categoriesOfRequestSheet",

          actionTemporaryOrNot: 1,
          doneBy: 1,
          status: "$requestSheetStatus",
        },
      },
    ]);

    const noLossLog = NoLossBD.aggregate([
      {
        $match: req.queryObj,
      },
      {
        $addFields: {
          users: {
            $setUnion: [[{ $toObjectId: "$doneByNoLossBD" }], "$supportingTM"],
          },
        },
      },
      ...commonLookupPipeline,
      {
        $project: {
          month: "$preAggregationTimeStampOfRequestSheet.requestSheet_month",
          date: {
            $dateToString: {
              format: "%d-%m-%Y T%H:%M",
              date: "$workStartedDateOfBM",
              timezone: "Asia/Kolkata",
            },
          },
          cell: { $arrayElemAt: ["$cells.cell_name", 0] },
          line: { $arrayElemAt: ["$lines.line_name", 0] },
          machine_name: { $arrayElemAt: ["$machines.machine_name", 0] },
          machine_code: { $arrayElemAt: ["$machines.machine_code", 0] },
          shift: "$shiftOfBM",
          maintenanceType: "$maintenanceType",
          time: "$breakDownTime",

          problem: "$problemsOfBM",
          cause: {
            why: "$causeOfNoLoss",
          },
          action: "$actionAndCounterMeasureStep",
          counterMeasure: "$counterMeasureStep",
          category: "$categoriesOfRequestSheet",

          actionTemporaryOrNot: 1,
          doneBy: 1,
          status: "$machineStatus",
        },
      },
    ]);

    let queryObj = {
      plant_data: req?.rootUser?.plant_data,
    };

    if (req?.rootUser?.tm_grade !== "HOD") {
      const section = await Section.findOne({
        section_id: req?.rootUser?.section_data?.split("-")?.[0],
      });
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

    let TLHOSS_and_TM_user_list = await User.find(
      {
        ...queryObj,
        $or: [
          {
            user_type: "Operator",
          },
          {
            $and: [
              {
                user_type: "TL/HOSS",
              },
              {
                tm_department: "MTD",
              },
            ],
          },
        ],
      },
      {
        tm_name: 1,
        tm_department: 1,
        tm_grade: 1,
        user_type: 1,
      }
    );

    const shifts = Plant.find({
      plant_id: req?.rootUser?.plant_data?.split("-")?.[0],
    });

    const values = await Promise.all([
      bmLog,
      pmLog,
      noLossLog,
      TLHOSS_and_TM_user_list,
      shifts,
    ]);

    let updatedCsvDataForMasterLog = [
      ...values?.[0],
      ...values?.[1],
      ...values?.[2],
    ];

    successResponse(res, "Master log get successfully", {
      getShifts: values?.[4]?.[0]?.shiftOfBM,
      categories: values?.[4]?.[0]?.categories,
      TLHOSS_and_TM_user_list: values?.[3],
      masterLogData: [...values?.[0], ...values?.[1], ...values?.[2]],
    });
  })
);

router.get(
  "/getAllSpareConsumptionCostMTDKPI/:filter/:selectedId",
  filterMiddleware,
  tryCatchHandler(async (req, res, next) => {
    let queryPipelineForPmSpareCost = [
      {
        $addFields: {
          totalPMSpareCost: {
            $map: {
              input: {
                $objectToArray: "$checkSheet_data.checkSheet.spareDetails",
              },
              as: "usedSpareCost",
              in: {
                $cond: {
                  if: { $eq: ["$$usedSpareCost.v.spareParts", "Yes"] },
                  then: "$$usedSpareCost.v.cost",
                  else: 0,
                },
              },
            },
          },
        },
      },
      {
        $unwind: "$totalPMSpareCost",
      },
    ];

    const GetAllBMSpareConsumption = await RequestSheetOfBM.aggregate([
      {
        $match: { ...req.queryObj, changedParts: { $ne: [] } },
      },
      {
        $unwind: "$changedParts",
      },
      {
        $group: {
          _id: null,
          totalBMSpareCost: {
            $sum: "$changedParts.cost",
          },
        },
      },
    ]);

    if (req.query?.selectedMonth) {
      queryPipelineForPmSpareCost = [
        {
          $addFields: {
            totalPMSpareCost: `$checkSheet_data.checkSheet.spareDetails.${req.query.selectedMonth}.cost`,
          },
        },
      ];
    }

    const GetAllPMSpareConsumption = await Machine.aggregate([
      {
        $match: req.queryObjForPM,
      },
      {
        $unwind: "$checkSheet_data",
      },
      {
        $match: {
          "checkSheet_data.current_year": req.query?.selectedYear,
        },
      },
      {
        $unwind: "$checkSheet_data.checkSheet",
      },
      {
        $match: {
          "checkSheet_data.checkSheet.spareDetails": { $ne: undefined },
        },
      },
      ...queryPipelineForPmSpareCost,
      {
        $group: {
          _id: null,
          totalPMSpareCost: { $sum: "$totalPMSpareCost" },
        },
      },
    ]);

    let queryPipelineForOtherTypesSpareCost = [
      {
        $addFields: {
          objectToArrayOtherTypesSpare: {
            $filter: {
              input: {
                $objectToArray: "$checkSheet_data.extraSpareDetails",
              },
              as: "spareData",
              cond: {
                $ne: ["$$spareData.v", []],
              },
            },
          },
        },
      },
      {
        $unwind: "$objectToArrayOtherTypesSpare",
      },
      {
        $unwind: "$objectToArrayOtherTypesSpare.v",
      },
    ];

    if (req.query?.selectedMonth) {
      queryPipelineForOtherTypesSpareCost = [
        {
          $addFields: {
            objectToArrayOtherTypesSpare: {
              v: `$checkSheet_data.extraSpareDetails.${req.query?.selectedMonth}`,
            },
          },
        },
        {
          $unwind: "$objectToArrayOtherTypesSpare.v",
        },
      ];
    }

    const GetAllOtherSpareConsumption = await Machine.aggregate([
      {
        $match: req.queryObjForPM,
      },
      {
        $unwind: "$checkSheet_data",
      },
      {
        $match: {
          "checkSheet_data.current_year": req.query?.selectedYear,
          "checkSheet_data.extraSpareDetails": { $ne: undefined },
        },
      },
      ...queryPipelineForOtherTypesSpareCost,
      {
        $group: {
          _id: "$objectToArrayOtherTypesSpare.v.type",
          totalOtherSpareCost: { $sum: "$objectToArrayOtherTypesSpare.v.cost" },
        },
      },
      {
        $match: {
          _id: { $ne: "BM" },
        },
      },
    ]);
    // console.log("GetAllOtherSpareConsumption---", GetAllOtherSpareConsumption);

    // console.log("GetAllBMSpareConsumption---", GetAllBMSpareConsumption);

    // console.log("GetAllPMSpareConsumption---", GetAllPMSpareConsumption);

    successResponse(res, "Get plant maintenance spare cost successfully", {
      TotalSpareCostWithDifferentTypes: [
        GetAllPMSpareConsumption?.[0]?.totalPMSpareCost || 0,
        GetAllBMSpareConsumption?.[0]?.totalBMSpareCost || 0,
      ]?.concat(
        GetAllOtherSpareConsumption?.map((obj) => obj?.totalOtherSpareCost || 0)
      ),
    });
  })
);

router.get(
  "/kpi/getPMStatusData/:filter/:selectedId",
  filterMiddleware,
  tryCatchHandler(async (req, res, next) => {
    const financialYearWiseMonthKeyArray = [
      "Apr",
      "May",
      "June",
      "July",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
      "Jan",
      "Feb",
      "Mar",
    ];
    let previousMonth =
      financialYearWiseMonthKeyArray[
        financialYearWiseMonthKeyArray.indexOf(req.query?.selectedMonth) - 1
      ];

    let keyForSelectedMonth = `$checkSheet_data.PMStatus.${req.query?.selectedMonth}`;
    let keyForCurrentMonthScheduleOrNotStatus = `$checkSheet_data.currentMonthScheduleOrNotStatus.${req.query?.selectedMonth}`;
    let keyForPreviousMonth = `$checkSheet_data.carriedPMStatus.${req.query?.selectedMonth}`;
    let keyOfTotalDoneWithDelay = `$checkSheet_data.PMStatus.${previousMonth}`;

    const statusData = await Machine.aggregate([
      ...machineCommonInitialPipeline(
        req.queryObjForPM,
        req.query?.selectedYear
      ),
      {
        $group: {
          _id: null,
          total_pmSchedule: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $ne: [keyForSelectedMonth, ""],
                    },
                    {
                      $ne: [keyForCurrentMonthScheduleOrNotStatus, ""],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
          total_completed: {
            $sum: {
              $cond: [
                {
                  $or: [
                    {
                      $eq: [keyForSelectedMonth, "Completed"],
                    },
                    {
                      $and: [
                        {
                          $eq: [keyOfTotalDoneWithDelay, "Done with delay"],
                        },
                        {
                          $eq: [keyForCurrentMonthScheduleOrNotStatus, ""],
                        },
                      ],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
          total_ongoing: {
            $sum: {
              $cond: [
                {
                  $eq: [keyForSelectedMonth, "Ongoing"],
                },
                1,
                0,
              ],
            },
          },
          total_previous_pending: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $eq: [keyForPreviousMonth, "CarriedPM"],
                    },
                    {
                      $eq: [keyForCurrentMonthScheduleOrNotStatus, ""],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          PMRatio: {
            targetRatio: {
              $add: ["$total_pmSchedule", "$total_previous_pending"],
            },
            actualRatio: "$total_completed",
          },
          chartData: {
            percentage: {
              $concat: [
                {
                  $toString: truncValue({
                    $divide: [
                      {
                        $multiply: ["$total_completed", 100],
                      },
                      {
                        $add: ["$total_pmSchedule", "$total_previous_pending"],
                      },
                    ],
                  }),
                },
                "%",
              ],
            },
            data: [
              "$total_completed",
              "$total_ongoing",
              {
                $subtract: [
                  {
                    $add: ["$total_pmSchedule", "$total_previous_pending"],
                  },
                  {
                    $add: ["$total_completed", "$total_ongoing"],
                  },
                ],
              },
            ],
          },
          tableData: [
            {
              name: "Planned",
              bgColor: "table-primary",
              value: "$total_pmSchedule",
            },
            {
              name: "Pending(Previous Month)",
              bgColor: "table-danger",
              value: "$total_previous_pending",
            },
            {
              name: "Completed",
              bgColor: "table-success",
              value: "$total_completed",
            },
            {
              name: "Ongoing",
              bgColor: "table-warning",
              value: "$total_ongoing",
            },
            {
              name: "Remaining(Current Month)",
              bgColor: "",
              value: {
                $subtract: [
                  {
                    $add: ["$total_pmSchedule", "$total_previous_pending"],
                  },
                  {
                    $add: ["$total_completed", "$total_ongoing"],
                  },
                ],
              },
            },
          ],
        },
      },
    ]);

    successResponse(res, "PMStatus data get successfully", {
      statusData: statusData?.[0],
    });
  })
);

//This API usage for future spare entry logs/history
router.get(
  "/getAllSpareUsageHistoryDetails/:filter/:selectedId",
  filterMiddleware,
  tryCatchHandler(async (req, res, next) => {
    // console.log(req?.params);
    // console.log(req?.query);

    let queryPipelineForPmSpareCost = [
      {
        $addFields: {
          totalSpareDataUsageHistory: {
            $map: {
              input: {
                $objectToArray: "$checkSheet_data.checkSheet.spareDetails",
              },
              as: "usedSpareCost",
              in: {
                $cond: {
                  if: {
                    $and: [
                      {
                        $eq: ["$$usedSpareCost.v.spareParts", "Yes"],
                      },
                      {
                        $ne: ["$$usedSpareCost.v.cost", 0],
                      },
                    ],
                  },
                  then: {
                    date: {
                      $getField: {
                        field: "v",
                        input: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: {
                                  $objectToArray:
                                    "$checkSheet_data.checkSheet.completionDateOfInspection",
                                },
                                as: "completionDate",
                                cond: {
                                  $eq: [
                                    "$$completionDate.k",
                                    "$$usedSpareCost.k",
                                  ],
                                },
                              },
                            },
                            0,
                          ],
                        },
                      },
                    },
                    doneBy: {
                      $getField: {
                        field: "v",
                        input: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: {
                                  $objectToArray:
                                    "$checkSheet_data.checkSheet.inspectionCompletionBy",
                                },
                                as: "doneByName",
                                cond: {
                                  $eq: ["$$doneByName.k", "$$usedSpareCost.k"],
                                },
                              },
                            },
                            0,
                          ],
                        },
                      },
                    },
                    spareParts: "$$usedSpareCost.v.spareParts",
                    partName: "$$usedSpareCost.v.partName",
                    partNo: "$$usedSpareCost.v.partNo",
                    cost: "$$usedSpareCost.v.cost",
                    type: "PM",
                  },
                  else: 0,
                },
              },
            },
          },
        },
      },
      {
        $unwind: "$totalSpareDataUsageHistory",
      },
    ];

    if (req.query?.selectedMonth) {
      queryPipelineForPmSpareCost = [
        {
          $addFields: {
            totalSpareDataUsageHistory: {
              $cond: {
                if: {
                  $and: [
                    {
                      $eq: [
                        `$checkSheet_data.checkSheet.spareDetails.${req.query.selectedMonth}.spareParts`,
                        "Yes",
                      ],
                    },
                    {
                      $ne: [
                        `$checkSheet_data.checkSheet.spareDetails.${req.query.selectedMonth}.cost`,
                        0,
                      ],
                    },
                  ],
                },
                then: {
                  spareParts: `$checkSheet_data.checkSheet.spareDetails.${req.query.selectedMonth}.spareParts`,
                  partName: `$checkSheet_data.checkSheet.spareDetails.${req.query.selectedMonth}.partName`,
                  partNo: `$checkSheet_data.checkSheet.spareDetails.${req.query.selectedMonth}.partNo`,
                  cost: `$checkSheet_data.checkSheet.spareDetails.${req.query.selectedMonth}.cost`,
                  doneBy: `$checkSheet_data.checkSheet.inspectionCompletionBy.${req.query.selectedMonth}`,
                  date: {
                    $dateFromString: {
                      dateString: `$checkSheet_data.checkSheet.completionDateOfInspection.${req.query.selectedMonth}`,
                      format: "%d/%m/%Y - %z",
                    },
                  },
                },
                else: 0,
              },
            },
          },
        },
      ];
    }

    const GetAllPMSpareConsumption = await Machine.aggregate([
      {
        $match: {
          ...req.queryObjForPM,
          // _id: mongoose.Types.ObjectId("63b67ccba716e21c95cd37ae"),
        },
      },
      {
        $unwind: "$checkSheet_data",
      },
      {
        $match: {
          "checkSheet_data.current_year": req.query?.selectedYear,
        },
      },
      {
        $unwind: "$checkSheet_data.checkSheet",
      },
      {
        $match: {
          "checkSheet_data.checkSheet.spareDetails": { $ne: undefined },
        },
      },
      ...queryPipelineForPmSpareCost,
      {
        $match: {
          totalSpareDataUsageHistory: { $ne: 0 },
        },
      },
      {
        $lookup: {
          from: "lines",
          localField: "line_names",
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
        $project: {
          totalSpareDataUsageHistory: 1,
          machine_name: 1,
          machine_code: 1,
          line: { $arrayElemAt: ["$lines.line_name", 0] },
          abnormality: {
            $cond: {
              if: { $eq: ["$totalSpareDataUsageHistory.spareParts", "Yes"] },
              then: "Yes",
              else: "No",
            },
          },
          type: "PM",
          doneBy: "$totalSpareDataUsageHistory.doneBy",
          totalCost: {
            $sum: "$totalSpareDataUsageHistory.cost",
          },
        },
      },
    ]);

    let queryPipelineForOtherTypesSpareCost = [
      {
        $addFields: {
          totalSpareDataUsageOfOtherTypesSpare: {
            $filter: {
              input: {
                $objectToArray: "$checkSheet_data.extraSpareDetails",
              },
              as: "spareData",
              cond: {
                $ne: ["$$spareData.v", []],
              },
            },
          },
        },
      },
      {
        $unwind: "$totalSpareDataUsageOfOtherTypesSpare",
      },
      {
        $unwind: "$totalSpareDataUsageOfOtherTypesSpare.v",
      },
    ];

    if (req.query?.selectedMonth) {
      queryPipelineForOtherTypesSpareCost = [
        {
          $addFields: {
            totalSpareDataUsageOfOtherTypesSpare: {
              v: `$checkSheet_data.extraSpareDetails.${req.query?.selectedMonth}`,
            },
          },
        },
        {
          $unwind: "$totalSpareDataUsageOfOtherTypesSpare.v",
        },
      ];
    }

    const GetAllOtherSpareConsumption = await Machine.aggregate([
      {
        $match: req.queryObjForPM,
      },
      {
        $unwind: "$checkSheet_data",
      },
      {
        $match: {
          "checkSheet_data.current_year": req.query?.selectedYear,
          "checkSheet_data.extraSpareDetails": { $ne: undefined },
        },
      },
      ...queryPipelineForOtherTypesSpareCost,
      {
        $lookup: {
          from: "lines",
          localField: "line_names",
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
        $project: {
          totalSpareDataUsageHistory: "$totalSpareDataUsageOfOtherTypesSpare.v",
          machine_name: 1,
          machine_code: 1,
          line: { $arrayElemAt: ["$lines.line_name", 0] },
          abnormality: "",
          doneBy: "$totalSpareDataUsageOfOtherTypesSpare.v.usedBy",
          type: "$totalSpareDataUsageOfOtherTypesSpare.v.type",
        },
      },
    ]);

    let queryPipelineForBMSpareCost = [
      {
        $addFields: {
          "changedParts.date": {
            $dateToString: {
              format: "%d-%m-%Y T%H:%M",
              date: "$problemOccurredDateAndTimeOfBM",
              timezone: "Asia/Kolkata",
            },
          },
        },
      },
    ];

    const GetAllBMSpareConsumption = await RequestSheetOfBM.aggregate([
      {
        $match: { ...req.queryObj, changedParts: { $ne: [] } },
      },
      {
        $unwind: "$changedParts",
      },
      {
        $lookup: {
          from: "machinesalldatas",
          localField: "machineRef",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                machine_code: 1,
                machine_name: 1,
              },
            },
          ],
          as: "machine",
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
          from: "users",
          localField: "assignUser",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                user_type: 1,
                tm_no: 1,
                tm_name: 1,
                email: 1,
              },
            },
          ],
          as: "doneBy",
        },
      },
      ...queryPipelineForBMSpareCost,
      {
        $project: {
          totalSpareDataUsageHistory: "$changedParts",
          machine_name: { $arrayElemAt: ["$machine.machine_name", 0] },
          machine_code: { $arrayElemAt: ["$machine.machine_code", 0] },
          line: { $arrayElemAt: ["$lines.line_name", 0] },
          abnormality: "",
          type: "$maintenanceType",
          doneBy: { $arrayElemAt: ["$doneBy.tm_name", 0] },
        },
      },
    ]);

    successResponse(res, "Get all spare consumption logs", {
      GetAllSpareConsumption: GetAllPMSpareConsumption.concat(
        GetAllOtherSpareConsumption,
        GetAllBMSpareConsumption
      ),
    });
  })
);

module.exports = router;
