const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");

const RequestSheetOfBM = require("../model/requestSheetDataOfBM");
const Machine = require("../model/machineSchema");
const User = require("../model/userSchema");
const Section = require("../model/sectionSchema");
const SubSection = require("../model/subSectionSchema");
const Cell = require("../model/cellSchema");
const Line = require("../model/lineSchema");
const authenticate = require("../middleware/authenticate");
const cookieParser = require("cookie-parser");
const Plant = require("../model/plantSchema");
// const Line = require("../model/lineSchema");
const factory = require("./handleFactory");

const moment = require("moment-timezone");
const timezone = "Asia/Kolkata";

router.use(cookieParser());
router.use(authenticate);

const {
  APPROVAL_LIST_OF_MINOR_MAJOR_OF_BM,
} = require("../GlobalData/RequestSheetApprovalStatus");

const statusArray = [
  "Generated",
  "Assigned",
  "Work Order Open",
  "Work Order Pending",
  "Work Order Closed",
  "Fill Sheet",
  "Under MTD TL approval",
  "Under MTD HOSS approval",
  "Under MTD HOS approval",
];

const allMonths = [
  {
    monthName: "Apr",
    monthInDecimal: "04",
  },
  {
    monthName: "May",
    monthInDecimal: "05",
  },
  {
    monthName: "Jun",
    monthInDecimal: "06",
  },
  {
    monthName: "Jul",
    monthInDecimal: "07",
  },
  {
    monthName: "Aug",
    monthInDecimal: "08",
  },
  {
    monthName: "Sep",
    monthInDecimal: "09",
  },
  {
    monthName: "Oct",
    monthInDecimal: "10",
  },
  {
    monthName: "Nov",
    monthInDecimal: "11",
  },
  {
    monthName: "Dec",
    monthInDecimal: "12",
  },
  {
    monthName: "Jan",
    monthInDecimal: "01",
  },
  {
    monthName: "Feb",
    monthInDecimal: "02",
  },
  {
    monthName: "Mar",
    monthInDecimal: "03",
  },
];

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

const storageForDataSheetsOfBD = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "attachedDataSheets") cb(null, "./DataSheetOfBD/");
    else cb(null, "./DrawingsOfBD/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const fileFilterOfDataSheetOfBD = (req, file, cb) => {
  if (!file.originalname.match(/\.(xls|xlsx|csv)$/)) {
    return cb(new Error("Only .xls, .xlsx, .csv format allowed!"));
  } else {
    cb(null, true);
  }
};

const uploadDataSheetsOfBD = multer({
  storage: storageForDataSheetsOfBD,
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
  // fileFilter: fileFilterOfDataSheetOfBD,
});

router.post(
  "/newRequestSheetRegistration",
  uploadDataSheetsOfBD.fields([
    { name: "attachedDataSheets", maxCount: 1 },
    { name: "attachedDrawings", maxCount: 10 },
  ]),
  async (req, res, next) => {
    try {
      const dataSheet = req.files;

      const machine = await Machine.findOne({
        machine_code: req.query?.machineRef,
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
        };

        let requestSheet;

        if (
          req.rootUser.user_type === "Operator" ||
          req.rootUser.tm_department === "MTD"
        ) {
          // const {
          //   workStartedDateOfBM,
          //   workEndedDateOfBM,
          //   breakTime,
          //   qualityCheckTime,
          //   maintenanceTime,

          //   actionAndCounterMeasureStep,
          //   minorBD,
          //   majorBD,
          //   firstTime,
          //   repeat,
          //   breakDownTime,
          //   why1,
          //   why2,
          //   why3,
          //   why4,
          //   why5,
          //   changedParts,
          //   feedbackMTD_HOS,
          //   qualityConfirmed,
          //   partQualityCheckedByMTD,
          //   partQualityCheckedByPRD,
          //   supportingTM,
          //   categories,
          //   actionTemporaryOrNot,
          //   dataSheetOfRequestSheet,
          //   drawingOfRequestSheet,
          // } = req.body;

          const requestSheetDataFilledByMTDUser = JSON.parse(
            req.body.otherData
          );

          const convertedData = Object.keys(
            requestSheetDataFilledByMTDUser?.categories
          ).map((key) => ({
            category: key,
            subCategory: requestSheetDataFilledByMTDUser?.categories[key],
          }));

          let queryObj = {
            // ...req.body,
            ..._idObject,
            "maintenanceReportFilledByMTD.workStartedDateOfBM":
              requestSheetDataFilledByMTDUser?.workStartedDateOfBM,
            "maintenanceReportFilledByMTD.workEndedDateOfBM":
              requestSheetDataFilledByMTDUser?.workEndedDateOfBM,
            "maintenanceReportFilledByMTD.actionAndCounterMeasureStep":
              requestSheetDataFilledByMTDUser?.actionAndCounterMeasureStep,

            "maintenanceReportFilledByMTD.problemsOfBM":
              requestSheetDataFilledByMTDUser?.problemsOfBM,
            "maintenanceReportFilledByMTD.whyAnalysis.why1":
              requestSheetDataFilledByMTDUser?.why1,
            "maintenanceReportFilledByMTD.whyAnalysis.why2":
              requestSheetDataFilledByMTDUser?.why2,
            "maintenanceReportFilledByMTD.whyAnalysis.why3":
              requestSheetDataFilledByMTDUser?.why3,
            "maintenanceReportFilledByMTD.whyAnalysis.why4":
              requestSheetDataFilledByMTDUser?.why4,
            "maintenanceReportFilledByMTD.whyAnalysis.why5":
              requestSheetDataFilledByMTDUser?.why5,
            "maintenanceReportFilledByMTD.breakDownTime": parseInt(
              requestSheetDataFilledByMTDUser?.breakDownTime
            ),
            "maintenanceReportFilledByMTD.maintenanceTime": parseInt(
              requestSheetDataFilledByMTDUser?.maintenanceTime
            ),
            "maintenanceReportFilledByMTD.qualityCheckTime": parseInt(
              requestSheetDataFilledByMTDUser?.qualityCheckTime
            ),
            "maintenanceReportFilledByMTD.breakTime": parseInt(
              requestSheetDataFilledByMTDUser?.breakTime
            ),
            "maintenanceReportFilledByMTD.minorBD":
              requestSheetDataFilledByMTDUser?.minorBD,
            "maintenanceReportFilledByMTD.majorBD":
              requestSheetDataFilledByMTDUser?.majorBD,
            "maintenanceReportFilledByMTD.firstTime":
              requestSheetDataFilledByMTDUser?.firstTime,
            "maintenanceReportFilledByMTD.repeat":
              requestSheetDataFilledByMTDUser?.repeat,
            sparePartUsedOrNot:
              requestSheetDataFilledByMTDUser?.changedParts?.length > 0
                ? true
                : false,
            changedParts: requestSheetDataFilledByMTDUser?.changedParts,
            feedbackMTD_HOS: requestSheetDataFilledByMTDUser?.feedbackMTD_HOS,
            qualityConfirmed: requestSheetDataFilledByMTDUser?.qualityConfirmed,
            partQualityCheckedByMTD:
              requestSheetDataFilledByMTDUser?.partQualityCheckedByMTD,
            partQualityCheckedByPRD:
              requestSheetDataFilledByMTDUser?.partQualityCheckedByPRD,
            requestSheetStatus: "Fill Sheet",
            actionTemporaryOrNot:
              requestSheetDataFilledByMTDUser?.actionTemporaryOrNot,
            dataSheetOfRequestSheet:
              requestSheetDataFilledByMTDUser?.dataSheetOfRequestSheet,
            attachedDataSheets: dataSheet?.attachedDataSheets?.[0]?.filename,
            drawingOfRequestSheet:
              requestSheetDataFilledByMTDUser?.drawingOfRequestSheet,
            supportingTM: requestSheetDataFilledByMTDUser?.supportingTM,
            categoriesOfRequestSheet: convertedData,
          };

          requestSheet = await RequestSheetOfBM.findOneAndUpdate(
            { requestSheetNoOfBM: req.query.reqId },
            {
              $set: queryObj,
              $push: {
                attachedDrawings: dataSheet?.attachedDrawings?.map(
                  (obj) => obj?.filename
                ),
              },
            },
            {
              new: true,
            }
          );
          res.status(201).json({
            message: "Request-sheet updated successfully",
            requestSheet,
          });
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
            // requestSheetdate,
            // requestSheettime,
            // sheetIssuedDate,
            // sheetIssuedTime,
            problemOccurredDateAndTimeOfBM,
            sheetIssuedDateAndTimeOfBM,
            maintenanceType,
            priorityCode,
            qualityRelated,
            shiftOfBM,
          } = req.body;

          let requestSheetNos = machine.line_names.requestSheetNos + 1 || 1;

          let increaseCountOfRequestSheetInLine = await Line.findOneAndUpdate(
            { _id: machine.line_names._id },
            // { $set: { $inc: { requestSheetNos: 1 } } },
            { $set: { requestSheetNos } },
            { new: true }
          );

          const requestSheetNoOfBM =
            machine?.line_names?.cell_names?.subSection_names?.section_names
              ?.dashboardLevel === "Yes"
              ? `${(machine?.line_names?.cell_names?.subSection_names?.section_names?.section_name)
                  .substring(0, 2)
                  .toUpperCase()}_${machine?.line_names?.line_name}_${
                  moment().tz("Asia/Kolkata").month() + 1
                }_${increaseCountOfRequestSheetInLine?.requestSheetNos}`.trim()
              : `${(machine?.line_names?.cell_names?.subSection_names?.subSection_name)
                  .substring(0, 2)
                  .toUpperCase()}_${machine?.line_names?.line_name}_${
                  moment().tz("Asia/Kolkata").month() + 1
                }_${increaseCountOfRequestSheetInLine?.requestSheetNos}`.trim();

          requestSheet = new RequestSheetOfBM({
            ...req.query,
            ..._idObject,
            ...req.body,
            requestSheetNoOfBM,
            requestSheetCreatedBy: req.rootUser._id,
            priorityCode: priorityCode,
            qualityRelated: qualityRelated,
            shiftOfBM: shiftOfBM,
            // breakDownAttendedBy: req.rootUser._id,
            maintenanceType: maintenanceType || "BM",
            problemOccurredDateAndTimeOfBM,
            sheetIssuedDateAndTimeOfBM: new Date(),
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
            preAggregationTimeStampOfRequestSheet: {
              requestSheet_year: currentYear,
              requestSheet_month: currentMonth,
            },
          });

          await requestSheet.save();
          res.status(201).json({
            message: "Request-sheet generated successfully",
            requestSheet,
          });
        }
      } else {
        res.status(404).json({ message: "Request-sheet not generated" });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error?.message, error });
    }
  }
);

