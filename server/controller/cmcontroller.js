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
  getFinancialQuarter,
} = require("../middleware/gettingFYMonthForPreAgg");

const {
  CM_PLANNED_STATUS,
} = require("../GlobalData/RequestSheetApprovalStatus");

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
    if (file.fieldname === "attachedFileByAssignedUser") {
      cb(null, "./AttachedFilesByAssignedUser/");
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

const quarterlyDataAdd = (plannedDateAndTimeOfCM) => {
  const findPlannedQuarterAndAssignValue = [],
    QUARTER = ["Q1", "Q2", "Q3", "Q4"];

  for (let index = 0; index < QUARTER.length; index++) {
    if (QUARTER?.[index] === getFinancialQuarter(plannedDateAndTimeOfCM)) {
      findPlannedQuarterAndAssignValue.push({
        requestSheet_quarter: QUARTER?.[index],
        statusOfPlannedCM: CM_PLANNED_STATUS?.[0],
      });
    } else {
      findPlannedQuarterAndAssignValue.push({
        requestSheet_quarter: QUARTER?.[index],
      });
    }
  }

  return findPlannedQuarterAndAssignValue;
};

router.post(
  "/newRequestSheetRegistrationOfCM",
  authenticate,
  // dashboardLevelUserCheckMiddleware,
  uploadDataSheetsOfBD.fields([
    { name: "cmBasicDataFilledByMTD_TL.attachedFilesByMTDUser", maxCount: 10 },
  ]),
  async (req, res, next) => {
    // const dataSheet = req.files;

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

      const requestSheetNoOfCM = await globalReqSheetNo(
        req.query?.machineRef,
        "CM"
      );
      let requestSheetOfCM = new RequestSheetOfCM({
        requestSheetNoOfCM,
        ...req.query,
        ..._idObject,
        requestSheetCreatedBy: req?.rootUser,
        shiftOfCM: requestSheetDataFilledByMTDUserForCM?.shiftOfBM,
        ...requestSheetDataFilledByMTDUserForCM,
        partSuggestionByMTDTL:
          requestSheetDataFilledByMTDUserForCM?.partSuggestionByMTDTL,
        commonDataFilledByAssignUser: [
          {
            plannedDateAndTimeOfCM:
              requestSheetDataFilledByMTDUserForCM?.plannedDateAndTimeOfCM,
            preAggregationTimeStampOfRequestSheet: {
              requestSheet_year: gettingFYYear(
                requestSheetDataFilledByMTDUserForCM?.plannedDateAndTimeOfCM
              ),
              requestSheet_month: gettingMonthForSelectedDate(
                requestSheetDataFilledByMTDUserForCM?.plannedDateAndTimeOfCM
              ),
            },
            // sparePartUsedOrNot:
            //   requestSheetDataFilledByMTDUserForCM?.changedParts?.length > 0
            //     ? "Yes"
            //     : "No",
            quarterlyDataOfTheCM: quarterlyDataAdd(
              requestSheetDataFilledByMTDUserForCM?.plannedDateAndTimeOfCM
            ),
          },
        ],
      });

      const result = await requestSheetOfCM.save();

      const addOtherYearFreqUptoNextFourYear = [];

      for (
        let index = moment(new Date()).tz(timezone).year() + 1;
        index <= moment(new Date()).tz(timezone).year() + 4;
        index++
      ) {
        addOtherYearFreqUptoNextFourYear.push({
          plannedDateAndTimeOfCM:
            (requestSheetDataFilledByMTDUserForCM?.plannedDateAndTimeOfCM).replace(
              moment(new Date()).tz(timezone).year(),
              index
            ),
          preAggregationTimeStampOfRequestSheet: {
            requestSheet_year: `${index}-${index + 1}`,
            requestSheet_month: gettingMonthForSelectedDate(
              requestSheetDataFilledByMTDUserForCM?.plannedDateAndTimeOfCM
            ),
          },
          quarterlyDataOfTheCM: quarterlyDataAdd(
            requestSheetDataFilledByMTDUserForCM?.plannedDateAndTimeOfCM
          ),
        });
      }

      const updateCommonDataFilledByAssignUser =
        await RequestSheetOfCM.findOneAndUpdate(
          {
            _id: result._id,
          },
          {
            $push: {
              commonDataFilledByAssignUser: {
                $each: addOtherYearFreqUptoNextFourYear,
              },
            },
          },
          { new: true }
        );

      successResponse(res, "CM Request-sheet generated successfully", {
        updateCommonDataFilledByAssignUser,
      });
    }
  }
);

router.patch(
  "/updateCmReqSheet/:id",
  authenticate,
  uploadDataSheetsOfBD.fields([
    { name: "attachedFileByAssignedUser", maxCount: 10 },
  ]),
  async (req, res, next) => {
    const id = req.params.id;
    const requestSheetDataFilledByMTDUserForCM = JSON.parse(req.body.otherData);
    if (
      req.files?.attachedFileByAssignedUser?.[0]?.filename ||
      req.files?.attachedFileByAssignedUser
    ) {
      requestSheetDataFilledByMTDUserForCM["attachedFileByAssignedUser"] =
        req.files?.attachedFileByAssignedUser?.[0]?.filename;
    }
    if (
      requestSheetDataFilledByMTDUserForCM?.cmBasicDataFilledByMTD_TL
        ?.frequencyType === "One-time"
    ) {
      requestSheetDataFilledByMTDUserForCM.cmBasicDataFilledByMTD_TL.frequencyValue =
        "";
    }
    //
    // console.log(requestSheetDataFilledByMTDUserForCM);
    const updatedRequestSheetOfCM = await RequestSheetOfCM.findByIdAndUpdate(
      { _id: id },
      requestSheetDataFilledByMTDUserForCM,
      { new: true }
    );
    res.status(200).json({
      message: "CM Request-sheet updated successfully",
      data: updatedRequestSheetOfCM,
    });
  }
);
router.patch(
  "/dummy/:id",
  authenticate,
  uploadDataSheetsOfBD.fields([
    { name: "attachedFilesByAssignedUser", maxCount: 10 },
  ]),
  async (req, res, next) => {
    // console.log(req.params.id);
    // console.log("object");
    // res.status(200).json({
    //   message: "CM Request-sheet updated successfully",
    //   data: req.params.id,
    // })
    const id = req.params.id;
    const requestSheetDataFilledByMTDUserForCM = JSON.parse(req.body.otherData);
    if (
      req.files?.attachedFilesByAssignedUser?.[0]?.filename ||
      req.files?.attachedFilesByAssignedUser
    ) {
      requestSheetDataFilledByMTDUserForCM["attachedFileByAssignedUser"] =
        req.files?.attachedFilesByAssignedUser?.[0]?.filename;
    }
    if (
      requestSheetDataFilledByMTDUserForCM?.cmBasicDataFilledByMTD_TL
        ?.frequencyType === "One-time"
    ) {
      requestSheetDataFilledByMTDUserForCM.cmBasicDataFilledByMTD_TL.frequencyValue =
        "";
    }
    // console.log(requestSheetDataFilledByMTDUserForCM);
    const updatedRequestSheetOfCM = await RequestSheetOfCM.findByIdAndUpdate(
      { _id: id },
      { ...requestSheetDataFilledByMTDUserForCM },
      { new: true }
    );
    res.status(200).json({
      message: "CM Request-sheet updated successfully",
      data: updatedRequestSheetOfCM,
    });
  }
);

