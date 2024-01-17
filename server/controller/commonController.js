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
        $addFields: {
          //   mergedArray: {
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

          mergedArray: {
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
              },
            },
          },
        },
      },
      {
        $unwind: "$mergedArray",
      },
      {
        $project: {
          machine_code: 1,
          machine_name: 1,
          mergedArray: 1,
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

    successResponse(res, "Master log get successfully", {
      pmLog,
    });
  })
);

module.exports = router;