const findRequestSheetMiddleware = async (req, res, next) => {
  try {
    let queryObj = {};

    if (req.query._id) {
      queryObj = {
        _id: mongoose.Types.ObjectId(req.query._id),
      };
    }

    const requestSheetData = await RequestSheetOfBM.aggregate([
      {
        $match: queryObj,
      },
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
          localField: "assignUser",
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
        $lookup: {
          from: "users",
          localField: "handOverUser",
          foreignField: "_id",
          as: "handoverUserDetails",
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
          assignUser: {
            $arrayElemAt: ["$namesOperators.tm_name", 0],
          },
          assignUserId: {
            $arrayElemAt: ["$namesOperators._id", 0],
          },
          handOverUser: {
            $arrayElemAt: ["$handoverUserDetails.tm_name", 0],
          },
          handOverTime: {
            $dateToString: {
              format: "%Y-%m-%d %H:%M",
              date: "$maintenanceReportFilledByMTD.workEndedDateOfBM",
              timezone: "Asia/Kolkata",
            },
          },
          work_order_status: 1,
          requestSheetStatus: 1,
          MTDUser: { $arrayElemAt: ["$namesMTD.tm_name", 0] },
          problem: "$breakDownBasicDataFilledByPRD.problemFaced",
          // problemOccurredDateAndTimeOfBM:
          problemOccurredDateAndTimeOfBM: {
            $dateToString: {
              format: "%Y-%m-%d %H:%M",
              date: "$problemOccurredDateAndTimeOfBM",
              timezone: "Asia/Kolkata",
            },
          },
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

    req.requestSheetData = requestSheetData;
    next();
  } catch (error) {
    res.status(500).json({ message: error?.message, error: new Error(error) });
  }
};
router.patch(
  "/updateRequestSheet",
  async (req, res, next) => {
    try {
      // ____________ 1 ____________

      // if (mongoose.Types.ObjectId.isValid(req.body?.Operator)) {
      //   queryObj = {
      //     ...queryObj,
      //     assignOperator: req.body?.Operator,
      //   };
      // }

      // if (
      //   req.rootUser?.tm_department === "PRD" &&
      //   req.rootUser?.user_type === "TL/HOSS"
      // ) {
      //   if (req.body?.PRDUser === "Yes" || req.body?.PRDUser === "No") {
      //     queryObj = {
      //       ...queryObj,
      //       partQualityStatusOfPRD: req.body?.PRDUser,
      //       "maintenanceReportFilledByMTD.partQualityCheckedByPRD":
      //         req.rootUser?._id,
      //     };
      //   }

      //   if (mongoose.Types.ObjectId.isValid(req.body?.MTDUser)) {
      //     queryObj = {
      //       ...queryObj,
      //       partQualityCheckedByMTD: req.body?.MTDUser,
      //     };
      //   }

      //   queryObj = {
      //     ...queryObj,
      //     finalActivity: req.body?.finalActivity,
      //     workEndedDateOfBM: new Date(req.body?.problemOccurredDateAndTimeOfBM),
      //     statusPRD_TL: req.body?.statusPRD_TL,
      //   };
      // }

      // const requestSheet = await RequestSheetOfBM.findOneAndUpdate(
      //   req.query,
      //   {
      //     $set: queryObj,
      //   },
      //   {
      //     new: true,
      //   }
      // );

      // ____________ 2 ____________

      // let queryObj = {};

      // const isRequestSheetExist = await RequestSheetOfBM.findOne(req.query);

      // if (!isRequestSheetExist) {
      //   return res.status(400).json({ message: "Request-sheet not exist" });
      // }

      // if (
      //   req.rootUser?.tm_department === "MTD" &&
      //   req.rootUser?.user_type === "TL/HOSS"
      // ) {
      //   if (isRequestSheetExist?.requestSheetStatus === statusArray[0]) {
      //     queryObj = {
      //       assignOperator: req.body?.Operator,
      //       requestSheetStatus: statusArray[1],
      //     };
      //   }

      //   if (isRequestSheetExist?.requestSheetStatus === statusArray[3]) {
      //     queryObj = {
      //       requestSheetStatus: statusArray[4],
      //     };
      //   }
      // }

      // if (
      //   req.rootUser?.tm_department === "PRD" &&
      //   req.rootUser?.user_type === "TL/HOSS"
      // ) {
      //   if (isRequestSheetExist?.requestSheetStatus === statusArray[1]) {
      //     queryObj = {
      //       finalActivity: req.body?.finalActivity,
      //       workEndedDateOfBM: new Date(req.body?.problemOccurredDateAndTimeOfBM),
      //       requestSheetStatus: statusArray[2],
      //     };
      //   }

      //   if (isRequestSheetExist?.requestSheetStatus === statusArray[2]) {
      //     if (req.body?.PRDUser === "Yes" || req.body?.PRDUser === "No") {
      //       queryObj = {
      //         partQualityStatusOfPRD: req.body?.PRDUser,
      //         "maintenanceReportFilledByMTD.partQualityCheckedByPRD":
      //           req.rootUser?._id,
      //       };
      //     }

      //     if (mongoose.Types.ObjectId.isValid(req.body?.MTDUser)) {
      //       queryObj = {
      //         ...queryObj,
      //         partQualityCheckedByMTD: req.body?.MTDUser,
      //       };
      //     }

      //     queryObj = {
      //       ...queryObj,
      //       statusPRD_TL: req.body?.statusPRD_TL,
      //       requestSheetStatus: statusArray[3],
      //     };
      //   }
      // }

      // const requestSheet = await RequestSheetOfBM.findOneAndUpdate(
      //   req.query,
      //   {
      //     $set: queryObj,
      //   },
      //   {
      //     new: true,
      //   }
      // );

      // ____________ 3 ____________

      // let queryObj = {};

      // if (req.rootUser?.tm_department === "MTD") {
      //   queryObj = {
      //     finalActivity: req.body?.finalActivity,
      //     "maintenanceReportFilledByMTD.workEndedDateOfBM": new Date(
      //       req.body?.handOverTime
      //     ),
      //     "maintenanceReportFilledByMTD.refHandOverTime": new Date(
      //       req.body?.handOverTime
      //     ),
      //   };

      //   if (mongoose.Types.ObjectId.isValid(req.body?.assignUser)) {
      //     queryObj = {
      //       ...queryObj,
      //       assignUser: req.body?.assignUser,
      //     };
      //   }

      //   if (mongoose.Types.ObjectId.isValid(req.body?.MTDUser?.[0]?._id)) {
      //     queryObj = {
      //       ...queryObj,
      //       partQualityCheckedByMTD: req.body?.MTDUser?.map(
      //         (item) => item?._id
      //       ),
      //       partQualityDateAndTimeOfMTD: new Date(),
      //     };
      //   }
      // } else if (req.rootUser?.tm_department === "PRD") {
      //   queryObj = {
      //     statusPRD_TL: req.body?.statusPRD_TL,
      //   };
      //   if (mongoose.Types.ObjectId.isValid(req.body?.PRDUser)) {
      //     queryObj = {
      //       ...queryObj,
      //       partQualityCheckedByPRD: req.body?.PRDUser,
      //       partQualityDateAndTimeOfPRD: new Date(),
      //     };
      //   }
      // }

      // await RequestSheetOfBM.findOneAndUpdate(
      //   req.query,
      //   {
      //     $set: queryObj,
      //   },
      //   {
      //     new: true,
      //   }
      // );

      // next();

      // ____________ 4 ____________

      // let queryObj = {};

      // if (req.rootUser?.tm_department !== "MTD") {
      //   return res.status(401).json({
      //     message: "You are not valid user",
      //   });
      // }

      // const isRequestSheetExist = await RequestSheetOfBM.findOne(req.query);

      // if (!isRequestSheetExist) {
      //   return res.status(400).json({ message: "Request-sheet not exist" });
      // }

      // if (isRequestSheetExist?.requestSheetStatus === statusArray[0]) {
      //   // if (mongoose.Types.ObjectId.isValid(req.body?.assignUser)) {
      //   // }
      //   queryObj = {
      //     ...queryObj,
      //     assignUser: req.body?.assignUser,
      //     requestSheetStatus: statusArray[1],
      //   };
      // } else if (
      //   [
      //     statusArray[1],
      //     statusArray[2],
      //     statusArray[3],
      //     statusArray[4],
      //   ].includes(isRequestSheetExist?.requestSheetStatus)
      //   // isRequestSheetExist?.requestSheetStatus === statusArray[1]
      // ) {
      //   let requestSheetStatus = "";
      //   if (req.body?.work_order_status === "Open") {
      //     requestSheetStatus = statusArray[2];
      //   } else if (req.body?.work_order_status === "Pending") {
      //     requestSheetStatus = statusArray[3];
      //   } else {
      //     requestSheetStatus = statusArray[4];
      //   }

      //   queryObj = {
      //     finalActivity: req.body?.finalActivity,
      //     "maintenanceReportFilledByMTD.workEndedDateOfBM": new Date(
      //       req.body?.handOverTime
      //     ),
      //     "maintenanceReportFilledByMTD.refHandOverTime": new Date(
      //       req.body?.handOverTime
      //     ),
      //     requestSheetStatus,
      //     work_order_status: req.body?.work_order_status,
      //   };
      // }

      // await RequestSheetOfBM.findOneAndUpdate(
      //   req.query,
      //   {
      //     $set: queryObj,
      //   },
      //   {
      //     new: true,
      //   }
      // );
      // next();

      // ____________ 5 ____________

      let queryObj = {};

      if (req.rootUser?.tm_department !== "MTD") {
        return res.status(401).json({
          message: "You are not valid user",
        });
      }

      const isRequestSheetExist = await RequestSheetOfBM.findOne(req.query);

      if (!isRequestSheetExist) {
        return res.status(400).json({ message: "Request-sheet not exist" });
      }

      if (isRequestSheetExist?.requestSheetStatus === statusArray[0]) {
        // if (mongoose.Types.ObjectId.isValid(req.body?.assignUser)) {
        //   queryObj = {
        //     assignUser: req.body?.assignUser,
        //   };
        // }
        // if (mongoose.Types.ObjectId.isValid(req.body?.handOverUser)) {
        //   queryObj = {
        //     ...queryObj,
        //     handOverUser: req.body?.handOverUser,
        //   };
        // }
        queryObj = {
          ...queryObj,
          assignUser: req.body?.assignUser,
          handOverUser: req.body?.handOverUser,
          requestSheetStatus: statusArray[1],
        };
      } else if (
        [
          statusArray[1],
          statusArray[2],
          statusArray[3],
          statusArray[4],
        ].includes(isRequestSheetExist?.requestSheetStatus)
        // isRequestSheetExist?.requestSheetStatus === statusArray[1]
      ) {
        let requestSheetStatus = "";
        if (req.body?.work_order_status === "Open") {
          requestSheetStatus = statusArray[2];
        } else if (req.body?.work_order_status === "Pending") {
          requestSheetStatus = statusArray[3];
        } else {
          requestSheetStatus = statusArray[4];
        }

        queryObj = {
          finalActivity: req.body?.finalActivity,
          "maintenanceReportFilledByMTD.workEndedDateOfBM": new Date(
            req.body?.handOverTime
          ),
          "maintenanceReportFilledByMTD.refHandOverTime": new Date(
            req.body?.handOverTime
          ),
          requestSheetStatus,
          work_order_status: req.body?.work_order_status,
        };
      }
      await RequestSheetOfBM.findOneAndUpdate(
        req.query,
        {
          $set: queryObj,
        },
        {
          new: true,
        }
      );
      next();
    } catch (error) {
      res
        .status(500)
        .json({ message: error?.message, error: new Error(error) });
    }
  },
  findRequestSheetMiddleware,
  (req, res, next) => {
    res.status(201).json({
      message: "Request-sheet updated successfully",
      requestSheet: req.requestSheetData?.[0],
    });
  }
);

router.get(
  "/getRequestSheetData",
  findRequestSheetMiddleware,
  async (req, res, next) => {
    try {
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

      let TLHOSS_and_TM_user_list = [];
      if (
        (req?.rootUser?.tm_department === "MTD" && !req.purpose) ||
        req?.rootUser?.user_type === "Operator"
      ) {
        TLHOSS_and_TM_user_list = await User.find(
          {
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
            plant_data: req?.rootUser?.plant_data,
          },
          {
            tm_name: 1,
            tm_department: 1,
            tm_grade: 1,
            user_type: 1,
          }
        );
      }

      res.status(201).json({
        message: "Request-sheet data get successfully",
        requestSheetData: req.requestSheetData,
        TLHOSS_and_TM_user_list,
        counters: {
          ...counters?.[0],
          total_request_sheet_count: req.requestSheetData?.length,
        },
      });
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  }
);

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

const filterMiddleware = async (req, res, next) => {
  try {
    let queryObj = {};

    if (req.query?.selectedYear) {
      queryObj = {
        "preAggregationTimeStampOfRequestSheet.requestSheet_year":
          req.query?.selectedYear,
      };
    }

    if (req.query?.selectedMonth) {
      queryObj = {
        ...queryObj,
        "preAggregationTimeStampOfRequestSheet.requestSheet_month":
          req.query?.selectedMonth,
      };
    }

    if (req.params?.filter === "based-on-section") {
      queryObj = {
        ...queryObj,
        sectionRef: mongoose.Types.ObjectId(req.params?.selectedId),
      };
    } else if (req.params?.filter === "based-on-subSection") {
      queryObj = {
        ...queryObj,
        subSectionRef: mongoose.Types.ObjectId(req.params?.selectedId),
      };
    } else if (req.params?.filter === "based-on-cell") {
      queryObj = {
        ...queryObj,
        cellRef: mongoose.Types.ObjectId(req.params?.selectedId),
        // "maintenanceReportFilledByMTD.workEndedDateOfBM": { $ne: null },
      };
    } else {
      queryObj = {
        ...queryObj,
        lineRef: mongoose.Types.ObjectId(req.params?.selectedId),
        // "maintenanceReportFilledByMTD.workEndedDateOfBM": { $ne: null },
      };
    }

    req.queryObj = queryObj;
    next();
  } catch (error) {
    res.status(500).json({ message: error?.message, error });
  }
};

const middlewareForGettingAllDropdownList = async (req, res, next) => {
  try {
    if (Object.keys(req.query)?.length !== 0) {
      return next();
    }

    const section = await Section.findOne({
      section_id: req?.rootUser?.section_data?.split("-")?.[0],
    });

    req.section = section;

    if (section.dashboardLevel === "No") {
      const subSectionsData = await SubSection.find({
        subSection_id: {
          $in: req.rootUser?.subSection_data?.map(
            (item) => item?.split("-")?.[0]
          ),
        },
      });

      req.subSectionsData = subSectionsData;
    } else {
      const subSectionsData = await SubSection.find({
        section_names: section?._id,
      });

      // console.log(subSectionsData)
      const cellData = await Cell.find({
        subSection_names: { $in: subSectionsData },
      }).sort({ cell_sequence: 1 });
      req.cellData = cellData;
    }

    // const cellData = await Cell.find({
    //   subSection_names: { $in: subSectionsData },
    // }).sort({ cell_sequence: 1 });

    // const lineData = await Line.find({
    //   line_names: { $in: cellData },
    // }).sort({ line_sequence: 1 });
    // req.lineData = lineData;

    next();
  } catch (error) {
    res.status(500).json({ message: error?.message, error });
  }
};

const queryObjectMiddlewareFunction = async (req, res, next) => {
  try {
    let queryObj = {
      sectionRef: req.section?._id,
    };

    if (req.query?.subSectionRef) {
      queryObj = {
        subSectionRef: mongoose.Types.ObjectId(req.query?.subSectionRef),
      };

      const cellData = await Cell.find({
        subSection_names: mongoose.Types.ObjectId(req.query?.subSectionRef),
      }).sort({ cell_sequence: 1 });

      req.cellData = cellData;
    } else if (req.query?.cellRef) {
      queryObj = {
        cellRef: mongoose.Types.ObjectId(req.query?.cellRef),
      };

      const lineData = await Line.find({
        cell_names: mongoose.Types.ObjectId(req.query?.cellRef),
      }).sort({ line_sequence: 1 });

      req.lineData = lineData;
    } else if (req.query?.lineRef) {
      queryObj = {
        lineRef: mongoose.Types.ObjectId(req.query?.lineRef),
      };
    }

    req.queryObj = queryObj;

    next();
  } catch (error) {
    res.status(500).json({ message: error?.message, error });
  }
};

// ---------------- not using this API
router.get(
  "/getRequestSheetMonitoringData",
  middlewareForGettingAllDropdownList,
  queryObjectMiddlewareFunction,
  async (req, res, next) => {
    const functionForQueryObject = (status) => ({
      $sum: {
        $cond: [{ $eq: ["$requestSheetStatus", status] }, 1, 0],
      },
    });
    try {
      const allStatusCounterForGraph = await RequestSheetOfBM.aggregate([
        {
          $match: req.queryObj,
        },
        {
          $facet: {
            counterByStatus: [
              {
                $group: {
                  _id: "$requestSheetStatus",
                  count: { $sum: 1 },
                },
              },
              {
                $project: {
                  _id: 0,
                  label: "$_id",
                  // backgroundColor: {
                  //   $cond: [
                  //     { $eq: ["$_id", "Work Order Closed"] },
                  //     "green",
                  //     "red",
                  //   ],
                  // },
                  data: {
                    $cond: [
                      { $ne: ["$_id", statusArray[0]] },
                      {
                        $cond: [
                          { $eq: ["$_id", "Completed"] },
                          [0, 0, "$count"],
                          [0, "$count"],
                        ],
                      },
                      "$$REMOVE",
                    ],
                  },
                },
              },
            ],
            totalGenerated: [
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },
                },
              },
              {
                $project: {
                  _id: 0,
                  label: "Generated",
                  data: ["$count"],
                },
              },
            ],
          },
        },
        {
          $project: {
            datasets: {
              $concatArrays: ["$totalGenerated", "$counterByStatus"],
            },
          },
        },
        {
          $unwind: "$datasets",
        },
        {
          $replaceRoot: { newRoot: "$datasets" },
        },

        // {
        //   $group: {
        //     _id: "$requestSheetStatus",
        //     count: { $sum: 1 },
        //   },
        // },
        // {
        //   $project: {
        //     _id: 0,
        //     label: "$_id",
        //     data: {
        //       $cond: [
        //         { $eq: ["$_id", statusArray[0]] },
        //         ["$count"],
        //         {
        //           $cond: [
        //             { $eq: ["$_id", "Completed"] },
        //             [0, 0, "$count"],
        //             [0, "$count"],
        //           ],
        //         },
        //       ],
        //     },
        //   },
        // },

        // {
        //   $group: {
        //     _id: null,
        //     total_generated: {
        //       $sum: {
        //         $cond: [{ $gt: ["$requestSheetStatus", null] }, 1, 0],
        //       },
        //     }, // "Generated",
        //     total_assigned: functionForQueryObject(statusArray[1]), // "Assigned",
        //     total_work_order_open: functionForQueryObject(statusArray[2]), // "Work Order Open",
        //     total_work_order_pending: functionForQueryObject(statusArray[3]), // "Work Order Pending",
        //     total_work_order_closed: functionForQueryObject(statusArray[4]), // "Work Order Closed",
        //     // "Fill Sheet",
        //     // "Under MTD TL approval",
        //     // "Under MTD HOSS approval",
        //     // "Under MTD HOS approval",
        //   },
        // },
        // {
        //   $project: {
        //     _id: 0,
        //   },
        // },
      ]);

      // Array.from({ length: 12 }, (_, monthIndex) => ({
      //   monthName: moment().month(monthIndex).format("MMMM"),
      //   monthInDecimal: `${monthIndex + 1}`,
      // }));

      let queryPipelineObj = [
        {
          $group: {
            _id: null,
            array: { $push: "$$ROOT" },
          },
        },
        {
          $project: {
            _id: 0,
            array: {
              $map: {
                input: allMonths,
                as: "month",
                in: {
                  $cond: [
                    { $in: ["$$month.monthInDecimal", "$array._id"] },
                    {
                      month: "$$month.monthName",
                      value: {
                        $arrayElemAt: [
                          "$array.value",
                          {
                            $indexOfArray: [
                              "$array._id",
                              "$$month.monthInDecimal",
                            ],
                          },
                        ],
                      },
                    },
                    {
                      month: "$$month.monthName",
                      value: "",
                    },
                  ],
                },
              },
            },
          },
        },
        { $unwind: "$array" },
        {
          $replaceRoot: { newRoot: "$array" },
        },
      ];

      const generatedAndCompletedStatusMonthlyData =
        await RequestSheetOfBM.aggregate([
          {
            $match: req.queryObj,
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%m",
                  date: "$problemOccurredDateAndTimeOfBM",
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

      // const userBasedApprovalPending = await RequestSheetOfBM.aggregate([
      //   {
      //     $lookup: {
      //       from: "users",
      //       localField: "approvalOfMTD_TL",
      //       foreignField: "_id",
      //       pipeline: [
      //         {
      //           $project: {
      //             tm_name: 1,
      //           },
      //         },
      //       ],
      //       as: "userMTD_TL",
      //     },
      //   },
      //   {
      //     $unwind: "$userMTD_TL",
      //   },
      //   {
      //     $group: {
      //       _id: {
      //         month: { $month: "$sheetIssuedDateAndTimeOfBM" },
      //         tm_name: "$userMTD_TL.tm_name",
      //         // id: "$userMTD_TL._id",
      //       },
      //       count: {
      //         $sum: 1,
      //       },
      //     },
      //   },
      //   {
      //     $group: {
      //       _id: {
      //         tm_name: "$_id.tm_name",
      //       },
      //       data: {
      //         $push: {
      //           month: "$_id.month",
      //           count: "$count",
      //         },
      //       },
      //     },
      //   },
      // ]);

      let pendingApprovalCountQuery = [
        {
          $match: {
            status: "Pending",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "pendingApprovalUser",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  tm_name: 1,
                  user_type: 1,
                },
              },
            ],
            as: "userDetails",
          },
        },
        {
          $unwind: "$userDetails",
        },
        {
          $group: {
            _id: {
              month: { $month: "$timeStampOfPendingApproval" },
              tm_name: "$userDetails.tm_name",
              userType: "$userDetails.user_type",
            },
            count: {
              $sum: 1,
            },
          },
        },
        {
          $group: {
            _id: {
              tm_name: "$_id.tm_name",
              userType: "$_id.userType",
            },
            data: {
              $push: {
                month: { $toString: "$_id.month" },
                count: "$count",
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            tm_name: "$_id.tm_name",
            userType: "$_id.userType",
            data: {
              $map: {
                input: allMonths,
                as: "month",
                in: {
                  $cond: [
                    { $in: ["$$month.monthInDecimal", "$data.month"] },
                    {
                      month: "$$month.monthName",
                      pending: {
                        $arrayElemAt: [
                          "$data.count",
                          {
                            $indexOfArray: [
                              "$data.month",
                              "$$month.monthInDecimal",
                            ],
                          },
                        ],
                      },
                    },
                    {
                      month: "$$month.monthName",
                      pending: 0,
                    },
                  ],
                },
              },
            },
          },
        },
      ];

      const pendingApprovalCountMTD_TL_HOSS = await RequestSheetOfBM.aggregate([
        {
          $project: {
            pendingApprovalUser: { $arrayElemAt: ["$approvalOfMTD_TL", -1] },
            timeStampOfPendingApproval: {
              $arrayElemAt: ["$approvalDateAndTimeOfMTD_TL", -1],
            },
            status: {
              $arrayElemAt: ["$approvalStatusOfMTD_TL", -1],
            },
          },
        },
        ...pendingApprovalCountQuery,

        // {
        //   $group: {
        //     _id: {
        //       userType: "$_id.userType",
        //     },
        //     rowSpan: { $sum: 1 },
        //     overAllData: {
        //       $push: {
        //         tm_name: "$_id.tm_name",
        //         data: "$data",
        //       },
        //     },
        //   },
        // },

        // {
        //   $facet: {
        //     pendingApprovalOfMTD_TL_HOSS: [
        //       {
        //         $group: {
        //           _id: {
        //             month: { $month: "$sheetIssuedDateAndTimeOfBM" },
        //             tm_name: "$userMTD_TL.tm_name",
        //             userType: "$userMTD_TL.user_type",
        //           },
        //           count: {
        //             $sum: 1,
        //           },
        //         },
        //       },
        //       {
        //         $group: {
        //           _id: {
        //             tm_name: "$_id.tm_name",
        //             userType: "$_id.userType",
        //           },
        //           data: {
        //             $push: {
        //               month: "$_id.month",
        //               count: "$count",
        //             },
        //           },
        //         },
        //       },
        //     ],
        //   },
        // },
      ]);

      const pendingApprovalCountMTD_HOS = await RequestSheetOfBM.aggregate([
        {
          $project: {
            pendingApprovalUser: { $arrayElemAt: ["$approvalOfMTD_HOS", -1] },
            timeStampOfPendingApproval: {
              $arrayElemAt: ["$approvalDateAndTimeOfMTD_HOS", -1],
            },
            status: {
              $arrayElemAt: ["$approvalStatusOfMTD_HOS", -1],
            },
          },
        },
        ...pendingApprovalCountQuery,
      ]);

      const users = await User.aggregate([
        {
          $match: {
            section_data: req.rootUser?.section_data,
          },
        },
        {
          $lookup: {
            from: "requestsheetofbms",
            localField: "_id",
            foreignField: "approvalOfMTD_TL",
            pipeline: [
              {
                $project: {
                  pendingApprovalUser: {
                    $arrayElemAt: ["$approvalOfMTD_TL", -1],
                  },
                  timeStampOfPendingApproval: {
                    $arrayElemAt: ["$approvalDateAndTimeOfMTD_TL", -1],
                  },
                  status: {
                    $arrayElemAt: ["$approvalStatusOfMTD_TL", -1],
                  },
                },
              },
              {
                $match: {
                  status: "Pending",
                },
              },
            ],
            as: "requestSheetDetails",
          },
        },
        {
          $project: {
            tm_name: 1,
            requestSheetDetails: 1,
          },
        },
      ]);

      return res.status(201).json({
        message: "Monitoring request-sheet data get successfully",

        users,

        userBasedApprovalPending: {
          pendingApprovalCountMTD_TL_HOSS,
          pendingApprovalCountMTD_HOS,
        },
        allStatusCounterForGraph,
        section: req.section,
        subSectionsData: req.subSectionsData,
        cellData: req.cellData,
        lineData: req.lineData,
        allMonths,
        generatedAndCompletedStatusMonthlyData:
          generatedAndCompletedStatusMonthlyData?.[0],
      });
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/getRequestSheetMonitoringData/status-chart-data/:filter/:selectedId",
  filterMiddleware,
  async (req, res, next) => {
    try {
      const allStatusCounterForGraph = await RequestSheetOfBM.aggregate([
        {
          $match: {
            ...req.queryObj,
            $expr: {
              $ne: ["$requestSheetStatus", "Generated"],
            },
          },
        },
        {
          $group: {
            _id: "$requestSheetStatus",
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            label: "$_id",
            // data: [0, "$count"],
            data: {
              $cond: [
                { $eq: ["$_id", "Completed"] },
                [0, 0, "$count"],
                [0, "$count"],
              ],
            },
          },
        },
      ]);

      const generatedStatusCount = await RequestSheetOfBM.aggregate([
        {
          $match: req.queryObj,
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
          },
        },
      ]);
      return res.status(201).json({
        message: "Monitoring request-sheet chart data get successfully",
        allStatusCounterForGraph: [
          {
            label: "Generated",
            data: [generatedStatusCount?.[0]?.count],
          },
          ...allStatusCounterForGraph,
        ],
      });
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/getRequestSheetMonitoringData/generated-and-completed-count/:filter/:selectedId",
  filterMiddleware,
  async (req, res, next) => {
    try {
      let queryPipeline = [
        {
          $group: {
            _id: "$preAggregationTimeStampOfRequestSheet.requestSheet_month",
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: null,
            array: { $push: "$$ROOT" },
          },
        },
        {
          $project: {
            _id: 0,
            countArray: {
              $map: {
                input: allMonths,
                as: "month",
                in: {
                  $cond: [
                    { $in: ["$$month.monthName", "$array._id"] },
                    {
                      $arrayElemAt: [
                        "$array.count",
                        {
                          $indexOfArray: ["$array._id", "$$month.monthName"],
                        },
                      ],
                    },
                    0,
                  ],
                },
              },
            },
          },
        },
      ];

      const completedStatusMonthlyData = await RequestSheetOfBM.aggregate([
        {
          $match: {
            ...req.queryObj,
            $expr: {
              $eq: ["$requestSheetStatus", "Completed"],
            },
          },
        },
        ...queryPipeline,
      ]);

      const generatedStatusMonthlyData = await RequestSheetOfBM.aggregate([
        {
          $match: req.queryObj,
        },
        ...queryPipeline,
      ]);

      let arr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

      return res.status(201).json({
        message:
          "Monitoring request-sheet monthly-counter data get successfully",
        generatedAndCompletedStatusMonthlyData: [
          {
            label: "Generated",
            data: generatedStatusMonthlyData?.[0]?.countArray || arr,
          },
          {
            label: "Completed",
            data: completedStatusMonthlyData?.[0]?.countArray || arr,
          },
        ],
      });
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/getRequestSheetMonitoringData/user-wise-pending-count/:filter/:selectedId",
  filterMiddleware,
  async (req, res, next) => {
    try {
      const UserWisePendingApprovalCount = await RequestSheetOfBM.aggregate([
        {
          $match: req.queryObj,
        },
        {
          $project: {
            preAggregationTimeStampOfRequestSheet: 1,
            userWithStatusInfo: [
              {
                userType: "MTD TL",
                userId: { $arrayElemAt: ["$approvalOfMTD_TL", -1] },
                userName: { $arrayElemAt: ["$approverNameLogOfMTD_TL", -1] },
                timeStamp: {
                  $arrayElemAt: ["$approvalDateAndTimeOfMTD_TL", -1],
                },
                status: {
                  $arrayElemAt: ["$approvalStatusOfMTD_TL", -1],
                },
              },
              {
                userType: "MTD HOSS",
                userId: { $arrayElemAt: ["$approvalOfMTD_HOSS", -1] },
                userName: { $arrayElemAt: ["$approverNameLogOfMTD_HOSS", -1] },
                timeStamp: {
                  $arrayElemAt: ["$approvalDateAndTimeOfMTD_HOSS", -1],
                },
                status: {
                  $arrayElemAt: ["$approvalStatusOfMTD_HOSS", -1],
                },
              },
              {
                userType: "MTD HOS",
                userId: { $arrayElemAt: ["$approvalOfMTD_HOS", -1] },
                userName: { $arrayElemAt: ["$approverNameLogOfMTD_HOS", -1] },
                timeStamp: {
                  $arrayElemAt: ["$approvalDateAndTimeOfMTD_HOS", -1],
                },
                status: {
                  $arrayElemAt: ["$approvalStatusOfMTD_HOS", -1],
                },
              },
              {
                userType: "PRD TL",
                userId: { $arrayElemAt: ["$approvalOfPRD_TL", -1] },
                userName: { $arrayElemAt: ["$approverNameLogOfPRD_TL", -1] },
                timeStamp: {
                  $arrayElemAt: ["$approvalDateAndTimeOfPRD_TL", -1],
                },
                status: {
                  $arrayElemAt: ["$approvalStatusOfPRD_TL", -1],
                },
              },
              {
                userType: "PRD HOS",
                userId: { $arrayElemAt: ["$approvalOfPRD_HOS", -1] },
                userName: { $arrayElemAt: ["$approverNameLogOfPRD_HOS", -1] },
                timeStamp: {
                  $arrayElemAt: ["$approvalDateAndTimeOfPRD_HOS", -1],
                },
                status: {
                  $arrayElemAt: ["$approvalStatusOfPRD_HOS", -1],
                },
              },
              {
                userType: "PRD HOD",
                userId: { $arrayElemAt: ["$approvalOfPRD_HOD", -1] },
                userName: { $arrayElemAt: ["$approverNameLogOfPRD_HOD", -1] },
                timeStamp: {
                  $arrayElemAt: ["$approvalDateAndTimeOfPRD_HOD", -1],
                },
                status: {
                  $arrayElemAt: ["$approvalStatusOfPRD_HOD", -1],
                },
              },
              {
                userType: "MTD HOD",
                userId: { $arrayElemAt: ["$approvalOfMTD_HOD", -1] },
                userName: { $arrayElemAt: ["$approverNameLogOfMTD_HOD", -1] },
                timeStamp: {
                  $arrayElemAt: ["$approvalDateAndTimeOfMTD_HOD", -1],
                },
                status: {
                  $arrayElemAt: ["$approvalStatusOfMTD_HOD", -1],
                },
              },
            ],
          },
        },
        {
          $unwind: "$userWithStatusInfo",
        },
        {
          $match: {
            "userWithStatusInfo.status": "Pending",
          },
        },
        {
          $group: {
            _id: {
              month:
                "$preAggregationTimeStampOfRequestSheet.requestSheet_month",
              userId: "$userWithStatusInfo.userId",
              userName: "$userWithStatusInfo.userName",
              userType: "$userWithStatusInfo.userType",
            },
            count: {
              $sum: 1,
            },
          },
        },
        {
          $group: {
            _id: {
              userId: "$_id.userId",
              userName: "$_id.userName",
              userType: "$_id.userType",
            },
            array: {
              $push: {
                month: { $toString: "$_id.month" },
                count: "$count",
              },
            },
          },
        },
        {
          $project: {
            array: {
              $map: {
                input: allMonths,
                as: "month",
                in: {
                  $cond: [
                    { $in: ["$$month.monthName", "$array.month"] },
                    {
                      $arrayElemAt: [
                        "$array",
                        {
                          $indexOfArray: ["$array.month", "$$month.monthName"],
                        },
                      ],
                    },
                    {
                      month: "$$month.monthName",
                      count: 0,
                    },
                  ],
                },
              },
            },
          },
        },
        {
          $group: {
            _id: "$_id.userType",
            data: {
              $push: {
                userId: "$_id.userId",
                userName: "$_id.userName",
                array: "$array",
              },
            },
          },
        },
      ]);

      return res.status(201).json({
        message:
          "Monitoring request-sheet UserWise pending data get successfully",
        UserWisePendingApprovalCount,
      });
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  }
);

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
  "/getCategories",

  async (req, res, next) => {
    const category = await Plant.find({
      plant_id: req?.rootUser?.plant_data?.split("-")?.[0],
    });

    let getCategory = category[0].categories;

    return res.status(201).json({
      message: "Categories get successfully",
      getCategory,
    });
  }
);
router.post(
  "/addCategories",

  async (req, res, next) => {
    const { name } = req.body;

    const addCategory = await Plant.updateOne(
      {
        plant_id: req?.rootUser?.plant_data?.split("-")?.[0],
      },
      {
        $push: {
          categories: {
            name,
            subCategories: [],
          },
        },
      },

      { new: true }
    );

    return res.status(201).json({
      message: "Categories added successfully",
      addCategory,
    });
  }
);
router.post(
  "/addSubCategories/:catId",

  async (req, res, next) => {
    const { name } = req.body;

    const addSubCategory = await Plant.updateOne(
      {
        plant_id: req?.rootUser?.plant_data?.split("-")?.[0],
        "categories._id": mongoose.Types.ObjectId(req.params.catId),
      },
      {
        $push: {
          "categories.$.subCategories": {
            name,
          },
        },
      },

      { new: true }
    );

    return res.status(201).json({
      message: "Categories added successfully",
      addSubCategory,
    });
  }
);

router.patch("/updateCategory/:catId", async (req, res, next) => {
  const { catName } = req.body;

  try {
    const category = await Plant.updateOne(
      {
        plant_id: req?.rootUser?.plant_data?.split("-")?.[0],
        "categories._id": mongoose.Types.ObjectId(req.params.catId),
      },
      {
        $set: { "categories.$[categories].name": catName },
      },
      {
        arrayFilters: [
          { "categories._id": mongoose.Types.ObjectId(req.params.catId) },
        ],
      }
    );

    // console.log("subCategory", subCategory);
    // console.log("subCategory", category);

    return res.status(201).json({
      message: "Category updated successfully",

      category,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error updating subCategory" });
  }
});
router.patch("/updateSubCategory/:subId", async (req, res, next) => {
  const { subName } = req.body;

  try {
    const subCategory = await Plant.updateOne(
      {
        plant_id: req?.rootUser?.plant_data?.split("-")?.[0],
        "categories.subCategories._id": mongoose.Types.ObjectId(
          req.params.subId
        ),
      },
      {
        $set: {
          "categories.$[].subCategories.$[subCategories].name": subName,
        },
      },
      {
        arrayFilters: [
          {
            "subCategories._id": mongoose.Types.ObjectId(req.params.subId),
          },
        ],
      }
    );

    // console.log("subCategory", subCategory);
    // console.log("subCategory", category);

    return res.status(201).json({
      message: "SubCategory updated successfully",
      subCategory,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error updating subCategory" });
  }
});
router.get(
  "/getAllShifts",

  async (req, res, next) => {
    const shifts = await Plant.find({
      plant_id: req?.rootUser?.plant_data?.split("-")?.[0],
    });
    let getShifts = shifts[0].shiftOfBM;

    return res.status(201).json({
      message: "Shifts get successfully",
      getShifts,
    });
  }
);
router.post(
  "/addShift",

  async (req, res, next) => {
    const { shiftName, shiftStartTime, shiftEndTime } = req.body;

    const addShift = await Plant.findOneAndUpdate(
      {
        plant_id: req?.rootUser?.plant_data?.split("-")?.[0],
      },
      {
        $push: {
          shiftOfBM: {
            shiftName,
            shiftStartTime,
            shiftEndTime,
          },
        },
      },
      { new: true }
    );

    return res.status(201).json({
      message: "Shifts added successfully",
      addShift,
    });
  }
);
router.patch(
  "/updateShift/:shiftId",

  async (req, res, next) => {
    const { shiftName, shiftStartTime, shiftEndTime } = req.body;

    const updateShift = await Plant.updateOne(
      {
        plant_id: req?.rootUser?.plant_data?.split("-")?.[0],
        "shiftOfBM._id": mongoose.Types.ObjectId(req.params.shiftId),
      },
      {
        $set: {
          "shiftOfBM.$.shiftName": shiftName,
          "shiftOfBM.$.shiftStartTime": shiftStartTime,
          "shiftOfBM.$.shiftEndTime": shiftEndTime,
        },
      },
      { new: true }
    );

    return res.status(201).json({
      message: "Shifts updated successfully",
      updateShift,
    });
  }
);

router.patch(
  "/deleteShift/:shiftId",

  async (req, res, next) => {
    const deletedShift = await Plant.updateOne(
      {
        plant_id: req?.rootUser?.plant_data?.split("-")?.[0],
        "shiftOfBM._id": mongoose.Types.ObjectId(req.params.shiftId),
      },
      {
        $pull: {
          shiftOfBM: {
            _id: mongoose.Types.ObjectId(req.params.shiftId),
          },
        },
      },
      {
        arrayFilters: [
          { "shiftOfBM._id": mongoose.Types.ObjectId(req.params.shiftId) },
        ],
      }
    );

    return res.status(201).json({
      message: "Shift Deleted successfully",
      deletedShift,
    });
  }
);
router.patch(
  "/deleteSubCategory/:catId/:subId",

  async (req, res, next) => {
    const deletedSubCategory = await Plant.updateOne(
      {
        plant_id: req?.rootUser?.plant_data?.split("-")?.[0],
        categories: {
          $elemMatch: {
            _id: mongoose.Types.ObjectId(req.params.catId),
            "subCategories._id": mongoose.Types.ObjectId(req.params.subId),
          },
        },
      },
      {
        $pull: {
          "categories.$[outer].subCategories": {
            _id: mongoose.Types.ObjectId(req.params.subId),
          },
        },
      },
      {
        arrayFilters: [
          { "outer._id": mongoose.Types.ObjectId(req.params.catId) },
        ],
      }
    );

    return res.status(201).json({
      message: "SubCategory deleted successfully",
      deletedSubCategory,
    });
  }
);
router.patch(
  "/deleteCategory/:catId",

  async (req, res, next) => {
    const deletedCategory = await Plant.updateOne(
      {
        plant_id: req?.rootUser?.plant_data?.split("-")?.[0],
        "categories._id": mongoose.Types.ObjectId(req.params.catId),
      },
      {
        $pull: {
          categories: {
            _id: mongoose.Types.ObjectId(req.params.catId),
          },
        },
      },
      {
        arrayFilters: [
          { "categories._id": mongoose.Types.ObjectId(req.params.catId) },
        ],
      }
    );

    return res.status(201).json({
      message: "Category Deleted successfully",
      deletedCategory,
    });
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

const getRequestSheetData = async (req, res, next) => {
  try {
    let queryObj = {};

    if (req.query?.requestSheetNoOfBM) {
      queryObj = {
        requestSheetNoOfBM: req.query?.requestSheetNoOfBM,
      };
    }

    if (req.query?.getDataForApprovalDashboardId) {
      queryObj = {
        "getDataForApprovalDashboard.Id": mongoose.Types.ObjectId(
          req.query.getDataForApprovalDashboardId
        ),
      };
    }

    const requestSheetData = await RequestSheetOfBM.aggregate([
      {
        $match: queryObj,
      },
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
          // pipeline: [
          //   {
          //     $project: {
          //       line_name: 1,
          //     },
          //   },
          // ],
          as: "lines",
        },
      },
      {
        $lookup: {
          from: "cells",
          localField: "cellRef",
          foreignField: "_id",
          // pipeline: [
          //   {
          //     $project: {
          //       cell_name: 1,
          //     },
          //   },
          // ],
          as: "cells",
        },
      },
      {
        $lookup: {
          from: "subSections",
          localField: "subSectionRef",
          foreignField: "_id",
          // pipeline: [
          //   {
          //     $project: {
          //       subSection_name: 1,
          //     },
          //   },
          // ],
          as: "subSections",
        },
      },
      {
        $lookup: {
          from: "sections",
          localField: "sectionRef",
          foreignField: "_id",
          // pipeline: [
          //   {
          //     $project: {
          //       section_name: 1,
          //     },
          //   },
          // ],
          as: "sections",
        },
      },
      {
        $lookup: {
          from: "plants",
          localField: "plantRef",
          foreignField: "_id",
          // pipeline: [
          //   {
          //     $project: {
          //       plant_name: 1,
          //     },
          //   },
          // ],
          as: "plants",
        },
      },
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
          localField: "partQualityCheckedByMTD",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
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
          localField: "assignUser",
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
        $lookup: {
          from: "users",
          localField: "handOverUser",
          foreignField: "_id",
          as: "handoverUserDetails",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "approvalOfMTD_TL",
          foreignField: "_id",
          as: "approvalOfMTD_TL",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "approvalOfMTD_HOSS",
          foreignField: "_id",
          as: "approvalOfMTD_HOSS",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "approvalOfMTD_HOS",
          foreignField: "_id",
          as: "approvalOfMTD_HOS",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "approvalOfPRD_TL",
          foreignField: "_id",
          as: "approvalOfPRD_TL",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "approvalOfPRD_HOS",
          foreignField: "_id",
          as: "approvalOfPRD_HOS",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "approvalOfPRD_HOD",
          foreignField: "_id",
          as: "approvalOfPRD_HOD",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "approvalOfMTD_HOD",
          foreignField: "_id",
          as: "approvalOfMTD_HOD",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "supportingTM",
          foreignField: "_id",
          as: "supportingTM",
        },
      },
      {
        $project: {
          requestSheetNoOfBM: 1,
          maintenanceType: 1,
          priorityCode: 1,
          problemOccurredDateAndTimeOfBM: 1,
          sheetIssuedDateAndTimeOfBM: 1,
          breakDownBasicDataFilledByPRD: 1,
          maintenanceReportFilledByMTD: 1,
          shiftOfBM: 1,
          qualityRelated: 1,
          requestSheetCreatedBy: 1,
          breakDownAttendedBy: 1,

          //only for material table purpose
          cell: { $arrayElemAt: ["$cells.cell_name", 0] },
          line: { $arrayElemAt: ["$lines.line_name", 0] },
          machineNo: { $arrayElemAt: ["$machines.machine_code", 0] },
          machineName: { $arrayElemAt: ["$machines.machine_name", 0] },
          problem: "$breakDownBasicDataFilledByPRD.problemFaced",
          lossTime: "$maintenanceReportFilledByMTD.breakDownTime",
          problemOccurredDateAndTimeOfBMForTable: {
            $dateToString: {
              format: "%Y-%m-%d %H:%M",
              date: "$problemOccurredDateAndTimeOfBM",
              timezone: "Asia/Kolkata",
            },
          },

          assignUser: {
            $arrayElemAt: ["$namesOperators", 0],
          },
          handOverUser: {
            $arrayElemAt: ["$handoverUserDetails", 0],
          },
          finalActivity: 1,
          work_order_status: 1,
          rejectedRemarksOfRequestSheet: 1,
          feedbackMTD_HOS: 1,
          qualityConfirmed: 1,

          approvalOfMTD_TL: {
            $arrayElemAt: ["$approvalOfMTD_TL", -1],
          },
          approvalStatusOfMTD_TL: {
            $arrayElemAt: ["$approvalStatusOfMTD_TL", -1],
          },
          approvalDateAndTimeOfMTD_TL: {
            $arrayElemAt: ["$approvalDateAndTimeOfMTD_TL", -1],
          },

          approvalOfMTD_HOSS: {
            $arrayElemAt: ["$approvalOfMTD_HOSS", -1],
          },
          approvalStatusOfMTD_HOSS: {
            $arrayElemAt: ["$approvalStatusOfMTD_HOSS", -1],
          },
          approvalDateAndTimeOfMTD_HOSS: {
            $arrayElemAt: ["$approvalDateAndTimeOfMTD_HOSS", -1],
          },

          approvalOfMTD_HOS: {
            $arrayElemAt: ["$approvalOfMTD_HOS", -1],
          },
          approvalStatusOfMTD_HOS: {
            $arrayElemAt: ["$approvalStatusOfMTD_HOS", -1],
          },
          approvalDateAndTimeOfMTD_HOS: {
            $arrayElemAt: ["$approvalDateAndTimeOfMTD_HOS", -1],
          },

          approvalOfPRD_TL: {
            $arrayElemAt: ["$approvalOfPRD_TL", -1],
          },
          approvalStatusOfPRD_TL: {
            $arrayElemAt: ["$approvalStatusOfPRD_TL", -1],
          },
          approvalDateAndTimeOfPRD_TL: {
            $arrayElemAt: ["$approvalDateAndTimeOfPRD_TL", -1],
          },

          approvalOfPRD_HOS: {
            $arrayElemAt: ["$approvalOfPRD_HOS", -1],
          },
          approvalStatusOfPRD_HOS: {
            $arrayElemAt: ["$approvalStatusOfPRD_HOS", -1],
          },
          approvalDateAndTimeOfPRD_HOS: {
            $arrayElemAt: ["$approvalDateAndTimeOfPRD_HOS", -1],
          },

          approvalOfPRD_HOD: {
            $arrayElemAt: ["$approvalOfPRD_HOD", -1],
          },
          approvalStatusOfPRD_HOD: {
            $arrayElemAt: ["$approvalStatusOfPRD_HOD", -1],
          },
          approvalDateAndTimeOfPRD_HOD: {
            $arrayElemAt: ["$approvalDateAndTimeOfPRD_HOD", -1],
          },

          approvalOfMTD_HOD: {
            $arrayElemAt: ["$approvalOfMTD_HOD", -1],
          },
          approvalStatusOfMTD_HOD: {
            $arrayElemAt: ["$approvalStatusOfMTD_HOD", -1],
          },
          approvalDateAndTimeOfMTD_HOD: {
            $arrayElemAt: ["$approvalDateAndTimeOfMTD_HOD", -1],
          },

          partQualityCheckedByPRD: { $arrayElemAt: ["$namesPRD", 0] },
          partQualityCheckedByMTD: { $arrayElemAt: ["$namesMTD", 0] },

          dataSheetOfBM: 1,
          drawingOfBM: 1,
          sparePartUsedOrNot: 1,
          changedParts: 1,

          machineRef: { $arrayElemAt: ["$machines", 0] },
          lineRef: { $arrayElemAt: ["$lines", 0] },
          cellRef: { $arrayElemAt: ["$cells", 0] },
          subSectionRef: { $arrayElemAt: ["$subSections", 0] },
          sectionRef: { $arrayElemAt: ["$sections", 0] },
          plantRef: { $arrayElemAt: ["$plants", 0] },

          requestSheetStatus: 1,
          getDataForApprovalDashboard: 1,

          actionTemporaryOrNot: 1,
          dataSheetOfRequestSheet: 1,
          drawingOfRequestSheet: 1,
          supportingTM: 1,
          attachedDataSheets: 1,
          attachedDrawings: 1,
          categoriesOfRequestSheet: 1,
        },
      },
    ]);

    req.requestSheetData = requestSheetData;
    if (requestSheetData?.length === 0) {
      return res.status(400).json({
        message: "No data to display",
      });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: error?.message, error: new Error(error) });
  }
};

router.get(
  "/getMachineRequestSheetDetails",
  getRequestSheetData,
  async (req, res, next) => {
    try {
      res.status(201).json({
        message: "Request-sheet data get successfully",
        requestSheetData: req.requestSheetData,
      });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ message: error?.message, error: new Error(error) });
    }
  }
);
// -------------------------------------------------------------------------------
//        Report 1 : Production/Line Wise KPI
// -------------------------------------------------------------------------------

const middlewareForGettingDefaultCell = async (req, res, next) => {
  try {
    const section = await Section.findOne({
      section_id: req?.rootUser?.section_data?.split("-")?.[0],
    });

    req.section = section;

    let subSectionsData;

    if (section.dashboardLevel === "No") {
      subSectionsData = await SubSection.find({
        subSection_id: {
          $in: req.rootUser?.subSection_data?.map(
            (item) => item?.split("-")?.[0]
          ),
        },
      });
    } else {
      subSectionsData = await SubSection.find({
        section_names: section?._id,
      });
    }

    const cellData = await Cell.find({
      subSection_names: { $in: subSectionsData },
    }).sort({ cell_sequence: 1 });

    req.cellData = cellData;

    next();
  } catch (error) {
    res.status(500).json({ message: error?.message, error });
  }
};

router.get(
  "/getCellDropdownValueBasedOnDashboardLevel",
  async (req, res, next) => {
    try {
      const section = await Section.findOne({
        section_id: req?.rootUser?.section_data?.split("-")?.[0],
      });

      req.section = section;

      let subSectionsData;

      if (section.dashboardLevel === "No") {
        subSectionsData = await SubSection.find({
          subSection_id: {
            $in: req.rootUser?.subSection_data?.map(
              (item) => item?.split("-")?.[0]
            ),
          },
        });
      } else {
        subSectionsData = await SubSection.find({
          section_names: section?._id,
        });
      }

      const cellData = await Cell.find({
        subSection_names: { $in: subSectionsData },
      }).sort({ cell_sequence: 1 });

      return res.status(201).json({
        message: "Cell dropdown value get successfully",
        selectedCell: cellData?.[0]?._id,
        cellData,
      });
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.patch(
  "/sendApprovalForRequestSheetOfBM/:reqId/:machineRef",
  async (req, res, next) => {
    try {
      let {
        assignApprovalList,
        requestSheetDataOfBM,
        minorBD,
        majorBD,
        approvalOfRequestSheet,
        rejectedRemarksOfRequestSheet,
      } = req.body;

      if (
        !assignApprovalList?.MTD_TL?.id &&
        requestSheetDataOfBM?.assignUser?._id ===
          (req?.rootUser?._id).toString()
      ) {
        return res
          .status(400)
          .json({ message: "Please fill required approval list" });
      }

      if (
        requestSheetDataOfBM?.assignUser?._id ===
        (req?.rootUser?._id).toString()
      ) {
        const updateAssignApprovalOfMTD_TL =
          await RequestSheetOfBM.findOneAndUpdate(
            {
              requestSheetNoOfBM: req.params?.reqId,
              assignUser: req?.rootUser?._id,
            },
            {
              $set: {
                requestSheetStatus: "Under MTD TL Approval",
                "getDataForApprovalDashboard.Id":
                  assignApprovalList?.MTD_TL?.id,
                "getDataForApprovalDashboard.departmentAndGradeOfUser":
                  "MTD TL",
              },
              $push: {
                approvalOfMTD_TL: assignApprovalList?.MTD_TL?.id,
                approvalStatusOfMTD_TL: "Pending",
                approverNameLogOfMTD_TL: assignApprovalList?.MTD_TL?.name,
              },
            },
            { new: true }
          ).exec();

        if (updateAssignApprovalOfMTD_TL) {
          return res.status(201).json({
            message: "Successfully send approval to MTD TL!",
            updateAssignApprovalOfMTD_TL,
          });
        }
      }
      //remove first approver (MTD TL)
      // Object.keys(assignApprovalList).forEach((key) => {
      const formattedKey =
        requestSheetDataOfBM?.getDataForApprovalDashboard?.departmentAndGradeOfUser?.replace(
          " ",
          "_"
        );
      Object.keys(assignApprovalList[formattedKey])?.length === 0 &&
        delete assignApprovalList[formattedKey];
      // });

      const updateTheStatusOfBMSheetApprover = async (
        keyOfDepartment,
        assignUser
      ) => {
        let queryObjForPush = {};

        queryObjForPush = {
          ...queryObjForPush,
          [`approvalOf${keyOfDepartment}`]: assignUser?.id || null,
          [`approvalStatusOf${keyOfDepartment}`]: assignUser?.id
            ? "Pending"
            : "",
          [`approverNameLogOf${keyOfDepartment}`]: assignUser?.name || "",
        };

        let resultOfUpdateStatusOfApprover =
          await RequestSheetOfBM.findOneAndUpdate(
            {
              requestSheetNoOfBM: req.params?.reqId,
            },
            {
              $push: {
                ...queryObjForPush,
              },
            },
            {
              new: true,
            }
          );
      };

      const minorListForTheApprovalOfPlant =
        requestSheetDataOfBM?.plantRef?.approvalListOfMinorAndMajor
          ?.minorApprovalList;
      const majorListForTheApprovalOfPlant =
        requestSheetDataOfBM?.plantRef?.approvalListOfMinorAndMajor
          ?.majorApprovalList;

      Object.keys(assignApprovalList).forEach((key) => {
        if (
          [
            ...new Set([
              ...minorListForTheApprovalOfPlant,
              ...majorListForTheApprovalOfPlant,
            ]),
          ]?.includes(key.replace("_", " "))
        ) {
          updateTheStatusOfBMSheetApprover(key, assignApprovalList[key]);
        }
      });

      //request-sheet is approved/accepted
      if (approvalOfRequestSheet === "Yes") {
        let updateRequestSheetStatus = await RequestSheetOfBM.findOneAndUpdate(
          {
            requestSheetNoOfBM: req?.params?.reqId,
            approvalStatusOfMTD_TL: "Pending",
          },
          {
            $set: {
              requestSheetStatus: `Under ${
                requestSheetDataOfBM?.plantRef?.approvalListOfMinorAndMajor?.[
                  minorBD === "Yes" ? "minorApprovalList" : "majorApprovalList"
                ]?.[1]
              } Approval`,
              "getDataForApprovalDashboard.Id":
                assignApprovalList?.[
                  (requestSheetDataOfBM?.plantRef?.approvalListOfMinorAndMajor?.[
                    minorBD === "Yes"
                      ? "minorApprovalList"
                      : "majorApprovalList"
                  ]?.[1]).replace(" ", "_")
                ]?.id,
              "getDataForApprovalDashboard.departmentAndGradeOfUser":
                requestSheetDataOfBM?.plantRef?.approvalListOfMinorAndMajor?.[
                  minorBD === "Yes" ? "minorApprovalList" : "majorApprovalList"
                ]?.[1],
              "approvalStatusOfMTD_TL.$": "Accepted",
            },
            $push: {
              approvalDateAndTimeOfMTD_TL: new Date(),
            },
          },
          { new: true }
        );
        if (updateRequestSheetStatus)
          return res.status(201).json({
            message: `${req.params?.reqId} Request-sheet approval send !!`,
          });
      } else {
        //request-sheet is rejected
        let updateRequestSheetStatus = await RequestSheetOfBM.findOneAndUpdate(
          {
            requestSheetNoOfBM: req?.params?.reqId,
            approvalStatusOfMTD_TL: "Pending",
          },
          {
            $set: {
              requestSheetStatus: "Rejected",
              "approvalStatusOfMTD_TL.$": "Rejected",
            },
            $unset: {
              getDataForApprovalDashboard: "",
            },
            $push: {
              approvalDateAndTimeOfMTD_TL: new Date(),
              rejectedRemarksOfRequestSheet,
            },
          },
          { new: true }
        );
        if (updateRequestSheetStatus)
          return res.status(201).json({
            message: `${req.params?.reqId} Request-sheet is rejected !!`,
          });
      }
      //send email of approval to MTD TL (Remaining)
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error?.message, error });
    }
  }
);

const monthValidationMiddleware = async (req, res, next) => {
  try {
    if (currentYear === req.query?.selectedYear) {
      if (
        moment().tz(timezone).month(req.query.selectedMonth).month() >
          moment().tz(timezone).month() ||
        [0, 1, 2].includes(
          moment().tz(timezone).month(req.query.selectedMonth).month()
        )
      ) {
        return res
          .status(400)
          .json({ message: "You can't selected the future month!!!" });
      }
    }

    next();
  } catch (error) {
    res.status(500).json({ message: error?.message, error });
  }
};

//          Daily breakdown trend
router.get(
  "/getDailyBreakdownTrendData/:filter/:selectedId",
  monthValidationMiddleware,
  filterMiddleware,
  async (req, res, next) => {
    try {
      let year, endDate;
      const spiltArrayOfYear = req.query?.selectedYear?.split("-");

      if (["Jan", "Feb", "Mar"]?.includes(req.query.selectedMonth)) {
        year = spiltArrayOfYear[1];
      } else {
        year = spiltArrayOfYear[0];
      }

      if (
        currentYear === req.query?.selectedYear &&
        moment().tz(timezone).month(req.query.selectedMonth).month() ===
          moment().tz(timezone).month()
      ) {
        endDate = moment().tz(timezone).endOf("day");
      } else {
        endDate = moment()
          .tz(timezone)
          .year(year)
          .month(req.query.selectedMonth)
          .endOf("month");
      }

      const startDate = moment()
        .tz(timezone)
        .year(year)
        .month(req.query.selectedMonth)
        .startOf("month");

      const allDatesInMonth = Array.from(
        { length: endDate.date() },
        (_, index) => startDate.clone().add(index, "days").format("DD")
      );

      const queryFunction = async ({ conditionObj }) =>
        RequestSheetOfBM.aggregate([
          {
            $match: req.queryObj,
          },
          {
            $sort: {
              _id: -1,
            },
          },
          {
            $addFields: {
              BDhour: {
                $divide: ["$maintenanceReportFilledByMTD.breakDownTime", 60],
              },
            },
          },
          {
            $match: {
              BDhour: conditionObj,
            },
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%d",
                  date: "$problemOccurredDateAndTimeOfBM",
                  timezone: timezone,
                },
              },
              count: { $sum: 1 },
              hours: {
                $sum: "$BDhour",
              },
            },
          },

          {
            $group: {
              _id: null,
              array: { $push: "$$ROOT" },
            },
          },
          {
            $project: {
              _id: 0,
              array: {
                $cond: [
                  { $gt: [{ $size: "$array" }, 0] },
                  {
                    $map: {
                      input: allDatesInMonth,
                      as: "date",
                      in: {
                        $cond: [
                          { $in: ["$$date", "$array._id"] },
                          {
                            $arrayElemAt: [
                              "$array.hours",
                              {
                                $indexOfArray: ["$array._id", "$$date"],
                              },
                            ],
                          },
                          0,
                        ],
                      },
                    },
                  },
                  "$array",
                ],
              },

              // {
              //   $map: {
              //     input: allDatesInMonth,
              //     as: "date",
              //     in: {
              //       $cond: [
              //         { $in: ["$$date", "$array._id"] },
              //         {
              //           $arrayElemAt: [
              //             "$array",
              //             {
              //               $indexOfArray: ["$array._id", "$$date"],
              //             },
              //           ],
              //         },
              //         {
              //           _id: "$$date",
              //           count: 0,
              //           hours: 0,
              //         },
              //       ],
              //     },
              //   },
              // },
            },
          },
          // { $unwind: "$array" },
          // {
          //   $replaceRoot: { newRoot: "$array" },
          // },
        ]);

      const dayWiseCount = await RequestSheetOfBM.aggregate([
        {
          $match: req.queryObj,
        },
        {
          $sort: {
            _id: -1,
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%d",
                date: "$problemOccurredDateAndTimeOfBM",
                timezone: timezone,
              },
            },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: null,
            array: { $push: "$$ROOT" },
          },
        },
        {
          $project: {
            _id: 0,
            array: {
              $map: {
                input: allDatesInMonth,
                as: "date",
                in: {
                  $cond: [
                    { $in: ["$$date", "$array._id"] },
                    {
                      $arrayElemAt: [
                        "$array.count",
                        {
                          $indexOfArray: ["$array._id", "$$date"],
                        },
                      ],
                    },
                    0,
                  ],
                },
              },
            },
          },
        },
      ]);

      const lessThanOrEqualToOneHourData = await queryFunction({
        conditionObj: { $lte: 1 },
      });

      const greaterThenOneAndLessThanOrEqualToTwoHourData = await queryFunction(
        {
          conditionObj: {
            $gt: 1,
            $lte: 2,
          },
        }
      );

      const greaterThenTwoHourData = await queryFunction({
        conditionObj: { $gt: 2 },
      });

      // const data = await RequestSheetOfBM.aggregate([
      //   {
      //     $match: {
      //       sheetIssuedDateAndTimeOfBM: {
      //         $gte: startDate.toDate(),
      //         $lte: endDate.toDate(),
      //       },
      //     },
      //     // $match: {
      //     //   ...req.queryObj,
      //     //   sheetIssuedDateAndTimeOfBM: {
      //     //     $gte: startDate.toDate(),
      //     //     $lte: endDate.toDate(),
      //     //   },
      //     // },
      //   },
      //   {
      //     $sort: {
      //       _id: -1,
      //     },
      //   },
      //   {
      //     $addFields: {
      //       BDhour: {
      //         $divide: [
      //           {
      //             $subtract: [
      //               "$sheetCompletedDateAndTime",
      //               "$sheetIssuedDateAndTimeOfBM",
      //             ],
      //           },
      //           3600000,
      //         ],
      //       },
      //     },
      //   },
      //   {
      //     $facet: {
      //       lessThanOrEqualToOneHourData: [
      //         {
      //           $match: {
      //             BDhour: { $lte: 1 },
      //           },
      //         },
      //         {
      //           $group: {
      //             _id: {
      //               $dateToString: {
      //                 format: "%d",
      //                 date: "$sheetIssuedDateAndTimeOfBM",
      //                 timezone: timezone,
      //               },
      //             },
      //             count: { $sum: 1 },
      //             hours: {
      //               $sum: "$BDhour",
      //             },
      //           },
      //         },
      //       ],
      //       greaterThenOneAndLessThanOrEqualToTwoHourData: [
      //         {
      //           $match: {
      //             BDhour: {
      //               $gt: 1,
      //               $lte: 2,
      //             },
      //           },
      //         },
      //         {
      //           $group: {
      //             _id: {
      //               $dateToString: {
      //                 format: "%d",
      //                 date: "$sheetIssuedDateAndTimeOfBM",
      //                 timezone: timezone,
      //               },
      //             },
      //             count: { $sum: 1 },
      //             hours: {
      //               $sum: "$BDhour",
      //             },
      //           },
      //         },
      //       ],
      //       greaterThenTwoHourData: [
      //         {
      //           $match: {
      //             BDhour: { $gt: 2 },
      //           },
      //         },
      //         {
      //           $group: {
      //             _id: {
      //               $dateToString: {
      //                 format: "%d",
      //                 date: "$sheetIssuedDateAndTimeOfBM",
      //                 timezone: timezone,
      //               },
      //             },
      //             count: { $sum: 1 },
      //             hours: {
      //               $sum: "$BDhour",
      //             },
      //           },
      //         },
      //       ],
      //     },
      //   },

      //   // {
      //   //   $group: {
      //   //     _id: null,
      //   //     array: { $push: "$$ROOT" },
      //   //   },
      //   // },
      //   // {
      //   //   $project: {
      //   //     _id: 0,
      //   //     array: {
      //   //       $cond: [
      //   //         { $gt: [{ $size: "$array" }, 0] },
      //   //         {
      //   //           $map: {
      //   //             input: allDatesInMonth,
      //   //             as: "date",
      //   //             in: {
      //   //               $cond: [
      //   //                 { $in: ["$$date", "$array._id"] },
      //   //                 {
      //   //                   $arrayElemAt: [
      //   //                     "$array.hours",
      //   //                     {
      //   //                       $indexOfArray: ["$array._id", "$$date"],
      //   //                     },
      //   //                   ],
      //   //                 },
      //   //                 0,
      //   //               ],
      //   //             },
      //   //           },
      //   //         },
      //   //         "$array",
      //   //       ],
      //   //     },

      //   //   },
      //   // },
      // ]);

      return res.status(201).json({
        message: "DailyBreakdownTrend graph data get successfully",
        // data,

        dailyBreakdownTrendData: {
          labels: allDatesInMonth,
          dayWiseCount:
            dayWiseCount?.length > 0 ? dayWiseCount?.[0]?.array : dayWiseCount,
          lessThanOrEqualToOneHourData:
            lessThanOrEqualToOneHourData?.length > 0
              ? lessThanOrEqualToOneHourData?.[0]?.array
              : lessThanOrEqualToOneHourData,
          greaterThenOneAndLessThanOrEqualToTwoHourData:
            greaterThenOneAndLessThanOrEqualToTwoHourData?.length > 0
              ? greaterThenOneAndLessThanOrEqualToTwoHourData?.[0]?.array
              : greaterThenOneAndLessThanOrEqualToTwoHourData,
          greaterThenTwoHourData:
            greaterThenTwoHourData?.length > 0
              ? greaterThenTwoHourData?.[0]?.array
              : greaterThenTwoHourData,
        },
      });
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  }
);

const requestSheetMiddleware = async (req, res, next) => {
  try {
    const requestSheetData = await RequestSheetOfBM.aggregate([
      {
        $match: req.queryObj,
      },
      {
        $lookup: {
          from: "sections",
          localField: "sectionRef",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                section_name: 1,
              },
            },
          ],
          as: "sections",
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
                machine_code: 1,
                machine_name: 1,
              },
            },
          ],
          as: "machines",
        },
      },
      {
        $project: {
          sectionName: { $arrayElemAt: ["$sections.section_name", 0] },
          cell: { $arrayElemAt: ["$cells.cell_name", 0] },
          line: { $arrayElemAt: ["$lines.line_name", 0] },
          machineName: { $arrayElemAt: ["$machines.machine_name", 0] },
          machineNo: { $arrayElemAt: ["$machines.machine_code", 0] },
          problem: "$breakDownBasicDataFilledByPRD.problemFaced",
          problemOccurredDateAndTimeOfBM: 1,
          work_order_status: 1,
          requestSheetStatus: 1,
          requestSheetNoOfBM: 1,
        },
      },
    ]);

    return res.status(201).json({
      message: "RequestSheet data get successfully",
      requestSheetData,
    });
  } catch (error) {
    res.status(500).json({ message: error?.message, error });
  }
};

