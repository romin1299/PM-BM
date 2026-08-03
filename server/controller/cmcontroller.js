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
const SafetyForm = require("../model/safetyFormSchema");

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

const {
  newRequestSheetDataStore,
} = require("../middleware/findMachineDataForNewRequestSheetOfCM");
const { format } = require("path");
const {
  ALL_MONTHS,
  MONTH_LABELS,
} = require("../GlobalData/RequestSheetApprovalStatus");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const SubSection = require("../model/subSectionSchema");
const Jobs = require("../model/jobsForNewMachineCM");
const NewMachineCM = require("../model/newMachineCM");
// const {
//   CM_PLANNED_STATUS,
// } = require("../GlobalData/RequestSheetApprovalStatus");
// const { start } = require("repl");

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
    if (
      file.fieldname === "attachedFilesByAssignedUser" ||
      file.fieldname === "attachedFilesByMTDUser"
    ) {
      cb(null, "./AttachedFilesByAssignedUser/");
    }
    if (file.fieldname === "attachedFilesByOperatorUser") {
      cb(null, "./AttachedFilesByOperatorUser/");
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
        },
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
  },
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
  }),
);

router.get(
  "/getSupportingTMDetailsForRequestSheetOfCM",
  authenticate,
  findTLandOperatorList,
  tryCatchHandler(async (req, res, next) => {
    successResponse(res, "User data get successfully", {
      TLHOSS_and_TM_user_list: req?.TLHOSS_and_TM_user_list,
    });
  }),
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

    const { departmentFilterForTL, departmentFilterForHOS, gradeFilter } =
      req.query;

    let userFilter = {
      tm_department: "MTD",
      tm_grade: "HOS",
    };

    if (departmentFilterForHOS) {
      userFilter.tm_department = departmentFilterForHOS;
    }

    if (gradeFilter) {
      userFilter.tm_grade = gradeFilter;
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
    if (!departmentFilterForTL && !gradeFilter && !departmentFilterForHOS)
      userFilter = {};

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
      MTDHODList: [],
      PRDHOSList: [],
      MTDTLList: [],
      PRDTLList: [],
      PEDHODList: [],
      PEDHOSList: [],
      PEDTLList: [],
    };

    for (let i = 0; i < users.length; i++) {
      const { _id, groupUsers } = users[i];
      const { tm_department, tm_grade, user_type } = _id;

      if (tm_department === "MTD" && tm_grade === "HOS") {
        userList.MTDHOSList = groupUsers;
      } else if (tm_department === "MTD" && tm_grade === "HOD") {
        userList.MTDHODList = groupUsers;
      } else if (tm_department === "MTD" && user_type === "TL/HOSS") {
        userList.MTDTLList = groupUsers;
      } else if (tm_department === "PRD" && tm_grade === "HOS") {
        userList.PRDHOSList = groupUsers;
      } else if (tm_department == "PRD" && user_type === "TL/HOSS") {
        userList.PRDTLList = groupUsers;
      } else if (tm_department === "PED" && tm_grade === "HOS") {
        userList.PEDHOSList = groupUsers;
      } else if (tm_department === "PED" && tm_grade === "HOD") {
        userList.PEDHODList = groupUsers;
      } else if (tm_department === "PED" && user_type === "TL/HOSS") {
        userList.PEDTLList = groupUsers;
      }
    }

    successResponse(res, "User data get successfully", {
      userList,
    });
  }),
);

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
  },
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
    newRequestSheetDataStore(
      req?.machine,
      null,
      null,
      requestSheetDataFilledByMTDUserForCM,
      req?.plantToMachineHierarchyRef,
      req?.rootUser,
      [],
    );
    successResponse(res, "CM Request-sheet generated successfully");
  },
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
  },
);

/**
 * ENDPOINT: PATCH /sendApprovalForRequestSheetOfCM/:reqId
 *
 * PURPOSE: Complex update handler for CM request sheet submissions and approvals
 *
 * ROLE: Handles the workflow when:
 * 1. Operators submit completed maintenance work data
 * 2. TL/HOSS/HOS approvers accept/reject request sheets
 * 3. Users update request sheets with work details, changed parts, approvals
 *
 * WORKFLOW STAGES:
 * Stage 1: User fills maintenance work details (as assigned user)
 *          → Updates workDetails, changedParts, attachedFilesByOperatorUser
 *
 * Stage 2: TL/HOSS reviews and sends for approval (MTD TL approval)
 *          → Sets requestSheetStatusOfCM = "Under MTD TL Approval"
 *          → Adds MTD_TL approval object with "Pending" status
 *
 * Stage 3: Approvers accept/reject (MTD_TL, MTD_HOSS, MTD_HOS, PRD_TL)
 *          → Updates approval status (Pending → Accepted/Rejected)
 *          → Can update approver user details
 *
 * Stage 4: Final completion (wantToSendForApproval = "No")
 *          → Sets requestSheetStatusOfCM = "Completed" or "Ongoing"
 *          → Or keeps as "Rejected" for corrections
 *
 * MIDDLEWARE CHAIN:
 * 1. authenticate: Verify user is logged in
 * 2. uploadDataSheetsOfBD.fields: Handle file uploads (2 file types, 10 files each)
 * 3. commonKeyGenerationMiddleware: Build MongoDB nested field paths
 *
 * KEY FEATURE: Uses MongoDB array filters to update nested arrays deep within
 * commonDataFilledByAssignUser.yearFilter.quarterlyDataOfTheCM.$[quarterFilter]
 * structure without knowing exact array indices
 */
