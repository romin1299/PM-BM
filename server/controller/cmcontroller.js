const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");
// const fs = require("fs");
// let path = require("path");
const cookieParser = require("cookie-parser");
const moment = require("moment-timezone");
const timezone = "Asia/Kolkata";

// const RequestSheetOfBM = require("../model/requestSheetDataOfBM");
// const SubSection = require("../model/subSectionSchema");
// const Cell = require("../model/cellSchema");
const Line = require("../model/lineSchema");
// const LogHistory = require("../model/logHistorySchema");
// const NoLossBD = require("../model/noLossBDSheetData");
// const HandlingActions = require("../model/handlingActions");
// const Plant = require("../model/plantSchema");
const Machine = require("../model/machineSchema");
const User = require("../model/userSchema");
const Section = require("../model/sectionSchema");
const RequestSheetOfCM = require("../model/requestSheetDataOfCM");
const PlantToMachineHierarchy = require("../model/plantToMachineHierarchySchema");

const authenticate = require("../middleware/authenticate");
const logger = require("../utils/LoggingController/loggers");

const tryCatchHandler = require("../errorHandler/tryCatchHandler");
const maintenanceType = require("../utils/maintenanceType");
const filterMiddleware = require("../middleware/filterMiddleware");
const { globalReqSheetNo } = require("../middleware/globalReqSheetNo");
// const { gettingFYYear } = require("../middleware/gettingFYYear");
const {
  gettingMonthForSelectedDate,
  getFinancialQuarter,
  getFinancialQuarterByMonth,
} = require("../middleware/gettingFYMonthForPreAgg");

// const {
//   CM_PLANNED_STATUS,
// } = require("../GlobalData/RequestSheetApprovalStatus");
// const { start } = require("repl");

router.use(cookieParser());

// const monthKeyArray = [
//   "Jan",
//   "Feb",
//   "Mar",
//   "Apr",
//   "May",
//   "June",
//   "July",
//   "Aug",
//   "Sep",
//   "Oct",
//   "Nov",
//   "Dec",
// ];

// let currentMonth = monthKeyArray[new Date().getMonth()];
let currentYear =
  new Date().getMonth() < 3
    ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
    : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

const generalDateFormat = (propDate = new Date()) =>
  moment(propDate).tz("Asia/Kolkata").format("YYYY-MM-DDTHH:mm");

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
      const section = await Section.findOne({
        section_id: req?.rootUser?.section_data?.split("-")?.[0],
      });

      let queryObj = {
        plant_data: req?.rootUser?.plant_data,
        section_data: req?.rootUser?.section_data,
      };

      if (
        req?.rootUser?.tm_grade !== "HOD" &&
        section?.dashboardLevel === "No"
      ) {
        queryObj = {
          ...queryObj,
          subSection_data: { $in: req?.rootUser?.subSection_data },
        };
      }

      TLHOSS_and_TM_user_list = await User.find(
        {
          ...queryObj,
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

const findMachineUsing_id = tryCatchHandler(async (req, res, next) => {
  req.findMachineQuery = {
    _id: req.query?.machineRef,
  };
  return next();
});

const findMachineDataWithParentHierarchy = tryCatchHandler(
  async (req, res, next) => {
    const machine = await Machine.findOne(req.findMachineQuery)
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
    req.findMachineQuery = req.query;
    return next();
  }),
  findMachineDataWithParentHierarchy,
  tryCatchHandler(async (req, res, next) => {
    successResponse(res, "Selected machine data get successfully", {
      machine: req.machine,
      TLHOSS_and_TM_user_list: req?.TLHOSS_and_TM_user_list,
    });
  })
);

router.get(
  "/getSupportingTMDetailsForRequestSheetOfCM",
  authenticate,
  findTLandOperatorList,
  tryCatchHandler(async (req, res, next) => {
    successResponse(res, "User data get successfully", {
      TLHOSS_and_TM_user_list: req?.TLHOSS_and_TM_user_list,
    });
  })
);

router.get(
  "/getApprovalUserList",
  authenticate,
  tryCatchHandler(async (req, res, next) => {
    const section = await Section.findOne({
      section_id: req?.rootUser?.section_data?.split("-")?.[0],
    });

    let queryObj = {
      plant_data: req?.rootUser?.plant_data,
      _id: { $ne: req?.rootUser?._id },
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

    const { departmentFilterForTL, departmentFilterForHOS } = req.query;

    let userFilter = {
      tm_department: "MTD",
      tm_grade: "HOS",
    };

    if (departmentFilterForHOS) {
      userFilter = {
        tm_department: departmentFilterForHOS,
        tm_grade: "HOS",
      };
    }

    if (departmentFilterForTL) {
      userFilter = {
        $or: [
          userFilter,
          {
            tm_department: {
              $in: departmentFilterForTL?.split("-"),
            },
            user_type: "TL/HOSS",
          },
        ],
      };
    }

    const users = await User.aggregate([
      {
        $match: {
          ...queryObj,
          ...userFilter,
        },
      },
      {
        $group: {
          _id: {
            tm_department: "$tm_department",
            tm_grade: "$tm_grade",
            user_type: "$user_type",
          },
          groupUsers: {
            $push: {
              userRef: "$_id",
              tm_no: "$tm_no",
              user_type: "$user_type",
              tm_name: "$tm_name",
              email: "$email",
            },
          },
        },
      },
    ]);

    let userList = {
      MTDHOSList: [],
      PRDHOSList: [],
      MTDTLList: [],
      PRDTLList: [],
    };

    for (let i = 0; i < users.length; i++) {
      const { _id, groupUsers } = users[i];
      const { tm_department, tm_grade, user_type } = _id;

      if (tm_department === "MTD" && tm_grade === "HOS") {
        userList.MTDHOSList = groupUsers;
      } else if (tm_department === "PRD" && tm_grade === "HOS") {
        userList.PRDHOSList = groupUsers;
      } else if (tm_department === "MTD" && user_type === "TL/HOSS") {
        userList.MTDTLList = groupUsers;
      } else {
        userList.PRDTLList = groupUsers;
      }
    }

    successResponse(res, "User data get successfully", {
      userList,
    });
  })
);

const quarterlyDataAdd = (
  frequencyValue,
  assignUserForCM,
  frequencyType,
  targetDateOfCM
) => {
  const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];
  const plannedQuarter = getFinancialQuarter(targetDateOfCM); // Get the starting quarter
  const plannedQuarterIndex = QUARTERS.indexOf(plannedQuarter);
  const plannedData = [];

  const totalYears = 5; // Generate data for 4 years

  let currentDate = moment(new Date()).tz(timezone);

  let currentYear = currentDate.year();

  if ([0, 1, 2]?.includes(currentDate.month())) {
    currentYear -= 1;
  }

  const currentQuarterIndex = Math.floor(currentDate.month() / 3);
  let modifiedPlannedDateAndTimeOfCM;

  let yearlyDataObject1 = {
    preAggregationTimeStampOfRequestSheet: {},
    quarterlyDataOfTheCM: [],
  };
  if (frequencyValue === "1/1 M" || frequencyValue === "1/3 M") {
    yearlyDataObject1.preAggregationTimeStampOfRequestSheet = {
      requestSheet_year: `${currentYear}-${currentYear + 1}`,
      requestSheet_month: gettingMonthForSelectedDate(targetDateOfCM),
    };
    // quarterlyDataOfTheCM: [],

    yearlyDataObject1?.quarterlyDataOfTheCM?.push({
      targetDateOfCM: generalDateFormat(targetDateOfCM),
      requestSheet_quarter: getFinancialQuarter(targetDateOfCM),
      statusOfPlannedCM: "Planned",
      assignUserForCM,
    });
    plannedData?.push(yearlyDataObject1);
  } else {
    for (let year = currentYear; year < currentYear + totalYears; year++) {
      const yearlyDataObject = {
        preAggregationTimeStampOfRequestSheet: {
          requestSheet_year: `${year}-${year + 1}`,
          requestSheet_month: gettingMonthForSelectedDate(targetDateOfCM),
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

            if (
              alternatingQuarters.includes(i) &&
              i >= currentQuarterIndex &&
              currentQuarterIndex !== 0
            ) {
              isPlanned = true;
              modifiedPlannedDateAndTimeOfCM = targetDateOfCM;
            }
            // isPlanned =
            //   alternatingQuarters.includes(i) && i >= currentQuarterIndex;

            // if (alternatingQuarters.includes(i) && i >= currentQuarterIndex)
          } else {
            // Future years: alternate as per the pattern
            isPlanned = alternatingQuarters.includes(i);
          }
        }
        let assignUserOnlyForFirstQuarterWhileGenerate = {};
        // Ensure that the starting quarter is planned for the current year
        if (year === currentYear && i === plannedQuarterIndex) {
          isPlanned = true;
          assignUserOnlyForFirstQuarterWhileGenerate = {
            assignUserForCM: assignUserForCM,
          };
        }

        if (isPlanned) {
          //for other frequency
          // console.log(
          //   frequencyValue,
          //   typeof frequencyValue,
          //   year,
          //   currentYear,
          // );
          if (frequencyValue !== "1/6 M") {
            const changeTheYearOfThePlannedDateBasedOnTheFY = (passingYear) => {
              return [0, 1, 2]?.includes(currentDate.month())
                ? passingYear + 1
                : passingYear;
            };
            modifiedPlannedDateAndTimeOfCM = targetDateOfCM.replace(
              changeTheYearOfThePlannedDateBasedOnTheFY(currentYear),
              changeTheYearOfThePlannedDateBasedOnTheFY(year)
            );
          }
          yearlyDataObject?.quarterlyDataOfTheCM?.push({
            targetDateOfCM: generalDateFormat(modifiedPlannedDateAndTimeOfCM),
            requestSheet_quarter: quarter,
            statusOfPlannedCM: "Planned",
            ...assignUserOnlyForFirstQuarterWhileGenerate,
          });

          if (frequencyValue === "1/6 M") {
            modifiedPlannedDateAndTimeOfCM = moment(
              modifiedPlannedDateAndTimeOfCM
            ).add(6, "month");
          }
        }
      }

      if (yearlyDataObject?.quarterlyDataOfTheCM?.length > 0) {
        plannedData?.push(yearlyDataObject);
      }

      if (frequencyType === "One-time") break;
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
  findMachineUsing_id,
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
      requestSheetDataFilledByMTDUserForCM?.cmBasicDataFilledByMTD_TL
        ?.frequencyValue,
      assignUserForCM,
      requestSheetDataFilledByMTDUserForCM?.cmBasicDataFilledByMTD_TL
        ?.frequencyType,
      requestSheetDataFilledByMTDUserForCM?.targetDateOfCM
    );

    requestSheetDataFilledByMTDUserForCM.sheetIssuedDateAndTimeOfCM =
      generalDateFormat(
        requestSheetDataFilledByMTDUserForCM?.sheetIssuedDateAndTimeOfCM
      );

    requestSheetDataFilledByMTDUserForCM.cmBasicDataFilledByMTD_TL.targetDateOfCM =
      generalDateFormat(
        requestSheetDataFilledByMTDUserForCM?.cmBasicDataFilledByMTD_TL
          ?.targetDateOfCM
      );

    let requestSheetOfCM = new RequestSheetOfCM({
      requestSheetNoOfCM,
      ..._idObject,
      plantToMachineHierarchyRef: req?.plantToMachineHierarchyRef,
      requestSheetCreatedBy: req?.rootUser,
      shiftOfCM: requestSheetDataFilledByMTDUserForCM?.shiftOfBM,
      ...requestSheetDataFilledByMTDUserForCM,
      commonDataFilledByAssignUser,
    });

    await requestSheetOfCM.save();
    successResponse(res, "CM Request-sheet generated successfully");
  }
);