router.get(
  "/getRequestSheetDataBasedOnSelectedDate/:filter/:selectedId/:date",
  filterMiddleware,
  async (req, res, next) => {
    try {
      let nextDate = new Date(req.params.date);
      nextDate.setDate(nextDate.getDate() + 1);

      req.queryObj = {
        ...req.queryObj,
        problemOccurredDateAndTimeOfBM: {
          $gte: new Date(req.params.date),
          $lt: nextDate,
        },
      };

      next();
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  },
  requestSheetMiddleware
);

router.get(
  "/getMTTRGraphData/:filter/:selectedId",
  filterMiddleware,
  async (req, res, next) => {
    try {
      const MTTRReportData = await RequestSheetOfBM.aggregate([
        {
          $match: req.queryObj,
          // $match: {
          //   cellRef: mongoose.Types.ObjectId("632c41261d1becfedab325f9"),
          // },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%m",
                date: "$problemOccurredDateAndTimeOfBM",
                timezone: timezone,
              },
            },
            count: { $sum: 1 },
            hours: {
              $sum: {
                $cond: [
                  {
                    $gt: [
                      "$maintenanceReportFilledByMTD.workEndedDateOfBM",
                      null,
                    ],
                  },
                  {
                    $divide: [
                      "$maintenanceReportFilledByMTD.breakDownTime",
                      60,
                    ],
                  },
                  0,
                ],
              },
            },
            target: {
              $sum: {
                $cond: [
                  {
                    $gt: [
                      "$maintenanceReportFilledByMTD.workEndedDateOfBM",
                      null,
                    ],
                  },
                  {
                    $divide: [
                      "$maintenanceReportFilledByMTD.breakDownTime",
                      60,
                    ],
                  },
                  0,
                ],
              },
            },
          },
        },
        {
          $project: {
            count: 1,
            target: 1,
            hours: {
              $divide: ["$hours", "$count"],
            },
          },
        },
        {
          $group: {
            _id: null,
            array: { $push: "$$ROOT" },
          },
        },
        {
          $project: {
            _id: 0,
            array: {
              $map: {
                input: allMonths,
                as: "month",
                in: {
                  $cond: [
                    { $in: ["$$month.monthInDecimal", "$array._id"] },
                    {
                      month: "$$month.monthName",
                      value: {
                        $arrayElemAt: [
                          "$array",
                          {
                            $indexOfArray: [
                              "$array._id",
                              "$$month.monthInDecimal",
                            ],
                          },
                        ],
                      },
                    },
                    {
                      month: "$$month.monthName",
                      value: {
                        _id: "$$month.monthInDecimal",
                        count: 0,
                        hours: 0,
                        target: 0,
                      },
                    },
                  ],
                },
              },
            },
          },
        },
        { $unwind: "$array" },
        {
          $replaceRoot: { newRoot: "$array" },
        },
        {
          $group: {
            _id: null,
            labels: { $push: "$month" },
            target: { $push: "$value.target" },
            data: {
              $push: "$value.hours",
            },
            backgroundColor: {
              $push: {
                $cond: [
                  {
                    $lte: ["$value.hours", "$value.target"],
                  },
                  "green",
                  "red",
                ],
              },
            },
          },
        },
      ]);

      return res.status(201).json({
        message: "MTTR graph data get successfully",
        MTTRReportData: MTTRReportData?.[0],
      });
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/getBDHoursGraphData/:filter/:selectedId",
  filterMiddleware,
  async (req, res, next) => {
    try {
      const BDHours = await RequestSheetOfBM.aggregate([
        {
          $match: req.queryObj,
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%m",
                date: "$problemOccurredDateAndTimeOfBM",
                timezone: timezone,
              },
            },
            hours: {
              $sum: {
                $divide: ["$maintenanceReportFilledByMTD.breakDownTime", 60],
              },
            },
            target: {
              $sum: {
                $divide: ["$maintenanceReportFilledByMTD.breakDownTime", 60],
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            array: { $push: "$$ROOT" },
          },
        },
        {
          $project: {
            _id: 0,
            array: {
              $map: {
                input: allMonths,
                as: "month",
                in: {
                  $cond: [
                    { $in: ["$$month.monthInDecimal", "$array._id"] },
                    {
                      month: "$$month.monthName",
                      value: {
                        $arrayElemAt: [
                          "$array",
                          {
                            $indexOfArray: [
                              "$array._id",
                              "$$month.monthInDecimal",
                            ],
                          },
                        ],
                      },
                    },
                    {
                      month: "$$month.monthName",
                      value: {
                        _id: "$$month.monthInDecimal",
                        hours: 0,
                        target: 0,
                      },
                    },
                  ],
                },
              },
            },
          },
        },
        { $unwind: "$array" },
        {
          $replaceRoot: { newRoot: "$array" },
        },
        {
          $group: {
            _id: null,
            labels: { $push: "$month" },
            target: { $push: "$value.target" },
            data: {
              $push: "$value.hours",
            },
            backgroundColor: {
              $push: {
                $cond: [
                  {
                    $gt: ["$value.hours", "$value.target"],
                  },
                  "red",
                  "green",
                ],
              },
            },
          },
        },
      ]);

      return res.status(201).json({
        message: "BDHours graph data get successfully",
        BDHours: BDHours?.[0],
      });
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.post(
  "/getBDhoursVsCountDataFunction/:purpose/:filter/:selectedId",
  async (req, res, next) => {
    try {
      let queryObjForPM = {},
        queryObjForBM = {
          "maintenanceReportFilledByMTD.workEndedDateOfBM": {
            $ne: null,
          },
        };

      if (req.params?.filter === "based-on-section") {
        queryObjForPM = {
          section_names: mongoose.Types.ObjectId(req.params?.selectedId),
        };
      } else if (req.params?.filter === "based-on-subSection") {
        queryObjForPM = {
          subSection_names: mongoose.Types.ObjectId(req.params?.selectedId),
        };
      } else if (req.params?.filter === "based-on-cell") {
        queryObjForPM = {
          cell_names: mongoose.Types.ObjectId(req.params?.selectedId),
        };
      } else if (req.params?.filter === "based-on-line") {
        queryObjForPM = {
          line_names: mongoose.Types.ObjectId(req.params?.selectedId),
        };
      }

      if (req.query?.selectedYear) {
        queryObjForBM = {
          ...queryObjForBM,
          "preAggregationTimeStampOfRequestSheet.requestSheet_year":
            req.query?.selectedYear,
        };
      }

      if (req.query?.selectedMonth !== "undefined") {
        queryObjForBM = {
          ...queryObjForBM,
          "preAggregationTimeStampOfRequestSheet.requestSheet_month":
            req.query?.selectedMonth,
        };
      }

      let boundaries = [0, Infinity]; // total data,
      let customLegendArray = [
        {
          id: 0,
          key: "total",
        },
      ];

      if (req.body?.hoursFilter?.length > 0) {
        boundaries = [0];
        customLegendArray = [];

        for (let i = 0; i < req.body?.hoursFilter.length; i++) {
          boundaries.push(req.body?.hoursFilter[i] * 1);
          customLegendArray.push(
            i === 0
              ? {
                  id: 0,
                  key: `<${req.body?.hoursFilter[i]}`,
                }
              : {
                  id: req.body?.hoursFilter[i - 1] * 1,
                  key: `<${req.body?.hoursFilter[i]}`,
                }
          );
        }
      }

      if (req.body?.graterThenHoursFilter) {
        if (req.body?.hoursFilter?.length > 0) {
          boundaries = [
            ...boundaries,
            req.body?.graterThenHoursFilter * 1,
            Infinity,
          ];
          customLegendArray.push({
            id: req.body?.graterThenHoursFilter * 1,
            key: `${req.body?.graterThenHoursFilter}+`,
          });
        } else {
          boundaries = [req.body?.graterThenHoursFilter * 1, Infinity];
          customLegendArray = [
            {
              id: req.body?.graterThenHoursFilter * 1,
              key: `${req.body?.graterThenHoursFilter}+`,
            },
          ];
        }
      }

      let queryObjects = {
        bucketOutputObj: {
          count: { $sum: 1 },
          sumOfBDhours: { $sum: "$BDhours" },
        },
        mapArray: [
          {
            _id: "$$item",
            count: {
              $arrayElemAt: [
                "$array.count",
                {
                  $indexOfArray: ["$array._id", "$$item.id"],
                },
              ],
            },
            sumOfBDhours: {
              $arrayElemAt: [
                "$array.sumOfBDhours",
                {
                  $indexOfArray: ["$array._id", "$$item.id"],
                },
              ],
            },
          },
          {
            _id: "$$item",
            count: 0,
            sumOfBDhours: 0,
          },
        ],
        requestSheetProjection: {
          count: "$count",
          sumOfBDhours: "$sumOfBDhours",
        },
        groupingObj: {
          count: { $push: "$requestSheets.count" },
          sumOfBDhours: { $push: "$requestSheets.sumOfBDhours" },
        },
        // outerMachineLevelProjection: {
        //   count: 1,
        //   sumOfBDhours: 1,
        // },
        facetObj: {
          labels: [
            {
              $project: {
                _id: 0,
                machine_code: 1,
              },
            },
          ],

          BDhours: [
            {
              $project: {
                _id: 0,
                groupId: "$_id.groupId.key",
                sumOfBDhours: 1,
                machine_code: 1,
              },
            },
          ],

          BDCount: [
            {
              $project: {
                _id: 0,
                groupId: "$_id.groupId.key",
                count: 1,
                machine_code: 1,
              },
            },
          ],
        },
      };

      if (req.params?.purpose === "hours-filter") {
        queryObjects = {
          bucketOutputObj: {
            sumOfBDhours: { $sum: "$BDhours" },
          },
          mapArray: [
            {
              _id: "$$item",

              sumOfBDhours: {
                $arrayElemAt: [
                  "$array.sumOfBDhours",
                  {
                    $indexOfArray: ["$array._id", "$$item.id"],
                  },
                ],
              },
            },
            {
              _id: "$$item",
              sumOfBDhours: 0,
            },
          ],
          requestSheetProjection: {
            sumOfBDhours: "$sumOfBDhours",
          },
          groupingObj: {
            sumOfBDhours: { $push: "$requestSheets.sumOfBDhours" },
          },
          // outerMachineLevelProjection: {
          //   sumOfBDhours: 1,
          // },

          facetObj: {
            labels: [
              {
                $project: {
                  _id: 0,
                  machine_code: 1,
                },
              },
            ],
            BDhours: [
              {
                $project: {
                  _id: 0,
                  groupId: "$_id.groupId.key",
                  sumOfBDhours: 1,
                  machine_code: 1,
                },
              },
            ],
          },
        };
      } else if (req.params?.purpose === "count-filter") {
        queryObjects = {
          bucketOutputObj: {
            count: { $sum: 1 },
          },
          mapArray: [
            {
              _id: "$$item",
              count: {
                $arrayElemAt: [
                  "$array.count",
                  {
                    $indexOfArray: ["$array._id", "$$item.id"],
                  },
                ],
              },
            },
            {
              _id: "$$item",
              count: 0,
            },
          ],
          requestSheetProjection: {
            count: "$count",
          },
          groupingObj: {
            count: { $push: "$requestSheets.count" },
          },

          facetObj: {
            labels: [
              {
                $project: {
                  _id: 0,
                  machine_code: 1,
                },
              },
            ],
            BDCount: [
              {
                $project: {
                  _id: 0,
                  groupId: "$_id.groupId.key",
                  count: 1,
                  machine_code: 1,
                },
              },
            ],
          },
        };
      }

      const BDHoursVsCountData = await Machine.aggregate([
        {
          $match: queryObjForPM,
        },
        {
          $lookup: {
            from: "requestsheetofbms",
            localField: "_id",
            foreignField: "machineRef",
            pipeline: [
              {
                $match: queryObjForBM,
              },
              {
                $project: {
                  machineRef: 1,
                  requestSheetNoOfBM: 1,
                  // sheetIssuedDateAndTimeOfBM: 1,
                  // sheetCompletedDateAndTime: 1,
                  BDhours: {
                    $divide: [
                      "$maintenanceReportFilledByMTD.breakDownTime",
                      60,
                    ],
                  },
                },
              },
              {
                $bucket: {
                  groupBy: "$BDhours",
                  // boundaries: [0, Infinity], // 0 <= value < 2, 2<= value < 3
                  boundaries: boundaries, // 0 <= value < 2, 2<= value < 3
                  // boundaries: [0, 3], // 0 <= value < 3
                  default: "Other",
                  output: queryObjects?.bucketOutputObj,
                  // {
                  //   count: { $sum: 1 },
                  //   sumOfBDhours: { $sum: "$BDhours" },
                  // },
                },
              },
              {
                $group: {
                  _id: null,
                  array: { $push: "$$ROOT" },
                },
              },
              {
                $project: {
                  _id: 0,
                  data: {
                    $map: {
                      input: customLegendArray,
                      as: "item",
                      in: {
                        $cond: [
                          { $in: ["$$item.id", "$array._id"] },
                          ...queryObjects?.mapArray,
                          // {
                          //   _id: "$$item",
                          //   count: {
                          //     $arrayElemAt: [
                          //       "$array.count",
                          //       {
                          //         $indexOfArray: ["$array._id", "$$item.id"],
                          //       },
                          //     ],
                          //   },
                          //   sumOfBDhours: {
                          //     $arrayElemAt: [
                          //       "$array.sumOfBDhours",
                          //       {
                          //         $indexOfArray: ["$array._id", "$$item.id"],
                          //       },
                          //     ],
                          //   },
                          // },
                          // {
                          //   _id: "$$item",
                          //   count: 0,
                          //   sumOfBDhours: 0,
                          // },
                        ],
                      },
                    },
                  },
                },
              },
              {
                $unwind: "$data",
              },
              {
                $replaceRoot: { newRoot: "$data" },
              },
              {
                $project: {
                  _id: 0,
                  groupId: "$_id",

                  ...queryObjects?.requestSheetProjection,
                  // count: "$count",
                  // sumOfBDhours: "$sumOfBDhours",
                },
              },
            ],
            as: "requestSheets",
          },
        },
        {
          $project: {
            machine_code: 1,
            machine_name: 1,
            requestSheets: 1,
          },
        },
        {
          $sort: {
            _id: -1,
          },
        },
        {
          $unwind: "$requestSheets",
        },
        {
          $group: {
            _id: {
              groupId: "$requestSheets.groupId",
            },
            ...queryObjects?.groupingObj,
            // count: { $push: "$requestSheets.count" },
            // sumOfBDhours: { $push: "$requestSheets.sumOfBDhours" },
            machine_code: { $push: "$machine_code" },
          },
        },

        {
          $sort: {
            "_id.groupId.id": 1,
          },
        },
        // {
        //   $project: {
        //     _id: 0,
        //     groupId: "$_id.groupId.key",
        //     // ...queryObjects?.outerMachineLevelProjection,
        //     count: 1,
        //     sumOfBDhours: 1,
        //     machine_code: 1,
        //     BDhours: {
        //       groupId: "$_id.groupId.key",
        //       sumOfBDhours: "$sumOfBDhours",
        //     },
        //   },
        // },

        {
          $facet: queryObjects?.facetObj,
          // {
          //   BDhours: [
          //     {
          //       $project: {
          //         _id: 0,
          //         groupId: "$_id.groupId.key",
          //         sumOfBDhours: 1,
          //         machine_code: 1,
          //       },
          //     },
          //   ],

          //   BDCount: [
          //     {
          //       $project: {
          //         _id: 0,
          //         groupId: "$_id.groupId.key",
          //         count: 1,
          //         machine_code: 1,
          //       },
          //     },
          //   ],
          // },
        },
      ]);

      return res.status(201).json({
        message: "BD hours vs count graph data get successfully",
        labels: BDHoursVsCountData?.[0]?.labels?.[0]?.machine_code,
        BDHoursVsCountData: BDHoursVsCountData?.[0],
      });
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get("/getProductOrLineReportHourlyFilter", async (req, res, next) => {
  try {
    const filterInfo = await Plant.findOne(
      {
        plant_id: req?.rootUser?.plant_data?.split("-")?.[0],
      },
      {
        lessThanValue: 1,
        greaterThan: 1,
      }
    );

    res.status(201).json({
      message: "Filter get successfully",
      filterInfo,
    });
  } catch (error) {
    res.status(500).json({ message: error?.message, error });
  }
});
// add or update the hourly filter for product/line report
router.patch(
  "/hourlyFilterProductionOrLineWiseReport/:plantId",
  async (req, res, next) => {
    try {
      delete req.body["_id"];
      console.log(req.body);

      let { greaterThan, lessThanValue } = await Plant.findOneAndUpdate(
        { _id: req.params?.plantId },
        { $set: req.body },
        { new: true }
      );

      res.status(201).json({
        message: "Filter updated successfully",
        responseFilter: {
          greaterThan,
          lessThanValue,
        },
      });
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  }
);

// ---------------- Request Sheet Data -------------------

router.get("/getRequestSheetDataLineWise", async (req, res, next) => {
  try {
    const startDate = moment().tz(timezone).month("January");

    const endDate = moment().tz(timezone).endOf("December");

    let queryObj = {};

    if (req.query._id) {
      queryObj = {
        _id: mongoose.Types.ObjectId(req.query._id),
      };
    }

    if (req.query.lineId) {
      queryObj = {
        lineRef: mongoose.Types.ObjectId(req.query.lineId),
        problemOccurredDateAndTimeOfBM: {
          $gte: startDate.toDate(),
          $lte: endDate.toDate(),
        },
      };
    }

    const requestSheetData = await RequestSheetOfBM.aggregate([
      {
        $match: queryObj,
      },
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
          localField: "assignUser",
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
        $lookup: {
          from: "users",
          localField: "handOverUser",
          foreignField: "_id",
          as: "handoverUserDetails",
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
          assignUser: {
            $arrayElemAt: ["$namesOperators.tm_name", 0],
          },
          handOverUser: {
            $arrayElemAt: ["$handoverUserDetails.tm_name", 0],
          },
          handOverTime: "$maintenanceReportFilledByMTD.workEndedDateOfBM",
          work_order_status: 1,
          requestSheetStatus: 1,
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

    return res.status(200).json({
      message: "Request Sheet line based get successfully",
      totalRequestSheets: requestSheetData.length,
      requestSheetData,
    });
  } catch (error) {
    res.status(500).json({ message: error?.message, error: new Error(error) });
  }
});

// ---------------- Problem Category Pie Chart -------------------
router.get(
  "/getProblemCategoryPieChart/:filter/:selectedId",
  filterMiddleware,
  async (req, res, next) => {
    try {
      const problemCategoriesPieChart = await RequestSheetOfBM.aggregate([
        {
          $match: req.queryObj,
        },

        {
          $group: {
            _id: "$problemCategory",

            bdtime: { $sum: "$bdTime" },
            count: { $sum: 1 },
          },
        },

        {
          $group: {
            _id: null,
            labels: { $push: "$_id" },
            // target: { $push: "$value.target" },
            hours: {
              $push: "$bdtime",
            },
            count: {
              $push: "$count",
            },
          },
        },
      ]);
      return res.status(201).json({
        message: "Categories data in PieChart get successfully",

        problemCategoriesPieChart: problemCategoriesPieChart?.[0],
      });
    } catch (error) {
      res.status(500).json({ message: "error?.message, error" });
    }
  }
);

// ---------------- BD Category Pie Chart -------------------
router.get(
  "/getBdCategoryPieChart/:filter/:selectedId",
  filterMiddleware,
  async (req, res, next) => {
    try {
      const bdCategoryPieChart = await RequestSheetOfBM.aggregate([
        {
          $match: req.queryObj,
        },

        {
          $group: {
            _id: "$bdCategory",
            bdtime: { $sum: "$bdTime" },
            count: { $sum: 1 },
          },
        },

        {
          $group: {
            _id: null,
            labels: { $push: "$_id" },

            hours: {
              $push: "$bdtime",
            },
            count: {
              $push: "$count",
            },
          },
        },
      ]);

      return res.status(201).json({
        message: "Categories data in PieChart get successfully",
        bdCategoryPieChart: bdCategoryPieChart?.[0],
      });
    } catch (error) {
      res.status(500).json({ message: "error?.message, error" });
    }
  }
);

// ---------------- BD percentage Chart -------------------
router.get(
  "/getBdPercentage/:filter/:selectedId",
  filterMiddleware,
  async (req, res, next) => {
    try {
      const getBdPercentage = await RequestSheetOfBM.aggregate([
        {
          $match: req.queryObj,
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%m",
                date: "$problemOccurredDateAndTimeOfBM",
                timezone: timezone,
              },
            },

            bdHours: { $sum: "$bdTime" },
            totalProdHours: { $sum: "$prodTotal" },
            // percentage: {
            //   $multiply: [{ $divide: ["$bdHours", "$totalProdHours"] }, 100],
            // },
          },
        },
        {
          $project: {
            bdHours: 1,
            totalProdHours: 1,
            monthName: 1,
            percentage: {
              $multiply: [{ $divide: ["$bdHours", "$totalProdHours"] }, 100],
            },
          },
        },

        {
          $group: {
            _id: null,
            array: { $push: "$$ROOT" },
          },
        },
        {
          $project: {
            _id: 0,
            array: {
              $map: {
                input: allMonths,
                as: "month",
                in: {
                  $cond: [
                    { $in: ["$$month.monthInDecimal", "$array._id"] },
                    {
                      month: "$$month.monthName",
                      value: {
                        $arrayElemAt: [
                          "$array",
                          {
                            $indexOfArray: [
                              "$array._id",
                              "$$month.monthInDecimal",
                            ],
                          },
                        ],
                      },
                    },
                    {
                      month: "$$month.monthName",
                      value: {
                        _id: "$$month.monthInDecimal",
                        bdHours: 0,
                        totalProdHours: 0,
                        percentage: 0,
                        // target: 0,
                      },
                    },
                  ],
                },
              },
            },
          },
        },
        { $unwind: "$array" },
        {
          $replaceRoot: { newRoot: "$array" },
        },
        {
          $group: {
            _id: null,
            labels: { $push: "$month" },
            // target: { $push: "$value.target" },
            data: {
              $push: { $trunc: ["$value.percentage", 1] },
            },
          },
        },
      ]);

      return res.status(200).json({
        message: "BD percentage get successfully",

        getBdPercentage: getBdPercentage?.[0],
      });
    } catch (error) {
      res.status(500).json({ message: "error?.message, error" });
    }
  }
);

// ---------------- MTBF Chart -------------------

router.get(
  "/getMtbfData/:filter/:selectedId",
  filterMiddleware,
  async (req, res, next) => {
    try {
      const getMtbf = await RequestSheetOfBM.aggregate([
        {
          $match: req.queryObj,
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%m",
                date: "$problemOccurredDateAndTimeOfBM",
                timezone: timezone,
              },
            },
            count: { $sum: 1 },
            totalProd: { $sum: "$prodTotal" },
            totalBd: { $sum: "$bdTime" },
          },
        },
        {
          $project: {
            count: 1,
            hours: {
              $divide: [{ $subtract: ["$totalProd", "$totalBd"] }, "$count"],
            },
          },
        },
        {
          $group: {
            _id: null,
            array: { $push: "$$ROOT" },
          },
        },

        {
          $project: {
            _id: 0,
            array: {
              $map: {
                input: allMonths,
                as: "month",
                in: {
                  $cond: [
                    { $in: ["$$month.monthInDecimal", "$array._id"] },
                    {
                      month: "$$month.monthName",
                      value: {
                        $arrayElemAt: [
                          "$array",
                          {
                            $indexOfArray: [
                              "$array._id",
                              "$$month.monthInDecimal",
                            ],
                          },
                        ],
                      },
                    },
                    {
                      month: "$$month.monthName",
                      value: {
                        _id: "$$month.monthInDecimal",
                        count: 0,
                        hours: 0,
                      },
                    },
                  ],
                },
              },
            },
          },
        },
        { $unwind: "$array" },
        {
          $replaceRoot: { newRoot: "$array" },
        },
        {
          $group: {
            _id: null,
            labels: { $push: "$month" },

            data: {
              $push: { $trunc: ["$value.hours", 1] },
            },
          },
        },
      ]);

      return res.status(200).json({
        message: "MTBF data get successfully",

        getMtbf: getMtbf?.[0],
      });
    } catch (error) {
      res.status(500).json({ message: "error?.message, error" });
    }
  }
);

router.get("/getSectionsDropdownValue", async (req, res, next) => {
  try {
    const section = await Section.findOne({
      section_id: req?.rootUser?.section_data?.split("-")?.[0],
    });

    // req.section = section;

    let subSectionsData;

    if (section.dashboardLevel === "No") {
      subSectionsData = await SubSection.find({
        subSection_id: {
          $in: req.rootUser?.subSection_data?.map(
            (item) => item?.split("-")?.[0]
          ),
        },
      });
    } else {
      subSectionsData = await SubSection.find({
        section_names: section?._id,
      });

      // console.log(subSectionsData)
      const cellData = await Cell.find({
        subSection_names: { $in: subSectionsData },
      }).sort({ cell_sequence: 1 });
      req.cellData = cellData;
    }

    return res.status(201).json({
      message: "Sections dropdown data get successfully",
      subSectionsData,
    });
  } catch (error) {
    res.status(500).json({ message: error?.message, error });
  }
});

router.get("/getCellsDropdownValue", async (req, res, next) => {
  try {
    const section = await Section.findOne({
      section_id: req?.rootUser?.section_data?.split("-")?.[0],
    });

    req.section = section;

    let subSectionsData;

    if (section.dashboardLevel === "No") {
      subSectionsData = await SubSection.find({
        subSection_id: {
          $in: req.rootUser?.subSection_data?.map(
            (item) => item?.split("-")?.[0]
          ),
        },
      });
    } else {
      subSectionsData = await SubSection.find({
        section_names: section?._id,
      });
    }

    const cellData = await Cell.find({
      subSection_names: { $in: subSectionsData },
    }).sort({ cell_sequence: 1 });

    return res.status(201).json({
      message: "Cell dropdown value get successfully",
      cellData,
    });
  } catch (error) {
    res.status(500).json({ message: error?.message, error });
  }
});

// ---------------- Monthly BD Trend Chart -------------------

router.get(
  "/hourlyMonthlyBdTrendForPlant",
  // BdTrendFilterMiddleware,
  async (req, res, next) => {
    try {
      let queryObj = {
        "preAggregationTimeStampOfRequestSheet.requestSheet_year":
          req.query?.selectedYear,
      };

      const plant = await Plant.findOne({
        plant_id: req?.rootUser?.plant_data?.split("-")?.[0],
      });

      queryObj = {
        ...queryObj,
        plantRef: mongoose.Types.ObjectId(plant._id),
      };

      const bdTrendData = await RequestSheetOfBM.aggregate([
        {
          $match: queryObj,
        },

        {
          $group: {
            _id: {
              $dateToString: {
                format: "%m",
                date: "$problemOccurredDateAndTimeOfBM",
                timezone: timezone,
              },
            },

            lessThanOne: {
              $sum: {
                $cond: [{ $lte: ["$bdTime", 1] }, "$bdTime", 0],
              },
            },
            lessThanTwo: {
              $sum: {
                $cond: [{ $lte: ["$bdTime", 2] }, "$bdTime", 0],
              },
            },
            greaterThanTwo: {
              $sum: {
                $cond: [{ $gt: ["$bdTime", 2] }, "$bdTime", 0],
              },
            },
          },
        },

        {
          $group: {
            _id: null,
            array: { $push: "$$ROOT" },
          },
        },

        {
          $project: {
            _id: 0,
            array: {
              $map: {
                input: allMonths,
                as: "month",
                in: {
                  $cond: [
                    { $in: ["$$month.monthInDecimal", "$array._id"] },
                    {
                      month: "$$month.monthName",
                      value: {
                        $arrayElemAt: [
                          "$array",
                          {
                            $indexOfArray: [
                              "$array._id",
                              "$$month.monthInDecimal",
                            ],
                          },
                        ],
                      },
                    },
                    {
                      month: "$$month.monthName",
                      value: {
                        _id: "$$month.monthInDecimal",
                        lessThanOne: 0,
                        lessThanTwo: 0,
                        greaterThanTwo: 0,
                      },
                    },
                  ],
                },
              },
            },
          },
        },
        { $unwind: "$array" },
        {
          $replaceRoot: { newRoot: "$array" },
        },

        {
          $group: {
            _id: null,

            // labels: { $push: "$month" },
            // target: { $push: "$value.target" },
            lessThanOne: {
              $push: "$value.lessThanOne",
            },
            lessThanTwo: {
              $push: "$value.lessThanTwo",
            },
            greaterThanTwo: {
              $push: "$value.greaterThanTwo",
            },
          },
        },

        {
          $project: {
            _id: 0,
            hourlyArray: {
              $map: {
                input: ["<1", "<2", ">2"],
                as: "label",
                in: {
                  label: "$$label",
                  data: {
                    $switch: {
                      branches: [
                        {
                          case: { $eq: ["$$label", "<1"] },
                          then: "$lessThanOne",
                        },
                        {
                          case: { $eq: ["$$label", "<2"] },
                          then: "$lessThanTwo",
                        },
                        {
                          case: { $eq: ["$$label", ">2"] },
                          then: "$greaterThanTwo",
                        },
                      ],
                      default: [],
                    },
                  },
                },
              },
            },
          },
        },
      ]);

      return res.status(200).json({
        message: "PlantWise Monthly BD trend data get successfully",
        bdTrendData: bdTrendData?.[0].hourlyArray,

        // hourlyArray: [
        //   { label: "<1", data: bdTrendData[0]?.lessThanOne },
        //   { label: "<2", data: bdTrendData[0]?.lessThanTwo },
        //   { label: ">2", data: bdTrendData[0]?.greaterThanTwo },
        // ],
      });
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/sectionMonthlyBdTrendForPlant",
  // BdTrendFilterMiddleware,
  async (req, res, next) => {
    try {
      let dateObj = {
        $dateToString: {
          format: "%m",
          date: "$problemOccurredDateAndTimeOfBM",
          timezone: timezone,
        },
      };
      let queryObj = {
        "preAggregationTimeStampOfRequestSheet.requestSheet_year":
          req.query?.selectedYear,
      };

      const plant = await Plant.findOne({
        plant_id: req?.rootUser?.plant_data?.split("-")?.[0],
      });

      queryObj = {
        ...queryObj,
        plantRef: mongoose.Types.ObjectId(plant._id),
      };

      const bdTrendData = await RequestSheetOfBM.aggregate([
        {
          $match: queryObj,
        },
        {
          $lookup: {
            from: "subsections",
            localField: "subSectionRef",
            foreignField: "_id",
            as: "section_data",
          },
        },

        {
          $unwind: "$section_data",
        },
        {
          $group: {
            _id: {
              date: dateObj,
              sectionRef: "$section_data.subSection_name",
            },
            bdTimeSum: { $sum: "$bdTime" },
          },
        },

        {
          $group: {
            _id: "$_id.sectionRef",
            label: { $first: "$_id.sectionRef" },
            sectionWiseTotal: {
              $push: {
                month: "$_id.date",
                bdTimeSum: "$bdTimeSum",
              },
            },
          },
        },
        {
          $sort: { _id: 1 },
        },

        {
          $project: {
            _id: 0,
            label: 1,
            data: {
              $map: {
                input: allMonths,
                as: "month",
                in: {
                  $cond: [
                    {
                      $in: [
                        "$$month.monthInDecimal",
                        "$sectionWiseTotal.month",
                      ],
                    },
                    {
                      $arrayElemAt: [
                        "$sectionWiseTotal.bdTimeSum",
                        {
                          $indexOfArray: [
                            "$sectionWiseTotal.month",
                            "$$month.monthInDecimal",
                          ],
                        },
                      ],
                    },
                    0,
                  ],
                },
              },
            },
          },
        },
      ]);

      return res.status(200).json({
        message: "PlantWise Monthly BD trend data for Section get successfully",

        bdTrendData,
      });
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/hourlyMonthlyBdTrendForSection/:filter/:selectedId",

  filterMiddleware,

  async (req, res, next) => {
    try {
      const bdTrendData = await RequestSheetOfBM.aggregate([
        {
          $match: req.queryObj,
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%m",
                date: "$problemOccurredDateAndTimeOfBM",
                timezone: timezone,
              },
            },

            lessThanOne: {
              $sum: {
                $cond: [{ $lte: ["$bdTime", 1] }, "$bdTime", 0],
              },
            },
            lessThanTwo: {
              $sum: {
                $cond: [{ $lte: ["$bdTime", 2] }, "$bdTime", 0],
              },
            },
            greaterThanTwo: {
              $sum: {
                $cond: [{ $gt: ["$bdTime", 2] }, "$bdTime", 0],
              },
            },
          },
        },

        {
          $group: {
            _id: null,
            array: { $push: "$$ROOT" },
          },
        },

        {
          $project: {
            _id: 0,
            array: {
              $map: {
                input: allMonths,
                as: "month",
                in: {
                  $cond: [
                    { $in: ["$$month.monthInDecimal", "$array._id"] },
                    {
                      month: "$$month.monthName",
                      value: {
                        $arrayElemAt: [
                          "$array",
                          {
                            $indexOfArray: [
                              "$array._id",
                              "$$month.monthInDecimal",
                            ],
                          },
                        ],
                      },
                    },
                    {
                      month: "$$month.monthName",
                      value: {
                        _id: "$$month.monthInDecimal",
                        lessThanOne: 0,
                        lessThanTwo: 0,
                        greaterThanTwo: 0,
                      },
                    },
                  ],
                },
              },
            },
          },
        },
        { $unwind: "$array" },
        {
          $replaceRoot: { newRoot: "$array" },
        },
        {
          $group: {
            _id: null,
            labels: { $push: "$month" },
            // target: { $push: "$value.target" },
            lessThanOne: {
              $push: "$value.lessThanOne",
            },
            lessThanTwo: {
              $push: "$value.lessThanTwo",
            },
            greaterThanTwo: {
              $push: "$value.greaterThanTwo",
            },
          },
        },

        {
          $project: {
            _id: 0,
            hourlyArray: {
              $map: {
                input: ["<1", "<2", ">2"],
                as: "label",
                in: {
                  label: "$$label",
                  data: {
                    $switch: {
                      branches: [
                        {
                          case: { $eq: ["$$label", "<1"] },
                          then: "$lessThanOne",
                        },
                        {
                          case: { $eq: ["$$label", "<2"] },
                          then: "$lessThanTwo",
                        },
                        {
                          case: { $eq: ["$$label", ">2"] },
                          then: "$greaterThanTwo",
                        },
                      ],
                      default: [],
                    },
                  },
                },
              },
            },
          },
        },
      ]);

      return res.status(200).json({
        message:
          "Section Wise Monthly BD trend data for hourly get successfully",
        bdTrendData: bdTrendData?.[0].hourlyArray,
      });
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/cellMonthlyBdTrendForSection/:filter/:selectedId",

  filterMiddleware,
  async (req, res, next) => {
    try {
      let dateObj = {
        $dateToString: {
          format: "%m",
          date: "$problemOccurredDateAndTimeOfBM",
          timezone: timezone,
        },
      };

      const bdTrendData = await RequestSheetOfBM.aggregate([
        {
          $match: req.queryObj,
        },
        {
          $lookup: {
            from: "cells",
            localField: "cellRef",
            foreignField: "_id",
            as: "cell_data",
          },
        },

        {
          $unwind: "$cell_data",
        },
        {
          $group: {
            _id: {
              date: dateObj,
              cellRef: "$cell_data.cell_name",
            },
            bdTimeSum: { $sum: "$bdTime" },
          },
        },

        {
          $group: {
            _id: "$_id.cellRef",
            label: { $first: "$_id.cellRef" },
            cellWiseTotal: {
              $push: {
                month: "$_id.date",
                bdTimeSum: "$bdTimeSum",
              },
            },
          },
        },
        {
          $sort: { _id: 1 },
        },

        {
          $project: {
            _id: 0,
            label: 1,
            data: {
              $map: {
                input: allMonths,
                as: "month",
                in: {
                  $cond: [
                    { $in: ["$$month.monthInDecimal", "$cellWiseTotal.month"] },
                    {
                      $arrayElemAt: [
                        "$cellWiseTotal.bdTimeSum",
                        {
                          $indexOfArray: [
                            "$cellWiseTotal.month",
                            "$$month.monthInDecimal",
                          ],
                        },
                      ],
                    },
                    0,
                  ],
                },
              },
            },
          },
        },
      ]);

      return res.status(200).json({
        message: "Section Wise Monthly BD trend data for cell get successfully",

        bdTrendData,
      });
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  }
);

// ---------------- Yearly BD Trend Chart -------------------

router.get(
  "/hourlyYearlyBdTrendForPlant",
  // BdTrendFilterMiddleware,
  async (req, res, next) => {
    try {
      let queryObj = {
        "preAggregationTimeStampOfRequestSheet.requestSheet_year":
          req.query?.selectedYear,
      };

      const plant = await Plant.findOne({
        plant_id: req?.rootUser?.plant_data?.split("-")?.[0],
      });

      queryObj = {
        ...queryObj,
        plantRef: mongoose.Types.ObjectId(plant._id),
      };
      const dumPrevYear = req.query.selectedYear?.split("-")?.[0];
      const dumPrevYear2 = req.query.selectedYear?.split("-")?.[1];

      const bdTrendData = await RequestSheetOfBM.aggregate([
        {
          $match: queryObj,
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y",
                date: "$problemOccurredDateAndTimeOfBM",
                timezone: timezone,
              },
            },

            lessThanOne: {
              $sum: {
                $cond: [{ $lte: ["$bdTime", 1] }, "$bdTime", 0],
              },
            },
            lessThanTwo: {
              $sum: {
                $cond: [{ $lte: ["$bdTime", 2] }, "$bdTime", 0],
              },
            },
            greaterThanTwo: {
              $sum: {
                $cond: [{ $gt: ["$bdTime", 2] }, "$bdTime", 0],
              },
            },
          },
        },

        {
          $sort: { _id: 1 },
        },

        {
          $group: {
            _id: null,
            data: {
              $push: {
                year: "$_id",
                lessThanOne: "$lessThanOne",
                lessThanTwo: "$lessThanTwo",
                greaterThanTwo: "$greaterThanTwo",
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            hourlyArray: {
              $map: {
                input: ["<1", "<2", ">2"],
                as: "label",
                in: {
                  label: "$$label",
                  data: {
                    $map: {
                      input: "$data",
                      as: "item",
                      in: {
                        $switch: {
                          branches: [
                            {
                              case: { $eq: ["$$label", "<1"] },
                              then: "$$item.lessThanOne",
                            },
                            {
                              case: { $eq: ["$$label", "<2"] },
                              then: "$$item.lessThanTwo",
                            },
                            {
                              case: { $eq: ["$$label", ">2"] },
                              then: "$$item.greaterThanTwo",
                            },
                          ],
                          default: [],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ]);

      return res.status(200).json({
        message: "Plant Wise Yearly BD trend data get successfully",
        labels: [dumPrevYear, dumPrevYear2],
        bdTrendData: bdTrendData?.[0].hourlyArray,
      });
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/sectionYearlyBdTrendForPlant",
  // BdTrendFilterMiddleware,
  async (req, res, next) => {
    try {
      let dateObj = {
        $dateToString: {
          format: "%Y",
          date: "$problemOccurredDateAndTimeOfBM",
          timezone: timezone,
        },
      };

      let queryObj = {
        "preAggregationTimeStampOfRequestSheet.requestSheet_year":
          req.query?.selectedYear,
      };

      const plant = await Plant.findOne({
        plant_id: req?.rootUser?.plant_data?.split("-")?.[0],
      });

      queryObj = {
        ...queryObj,
        plantRef: mongoose.Types.ObjectId(plant._id),
      };
      const dumPrevYear = req.query.selectedYear?.split("-")?.[0];
      const dumPrevYear2 = req.query.selectedYear?.split("-")?.[1];

      const bdTrendData = await RequestSheetOfBM.aggregate([
        {
          $match: queryObj,
        },

        {
          $lookup: {
            from: "subsections",
            localField: "subSectionRef",
            foreignField: "_id",
            as: "section_data",
          },
        },

        {
          $unwind: "$section_data",
        },
        {
          $group: {
            _id: {
              date: dateObj,
              sectionRef: "$section_data.subSection_name",
            },
            bdTimeSum: { $sum: "$bdTime" },
          },
        },

        {
          $group: {
            _id: "$_id.sectionRef",
            label: { $first: "$_id.sectionRef" },
            sectionWiseTotal: {
              $push: {
                year: "$_id.date",
                bdTimeSum: "$bdTimeSum",
              },
            },
          },
        },
        // {
        //   $sort: { _id: 1 },
        // },
        {
          $group: {
            _id: "$_id",
            data: {
              $push: {
                year: "$sectionWiseTotal.year",
                dataSum: "$sectionWiseTotal.bdTimeSum",
              },
            },
          },
        },
        {
          $sort: { _id: 1 },
        },
        {
          $unwind: "$data",
        },
        {
          $project: {
            _id: 0,
            label: "$_id",
            data: {
              $map: {
                input: [dumPrevYear, dumPrevYear2],
                as: "year",
                in: {
                  year: "$$year",
                  dataSum: {
                    $cond: [
                      { $in: ["$$year", "$data.year"] },
                      {
                        $arrayElemAt: [
                          "$data.dataSum",
                          {
                            $indexOfArray: ["$data.year", "$$year"],
                          },
                        ],
                      },
                      null,
                    ],
                  },
                },
              },
            },
          },
        },

        {
          $project: {
            _id: 0,
            label: 1,
            data: "$data.dataSum",
          },
        },
        {
          $sort: { label: 1 },
        },
      ]);
      return res.status(201).json({
        message: "Plant Wise Yearly BD trend data get successfully",
        labels: [dumPrevYear, dumPrevYear2],

        bdTrendData,
      });
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/hourlyYearlyBdTrendForSection/:filter/:selectedId",
  filterMiddleware,
  async (req, res, next) => {
    try {
      const dumPrevYear = req.query.selectedYear?.split("-")?.[0];
      const dumPrevYear2 = req.query.selectedYear?.split("-")?.[1];

      const bdTrendData = await RequestSheetOfBM.aggregate([
        {
          $match: req.queryObj,
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y",
                date: "$problemOccurredDateAndTimeOfBM",
                timezone: timezone,
              },
            },

            lessThanOne: {
              $sum: {
                $cond: [{ $lte: ["$bdTime", 1] }, "$bdTime", 0],
              },
            },
            lessThanTwo: {
              $sum: {
                $cond: [{ $lte: ["$bdTime", 2] }, "$bdTime", 0],
              },
            },
            greaterThanTwo: {
              $sum: {
                $cond: [{ $gt: ["$bdTime", 2] }, "$bdTime", 0],
              },
            },
          },
        },

        {
          $sort: { _id: 1 },
        },

        {
          $group: {
            _id: null,
            data: {
              $push: {
                year: "$_id",
                lessThanOne: "$lessThanOne",
                lessThanTwo: "$lessThanTwo",
                greaterThanTwo: "$greaterThanTwo",
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            hourlyArray: {
              $map: {
                input: ["<1", "<2", ">2"],
                as: "label",
                in: {
                  label: "$$label",
                  data: {
                    $map: {
                      input: "$data",
                      as: "item",
                      in: {
                        $switch: {
                          branches: [
                            {
                              case: { $eq: ["$$label", "<1"] },
                              then: "$$item.lessThanOne",
                            },
                            {
                              case: { $eq: ["$$label", "<2"] },
                              then: "$$item.lessThanTwo",
                            },
                            {
                              case: { $eq: ["$$label", ">2"] },
                              then: "$$item.greaterThanTwo",
                            },
                          ],
                          default: [],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ]);

      return res.status(200).json({
        message: "Section Wise Yearly BD trend data get successfully",
        labels: [dumPrevYear, dumPrevYear2],
        bdTrendData: bdTrendData?.[0].hourlyArray,
      });
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/cellYearlyBdTrendForSection/:filter/:selectedId",
  filterMiddleware,
  async (req, res, next) => {
    try {
      const dumPrevYear = req.query.selectedYear?.split("-")?.[0];
      const dumPrevYear2 = req.query.selectedYear?.split("-")?.[1];

      let dateObj = {
        $dateToString: {
          format: "%Y",
          date: "$problemOccurredDateAndTimeOfBM",
          timezone: timezone,
        },
      };

      const bdTrendData = await RequestSheetOfBM.aggregate([
        {
          $match: req.queryObj,
        },
        {
          $lookup: {
            from: "cells",
            localField: "cellRef",
            foreignField: "_id",
            as: "cell_data",
          },
        },

        {
          $unwind: "$cell_data",
        },
        {
          $group: {
            _id: {
              date: dateObj,
              cellRef: "$cell_data.cell_name",
            },
            bdTimeSum: { $sum: "$bdTime" },
          },
        },

        {
          $group: {
            _id: "$_id.cellRef",
            cellWiseTotal: {
              $push: {
                year: "$_id.date",
                bdTimeSum: "$bdTimeSum",
              },
            },
          },
        },
        // {
        //   $sort: { _id: 1 },
        // },
        {
          $group: {
            _id: "$_id",
            data: {
              $push: {
                year: "$cellWiseTotal.year",
                dataSum: "$cellWiseTotal.bdTimeSum",
              },
            },
          },
        },
        {
          $sort: { _id: 1 },
        },
        {
          $unwind: "$data",
        },
        {
          $project: {
            _id: 0,
            label: "$_id",
            data: {
              $map: {
                input: [dumPrevYear, dumPrevYear2],
                as: "year",
                in: {
                  year: "$$year",
                  dataSum: {
                    $cond: [
                      { $in: ["$$year", "$data.year"] },
                      {
                        $arrayElemAt: [
                          "$data.dataSum",
                          {
                            $indexOfArray: ["$data.year", "$$year"],
                          },
                        ],
                      },
                      null,
                    ],
                  },
                },
              },
            },
          },
        },

        {
          $project: {
            _id: 0,
            label: 1,
            data: "$data.dataSum",
          },
        },
        {
          $sort: { label: 1 },
        },
      ]);
      return res.status(200).json({
        message: "Section Wise Yearly BD trend data get successfully",
        labels: [dumPrevYear, dumPrevYear2],
        bdTrendData,
      });
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  }
);

// ---------------- Major BD Count Chart -------------------

router.get(
  "/majorBDCountForPlant",
  // BdTrendFilterMiddleware,
  async (req, res, next) => {
    try {
      let dateObj = {
        $dateToString: {
          format: "%m",
          date: "$problemOccurredDateAndTimeOfBM",
          timezone: timezone,
        },
      };

      let queryObj = {
        "preAggregationTimeStampOfRequestSheet.requestSheet_year":
          req.query?.selectedYear,
      };

      const plant = await Plant.findOne({
        plant_id: req?.rootUser?.plant_data?.split("-")?.[0],
      });

      queryObj = {
        ...queryObj,
        plantRef: mongoose.Types.ObjectId(plant._id),
      };

      const bdTrendData = await RequestSheetOfBM.aggregate([
        {
          $match: queryObj,
        },
        {
          $lookup: {
            from: "subsections",
            localField: "subSectionRef",
            foreignField: "_id",
            as: "section_data",
          },
        },

        {
          $unwind: "$section_data",
        },
        {
          $group: {
            _id: {
              date: dateObj,

              sectionRef: "$section_data.subSection_name",
            },

            count: { $sum: 1 },
            // bdTimeSum: { $sum: "$bdTime" },
          },
        },
        {
          $group: {
            _id: "$_id.sectionRef",
            label: { $first: "$_id.sectionRef" },
            sectionWiseTotal: {
              $push: {
                month: "$_id.date",
                mbdCount: "$count",
              },
            },
          },
        },
        {
          $sort: { _id: 1 },
        },

        {
          $project: {
            _id: 0,
            label: 1,
            data: {
              $map: {
                input: allMonths,
                as: "month",
                in: {
                  $cond: [
                    {
                      $in: [
                        "$$month.monthInDecimal",
                        "$sectionWiseTotal.month",
                      ],
                    },
                    {
                      $arrayElemAt: [
                        "$sectionWiseTotal.mbdCount",
                        {
                          $indexOfArray: [
                            "$sectionWiseTotal.month",
                            "$$month.monthInDecimal",
                          ],
                        },
                      ],
                    },
                    0,
                  ],
                },
              },
            },
          },
        },

        // {
        //   $group: {
        //     _id: null,
        //     labels: { $push: "$_id" },
        //     // target: { $push: "$value.target" },
        //     data:  {$push : "$data"},

        //   },
        // },
      ]);

      return res.status(200).json({
        message: "Mbd Count data get successfully",

        bdTrendData,
      });
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/majorBDCountForSection/:filter/:selectedId",
  filterMiddleware,
  async (req, res, next) => {
    try {
      let dateObj = {
        $dateToString: {
          format: "%m",
          date: "$problemOccurredDateAndTimeOfBM",
          timezone: timezone,
        },
      };

      const bdTrendData = await RequestSheetOfBM.aggregate([
        {
          $match: req.queryObj,
        },
        {
          $lookup: {
            from: "cells",
            localField: "cellRef",
            foreignField: "_id",
            as: "cell_data",
          },
        },

        {
          $unwind: "$cell_data",
        },
        {
          $group: {
            _id: {
              date: dateObj,

              cellRef: "$cell_data.cell_name",
            },

            count: { $sum: 1 },
            // bdTimeSum: { $sum: "$bdTime" },
          },
        },
        {
          $group: {
            _id: "$_id.cellRef",
            label: { $first: "$_id.cellRef" },
            cellWiseTotal: {
              $push: {
                month: "$_id.date",
                mbdCount: "$count",
              },
            },
          },
        },
        {
          $sort: { _id: 1 },
        },

        {
          $project: {
            _id: 0,
            label: 1,
            data: {
              $map: {
                input: allMonths,
                as: "month",
                in: {
                  $cond: [
                    { $in: ["$$month.monthInDecimal", "$cellWiseTotal.month"] },
                    {
                      $arrayElemAt: [
                        "$cellWiseTotal.mbdCount",
                        {
                          $indexOfArray: [
                            "$cellWiseTotal.month",
                            "$$month.monthInDecimal",
                          ],
                        },
                      ],
                    },
                    0,
                  ],
                },
              },
            },
          },
        },
      ]);

      return res.status(200).json({
        message: "Mbd Count data get successfully",

        bdTrendData,
      });
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  }
);

// ---------------- LineWise BD Contribution Charts -------------------

router.get(
  "/lineWiseBdContributionForPlant",
  // BdTrendFilterMiddleware,
  async (req, res, next) => {
    try {
      let queryObj = {
        "preAggregationTimeStampOfRequestSheet.requestSheet_year":
          req.query?.selectedYear,
      };

      if (req.query?.selectedMonth) {
        queryObj = {
          ...queryObj,
          "preAggregationTimeStampOfRequestSheet.requestSheet_month":
            req.query?.selectedMonth,
        };
      }

      const plant = await Plant.findOne({
        plant_id: req?.rootUser?.plant_data?.split("-")?.[0],
      });

      queryObj = {
        ...queryObj,
        plantRef: mongoose.Types.ObjectId(plant._id),
      };

      const lineWiseBDData = await RequestSheetOfBM.aggregate([
        {
          $match: queryObj,
        },
        {
          $lookup: {
            from: "lines",
            localField: "lineRef",
            foreignField: "_id",
            as: "line_data",
          },
        },
        {
          $unwind: "$line_data",
        },
        {
          $group: {
            _id: "$line_data.line_name",
            // totalBdTime: { $sum: "$bdTime" },
            bdHoursLineWise: {
              $sum: "$bdTime",
            },
          },
        },
        {
          $group: {
            _id: null,
            totalBdTime: { $sum: "$bdHoursLineWise" },
            lineData: {
              $push: {
                line_name: "$_id",
                bdHoursLineWise: "$bdHoursLineWise",
              },
            },
          },
        },
        {
          $unwind: "$lineData",
        },
        {
          $project: {
            _id: "$lineData.line_name",
            totalBdTime: 1,
            bdHours: "$lineData.bdHoursLineWise",
            percentage: {
              $multiply: [
                {
                  $divide: ["$lineData.bdHoursLineWise", "$totalBdTime"],
                },
                100,
              ],
            },
          },
        },
        {
          $sort: {
            percentage: -1,
          },
        },

        {
          $group: {
            _id: null,

            lineNames: { $push: "$_id" },
            bdHours: { $push: "$bdHours" },
            percentages: { $push: { $trunc: ["$percentage", 1] } },
          },
        },
      ]);
      return res.status(200).json({
        message: "LineWise Bd contribution for Plant get successfully",
        lineWiseBDData,
      });
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/lineWiseBdContributionForSection/:filter/:selectedId",
  filterMiddleware,
  async (req, res, next) => {
    try {
      const lineWiseBDData = await RequestSheetOfBM.aggregate([
        {
          $match: req.queryObj,
        },

        {
          $lookup: {
            from: "lines",
            localField: "lineRef",
            foreignField: "_id",
            as: "line_data",
          },
        },
        {
          $unwind: "$line_data",
        },
        {
          $group: {
            _id: "$line_data.line_name",
            // totalBdTime: { $sum: "$bdTime" },
            bdHoursLineWise: {
              $sum: "$bdTime",
            },
          },
        },
        {
          $group: {
            _id: null,
            totalBdTime: { $sum: "$bdHoursLineWise" },
            lineData: {
              $push: {
                line_name: "$_id",
                bdHoursLineWise: "$bdHoursLineWise",
              },
            },
          },
        },
        {
          $unwind: "$lineData",
        },
        {
          $project: {
            _id: "$lineData.line_name",
            // totalBdTime: 1,
            bdHours: "$lineData.bdHoursLineWise",
            percentage: {
              $multiply: [
                {
                  $divide: ["$lineData.bdHoursLineWise", "$totalBdTime"],
                },
                100,
              ],
            },
          },
        },
        {
          $sort: {
            percentage: -1,
          },
        },

        {
          $group: {
            _id: "$totalBdTime",
            lineNames: { $push: "$_id" },
            bdHours: { $push: "$bdHours" },
            percentages: { $push: { $trunc: ["$percentage", 1] } },
          },
        },
      ]);

      return res.status(200).json({
        message: "LineWise Bd contribution for Section get successfully",
        lineWiseBDData,
      });
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/lineWiseBdContributionForCell/:filter/:selectedId",
  filterMiddleware,

  async (req, res, next) => {
    try {
      console.log(req.queryObj);
      const lineWiseBDData = await RequestSheetOfBM.aggregate([
        {
          $match: req.queryObj,
        },

        {
          $lookup: {
            from: "lines",
            localField: "lineRef",
            foreignField: "_id",
            as: "line_data",
          },
        },

        {
          $unwind: "$line_data",
        },
        {
          $group: {
            _id: "$line_data.line_name",
            // totalBdTime: { $sum: "$bdTime" },
            bdHoursLineWise: {
              $sum: "$bdTime",
            },
          },
        },
        {
          $group: {
            _id: null,
            totalBdTime: { $sum: "$bdHoursLineWise" },
            lineData: {
              $push: {
                line_name: "$_id",
                bdHoursLineWise: "$bdHoursLineWise",
              },
            },
          },
        },
        {
          $unwind: "$lineData",
        },
        {
          $project: {
            _id: "$lineData.line_name",
            // totalBdTime: 1,
            bdHours: "$lineData.bdHoursLineWise",
            percentage: {
              $multiply: [
                {
                  $divide: ["$lineData.bdHoursLineWise", "$totalBdTime"],
                },
                100,
              ],
            },
          },
        },
        {
          $sort: {
            percentage: -1,
          },
        },

        {
          $group: {
            _id: null,

            lineNames: { $push: "$_id" },
            bdHours: { $push: "$bdHours" },
            percentages: { $push: { $trunc: ["$percentage", 1] } },
          },
        },
      ]);

      return res.status(200).json({
        message: "LineWise Bd contribution for Cell get successfully",
        lineWiseBDData,
      });
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get("/getHistoryCard/:machineId", async (req, res, next) => {
  try {
    let queryObj = {};

    queryObj = {
      machineRef: mongoose.Types.ObjectId(req.params.machineId),

      // problemOccurredDateAndTimeOfBM: {
      //   $gte: moment().startOf("year").toDate(),
      //   $lt: moment().startOf("year").add(1, "year").toDate(),
      // },
    };

    const historyCard = await RequestSheetOfBM.aggregate([
      { $match: queryObj },
      {
        $facet: {
          bdTime: [
            {
              $group: {
                _id: null,

                totalBd: { $sum: "$bdTime" },
              },
            },
            {
              $project: {
                _id: 0,
                totalBd: 1,
              },
            },
          ],

          bdCount: [
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
              },
            },
            {
              $project: {
                _id: 0,
                count: 1,
              },
            },
          ],

          mttrData: [
            {
              $group: {
                _id: null,
                mttr: {
                  $sum: {
                    $cond: [
                      {
                        $gt: [
                          "$maintenanceReportFilledByMTD.workEndedDateOfBM",
                          null,
                        ],
                      },
                      {
                        $divide: [
                          "$maintenanceReportFilledByMTD.breakDownTime",
                          60,
                        ],
                      },
                      0,
                    ],
                  },
                },
              },
            },
            {
              $project: {
                _id: 0,
                mttr: 1,
              },
            },
          ],

          mtbf: [
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                totalProd: { $sum: "$prodTotal" },
                totalBd: { $sum: "$bdTime" },
              },
            },
            {
              $project: {
                count: 1,
                days: {
                  $divide: [
                    {
                      $divide: [
                        { $subtract: ["$totalProd", "$totalBd"] },
                        "$count",
                      ],
                    },
                    24,
                  ],
                },
              },
            },

            {
              $project: {
                _id: 0,
                days: 1,
              },
            },
          ],

          bdHourTrend: [
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%m",
                    date: "$problemOccurredDateAndTimeOfBM",
                    timezone: timezone,
                  },
                },

                lessThanOne: {
                  $sum: {
                    $cond: [{ $lte: ["$bdTime", 1] }, "$bdTime", 0],
                  },
                },
                lessThanTwo: {
                  $sum: {
                    $cond: [{ $lte: ["$bdTime", 2] }, "$bdTime", 0],
                  },
                },
                greaterThanTwo: {
                  $sum: {
                    $cond: [{ $gt: ["$bdTime", 2] }, "$bdTime", 0],
                  },
                },
              },
            },

            {
              $group: {
                _id: null,
                array: { $push: "$$ROOT" },
              },
            },

            {
              $project: {
                _id: 0,
                array: {
                  $map: {
                    input: allMonths,
                    as: "month",
                    in: {
                      $cond: [
                        { $in: ["$$month.monthInDecimal", "$array._id"] },
                        {
                          month: "$$month.monthName",
                          value: {
                            $arrayElemAt: [
                              "$array",
                              {
                                $indexOfArray: [
                                  "$array._id",
                                  "$$month.monthInDecimal",
                                ],
                              },
                            ],
                          },
                        },
                        {
                          month: "$$month.monthName",
                          value: {
                            _id: "$$month.monthInDecimal",
                            lessThanOne: 0,
                            lessThanTwo: 0,
                            greaterThanTwo: 0,
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
            { $unwind: "$array" },
            {
              $replaceRoot: { newRoot: "$array" },
            },

            {
              $group: {
                _id: null,

                // labels: { $push: "$month" },
                // target: { $push: "$value.target" },
                lessThanOne: {
                  $push: "$value.lessThanOne",
                },
                lessThanTwo: {
                  $push: "$value.lessThanTwo",
                },
                greaterThanTwo: {
                  $push: "$value.greaterThanTwo",
                },
              },
            },

            {
              $project: {
                _id: 0,
                hourlyArray: {
                  $map: {
                    input: ["<1", "<2", ">2"],
                    as: "label",
                    in: {
                      label: "$$label",
                      data: {
                        $switch: {
                          branches: [
                            {
                              case: { $eq: ["$$label", "<1"] },
                              then: "$lessThanOne",
                            },
                            {
                              case: { $eq: ["$$label", "<2"] },
                              then: "$lessThanTwo",
                            },
                            {
                              case: { $eq: ["$$label", ">2"] },
                              then: "$greaterThanTwo",
                            },
                          ],
                          default: [],
                        },
                      },
                    },
                  },
                },
              },
            },
          ],
        },
      },
    ]);
    return res.status(201).json({
      message: "History Card data get successfully",

      bdTime: historyCard?.[0].bdTime,
      bdCount: historyCard?.[0].bdCount,
      mttrData: historyCard?.[0].mttrData,
      mtbf: historyCard?.[0].mtbf,
      bdHourTrend: historyCard?.[0].bdHourTrend[0].hourlyArray,
    });
  } catch (error) {
    res.status(500).json({ message: error?.message, error });
  }
});

const filterSummary = async (req, res, next) => {
  try {
    let queryObj = {
      machineRef: mongoose.Types.ObjectId(req.params.machineId),
    };

    if (req.params?.filter === "based-on-section") {
      queryObj = {
        ...queryObj,
        sectionRef: mongoose.Types.ObjectId(req.params?.selectedId),
      };
    } else if (req.params?.filter === "based-on-subSection") {
      queryObj = {
        ...queryObj,
        subSectionRef: mongoose.Types.ObjectId(req.params?.selectedId),
      };
    } else if (req.params?.filter === "based-on-cell") {
      queryObj = {
        ...queryObj,
        cellRef: mongoose.Types.ObjectId(req.params?.selectedId),
        // "maintenanceReportFilledByMTD.workEndedDateOfBM": { $ne: null },
      };
    } else {
      queryObj = {
        ...queryObj,
        lineRef: mongoose.Types.ObjectId(req.params?.selectedId),
        // "maintenanceReportFilledByMTD.workEndedDateOfBM": { $ne: null },
      };
    }

    req.queryObj = queryObj;
    next();
  } catch (error) {
    res.status(500).json({ message: error?.message, error });
  }
};

router.get(
  "/getSummaryCard/:filter/:selectedId/:machineId",
  filterSummary,
  async (req, res, next) => {
    let dateObj = {
      $dateToString: {
        format: "%m",
        date: "$problemOccurredDateAndTimeOfBM",
        timezone: timezone,
      },
    };
    try {
      const summaryCard = await RequestSheetOfBM.aggregate([
        { $match: req.queryObj },

        {
          $lookup: {
            from: "cells",
            localField: "cellRef",
            foreignField: "_id",
            as: "cell_data",
          },
        },

        {
          $unwind: "$cell_data",
        },

        {
          $facet: {
            bdTime: [
              {
                $group: {
                  _id: "$cell_data.cell_name",

                  totalBd: { $sum: "$bdTime" },
                },
              },
            ],
            bdCount: [
              {
                $group: {
                  _id: "$cell_data.cell_name",
                  count: { $sum: 1 },
                },
              },
            ],

            mttrData: [
              {
                $group: {
                  _id: "$cell_data.cell_name",
                  mttr: {
                    $sum: {
                      $cond: [
                        {
                          $gt: [
                            "$maintenanceReportFilledByMTD.workEndedDateOfBM",
                            null,
                          ],
                        },
                        {
                          $divide: [
                            "$maintenanceReportFilledByMTD.breakDownTime",
                            60,
                          ],
                        },
                        0,
                      ],
                    },
                  },
                },
              },
            ],

            mtbfData: [
              {
                $group: {
                  _id: "$cell_data.cell_name",

                  count: { $sum: 1 },
                  totalProd: { $sum: "$prodTotal" },
                  totalBd: { $sum: "$bdTime" },
                },
              },
              {
                $project: {
                  count: 1,
                  days: {
                    $divide: [
                      {
                        $divide: [
                          { $subtract: ["$totalProd", "$totalBd"] },
                          "$count",
                        ],
                      },
                      24,
                    ],
                  },
                },
              },

              {
                $project: {
                  days: 1,
                },
              },
            ],

            bdHourTrend: [
              // {
              //   $match: queryObj,
              // },

              // {
              //   $group :{ _id:  "$cell_data.cell_name"}
              // },
              // { $match: req.queryObj },

              // {
              //   $lookup: {
              //     from: "cells",
              //     localField: "cellRef",
              //     foreignField: "_id",
              //     as: "cell_data",
              //   },
              // },

              // {
              //   $unwind: "$cell_data",
              // },
              {
                $group: {
                  _id: { date: dateObj, cell: "$cell_data.cell_name" },
                  // $dateToString: {
                  //   format: "%m",
                  //   date: "$problemOccurredDateAndTimeOfBM",
                  //   timezone: timezone,
                  // },

                  // },

                  lessThanOne: {
                    $sum: {
                      $cond: [{ $lte: ["$bdTime", 1] }, "$bdTime", 0],
                    },
                  },
                  lessThanTwo: {
                    $sum: {
                      $cond: [{ $lte: ["$bdTime", 2] }, "$bdTime", 0],
                    },
                  },
                  greaterThanTwo: {
                    $sum: {
                      $cond: [{ $gt: ["$bdTime", 2] }, "$bdTime", 0],
                    },
                  },
                },
              },

              {
                $group: {
                  _id: null,
                  array: { $push: "$$ROOT" },
                },
              },

              {
                $project: {
                  _id: 0,
                  array: {
                    $map: {
                      input: allMonths,
                      as: "month",
                      in: {
                        $cond: [
                          {
                            $in: ["$$month.monthInDecimal", "$array._id.date"],
                          },
                          {
                            month: "$$month.monthName",
                            value: {
                              $arrayElemAt: [
                                "$array",
                                {
                                  $indexOfArray: [
                                    "$array._id.date",
                                    "$$month.monthInDecimal",
                                  ],
                                },
                              ],
                            },
                          },
                          {
                            month: "$$month.monthName",
                            value: {
                              _id: "$$month.monthInDecimal",
                              lessThanOne: 0,
                              lessThanTwo: 0,
                              greaterThanTwo: 0,
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              },
              { $unwind: "$array" },
              {
                $replaceRoot: { newRoot: "$array" },
              },

              {
                $group: {
                  _id: { date: "$value._id.date", cell: "$value._id.cell" },
                  // labels: { $push: "$month" },
                  // target: { $push: "$value.target" },
                  lessThanOne: {
                    $push: "$value.lessThanOne",
                  },
                  lessThanTwo: {
                    $push: "$value.lessThanTwo",
                  },
                  greaterThanTwo: {
                    $push: "$value.greaterThanTwo",
                  },
                },
              },

              //        {
              //   $project: {
              //     _id: 0,

              //     hourlyArray: {
              //       $map: {
              //         input: ["<1", "<2", ">2"],
              //         as: "label",
              //         in: {
              //           label: "$$label",
              //           data: {
              //             $switch: {
              //               branches: [
              //                 {
              //                   case: { $eq: ["$$label", "<1"] },
              //                   then: "$lessThanOne",
              //                 },
              //                 {
              //                   case: { $eq: ["$$label", "<2"] },
              //                   then: "$lessThanTwo",
              //                 },
              //                 {
              //                   case: { $eq: ["$$label", ">2"] },
              //                   then: "$greaterThanTwo",
              //                 },
              //               ],
              //               default: [],
              //             },
              //           },
              //         },
              //       },
              //     },
              //   },
              // },
            ],
          },
        },
      ]);
      return res.status(201).json({
        message: "History Card data get successfully",

        bdTime: summaryCard?.[0].bdTime,
        bdCount: summaryCard?.[0].bdCount,
        mttrData: summaryCard?.[0].mttrData,
        mtbf: summaryCard?.[0].mtbf,
        bdHourTrend: summaryCard?.[0].bdHourTrend,
      });
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get("/getApprovalRequestSheetData", async (req, res, next) => {
  try {
    const findLoggedUserPlantData = await Plant.findOne({
      plant_id: req?.rootUser?.plant_data?.split("-")?.[0],
    });

    console.log(
      `${req?.rootUser?.tm_department} ${
        req?.rootUser?.user_type.split("/")[0]
      }`
    );

    // const getApprovalData = await RequestSheetOfBM.aggregate([
    //   {
    //     $match: {
    //       plantRef: findLoggedUserPlantData?._id,
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "plants",
    //       localField: "plantRef",
    //       foreignField: "_id",
    //       as: "plants",
    //     },
    //   },
    //   { $unwind: "$plants" },
    //   {
    //     $project: {
    //       minorAndMajorList: {
    //         $cond: [
    //           { $eq: ["$maintenanceReportFilledByMTD.minorBD", "Yes"] },
    //           {
    //             $cond: [
    //               {
    //                 $in: [
    //                   "$plants.approvalListOfMinorAndMajor.minorApprovalList",
    //                   `${req?.rootUser?.tm_department} ${
    //                     req?.rootUser?.user_type.split("/")[0]
    //                   }`,
    //                 ],
    //               },

    //               {
    //                 month: "$$month.monthName",
    //                 value: {
    //                   $arrayElemAt: [
    //                     "$array",
    //                     {
    //                       $indexOfArray: [
    //                         "$array._id",
    //                         "$$month.monthInDecimal",
    //                       ],
    //                     },
    //                   ],
    //                 },
    //               },

    //               "",
    //             ],
    //           },

    //           "",
    //         ],
    //       },
    //     },
    //   },
    // ]);

    // console.log(getApprovalData);
  } catch (error) {
    res.status(500).json({ message: error?.message, error });
  }
});

//          MTTR Report

router.get("/getSectionOrSubSectionDropdownValue", async (req, res, next) => {
  try {
    const section = await Section.findOne({
      section_id: req?.rootUser?.section_data?.split("-")?.[0],
    });

    req.section = section;

    let subSectionsData;

    if (section.dashboardLevel === "No") {
      subSectionsData = await SubSection.find({
        subSection_id: {
          $in: req.rootUser?.subSection_data?.map(
            (item) => item?.split("-")?.[0]
          ),
        },
      });
    } else {
      subSectionsData = await SubSection.find({
        section_names: section?._id,
      });
    }

    const cellData = await Cell.find({
      subSection_names: { $in: subSectionsData },
    }).sort({ cell_sequence: 1 });

    return res.status(201).json({
      message: "Cell dropdown value get successfully",
      selectedCell: cellData?.[0]?._id,
      cellData,
    });
  } catch (error) {
    res.status(500).json({ message: error?.message, error });
  }
});

// middleware function for getting data of MTTR and MTBF
const middlewareForFindingTrendData = async (req, res, next) => {
  try {
    const TrendData = await RequestSheetOfBM.aggregate([
      {
        // $match: {},
        $match: req.queryObj,
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%m",
              date: "$problemOccurredDateAndTimeOfBM",
              timezone: timezone,
            },
          },
          count: { $sum: 1 },
          hours: {
            $sum: {
              $cond: [
                {
                  $gt: [
                    "$maintenanceReportFilledByMTD.workEndedDateOfBM",
                    null,
                  ],
                },
                {
                  $divide: ["$maintenanceReportFilledByMTD.breakDownTime", 60],
                },
                0,
              ],
            },
          },
          target: {
            $sum: {
              $cond: [
                {
                  $gt: [
                    "$maintenanceReportFilledByMTD.workEndedDateOfBM",
                    null,
                  ],
                },
                {
                  $divide: ["$maintenanceReportFilledByMTD.breakDownTime", 60],
                },
                0,
              ],
            },
          },
          ...req.groupRefKey,
        },
      },
      {
        $project: {
          count: 1,
          target: 1,
          hours: req.hourCalculationFormula,
        },
      },
      {
        $group: {
          _id: null,
          array: { $push: "$$ROOT" },
        },
      },
      {
        $project: {
          _id: 0,
          array: {
            $map: {
              input: allMonths,
              as: "month",
              in: {
                $cond: [
                  { $in: ["$$month.monthInDecimal", "$array._id"] },
                  {
                    month: "$$month.monthName",
                    value: {
                      $arrayElemAt: [
                        "$array",
                        {
                          $indexOfArray: [
                            "$array._id",
                            "$$month.monthInDecimal",
                          ],
                        },
                      ],
                    },
                  },
                  {
                    month: "$$month.monthName",
                    value: {
                      _id: "$$month.monthInDecimal",
                      count: 0,
                      hours: 0,
                      target: 0,
                    },
                  },
                ],
              },
            },
          },
        },
      },
      { $unwind: "$array" },
      {
        $replaceRoot: { newRoot: "$array" },
      },
      {
        $group: {
          _id: null,
          labels: { $push: "$month" },
          target: { $push: "$value.target" },
          data: {
            $push: "$value.hours",
          },
          backgroundColor: {
            $push: {
              $cond: [
                {
                  $lte: ["$value.hours", "$value.target"],
                },
                "green",
                "red",
              ],
            },
          },
        },
      },
    ]);

    req.TrendData = TrendData;

    next();
  } catch (error) {
    res.status(500).json({ message: error?.message, error });
  }
};

const middlewareForFindingLineWiseTrendData = async (req, res, next) => {
  try {
    const TrendData = await RequestSheetOfBM.aggregate([
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
          as: "line",
        },
      },
      { $unwind: "$line" },
      {
        $group: {
          _id: "$line.line_name",
          count: { $sum: 1 },
          hours: {
            $sum: {
              $cond: [
                {
                  $gt: [
                    "$maintenanceReportFilledByMTD.workEndedDateOfBM",
                    null,
                  ],
                },
                {
                  $divide: ["$maintenanceReportFilledByMTD.breakDownTime", 60],
                },
                0,
              ],
            },
          },
          target: {
            $sum: {
              $cond: [
                {
                  $gt: [
                    "$maintenanceReportFilledByMTD.workEndedDateOfBM",
                    null,
                  ],
                },
                {
                  $divide: ["$maintenanceReportFilledByMTD.breakDownTime", 60],
                },
                0,
              ],
            },
          },
          ...req.groupRefKey,
        },
      },
      {
        $project: {
          count: 1,
          target: 1,
          hours: req.hourCalculationFormula,
        },
      },
      {
        $sort: {
          hours: -1,
        },
      },
      {
        $group: {
          _id: null,
          labels: { $push: "$_id" },
          target: { $push: "$target" },
          data: { $push: "$hours" },
        },
      },
    ]);

    req.TrendData = TrendData;

    next();
  } catch (error) {
    res.status(500).json({ message: error?.message, error });
  }
};

const middlewareForLimitValidation = async (req, res, next) => {
  try {
    if (req.query?.documentLimitInTheGraph * 1 < 1) {
      return res.status(400).json({
        message: "Limit should be greater than one",
      });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: error?.message, error });
  }
};
const middlewareForFindingMachineWiseTrendData = async (req, res, next) => {
  const TrendData = await RequestSheetOfBM.aggregate([
    {
      $match: req.queryObj,
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
            },
          },
        ],
        as: "machine",
      },
    },
    { $unwind: "$machine" },
    {
      $group: {
        _id: "$machine",
        count: { $sum: 1 },
        hours: {
          $sum: {
            $cond: [
              {
                $gt: ["$maintenanceReportFilledByMTD.workEndedDateOfBM", null],
              },
              {
                $divide: ["$maintenanceReportFilledByMTD.breakDownTime", 60],
              },
              0,
            ],
          },
        },
        ...req.groupRefKey,
      },
    },
    {
      $project: {
        hours: req.hourCalculationFormula,
      },
    },
    {
      $sort: {
        hours: req.sort,
      },
    },
    {
      $limit: req.query?.documentLimitInTheGraph * 1,
    },
    {
      $group: {
        _id: null,
        machineId: { $push: "$_id._id" },
        labels: { $push: "$_id.machine_code" },
        data: { $push: "$hours" },
      },
    },
  ]);

  req.TrendData = TrendData;

  next();
};

// filter middleware for all the charts of MTTR Report
const filterMiddlewareForMTTRReport = async (req, res, next) => {
  try {
    req.groupRefKey = {};

    req.hourCalculationFormula = {
      $divide: ["$hours", "$count"],
    };

    next();
  } catch (error) {
    res.status(500).json({ message: error?.message, error });
  }
};

// filter middleware for all the charts of MTBF Report
const filterMiddlewareForMTBFReport = async (req, res, next) => {
  try {
    req.groupRefKey = {
      totalProdHours: { $sum: "$prodTotal" },
    };

    req.hourCalculationFormula = {
      $divide: [
        {
          $subtract: ["$totalProdHours", "$hours"],
        },
        "$count",
      ],
    };

    next();
  } catch (error) {
    res.status(500).json({ message: error?.message, error });
  }
};

const responseMiddlewareForReport = async (req, res, next) => {
  try {
    return res.status(201).json({
      message: req.message,
      data: req?.TrendData?.[0],
    });
  } catch (error) {
    res.status(500).json({ message: error?.message, error });
  }
};

router.get(
  "/getTrendData/MTTR/:filter/:selectedId",
  filterMiddleware,
  filterMiddlewareForMTTRReport,
  middlewareForFindingTrendData,
  async (req, res, next) => {
    req.message = "MTTR trend graph data get successfully";
    next();
  },
  responseMiddlewareForReport
);

router.get(
  "/getLineWiseMTTRTrendData/:filter/:selectedId",
  filterMiddleware,
  filterMiddlewareForMTTRReport,
  middlewareForFindingLineWiseTrendData,
  async (req, res, next) => {
    req.message = "Line wise MTTR trend data get successfully";
    next();
  },
  responseMiddlewareForReport
);

router.get(
  "/getMachineWiseMTTRTrendData/:filter/:selectedId",
  middlewareForLimitValidation,
  filterMiddleware,
  filterMiddlewareForMTTRReport,
  async (req, res, next) => {
    req.sort = -1;
    next();
  },
  middlewareForFindingMachineWiseTrendData,
  async (req, res, next) => {
    req.message = "Machine wise MTTR trend data get successfully";
    next();
  },
  responseMiddlewareForReport
);

router.get(
  "/getRequestSheetDataBasedOnSelectedMachine/:machineCode/:date",
  async (req, res, next) => {
    try {
      let nextDate = new Date(req.params.date);
      nextDate.setDate(nextDate.getDate() + 1);

      req.queryObj = {
        machineRef: mongoose.Types.ObjectId(req.params?.machineCode),
        problemOccurredDateAndTimeOfBM: {
          $gte: new Date(req.params.date),
          $lt: nextDate,
        },
      };

      next();
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  },
  requestSheetMiddleware
);

router.get(
  "/getTrendData/MTBF/:filter/:selectedId",
  filterMiddleware,
  filterMiddlewareForMTBFReport,
  middlewareForFindingTrendData,
  async (req, res, next) => {
    req.message = "MTBF trend graph data get successfully";
    next();
  },
  responseMiddlewareForReport
);

router.get(
  "/getLineWiseMTBFTrendData/:filter/:selectedId",
  filterMiddleware,
  filterMiddlewareForMTBFReport,
  middlewareForFindingLineWiseTrendData,
  async (req, res, next) => {
    req.message = "Line wise MTBF trend data get successfully";
    next();
  },
  responseMiddlewareForReport
);

router.get(
  "/getMachineWiseMTBFTrendDataData/:filter/:selectedId",
  middlewareForLimitValidation,
  filterMiddleware,
  filterMiddlewareForMTBFReport,
  async (req, res, next) => {
    req.sort = 1;
    next();
  },
  middlewareForFindingMachineWiseTrendData,
  async (req, res, next) => {
    req.message = "Machine wise MTBF trend data get successfully";
    next();
  },
  responseMiddlewareForReport
);

router.patch(
  "/approveRequestSheetFromHigherAuthority/:reqId/:machineRef",
  async (req, res, next) => {
    try {
      const {
        approvalOfRequestSheet,
        rejectedRemarksOfRequestSheet,
        requestSheetDataOfBM,
      } = req.body;

      const minorListForTheApprovalOfPlant =
        requestSheetDataOfBM?.plantRef?.approvalListOfMinorAndMajor
          ?.minorApprovalList;
      const majorListForTheApprovalOfPlant =
        requestSheetDataOfBM?.plantRef?.approvalListOfMinorAndMajor
          ?.majorApprovalList;

      let keyOfChangeApprovalStatusFromPendingToAcceptedOrRejectedForCondition = `approvalStatusOf${(requestSheetDataOfBM?.getDataForApprovalDashboard?.departmentAndGradeOfUser).replace(
        " ",
        "_"
      )}`;

      let keyOfUpdateApprovalStatusAsAcceptedOrRejected = `approvalStatusOf${(requestSheetDataOfBM?.getDataForApprovalDashboard?.departmentAndGradeOfUser).replace(
        " ",
        "_"
      )}.$`;

      let keyOfApprovalDateAndTimeOfAcceptedOrRejected = `approvalDateAndTimeOf${(requestSheetDataOfBM?.getDataForApprovalDashboard?.departmentAndGradeOfUser).replace(
        " ",
        "_"
      )}`;

      //Approver approve the request-sheet
      if (approvalOfRequestSheet === "Yes") {
        let getNextApproverDepartmentAndGradeOfUser;
        //For under Minor Request-sheet
        if (
          requestSheetDataOfBM?.maintenanceReportFilledByMTD?.minorBD === "Yes"
        ) {
          //get next approval user
          getNextApproverDepartmentAndGradeOfUser =
            minorListForTheApprovalOfPlant[
              minorListForTheApprovalOfPlant.indexOf(
                requestSheetDataOfBM?.getDataForApprovalDashboard
                  ?.departmentAndGradeOfUser
              ) + 1
            ];
        }
        //For under Major Request-sheet
        else {
          getNextApproverDepartmentAndGradeOfUser =
            majorListForTheApprovalOfPlant[
              majorListForTheApprovalOfPlant.indexOf(
                requestSheetDataOfBM?.getDataForApprovalDashboard
                  ?.departmentAndGradeOfUser
              ) + 1
            ];
        }
        if (getNextApproverDepartmentAndGradeOfUser) {
          //Further approval is required

          let valueOfGetDataForApprovalDashboardId =
            requestSheetDataOfBM?.[
              `approvalOf${getNextApproverDepartmentAndGradeOfUser.replace(
                " ",
                "_"
              )}`
            ]?._id;

          let updateApprovalStatusOfRequestSheet =
            await RequestSheetOfBM.findOneAndUpdate(
              {
                requestSheetNoOfBM: req?.params?.reqId,
                [keyOfChangeApprovalStatusFromPendingToAcceptedOrRejectedForCondition]:
                  "Pending",
              },
              {
                $set: {
                  requestSheetStatus: `Under ${getNextApproverDepartmentAndGradeOfUser} Approval`,
                  "getDataForApprovalDashboard.Id":
                    valueOfGetDataForApprovalDashboardId,
                  "getDataForApprovalDashboard.departmentAndGradeOfUser":
                    getNextApproverDepartmentAndGradeOfUser,
                  [keyOfUpdateApprovalStatusAsAcceptedOrRejected]: "Accepted",
                },
                $push: {
                  [keyOfApprovalDateAndTimeOfAcceptedOrRejected]: new Date(),
                },
              },
              { new: true }
            );
          if (updateApprovalStatusOfRequestSheet)
            return res.status(201).json({
              message: `${req?.params?.reqId} Request-sheet is approve !!`,
            });
        } else {
          //No further approver is required
          let updateApprovalStatusOfRequestSheet =
            await RequestSheetOfBM.findOneAndUpdate(
              {
                requestSheetNoOfBM: req?.params?.reqId,
                [keyOfChangeApprovalStatusFromPendingToAcceptedOrRejectedForCondition]:
                  "Pending",
              },
              {
                $set: {
                  requestSheetStatus: "Completed",
                  [keyOfUpdateApprovalStatusAsAcceptedOrRejected]: "Accepted",
                },
                $unset: {
                  getDataForApprovalDashboard: "",
                },
                $push: {
                  [keyOfApprovalDateAndTimeOfAcceptedOrRejected]: new Date(),
                },
              },
              { new: true }
            );

          if (updateApprovalStatusOfRequestSheet)
            return res.status(201).json({
              message: `${req?.params?.reqId} Request-sheet is approve !!`,
            });
        }
      }
      //Approver reject the request-sheet
      else {
        let updateApprovalStatusOfRequestSheet =
          await RequestSheetOfBM.findOneAndUpdate(
            {
              requestSheetNoOfBM: req?.params?.reqId,
              [keyOfChangeApprovalStatusFromPendingToAcceptedOrRejectedForCondition]:
                "Pending",
            },
            {
              $set: {
                requestSheetStatus: "Rejected",
                [keyOfUpdateApprovalStatusAsAcceptedOrRejected]: "Rejected",
                "getDataForApprovalDashboard.Id":
                  requestSheetDataOfBM?.approvalOfMTD_TL?._id,
                "getDataForApprovalDashboard.departmentAndGradeOfUser":
                  "MTD TL",
              },

              $push: {
                [keyOfApprovalDateAndTimeOfAcceptedOrRejected]: new Date(),
                approvalOfMTD_TL: requestSheetDataOfBM?.approvalOfMTD_TL?._id,
                approvalStatusOfMTD_TL: "Pending",
                rejectedRemarksOfRequestSheet,
              },
            },
            { new: true }
          );
        if (updateApprovalStatusOfRequestSheet)
          return res.status(201).json({
            message: `${req.params?.reqId} Request-sheet is rejected !!`,
          });
      }
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  }
);

//Getting data of approval log
router.get("/getApprovalLogDetails", async (req, res, next) => {
  try {
    const findLoggedUserPlantData = await Plant.findOne({
      plant_id: req?.rootUser?.plant_data?.split("-")?.[0],
    });

    const minorListForTheApprovalOfPlant =
      findLoggedUserPlantData?.approvalListOfMinorAndMajor?.minorApprovalList;
    const majorListForTheApprovalOfPlant =
      findLoggedUserPlantData?.approvalListOfMinorAndMajor?.majorApprovalList;

    // Merge arrays x and y without duplicates
    let mergedApprovalListArray = [
      ...new Set([
        ...minorListForTheApprovalOfPlant,
        ...majorListForTheApprovalOfPlant,
      ]),
    ];

    // Sort mergedArray based on the priority in the z array
    mergedApprovalListArray.sort((a, b) => {
      let priorityA =
        APPROVAL_LIST_OF_MINOR_MAJOR_OF_BM.find((item) => item.value === a)
          ?.priority || 0;
      let priorityB =
        APPROVAL_LIST_OF_MINOR_MAJOR_OF_BM.find((item) => item.value === b)
          ?.priority || 0;
      return priorityA - priorityB;
    });

    const getDataOfRequestSheetApprovalLogs = await RequestSheetOfBM?.aggregate(
      [
        {
          $match: {
            $and: [
              {
                requestSheetStatus: { $ne: "Generated" },
              },
              {
                requestSheetStatus: { $ne: "Assigned" },
              },
              {
                requestSheetStatus: { $ne: "Work Order Open" },
              },
              {
                requestSheetStatus: { $ne: "Work Order Pending" },
              },
              {
                requestSheetStatus: { $ne: "Work Order Closed" },
              },
              {
                requestSheetStatus: { $ne: "Fill Sheet" },
              },
            ],
          },
        },

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
                  tm_name: 1,
                },
              },
            ],
            as: "namesOperators",
          },
        },
        // {
        //   $lookup: {
        //     from: "users",
        //     localField: "approvalOfMTD_HOSS",
        //     foreignField: "_id",
        //     as: "approvalOfMTD_HOSS",
        //   },
        // },
        // {
        //   $lookup: {
        //     from: "users",
        //     localField: "approvalOfMTD_HOS",
        //     foreignField: "_id",
        //     as: "approvalOfMTD_HOS",
        //   },
        // },
        // {
        //   $lookup: {
        //     from: "users",
        //     localField: "approvalOfPRD_TL",
        //     foreignField: "_id",
        //     as: "approvalOfPRD_TL",
        //   },
        // },
        // {
        //   $lookup: {
        //     from: "users",
        //     localField: "approvalOfPRD_HOS",
        //     foreignField: "_id",
        //     as: "approvalOfPRD_HOS",
        //   },
        // },
        // {
        //   $lookup: {
        //     from: "users",
        //     localField: "approvalOfPRD_HOD",
        //     foreignField: "_id",
        //     as: "approvalOfPRD_HOD",
        //   },
        // },
        // {
        //   $lookup: {
        //     from: "users",
        //     localField: "approvalOfMTD_HOD",
        //     foreignField: "_id",
        //     as: "approvalOfMTD_HOD",
        //   },
        // },
        {
          $project: {
            requestSheetNoOfBM: 1,
            problemOccurredDateAndTimeOfBM: 1,
            assignUser: 1,

            approvalOfMTD_TL: 1,
            approvalStatusOfMTD_TL: 1,
            approvalDateAndTimeOfMTD_TL: 1,

            approvalOfMTD_HOSS: 1,
            approvalStatusOfMTD_HOSS: 1,
            approvalDateAndTimeOfMTD_HOSS: 1,

            approvalOfMTD_HOS: 1,
            approvalStatusOfMTD_HOS: 1,
            approvalDateAndTimeOfMTD_HOS: 1,

            approvalOfPRD_TL: 1,
            approvalStatusOfPRD_TL: 1,
            approvalDateAndTimeOfPRD_TL: 1,

            rejectedRemarksOfRequestSheet: 1,

            approvalOfPRD_HOS: 1,
            approvalStatusOfPRD_HOS: 1,
            approvalDateAndTimeOfPRD_HOS: 1,

            approvalOfPRD_HOD: 1,
            approvalStatusOfPRD_HOD: 1,
            approvalDateAndTimeOfPRD_HOD: 1,

            approvalOfMTD_HOD: 1,
            approvalStatusOfMTD_HOD: 1,
            approvalDateAndTimeOfMTD_HOD: 1,

            approverNameLogOfMTD_TL: 1,
            approverNameLogOfMTD_HOSS: 1,
            approverNameLogOfMTD_HOS: 1,
            approverNameLogOfPRD_TL: 1,
            approverNameLogOfPRD_HOS: 1,
            approverNameLogOfPRD_HOD: 1,
            approverNameLogOfMTD_HOD: 1,

            requestSheetStatus: 1,

            machineRef: { $arrayElemAt: ["$machines", 0] },
            lineRef: { $arrayElemAt: ["$lines", 0] },

            line: { $arrayElemAt: ["$lines.line_name", 0] },
            machineNo: { $arrayElemAt: ["$machines.machine_code", 0] },
            machineName: { $arrayElemAt: ["$machines.machine_name", 0] },
            assignUser: {
              $arrayElemAt: ["$namesOperators.tm_name", 0],
            },

            problemOccurredDateAndTimeOfBMForTable: {
              $dateToString: {
                format: "%Y-%m-%d %H:%M",
                date: "$problemOccurredDateAndTimeOfBM",
                timezone: "Asia/Kolkata",
              },
            },
          },
        },
      ]
    );

    res.status(201).json({
      message: "Get approval data successfully",
      approvalDataLogs: getDataOfRequestSheetApprovalLogs,
      mergedApprovalListArray,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error?.message, error: new Error(error) });
  }
});
// -------------------------------------------------------------------------------
//        Man-Hour Report APIS
// -------------------------------------------------------------------------------

const filtrationMiddleware = async (req, res, next) => {
  try {
    let queryObjForBM = {
      "preAggregationTimeStampOfRequestSheet.requestSheet_year":
        req.query?.selectedYear,
    };
    let queryObjForPM = {};

    if (req.query?.selectedMonth) {
      queryObjForBM = {
        ...queryObjForBM,
        "preAggregationTimeStampOfRequestSheet.requestSheet_month":
          req.query?.selectedMonth,
      };
    }

    if (req.params?.filter === "based-on-section") {
      queryObjForBM = {
        ...queryObjForBM,
        sectionRef: mongoose.Types.ObjectId(req.params?.selectedId),
      };
      queryObjForPM = {
        section_names: mongoose.Types.ObjectId(req.params?.selectedId),
      };
    } else if (req.params?.filter === "based-on-subSection") {
      queryObjForBM = {
        ...queryObjForBM,
        subSectionRef: mongoose.Types.ObjectId(req.params?.selectedId),
      };
      queryObjForPM = {
        subSection_names: mongoose.Types.ObjectId(req.params?.selectedId),
      };
    } else if (req.params?.filter === "based-on-cell") {
      queryObjForBM = {
        ...queryObjForBM,
        cellRef: mongoose.Types.ObjectId(req.params?.selectedId),
      };
      queryObjForPM = {
        cell_names: mongoose.Types.ObjectId(req.params?.selectedId),
      };
    } else if (req.params?.filter === "based-on-line") {
      queryObjForBM = {
        ...queryObjForBM,
        lineRef: mongoose.Types.ObjectId(req.params?.selectedId),
      };
      queryObjForPM = {
        line_names: mongoose.Types.ObjectId(req.params?.selectedId),
      };
    }

    req.queryObjForBM = queryObjForBM;
    req.queryObjForPM = queryObjForPM;

    next();
  } catch (error) {
    res.status(500).json({ message: error?.message, error });
  }
};

router.get(
  "/manHourReport/hourTrend/:filter/:selectedId",
  filtrationMiddleware,
  async (req, res, next) => {
    try {
      const BMHourTrend = await RequestSheetOfBM.aggregate([
        {
          $match: req.queryObjForBM,
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%m",
                date: "$problemOccurredDateAndTimeOfBM",
                timezone: timezone,
              },
            },
            hours: {
              $sum: {
                $cond: [
                  {
                    $gt: [
                      "$maintenanceReportFilledByMTD.workEndedDateOfBM",
                      null,
                    ],
                  },
                  {
                    $divide: [
                      "$maintenanceReportFilledByMTD.breakDownTime",
                      60,
                    ],
                  },
                  0,
                ],
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            array: { $push: "$$ROOT" },
          },
        },
        {
          $project: {
            _id: 0,
            array: {
              $map: {
                input: allMonths,
                as: "month",
                in: {
                  $cond: [
                    { $in: ["$$month.monthInDecimal", "$array._id"] },
                    {
                      $arrayElemAt: [
                        "$array.hours",
                        {
                          $indexOfArray: [
                            "$array._id",
                            "$$month.monthInDecimal",
                          ],
                        },
                      ],
                    },
                    0,
                  ],
                },
              },
            },
          },
        },
        // { $unwind: "$array" },
        // {
        //   $replaceRoot: { newRoot: "$array" },
        // },
        // {
        //   $group: {
        //     _id: null,
        //     labels: { $push: "$month" },
        //     data: {
        //       $push: "$value.hours",
        //     },
        //   },
        // },
      ]);

      const PMHourTrend = await Machine.aggregate([
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
            totalPMTime: {
              $objectToArray: "$checkSheet_data.totalPMTime",
            },
          },
        },
        {
          $unwind: "$totalPMTime",
        },
        {
          $group: {
            _id: "$totalPMTime.k",
            totalSumOf_PM: {
              $sum: {
                $divide: ["$totalPMTime.v.totalWorkedPMTime", 60],
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            array: { $push: "$$ROOT" },
          },
        },
        {
          $project: {
            data: {
              $map: {
                input: allMonths,
                as: "month",
                in: {
                  $cond: [
                    { $in: ["$$month.monthName", "$array._id"] },
                    {
                      $arrayElemAt: [
                        "$array.totalSumOf_PM",
                        {
                          $indexOfArray: ["$array._id", "$$month.monthName"],
                        },
                      ],
                    },
                    0,
                  ],
                },
              },
            },
          },
        },
      ]);

      return res.status(201).json({
        message: "HourTrend data get successfully",
        hourTrendData: {
          BMHourTrend: BMHourTrend?.[0]?.array,
          PMHourTrend: PMHourTrend?.[0]?.data,
        },
      });
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/manHourReport/manHourTrend/:filter/:selectedId",
  filtrationMiddleware,
  async (req, res, next) => {
    try {
      const BMManHourTrend = await RequestSheetOfBM.aggregate([
        {
          $match: req.queryObjForBM,
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%m",
                date: "$problemOccurredDateAndTimeOfBM",
                timezone: timezone,
              },
            },
            hours: {
              $sum: {
                $multiply: [
                  {
                    $divide: [
                      "$maintenanceReportFilledByMTD.breakDownTime",
                      60,
                    ],
                  },
                  {
                    $add: [
                      {
                        $sum: [
                          {
                            $cond: [{ $gt: ["$handOverUser", null] }, 1, 0],
                          },
                        ],
                      },
                      {
                        $sum: [
                          {
                            $cond: [{ $gt: ["$assignUser", null] }, 1, 0],
                          },
                        ],
                      },
                      {
                        $size: "$supportingTM",
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            array: { $push: "$$ROOT" },
          },
        },
        {
          $project: {
            _id: 0,
            array: {
              $map: {
                input: allMonths,
                as: "month",
                in: {
                  $cond: [
                    { $in: ["$$month.monthInDecimal", "$array._id"] },
                    {
                      $arrayElemAt: [
                        "$array.hours",
                        {
                          $indexOfArray: [
                            "$array._id",
                            "$$month.monthInDecimal",
                          ],
                        },
                      ],
                    },
                    0,
                  ],
                },
              },
            },
            // array: {
            //   $map: {
            //     input: allMonths,
            //     as: "month",
            //     in: {
            //       $cond: [
            //         { $in: ["$$month.monthInDecimal", "$array._id"] },
            //         {
            //           month: "$$month.monthName",
            //           value: {
            //             $arrayElemAt: [
            //               "$array",
            //               {
            //                 $indexOfArray: [
            //                   "$array._id",
            //                   "$$month.monthInDecimal",
            //                 ],
            //               },
            //             ],
            //           },
            //         },
            //         {
            //           month: "$$month.monthName",
            //           value: {
            //             _id: "$$month.monthInDecimal",
            //             hours: 0,
            //           },
            //         },
            //       ],
            //     },
            //   },
            // },
          },
        },
        // { $unwind: "$array" },
        // {
        //   $replaceRoot: { newRoot: "$array" },
        // },
        // {
        //   $group: {
        //     _id: null,
        //     labels: { $push: "$month" },
        //     data: {
        //       $push: "$value.hours",
        //     },
        //   },
        // },
      ]);

      const PMManHourTrend = await Machine.aggregate([
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
            totalPMTime: {
              $objectToArray: "$checkSheet_data.totalPMTime",
            },
          },
        },
        {
          $unwind: "$totalPMTime",
        },
        {
          $unwind: "$totalPMTime.v.supportingTMData",
        },
        {
          $group: {
            _id: "$totalPMTime.k",
            totalSumOf_PM: {
              $sum: {
                $divide: ["$totalPMTime.v.supportingTMData.workedTime", 60],
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            array: { $push: "$$ROOT" },
          },
        },
        {
          $project: {
            data: {
              $map: {
                input: allMonths,
                as: "month",
                in: {
                  $cond: [
                    { $in: ["$$month.monthName", "$array._id"] },
                    {
                      $arrayElemAt: [
                        "$array.totalSumOf_PM",
                        {
                          $indexOfArray: ["$array._id", "$$month.monthName"],
                        },
                      ],
                    },
                    0,
                  ],
                },
              },
            },
          },
        },
      ]);

      return res.status(201).json({
        message: "HourTrend data get successfully",
        manHourTrendData: {
          BMManHourTrend: BMManHourTrend?.[0]?.array,
          PMManHourTrend: PMManHourTrend?.[0]?.data,
        },
      });
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  }
);

const queryPipelineMiddleware = async (req, res, next) => {
  try {
    let queryPipeline = [];

    if (req.params?.filter === "based-on-section") {
      queryPipeline = [
        {
          $lookup: {
            from: "cells",
            localField: "cell_names",
            foreignField: "_id",
            pipeline: [
              {
                $lookup: {
                  from: "subsections",
                  localField: "subSection_names",
                  foreignField: "_id",
                  pipeline: [
                    {
                      $project: {
                        section_names: 1,
                      },
                    },
                  ],
                  as: "subSection",
                },
              },
              {
                $project: {
                  subSection: 1,
                },
              },
            ],
            as: "cell",
          },
        },
        {
          $match: {
            "cell.0.subSection.0.section_names": mongoose.Types.ObjectId(
              req.params?.selectedId
            ),
          },
        },
      ];
    } else if (req.params?.filter === "based-on-subSection") {
      queryPipeline = [
        {
          $lookup: {
            from: "cells",
            localField: "cell_names",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  subSection_names: 1,
                },
              },
            ],
            as: "cell",
          },
        },
        {
          $match: {
            "cell.0.subSection_names": mongoose.Types.ObjectId(
              req.params?.selectedId
            ),
          },
        },
      ];
    } else if (req.params?.filter === "based-on-cell") {
      queryPipeline = [
        {
          $match: {
            cell_names: mongoose.Types.ObjectId(req.params?.selectedId),
          },
        },
      ];
    }

    req.queryPipeline = queryPipeline;

    next();
  } catch (error) {
    res.status(500).json({ message: error?.message, error });
  }
};

router.get(
  "/manHourReport/lineTrend/:filter/:selectedId",
  queryPipelineMiddleware,
  async (req, res, next) => {
    try {
      // const BMLineTrend = await RequestSheetOfBM.aggregate([
      //   {
      //     $match: {},
      //   },
      //   {
      //     $lookup: {
      //       from: "lines",
      //       localField: "lineRef",
      //       foreignField: "_id",
      //       pipeline: [
      //         {
      //           $project: {
      //             line_name: 1,
      //           },
      //         },
      //       ],
      //       as: "line",
      //     },
      //   },
      //   {
      //     $unwind: "$line",
      //   },
      //   {
      //     $group: {
      //       _id: "$line.line_name",
      //       hours: {
      //         $sum: {
      //           $cond: [
      //             { $gt: ["$sheetCompletedDateAndTime", null] },
      //             {
      //               $divide: [
      //                 {
      //                   $subtract: [
      //                     "$sheetCompletedDateAndTime",
      //                     "$sheetIssuedDateAndTimeOfBM",
      //                   ],
      //                 },
      //                 3600000,
      //               ],
      //             },
      //             0,
      //           ],
      //         },
      //       },
      //     },
      //   },
      //   {
      //     $group: {
      //       _id: null,
      //       labels: { $push: "$_id" },
      //       data: { $push: "$hours" },
      //     },
      //   },
      // ]);

      let matchQuery_PM = {},
        matchQuery_BM = {
          "preAggregationTimeStampOfRequestSheet.requestSheet_year":
            req.query?.selectedYear,
        };

      if (req.query?.selectedMonth) {
        matchQuery_BM = {
          ...matchQuery_BM,
          "preAggregationTimeStampOfRequestSheet.requestSheet_month":
            req.query?.selectedMonth,
        };
      }

      if (req.params?.filter === "based-on-section") {
        matchQuery_PM = {
          section_names: mongoose.Types.ObjectId(req.params?.selectedId),
        };

        matchQuery_BM = {
          ...matchQuery_BM,
          sectionRef: mongoose.Types.ObjectId(req.params?.selectedId),
        };
      } else if (req.params?.filter === "based-on-subSection") {
        matchQuery_PM = {
          subSection_names: mongoose.Types.ObjectId(req.params?.selectedId),
        };

        matchQuery_BM = {
          ...matchQuery_BM,
          subSectionRef: mongoose.Types.ObjectId(req.params?.selectedId),
        };
      } else if (req.params?.filter === "based-on-cell") {
        matchQuery_PM = {
          cell_names: mongoose.Types.ObjectId(req.params?.selectedId),
        };

        matchQuery_BM = {
          ...matchQuery_BM,
          lineRef: mongoose.Types.ObjectId(req.params?.selectedId),
        };
      }

      let monthFilterQueryPipeline = [
        {
          $addFields: {
            totalPMTime: {
              $objectToArray: "$checkSheet_data.totalPMTime",
            },
          },
        },
        {
          $unwind: "$totalPMTime",
        },
        {
          $group: {
            _id: null,
            totalSumOf_PM: {
              $sum: {
                $divide: ["$totalPMTime.v.totalWorkedPMTime", 60],
              },
            },
          },
        },
      ];

      if (req.query?.selectedMonth) {
        monthFilterQueryPipeline = [
          {
            $group: {
              _id: null,
              totalSumOf_PM: {
                $sum: {
                  $divide: [
                    `$checkSheet_data.totalPMTime.${req.query?.selectedMonth}.totalWorkedPMTime`,
                    60,
                  ],
                },
              },
            },
          },
        ];
      }

      const PM_TotalSum = await Machine.aggregate([
        {
          $match: matchQuery_PM,
        },
        {
          $unwind: "$checkSheet_data",
        },
        {
          $match: {
            "checkSheet_data.current_year": req.query?.selectedYear,
          },
        },
        ...monthFilterQueryPipeline,
      ]);

      const BM_TotalSum = await RequestSheetOfBM.aggregate([
        {
          $match: matchQuery_BM,
        },
        {
          $group: {
            _id: null,
            totalSumOf_BM: {
              $sum: {
                $cond: [
                  {
                    $gt: [
                      "$maintenanceReportFilledByMTD.workEndedDateOfBM",
                      null,
                    ],
                  },
                  {
                    $divide: [
                      "$maintenanceReportFilledByMTD.breakDownTime",
                      60,
                    ],
                  },
                  0,
                ],
              },
            },
          },
        },
      ]);

      const totalSum =
        (PM_TotalSum?.[0]?.totalSumOf_PM || 0) +
          (BM_TotalSum?.[0]?.totalSumOf_BM || 0) || 1;

      const BMLineTrend = await Line.aggregate([
        ...req.queryPipeline,
        {
          $lookup: {
            from: "machinesalldatas",
            localField: "_id",
            foreignField: "line_names",
            pipeline: [
              {
                $unwind: "$checkSheet_data",
              },
              {
                $match: {
                  "checkSheet_data.current_year": req.query?.selectedYear,
                },
              },
              ...monthFilterQueryPipeline,
              // {
              //   $addFields: {
              //     totalPMTime: {
              //       $objectToArray: "$checkSheet_data.totalPMTime",
              //     },
              //   },
              // },
              // {
              //   $unwind: "$totalPMTime",
              // },
              // {
              //   $group: {
              //     _id: null,
              //     totalSumOf_PM: {
              //       $sum: "$totalPMTime.v.totalWorkedPMTime",
              //     },
              //   },
              // },
            ],
            as: "machine",
          },
        },
        {
          $lookup: {
            from: "requestsheetofbms",
            localField: "_id",
            foreignField: "lineRef",
            pipeline: [
              {
                $match: matchQuery_BM,
              },
              {
                $group: {
                  _id: null,
                  totalSumOf_BM: {
                    $sum: {
                      $cond: [
                        {
                          $gt: [
                            "$maintenanceReportFilledByMTD.workEndedDateOfBM",
                            null,
                          ],
                        },
                        {
                          $divide: [
                            "$maintenanceReportFilledByMTD.breakDownTime",
                            60,
                          ],
                        },
                        0,
                      ],
                    },
                  },
                },
              },
            ],
            as: "requestSheet",
          },
        },
        {
          $project: {
            line_name: 1,
            sumOfBM: {
              $cond: [
                {
                  $gt: [
                    {
                      $arrayElemAt: ["$requestSheet.totalSumOf_BM", 0],
                    },
                    null,
                  ],
                },
                { $arrayElemAt: ["$requestSheet.totalSumOf_BM", 0] },
                0,
              ],
            },
            sumOfPM: {
              $cond: [
                {
                  $gt: [{ $arrayElemAt: ["$machine.totalSumOf_PM", 0] }, null],
                },
                { $arrayElemAt: ["$machine.totalSumOf_PM", 0] },
                0,
              ],
            },
            percentage: {
              $divide: [
                {
                  $multiply: [
                    {
                      $add: [
                        {
                          $cond: [
                            {
                              $gt: [
                                {
                                  $arrayElemAt: ["$machine.totalSumOf_PM", 0],
                                },
                                null,
                              ],
                            },
                            { $arrayElemAt: ["$machine.totalSumOf_PM", 0] },
                            0,
                          ],
                        },
                        {
                          $cond: [
                            {
                              $gt: [
                                {
                                  $arrayElemAt: [
                                    "$requestSheet.totalSumOf_BM",
                                    0,
                                  ],
                                },
                                null,
                              ],
                            },
                            {
                              $arrayElemAt: ["$requestSheet.totalSumOf_BM", 0],
                            },
                            0,
                          ],
                        },
                      ],
                    },
                    100,
                  ],
                },
                totalSum,
              ],
            },
          },
        },
        {
          $sort: {
            percentage: -1,
          },
        },
        {
          $group: {
            _id: null,
            lines: { $push: "$line_name" },
            totalSumOf_PM: {
              $push: "$sumOfPM",
            },
            totalSumOf_BM: {
              $push: "$sumOfBM",
            },
            percentage: {
              $push: "$percentage",
            },
          },
        },
        // {
        //   $group: {
        //     _id: null,
        //     lines: { $push: "$line_name" },
        //     totalSumOf_PM: {
        //       $push: { $arrayElemAt: ["$machine.totalSumOf_PM", 0] },
        //     },
        //     totalSumOf_BM: {
        //       $push: { $arrayElemAt: ["$requestSheet.totalSumOf_BM", 0] },
        //     },
        //   },
        // },
        // {
        //   $project: {
        //     line_name: 1,
        //     // requestSheet:1,
        //     // machine:1,
        //     requestSheet: { $arrayElemAt: ["$requestSheet", 0] },
        //     machine: { $arrayElemAt: ["$machine", 0] },
        //   },
        // },
      ]);

      return res.status(201).json({
        message: "LineTrend data get successfully",
        BMLineTrend: BMLineTrend?.[0],
      });
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/manHourReport/tmLoad/:filter/:selectedId",
  async (req, res, next) => {
    try {
      let findObject = {
        _id: mongoose.Types.ObjectId(req.params?.selectedId),
      };

      let queryPipelineForUser = [],
        matchQuery_PM = {},
        matchQuery_BM = {
          "preAggregationTimeStampOfRequestSheet.requestSheet_year":
            req.query?.selectedYear,
        };

      if (req.query?.selectedMonth) {
        matchQuery_BM = {
          ...matchQuery_BM,
          "preAggregationTimeStampOfRequestSheet.requestSheet_month":
            req.query?.selectedMonth,
        };
      }

      if (req.params?.filter === "based-on-section") {
        const section = await Section.findOne(findObject);

        queryPipelineForUser = [
          {
            $match: {
              section_data: `${section?.section_id}-${section?.section_name}`,
            },
          },
        ];

        matchQuery_PM = {
          section_names: mongoose.Types.ObjectId(req.params?.selectedId),
        };

        matchQuery_BM = {
          ...matchQuery_BM,
          sectionRef: mongoose.Types.ObjectId(req.params?.selectedId),
        };
      } else if (req.params?.filter === "based-on-subSection") {
        const subSection = await SubSection.findOne(findObject);

        queryPipelineForUser = [
          {
            $match: {
              subSection_data: `${subSection?.subSection_id}-${subSection?.subSection_name}`,
            },
          },
        ];

        matchQuery_PM = {
          subSection_names: mongoose.Types.ObjectId(req.params?.selectedId),
        };

        matchQuery_BM = {
          ...matchQuery_BM,
          subSectionRef: mongoose.Types.ObjectId(req.params?.selectedId),
        };
      } else if (req.params?.filter === "based-on-cell") {
        const cell = await Cell.findOne(findObject);

        queryPipelineForUser = [
          {
            $match: {
              cell_data: `${cell?.cell_id}-${cell?.cell_name}`,
            },
          },
        ];

        matchQuery_PM = {
          cell_names: mongoose.Types.ObjectId(req.params?.selectedId),
        };

        matchQuery_BM = {
          ...matchQuery_BM,
          lineRef: mongoose.Types.ObjectId(req.params?.selectedId),
        };
      }

      let monthFilterQueryPipelineForSum = [
        {
          $addFields: {
            totalPMTime: {
              $objectToArray: "$checkSheet_data.totalPMTime",
            },
          },
        },
        {
          $unwind: "$totalPMTime",
        },
        {
          $unwind: "$totalPMTime.v.supportingTMData",
        },
        {
          $group: {
            _id: null,
            // machine: { $push: "$machine_code" },
            // months: { $push: "$totalPMTime.k" },
            // time: { $push: "$totalPMTime.v.supportingTMData.workedTime" },
            totalSumOf_PM: {
              $sum: {
                $divide: ["$totalPMTime.v.supportingTMData.workedTime", 60],
              },
            },
          },
        },
      ];

      let monthFilterQueryPipelineForMatchingAndGrouping = [
        {
          $addFields: {
            totalPMTime: {
              $objectToArray: "$checkSheet_data.totalPMTime",
            },
          },
        },
        {
          $unwind: "$totalPMTime",
        },
        {
          $unwind: "$totalPMTime.v.supportingTMData",
        },
        {
          $match: {
            $expr: {
              $eq: ["$$userNo", "$totalPMTime.v.supportingTMData.tm_no"],
            },
          },
        },
        {
          $group: {
            _id: null,
            sumOfPM: {
              $sum: {
                $divide: ["$totalPMTime.v.supportingTMData.workedTime", 60],
              },
            },
          },
        },
      ];

      if (req.query?.selectedMonth) {
        monthFilterQueryPipelineForSum = [
          {
            $unwind: `$checkSheet_data.totalPMTime.${req.query?.selectedMonth}.supportingTMData`,
          },
          {
            $group: {
              _id: null,
              // machine: { $push: "$machine_code" },
              totalSumOf_PM: {
                $sum: {
                  $divide: [
                    `$checkSheet_data.totalPMTime.${req.query?.selectedMonth}.supportingTMData.workedTime`,
                    60,
                  ],
                },
              },
            },
          },
        ];

        monthFilterQueryPipelineForMatchingAndGrouping = [
          {
            $unwind: `$checkSheet_data.totalPMTime.${req.query?.selectedMonth}.supportingTMData`,
          },
          {
            $match: {
              $expr: {
                $eq: [
                  "$$userNo",
                  `$checkSheet_data.totalPMTime.${req.query?.selectedMonth}.supportingTMData.tm_no`,
                ],
              },
            },
          },
          {
            $group: {
              _id: null,
              sumOfPM: {
                $sum: {
                  $divide: [
                    `$checkSheet_data.totalPMTime.${req.query?.selectedMonth}.supportingTMData.workedTime`,
                    60,
                  ],
                },
              },
            },
          },
        ];
      }

      const PM_TotalSum = await Machine.aggregate([
        {
          $match: matchQuery_PM,
        },
        {
          $unwind: "$checkSheet_data",
        },
        {
          $match: {
            "checkSheet_data.current_year": req.query?.selectedYear,
          },
        },
        ...monthFilterQueryPipelineForSum,
      ]);

      const BM_TotalSum = await RequestSheetOfBM.aggregate([
        {
          $match: matchQuery_BM,
        },
        {
          $addFields: {
            allUserVarForGrouping: {
              $setUnion: [["$assignUser"], ["$handOverUser"], "$supportingTM"],
            },
          },
        },
        { $unwind: "$allUserVarForGrouping" },
        {
          $group: {
            _id: null,
            totalSumOf_BM: {
              $sum: {
                $cond: [
                  {
                    $gt: [
                      "$maintenanceReportFilledByMTD.workEndedDateOfBM",
                      null,
                    ],
                  },
                  {
                    $divide: [
                      "$maintenanceReportFilledByMTD.breakDownTime",
                      60,
                    ],
                  },
                  0,
                ],
              },
            },
          },
        },
      ]);

      const totalSum =
        (PM_TotalSum?.[0]?.totalSumOf_PM || 0) +
          (BM_TotalSum?.[0]?.totalSumOf_BM || 0) || 1;

      const tmLoadData = await User.aggregate([
        ...queryPipelineForUser,
        {
          $lookup: {
            from: "machinesalldatas",
            let: { userNo: "$tm_no" },
            pipeline: [
              {
                $match: matchQuery_PM,
              },
              {
                $unwind: "$checkSheet_data",
              },
              {
                $match: {
                  "checkSheet_data.current_year": req.query?.selectedYear,
                },
              },
              ...monthFilterQueryPipelineForMatchingAndGrouping,
            ],
            as: "machine",
          },
        },

        {
          $lookup: {
            from: "requestsheetofbms",
            let: { userNo: "$_id" },
            pipeline: [
              {
                $match: matchQuery_BM,
              },
              {
                $addFields: {
                  allUserVarForGrouping: {
                    $setUnion: [
                      ["$assignUser"],
                      ["$handOverUser"],
                      "$supportingTM",
                    ],
                  },
                },
              },
              { $unwind: "$allUserVarForGrouping" },
              {
                $match: {
                  $expr: {
                    $eq: ["$$userNo", "$allUserVarForGrouping"],
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  // machines: { $push: "$machineRef" },
                  sumOfBM: {
                    $sum: {
                      $cond: [
                        {
                          $gt: [
                            "$maintenanceReportFilledByMTD.workEndedDateOfBM",
                            null,
                          ],
                        },
                        {
                          $divide: [
                            "$maintenanceReportFilledByMTD.breakDownTime",
                            60,
                          ],
                        },
                        0,
                      ],
                    },
                  },
                },
              },
            ],
            as: "requestSheet",
          },
        },
        {
          $project: {
            tm_name: 1,
            sumOfPM: {
              $cond: [
                { $gt: [{ $arrayElemAt: ["$machine.sumOfPM", 0] }, null] },
                { $arrayElemAt: ["$machine.sumOfPM", 0] },
                0,
              ],
            },
            sumOfBM: {
              $cond: [
                {
                  $gt: [{ $arrayElemAt: ["$requestSheet.sumOfBM", 0] }, null],
                },
                { $arrayElemAt: ["$requestSheet.sumOfBM", 0] },
                0,
              ],
            },
            percentage: {
              $divide: [
                {
                  $multiply: [
                    {
                      $add: [
                        {
                          $cond: [
                            {
                              $gt: [
                                { $arrayElemAt: ["$machine.sumOfPM", 0] },
                                null,
                              ],
                            },
                            { $arrayElemAt: ["$machine.sumOfPM", 0] },
                            0,
                          ],
                        },
                        {
                          $cond: [
                            {
                              $gt: [
                                {
                                  $arrayElemAt: ["$requestSheet.sumOfBM", 0],
                                },
                                null,
                              ],
                            },
                            { $arrayElemAt: ["$requestSheet.sumOfBM", 0] },
                            0,
                          ],
                        },
                      ],
                    },
                    100,
                  ],
                },
                totalSum,
              ],
            },
          },
        },
        {
          $sort: {
            percentage: -1,
          },
        },
        {
          $group: {
            _id: null,
            tm_names: {
              $push: "$tm_name",
            },
            totalSumOf_PM: {
              $push: "$sumOfPM",
            },
            totalSumOf_BM: {
              $push: "$sumOfBM",
            },
            percentage: {
              $push: "$percentage",
            },
          },
        },
      ]);

      return res.status(201).json({
        message: "TM load data get successfully",
        tmLoadData: tmLoadData?.[0],
      });
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  }
);

// -------------------------------------------------------------------------------
//        Filter API based on logged user (All filtration Options)
// -------------------------------------------------------------------------------

const plantFiltrationMiddleware = async (req, res, next) => {
  try {
    if (req.rootUser?.tm_grade !== "HOD") {
      return next();
    }

    const plant = await Plant.findOne({
      plant_id: req?.rootUser?.plant_data?.split("-")?.[0],
    });

    const sections = await Section.find({
      plant_names: plant?._id,
    });

    req.section = sections?.[0];
    req.sections = sections;

    return next();
  } catch (error) {
    res.status(500).json({ message: error?.message, error });
  }
};

const sectionFiltrationMiddleware = async (req, res, next) => {
  try {
    if (req.section) {
      return next();
    }

    const section = await Section.findOne(req.sectionQuery);

    req.section = section;

    next();
  } catch (error) {
    res.status(500).json({ message: error?.message, error });
  }
};

const subSectionFiltrationMiddleware = async (req, res, next) => {
  try {
    const subSections = await SubSection.find(req.subSectionQuery);

    if (req.section.dashboardLevel === "No") {
      let subSection = subSections?.[0];

      req.cellQuery = {
        subSection_names: subSection?._id,
      };

      req.subSection = subSection;
    } else {
      req.cellQuery = {
        subSection_names: { $in: subSections },
      };
    }

    req.subSections = subSections;

    return next();
  } catch (error) {
    res.status(500).json({ message: error?.message, error });
  }
};

const cellFiltrationMiddleware = async (req, res, next) => {
  try {
    const cells = await Cell.find(req.cellQuery);

    if (req.rootUser?.tm_grade === "HOD") {
      if (req.section.dashboardLevel === "No") {
        return res.status(201).json({
          message: "SubSections get successfully",

          flagForTogglingFilter: "based-on-subSection",
          selectedValue: req.subSection?._id,

          selectedSection: req.section?._id,
          sections: req.sections,
          selectedSubSection: req.subSection?._id,
          subSections: req.subSections,
          selectedCell: "",
          cells,
          selectedLine: "",
          lines: [],
        });
      } else {
        return res.status(201).json({
          message: "Sections get successfully",

          flagForTogglingFilter: "based-on-section",
          selectedValue: req.section?._id,

          selectedSection: req.section?._id,
          sections: req.sections,
          selectedSubSection: "",
          subSections: [],
          selectedCell: "",
          cells,
          selectedLine: "",
          lines: [],
        });
      }
    }

    if (req.section.dashboardLevel === "No") {
      return res.status(201).json({
        message: "SubSections get successfully",

        flagForTogglingFilter: "based-on-subSection",
        selectedValue: req.subSection?._id,

        selectedSection: "",
        sections: [],
        selectedSubSection: req.subSection?._id,
        subSections: req.subSections,
        selectedCell: "",
        cells,
        selectedLine: "",
        lines: [],
      });
    }

    return res.status(201).json({
      message: "Cell dropdown value get successfully",

      flagForTogglingFilter: "based-on-section",
      selectedValue: req.section?._id,

      selectedSection: "",
      sections: [],
      selectedSubSection: "",
      subSections: [],
      selectedCell: "",
      cells,
      selectedLine: "",
      lines: [],
    });
  } catch (error) {
    res.status(500).json({ message: error?.message, error });
  }
};

const conditionMiddlewareForSectionQuery = async (req, res, next) => {
  try {
    if (req.section) {
      return next();
    }
    req.sectionQuery = {
      section_id: req?.rootUser?.section_data?.split("-")?.[0],
    };
    next();
  } catch (error) {
    res.status(500).json({ message: error?.message, error });
  }
};

router.get(
  "/getFiltrationValue/all-filtration/byDefault",
  plantFiltrationMiddleware,
  conditionMiddlewareForSectionQuery,
  sectionFiltrationMiddleware,
  (req, res, next) => {
    try {
      let subSectionQuery = {};

      if (req.section.dashboardLevel === "Yes") {
        if (req.rootUser?.tm_grade === "HOD") {
          return res.status(201).json({
            message: "Sections get successfully",

            flagForTogglingFilter: "based-on-section",
            selectedValue: req.section?._id,

            selectedSection: req.section?._id,
            sections: req.sections,
            selectedSubSection: "",
            subSections: [],
            selectedCell: "",
            cells: [],
            selectedLine: "",
            lines: [],
          });
        }

        subSectionQuery = {
          section_names: req.section?._id,
        };
      } else {
        if (req.rootUser?.tm_grade === "HOD") {
          subSectionQuery = {
            section_names: req.section?._id,
          };
        } else {
          subSectionQuery = {
            subSection_id: {
              $in: req.rootUser?.subSection_data?.map(
                (item) => item?.split("-")?.[0]
              ),
            },
          };
        }
      }

      req.subSectionQuery = subSectionQuery;
      next();
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  },
  subSectionFiltrationMiddleware,
  cellFiltrationMiddleware
);

router.get(
  "/getFiltrationValue/all-filtration/sectionBased/:id",
  (req, res, next) => {
    try {
      req.sectionQuery = {
        _id: mongoose.Types.ObjectId(req.params?.id),
      };
      next();
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  },
  sectionFiltrationMiddleware,
  async (req, res, next) => {
    try {
      req.subSectionQuery = {
        section_names: req.section?._id,
      };
      next();
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  },
  subSectionFiltrationMiddleware,
  cellFiltrationMiddleware
);

router.get(
  "/getFiltrationValue/all-filtration/subSectionBased/:id",
  async (req, res, next) => {
    try {
      const cells = await Cell.find({
        subSection_names: mongoose.Types.ObjectId(req.params?.id),
      });

      return res.status(201).json({
        message: "Cell dropdown value get successfully",
        cells: cells,
      });
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/getFiltrationValue/all-filtration/cellBased/:id",
  async (req, res, next) => {
    try {
      const lines = await Line.find({
        cell_names: mongoose.Types.ObjectId(req.params?.id),
      });

      return res.status(201).json({
        message: "Line dropdown value get successfully",
        lines,
      });
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  }
);

// -------------------------------------------------------------------------------
//        Filter API based on logged user (Cell/Line filtration Options)
// -------------------------------------------------------------------------------

const cellFilterMiddleware = async (req, res, next) => {
  try {
    const cells = await Cell.find(req.cellQuery);

    req.cellID = cells?.[0]?._id;
    req.cells = cells;

    return next();
  } catch (error) {
    res.status(500).json({ message: error?.message, error });
  }
};

const lineFiltrationMiddleware = async (req, res, next) => {
  try {
    const lines = await Line.find({
      cell_names: mongoose.Types.ObjectId(req.cellID),
    });

    req.lines = lines;
    return next();
  } catch (error) {
    res.status(500).json({ message: error?.message, error });
  }
};

router.get(
  "/getFiltrationValue/cell-level-filtration/byDefault",
  plantFiltrationMiddleware,
  conditionMiddlewareForSectionQuery,
  sectionFiltrationMiddleware,
  (req, res, next) => {
    try {
      let subSectionQuery = {
        section_names: req.section?._id,
      };
      if (
        req.section.dashboardLevel === "No" &&
        req.rootUser?.tm_grade !== "HOD"
      ) {
        subSectionQuery = {
          subSection_id: {
            $in: req.rootUser?.subSection_data?.map(
              (item) => item?.split("-")?.[0]
            ),
          },
        };
      }
      req.subSectionQuery = subSectionQuery;
      next();
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  },
  subSectionFiltrationMiddleware,
  cellFilterMiddleware,
  lineFiltrationMiddleware,
  async (req, res, next) => {
    try {
      if (req.rootUser?.tm_grade === "HOD") {
        if (req.section.dashboardLevel === "No") {
          return res.status(201).json({
            message: "Data get successfully",

            flagForTogglingFilter: "based-on-cell",
            selectedValue: req.cellID,

            selectedSection: req.section?._id,
            sections: req.sections,
            selectedSubSection: req.subSection?._id,
            subSections: req.subSections,
            selectedCell: req.cellID,
            cells: req.cells,
            selectedLine: "",
            lines: req.lines,
          });
        }

        return res.status(201).json({
          message: "Data get successfully",

          flagForTogglingFilter: "based-on-cell",
          selectedValue: req.cellID,

          selectedSection: req.section?._id,
          sections: req.sections,
          selectedSubSection: "",
          subSections: [],
          selectedCell: req.cellID,
          cells: req.cells,
          selectedLine: "",
          lines: req.lines,
        });
      }

      if (req.section.dashboardLevel === "No") {
        return res.status(201).json({
          message: "Data get successfully",

          flagForTogglingFilter: "based-on-cell",
          selectedValue: req.cellID,

          selectedSection: "",
          sections: [],
          selectedSubSection: req.subSection?._id,
          subSections: req.subSections,
          selectedCell: req.cellID,
          cells: req.cells,
          selectedLine: "",
          lines: req.lines,
        });
      }

      return res.status(201).json({
        message: "Data get successfully",

        flagForTogglingFilter: "based-on-cell",
        selectedValue: req.cellID,

        selectedSection: "",
        sections: [],
        selectedSubSection: "",
        subSections: [],
        selectedCell: req.cellID,
        cells: req.cells,
        selectedLine: "",
        lines: req.lines,
      });
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/getFiltrationValue/cell-level-filtration/sectionBased/:id",
  (req, res, next) => {
    try {
      req.sectionQuery = {
        _id: mongoose.Types.ObjectId(req.params?.id),
      };
      next();
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  },
  sectionFiltrationMiddleware,
  async (req, res, next) => {
    try {
      req.subSectionQuery = {
        section_names: req.section?._id,
      };
      next();
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  },
  subSectionFiltrationMiddleware,
  cellFilterMiddleware,
  lineFiltrationMiddleware,
  async (req, res, next) => {
    try {
      if (req.section.dashboardLevel === "No") {
        return res.status(201).json({
          message: "Data get successfully",

          flagForTogglingFilter: "based-on-cell",
          selectedValue: req.cellID,

          selectedSubSection: req.subSection?._id,
          subSections: req.subSections,
          selectedCell: req.cellID,
          cells: req.cells,
          selectedLine: "",
          lines: req.lines,
        });
      }

      return res.status(201).json({
        message: "Data get successfully",

        flagForTogglingFilter: "based-on-cell",
        selectedValue: req.cellID,

        selectedSubSection: "",
        subSections: [],
        selectedCell: req.cellID,
        cells: req.cells,
        selectedLine: "",
        lines: req.lines,
      });
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/getFiltrationValue/cell-level-filtration/subSectionBased/:id",
  async (req, res, next) => {
    try {
      req.cellQuery = {
        subSection_names: mongoose.Types.ObjectId(req.params?.id),
      };
      return next();
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  },
  cellFilterMiddleware,
  lineFiltrationMiddleware,
  async (req, res, next) => {
    try {
      return res.status(201).json({
        message: "Data get successfully",

        flagForTogglingFilter: "based-on-cell",
        selectedValue: req.cellID,

        selectedCell: req.cellID,
        cells: req.cells,
        selectedLine: "",
        lines: req.lines,
      });
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/getFiltrationValue/cell-level-filtration/cellBased/:id",
  async (req, res, next) => {
    try {
      req.cellID = mongoose.Types.ObjectId(req.params?.id);

      next();
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  },
  lineFiltrationMiddleware,
  async (req, res, next) => {
    try {
      return res.status(201).json({
        message: "Line dropdown value get successfully",
        lines: req.lines,
      });
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get("/dummyAPI", async (req, res, next) => {
  try {
    const machineFind = await Machine.aggregate([
      {
        $match: {},
      },
      {
        $lookup: {
          from: "lines",
          localField: "line_names",
          foreignField: "_id",
          pipeline: [
            {
              $lookup: {
                from: "cells",
                localField: "cell_names",
                foreignField: "_id",
                pipeline: [
                  {
                    $lookup: {
                      from: "subsections",
                      localField: "subSection_names",
                      foreignField: "_id",
                      pipeline: [
                        {
                          $project: {
                            section_names: 1,
                          },
                        },
                      ],
                      as: "subSection",
                    },
                  },
                  {
                    $project: {
                      subSection: 1,
                    },
                  },
                ],
                as: "cell",
              },
            },
            {
              $project: {
                cell: 1,
              },
            },
          ],
          as: "line",
        },
      },
      {
        $project: {
          machine_code: 1,
          line: 1,
        },
      },
      // {
      //   $match: {
      //     "cell.0.subSection.0.section_names": mongoose.Types.ObjectId(
      //       req.params?.selectedId
      //     ),
      //   },
      // },
    ]);

    for (let i = 0; i < machineFind.length; i++) {
      await Machine.updateOne(
        {
          _id: machineFind[i]?._id,
        },
        {
          cell_names: machineFind[i]?.line?.[0]?.cell?.[0]?._id,
          subSection_names:
            machineFind[i]?.line?.[0]?.cell?.[0]?.subSection?.[0]?._id,
          section_names:
            machineFind[i]?.line?.[0]?.cell?.[0]?.subSection?.[0]
              ?.section_names,
        }
      );

      console.log("machine-updated : ", machineFind[i]?.machine_code);
    }

    return res.status(201).json({
      message: "Success !!!!",
      machineFind,
    });
  } catch (error) {
    res.status(500).json({ message: error?.message, error });
  }
});
module.exports = router;

// labels: [
//   `${bdTrendData?.[0].financialYear[0].labels}`,
//   `${bdTrendData?.[0].currentYear[0].labels}`,
// ],
// hourlyArray: [
//   {
//     label: "<1",
//     data: [
//       bdTrendData[0]?.financialYear[0]?.lessThanOne[0],
//       bdTrendData[0]?.currentYear[0]?.lessThanOne[0],
//     ],
//   },
//   {
//     label: "<2",
//     data: [
//       bdTrendData[0]?.financialYear[0]?.lessThanTwo[0],
//       bdTrendData[0]?.currentYear[0]?.lessThanTwo[0],
//     ],
//   },
//   {
//     label: ">2",
//     data: [
//       bdTrendData[0]?.financialYear[0]?.greaterThanTwo[0],
//       bdTrendData[0]?.currentYear[0]?.greaterThanTwo[0],
//     ],
//   },
// ],