router.patch(
  "/sendApprovalForRequestSheetOfCM/:reqId/:machineRef",
  authenticate,
  dashboardLevelUserCheckMiddleware,
  uploadDataSheetsOfBD.fields([
    { name: "attachedFileByAssignedUser", maxCount: 10 },
  ]),
  async (req, res, next) => {
    try {
      const requestSheetDataFilledByMTDUserForCM = JSON.parse(
        req.body.otherData
      );
      if (
        req.files?.attachedFileByAssignedUser?.[0]?.filename ||
        req.files?.attachedFileByAssignedUser
      ) {
        requestSheetDataFilledByMTDUserForCM["attachedFileByAssignedUser"] =
          req.files?.attachedFileByAssignedUser?.[0]?.filename;
      }

      let commonApprovalStatusObj = {
        approvalStatus: "Pending",
        approvalDateAndTime: "",
      };
      let updateObj = {
        $push: {
          approvalOfMTD_HOS: {
            ...requestSheetDataFilledByMTDUserForCM?.approvalOfMTD_HOS,
            ...commonApprovalStatusObj,
          },
        },
      };

      if (requestSheetDataFilledByMTDUserForCM?.isPermissionOfMTDTL === "Yes") {
        updateObj.$push = {
          ...updateObj.$push,
          approvalOfMTD_TL: {
            ...requestSheetDataFilledByMTDUserForCM?.approvalOfMTD_TL,
            ...commonApprovalStatusObj,
          },
        };
        updateObj.$set = {
          ...updateObj.$set,
          requestSheetStatusOfCM: "Under MTD TL/HOSS Approval",
          "getDataForApprovalDashboard.Id":
            requestSheetDataFilledByMTDUserForCM?.assignApprovalListOfTL?.id,
          "getDataForApprovalDashboard.departmentAndGradeOfUser": "MTD TL/HOSS",
        };
      } else {
        updateObj.$set = {
          ...updateObj.$set,
          requestSheetStatusOfCM: "Under MTD HOS Approval",
          "getDataForApprovalDashboard.Id":
            requestSheetDataFilledByMTDUserForCM?.assignApprovalListOfHOS?.id,
          "getDataForApprovalDashboard.departmentAndGradeOfUser": "MTD HOS",
          approvalDateAndTimeOfMTD_TL: new Date(),
        };
      }

      if (requestSheetDataFilledByMTDUserForCM?.isPermissionOfPRDTL === "Yes") {
        updateObj.$push = {
          ...updateObj.$push,
          approvalOfPRD_TL: {
            ...requestSheetDataFilledByMTDUserForCM?.approvalOfPRD_TL,
            ...commonApprovalStatusObj,
          },
        };
      }
      updateObj = {
        ...updateObj,
        workDetails: requestSheetDataFilledByMTDUserForCM?.workDetails,
        changedParts: requestSheetDataFilledByMTDUserForCM?.changedParts,
        actionAndCounterMeasureStep:
          requestSheetDataFilledByMTDUserForCM?.actionAndCounterMeasureStep,
      };

      // console.log(requestSheetDataFilledByMTDUserForCM);
      const updateAssignApprovalOfMTD_TL =
        await RequestSheetOfCM.findOneAndUpdate(
          {
            _id: mongoose.Types.ObjectId(req.params?.reqId),
          },
          // {
          //   $set: {
          //     ...requestSheetDataFilledByMTDUserForCM,
          //     ...conditionalStatusChangesForReqSheet,
          //     ...approvalObj,
          //   },
          //   $push: pushObj,
          // },
          updateObj,
          { new: true }
        );
      if (updateAssignApprovalOfMTD_TL) {
        return res.status(201).json({
          message: `Request-sheet approval send !!`,
          updateAssignApprovalOfMTD_TL,
        });
      }
    } catch (error) {
      console.log(error);
    }
  }
);

// const filterMiddleware = async (req, res, next) => {
//   try {
//     let queryObj = {},
//       queryObjForPM = {};

//     if (req.query?.selectedYear) {
//       queryObj = {
//         ...queryObj,
//         "preAggregationTimeStampOfRequestSheet.requestSheet_year":
//           req.query?.selectedYear,
//       };
//     }

//     if (req.query?.selectedMonth) {
//       queryObj = {
//         ...queryObj,
//         "preAggregationTimeStampOfRequestSheet.requestSheet_month":
//           req.query?.selectedMonth,
//       };
//     }

//     if (req.query?.selectedRSStatus) {
//       queryObj = {
//         ...queryObj,
//         requestSheetStatus: req.query?.selectedRSStatus,
//       };
//     }

//     if (req.params?.filter === "based-on-plant") {
//       queryObj = {
//         ...queryObj,
//         plantRef: mongoose.Types.ObjectId(req.params?.selectedId),
//       };

//       queryObjForPM = {
//         plant_names: mongoose.Types.ObjectId(req.params?.selectedId),
//       };
//     } else if (req.params?.filter === "based-on-section") {
//       queryObj = {
//         ...queryObj,
//         sectionRef: mongoose.Types.ObjectId(req.params?.selectedId),
//       };

//       queryObjForPM = {
//         section_names: mongoose.Types.ObjectId(req.params?.selectedId),
//       };
//     } else if (req.params?.filter === "based-on-subSection") {
//       queryObj = {
//         ...queryObj,
//         subSectionRef: mongoose.Types.ObjectId(req.params?.selectedId),
//       };

//       queryObjForPM = {
//         subSection_names: mongoose.Types.ObjectId(req.params?.selectedId),
//       };
//     } else if (req.params?.filter === "based-on-cell") {
//       queryObj = {
//         ...queryObj,
//         cellRef: mongoose.Types.ObjectId(req.params?.selectedId),
//         // "maintenanceReportFilledByMTD.workEndedDateOfBM": { $ne: null },
//       };

//       queryObjForPM = {
//         cell_names: mongoose.Types.ObjectId(req.params?.selectedId),
//       };
//     } else if (req.params?.filter === "based-on-line") {
//       queryObj = {
//         ...queryObj,
//         lineRef: mongoose.Types.ObjectId(req.params?.selectedId),
//         // "maintenanceReportFilledByMTD.workEndedDateOfBM": { $ne: null },
//       };

//       queryObjForPM = {
//         line_names: mongoose.Types.ObjectId(req.params?.selectedId),
//       };
//     } else if (req.params?.filter === "based-on-machine") {
//       queryObj = {
//         ...queryObj,
//         machineRef: mongoose.Types.ObjectId(req.params?.selectedId),
//         // "maintenanceReportFilledByMTD.workEndedDateOfBM": { $ne: null },
//       };

//       queryObjForPM = {
//         _id: mongoose.Types.ObjectId(req.params?.selectedId),
//       };
//     }

//     req.queryObj = queryObj;
//     req.queryObjForPM = queryObjForPM;
//     next();
//   } catch (error) {
//     logger.error(error, { maintenanceType: maintenanceType?.[1] });
//     res.status(500).json({ message: error?.message, error });
//   }
// };

