const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const moment = require("moment-timezone");
const timezone = "Asia/Kolkata";

const RequestSheetOfBM = require("../model/requestSheetDataOfBM");
const Machine = require("../model/machineSchema");
const User = require("../model/userSchema");
const Section = require("../model/sectionSchema");
const Line = require("../model/lineSchema");
const SubSection = require("../model/subSectionSchema");

const authenticate = require("../middleware/authenticate");
const cookieParser = require("cookie-parser");
const Plant = require("../model/plantSchema");
const factory = require("./handleFactory");
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
      };

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
    if (req.query) {
      return next();
    }

    const section = await Section.findOne({
      section_id: req?.rootUser?.section_data?.split("-")?.[0],
    });

    if (section.dashboardLevel === "Yes") {
      const subSectionsData = await SubSection.find({
        section_names: section?._id,
      }).sort({ subSection_sequence: 1 });

      const cellData = await Cell.find({
        subSection_names: { $in: subSectionsData?.map((item) => item?._id) },
      }).sort({ cell_sequence: 1 });

      req.cellData = cellData;
    } else {
      queryObj = {
        ...queryObj,
        section_data: req?.rootUser?.section_data,
        subSection_data: { $in: req?.rootUser?.subSection_data },
      };
    }

    req.section = section;
    next();
  } catch (error) {
    res.status(500).json({ message: error?.message, error });
  }
};