router.patch(
  "/sendApprovalForRequestSheetOfCM/:reqId",
  authenticate,
  uploadDataSheetsOfBD.fields([
    { name: "attachedFilesByAssignedUser", maxCount: 10 },
    { name: "attachedFilesByOperatorUser", maxCount: 10 },
  ]),
  commonKeyGenerationMiddleware,
  async (req, res, next) => {
    try {
      /**
       * NESTED FIELD PATH MAPPING
       *
       * Purpose: Build MongoDB dot-notation paths for updating deeply nested fields
       *
       * Structure: commonDataFilledByAssignUser.$[yearFilter].quarterlyDataOfTheCM.$[quarterFilter].*
       *
       * Example Path:
       * commonDataFilledByAssignUser.$[yearFilter].quarterlyDataOfTheCM.$[quarterFilter].workDetails
       * → Updates workDetails in specific quarter of specific year
       *
       * arrayFilters (passed to findOneAndUpdate):
       * - [0]: yearFilter matches requestSheet_year (current year)
       * - [1]: quarterFilter matches requestSheet_quarter (relevant quarter)
       *
       * This allows updating ANY year/quarter without knowing exact array index
       */
      const allKeys = {
        ...req.allKeys,
        attachedFilesByAssignedUser: `${req?.commonKey}.attachedFilesByAssignedUser`,
        assignUserForCM: `${req?.commonKey}.assignUserForCM`,
        targetDateOfCM: `${req?.commonKey}.targetDateOfCM`,
        getDataForApprovalDashboard: `${req?.commonKey}.getDataForApprovalDashboard`,
        workDetails: `${req?.commonKey}.workDetails`,
        totalTimeBasedOnWork: `${req?.commonKey}.totalTimeBasedOnWork`,
        changedParts: `${req?.commonKey}.changedParts`,
        actionAndCounterMeasureStep: `${req?.commonKey}.actionAndCounterMeasureStep`,
        isPermissionOfMTDTL: `${req?.commonKey}.isPermissionOfMTDTL`,
        isPermissionOfPRDTL: `${req?.commonKey}.isPermissionOfPRDTL`,
        attachedFilesByOperatorUser: `${req?.commonKey}.attachedFilesByOperatorUser`,
        pullFileFromTheExistingFiles: `${req?.commonKey}.attachedFilesByOperatorUser`,
      };

      /**
       * DEFAULT APPROVAL STATUS OBJECT
       *
       * Structure for new approval entries:
       * - approvalStatus: "Pending" (waiting for approver action)
       * - approvalDateAndTime: "" (will be filled when approver acts)
       *
       * Used when AddNewOrUpdateExistingArrayField.status = "ADD_NEW"
       * (Creating new approval entry, not updating existing)
       */
      let commonApprovalStatusObj = {
        approvalStatus: "Pending",
        approvalDateAndTime: "",
      };

      /**
       * PARSE REQUEST BODY DATA
       *
       * Frontend sends form data with nested JSON in body.otherData
       * (Cannot send nested objects directly via multipart/form-data)
       *
       * Data includes:
       * - cmBasicDataFilledByMTD_TL: Basic CM details (frequency, category, attached files)
       * - current_commonDataFilledByAssignUser: Data filled by assigned user (work details, approvals)
       * - approvalObj_*: Approval objects for each approver level
       * - wantToSendForApproval: "Yes"/"No" flag for approval workflow
       *
       * This object will be merged into MongoDB $set operation
       */
      const requestSheetDataFilledByMTDUserForCM = JSON.parse(
        req.body.otherData,
      );

      /**
       * FILE UPLOAD HANDLING: ASSIGNED USER ATTACHED FILE
       *
       * Purpose: File uploaded by assigned user (TL/HOSS filling the sheet)
       *
       * Storage: AttachedFilesByAssignedUser/ directory
       * Field name in DB: attachedFilesByAssignedUser (single filename string)
       *
       * Process:
       * 1. Check if file exists in request
       * 2. Store filename in requestSheetDataFilledByMTDUserForCM object
       * 3. Build MongoDB $set operation to update DB field
       * 4. Pre-initialize updateObj.$set if this is first update
       */
      if (
        req.files?.attachedFilesByAssignedUser?.[0]?.filename ||
        req.files?.attachedFilesByAssignedUser
      ) {
        requestSheetDataFilledByMTDUserForCM["attachedFilesByAssignedUser"] =
          req.files?.attachedFilesByAssignedUser?.[0]?.filename;

        updateObj.$set = {
          [allKeys?.attachedFilesByAssignedUser]:
            req.files?.attachedFilesByAssignedUser?.[0]?.filename,
        };
      }

      /**
       * FREQUENCY VALIDATION
       *
       * Rule: If CM frequency type is "One-time", clear frequencyValue
       *
       * Reason: One-time maintenance doesn't repeat, so no value needed
       * (e.g., Monthly = 1 month, One-time = no repetition needed)
       */
      if (
        requestSheetDataFilledByMTDUserForCM?.cmBasicDataFilledByMTD_TL
          ?.frequencyType === "One-time"
      ) {
        requestSheetDataFilledByMTDUserForCM.cmBasicDataFilledByMTD_TL.frequencyValue =
          "";
      }

      /**
       * DATE FORMATTING
       *
       * Format: ISO 8601 with timezone conversion (Asia/Kolkata)
       * Example: "2025-12-09T15:30"
       *
       * Using generalDateFormat utility for consistency across app
       * Ensures all dates stored in same format regardless of user timezone
       */
      if (requestSheetDataFilledByMTDUserForCM?.sheetIssuedDateAndTimeOfCM) {
        requestSheetDataFilledByMTDUserForCM.sheetIssuedDateAndTimeOfCM =
          generalDateFormat(
            requestSheetDataFilledByMTDUserForCM?.sheetIssuedDateAndTimeOfCM,
          );
      }

      // Format planned maintenance date to consistent format
      if (
        requestSheetDataFilledByMTDUserForCM?.cmBasicDataFilledByMTD_TL
          ?.targetDateOfCM
      ) {
        requestSheetDataFilledByMTDUserForCM.cmBasicDataFilledByMTD_TL.targetDateOfCM =
          generalDateFormat(
            requestSheetDataFilledByMTDUserForCM?.cmBasicDataFilledByMTD_TL
              ?.targetDateOfCM,
          );
      }

      /**
       * MONGODB UPDATE OBJECT INITIALIZATION
       *
       * Structure: MongoDB findOneAndUpdate supports multiple operation types:
       * - $set: Update/set field values
       * - $push: Add element to array
       * - $pull: Remove elements from array
       *
       * updateObj will accumulate these operations before execution
       * otherArrayFilters: MongoDB array filter conditions for nested array updates
       */
      let updateObj = {},
        otherArrayFilters = [];

      /**
       * TARGET DATE HANDLING
       *
       * Update planned maintenance date if provided by user:
       * - From current_commonDataFilledByAssignUser.targetDateOfCM (user input)
       * - Or from top-level targetDateOfCM parameter
       *
       * Store in nested path for specific quarter:
       * commonDataFilledByAssignUser.$[yearFilter].quarterlyDataOfTheCM.$[quarterFilter].targetDateOfCM
       *
       * Date formatting: Convert to standardized format using generalDateFormat
       */
      if (
        requestSheetDataFilledByMTDUserForCM
          ?.current_commonDataFilledByAssignUser?.targetDateOfCM ||
        requestSheetDataFilledByMTDUserForCM?.targetDateOfCM
      ) {
        updateObj.$set = {
          ...updateObj.$set,
          [allKeys?.targetDateOfCM]: generalDateFormat(
            requestSheetDataFilledByMTDUserForCM
              ?.current_commonDataFilledByAssignUser?.targetDateOfCM ||
              requestSheetDataFilledByMTDUserForCM?.targetDateOfCM,
          ),
        };
      }

      /**
       * ASSIGNED USERS HANDLING
       *
       * Purpose: Update list of users assigned to complete this maintenance
       *
       * Data Structure:
       * Input: Array of user objects with _id field from frontend
       * Output: Array transformed to use userRef instead of _id
       *
       * Example:
       * Input: [{_id: "user123", tm_name: "John"}, ...]
       * Output: [{userRef: "user123", tm_name: "John"}, ...]
       *
       * Why transform? _id is reserved in MongoDB for document identity,
       * so we use userRef for nested references within arrays
       */
      if (
        requestSheetDataFilledByMTDUserForCM
          ?.current_commonDataFilledByAssignUser?.assignUserForCM
      ) {
        updateObj.$set = {
          ...updateObj.$set,
          [allKeys?.assignUserForCM]:
            requestSheetDataFilledByMTDUserForCM?.current_commonDataFilledByAssignUser?.assignUserForCM?.map(
              (item) => {
                let userRef = item?._id;
                delete item["_id"];
                return {
                  ...item,
                  userRef,
                };
              },
            ),
        };
      }

      /**
       * HELPER: pullUser - REMOVE APPROVAL ENTRY
       *
       * Purpose: Delete specific approval object from array (e.g., PRD_TL approval)
       *
       * Use Case: When permission is revoked (isPermissionOfPRDTL = "No"),
       * remove PRD_TL approver from approval chain
       *
       * Process:
       * 1. Check if refIdFOrUpdateExitingField exists (approval was already added)
       * 2. Build $pull operation to remove by _id
       * 3. Add to updateObj for MongoDB execution
       *
       * MongoDB: $pull operator removes all array elements matching condition
       * Example: $pull: {"approvalOfPRD_TL": {"_id": ObjectId("...")}}
       *          → Removes PRD_TL approval with matching _id
       */
      const pullUser = (key, specificUserObj) => {
        const { AddNewOrUpdateExistingArrayField } = specificUserObj;
        if (AddNewOrUpdateExistingArrayField?.refIdFOrUpdateExitingField) {
          updateObj.$pull = {
            ...updateObj.$pull,
            [`${allKeys?.[`approvalOf${key}`]}`]: {
              _id: mongoose.Types.ObjectId(
                AddNewOrUpdateExistingArrayField?.refIdFOrUpdateExitingField,
              ),
            },
          };
        }
      };

      /**
       * HELPER: addOrUpdateApprovalUser - ADD/UPDATE APPROVAL WORKFLOW
       *
       * Purpose: Add new approval entry OR update existing approval entry
       *
       * TWO PATHWAYS:
       *
       * PATHWAY 1 - ADD_NEW (Create new approval):
       * Conditions:
       * - status = "ADD_NEW" (no prior approval exists)
       * - AND isOtherFieldsEditableOrNot = "No" (user cannot edit after submission)
       * Action: Use $push to add approval object to array with "Pending" status
       *
       * Example: First time TL/HOSS sends for MTD_TL approval
       *          Creates new approvalOfMTD_TL entry with status="Pending"
       *
       * PATHWAY 2 - UPDATE_EXISTING (Modify existing approval):
       * Conditions:
       * - status = "UPDATE_EXISTING" (approval already exists)
       * - OR isOtherFieldsEditableOrNot = "Yes" (user can edit)
       * Action: Use $set with array filter to update specific approval entry
       *
       * Array Filter Strategy:
       * - key transforms: "MTD_TL" → "mtdtluserfilter" (lowercase, no underscores)
       * - Match by _id using arrayFilter condition
       * - Update specific fields: userRef, tm_no, user_type, tm_name, email
       * - If isOtherFieldsEditableOrNot="Yes": Auto-accept approval (status="Accepted")
       *
       * Example: Approver reviews again, updates to different user
       *          Uses array filter to find approvalOfMTD_TL[_id] and updates fields
       */
      const addOrUpdateApprovalUser = (key, specificUserObj) => {
        if (specificUserObj?.[`approvalOf${key}`]) {
          const { AddNewOrUpdateExistingArrayField } = specificUserObj;

          const userApprovalInfo = specificUserObj?.[`approvalOf${key}`];

          /**
           * PATHWAY 1: ADD_NEW Approval
           * Create fresh approval array entry with Pending status
           */
          if (
            AddNewOrUpdateExistingArrayField?.status === "ADD_NEW" &&
            req?.query?.isOtherFieldsEditableOrNot === "No"
          ) {
            updateObj.$push = {
              ...updateObj.$push,
              [allKeys?.[`approvalOf${key}`]]: {
                ...userApprovalInfo,
                ...commonApprovalStatusObj,
              },
            };
          } else {
            /**
             * PATHWAY 2: UPDATE_EXISTING Approval
             * Modify specific array element matching our filter criteria
             */
            // Build dynamic array filter name: "MTD_TL" → "$[mtdtluserfilter]"
            let defaultKey = `${allKeys?.[`approvalOf${key}`]}.$[${key
              .toLowerCase()
              ?.split("_")
              ?.join("")}userFilter]`;

            // Update approver user details
            updateObj.$set = {
              ...updateObj.$set,
              [`${defaultKey}.userRef`]: userApprovalInfo?.userRef,
              [`${defaultKey}.tm_no`]: userApprovalInfo?.tm_no,
              [`${defaultKey}.user_type`]: userApprovalInfo?.user_type,
              [`${defaultKey}.tm_name`]: userApprovalInfo?.tm_name,
              [`${defaultKey}.email`]: userApprovalInfo?.email,
            };

            /**
             * AUTO-ACCEPTANCE LOGIC
             *
             * If isOtherFieldsEditableOrNot="Yes":
             * - All fields are locked from editing after submission
             * - Auto-accept approval (status = "Accepted")
             * - This allows workflow to proceed without waiting for manual approval
             *
             * Used for non-editable submissions or auto-approval scenarios
             */
            if (req?.query?.isOtherFieldsEditableOrNot === "Yes") {
              updateObj.$set = {
                ...updateObj.$set,
                [`${defaultKey}.approvalStatus`]: "Accepted",
              };
            }

            /**
             * ARRAY FILTER CONDITION
             *
             * MongoDB needs to know which array element to update
             * Cannot use array index (don't know it), so use _id match
             *
             * Example:
             * key = "MTD_TL"
             * Filter name = "mtdtluserfilter" (after toLowerCase and split join)
             * Condition: approvalOfMTD_TL.$[mtdtluserfilter]._id = refIdFOrUpdateExitingField
             */
            otherArrayFilters.push({
              [`${key.toLowerCase()?.split("_")?.join("")}userFilter._id`]:
                mongoose.Types.ObjectId(
                  AddNewOrUpdateExistingArrayField?.refIdFOrUpdateExitingField,
                ),
            });
          }
        }
      };

      /**
       * APPROVAL CHAIN WORKFLOW
       *
       * CM APPROVAL HIERARCHY:
       * 1. MTD_TL (Maintenance Tech Lead): First level, mandatory
       * 2. MTD_HOSS (Maintenance HOD/HOSS): Second level, if needed
       * 3. MTD_HOS (Maintenance HOS): Third level, if needed
       * 4. PRD_TL (Production TL): Optional, if permission granted
       *
       * Flow: MTD_TL → MTD_HOSS → MTD_HOS → (if approved all) → Complete/Rejected
       */

      /**
       * LEVEL 1: MTD_TL APPROVAL
       *
       * Purpose: First approval checkpoint - TL reviews maintenance
       *
       * Actions:
       * 1. Add or update MTD_TL approval entry
       * 2. If first-time submission (ADD_NEW), set getDataForApprovalDashboard
       *    → This identifies who is currently responsible for approval
       *    → Used for approval dashboard to show pending items
       *
       * getDataForApprovalDashboard structure:
       * {
       *   Id: mtd_tl_user_id,
       *   departmentAndGradeOfUser: "MTD TL/HOSS"
       * }
       */
      if (requestSheetDataFilledByMTDUserForCM?.approvalObj_MTD_TL) {
        addOrUpdateApprovalUser(
          "MTD_TL",
          requestSheetDataFilledByMTDUserForCM?.approvalObj_MTD_TL,
        );

        /**
         * Set approval dashboard indicator only on first submission
         * (When transitioning from "Ongoing" to "Under MTD TL Approval")
         */
        if (req?.query?.isOtherFieldsEditableOrNot !== "Yes")
          updateObj.$set = {
            ...updateObj.$set,
            [allKeys?.getDataForApprovalDashboard]: {
              Id: requestSheetDataFilledByMTDUserForCM?.approvalObj_MTD_TL
                ?.approvalOfMTD_TL?.userRef,
              departmentAndGradeOfUser: "MTD TL/HOSS",
            },
          };
      }

      /**
       * LEVEL 2: MTD_HOSS APPROVAL
       *
       * Purpose: Second review level - HOSS verifies TL's decision
       *
       * Note: If MTD_TL rejected, workflow may not reach this level
       * (Depends on frontend logic to allow revisions or skip to MTD_HOS)
       */
      if (requestSheetDataFilledByMTDUserForCM?.approvalObj_MTD_HOSS) {
        addOrUpdateApprovalUser(
          "MTD_HOSS",
          requestSheetDataFilledByMTDUserForCM?.approvalObj_MTD_HOSS,
        );
      }

      /**
       * LEVEL 3: MTD_HOS APPROVAL
       *
       * Purpose: Final maintenance approval - HOS (Head of Section) sign-off
       *
       * After MTD_HOS approval, maintenance is considered "Completed"
       * unless PRD_TL permission applies
       */
      if (requestSheetDataFilledByMTDUserForCM?.approvalObj_MTD_HOS) {
        addOrUpdateApprovalUser(
          "MTD_HOS",
          requestSheetDataFilledByMTDUserForCM?.approvalObj_MTD_HOS,
        );
      }

      /**
       * LEVEL 4 (OPTIONAL): PRD_TL APPROVAL
       *
       * Purpose: Production TL approval for quality/process considerations
       *
       * CONDITIONAL LOGIC:
       * 1. If isPermissionOfPRDTL = "Yes": Add PRD_TL to approval chain
       * 2. If isPermissionOfPRDTL = "No": Remove PRD_TL from approval chain
       *    (In case it was previously requested then cancelled)
       *
       * Permission Flag: Controlled by requester (TL/HOSS)
       * - Scenario 1: Non-critical maintenance → isPermissionOfPRDTL = "No"
       * - Scenario 2: Process-affecting maintenance → isPermissionOfPRDTL = "Yes"
       */
      if (requestSheetDataFilledByMTDUserForCM?.isPermissionOfPRDTL) {
        // Update permission flag in database
        updateObj.$set = {
          ...updateObj.$set,
          [allKeys?.isPermissionOfPRDTL]:
            requestSheetDataFilledByMTDUserForCM?.isPermissionOfPRDTL,
        };

        if (
          requestSheetDataFilledByMTDUserForCM?.isPermissionOfPRDTL === "Yes"
        ) {
          /**
           * ADD PRD_TL APPROVAL
           * Workflow will require PRD_TL sign-off before completion
           */
          addOrUpdateApprovalUser(
            "PRD_TL",
            requestSheetDataFilledByMTDUserForCM?.approvalObj_PRD_TL,
          );
        } else {
          /**
           * REMOVE PRD_TL APPROVAL
           * Workflow no longer needs PRD_TL sign-off
           * (User changed mind or maintenance doesn't need production approval)
           */
          pullUser(
            "PRD_TL",
            requestSheetDataFilledByMTDUserForCM?.approvalObj_PRD_TL,
          );
        }
      }

      /**
       * REQUEST SHEET STATUS WORKFLOW
       *
       * Purpose: Control maintenance request sheet lifecycle
       *
       * WORKFLOW STATES:
       * Generated → Assigned → Fill Sheet → Ongoing → (Approvals) → Completed
       *                                     ↑ ↓ (Rejected - go back to Fill Sheet)
       *
       * Status determines:
       * - Who can edit fields
       * - What operations are allowed
       * - Whether approvals are required
       */

      /**
       * PATH 1: SEND FOR APPROVAL
       *
       * Condition: wantToSendForApproval === "Yes"
       * Action: Transition to "Under MTD TL Approval"
       *
       * Use Case: User completed all required fields and is ready for approvals
       * Next: Wait for MTD_TL approval decision
       */
      if (
        requestSheetDataFilledByMTDUserForCM?.wantToSendForApproval === "Yes"
      ) {
        updateObj.$set = {
          ...updateObj.$set,
          [allKeys?.requestSheetStatusOfCM]: "Under MTD TL Approval",
        };
      } else {
        /**
         * PATH 2: NOT SENDING FOR APPROVAL (Editing/Updating existing sheet)
         *
         * Three sub-cases based on query parameters:
         */

        /**
         * CASE 2A: COMPLETION OR REJECTION STATUS
         *
         * Condition: requestSheetStatusOfCM parameter provided
         * (set to "Completed" or "Rejected")
         *
         * Use Case: Approver is accepting/rejecting maintenance
         * Action: Set status to provided value
         *
         * Note: getDataForApprovalDashboard parameter also triggers this
         * (Updates approval dashboard indicator)
         */
        if (
          req?.query?.requestSheetStatusOfCM === "Completed" ||
          req?.query?.requestSheetStatusOfCM === "Rejected" ||
          req?.query?.getDataForApprovalDashboard
        ) {
          updateObj.$set = {
            ...updateObj.$set,
            [allKeys?.requestSheetStatusOfCM]:
              req?.query?.requestSheetStatusOfCM,
          };
        } else {
          /**
           * CASE 2B: DEFAULT - ONGOING STATUS
           *
           * Condition: No approval or completion status specified
           * Action: Set status to "Ongoing"
           *
           * Use Case: User is still working/editing maintenance details
           * (Not ready for approval yet, but saving progress)
           */
          updateObj.$set = {
            ...updateObj.$set,
            [allKeys?.requestSheetStatusOfCM]: "Ongoing",
          };
        }
      }

      /**
       * MERGE ALL FORM DATA INTO UPDATE OBJECT
       *
       * Combine all the request sheet data from frontend with accumulated $set operations
       * Later specific operations (like workDetails, changedParts) will override if duplicated
       */
      updateObj.$set = {
        ...requestSheetDataFilledByMTDUserForCM,
        ...updateObj.$set,
      };

      /**
       * WORK DETAILS AND TIME TRACKING
       *
       * Purpose: Record work performed during maintenance with time tracking
       *
       * Work Details Array Structure:
       * [{
       *   fromDate: "2025-12-09T08:00",
       *   toDate: "2025-12-09T10:30",
       *   user: [{tm_no, tm_name}, ...],
       *   description: "...work description..."
       * }, ...]
       *
       * Calculation: totalTimeBasedOnWork = sum of all work intervals × number of users
       * Example: Work 10:00-11:00 (1 hour) with 2 people = 2 person-hours
       */
      if (requestSheetDataFilledByMTDUserForCM?.workDetails) {
        let totalTimeBasedOnWork = 0;

        /**
         * WORK HOURS CALCULATION
         *
         * Algorithm:
         * 1. For each work detail entry
         * 2. Calculate duration: (toDate - fromDate) in minutes
         * 3. Convert to hours: minutes / 60
         * 4. Multiply by number of people: hours × workers
         * 5. Accumulate total
         *
         * Example:
         * Work 08:00-10:30 with 3 workers
         * → (10:30 - 08:00) = 150 minutes
         * → 150 / 60 = 2.5 hours
         * → 2.5 × 3 = 7.5 person-hours
         */
        for (
          let i = 0;
          i < requestSheetDataFilledByMTDUserForCM?.workDetails?.length;
          i++
        ) {
          const element = requestSheetDataFilledByMTDUserForCM?.workDetails[i];

          totalTimeBasedOnWork +=
            (moment(element?.toDate)?.diff(
              moment(element?.fromDate),
              "minutes",
            ) /
              60) *
            (element?.user?.length >= 1 || 1);
        }

        // Update work details and calculated total in MongoDB
        updateObj.$set = {
          ...updateObj.$set,
          [allKeys?.workDetails]:
            requestSheetDataFilledByMTDUserForCM?.workDetails,
          [allKeys?.totalTimeBasedOnWork]: totalTimeBasedOnWork,
        };
      }

      /**
       * CHANGED PARTS TRACKING
       *
       * Purpose: Record any equipment parts that were replaced/repaired
       *
       * Changed Parts Array Structure:
       * [{
       *   partName: "Motor Bearing",
       *   quantity: 2,
       *   partCode: "MB-123",
       *   reason: "Worn out",
       *   cost: 5000
       * }, ...]
       *
       * Used for inventory tracking and cost analysis
       */
      if (requestSheetDataFilledByMTDUserForCM?.changedParts) {
        updateObj.$set = {
          ...updateObj.$set,
          [allKeys?.changedParts]:
            requestSheetDataFilledByMTDUserForCM?.changedParts,
        };
      }

      /**
       * ACTION AND COUNTER MEASURE STEPS
       *
       * Purpose: Document preventive measures taken to avoid future issues
       *
       * Example:
       * - Applied preventive lubrication schedule
       * - Replaced worn components preemptively
       * - Scheduled follow-up inspection
       *
       * Array of action objects with description and responsible person
       */
      if (requestSheetDataFilledByMTDUserForCM?.actionAndCounterMeasureStep) {
        updateObj.$set = {
          ...updateObj.$set,
          [allKeys?.actionAndCounterMeasureStep]:
            requestSheetDataFilledByMTDUserForCM?.actionAndCounterMeasureStep,
        };
      }
      /**
       * DELETED FILE CLEANUP
       *
       * Purpose: Remove work files from server when user deletes them from array
       *
       * File Deletion Process:
       * 1. Frontend identifies deleted file: {deletedFile: ["filename1", "filename2"]}
       * 2. Server removes files from AttachedFilesByOperatorUser/ directory
       * 3. Update MongoDB to remove filename from array
       *
       * Why two-step process?
       * - Must delete physical files to free disk space
       * - Must update DB to keep data structure consistent
       *
       * Error Handling: Logs errors but continues (file may already be deleted)
       */
      if (
        requestSheetDataFilledByMTDUserForCM?.deletedFile &&
        requestSheetDataFilledByMTDUserForCM?.deletedFile?.length > 0
      ) {
        /**
         * FILE SYSTEM DELETION
         *
         * Iterate through deletedFile array and remove each from disk
         */
        requestSheetDataFilledByMTDUserForCM?.deletedFile?.forEach(
          (filename) => {
            fs.unlink(
              path.join(
                __dirname,
                `../AttachedFilesByOperatorUser/${filename}`,
              ),
              function (err) {
                if (err) {
                  console.error(err);
                } else {
                  console.log("Work files Removed Successfully");
                }
              },
            );
          },
        );

        /**
         * DATABASE ARRAY UPDATE
         *
         * MongoDB $pull operator: Remove all items matching condition
         * {$in: [...]} matches any filename in deletedFile array
         *
         * Example:
         * attachedFilesByOperatorUser: ["file1.pdf", "file2.docx", "file3.jpg"]
         * deletedFile: ["file2.docx"]
         * Result: attachedFilesByOperatorUser: ["file1.pdf", "file3.jpg"]
         */
        updateObj.$pull = {
          ...updateObj.$pull,
          [allKeys?.pullFileFromTheExistingFiles]: {
            $in: requestSheetDataFilledByMTDUserForCM?.deletedFile,
          },
        };
      }

      /**
       * FILE UPLOAD: OPERATOR WORK FILES
       *
       * Purpose: Store uploaded files from operator (photos, documents, etc.)
       *
       * Storage: AttachedFilesByOperatorUser/ directory
       * Field in DB: attachedFilesByOperatorUser (array of filenames)
       *
       * Process:
       * 1. Check if files uploaded in this request
       * 2. Extract filenames from multer req.files
       * 3. Store in requestSheetDataFilledByMTDUserForCM for merging
       * 4. Use $push to add filenames to existing array (not replace)
       *
       * Why $push not $set?
       * - $set would replace entire array (lose previous uploads)
       * - $push appends to array (keeps history of all uploads)
       */
      if (
        req.files?.attachedFilesByOperatorUser?.[0]?.filename ||
        req.files?.attachedFilesByOperatorUser
      ) {
        /**
         * MAP FILENAMES
         *
         * Extract filename property from each multer file object
         * multer provides: {filename: "timestamp_originalname", ...}
         */
        requestSheetDataFilledByMTDUserForCM["attachedFilesByOperatorUser"] =
          req.files?.attachedFilesByOperatorUser?.map(
            (value) => value?.filename,
          );

        /**
         * BUILD MONGODB PUSH OPERATION
         *
         * MongoDB $push with array value: Adds all elements to array
         * Example:
         * attachedFilesByOperatorUser: ["file1.pdf"]
         * $push: {attachedFilesByOperatorUser: ["file2.pdf", "file3.pdf"]}
         * Result: attachedFilesByOperatorUser: ["file1.pdf", "file2.pdf", "file3.pdf"]
         */
        updateObj.$push = {
          ...updateObj.$push,
          [allKeys?.attachedFilesByOperatorUser]:
            req.files?.attachedFilesByOperatorUser?.map(
              (value) => value?.filename,
            ),
        };
      }
      /**
       * MONGODB DATABASE UPDATE EXECUTION
       *
       * Operation: findOneAndUpdate
       * Purpose: Update existing request sheet with all accumulated changes
       *
       * PARAMETERS:
       *
       * 1. Query Filter: {_id: req.params.reqId}
       *    Find the specific request sheet by its ID
       *
       * 2. Update Operations: updateObj (accumulated $set, $push, $pull)
       *    $set: Update/set specific field values
       *    $push: Add elements to arrays
       *    $pull: Remove elements from arrays
       *
       * 3. Array Filters: Dynamic filters for nested array updates
       *    [0]: yearFilter - Match specific financial year
       *         Condition: requestSheet_year = current financial year
       *    [1]: quarterFilter - Match specific quarter
       *         Condition: requestSheet_quarter = calculated quarter from date
       *    [2+]: Additional filters for approval arrays (mtdtluserfilter, etc.)
       *         Match specific approval entry by _id
       *
       * 4. Options:
       *    new: true - Return updated document (not original)
       */
      const requestSheetOfCM = await RequestSheetOfCM.findOneAndUpdate(
        {
          _id: mongoose.Types.ObjectId(req.params?.reqId),
        },
        updateObj,
        {
          arrayFilters: [
            /**
             * YEAR FILTER (arrayFilters[0])
             *
             * Match request sheet data from current financial year
             * Example: If current year = "2024-2025", only update data from that year
             *
             * Financial Year Format: "2024-2025" (April 2024 - March 2025)
             * Common in India, UK, Australia
             */
            {
              "yearFilter.preAggregationTimeStampOfRequestSheet.requestSheet_year":
                currentYear,
            },
            /**
             * QUARTER FILTER (arrayFilters[1])
             *
             * Match request sheet data from calculated quarter
             * Quarter calculated from targetDateOfCM
             *
             * Example: If targetDateOfCM = "2024-11-15", quarter = Q3 (Nov-Dec-Jan)
             *
             * Why needed? Each financial year has 4 quarters:
             * Q1: April-May-June
             * Q2: July-August-September
             * Q3: October-November-December
             * Q4: January-February-March
             */
            {
              "quarterFilter.requestSheet_quarter": getFinancialQuarter(
                requestSheetDataFilledByMTDUserForCM?.targetDateOfCM,
              ),
            },
            /**
             * APPROVAL USER FILTERS (arrayFilters[2+])
             *
             * Added dynamically for each approval level being updated
             *
             * Examples:
             * - mtdtluserfilter._id = approval_user_id (for MTD_TL approver)
             * - mtdhossfilter._id = approval_user_id (for MTD_HOSS approver)
             * - mtdhosfilter._id = approval_user_id (for MTD_HOS approver)
             * - prdtlfilter._id = approval_user_id (for PRD_TL approver)
             *
             * Purpose: Find exact approval array element to update
             * Cannot use array index (might not know it), so match by _id
             */
            ...otherArrayFilters,
          ],
          new: true,
        },
      );

      /**
       * SUCCESS RESPONSE
       *
       * Return updated request sheet to frontend
       * Frontend uses this to:
       * - Refresh UI with new data
       * - Display success confirmation
       * - Navigate to next workflow step
       */
      return res.status(201).json({
        message: `Request-sheet updated !!`,
        requestSheetOfCM,
      });
    } catch (error) {
      /**
       * ERROR HANDLING
       *
       * Log error for debugging
       * Note: No explicit error response sent to frontend
       * (Should be added for better error handling)
       */
      console.log(error);
    }
  },
);

