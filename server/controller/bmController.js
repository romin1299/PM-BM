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

router.use(cookieParser());
router.use(authenticate);

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
      // Now you can use the incremented value for your requestSheet
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

      let requestSheetNos = machine.line_names.requestSheetNos + 1;

      await Line.updateOne(
        { _id: machine.line_names._id },
        { $set: { requestSheetNos } }
      );

      let requestSheet;

      if (req.rootUser.user_type) {
        const {
          workStartedDateOfBM,
          workEndedDateOfBM,
          workStartedTimeOfBM,
          workEndedTimeOfBM,
        } = req.body;

        const startDateTimeBM = `${workStartedDateOfBM}T${workStartedTimeOfBM}`;
        const endDateTimeBM = `${workEndedDateOfBM}T${workEndedTimeOfBM}`;
        const requestSheetStartDateTime = new Date(startDateTimeBM);
        const requestSheetEndDateTime = new Date(endDateTimeBM);

        let queryObj = {
          ...req.body,
          ..._idObject,
        };

        const requestSheet = await RequestSheetOfBM.findOneAndUpdate(
          req.query,
          {
            $set: queryObj,
          }
        );

        await requestSheet.save();

        // if (existingPRDRequestSheet) {
        // (existingPRDRequestSheet.maintenanceReportFilledByMTD = {
        //   workStartedDateOfBM: requestSheetStartDateTime,
        //   workEndedDateOfBM: requestSheetEndDateTime,
        //   actionAndCounterMeasureStep,
        //   problemsOfBM,
        //   "whyAnalysis.why1": why1,
        //   "whyAnalysis.why2": why2,
        //   "whyAnalysis.why3": why3,
        //   "whyAnalysis.why4": why4,
        //   "whyAnalysis.why5": why5,
        //   breakDownTime,
        //   maintenanceTime,
        //   qualityCheckTime,
        //   breakTime,
        //   minorBD,
        //   majorBD,
        //   firstTime,
        //   repeat,
        // }),
        //   (existingPRDRequestSheet.changedParts = changedParts),
        //   (existingPRDRequestSheet.requestReceivedMTD = requestReceivedMTD),
        //   (existingPRDRequestSheet.MTD_TL = MTD_TL),
        //   (existingPRDRequestSheet.sectionIncharge = sectionIncharge),
        //   (existingPRDRequestSheet.feedbackMTD = feedbackMTD),
        //   // (existingPRDRequestSheet.partQualityCheckedByPRD = req.rootUser._id),
        //   // (existingPRDRequestSheet.partQualityByMTD = partQualityByMTD),
        //   (existingPRDRequestSheet.dataSheetOfBM = dataSheetOfBM),
        //   (existingPRDRequestSheet.drawingOfBM = drawingOfBM),
        //   (existingPRDRequestSheet.qualityConfirmed = qualityConfirmed),
        //   (existingPRDRequestSheet.approvalOfMTD_TL = approvalOfMTD_TL),
        //   (existingPRDRequestSheet.approvalOfMTD_SL = approvalOfMTD_SL),
        //   (existingPRDRequestSheet.approvalOfMTD_HOS = approvalOfMTD_HOS),
        //   await existingPRDRequestSheet.save();
        // requestSheet = existingPRDRequestSheet;
        // console.log("requestSheetwdas", requestSheet);
        // }
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
          sheetIssuedDateAndTimeOfBM: currentDateTime,
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

const findRequestSheetMiddleware = async (req, res, next) => {
  let queryObj = {};

  if (req.query?._id) {
    queryObj = {
      _id: mongoose.Types.ObjectId(req.query?._id),
    };
  }

  try {
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
          MTDUser: {
            $reduce: {
              input: "$namesMTD",
              initialValue: "",
              in: {
                $concat: [
                  "$$value",
                  "$$this.tm_name",
                  {
                    $cond: [
                      {
                        $eq: [
                          { $subtract: [{ $size: "$namesMTD" }, 1] },
                          { $indexOfArray: ["$namesMTD", "$$this"] },
                        ],
                      },
                      "",
                      ",",
                    ],
                  },
                ],
              },
            },
          },
          problem: "$breakDownBasicDataFilledByPRD.problemFaced",
          problemOccurredDateAndTimeOfBM: 1,
          "maintenanceReportFilledByMTD.workEndedDateOfBM": 1,
          handOverTime: "$maintenanceReportFilledByMTD.workEndedDateOfBM",
          partQualityStatusOfPRD: 1,
          requestSheetStatus: 1,
          work_order_status: 1,
          finalActivity: 1,
          work_order_status: 1,
          PRDUser: { $arrayElemAt: ["$namesPRD.tm_name", 0] },
          // {
          //   $concat: [
          //     "$partQualityStatusOfPRD",
          //     " - ",
          //     { $arrayElemAt: ["$namesPRD.tm_name", 0] },
          //   ],
          // },
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
    console.log(error);
    res.status(500).json({ message: error?.message, error });
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
        // }
        queryObj = {
          ...queryObj,
          assignUser: req.body?.assignUser,
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

      req.purpose = "update-request-sheet";
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

      // const MTD_or_PRD_user_list = await User.find({
      //   tm_department: req?.rootUser?.tm_department,
      //   user_type: "TL/HOSS",
      //   plant_data: req?.rootUser?.plant_data,
      // });

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
        // MTD_or_PRD_user_list,
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

      req.queryObj = queryObj;

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
router.get(
  "/getMachineDetailsOnScanningRequest/:generateType",
  async (req, res, next) => {
    const machine = await Machine.findOne(req.query)
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

    // const mtdUser = await User.find({
    //   tm_department: req.query.tm_department,
    //   user_type: req.query.user_type,
    // });

    if (machine) {
      res.status(201).json({
        message: "Sheet data get successfully",
        machine,
        breakDownAttendedBy: req.rootUser.tm_name,
        // mtdUser,
      });
    } else {
      res.status(404).json({ message: "Machine not found" });
    }
  }
);

router.get("/getMtdUserDetails", async (req, res, next) => {
  const mtdUser = await User.find({
    tm_department: req.query.tm_department,
    tm_grade: req.query.tm_grade,
  });
  const mtdUserTL = await User.find({
    tm_department: req.query.tm_department,
    user_type: req.query.user_type,
  });

  res.status(201).json({
    message: "Mtd User get successfully",
    mtdUser,
    mtdUserTL,
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
                      data: {
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
                      data: {
                        _id: "$$month.monthInDecimal",
                        generated: 0,
                        completed: 0,
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
module.exports = router;
