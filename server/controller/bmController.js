const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const RequestSheetOfBM = require("../model/requestSheetDataOfBM");
const Machine = require("../model/machineSchema");
const User = require("../model/userSchema");
const Section = require("../model/sectionSchema");
const SubSection = require("../model/subSectionSchema");
const Cell = require("../model/cellSchema");

const authenticate = require("../middleware/authenticate");
const cookieParser = require("cookie-parser");
const Plant = require("../model/plantSchema");
const factory = require("./handleFactory");

const moment = require("moment-timezone");
const timezone = "Asia/Kolkata";

router.use(cookieParser());
router.use(authenticate);

const {
  PENDING_APPROVAL_LIST,
  APPROVED_APPROVAL_LIST,
  REJECTED_APPROVAL_LIST,
  APPROVAL_LIST_OF_MINOR_MAJOR_OF_BM,
} = require("../GlobalData/RequestSheetApprovalStatus");

const statusArray = [
  "Generated",
  "Assigned",
  "Work Order Open",
  "Work Order Pending",
  "Work Order Closed",
  "Fill sheet",
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
      }

    let requestSheet;


      if (
        req.rootUser.user_type === "Operator" ||
        req.rootUser.tm_department === "MTD"
      ) {
        const {
          workStartedDateOfBM,
          workEndedDateOfBM,
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
          changedParts,
          feedbackMTD_HOS,
          qualityConfirmed,
          partQualityCheckedByMTD,
          partQualityCheckedByPRD,
        } = req.body;

        let queryObj = {
          ...req.body,
          ..._idObject,
          "maintenanceReportFilledByMTD.workStartedDateOfBM":
            workStartedDateOfBM,
          "maintenanceReportFilledByMTD.workEndedDateOfBM": workEndedDateOfBM,
          "maintenanceReportFilledByMTD.actionAndCounterMeasureStep":
            actionAndCounterMeasureStep,
          "maintenanceReportFilledByMTD.problemsOfBM": problemsOfBM,
          "maintenanceReportFilledByMTD.breakDownTime": breakDownTime,
          "maintenanceReportFilledByMTD.whyAnalysis.why1": why1,
          "maintenanceReportFilledByMTD.whyAnalysis.why2": why2,
          "maintenanceReportFilledByMTD.whyAnalysis.why3": why3,
          "maintenanceReportFilledByMTD.whyAnalysis.why4": why4,
          "maintenanceReportFilledByMTD.whyAnalysis.why5": why5,
          "maintenanceReportFilledByMTD.breakDownTime": breakDownTime,
          "maintenanceReportFilledByMTD.maintenanceTime": maintenanceTime,
          "maintenanceReportFilledByMTD.qualityCheckTime": qualityCheckTime,
          "maintenanceReportFilledByMTD.breakTime": breakTime,
          "maintenanceReportFilledByMTD.minorBD": minorBD,
          "maintenanceReportFilledByMTD.majorBD": majorBD,
          "maintenanceReportFilledByMTD.firstTime": firstTime,
          "maintenanceReportFilledByMTD.repeat": repeat,
          sparePartUsedOrNot: changedParts?.length > 0 ? true : false,
          changedParts,
          feedbackMTD_HOS,
          qualityConfirmed,
          partQualityCheckedByMTD,
          partQualityCheckedByPRD,
          requestSheetStatus: "Fill Sheet",
        };

        requestSheet = await RequestSheetOfBM.findOneAndUpdate(
          { requestSheetNoOfBM: req.query.reqId },
          {
            $set: queryObj,
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

        let requestSheetNos = machine.line_names.requestSheetNos + 1;

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
                .toUpperCase()}_${machine?.line_names?.line_name}_
      ${moment().tz("Asia/Kolkata").month() + 1}_
      ${increaseCountOfRequestSheetInLine?.requestSheetNos}`.trim();

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
          sheetIssuedDateAndTimeOfBM,
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
        res.status(201).json({
          message: "Request-sheet generated successfully",
          requestSheet,
        });
      }
    } else {
      res.status(404).json({ message: "Request-sheet not generated" });
    }

    res
      .status(201)
      .json({ message: "Request-sheet generated successfully", requestSheet });
  } catch (error) {
    res.status(500).json({ message: error?.message, error });
  }
});

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
              format: "%Y-%m-%d %H:%M:%S",
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
              format: "%Y-%m-%d %H:%M:%S",
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
      if (req?.rootUser?.tm_department === "MTD" && !req.purpose) {
        TLHOSS_and_TM_user_list = await User.find({
          user_type: { $in: ["Operator", "TL/HOSS"] },
          plant_data: req?.rootUser?.plant_data,
        });
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

router.get(
  "/getRequestSheetMonitoringData",
  middlewareForGettingAllDropdownList,
  queryObjectMiddlewareFunction,
  async (req, res, next) => {
    // const functionForQueryObject = (status) => ({
    //   $sum: {
    //     $cond: [{ $eq: ["$requestSheetStatus", status] }, 1, 0],
    //   },
    // });
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
        //     // "Fill sheet",
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

router.get(
  "/getMachineRequestSheetDetails/:machine_code/:requestSheetNoOfBM",
  async (req, res, next) => {
    try {
      let queryObj = {};

      if (req.params?.requestSheetNoOfBM) {
        queryObj = {
          requestSheetNoOfBM: req.params?.requestSheetNoOfBM,
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
            from: "subSections",
            localField: "subSectionRef",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  subSection_name: 1,
                },
              },
            ],
            as: "subSections",
          },
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
            from: "plants",
            localField: "plantRef",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  plant_name: 1,
                },
              },
            ],
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
              $arrayElemAt: ["$approvalOfPRD_TL", -1],
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

            partQualityStatusOfMTD: { $arrayElemAt: ["$namesMTD", 0] },
            partQualityStatusOfPRD: { $arrayElemAt: ["$namesPRD", 0] },

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
          },
        },
      ]);

      if (requestSheetData?.length === 0) {
        return res.status(400).json({
          message: "No data to display",
        });
      }

      res.status(201).json({
        message: "Request-sheet data get successfully",
        requestSheetData: requestSheetData?.[0],
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
      let { assignApprovalList, requestSheetDataOfBM } = req.body;

      if (
        !assignApprovalList?.MTD_TL &&
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
                // approvalOfMTD_TL: assignApprovalList?.MTD_TL,
                // approvalStatusOfMTD_TL: "Pending",
                // approvalDateAndTimeOfMTD_TL: new Date(),
                requestSheetStatus: "Under MTD TL Approval",
              },
              $push: {
                approvalOfMTD_TL: assignApprovalList?.MTD_TL,
                approvalStatusOfMTD_TL: "Pending",
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

      Object.keys(assignApprovalList).forEach(
        (key) =>
          assignApprovalList[key] === "" && delete assignApprovalList[key]
      );

      const updateTheStatusOfBMSheetApprover = async (
        keyOfDepartment,
        assignApprovalList
      ) => {
        let queryObjForUpdate = {},
          queryObjForPush = {};

        queryObjForUpdate = {
          ...queryObjForUpdate,
          [`approvalOf${keyOfDepartment}`]: assignApprovalList[keyOfDepartment],
          [`approvalStatusOf${keyOfDepartment}`]: `${keyOfDepartment.replace(
            "_",
            " "
          )} Approval Pending`,
          [`approvalDateAndTimeOf${keyOfDepartment}`]: new Date(),
        };

        queryObjForPush = {
          ...queryObjForPush,
          [`approvalOf${keyOfDepartment}`]: assignApprovalList[keyOfDepartment],
          [`approvalStatusOf${keyOfDepartment}`]: "Pending",
          approvalDateAndTimeOfMTD_TL: newDate(),
        };

        let resultOfUpdateStatusOfApprover =
          await RequestSheetOfBM.findOneAndUpdate(
            {
              requestSheetNoOfBM: req.params?.reqId,
            },
            {
              // $set: {
              //   ...queryObjForUpdate,
              //   requestSheetStatus: "MTD TL Approval Approved",
              // },
              $set: { "approvalStatusOfMTD_TL.$[-1]": "Accepted" },
              arrayFilters: [{ i: { $eq: -1 } }],
              $push: {
                ...queryObjForPush,
              },
            },

            { new: true }
          );
      };

      if (assignApprovalList?.minorBD === "Yes") {
        let updateRequestSheetStatus = await RequestSheetOfBM.findOneAndUpdate(
          {
            requestSheetNoOfBM: req?.params?.reqId,
          },
          {
            $set: {
              requestSheetStatus: `Under ${requestSheetDataOfBM?.plantRef?.approvalListOfMinorAndMajor?.minorApprovalList?.[1]} Approval`,
            },
          },
          { new: true }
        );
        Object.keys(assignApprovalList).forEach((key) => {
          if (
            requestSheetDataOfBM?.plantRef?.approvalListOfMinorAndMajor?.minorApprovalList?.includes(
              key.replace("_", " ")
            )
          ) {
            updateTheStatusOfBMSheetApprover(key, assignApprovalList);
          }
        });
        if (updateRequestSheetStatus)
          return res.status(201).json({
            message: `${req?.params?.reqId} Request-sheet approval send !!`,
          });
      } else {
        let updateRequestSheetStatus = await RequestSheetOfBM.findOneAndUpdate(
          {
            requestSheetNoOfBM: req?.params?.reqId,
          },
          {
            $set: {
              requestSheetStatus: `Under ${requestSheetDataOfBM?.plantRef?.approvalListOfMinorAndMajor?.majorApprovalList?.[1]} Approval`,
            },
          },
          { new: true }
        );
        Object.keys(assignApprovalList).forEach((key) => {
          if (
            requestSheetDataOfBM?.plantRef?.approvalListOfMinorAndMajor?.majorApprovalList?.includes(
              key.replace("_", " ")
            )
          ) {
            updateTheStatusOfBMSheetApprover(key, assignApprovalList);
          }
        });
        if (updateRequestSheetStatus)
          return res.status(201).json({
            message: `${req.params?.reqId} Request-sheet approval send !!`,
          });
      }

      console.log(resultOfUpdateStatusOfApprover);

      // if (resultOfUpdateStatusOfApprover) {
      //   res.status(201).json({ message: "Request-sheet approval send !!" });
      // } else {
      //   console.error();
      //   res.status(400).json({ message: "Approval not send" });
      // }
      //send email of approval to MTD TL (Remaining)
    } catch (error) {
      console.log(error);
    }
  }
);
const filterMiddleware = async (req, res, next) => {
  try {
    let queryObj = {};

    if (req.params?.filter === "based-on-cell") {
      queryObj = {
        cellRef: mongoose.Types.ObjectId(req.params?.selectedId),
        sheetCompletedDateAndTime: { $ne: null },
      };
    } else {
      queryObj = {
        lineRef: mongoose.Types.ObjectId(req.params?.selectedId),
        sheetCompletedDateAndTime: { $ne: null },
      };
    }

    req.queryObj = queryObj;
    next();
  } catch (error) {
    res.status(500).json({ message: error?.message, error });
  }
};

//          Daily breakdown trend
router.get(
  "/getDailyBreakdownTrendData/:filter/:selectedId",
  filterMiddleware,
  async (req, res, next) => {
    try {
      const startDate = moment().tz(timezone).startOf("month");

      const endDate = moment().tz(timezone).endOf("day");

      const allDatesInMonth = Array.from(
        { length: endDate.date() },
        (_, index) => startDate.clone().add(index, "days").format("DD")
      );

      const matchObj = {
        ...req.queryObj,
        sheetIssuedDateAndTimeOfBM: {
          $gte: startDate.toDate(),
          $lte: endDate.toDate(),
        },
      };

      const queryFunction = async ({ conditionObj }) =>
        RequestSheetOfBM.aggregate([
          {
            $match: matchObj,
          },
          {
            $sort: {
              _id: -1,
            },
          },
          {
            $addFields: {
              BDhour: {
                $divide: [
                  {
                    $subtract: [
                      "$sheetCompletedDateAndTime",
                      "$sheetIssuedDateAndTimeOfBM",
                    ],
                  },
                  3600000,
                ],
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
                  date: "$sheetIssuedDateAndTimeOfBM",
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
          $match: matchObj,
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
                date: "$sheetIssuedDateAndTimeOfBM",
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
        sheetIssuedDateAndTimeOfBM: {
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
                date: "$sheetIssuedDateAndTimeOfBM",
                timezone: timezone,
              },
            },
            count: { $sum: 1 },
            hours: {
              $sum: {
                $cond: [
                  { $gt: ["$sheetCompletedDateAndTime", null] },
                  {
                    $divide: [
                      {
                        $subtract: [
                          "$sheetCompletedDateAndTime",
                          "$sheetIssuedDateAndTimeOfBM",
                        ],
                      },
                      3600000,
                    ],
                  },
                  0,
                ],
              },
            },
            target: {
              $sum: {
                $cond: [
                  { $gt: ["$sheetCompletedDateAndTime", null] },
                  {
                    $divide: [
                      {
                        $subtract: [
                          "$sheetCompletedDateAndTime",
                          "$sheetIssuedDateAndTimeOfBM",
                        ],
                      },
                      3600000,
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
  "/getBDHoursGraphData/:purpose/:filter/:selectedId",
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
                date: "$sheetIssuedDateAndTimeOfBM",
                timezone: timezone,
              },
            },
            hours: {
              $sum: {
                $divide: [
                  {
                    $subtract: [
                      "$sheetCompletedDateAndTime",
                      "$sheetIssuedDateAndTimeOfBM",
                    ],
                  },
                  3600000,
                ],
              },
            },
            target: {
              $sum: {
                $divide: [
                  {
                    $subtract: [
                      "$sheetCompletedDateAndTime",
                      "$sheetIssuedDateAndTimeOfBM",
                    ],
                  },
                  3600000,
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
      // let arr = [
      //   {
      //     str: "half",
      //     int: 0.5,
      //   },
      //   {
      //     str: "one",
      //     int: 1,
      //   },
      //   {
      //     str: "two",
      //     int: 2,
      //   },
      //   {
      //     str: "three",
      //     int: 3,
      //   },
      // ];

      // let facetQueryObj = {};

      // let groupObj = {
      //   $group: {
      //     _id: {
      //       machine: "$machine._id",
      //       machine_code: "$machine.machine_code",
      //       machine_name: "$machine.machine_name",
      //     },
      //     count: { $sum: 1 },
      //     hours: {
      //       $sum: "$BDhours",
      //     },
      //   },
      // };
      // for (let i = 0; i < arr.length; i++) {
      //   let matchObj = {};

      //   if (i === 0) {
      //     matchObj = {
      //       BDhours: { $lte: arr[i]?.int },
      //     };
      //   } else if (i === arr?.length - 1) {
      //     matchObj = {
      //       BDhours: { $gte: arr[i]?.int },
      //     };
      //   } else {
      //     matchObj = {
      //       $and: [
      //         { BDhours: { $gt: arr[i - 1]?.int } },
      //         { BDhours: { $lte: arr[i]?.int } },
      //       ],
      //     };
      //   }
      //   facetQueryObj[arr[i]?.str] = [
      //     {
      //       $match: matchObj,
      //     },
      //     groupObj,
      //   ];
      // }
      // const BDHoursVsCountData = await RequestSheetOfBM.aggregate([
      //   // {
      //   //   $match: req.queryObj,
      //   // },

      //   {
      //     $match: {
      //       sheetCompletedDateAndTime: { $ne: null },
      //     },
      //   },
      //   {
      //     $lookup: {
      //       from: "machinesalldatas",
      //       localField: "machineRef",
      //       foreignField: "_id",
      //       pipeline: [
      //         {
      //           $project: {
      //             machine_code: 1,
      //             machine_name: 1,
      //           },
      //         },
      //       ],
      //       as: "machine",
      //     },
      //   },
      //   {
      //     $unwind: "$machine",
      //   },
      //   {
      //     $project: {
      //       requestSheetNoOfBM: 1,
      //       machine: 1,
      //       BDhours: {
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
      //     $bucket: {
      //       groupBy: "$BDhours",
      //       boundaries: [0, 2, 3], // 0 <= value < 2, 2<= value < 3
      //       // boundaries: [0, 3], // 0 <= value < 3
      //       default: "Other",
      //       output: {
      //         count: { $sum: 1 },
      //         sumOfBDhours: { $sum: "$BDhours" },
      //         machine: { $push: "$machine" },
      //       },
      //     },
      //   },
      //   {
      //     $group: {
      //       _id: null,
      //       array: { $push: "$$ROOT" },
      //     },
      //   },
      //   {
      //     $project: {
      //       _id: 0,
      //       data: {
      //         $map: {
      //           input: [
      //             {
      //               id: 0,
      //               key: "<2",
      //             },
      //             {
      //               id: 2,
      //               key: "<3",
      //             },
      //             // {
      //             //   id:3,
      //             //   key:"<Other"
      //             // }
      //           ],
      //           as: "item",
      //           in: {
      //             $cond: [
      //               { $in: ["$$item.id", "$array._id"] },
      //               {
      //                 _id: "$$item.key",
      //                 machine: "$array.machine",
      //                 count: {
      //                   $arrayElemAt: [
      //                     "$array.count",
      //                     {
      //                       $indexOfArray: ["$array._id", "$$item.id"],
      //                     },
      //                   ],
      //                 },
      //                 sumOfBDhours: {
      //                   $arrayElemAt: [
      //                     "$array.sumOfBDhours",
      //                     {
      //                       $indexOfArray: ["$array._id", "$$item.id"],
      //                     },
      //                   ],
      //                 },
      //               },
      //               {
      //                 _id: "$$item.key",
      //                 count: 0,
      //                 sumOfBDhours: 0,
      //               },
      //             ],
      //           },
      //         },
      //       },
      //     },
      //   },
      //   {
      //     $unwind: "$data",
      //   },
      //   {
      //     $replaceRoot: { newRoot: "$data" },
      //   },
      //   {
      //     $project: {
      //       _id: 0,
      //       machine: 1,
      //       groupId: "$_id",
      //       count: "$count",
      //       sumOfBDhours: "$sumOfBDhours",
      //     },
      //   },
      // ]);

      if (req.params?.filter === "based-on-cell") {
        queryPipeline = [
          {
            $lookup: {
              from: "lines",
              localField: "line_names",
              foreignField: "_id",
              pipeline: [
                {
                  $project: {
                    line_name: 1,
                    cell_names: 1,
                  },
                },
              ],
              as: "line",
            },
          },
          {
            $unwind: "$line",
          },
          {
            $match: {
              "line.cell_names": mongoose.Types.ObjectId(
                req.params?.selectedId
              ),
            },
          },
        ];
      } else {
        queryPipeline = [
          {
            $match: {
              line_names: mongoose.Types.ObjectId(req.params?.selectedId),
            },
          },
        ];
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
        // ...queryPipeline,
        {
          $project: {
            machine_code: 1,
            machine_name: 1,
          },
        },
        {
          $lookup: {
            from: "requestsheetofbms",
            localField: "_id",
            foreignField: "machineRef",
            pipeline: [
              {
                $match: {
                  sheetCompletedDateAndTime: { $ne: null },
                },
              },
              {
                $project: {
                  machineRef: 1,
                  requestSheetNoOfBM: 1,
                  sheetIssuedDateAndTimeOfBM: 1,
                  sheetCompletedDateAndTime: 1,
                  BDhours: {
                    $divide: [
                      {
                        $subtract: [
                          "$sheetCompletedDateAndTime",
                          "$sheetIssuedDateAndTimeOfBM",
                        ],
                      },
                      3600000,
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
        sheetIssuedDateAndTimeOfBM: {
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
    const problemCategoriesPieChart = await RequestSheetOfBM.aggregate([
      {
        $match: req.queryObj,
      },

      {
        $group: {
          _id:
             "$problemCategory",
         
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
            $push:  "$bdtime" ,
          },
          count: {
            $push: "$count" ,
          },
        },
      },
    ]);
    return res.status(400).json({
      message: "Categories data in PieChart get successfully",

      problemCategoriesPieChart: problemCategoriesPieChart?.[0],
    });
  }
);

// ---------------- BD Category Pie Chart -------------------
router.get(
  "/getBdCategoryPieChart/:filter/:selectedId",
  filterMiddleware,
  async (req, res, next) => {
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
            $push:  "$bdtime" ,
          },
          count: {
            $push: "$count" ,
          },
        },
      },
    ]);

    return res.status(200).json({
      message: "Categories data in PieChart get successfully",
      bdCategoryPieChart: bdCategoryPieChart?.[0],
    });
  }
);

// ---------------- BD percentage Chart -------------------
router.get(
  "/getBdPercentage/:filter/:selectedId",
  filterMiddleware,
  async (req, res, next) => {

    const getBdPercentage = await RequestSheetOfBM.aggregate([
      {
        $match: req.queryObj,
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
  }
);

// ---------------- MTBF Chart -------------------
router.get(
  "/getMtbfData/:filter/:selectedId",
  filterMiddleware,
  async (req, res, next) => {
    const getMtbf = await RequestSheetOfBM.aggregate([
      {
        $match: req.queryObj,
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
            $push: "$value.hours",
          },
        },
      },
    ]);

    return res.status(200).json({
      message: "MTBF data get successfully",

      getMtbf: getMtbf?.[0],
    });
  }
);

// ---------------- Monthly BD Trend Chart -------------------

router.get(
  "/hourlyMonthlyBdTrendForPlant/:plantId",
  // BdTrendFilterMiddleware,
  async (req, res, next) => {

    console.log(req.rootUser)
    let queryObj = {};

    queryObj = {
      plantRef: mongoose.Types.ObjectId(req.params.plantId),
      // sheetIssuedDateAndTimeOfBM: {
      //   $gte: startDate.toDate(),
      //   $lte: endDate.toDate(),
      // },
    };

    const monthlyBDTrendHourly = await RequestSheetOfBM.aggregate([
     
            {
              $match: queryObj,
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
          ],
        
    );

    return res.status(200).json({
      message: "PlantWise Monthly BD trend data get successfully",

      monthlyBDTrendHourly: monthlyBDTrendHourly?.[0],
    });
  }
);

// router.get(
//   "/sectionMonthlyBdTrendForPlant/:plantId",
//   // BdTrendFilterMiddleware,
//   async (req, res, next) => {
//     let queryObj = {};
//     let dateObj = {
//       $dateToString: {
//         format: "%m",
//         date: "$sheetIssuedDateAndTimeOfBM",
//         timezone: timezone,
//       },
//     };

//     queryObj = {
//       plantRef: mongoose.Types.ObjectId(req.params.plantId),
//       // sheetIssuedDateAndTimeOfBM: {
//       //   $gte: startDate.toDate(),
//       //   $lte: endDate.toDate(),
//       // },
//     };

//     const monthlyBDTrendSection = await RequestSheetOfBM.aggregate([
//       {
//         $match: queryObj,
//       },
//       {
//         $group: {
//           _id: {
//             date: dateObj,
//             sectionRef: "$sectionRef",
//           },
//           bdTimeSum: { $sum: "$bdTime" },
//         },
//       },

//       { 
//         $group: {
//           _id: "$_id.sectionRef",
//           sectionWiseTotal: {
//             $push: {
//               month: "$_id.date",
//               bdTimeSum: "$bdTimeSum",
//             },
//           },
//         },
//       },

    
//       {
//         $group: {
//           _id: null,
//           array: { $push: "$$ROOT" }, 
//         },
//       },

//       // {
//       //   $unwind: "$array",
//       // },
//       // {
//       //   $unwind: "$array.sectionWiseTotal",
//       // },
//       // {
//       //   $group: {
//       //     _id: {
//       //       sectionRef: "$array._id",
//       //     },
//       //     data: {
//       //       $push: {
//       //         month: "$array.sectionWiseTotal.month",
//       //         bdTimeSum: "$array.sectionWiseTotal.bdTimeSum",
//       //       },
//       //     },
//       //   },
//       // },
//       // {
//       //   $project: {
//       //     _id: 0,
//       //     sectionRef: "$_id.sectionRef",
//       //     data: 1,
//       //   },
//       // },

//       // {
//       //   $project: {
//       //     _id: 0,
//       //     array: {
//       //       $map: {
//       //         input: allMonths,
//       //         as: "month",
//       //         in: {
//       //           $let: {
//       //             vars: {
//       //               matchedMonth: {
//       //                 $filter: {
//       //                   input: "$array.data",
//       //                   as: "sectionData",
//       //                   cond: {
//       //                     $eq: ["$$sectionData.month", "$$month.monthInDecimal"]
//       //                   }
//       //                 }
//       //               }
//       //             },
//       //             in: {
//       //               $cond: [
//       //                 { $gt: [{ $size: "$$matchedMonth" }, 0] },
//       //                 {
//       //                   sectionRef: "$_id.sectionRef",
//       //                   bdSum: "$$matchedMonth.bdTimeSum"
//       //                 },
//       //                 {
//       //                   sectionRef: "$_id.sectionRef",
//       //                   bdSum: 0
//       //                 }
//       //               ]
//       //             }
//       //           }
//       //         }
//       //       }
//       //     }
//       //   }
//       // }
      
      
      

//       {
//         $project: {
//           _id: 0,
//           array: {
//             $map: {
//               input: allMonths,
//               as: "month",
//               in: {
    
//                 $cond: [
//                   {
                  
//                       $filter: {
//                         input: "$array",
//                         as: "sectionData",
//                         cond: {
//                           $eq: [ "$$month.monthInDecimal","$$sectionData.month"]
//                         }
//                       }
                    
//                   },
//                   {
//                     // section : "$array._id",
//                     month: "$$month.monthName",
//                     value: {
//                       $arrayElemAt: [
                     
//                         "$array.sectionWiseTotal",
//                         {
//                           $indexOfArray: [
//                             "$array.sectionWiseTotal.month",
//                             "$$month.monthInDecimal"
//                           ]
//                         }
//                       ]
//                     }
//                   },
//                   {
//                     month: "$$month.monthName",
//                     value: {
//                       _id: "$$month.monthInDecimal",
//                       sectionWiseTotal: 0
//                     }
//                   }
//                 ]
//               }
//             }
//           }
//         }
//       },
      

//       // { $unwind: "$array" },
//       // {
//       //   $replaceRoot: { newRoot: "$array" },
//       // },
//       // {
//       //   $group: {
//       //     _id: null,
//       //     labels: { $push: "$data.month" },
//       //     // target: { $push: "$value.target" },
//       //     // sections: {
//       //     //   $push: "$value.data.sectionRef",
//       //     // },
//       //     sections: {
//       //       $push: "$data.bdTimeSum",
//       //     },
//       //   },
//       // },
   
//     ]);

//     return res.status(200).json({
//       message: "PlantWise Monthly BD trend data for Section get successfully",

//       monthlyBDTrendSection: monthlyBDTrendSection,
//     });
//   }
// );



router.get(
  "/hourlyMonthlyBdTrendForSection/:sectionId",

  // BdTrendFilterMiddleware,
  async (req, res, next) => {
    let queryObj = {};
    let dateObj = {
      $dateToString: {
        format: "%m",
        date: "$sheetIssuedDateAndTimeOfBM",
        timezone: timezone,
      },
    };

    queryObj = {
      sectionRef: mongoose.Types.ObjectId(req.params.sectionId),
      // sheetIssuedDateAndTimeOfBM: {
      //   $gte: startDate.toDate(),
      //   $lte: endDate.toDate(),
      // },
    };

    const monthlyBDTrendHourly = await RequestSheetOfBM.aggregate([
      {
        $match: queryObj,
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
    ]);

    return res.status(200).json({
      message: "Section Wise Monthly BD trend data for hourly get successfully",

      monthlyBDTrendHourly: monthlyBDTrendHourly?.[0],
    });
  }
);

// router.get(
//   "/cellMonthlyBdTrendForSection/:sectionId",

//   // BdTrendFilterMiddleware,
//   async (req, res, next) => {
//     let queryObj = {};
//     let dateObj = {
//       $dateToString: {
//         format: "%m",
//         date: "$sheetIssuedDateAndTimeOfBM",
//         timezone: timezone,
//       },
//     };

//     queryObj = {
//       sectionRef: mongoose.Types.ObjectId(req.params.sectionId),
//       // sheetIssuedDateAndTimeOfBM: {
//       //   $gte: startDate.toDate(),
//       //   $lte: endDate.toDate(),
//       // },
//     };

//     const monthlyBDTrendCell = await RequestSheetOfBM.aggregate([
//       {
//         $match: queryObj,
//       },
//       {
//         $group: {
//           _id: {
//             date: dateObj,
//             cellRef: "$cellRef",
//           },
//           bdTimeSum: { $sum: "$bdTime" },
//         },
//       },

//       {
//         $group: {
//           _id: "$_id.date",
//           cellWiseTotal: {
//             $push: {
//               cellRef: "$_id.cellRef",
//               bdTimeSum: "$bdTimeSum",
//             },
//           },
//         },
//       },

//       {
//         $group: {
//           _id: null,
//           array: { $push: "$$ROOT" },
//         },
//       },

//       // {
//       //   $project: {
//       //     _id: 0,
//       //     array: {
//       //       $map: {
//       //         input: allMonths,
//       //         as: "month",
//       //         in: {
//       //           $cond: [
//       //             { $in: ["$$month.monthInDecimal", "$array._id"] },
//       //             {
//       //               month: "$$month.monthName",
//       //               value: {
//       //                 $arrayElemAt: [
//       //                   "$array",
//       //                   {
//       //                     $indexOfArray: [
//       //                       "$array._id",
//       //                       "$$month.monthInDecimal",
//       //                     ],
//       //                   },
//       //                 ],
//       //               },
//       //             },
//       //             {
//       //               month: "$$month.monthName",
//       //               value: {
//       //                 _id: "$$month.monthInDecimal",
//       //                 cellWiseTotal: 0,
//       //               },
//       //             },
//       //           ],
//       //         },
//       //       },
//       //     },
//       //   },
//       // },
//       // { $unwind: "$array" },
//       // {
//       //   $replaceRoot: { newRoot: "$array" },
//       // },
//       // {
//       //   $group: {
//       //     _id: null,
//       //     labels: { $push: "$month" },
//       //     // target: { $push: "$value.target" },
//       //     cells: {
//       //       $push: "$value.cellWiseTotal",
//       //     },
//       //   },
//       // },
//     ]);

//     return res.status(200).json({
//       message: "Section Wise Monthly BD trend data for cell get successfully",

//       monthlyBDTrendCell: monthlyBDTrendCell?.[0],
//     });
//   }
// );

// ---------------- Yearly BD Trend Chart -------------------

router.get(
  "/hourlyYearlyBdTrendForPlant/:plantId",
  // BdTrendFilterMiddleware,
  async (req, res, next) => {
    let queryObj = {};

    queryObj = {
      plantRef: mongoose.Types.ObjectId(req.params.plantId),

      sheetIssuedDateAndTimeOfBM: {
        $gte: moment().startOf("year").toDate(),
        $lt: moment().startOf("year").add(1, "year").toDate(),
      },
    };
    let queryObj2 = {};

    queryObj2 = {
      plantRef: mongoose.Types.ObjectId(req.params.plantId),

      sheetIssuedDateAndTimeOfBM: {
        $gte: moment().subtract(1, "year").startOf("year").toDate(),
        $lt: moment().subtract(1, "year").endOf("year").toDate(),
      },
    };

    const yearlyBDTrendHourly = await RequestSheetOfBM.aggregate([
      {
        $facet: {
          currentYear: [
            {
              $match: queryObj,
            },
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%Y",
                    date: "$sheetIssuedDateAndTimeOfBM",
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

            { $unwind: "$array" },
            {
              $replaceRoot: { newRoot: "$array" },
            },
            {
              $group: {
                _id: null,
                labels: { $push: "$_id" },
                // target: { $push: "$value.target" },
                lessThanOne: {
                  $push: "$lessThanOne",
                },
                lessThanTwo: {
                  $push: "$lessThanTwo",
                },
                greaterThanTwo: {
                  $push: "$greaterThanTwo",
                },
              },
            },
          ],

          finacialYear: [
            {
              $match: queryObj2,
            },
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%Y",
                    date: "$sheetIssuedDateAndTimeOfBM",
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

            { $unwind: "$array" },
            {
              $replaceRoot: { newRoot: "$array" },
            },
            {
              $group: {
                _id: null,
                labels: { $push: "$_id" },
                // target: { $push: "$value.target" },
                lessThanOne: {
                  $push: "$lessThanOne",
                },
                lessThanTwo: {
                  $push: "$lessThanTwo",
                },
                greaterThanTwo: {
                  $push: "$greaterThanTwo",
                },
              },
            },
          ],
        },
      },
    ]);
    return res.status(200).json({
      message: "Plant Wise Yearly BD trend data get successfully",

      yearlyBDTrendHourly: yearlyBDTrendHourly?.[0],
    });
  }
);

// router.get(
//   "/sectionYearlyBdTrendForPlant/:plantId",
//   // BdTrendFilterMiddleware,
//   async (req, res, next) => {
//     let queryObj = {};
//     let queryObj2 = {};
//     let dateObj = {
//       $dateToString: {
//         format: "%Y",
//         date: "$sheetIssuedDateAndTimeOfBM",
//         timezone: timezone,
//       },
//     };

//     queryObj = {
//       plantRef: mongoose.Types.ObjectId(req.params.plantId),

//       sheetIssuedDateAndTimeOfBM: {
//         $gte: moment().startOf("year").toDate(),
//         $lt: moment().startOf("year").add(1, "year").toDate(),
//       },
//     };
//     queryObj2 = {
//       plantRef: mongoose.Types.ObjectId(req.params.plantId),

//       sheetIssuedDateAndTimeOfBM: {
//         $gte: moment().subtract(1, "year").startOf("year").toDate(),
//         $lt: moment().subtract(1, "year").endOf("year").toDate(),
//       },
//     };

//     const yearlyBDTrendSection = await RequestSheetOfBM.aggregate([
//       {
//         $facet: {
//           currentYear: [
//             {
//               $match: queryObj,
//             },
//             {
//               $group: {
//                 _id: {
//                   date: dateObj,
//                   sectionRef: "$sectionRef",
//                 },
//                 bdTimeSum: { $sum: "$bdTime" },
//               },
//             },

//             {
//               $group: {
//                 _id: "$_id.date",
//                 sectionWiseTotal: {
//                   $push: {
//                     sectionRef: "$_id.sectionRef",
//                     bdTimeSum: "$bdTimeSum",
//                   },
//                 },
//               },
//             },

//             {
//               $group: {
//                 _id: null,
//                 array: { $push: "$$ROOT" },
//               },
//             },

//             { $unwind: "$array" },
//             {
//               $replaceRoot: { newRoot: "$array" },
//             },
//             {
//               $group: {
//                 _id: null,
//                 labels: { $push: "$_id" },
//                 // target: { $push: "$value.target" },
//                 sections: {
//                   $push: "$sectionWiseTotal",
//                 },
//               },
//             },
//           ],
//           financialYear: [
//             {
//               $match: queryObj2,
//             },
//             {
//               $group: {
//                 _id: {
//                   date: dateObj,
//                   sectionRef: "$sectionRef",
//                 },
//                 bdTimeSum: { $sum: "$bdTime" },
//               },
//             },

//             {
//               $group: {
//                 _id: "$_id.date",
//                 sectionWiseTotal: {
//                   $push: {
//                     sectionRef: "$_id.sectionRef",
//                     bdTimeSum: "$bdTimeSum",
//                   },
//                 },
//               },
//             },

//             {
//               $group: {
//                 _id: null,
//                 array: { $push: "$$ROOT" },
//               },
//             },

//             { $unwind: "$array" },
//             {
//               $replaceRoot: { newRoot: "$array" },
//             },
//             {
//               $group: {
//                 _id: null,
//                 labels: { $push: "$_id" },
//                 // target: { $push: "$value.target" },
//                 sections: {
//                   $push: "$sectionWiseTotal",
//                 },
//               },
//             },
//           ],
//         },
//       },
//     ]);
//     return res.status(200).json({
//       message: "Plant Wise Yearly BD trend data get successfully",

//       yearlyBDTrendSection: yearlyBDTrendSection?.[0],
//     });
//   }
// );

router.get(
  "/hourlyYearlyBdTrendForSection/:sectionId",
  // BdTrendFilterMiddleware,
  async (req, res, next) => {
    let queryObj = {};
    let queryObj2 = {};

    queryObj = {
      sectionRef: mongoose.Types.ObjectId(req.params.sectionId),
      sheetIssuedDateAndTimeOfBM: {
        $gte: moment().startOf("year").toDate(),
        $lt: moment().startOf("year").add(1, "year").toDate(),
      },
    };

    queryObj2 = {
      sectionRef: mongoose.Types.ObjectId(req.params.sectionId),

      sheetIssuedDateAndTimeOfBM: {
        $gte: moment().subtract(1, "year").startOf("year").toDate(),
        $lt: moment().subtract(1, "year").endOf("year").toDate(),
      },
    };

    const yearlyBDTrendHourly = await RequestSheetOfBM.aggregate([
      {
        $facet: {
          currentYear: [
            {
              $match: queryObj,
            },
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%Y",
                    date: "$sheetIssuedDateAndTimeOfBM",
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

            { $unwind: "$array" },
            {
              $replaceRoot: { newRoot: "$array" },
            },
            {
              $group: {
                _id: null,
                labels: { $push: "$_id" },
                // target: { $push: "$value.target" },
                lessThanOne: {
                  $push: "$lessThanOne",
                },
                lessThanTwo: {
                  $push: "$lessThanTwo",
                },
                greaterThanTwo: {
                  $push: "$greaterThanTwo",
                },
              },
            },
          ],

          financialYear: [
            {
              $match: queryObj2,
            },
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%Y",
                    date: "$sheetIssuedDateAndTimeOfBM",
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

            { $unwind: "$array" },
            {
              $replaceRoot: { newRoot: "$array" },
            },
            {
              $group: {
                _id: null,
                labels: { $push: "$_id" },
                // target: { $push: "$value.target" },
                lessThanOne: {
                  $push: "$lessThanOne",
                },
                lessThanTwo: {
                  $push: "$lessThanTwo",
                },
                greaterThanTwo: {
                  $push: "$greaterThanTwo",
                },
              },
            },
          ],
        },
      },
    ]);
    return res.status(200).json({
      message: "Section Wise Yearly BD trend data get successfully",

      yearlyBDTrendHourly: yearlyBDTrendHourly?.[0],
    });
  }
);

// router.get(
//   "/cellYearlyBdTrendForSection/:sectionId",
//   // BdTrendFilterMiddleware,
//   async (req, res, next) => {
//     let queryObj = {};
//     let queryObj2 = {};
//     let dateObj = {
//       $dateToString: {
//         format: "%Y",
//         date: "$sheetIssuedDateAndTimeOfBM",
//         timezone: timezone,
//       },
//     };

//     queryObj = {
//       sectionRef: mongoose.Types.ObjectId(req.params.sectionId),
//       sheetIssuedDateAndTimeOfBM: {
//         $gte: moment().startOf("year").toDate(),
//         $lt: moment().startOf("year").add(1, "year").toDate(),
//       },
//     };

//     queryObj2 = {
//       sectionRef: mongoose.Types.ObjectId(req.params.sectionId),

//       sheetIssuedDateAndTimeOfBM: {
//         $gte: moment().subtract(1, "year").startOf("year").toDate(),
//         $lt: moment().subtract(1, "year").endOf("year").toDate(),
//       },
//     };

//     const yearlyBDTrendCell = await RequestSheetOfBM.aggregate([
//       {
//         $facet: {
//           currentYear: [
//             {
//               $match: queryObj,
//             },
//             {
//               $group: {
//                 _id: {
//                   date: dateObj,
//                   cellRef: "$cellRef",
//                 },
//                 bdTimeSum: { $sum: "$bdTime" },
//               },
//             },

//             {
//               $group: {
//                 _id: "$_id.date",
//                 cellWiseTotal: {
//                   $push: {
//                     cellRef: "$_id.cellRef",
//                     bdTimeSum: "$bdTimeSum",
//                   },
//                 },
//               },
//             },

//             {
//               $group: {
//                 _id: null,
//                 array: { $push: "$$ROOT" },
//               },
//             },

//             { $unwind: "$array" },
//             {
//               $replaceRoot: { newRoot: "$array" },
//             },
//             {
//               $group: {
//                 _id: null,
//                 labels: { $push: "$_id" },
//                 // target: { $push: "$value.target" },
//                 cells: {
//                   $push: "$cellWiseTotal",
//                 },
//               },
//             },
//           ],

//           financialYear: [
//             {
//               $match: queryObj2,
//             },
//             {
//               $group: {
//                 _id: {
//                   date: dateObj,
//                   cellRef: "$cellRef",
//                 },
//                 bdTimeSum: { $sum: "$bdTime" },
//               },
//             },

//             {
//               $group: {
//                 _id: "$_id.date",
//                 cellWiseTotal: {
//                   $push: {
//                     cellRef: "$_id.cellRef",
//                     bdTimeSum: "$bdTimeSum",
//                   },
//                 },
//               },
//             },

//             {
//               $group: {
//                 _id: null,
//                 array: { $push: "$$ROOT" },
//               },
//             },

//             { $unwind: "$array" },
//             {
//               $replaceRoot: { newRoot: "$array" },
//             },
//             {
//               $group: {
//                 _id: null,
//                 labels: { $push: "$_id" },
//                 // target: { $push: "$value.target" },
//                 cells: {
//                   $push: "$cellWiseTotal",
//                 },
//               },
//             },
//           ],
//         },
//       },
//     ]);
//     return res.status(200).json({
//       message: "Section Wise Yearly BD trend data get successfully",

//       yearlyBDTrendCell: yearlyBDTrendCell?.[0],
//     });
//   }
// );




// ---------------- Major BD Count Chart -------------------
// router.get(
//   "/majorBDCount/:plantId",
//   // BdTrendFilterMiddleware,
//   async (req, res, next) => {
//     let queryObj = {};
//     let dateObj = {
//       $dateToString: {
//         format: "%m",
//         date: "$sheetIssuedDateAndTimeOfBM",
//         timezone: timezone,
//       },
//     };

//     queryObj = {
//       plantRef: mongoose.Types.ObjectId(req.params.plantId),
//       // sheetIssuedDateAndTimeOfBM: {
//       //   $gte: moment().startOf("year").toDate(),
//       //   $lt: moment().startOf("year").add(1, "year").toDate(),
//       // },
//     };

//     const sectionWiseMonthlyBDTrend = [
//       // if(req.params.filterWise === "Plant"){
//       {
//         $facet: {
//           sectionHourlyData: [
//             {
//               $match: queryObj,
//             },
//             {
//               $group: {
//                 _id: {
//                   dateObj,

//                   sectionRef: "$sectionRef",
//                 },
//                 bdTimeSum: { $sum: "$bdTime" },
//               },
//             },
//             {
//               $group: {
//                 _id: "$_id.dateObj",
//                 sectionWiseTotal: {
//                   $push: {
//                     sectionRef: "$_id.sectionRef",
//                     bdTimeSum: "$bdTimeSum",
//                   },
//                 },
//               },
//             },
//             {
//               $group: {
//                 _id: null,
//                 array: { $push: "$$ROOT" },
//               },
//             },

//             {
//               $project: {
//                 _id: 0,
//                 array: {
//                   $map: {
//                     input: allMonths,
//                     as: "month",
//                     in: {
//                       $cond: [
//                         { $in: ["$$month.monthInDecimal", "$array._id"] },
//                         {
//                           month: "$$month.monthName",
//                           value: {
//                             $arrayElemAt: [
//                               "$array",
//                               {
//                                 $indexOfArray: [
//                                   "$array._id",
//                                   "$$month.monthInDecimal",
//                                 ],
//                               },
//                             ],
//                           },
//                         },
//                         {
//                           month: "$$month.monthName",
//                           value: {
//                             _id: "$$month.monthInDecimal",
//                             sectionRef: 0,
//                             bdTimeSum: 0,
//                           },
//                         },
//                       ],
//                     },
//                   },
//                 },
//               },
//             },

//             { $unwind: "$array" },
//             {
//               $replaceRoot: { newRoot: "$array" },
//             },
//             {
//               $group: {
//                 _id: null,
//                 labels: { $push: "$month" },
//                 // target: { $push: "$value.target" },
//                 sectionRef: {
//                   $push: "$value.sectionWiseTotal.sectionRef",
//                 },
//                 bdTimeSum: {
//                   $push: "$value.sectionWiseTotal.bdTimeSum",
//                 },
//               },
//             },

//             // {
//             //   $group: {
//             //     _id: null,
//             //     labels: { $push: "$month" },
//             //     // target: { $push: "$value.target" },
//             //     sectionRef: {
//             //       $push: "$value.sectionWiseTotal.sectionRef",
//             //     },
//             //     bdTimeSum: {
//             //       $push: "$value.sectionWiseTotal.bdTimeSum",
//             //     },

//             //   },
//             // },
//           ],

//           // cellTotalData: [
//           //   {
//           //     $match: queryObj,
//           //   },
//           //   {
//           //     $group: {
//           //       _id: {
//           //         date: dateObj,
//           //         cellRef: "$cellRef",
//           //       },
//           //       bdTimeSum: { $sum: "$bdTime" },
//           //     },
//           //   },

//           //   {
//           //     $group: {
//           //       _id: "$_id.date",
//           //       cellWiseTotal: {
//           //         $push: {
//           //           cellRef: "$_id.cellRef",
//           //           bdTimeSum: "$bdTimeSum",
//           //         },
//           //       },
//           //     },
//           //   },
//           //   // {
//           //   //   $project: {
//           //   //     _id: 0,
//           //   //     date: "$_id",
//           //   //     sectionWiseTotal: 1,
//           //   //   },
//           //   // },

//           //   {
//           //     $group: {
//           //       _id: null,
//           //       array: { $push: "$$ROOT" },
//           //     },
//           //   },

//           //   { $unwind: "$array" },
//           //   {
//           //     $replaceRoot: { newRoot: "$array" },
//           //   },
//           //   {
//           //     $group: {
//           //       _id: null,
//           //       labels: { $push: "$_id" },
//           //       // target: { $push: "$value.target" },
//           //       cells: {
//           //         $push: "$cellWiseTotal",
//           //       },
//           //     },
//           //   },
//           // ],
//         },
//       },
//     ];

//     const bdTrend = await RequestSheetOfBM.aggregate(sectionWiseMonthlyBDTrend);

//     return res.status(200).json({
//       message: "Monthly BD trend data get successfully",
//       totalCategories: bdTrend.length,
//       bdTrend: bdTrend?.[0],
//     });
//   }
// );

// ---------------- LineWise BD Contribution Charts -------------------

router.get(
  "/monthlyLineWiseBdContributionForPlant/:plantId",
  // BdTrendFilterMiddleware,
  async (req, res, next) => {
    let queryObj = {};

    queryObj = {
      plantRef: mongoose.Types.ObjectId(req.params.plantId),
      sheetIssuedDateAndTimeOfBM: {
        $gte: moment().startOf("month").toDate(),
        $lt: moment().startOf("month").add(1, "month").toDate(),
      },
    };


    const monthlyLineWiseBDContribution = await RequestSheetOfBM.aggregate([
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
      monthlyLineWiseBDContribution: monthlyLineWiseBDContribution?.[0],
    });
  }
);

router.get(
  "/yearlyLineWiseBdContributionForPlant/:plantId",
  // BdTrendFilterMiddleware,
  async (req, res, next) => {
    let queryObj = {};

    queryObj = {
      plantRef: mongoose.Types.ObjectId(req.params.plantId),
      sheetIssuedDateAndTimeOfBM: {
        $gte: moment().startOf("year").toDate(),
        $lt: moment().startOf("year").add(1, "year").toDate(),
      },
    };

    const yearlyLineWiseBDContribution = await RequestSheetOfBM.aggregate([
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
      yearlyLineWiseBDContribution: yearlyLineWiseBDContribution?.[0],
    });
  }
);

router.get(
  "/yearlyLineWiseBdContributionForSection",
  middlewareForGettingAllDropdownList,
  queryObjectMiddlewareFunction,
  async (req, res, next) => {
    let queryObj = {};

    let queryObj2 = {};

    // queryObj = {
    //   sectionRef: mongoose.Types.ObjectId(req.params.sectionId),
    //   sheetIssuedDateAndTimeOfBM: {
    //     $gte: moment().startOf("month").toDate(),
    //     $lt: moment().startOf("month").add(1, "month").toDate(),
    //   },
    // };
    // queryObj2 = {
    //   sectionRef: mongoose.Types.ObjectId(req.params.sectionId),
    //   sheetIssuedDateAndTimeOfBM: {
    //     $gte: moment().startOf("year").toDate(),
    //     $lt: moment().startOf("year").add(1, "year").toDate(),
    //   },
    // };

    const monthlyLineWiseBDContribution = await RequestSheetOfBM.aggregate([
      {
        $match: req.queryObj,
      },
      {
        $match: {
          sheetIssuedDateAndTimeOfBM: {
            $gte: moment().startOf("year").toDate(),
            $lt: moment().startOf("year").add(1, "year").toDate(),
          },
        },
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
      monthlyLineWiseBDContribution: monthlyLineWiseBDContribution?.[0],
    });
  }
);

router.get(
  "/monthlyLineWiseBdContributionForSection",
  middlewareForGettingAllDropdownList,
  queryObjectMiddlewareFunction,
  async (req, res, next) => {
    let queryObj = {};

    let queryObj2 = {};

    // queryObj = {
    //   sectionRef: mongoose.Types.ObjectId(req.params.sectionId),
    //   sheetIssuedDateAndTimeOfBM: {
    //     $gte: moment().startOf("month").toDate(),
    //     $lt: moment().startOf("month").add(1, "month").toDate(),
    //   },
    // };
    // queryObj2 = {
    //   sectionRef: mongoose.Types.ObjectId(req.params.sectionId),
    //   sheetIssuedDateAndTimeOfBM: {
    //     $gte: moment().startOf("year").toDate(),
    //     $lt: moment().startOf("year").add(1, "year").toDate(),
    //   },
    // };

    const monthlyLineWiseBDContribution = await RequestSheetOfBM.aggregate([
      {
        $match: req.queryObj,
      },

      {
        $match: {
          sheetIssuedDateAndTimeOfBM: {
            $gte: moment().startOf("month").toDate(),
            $lt: moment().startOf("month").add(1, "month").toDate(),
          },
        },
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
        $group: {
          _id: null,

          lineNames: { $push: "$_id" },
          bdHours: { $push: "$bdHours" },
          percentages: { $push: { $trunc: ["$percentage", 1] } },
        },
      },
    ]);
    return res.status(200).json({
      message: "LineWise Bd contribution for Section get successfully",
      monthlyLineWiseBDContribution: monthlyLineWiseBDContribution?.[0],
    });
  }
);

router.get(
  "/monthlyLineWiseBdContributionForCell",
  middlewareForGettingAllDropdownList,
  queryObjectMiddlewareFunction,
  async (req, res, next) => {
    let queryObj = {};
    let queryObj2 = {};

    // queryObj = {
    //   cellRef: mongoose.Types.ObjectId(req.params.cellId),
    //   sheetIssuedDateAndTimeOfBM: {
    //     $gte: moment().startOf("month").toDate(),
    //     $lt: moment().startOf("month").add(1, "month").toDate(),
    //   },
    // };
    // queryObj2 = {
    //   cellRef: mongoose.Types.ObjectId(req.params.cellId),
    //   sheetIssuedDateAndTimeOfBM: {
    //     $gte: moment().startOf("year").toDate(),
    //     $lt: moment().startOf("year").add(1, "year").toDate(),
    //   },
    // };

    const monthlyLineWiseBDContribution = await RequestSheetOfBM.aggregate([
      {
        $match: req.queryObj,
      },

      {
        $match: {
          sheetIssuedDateAndTimeOfBM: {
            $gte: moment().startOf("month").toDate(),
            $lt: moment().startOf("month").add(1, "month").toDate(),
          },
        },
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
      monthlyLineWiseBDContribution: monthlyLineWiseBDContribution?.[0],
    });
  }
);

router.get(
  "/yearlyLineWiseBdContributionForCell",
  middlewareForGettingAllDropdownList,
  queryObjectMiddlewareFunction,
  async (req, res, next) => {
    let queryObj = {};
    let queryObj2 = {};

    // queryObj = {
    //   cellRef: mongoose.Types.ObjectId(req.params.cellId),
    //   sheetIssuedDateAndTimeOfBM: {
    //     $gte: moment().startOf("month").toDate(),
    //     $lt: moment().startOf("month").add(1, "month").toDate(),
    //   },
    // };
    // queryObj2 = {
    //   cellRef: mongoose.Types.ObjectId(req.params.cellId),
    //   sheetIssuedDateAndTimeOfBM: {
    //     $gte: moment().startOf("year").toDate(),
    //     $lt: moment().startOf("year").add(1, "year").toDate(),
    //   },
    // };

    const yearlyLineWiseBDContribution = await RequestSheetOfBM.aggregate([
      {
        $match: req.queryObj,
      },

      {
        $match: {
          sheetIssuedDateAndTimeOfBM: {
            $gte: moment().startOf("year").toDate(),
            $lt: moment().startOf("year").add(1, "year").toDate(),
          },
        },
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
      yearlyLineWiseBDContribution: yearlyLineWiseBDContribution?.[0],
    });
  }
);

// router.get(
//   "/MTTRTrendTmMttrSkill/:sectionId",
//   // middlewareForGettingAllDropdownList,
//   // queryObjectMiddlewareFunction,
//   async (req, res, next) => {
//     let queryObj = {};

//     let queryObj2 = {};

//     queryObj = {
//       sectionRef: mongoose.Types.ObjectId(req.params.sectionId),
//       sheetIssuedDateAndTimeOfBM: {
//         $gte: moment().startOf("month").toDate(),
//         $lt: moment().startOf("month").add(1, "month").toDate(),
//       },
//     };

//     const monthlyLineWiseBDContribution = await RequestSheetOfBM.aggregate([
//       {
//         $match: queryObj,
//       },
//       {
//         $lookup: {
//           from: "users",
//           localField: "requestSheetCreatedBy",
//           foreignField: "_id",
//           as: "user_data",
//         },
//       },

//       {
//         $unwind: "$user_data",
//       },

//       {
//         $group: {
//           _id: "$user_data.tm_name",

//           count :  {$sum : 1},
//           // totalBdTime: { $sum: "$bdTime" },
//           bdHoursLineWise: {
//             $sum: {
//               $cond: [{ $lte: ["$bdTime", 2] }, "$bdTime", 0],
//             },
//           },
//         },
//       },

//       {
//         $project: {
//           count: 1,
//           hours: {
//             $divide: [ "$bdHoursLineWise", "$count"],
//           },
//         },
//       },

//       {
//         $group: {
//           _id: null,

//           lineNames: { $push: "$_id" },
//           bdHours: { $push: "$hours" },

//         },
//       },

//     ]);
//     return res.status(200).json({
//       message: "LineWise Bd contribution for Section get successfully",
//       monthlyLineWiseBDContribution,
//     });
//   }
// );

// const fetchYearAndMonthsMiddleware = async (req, res, next) => {

//     const { userId } = req.params;
//     const values = await RequestSheetOfBM.find({ requestSheetCreatedBy: userId });

//     const years = Array.from(new Set(values.map(val => new Date(val.sheetIssuedDateAndTimeOfBM).getFullYear())));

//     const yearAndMonths = years.map(year => {
//       const monthsOfYear = values
//         .filter(val => new Date(val.sheetIssuedDateAndTimeOfBM).getFullYear() === year)
//         .map(val => new Date(val.sheetIssuedDateAndTimeOfBM).getUTCMonth() + 1);

//       return { year, months: Array.from(new Set(monthsOfYear)) };
//     });

//     console.log(yearAndMonths);

//     req.yearAndMonths = yearAndMonths;

//     next();

// };

// router.get(
//   "/tmProgressTmMttrSkill/:userId",
//   fetchYearAndMonthsMiddleware,
//   async (req, res, next) => {
//     try {
//       let queryObj = {};
//       let dateObj = {
//         $dateToString: {
//           format: "%m",
//           date: "$sheetIssuedDateAndTimeOfBM",
//           timezone: timezone,
//         },
//       };

//       const { selectedYear, selectedMonth } = req.query;

//       queryObj = {
//         requestSheetCreatedBy: mongoose.Types.ObjectId(req.params.userId),
//         sheetIssuedDateAndTimeOfBM: {
//           $gte: moment(selectedYear, "YYYY").startOf("year").toDate(),
//           $lt: moment(selectedYear, "YYYY").startOf("year").add(1, "year").toDate(),
//         },
//       };

//       console.log(queryObj)

//       if (selectedMonth) {
//         queryObj.sheetIssuedDateAndTimeOfBM.$gte = moment(selectedMonth, "MM").startOf("month").toDate();
//         queryObj.sheetIssuedDateAndTimeOfBM.$lt = moment(selectedMonth, "MM").endOf("month").toDate();
//       }

//       const tmProgress = await RequestSheetOfBM.aggregate([
//         { $match: queryObj },
//         {
//           $group: {
//             _id: dateObj,
//             count: { $sum: 1 },
//             bdHoursLineWise: {
//               $sum: {
//                 $cond: [{ $lte: ["$bdTime", 2] }, "$bdTime", 0],
//               },
//             },
//           },
//         },
//         {
//           $project: {
//             count: 1,
//             hours: {
//               $divide: ["$bdHoursLineWise", "$count"],
//             },
//           },
//         },
//         {
//           $group: {
//             _id: null,
//             array: { $push: "$$ROOT" },
//           },
//         },

//         // {
//         //   $project: {
//         //     _id: 0,
//         //     array: {
//         //       $map: {
//         //         input: req.yearAndMonths,
//         //         as: "month",
//         //         in: {
//         //           $cond: [
//         //             { $eq: ["$$month.year", parseInt(selectedYear)] },
//         //             {
//         //               month: "$$month.months",
//         //               value: {
//         //                 $arrayElemAt: [
//         //                   "$array",
//         //                   {
//         //                     $indexOfArray: [
//         //                       "$array._id",
//         //                       "$$month.monthInDecimal",
//         //                     ],
//         //                   },
//         //                 ],
//         //               },
//         //             },
//         //             {
//         //               month: "$$month.months",
//         //               value: {
//         //                 _id: "$$month.monthInDecimal",
//         //                 hours: 0,
//         //               },
//         //             },
//         //           ],
//         //         },
//         //       },
//         //     },
//         //   },
//         // },
//         // { $unwind: "$array" },
//         // {
//         //   $replaceRoot: { newRoot: "$array" },
//         // },
//         // {
//         //   $group: {
//         //     _id: null,
//         //     labels: { $push: "$value._id" },
//         //     data: {
//         //       $push: "$value.hours",
//         //     },
//         //   },
//         // },
//       ]);

//       return res.status(200).json({
//         message: "TM Progress get successfully",
//         tmProgress,
//       });
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ error: 'Internal Server Error' });
//     }
//   }
// );

// router.get(
//   "/tmProgressTmMttrSkill/:userId",
//   fetchYearAndMonthsMiddleware,
//   // middlewareForGettingAllDropdownList,
//   // queryObjectMiddlewareFunction,
//   async (req, res, next) => {
//     let queryObj = {};
//     let dateObj = {
//       $dateToString: {
//         format: "%m",
//         date: "$sheetIssuedDateAndTimeOfBM",
//         timezone: timezone,
//       },
//     };

//     queryObj = {
//       // sectionRef: mongoose.Types.ObjectId(req.params.sectionId),
//       requestSheetCreatedBy: mongoose.Types.ObjectId(req.params.userId),
//       sheetIssuedDateAndTimeOfBM: {
//         $gte: moment().startOf("year").toDate(),
//         $lt: moment().startOf("year").add(1, "year").toDate(),
//       },
//     };

//     const tmProgress = await RequestSheetOfBM.aggregate([
//       {
//         $match: queryObj,
//       },

//       {
//         $group: {
//           _id: dateObj,

//           count :  {$sum : 1},
//           // totalBdTime: { $sum: "$bdTime" },
//           bdHoursLineWise: {
//             $sum: {
//               $cond: [{ $lte: ["$bdTime", 2] }, "$bdTime", 0],
//             },
//           },
//         },
//       },
//       {
//         $project: {
//           count: 1,
//           hours: {
//             $divide: [ "$bdHoursLineWise", "$count"],
//           },
//         },
//       },

//       {
//         $group: {
//           _id: null,
//           array: { $push: "$$ROOT" },
//         },
//       },
//       {
//         $project: {
//           _id: 0,
//           array: {
//             $map: {
//               input: allMonths,
//               as: "month",
//               in: {
//                 $cond: [
//                   { $in: ["$$month.monthInDecimal", "$array._id"] },
//                   {
//                     month: "$$month.monthName",
//                     value: {
//                       $arrayElemAt: [
//                         "$array",
//                         {
//                           $indexOfArray: [
//                             "$array._id",
//                             "$$month.monthInDecimal",
//                           ],
//                         },
//                       ],
//                     },
//                   },
//                   {
//                     month: "$$month.monthName",
//                     value: {
//                       _id: "$$month.monthInDecimal",
//                       hours: 0,
//                     },
//                   },
//                 ],
//               },
//             },
//           },
//         },
//       },
//       { $unwind: "$array" },
//       {
//         $replaceRoot: { newRoot: "$array" },
//       },
//       {
//         $group: {
//           _id: null,
//           labels: { $push: "$month" },
//           // target: { $push: "$value.target" },
//           data: {
//             $push: "$value.hours",
//           },
//         },
//       },

//     ]);
//     return res.status(200).json({
//       message: "TM Progress get successfully",
//       tmProgress,
//     });
//   }
// );


router.get("/getApprovalRequestSheetData", async (req, res, next) => {
  try {
    const findLoggedUserPlantData = await Plant.findOne({
      plant_id: req?.rootUser?.plant_data?.split("-")?.[0],
    });

    const getApprovalData = await RequestSheetOfBM.aggregate([
      {
        $match: {
          plantRef: findLoggedUserPlantData?._id,
        },
      },
      {
        $lookup: {
          from: "plants",
          localField: "plantRef",
          foreignField: "_id",
          as: "plants",
        },
      },
      { $unwind: "$plants" },
    ]);

    console.log(getApprovalData);
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
        $match: {},
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
          count: { $sum: 1 },
          hours: {
            $sum: {
              $cond: [
                { $gt: ["$sheetCompletedDateAndTime", null] },
                {
                  $divide: [
                    {
                      $subtract: [
                        "$sheetCompletedDateAndTime",
                        "$sheetIssuedDateAndTimeOfBM",
                      ],
                    },
                    3600000,
                  ],
                },
                0,
              ],
            },
          },
          target: {
            $sum: {
              $cond: [
                { $gt: ["$sheetCompletedDateAndTime", null] },
                {
                  $divide: [
                    {
                      $subtract: [
                        "$sheetCompletedDateAndTime",
                        "$sheetIssuedDateAndTimeOfBM",
                      ],
                    },
                    3600000,
                  ],
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
        $match: {},
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
                { $gt: ["$sheetCompletedDateAndTime", null] },
                {
                  $divide: [
                    {
                      $subtract: [
                        "$sheetCompletedDateAndTime",
                        "$sheetIssuedDateAndTimeOfBM",
                      ],
                    },
                    3600000,
                  ],
                },
                0,
              ],
            },
          },
          target: {
            $sum: {
              $cond: [
                { $gt: ["$sheetCompletedDateAndTime", null] },
                {
                  $divide: [
                    {
                      $subtract: [
                        "$sheetCompletedDateAndTime",
                        "$sheetIssuedDateAndTimeOfBM",
                      ],
                    },
                    3600000,
                  ],
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

const middlewareForFindingMachineWiseTrendData = async (req, res, next) => {
  const TrendData = await RequestSheetOfBM.aggregate([
    {
      $match: {},
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
              { $gt: ["$sheetCompletedDateAndTime", null] },
              {
                $divide: [
                  {
                    $subtract: [
                      "$sheetCompletedDateAndTime",
                      "$sheetIssuedDateAndTimeOfBM",
                    ],
                  },
                  3600000,
                ],
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
        hours: -1,
      },
    },
    {
      $limit: 20,
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
  filterMiddlewareForMTTRReport,
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
        sheetIssuedDateAndTimeOfBM: {
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
  filterMiddlewareForMTBFReport,
  middlewareForFindingMachineWiseTrendData,
  async (req, res, next) => {
    req.message = "Machine wise MTBF trend data get successfully";
    next();
  },
  responseMiddlewareForReport
);



module.exports = router;