const commonKeyGenerationMiddleware = tryCatchHandler(
  async (req, res, next) => {
    let commonKey =
      "commonDataFilledByAssignUser.$[yearFilter].quarterlyDataOfTheCM.$[quarterFilter]";

    let allKeys = {
      approvalOfMTD_TL: `${commonKey}.approvalOfMTD_TL`,
      approvalOfMTD_HOSS: `${commonKey}.approvalOfMTD_HOSS`,
      approvalOfMTD_HOS: `${commonKey}.approvalOfMTD_HOS`,
      approvalOfPRD_TL: `${commonKey}.approvalOfPRD_TL`,
      requestSheetStatusOfCM: `${commonKey}.requestSheetStatusOfCM`,
    };
    req.commonKey = commonKey;
    req.allKeys = allKeys;
    return next();
  }
);

router.patch(
  "/sendApprovalForRequestSheetOfCM/:reqId",
  authenticate,
  uploadDataSheetsOfBD.fields([
    { name: "attachedFileByAssignedUser", maxCount: 10 },
  ]),
  commonKeyGenerationMiddleware,
  async (req, res, next) => {
    try {
      const allKeys = {
        ...req.allKeys,
        attachedFileByAssignedUser: `${req?.commonKey}.attachedFileByAssignedUser`,
        targetDateOfCM: `${req?.commonKey}.targetDateOfCM`,
        getDataForApprovalDashboard: `${req?.commonKey}.getDataForApprovalDashboard`,
        workDetails: `${req?.commonKey}.workDetails`,
        totalTimeBasedOnWork: `${req?.commonKey}.totalTimeBasedOnWork`,
        changedParts: `${req?.commonKey}.changedParts`,
        actionAndCounterMeasureStep: `${req?.commonKey}.actionAndCounterMeasureStep`,
        isPermissionOfMTDTL: `${req?.commonKey}.isPermissionOfMTDTL`,
        isPermissionOfPRDTL: `${req?.commonKey}.isPermissionOfPRDTL`,
      };

      let commonApprovalStatusObj = {
        approvalStatus: "Pending",
        approvalDateAndTime: "",
      };

      const requestSheetDataFilledByMTDUserForCM = JSON.parse(
        req.body.otherData
      );

      if (
        req.files?.attachedFileByAssignedUser?.[0]?.filename ||
        req.files?.attachedFileByAssignedUser
      ) {
        requestSheetDataFilledByMTDUserForCM["attachedFileByAssignedUser"] =
          req.files?.attachedFileByAssignedUser?.[0]?.filename;

        updateObj.$set = {
          [allKeys?.attachedFileByAssignedUser]:
            req.files?.attachedFileByAssignedUser?.[0]?.filename,
        };
      }

      if (
        requestSheetDataFilledByMTDUserForCM?.cmBasicDataFilledByMTD_TL
          ?.frequencyType === "One-time"
      ) {
        requestSheetDataFilledByMTDUserForCM.cmBasicDataFilledByMTD_TL.frequencyValue =
          "";
      }

      if (requestSheetDataFilledByMTDUserForCM?.sheetIssuedDateAndTimeOfCM) {
        requestSheetDataFilledByMTDUserForCM.sheetIssuedDateAndTimeOfCM =
          generalDateFormat(
            requestSheetDataFilledByMTDUserForCM?.sheetIssuedDateAndTimeOfCM
          );
      }

      if (
        requestSheetDataFilledByMTDUserForCM?.cmBasicDataFilledByMTD_TL
          ?.targetDateOfCM
      ) {
        requestSheetDataFilledByMTDUserForCM.cmBasicDataFilledByMTD_TL.targetDateOfCM =
          generalDateFormat(
            requestSheetDataFilledByMTDUserForCM?.cmBasicDataFilledByMTD_TL
              ?.targetDateOfCM
          );
      }

      let updateObj = {},
        otherArrayFilters = [];

      if (
        requestSheetDataFilledByMTDUserForCM
          ?.current_commonDataFilledByAssignUser?.targetDateOfCM
      ) {
        updateObj.$set = {
          ...updateObj.$set,
          [allKeys?.targetDateOfCM]: generalDateFormat(
            requestSheetDataFilledByMTDUserForCM
              ?.current_commonDataFilledByAssignUser?.targetDateOfCM
          ),
        };
      }

      const pullUser = (key, specificUserObj) => {
        const { AddNewOrUpdateExistingArrayField } = specificUserObj;
        if (AddNewOrUpdateExistingArrayField?.refIdFOrUpdateExitingField) {
          updateObj.$pull = {
            ...updateObj.$pull,
            [`${allKeys?.[`approvalOf${key}`]}`]: {
              _id: mongoose.Types.ObjectId(
                AddNewOrUpdateExistingArrayField?.refIdFOrUpdateExitingField
              ),
            },
          };
        }
      };

      const addOrUpdateApprovalUser = (key, specificUserObj) => {
        if (specificUserObj?.[`approvalOf${key}`]) {
          const { AddNewOrUpdateExistingArrayField } = specificUserObj;

          const userApprovalInfo = specificUserObj?.[`approvalOf${key}`];

          if (AddNewOrUpdateExistingArrayField?.status === "ADD_NEW") {
            updateObj.$push = {
              ...updateObj.$push,
              [allKeys?.[`approvalOf${key}`]]: {
                ...userApprovalInfo,
                ...commonApprovalStatusObj,
              },
            };
          } else {
            let defaultKey = `${allKeys?.[`approvalOf${key}`]}.$[${key
              .toLowerCase()
              ?.split("_")
              ?.join("")}userFilter]`;

            updateObj.$set = {
              ...updateObj.$set,
              [`${defaultKey}.userRef`]: userApprovalInfo?.userRef,
              [`${defaultKey}.tm_no`]: userApprovalInfo?.tm_no,
              [`${defaultKey}.user_type`]: userApprovalInfo?.user_type,
              [`${defaultKey}.tm_name`]: userApprovalInfo?.tm_name,
              [`${defaultKey}.email`]: userApprovalInfo?.email,
            };

            otherArrayFilters.push({
              [`${key.toLowerCase()?.split("_")?.join("")}userFilter._id`]:
                mongoose.Types.ObjectId(
                  AddNewOrUpdateExistingArrayField?.refIdFOrUpdateExitingField
                ),
            });
          }
        }
      };

      if (requestSheetDataFilledByMTDUserForCM?.approvalObj_MTD_TL) {
        addOrUpdateApprovalUser(
          "MTD_TL",
          requestSheetDataFilledByMTDUserForCM?.approvalObj_MTD_TL
        );

        updateObj.$set = {
          ...updateObj.$set,
          [allKeys?.getDataForApprovalDashboard]: {
            Id: requestSheetDataFilledByMTDUserForCM?.approvalObj_MTD_TL
              ?.approvalOfMTD_TL?.userRef,
            departmentAndGradeOfUser: "MTD TL/HOSS",
          },
        };
      }

      if (requestSheetDataFilledByMTDUserForCM?.approvalObj_MTD_HOSS) {
        addOrUpdateApprovalUser(
          "MTD_HOSS",
          requestSheetDataFilledByMTDUserForCM?.approvalObj_MTD_HOSS
        );
      }

      if (requestSheetDataFilledByMTDUserForCM?.approvalObj_MTD_HOS) {
        addOrUpdateApprovalUser(
          "MTD_HOS",
          requestSheetDataFilledByMTDUserForCM?.approvalObj_MTD_HOS
        );
      }

      // if (requestSheetDataFilledByMTDUserForCM?.isPermissionOfMTDTL) {
      // updateObj.$set = {
      //   ...updateObj.$set,
      //   [allKeys?.isPermissionOfMTDTL]:
      //     requestSheetDataFilledByMTDUserForCM?.isPermissionOfMTDTL,
      // };

      //   if (
      //     requestSheetDataFilledByMTDUserForCM?.isPermissionOfMTDTL === "Yes"
      //   ) {

      //   } else {
      //     updateObj.$set = {
      //       ...updateObj.$set,
      //       [allKeys?.getDataForApprovalDashboard]: {
      //         Id: requestSheetDataFilledByMTDUserForCM?.approvalObj_MTD_HOS
      //           ?.approvalOfMTD_HOS?.userRef,
      //         departmentAndGradeOfUser: "MTD HOS",
      //       },
      //     };

      //     pullUser(
      //       "MTD_TL",
      //       requestSheetDataFilledByMTDUserForCM?.approvalObj_MTD_TL
      //     );
      //   }
      // }

      if (requestSheetDataFilledByMTDUserForCM?.isPermissionOfPRDTL) {
        updateObj.$set = {
          ...updateObj.$set,
          [allKeys?.isPermissionOfPRDTL]:
            requestSheetDataFilledByMTDUserForCM?.isPermissionOfPRDTL,
        };

        if (
          requestSheetDataFilledByMTDUserForCM?.isPermissionOfPRDTL === "Yes"
        ) {
          addOrUpdateApprovalUser(
            "PRD_TL",
            requestSheetDataFilledByMTDUserForCM?.approvalObj_PRD_TL
          );
        } else {
          pullUser(
            "PRD_TL",
            requestSheetDataFilledByMTDUserForCM?.approvalObj_PRD_TL
          );
        }
      }

      if (
        requestSheetDataFilledByMTDUserForCM?.wantToSendForApproval === "Yes"
      ) {
        updateObj.$set = {
          ...updateObj.$set,
          [allKeys?.requestSheetStatusOfCM]: "Under MTD TL Approval",
        };
      }

      updateObj.$set = {
        ...requestSheetDataFilledByMTDUserForCM,
        ...updateObj.$set,
      };

      if (requestSheetDataFilledByMTDUserForCM?.workDetails) {
        let totalTimeBasedOnWork = 0;

        for (
          let i = 0;
          i < requestSheetDataFilledByMTDUserForCM?.workDetails?.length;
          i++
        ) {
          const element = requestSheetDataFilledByMTDUserForCM?.workDetails[i];

          totalTimeBasedOnWork +=
            moment(element?.toDate)?.diff(
              moment(element?.fromDate),
              "minutes"
            ) / 60;
        }

        updateObj.$set = {
          ...updateObj.$set,
          [allKeys?.workDetails]:
            requestSheetDataFilledByMTDUserForCM?.workDetails,
          [allKeys?.totalTimeBasedOnWork]: totalTimeBasedOnWork,
        };
      }
      if (requestSheetDataFilledByMTDUserForCM?.changedParts) {
        updateObj.$set = {
          ...updateObj.$set,
          [allKeys?.changedParts]:
            requestSheetDataFilledByMTDUserForCM?.changedParts,
        };
      }
      if (requestSheetDataFilledByMTDUserForCM?.actionAndCounterMeasureStep) {
        updateObj.$set = {
          ...updateObj.$set,
          [allKeys?.actionAndCounterMeasureStep]:
            requestSheetDataFilledByMTDUserForCM?.actionAndCounterMeasureStep,
        };
      }

      const requestSheetOfCM = await RequestSheetOfCM.findOneAndUpdate(
        {
          _id: mongoose.Types.ObjectId(req.params?.reqId),
        },
        updateObj,
        {
          arrayFilters: [
            // by default considered as current year and current quarter,
            // if needed then, have update filter with selected year and selected quarter
            {
              "yearFilter.preAggregationTimeStampOfRequestSheet.requestSheet_year":
                currentYear,
            },
            {
              "quarterFilter.requestSheet_quarter": getFinancialQuarter(
                requestSheetDataFilledByMTDUserForCM?.targetDateOfCM
              ),
            },
            ...otherArrayFilters,
          ],
          new: true,
        }
      );
      return res.status(201).json({
        message: `Request-sheet updated !!`,
        requestSheetOfCM,
      });
    } catch (error) {
      console.log(error);
    }
  }
);

