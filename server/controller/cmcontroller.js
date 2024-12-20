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
const PlantToMachineHierarchy = require("../model/plantToMachineHierarchySchema");

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

const successResponse = (res, message = "", data = {}) => {
  try {
    return res.status(201).json({
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
      section_data: req?.rootUser?.section_data,
    };

    if (req?.rootUser?.tm_grade !== "HOD" && section?.dashboardLevel === "No") {
      queryObj = {
        ...queryObj,
        subSection_data: { $in: req?.rootUser?.subSection_data },
      };
    }

    req.queryObj = queryObj;
    next();
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

const findMachineDataWithParentHierarchy = tryCatchHandler(
  async (req, res, next) => {
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
      .select(["machine_code", "machine_name", "machine_nickname"])
      .exec();

    if (!machine) {
      return res.status(400).json({
        message: "Machine data doesn't exist",
      });
    }

    req.machine = machine;
    return next();
  }
);
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

const quarterlyDataAdd = (
  plannedDateAndTimeOfCM,
  frequencyValue,
  assignUserForCM
) => {
  const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];
  const plannedQuarter = getFinancialQuarter(plannedDateAndTimeOfCM); // Get the starting quarter
  const plannedQuarterIndex = QUARTERS.indexOf(plannedQuarter);
  const plannedData = [];

  const totalYears = 5; // Generate data for 4 years
  const currentYear = moment(new Date()).tz(timezone).year();
  const currentQuarterIndex = Math.floor(moment(new Date()).month() / 3);

  for (let year = currentYear; year < currentYear + totalYears; year++) {
    const yearlyDataObject = {
      preAggregationTimeStampOfRequestSheet: {
        requestSheet_year: `${year}-${year + 1}`,
        requestSheet_month: gettingMonthForSelectedDate(plannedDateAndTimeOfCM),
      },
      quarterlyDataOfTheCM: [],
    };

    for (let i = 0; i < QUARTERS.length; i++) {
      const quarter = QUARTERS[i];
      let isPlanned = false;

      if (frequencyValue === "1/Y") {
        // Plan only the starting quarter each year
        isPlanned = i === plannedQuarterIndex;
      } else if (frequencyValue === "1/2 Y") {
        // Plan the starting quarter every two years
        const currentQuarter = (year - currentYear) * 4 + i;
        isPlanned = currentQuarter % 8 === plannedQuarterIndex;
      } else if (frequencyValue === "1/3 Y") {
        // Plan the starting quarter every three years
        const currentQuarter = (year - currentYear) * 4 + i;
        isPlanned = currentQuarter % 12 === plannedQuarterIndex;
      } else if (frequencyValue === "1/4 Y") {
        // Plan the starting quarter every four years
        // Plan the quarter 4 years later (not in between)
        // Current year plan: should happen in next cycle 4 years later
        if (year - currentYear >= 4 && (year - currentYear) % 4 === 0) {
          isPlanned = i === plannedQuarterIndex;
        }
      } else if (frequencyValue === "1/6 M") {
        // Alternate quarters based on the starting quarter
        const alternatingQuarters = [
          plannedQuarterIndex,
          (plannedQuarterIndex + 2) % 4, // Alternate quarters
        ];

        if (year === currentYear) {
          // Current year: exclude past quarters
          isPlanned =
            alternatingQuarters.includes(i) && i >= currentQuarterIndex;
        } else {
          // Future years: alternate as per the pattern
          isPlanned = alternatingQuarters.includes(i);
        }
      }

      // Ensure that the starting quarter is planned for the current year
      if (year === currentYear && i === plannedQuarterIndex) {
        isPlanned = true;
      }

      if (isPlanned) {
        yearlyDataObject?.quarterlyDataOfTheCM?.push({
          requestSheet_quarter: quarter,
          statusOfPlannedCM: "Planned",
          assignUserForCM,
        });
      }
    }

    if (yearlyDataObject?.quarterlyDataOfTheCM?.length > 0) {
      plannedData?.push(yearlyDataObject);
    }
  }

  return plannedData;
};

const findPlantToMachineHierarchyObj = tryCatchHandler(
  async (req, res, next) => {
    let hierarchy = await PlantToMachineHierarchy.findOne({
      "machine._id": req?.machine?._id,
    });

    if (!hierarchy) {
      hierarchy = new PlantToMachineHierarchy({
        machine: req?.machine,
        line: req?.machine?.line_names,
        cell: req?.machine?.line_names?.cell_names,
        subSection: req?.machine?.line_names?.cell_names?.subSection_names,
        section:
          req?.machine?.line_names?.cell_names?.subSection_names?.section_names,
        plant:
          req?.machine?.line_names?.cell_names?.subSection_names?.section_names
            ?.plant_names,
      });

      await hierarchy.save();
    }

    req.plantToMachineHierarchyRef = hierarchy?._id;
    return next();
  }
);

router.post(
  "/newRequestSheetRegistrationOfCM",
  authenticate,
  uploadDataSheetsOfBD.fields([
    { name: "cmBasicDataFilledByMTD_TL.attachedFilesByMTDUser", maxCount: 10 },
  ]),
  findMachineDataWithParentHierarchy,
  findPlantToMachineHierarchyObj,
  async (req, res, next) => {
    const requestSheetDataFilledByMTDUserForCM = JSON.parse(req.body.otherData);
    let _idObject = {};

    if (req?.machine) {
      _idObject = {
        machineRef: req?.machine._id,
        lineRef: req?.machine.line_names._id,
        cellRef: req?.machine.line_names.cell_names._id,
        subSectionRef: req?.machine.line_names.cell_names.subSection_names._id,
        sectionRef:
          req?.machine.line_names.cell_names.subSection_names.section_names._id,
        plantRef:
          req?.machine.line_names.cell_names.subSection_names.section_names
            .plant_names._id,
      };
    }

    const requestSheetNoOfCM = await globalReqSheetNo(
      req.query?.machineRef,
      "CM"
    );

    const assignUserForCM =
      requestSheetDataFilledByMTDUserForCM?.assignUserForCM?.map((item) => {
        let userRef = item?._id;
        delete item["_id"];
        return {
          ...item,
          userRef,
        };
      });

    const commonDataFilledByAssignUser = quarterlyDataAdd(
      requestSheetDataFilledByMTDUserForCM?.plannedDateAndTimeOfCM,
      requestSheetDataFilledByMTDUserForCM?.cmBasicDataFilledByMTD_TL
        ?.frequencyValue,
      assignUserForCM
    );

    let requestSheetOfCM = new RequestSheetOfCM({
      requestSheetNoOfCM,
      ..._idObject,
      plantToMachineHierarchyRef: req?.plantToMachineHierarchyRef,
      requestSheetCreatedBy: req?.rootUser,
      shiftOfCM: requestSheetDataFilledByMTDUserForCM?.shiftOfBM,
      ...requestSheetDataFilledByMTDUserForCM,
      partSuggestionByMTDTL:
        requestSheetDataFilledByMTDUserForCM?.partSuggestionByMTDTL,
      commonDataFilledByAssignUser,
    });

    await requestSheetOfCM.save();
    successResponse(res, "CM Request-sheet generated successfully");
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

const commonKeyGenerationMiddleware = tryCatchHandler(
  async (req, res, next) => {
    let commonKey =
      "commonDataFilledByAssignUser.$[yearFilter].quarterlyDataOfTheCM.$[quarterFilter]";

    let allKeys = {
      approvalOfMTD_HOS: `${commonKey}.approvalOfMTD_HOS`,
      approvalOfMTD_TL: `${commonKey}.approvalOfMTD_TL`,
      approvalOfPRD_TL: `${commonKey}.approvalOfPRD_TL`,
      requestSheetStatusOfCM: `${commonKey}.requestSheetStatusOfCM`,
    };

    if (req?.url?.split("/")?.includes("sendApprovalForRequestSheetOfCM")) {
      allKeys = {
        ...allKeys,
        attachedFileByAssignedUser: `${commonKey}.attachedFileByAssignedUser`,
        getDataForApprovalDashboard: `${commonKey}.getDataForApprovalDashboard`,
        workDetails: `${commonKey}.workDetails`,
        changedParts: `${commonKey}.changedParts`,
        actionAndCounterMeasureStep: `${commonKey}.actionAndCounterMeasureStep`,
      };
    }

    req.allKeys = allKeys;
    return next();
  }
);

router.patch(
  "/sendApprovalForRequestSheetOfCM/:reqId/:machineRef",
  authenticate,
  dashboardLevelUserCheckMiddleware,
  uploadDataSheetsOfBD.fields([
    { name: "attachedFileByAssignedUser", maxCount: 10 },
  ]),
  commonKeyGenerationMiddleware,
  async (req, res, next) => {
    try {
      let commonApprovalStatusObj = {
        approvalStatus: "Pending",
        approvalDateAndTime: "",
      };

      const requestSheetDataFilledByMTDUserForCM = JSON.parse(
        req.body.otherData
      );

      let _ids = {
        ID_MTD_HOS:
          requestSheetDataFilledByMTDUserForCM?.approvalOfMTD_HOS?._id,
        ID_MTD_TL: requestSheetDataFilledByMTDUserForCM?.approvalOfMTD_TL?._id,
        ID_PRD_TL: requestSheetDataFilledByMTDUserForCM?.approvalOfPRD_TL?._id,
      };

      delete requestSheetDataFilledByMTDUserForCM?.approvalOfMTD_HOS["_id"];
      delete requestSheetDataFilledByMTDUserForCM?.approvalOfMTD_TL["_id"];
      delete requestSheetDataFilledByMTDUserForCM?.approvalOfPRD_TL["_id"];

      let updateObj = {
        $push: {
          [req.allKeys?.approvalOfMTD_HOS]: {
            ...requestSheetDataFilledByMTDUserForCM?.approvalOfMTD_HOS,
            ...commonApprovalStatusObj,
            approvalDateAndTime: new Date(),
          },
        },
      };

      if (
        req.files?.attachedFileByAssignedUser?.[0]?.filename ||
        req.files?.attachedFileByAssignedUser
      ) {
        requestSheetDataFilledByMTDUserForCM["attachedFileByAssignedUser"] =
          req.files?.attachedFileByAssignedUser?.[0]?.filename;

        updateObj.$set = {
          [req.allKeys?.attachedFileByAssignedUser]:
            req.files?.attachedFileByAssignedUser?.[0]?.filename,
        };
      }

      if (requestSheetDataFilledByMTDUserForCM?.isPermissionOfMTDTL === "Yes") {
        updateObj.$push = {
          ...updateObj.$push,
          [req.allKeys?.approvalOfMTD_TL]: {
            ...requestSheetDataFilledByMTDUserForCM?.approvalOfMTD_TL,
            ...commonApprovalStatusObj,
          },
        };
        updateObj.$set = {
          ...updateObj.$set,
          [req.allKeys?.requestSheetStatusOfCM]: "Under MTD TL/HOSS Approval",
          [req.allKeys?.getDataForApprovalDashboard]: {
            Id: requestSheetDataFilledByMTDUserForCM?.approvalOfMTD_TL?._id,
            departmentAndGradeOfUser: "MTD TL/HOSS",
          },
        };
      } else {
        updateObj.$set = {
          ...updateObj.$set,
          [req.allKeys?.requestSheetStatusOfCM]: "Under MTD HOS Approval",
          [req.allKeys?.getDataForApprovalDashboard]: {
            Id: requestSheetDataFilledByMTDUserForCM?.approvalOfMTD_HOS?._id,
            departmentAndGradeOfUser: "MTD HOS",
          },

          // requestSheetStatusOfCM: "Under MTD HOS Approval",
          // "getDataForApprovalDashboard.Id":
          //   requestSheetDataFilledByMTDUserForCM?.approvalOfMTD_HOS?._id,
          // "getDataForApprovalDashboard.departmentAndGradeOfUser": "MTD HOS",
          // approvalDateAndTimeOfMTD_TL: new Date(),
        };
      }

      if (requestSheetDataFilledByMTDUserForCM?.isPermissionOfPRDTL === "Yes") {
        updateObj.$push = {
          ...updateObj.$push,
          [req.allKeys?.approvalOfPRD_TL]: {
            ...requestSheetDataFilledByMTDUserForCM?.approvalOfPRD_TL,
            ...commonApprovalStatusObj,
          },
        };
      }
      updateObj.$set = {
        ...updateObj.$set,
        [req.allKeys?.workDetails]:
          requestSheetDataFilledByMTDUserForCM?.workDetails,
        [req.allKeys?.changedParts]:
          requestSheetDataFilledByMTDUserForCM?.changedParts,
        [req.allKeys?.actionAndCounterMeasureStep]:
          requestSheetDataFilledByMTDUserForCM?.actionAndCounterMeasureStep,
      };

      const requestSheetOfCM = await RequestSheetOfCM.findOneAndUpdate(
        {
          _id: mongoose.Types.ObjectId(req.params?.reqId),
        },
        updateObj,
        {
          arrayFilters: [
            {
              "yearFilter.preAggregationTimeStampOfRequestSheet.requestSheet_year":
                currentYear,
            },
            { "quarterFilter.requestSheet_quarter": getFinancialQuarter() },
          ],
          new: true,
        }
      );
      return res.status(201).json({
        message: `Request-sheet approval send !!`,
        requestSheetOfCM,
      });
    } catch (error) {
      console.log(error);
    }
  }
);

const getRequestSheetData = tryCatchHandler(async (req, res, next) => {
  const requestSheetData = await RequestSheetOfCM.aggregate([
    {
      $match: req.queryObj,
    },
    {
      $lookup: {
        from: "planttomachinehierarchies",
        localField: "plantToMachineHierarchyRef",
        foreignField: "_id",
        as: "plantToMachineHierarchy",
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
        requestSheetCreatedBy: 1,
        current_commonDataFilledByAssignUser: {
          $arrayElemAt: [
            {
              $filter: {
                input: {
                  $getField: {
                    field: "quarterlyDataOfTheCM",
                    input: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$commonDataFilledByAssignUser",
                            as: "yearWiseData",
                            cond: {
                              $eq: [
                                "$$yearWiseData.preAggregationTimeStampOfRequestSheet.requestSheet_year",
                                req?.query?.selectedYear,
                              ],
                            },
                          },
                        },
                        0,
                      ],
                    },
                  },
                },
                as: "quarterWiseData",
                cond: {
                  $eq: [
                    "$$quarterWiseData.requestSheet_quarter",
                    //need to change this quarter when user select previous year filter
                    getFinancialQuarter(),
                  ],
                },
              },
            },
            0,
          ],
        },

        //only for material table purpose
        cell: {
          $arrayElemAt: ["$plantToMachineHierarchy.cell.cell_name", 0],
        },
        line: {
          $arrayElemAt: ["$plantToMachineHierarchy.line.line_name", 0],
        },
        machineNo: {
          $arrayElemAt: ["$plantToMachineHierarchy.machine.machine_code", 0],
        },
        machineName: {
          $arrayElemAt: ["$plantToMachineHierarchy.machine.machine_name", 0],
        },
        plannedDateAndTimeOfCMForTable: {
          $dateToString: {
            format: "%d-%m-%Y T%H:%M",
            date: "$plannedDateAndTimeOfCM",
            timezone: timezone,
          },
        },
        finalActivity: 1,
        work_order_status: 1,
        rejectedRemarksOfRequestSheet: 1,
        feedbackMTD_HOS: 1,
        qualityConfirmed: 1,

        changedParts: 1,
        workDetails: 1,
        actionAndCounterMeasureStep: 1,

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
  req.requestSheetData = requestSheetData;
  if (requestSheetData?.length === 0) {
    return res.status(400).json({
      message: "No data to display",
    });
  }
  next();
});

router.get(
  "/getMachineRequestSheetDetailsForApprovalForCM/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  tryCatchHandler(async (req, res, next) => {
    req.queryObj = {
      ...req.queryObj,
      "commonDataFilledByAssignUser.quarterlyDataOfTheCM.getDataForApprovalDashboard.Id":
        {
          $elemMatch: {
            _id: mongoose.Types.ObjectId(req.rootUser?._id),
          },
        },
    };
    return next();
  }),
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
    if (req.rootUser?.user_type === "Operator") {
      req.queryObj = {
        ...req.queryObj,
        "commonDataFilledByAssignUser.quarterlyDataOfTheCM.assignUserForCM": {
          $elemMatch: {
            _id: mongoose.Types.ObjectId(req.rootUser?._id),
          },
        },
      };
    }
    return next();
  }),
  getRequestSheetData,
  tryCatchHandler(async (req, res, next) => {
    const counters = await RequestSheetOfCM.aggregate([
      {
        $match: req.queryObj,
      },
      {
        $group: {
          _id: null,
          total_request_sheet_count: {
            $sum: 1,
          },
          open_request_sheet_count: {
            $sum: {
              $cond: [{ $ne: ["$requestSheetStatusOfCM", "Completed"] }, 1, 0],
            },
          },
          closed_request_sheet_count: {
            $sum: {
              $cond: [{ $eq: ["$requestSheetStatusOfCM", "Completed"] }, 1, 0],
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

    successResponse(res, "Request-sheet fetched successfully", {
      reqSheetCM: req.requestSheetData,
      counters: {
        ...counters?.[0],
      },
    });
  })
);

// For Calendar Modal
router.get(
  "/getReqSheetDataByID/:selectedId",
  authenticate,
  tryCatchHandler(async (req, res, next) => {
    req.queryObj = {
      _id: mongoose.Types.ObjectId(req.query?.selectedId),
    };
    return next();
  }),
  getRequestSheetData,
  tryCatchHandler(async (req, res) => {
    successResponse(res, "Request sheet fetched successfully", {
      requestSheet: req?.requestSheetData?.[0],
    });
  })
);

router.patch(
  "/approveOrRejectRequestSheet/:requestSheetID",
  authenticate,
  commonKeyGenerationMiddleware,
  tryCatchHandler(async (req, res, next) => {
    const { requestSheetID } = req.params;

    const isRequestSheetExist = await RequestSheetOfCM.findById(requestSheetID);

    if (!isRequestSheetExist) {
      return res.status(404).json({ message: "Request sheet not found" });
    }

    let updateObj = {
      $set: {
        [req.allKeys?.[`approvalOf${req?.query?.department}`]?.approvalStatus]:
          "Accepted",
        [req.allKeys?.requestSheetStatusOfCM]: "Under MTD HOS Approval",
      },
    };

    if (isRequestSheetExist) {
    }

    const requestSheetOfCM = await RequestSheetOfCM.findOneAndUpdate(
      {
        _id: mongoose.Types.ObjectId(req.params?.reqId),
      },
      updateObj,
      {
        arrayFilters: [
          {
            "yearFilter.preAggregationTimeStampOfRequestSheet.requestSheet_year":
              currentYear,
          },
          { "quarterFilter.requestSheet_quarter": getFinancialQuarter() },
        ],
        new: true,
      }
    );
  })
);

router.patch("/approvalOfMTDTL/:requestSheetID", async (req, res) => {
  try {
    const { requestSheetID } = req.params;
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
    const startYearOfLTPM = moment()
      .subtract(paginationCount, "years")
      .tz(timezone)
      .year();
    const yearList = Array.from({ length: 5 }, (_, i) => startYearOfLTPM + i);
    const QUARTER = ["Q1", "Q2", "Q3", "Q4"];

    req.queryObj = {
      ...req?.queryObj,
      commonDataFilledByAssignUser: {
        $elemMatch: {
          "preAggregationTimeStampOfRequestSheet.requestSheet_year": `${startYearOfLTPM}-${
            startYearOfLTPM + 1
          }`,
        },
      },
    };

    const quarterList = Array(5).fill(QUARTER).flat();
    const data = await RequestSheetOfCM.aggregate([
      {
        $match: {
          "cmBasicDataFilledByMTD_TL.categories": "LTPM",
          // lineRef: mongoose.Types.ObjectId(req?.query?.lineRef),
          ...req?.queryObj,
        },
      },
      {
        $group: {
          _id: {
            machineRef: "$machineRef",
            lineRef: "$lineRef",
            sectionRef: "$sectionRef",
            subSectionRef: "$subSectionRef",
            _id: "$_id",
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