router.delete("/deleteRequestSheetOfCM/:id", async (req, res, next) => {
  try {
    const deletedRequestSheet = await RequestSheetOfCM.findByIdAndDelete(
      req.params.id,
    );

    return res.status(201).json({
      message: "RequestSheet Deleted successfully",
      deletedRequestSheet,
    });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[3] });
    res.status(500).json({ message: error?.message, error });
  }
});

/**
 * MIDDLEWARE: getRequestSheetData
 *
 * PURPOSE:
 * Complex MongoDB aggregation middleware that retrieves and filters CM (Corrective Maintenance)
 * request sheet data with dynamic date-based filtering and approval workflow logic.
 *
 * KEY RESPONSIBILITIES:
 * 1. Determines which quarter/month/date range to query based on request parameters
 * 2. Builds conditional MongoDB aggregation pipelines with different filtering strategies
 * 3. Determines field editability based on request sheet status and user role
 * 4. Handles category-specific filtering (LTPM, Overhauling, etc.)
 * 5. Manages approval object construction with permission validation
 *
 * QUERY PARAMETERS SUPPORTED:
 * - selectedYear: Filter by specific fiscal year (e.g., "2023-2024")
 * - selectedQuarter: Filter by quarter (Q1, Q2, Q3, Q4)
 * - selectedMonth: Filter by specific month
 * - targetDateOfCM: Filter by planned maintenance date
 * - selectedDateFromCal: Calendar selection date for approval dashboard
 * - isOtherFieldsEditableOrNot: Controls approval field editability
 * - selectedRSStatus: Filter by request sheet status
 *
 * FLOW:
 * 1. Initialize pipeline structures and filtering conditions
 * 2. Determine quarter/month based on query parameters
 * 3. Build lastQuarterOrSelectedQuarter with nested $filter and $getField
 * 4. Construct isEditableRS logic for status-based field control
 * 5. Apply endpoint-specific pipeline customizations
 * 6. Execute aggregation and store in req.requestSheetData
 * 7. Pass control to next middleware
 */
