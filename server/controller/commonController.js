const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");
const fs = require("fs");
let path = require("path");
const RequestSheetOfBM = require("../model/requestSheetDataOfBM");
const Machine = require("../model/machineSchema");
const User = require("../model/userSchema");
const Section = require("../model/sectionSchema");
const SubSection = require("../model/subSectionSchema");
const Cell = require("../model/cellSchema");
const Line = require("../model/lineSchema");
const LogHistory = require("../model/logHistorySchema");

const authenticate = require("../middleware/authenticate");
const cookieParser = require("cookie-parser");
const Plant = require("../model/plantSchema");
const factory = require("./handleFactory");
const sendMailForBD = require("../sendMailForBM/sendMailForBDRequestSheet");
const moment = require("moment-timezone");

const tryCatchHandler = require("../errorHandler/tryCatchHandler");
const filtrationMiddleware = require("../middleware/filterMiddleware");

const timezone = "Asia/Kolkata";

router.use(cookieParser());
router.use(authenticate);

const successResponse = (res, message, data) => {
  try {
    res.status(201).json({
      message,
      ...data,
    });
  } catch (error) {
    res.status(500).json({ message: error?.message, error });
  }
};

router.get(
  "/masterLog/:filter/:selectedId",
  filtrationMiddleware,
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

    const pmLog = await Machine.aggregate([
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
          moduleCategory: "PM",
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

    const bmLog = await RequestSheetOfBM.aggregate([
      {
        $match: req.queryObj,
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
        $addFields: {
          users: {
            $setUnion: [["$assignUser"], ["$handOverUser"], "$supportingTM"],
          },
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
      {
        $project: {
          month: "$preAggregationTimeStampOfRequestSheet.requestSheet_month",
          date: "$problemOccurredDateAndTimeOfBM",
          cell: { $arrayElemAt: ["$cells.cell_name", 0] },
          line: { $arrayElemAt: ["$lines.line_name", 0] },
          machine_name: { $arrayElemAt: ["$machines.machine_name", 0] },
          machine_code: { $arrayElemAt: ["$machines.machine_code", 0] },
          shiftOfBM: 1,
          moduleCategory: "BM",
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

    successResponse(res, "Master log get successfully", {
      masterLogData: [...bmLog, ...pmLog],
    });
  })
);

module.exports = router;