const getRequestSheetData = async (req, res, next) => {
  try {
    // filterMiddleware(req, res, next);
    // console.log(req.queryObj);
    let queryObjForGetRequestSheetData = {};
    // delete req?.queryObj?.maintenanceType;
    if (req.query?._id) {
      queryObjForGetRequestSheetData = {
        _id: mongoose.Types.ObjectId(req.query?._id),
      };
    }

    //get data for sending email for higher authority
    if (req?.params?.reqId) {
      queryObjForGetRequestSheetData = {
        _id: mongoose.Types.ObjectId(req.params?.reqId),
      };
    }

    if (req.query?.getDataForApprovalDashboardId) {
      queryObjForGetRequestSheetData = {
        "getDataForApprovalDashboard.Id": mongoose.Types.ObjectId(
          req.query.getDataForApprovalDashboardId
        ),
        ...req.queryObj,
      };
    }
    const requestSheetData = await RequestSheetOfCM.aggregate([
      {
        $match: queryObjForGetRequestSheetData,
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
          from: "users",
          localField: "assignUserForCM",
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
          as: "assigned_users",
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
      // {
      //   $lookup: {
      //     from: "users",
      //     localField: "partQualityCheckedByPRD",
      //     foreignField: "_id",
      //     pipeline: [
      //       {
      //         $project: {
      //           tm_name: 1,
      //           tm_no: 1,
      //           email: 1,
      //         },
      //       },
      //     ],
      //     as: "namesPRD",
      //   },
      // },
      // {
      //   $lookup: {
      //     from: "users",
      //     localField: "partQualityCheckedByMTD",
      //     foreignField: "_id",
      //     pipeline: [
      //       {
      //         $project: {
      //           tm_name: 1,
      //           tm_no: 1,
      //           email: 1,
      //         },
      //       },
      //     ],
      //     as: "namesMTD",
      //   },
      // },
      {
        $lookup: {
          from: "users",
          localField: "assignUserForCM",
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
          as: "namesOperators",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "requestSheetCreatedBy",
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
          as: "requestSheetCreatedBy",
        },
      },
      // {
      //   $lookup: {
      //     from: "users",
      //     localField: "handOverUser",
      //     foreignField: "_id",
      //     pipeline: [
      //       {
      //         $project: {
      //           user_type: 1,
      //           tm_no: 1,
      //           tm_name: 1,
      //           email: 1,
      //         },
      //       },
      //     ],
      //     as: "handoverUserDetails",
      //   },
      // },
      // {
      //   $lookup: {
      //     from: "users",
      //     localField: "approvalOfMTD_SL",
      //     foreignField: "_id",
      //     pipeline: [
      //       {
      //         $project: {
      //           user_type: 1,
      //           tm_no: 1,
      //           tm_name: 1,
      //           email: 1,
      //         },
      //       },
      //     ],
      //     as: "approvalOfMTD_SL",
      //   },
      // },
      // {
      //   $lookup: {
      //     from: "users",
      //     localField: "approvalOfMTD_TL",
      //     foreignField: "_id",
      //     pipeline: [
      //       {
      //         $project: {
      //           user_type: 1,
      //           tm_no: 1,
      //           tm_name: 1,
      //           email: 1,
      //         },
      //       },
      //     ],
      //     as: "approvalOfMTD_TL",
      //   },
      // },
      {
        $lookup: {
          from: "users",
          // localField: "approvalOfMTD_TL",
          // foreignField: "_id",
          let: {
            id: {
              $arrayElemAt: ["$approvalOfMTD_TL", -1],
            },
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    "$_id",
                    "$$id",
                    // {
                    //   $toObjectId: "$$id",
                    // },
                  ],
                },
              },
            },
            {
              $project: {
                user_type: 1,
                tm_no: 1,
                tm_name: 1,
                email: 1,
              },
            },
          ],
          as: "approvalOfMTD_TL",
        },
      },
      {
        $lookup: {
          from: "users",
          // localField: "approvalOfMTD_HOSS",
          // foreignField: "_id",
          let: {
            id: {
              $arrayElemAt: ["$approvalOfMTD_HOSS", -1],
            },
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    "$_id",
                    {
                      $toObjectId: "$$id",
                    },
                  ],
                },
              },
            },
            {
              $project: {
                user_type: 1,
                tm_no: 1,
                tm_name: 1,
                email: 1,
              },
            },
          ],
          as: "approvalOfMTD_HOSS",
        },
      },
      {
        $lookup: {
          from: "users",
          // localField: "approvalOfMTD_HOS",
          // foreignField: "_id",
          let: {
            id: {
              $arrayElemAt: ["$approvalOfMTD_HOS", -1],
            },
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    "$_id",
                    {
                      $toObjectId: "$$id",
                    },
                  ],
                },
              },
            },
            {
              $project: {
                user_type: 1,
                tm_no: 1,
                tm_name: 1,
                email: 1,
              },
            },
          ],
          as: "approvalOfMTD_HOS",
        },
      },
      {
        $lookup: {
          from: "users",
          // localField: "approvalOfPRD_TL",
          // foreignField: "_id",
          let: {
            id: {
              $arrayElemAt: ["$approvalOfPRD_TL", -1],
            },
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    "$_id",
                    {
                      $toObjectId: "$$id",
                    },
                  ],
                },
              },
            },
            {
              $project: {
                user_type: 1,
                tm_no: 1,
                tm_name: 1,
                email: 1,
              },
            },
          ],
          as: "approvalOfPRD_TL",
        },
      },
      {
        $lookup: {
          from: "users",
          // localField: "approvalOfPRD_HOS",
          // foreignField: "_id",
          let: {
            id: {
              $arrayElemAt: ["$approvalOfPRD_HOS", -1],
            },
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    "$_id",
                    {
                      $toObjectId: "$$id",
                    },
                  ],
                },
              },
            },
            {
              $project: {
                user_type: 1,
                tm_no: 1,
                tm_name: 1,
                email: 1,
              },
            },
          ],
          as: "approvalOfPRD_HOS",
        },
      },
      {
        $lookup: {
          from: "users",
          // localField: "approvalOfPRD_HOD",
          // foreignField: "_id",
          let: {
            id: {
              $arrayElemAt: ["$approvalOfPRD_HOD", -1],
            },
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    "$_id",
                    {
                      $toObjectId: "$$id",
                    },
                  ],
                },
              },
            },
            {
              $project: {
                user_type: 1,
                tm_no: 1,
                tm_name: 1,
                email: 1,
              },
            },
          ],
          as: "approvalOfPRD_HOD",
        },
      },
      {
        $lookup: {
          from: "users",
          // localField: "approvalOfMTD_HOD",
          // foreignField: "_id",
          let: {
            id: {
              $arrayElemAt: ["$approvalOfMTD_HOD", -1],
            },
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    "$_id",
                    {
                      $toObjectId: "$$id",
                    },
                  ],
                },
              },
            },
            {
              $project: {
                user_type: 1,
                tm_no: 1,
                tm_name: 1,
                email: 1,
              },
            },
          ],
          as: "approvalOfMTD_HOD",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "supportingTM",
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
          as: "supportingTM",
        },
      },
      {
        $sort: {
          _id: -1,
        },
      },
      {
        $project: {
          requestSheetNoOfCM: 1,
          requestSheetOfBMRef: 1,
          maintenanceType: 1,
          priorityCode: 1,
          plannedDateAndTimeOfCM: 1,
          sheetIssuedDateAndTimeOfCM: 1,
          shiftOfCM: 1,
          assigned_users: 1,
          qualityRelated: 1,
          requestSheetCreatedBy: {
            $arrayElemAt: ["$requestSheetCreatedBy", 0],
          },

          //only for material table purpose
          cell: { $arrayElemAt: ["$cells.cell_name", 0] },
          line: { $arrayElemAt: ["$lines.line_name", 0] },
          machineNo: { $arrayElemAt: ["$machines.machine_code", 0] },
          machineName: { $arrayElemAt: ["$machines.machine_name", 0] },
          plannedDateAndTimeOfCMForTable: {
            $dateToString: {
              format: "%d-%m-%Y T%H:%M",
              date: "$plannedDateAndTimeOfCM",
              timezone: timezone,
            },
          },
          assignUser: {
            $arrayElemAt: ["$namesOperators", 0],
          },

          approvalOfMTD_SL: {
            $arrayElemAt: ["$approvalOfMTD_SL", 0],
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

          // partQualityCheckedByPRD: { $arrayElemAt: ["$namesPRD", 0] },
          // partQualityCheckedByMTD: { $arrayElemAt: ["$namesMTD", 0] },

          // dataSheetOfBM: 1,
          // drawingOfBM: 1,
          // sparePartUsedOrNot: 1,
          changedParts: 1,
          workDetails: 1,
          actionAndCounterMeasureStep: 1,

          machineRef: { $arrayElemAt: ["$machines", 0] },
          lineRef: { $arrayElemAt: ["$lines", 0] },
          cellRef: { $arrayElemAt: ["$cells", 0] },
          subSectionRef: { $arrayElemAt: ["$subSections", 0] },
          sectionRef: { $arrayElemAt: ["$sections", 0] },
          plantRef: { $arrayElemAt: ["$plants", 0] },

          requestSheetStatusOfCM: 1,
          getDataForApprovalDashboard: 1,

          actionTemporaryOrNot: 1,
          cmBasicDataFilledByMTD_TL: 1,
          dataSheetOfRequestSheet: 1,
          drawingOfRequestSheet: 1,
          supportingTM: 1,
          attachedDataSheets: 1,
          attachedDrawings: 1,
          categoriesOfRequestSheet: 1,
          yokotenkai: 1,
        },
      },
    ]);
    const pipeline = [
      {
        $match: queryObjForGetRequestSheetData,
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
      // {
      //   $lookup: {
      //     from: "users",
      //     localField: "partQualityCheckedByPRD",
      //     foreignField: "_id",
      //     pipeline: [
      //       {
      //         $project: {
      //           tm_name: 1,
      //           tm_no: 1,
      //           email: 1,
      //         },
      //       },
      //     ],
      //     as: "namesPRD",
      //   },
      // },
      // {
      //   $lookup: {
      //     from: "users",
      //     localField: "partQualityCheckedByMTD",
      //     foreignField: "_id",
      //     pipeline: [
      //       {
      //         $project: {
      //           tm_name: 1,
      //           tm_no: 1,
      //           email: 1,
      //         },
      //       },
      //     ],
      //     as: "namesMTD",
      //   },
      // },
      {
        $lookup: {
          from: "users",
          localField: "assignUserForCM",
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
          as: "namesOperators",
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "requestSheetCreatedBy",
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
          as: "requestSheetCreatedBy",
        },
      },
      // {
      //   $lookup: {
      //     from: "users",
      //     localField: "handOverUser",
      //     foreignField: "_id",
      //     pipeline: [
      //       {
      //         $project: {
      //           user_type: 1,
      //           tm_no: 1,
      //           tm_name: 1,
      //           email: 1,
      //         },
      //       },
      //     ],
      //     as: "handoverUserDetails",
      //   },
      // },
      // {
      //   $lookup: {
      //     from: "users",
      //     localField: "approvalOfMTD_SL",
      //     foreignField: "_id",
      //     pipeline: [
      //       {
      //         $project: {
      //           user_type: 1,
      //           tm_no: 1,
      //           tm_name: 1,
      //           email: 1,
      //         },
      //       },
      //     ],
      //     as: "approvalOfMTD_SL",
      //   },
      // },
      // {
      //   $lookup: {
      //     from: "users",
      //     localField: "approvalOfMTD_TL",
      //     foreignField: "_id",
      //     pipeline: [
      //       {
      //         $project: {
      //           user_type: 1,
      //           tm_no: 1,
      //           tm_name: 1,
      //           email: 1,
      //         },
      //       },
      //     ],
      //     as: "approvalOfMTD_TL",
      //   },
      // },
      {
        $lookup: {
          from: "users",
          // localField: "approvalOfMTD_TL",
          // foreignField: "_id",
          let: {
            id: {
              $arrayElemAt: ["$approvalOfMTD_TL", -1],
            },
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    "$_id",
                    "$$id",
                    // {
                    //   $toObjectId: "$$id",
                    // },
                  ],
                },
              },
            },
            {
              $project: {
                user_type: 1,
                tm_no: 1,
                tm_name: 1,
                email: 1,
              },
            },
          ],
          as: "approvalOfMTD_TL",
        },
      },
      {
        $lookup: {
          from: "users",
          // localField: "approvalOfMTD_HOSS",
          // foreignField: "_id",
          let: {
            id: {
              $arrayElemAt: ["$approvalOfMTD_HOSS", -1],
            },
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    "$_id",
                    {
                      $toObjectId: "$$id",
                    },
                  ],
                },
              },
            },
            {
              $project: {
                user_type: 1,
                tm_no: 1,
                tm_name: 1,
                email: 1,
              },
            },
          ],
          as: "approvalOfMTD_HOSS",
        },
      },
      {
        $lookup: {
          from: "users",
          // localField: "approvalOfMTD_HOS",
          // foreignField: "_id",
          let: {
            id: {
              $arrayElemAt: ["$approvalOfMTD_HOS", -1],
            },
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    "$_id",
                    {
                      $toObjectId: "$$id",
                    },
                  ],
                },
              },
            },
            {
              $project: {
                user_type: 1,
                tm_no: 1,
                tm_name: 1,
                email: 1,
              },
            },
          ],
          as: "approvalOfMTD_HOS",
        },
      },
      {
        $lookup: {
          from: "users",
          // localField: "approvalOfPRD_TL",
          // foreignField: "_id",
          let: {
            id: {
              $arrayElemAt: ["$approvalOfPRD_TL", -1],
            },
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    "$_id",
                    {
                      $toObjectId: "$$id",
                    },
                  ],
                },
              },
            },
            {
              $project: {
                user_type: 1,
                tm_no: 1,
                tm_name: 1,
                email: 1,
              },
            },
          ],
          as: "approvalOfPRD_TL",
        },
      },
      {
        $lookup: {
          from: "users",
          // localField: "approvalOfPRD_HOS",
          // foreignField: "_id",
          let: {
            id: {
              $arrayElemAt: ["$approvalOfPRD_HOS", -1],
            },
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    "$_id",
                    {
                      $toObjectId: "$$id",
                    },
                  ],
                },
              },
            },
            {
              $project: {
                user_type: 1,
                tm_no: 1,
                tm_name: 1,
                email: 1,
              },
            },
          ],
          as: "approvalOfPRD_HOS",
        },
      },
      {
        $lookup: {
          from: "users",
          // localField: "approvalOfPRD_HOD",
          // foreignField: "_id",
          let: {
            id: {
              $arrayElemAt: ["$approvalOfPRD_HOD", -1],
            },
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    "$_id",
                    {
                      $toObjectId: "$$id",
                    },
                  ],
                },
              },
            },
            {
              $project: {
                user_type: 1,
                tm_no: 1,
                tm_name: 1,
                email: 1,
              },
            },
          ],
          as: "approvalOfPRD_HOD",
        },
      },
      {
        $lookup: {
          from: "users",
          // localField: "approvalOfMTD_HOD",
          // foreignField: "_id",
          let: {
            id: {
              $arrayElemAt: ["$approvalOfMTD_HOD", -1],
            },
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    "$_id",
                    {
                      $toObjectId: "$$id",
                    },
                  ],
                },
              },
            },
            {
              $project: {
                user_type: 1,
                tm_no: 1,
                tm_name: 1,
                email: 1,
              },
            },
          ],
          as: "approvalOfMTD_HOD",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "supportingTM",
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
          as: "supportingTM",
        },
      },
      {
        $project: {
          requestSheetNoOfCM: 1,
          maintenanceType: 1,
          priorityCode: 1,
          plannedDateAndTimeOfCM: 1,
          sheetIssuedDateAndTimeOfCM: 1,
          shiftOfCM: 1,
          qualityRelated: 1,
          requestSheetCreatedBy: {
            $arrayElemAt: ["$requestSheetCreatedBy", 0],
          },

          //only for material table purpose
          cell: { $arrayElemAt: ["$cells.cell_name", 0] },
          line: { $arrayElemAt: ["$lines.line_name", 0] },
          machineNo: { $arrayElemAt: ["$machines.machine_code", 0] },
          machineName: { $arrayElemAt: ["$machines.machine_name", 0] },
          plannedDateAndTimeOfCMForTable: {
            $dateToString: {
              format: "%d-%m-%Y T%H:%M",
              date: "$plannedDateAndTimeOfCM",
              timezone: timezone,
            },
          },
          assignUser: {
            $arrayElemAt: ["$namesOperators", 0],
          },

          approvalOfMTD_SL: {
            $arrayElemAt: ["$approvalOfMTD_SL", 0],
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

          // partQualityCheckedByPRD: { $arrayElemAt: ["$namesPRD", 0] },
          // partQualityCheckedByMTD: { $arrayElemAt: ["$namesMTD", 0] },

          // dataSheetOfBM: 1,
          // drawingOfBM: 1,
          // sparePartUsedOrNot: 1,
          changedParts: 1,

          machineRef: { $arrayElemAt: ["$machines", 0] },
          lineRef: { $arrayElemAt: ["$lines", 0] },
          cellRef: { $arrayElemAt: ["$cells", 0] },
          subSectionRef: { $arrayElemAt: ["$subSections", 0] },
          sectionRef: { $arrayElemAt: ["$sections", 0] },
          plantRef: { $arrayElemAt: ["$plants", 0] },

          requestSheetStatusOfCM: 1,
          getDataForApprovalDashboard: 1,

          actionTemporaryOrNot: 1,
          cmBasicDataFilledByMTD_TL: 1,
          dataSheetOfRequestSheet: 1,
          drawingOfRequestSheet: 1,
          supportingTM: 1,
          attachedDataSheets: 1,
          attachedDrawings: 1,
          categoriesOfRequestSheet: 1,
          yokotenkai: 1,
        },
      },
    ];
    req.requestSheetData = requestSheetData;
    console.log("This is req sheet", requestSheetData);
    if (requestSheetData?.length === 0) {
      return res.status(400).json({
        // pipeline: req.pipeline,
        message: "No data to display",
      });
    }
    next();
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error: new Error(error) });
  }
};