const getRequestSheetData = tryCatchHandler(async (req, res, next) => {
  /**
   * otherPipelines: Stores endpoint-specific aggregation pipeline modifications
   * - addFields: Additional fields to compute during aggregation
   * - project: Field projection configuration (1 to include, 0 to exclude)
   * - aggregationPipeline: Array of additional $match/$group stages
   * - projectionForBMReflactionTable: Special projection for BM reflection views
   *
   * conditionForGetOnlyApprovalDataWithoutOtherStatus: Array of $and conditions
   * used to filter only approval-pending records by date comparison
   */
  let otherPipelines = {
      addFields: {},
      project: {},
      aggregationPipeline: [
        {
          $match: {
            // Ensure target date is defined (excludes documents without maintenance date)
            "current_commonDataFilledByAssignUser.targetDateOfCM": {
              $ne: undefined,
            },
          },
        },
      ],
      projectionForBMReflactionTable: {},
    },
    conditionForGetOnlyApprovalDataWithoutOtherStatus = [];

  // Parse request URL to determine which endpoint is calling this middleware
  // Used to apply endpoint-specific filtering and projection logic
  const reqUrl = req.url?.split("/");

  /**
   * DATE FILTERING CONDITION
   *
   * LOGIC: For approval dashboard (getMachineRequestSheetDetailsForApprovalForCM),
   * filter only records where:
   * 1. Target date <= selected date (or current date if not specified)
   * 2. Request sheet status matches "Under" pattern (case-insensitive regex)
   *
   * This ensures only actionable, due-date-passed approvals appear on dashboard
   *
   * STRUCTURE:
   * - $lte: Target date must be less than or equal to calendar selection date
   * - $dateToString/$dateFromString: Converts date strings to comparable format (YYYY-MM-DD)
   * - $regexMatch: Checks if status starts with "Under" (e.g., "Under review", "Under approval")
   */
  conditionForGetOnlyApprovalDataWithoutOtherStatus = [
    {
      $lte: [
        {
          $dateToString: {
            format: "%Y-%m-%d",
            date: {
              $dateFromString: {
                dateString: "$$quarterObj.targetDateOfCM",
              },
            },
          },
        },
        {
          $dateToString: {
            format: "%Y-%m-%d",
            date: {
              $dateFromString: {
                dateString:
                  req?.query?.selectedDateFromCal || new Date().toISOString(),
              },
            },
          },
        },
      ],
    },
  ];

  // For approval dashboard endpoint, add status filter to conditions
  if (reqUrl?.[1] === "getMachineRequestSheetDetailsForApprovalForCM") {
    conditionForGetOnlyApprovalDataWithoutOtherStatus.push({
      $regexMatch: {
        input: { $ifNull: ["$$quarterObj.requestSheetStatusOfCM", ""] },
        regex: "^\\s*Under\\b",
        options: "i",
      },
    });
  }

  /**
   * LAST QUARTER OR SELECTED QUARTER EXTRACTION
   *
   * PURPOSE: Retrieve the most relevant quarterly data based on filters
   *
   * NESTED STRUCTURE:
   * 1. Outer $filter: Finds year-wise data matching selectedYear
   * 2. Inner $filter: Extracts quarterly data matching date/status conditions
   * 3. $getField: Accesses quarterlyDataOfTheCM array from matched year
   * 4. $arrayElemAt: Gets last element [-1] for approval dashboard OR first element [0] for others
   *
   * FLOW:
   * commonDataFilledByAssignUser (array of years)
   *   ↓ $filter by selectedYear
   *     ↓ Get quarterlyDataOfTheCM array
   *       ↓ $filter by date/status conditions
   *         ↓ $arrayElemAt[-1] = latest matching quarter
   */
  let lastQuarterOrSelectedQuarter = {
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
          as: "quarterObj",
          cond: {
            $and: conditionForGetOnlyApprovalDataWithoutOtherStatus,
          },
        },
      },
      -1,
    ],
  };
  /**
   * QUARTER/MONTH FILTERING LOGIC
   *
   * PURPOSE: Build filter condition based on available query parameters
   * Priority order: selectedQuarter > selectedMonth > targetDateOfCM > get all
   *
   * ENDPOINT CHECK: Only applies if NOT approval dashboard endpoint
   * (Approval dashboard uses lastQuarterOrSelectedQuarter with date cutoff)
   */
  let middlewareForGetQuarterWiseOrUptoCurrentDate = {};
  //below all condition for the filteration of the CM data
  if (reqUrl?.[1] !== "getMachineRequestSheetDetailsForApprovalForCM") {
    /**
     * CASE 1: Quarter explicitly selected
     * Match records where requestSheet_quarter equals selectedQuarter parameter
     */
    if (
      req.query?.selectedQuarter !== "undefined" &&
      req.query?.selectedQuarter !== undefined &&
      req.query?.selectedQuarter !== ""
    ) {
      middlewareForGetQuarterWiseOrUptoCurrentDate = {
        $eq: [
          "$$quarterWiseData.requestSheet_quarter",
          req.query?.selectedQuarter,
        ],
      };
    } else if (
      /**
       * CASE 2: Month selected (convert to quarter)
       * Helper function getFinancialQuarterByMonth converts month name to quarter
       * Example: Jan/Feb/Mar → Q1, Apr/May/June → Q2, etc.
       */
      req.query?.selectedMonth !== "undefined" &&
      req.query?.selectedMonth !== undefined &&
      req.query?.selectedMonth !== ""
    ) {
      const getQueterFromMonth = getFinancialQuarterByMonth(
        req?.query?.selectedMonth,
      );
      middlewareForGetQuarterWiseOrUptoCurrentDate = {
        $eq: [
          "$$quarterWiseData.requestSheet_quarter",
          req.query?.selectedMonth || getQueterFromMonth,
        ],
      };
    } else if (
      /**
       * CASE 3: Target date selected
       * Determine quarter from the planned maintenance date
       */
      req.query?.targetDateOfCM !== "undefined" &&
      req.query?.targetDateOfCM !== undefined &&
      req.query?.targetDateOfCM !== ""
    ) {
      middlewareForGetQuarterWiseOrUptoCurrentDate = {
        $eq: [
          "$$quarterWiseData.requestSheet_quarter",
          getFinancialQuarter(req?.query?.targetDateOfCM),
        ],
      };
    } else {
      /**
       * CASE 4: No specific selection - get all records up to current date
       * Updates date condition to compare against individual quarter records
       * instead of calendar selection date
       */
      //get all the CM data for the display
      conditionForGetOnlyApprovalDataWithoutOtherStatus[0].$lte[0].$dateToString.date.$dateFromString.dateString =
        "$$quarterWiseData.targetDateOfCM";
      middlewareForGetQuarterWiseOrUptoCurrentDate = {
        ...conditionForGetOnlyApprovalDataWithoutOtherStatus,
      };
    }

    /**
     * REBUILD QUARTER EXTRACTION WITH DYNAMIC FILTER
     *
     * Unlike approval dashboard that gets LAST matching quarter [-1],
     * this approach gets FIRST matching quarter [0] for non-approval endpoints
     *
     * This allows filtering within a specific quarter/month while still
     * respecting date cutoff logic
     */
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
            },
          },
        },
        0, // Get first matching quarter (not last)
      ],
    };
  }
  /**
   * APPROVAL OBJECT BUILDER HELPER FUNCTION
   *
   * PURPOSE: Constructs approval object with dynamic status and editability logic
   *
   * PARAMETERS:
   * - key: Field name in commonDataFilledByAssignUser (e.g., "approvalOfMTD_TL")
   * - permissionKey: Optional permission field name (e.g., "isPermissionOfPRDTL")
   *
   * LOGIC FLOW:
   * 1. Get latest approval entry from array using $last
   * 2. Check if approval field is editable based on:
   *    a. Current approval status (Rejected/Accepted/Empty = not editable)
   *    b. Request sheet status (Rejected = not editable anywhere)
   *    c. isOtherFieldsEditableOrNot parameter (override flag)
   * 3. If permission key provided, check if user has permission to this approval level
   * 4. Determine ADD_NEW vs UPDATE_EXISTING operation:
   *    - ADD_NEW: No existing approval OR field not editable
   *    - UPDATE_EXISTING: Approval exists AND field is editable
   * 5. Return $cond structure wrapping all three cases (has data, no data, null)
   *
   * OUTPUT STRUCTURE:
   * {
   *   AddNewOrUpdateExistingArrayField: {status: "ADD_NEW"|"UPDATE_EXISTING", refIdFOrUpdateExitingField: "id"},
   *   [key]: {approvalUserObj}
   * }
   */
  const getUserApprovalObj = (key, permissionKey) => {
    // Default: get last approval entry from array
    let approvalUserDetails = {
      $last: `$current_commonDataFilledByAssignUser.${key}`,
    };

    /**
     * EDITABILITY DETERMINATION
     *
     * Two scenarios:
     * 1. isOtherFieldsEditableOrNot === "Yes": All fields are NOT editable (override)
     * 2. Normal flow: Check if approval is already Rejected/Accepted/Empty OR request rejected
     */
    let checkWhetherTheApprovalFieldEdistableOrNotInAcceptedOrRejected = [];
    if (req?.query?.isOtherFieldsEditableOrNot === "Yes") {
      checkWhetherTheApprovalFieldEdistableOrNotInAcceptedOrRejected = [false];
    } else {
      checkWhetherTheApprovalFieldEdistableOrNotInAcceptedOrRejected = [
        {
          $or: [
            {
              /**
               * Approval field is NOT editable if:
               * - Current approval status is Rejected, Accepted, or Empty
               */
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
              /**
               * Request sheet itself is rejected = no fields editable
               */
              $eq: [
                "$current_commonDataFilledByAssignUser.requestSheetStatusOfCM",
                "Rejected",
              ],
            },
          ],
        },
      ];
    }

    /**
     * PERMISSION-BASED APPROVAL FILTERING
     *
     * If permissionKey provided (e.g., isPermissionOfPRDTL):
     * - Only include approval if user has "Yes" permission
     * - Otherwise return empty object {}
     */
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

    /**
     * MAIN CONDITIONAL STRUCTURE
     *
     * Three-level nesting:
     *
     * Level 1: Does current_commonDataFilledByAssignUser exist?
     *   ↓ Yes: Check array size
     *   ↓ No: Return ADD_NEW with empty approval object
     *
     * Level 2: Does approval array have entries?
     *   ↓ Size = 0: ADD_NEW (no approvals yet)
     *   ↓ Size > 0: Check editability
     *
     * Level 3: Is field editable?
     *   ↓ Not editable: ADD_NEW (can only add new approval, can't modify existing)
     *   ↓ Editable: UPDATE_EXISTING (modify last approval entry)
     */
    return {
      $cond: [
        {
          // Level 1: Does current_commonDataFilledByAssignUser exist?
          $gt: ["$current_commonDataFilledByAssignUser", null],
        },
        {
          // Level 2: Check array size
          $cond: [
            {
              $lte: [
                { $size: `$current_commonDataFilledByAssignUser.${key}` },
                0,
              ],
            },
            // Empty approval array = ADD_NEW
            {
              AddNewOrUpdateExistingArrayField: {
                status: "ADD_NEW",
                refIdFOrUpdateExitingField: "",
              },
              [key]: {},
            },
            {
              // Level 3: Check editability
              $cond: [
                ...checkWhetherTheApprovalFieldEdistableOrNotInAcceptedOrRejected,
                // Not editable = ADD_NEW
                {
                  AddNewOrUpdateExistingArrayField: {
                    status: "ADD_NEW",
                    refIdFOrUpdateExitingField: "",
                  },
                  [key]: approvalUserDetails,
                },
                // Editable = UPDATE_EXISTING
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
        // currentCommonDataFilledByAssignUser is null = ADD_NEW
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

  /**
   * FIELD EDITABILITY LOGIC FOR REQUEST SHEETS
   *
   * PURPOSE: Determine if request sheet data is editable based on:
   * 1. Current request sheet status
   * 2. Whether date has passed
   * 3. User's role in the CM (assigned user vs approval user)
   *
   * EDITABLE STATUSES:
   * - Generated: Initial creation, no approvals yet
   * - Assigned: User assigned, awaiting data fill
   * - Fill Sheet: In data entry phase
   * - Rejected: Send back for corrections
   * - Ongoing: Active maintenance in progress
   *
   * TWO PATHWAYS TO EDITABILITY:
   *
   * Pathway 1: "Generated" or "Assigned" status + No assigned users yet + Date not passed
   *   → Everyone can edit (fresh request sheet)
   *
   * Pathway 2: User is assigned to this request sheet
   *   → Assigned user can edit their data entry
   *
   * Pathway 3: User is approval authority
   *   → Can edit for approval workflow
   *
   * isEditableRS = true if ANY pathway is valid
   */
  // Update date comparison to use actual target date instead of calendar date
  conditionForGetOnlyApprovalDataWithoutOtherStatus[0].$lte[0].$dateToString.date.$dateFromString.dateString =
    "$current_commonDataFilledByAssignUser.targetDateOfCM";

  let isEditableRS = {
    $cond: [
      {
        // Only potentially editable in these statuses
        $in: [
          "$current_commonDataFilledByAssignUser.requestSheetStatusOfCM",
          ["Generated", "Assigned", "Fill Sheet", "Rejected", "Ongoing"],
        ],
      },
      {
        $and: [
          {
            $eq: [
              "$current_commonDataFilledByAssignUser.isSafetyFormSubmitted",
              true,
            ],
          },
          {
            $or: [
              {
                $and: [
                  {
                    $in: [
                      "$current_commonDataFilledByAssignUser.requestSheetStatusOfCM",
                      ["Generated", "Assigned"],
                    ],
                  },
                  {
                    $eq: [
                      {
                        $cond: [
                          {
                            $isArray:
                              "$current_commonDataFilledByAssignUser.assignUserForCM",
                          },
                          {
                            $size:
                              "$current_commonDataFilledByAssignUser.assignUserForCM",
                          },
                          0,
                        ],
                      },
                      0,
                    ],
                  },
                  ...conditionForGetOnlyApprovalDataWithoutOtherStatus,
                ],
              },
              {
                $ne: [
                  {
                    $filter: {
                      input:
                        "$current_commonDataFilledByAssignUser.assignUserForCM",
                      as: "item",
                      cond: { $eq: ["$$item.userRef", req.rootUser?._id] },
                    },
                  },
                  [],
                ],
              },
            ],
          },
          {
            $eq: ["$requestSheetCreatedBy.tm_no", req.rootUser?.tm_no],
          },
        ],
      },
      {
        /**
         * PATHWAY 3: User is approval authority
         * Check getDataForApprovalDashboard.Id matches current user
         */
        $eq: [
          "$current_commonDataFilledByAssignUser.getDataForApprovalDashboard.Id",
          req.rootUser?._id,
        ],
      },
    ],
  };

  /**
   * CATEGORY FILTERING HELPER
   *
   * PURPOSE: Conditionally include category-specific fields only when category matches
   *
   * USAGE: For LTPM records, only include inspectionItem, actionForLTPM, personForLTPM
   *        For Others category, only include other_categories field
   *
   * @param category - Category name to match (e.g., "LTPM", "Others")
   * @param field - Field path to include if category matches
   * @returns $cond expression that returns field or empty string
   */
  const categoryCheck = (category, field) => ({
    $cond: [
      {
        $eq: ["$cmBasicDataFilledByMTD_TL.categories", category],
      },
      field,
      "",
    ],
  });
  /**
   * ENDPOINT-SPECIFIC PIPELINE CUSTOMIZATIONS
   *
   * Different API endpoints require different data filtering strategies:
   *
   * 1. getReqSheetDataByID: Historical year-wise data with up-to-current filtering
   *    - Returns request sheets up to current year (for comparing historical data)
   *    - Maps through commonDataFilledByAssignUser and filters by year
   *
   * 2. getAllCmReqSheet/getCMRequestSheetHistoryData: Full data with optional status filtering
   *    - Returns all request sheets (no year restrictions)
   *    - Applies status filtering based on selectedRSStatus parameter
   *
   * 3. getApprovalLogsForCM: Approval-only projection
   *    - Returns only approval-related fields
   *    - Hides actual maintenance data (business logic)
   */

  if (reqUrl?.includes("getReqSheetDataByID")) {
    /**
     * HISTORICAL YEAR-WISE DATA FILTERING STRATEGY
     *
     * Purpose: Get all request sheets up to the current financial year
     * Use Case: Comparing current against previous years' maintenance data
     *
     * Process:
     * 1. Map through commonDataFilledByAssignUser array (historical entries)
     * 2. For each entry, check if financialYear matches current year
     * 3. Filter to only matching entries (keeps history intact)
     * 4. Store in upto_currentYear_current_commonDataFilledByAssignUser
     *
     * Why: Allows viewing maintenance history for this specific machine
     *      while limiting to relevant fiscal periods
     */
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
        /**
         * PROJECTION STRATEGY FOR getReqSheetDataByID
         *
         * This endpoint returns request sheet summary + current year data only
         * (no historical years to reduce payload)
         *
         * Fields Included:
         * - Basic metadata: maintenanceType, priorityCode, shiftOfCM, qualityRelated
         * - Creation info: sheetIssuedDateAndTimeOfCM, requestSheetCreatedBy
         * - Editability: isEditableRS boolean flag
         * - Current request sheet status: requestSheet_quarter, statusOfPlannedCM
         * - Assignment data: assignUserForCM array, rejectedRemarksOfRequestSheet
         * - Reference IDs: _id, getDataForApprovalDashboard (for approval tracking)
         * - Maintenance data: current_commonDataFilledByAssignUser (filtered to current year)
         */
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
          "$cmBasicDataFilledByMTD_TL.other_categories",
        ),
        "cmBasicDataFilledByMTD_TL.inspectionItem": categoryCheck(
          "LTPM",
          "$cmBasicDataFilledByMTD_TL.inspectionItem",
        ),
        "cmBasicDataFilledByMTD_TL.actionForLTPM": categoryCheck(
          "LTPM",
          "$cmBasicDataFilledByMTD_TL.actionForLTPM",
        ),
        "cmBasicDataFilledByMTD_TL.personForLTPM": categoryCheck(
          "LTPM",
          "$cmBasicDataFilledByMTD_TL.personForLTPM",
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
        "upto_currentYear_current_commonDataFilledByAssignUser.quarterlyDataOfTheCM.attachedFilesByOperatorUser": 1,

        approvalObj_MTD_TL: getUserApprovalObj("approvalOfMTD_TL"),
        approvalObj_MTD_HOSS: getUserApprovalObj("approvalOfMTD_HOSS"),
        approvalObj_MTD_HOS: getUserApprovalObj("approvalOfMTD_HOS"),
        approvalObj_PRD_TL: getUserApprovalObj(
          "approvalOfPRD_TL",
          "isPermissionOfPRDTL",
        ),
      },
      aggregationPipeline: [],
    };
  } else if (
    reqUrl?.includes("getAllCmReqSheet") ||
    reqUrl?.includes("getCMRequestSheetHistoryData")
  ) {
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
          [],
        ],
      },
      isEditableRS,
      "cmBasicDataFilledByMTD_TL.other_categories": categoryCheck(
        "Others",
        "$cmBasicDataFilledByMTD_TL.other_categories",
      ),
      "cmBasicDataFilledByMTD_TL.inspectionItem": categoryCheck(
        "LTPM",
        "$cmBasicDataFilledByMTD_TL.inspectionItem",
      ),
      "cmBasicDataFilledByMTD_TL.actionForLTPM": categoryCheck(
        "LTPM",
        "$cmBasicDataFilledByMTD_TL.actionForLTPM",
      ),
      "cmBasicDataFilledByMTD_TL.line": {
        $arrayElemAt: ["$plantToMachineHierarchy.line.line_name", 0],
      },
      "cmBasicDataFilledByMTD_TL.lineId": {
        $arrayElemAt: ["$plantToMachineHierarchy.line._id", 0],
      },
      "cmBasicDataFilledByMTD_TL.machineName": {
        $arrayElemAt: ["$plantToMachineHierarchy.machine.machine_name", 0],
      },
      "cmBasicDataFilledByMTD_TL.machineId": {
        $arrayElemAt: ["$plantToMachineHierarchy.machine._id", 0],
      },
      requestSheetOfBMRef: 1,
    };

    if (req?.query?.selectedRSStatus) {
      otherPipelines.aggregationPipeline = [
        ...otherPipelines.aggregationPipeline,
        {
          $match: {
            "current_commonDataFilledByAssignUser.requestSheetStatusOfCM":
              req?.query?.selectedRSStatus,
          },
        },
      ];
    }
  } else if (reqUrl?.includes("getApprovalLogsForCM")) {
    otherPipelines.project = {
      "current_commonDataFilledByAssignUser.assignUserForCM": 1,
      "current_commonDataFilledByAssignUser.approvalOfMTD_TL": 1,
      "current_commonDataFilledByAssignUser.approvalOfMTD_HOSS": 1,
      "current_commonDataFilledByAssignUser.approvalOfMTD_HOS": 1,
      "current_commonDataFilledByAssignUser.approvalOfPRD_TL": 1,
      "current_commonDataFilledByAssignUser.rejectedRemarksOfRequestSheet": 1,
    };
  }

  /**
   * FINAL AGGREGATION PIPELINE EXECUTION
   *
   * This is where all the filtering, projections, and transformations come together.
   *
   * PIPELINE STAGES:
   * 1. $match: Filter by query object (dates, statuses, user IDs, etc.)
   * 2. $lookup: Join with plantToMachineHierarchy to get line/machine details
   * 3. $sort: Order by _id descending (newest first)
   * 4. $addFields: Add computed fields (editability, quarter data extraction, etc.)
   * 5. $project: Select which fields to return (customized per endpoint)
   *
   * FLOW:
   * RequestSheetOfCM collection
   *     ↓ $match by query criteria
   *     ↓ $lookup plantToMachineHierarchy (line, machine names)
   *     ↓ $sort newest first
   *     ↓ $addFields (all computed fields)
   *     ↓ $project (endpoint-specific field selection)
   *     ↓ Final data array
   */
  const requestSheetData = await RequestSheetOfCM.aggregate([
    {
      /**
       * STAGE 1: FILTER BY CRITERIA
       *
       * req.queryObj contains pre-built query conditions like:
       * - Date ranges (targetDateOfCM >= startDate AND <= endDate)
       * - User IDs (if specific user viewing)
       * - Status filters (Generated, Assigned, Fill Sheet, etc.)
       * - Approval status filters (Rejected, Accepted, Pending)
       * - Quarter filters (Q1, Q2, Q3, Q4)
       *
       * Result: Only matching request sheets proceed to next stage
       */
      $match: req.queryObj,
    },
    {
      /**
       * STAGE 2: JOIN WITH HIERARCHY
       *
       * Join RequestSheetOfCM with PlantToMachineHierarchy to enrich data with:
       * - Line name (assembly line or section)
       * - Machine name (specific equipment identifier)
       * - Plant information (from hierarchy)
       *
       * Lookup fields:
       * - localField: plantToMachineHierarchyRef (ID from request sheet)
       * - foreignField: _id (ID from hierarchy collection)
       *
       * Result: plantToMachineHierarchy array attached to each request sheet
       *         (typically 1 element since it's a specific reference)
       */
      $lookup: {
        from: "planttomachinehierarchies",
        localField: "plantToMachineHierarchyRef",
        foreignField: "_id",
        as: "plantToMachineHierarchy",
      },
    },
    {
      /**
       * STAGE 3: SORT BY CREATION ORDER
       *
       * _id: -1 = newest first (MongoDB ObjectId encodes creation timestamp)
       *
       * Result: Most recently created request sheets appear first in UI
       */
      $sort: {
        _id: -1,
      },
    },
    {
      /**
       * STAGE 4: ADD COMPUTED FIELDS
       *
       * This stage adds all the complex computed fields we built earlier:
       * - current_commonDataFilledByAssignUser: Selected quarter/month/date data
       * - Editability flags: isEditableRS boolean
       * - Approval objects: getUserApprovalObj results for each approver
       * - Category-filtered fields: Other, LTPM-specific, Overhauling data
       *
       * These computed fields are not stored in DB, only calculated on retrieval.
       * This allows real-time permission/status checks during query.
       *
       * otherPipelines?.addFields: Endpoint-specific additions
       * (e.g., upto_currentYear_current_commonDataFilledByAssignUser for getReqSheetDataByID)
       */
      $addFields: {
        current_commonDataFilledByAssignUser: lastQuarterOrSelectedQuarter,
        ...otherPipelines?.addFields,
      },
    },
    {
      /**
       * STAGE 5: PROJECT FINAL FIELDS
       *
       * Base projection (always included):
       * - cell, line, machineId, machineNo, machineName (hierarchy data)
       * - plannedDateAndTimeOfCMForTable (formatted date for UI)
       * - requestSheetNoOfCM (request sheet identifier)
       * - Basic CM info: categories, activityOfCM, frequency, files
       * - Request sheet status and target date
       *
       * + Endpoint-specific projections from otherPipelines?.project
       *   (may include approval objects, historical data, etc.)
       *
       * Result: Final data shape tailored to requesting endpoint
       */
      $project: {
        cell: {
          $arrayElemAt: ["$plantToMachineHierarchy.cell.cell_name", 0],
        },
        cellRef: {
          $arrayElemAt: ["$plantToMachineHierarchy.cell", 0],
        },
        line: {
          $arrayElemAt: ["$plantToMachineHierarchy.line.line_name", 0],
        },
        lineRef: {
          $arrayElemAt: ["$plantToMachineHierarchy.line", 0],
        },
        machineId: {
          $arrayElemAt: ["$plantToMachineHierarchy.machine._id", 0],
        },
        machineNo: {
          $arrayElemAt: ["$plantToMachineHierarchy.machine.machine_code", 0],
        },
        machineName: {
          $arrayElemAt: ["$plantToMachineHierarchy.machine.machine_name", 0],
        },
        machineRef: {
          $arrayElemAt: ["$plantToMachineHierarchy.machine", 0],
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
        "cmBasicDataFilledByMTD_TL.subCategories": 1,
        "cmBasicDataFilledByMTD_TL.activityOfCM": 1,
        "cmBasicDataFilledByMTD_TL.frequencyType": 1,
        "cmBasicDataFilledByMTD_TL.frequencyValue": 1,
        "cmBasicDataFilledByMTD_TL.plannedDateAndTimeOfCM": 1,
        "cmBasicDataFilledByMTD_TL.attachedFilesByMTDUser": 1,
        "current_commonDataFilledByAssignUser._id": 1,
        "current_commonDataFilledByAssignUser.requestSheetStatusOfCM": 1,
        "current_commonDataFilledByAssignUser.targetDateOfCM": 1,

        targetDateOfCM: "$current_commonDataFilledByAssignUser.targetDateOfCM",

        /**
         * ENDPOINT-SPECIFIC FIELD ADDITIONS
         *
         * otherPipelines?.project contains fields specific to the calling endpoint:
         * - getReqSheetDataByID: Includes historical data, approval objects, all work details
         * - getAllCmReqSheet: Includes line/machine details, assigned users, request sheet reference
         * - getApprovalLogsForCM: Includes only approval arrays and rejection remarks
         *
         * Spread operator (...) merges endpoint-specific fields into final projection
         */
        ...otherPipelines?.project,
      },
    },
    /**
     * ADDITIONAL PIPELINE STAGES (if any)
     *
     * otherPipelines?.aggregationPipeline contains endpoint-specific pipeline stages
     * such as:
     * - Additional $match stages for status filtering (getAllCmReqSheet with selectedRSStatus)
     * - Additional $group stages for aggregation
     * - Additional $sort stages for specific ordering
     *
     * These are appended after base $project stage for flexibility
     */
    ...otherPipelines?.aggregationPipeline,
  ]);

  /**
   * ERROR HANDLING: NO DATA RESPONSE
   *
   * If aggregation pipeline returns empty array (no matching records):
   * 1. Check if filters were too restrictive
   * 2. Return 400 status (client error - filter constraint)
   * 3. Include empty array in response for UI consistency
   *
   * Common causes:
   * - Date range doesn't match any request sheets
   * - User has no permission for any sheets
   * - All sheets have status that doesn't match filter
   * - Machine/line has no request sheets
   */
  if (requestSheetData?.length === 0) {
    return res.status(400).json({
      message: "No data to display",
      reqSheetCM: requestSheetData,
    });
  }

  /**
   * DATA ATTACHMENT TO REQUEST OBJECT
   *
   * Store aggregation results in request object for next middleware/route handlers:
   *
   * req.requestSheetData: Final array of request sheets (with all computed fields)
   * req.lastQuarterOrSelectedQuarter: The quarter object used for current_commonDataFilledByAssignUser
   * req.otherPipelines: Complete pipeline configuration (for debugging/logging)
   *
   * Why store in req? Allows next middleware to access without re-querying:
   * - Faster response time (data already retrieved)
   * - Consistent data across middleware chain
   * - Allows middleware to manipulate/filter further if needed
   *
   * Next middleware will handle response formatting, permission checks, etc.
   */
  req.requestSheetData = requestSheetData;
  req.lastQuarterOrSelectedQuarter = lastQuarterOrSelectedQuarter;
  req.otherPipelines = otherPipelines;
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
        quarterlyDataOfTheCM: {
          $elemMatch: {
            "getDataForApprovalDashboard.Id": mongoose.Types.ObjectId(
              req.rootUser?._id,
            ),
          },
        },
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
  },
);

router.get(
  "/getAllCmReqSheet/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  tryCatchHandler(async (req, res, next) => {
    if (
      req.rootUser?.user_type === "Operator" &&
      !req?.queryObj?.requestSheetOfBMRef
    ) {
      req.queryObj = {
        ...req.queryObj,
        "commonDataFilledByAssignUser.quarterlyDataOfTheCM.assignUserForCM": {
          $elemMatch: {
            userRef: mongoose.Types.ObjectId(req.rootUser?._id),
          },
        },
      };
    }
    if (
      req.query?.selectedCategoryType &&
      req.query?.selectedCategoryType !== "undefined"
    ) {
      req.queryObj = {
        ...req?.queryObj,
        "cmBasicDataFilledByMTD_TL.categories":
          req?.query?.selectedCategoryType,
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
        $addFields: {
          current_commonDataFilledByAssignUser:
            req?.lastQuarterOrSelectedQuarter,
        },
      },
      ...req?.otherPipelines?.aggregationPipeline,
      {
        $group: {
          _id: null,
          total_request_sheet_count: {
            $sum: 1,
          },
          open_request_sheet_count: {
            $sum: {
              $cond: [
                {
                  $ne: [
                    "$current_commonDataFilledByAssignUser.requestSheetStatusOfCM",
                    "Completed",
                  ],
                },
                1,
                0,
              ],
            },
          },
          closed_request_sheet_count: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$current_commonDataFilledByAssignUser.requestSheetStatusOfCM",
                    "Completed",
                  ],
                },
                1,
                0,
              ],
            },
          },

          overhaulingCMCategory: {
            $sum: {
              $cond: [
                {
                  $eq: ["$cmBasicDataFilledByMTD_TL.categories", "Overhauling"],
                },
                1,
                0,
              ],
            },
          },
          upgradationCMCategory: {
            $sum: {
              $cond: [
                {
                  $eq: ["$cmBasicDataFilledByMTD_TL.categories", "Upgradation"],
                },
                1,
                0,
              ],
            },
          },
          BM_ReflectionCMCategory: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$cmBasicDataFilledByMTD_TL.categories",
                    "BM Reflection",
                  ],
                },
                1,
                0,
              ],
            },
          },
          othersCMCategory: {
            $sum: {
              $cond: [
                {
                  $eq: ["$cmBasicDataFilledByMTD_TL.categories", "Others"],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    successResponse(res, "Request-sheet fetched successfully", {
      reqSheetCM: req.requestSheetData,
      counters: counters?.[0],
    });
  }),
);

router.get(
  "/getCMRequestSheetHistoryData",
  authenticate,
  tryCatchHandler(async (req, res, next) => {
    req.queryObj = {
      commonDataFilledByAssignUser: {
        $elemMatch: {
          "preAggregationTimeStampOfRequestSheet.requestSheet_year":
            req.query?.selectedYear,
        },
      },
      machineRef: mongoose.Types.ObjectId(req.query?.machineId),
    };
    next();
  }),
  getRequestSheetData,
  tryCatchHandler(async (req, res, next) => {
    successResponse(res, "Request-sheet fetched successfully", {
      requestSheetData: req.requestSheetData,
    });
  }),
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
  }),
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
      targetDateOfCM,
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

    let pushOperation = null;

    if (approvalOfRequestSheet === "No") {
      updateObj.$set = {
        ...updateObj?.$set,
        [`${allKeys?.approvalObj}.approvalStatus`]: "Rejected",
        [`${req?.commonKey}.rejectedRemarksOfRequestSheet`]:
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
          pushOperation = {
            preAggregationTimeStampOfRequestSheet: {
              requestSheet_year: currentYear,
              requestSheet_month: gettingMonthForSelectedDate(newTargetDate),
            },
            quarterlyDataOfTheCM: { $each: quarterlyDataEntries },
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
          {
            "quarterFilter.requestSheet_quarter":
              getFinancialQuarter(targetDateOfCM),
          },
          { "userFilter._id": mongoose.Types.ObjectId(ObjForUserFilter?._id) },
        ],
        new: true,
      },
    );

    if (pushOperation) {
      await RequestSheetOfCM.findByIdAndUpdate(requestSheetID, {
        $push: {
          commonDataFilledByAssignUser: pushOperation,
        },
      });
    }

    successResponse(res, "Request-sheet approved successfully", {
      requestSheetOfCM,
    });
  }),
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
  },
);