const getRequestSheetData = tryCatchHandler(async (req, res, next) => {
  let otherPipelines = {
    addFields: {},
    project: {},
    aggregationPipeline: [
      {
        $match: {
          "current_commonDataFilledByAssignUser.targetDateOfCM": {
            $ne: undefined,
          },
        },
      },
    ],
  };

  let lastQuarterOrSelectedQuarter = {
    $arrayElemAt: [
      {
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
      -1,
    ],
  };

  if (req.query?.selectedQuarter) {
    let middlewareForGetQuarterWiseOrUptoCurrentDate = {
      $eq: [
        "$$quarterWiseData.requestSheet_quarter",
        //need to change this quarter when user select previous year filter

        req.query?.selectedQuarter !== "undefined" &&
        req.query?.selectedQuarter !== ""
          ? req.query?.selectedQuarter
          : req?.query?.selectedMonth !== "undefined" &&
            req?.query?.selectedMonth !== ""
          ? getFinancialQuarterByMonth(req?.query?.selectedMonth * 1)
          : getFinancialQuarter(new Date()),
      ],
    };

    lastQuarterOrSelectedQuarter = {
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
              ...middlewareForGetQuarterWiseOrUptoCurrentDate,
              // $eq: [
              //   "$$quarterWiseData.requestSheet_quarter",
              //   req.query?.selectedQuarter,
              // ],
            },
          },
        },
        0,
      ],
    };
  }

  const reqUrl = req.url?.split("/");
  const getUserApprovalObj = (key, permissionKey) => {
    let approvalUserDetails = {
      $last: `$current_commonDataFilledByAssignUser.${key}`,
    };

    if (permissionKey) {
      approvalUserDetails = {
        $cond: [
          {
            $eq: [
              `$current_commonDataFilledByAssignUser.${permissionKey}`,
              "Yes",
            ],
          },
          {
            $last: `$current_commonDataFilledByAssignUser.${key}`,
          },
          {},
        ],
      };
    }
    return {
      $cond: [
        {
          $gt: ["$current_commonDataFilledByAssignUser", null],
        },
        {
          $cond: [
            {
              $lte: [
                { $size: `$current_commonDataFilledByAssignUser.${key}` },
                0,
              ],
            },
            {
              AddNewOrUpdateExistingArrayField: {
                status: "ADD_NEW",
                refIdFOrUpdateExitingField: "",
              },
              [key]: {},
            },
            {
              $cond: [
                {
                  $or: [
                    {
                      $in: [
                        {
                          $getField: {
                            field: "approvalStatus",
                            input: {
                              $last: `$current_commonDataFilledByAssignUser.${key}`,
                            },
                          },
                        },
                        ["Rejected", "Accepted", ""],
                      ],
                    },
                    {
                      $eq: [
                        "$current_commonDataFilledByAssignUser.requestSheetStatusOfCM",
                        "Rejected",
                      ],
                    },
                  ],
                },
                {
                  AddNewOrUpdateExistingArrayField: {
                    status: "ADD_NEW",
                    refIdFOrUpdateExitingField: "",
                  },
                  [key]: approvalUserDetails,
                },
                {
                  AddNewOrUpdateExistingArrayField: {
                    status: "UPDATE_EXISTING",
                    refIdFOrUpdateExitingField: {
                      $getField: {
                        field: "_id",
                        input: {
                          $last: `$current_commonDataFilledByAssignUser.${key}`,
                        },
                      },
                    },
                  },
                  [key]: approvalUserDetails,
                },
              ],
            },
          ],
        },
        {
          AddNewOrUpdateExistingArrayField: {
            status: "ADD_NEW",
            refIdFOrUpdateExitingField: "",
          },
          [key]: {},
        },
      ],
    };
  };

  let isEditableRS = {
    $cond: [
      {
        $in: [
          "$current_commonDataFilledByAssignUser.requestSheetStatusOfCM",
          ["Generated", "Fill Sheet", "Rejected"],
        ],
      },
      {
        $ne: [
          {
            $filter: {
              input: "$current_commonDataFilledByAssignUser.assignUserForCM",
              as: "item",
              cond: { $eq: ["$$item.userRef", req.rootUser?._id] },
            },
          },
          [],
        ],
      },
      {
        $eq: [
          "$current_commonDataFilledByAssignUser.getDataForApprovalDashboard.Id",
          req.rootUser?._id,
        ],
      },
    ],
  };

  if (reqUrl?.includes("getReqSheetDataByID")) {
    const categoryCheck = (category, field) => ({
      $cond: [
        {
          $eq: ["$cmBasicDataFilledByMTD_TL.categories", category],
        },
        field,
        "",
      ],
    });

    otherPipelines = {
      addFields: {
        upto_currentYear_current_commonDataFilledByAssignUser: {
          $filter: {
            input: {
              $map: {
                input: "$commonDataFilledByAssignUser",
                as: "yearObj",
                in: {
                  preAggregationTimeStampOfRequestSheet: {
                    requestSheet_year:
                      "$$yearObj.preAggregationTimeStampOfRequestSheet.requestSheet_year",
                    requestSheet_month:
                      "$$yearObj.preAggregationTimeStampOfRequestSheet.requestSheet_month",
                  },
                  quarterlyDataOfTheCM: {
                    $filter: {
                      input: "$$yearObj.quarterlyDataOfTheCM",
                      as: "quarterObj",
                      cond: {
                        $lte: [
                          {
                            $dateFromString: {
                              dateString: "$$quarterObj.targetDateOfCM",
                              timezone,
                            },
                          },
                          new Date(),
                        ],
                      },
                    },
                  },
                },
              },
            },
            as: "yearlyData",
            cond: {
              $ne: ["$$yearlyData.quarterlyDataOfTheCM", []],
            },
          },
        },
      },
      project: {
        // requestSheetOfBMRef: 1,
        maintenanceType: 1,
        priorityCode: 1,
        sheetIssuedDateAndTimeOfCM: 1,
        shiftOfCM: 1,
        qualityRelated: 1,
        requestSheetCreatedBy: 1,
        isEditableRS,

        "current_commonDataFilledByAssignUser.requestSheet_quarter": 1,
        "current_commonDataFilledByAssignUser.statusOfPlannedCM": 1,
        "current_commonDataFilledByAssignUser.assignUserForCM": 1,
        "current_commonDataFilledByAssignUser.rejectedRemarksOfRequestSheet": 1,
        "current_commonDataFilledByAssignUser._id": 1,
        "current_commonDataFilledByAssignUser.getDataForApprovalDashboard": 1,
        isPermissionOfPRDTL:
          "$current_commonDataFilledByAssignUser.isPermissionOfPRDTL",

        changedParts: "$current_commonDataFilledByAssignUser.changedParts",
        workDetails: "$current_commonDataFilledByAssignUser.workDetails",
        actionAndCounterMeasureStep:
          "$current_commonDataFilledByAssignUser.actionAndCounterMeasureStep",

        "cmBasicDataFilledByMTD_TL.problemBackgroundOfCM": 1,
        "cmBasicDataFilledByMTD_TL.frequencyType": 1,
        "cmBasicDataFilledByMTD_TL.frequencyValue": 1,
        "cmBasicDataFilledByMTD_TL.plannedDateAndTimeOfCM": 1,
        "cmBasicDataFilledByMTD_TL.other_categories": categoryCheck(
          "Others",
          "$cmBasicDataFilledByMTD_TL.other_categories"
        ),
        "cmBasicDataFilledByMTD_TL.inspectionItem": categoryCheck(
          "LTPM",
          "$cmBasicDataFilledByMTD_TL.inspectionItem"
        ),
        "cmBasicDataFilledByMTD_TL.actionForLTPM": categoryCheck(
          "LTPM",
          "$cmBasicDataFilledByMTD_TL.actionForLTPM"
        ),
        "cmBasicDataFilledByMTD_TL.personForLTPM": categoryCheck(
          "LTPM",
          "$cmBasicDataFilledByMTD_TL.personForLTPM"
        ),
        "cmBasicDataFilledByMTD_TL.partSuggestionByMTDTL": 1,
        "cmBasicDataFilledByMTD_TL.attachedFilesByMTDUser": 1,

        "upto_currentYear_current_commonDataFilledByAssignUser.preAggregationTimeStampOfRequestSheet": 1,
        "upto_currentYear_current_commonDataFilledByAssignUser.quarterlyDataOfTheCM.requestSheet_quarter": 1,
        "upto_currentYear_current_commonDataFilledByAssignUser.quarterlyDataOfTheCM.targetDateOfCM": 1,
        "upto_currentYear_current_commonDataFilledByAssignUser.quarterlyDataOfTheCM.changedParts": 1,
        "upto_currentYear_current_commonDataFilledByAssignUser.quarterlyDataOfTheCM.workDetails": 1,
        "upto_currentYear_current_commonDataFilledByAssignUser.quarterlyDataOfTheCM.totalTimeBasedOnWork": 1,
        "upto_currentYear_current_commonDataFilledByAssignUser.quarterlyDataOfTheCM.actionAndCounterMeasureStep": 1,

        approvalObj_MTD_TL: getUserApprovalObj("approvalOfMTD_TL"),
        approvalObj_MTD_HOSS: getUserApprovalObj("approvalOfMTD_HOSS"),
        approvalObj_MTD_HOS: getUserApprovalObj("approvalOfMTD_HOS"),
        approvalObj_PRD_TL: getUserApprovalObj(
          "approvalOfPRD_TL",
          "isPermissionOfPRDTL"
        ),
      },
      aggregationPipeline: [],
    };
  } else if (reqUrl?.includes("getAllCmReqSheet")) {
    otherPipelines.project = {
      "current_commonDataFilledByAssignUser.assignUserForCM": 1,
      assignUserForCM: {
        $cond: [
          {
            $eq: [
              "$current_commonDataFilledByAssignUser.statusOfPlannedCM",
              "Planned",
            ],
          },
          "$current_commonDataFilledByAssignUser.assignUserForCM",
          "",
        ],
      },
      isEditableRS,
    };
  } else if (reqUrl?.includes("getApprovalLogsForCM")) {
    otherPipelines.project = {
      "current_commonDataFilledByAssignUser.assignUserForCM": 1,
      "current_commonDataFilledByAssignUser.approvalOfMTD_TL": 1,
      "current_commonDataFilledByAssignUser.approvalOfMTD_HOSS": 1,
      "current_commonDataFilledByAssignUser.approvalOfMTD_HOS": 1,
      "current_commonDataFilledByAssignUser.approvalOfPRD_TL": 1,
    };
  }
  // console.log(
  //   "req.query?.selectedQuarter",
  //   req.query?.selectedQuarter,
  //   req?.query?.selectedYear,
  //   req?.query?.selectedMonth,
  //   getFinancialQuarterByMonth(req?.query?.selectedMonth),
  //   getFinancialQuarter(new Date())
  // );

  // let middlewareForGetQuarterWiseOrUptoCurrentDate = {};

  // if (
  //   req?.query?.selectedQuarter &&
  //   req?.query?.selectedQuarter !== "undefined"
  //   // || req?.query?.selectedMonth
  // ) {
  //   middlewareForGetQuarterWiseOrUptoCurrentDate = {
  //     $eq: [
  //       "$$quarterWiseData.requestSheet_quarter",
  //       //need to change this quarter when user select previous year filter

  //       req.query?.selectedQuarter !== "undefined" &&
  //       req.query?.selectedQuarter !== ""
  //         ? req.query?.selectedQuarter
  //         : req?.query?.selectedMonth !== "undefined" &&
  //           req?.query?.selectedMonth !== ""
  //         ? getFinancialQuarterByMonth(req?.query?.selectedMonth * 1)
  //         : getFinancialQuarter(new Date()),
  //     ],
  //   };
  // } else {
  //   middlewareForGetQuarterWiseOrUptoCurrentDate = {
  //     $lte: [
  //       {
  //         $dateFromString: {
  //           dateString: "$$quarterWiseData.plannedDateAndTimeOfCM",
  //           timezone,
  //         },
  //       },
  //       new Date(),
  //     ],
  //   };
  // }

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
      $addFields: {
        // current_commonDataFilledByAssignUser: {
        //   $arrayElemAt: [
        //     {
        //       $filter: {
        //         input: {
        //           $getField: {
        //             field: "quarterlyDataOfTheCM",
        //             input: {
        //               $arrayElemAt: [
        //                 {
        //                   $filter: {
        //                     input: "$commonDataFilledByAssignUser",
        //                     as: "yearWiseData",
        //                     cond: {
        //                       $eq: [
        //                         "$$yearWiseData.preAggregationTimeStampOfRequestSheet.requestSheet_year",
        //                         req?.query?.selectedYear,
        //                       ],
        //                     },
        //                   },
        //                 },
        //                 0,
        //               ],
        //             },
        //           },
        //         },
        //         as: "quarterWiseData",
        //         cond: {
        //           ...middlewareForGetQuarterWiseOrUptoCurrentDate,
        //         },
        //       },
        //     },
        //     0,
        //   ],
        // },
        current_commonDataFilledByAssignUser: lastQuarterOrSelectedQuarter,
        ...otherPipelines?.addFields,
      },
    },
    {
      $project: {
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
            date: {
              $dateFromString: {
                dateString:
                  "$current_commonDataFilledByAssignUser.targetDateOfCM",
              },
            },
            timezone: timezone,
          },
        },
        requestSheetNoOfCM: 1,
        "cmBasicDataFilledByMTD_TL.categories": 1,
        "cmBasicDataFilledByMTD_TL.activityOfCM": 1,
        "cmBasicDataFilledByMTD_TL.plannedDateAndTimeOfCM": 1,
        "current_commonDataFilledByAssignUser.requestSheetStatusOfCM": 1,
        "current_commonDataFilledByAssignUser.targetDateOfCM": 1,

        ...otherPipelines?.project,
      },
    },
    ...otherPipelines?.aggregationPipeline,
  ]);

  if (requestSheetData?.length === 0) {
    return res.status(400).json({
      message: "No data to display",
      reqSheetCM: requestSheetData,
    });
  }

  req.requestSheetData = requestSheetData;
  next();
});

