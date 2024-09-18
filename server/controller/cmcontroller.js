const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");
const fs = require("fs");
let path = require("path");
const cookieParser = require("cookie-parser");
const moment = require("moment-timezone");
const timezone = "Asia/Kolkata";

const RequestSheetOfBM = require("../model/requestSheetDataOfBM");
const Machine = require("../model/machineSchema");
const User = require("../model/userSchema");
const Section = require("../model/sectionSchema");
const SubSection = require("../model/subSectionSchema");
const Cell = require("../model/cellSchema");
const Line = require("../model/lineSchema");
const LogHistory = require("../model/logHistorySchema");
const NoLossBD = require("../model/noLossBDSheetData");
const HandlingActions = require("../model/handlingActions");
const Plant = require("../model/plantSchema");
const RequestSheetOfCM = require("../model/requestSheetDataOfCM");

const authenticate = require("../middleware/authenticate");
const logger = require("../utils/LoggingController/loggers");

const tryCatchHandler = require("../errorHandler/tryCatchHandler");
const maintenanceType = require("../utils/maintenanceType");
const filterMiddleware = require("../middleware/filterMiddleware");
const { globalReqSheetNo } = require("../middleware/globalReqSheetNo");
const { gettingFYYear } = require("../middleware/gettingFYYear");
const {
  gettingMonthForSelectedDate,
} = require("../middleware/gettingFYMonthForPreAgg");

router.use(cookieParser());

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
let currentYear =
  new Date().getMonth() < 3
    ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
    : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

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