router.get(
  "/getMachineRequestSheetDetailsForApprovalForCM/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  getRequestSheetData,
  dashboardLevelUserCheckMiddleware,
  findTLandOperatorList,
  async (req, res, next) => {
    try {
      res.status(201).json({
        message: "Request-sheet data get successfully",
        requestSheetData: req.requestSheetData,
        TLHOSS_and_TM_user_list: req?.TLHOSS_and_TM_user_list,
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      console.log(error);
      res
        .status(500)
        .json({ message: error?.message, error: new Error(error) });
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
          $match: req.queryObj,
        },
      ];
      if (req.rootUser?.user_type === "Operator") {
        queryPipeline = [
          {
            $match: {
              ...queryPipeline?.[0]?.$match,
              assignUserForCM: {
                $elemMatch: {
                  _id: mongoose.Types.ObjectId(req.rootUser._id),
                },
              },
            },
          },
        ];
      }

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
            as: "machines",
          },
        },
        // {
        //   $lookup: {
        //     from: "users",
        //     localField: "assignUserForCM",
        //     foreignField: "_id",
        //     pipeline: [
        //       {
        //         $project: {
        //           user_type: 1,
        //           tm_no: 1,
        //           tm_name: 1,
        //           email: 1,
        //         },
        //       },
        //     ],
        //     as: "assigned_users",
        //   },
        // },
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
        // {
        //   $lookup: {
        //     from: "users",
        //     localField: "assignUserForCM",
        //     foreignField: "_id",
        //     pipeline: [
        //       {
        //         $project: {
        //           user_type: 1,
        //           tm_no: 1,
        //           tm_name: 1,
        //           email: 1,
        //         },
        //       },
        //     ],
        //     as: "namesOperators",
        //   },
        // },
        // {
        //   $unwind: {
        //     path: "$workDetails",
        //   },
        // },
        // {
        //   $lookup: {
        //     from: "users",
        //     localField: "workDetails.tmName",
        //     foreignField: "_id",
        //     pipeline: [
        //       {
        //         $project: {
        //           tm_no: 1,
        //           tm_name: 1,
        //         },
        //       },
        //     ],
        //     as: "workDoneBy",
        //   },
        // },

        {
          $project: {
            requestSheetNoOfCM: 1,
            maintenanceType: 1,
            priorityCode: 1,
            requestSheetOfBMRef: 1,
            actionAndCounterMeasureStep: 1,
            workDetails: 1,
            plannedDateAndTimeOfCM: 1,
            sheetIssuedDateAndTimeOfCM: 1,
            shiftOfCM: 1,
            partSuggestionByMTDTL: 1,
            qualityRelated: 1,
            preAggregationTimeStampOfRequestSheet: 1,
            requestSheetCreatedBy: 1,

            //only for material table purpose
            cell: { $arrayElemAt: ["$cells.cell_name", 0] },
            line: { $arrayElemAt: ["$lines.line_name", 0] },
            machineNo: { $arrayElemAt: ["$machines.machine_code", 0] },
            machineName: { $arrayElemAt: ["$machines.machine_name", 0] },
            plannedDateAndTimeOfCMForTable: {
              $dateToString: {
                format: "%d-%m-%Y T%H:%M",
                date: "$plannedDateAndTimeOfCM",
                timezone: timezone,
              },
            },
            assigned_users: "$assignUserForCM",

            // approvalOfMTD_SL: {
            //   $arrayElemAt: ["$approvalOfMTD_SL", 0],
            // },
            finalActivity: 1,
            work_order_status: 1,
            rejectedRemarksOfRequestSheet: 1,
            feedbackMTD_HOS: 1,
            qualityConfirmed: 1,

            // approvalOfMTD_TL: {
            //   $arrayElemAt: ["$approvalOfMTD_TL", -1],
            // },
            // approvalStatusOfMTD_TL: {
            //   $arrayElemAt: ["$approvalStatusOfMTD_TL", -1],
            // },
            // approvalDateAndTimeOfMTD_TL: {
            //   $arrayElemAt: ["$approvalDateAndTimeOfMTD_TL", -1],
            // },

            // approvalOfMTD_HOSS: {
            //   $arrayElemAt: ["$approvalOfMTD_HOSS", -1],
            // },
            // approvalStatusOfMTD_HOSS: {
            //   $arrayElemAt: ["$approvalStatusOfMTD_HOSS", -1],
            // },
            // approvalDateAndTimeOfMTD_HOSS: {
            //   $arrayElemAt: ["$approvalDateAndTimeOfMTD_HOSS", -1],
            // },

            // approvalOfMTD_HOS: {
            //   $arrayElemAt: ["$approvalOfMTD_HOS", -1],
            // },
            // approvalStatusOfMTD_HOS: {
            //   $arrayElemAt: ["$approvalStatusOfMTD_HOS", -1],
            // },
            // approvalDateAndTimeOfMTD_HOS: {
            //   $arrayElemAt: ["$approvalDateAndTimeOfMTD_HOS", -1],
            // },

            // approvalOfPRD_TL: {
            //   $arrayElemAt: ["$approvalOfPRD_TL", -1],
            // },
            // approvalStatusOfPRD_TL: {
            //   $arrayElemAt: ["$approvalStatusOfPRD_TL", -1],
            // },
            // approvalDateAndTimeOfPRD_TL: {
            //   $arrayElemAt: ["$approvalDateAndTimeOfPRD_TL", -1],
            // },

            // approvalOfPRD_HOS: {
            //   $arrayElemAt: ["$approvalOfPRD_HOS", -1],
            // },
            // approvalStatusOfPRD_HOS: {
            //   $arrayElemAt: ["$approvalStatusOfPRD_HOS", -1],
            // },
            // approvalDateAndTimeOfPRD_HOS: {
            //   $arrayElemAt: ["$approvalDateAndTimeOfPRD_HOS", -1],
            // },

            // approvalOfPRD_HOD: {
            //   $arrayElemAt: ["$approvalOfPRD_HOD", -1],
            // },
            // approvalStatusOfPRD_HOD: {
            //   $arrayElemAt: ["$approvalStatusOfPRD_HOD", -1],
            // },
            // approvalDateAndTimeOfPRD_HOD: {
            //   $arrayElemAt: ["$approvalDateAndTimeOfPRD_HOD", -1],
            // },

            // approvalOfMTD_HOD: {
            //   $arrayElemAt: ["$approvalOfMTD_HOD", -1],
            // },
            // approvalStatusOfMTD_HOD: {
            //   $arrayElemAt: ["$approvalStatusOfMTD_HOD", -1],
            // },
            // approvalDateAndTimeOfMTD_HOD: {
            //   $arrayElemAt: ["$approvalDateAndTimeOfMTD_HOD", -1],
            // },

            // partQualityCheckedByPRD: { $arrayElemAt: ["$namesPRD", 0] },
            // partQualityCheckedByMTD: { $arrayElemAt: ["$namesMTD", 0] },

            // dataSheetOfBM: 1,
            // drawingOfBM: 1,
            // sparePartUsedOrNot: 1,
            changedParts: 1,
            workDetails: 1,
            actionAndCounterMeasureStep: 1,

            machineRef: { $arrayElemAt: ["$machines", 0] },
            lineRef: { $arrayElemAt: ["$lines", 0] },
            cellRef: { $arrayElemAt: ["$cells", 0] },
            subSectionRef: { $arrayElemAt: ["$subSections", 0] },
            sectionRef: { $arrayElemAt: ["$sections", 0] },
            plantRef: { $arrayElemAt: ["$plants", 0] },

            requestSheetStatusOfCM: 1,
            getDataForApprovalDashboard: 1,

            actionTemporaryOrNot: 1,
            cmBasicDataFilledByMTD_TL: 1,
            dataSheetOfRequestSheet: 1,
            drawingOfRequestSheet: 1,
            supportingTM: 1,
            attachedDataSheets: 1,
            attachedDrawings: 1,
            categoriesOfRequestSheet: 1,
            yokotenkai: 1,
          },
        },
        // {
        //   $group: {
        //     _id: "$_id",
        //     workDetails: { $push: "$workDetails" },
        //   },
        // },
        {
          $sort: {
            _id: -1,
          },
        },
      ]);

      const counters = await RequestSheetOfCM.aggregate([
        ...queryPipeline,
        {
          $group: {
            _id: null,
            total_request_sheet_count: {
              $sum: 1,
            },
            open_request_sheet_count: {
              $sum: {
                $cond: [
                  { $ne: ["$requestSheetStatusOfCM", "Completed"] },
                  1,
                  0,
                ],
              },
            },
            closed_request_sheet_count: {
              $sum: {
                $cond: [
                  { $eq: ["$requestSheetStatusOfCM", "Completed"] },
                  1,
                  0,
                ],
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

      res.json({
        reqSheetCM,
        counters: {
          ...counters?.[0],
        },
        message: "Request-sheet fetched successfully",
      });
    } catch (error) {
      console.log(error);
    }
  })
);

// For Calendar Modal
router.get("/getReqSheetDataByID/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const requestSheet = await RequestSheetOfCM.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId(id),
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
          from: "machinesalldatas",
          localField: "machineRef",
          foreignField: "_id",
          // pipeline: [
          //   {
          //     $project: {
          //       machine_name: 1,
          //       machine_code: 1,
          //     },
          //   },
          // ],
          as: "machines",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "assignUserForCM",
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
          as: "assigned_users",
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
          from: "users",
          localField: "assignUserForCM",
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
          as: "namesOperators",
        },
      },
      {
        $project: {
          requestSheetNoOfCM: 1,
          maintenanceType: 1,
          priorityCode: 1,
          requestSheetOfBMRef: 1,
          plannedDateAndTimeOfCM: 1,
          sheetIssuedDateAndTimeOfCM: 1,
          shiftOfCM: 1,
          qualityRelated: 1,
          preAggregationTimeStampOfRequestSheet: 1,
          requestSheetCreatedBy: {
            $arrayElemAt: ["$requestSheetCreatedBy", 0],
          },

          //only for material table purpose
          cell: { $arrayElemAt: ["$cells.cell_name", 0] },
          line: { $arrayElemAt: ["$lines.line_name", 0] },
          machineNo: { $arrayElemAt: ["$machines.machine_code", 0] },
          machineName: { $arrayElemAt: ["$machines.machine_name", 0] },
          plannedDateAndTimeOfCMForTable: {
            $dateToString: {
              format: "%d-%m-%Y T%H:%M",
              date: "$plannedDateAndTimeOfCM",
              timezone: timezone,
            },
          },
          assigned_users: 1,

          approvalOfMTD_SL: {
            $arrayElemAt: ["$approvalOfMTD_SL", 0],
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

          // partQualityCheckedByPRD: { $arrayElemAt: ["$namesPRD", 0] },
          // partQualityCheckedByMTD: { $arrayElemAt: ["$namesMTD", 0] },

          // dataSheetOfBM: 1,
          // drawingOfBM: 1,
          // sparePartUsedOrNot: 1,
          changedParts: 1,

          machineRef: { $arrayElemAt: ["$machines", 0] },
          lineRef: { $arrayElemAt: ["$lines", 0] },
          cellRef: { $arrayElemAt: ["$cells", 0] },
          subSectionRef: { $arrayElemAt: ["$subSections", 0] },
          sectionRef: { $arrayElemAt: ["$sections", 0] },
          plantRef: { $arrayElemAt: ["$plants", 0] },

          requestSheetStatusOfCM: 1,
          getDataForApprovalDashboard: 1,

          actionTemporaryOrNot: 1,
          cmBasicDataFilledByMTD_TL: 1,
          dataSheetOfRequestSheet: 1,
          drawingOfRequestSheet: 1,
          supportingTM: 1,
          attachedDataSheets: 1,
          attachedDrawings: 1,
          categoriesOfRequestSheet: 1,
          yokotenkai: 1,
        },
      },
    ]);
    res.status(200).json({
      requestSheet,
      message: "Request sheet fetched successfully",
    });
  } catch (error) {
    console.log(error);
  }
});