router.get(
  "/getMachineRequestSheetDetailsForApprovalForCM/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  tryCatchHandler(async (req, res, next) => {
    req.queryObj.commonDataFilledByAssignUser = {
      $elemMatch: {
        ...req.queryObj?.commonDataFilledByAssignUser?.$elemMatch,
        "quarterlyDataOfTheCM.getDataForApprovalDashboard.Id":
          mongoose.Types.ObjectId(req.rootUser?._id),
      },
    };

    return next();
  }),
  getRequestSheetData,
  async (req, res, next) => {
    try {
      res.status(201).json({
        message: "Request-sheet data get successfully",
        requestSheetData: req.requestSheetData,
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
            userRef: mongoose.Types.ObjectId(req.rootUser?._id),
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
    ]);

    successResponse(res, "Request-sheet fetched successfully", {
      reqSheetCM: req.requestSheetData,
      counters: counters?.[0],
    });
  })
);

// For Calendar Modal
router.get(
  "/getReqSheetDataByID/:selectedId",
  authenticate,
  tryCatchHandler(async (req, res, next) => {
    req.queryObj = {
      _id: mongoose.Types.ObjectId(req.params?.selectedId),
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

    const {
      approvalOfRequestSheet,
      rejectedRemarksOfRequestSheet,
      current_commonDataFilledByAssignUser,

      approvalOfMTD_HOSS,
      approvalOfMTD_HOS,
      isPermissionOfPRDTL,
      approvalOfPRD_TL,
    } = req.body;

    let department;
    // if (
    //   req?.rootUser?.user_type === "TL/HOSS" &&
    //   req?.rootUser?.tm_department === "MTD"
    // ) {
    //   department = "MTD_TL";
    // } else if (req?.rootUser?.user_type === "Section-Admin") {
    //   department = "MTD_HOS";
    // } else if (
    //   req?.rootUser?.tm_department === "PRD" &&
    //   req?.rootUser?.user_type === "TL/HOSS"
    // ) {
    //   department = "PRD_TL";
    // }

    switch (current_commonDataFilledByAssignUser?.requestSheetStatusOfCM) {
      case "Under MTD TL Approval":
        department = "MTD_TL";
        break;

      case "Under MTD HOSS Approval":
        department = "MTD_HOSS";
        break;

      case "Under MTD HOS Approval":
        department = "MTD_HOS";
        break;

      case "Under PRD TL Approval":
        department = "PRD_TL";
        break;
    }

    // if (
    //   current_commonDataFilledByAssignUser?.requestSheetStatusOfCM ===
    //   "Under MTD TL Approval"
    // ) {
    //   department = "MTD_TL";
    // } else if (req?.rootUser?.user_type === "Section-Admin") {
    //   department = "MTD_HOS";
    // } else if (
    //   req?.rootUser?.tm_department === "PRD" &&
    //   req?.rootUser?.user_type === "TL/HOSS"
    // ) {
    //   department = "PRD_TL";
    // }

    if (!department) {
      return res
        .status(400)
        .json({ message: "Unauthorized department user!!!" });
    }

    let ObjForUserFilter = req.body?.[`approvalOf${department}`];

    if (!ObjForUserFilter) {
      return res.status(404).json({ message: "User not assigned" });
    }

    if (ObjForUserFilter?.approvalStatus !== "Pending") {
      return res.status(400).json({
        message: `${ObjForUserFilter?.tm_no} : ${ObjForUserFilter?.tm_name}'s status is not pending`,
      });
    }

    if (ObjForUserFilter?.userRef !== req?.rootUser?._id?.toString()) {
      return res
        .status(404)
        .json({ message: "Unauthorized user for approval" });
    }

    const allKeys = {
      ...req.allKeys,
      getDataForApprovalDashboard: `${req?.commonKey}.getDataForApprovalDashboard`,
      approvalObj: `${req?.allKeys?.[`approvalOf${department}`]}.$[userFilter]`,
    };

    let updateObj = {
      $set: {
        [`${allKeys?.approvalObj}.approvalDateAndTime`]: new Date(),
      },
    };

    let NULL_Obj_getDataForApprovalDashboard = {
      Id: null,
      departmentAndGradeOfUser: null,
    };

    if (approvalOfRequestSheet === "No") {
      updateObj.$set = {
        ...updateObj?.$set,
        [`${allKeys?.approvalObj}.approvalStatus`]: "Rejected",
        [`${allKeys?.approvalObj}.rejectedRemarks`]:
          rejectedRemarksOfRequestSheet,
        [allKeys?.requestSheetStatusOfCM]: "Rejected",
        [allKeys?.getDataForApprovalDashboard]:
          NULL_Obj_getDataForApprovalDashboard,
      };
    } else if (approvalOfRequestSheet === "Yes") {
      let nextApprovalObj = {
        requestSheetStatusOfCM: "",
        getDataForApprovalDashboard: NULL_Obj_getDataForApprovalDashboard,
      };

      const completeApproval = () => {
        nextApprovalObj.requestSheetStatusOfCM = "Completed";

        if (
          isRequestSheetExist?.cmBasicDataFilledByMTD_TL?.frequencyValue ===
          "1/3 M"
        ) {
          let lastEntry =
            isRequestSheetExist?.commonDataFilledByAssignUser?.[
              isRequestSheetExist?.commonDataFilledByAssignUser?.length - 1
            ];

          let lastTragetDate =
            lastEntry?.quarterlyDataOfTheCM?.[
              lastEntry?.quarterlyDataOfTheCM?.length - 1
            ]?.targetDateOfCM;

          let newTargetDate = moment(lastTragetDate).add(3, "months");
          let quarterlyDataEntries = [
            {
              requestSheet_quarter: getFinancialQuarter(newTargetDate),
              statusOfPlannedCM: "Planned",
              targetDateOfCM: newTargetDate,
              requestSheetStatusOfCM: "Generated",
            },
          ];
          updateObj.$push = {
            commonDataFilledByAssignUser: {
              preAggregationTimeStampOfRequestSheet: {
                requestSheet_year: currentYear,
                requestSheet_month: gettingMonthForSelectedDate(newTargetDate),
              },
              quarterlyDataOfTheCM: { $each: quarterlyDataEntries },
            },
          };
        }
      };

      switch (current_commonDataFilledByAssignUser?.requestSheetStatusOfCM) {
        case "Under MTD TL Approval":
          nextApprovalObj.requestSheetStatusOfCM = "Under MTD HOSS Approval";
          nextApprovalObj.getDataForApprovalDashboard = {
            Id: approvalOfMTD_HOSS?.userRef,
            departmentAndGradeOfUser: approvalOfMTD_HOSS?.user_type,
          };

          break;

        case "Under MTD HOSS Approval":
          nextApprovalObj.requestSheetStatusOfCM = "Under MTD HOS Approval";
          nextApprovalObj.getDataForApprovalDashboard = {
            Id: approvalOfMTD_HOS?.userRef,
            departmentAndGradeOfUser: approvalOfMTD_HOS?.user_type,
          };
          break;

        case "Under MTD HOS Approval":
          if (isPermissionOfPRDTL === "Yes") {
            nextApprovalObj.requestSheetStatusOfCM = "Under PRD TL Approval";
            nextApprovalObj.getDataForApprovalDashboard = {
              Id: approvalOfPRD_TL?.userRef,
              departmentAndGradeOfUser: approvalOfPRD_TL?.user_type,
            };
          } else completeApproval();

          break;

        case "Under PRD TL Approval":
          completeApproval();
          break;
      }

      updateObj.$set = {
        ...updateObj?.$set,
        [`${allKeys?.approvalObj}.approvalStatus`]: "Accepted",
        [allKeys?.requestSheetStatusOfCM]:
          nextApprovalObj?.requestSheetStatusOfCM,
        [allKeys?.getDataForApprovalDashboard]:
          nextApprovalObj?.getDataForApprovalDashboard,
      };

      // if (department === "MTD_TL") {
      //   let { approvalOfMTD_HOS } = req.body;

      //   updateObj.$set = {
      //     ...updateObj?.$set,
      //     [allKeys?.requestSheetStatusOfCM]: "Under MTD HOS Approval",
      //     [allKeys?.getDataForApprovalDashboard]: {
      //       Id: approvalOfMTD_HOS?.userRef,
      //       departmentAndGradeOfUser: approvalOfMTD_HOS?.user_type,
      //     },
      //   };
      // } else if (department === "MTD_HOS") {
      //   let { approvalOfPRD_TL } = req.body;

      //   if (
      //     approvalOfPRD_TL?.userRef &&
      //     approvalOfPRD_TL?.approvalStatus === "Pending"
      //   ) {
      //     updateObj.$set = {
      //       ...updateObj?.$set,
      //       [allKeys?.requestSheetStatusOfCM]: "Under PRD TL Approval",
      //       [allKeys?.getDataForApprovalDashboard]: {
      //         Id: approvalOfPRD_TL?.userRef,
      //         departmentAndGradeOfUser: approvalOfPRD_TL?.user_type,
      //       },
      //     };
      //   } else completeApproval();
      // } else if (department === "PRD_TL") completeApproval();

      // function completeApproval() {
      //   updateObj.$set = {
      //     ...updateObj?.$set,
      //     [allKeys?.requestSheetStatusOfCM]: "Completed",
      //     [allKeys?.getDataForApprovalDashboard]:
      //       NULL_Obj_getDataForApprovalDashboard,
      //   };
      // }
    }
    const requestSheetOfCM = await RequestSheetOfCM.findOneAndUpdate(
      {
        _id: mongoose.Types.ObjectId(requestSheetID),
      },
      updateObj,
      {
        arrayFilters: [
          {
            "yearFilter.preAggregationTimeStampOfRequestSheet.requestSheet_year":
              currentYear,
          },
          { "quarterFilter.requestSheet_quarter": getFinancialQuarter() },
          { "userFilter._id": mongoose.Types.ObjectId(ObjForUserFilter?._id) },
        ],
        new: true,
      }
    );

    successResponse(res, "Request-sheet approved successfully", {
      requestSheetOfCM,
    });
  })
);

router.get(
  "/getApprovalLogsForCM/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  getRequestSheetData,
  async (req, res, next) => {
    try {
      successResponse(res, "Request-sheet fetched successfully", {
        approvalDataLogs: req.requestSheetData,
      });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ message: error?.message, error: new Error(error) });
    }
  }
);