router.get(
  "/getRequestSheetMonitoringData/:id",
  middlewareForGettingAllDropdownList,
  async (req, res, next) => {
    // const functionForQueryObject = (status) => ({
    //   $sum: {
    //     $cond: [{ $eq: ["$requestSheetStatus", status] }, 1, 0],
    //   },
    // });
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

      const allMonths = Array.from({ length: 12 }, (_, monthIndex) => ({
        monthName: moment().month(monthIndex).format("MMMM"),
        monthInDecimal: `${monthIndex + 1}`,
      }));

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
                      value: 0,
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
            $facet: {
              generatedCounterData: [
                {
                  $group: {
                    _id: {
                      $dateToString: {
                        format: "%m",
                        date: "$sheetIssuedDateAndTimeOfBM",
                        timezone: timezone,
                      },
                    },
                    value: { $sum: 1 },
                  },
                },
                ...queryPipelineObj,
              ],
              completedCounterData: [
                {
                  $match: {
                    sheetCompletedDateAndTime: {
                      $exists: true,
                      $ne: null,
                    },
                  },
                },
                {
                  $group: {
                    _id: {
                      $dateToString: {
                        format: "%m",
                        date: "$sheetCompletedDateAndTime",
                        timezone: timezone,
                      },
                    },
                    value: { $sum: 1 },
                  },
                },
                ...queryPipelineObj,
              ],
            },
          },
          // ________ don't remove this commented code ________

          // {
          //   $project: {
          //     month: {
          //       $function: {
          //         body: function (month) {
          //           return [
          //             "Jan",
          //             "Feb",
          //             "Mar",
          //             "Apr",
          //             "May",
          //             "Jun",
          //             "July",
          //             "Aug",
          //             "Sep",
          //             "Oct",
          //             "Nov",
          //             "Dec",
          //           ]?.[month - 1];
          //         },
          //         args: ["$_id"],
          //         lang: "js",
          //       },
          //     },
          //     generated: 1,
          //     completed: 1,
          //   },
          // },

          // {
          //   $group: {
          //     _id: {
          //       $dateToString: {
          //         format: "%m",
          //         date: "$sheetIssuedDateAndTimeOfBM",
          //         timezone: timezone,
          //       },
          //     },

          //     generated: { $sum: 1 },
          //     completed: functionForQueryObject("$sheetCompletedDateAndTime"),

          //     // generated: functionForQueryObject("$sheetIssuedDateAndTimeOfBM"),
          //     // completed: functionForQueryObject("$sheetCompletedDateAndTime"),

          //     // generated: functionForQueryObject(statusArray[0]),
          //     // completed: functionForQueryObject("Completed"),
          //   },
          // },

          // __________ Logic for generating all 12 month's data (if not exist then 0) ______

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

      return res.status(201).json({
        message: "Monitoring request-sheet data get successfully",
        allStatusCounterForGraph,
        cellData: req.cellData,
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
      let requestSheetData = await RequestSheetOfBM.findOne({
        requestSheetNoOfBM: req.params?.requestSheetNoOfBM,
      })
        .populate({ path: "machineRef" })
        .populate({
          path: "lineRef",
        })
        .populate({ path: "cellRef" })
        .populate({ path: "plantRef" })
        .populate({ path: "assignUser" })
        .populate({ path: "requestSheetCreatedBy" })
        .populate({ path: "approvalOfMTD_TL" })
        .populate({ path: "approvalOfMTD_HOSS" })
        .populate({ path: "approvalOfPRD_TL" })
        .populate({ path: "approvalOfPRD_HOS" })
        .populate({ path: "approvalOfMTD_HOS" })
        .populate({ path: "approvalOfPRD_HOD" })
        .populate({ path: "approvalOfMTD_HOD" })
        .populate({ path: "partQualityCheckedByPRD" })
        .populate({ path: "partQualityCheckedByMTD" })
        .exec();

      if (!requestSheetData) {
        return res.status(400).json({
          message: "No sheet found for the update",
        });
      }
      res.status(201).json({
        message: "Request-sheet data get successfully",
        requestSheetData,
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
                approvalOfMTD_TL: assignApprovalList?.MTD_TL,
                approvalStatusOfMTD_TL: "MTD TL Approval Pending",
                approvalDateAndTimeOfMTD_TL: new Date(),
                requestSheetStatus: "MTD TL Approval Pending",
              },
              $push: {
                approvalLogOfMTD_TL: assignApprovalList?.MTD_TL,
                approvalStatusLogOfMTD_TL: "MTD TL Approval Pending",
                approvalDateAndTimeLogOfMTD_TL: new Date(),
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
          [`approvalLogOf${keyOfDepartment}`]:
            assignApprovalList[keyOfDepartment],
          [`approvalStatusLogOf${keyOfDepartment}`]: `${keyOfDepartment.replace(
            "_",
            " "
          )} Approval Pending`,
          [`approvalDateAndTimeLogOf${keyOfDepartment}`]: new Date(),
        };

        let resultOfUpdateStatusOfApprover =
          await RequestSheetOfBM.findOneAndUpdate(
            {
              requestSheetNoOfBM: req.params?.reqId,
              approvalOfMTD_TL: req?.rootUser?._id,
            },
            {
              $set: {
                ...queryObjForUpdate,
                requestSheetStatus: "MTD TL Approval Approved",
              },
              $push: {
                ...queryObjForPush,
              },
            },

            { new: true }
          );
      };

      if (assignApprovalList?.minorBD === "Yes") {
        Object.keys(assignApprovalList).forEach((key) => {
          if (
            requestSheetDataOfBM?.plantRef?.approvalListOfMinorAndMajor?.minorApprovalList?.includes(
              key.replace("_", " ")
            )
          ) {
            updateTheStatusOfBMSheetApprover(key, assignApprovalList);
          }
        });
        return res
          .status(201)
          .json({
            message: `${req.params?.reqId} Request-sheet approval send !!`,
          });
      } else {
        Object.keys(assignApprovalList).forEach((key) => {
          if (
            requestSheetDataOfBM?.plantRef?.approvalListOfMinorAndMajor?.majorApprovalList?.includes(
              key.replace("_", " ")
            )
          ) {
            updateTheStatusOfBMSheetApprover(key, assignApprovalList);
          }
        });
        return res
          .status(201)
          .json({ message: "Request-sheet approval send !!" });
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
      res.status(500).json({ message: error?.message, error });
    }
  }
);

module.exports = router;