router.patch("/approvalOfMTDTL/:requestSheetID", async (req, res) => {
  try {
    const { requestSheetID } = req.params;
    console.log("tjhosnk sa");
    const {
      approvalOfRequestSheet,
      rejectedRemarksOfRequestSheet,
      cmSelectedSheetForView,
    } = req.body;
    // console.log(rejectedRemarksOfRequestSheet);
    const requestSheet = await RequestSheetOfCM.findById(requestSheetID);

    if (!requestSheet) {
      return res.status(404).json({ message: "Request sheet not found" });
    }

    if (approvalOfRequestSheet === "Yes") {
      requestSheet?.approvalStatusOfMTD_TL?.pop();
      requestSheet?.approvalStatusOfMTD_TL?.push("Accepted");
      requestSheet?.approvalDateAndTimeOfMTD_HOS?.push(""); //Need to append this date because of the indexing issue at frontend level.

      // requestSheet.requestSheetStatusOfCM = "Accepted by MTD TL";
      requestSheet.requestSheetStatusOfCM = "Under MTD HOS Approval";

      if (cmSelectedSheetForView?.approvalOfMTD_HOS?.tm_no) {
        requestSheet.getDataForApprovalDashboard = {
          Id: cmSelectedSheetForView?.approvalOfMTD_HOS?._id,
          departmentAndGradeOfUser:
            cmSelectedSheetForView?.approvalOfMTD_HOS?.user_type,
        };
      }
    } else if (approvalOfRequestSheet === "No") {
      requestSheet.approvalStatusOfMTD_TL.pop();
      requestSheet.approvalStatusOfMTD_TL.push("Rejected");
      requestSheet.getDataForApprovalDashboard = {
        Id: null,
        departmentAndGradeOfUser: null,
      };

      requestSheet.requestSheetStatusOfCM = "Rejected";
      requestSheet.rejectedRemarksOfRequestSheet.push(
        rejectedRemarksOfRequestSheet
      );
    }
    requestSheet?.approvalDateAndTimeOfMTD_TL?.push(new Date());
    await requestSheet.save();

    res.status(200).json({
      message: "Request sheet updated successfully",
      requestSheet,
    });
  } catch (error) {
    console.log(error);
  }
});
router.patch("/approvalOfHOS/:requestSheetID", async (req, res) => {
  try {
    const { requestSheetID } = req.params;
    const {
      approvalOfRequestSheet,
      rejectedRemarksOfRequestSheet,
      cmSelectedSheetForView,
    } = req.body;

    const requestSheet = await RequestSheetOfCM.findById(requestSheetID);

    if (!requestSheet) {
      return res.status(404).json({ message: "Request sheet not found" });
    }
    console.log(cmSelectedSheetForView);

    if (approvalOfRequestSheet === "Yes") {
      requestSheet.approvalStatusOfMTD_HOS.pop();
      requestSheet.approvalStatusOfMTD_HOS.push("Accepted");
      if (!cmSelectedSheetForView?.approvalOfPRD_TL?._id) {
        requestSheet.requestSheetStatusOfCM = "Completed";
        requestSheet.getDataForApprovalDashboard = {
          Id: null,
          departmentAndGradeOfUser: null,
        };
      } else {
        requestSheet.requestSheetStatusOfCM = "Under PRD TL Approval";
        requestSheet.getDataForApprovalDashboard = {
          Id: cmSelectedSheetForView?.approvalOfPRD_TL?._id,
          departmentAndGradeOfUser:
            cmSelectedSheetForView?.approvalOfPRD_TL?.user_type,
        };
      }
    } else if (approvalOfRequestSheet === "No") {
      requestSheet.approvalStatusOfMTD_HOS.pop();
      requestSheet.approvalStatusOfMTD_HOS.push("Rejected");
      requestSheet.getDataForApprovalDashboard = {
        Id: null,
        departmentAndGradeOfUser: null,
      };

      requestSheet.requestSheetStatusOfCM = "Rejected";
      requestSheet.rejectedRemarksOfRequestSheet.push(
        rejectedRemarksOfRequestSheet
      );
    }
    requestSheet.approvalDateAndTimeOfMTD_HOS.push(new Date());

    await requestSheet.save();

    res.json({
      message: "Request sheet updated successfully",
      requestSheet,
    });
  } catch (error) {
    console.log(error);
  }
});
router.patch("/approvalOfPRDTL/:requestSheetID", async (req, res) => {
  try {
    const { requestSheetID } = req.params;
    const {
      approvalOfRequestSheet,
      rejectedRemarksOfRequestSheet,
      cmSelectedSheetForView,
    } = req.body;

    const requestSheet = await RequestSheetOfCM.findById(requestSheetID);

    if (!requestSheet) {
      return res.status(404).json({ message: "Request sheet not found" });
    }

    if (approvalOfRequestSheet === "Yes") {
      requestSheet.approvalStatusOfPRD_TL.pop();
      requestSheet.approvalStatusOfPRD_TL.push("Accepted");

      requestSheet.requestSheetStatusOfCM = "Completed";
      requestSheet.getDataForApprovalDashboard = {
        Id: null,
        departmentAndGradeOfUser: null,
      };
    } else if (approvalOfRequestSheet === "No") {
      requestSheet.approvalStatusOfPRD_TL.pop();
      requestSheet.approvalStatusOfPRD_TL.push("Rejected");
      requestSheet.getDataForApprovalDashboard = {
        Id: null,
        departmentAndGradeOfUser: null,
      };

      requestSheet.requestSheetStatusOfCM = "Rejected";
      requestSheet.rejectedRemarksOfRequestSheet.push(
        rejectedRemarksOfRequestSheet
      );
    }
    requestSheet.approvalDateAndTimeOfPRD_TL.push(new Date());

    await requestSheet.save();

    res.json({
      message: "Request sheet updated successfully",
      requestSheet,
    });
  } catch (error) {
    console.log(error);
  }
});