router.get(
  `/getReqSheetDataForCalendar/:filter/:selectedId`,
  authenticate,
  filterMiddleware,
  async (req, res) => {
    try {
      delete req.queryObj["commonDataFilledByAssignUser"];

      let yearConvert =
        req?.query?.selectedMonth * 1 < 3
          ? `${req?.query?.selectedYear * 1 - 1}-${req?.query?.selectedYear}`
          : `${req?.query?.selectedYear}-${req?.query?.selectedYear * 1 + 1}`;

      let commonProjection = {
        $getField: {
          field: "targetDateOfCM",
          input: {
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
                                  yearConvert,
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
                      getFinancialQuarterByMonth(req?.query?.selectedMonth * 1),
                    ],
                  },
                },
              },
              0,
            ],
          },
        },
      };

      const reqSheetDataForCalendar = await RequestSheetOfCM.aggregate([
        {
          $match: req?.queryObj,
        },
        {
          $project: {
            id: "$_id",
            title: "$cmBasicDataFilledByMTD_TL.activityOfCM",
            start: commonProjection,
            end: commonProjection,
          },
        },
        {
          $match: {
            $or: [{ start: { $ne: undefined } }, { end: { $ne: undefined } }],
          },
        },
      ]);
      res.status(200).json({
        message: "Request sheet data for calendar fetched successfully",
        reqSheetDataForCalendar,
      });
    } catch (error) {
      console.log(error);
    }
  }
);