router.get(
  `/getReqSheetDataForCalendar/:filter/:selectedId`,
  authenticate,
  filterMiddleware,
  async (req, res) => {
    try {
      delete req.queryObj[
        "preAggregationTimeStampOfRequestSheet.requestSheet_month"
      ];

      let findYearObject = [],
        weekFilteration = [];

      const toDate = new Date(req?.query?.toDate);

      // if (
      //   req?.query?.calendarViewType === "multiMonthYear" ||
      //   req?.query?.calendarViewType === "dayGridWeek" ||
      //   req?.query?.calendarViewType === "dayGridMonth"

      // ) {
      delete req.queryObj["commonDataFilledByAssignUser"];
      findYearObject = [
        {
          $addFields: {
            allQuartelyData: {
              $map: {
                input: {
                  $filter: {
                    input: "$commonDataFilledByAssignUser",
                    as: "yearWiseData",
                    cond: {
                      $in: [
                        "$$yearWiseData.preAggregationTimeStampOfRequestSheet.requestSheet_year",
                        [
                          req?.query?.selectedYear,
                          `${req?.query?.selectedYear?.split("-")[0] - 1}-${
                            req?.query?.selectedYear?.split("-")[0]
                          }`,
                        ],
                      ],
                    },
                  },
                },
                as: "filterQuatrlyData",
                in: {
                  $filter: {
                    input: "$$filterQuatrlyData.quarterlyDataOfTheCM",
                    as: "getParticularQuarter",
                    cond: {
                      $cond: [
                        {
                          $eq: [
                            "$$filterQuatrlyData.preAggregationTimeStampOfRequestSheet.requestSheet_year",
                            `${req?.query?.selectedYear?.split("-")[0] - 1}-${
                              req?.query?.selectedYear?.split("-")[0]
                            }`,
                          ],
                        },
                        {
                          $eq: [
                            "$$getParticularQuarter.requestSheet_quarter",
                            "Q4",
                          ],
                        },
                        {
                          $in: [
                            "$$getParticularQuarter.requestSheet_quarter",
                            ["Q1", "Q2", "Q3"],
                          ],
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
        {
          $unwind: "$allQuartelyData",
        },
        {
          $unwind: "$allQuartelyData",
        },
      ];
      // }
      // else {
      //   findYearObject.push({
      //     $addFields: {
      //       allQuartelyData: {
      //         $arrayElemAt: [
      //           {
      //             $filter: {
      //               input: {
      //                 $getField: {
      //                   field: "quarterlyDataOfTheCM",
      //                   input: {
      //                     $arrayElemAt: [
      //                       {
      //                         $filter: {
      //                           input: "$commonDataFilledByAssignUser",
      //                           as: "yearWiseData",
      //                           cond: {
      //                             $eq: [
      //                               "$$yearWiseData.preAggregationTimeStampOfRequestSheet.requestSheet_year",
      //                               req?.query?.selectedYear,
      //                             ],
      //                           },
      //                         },
      //                       },
      //                       0,
      //                     ],
      //                   },
      //                 },
      //               },
      //               as: "quarterWiseData",
      //               cond: {
      //                 // $lte: [
      //                 //   { $toDate: "$$quarterWiseData.targetDateOfCM" },
      //                 //   toDate,
      //                 // ],

      //                 $eq: [
      //                   "$$quarterWiseData.requestSheet_quarter",
      //                   //need to change this quarter when user select previous year filter
      //                   getFinancialQuarterByMonth(req?.query?.selectedMonth),
      //                 ],
      //               },
      //             },
      //           },
      //           0,
      //         ],
      //       },
      //     },
      //   });
      // }

      if (
        (req?.query?.calendarViewType === "dayGridWeek" ||
          req?.query?.calendarViewType === "dayGridMonth" ||
          req?.query?.calendarViewType === "dayGridDay") &&
        req?.query?.fromDate &&
        req?.query?.toDate
      ) {
        weekFilteration = [
          {
            $match: {
              $expr: {
                $and: [
                  // {
                  //   $gte: [
                  //     { $toDate: "$allQuartelyData.targetDateOfCM" },
                  //     fromDate,
                  //   ],
                  // },
                  {
                    $lte: [
                      { $toDate: "$allQuartelyData.targetDateOfCM" },
                      toDate,
                    ],
                  },
                ],
              },
            },
          },
        ];
      }
      const reqSheetDataForCalendar = await RequestSheetOfCM.aggregate([
        {
          $match: req?.queryObj,
        },
        ...findYearObject,
        ...weekFilteration,
        {
          $lookup: {
            from: "planttomachinehierarchies",
            localField: "plantToMachineHierarchyRef",
            foreignField: "_id",
            as: "plantToMachineHierarchy",
          },
        },
        {
          $project: {
            id: "$_id",
            _id: 0,
            machineNo: {
              $arrayElemAt: [
                "$plantToMachineHierarchy.machine.machine_code",
                0,
              ],
            },
            machineName: {
              $arrayElemAt: [
                "$plantToMachineHierarchy.machine.machine_name",
                0,
              ],
            },
            title: {
              $concat: [
                {
                  $arrayElemAt: [
                    "$plantToMachineHierarchy.machine.machine_name",
                    0,
                  ],
                },
                " - ",
                "$cmBasicDataFilledByMTD_TL.activityOfCM",
              ],
            },
            start: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: {
                  $toDate: {
                    $getField: {
                      field: "targetDateOfCM",
                      input: "$allQuartelyData",
                    },
                  },
                },
                timezone,
              },
            },
            end: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: {
                  $toDate: {
                    $getField: {
                      field: "activityEndDateOfCM",
                      input: "$allQuartelyData",
                    },
                  },
                },
                timezone,
              },
            },
            backgroundColor: {
              $cond: [
                {
                  $eq: ["$requestSheetOfBMRef", null],
                },
                "#FF9D23",
                "#D91656",
              ],
            },
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
  },
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
    let paginationCount = req?.query?.paginationCount * 1;
    let startYearOfLTPM = moment()
      .subtract(paginationCount, "years")
      .tz(timezone)
      .year();

    const currentDate = moment().tz(timezone);

    if (startYearOfLTPM === currentDate.year()) {
      if ([0, 1, 2]?.includes(currentDate.month())) {
        startYearOfLTPM -= 1;
        paginationCount += 1;
      }
    }

    const yearList = Array.from(
      { length: 5 },
      (_, i) => `${startYearOfLTPM + i}-${startYearOfLTPM + i + 1}`,
    );
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

    const { _id, LTPMApproval } = await Line.findOne(
      {
        _id: selectedId,
      },
      {
        LTPMApproval: 1,
      },
    );

    let otherPipeline = [
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
          _id: 1,
          "data.frequencyValue": 1,
          "data.inspectionItem": 1,
          "data.actionForLTPM": 1,
          "data.personForLTPM": 1,
          "data.commonDataFilledByAssignUser.preAggregationTimeStampOfRequestSheet": 1,
          "data.commonDataFilledByAssignUser.quarterlyDataOfTheCM.requestSheet_quarter": 1,
          "data.commonDataFilledByAssignUser.quarterlyDataOfTheCM.statusOfPlannedCM": 1,
          machineAllData: { $arrayElemAt: ["$machines", 0] },
        },
      },
    ];

    if (LTPMApproval.planningApproval.status === "Completed") {
      otherPipeline = [
        {
          $facet: {
            quarterlyPlannedUnplannedData: [
              {
                $group: {
                  _id: {
                    plantToMachineHierarchyRef: "$plantToMachineHierarchyRef",
                    _id: "$_id",
                  },
                  data: {
                    $push: {
                      frequencyValue:
                        "$cmBasicDataFilledByMTD_TL.frequencyValue",
                      inspectionItem:
                        "$cmBasicDataFilledByMTD_TL.inspectionItem",
                      actionForLTPM: "$cmBasicDataFilledByMTD_TL.actionForLTPM",
                      personForLTPM: "$cmBasicDataFilledByMTD_TL.personForLTPM",
                      commonDataFilledByAssignUser:
                        "$commonDataFilledByAssignUser",
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
                $project: {
                  _id: 1,
                  "data.frequencyValue": 1,
                  "data.inspectionItem": 1,
                  "data.actionForLTPM": 1,
                  "data.personForLTPM": 1,
                  "data.commonDataFilledByAssignUser.preAggregationTimeStampOfRequestSheet": 1,
                  "data.commonDataFilledByAssignUser.quarterlyDataOfTheCM.requestSheet_quarter": 1,
                  "data.commonDataFilledByAssignUser.quarterlyDataOfTheCM.statusOfPlannedCM": 1,
                  machineAllData: { $arrayElemAt: ["$machines", 0] },
                },
              },
            ],
            quarterlyTLAndHODApproval: [
              {
                $unwind: "$commonDataFilledByAssignUser",
              },
              {
                $unwind: "$commonDataFilledByAssignUser.quarterlyDataOfTheCM",
              },
              {
                $group: {
                  _id: {
                    requestSheet_year:
                      "$commonDataFilledByAssignUser.preAggregationTimeStampOfRequestSheet.requestSheet_year",
                    requestSheet_quarter:
                      "$commonDataFilledByAssignUser.quarterlyDataOfTheCM.requestSheet_quarter",
                  },
                  count: {
                    $sum: {
                      $cond: [
                        {
                          $eq: [
                            "$commonDataFilledByAssignUser.quarterlyDataOfTheCM.statusOfPlannedCM",
                            "Planned",
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                },
              },
            ],
          },
        },
      ];
    }

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
        $addFields: {
          commonDataFilledByAssignUser: {
            $map: {
              input: {
                $map: {
                  input: yearList,
                  as: "year",
                  in: {
                    $cond: [
                      {
                        $in: [
                          "$$year",
                          "$commonDataFilledByAssignUser.preAggregationTimeStampOfRequestSheet.requestSheet_year",
                        ],
                      },
                      {
                        $arrayElemAt: [
                          "$commonDataFilledByAssignUser",
                          {
                            $indexOfArray: [
                              "$commonDataFilledByAssignUser.preAggregationTimeStampOfRequestSheet.requestSheet_year",
                              "$$year",
                            ],
                          },
                        ],
                      },
                      {
                        preAggregationTimeStampOfRequestSheet: {
                          requestSheet_year: "$$year",
                          requestSheet_month: "",
                        },
                        quarterlyDataOfTheCM: [],
                      },
                    ],
                  },
                },
              },
              as: "outerObjData",
              in: {
                preAggregationTimeStampOfRequestSheet:
                  "$$outerObjData.preAggregationTimeStampOfRequestSheet",
                quarterlyDataOfTheCM: {
                  $map: {
                    input: QUARTER,
                    as: "quarter",
                    in: {
                      $cond: [
                        {
                          $in: [
                            "$$quarter",
                            "$$outerObjData.quarterlyDataOfTheCM.requestSheet_quarter",
                          ],
                        },
                        {
                          $arrayElemAt: [
                            "$$outerObjData.quarterlyDataOfTheCM",
                            {
                              $indexOfArray: [
                                "$$outerObjData.quarterlyDataOfTheCM.requestSheet_quarter",
                                "$$quarter",
                              ],
                            },
                          ],
                        },
                        {
                          requestSheet_quarter: "$$quarter",
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      },
      ...otherPipeline,
    ]);

    let otherResData = {
      data,
    };

    if (LTPMApproval.planningApproval.status === "Completed") {
      let quarterlyApprovalObj = [];

      for (let i = 0; i < data?.[0]?.quarterlyTLAndHODApproval.length; i++) {
        const element = data?.[0]?.quarterlyTLAndHODApproval[i];

        const approvalObjExist = LTPMApproval?.quarterlyApproval?.find(
          (item) =>
            item?.preAggregationTimeStampOfRequestSheet?.requestSheet_year ===
              element?._id?.requestSheet_year &&
            item?.preAggregationTimeStampOfRequestSheet
              ?.requestSheet_quarter === element?._id?.requestSheet_quarter,
        );

        if (approvalObjExist) {
          quarterlyApprovalObj.push(approvalObjExist);
        } else {
          let approval = {
            checkAndVerifyByMTD_TL: {},
            approveByHOD: {},
          };

          if (
            req?.rootUser?.user_type === "TL/HOSS" &&
            !LTPMApproval?.planningApproval?.status === "Completed"
          ) {
            approval.checkAndVerifyByMTD_TL = req?.rootUser;
          }

          quarterlyApprovalObj.push({
            preAggregationTimeStampOfRequestSheet: {
              requestSheet_year: element?._id?.requestSheet_year,
              requestSheet_quarter: element?._id?.requestSheet_quarter,
            },
            count: element?.count,
            ...approval,
          });
        }
      }
      quarterlyApprovalObj.sort((a, b) => {
        if (
          a.preAggregationTimeStampOfRequestSheet?.requestSheet_year?.split(
            "-",
          )?.[0] *
            1 !==
          b.preAggregationTimeStampOfRequestSheet?.requestSheet_year?.split(
            "-",
          )?.[0] *
            1
        ) {
          return (
            a.preAggregationTimeStampOfRequestSheet?.requestSheet_year?.split(
              "-",
            )?.[0] *
              1 -
            b.preAggregationTimeStampOfRequestSheet?.requestSheet_year?.split(
              "-",
            )?.[0] *
              1
          );
        }
        return (
          a.preAggregationTimeStampOfRequestSheet?.requestSheet_quarter?.slice(
            -1,
          ) *
            1 -
          b.preAggregationTimeStampOfRequestSheet?.requestSheet_quarter?.slice(
            -1,
          ) *
            1
        );
      });

      otherResData = {
        data: data?.[0]?.quarterlyPlannedUnplannedData,
        quarterlyApprovalObj,
      };
    }

    if (
      req?.rootUser?.user_type === "TL/HOSS" &&
      !LTPMApproval?.preparationApproval?.preparedByMTD_TL?.tm_name
    ) {
      LTPMApproval.preparationApproval.preparedByMTD_TL = req?.rootUser;
    }

    successResponse(res, "LTPM Line wise data get successfully", {
      paginationCount,
      ...otherResData,
      quarterList,
      yearList,
      lineId: _id,
      LTPMApproval,
    });
  }),
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
          checkByMTD_TL: {
            approvalStatus: "Pending",
            ...checkByMTD_TL,
          },
        },
        "LTPMApproval.preparationApprovalAndPlanPreparationMTD_HOS": {
          approvalStatus: "Pending",
          ...preparationApprovalAndPlanPreparationMTD_HOS,
        },
      },
      { new: true },
    );

    successResponse(res, "Preparation approval send successfully", {
      LTPMApproval,
    });
  }),
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
        "LTPMApproval.planningApproval.planAcceptedByPRD_HOS": {
          approvalStatus: "Pending",
          ...planAcceptedByPRD_HOS,
        },
      },
      { new: true },
    );

    successResponse(res, "Planning approval send successfully", {
      LTPMApproval,
    });
  }),
);

router.patch(
  "/sendQuarterlyApproval/:lineId",
  authenticate,
  tryCatchHandler(async (req, res, next) => {
    const { approveByHOD, approvalObj } = req.body;

    let quarterlyApproval = {
      ...approvalObj,
      status: "Under approval of MTD HOD",
      checkAndVerifyByMTD_TL: {
        userRef: req.rootUser?._id,
        tm_no: req.rootUser?.tm_no,
        user_type: req.rootUser?.user_type,
        tm_name: req.rootUser?.tm_name,
        email: req.rootUser?.email,
      },
      approveByHOD: {
        ...approveByHOD,
        approvalStatus: "Pending",
      },
    };

    await Line.findOneAndUpdate(
      { _id: req.params?.lineId },
      {
        $push: {
          "LTPMApproval.quarterlyApproval": quarterlyApproval,
        },
      },
      { new: true },
    );

    successResponse(res, "Quarterly approval send successfully", {
      quarterlyApproval,
    });
  }),
);

router.patch(
  "/acceptApproval/:phase/:lineId",
  authenticate,
  tryCatchHandler(async (req, res, next) => {
    const { status } = req.body;

    let updateObj = {},
      resObj = {},
      otherPipeline = { new: true };
    let resMsg = `${req?.params?.phase} approval completed successfully`;

    if (req?.params?.phase === "Preparation") {
      updateObj = {
        "LTPMApproval.preparationApproval.checkByMTD_TL.approvalStatus":
          "Accepted",
        "LTPMApproval.preparationApproval.status": "Under approval of MTD HOS",
      };

      if (status === "Under approval of MTD HOS") {
        updateObj = {
          "LTPMApproval.preparationApprovalAndPlanPreparationMTD_HOS.approvalStatus":
            "Accepted",
          "LTPMApproval.preparationApproval.status": "Completed",
          "LTPMApproval.planningApproval.status": status,
        };
      } else {
        resMsg = `${req?.params?.phase} approval accepted successfully`;
      }
    } else if (req?.params?.phase === "Planning") {
      updateObj = {
        "LTPMApproval.planningApproval.planAcceptedByPRD_HOS.approvalStatus":
          "Accepted",
        "LTPMApproval.planningApproval.status": "Completed",
      };
    } else {
      updateObj = {
        $set: {
          "LTPMApproval.quarterlyApproval.$[yearAndQuarterFilter].approveByHOD.approvalStatus":
            "Accepted",
          "LTPMApproval.quarterlyApproval.$[yearAndQuarterFilter].status":
            "Completed",
        },
      };

      otherPipeline = {
        arrayFilters: [
          {
            "yearAndQuarterFilter._id": mongoose.Types.ObjectId(
              req.query?._idForParticularYearAndQuarter,
            ),
          },
        ],
        new: true,
      };

      resObj = {
        quarterlyApproval: req.query,
      };
    }

    const { LTPMApproval } = await Line.findOneAndUpdate(
      { _id: req.params?.lineId },
      updateObj,
      otherPipeline,
    );

    if (req?.params?.phase !== "QuarterlyApproval") {
      resObj = {
        LTPMApproval,
      };
    }

    successResponse(res, resMsg, resObj);
  }),
);

router.get(
  "/getAllLineAndMachineForCM",
  authenticate,
  tryCatchHandler(async (req, res, next) => {
    const sectionDashboardLevel = await Section.findOne({
      section_id: req?.rootUser?.section_data?.split("-")?.[0],
    });

    let queryObj = {};
    if (sectionDashboardLevel?.dashboardLevel === "Yes") {
      queryObj = {
        section_names: sectionDashboardLevel?._id,
      };
    } else {
      const subSectionsData = await SubSection.find({
        subSection_id: {
          $in: req.rootUser?.subSection_data?.map(
            (item) => item?.split("-")?.[0],
          ),
        },
      });
      queryObj = {
        subSection_names: { $in: subSectionsData?.map((item) => item?._id) },
      };
    }
    const allLinesList = await Line?.find(
      {
        ...queryObj,
      },
      { line_name: 1 },
    );
    let allMachineRelatedToSelectedLine;
    if (req?.query?.line_names !== "undefined") {
      allMachineRelatedToSelectedLine = await Machine.find(
        {
          line_names: req?.query?.line_names,
        },
        {
          machine_name: 1,
        },
      );
    }

    successResponse(res, "Line data and machine data get6 successfully", {
      allLinesList,
      allMachineRelatedToSelectedLine,
    });
  }),
);

router.get(
  "/getDataOfPlanVsActualMonthWise/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  tryCatchHandler(async (req, res, next) => {
    console.log(req?.queryObj);
    const PlanVsActualMonthWiseDataForTheChartAndPPT =
      await RequestSheetOfCM.aggregate([
        {
          $match: {
            ...req?.queryObj,
            commonDataFilledByAssignUser: {
              $ne: undefined,
            },
          },
        },
        {
          $addFields: {
            getQuaterlyTargetDate: {
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
          },
        },
        {
          $unwind: "$getQuaterlyTargetDate",
        },
        {
          $match: {
            "getQuaterlyTargetDate.targetDateOfCM": {
              $ne: undefined,
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%m",
                date: {
                  $toDate: {
                    $getField: {
                      field: "targetDateOfCM",
                      input: "$getQuaterlyTargetDate",
                    },
                  },
                },
                timezone: timezone,
              },
            },
            plannedCountOfCM: {
              $sum: 1,
            },
            actualCountOfCM: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$getQuaterlyTargetDate.requestSheetStatusOfCM",
                      "Completed",
                    ],
                  },
                  1,
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
            planMonthWise: {
              name: "Plan",
              lables: MONTH_LABELS,
              values: {
                $map: {
                  input: ALL_MONTHS,
                  as: "month",
                  in: {
                    $cond: [
                      { $in: ["$$month.monthInDecimal", "$array._id"] },
                      {
                        $arrayElemAt: [
                          "$array.plannedCountOfCM",
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
            actualMonthWise: {
              name: "Actual",
              lables: MONTH_LABELS,
              values: {
                $map: {
                  input: ALL_MONTHS,
                  as: "month",
                  in: {
                    $cond: [
                      { $in: ["$$month.monthInDecimal", "$array._id"] },
                      {
                        $arrayElemAt: [
                          "$array.actualCountOfCM",
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
        },
      ]);

    successResponse(res, "Get data of PlanVsActualMonthWise successfully", {
      PlanVsActualMonthWiseDataForTheChartAndPPT,
    });
  }),
);

router.patch(
  "/updateAssignUser",
  authenticate,
  tryCatchHandler(async (req, res, next) => {
    let keyForUpdateTheAssignUserQuaterly =
        "commonDataFilledByAssignUser.$[yearFilter].quarterlyDataOfTheCM.$[quarterFilter].assignUserForCM",
      updateObj = {};

    updateObj.$set = {
      ...updateObj.$set,
      [`${commonKey}.requestSheetStatusOfCM`]: "Assigned",
      [`${commonKey}.assignUserForCM`]: req?.body?.data?.assignUserForCM?.map(
        (item) => {
          let userRef = item?._id;
          delete item["_id"];
          return {
            ...item,
            userRef,
          };
        },
      ),
    };

    const requestSheetOfCM = await RequestSheetOfCM.findOneAndUpdate(
      {
        _id: mongoose.Types.ObjectId(req?.query?.requestSheet_id),
      },
      updateObj,
      {
        arrayFilters: [
          {
            "yearFilter.preAggregationTimeStampOfRequestSheet.requestSheet_year":
              currentYear,
          },
          {
            "quarterFilter.requestSheet_quarter": getFinancialQuarter(
              req?.body?.data?.targetDateOfCM,
            ),
          },
        ],
        new: true,
      },
    );

    successResponse(res, "Assign user update successfully", {
      requestSheetOfCM,
    });
  }),
);

// safety form CRUD Operations
router
  .route("/cm/v1/safetyForm")
  .post(authenticate, async (req, res) => {
    try {
      const {
        cmSheetId,
        selectedYear,
        requestSheetRef, // quarter ID
      } = req.query;

      req.body["requestSheetRef"] = requestSheetRef;
      req.body["safetyFormFilledUpBy"] = req?.rootUser?.tm_name;

      await SafetyForm.create(req.body);

      const requestSheet = await RequestSheetOfCM.findOneAndUpdate(
        {
          _id: mongoose.Types.ObjectId(req?.query?.cmSheetId),
        },
        {
          $set: {
            ["commonDataFilledByAssignUser.$[yearFilter].quarterlyDataOfTheCM.$[quarterFilter].isSafetyFormSubmitted"]: true,
          },
        },
        {
          arrayFilters: [
            {
              "yearFilter.preAggregationTimeStampOfRequestSheet.requestSheet_year":
                selectedYear,
            },
            {
              "quarterFilter._id": requestSheetRef,
            },
          ],
          new: true,
          projection: {
            commonDataFilledByAssignUser: {
              $elemMatch: {
                "preAggregationTimeStampOfRequestSheet.requestSheet_year":
                  selectedYear,
                // quarterlyDataOfTheCM: {
                //   $elemMatch: {
                //     "quarterlyDataOfTheCM._id": requestSheetRef,
                //   },
                // },
              },
            },
          },
        },
      );

      let isEditableRS = false;

      const quarterData =
        requestSheet?.commonDataFilledByAssignUser?.[0]?.quarterlyDataOfTheCM.find(
          (q) => {
            if (q._id.toString() === requestSheetRef.toString()) {
              if (
                [
                  "Generated",
                  "Assigned",
                  "Fill Sheet",
                  "Rejected",
                  "Ongoing",
                ]?.includes(q.requestSheetStatusOfCM)
              ) {
                if (q?.isSafetyFormSubmitted) {
                  if (
                    q?.assignUserForCM &&
                    q?.assignUserForCM?.length > 0 &&
                    q?.assignUserForCM?.find(
                      (item) =>
                        item?.userRef?.toString() ===
                        req.rootUser?._id?.toString(),
                    )
                  ) {
                    isEditableRS = true;
                  } else if (
                    ["Generated", "Assigned"]?.includes(
                      q.requestSheetStatusOfCM,
                    ) &&
                    moment(q.targetDateOfCM).isBefore(moment())
                  ) {
                    isEditableRS = true;
                  }
                }
              } else
                isEditableRS =
                  q?.getDataForApprovalDashboard?.Id?.toString() ===
                  req.rootUser?._id?.toString();
            }
          },
        );

      return res
        .status(201)
        .json({ message: "Safety form added successfully", isEditableRS });
    } catch (error) {
      logger.error(error);
      res.status(500).json({ message: error?.message, error });
    }
  })
  .get(authenticate, async (req, res) => {
    try {
      const safetyForm = await SafetyForm.findOne(req.query);

      if (!safetyForm) return res.status(404).json({ message: "Not found!!!" });

      return res.status(201).json({ message: "Get successfully", safetyForm });
    } catch (error) {
      logger.error(error);
      res.status(500).json({ message: error?.message, error });
    }
  })
  .patch(authenticate, async (req, res) => {
    try {
      console.log(req.body);
    } catch (error) {
      logger.error(error);
      res.status(500).json({ message: error?.message, error });
    }
  });

// 🔹 GET all jobs
router.get("/jobs", async (req, res) => {
  try {
    const jobs = await Jobs.find().sort({ _id: -1 });
    res.json(jobs);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// 🔹 GET single job by ID
// ----------------------
router.get("/jobs/:id", async (req, res) => {
  try {
    const job = await Jobs.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// 🔹 ADD new job
// ----------------------
router.post("/jobs", async (req, res) => {
  try {
    const { job_name, job_content } = req.body;
    const newJob = new Jobs({ job_name, job_content: job_content || [] });
    await newJob.save();
    res.status(201).json(newJob);
  } catch (error) {
    console.error("Error adding job:", error);
    res.status(500).json({ message: "Failed to add job" });
  }
});

// 🔹 UPDATE job (name or content)
// ----------------------
router.put("/jobs/:id", async (req, res) => {
  try {
    const { job_name, job_content } = req.body;
    const updatedJob = await Jobs.findByIdAndUpdate(
      req.params.id,
      { job_name, job_content },
      { new: true }
    );
    if (!updatedJob) return res.status(404).json({ message: "Job not found" });
    res.json(updatedJob);
  } catch (error) {
    res.status(500).json({ message: "Failed to update job" });
  }
});

// 🔹 DELETE job
// ----------------------
router.delete("/jobs/:id", async (req, res) => {
  try {
    const deleted = await Jobs.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Job not found" });
    res.json({ message: "Job deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete job" });
  }
});

// 🔹 ADD sub job content
router.post("/jobs/:id/job-content", async (req, res) => {
  try {
    const { parent_job_name, expectedTime } = req.body;
    const job = await Jobs.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    job.job_content.push({ parent_job_name, expectedTime });
    await job.save();

    res.json(job); // 👈 return only new sub-job
  } catch (error) {
    res.status(500).json({ message: "Failed to add sub job content" });
  }
});

// 🔹 UPDATE specific sub job (by index)
router.put("/jobs/:id/job-content/:index", async (req, res) => {
  try {
    const { parent_job_name, expectedTime } = req.body;
    const job = await Jobs.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    if (job.job_content[req.params.index]) {
      job.job_content[req.params.index] = {
        parent_job_name,
        expectedTime,
      };
      await job.save();
      res.json(job);
    } else {
      res.status(404).json({ message: "Sub Job not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to update sub job content" });
  }
});

// 🔹 DELETE specific sub job (by sub job _id)
router.delete("/jobs/:id/job-content/:subJobId", async (req, res) => {
  try {
    const { id, subJobId } = req.params;

    const job = await Jobs.findById(id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    // Filter out the sub job with the given _id
    const initialLength = job.job_content.length;
    job.job_content = job.job_content.filter(
      (content) => content._id.toString() !== subJobId
    );

    // Check if any item was actually removed
    if (job.job_content.length === initialLength) {
      return res.status(404).json({ message: "Sub Job not found" });
    }

    await job.save();

    res.json(job);
  } catch (error) {
    console.error("Error deleting sub job:", error);
    res.status(500).json({ message: "Failed to delete sub job content" });
  }
});

// ✅ Multer setup (store only file name in schema)
const storageForRequestSheet = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./AttachedPhotosOfNewMachineCMByMTD/");
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}_${file.originalname}`;
    cb(null, uniqueName);
  },
});
const uploadForNewMachineRequestSheetOfCM = multer({
  storage: storageForRequestSheet,
});

/**
 * MIDDLEWARE: approvalSendMiddleware
 *
 * PURPOSE:
 * Helper function that builds MongoDB update operations for handling approval workflows.
 * Routes approval updates through either PUSH (add new approval) or SET (update existing approval)
 * operations based on whether this is a first-time approval or an update to an existing approver.
 *
 * PARAMETERS:
 * @param {string} key - The name of the approval field (e.g., "checkedByPED_HOS", "approvedByPED_HOD")
 * @param {object} specificUserObj - Contains approval info with structure:
 *                                   {
 *                                     AddNewOrUpdateExistingArrayField: { status: "ADD_NEW|UPDATE_EXISTING", refIdFOrUpdateExitingField: id },
 *                                     [key]: { userRef, tm_no, user_type, tm_name, email }
 *                                   }
 * @param {string} parentKeyOfObject - Parent path in schema (e.g., "newMachineRequestFilledByPED", "filledByMTD_User")
 * @param {object} updateObj - Mutable object collecting $push and $set operations: { _push: {}, _set: {} }
 * @param {array} otherArrayFilters - Array of MongoDB array filters for targeted nested updates
 * @param {string} isOtherFieldsEditableOrNot - "Yes" if fields are editable, "No" if locked (affects approval status)
 *
 * WORKFLOW:
 * This function implements TWO distinct update strategies based on approval state:
 *
 * ╔════════════════════════════════════════════════════════════════════════════════╗
 * ║ STRATEGY 1: $PUSH (Add New Approval Entry)                                      ║
 * ║ When: status="ADD_NEW" AND isOtherFieldsEditableOrNot="No"                     ║
 * ║ Use Case: First-time approval for this stage (creating new approver entry)      ║
 * ║ MongoDB: Appends new approval object to approval array                          ║
 * ║ Approval Status: "Pending" (waiting for user action)                            ║
 * ╚════════════════════════════════════════════════════════════════════════════════╝
 *
 * ╔════════════════════════════════════════════════════════════════════════════════╗
 * ║ STRATEGY 2: $SET (Update Existing Approval Entry)                               ║
 * ║ When: Any other scenario (ADD_NEW with fields editable, or UPDATE_EXISTING)   ║
 * ║ Use Case: Updating an existing approver's info (changing user, accepting, etc) ║
 * ║ MongoDB: Targets specific approval entry by _id using array filter             ║
 * ║ Approval Status: "Pending" by default, or "Accepted" if fields editable        ║
 * ╚════════════════════════════════════════════════════════════════════════════════╝
 *
 * KEY BEHAVIORS:
 * 1. Only processes if specificUserObj[key] exists (guard clause at start)
 * 2. Combines user approval info with common approval metadata (status, timestamp)
 * 3. Creates array filters to target the correct nested approval entry
 * 4. Handles status determination based on editability flag
 */
const approvalSendMiddleware = (
  key,
  specificUserObj,
  parentKeyOfObject,
  updateObj,
  otherArrayFilters,
  isOtherFieldsEditableOrNot
) => {
  // Guard clause: Only proceed if the approval field exists in request
  if (specificUserObj?.[key]) {
    // Extract the ADD_NEW/UPDATE_EXISTING status from request metadata
    const { AddNewOrUpdateExistingArrayField } = specificUserObj;

    // Extract user details that will be stored in approval record
    const userApprovalInfo = specificUserObj[key];

    // Standard metadata attached to every approval record
    let commonApprovalStatusObj = {
      approvalStatus: "Pending", // Initial approval state
      approvalDateAndTime: "", // Will be filled when approval is processed
    };

    // ========================================
    // STRATEGY 1: $PUSH - Add new approval entry to array
    // ========================================
    // This handles first-time approvals where no approval entry exists yet
    if (
      AddNewOrUpdateExistingArrayField?.status === "ADD_NEW" &&
      isOtherFieldsEditableOrNot === "No"
    ) {
      // Initialize $push object if not already present
      updateObj._push = updateObj._push || {};
      // Initialize $set object if not already present
      updateObj._set = updateObj._set || {};

      // Build the MongoDB $push operation: append new approval entry to array
      // Path: "newMachineRequestFilledByPED.checkedByPED_HOS" or similar
      updateObj._push[`${parentKeyOfObject}.${key}`] = {
        ...userApprovalInfo, // User details: userRef, tm_no, user_type, tm_name, email
        ...commonApprovalStatusObj, // Status: Pending, timestamp placeholder
      };
      // Early return: $push strategy is complete, skip $set logic below
      return;
    }

    // ========================================
    // STRATEGY 2: $SET - Update existing approval entry
    // ========================================
    // This handles updates to existing approvals (changing user, accepting, etc)

    // Build array filter placeholder: $[checkedByPED_HOSuserFilter] targets specific entry by _id
    let defaultKey = `${parentKeyOfObject}.${key}.$[${key}userFilter]`;

    // Initialize $set object if not already present
    updateObj._set = updateObj._set || {};

    // Set individual user fields in the targeted approval entry
    updateObj._set[`${defaultKey}.userRef`] = userApprovalInfo?.userRef;
    updateObj._set[`${defaultKey}.tm_no`] = userApprovalInfo?.tm_no;
    updateObj._set[`${defaultKey}.user_type`] = userApprovalInfo?.user_type;
    updateObj._set[`${defaultKey}.tm_name`] = userApprovalInfo?.tm_name;
    updateObj._set[`${defaultKey}.email`] = userApprovalInfo?.email;

    // If fields are marked as editable, mark approval as accepted immediately
    // Otherwise, keep as "Pending" (user will see approval in dashboard)
    if (isOtherFieldsEditableOrNot === "Yes") {
      updateObj._set[`${defaultKey}.approvalStatus`] = "Accepted";
    }

    // ========================================
    // Add array filter to identify the target approval entry
    // ========================================
    // MongoDB needs to know which approval entry to update by _id
    // Example: { "checkedByPED_HOSuserFilter._id": ObjectId("...") }
    otherArrayFilters.push({
      [`${key}userFilter._id`]: mongoose.Types.ObjectId(
        // The _id of the existing approval entry to update
        AddNewOrUpdateExistingArrayField?.refIdFOrUpdateExitingField
      ),
    });
  }
};

// ✅ Create / Update Request Sheet (New-Machine-CM)
/**
 * POST: /newMachineCM-requestSheets
 *
 * PURPOSE:
 * Creates a new request sheet for New Machine CM or updates an existing one.
 * Handles file uploads, approval workflow, and machine hierarchy assignment.
 *
 * MIDDLEWARE CHAIN:
 * 1. authenticate - Verify user is logged in
 * 2. findMachineUsing_id - Fetch machine details from query params
 * 3. findMachineDataWithParentHierarchy - Get parent hierarchy (line, cell, section, plant)
 * 4. findPlantToMachineHierarchyObj - Get machine hierarchy lookup reference
 * 5. uploadForNewMachineRequestSheetOfCM.any() - Handle multipart file uploads
 *
 * REQUEST BODY (multipart/form-data):
 * - payload: JSON string containing request sheet data
 * - files: Attached photos/documents (optional)
 * - Query params: _id (for updates), machineRef, statusOfNewRequestOfCM, etc.
 *
 * WORKFLOW:
 * 1. Parse request body (handles multipart/form-data)
 * 2. Extract machine hierarchy and build ID object
 * 3. Normalize modificationWork data (convert object to array)
 * 4. Process and attach uploaded files
 * 5. Check if update or create:
 *    - UPDATE: Handle approval middleware, merge data, perform two-phase update
 *    - CREATE: Generate request sheet number, create new document
 * 6. Return response with created/updated sheet
 */
router.post(
  "/newMachineCM-requestSheets",
  authenticate,
  findMachineUsing_id,
  findMachineDataWithParentHierarchy,
  findPlantToMachineHierarchyObj,
  uploadForNewMachineRequestSheetOfCM.any(),
  async (req, res) => {
    try {
      // ========================================
      // STEP 1: Parse request payload
      // ========================================
      let payload = {};
      // Handle multipart/form-data where JSON is stringified
      if (req.is("multipart/form-data")) {
        try {
          payload = req.body?.payload ? JSON.parse(req.body.payload) : {};
        } catch (err) {
          // If JSON parsing fails, start with empty payload
          payload = {};
        }
      }

      // ========================================
      // STEP 2: Build hierarchy ID object from middleware results
      // ========================================
      // This object stores references to all parent entities in the hierarchy
      // Used for filtering and organizing request sheets by hierarchy level
      if (req?.machine) {
        _idObject = {
          machineRef: req?.machine?._id, // Machine reference
          lineRef: req?.machine?.line_names?._id, // Parent line
          cellRef: req?.machine?.line_names?.cell_names?._id, // Parent cell
          subSectionRef:
            req?.machine?.line_names?.cell_names?.subSection_names?._id, // Parent subsection
          sectionRef:
            req?.machine?.line_names?.cell_names?.subSection_names
              ?.section_names?._id, // Parent section
          plantRef:
            req?.machine?.line_names?.cell_names?.subSection_names
              ?.section_names?.plant_names?._id, // Parent plant
        };
      }

      // ========================================
      // STEP 3: Normalize modificationWork data structure
      // ========================================
      // Convert modificationWork from object to array if needed
      // Frontend may send as object {0: {...}, 1: {...}} instead of array
      if (payload?.newMachineRequestFilledByPED?.modificationWork) {
        const mw = payload.newMachineRequestFilledByPED.modificationWork;

        // If it's already an array, keep it; otherwise convert object values to array
        payload.newMachineRequestFilledByPED.modificationWork = Array.isArray(
          mw
        )
          ? mw
          : Object.values(mw);
      }

      // ========================================
      // STEP 4: Process and attach uploaded files
      // ========================================
      // Files are uploaded for various nested fields (photos, documents, etc.)
      // Fieldname format: "parent.child[0].attachedPhotos" → navigate and attach filename
      if (req.files && req.files.length > 0) {
        req.files.forEach((file) => {
          // Split fieldname by dots to navigate nested structure
          const path = file.fieldname.split(".");
          let current = payload;

          for (let i = 0; i < path.length; i++) {
            const part = path[i];
            // Check if part includes array index: "key[0]" → extract key and index
            const match = part.match(/^([a-zA-Z0-9_]+)\[(\d+)\]$/);

            if (match) {
              // Handle array element: initialize as array and navigate to index
              const key = match[1];
              const index = parseInt(match[2]);
              current = current[key] = current[key] || [];
              current = current[index] = current[index] || {};
            } else if (i === path.length - 1) {
              // Last segment in path — this is the file attachment field (e.g., attachedPhotosByMTD)
              if (!Array.isArray(current[part])) {
                current[part] = [];
              }
              // Add uploaded filename to the array
              current[part].push(file.filename);
            } else {
              // Intermediate segment — navigate or create nested object
              current = current[part] = current[part] || {};
            }
          }
        });
      }

      // ========================================
      // STEP 5: CHECK IF UPDATE OR CREATE
      // ========================================
      // If _id in query params, update existing sheet; otherwise create new
      if (req?.query?._id) {
        // ========================
        // UPDATE SCENARIO
        // ========================
        let updateObj = {
          _set: {}, // Fields to set via $set operator
          // _push will be added if approval entries need to be added to arrays
        };
        let otherArrayFilters = []; // Array filters for targeted nested updates

        // Fetch existing sheet to ensure it exists
        const existingSheet = await NewMachineCM.findOne({
          _id: mongoose.Types.ObjectId(req?.query?._id),
        });

        // ========================================
        // STEP 5A: Process approval workflows
        // ========================================
        // Each approval stage (PED HOS, PED HOD, MTD HOS, MTD HOD) can be:
        // - PUSHED: Create new approval entry (if ADD_NEW status)
        // - SET: Update existing approval entry (if UPDATE_EXISTING status)

        // PED HOS Approval (first approval stage)
        if (payload?.PED_Filled_CheckedBy_PED_HOS) {
          approvalSendMiddleware(
            "checkedByPED_HOS",
            payload?.PED_Filled_CheckedBy_PED_HOS,
            "newMachineRequestFilledByPED",
            updateObj,
            otherArrayFilters,
            req?.query?.isOtherFieldsEditableOrNot
          );
          delete payload?.newMachineRequestFilledByPED?.checkedByPED_HOS;

          // If this is a fresh approval send, update dashboard with next approver info
          if (
            req?.query?.isOtherFieldsEditableOrNot !== "Yes" &&
            !req?.query?.getDataForApprovalDashboard
          )
            updateObj._set = {
              ...updateObj._set,
              getDataForApprovalDashboard: {
                Id: payload?.PED_Filled_CheckedBy_PED_HOS?.checkedByPED_HOS
                  ?.userRef,
                departmentAndGradeOfUser: "PED HOS",
              },
            };
        }

        // PED HOD Approval (second approval stage)
        if (payload?.PED_Filled_ApprovedBy_PED_HOD) {
          approvalSendMiddleware(
            "approvedByPED_HOD",
            payload?.PED_Filled_ApprovedBy_PED_HOD,
            "newMachineRequestFilledByPED",
            updateObj,
            otherArrayFilters,
            req?.query?.isOtherFieldsEditableOrNot
          );
          delete payload?.newMachineRequestFilledByPED?.approvedByPED_HOD;
        }

        // MTD HOS Approval (third approval stage)
        if (payload?.MTD_Modification_ApprovedByMTD_HOS) {
          approvalSendMiddleware(
            "modificationWork_ApprovedByMTD_HOS",
            payload?.MTD_Modification_ApprovedByMTD_HOS,
            "filledByMTD_User",
            updateObj,
            otherArrayFilters,
            req?.query?.isOtherFieldsEditableOrNot
          );
          delete payload?.filledByMTD_User?.modificationWork_ApprovedByMTD_HOS;
        }

        // MTD HOD Approval (fourth/final approval stage)
        if (payload?.MTD_Modification_ApprovedByMTD_HOD) {
          approvalSendMiddleware(
            "modificationWork_ApprovedByMTD_HOD",
            payload?.MTD_Modification_ApprovedByMTD_HOD,
            "filledByMTD_User",
            updateObj,
            otherArrayFilters,
            req?.query?.isOtherFieldsEditableOrNot
          );
          delete payload?.filledByMTD_User?.modificationWork_ApprovedByMTD_HOD;
        }

        // ========================================
        // STEP 5B: Determine next status
        // ========================================
        // Update status based on approval progress or explicit query parameter
        if (
          payload?.MTD_Modification_ApprovedByMTD_HOS
            ?.modificationWork_ApprovedByMTD_HOS &&
          !req?.query?.getDataForApprovalDashboard
        ) {
          // If MTD HOS approval exists, move to PED HOS approval stage
          updateObj._set["statusOfNewRequestOfCM"] = "Under PED HOS Approval";
        } else {
          // Otherwise use explicit status from query or default to "Ongoing"
          if (
            req?.query?.statusOfNewRequestOfCM === "Completed" ||
            req?.query?.statusOfNewRequestOfCM === "Rejected" ||
            req?.query?.getDataForApprovalDashboard
          ) {
            updateObj._set["statusOfNewRequestOfCM"] =
              req?.query?.statusOfNewRequestOfCM;
          } else {
            updateObj._set["statusOfNewRequestOfCM"] = "Ongoing";
          }
        }

        // ========================================
        // STEP 5C: Two-phase update (SET then PUSH)
        // ========================================
        // Phase 1: Update fields using $set operator
        let setObj = { ...payload, ...(updateObj._set || {}) },
          resultOfUpdatedSheet;

        resultOfUpdatedSheet = await NewMachineCM.findByIdAndUpdate(
          existingSheet._id,
          { $set: setObj },
          {
            arrayFilters: otherArrayFilters,
          }
        );

        // Phase 2: If $push operations exist, execute them in a second update
        // This handles adding new approval entries to nested arrays
        if (updateObj._push) {
          resultOfUpdatedSheet = await NewMachineCM.findByIdAndUpdate(
            existingSheet._id,
            { $push: updateObj._push },
            {
              arrayFilters: otherArrayFilters,
            }
          );
        }

        return res.json({
          message: "Existing Request Sheet updated successfully",
          resultOfUpdatedSheet,
        });
      }

      // ========================
      // CREATE SCENARIO
      // ========================
      // ========================================
      // STEP 6: Generate unique request sheet number
      // ========================================
      const machine = await Machine.findById(req?.query?.machineRef);
      if (!machine) {
        return res.status(404).json({ message: "Machine not found" });
      }

      // Generate globally unique request sheet number for this machine
      const newReqNo = await globalReqSheetNo(machine._id, "New-Machine-CM");
      payload.requestSheetNoOfNewMachineCM = newReqNo;
      payload.statusOfNewRequestOfCM = "Generated"; // Initial status

      // ========================================
      // STEP 7: Create new request sheet document
      // ========================================
      let requestSheetOfNewMachineCM = new NewMachineCM({
        ...payload, // All sheet data
        ..._idObject, // Hierarchy references
        preAggregationTimeStampOfRequestSheet: {
          requestSheet_year: currentYear,
          requestSheet_month: currentMonth,
        },
        plantToMachineHierarchyRef: req?.plantToMachineHierarchyRef,
        "newMachineRequestFilledByPED.preparedByPED_TL": {
          // Record who created the sheet
          userRef: mongoose?.Types?.ObjectId(req?.rootUser?._id),
          user_type: req?.rootUser?.user_type,
          tm_no: req?.rootUser?.tm_no,
          tm_name: req?.rootUser?.tm_name,
          email: req?.rootUser?.email,
        },
      });

      // ========================================
      // STEP 8: Save to database
      // ========================================
      const created = await requestSheetOfNewMachineCM.save();

      res.status(201).json({
        message: "New Request Sheet created successfully",
        data: created,
      });
    } catch (err) {
      console.error("❌ Error in /request-sheets:", err);
      res.status(500).json({
        message: "Error creating/updating request sheet",
        error: err.message,
      });
    }
  }
);

/**
 * MIDDLEWARE: getNewMachineCMRequestSheet
 *
 * PURPOSE:
 * This middleware aggregates and transforms request sheet data from MongoDB with:
 * - Approval status tracking (whether to add new or update existing approvers)
 * - Machine hierarchy lookup (cell, line, machine details)
 * - Editability determination based on user role and sheet status
 * - Preparation of data for the frontend approval workflow
 *
 * EXECUTION FLOW:
 * 1. Apply filters from req.queryObj
 * 2. Lookup machine hierarchy details
 * 3. Transform and calculate approval metadata
 * 4. Extract machine/line/cell information
 * 5. Store results in req.result for downstream handlers
 *
 * OUTPUT STRUCTURE:
 * Each document contains approval tracking info, hierarchy data, and editability flags
 */
const getNewMachineCMRequestSheet = tryCatchHandler(async (req, res, next) => {
  /**
   * HELPER FUNCTION: addFieldsForTheApprovalAddAndUpdate
   *
   * PURPOSE:
   * Dynamically generates MongoDB aggregation logic to determine if an approval field
   * should be treated as "ADD_NEW" (create new approval entry) or "UPDATE_EXISTING" (update current entry)
   *
   * LOGIC:
   * - If parent object is null → ADD_NEW (no approval section yet)
   * - If approval array is empty (size = 0) → ADD_NEW (first approval for this stage)
   * - If approval array has entries (size > 0) → Check last entry details
   *
   * PARAMETERS:
   * - commonKeyName: Path to parent object (e.g., "$newMachineRequestFilledByPED")
   * - key: Name of approval array (e.g., "checkedByPED_HOS")
   *
   * RETURNS:
   * MongoDB $cond expression with AddNewOrUpdateExistingArrayField status
   */
  const addFieldsForTheApprovalAddAndUpdate = (commonKeyName, key) => {
    // Extract the last approver details from the approval array
    let approvalUserDetails = {
      $last: `${commonKeyName}.${key}`,
    };

    return {
      // OUTER CONDITION: Check if parent object exists
      $cond: [
        { $gt: [commonKeyName, null] }, // Parent object exists?
        {
          // INNER CONDITION: Check if approval array is empty
          $cond: [
            {
              // Size check: is array empty (size <= 0)?
              $lte: [
                { $size: { $ifNull: [`${commonKeyName}.${key}`, []] } },
                0,
              ],
            },
            // ========================
            // BRANCH 1: Array is empty
            // ========================
            // Status: ADD_NEW (no approvals exist yet)
            {
              AddNewOrUpdateExistingArrayField: {
                status: "ADD_NEW",
                refIdFOrUpdateExitingField: "", // No existing ID to reference
              },
              [key]: {}, // Empty approval object for new entry
            },
            // ========================
            // BRANCH 2: Array has entries
            // ========================
            // Current logic: Always ADD_NEW (kept for future UPDATE_EXISTING logic)
            {
              $cond: [
                true, // **Future condition can replace "true" with specific logic**
                {
                  AddNewOrUpdateExistingArrayField: {
                    status: "ADD_NEW",
                    refIdFOrUpdateExitingField: "",
                  },
                  [key]: approvalUserDetails, // Get last approver's details
                },
                {
                  // Alternative: UPDATE_EXISTING (for future use)
                  AddNewOrUpdateExistingArrayField: {
                    status: "UPDATE_EXISTING",
                    refIdFOrUpdateExitingField: {
                      // Extract the _id of the last approver
                      $getField: {
                        field: "_id",
                        input: {
                          $last: `${commonKeyName}.${key}`,
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
        // ========================
        // BRANCH 3: Parent missing
        // ========================
        // Status: ADD_NEW (parent approval section doesn't exist)
        {
          AddNewOrUpdateExistingArrayField: {
            status: "ADD_NEW",
            refIdFOrUpdateExitingField: "",
          },
          [key]: {}, // Empty object for new approval section
        },
      ],
    };
  };

  /**
   * FUNCTION: isEditableRS (isEditable Request Sheet)
   *
   * PURPOSE:
   * Complex MongoDB expression that determines if current user can edit the request sheet
   *
   * EDITABLE CONDITIONS:
   * 1. Sheet status is in ["Generated", "Assigned", "Fill Sheet", "Rejected", "Ongoing"]
   * AND one of these is true:
   *    a) Sheet is "Generated" or "Assigned" AND no MTD TL assignments exist (first-time edit)
   *    b) Current user is assigned as MTD TL for this sheet
   * 2. OR: Current user is next approver (getDataForApprovalDashboard.Id matches current user)
   *
   * LOGIC FLOW:
   * - First check: Is status editable?
   * - Second check: Does user have edit permissions (unassigned OR user is assigned OR user is approver)
   */
  let isEditableRS = {
    $cond: [
      // OUTER CONDITION: Check if status is in editable list
      {
        $in: [
          "$statusOfNewRequestOfCM",
          ["Generated", "Assigned", "Fill Sheet", "Rejected", "Ongoing"],
        ],
      },
      {
        // INNER CONDITIONS: Multiple edit permission checks
        $or: [
          {
            // PERMISSION 1: First-time edit by MTD TL
            // Sheet is "Generated" or "Assigned" AND no MTD assignments yet
            $and: [
              {
                $in: ["$statusOfNewRequestOfCM", ["Generated", "Assigned"]],
              },
              {
                // Check if modificationWork_AssignedMTD_TL array is empty
                $eq: [
                  {
                    $cond: [
                      {
                        $isArray:
                          "$filledByMTD_User.modificationWork_AssignedMTD_TL",
                      },
                      {
                        $size:
                          "$filledByMTD_User.modificationWork_AssignedMTD_TL",
                      },
                      0,
                    ],
                  },
                  0,
                ],
              },
            ],
          },
          {
            // PERMISSION 2: User is assigned as MTD TL
            // Check if current user exists in the assigned TL list
            $ne: [
              {
                $filter: {
                  input: "$filledByMTD_User.modificationWork_AssignedMTD_TL",
                  as: "item",
                  cond: { $eq: ["$$item.userRef", req.rootUser?._id] },
                },
              },
              [], // Not empty = user found
            ],
          },
        ],
      },
      {
        // PERMISSION 3: User is next approver
        $eq: ["$getDataForApprovalDashboard.Id", req.rootUser?._id],
      },
    ],
  };

  // ========================================
  // AGGREGATION PIPELINE: Fetch and transform data
  // ========================================
  const result = await NewMachineCM?.aggregate([
    // STAGE 1: Filter documents based on query parameters
    {
      $match: {
        ...req?.queryObj, // Applied filters (section, line, cell, etc.)
      },
    },

    // STAGE 2: Lookup and join machine hierarchy data
    {
      $lookup: {
        from: "planttomachinehierarchies", // Collection to join
        localField: "plantToMachineHierarchyRef", // Field in current doc
        foreignField: "_id", // Field in lookup collection
        as: "plantToMachineHierarchy", // Output array name
      },
    },

    // STAGE 3: Project and transform data for frontend
    {
      $project: {
        // ============== BASIC REQUEST SHEET FIELDS ==============
        requestSheetNoOfNewMachineCM: 1, // Unique request sheet ID
        newMachineRequestFilledByPED: 1, // PED department data
        filledByMTD_User: 1, // MTD department data
        modificationConfirmationAfterCompletion: 1, // Completion confirmation
        SpecialComments: 1, // Additional comments
        statusOfNewRequestOfCM: 1, // Current approval stage status
        getDataForApprovalDashboard: 1, // Next approver's details

        // ============== COMPUTED EDITABILITY FLAG ==============
        isEditableRS, // Boolean: Can current user edit this sheet?

        // ============== APPROVAL TRACKING FIELDS ==============
        // Each approval stage needs to know whether to ADD_NEW or UPDATE_EXISTING
        PED_Filled_CheckedBy_PED_HOS: addFieldsForTheApprovalAddAndUpdate(
          "$newMachineRequestFilledByPED",
          "checkedByPED_HOS"
        ),
        PED_Filled_ApprovedBy_PED_HOD: addFieldsForTheApprovalAddAndUpdate(
          "$newMachineRequestFilledByPED",
          "approvedByPED_HOD"
        ),
        MTD_Modification_ApprovedByMTD_HOS: addFieldsForTheApprovalAddAndUpdate(
          "$filledByMTD_User",
          "modificationWork_ApprovedByMTD_HOS"
        ),
        MTD_Modification_ApprovedByMTD_HOD: addFieldsForTheApprovalAddAndUpdate(
          "$filledByMTD_User",
          "modificationWork_ApprovedByMTD_HOD"
        ),

        // ============== MACHINE HIERARCHY FIELDS ==============
        // Extract hierarchy information from joined document
        cell: {
          $arrayElemAt: ["$plantToMachineHierarchy.cell.cell_name", 0],
        },
        line: {
          $arrayElemAt: ["$plantToMachineHierarchy.line.line_name", 0],
        },
        machineId: {
          $arrayElemAt: ["$plantToMachineHierarchy.machine._id", 0],
        },
        machineNo: {
          $arrayElemAt: ["$plantToMachineHierarchy.machine.machine_code", 0],
        },
        machineName: {
          $arrayElemAt: ["$plantToMachineHierarchy.machine.machine_name", 0],
        },
      },
    },
  ]);

  // Store results in request object for downstream handlers
  req.result = result;
  next();
});

/**
 * GET: /getAllNewMachineCmReqSheet/:filter/:selectedId
 *
 * PURPOSE:
 * Retrieves all New Machine CM request sheets based on filter criteria.
 * Used to display a list of all request sheets with their complete details,
 * filtered by section, line, cell, or other hierarchy level.
 *
 * ROUTE PARAMETERS:
 * - :filter - The type of filter to apply (section, line, cell, etc.)
 * - :selectedId - The ID of the selected entity to filter by
 *
 * MIDDLEWARE CHAIN:
 * 1. authenticate: Verify user is logged in
 * 2. filterMiddleware: Build query filters based on filter type and selectedId
 * 3. Empty tryCatchHandler: Middleware pass-through (no additional processing)
 * 4. getNewMachineCMRequestSheet: Aggregate and transform data
 * 5. Final handler: Send response with all matching request sheets
 *
 * RESPONSE:
 * - Returns array of all request sheets matching the filter criteria
 * - Each sheet includes approval data, editability flags, and machine hierarchy
 * - No user-specific filtering (shows all sheets for the selected hierarchy level)
 */
router.get(
  "/getAllNewMachineCmReqSheet/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  tryCatchHandler(async (req, res, next) => {
    return next();
  }),
  getNewMachineCMRequestSheet,
  // getRequestSheetData,
  tryCatchHandler(async (req, res, next) => {
    // Send response with all request sheets matching the filter
    successResponse(res, "Request-sheet fetched successfully", {
      newMachineReqSheetCM: req.result, // Array of request sheets from aggregation
      // counters: counters?.[0],
    });
  })
);

/**
 * GET: /newMachineCM-requestSheets/:selectedId
 *
 * PURPOSE:
 * Retrieves a SINGLE specific request sheet by its ID.
 * Used when viewing detailed information about one particular request sheet.
 *
 * ROUTE PARAMETERS:
 * - :selectedId - The MongoDB ObjectId of the specific request sheet to fetch
 *
 * WORKFLOW:
 * 1. Extract :selectedId from route params
 * 2. Build query object to match only this specific document by _id
 * 3. Pass to getNewMachineCMRequestSheet aggregation pipeline
 * 4. Return single request sheet with all details
 *
 * KEY DIFFERENCE FROM /getAllNewMachineCmReqSheet:
 * - This endpoint is SINGLE DOCUMENT (returns one sheet)
 * - No filter criteria needed (direct ID lookup)
 * - Accessed when viewing detailed sheet information
 * - Returns first element: req?.result?.[0]
 *
 * RESPONSE:
 * - Single request sheet object with complete details
 * - Includes approval history, machine info, and all fields
 * - Returns null if sheet not found
 */
router.get(
  "/newMachineCM-requestSheets/:selectedId",
  // ✅ STEP 1: Authenticate user
  authenticate,

  // ✅ STEP 2: Build query object from route parameter
  tryCatchHandler(async (req, res, next) => {
    // Create MongoDB query to find exact document by ID
    req.queryObj = {
      _id: mongoose.Types.ObjectId(req.params?.selectedId),
    };
    return next();
  }),

  // ✅ STEP 3: Fetch and transform request sheet data
  getNewMachineCMRequestSheet,

  // ✅ STEP 4: Send single request sheet response
  tryCatchHandler(async (req, res) => {
    // Extract first element from aggregation result (there's only one)
    successResponse(res, "Request sheet fetched successfully", {
      requestSheet: req?.result?.[0], // Single request sheet object
    });
  })
);

/**
 * GET: /newMachineGetMachineRequestSheetDetailsForApprovalForCM/:filter/:selectedId
 *
 * PURPOSE:
 * Retrieves request sheets that are awaiting approval from the currently logged-in user.
 * This endpoint filters request sheets where the current user is the next approver in the workflow.
 *
 * ROUTE PARAMETERS:
 * - :filter - The type of filter to apply (e.g., section, line, cell, department)
 * - :selectedId - The ID of the selected entity to filter by
 *
 * WORKFLOW:
 * 1. Authenticate the user making the request
 * 2. Apply initial filters based on the filter type and selectedId
 * 3. Filter request sheets where current user is next approver
 * 4. Fetch detailed request sheet data with related hierarchy info
 * 5. Return the filtered results to the client
 *
 * RESPONSE DATA INCLUDES:
 * - Request sheet numbers and details
 * - PED (Production Engineering) approval information
 * - MTD (Manufacturing/Maintenance Technology) modification details
 * - Machine, Line, Cell, and other hierarchy information
 * - Editability flags and approval status
 */
router.get(
  "/newMachineGetMachineRequestSheetDetailsForApprovalForCM/:filter/:selectedId",
  // ✅ MIDDLEWARE 1: Authenticate the user
  authenticate,

  // ✅ MIDDLEWARE 2: Apply initial filters based on filter type and selectedId
  filterMiddleware,

  // ✅ MIDDLEWARE 3: Add additional filter for current approver
  tryCatchHandler(async (req, res, next) => {
    // 1️⃣ STEP 1: Extend the query object with current user's ID filter
    // This ensures we only fetch request sheets where:
    // getDataForApprovalDashboard.Id matches the currently logged-in user's ID
    // This means request sheets that are PENDING the current user's approval
    req.queryObj = {
      ...req?.queryObj, // Preserve existing filters from filterMiddleware
      "getDataForApprovalDashboard.Id": mongoose.Types.ObjectId(
        req.rootUser?._id // Convert user ID to MongoDB ObjectId
      ),
    };
    return next();
  }),

  // ✅ MIDDLEWARE 4: Fetch detailed request sheet data
  // Uses the getNewMachineCMRequestSheet aggregation pipeline to:
  // - Lookup machine hierarchy data
  // - Extract approval information
  // - Determine editability based on current user and request status
  // - Add computed fields for the approval workflow
  getNewMachineCMRequestSheet,

  // ✅ FINAL HANDLER: Send response with request sheet data
  async (req, res, next) => {
    try {
      // 2️⃣ STEP 2: Send successful response with filtered request sheets
      res.status(201).json({
        message: "Request-sheet data get successfully",
        requestSheetData: req.result, // Contains array of request sheets pending user's approval
      });
    } catch (error) {
      // 3️⃣ STEP 3: Handle any errors that occur during response
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      console.log(error);

      // Return error response with 500 status
      res
        .status(500)
        .json({ message: error?.message, error: new Error(error) });
    }
  }
);

/**
 * PATCH: /approveOrRejectNewMachineRequestSheet/:requestSheetID
 *
 * PURPOSE:
 * This endpoint handles the approval or rejection of a New Machine request sheet for CM (Corrective Maintenance).
 * It implements a multi-level approval workflow where requests move through different approval stages:
 * PED TL → PED HOS → PED HOD → MTD HOS → MTD HOD
 *
 * WORKFLOW:
 * 1. Validate that the request sheet exists
 * 2. Determine which department's approval is currently needed based on the current request status
 * 3. If APPROVED: Update approval status to "Accepted" and move request to next approval stage
 * 4. If REJECTED: Update approval status to "Rejected" and halt the workflow
 * 5. Update the approval tracking dashboard with the next approver's details
 *
 * DEPARTMENTS & APPROVERS:
 * - PED HOS (Production Engineering Department - Head of Section)
 * - PED HOD (Production Engineering Department - Head of Department)
 * - MTD HOS (Manufacturing/Maintenance Technology Department - Head of Section)
 * - MTD HOD (Manufacturing/Maintenance Technology Department - Head of Department)
 */
router.patch(
  "/approveOrRejectNewMachineRequestSheet/:requestSheetID",
  authenticate,
  tryCatchHandler(async (req, res, next) => {
    // 1️⃣ STEP 1: Extract and validate the request sheet ID
    const { requestSheetID } = req.params;

    // Check if request sheet exists in database
    const isRequestSheetExist = await NewMachineCM.findById(requestSheetID);

    if (!isRequestSheetExist) {
      return res.status(404).json({ message: "Request sheet not found" });
    }

    // 2️⃣ STEP 2: Extract approval data from request body
    const {
      // Approval user references (not used in this version, kept for compatibility)
      preparedByPED_TL,
      checkedByPED_HOS,
      approvedByPED_HOD,
      modificationWork_ApprovedByMTD_HOS,
      modificationWork_AssignedMTD_TL,
      modificationWork_ApprovedByMTD_HOD,

      // Main approval decision fields
      approvalOfRequestSheet, // "Yes" or "No"
      rejectedRemarksOfRequestSheet, // Rejection reason if rejected
      statusOfNewRequestOfCM, // Current approval stage status
    } = req.body;

    // 3️⃣ STEP 3: Determine the correct approval path based on current status
    // This switch identifies which approval array to update in the database based on current workflow stage
    let department, ObjForUserFilter;

    switch (statusOfNewRequestOfCM) {
      case "Under PED HOS Approval":
        // Target the PED HOS approval array within the PED section
        department = "newMachineRequestFilledByPED.checkedByPED_HOS";
        ObjForUserFilter = checkedByPED_HOS;
        break;

      case "Under PED HOD Approval":
        // Target the PED HOD approval array within the PED section
        department = "newMachineRequestFilledByPED.approvedByPED_HOD";
        ObjForUserFilter = approvedByPED_HOD;
        break;

      case "Under MTD HOS Approval":
        // Target the MTD HOS approval array within the MTD section
        department = "filledByMTD_User.modificationWork_ApprovedByMTD_HOS";
        ObjForUserFilter = modificationWork_ApprovedByMTD_HOS;
        break;

      case "Under MTD HOD Approval":
        // Target the MTD HOD approval array within the MTD section
        department = "filledByMTD_User.modificationWork_ApprovedByMTD_HOD";
        ObjForUserFilter = modificationWork_ApprovedByMTD_HOD;
        break;
    }

    // 4️⃣ STEP 4: Build the MongoDB update path using array filters
    // The $[userFilter] placeholder will be replaced with the actual approver's document
    const allKeys = {
      approvalObj: `${department}.$[userFilter]`,
    };

    // 5️⃣ STEP 5: Initialize update object with approval timestamp
    // Every approval action is timestamped for audit purposes
    let updateObj = {
      $set: {
        [`${allKeys?.approvalObj}.approvalDateAndTime`]: new Date(),
      },
    };

    // Empty approval dashboard object used when workflow ends (rejection or final approval)
    let NULL_Obj_getDataForApprovalDashboard = {
      Id: null,
      departmentAndGradeOfUser: null,
    };

    // 6️⃣ STEP 6: Handle REJECTION scenario
    if (approvalOfRequestSheet === "No") {
      // When rejected, update the approval record and halt the workflow
      updateObj.$set = {
        ...updateObj?.$set,
        [`${allKeys?.approvalObj}.approvalStatus`]: "Rejected", // Mark as rejected
        [`rejectedRemarksOfRequestSheet`]: rejectedRemarksOfRequestSheet, // Store rejection reason
        [`statusOfNewRequestOfCM`]: "Rejected", // End workflow status
        [`getDataForApprovalDashboard`]: NULL_Obj_getDataForApprovalDashboard, // Clear next approver
      };
    }
    // 7️⃣ STEP 7: Handle APPROVAL scenario - advance to next approval stage
    else if (approvalOfRequestSheet === "Yes") {
      // Determine the next approval stage and next approver
      let nextApprovalObj = {
        statusOfNewRequestOfCM: "",
        getDataForApprovalDashboard: NULL_Obj_getDataForApprovalDashboard,
      };

      // Define the workflow progression
      switch (statusOfNewRequestOfCM) {
        // STAGE 1 → STAGE 2: After PED HOS approves, send to PED HOD
        case "Under PED HOS Approval":
          nextApprovalObj.statusOfNewRequestOfCM = "Under PED HOD Approval";
          nextApprovalObj.getDataForApprovalDashboard = {
            Id: approvedByPED_HOD?.userRef, // Next approver's ID
            departmentAndGradeOfUser: approvedByPED_HOD?.user_type, // Next approver's designation
          };
          break;

        // STAGE 2 → STAGE 3: After PED HOD approves, send to MTD HOS
        case "Under PED HOD Approval":
          nextApprovalObj.statusOfNewRequestOfCM = "Under MTD HOS Approval";
          nextApprovalObj.getDataForApprovalDashboard = {
            Id: modificationWork_ApprovedByMTD_HOS?.userRef,
            departmentAndGradeOfUser:
              modificationWork_ApprovedByMTD_HOS?.user_type,
          };
          break;

        // STAGE 3 → STAGE 4: After MTD HOS approves, send to MTD HOD
        case "Under MTD HOS Approval":
          nextApprovalObj.statusOfNewRequestOfCM = "Under MTD HOD Approval";
          nextApprovalObj.getDataForApprovalDashboard = {
            Id: modificationWork_ApprovedByMTD_HOD?.userRef,
            departmentAndGradeOfUser:
              modificationWork_ApprovedByMTD_HOD?.user_type,
          };
          break;

        // STAGE 4 → FINAL: After MTD HOD approves, workflow is complete
        case "Under MTD HOD Approval":
          nextApprovalObj.statusOfNewRequestOfCM = "Assigned"; // Workflow complete, ready for assignment
          break;
      }

      // Update with acceptance and next stage details
      updateObj.$set = {
        ...updateObj?.$set,
        [`${allKeys?.approvalObj}.approvalStatus`]: "Accepted", // Mark current stage as accepted
        [`statusOfNewRequestOfCM`]: nextApprovalObj?.statusOfNewRequestOfCM, // Update to next stage
        [`getDataForApprovalDashboard`]:
          nextApprovalObj?.getDataForApprovalDashboard, // Notify next approver
      };
    }

    // 8️⃣ STEP 8: Execute the database update
    // Uses array filters to match:
    // - The correct fiscal year record
    // - The specific approver's document within the approval array
    const requestSheetOfNewMachineCM = await NewMachineCM.findOneAndUpdate(
      {
        _id: mongoose.Types.ObjectId(requestSheetID),
      },
      updateObj,
      {
        // Array filters allow us to update nested array elements
        arrayFilters: [
          {
            // Filter 1: Match the fiscal year record
            "yearFilter.preAggregationTimeStampOfRequestSheet.requestSheet_year":
              currentYear,
          },
          {
            // Filter 2: Match the specific approver within the approval array
            "userFilter._id": mongoose.Types.ObjectId(ObjForUserFilter?._id),
          },
        ],
        new: true, // Return the updated document
      }
    );

    // 9️⃣ STEP 9: Send success response with updated request sheet
    successResponse(res, "Request-sheet approved successfully", {
      requestSheetOfNewMachineCM,
    });
  })
);

module.exports = router;