router.get(
  "/getApprovalLogsForCM/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  async (req, res, next) => {
    try {
      const getDataOfRequestSheetApprovalLogs =
        await RequestSheetOfCM.aggregate([
          {
            $match: {
              ...req.queryObj,
              $and: [
                {
                  requestSheetStatusOfCM: {
                    $ne: "Generated",
                  },
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
              from: "cells",
              localField: "cellRef",
              foreignField: "_id",
              as: "cells",
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "assignUserForCM",
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
              requestSheetNoOfCM: 1,
              plannedDateAndTimeOfCM: 1,
              assignUserForCM: 1,
              namesOperators: 1,

              approvalOfMTD_TL: 1,
              approvalStatusOfMTD_TL: 1,
              approvalDateAndTimeOfMTD_TL: 1,

              approvalOfMTD_HOS: 1,
              approvalStatusOfMTD_HOS: 1,
              approvalDateAndTimeOfMTD_HOS: 1,

              approvalOfPRD_TL: 1,
              approvalStatusOfPRD_TL: 1,
              approvalDateAndTimeOfPRD_TL: 1,

              rejectedRemarksOfRequestSheet: 1,

              approverNameLogOfMTD_TL: 1,
              approverNameLogOfMTD_HOS: 1,
              approverNameLogOfPRD_TL: 1,

              requestSheetStatus: 1,

              machineRef: { $arrayElemAt: ["$machines", 0] },
              lineRef: { $arrayElemAt: ["$lines", 0] },

              line: { $arrayElemAt: ["$lines.line_name", 0] },
              cell: { $arrayElemAt: ["$cells.cell_name", 0] },
              machineNo: { $arrayElemAt: ["$machines.machine_code", 0] },
              machineName: { $arrayElemAt: ["$machines.machine_name", 0] },

              assignUserForCM: {
                $arrayElemAt: ["$namesOperators.tm_name", 0],
              },

              plannedDateAndTimeOfCMForTable: {
                $dateToString: {
                  format: "%d-%m-%Y T%H:%M",
                  date: "$plannedDateAndTimeOfCM",
                  timezone: timezone,
                },
              },
            },
          },
        ]);
      res.status(200).json({
        message: "Get approval data successfully",
        approvalDataLogs: getDataOfRequestSheetApprovalLogs,
      });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ message: error?.message, error: new Error(error) });
    }
  }
);