// const middlewareForSectionAndSubSectionLookup = async (req, res, next) => {
//   try {
//     let queryObjPipeline = [];
//     const section = await Section.findOne({
//       section_id: req?.rootUser?.section_data?.split("-")?.[0],
//     });

//     if (section.dashboardLevel === "Yes") {
//       queryObjPipeline = [
//         {
//           $lookup: {
//             from: "sections",
//             localField: "_id.sectionRef",
//             foreignField: "_id",
//             as: "section_data",
//             pipeline: [
//               {
//                 $project: { section_name: "$section_name" },
//               },
//             ],
//           },
//         },
//         {
//           $unwind: "$section_data",
//         },
//       ];
//     } else {
//       queryObjPipeline = [
//         {
//           $lookup: {
//             from: "subsections",
//             localField: "_id.subSectionRef",
//             foreignField: "_id",
//             as: "section_data",
//             pipeline: [
//               {
//                 $project: { section_name: "$subSection_name" },
//               },
//             ],
//           },
//         },
//         {
//           $unwind: "$section_data",
//         },
//       ];
//     }

//     req.queryObjPipeline = queryObjPipeline;
//     next();
//   } catch (error) {
//     logger.error(error, { maintenanceType: maintenanceType?.[1] });
//     res.status(500).json({ message: error?.message, error });
//   }
// };