const storageForDataSheetsOfBD = multer.diskStorage({
  destination: function (req, file, cb) {
    // console.log(file.fieldname);
    if (file.fieldname === "attachedFilesByMTDUser") {
      cb(null, "./AttachedFileForCMByMTD/");
    }
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const uploadDataSheetsOfBD = multer({
  storage: storageForDataSheetsOfBD,
  // limits: {
  //   fileSize: 1024 * 1024 * 5,
  // },
  // fileFilter: fileFilterOfDataSheetOfBD,
});

const findTLandOperatorList = async (req, res, next) => {
  try {
    let TLHOSS_and_TM_user_list = [];

    if (
      req?.rootUser?.tm_department === "MTD" ||
      req?.rootUser?.user_type === "Operator"
    ) {
      TLHOSS_and_TM_user_list = await User.find(
        {
          ...req.queryObj,
          tm_no: { $ne: req?.rootUser?.tm_no },
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
      if (TLHOSS_and_TM_user_list?.length === 0) {
        return res.status(400).json({
          message: "No data to display",
        });
      }
    }
    req.TLHOSS_and_TM_user_list = TLHOSS_and_TM_user_list;

    next();
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

const dashboardLevelUserCheckMiddleware = async (req, res, next) => {
  try {
    const section = await Section.findOne({
      section_id: req?.rootUser?.section_data?.split("-")?.[0],
    });

    let queryObj = {
      plant_data: req?.rootUser?.plant_data,
    };

    if (req?.rootUser?.tm_grade !== "HOD") {
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

    req.queryObj = queryObj;
    next();
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

router.get(
  "/getMachineDetailsForRequestSheetOfCM",
  authenticate,
  findTLandOperatorList,
  tryCatchHandler(async (req, res, next) => {
    const selectedMachineData = await Machine.findOne({
      machine_code: req.query?.machine_code,
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
      .select(["machine_code", "machine_name"])
      .exec();

    successResponse(res, "Selected machine data get successfully", {
      machine: selectedMachineData,
      TLHOSS_and_TM_user_list: req?.TLHOSS_and_TM_user_list,
    });
  })
);

router.post(
  "/newRequestSheetRegistrationOfCM",
  authenticate,
  dashboardLevelUserCheckMiddleware,
  uploadDataSheetsOfBD.fields([
    { name: "attachedFilesByMTDUser", maxCount: 10 },
  ]),
  async (req, res, next) => {
    const dataSheet = req.files;

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

    const requestSheetDataFilledByMTDUserForCM = JSON.parse(req.body.otherData);

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
      };

      // let generateRequestSheetNoOfCM =
      //   machine.line_names.requestSheetNoOfCM + 1 || 1;

      // let increaseCountOfRequestSheetInLine = await Line.findOneAndUpdate(
      //   { _id: machine.line_names._id },
      //   { $set: { requestSheetNoOfCM: generateRequestSheetNoOfCM } },
      //   { new: true }
      // );
      // ==================== Previous code for req sheet No ==============================================
      // const requestSheetNoOfCM =
      //   machine?.line_names?.cell_names?.subSection_names?.section_names
      //     ?.dashboardLevel === "Yes"
      //     ? `${(machine?.line_names?.cell_names?.subSection_names?.section_names?.section_name)
      //         .trim()
      //         .substring(0, 2)
      //         .toUpperCase()}-${(machine?.line_names?.line_name).trim()}-${
      //         moment().tz("Asia/Kolkata").month()
      //       }-CM-${increaseCountOfRequestSheetInLine?.requestSheetNoOfCM}`.trim()
      //     : `${(machine?.line_names?.cell_names?.subSection_names?.subSection_name)
      //         .trim()
      //         .substring(0, 2)
      //         .toUpperCase()}-${(machine?.line_names?.line_name).trim()}-${
      //         moment().tz("Asia/Kolkata").month() + 1
      //       }-CM-${
      //         increaseCountOfRequestSheetInLine?.requestSheetNoOfCM
      //       }`.trim();
      // =========================================================================================================
      const requestSheetNoOfCM = await globalReqSheetNo(
        req.query?.machineRef,
        "CM"
      );

      let requestSheetOfCM = new RequestSheetOfCM({
        requestSheetNoOfCM,
        ...req.query,
        ..._idObject,
        shiftOfCM: requestSheetDataFilledByMTDUserForCM?.shiftOfBM,
        ...requestSheetDataFilledByMTDUserForCM,
        preAggregationTimeStampOfRequestSheet: {
          requestSheet_year: gettingFYYear(
            requestSheetDataFilledByMTDUserForCM?.problemOccurredDateAndTimeOfCM
          ),
          requestSheet_month: gettingMonthForSelectedDate(
            requestSheetDataFilledByMTDUserForCM?.problemOccurredDateAndTimeOfCM
          ),
        },
        sparePartUsedOrNot:
          requestSheetDataFilledByMTDUserForCM?.changedParts?.length > 0
            ? "Yes"
            : "No",
      });

      const result = await requestSheetOfCM.save();

      successResponse(res, "CM Request-sheet generated successfully", {
        requestSheetOfCM,
      });
    }
  }
);

router.get(
  "/getAllCmReqSheet/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  tryCatchHandler(async (req, res, next) => {
    try {
      let queryPipeline = [
        {
          $match: {
            ...req.queryObj,
          },
        },
      ];
      const reqSheetCM = await RequestSheetOfCM.aggregate([
        ...queryPipeline,
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
            from: "machinesalldatas",
            localField: "machineRef",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  machine_name: 1,
                  machine_code: 1,
                },
              },
            ],
            as: "machine",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "assignUserForCM",
            foreignField: "_id",
            pipeline:[
              {
                $project:{
                  tm_name:1
                }
              }
            ],
            as: "assigned_users"
          }  
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
            as: "cell",
          },
        },
        {
          $unwind: {
            path: "$lines",
          },
        },
        {
          $unwind: {
            path: "$cell",
          },
        },
        // {
        //   $unwind: {
        //     path: "$assigned_users",
        //   },
        // },
        {
          $unwind: {
            path: "$machine",
          },
        },
        {
          $sort: {
            _id: -1,
          },
        },
      ]);
      res.json({
        reqSheetCM,
        message: "Request-sheet fetched successfully",
      });
    } catch (error) {
      console.log(error);
    }
  })
);

module.exports = router;