router.get("/getReqSheetDataForCalendar", authenticate, async (req, res) => {
  try {
    const reqSheetDataForCalendar = await RequestSheetOfCM.aggregate([
      {
        $project: {
          title: "$cmBasicDataFilledByMTD_TL.activityOfCM",
          allDay: true,
          start: "$plannedDateAndTimeOfCM",
          end: "$plannedDateAndTimeOfCM",
        },
      },
    ]);
    // console.log(reqSheetDataForCalendar);
    res.status(200).json({
      message: "Request sheet data for calendar fetched successfully",
      reqSheetDataForCalendar,
    });
  } catch (error) {
    console.log(error);
  }
});

const middlewareForSectionAndSubSectionLookup = async (req, res, next) => {
  try {
    let queryObjPipeline = [];
    const section = await Section.findOne({
      section_id: req?.rootUser?.section_data?.split("-")?.[0],
    });

    if (section.dashboardLevel === "Yes") {
      queryObjPipeline = [
        {
          $lookup: {
            from: "sections",
            localField: "_id.sectionRef",
            foreignField: "_id",
            as: "section_data",
            pipeline: [
              {
                $project: { section_name: "$section_name" },
              },
            ],
          },
        },
        {
          $unwind: "$section_data",
        },
      ];
    } else {
      queryObjPipeline = [
        {
          $lookup: {
            from: "subsections",
            localField: "_id.subSectionRef",
            foreignField: "_id",
            as: "section_data",
            pipeline: [
              {
                $project: { section_name: "$subSection_name" },
              },
            ],
          },
        },
        {
          $unwind: "$section_data",
        },
      ];
    }

    req.queryObjPipeline = queryObjPipeline;
    next();
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

router.get(
  "/LTPM/getDatOfLTPM/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  middlewareForSectionAndSubSectionLookup,
  tryCatchHandler(async (req, res, next) => {
    const paginationCount = req?.query?.paginationCount * 1;
    const yearList = Array.from(
      { length: 5 },
      (_, i) =>
        moment().subtract(paginationCount, "years").tz(timezone).year() + i
    );

    const QUARTER = ["Q1", "Q2", "Q3", "Q4"];

    const quarterList = Array(5).fill(QUARTER).flat();

    const data = await RequestSheetOfCM.aggregate([
      {
        $match: {
          "cmBasicDataFilledByMTD_TL.categories": "LTPM",
          // lineRef: mongoose.Types.ObjectId(req?.query?.lineRef),
          // ...req?.queryObj,
        },
      },
      {
        $group: {
          _id: {
            machineRef: "$machineRef",
            lineRef: "$lineRef",
            sectionRef: "$sectionRef",
            subSectionRef: "$subSectionRef",
          },
          data: {
            $push: {
              frequencyValue: "$cmBasicDataFilledByMTD_TL.frequencyValue",
              inspectionItem: "$cmBasicDataFilledByMTD_TL.inspectionItem",
              actionForLTPM: "$cmBasicDataFilledByMTD_TL.actionForLTPM",
              personForLTPM: "$cmBasicDataFilledByMTD_TL.personForLTPM",
              commonDataFilledByAssignUser: "$commonDataFilledByAssignUser",
            },
          },
          lineName: { $first: "$lineRef" },
        },
      },
      {
        $lookup: {
          from: "machinesalldatas",
          localField: "_id.machineRef",
          foreignField: "_id",
          as: "machines",
          pipeline: [
            {
              $project: {
                machine_code: 1,
                machine_name: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: "$machines",
      },
      {
        $lookup: {
          from: "lines",
          localField: "lineName",
          foreignField: "_id",
          as: "lines",
          pipeline: [
            {
              $project: {
                line_name: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: "$lines",
      },
      ...req.queryObjPipeline,
    ]);
    successResponse(res, "LTPM Line wise data get successfully", {
      paginationCount,
      data,
      quarterList,
      yearList,
    });
  })
);

// router.get(
//   "/LTPM/getLineWiseLTPM/:filter/:selectedId",
//   authenticate,
//   filterMiddleware,
//   tryCatchHandler(async (req, res, next) => {
//     const listOfLine = await RequestSheetOfCM.aggregate([
//       {
//         $match: {
//           ...req?.queryObj,
//         },
//       },
//       {
//         $group: {
//           _id: { lineName: "$lineRef", cellName: "$cellRef" },
//         },
//       },
//       {
//         $lookup: {
//           from: "lines",
//           localField: "_id.lineName",
//           foreignField: "_id",
//           as: "lines",
//           pipeline: [
//             {
//               $project: {
//                 line_name: 1,
//               },
//             },
//           ],
//         },
//       },
//       {
//         $lookup: {
//           from: "cells",
//           localField: "_id.cellName",
//           foreignField: "_id",
//           as: "cells",
//           pipeline: [
//             {
//               $project: {
//                 cell_name: 1,
//               },
//             },
//           ],
//         },
//       },
//       {
//         $project: {
//           cellName: { $arrayElemAt: ["$cells.cell_name", 0] },
//           lineName: { $arrayElemAt: ["$lines.line_name", 0] },
//         },
//       },
//     ]);

//     successResponse(res, "LTPM Line wise data get successfully", {
//       listOfLine,
//     });
//   })
// );

module.exports = router;