router.get(
  "/LTPM/getDatOfLTPM/:filter/:selectedId",
  authenticate,
  // filterMiddleware,
  // middlewareForSectionAndSubSectionLookup,
  tryCatchHandler(async (req, res, next) => {
    const paginationCount = req?.query?.paginationCount * 1;
    let startYearOfLTPM = moment()
      .subtract(paginationCount, "years")
      .tz(timezone)
      .year();

    const currentDate = moment().tz(timezone);

    if (startYearOfLTPM === currentDate.year()) {
      if ([0, 1, 2]?.includes(currentDate.month())) {
        startYearOfLTPM -= 1;
      }
    }

    const yearList = Array.from({ length: 5 }, (_, i) => startYearOfLTPM + i);
    const QUARTER = ["Q1", "Q2", "Q3", "Q4"];

    // delete req.queryObj.commonDataFilledByAssignUser;

    // req.queryObj = {
    //   ...req?.queryObj,
    // commonDataFilledByAssignUser: {
    //   $elemMatch: {
    //     "preAggregationTimeStampOfRequestSheet.requestSheet_year": `${startYearOfLTPM}-${
    //       startYearOfLTPM + 1
    //     }`,
    //   },
    // },
    // };

    const { selectedId } = req.params;

    const quarterList = Array(5).fill(QUARTER).flat();
    const data = await RequestSheetOfCM.aggregate([
      {
        $match: {
          "cmBasicDataFilledByMTD_TL.categories": "LTPM",
          "cmBasicDataFilledByMTD_TL.frequencyType": "Scheduled",
          lineRef: mongoose.Types.ObjectId(selectedId),
          // ...req?.queryObj,
        },
      },
      {
        $group: {
          _id: {
            plantToMachineHierarchyRef: "$plantToMachineHierarchyRef",
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
        },
      },
      {
        $lookup: {
          from: "planttomachinehierarchies",
          localField: "_id.plantToMachineHierarchyRef",
          foreignField: "_id",
          as: "machines",
        },
      },
      {
        $sort: {
          "_id._id": -1,
        },
      },
      {
        $project: {
          data: 1,
          machineAllData: { $arrayElemAt: ["$machines", 0] },
        },
      },
    ]);

    const { _id, LTPMApproval } = await Line.findOne(
      {
        _id: selectedId,
      },
      {
        LTPMApproval: 1,
      }
    );

    if (
      req?.rootUser?.user_type === "TL/HOSS" &&
      !LTPMApproval?.preparationApproval?.preparedByMTD_TL?.tm_name
    ) {
      LTPMApproval.preparationApproval.preparedByMTD_TL = req?.rootUser;
    }

    successResponse(res, "LTPM Line wise data get successfully", {
      paginationCount,
      data,
      quarterList,
      yearList,
      lineId: _id,
      LTPMApproval,
    });
  })
);

router.patch(
  "/sendPreparationApproval/:lineId",
  authenticate,
  tryCatchHandler(async (req, res, next) => {
    const { checkByMTD_TL, preparationApprovalAndPlanPreparationMTD_HOS } =
      req.body;

    const { LTPMApproval } = await Line.findOneAndUpdate(
      { _id: req.params?.lineId },
      {
        "LTPMApproval.preparationApproval": {
          status: "Check for MTD TL",
          preparedByMTD_TL: req?.rootUser,
          checkByMTD_TL,
        },
        "LTPMApproval.preparationApprovalAndPlanPreparationMTD_HOS":
          preparationApprovalAndPlanPreparationMTD_HOS,
      },
      { new: true }
    );

    successResponse(res, "Preparation approval send successfully", {
      LTPMApproval,
    });
  })
);

router.patch(
  "/sendPlanningApproval/:lineId",
  authenticate,
  tryCatchHandler(async (req, res, next) => {
    const { planAcceptedByPRD_HOS } = req.body;

    const { LTPMApproval } = await Line.findOneAndUpdate(
      { _id: req.params?.lineId },
      {
        "LTPMApproval.planningApproval.status": "Under approval of PRD HOS",
        "LTPMApproval.planningApproval.planAcceptedByPRD_HOS":
          planAcceptedByPRD_HOS,
      },
      { new: true }
    );

    successResponse(res, "Planning approval send successfully", {
      LTPMApproval,
    });
  })
);

router.patch(
  "/acceptApproval/:phase/:lineId",
  authenticate,
  tryCatchHandler(async (req, res, next) => {
    const { status } = req.body;

    let updateObj = {};
    let resMsg = `${req?.params?.phase} approval completed successfully`;

    if (req?.params?.phase === "Preparation") {
      updateObj = {
        "LTPMApproval.preparationApproval.status": "Under approval of MTD HOS",
      };

      if (status === "Under approval of MTD HOS") {
        updateObj = {
          "LTPMApproval.preparationApproval.status": "Completed",
          "LTPMApproval.planningApproval.status": status,
        };
      } else {
        resMsg = `${req?.params?.phase} approval accepted successfully`;
      }
    } else {
      updateObj = {
        "LTPMApproval.planningApproval.status": "Completed",
      };
    }

    const { LTPMApproval } = await Line.findOneAndUpdate(
      { _id: req.params?.lineId },
      updateObj,
      { new: true }
    );

    successResponse(res, resMsg, {
      LTPMApproval,
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
