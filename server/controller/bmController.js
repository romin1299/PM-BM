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
const NoLossBD = require("../model/noLossBDSheetData");
const HandlingActions = require("../model/handlingActions");

const authenticate = require("../middleware/authenticate");
const cookieParser = require("cookie-parser");
const Plant = require("../model/plantSchema");
const factory = require("./handleFactory");
const sendMailForBD = require("../sendMailForBM/sendMailForBDRequestSheet");
const moment = require("moment-timezone");
const timezone = "Asia/Kolkata";
const truncValue = require("../utils/truncValue");
const sendMailForSpareRequest = require("../sendMailForBM/sendMailForSpareRequest");
const logger = require("../utils/LoggingController/loggers");
const maintenanceType = require("../utils/maintenanceType");

router.use(cookieParser());
// router.use(authenticate);

const {
  APPROVAL_LIST_OF_MINOR_MAJOR_OF_BM,
} = require("../GlobalData/RequestSheetApprovalStatus");
const SafetyForm = require("../model/safetyFormSchema");

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
    monthName: "June",
    monthInDecimal: "06",
  },
  {
    monthName: "July",
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

const gettingFYYearForSelectedDate = (date) => {
  if (moment(new Date(date)).tz("Asia/Kolkata").month() < 3) {
    return `${moment(new Date(date)).tz("Asia/Kolkata").year() - 1}-${moment(
      new Date(date)
    )
      .tz("Asia/Kolkata")
      .year()}`;
  }

  return `${moment(new Date(date)).tz("Asia/Kolkata").year()}-${
    moment(new Date(date)).tz("Asia/Kolkata").year() + 1
  }`;
};

const gettingMonthForSelectedDate = (date) =>
  monthKeyArray[moment(new Date(date)).tz("Asia/Kolkata").month()];

const generateDateFormateObj = (field) => ({
  $dateToString: {
    format: "%Y-%m-%dT%H:%M",
    date: field,
    timezone: "Asia/Kolkata",
  },
});

router.get(
  "/getDataBasedOnScanningRequest/:sheetType/:machineCode",
  authenticate,
  async (req, res, next) => {
    try {
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
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
    }
  }
);

const storageForDataSheetsOfBD = multer.diskStorage({
  destination: function (req, file, cb) {
    // console.log(file.fieldname);
    if (file.fieldname === "attachedDataSheets") {
      cb(null, "./DataSheetOfBD/");
    } else if (file.fieldname === "attachedDrawings") {
      cb(null, "./DrawingsOfBD/");
    } else if (file.fieldname === "attachedImagesOrVideoByPRDUser") {
      cb(null, "./ImagesOrVideoOfPRD/");
    } else if (file.fieldname === "attachedFilesForOtherLoss") {
      cb(null, "./OtherLossFiles/");
    }
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
  // limits: {
  //   fileSize: 1024 * 1024 * 5,
  // },
  // fileFilter: fileFilterOfDataSheetOfBD,
});

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

router.post(
  "/newRequestSheetRegistration",
  authenticate,
  dashboardLevelUserCheckMiddleware,
  uploadDataSheetsOfBD.fields([
    { name: "attachedDataSheets", maxCount: 1 },
    { name: "attachedDrawings", maxCount: 10 },
    { name: "attachedImagesOrVideoByPRDUser", maxCount: 10 },
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
          const getRequestSheetData = await RequestSheetOfBM.findOne({
            _id: mongoose.Types.ObjectId(req.query?.reqId),
          });
          const requestSheetDataFilledByMTDUser = JSON.parse(
            req.body.otherData
          );
          const prdDataUpdatedByOtherUser = JSON.parse(
            req?.body?.prdDataUpdatedByOtherUser
          );

          if (prdDataUpdatedByOtherUser) {
            let queryObjForUpdateDataByOtherUser = {
              priorityCode: requestSheetDataFilledByMTDUser?.priorityCode,
              qualityRelated: requestSheetDataFilledByMTDUser?.qualityRelated,
              // breakDownAttendedBy: req.rootUser._id,
              maintenanceType: requestSheetDataFilledByMTDUser?.maintenanceType,
              problemOccurredDateAndTimeOfBM:
                requestSheetDataFilledByMTDUser?.problemOccurredDateAndTimeOfBM,
              breakDownBasicDataFilledByPRD: {
                problemFaced: requestSheetDataFilledByMTDUser?.problemFaced,
                PRD_ObservationForProblem_5Why_1How:
                  requestSheetDataFilledByMTDUser?.PRD_ObservationForProblem_5Why_1How,
                why_5M_1E: requestSheetDataFilledByMTDUser?.why_5M_1E,
                where_process: requestSheetDataFilledByMTDUser?.where_process,
                when_frequency: requestSheetDataFilledByMTDUser?.when_frequency,
                who_person: requestSheetDataFilledByMTDUser?.who_person,
                which_defectLocation:
                  requestSheetDataFilledByMTDUser?.which_defectLocation,
                how_details: requestSheetDataFilledByMTDUser?.how_details,
              },
            };

            await Machine.findOneAndUpdate(
              { machine_code: machine.machine_code },
              {
                $addToSet: {
                  machine_problems_faced:
                    queryObjForUpdateDataByOtherUser
                      .breakDownBasicDataFilledByPRD.problemFaced,
                },
              },
              { new: true }
            );

            requestSheet = await RequestSheetOfBM.findOneAndUpdate(
              { _id: mongoose.Types.ObjectId(req.query?.reqId) },
              {
                $set: {
                  ...queryObjForUpdateDataByOtherUser,
                },
              },
              {
                new: true,
              }
            );

            if (requestSheet) {
              return res.status(201).json({
                message: `Request-sheet updated successfully ${requestSheet?.requestSheetNoOfBM}`,
                requestSheet,
              });
            }
          }

          const convertedData =
            requestSheetDataFilledByMTDUser?.categories &&
            Object.keys(requestSheetDataFilledByMTDUser?.categories)?.map(
              (key) => ({
                category: key,
                subCategory: requestSheetDataFilledByMTDUser?.categories?.[key],
              })
            );

          let queryObj = {
            // ...req.body,
            ..._idObject,
            "maintenanceReportFilledByMTD.workStartedDateOfBM":
              requestSheetDataFilledByMTDUser?.workStartedDateOfBM,
            "maintenanceReportFilledByMTD.workEndedDateOfBM":
              requestSheetDataFilledByMTDUser?.workEndedDateOfBM,
            "maintenanceReportFilledByMTD.refHandOverTime":
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
            "maintenanceReportFilledByMTD.breakDownTime":
              parseInt(requestSheetDataFilledByMTDUser?.breakDownTime) || 0,
            "maintenanceReportFilledByMTD.spareWaitingTime":
              parseInt(requestSheetDataFilledByMTDUser?.spareWaitingTime) || 0,
            "maintenanceReportFilledByMTD.replacementTime":
              parseInt(requestSheetDataFilledByMTDUser?.replacementTime) || 0,
            "maintenanceReportFilledByMTD.maintenanceTime":
              parseInt(requestSheetDataFilledByMTDUser?.maintenanceTime) || 0,
            "maintenanceReportFilledByMTD.analysisTime":
              parseInt(requestSheetDataFilledByMTDUser?.analysisTime) || 0,
            "maintenanceReportFilledByMTD.adjustmentTime":
              parseInt(requestSheetDataFilledByMTDUser?.adjustmentTime) || 0,
            "maintenanceReportFilledByMTD.qualityCheckTime":
              parseInt(requestSheetDataFilledByMTDUser?.qualityCheckTime) || 0,
            "maintenanceReportFilledByMTD.breakTime":
              parseInt(requestSheetDataFilledByMTDUser?.breakTime) || 0,
            "maintenanceReportFilledByMTD.minorBD":
              requestSheetDataFilledByMTDUser?.minorBD,
            "maintenanceReportFilledByMTD.majorBD":
              requestSheetDataFilledByMTDUser?.majorBD,
            "maintenanceReportFilledByMTD.firstTimeOrRepeat":
              requestSheetDataFilledByMTDUser?.firstTimeOrRepeat,
            sparePartUsedOrNot:
              requestSheetDataFilledByMTDUser?.changedParts?.length > 0
                ? "Yes"
                : "No",
            changedParts: requestSheetDataFilledByMTDUser?.changedParts,
            feedbackMTD_HOS: requestSheetDataFilledByMTDUser?.feedbackMTD_HOS,
            qualityConfirmed: requestSheetDataFilledByMTDUser?.qualityConfirmed,
            partQualityCheckedByMTD:
              requestSheetDataFilledByMTDUser?.partQualityCheckedByMTD,
            partQualityCheckedByPRD:
              requestSheetDataFilledByMTDUser?.partQualityCheckedByPRD,

            //for safety check
            machineSafetyCheckedByPRD:
              requestSheetDataFilledByMTDUser?.machineSafetyCheckedByPRD,
            machineSafetyCheckedByMTD:
              requestSheetDataFilledByMTDUser?.machineSafetyCheckedByMTD,
            requestSheetStatus:
              // requestSheetDataFilledByMTDUser?.submitDataWhileSendingApproval
              getRequestSheetData?.getDataForApprovalDashboard?.Id ||
              getRequestSheetData?.requestSheetStatus === "Completed" ||
              getRequestSheetData?.requestSheetStatus === "Rejected"
                ? getRequestSheetData?.requestSheetStatus
                : "Fill Sheet",
            // (
            //   requestSheetDataFilledByMTDUser?.validateValueForSubmitDataWhileSendingApproval
            //     ? getRequestSheetData?.requestSheetStatus
            //     : (getRequestSheetData?.assignUser?._id).toString() ===
            //         (req?.rootUser?._id).toString() ||
            //       (getRequestSheetData?.handOverUser?._id).toString() ===
            //         (req?.rootUser?._id).toString()
            // )
            //   ? "Fill Sheet"
            //   : getRequestSheetData?.requestSheetStatus,
            actionTemporaryOrNot:
              requestSheetDataFilledByMTDUser?.actionTemporaryOrNot,
            dataSheetOfRequestSheet:
              requestSheetDataFilledByMTDUser?.dataSheetOfRequestSheet,
            attachedDataSheets: dataSheet?.attachedDataSheets?.[0]?.filename,
            drawingOfRequestSheet:
              requestSheetDataFilledByMTDUser?.drawingOfRequestSheet,
            supportingTM: requestSheetDataFilledByMTDUser?.supportingTM,
            categoriesOfRequestSheet: convertedData,
            preventive_corrective_maintenance:
              requestSheetDataFilledByMTDUser?.preventive_corrective_maintenance,
            yokotenkai: requestSheetDataFilledByMTDUser?.yokotenkai,
          };

          //Remove data-sheet from local and database if No is selected
          if (
            getRequestSheetData?.attachedDataSheets &&
            requestSheetDataFilledByMTDUser?.dataSheetOfRequestSheet === "No"
          ) {
            fs.unlink(
              path.join(
                __dirname,
                `../DataSheetOfBD/${getRequestSheetData?.attachedDataSheets}`
              ),
              function (err) {
                if (err) {
                  console.error(err);
                } else {
                  console.log("Data-sheet file Removed Successfully");
                }
              }
            );

            await RequestSheetOfBM.findOneAndUpdate(
              { _id: mongoose.Types.ObjectId(req.query?.reqId) },
              {
                $unset: {
                  attachedDataSheets: "",
                },
              }
            );
          }

          //Remove drawings from local and database if No is selected
          if (
            getRequestSheetData?.attachedDrawings &&
            requestSheetDataFilledByMTDUser?.drawingOfRequestSheet === "No"
          ) {
            getRequestSheetData?.attachedDrawings?.map((drawingFileName) => {
              fs.unlink(
                path.join(__dirname, `../DrawingsOfBD/${drawingFileName}`),
                function (err) {
                  if (err) {
                    console.error(err);
                  } else {
                    console.log("Drawing files Removed Successfully");
                  }
                }
              );
            });

            await RequestSheetOfBM.findOneAndUpdate(
              { _id: mongoose.Types.ObjectId(req.query?.reqId) },
              {
                $unset: {
                  attachedDrawings: "",
                },
              }
            );
          }

          requestSheet = await RequestSheetOfBM.findOneAndUpdate(
            { _id: mongoose.Types.ObjectId(req.query?.reqId) },
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
            message: `Request-sheet updated successfully ${requestSheet?.requestSheetNoOfBM}`,
            requestSheet,
          });
        } else {
          const requestSheetDataFilledByPRDUser = JSON.parse(
            req.body.otherData
          );

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
            attachedImagesOrVideoByPRDUser,
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
                  .trim()
                  .substring(0, 2)
                  .toUpperCase()}-${(machine?.line_names?.line_name).trim()}-${
                  moment().tz("Asia/Kolkata").month() + 1
                }-${increaseCountOfRequestSheetInLine?.requestSheetNos}`.trim()
              : `${(machine?.line_names?.cell_names?.subSection_names?.subSection_name)
                  .trim()
                  .substring(0, 2)
                  .toUpperCase()}-${(machine?.line_names?.line_name).trim()}-${
                  moment().tz("Asia/Kolkata").month() + 1
                }-${increaseCountOfRequestSheetInLine?.requestSheetNos}`.trim();

          await Machine.findOneAndUpdate(
            { machine_code: machine.machine_code },
            {
              $addToSet: {
                machine_problems_faced:
                  requestSheetDataFilledByPRDUser?.problemFaced,
              },
            },
            { new: true }
          );

          requestSheet = new RequestSheetOfBM({
            ...req.query,
            ..._idObject,
            // ...req.body,
            requestSheetNoOfBM,
            requestSheetCreatedBy: req.rootUser._id,
            priorityCode: requestSheetDataFilledByPRDUser?.priorityCode,
            qualityRelated: requestSheetDataFilledByPRDUser?.qualityRelated,
            shiftOfBM: requestSheetDataFilledByPRDUser?.shiftOfBM,
            // breakDownAttendedBy: req.rootUser._id,
            maintenanceType:
              requestSheetDataFilledByPRDUser?.maintenanceType || "BM",
            problemOccurredDateAndTimeOfBM:
              requestSheetDataFilledByPRDUser?.problemOccurredDateAndTimeOfBM,
            sheetIssuedDateAndTimeOfBM: new Date(),
            attachedImagesOrVideoByPRDUser:
              dataSheet?.attachedImagesOrVideoByPRDUser?.map(
                (obj) => obj?.filename
              ),
            breakDownBasicDataFilledByPRD: {
              problemFaced: requestSheetDataFilledByPRDUser?.problemFaced,
              PRD_ObservationForProblem_5Why_1How:
                requestSheetDataFilledByPRDUser?.PRD_ObservationForProblem_5Why_1How,
              why_5M_1E: requestSheetDataFilledByPRDUser?.why_5M_1E,
              where_process: requestSheetDataFilledByPRDUser?.where_process,
              when_frequency: requestSheetDataFilledByPRDUser?.when_frequency,
              who_person: requestSheetDataFilledByPRDUser?.who_person,
              which_defectLocation:
                requestSheetDataFilledByPRDUser?.which_defectLocation,
              how_details: requestSheetDataFilledByPRDUser?.how_details,
            },
            preAggregationTimeStampOfRequestSheet: {
              requestSheet_year: gettingFYYearForSelectedDate(
                requestSheetDataFilledByPRDUser?.problemOccurredDateAndTimeOfBM
              ),
              requestSheet_month: gettingMonthForSelectedDate(
                requestSheetDataFilledByPRDUser?.problemOccurredDateAndTimeOfBM
              ),
            },
          });

          const newBDRequestSheetGenerate = await requestSheet.save();

          if (newBDRequestSheetGenerate) {
            //get MTD TL and MTD HOS of the assign section for sending mail when request-sheet is generated.
            const getMTDTL = await User.find(
              {
                ...req?.queryObj,
                tm_department: "MTD",
                user_type: "TL/HOSS",
              },
              { tm_no: 1, tm_name: 1, email: 1 }
            );

            const getMTDHOS = await User.find(
              {
                ...req?.queryObj,
                tm_department: "MTD",
                tm_grade: "HOS",
              },
              { tm_name: 1, line_names: 1, email: 1 }
            );

            let bodyTable = `<table style="font-family: arial, sans-serif;border-collapse: collapse;width: 100%;">

            <tr>
            <td style="border: 1px solid black;text-align: left;padding: 8px;">Cell/Product</td>
            <td style="border: 1px solid black;text-align: left;padding: 8px;">${
              machine?.line_names?.cell_names?.cell_name
            }</td>
            </tr>

            <tr style="background-color: #dddddd;">
            <td style="border: 1px solid black;text-align: left;padding: 8px;">Line</td>
            <td style="border: 1px solid black;text-align: left;padding: 8px;">${
              machine?.line_names?.line_name
            }</td>
            </tr>

            <tr>
                <td style="border: 1px solid black;text-align: left;padding: 8px;">Machine</td>
                <td style="border: 1px solid black;text-align: left;padding: 8px;">${
                  machine?.machine_name
                }</td>
            </tr>

            <tr style="background-color: #dddddd;">
                <td style="border: 1px solid black;text-align: left;padding: 8px;">Machine No.</td>
                <td style="border: 1px solid black;text-align: left;padding: 8px;">${
                  machine?.machine_code
                }</td>
            </tr>

            <tr>
            <td style="border: 1px solid black;text-align: left;padding: 8px;">Request Sheet No.</td>
            <td style="border: 1px solid black;text-align: left;padding: 8px;">${
              newBDRequestSheetGenerate?.requestSheetNoOfBM
            }</td>
            </tr>   

            <tr style="background-color: #dddddd;">
            <td style="border: 1px solid black;text-align: left;padding: 8px;">Problem Occurred Date and Time</td>
            <td style="border: 1px solid black;text-align: left;padding: 8px;">${moment(
              newBDRequestSheetGenerate?.problemOccurredDateAndTimeOfBM
            )
              .tz("Asia/Kolkata")
              .format("DD-MM-YYYY THH:mm")}</td>
            </tr>

            <tr>
            <td style="border: 1px solid black;text-align: left;padding: 8px;">Problem</td>
            <td style="border: 1px solid black;text-align: left;padding: 8px;">${
              newBDRequestSheetGenerate?.breakDownBasicDataFilledByPRD
                ?.problemFaced
            }</td>
            </tr>

            <tr style="background-color: #dddddd;">
            <td style="border: 1px solid black;text-align: left;padding: 8px;">Request Sheet Status</td>
            <td style="border: 1px solid black;text-align: left;padding: 8px;">${
              newBDRequestSheetGenerate?.requestSheetStatus
            }</td>
            </tr>

            <tr>
            <td style="border: 1px solid black;text-align: left;padding: 8px;">Work Order Status</td>
            <td style="border: 1px solid black;text-align: left;padding: 8px;">${
              newBDRequestSheetGenerate?.work_order_status
            }</td>
            </tr>

        </table>`;

            sendMailForBD({
              subject: `Request Sheet is generated (${machine?.line_names?.cell_names?.cell_name}/${machine?.line_names?.line_name}/${machine?.machine_name}/${newBDRequestSheetGenerate?.requestSheetNoOfBM})`,
              title: `Request sheet is generated`,
              greetings: `Sir\\Ma'am`,
              toEmailIds: getMTDTL?.map((obj) => obj?.email),
              ccEmailIds: getMTDHOS?.map((obj) => obj?.email),
              bodyTable,
            });

            res.status(201).json({
              message: "Request-sheet generated successfully",
              requestSheet,
            });
          }
        }
      } else {
        res.status(404).json({ message: "Request-sheet not generated" });
      }
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      console.log(error);
      res.status(500).json({ message: error?.message, error });
    }
  }
);

const findRequestSheetMiddleware = async (req, res, next) => {
  try {
    // const page = parseInt(req.query.page) || 1; // Default to page 1
    // const pageSize = parseInt(req.query.pageSize) || 10; // Default to 10 records per page

    // // Calculate the number of documents to skip
    // const skip = (page - 1) * pageSize;

    // // Get the total number of documents (for pagination)
    // const total = await RequestSheetOfBM.countDocuments();

    const requestSheetData = await RequestSheetOfBM.aggregate([
      ...req.queryPipeline,
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
          localField: "machineSafetyCheckedByPRD",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                tm_name: 1,
                tm_no: 1,
                email: 1,
              },
            },
          ],
          as: "safetyNamePRD",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "machineSafetyCheckedByMTD",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                tm_name: 1,
                tm_no: 1,
                email: 1,
              },
            },
          ],
          as: "safetyNameMTD",
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
          localField: "handOverUser",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                user_type: 1,
                tm_name: 1,
                email: 1,
              },
            },
          ],
          as: "handoverUserDetails",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "approvalOfMTD_SL",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                user_type: 1,
                tm_name: 1,
                email: 1,
              },
            },
          ],
          as: "approvalOfMTD_SL",
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
                tm_name: 1,
                email: 1,
              },
            },
          ],
          as: "requestSheetCreatedBy",
        },
      },
      {
        $sort: { _id: -1 },
      },

      // { $skip: skip },
      // { $limit: pageSize },
      {
        $project: {
          IsSafetyFormCreated: 1,
          machines: 1,
          maintenanceType: 1,
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
          assignUserEmail: {
            $arrayElemAt: ["$namesOperators.email", 0],
          },
          handOverUser: {
            $arrayElemAt: ["$handoverUserDetails.tm_name", 0],
          },
          handOverUserId: {
            $arrayElemAt: ["$handoverUserDetails._id", 0],
          },
          handOverUserEmail: {
            $arrayElemAt: ["$handoverUserDetails.email", 0],
          },
          approvalOfMTD_SL: {
            $arrayElemAt: ["$approvalOfMTD_SL", 0],
          },
          requestSheetCreatedByForSendingEmail: {
            $arrayElemAt: ["$requestSheetCreatedBy", 0],
          },
          handOverTimeForDefault:
            "$maintenanceReportFilledByMTD.refHandOverTime",
          handOverTime: {
            $dateToString: {
              format: "%d-%m-%Y T%H:%M",
              date: "$maintenanceReportFilledByMTD.refHandOverTime",
              timezone: "Asia/Kolkata",
            },
          },
          lossTime: "$maintenanceReportFilledByMTD.breakDownTime",
          work_order_status: 1,
          requestSheetStatus: 1,
          MTDUser: { $arrayElemAt: ["$namesMTD.tm_name", 0] },
          problem: "$breakDownBasicDataFilledByPRD.problemFaced",
          // problemOccurredDateAndTimeOfBM:
          problemOccurredDateAndTimeOfBM: {
            $dateToString: {
              format: "%d-%m-%Y T%H:%M",
              date: "$problemOccurredDateAndTimeOfBM",
              timezone: "Asia/Kolkata",
            },
          },
          "maintenanceReportFilledByMTD.workEndedDateOfBM": 1,
          firstTimeOrRepeat: "$maintenanceReportFilledByMTD.firstTimeOrRepeat",
          partQualityStatusOfPRD: 1,
          finalActivity: 1,
          statusPRD_TL: 1,
          //for safety
          machineSafetyCheckedByPRD: { $arrayElemAt: ["$safetyNamePRD", 0] },
          machineSafetyCheckedByMTD: { $arrayElemAt: ["$safetyNameMTD", 0] },
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
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error: new Error(error) });
  }
};
router.patch(
  "/updateRequestSheet",
  authenticate,
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

      // if (req.rootUser?.tm_department !== "MTD") {
      //   return res.status(401).json({
      //     message: "You are not valid user",
      //   });
      // }

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
          requestSheetStatus: statusArray[1],
          approvalOfMTD_SL: req?.rootUser?._id,
          approvalDateAndTimeOfMTD_SL: new Date(),
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
        let timeDifferenceMinutes = moment(
          req.body?.handOverTime !== null
            ? moment(req.body?.handOverTime, true).isValid()
              ? new Date(req?.body?.handOverTime)
              : moment(req.body?.handOverTime, "DD-MM-YYYY [T]HH:mm").toDate()
            : new Date()
        )
          .tz("Asia/Kolkata")
          .diff(
            moment(isRequestSheetExist?.problemOccurredDateAndTimeOfBM).tz(
              "Asia/Kolkata"
            ),
            "minutes"
          );

        let workEndedDateOfBM =
          req.body?.handOverTime !== null
            ? moment(req.body?.handOverTime, true).isValid()
              ? new Date(req?.body?.handOverTime)
              : moment(req.body?.handOverTime, "DD-MM-YYYY [T]HH:mm").toDate()
            : new Date();

        let firstWordOfFinalAction = req.body?.finalActivity?.split(" ")[0];
        queryObj = {
          finalActivity: req.body?.finalActivity.replace(
            firstWordOfFinalAction,
            firstWordOfFinalAction?.charAt(0)?.toUpperCase() +
              firstWordOfFinalAction?.substring(1).toLowerCase()
          ),
          "maintenanceReportFilledByMTD.workEndedDateOfBM": workEndedDateOfBM,
          "maintenanceReportFilledByMTD.refHandOverTime": workEndedDateOfBM,
          requestSheetStatus,
          "maintenanceReportFilledByMTD.breakDownTime": timeDifferenceMinutes,
          dataSheetOfRequestSheet: timeDifferenceMinutes > 120 && "Yes",
          work_order_status: req.body?.work_order_status,
        };
        if (mongoose.Types.ObjectId.isValid(req.body?.handOverUser))
          queryObj = {
            ...queryObj,
            handOverUser: req.body?.handOverUser,
          };
      }
      const updateRequestSheetData = await RequestSheetOfBM.findOneAndUpdate(
        req.query,
        {
          $set: queryObj,
        },
        {
          new: true,
        }
      );

      req.updateRequestSheetData = updateRequestSheetData;
      req.queryObjForSendingEmailValidation = queryObj;

      req.queryPipeline = [
        {
          $match: {
            _id: mongoose.Types.ObjectId(req.query._id),
          },
        },
      ];

      next();
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res
        .status(500)
        .json({ message: error?.message, error: new Error(error) });
    }
  },
  findRequestSheetMiddleware,
  dashboardLevelUserCheckMiddleware,
  async (req, res, next) => {
    if (req.updateRequestSheetData) {
      const bodyContent = ({ key, value }) => {
        return `<table style="font-family: arial, sans-serif;border-collapse: collapse;width: 100%;">
  
        <tr>
        <td style="border: 1px solid black;text-align: left;padding: 8px;">Cell/Product</td>
        <td style="border: 1px solid black;text-align: left;padding: 8px;">${req.requestSheetData?.[0]?.cell}</td>
        </tr>
  
        <tr style="background-color: #dddddd;">
        <td style="border: 1px solid black;text-align: left;padding: 8px;">Line</td>
        <td style="border: 1px solid black;text-align: left;padding: 8px;">${req.requestSheetData?.[0]?.line}</td>
        </tr>
  
        <tr>
            <td style="border: 1px solid black;text-align: left;padding: 8px;">Machine</td>
            <td style="border: 1px solid black;text-align: left;padding: 8px;">${req.requestSheetData?.[0]?.machineName}</td>
        </tr>
  
        <tr style="background-color: #dddddd;">
            <td style="border: 1px solid black;text-align: left;padding: 8px;">Machine No.</td>
            <td style="border: 1px solid black;text-align: left;padding: 8px;">${req.requestSheetData?.[0]?.machineNo}</td>
        </tr>
  
        <tr>
        <td style="border: 1px solid black;text-align: left;padding: 8px;">Request Sheet No.</td>
        <td style="border: 1px solid black;text-align: left;padding: 8px;">${req.requestSheetData?.[0]?.requestSheetNoOfBM}</td>
        </tr>   
  
        <tr style="background-color: #dddddd;">
        <td style="border: 1px solid black;text-align: left;padding: 8px;">${key}</td>
        <td style="border: 1px solid black;text-align: left;padding: 8px;">${value}</td>
        </tr>
  
        <tr>
        <td style="border: 1px solid black;text-align: left;padding: 8px;">Request Sheet Status</td>
        <td style="border: 1px solid black;text-align: left;padding: 8px;">${req.requestSheetData?.[0]?.requestSheetStatus}</td>
        </tr>
  
        <tr style="background-color: #dddddd;">
        <td style="border: 1px solid black;text-align: left;padding: 8px;">Work Order Status</td>
        <td style="border: 1px solid black;text-align: left;padding: 8px;">${req.requestSheetData?.[0]?.work_order_status}</td>
        </tr>
  
    </table>`;
      };

      //get MTD TL of the assign section for sending mail when request-sheet is generated.
      const getMTDTL = await User.find(
        {
          ...req?.queryObj,
          tm_department: "MTD",
          user_type: "TL/HOSS",
        },
        { tm_no: 1, tm_name: 1, email: 1 }
      );

      const getMTDHOS = await User.find(
        {
          ...req?.queryObj,
          tm_department: "MTD",
          tm_grade: "HOS",
        },
        { tm_name: 1, line_names: 1, email: 1 }
      );

      if (
        req?.queryObjForSendingEmailValidation?.hasOwnProperty("assignUser") &&
        req.requestSheetData?.[0]?.assignUserEmail
      ) {
        let bodyTable = bodyContent({
          key: "Assign User",
          value: req.requestSheetData?.[0]?.assignUser,
        });
        sendMailForBD({
          subject: `Request Sheet is assign (${req.requestSheetData?.[0]?.cell}/${req.requestSheetData?.[0]?.line}/${req.requestSheetData?.[0]?.machineName}/${req.requestSheetData?.[0]?.requestSheetNoOfBM})`,
          title: `Request sheet is assign`,
          greetings: `Sir\\Ma'am`,
          toEmailIds: [
            req.requestSheetData?.[0]?.assignUserEmail,
            req.requestSheetData?.[0]?.requestSheetCreatedByForSendingEmail
              ?.email,
          ],
          ccEmailIds: getMTDTL
            ?.map((obj) => obj?.email)
            .concat(getMTDHOS?.map((obj) => obj?.email)),
          bodyTable: bodyTable,
        });
      } else if (
        req?.queryObjForSendingEmailValidation?.hasOwnProperty(
          "handOverUser"
        ) &&
        req.requestSheetData?.[0]?.handOverUserEmail
      ) {
        let bodyTable = bodyContent({
          key: "Handover User",
          value: req.requestSheetData?.[0]?.handOverUser,
        });
        sendMailForBD({
          subject: `Request Sheet is handover (${req.requestSheetData?.[0]?.cell}/${req.requestSheetData?.[0]?.line}/${req.requestSheetData?.[0]?.machineName}/${req.requestSheetData?.[0]?.requestSheetNoOfBM})`,
          title: `Request sheet is handover`,
          greetings: `Sir\\Ma'am`,
          toEmailIds: [
            req.requestSheetData?.[0]?.handOverUserEmail,
            req.requestSheetData?.[0]?.requestSheetCreatedByForSendingEmail
              ?.email,
          ],
          ccEmailIds: getMTDTL
            ?.map((obj) => obj?.email)
            .concat(getMTDHOS?.map((obj) => obj?.email)),
          bodyTable: bodyTable,
        });
      } else if (req.body?.work_order_status === "Closed") {
        let bodyTable = bodyContent({
          key: "MTD S.L.",
          value: req.requestSheetData?.[0]?.approvalOfMTD_SL?.tm_name,
        });
        sendMailForBD({
          subject: `Request Sheet Work Order Closed (${req.requestSheetData?.[0]?.cell}/${req.requestSheetData?.[0]?.line}/${req.requestSheetData?.[0]?.machineName}/${req.requestSheetData?.[0]?.requestSheetNoOfBM})`,
          title: `Request Sheet work order is closed`,
          greetings: `Sir\\Ma'am`,
          toEmailIds:
            req.requestSheetData?.[0]?.requestSheetCreatedByForSendingEmail
              ?.email,
          ccEmailIds: getMTDTL
            ?.map((obj) => obj?.email)
            .concat(getMTDHOS?.map((obj) => obj?.email)),
          bodyTable: bodyTable,
        });
      }
    }

    res.status(201).json({
      message: `Request-sheet updated successfully ${req.requestSheetData?.[0]?.requestSheetNoOfBM}`,
      requestSheet: req.requestSheetData?.[0],
    });
  }
);

router.patch(
  "/updateRequestSheetForAnyStatus/:machineId",
  authenticate,
  async (req, res, next) => {
    try {
      if (
        req.rootUser?.isAuthorizedUserForUpdatingRequestSheetInAnyStatus ===
        "No"
      ) {
        return res
          .status(401)
          .json({ message: "Unauthorized to update request-sheet!!!" });
      }
      next();
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res
        .status(500)
        .json({ message: error?.message, error: new Error(error) });
    }
  },
  uploadDataSheetsOfBD.fields([
    { name: "attachedDataSheets", maxCount: 1 },
    { name: "attachedDrawings", maxCount: 10 },
  ]),
  async (req, res, next) => {
    try {
      let updatedDataObj = JSON.parse(req.body?.finalData);

      if (
        req.files?.attachedDataSheets?.[0]?.filename ||
        req.files?.attachedDrawings
      ) {
        const requestSheet = await RequestSheetOfBM.findOne(req.query);

        if (req.files?.attachedDataSheets?.[0]?.filename) {
          fs.unlink(
            path.join(
              __dirname,
              `../DataSheetOfBD/${requestSheet?.attachedDataSheets}`
            ),
            function (err) {
              if (err) {
                console.error(err);
              } else {
                console.log("Data-sheet file Removed Successfully");
              }
            }
          );

          updatedDataObj["attachedDataSheets"] =
            req.files?.attachedDataSheets?.[0]?.filename;
        }

        if (req.files?.attachedDrawings) {
          requestSheet?.attachedDrawings?.map((drawingFileName) => {
            fs.unlink(
              path.join(__dirname, `../DrawingsOfBD/${drawingFileName}`),
              function (err) {
                if (err) {
                  console.error(err);
                } else {
                  console.log("Drawing files Removed Successfully");
                }
              }
            );
          });

          updatedDataObj["attachedDrawings"] = req.files?.attachedDrawings?.map(
            (item) => item?.filename
          );
        }
      }

      if (updatedDataObj["breakDownBasicDataFilledByPRD.problemFaced"]) {
        await Machine.findOneAndUpdate(
          { _id: mongoose.Types.ObjectId(req.params?.machineId) },
          {
            $addToSet: {
              machine_problems_faced:
                updatedDataObj["breakDownBasicDataFilledByPRD.problemFaced"],
            },
          },
          { new: true }
        );
      }

      await RequestSheetOfBM.findOneAndUpdate(
        req.query,
        {
          $set: updatedDataObj,
        },
        {
          new: true,
        }
      );

      return res.status(201).json({
        message: "Request-sheet updated successfully",
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res
        .status(500)
        .json({ message: error?.message, error: new Error(error) });
    }
  }
);
const findTLandOperatorList = async (req, res, next) => {
  try {
    let TLHOSS_and_TM_user_list = [];

    if (
      (req?.rootUser?.tm_department === "MTD" && !req.purpose) ||
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

const filterMiddleware = async (req, res, next) => {
  try {
    let queryObj = {
        "maintenanceReportFilledByMTD.breakDownTime": {
          $gt: 0,
        },
        maintenanceType: "BM",
      },
      queryObjForPM = {};

    if (req.query?.selectedYear) {
      queryObj = {
        ...queryObj,
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

    if (req.query?.selectedRSStatus) {
      queryObj = {
        ...queryObj,
        requestSheetStatus: req.query?.selectedRSStatus,
      };
    }

    if (req.params?.filter === "based-on-plant") {
      queryObj = {
        ...queryObj,
        plantRef: mongoose.Types.ObjectId(req.params?.selectedId),
      };

      queryObjForPM = {
        plant_names: mongoose.Types.ObjectId(req.params?.selectedId),
      };
    } else if (req.params?.filter === "based-on-section") {
      queryObj = {
        ...queryObj,
        sectionRef: mongoose.Types.ObjectId(req.params?.selectedId),
      };

      queryObjForPM = {
        section_names: mongoose.Types.ObjectId(req.params?.selectedId),
      };
    } else if (req.params?.filter === "based-on-subSection") {
      queryObj = {
        ...queryObj,
        subSectionRef: mongoose.Types.ObjectId(req.params?.selectedId),
      };

      queryObjForPM = {
        subSection_names: mongoose.Types.ObjectId(req.params?.selectedId),
      };
    } else if (req.params?.filter === "based-on-cell") {
      queryObj = {
        ...queryObj,
        cellRef: mongoose.Types.ObjectId(req.params?.selectedId),
        // "maintenanceReportFilledByMTD.workEndedDateOfBM": { $ne: null },
      };

      queryObjForPM = {
        cell_names: mongoose.Types.ObjectId(req.params?.selectedId),
      };
    } else if (req.params?.filter === "based-on-line") {
      queryObj = {
        ...queryObj,
        lineRef: mongoose.Types.ObjectId(req.params?.selectedId),
        // "maintenanceReportFilledByMTD.workEndedDateOfBM": { $ne: null },
      };

      queryObjForPM = {
        line_names: mongoose.Types.ObjectId(req.params?.selectedId),
      };
    } else if (req.params?.filter === "based-on-machine") {
      queryObj = {
        ...queryObj,
        machineRef: mongoose.Types.ObjectId(req.params?.selectedId),
        // "maintenanceReportFilledByMTD.workEndedDateOfBM": { $ne: null },
      };

      queryObjForPM = {
        _id: mongoose.Types.ObjectId(req.params?.selectedId),
      };
    }

    req.queryObj = queryObj;
    req.queryObjForPM = queryObjForPM;
    next();
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

const removeBDZeroValueFiltration = async (req, res, next) => {
  try {
    delete req.queryObj?.["maintenanceReportFilledByMTD.breakDownTime"];
    next();
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error: new Error(error) });
  }
};

const targetMiddleware = async (req, res, next) => {
  try {
    let queryObj = {},
      queryObjForHandlingLineForTarget = {},
      targetKey = `$allTargetData.${req.query?.targetKey}`;
    pipeline = [];

    if (req.params?.filter === "based-on-line") {
      queryObj = {
        _id: mongoose.Types.ObjectId(req.params.selectedId),
      };

      pipeline = [
        {
          $project: {
            _id: 0,
            line_ids: ["$_id"],
            monthlyTarget: {
              $map: {
                input: {
                  $objectToArray: targetKey,
                },
                as: "obj",
                in: "$$obj.v",
              },
            },
          },
        },
      ];
    } else {
      let obj = {},
        arr = [];

      for (let i = 0; i < allMonths.length; i++) {
        obj[allMonths?.[i]?.monthName] = {
          $avg: `${targetKey}.${allMonths?.[i]?.monthName}`,
        };

        if (req.query?.targetKey === "monthlyMTBFTarget") {
          obj[`count_${allMonths?.[i]?.monthName}`] = {
            $sum: 1,
          };

          arr.push(
            truncValue({
              $divide: [
                `$${allMonths?.[i]?.monthName}`,
                `$count_${allMonths?.[i]?.monthName}`,
              ],
            })
          );
        } else {
          arr.push(truncValue(`$${allMonths?.[i]?.monthName}`));
        }
      }

      pipeline = [
        {
          $group: {
            _id: null,
            line_ids: {
              $push: "$_id",
            },
            ...obj,
          },
        },
        {
          $project: {
            _id: 0,
            monthlyTarget: arr,
            line_ids: 1,
          },
        },
      ];

      if (req.params?.filter === "based-on-plant") {
        queryObj = {
          plant_names: mongoose.Types.ObjectId(req.params.selectedId),
        };
      } else if (req.params?.filter === "based-on-section") {
        queryObj = {
          section_names: mongoose.Types.ObjectId(req.params.selectedId),
        };
      } else if (req.params?.filter === "based-on-subSection") {
        queryObj = {
          subSection_names: mongoose.Types.ObjectId(req.params.selectedId),
        };
      } else if (req.params?.filter === "based-on-cell") {
        queryObj = {
          cell_names: mongoose.Types.ObjectId(req.params.selectedId),
        };
      }
    }

    if (req.query?.targetKey === "monthlyProductionHrs") {
      queryObjForHandlingLineForTarget = {
        "allTargetData.yearTotalProductionHrs": { $gt: 0 },
      };
    } else if (req.query?.targetKey === "monthlyBDHrsTarget") {
      queryObjForHandlingLineForTarget = {
        "allTargetData.yearTotalBDHrsTarget": { $gt: 0 },
      };
    } else if (req.query?.targetKey === "monthlyMTTRTarget") {
      queryObjForHandlingLineForTarget = {
        "allTargetData.yearTotalMTTRTarget": { $gt: 0 },
      };
    } else if (req.query?.targetKey === "monthlyMTBFTarget") {
      queryObjForHandlingLineForTarget = {
        "allTargetData.yearTotalMTBFTarget": { $gt: 0 },
      };
    } else if (req.query?.targetKey === "monthlyBDPercentageTarget") {
      queryObjForHandlingLineForTarget = {
        "allTargetData.yearTotalBDPercentageTarget": { $gt: 0 },
      };
    }

    const target = await Line.aggregate([
      {
        $match: queryObj,
      },
      {
        $unwind: "$allTargetData",
      },
      {
        $match: {
          "allTargetData.current_year": req.query?.selectedYear,
        },
      },
      {
        $match: queryObjForHandlingLineForTarget,
      },
      ...pipeline,
    ]);
    req.target = target?.[0]?.monthlyTarget || [];
    req.line_ids = target?.[0]?.line_ids || [];
    next();
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

const getCountBDCountBasedOnLoggedUserMiddleware = async (req, res, next) => {
  try {
    const section = await Section.findOne({
      section_id: req?.rootUser?.section_data?.split("-")?.[0],
    });

    const getPlantIdForRequestSheetDashboard = await Plant.findOne({
      plant_id: req?.rootUser?.plant_data?.split("-")?.[0],
    });

    let queryObjForCountOfBDForRequestSheetDashboard = {
      plantRef: getPlantIdForRequestSheetDashboard?._id,
    };

    if (req?.rootUser?.tm_grade !== "HOD") {
      if (section.dashboardLevel === "Yes") {
        queryObjForCountOfBDForRequestSheetDashboard = {
          ...queryObjForCountOfBDForRequestSheetDashboard,
          sectionRef: section?._id,
        };
      } else {
        const subSectionsData = await SubSection.find({
          subSection_id: {
            $in: req.rootUser?.subSection_data?.map(
              (item) => item?.split("-")?.[0]
            ),
          },
        });

        queryObjForCountOfBDForRequestSheetDashboard = {
          ...queryObjForCountOfBDForRequestSheetDashboard,
          subSectionRef: { $in: subSectionsData?.map((item) => item?._id) },
        };
      }
    }
    req.queryObjForCountOfBDForRequestSheetDashboard =
      queryObjForCountOfBDForRequestSheetDashboard;
    next();
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

router.get(
  "/getRequestSheetData/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  removeBDZeroValueFiltration,
  async (req, res, next) => {
    try {
      delete req.queryObj.maintenanceType;

      if (req.query?.selectedMaintenanceType) {
        req.queryObj = {
          ...req?.queryObj,
          maintenanceType: req?.query?.selectedMaintenanceType,
        };
      }
      // For fetching all data
      let queryPipeline = [
        {
          $match: {
            ...req.queryObj,
          },
        },
      ];

      let condForGraterValue = {};
      if (
        req.query?.greaterValue !== "1000" ||
        req.query?.lesserValue !== "0"
      ) {
        condForGraterValue = {
          "maintenanceReportFilledByMTD.breakDownTime": {
            $lte: req.query?.greaterValue * 1,
            $gte: req.query?.lesserValue * 1,
          },
          // maintenanceType: "BM",
        };
        queryPipeline = [
          {
            $match: {
              ...condForGraterValue,
              ...req.queryObj,
            },
          },
        ];
      }

      //For fetching data while updating
      if (req.query?._id) {
        queryPipeline = [
          {
            $match: {
              _id: mongoose.Types.ObjectId(req.query?._id),
              ...req.queryObj,
            },
          },
        ];
      }

      //For fetching data if user is Operator
      if (req.rootUser?.user_type === "Operator") {
        queryPipeline = [
          {
            $match: {
              $or: [
                {
                  assignUser: req.rootUser?._id,
                },
                {
                  handOverUser: req.rootUser?._id,
                },
              ],
              ...req.queryObj,
              ...condForGraterValue,
            },
          },
        ];
      }
      req.queryPipeline = queryPipeline;

      next();
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  },
  findRequestSheetMiddleware,
  dashboardLevelUserCheckMiddleware,
  findTLandOperatorList,
  // getCountBDCountBasedOnLoggedUserMiddleware,
  async (req, res, next) => {
    try {
      const counters = await RequestSheetOfBM.aggregate([
        // {
        //   $match: {
        //     // ...req?.queryObjForCountOfBDForRequestSheetDashboard,
        //   },
        // },
        ...req.queryPipeline,
        {
          $group: {
            _id: null,
            total_request_sheet_count: {
              $sum: 1,
            },
            open_request_sheet_count: {
              // $sum: {
              //   $cond: [
              //     {
              //       $and: [
              //         { $ne: ["$requestSheetStatus", "Generated"] },
              //         { $ne: ["$requestSheetStatus", "Completed"] },
              //       ],
              //     },
              //     1,
              //     0,
              //   ],
              // },
              $sum: {
                $cond: [{ $ne: ["$requestSheetStatus", "Completed"] }, 1, 0],
              },
            },
            closed_request_sheet_count: {
              $sum: {
                $cond: [{ $eq: ["$requestSheetStatus", "Completed"] }, 1, 0],
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

      res.status(201).json({
        message: "Request-sheet data get successfully",
        requestSheetData: req?.requestSheetData,
        TLHOSS_and_TM_user_list: req?.TLHOSS_and_TM_user_list,
        counters: {
          ...counters?.[0],
        },
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

// router.get(
//   "/getUserDetails",
// authenticate,
//   dashboardLevelUserCheckMiddleware,
//   async (req, res, next) => {
//     try {
//       const users = await User.find({
//         ...req?.query,
//         ...req.queryObj,
//         tm_no: { $ne: req?.rootUser?.tm_no },
//       });

//       res.status(201).json({ message: "User details get successfully", users });
//     } catch (error) {
//       res.status(500).json({ message: error?.message, error });
//     }
//   }
// );

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
                      from: "machinesalldatas",
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
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
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
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

router.get(
  "/getAllDataForGenerateNewRequestSheetDashboardBasedOnDashboardLevel",
  authenticate,
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
              pipeline: [
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
                                from: "machinesalldatas",
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
              ],
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
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  },
  functionForGettingAllDataOfRequestSheetBasedOnDashboardLevel_NO
);

router.get(
  "/getAllDataBasedOnSelectedSubSection/:subSection/:dashboardLevel",
  authenticate,
  queryMiddleWareFunction,
  async (req, res, next) => {
    try {
      req.subSection = req.params?.subSection;
      req.dashboardLevel = req.params?.dashboardLevel;
      return next();
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  },
  functionForGettingAllDataOfRequestSheetBasedOnDashboardLevel_NO
);
// router.get(
//   "/getMachineDetailsOnScanningRequest/:generateType",
// authenticate,
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

router.get("/getMtdUserDetails", authenticate, async (req, res, next) => {
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
    if (Object.keys(req?.query)?.length !== 0) {
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
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
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
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

// ---------------- not using this API
router.get(
  "/getRequestSheetMonitoringData",
  authenticate,
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
            // localField: "_id",
            // foreignField: "approvalOfMTD_TL",
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
                      {
                        $toObjectId: "$$id",
                      },
                    ],
                  },
                },
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
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/getRequestSheetMonitoringData/status-chart-data/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  removeBDZeroValueFiltration,
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

      const generatedStatusCount = await RequestSheetOfBM.countDocuments(
        req.queryObj
      );

      return res.status(201).json({
        message: "Monitoring request-sheet chart data get successfully",
        allStatusCounterForGraph: [
          {
            label: "Generated",
            data: [generatedStatusCount],
            backgroundColor: "red",
          },
          ...allStatusCounterForGraph,
        ],
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/getRequestSheetMonitoringData/generated-and-completed-count/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  removeBDZeroValueFiltration,
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
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/getRequestSheetMonitoringData/user-wise-pending-count/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  async (req, res, next) => {
    try {
      const UserWisePendingApprovalCount = await RequestSheetOfBM.aggregate([
        {
          $match: {
            // _id: mongoose.Types.ObjectId("6628e1b9c9c4cd5412677635"),
            ...req.queryObj,
          },
        },
        {
          $project: {
            preAggregationTimeStampOfRequestSheet: 1,
            userWithStatusInfo: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: [
                      {
                        userType: "MTD TL",
                        userId: { $arrayElemAt: ["$approvalOfMTD_TL", -1] },
                        userName: {
                          $arrayElemAt: ["$approverNameLogOfMTD_TL", -1],
                        },
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
                        userName: {
                          $arrayElemAt: ["$approverNameLogOfMTD_HOSS", -1],
                        },
                        timeStamp: {
                          $arrayElemAt: ["$approvalDateAndTimeOfMTD_HOSS", -1],
                        },
                        status: {
                          $arrayElemAt: ["$approvalStatusOfMTD_HOSS", -1],
                        },
                      },
                      {
                        userType: "PRD TL",
                        userId: { $arrayElemAt: ["$approvalOfPRD_TL", -1] },
                        userName: {
                          $arrayElemAt: ["$approverNameLogOfPRD_TL", -1],
                        },
                        timeStamp: {
                          $arrayElemAt: ["$approvalDateAndTimeOfPRD_TL", -1],
                        },
                        status: {
                          $arrayElemAt: ["$approvalStatusOfPRD_TL", -1],
                        },
                      },
                      {
                        userType: "MTD HOS",
                        userId: { $arrayElemAt: ["$approvalOfMTD_HOS", -1] },
                        userName: {
                          $arrayElemAt: ["$approverNameLogOfMTD_HOS", -1],
                        },
                        timeStamp: {
                          $arrayElemAt: ["$approvalDateAndTimeOfMTD_HOS", -1],
                        },
                        status: {
                          $arrayElemAt: ["$approvalStatusOfMTD_HOS", -1],
                        },
                      },
                      {
                        userType: "PRD HOS",
                        userId: { $arrayElemAt: ["$approvalOfPRD_HOS", -1] },
                        userName: {
                          $arrayElemAt: ["$approverNameLogOfPRD_HOS", -1],
                        },
                        timeStamp: {
                          $arrayElemAt: ["$approvalDateAndTimeOfPRD_HOS", -1],
                        },
                        status: {
                          $arrayElemAt: ["$approvalStatusOfPRD_HOS", -1],
                        },
                      },
                      {
                        userType: "MTD HOD",
                        userId: { $arrayElemAt: ["$approvalOfMTD_HOD", -1] },
                        userName: {
                          $arrayElemAt: ["$approverNameLogOfMTD_HOD", -1],
                        },
                        timeStamp: {
                          $arrayElemAt: ["$approvalDateAndTimeOfMTD_HOD", -1],
                        },
                        status: {
                          $arrayElemAt: ["$approvalStatusOfMTD_HOD", -1],
                        },
                      },
                      {
                        userType: "PRD HOD",
                        userId: { $arrayElemAt: ["$approvalOfPRD_HOD", -1] },
                        userName: {
                          $arrayElemAt: ["$approverNameLogOfPRD_HOD", -1],
                        },
                        timeStamp: {
                          $arrayElemAt: ["$approvalDateAndTimeOfPRD_HOD", -1],
                        },
                        status: {
                          $arrayElemAt: ["$approvalStatusOfPRD_HOD", -1],
                        },
                      },
                    ],
                    as: "user",
                    cond: {
                      $eq: ["$$user.status", "Pending"],
                    },
                    // limit: 1,
                  },
                },
                0,
              ],
            },
          },
        },
        // {
        //   $unwind: "$userWithStatusInfo",
        // },
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
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.post(
  "/addDynamicApprovalListOfBM",
  authenticate,
  async (req, res, next) => {
    try {
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
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);
router.get(
  "/getCategories",
  authenticate,

  async (req, res, next) => {
    const category = await Plant.find({
      plant_id: req?.rootUser?.plant_data?.split("-")?.[0],
    });

    let getCategory = category?.[0]?.categories;

    return res.status(201).json({
      message: "Categories get successfully",
      getCategory,
    });
  }
);
router.post(
  "/addCategories",
  authenticate,

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
  authenticate,

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

router.patch("/updateCategory/:catId", authenticate, async (req, res, next) => {
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
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    console.error(error);
    return res.status(500).json({ message: "Error updating subCategory" });
  }
});
router.patch(
  "/updateSubCategory/:subId",
  authenticate,
  async (req, res, next) => {
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
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      console.error(error);
      return res.status(500).json({ message: "Error updating subCategory" });
    }
  }
);
router.get(
  "/getAllShifts",
  authenticate,

  async (req, res, next) => {
    const shifts = await Plant.find({
      plant_id: req?.rootUser?.plant_data?.split("-")?.[0],
    });
    let getShifts = shifts?.[0]?.shiftOfBM;

    return res.status(201).json({
      message: "Shifts get successfully",
      getShifts,
      categories: shifts?.[0]?.categories,
    });
  }
);
router.post(
  "/addShift",
  authenticate,

  async (req, res, next) => {
    try {
      const { shiftName, shiftStartTime, shiftEndTime } = req.body;

      if (!shiftName || !shiftStartTime || !shiftEndTime) {
        return res.status(400).json({ message: "Incomplete shift data" });
      }

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
        shiftOfBM: addShift.shiftOfBM,
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);
router.patch(
  "/updateShift/:shiftId",
  authenticate,

  async (req, res, next) => {
    try {
      const { shiftName, shiftStartTime, shiftEndTime } = req.body;
      if (!shiftName || !shiftStartTime || !shiftEndTime) {
        return res.status(400).json({ message: "Incomplete shift data" });
      }

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
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.patch(
  "/deleteShift/:shiftId",
  authenticate,

  async (req, res, next) => {
    try {
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
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.patch(
  "/deleteSubCategory/:catId/:subId",
  authenticate,

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
  authenticate,

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

router.get("/getMachineDetails", async (req, res, next) => {
  try {
    const machine = await Machine.findOne(req.query, {
      machine_code: 1,
      machine_name: 1,
    }).populate("cell_names", "cell_name");

    return res.status(201).json({
      message: "Machine details get successfully!",
      machine,
    });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error: new Error(error) });
  }
});

router.get(
  "/getMachineDetailsOnScanningRequest",
  authenticate,
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
    let queryObjForGetRequestSheetData = {};
    delete req?.queryObj?.maintenanceType;

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

    const requestSheetData = await RequestSheetOfBM.aggregate([
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
      {
        $lookup: {
          from: "users",
          localField: "partQualityCheckedByPRD",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                tm_name: 1,
                tm_no: 1,
                email: 1,
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
                tm_no: 1,
                email: 1,
              },
            },
          ],
          as: "namesMTD",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "machineSafetyCheckedByPRD",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                tm_name: 1,
                tm_no: 1,
                email: 1,
              },
            },
          ],
          as: "safetyNamePRD",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "machineSafetyCheckedByMTD",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                tm_name: 1,
                tm_no: 1,
                email: 1,
              },
            },
          ],
          as: "safetyNameMTD",
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
      {
        $lookup: {
          from: "users",
          localField: "handOverUser",
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
          as: "handoverUserDetails",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "approvalOfMTD_SL",
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
          as: "approvalOfMTD_SL",
        },
      },
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
          requestSheetNoOfBM: 1,
          maintenanceType: 1,
          priorityCode: 1,
          problemOccurredDateAndTimeOfBM: 1,
          sheetIssuedDateAndTimeOfBM: 1,
          breakDownBasicDataFilledByPRD: 1,
          maintenanceReportFilledByMTD: 1,
          shiftOfBM: 1,
          qualityRelated: 1,
          requestSheetCreatedBy: {
            $arrayElemAt: ["$requestSheetCreatedBy", 0],
          },
          breakDownAttendedBy: 1,
          attachedImagesOrVideoByPRDUser: 1,

          //only for material table purpose
          cell: { $arrayElemAt: ["$cells.cell_name", 0] },
          line: { $arrayElemAt: ["$lines.line_name", 0] },
          machineNo: { $arrayElemAt: ["$machines.machine_code", 0] },
          machineName: { $arrayElemAt: ["$machines.machine_name", 0] },
          problem: "$breakDownBasicDataFilledByPRD.problemFaced",
          lossTime: "$maintenanceReportFilledByMTD.breakDownTime",
          problemOccurredDateAndTimeOfBMForTable: {
            $dateToString: {
              format: "%d-%m-%Y T%H:%M",
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

          partQualityCheckedByPRD: { $arrayElemAt: ["$namesPRD", 0] },
          partQualityCheckedByMTD: { $arrayElemAt: ["$namesMTD", 0] },

          //for safety
          machineSafetyCheckedByPRD: { $arrayElemAt: ["$safetyNamePRD", 0] },
          machineSafetyCheckedByMTD: { $arrayElemAt: ["$safetyNameMTD", 0] },

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
          preventive_corrective_maintenance: 1,
          yokotenkai: 1,
          IsSafetyFormCreated: 1,
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
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error: new Error(error) });
  }
};

router.get(
  "/getMachineRequestSheetDetails",
  authenticate,
  filterMiddleware,
  removeBDZeroValueFiltration,
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

router.get("/getDataForEditingTheRS", authenticate, async (req, res, next) => {
  try {
    let currentMonth;
    if (moment().format("MMM") === "Jun") {
      currentMonth = "June";
    } else if (moment().format("MMM") === "Jul") {
      currentMonth = "July";
    } else {
      currentMonth = moment().format("MMM");
    }
    const machine = await Machine.aggregate([
      {
        $match: { machine_code: req.query?.machine_code },
      },
      {
        $unwind: "$checkSheet_data",
      },
      {
        $match: {
          "checkSheet_data.current_year": req?.query?.current_year,
        },
      },
      {
        $lookup: {
          from: "lines",
          localField: "line_names",
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
      {
        $lookup: {
          from: "cells",
          localField: "cell_names",
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
        $lookup: {
          from: "subsections",
          localField: "subSection_names",
          foreignField: "_id",
          as: "subSection",
        },
      },
      {
        $lookup: {
          from: "sections",
          localField: "section_names",
          foreignField: "_id",
          pipeline: [
            {
              $lookup: {
                from: "plants",
                localField: "plant_names",
                foreignField: "_id",
                as: "plant",
              },
            },
          ],
          as: "section",
        },
      },
      {
        $project: {
          machine_code: 1,
          machine_name: 1,
          machine_problems_faced: 1,
          line: { $arrayElemAt: [`$line`, 0] },
          cell: { $arrayElemAt: [`$cell`, 0] },
          subSection: { $arrayElemAt: [`$subSection`, 0] },
          section: { $arrayElemAt: [`$section`, 0] },
          plant: { $arrayElemAt: [`$section.plant`, 0] },
          PMStatus: `$checkSheet_data.PMStatus.${currentMonth}`,
          PMdate: {
            $arrayElemAt: [
              `$checkSheet_data.implemetation_completed_date.${currentMonth}`,
              0,
            ],
          },
        },
      },
    ]);

    const bmData = await RequestSheetOfBM.aggregate([
      {
        $match: {
          machineRef: machine?.[0]?._id,
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalHours: {
            $sum: {
              $trunc: [
                {
                  $divide: ["$maintenanceReportFilledByMTD.breakDownTime", 60],
                },
                1,
              ],
            },
          },
        },
      },
    ]);

    const section = await Section.findOne({
      section_id: req?.rootUser?.section_data?.split("-")?.[0],
    });

    let queryObj = {
      plant_data: req?.rootUser?.plant_data,
      user_type: { $ne: "Operator" },
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

    const allUserGroup = await User.aggregate([
      {
        $match: queryObj,
      },
      {
        $group: {
          _id: {
            tm_department: "$tm_department",
            tm_grade: "$tm_grade",
            user_type: "$user_type",
          },
          users: {
            $push: {
              _id: "$_id",
              tm_name: "$tm_name",
            },
          },
        },
      },
    ]);

    let TLHOSS_and_TM_user_list;

    delete queryObj["user_type"];

    if (
      req?.rootUser?.tm_department === "MTD" ||
      req?.rootUser?.user_type === "Operator"
    ) {
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

    const requestSheetData = await RequestSheetOfBM.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId(req.query?._id),
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
                tm_no: 1,
                email: 1,
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
                tm_no: 1,
                email: 1,
              },
            },
          ],
          as: "namesMTD",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "machineSafetyCheckedByPRD",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                tm_name: 1,
                tm_no: 1,
                email: 1,
              },
            },
          ],
          as: "safetyNamePRD",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "machineSafetyCheckedByMTD",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                tm_name: 1,
                tm_no: 1,
                email: 1,
              },
            },
          ],
          as: "safetyNameMTD",
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
      {
        $lookup: {
          from: "users",
          localField: "handOverUser",
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
          as: "handoverUserDetails",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "approvalOfMTD_SL",
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
          as: "approvalOfMTD_SL",
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
        $addFields: {
          "maintenanceReportFilledByMTD.workStartedDateOfBM":
            generateDateFormateObj(
              "$maintenanceReportFilledByMTD.workStartedDateOfBM"
            ),
          "maintenanceReportFilledByMTD.workEndedDateOfBM":
            generateDateFormateObj(
              "$maintenanceReportFilledByMTD.workEndedDateOfBM"
            ),
        },
      },
      {
        $project: {
          requestSheetNoOfBM: 1,
          maintenanceType: 1,
          priorityCode: 1,
          problemOccurredDateAndTimeOfBM: generateDateFormateObj(
            "$problemOccurredDateAndTimeOfBM"
          ),
          sheetIssuedDateAndTimeOfBM: generateDateFormateObj(
            "$sheetIssuedDateAndTimeOfBM"
          ),
          breakDownBasicDataFilledByPRD: 1,

          maintenanceReportFilledByMTD: "$maintenanceReportFilledByMTD",
          shiftOfBM: 1,
          qualityRelated: 1,
          requestSheetCreatedBy: {
            $arrayElemAt: ["$requestSheetCreatedBy", 0],
          },
          breakDownAttendedBy: 1,

          problem: "$breakDownBasicDataFilledByPRD.problemFaced",
          lossTime: "$maintenanceReportFilledByMTD.breakDownTime",
          problemOccurredDateAndTimeOfBMForTable: {
            $dateToString: {
              format: "%d-%m-%Y T%H:%M",
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
          approvalOfMTD_SL: {
            $arrayElemAt: ["$approvalOfMTD_SL", 0],
          },
          finalActivity: 1,
          work_order_status: 1,
          rejectedRemarksOfRequestSheet: 1,
          feedbackMTD_HOS: 1,
          qualityConfirmed: 1,

          approvalOfMTD_TL_name: {
            $arrayElemAt: ["$approverNameLogOfMTD_TL", -1],
          },

          approvalStatusOfMTD_TL: {
            $arrayElemAt: ["$approvalStatusOfMTD_TL", -1],
          },

          approvalOfMTD_HOSS_name: {
            $arrayElemAt: ["$approverNameLogOfMTD_HOSS", -1],
          },

          approvalStatusOfMTD_HOSS: {
            $arrayElemAt: ["$approvalStatusOfMTD_HOSS", -1],
          },

          approvalOfMTD_HOS_name: {
            $arrayElemAt: ["$approverNameLogOfMTD_HOS", -1],
          },

          approvalStatusOfMTD_HOS: {
            $arrayElemAt: ["$approvalStatusOfMTD_HOS", -1],
          },

          approvalOfPRD_TL_name: {
            $arrayElemAt: ["$approverNameLogOfPRD_TL", -1],
          },

          approvalStatusOfPRD_TL: {
            $arrayElemAt: ["$approvalStatusOfPRD_TL", -1],
          },

          approvalOfPRD_HOS_name: {
            $arrayElemAt: ["$approverNameLogOfPRD_HOS", -1],
          },

          approvalStatusOfPRD_HOS: {
            $arrayElemAt: ["$approvalStatusOfPRD_HOS", -1],
          },

          approvalOfPRD_HOD_name: {
            $arrayElemAt: ["$approverNameLogOfPRD_HOD", -1],
          },

          approvalStatusOfPRD_HOD: {
            $arrayElemAt: ["$approvalStatusOfPRD_HOD", -1],
          },

          approvalOfMTD_HOD_name: {
            $arrayElemAt: ["$approverNameLogOfMTD_HOD", -1],
          },

          approvalStatusOfMTD_HOD: {
            $arrayElemAt: ["$approvalStatusOfMTD_HOD", -1],
          },

          partQualityCheckedByPRD: { $arrayElemAt: ["$namesPRD", 0] },
          partQualityCheckedByMTD: { $arrayElemAt: ["$namesMTD", 0] },

          //for safety
          machineSafetyCheckedByPRD: { $arrayElemAt: ["$safetyNamePRD", 0] },
          machineSafetyCheckedByMTD: { $arrayElemAt: ["$safetyNameMTD", 0] },

          dataSheetOfBM: 1,
          drawingOfBM: 1,
          sparePartUsedOrNot: 1,
          changedParts: 1,

          requestSheetStatus: 1,
          getDataForApprovalDashboard: 1,

          actionTemporaryOrNot: 1,
          dataSheetOfRequestSheet: 1,
          drawingOfRequestSheet: 1,
          supportingTM: 1,
          attachedDataSheets: 1,
          attachedDrawings: 1,
          categoriesOfRequestSheet: 1,
          preventive_corrective_maintenance: 1,
          yokotenkai: 1,
          IsSafetyFormCreated: 1,
        },
      },
    ]);

    const shifts = await Plant.find({
      plant_id: req?.rootUser?.plant_data?.split("-")?.[0],
    });

    return res.status(201).json({
      message: "Request-sheet data get successfully",
      shiftOfBM: shifts?.[0]?.shiftOfBM,
      requestSheetDataOfBM: requestSheetData?.[0],
      allUserGroup,
      machine: machine?.[0],
      bmData: bmData?.[0],
      TLHOSS_and_TM_user_list,
    });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error: new Error(error) });
  }
});

router.get(
  "/getListOfTheTLAndOperatorForNoLossBDEntryForm",
  authenticate,
  dashboardLevelUserCheckMiddleware,
  async (req, res, next) => {
    try {
      let TLHOSS_and_TM_user_list = await User.find(
        {
          ...req.queryObj,
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

      const getPlantIdForNoLossBDEntry = await Plant.findOne({
        plant_id: req?.rootUser?.plant_data?.split("-")?.[0],
      });

      const getNoLossNo = await HandlingActions.find({
        plant_id: mongoose.Types.ObjectId(getPlantIdForNoLossBDEntry._id),
      });

      res.status(201).json({
        message: "TL and Operator data get successfully",
        TLHOSS_and_TM_user_list,
        getNoLossNo: getNoLossNo[0].noLossBdNos,
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
  "/getMachineRequestSheetDetailsForApproval/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  removeBDZeroValueFiltration,
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
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

router.get(
  "/getCellDropdownValueBasedOnDashboardLevel",
  authenticate,
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
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.patch(
  "/sendApprovalForRequestSheetOfBM/:reqId/:machineRef",
  authenticate,
  dashboardLevelUserCheckMiddleware,
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
        (requestSheetDataOfBM?.assignUser?._id ===
          (req?.rootUser?._id).toString() ||
          requestSheetDataOfBM?.handOverUser?._id ===
            (req?.rootUser?._id).toString())
      ) {
        return res
          .status(400)
          .json({ message: "Please select required MTD TL" });
      }

      if (
        requestSheetDataOfBM?.assignUser?._id ===
          (req?.rootUser?._id).toString() ||
        requestSheetDataOfBM?.handOverUser?._id ===
          (req?.rootUser?._id).toString()
      ) {
        const updateAssignApprovalOfMTD_TL =
          await RequestSheetOfBM.findOneAndUpdate(
            {
              _id: mongoose.Types.ObjectId(req.params?.reqId),
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
          const bodyContent = ({ key, value }) => {
            return `<table style="font-family: arial, sans-serif;border-collapse: collapse;width: 100%;">
       
             <tr>
             <td style="border: 1px solid black;text-align: left;padding: 8px;">Cell/Product</td>
             <td style="border: 1px solid black;text-align: left;padding: 8px;">${requestSheetDataOfBM?.cell}</td>
             </tr>
       
             <tr style="background-color: #dddddd;">
             <td style="border: 1px solid black;text-align: left;padding: 8px;">Line</td>
             <td style="border: 1px solid black;text-align: left;padding: 8px;">${requestSheetDataOfBM?.line}</td>
             </tr>
       
             <tr>
                 <td style="border: 1px solid black;text-align: left;padding: 8px;">Machine</td>
                 <td style="border: 1px solid black;text-align: left;padding: 8px;">${requestSheetDataOfBM?.machineName}</td>
             </tr>
       
             <tr style="background-color: #dddddd;">
                 <td style="border: 1px solid black;text-align: left;padding: 8px;">Machine No.</td>
                 <td style="border: 1px solid black;text-align: left;padding: 8px;">${requestSheetDataOfBM?.machineNo}</td>
             </tr>
       
             <tr>
             <td style="border: 1px solid black;text-align: left;padding: 8px;">Request Sheet No.</td>
             <td style="border: 1px solid black;text-align: left;padding: 8px;">${requestSheetDataOfBM?.requestSheetNoOfBM}</td>
             </tr>   
       
             <tr style="background-color: #dddddd;">
             <td style="border: 1px solid black;text-align: left;padding: 8px;">${key}</td>
             <td style="border: 1px solid black;text-align: left;padding: 8px;">${value}</td>
             </tr>
       
             <tr>
             <td style="border: 1px solid black;text-align: left;padding: 8px;">Request Sheet Status</td>
             <td style="border: 1px solid black;text-align: left;padding: 8px;">${updateAssignApprovalOfMTD_TL?.requestSheetStatus}</td>
             </tr>
       
             <tr style="background-color: #dddddd;">
             <td style="border: 1px solid black;text-align: left;padding: 8px;">Work Order Status</td>
             <td style="border: 1px solid black;text-align: left;padding: 8px;">${updateAssignApprovalOfMTD_TL?.work_order_status}</td>
             </tr>
       
         </table>`;
          };
          let bodyTable = bodyContent({
            key: "Submitted By",
            value: req?.rootUser?.tm_name,
          });

          //get MTD HOS of the assign section for sending mail when request-sheet is send for approval.
          const getMTDHOS = await User.find(
            {
              ...req?.queryObj,
              tm_department: "MTD",
              tm_grade: "HOS",
            },
            { tm_name: 1, line_names: 1, email: 1 }
          );

          sendMailForBD({
            subject: `Request Sheet Approval (${requestSheetDataOfBM?.cell}/${requestSheetDataOfBM?.line}/${requestSheetDataOfBM?.machineName}/${requestSheetDataOfBM?.requestSheetNoOfBM})`,
            title: `Kindly Approve Request-sheet`,
            greetings: `Sir\\Ma'am`,
            toEmailIds: assignApprovalList?.MTD_TL?.email,
            ccEmailIds: getMTDHOS?.map((obj) => obj?.email),
            bodyTable: bodyTable,
          });

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
      Object.keys(assignApprovalList?.[formattedKey])?.length === 0 &&
        delete assignApprovalList?.[formattedKey];
      // });
      console.log(assignApprovalList);
      //Handling validation for approval list which is not selected by user from client-side
      if (approvalOfRequestSheet === "Yes") {
        for (
          let index = 0;
          index < Object.keys(assignApprovalList)?.length;
          index++
        ) {
          if (
            requestSheetDataOfBM?.plantRef?.approvalListOfMinorAndMajor?.[
              minorBD === "Yes" ? "minorApprovalList" : "majorApprovalList"
            ]?.includes(
              Object.keys(assignApprovalList)?.[index]?.replace("_", " ")
            )
          ) {
            if (
              Object.keys(
                assignApprovalList?.[Object.keys(assignApprovalList)?.[index]]
              )?.length === 0 &&
              requestSheetDataOfBM?.maintenanceType === "BM" &&
              assignApprovalList?.[Object.keys(assignApprovalList)?.[index]] !==
                "MTD_HOD" &&
              assignApprovalList?.[Object.keys(assignApprovalList)?.[index]] !==
                "PRD_HOD"
            ) {
              return res.status(400).json({
                message: `Please select required approval list ${requestSheetDataOfBM?.plantRef?.approvalListOfMinorAndMajor?.[
                  minorBD === "Yes" ? "minorApprovalList" : "majorApprovalList"
                ]?.join(", ")}`,
              });
            }
          }
        }
      }

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
          [`approvalDateAndTimeOf${keyOfDepartment}`]: "",
        };

        let resultOfUpdateStatusOfApprover =
          await RequestSheetOfBM.findOneAndUpdate(
            {
              _id: mongoose.Types.ObjectId(req.params?.reqId),
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

      //request-sheet is approved/accepted
      if (approvalOfRequestSheet === "Yes") {
        const minorListForTheApprovalOfPlant =
          requestSheetDataOfBM?.plantRef?.approvalListOfMinorAndMajor
            ?.minorApprovalList;
        const majorListForTheApprovalOfPlant =
          requestSheetDataOfBM?.plantRef?.approvalListOfMinorAndMajor
            ?.majorApprovalList;

        let listOfHigherApproverAuthorityForSendingMail = [];
        Object.keys(assignApprovalList)?.forEach((key) => {
          if (
            [
              ...new Set([
                ...minorListForTheApprovalOfPlant,
                ...majorListForTheApprovalOfPlant,
              ]),
            ]?.includes(key?.replace("_", " "))
          ) {
            updateTheStatusOfBMSheetApprover(key, assignApprovalList[key]);
            if (assignApprovalList?.[key]?.id)
              listOfHigherApproverAuthorityForSendingMail?.push(
                assignApprovalList[key]
              );
          }
        });

        let updateRequestSheetStatus;

        if (
          requestSheetDataOfBM?.plantRef?.approvalListOfMinorAndMajor?.[
            minorBD === "Yes" ? "minorApprovalList" : "majorApprovalList"
          ]?.[1] === undefined
        ) {
          updateRequestSheetStatus = await RequestSheetOfBM.findOneAndUpdate(
            {
              _id: mongoose.Types.ObjectId(req.params?.reqId),
              approvalStatusOfMTD_TL: "Pending",
            },
            {
              $set: {
                requestSheetStatus: "Completed",
                "approvalStatusOfMTD_TL.$": "Accepted",
              },
              $push: {
                approvalDateAndTimeOfMTD_TL: new Date(),
              },
              $unset: {
                getDataForApprovalDashboard: "",
              },
            }
          );
        } else {
          updateRequestSheetStatus = await RequestSheetOfBM.findOneAndUpdate(
            {
              _id: mongoose.Types.ObjectId(req.params?.reqId),
              approvalStatusOfMTD_TL: "Pending",
            },
            {
              $set: {
                requestSheetStatus: `Under ${
                  requestSheetDataOfBM?.plantRef?.approvalListOfMinorAndMajor?.[
                    minorBD === "Yes"
                      ? "minorApprovalList"
                      : "majorApprovalList"
                  ]?.[1]
                } Approval`,
                "getDataForApprovalDashboard.Id":
                  assignApprovalList?.[
                    requestSheetDataOfBM?.plantRef?.approvalListOfMinorAndMajor?.[
                      minorBD === "Yes"
                        ? "minorApprovalList"
                        : "majorApprovalList"
                    ]?.[1]?.replace(" ", "_")
                  ]?.id,
                "getDataForApprovalDashboard.departmentAndGradeOfUser":
                  requestSheetDataOfBM?.plantRef?.approvalListOfMinorAndMajor?.[
                    minorBD === "Yes"
                      ? "minorApprovalList"
                      : "majorApprovalList"
                  ]?.[1],
                "approvalStatusOfMTD_TL.$": "Accepted",
              },
              $push: {
                approvalDateAndTimeOfMTD_TL: new Date(),
              },
            },
            { new: true }
          );
        }

        if (updateRequestSheetStatus) {
          const bodyContent = ({ key, value, approvedDateAndTime }) => {
            return `<table style="font-family: arial, sans-serif;border-collapse: collapse;width: 100%;">
       
             <tr>
             <td style="border: 1px solid black;text-align: left;padding: 8px;">Cell/Product</td>
             <td style="border: 1px solid black;text-align: left;padding: 8px;">${
               requestSheetDataOfBM?.cell
             }</td>
             </tr>
       
             <tr style="background-color: #dddddd;">
             <td style="border: 1px solid black;text-align: left;padding: 8px;">Line</td>
             <td style="border: 1px solid black;text-align: left;padding: 8px;">${
               requestSheetDataOfBM?.line
             }</td>
             </tr>
       
             <tr>
                 <td style="border: 1px solid black;text-align: left;padding: 8px;">Machine</td>
                 <td style="border: 1px solid black;text-align: left;padding: 8px;">${
                   requestSheetDataOfBM?.machineName
                 }</td>
             </tr>
       
             <tr style="background-color: #dddddd;">
                 <td style="border: 1px solid black;text-align: left;padding: 8px;">Machine No.</td>
                 <td style="border: 1px solid black;text-align: left;padding: 8px;">${
                   requestSheetDataOfBM?.machineNo
                 }</td>
             </tr>
       
             <tr>
             <td style="border: 1px solid black;text-align: left;padding: 8px;">Request Sheet No.</td>
             <td style="border: 1px solid black;text-align: left;padding: 8px;">${
               requestSheetDataOfBM?.requestSheetNoOfBM
             }</td>
             </tr>   
       
             <tr style="background-color: #dddddd;">
             <td style="border: 1px solid black;text-align: left;padding: 8px;">${key}</td>
             <td style="border: 1px solid black;text-align: left;padding: 8px;">${value}</td>
             </tr>

             <tr>
             <td style="border: 1px solid black;text-align: left;padding: 8px;">Approved Date & Time</td>
             <td style="border: 1px solid black;text-align: left;padding: 8px;">${moment(
               approvedDateAndTime
             )
               .tz("Asia/Kolkata")
               .format("DD-MM-YYYY THH:mm")}</td>
             </tr>
       
             <tr style="background-color: #dddddd;">
             <td style="border: 1px solid black;text-align: left;padding: 8px;">Request Sheet Status</td>
             <td style="border: 1px solid black;text-align: left;padding: 8px;">${
               updateRequestSheetStatus?.requestSheetStatus
             }</td>
             </tr>
       
             <tr>
             <td style="border: 1px solid black;text-align: left;padding: 8px;">Work Order Status</td>
             <td style="border: 1px solid black;text-align: left;padding: 8px;">${
               updateRequestSheetStatus?.work_order_status
             }</td>
             </tr>
       
         </table>`;
          };
          let bodyTable = bodyContent({
            key: "Approved By",
            value: req?.rootUser?.tm_name,
            approvedDateAndTime:
              updateRequestSheetStatus?.approvalDateAndTimeOfMTD_TL?.[
                updateRequestSheetStatus?.approvalDateAndTimeOfMTD_TL?.length -
                  1 || 0
              ],
          });
          sendMailForBD({
            subject: `Request Sheet Approval (${requestSheetDataOfBM?.cell}/${requestSheetDataOfBM?.line}/${requestSheetDataOfBM?.machineName}/${requestSheetDataOfBM?.requestSheetNoOfBM})`,
            title: `Kindly Approve Request-sheet`,
            greetings: `Sir\\Ma'am`,
            toEmailIds:
              assignApprovalList?.[
                requestSheetDataOfBM?.plantRef?.approvalListOfMinorAndMajor?.[
                  minorBD === "Yes" ? "minorApprovalList" : "majorApprovalList"
                ]?.[1]?.replace(" ", "_")
              ]?.email || undefined,
            ccEmailIds: listOfHigherApproverAuthorityForSendingMail
              ?.map((obj) => obj?.email)
              ?.slice(1),
            bodyTable: bodyTable,
          });

          return res.status(201).json({
            message: `${requestSheetDataOfBM?.requestSheetNoOfBM} Request-sheet approval send !!`,
          });
        }
      } else {
        //request-sheet is rejected
        let updateRequestSheetStatus = await RequestSheetOfBM.findOneAndUpdate(
          {
            _id: mongoose.Types.ObjectId(req.params?.reqId),
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
            message: `${requestSheetDataOfBM?.requestSheetNoOfBM} Request-sheet is rejected !!`,
          });
      }
      //send email of approval to MTD TL (Remaining)
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      console.log(error);
      res.status(500).json({ message: error?.message, error });
    }
  }
);

// const monthValidationMiddleware = async (req, res, next) => {
//   try {
//     if (currentYear === req.query?.selectedYear) {
//       let year;

//       if (
//         [0, 1, 2].includes(
//           moment().tz(timezone).month(req.query.selectedMonth).month()
//         )
//       ) {
//         year = req.query?.selectedYear?.split("-")?.[1];
//       } else {
//         year = req.query?.selectedYear?.split("-")?.[0];
//       }

//       if (
//         moment().tz(timezone).year(year).month(req.query.selectedMonth) >
//         moment().tz(timezone)
//       ) {
//         return res
//           .status(400)
//           .json({ message: "You can't selected the future month!!!" });
//       }
//     }

//     next();
//   } catch (error) {
//     res.status(500).json({ message: error?.message, error });
//   }
// };

const filtrationMiddlewareForKPiFromDBReport = async (req, res, next) => {
  try {
    let queryObjForPm = {};

    if (req.params?.filter === "based-on-plant") {
      queryObjForPm = {
        plant_names: mongoose.Types.ObjectId(req.params?.selectedId),
      };
    } else if (req.params?.filter === "based-on-section") {
      queryObjForPm = {
        section_names: mongoose.Types.ObjectId(req.params?.selectedId),
      };
    } else if (req.params?.filter === "based-on-subSection") {
      queryObjForPm = {
        subSection_names: mongoose.Types.ObjectId(req.params?.selectedId),
      };
    }

    req.queryObjForPm = queryObjForPm;

    next();
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

const functionForFindingBDHourOrCountStatus = async ({
  Model,
  queryObj,
  selectedYear,
  SumString,
}) => {
  try {
    return Model.aggregate([
      {
        $match: queryObj,
      },
      {
        $unwind: "$allTargetData",
      },
      {
        $match: {
          "allTargetData.current_year": selectedYear,
        },
      },
      {
        $group: {
          _id: null,
          annualSum: {
            $sum: truncValue(SumString),
          },
        },
      },
    ]);
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    console.log(error);
  }
};

router.get(
  "/getBdCountStatus/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  filtrationMiddlewareForKPiFromDBReport,
  async (req, res, next) => {
    try {
      let queryObj = req.queryObjForPm;

      if (req.params?.filter === "based-on-cell") {
        queryObj = {
          _id: mongoose.Types.ObjectId(req.params?.selectedId),
        };
      }

      const annualMBDCount = await functionForFindingBDHourOrCountStatus({
        Model: Cell,
        queryObj,
        selectedYear: req.query?.selectedYear,
        SumString: "$allTargetData.yearTotalMBDCountTarget",
      });

      const MBDActualAndMinorBdCount = await RequestSheetOfBM.aggregate([
        {
          $match: req.queryObj,
        },
        {
          $group: {
            // _id: {
            //   minorBD: "$maintenanceReportFilledByMTD.minorBD",
            //   majorBD: "$maintenanceReportFilledByMTD.majorBD",
            // },
            _id: "$maintenanceReportFilledByMTD.majorBD",
            count: { $sum: 1 },
          },
        },
      ]);

      let obj = {};

      MBDActualAndMinorBdCount.map((item) => {
        if (item?._id === "Yes") {
          obj["majorCount"] = item?.count;
        } else if (item?._id === "No") {
          obj["minorCount"] = item?.count;
        }
      });

      return res.status(201).json({
        message: "Bd count status get successfully",
        BDCountStatus: {
          annualMBDCount: annualMBDCount?.[0]?.annualSum,
          MBDActualAndMinorBdCount: obj,
        },
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/getBdHoursStatus/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  filtrationMiddlewareForKPiFromDBReport,
  async (req, res, next) => {
    try {
      let queryObj = req.queryObjForPm;

      if (req.params?.filter === "based-on-cell") {
        queryObj = {
          cell_names: mongoose.Types.ObjectId(req.params?.selectedId),
        };
      } else if (req.params?.filter === "based-on-line") {
        queryObj = {
          _id: mongoose.Types.ObjectId(req.params?.selectedId),
        };
      }

      const annualBDTarget = await functionForFindingBDHourOrCountStatus({
        Model: Line,
        queryObj,
        selectedYear: req.query?.selectedYear,
        SumString: "$allTargetData.yearTotalBDHrsTarget",
      });

      const BDActual = await RequestSheetOfBM.aggregate([
        {
          $match: req.queryObj,
        },
        {
          $group: {
            _id: null,
            BDhour: {
              $sum: {
                $divide: ["$maintenanceReportFilledByMTD.breakDownTime", 60],
              },
            },
          },
        },
        {
          $project: {
            _id: null,
            BDhour: truncValue("$BDhour"),
          },
        },
      ]);

      return res.status(201).json({
        message: "Bd hours status get successfully",
        BDActual,
        BDHoursStatus: {
          annualBDTarget: annualBDTarget?.[0]?.annualSum,
          BDActual: BDActual?.[0]?.BDhour,
        },
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);
//          Daily breakdown trend
router.get(
  "/getDailyBreakdownTrendData/:filter/:selectedId",
  authenticate,
  // monthValidationMiddleware,
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
        moment().tz(timezone).year(year).month(req.query.selectedMonth) >
          moment().tz(timezone)
      ) {
        return res
          .status(400)
          .json({ message: "You can't selected the future month!!!" });
      }

      // if (
      //   currentYear === req.query?.selectedYear &&
      //   moment().tz(timezone).month(req.query.selectedMonth).month() ===
      //     moment().tz(timezone).month()
      // ) {
      //   endDate = moment().tz(timezone).endOf("day");
      // } else {
      //   endDate = moment()
      //     .tz(timezone)
      //     .year(year)
      //     .month(req.query.selectedMonth)
      //     .endOf("month");
      // }

      endDate = moment()
        .tz(timezone)
        .year(year)
        .month(req.query.selectedMonth)
        .endOf("month");

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
              BDhour: truncValue({
                $divide: ["$maintenanceReportFilledByMTD.breakDownTime", 60],
              }),
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
            },
          },
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
        conditionObj: { $lt: 1 },
      });

      const greaterThenOneAndLessThanOrEqualToTwoHourData = await queryFunction(
        {
          conditionObj: {
            $gte: 1,
            $lt: 2,
          },
        }
      );

      const greaterThenTwoHourData = await queryFunction({
        conditionObj: { $gte: 2 },
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

      // const requestSheet = await RequestSheetOfBM.find({});

      // for (let i = 0; i < requestSheet.length; i++) {
      //   const element = requestSheet[i];

      //   await RequestSheetOfBM.updateOne(
      //     {
      //       _id: element?._id,
      //     },
      //     {
      //       "preAggregationTimeStampOfRequestSheet.requestSheet_year":
      //         gettingFYYearForSelectedDate(
      //           element?.problemOccurredDateAndTimeOfBM
      //         ),
      //       "preAggregationTimeStampOfRequestSheet.requestSheet_month":
      //         gettingMonthForSelectedDate(
      //           element?.problemOccurredDateAndTimeOfBM
      //         ),
      //     }
      //   );
      // }

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
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
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
        $sort: { _id: -1 },
      },
      {
        $project: {
          sectionName: { $arrayElemAt: ["$sections.section_name", 0] },
          cell: { $arrayElemAt: ["$cells.cell_name", 0] },
          line: { $arrayElemAt: ["$lines.line_name", 0] },
          machineName: { $arrayElemAt: ["$machines.machine_name", 0] },
          machineNo: { $arrayElemAt: ["$machines.machine_code", 0] },
          problem: "$breakDownBasicDataFilledByPRD.problemFaced",
          problemOccurredDateAndTimeOfBM: {
            $dateToString: {
              format: "%d-%m-%Y T%H:%M",
              date: "$problemOccurredDateAndTimeOfBM",
              timezone: "Asia/Kolkata",
            },
          },
          loss_time: "$maintenanceReportFilledByMTD.breakDownTime",
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
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

router.get(
  "/getRequestSheetDataBasedOnSelectedDate/:filter/:selectedId/:date",
  authenticate,
  filterMiddleware,
  async (req, res, next) => {
    try {
      req.queryObj = {
        ...req.queryObj,
        problemOccurredDateAndTimeOfBM: {
          $gte: moment(req.params.date).startOf("day").toDate(),
          $lt: moment(req.params.date).endOf("day").toDate(),
        },
      };

      next();
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  },
  requestSheetMiddleware
);

//for production/line wise table data
router.get(
  "/getRequestSheetDataBasedOnFromAndToDateSelection/:filter/:selectedId/:toDate/:fromDate",
  authenticate,
  filterMiddleware,
  async (req, res, next) => {
    try {
      if (
        req?.params?.toDate !== "undefined" &&
        req?.params?.fromDate !== "undefined"
      ) {
        req.queryObj = {
          ...req?.queryObj,
          $and: [
            {
              problemOccurredDateAndTimeOfBM: {
                $gte: new Date(moment(req?.params?.fromDate).format()),
              },
            },
            {
              problemOccurredDateAndTimeOfBM: {
                $lte: new Date(
                  moment(req?.params?.toDate).endOf("day").format()
                ),
              },
            },
          ],
        };
      }

      next();
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  },
  requestSheetMiddleware
);

//get MTTR for production line wise 4 charts
router.get(
  "/getMTTRGraphData/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  targetMiddleware,
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
          },
        },
        {
          $project: {
            count: 1,
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
              $push: truncValue("$value.hours"),
            },
          },
        },
      ]);

      return res.status(201).json({
        message: "MTTR graph data get successfully",
        MTTRReportData: {
          ...MTTRReportData?.[0],
          target: req.target,
          backgroundColor: req.target?.map((item, index) =>
            MTTRReportData?.[0]?.data?.[index] <= item ? "#16FF00" : "red"
          ),
        },
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

const yearlyBdHourMiddleware = async (req, res, next) => {
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
            $push: truncValue("$value.hours"),
          },
        },
      },
    ]);

    req.BDHours = BDHours;
    next();
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

//get BD Hours for production line wise 4 charts
router.get(
  "/getBDHoursGraphData/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  targetMiddleware,
  yearlyBdHourMiddleware,
  async (req, res, next) => {
    try {
      return res.status(201).json({
        message: "BDHours graph data get successfully",
        BDHours: {
          ...req.BDHours?.[0],
          target: req.target,
          backgroundColor: req.target?.map((item, index) =>
            item > req.BDHours?.[0]?.data?.[index] ? "#16FF00" : "red"
          ),
        },
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/getLineWiseKpiStatusData/:selectedId",
  authenticate,
  async (req, res, nex) => {
    try {
      const returnQueryObj = ({ key, defaultValue }) => ({
        $concatArrays: [
          `$$value.${key}`,
          {
            $cond: [
              { $in: ["$$this.monthName", "$data.month"] },
              [
                {
                  $arrayElemAt: [
                    `$data.${key}`,
                    {
                      $indexOfArray: ["$data.month", "$$this.monthName"],
                    },
                  ],
                },
              ],
              [defaultValue],
            ],
          },
        ],
      });
      const lineWisePptExportationData = await RequestSheetOfBM.aggregate([
        {
          $match: {
            cellRef: mongoose.Types.ObjectId(req.params.selectedId),
            "preAggregationTimeStampOfRequestSheet.requestSheet_year":
              req.query?.selectedYear,
            "maintenanceReportFilledByMTD.breakDownTime": {
              $gt: 0,
            },
            maintenanceType: "BM",
          },
        },
        {
          $group: {
            _id: {
              lineRef: "$lineRef",
              month:
                "$preAggregationTimeStampOfRequestSheet.requestSheet_month",
              monthInDecimal: {
                $subtract: [{ $month: "$problemOccurredDateAndTimeOfBM" }, 1],
              },
            },
            count: { $sum: 1 },
            bdHours: {
              $sum: {
                $divide: ["$maintenanceReportFilledByMTD.breakDownTime", 60],
              },
            },
          },
        },
        {
          $lookup: {
            from: "lines",
            localField: "_id.lineRef",
            let: { month: "$_id.monthInDecimal" },
            foreignField: "_id",
            pipeline: [
              {
                $unwind: "$allTargetData",
              },
              {
                $match: {
                  "allTargetData.current_year": req.query?.selectedYear,
                },
              },
              {
                $project: {
                  line_sequence: 1,
                  line_name: 1,
                  monthlyBDHrsTarget: {
                    $map: {
                      input: {
                        $objectToArray: "$allTargetData.monthlyBDHrsTarget",
                      },
                      as: "obj",
                      in: "$$obj.v",
                    },
                  },
                  monthlyMTTRTarget: {
                    $map: {
                      input: {
                        $objectToArray: "$allTargetData.monthlyMTTRTarget",
                      },
                      as: "obj",
                      in: "$$obj.v",
                    },
                  },
                  monthlyMTBFTarget: {
                    $map: {
                      input: {
                        $objectToArray: "$allTargetData.monthlyMTBFTarget",
                      },
                      as: "obj",
                      in: "$$obj.v",
                    },
                  },
                  monthlyBDPercentageTarget: {
                    $map: {
                      input: {
                        $objectToArray:
                          "$allTargetData.monthlyBDPercentageTarget",
                      },
                      as: "obj",
                      in: "$$obj.v",
                    },
                  },
                  eachMonthProductionHrs: {
                    $arrayElemAt: [
                      {
                        $map: {
                          input: {
                            $objectToArray:
                              "$allTargetData.monthlyProductionHrs",
                          },
                          as: "obj",
                          in: "$$obj.v",
                        },
                      },
                      "$$month",
                    ],
                  },
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
          $group: {
            _id: {
              lineId: "$line._id",
              lineName: "$line.line_name",
              line_sequence: "$line.line_sequence",
              monthlyBDHrsTarget: "$line.monthlyBDHrsTarget",
              monthlyMTTRTarget: "$line.monthlyMTTRTarget",
              monthlyMTBFTarget: "$line.monthlyMTBFTarget",
              monthlyBDPercentageTarget: "$line.monthlyBDPercentageTarget",
            },
            data: {
              $push: {
                month: "$_id.month",
                bdHours: "$bdHours",
                backgroundColorForBDHrs: {
                  $cond: [
                    // { $gt: ["$bdHours", "$line.eachMonthBDHrsTarget.v"] },
                    {
                      $gt: [
                        "$bdHours",
                        {
                          $arrayElemAt: [
                            "$line.monthlyBDHrsTarget",
                            "$_id.monthInDecimal",
                          ],
                        },
                      ],
                    },
                    "ef5350",
                    "16FF00",
                  ],
                },
                mttrData: {
                  $divide: ["$bdHours", "$count"],
                },
                backgroundColorForMTTR: {
                  $cond: [
                    {
                      $lte: [
                        {
                          $divide: ["$bdHours", "$count"],
                        },
                        {
                          $arrayElemAt: [
                            "$line.monthlyMTTRTarget",
                            "$_id.monthInDecimal",
                          ],
                        },
                        // "$line.eachMonthBDHrsTarget.v",
                      ],
                    },
                    "16FF00",
                    "ef5350",
                  ],
                },
                mtbfData: {
                  $cond: [
                    { $eq: ["$line.eachMonthProductionHrs", 0] },
                    0,
                    {
                      $divide: [
                        {
                          $subtract: [
                            "$line.eachMonthProductionHrs",
                            "$bdHours",
                          ],
                        },
                        "$count",
                      ],
                    },
                  ],
                },
                backgroundColorForMTBF: {
                  $cond: [
                    { $eq: ["$line.eachMonthProductionHrs", 0] },
                    "ef5350",
                    {
                      $cond: [
                        {
                          $lte: [
                            {
                              $divide: [
                                {
                                  $subtract: [
                                    "$line.eachMonthProductionHrs",
                                    "$bdHours",
                                  ],
                                },
                                "$count",
                              ],
                            },
                            {
                              $arrayElemAt: [
                                "$line.monthlyMTBFTarget",
                                "$_id.monthInDecimal",
                              ],
                            },
                            // "$line.eachMonthBDHrsTarget.v",
                          ],
                        },
                        "ef5350",
                        "16FF00",
                      ],
                    },
                  ],
                },
                bdPercentage: {
                  $cond: [
                    { $eq: ["$line.eachMonthProductionHrs", 0] },
                    0,
                    {
                      $multiply: [
                        {
                          $divide: ["$bdHours", "$line.eachMonthProductionHrs"],
                        },
                        100,
                      ],
                    },
                  ],
                },
                backgroundColorForBDPercentage: {
                  $cond: [
                    { $eq: ["$line.eachMonthProductionHrs", 0] },
                    "ef5350",
                    {
                      $cond: [
                        {
                          $gt: [
                            {
                              $multiply: [
                                {
                                  $divide: [
                                    "$bdHours",
                                    "$line.eachMonthProductionHrs",
                                  ],
                                },
                                100,
                              ],
                            },
                            {
                              $arrayElemAt: [
                                "$line.monthlyBDPercentageTarget",
                                "$_id.monthInDecimal",
                              ],
                            },
                            // "$line.eachMonthBDHrsTarget.v",
                          ],
                        },
                        "ef5350",
                        "16FF00",
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
        {
          $sort: { "_id.line_sequence": 1 },
        },
        {
          $project: {
            _id: 0,
            lineName: "$_id.lineName",
            target: "$_id.monthlyBDHrsTarget",
            monthlyBDHrsTarget: "$_id.monthlyBDHrsTarget",
            monthlyMTTRTarget: "$_id.monthlyMTTRTarget",
            monthlyMTBFTarget: "$_id.monthlyMTBFTarget",
            monthlyBDPercentageTarget: "$_id.monthlyBDPercentageTarget",

            allData: {
              $reduce: {
                input: allMonths,
                initialValue: {
                  // months: [],
                  bdHours: [],
                  backgroundColorForBDHrs: [],
                  mttrData: [],
                  backgroundColorForMTTR: [],
                  mtbfData: [],
                  backgroundColorForMTBF: [],
                  bdPercentage: [],
                  backgroundColorForBDPercentage: [],
                },
                in: {
                  // months: {
                  //   $concatArrays: ["$$value.months", ["$$this.monthName"]],
                  // },
                  bdHours: returnQueryObj({ key: "bdHours", defaultValue: 0 }),
                  backgroundColorForBDHrs: returnQueryObj({
                    key: "backgroundColorForBDHrs",
                    defaultValue: "ef5350",
                  }),
                  mttrData: returnQueryObj({
                    key: "mttrData",
                    defaultValue: 0,
                  }),
                  backgroundColorForMTTR: returnQueryObj({
                    key: "backgroundColorForMTTR",
                    defaultValue: "ef5350",
                  }),
                  mtbfData: returnQueryObj({
                    key: "mtbfData",
                    defaultValue: 0,
                  }),
                  backgroundColorForMTBF: returnQueryObj({
                    key: "backgroundColorForMTBF",
                    defaultValue: "ef5350",
                  }),
                  bdPercentage: returnQueryObj({
                    key: "bdPercentage",
                    defaultValue: 0,
                  }),
                  backgroundColorForBDPercentage: returnQueryObj({
                    key: "backgroundColorForBDPercentage",
                    defaultValue: "ef5350",
                  }),
                },
              },
            },
          },
        },
      ]);

      return res.status(201).json({
        message: "Line-wise-KPI-status data get successfully",
        lineWisePptExportationData,
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);
router.post(
  "/getBDhoursVsCountDataFunction/:purpose/:filter/:selectedId",
  authenticate,
  async (req, res, next) => {
    try {
      let queryObjForPM = {},
        queryObjForBM = {
          "maintenanceReportFilledByMTD.workEndedDateOfBM": {
            $ne: null,
          },
          "maintenanceReportFilledByMTD.breakDownTime": {
            $gt: 0,
          },
          maintenanceType: "BM",
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
          let graterValue = boundaries?.includes(
            req.body?.graterThenHoursFilter * 1
          )
            ? req.body?.graterThenHoursFilter * 1 + 1
            : req.body?.graterThenHoursFilter * 1;

          boundaries = [...boundaries, graterValue, Infinity];
          customLegendArray.push({
            id: graterValue,
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
          count: "$data.count",
          sumOfBDhours: "$data.sumOfBDhours",
        },
        groupingObj: {
          count: { $push: "$requestSheets.data.count" },
          sumOfBDhours: {
            $push: truncValue("$requestSheets.data.sumOfBDhours"),
          },
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
                groupId: "$_id.groupId",
                sumOfBDhours: 1,
                machine_code: 1,
              },
            },
          ],

          BDCount: [
            {
              $project: {
                _id: 0,
                groupId: "$_id.groupId",
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
            sumOfBDhours: "$data.sumOfBDhours",
          },
          groupingObj: {
            sumOfBDhours: {
              $push: truncValue("$requestSheets.data.sumOfBDhours"),
            },
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
                  groupId: "$_id.groupId",
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
            count: "$data.count",
          },
          groupingObj: {
            count: { $push: "$requestSheets.data.count" },
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
                  groupId: "$_id.groupId",
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
                },
              },
              {
                $group: {
                  _id: null,
                  array: { $push: "$$ROOT" },
                  totalSumForSorting: { $sum: "$sumOfBDhours" },
                },
              },
              {
                $project: {
                  _id: 0,
                  totalSumForSorting: 1,
                  data: {
                    $map: {
                      input: customLegendArray,
                      as: "item",
                      in: {
                        $cond: [
                          { $in: ["$$item.id", "$array._id"] },
                          ...queryObjects?.mapArray,
                        ],
                      },
                    },
                  },
                },
              },
              {
                $unwind: "$data",
              },
              // {
              //   $replaceRoot: { newRoot: "$data" },
              // },
              // {
              //   $project: {
              //     _id: 0,
              //     groupId: "$data._id",
              //     ...queryObjects?.requestSheetProjection,
              //   },
              // },
            ],
            as: "requestSheets",
          },
        },
        {
          $project: {
            machine_code: 1,
            machine_nickname: 1,
            machine_name: 1,
            requestSheets: 1,
          },
        },
        {
          $sort: {
            "requestSheets.0.totalSumForSorting": -1,
          },
        },
        {
          $limit: req.query?.documentLimitInTheGraph * 1,
        },
        {
          $unwind: "$requestSheets",
        },

        {
          $group: {
            _id: {
              groupId: "$requestSheets.data._id.key",
              // totalSumForSorting: "$requestSheets.totalSumForSorting",
              // groupId: "$requestSheets.groupId",
            },
            ...queryObjects?.groupingObj,
            machine_code: { $push: "$machine_nickname" },
            // totalSumForSorting: { $push: "$requestSheets.totalSumForSorting" },
          },
        },

        {
          $facet: queryObjects?.facetObj,
        },
      ]);

      return res.status(201).json({
        message: "BD hours vs count graph data get successfully",
        // BDHoursVsCountData,
        BDHoursVsCountData: BDHoursVsCountData?.[0],
        labels: BDHoursVsCountData?.[0]?.labels?.[0]?.machine_code,
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/getProductOrLineReportHourlyFilter",
  authenticate,
  async (req, res, next) => {
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
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);
// add or update the hourly filter for product/line report
router.patch(
  "/hourlyFilterProductionOrLineWiseReport/:plantId",
  authenticate,
  async (req, res, next) => {
    try {
      delete req.body["_id"];

      let { greaterThan, lessThanValue, _id } = await Plant.findOneAndUpdate(
        { _id: req.params?.plantId },
        { $set: req.body },
        { new: true }
      );

      res.status(201).json({
        message: "Filter updated successfully",
        responseFilter: {
          _id,
          greaterThan,
          lessThanValue,
        },
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

// ---------------- Request Sheet Data -------------------

router.get(
  "/getRequestSheetDataLineWise",
  authenticate,
  async (req, res, next) => {
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
            pipeline: [
              {
                $project: {
                  user_type: 1,
                  tm_name: 1,
                },
              },
            ],
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
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res
        .status(500)
        .json({ message: error?.message, error: new Error(error) });
    }
  }
);

// ---------------- Problem Category Pie Chart -------------------
//API not in use
router.get(
  "/getProblemCategoryPieChart/:filter/:selectedId",
  authenticate,
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

            count: { $sum: 1 },
            // bdtime: { $sum: "$bdTime" },
            bdtime: {
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
          $sort: { _id: 1 },
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
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: "error?.message, error" });
    }
  }
);

// ---------------- BD Category Pie Chart -------------------
router.get(
  "/getPieChartData/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  async (req, res, next) => {
    try {
      const pieChartData = await RequestSheetOfBM.aggregate([
        {
          $match: req.queryObj,
        },
        {
          $unwind: "$categoriesOfRequestSheet",
        },

        {
          $match: {
            "categoriesOfRequestSheet.subCategory": {
              $exists: true,
              $ne: null,
            },
          },
        },

        {
          $group: {
            _id: {
              category: "$categoriesOfRequestSheet.category",
              subCategory: "$categoriesOfRequestSheet.subCategory",
            },
            count: { $sum: 1 },
            bdtime: {
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
          $sort: {
            "_id.subCategory": 1,
          },
        },

        {
          $group: {
            _id: {
              category: "$_id.category",
            },
            subcategories: {
              $push: "$_id.subCategory",

              // count: "$count",
              // bdtime: "$bdtime",
            },
            bdCount: {
              $push: "$count",
            },
            bdTime: {
              $push: { $trunc: ["$bdtime", 1] },
            },
          },
        },

        {
          $limit: 2,
        },

        {
          $sort: {
            "_id.category": 1,
          },
        },

        {
          $group: {
            _id: null,
            categories: {
              $push: {
                category: "$_id.category",
                subcategories: "$subcategories",
                bdCount: "$bdCount",
                bdTime: "$bdTime",
              },
            },
          },
        },

        {
          $project: {
            _id: 0,
            categories: 1,
          },
        },
      ]);

      return res.status(201).json({
        message: "Categories data in PieChart get successfully",
        categoriesPieChartData: pieChartData?.[0].categories,
        // pieChartData
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: "error?.message, error" });
    }
  }
);

// ---------------- BD percentage Chart -------------------

// const altproductionHourFiltration = async (req, res, next) => {
//   try {
//     // let schema;

//     // if (req.params?.filter === "based-on-section") {
//     //   schema = Section;
//     // } else if (req.params?.filter === "based-on-subSection") {
//     //   schema = SubSection;
//     // } else if (req.params?.filter === "based-on-cell") {
//     //   schema = Cell;
//     // } else {
//     //   schema = Line;
//     // }

//     // const data = await schema.aggregate([
//     //   {
//     //     $match: {
//     //       _id: mongoose.Types.ObjectId(req.params?.selectedId),
//     //     },
//     //   },
//     //   {
//     //     $unwind: "$productionHrs",
//     //   },
//     //   {
//     //     $match: {
//     //       "productionHrs.current_year": req.query?.selectedYear,
//     //     },
//     //   },
//     //   {
//     //     $project: {
//     //       productionHrs: 1,
//     //     },
//     //   },
//     // ]);

//     // req.productionHrs = data?.[0]?.productionHrs;

//     // next();

//     let queryObj = {},
//       obj = {
//         yearTotalProductionHrs: {
//           $sum: `$allTargetData.yearTotalProductionHrs`,
//         },
//       };

//     for (let i = 0; i < allMonths.length; i++) {
//       obj[allMonths?.[i]?.monthName] = {
//         $sum: `$allTargetData.monthlyProductionHrs.${allMonths?.[i]?.monthName}`,
//       };
//     }

//     if (req.params?.filter === "based-on-plant") {
//       queryObj = {
//         plant_names: mongoose.Types.ObjectId(req.params.selectedId),
//       };
//     } else if (req.params?.filter === "based-on-section") {
//       queryObj = {
//         section_names: mongoose.Types.ObjectId(req.params.selectedId),
//       };
//     } else if (req.params?.filter === "based-on-subSection") {
//       queryObj = {
//         subSection_names: mongoose.Types.ObjectId(req.params.selectedId),
//       };
//     } else if (req.params?.filter === "based-on-cell") {
//       queryObj = {
//         cell_names: mongoose.Types.ObjectId(req.params.selectedId),
//       };
//     } else if (req.params?.filter === "based-on-line") {
//       queryObj = {
//         _id: mongoose.Types.ObjectId(req.params.selectedId),
//       };
//     }

//     const data = await Line.aggregate([
//       {
//         $match: queryObj,
//       },
//       {
//         $unwind: "$allTargetData",
//       },
//       {
//         $match: {
//           "allTargetData.current_year": req.query?.selectedYear,
//         },
//       },
//       {
//         $group: {
//           _id: null,
//           line_name: {
//             $push: "$line_name",
//           },
//           ...obj,
//         },
//       },
//     ]);

//     // console.log("alt", data?.[0]?.allTargetData);

//     req.productionHrs = data?.[0]?.allTargetData;

//     next();
//   } catch (error) {
//     res.status(500).json({ message: error?.message, error });
//   }
// };

// ---------------- MTBF Chart -------------------
const productionHourFiltration = async (req, res, next) => {
  try {
    // let schema;

    // if (req.params?.filter === "based-on-section") {
    //   schema = Section;
    // } else if (req.params?.filter === "based-on-subSection") {
    //   schema = SubSection;
    // } else if (req.params?.filter === "based-on-cell") {
    //   schema = Cell;
    // } else {
    //   schema = Line;
    // }

    // const data = await schema.aggregate([
    //   {
    //     $match: {
    //       _id: mongoose.Types.ObjectId(req.params?.selectedId),
    //     },
    //   },
    //   {
    //     $unwind: "$productionHrs",
    //   },
    //   {
    //     $match: {
    //       "productionHrs.current_year": req.query?.selectedYear,
    //     },
    //   },
    //   {
    //     $project: {
    //       productionHrs: 1,
    //     },
    //   },
    // ]);

    // req.productionHrs = data?.[0]?.productionHrs;

    // next();

    let queryObj = {},
      obj = {
        yearTotalProductionHrs: {},
      };

    let productionHrs = {
      $sum: [],
    };

    for (let i = 0; i < allMonths.length; i++) {
      obj[allMonths?.[i]?.monthName] = {
        $avg: `$allTargetData.monthlyProductionHrs.${allMonths?.[i]?.monthName}`,
      };
      productionHrs["$sum"].push(
        `$allTargetData.monthlyProductionHrs.${allMonths?.[i]?.monthName}`
      );
      if (
        allMonths?.[i]?.monthName === currentMonth &&
        currentYear === req?.query?.selectedYear
      ) {
        break;
      }
    }

    obj["yearTotalProductionHrs"] = {
      $avg: productionHrs,
    };

    if (req.params?.filter === "based-on-plant") {
      queryObj = {
        plant_names: mongoose.Types.ObjectId(req.params.selectedId),
      };
    } else if (req.params?.filter === "based-on-section") {
      queryObj = {
        section_names: mongoose.Types.ObjectId(req.params.selectedId),
      };
    } else if (req.params?.filter === "based-on-subSection") {
      queryObj = {
        subSection_names: mongoose.Types.ObjectId(req.params.selectedId),
      };
    } else if (req.params?.filter === "based-on-cell") {
      queryObj = {
        cell_names: mongoose.Types.ObjectId(req.params.selectedId),
      };
    } else if (req.params?.filter === "based-on-line") {
      queryObj = {
        _id: mongoose.Types.ObjectId(req.params.selectedId),
      };
    }

    const data = await Line.aggregate([
      {
        $match: queryObj,
      },
      {
        $unwind: "$allTargetData",
      },
      {
        $match: {
          "allTargetData.current_year": req.query?.selectedYear,
        },
      },
      {
        $match: {
          "allTargetData.yearTotalProductionHrs": { $ne: 0 },
        },
      },
      {
        $group: {
          _id: null,
          line_name: {
            $push: "$line_name",
          },
          ...obj,
        },
      },
    ]);

    req.productionHrs = data?.[0];

    next();
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

const altproductionHourFiltration = async (req, res, next) => {
  try {
    let schema;

    if (req.params?.filter === "based-on-section") {
      schema = Section;
    } else if (req.params?.filter === "based-on-subSection") {
      schema = SubSection;
    } else if (req.params?.filter === "based-on-cell") {
      schema = Cell;
    } else {
      schema = Line;
    }

    const data = await schema.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId(req.params?.selectedId),
        },
      },
      {
        $unwind: "$allTargetData",
      },
      {
        $match: {
          "allTargetData.current_year": req.query?.selectedYear,
        },
      },

      {
        $project: {
          "allTargetData.monthlyProductionHrs": 1,
        },
      },
      // {
      //   $group: {
      //     _id: null,
      //     line_name: {
      //       $push: "$line_name",
      //     },
      //     ...obj,
      //   },
      // },
    ]);

    req.productionHrs = data?.[0]?.allTargetData;

    next();
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

const middlewareForFindingPercentageData = async (req, res, next) => {
  try {
    const getBdPercentage = await RequestSheetOfBM.aggregate([
      {
        // $match: {},
        $match: req.queryObj,
      },
      {
        $group: {
          // _id: {
          //   $dateToString: {
          //     format: "%m",
          //     date: "$problemOccurredDateAndTimeOfBM",
          //     timezone: timezone,
          //   },
          // },

          _id: "$preAggregationTimeStampOfRequestSheet.requestSheet_month",

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
        },
      },

      {
        $project: {
          // count: 1,

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
                  { $in: ["$$month.monthName", "$array._id"] },
                  {
                    month: "$$month.monthName",
                    value: {
                      $arrayElemAt: [
                        "$array",
                        {
                          $indexOfArray: ["$array._id", "$$month.monthName"],
                        },
                      ],
                    },
                  },
                  {
                    month: "$$month.monthName",
                    value: {
                      _id: "$$month.monthName",
                      // count: 0,
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

    return res.status(201).json({
      message: "BD Percentage data for Product/Line Wise KPI get successfully",
      data: {
        ...getBdPercentage?.[0],
        target: req?.target,
        backgroundColor: req.target?.map((item, index) =>
          getBdPercentage?.[0]?.data?.[index] <= item ? "#16FF00" : "red"
        ),
      },
    });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

const targetMiddlewareForProductionLineWise = async (req, res, next) => {
  try {
    let queryObj = {},
      pipelineForMtbf = [],
      pipelineForBd = [];

    if (req.params?.filter === "based-on-line") {
      queryObj = {
        _id: mongoose.Types.ObjectId(req.params.selectedId),
      };

      pipelineForMtbf = [
        {
          $project: {
            _id: 0,
            monthlyTarget: {
              $map: {
                input: {
                  $objectToArray: "$allTargetData.monthlyMTBFTarget",
                },
                as: "obj",
                in: "$$obj.v",
              },
            },
          },
        },
      ];
      pipelineForBd = [
        {
          $project: {
            _id: 0,
            monthlyTarget: {
              $map: {
                input: {
                  $objectToArray: "$allTargetData.monthlyBDPercentageTarget",
                },
                as: "obj",
                in: "$$obj.v",
              },
            },
          },
        },
      ];
    } else {
      let objMtbf = {},
        objBd = {},
        arr = [];

      for (let i = 0; i < allMonths.length; i++) {
        objMtbf[allMonths?.[i]?.monthName] = {
          $avg: `$allTargetData.monthlyMTBFTarget.${allMonths?.[i]?.monthName}`,
        };
        objBd[allMonths?.[i]?.monthName] = {
          $avg: `$allTargetData.monthlyBDPercentageTarget.${allMonths?.[i]?.monthName}`,
        };

        if (req.query?.targetKey === "monthlyMTBFTarget") {
          obj[`count_${allMonths?.[i]?.monthName}`] = {
            $sum: 1,
          };

          arr.push({
            $divide: [
              `$${allMonths?.[i]?.monthName}`,
              `$count_${allMonths?.[i]?.monthName}`,
            ],
          });
        } else {
          arr.push(`$${allMonths?.[i]?.monthName}`);
        }
      }

      pipelineForMtbf = [
        {
          $group: {
            _id: null,
            line_name: {
              $push: "$line_name",
            },
            ...objMtbf,
          },
        },
        {
          $project: {
            _id: 0,
            monthlyTarget: arr,
          },
        },
      ];
      pipelineForBd = [
        {
          $group: {
            _id: null,
            line_name: {
              $push: "$line_name",
            },
            ...objBd,
          },
        },
        {
          $project: {
            _id: 0,
            monthlyTarget: arr,
          },
        },
      ];

      if (req.params?.filter === "based-on-plant") {
        queryObj = {
          plant_names: mongoose.Types.ObjectId(req.params.selectedId),
        };
      } else if (req.params?.filter === "based-on-section") {
        queryObj = {
          section_names: mongoose.Types.ObjectId(req.params.selectedId),
        };
      } else if (req.params?.filter === "based-on-subSection") {
        queryObj = {
          subSection_names: mongoose.Types.ObjectId(req.params.selectedId),
        };
      } else if (req.params?.filter === "based-on-cell") {
        queryObj = {
          cell_names: mongoose.Types.ObjectId(req.params.selectedId),
        };
      }
    }

    const targetForMtbf = await Line.aggregate([
      {
        $match: queryObj,
      },
      {
        $unwind: "$allTargetData",
      },
      {
        $match: {
          "allTargetData.current_year": req.query?.selectedYear,
        },
      },

      ...pipelineForMtbf,
    ]);

    const targetForBdPercentage = await Line.aggregate([
      {
        $match: queryObj,
      },
      {
        $unwind: "$allTargetData",
      },
      {
        $match: {
          "allTargetData.current_year": req.query?.selectedYear,
        },
      },

      ...pipelineForBd,
    ]);

    req.targetForMtbf = targetForMtbf?.[0]?.monthlyTarget || [];
    req.targetForBdPercentage = targetForBdPercentage?.[0]?.monthlyTarget || [];
    next();
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

const productionMiddleware = async (req, res, next) => {
  try {
    let queryObj = {},
      obj = {
        yearTotalProductionHrs: {
          $sum: `$allTargetData.yearTotalProductionHrs`,
        },
      };

    for (let i = 0; i < allMonths.length; i++) {
      obj[allMonths?.[i]?.monthName] = {
        $sum: `$allTargetData.monthlyProductionHrs.${allMonths?.[i]?.monthName}`,
      };
    }

    if (req.params?.filter === "based-on-plant") {
      queryObj = {
        plant_names: mongoose.Types.ObjectId(req.params.selectedId),
      };
    } else if (req.params?.filter === "based-on-section") {
      queryObj = {
        section_names: mongoose.Types.ObjectId(req.params.selectedId),
      };
    } else if (req.params?.filter === "based-on-subSection") {
      queryObj = {
        subSection_names: mongoose.Types.ObjectId(req.params.selectedId),
      };
    } else if (req.params?.filter === "based-on-cell") {
      queryObj = {
        cell_names: mongoose.Types.ObjectId(req.params.selectedId),
      };
    } else if (req.params?.filter === "based-on-line") {
      queryObj = {
        _id: mongoose.Types.ObjectId(req.params.selectedId),
      };
    }

    const data = await Line.aggregate([
      {
        $match: queryObj,
      },
      {
        $unwind: "$allTargetData",
      },
      {
        $match: {
          "allTargetData.current_year": req.query?.selectedYear,
        },
      },
      {
        $group: {
          _id: null,
          line_name: {
            $push: "$line_name",
          },
          ...obj,
        },
      },
    ]);

    // console.log("DATA",data)

    req.productionHrs = data?.[0];

    next();
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

const middlewareForFindingMTBFData = async (req, res, next) => {
  try {
    const mtbfData = await RequestSheetOfBM.aggregate([
      {
        // $match: {},
        $match: req.queryObj,
      },
      {
        $group: {
          _id: "$preAggregationTimeStampOfRequestSheet.requestSheet_month",

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
        },
      },
      // ...req.queryPipeline,

      {
        $project: {
          count: 1,

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
                  { $in: ["$$month.monthName", "$array._id"] },
                  {
                    month: "$$month.monthName",
                    value: {
                      $arrayElemAt: [
                        "$array",
                        {
                          $indexOfArray: ["$array._id", "$$month.monthName"],
                        },
                      ],
                    },
                  },
                  {
                    month: "$$month.monthName",
                    value: {
                      _id: "$$month.monthName",
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

    return res.status(201).json({
      message: "MTBF data in Product/Line Report get successfully",

      data: {
        ...mtbfData?.[0],
        target: req.targetForMtbf,
        backgroundColor: req.targetForMtbf?.map((item, index) =>
          mtbfData?.[0]?.data?.[index] >= item ? "#16FF00" : "red"
        ),
      },
    });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

router.get(
  "/getMtbfData/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  targetMiddlewareForProductionLineWise,
  productionMiddleware,
  async (req, res, next) => {
    try {
      req.hourCalculationFormula = {
        $divide: [
          {
            $subtract: [
              {
                $getField: {
                  field: "v",
                  input: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: {
                            $objectToArray: req.productionHrs,
                          },
                          as: "monthlyProduction",
                          cond: {
                            $eq: ["$$monthlyProduction.k", "$_id"],
                          },
                        },
                      },
                      0,
                    ],
                  },
                },
              },
              "$hours",
            ],
          },
          "$count",
        ],
      };

      next();
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  },
  middlewareForFindingMTBFData
);

router.get(
  "/getBdPercentage/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  targetMiddleware,
  productionHourFiltration,
  async (req, res, next) => {
    try {
      req.hourCalculationFormula = {
        $multiply: [
          {
            $divide: [
              "$hours",
              {
                $getField: {
                  field: "v",
                  input: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: {
                            $objectToArray: req.productionHrs,
                          },
                          as: "monthlyProduction",
                          cond: {
                            $eq: ["$$monthlyProduction.k", "$_id"],
                          },
                        },
                      },
                      0,
                    ],
                  },
                },
              },
            ],
          },
          100,
        ],
      };

      req.message =
        "BD percentage data in Product/Line Report get successfully";
      next();
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: "error?.message, error" });
    }
  },
  middlewareForFindingPercentageData
);

router.get(
  "/getSectionsDropdownValue",
  authenticate,
  async (req, res, next) => {
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
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get("/getCellsDropdownValue", authenticate, async (req, res, next) => {
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
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
});

// ---------------- Monthly BD Trend Chart -------------------
const bdHourTrendMiddleware = async (req, res, next) => {
  try {
    req.bdTrendData = [
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%m",
              date: "$problemOccurredDateAndTimeOfBM",
              timezone: timezone,
            },
          },
          totalHours: {
            $push: {
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
        },
      },
      {
        $project: {
          _id: 1,
          totalHours: 1,
          categorizedHours: {
            $map: {
              input: "$totalHours",
              as: "hour",
              in: {
                lessThanOne: { $cond: [{ $lt: ["$$hour", 1] }, "$$hour", 0] },
                lessThanTwo: { $cond: [{ $lt: ["$$hour", 2] }, "$$hour", 0] },
                greaterThanTwo: {
                  $cond: [{ $gte: ["$$hour", 2] }, "$$hour", 0],
                },
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          totalHours: 1,
          lessThanOne: { $sum: "$categorizedHours.lessThanOne" },
          lessThanTwo: { $sum: "$categorizedHours.lessThanTwo" },
          greaterThanTwo: { $sum: "$categorizedHours.greaterThanTwo" },
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

          lessThanOne: { $push: { $trunc: ["$value.lessThanOne", 1] } },

          lessThanTwo: { $push: { $trunc: ["$value.lessThanTwo", 1] } },
          greaterThanTwo: { $push: { $trunc: ["$value.greaterThanTwo", 1] } },
        },
      },
      {
        $project: {
          _id: 0,
          hourlyArray: {
            $map: {
              input: [">2", "<2", "<1"],
              as: "label",
              in: {
                label: "$$label",
                data: {
                  $switch: {
                    branches: [
                      {
                        case: { $eq: ["$$label", ">2"] },
                        then: "$greaterThanTwo",
                      },
                      {
                        case: { $eq: ["$$label", "<2"] },
                        then: "$lessThanTwo",
                      },
                      {
                        case: { $eq: ["$$label", "<1"] },
                        then: "$lessThanOne",
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
    ];

    next();
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

const hourlyMonthlyBdTrendMiddleware = async (req, res, next) => {
  try {
    const bdTrendData = await RequestSheetOfBM.aggregate([
      {
        $match: req.queryObj,
      },
      {
        $group: {
          _id: "$preAggregationTimeStampOfRequestSheet.requestSheet_month",

          ...req.grpQuery,
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
                  { $in: ["$$month.monthName", "$array._id"] },
                  {
                    month: "$$month.monthName",
                    value: {
                      $arrayElemAt: [
                        "$array",
                        {
                          $indexOfArray: ["$array._id", "$$month.monthName"],
                        },
                      ],
                    },
                  },
                  {
                    month: "$$month.monthName",
                    value: {
                      _id: "$$month.monthName",
                      lessThanOne: 0,
                      lessThanTwo: 0,
                      greaterThanTwo: 0,
                      totalCount: 0,
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
          lessThanOne: { $push: { $trunc: ["$value.lessThanOne", 1] } },
          lessThanTwo: { $push: { $trunc: ["$value.lessThanTwo", 1] } },
          greaterThanTwo: { $push: { $trunc: ["$value.greaterThanTwo", 1] } },
          totalCount: { $push: "$value.totalCount" },
        },
      },
    ]);

    return res.status(200).json({
      message: "Monthly BD trend data for hourly get successfully",
      bdTrendData: [
        { label: "<1", data: bdTrendData?.[0].lessThanOne },
        { label: "<2", data: bdTrendData?.[0].lessThanTwo },
        { label: ">2", data: bdTrendData?.[0].greaterThanTwo },
        // { label: "Total", data: bdTrendData?.[0].totalCount },
      ],
      totalCount: bdTrendData?.[0].totalCount,
      bdTrendDataTarget: req.target,
    });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

const sectionMonthlyBdTrendForPlantMiddleware = async (req, res, next) => {
  try {
    let sectionIds;
    let sectionIdsYes;

    if (req.params.selectedId) {
      const sections = await Section.find({
        plant_names: mongoose.Types.ObjectId(req.params.selectedId),
      });
      // console.log(sections);

      const noDashboardSections = sections.filter(
        (section) => section.dashboardLevel === "No"
      );
      const yesDashboardSections = sections.filter(
        (section) => section.dashboardLevel === "Yes"
      );

      sectionIds = noDashboardSections.map((section) => section._id.toString());
      sectionIdsYes = yesDashboardSections.map((section) =>
        section._id.toString()
      );
    }

    const subSectionQuery = await SubSection.aggregate([
      {
        $match: { section_names: mongoose.Types.ObjectId(...sectionIds) },
      },
      {
        $lookup: {
          from: "requestsheetofbms",
          let: { subsection: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$$subsection", "$subSectionRef"],
                },
                "preAggregationTimeStampOfRequestSheet.requestSheet_year":
                  req.query.selectedYear,
              },
            },
            {
              $group: {
                _id: {
                  date: "$preAggregationTimeStampOfRequestSheet.requestSheet_month",
                },

                count: { $sum: 1 },

                sumBM: {
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
                _id: "$section_name",
                label: { $first: "$section_name" },
                sectionWiseTotal: {
                  $push: {
                    month: "$_id.date",

                    bdTimeSum: { $trunc: [req.mttrOrSumFormula, 1] },
                  },
                },
              },
            },

            {
              $project: {
                _id: 0,
                // label: 1,
                data: {
                  $map: {
                    input: allMonths,
                    as: "month",
                    in: {
                      $cond: [
                        {
                          $in: ["$$month.monthName", "$sectionWiseTotal.month"],
                        },
                        {
                          $arrayElemAt: [
                            "$sectionWiseTotal.bdTimeSum",
                            {
                              $indexOfArray: [
                                "$sectionWiseTotal.month",
                                "$$month.monthName",
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

            {
              $unwind: "$data",
            },
          ],
          as: "section_data",
        },
      },

      // {
      //   $unwind: "$section_data",
      // },

      {
        $sort: { subSection_name: 1 },
      },

      {
        $project: {
          _id: 0,
          label: "$subSection_name",
          data: "$section_data.data",
        },
      },
    ]);

    const sectionQuery = await Section.aggregate([
      {
        $match: { _id: mongoose.Types.ObjectId(...sectionIdsYes) },
      },

      // {
      //   $group : {
      //     _id : "$section_name"
      //   }
      // },

      {
        $lookup: {
          from: "requestsheetofbms",
          let: { section: "$_id" },
          pipeline: [
            {
              $match: {
                maintenanceType: "BM",
                $expr: {
                  $eq: ["$$section", "$sectionRef"],
                },
                "preAggregationTimeStampOfRequestSheet.requestSheet_year":
                  req.query?.selectedYear,
              },
            },

            {
              $group: {
                _id: {
                  date: "$preAggregationTimeStampOfRequestSheet.requestSheet_month",
                },

                count: { $sum: 1 },

                sumBM: {
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
                _id: "$section_name",
                label: { $first: "$section_name" },
                sectionWiseTotal: {
                  $push: {
                    month: "$_id.date",

                    bdTimeSum: { $trunc: [req.mttrOrSumFormula, 1] },
                  },
                },
              },
            },

            {
              $project: {
                _id: 0,
                // label: 1,
                data: {
                  $map: {
                    input: allMonths,
                    as: "month",
                    in: {
                      $cond: [
                        {
                          $in: ["$$month.monthName", "$sectionWiseTotal.month"],
                        },
                        {
                          $arrayElemAt: [
                            "$sectionWiseTotal.bdTimeSum",
                            {
                              $indexOfArray: [
                                "$sectionWiseTotal.month",
                                "$$month.monthName",
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
          ],
          as: "section_data",
        },
      },

      {
        $unwind: "$section_data",
      },

      {
        $sort: { section_name: 1 },
      },
      {
        $project: {
          _id: 0,
          label: "$section_name",
          data: "$section_data.data",
        },
      },
    ]);

    const bdTrendData = [...subSectionQuery, ...sectionQuery];

    const averageData = await RequestSheetOfBM.aggregate([
      {
        $match: {
          plantRef: mongoose.Types.ObjectId(req.params.selectedId),

          "preAggregationTimeStampOfRequestSheet.requestSheet_year":
            req.query.selectedYear,
        },
      },
      {
        $group: {
          _id: {
            date: "$preAggregationTimeStampOfRequestSheet.requestSheet_month",
            section: "$sectionRef",
            subSection: "$subSectionRef",
          },
          count: { $sum: 1 },
          sumBM: {
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
        },
      },

      {
        $group: {
          _id: "$_id.date",

          bdTimeSum: { $push: { $trunc: [req.mttrOrSumFormula, 1] } },
        },
      },

      {
        $group: {
          _id: null,
          sectionWiseTotal: {
            $push: {
              month: "$_id",
              avgData: { $avg: "$bdTimeSum" },
            },
          },
        },
      },

      {
        $project: {
          _id: 0,
          // months : "$sectionWiseTotal.month",
          data: {
            $map: {
              input: allMonths,
              as: "month",
              in: {
                $cond: [
                  {
                    $in: ["$$month.monthName", "$sectionWiseTotal.month"],
                  },
                  {
                    $arrayElemAt: [
                      "$sectionWiseTotal.avgData",
                      {
                        $indexOfArray: [
                          "$sectionWiseTotal.month",
                          "$$month.monthName",
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
      bdTrendDataTarget: req.target,
      averageData: averageData?.[0].data,
    });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

const cellMonthlyBdTrendForSectionMiddleware = async (req, res, next) => {
  try {
    const bdTrendData = await Cell.aggregate([
      {
        $match: {
          $or: [
            {
              subSection_names: mongoose.Types.ObjectId(req.params.selectedId),
            },
            { section_names: mongoose.Types.ObjectId(req.params.selectedId) },
          ],
        },
      },

      {
        $lookup: {
          from: "requestsheetofbms",
          let: { cell: "$_id" },
          pipeline: [
            {
              $match: {
                maintenanceType: "BM",
                $expr: {
                  $eq: ["$$cell", "$cellRef"],
                },
                "preAggregationTimeStampOfRequestSheet.requestSheet_year":
                  req?.query?.selectedYear,
              },
            },

            {
              $group: {
                _id: {
                  date: "$preAggregationTimeStampOfRequestSheet.requestSheet_month",
                },

                count: { $sum: 1 },

                sumBM: {
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
                _id: "$cell_name",
                label: { $first: "$cell_name" },
                cellWiseTotal: {
                  $push: {
                    month: "$_id.date",
                    bdTimeSum: { $trunc: [req.mttrOrSumFormula, 1] },
                    // avgData: {$avg : "$sumBM" }
                  },
                },
              },
            },

            {
              $project: {
                _id: 0,
                // months : "$cellWiseTotal.month",
                data: {
                  $map: {
                    input: allMonths,
                    as: "month",
                    in: {
                      $cond: [
                        {
                          $in: ["$$month.monthName", "$cellWiseTotal.month"],
                        },
                        {
                          $arrayElemAt: [
                            "$cellWiseTotal.bdTimeSum",
                            {
                              $indexOfArray: [
                                "$cellWiseTotal.month",
                                "$$month.monthName",
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

            {
              $unwind: "$data",
            },
          ],
          as: "cell_data",
        },
      },

      {
        $sort: { cell_name: 1 },
      },

      {
        $project: {
          _id: 0,
          // months : "$cell_data.months",
          label: "$cell_name",
          data: "$cell_data.data",
        },
      },
    ]);
    // console.log("req.params.selectedId",req.params.selectedId)
    const averageData = await RequestSheetOfBM.aggregate([
      {
        $match: {
          $or: [
            {
              subSectionRef: mongoose.Types.ObjectId(req.params.selectedId),
            },
            { sectionRef: mongoose.Types.ObjectId(req.params.selectedId) },
          ],

          "preAggregationTimeStampOfRequestSheet.requestSheet_year":
            req.query.selectedYear,
        },
      },
      {
        $group: {
          _id: {
            date: "$preAggregationTimeStampOfRequestSheet.requestSheet_month",
            cell: "$cellRef",
          },
          count: { $sum: 1 },
          sumBM: {
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
        },
      },

      {
        $group: {
          _id: "$_id.date",

          bdTimeSum: { $push: { $trunc: [req.mttrOrSumFormula, 1] } },
        },
      },

      {
        $group: {
          _id: null,
          cellWiseTotal: {
            $push: {
              month: "$_id",
              avgData: { $avg: "$bdTimeSum" },
            },
          },
        },
      },

      {
        $project: {
          _id: 0,
          // months : "$cellWiseTotal.month",
          data: {
            $map: {
              input: allMonths,
              as: "month",
              in: {
                $cond: [
                  {
                    $in: ["$$month.monthName", "$cellWiseTotal.month"],
                  },
                  {
                    $arrayElemAt: [
                      "$cellWiseTotal.avgData",
                      {
                        $indexOfArray: [
                          "$cellWiseTotal.month",
                          "$$month.monthName",
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
      message: "Cell Wise Monthly BD trend data for Section get successfully",
      bdTrendData,
      bdTrendDataTarget: req.target,
      averageData: averageData?.[0]?.data,
    });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

const lineMonthlyBdTrendForSectionMiddleware = async (req, res, next) => {
  try {
    const bdTrendData = await Line.aggregate([
      {
        $match: {
          cell_names: mongoose.Types.ObjectId(req.params.selectedId),
        },
      },

      // {
      //   $group : {
      //     _id : "$section_name"
      //   }
      // },

      {
        $lookup: {
          from: "requestsheetofbms",
          let: { line: "$_id" },
          pipeline: [
            {
              $match: {
                maintenanceType: "BM",
                $expr: {
                  $eq: ["$$line", "$lineRef"],
                },
                "preAggregationTimeStampOfRequestSheet.requestSheet_year":
                  req.query?.selectedYear,
              },
            },

            {
              $group: {
                _id: {
                  date: "$preAggregationTimeStampOfRequestSheet.requestSheet_month",
                },
                count: { $sum: 1 },
                sumBM: {
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
                _id: "$line_name",
                label: { $first: "$line_name" },
                lineWiseTotal: {
                  $push: {
                    month: "$_id.date",
                    // bdTimeSum: req.mttrOrSumFormula,
                    bdTimeSum: { $trunc: [req.mttrOrSumFormula, 1] },
                  },
                },
              },
            },

            {
              $project: {
                _id: 0,
                // label: 1,
                data: {
                  $map: {
                    input: allMonths,
                    as: "month",
                    in: {
                      $cond: [
                        {
                          $in: ["$$month.monthName", "$lineWiseTotal.month"],
                        },
                        {
                          $arrayElemAt: [
                            "$lineWiseTotal.bdTimeSum",
                            {
                              $indexOfArray: [
                                "$lineWiseTotal.month",
                                "$$month.monthName",
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

            {
              $unwind: "$data",
            },
          ],
          as: "line_data",
        },
      },
      // {
      //   $unwind: "$line_data",
      // },
      {
        $sort: { line_name: 1 },
      },
      {
        $project: {
          _id: 0,
          label: "$line_name",
          data: "$line_data.data",
        },
      },
    ]);

    const averageData = await RequestSheetOfBM.aggregate([
      {
        $match: {
          cellRef: mongoose.Types.ObjectId(req.params.selectedId),

          "preAggregationTimeStampOfRequestSheet.requestSheet_year":
            req.query.selectedYear,
        },
      },
      {
        $group: {
          _id: {
            date: "$preAggregationTimeStampOfRequestSheet.requestSheet_month",
            line: "$lineRef",
          },
          count: { $sum: 1 },
          sumBM: {
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
        },
      },

      {
        $group: {
          _id: "$_id.date",

          bdTimeSum: { $push: { $trunc: [req.mttrOrSumFormula, 1] } },
        },
      },

      {
        $group: {
          _id: null,
          lineWiseTotal: {
            $push: {
              month: "$_id",
              avgData: { $avg: "$bdTimeSum" },
            },
          },
        },
      },

      {
        $project: {
          _id: 0,
          // months : "$lineWiseTotal.month",
          data: {
            $map: {
              input: allMonths,
              as: "month",
              in: {
                $cond: [
                  {
                    $in: ["$$month.monthName", "$lineWiseTotal.month"],
                  },
                  {
                    $arrayElemAt: [
                      "$lineWiseTotal.avgData",
                      {
                        $indexOfArray: [
                          "$lineWiseTotal.month",
                          "$$month.monthName",
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
      message: "Line Wise Monthly BD trend data for line get successfully",

      bdTrendData,
      bdTrendDataTarget: req.target,
      averageData: averageData?.[0].data,
    });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

const machineMonthlyBdTrendForSectionMiddleware = async (req, res, next) => {
  try {
    const bdTrendData = await Machine.aggregate([
      {
        $match: {
          line_names: mongoose.Types.ObjectId(req.params.selectedId),
        },
      },

      // {
      //   $group : {
      //     _id : "$section_name"
      //   }
      // },

      {
        $lookup: {
          from: "requestsheetofbms",
          let: { machine: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$$machine", "$machineRef"],
                },
                "preAggregationTimeStampOfRequestSheet.requestSheet_year":
                  req.query.selectedYear,
              },
            },

            {
              $group: {
                _id: {
                  date: "$preAggregationTimeStampOfRequestSheet.requestSheet_month",
                },
                count: { $sum: 1 },
                sumBM: {
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
                _id: "$machine_name",
                label: { $first: "$machine_name" },
                machineWiseTotal: {
                  $push: {
                    month: "$_id.date",
                    bdTimeSum: { $trunc: [req.mttrOrSumFormula, 1] },
                  },
                },
              },
            },

            {
              $project: {
                _id: 0,
                // label: 1,
                data: {
                  $map: {
                    input: allMonths,
                    as: "month",
                    in: {
                      $cond: [
                        {
                          $in: ["$$month.monthName", "$machineWiseTotal.month"],
                        },
                        {
                          $arrayElemAt: [
                            "$machineWiseTotal.bdTimeSum",
                            {
                              $indexOfArray: [
                                "$machineWiseTotal.month",
                                "$$month.monthName",
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

            {
              $unwind: "$data",
            },
          ],
          as: "machine_data",
        },
      },
      // {
      //   $unwind: "$line_data",
      // },

      {
        $sort: { machine_name: 1 },
      },

      {
        $project: {
          _id: 0,
          label: "$machine_name",
          data: "$machine_data.data",
        },
      },
    ]);

    const averageData = await RequestSheetOfBM.aggregate([
      {
        $match: {
          lineRef: mongoose.Types.ObjectId(req.params.selectedId),

          "preAggregationTimeStampOfRequestSheet.requestSheet_year":
            req.query.selectedYear,
        },
      },
      {
        $group: {
          _id: {
            date: "$preAggregationTimeStampOfRequestSheet.requestSheet_month",
            machine: "$machineRef",
          },
          count: { $sum: 1 },
          sumBM: {
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
        },
      },

      {
        $group: {
          _id: "$_id.date",

          bdTimeSum: { $push: { $trunc: [req.mttrOrSumFormula, 1] } },
        },
      },

      {
        $group: {
          _id: null,
          machineWiseTotal: {
            $push: {
              month: "$_id",
              avgData: { $avg: "$bdTimeSum" },
            },
          },
        },
      },

      {
        $project: {
          _id: 0,
          // months : "$machineWiseTotal.month",
          data: {
            $map: {
              input: allMonths,
              as: "month",
              in: {
                $cond: [
                  {
                    $in: ["$$month.monthName", "$machineWiseTotal.month"],
                  },
                  {
                    $arrayElemAt: [
                      "$machineWiseTotal.avgData",
                      {
                        $indexOfArray: [
                          "$machineWiseTotal.month",
                          "$$month.monthName",
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
      message: "Machine Wise Monthly BD trend data for line get successfully",

      bdTrendData,
      bdTrendDataTarget: req.target,
      averageData: averageData?.[0].data,
    });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

const filterForMonthlyData = async (req, res, next) => {
  try {
    const grpQuery = {
      // _id: "$preAggregationTimeStampOfRequestSheet.requestSheet_month",

      lessThanOne: {
        $sum: {
          $cond: [
            {
              $lte: [
                {
                  $divide: ["$maintenanceReportFilledByMTD.breakDownTime", 60],
                },
                1,
              ],
            },
            {
              $divide: ["$maintenanceReportFilledByMTD.breakDownTime", 60],
            },
            0,
          ],
        },
      },

      lessThanTwo: {
        $sum: {
          $cond: [
            {
              $and: [
                {
                  $gt: [
                    {
                      $divide: [
                        "$maintenanceReportFilledByMTD.breakDownTime",
                        60,
                      ],
                    },
                    1,
                  ],
                },
                {
                  $lte: [
                    {
                      $divide: [
                        "$maintenanceReportFilledByMTD.breakDownTime",
                        60,
                      ],
                    },
                    2,
                  ],
                },
              ],
            },
            {
              $divide: ["$maintenanceReportFilledByMTD.breakDownTime", 60],
            },
            0,
          ],
        },
      },
      greaterThanTwo: {
        $sum: {
          $cond: [
            {
              $gt: [
                {
                  $divide: ["$maintenanceReportFilledByMTD.breakDownTime", 60],
                },
                2,
              ],
            },
            {
              $divide: ["$maintenanceReportFilledByMTD.breakDownTime", 60],
            },
            0,
          ],
        },
      },
      totalCount: { $sum: 1 },
    };

    const grpQueryForAllSum = {
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
    };

    req.grpQuery = grpQuery;
    req.grpQueryForAllSum = grpQueryForAllSum;

    next();
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

const middlewareForPlant = async (req, res, next) => {
  let queryObj;

  const plant = await Plant.findOne({
    plant_id: req?.rootUser?.plant_data?.split("-")?.[0],
  });

  if (req.params.filter === "based-on-plantId") {
    queryObj = {
      ...req.queryObj,
      plantRef: mongoose.Types.ObjectId(plant._id),
    };
  } else {
    queryObj = {
      ...req.queryObj,
    };
  }

  // console.log("PlantqueryObj", queryObj);

  req.queryObj = queryObj;
  next();
};

const targetMiddlewareForMBD = async (req, res, next) => {
  try {
    let queryObj = {},
      pipeline = [],
      pipelineCount = [];
    if (req.params?.filter === "based-on-line") {
      queryObj = {
        _id: mongoose.Types.ObjectId(req.params.selectedId),
      };

      pipeline = [
        {
          $project: {
            _id: 0,
            monthlyTarget: {
              $map: {
                input: {
                  $objectToArray: "$allTargetData.monthlyBDHrsTarget",
                },
                as: "obj",
                in: "$$obj.v",
              },
            },
          },
        },
      ];
    } else {
      let objCount = {
        yearTotalMBDCountTarget: {
          $sum: `$allTargetData.yearTotalMBDCountTarget`,
        },
      };

      let obj = {
        yearTotalBDHrsTarget: {
          $sum: `$allTargetData.monthlyBDHrsTarget`,
        },
      };

      arr = [];

      for (let i = 0; i < allMonths.length; i++) {
        obj[allMonths?.[i]?.monthName] = {
          $sum: `$allTargetData.monthlyBDHrsTarget.${allMonths?.[i]?.monthName}`,
        };
        objCount[allMonths?.[i]?.monthName] = {
          $sum: `$allTargetData.monthlyMBDCountTarget.${allMonths?.[i]?.monthName}`,
        };

        arr.push(`$${allMonths?.[i]?.monthName}`);
      }

      pipeline = [
        {
          $group: {
            _id: null,
            line_name: {
              $push: "$line_name",
            },
            ...obj,
          },
        },

        {
          $project: {
            _id: 0,
            yearlyTarget: "$yearTotalBDHrsTarget",
            monthlyTarget: arr,
          },
        },
      ];

      pipelineCount = [
        {
          $group: {
            _id: null,
            line_name: {
              $push: "$cell_name",
            },
            ...objCount,
          },
        },
        {
          $project: {
            _id: 0,
            yearlyTarget: "$yearTotalMBDCountTarget",
            monthlyTarget: arr,
          },
        },
      ];

      if (req.params?.filter === "based-on-plant") {
        queryObj = {
          plant_names: mongoose.Types.ObjectId(req.params.selectedId),
        };
      } else if (req.params?.filter === "based-on-section") {
        queryObj = {
          section_names: mongoose.Types.ObjectId(req.params.selectedId),
        };
      } else if (req.params?.filter === "based-on-subSection") {
        queryObj = {
          subSection_names: mongoose.Types.ObjectId(req.params.selectedId),
        };
      } else if (req.params?.filter === "based-on-cell") {
        queryObj = {
          cell_names: mongoose.Types.ObjectId(req.params.selectedId),
        };
      }
    }

    const target = await Line.aggregate([
      {
        $match: queryObj,
      },
      {
        $unwind: "$allTargetData",
      },
      {
        $match: {
          "allTargetData.current_year": req.query?.selectedYear,
        },
      },

      ...pipeline,

      // {
      //   $project: {
      //     monthlyBDHrsTarget: {
      //       $objectToArray: "$allTargetData.monthlyBDHrsTarget"
      //     },
      //     // monthlyMBDCountTarget: {
      //     //   $objectToArray: "$allTargetData.monthlyMBDCountTarget"
      //     // }
      //   }
      // },
      // {
      //   $unwind: "$monthlyBDHrsTarget"
      // },
      // {
      //   $group: {
      //     _id: "$monthlyBDHrsTarget.k",
      //     totalMonthlyBDHrsTarget: { $sum: "$monthlyBDHrsTarget.v" },
      //     // totalMonthlyMBDCountTarget: { $sum: "$monthlyMBDCountTarget.v" }
      //   }
      // },
      // {
      //   $project: {
      //     monthName: "$_id",
      //     _id: 0,
      //     totalMonthlyBDHrsTarget: 1,
      //     // totalMonthlyMBDCountTarget: 1
      //   }
      // },
    ]);

    const targetForCount = await Cell.aggregate([
      {
        $match: queryObj,
      },
      {
        $unwind: "$allTargetData",
      },
      {
        $match: {
          "allTargetData.current_year": req.query?.selectedYear,
        },
      },

      ...pipelineCount,
    ]);

    // console.log("target?.[0]?.monthlyTarget",targetForCount?.[0]?.yearlyTarget)

    req.target = target?.[0]?.monthlyTarget || [];
    req.targetForCount = targetForCount?.[0]?.monthlyTarget || [];
    req.targetForCountTotal = targetForCount?.[0]?.yearlyTarget || [];

    next();
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

const yearlyTargetMiddlewareForMBD = async (req, res, next) => {
  try {
    // console.log("YEARARRA", req.selectedYear)

    let queryObj = {};

    if (req.params?.filter === "based-on-plant") {
      queryObj = {
        plant_names: mongoose.Types.ObjectId(req.params.selectedId),
      };
    } else if (req.params?.filter === "based-on-section") {
      queryObj = {
        section_names: mongoose.Types.ObjectId(req.params.selectedId),
      };
    } else if (req.params?.filter === "based-on-subSection") {
      queryObj = {
        subSection_names: mongoose.Types.ObjectId(req.params.selectedId),
      };
    }
    // else if (req.params?.filter === "based-on-cell") {
    //   queryObj = {
    //     cell_names: mongoose.Types.ObjectId(req.params.selectedId),
    //   };
    // }

    const targetForYearlyChart = await Line.aggregate([
      {
        $match: queryObj,
      },
      {
        $unwind: "$allTargetData",
      },
      {
        $match: {
          $or: [
            { "allTargetData.current_year": req.query?.selectedYear },
            {
              "allTargetData.current_year": `${req.previousYear}-${req.selectedYear}`,
            },
          ],
        },
      },
      {
        $group: {
          _id: null,
          yearTotalBDHrsTarget: {
            $sum: {
              $cond: [
                {
                  $eq: ["$allTargetData.current_year", req.query?.selectedYear],
                },
                "$allTargetData.yearTotalBDHrsTarget",
                0,
              ],
            },
          },
          previousYearTotalBDHrsTarget: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$allTargetData.current_year",
                    `${req.previousYear}-${req.selectedYear}`,
                  ],
                },
                "$allTargetData.yearTotalBDHrsTarget",
                0,
              ],
            },
          },
        },
      },
    ]);

    req.currentYearlyTarget =
      targetForYearlyChart?.[0]?.yearTotalBDHrsTarget || 0;
    req.previousYearlyTarget =
      targetForYearlyChart?.[0]?.previousYearTotalBDHrsTarget || 0;

    next();
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

const middlewareForMTTRKPIReport = async (req, res, next) => {
  try {
    req.mttrOrSumFormula = {
      $divide: ["$sumBM", "$count"],
    };

    next();
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};
const middlewareForMonthlyBdReport = async (req, res, next) => {
  try {
    req.mttrOrSumFormula = { $trunc: ["$sumBM", 1] };

    next();
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

router.get(
  "/hourlyMonthlyBdTrend/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  targetMiddlewareForMBD,
  // middlewareForPlant,
  filterForMonthlyData,
  middlewareForMonthlyBdReport,
  hourlyMonthlyBdTrendMiddleware
);

router.get(
  "/sectionMonthlyBdTrend/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  targetMiddlewareForMBD,
  // middlewareForPlant,
  filterForMonthlyData,
  middlewareForMonthlyBdReport,
  sectionMonthlyBdTrendForPlantMiddleware
);

router.get(
  "/cellMonthlyBdTrend/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  targetMiddlewareForMBD,
  filterForMonthlyData,
  middlewareForMonthlyBdReport,
  cellMonthlyBdTrendForSectionMiddleware
);

router.get(
  "/lineMonthlyBdTrend/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  targetMiddlewareForMBD,
  filterForMonthlyData,
  middlewareForMonthlyBdReport,
  lineMonthlyBdTrendForSectionMiddleware
);

router.get(
  "/machineMonthlyBdTrend/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  targetMiddlewareForMBD,
  filterForMonthlyData,
  middlewareForMonthlyBdReport,
  machineMonthlyBdTrendForSectionMiddleware
);

router.get(
  "/mttrForPlant/kpiFromDatabase/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  // targetMiddlewareForMBD,
  // filterForMonthlyData,
  middlewareForMTTRKPIReport,
  sectionMonthlyBdTrendForPlantMiddleware
);

router.get(
  "/mttrForSection/kpiFromDatabase/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  // targetMiddlewareForMBD,
  // filterForMonthlyData,
  middlewareForMTTRKPIReport,
  cellMonthlyBdTrendForSectionMiddleware
);

router.get(
  "/mttrForCell/kpiFromDatabase/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  // targetMiddlewareForMBD,
  // filterForMonthlyData,
  middlewareForMTTRKPIReport,
  lineMonthlyBdTrendForSectionMiddleware
);

router.get(
  "/mttrForLine/kpiFromDatabase/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  // targetMiddlewareForMBD,
  // filterForMonthlyData,
  middlewareForMTTRKPIReport,
  machineMonthlyBdTrendForSectionMiddleware
);

// ---------------- Yearly BD Trend Chart -------------------

const filterForYearlyData = async (req, res, next) => {
  try {
    const selectedYear = req.query.selectedYear?.split("-")?.[0];
    const isValidYear = /^\d{4}$/.test(selectedYear);

    let previousYear;
    if (isValidYear) {
      previousYear = (parseInt(selectedYear, 10) - 1).toString();
    }

    const keyToDelete =
      "preAggregationTimeStampOfRequestSheet.requestSheet_year";
    const newQueryObj = { ...req.queryObj };
    delete newQueryObj[keyToDelete];

    let queryObj = {};

    if (req.query?.selectedYear) {
      queryObj = {
        ...newQueryObj,
        $or: [
          {
            "preAggregationTimeStampOfRequestSheet.requestSheet_year": `${previousYear}-${selectedYear}`,
          },
          {
            "preAggregationTimeStampOfRequestSheet.requestSheet_year":
              req.query?.selectedYear,
          },
        ],
      };
    }

    req.queryObj = queryObj;
    req.selectedYear = selectedYear;
    req.previousYear = previousYear;

    next();
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

router.get(
  "/hourlyYearlyBdTrend/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  filterForYearlyData,
  yearlyTargetMiddlewareForMBD,
  // middlewareForPlant,
  filterForMonthlyData,
  async (req, res, next) => {
    try {
      const bdTrendData = await RequestSheetOfBM.aggregate([
        {
          $match: req.queryObj,
        },
        {
          $group: {
            _id: "$preAggregationTimeStampOfRequestSheet.requestSheet_year",

            ...req.grpQuery,
          },
        },

        {
          $sort: { _id: 1 },
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
                input: [
                  `${req.previousYear}-${req.selectedYear}`,
                  req.query?.selectedYear,
                ],
                as: "year",

                in: {
                  $cond: [
                    { $in: ["$$year", "$array._id"] },
                    {
                      year: "$$year",
                      value: {
                        $arrayElemAt: [
                          "$array",
                          {
                            $indexOfArray: ["$array._id", "$$year"],
                          },
                        ],
                      },
                    },
                    {
                      year: "$$year",
                      value: {
                        _id: "$$year",
                        lessThanOne: 0,
                        lessThanTwo: 0,
                        greaterThanTwo: 0,
                        totalCount: 0,
                      },
                    },
                  ],
                },
              },
            },
          },
        },

        { $unwind: "$data" },
        {
          $replaceRoot: { newRoot: "$data" },
        },
        {
          $group: {
            _id: null,

            lessThanOne: { $push: { $trunc: ["$value.lessThanOne", 1] } },

            lessThanTwo: { $push: { $trunc: ["$value.lessThanTwo", 1] } },
            greaterThanTwo: { $push: { $trunc: ["$value.greaterThanTwo", 1] } },
            totalCount: { $push: "$value.totalCount" },
          },
        },
      ]);

      return res.status(200).json({
        message: "Plant Wise Yearly BD trend data get successfully",
        labels: [
          `${req.previousYear}-${req.selectedYear}`,
          req.query?.selectedYear,
        ],
        // bdTrendData,
        bdTrendData: [
          { label: "<1", data: bdTrendData?.[0].lessThanOne },
          { label: "<2", data: bdTrendData?.[0].lessThanTwo },
          { label: ">2", data: bdTrendData?.[0].greaterThanTwo },
        ],
        totalCount: bdTrendData?.[0].totalCount,
        bdTrendDataTarget: [req.previousYearlyTarget, req.currentYearlyTarget],
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/sectionYearlyBdTrend/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  filterForYearlyData,
  yearlyTargetMiddlewareForMBD,
  filterForMonthlyData,
  async (req, res, next) => {
    try {
      let sectionIds;
      let sectionIdsYes;

      if (req.params.selectedId) {
        const sections = await Section.find({
          plant_names: mongoose.Types.ObjectId(
            req.queryObj.plantRef.toString()
          ),
        });
        // console.log(sections);

        const noDashboardSections = sections.filter(
          (section) => section.dashboardLevel === "No"
        );
        const yesDashboardSections = sections.filter(
          (section) => section.dashboardLevel === "Yes"
        );

        sectionIds = noDashboardSections.map((section) =>
          section._id.toString()
        );
        sectionIdsYes = yesDashboardSections.map((section) =>
          section._id.toString()
        );
      }
      const subSectionQuery = await SubSection.aggregate([
        {
          $match: { section_names: mongoose.Types.ObjectId(...sectionIds) },
        },

        {
          $lookup: {
            from: "requestsheetofbms",
            let: { subsection: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$$subsection", "$subSectionRef"],
                  },
                  "preAggregationTimeStampOfRequestSheet.requestSheet_year":
                    req.query.selectedYear,
                },
              },
              {
                $group: {
                  _id: {
                    date: "$preAggregationTimeStampOfRequestSheet.requestSheet_year",
                  },

                  sumBM: {
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
                  _id: "$section_name",
                  label: { $first: "$section_name" },
                  sectionWiseTotal: {
                    $push: {
                      year: "$_id.date",

                      bdTimeSum: { $trunc: ["$sumBM", 1] },
                    },
                  },
                },
              },

              {
                $project: {
                  _id: 0,
                  // label: 1,
                  data: {
                    $map: {
                      input: [
                        `${req.previousYear}-${req.selectedYear}`,
                        req.query?.selectedYear,
                      ],
                      as: "year",
                      in: {
                        $cond: [
                          {
                            $in: ["$$year", "$sectionWiseTotal.year"],
                          },
                          {
                            $arrayElemAt: [
                              "$sectionWiseTotal.bdTimeSum",
                              {
                                $indexOfArray: [
                                  "$sectionWiseTotal.month",
                                  "$$year",
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

              {
                $unwind: "$data",
              },
            ],
            as: "section_data",
          },
        },

        // {
        //   $unwind: "$section_data",
        // },

        {
          $sort: { subSection_name: 1 },
        },
        {
          $project: {
            _id: 0,
            label: "$subSection_name",
            data: "$section_data.data",
          },
        },
      ]);
      const sectionQuery = await Section.aggregate([
        {
          $match: { _id: mongoose.Types.ObjectId(...sectionIdsYes) },
        },

        // {
        //   $group : {
        //     _id : "$section_name"
        //   }
        // },

        {
          $lookup: {
            from: "requestsheetofbms",
            let: { section: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$$section", "$sectionRef"],
                  },
                  "preAggregationTimeStampOfRequestSheet.requestSheet_year":
                    req.query.selectedYear,
                },
              },

              {
                $group: {
                  _id: {
                    date: "$preAggregationTimeStampOfRequestSheet.requestSheet_year",
                  },

                  sumBM: {
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
                  _id: "$section_name",
                  label: { $first: "$section_name" },
                  sectionWiseTotal: {
                    $push: {
                      year: "$_id.date",

                      bdTimeSum: { $trunc: ["$sumBM", 1] },
                    },
                  },
                },
              },

              {
                $project: {
                  _id: 0,
                  // label: 1,
                  data: {
                    $map: {
                      input: [
                        `${req.previousYear}-${req.selectedYear}`,
                        req.query?.selectedYear,
                      ],
                      as: "year",
                      in: {
                        $cond: [
                          {
                            $in: ["$$year", "$sectionWiseTotal.year"],
                          },
                          {
                            $arrayElemAt: [
                              "$sectionWiseTotal.bdTimeSum",
                              {
                                $indexOfArray: [
                                  "$sectionWiseTotal.month",
                                  "$$year",
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

              {
                $unwind: "$data",
              },
            ],
            as: "section_data",
          },
        },

        // {
        //   $unwind: "$section_data",
        // },

        {
          $sort: { section_name: 1 },
        },
        {
          $project: {
            _id: 0,
            label: "$section_name",
            data: "$section_data.data",
          },
        },
      ]);

      const bdTrendData = [...subSectionQuery, ...sectionQuery];
      return res.status(201).json({
        message: "Plant Wise Yearly BD trend data get successfully",
        labels: [
          `${req.previousYear}-${req.selectedYear}`,
          req.query?.selectedYear,
        ],

        bdTrendData,
        bdTrendDataTarget: [req.previousYearlyTarget, req.currentYearlyTarget],
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/cellYearlyBdTrend/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  filterForYearlyData,
  yearlyTargetMiddlewareForMBD,
  filterForMonthlyData,

  async (req, res, next) => {
    try {
      const bdTrendData = await Cell.aggregate([
        {
          $match: {
            $or: [
              {
                subSection_names: mongoose.Types.ObjectId(
                  req.params.selectedId
                ),
              },
              { section_names: mongoose.Types.ObjectId(req.params.selectedId) },
            ],
          },
        },

        // {
        //   $group : {
        //     _id : "$section_name"
        //   }
        // },

        {
          $lookup: {
            from: "requestsheetofbms",
            let: { cell: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$$cell", "$cellRef"],
                  },
                  "preAggregationTimeStampOfRequestSheet.requestSheet_year":
                    req.query.selectedYear,
                  maintenanceType: "BM",
                },
              },

              {
                $group: {
                  _id: {
                    date: "$preAggregationTimeStampOfRequestSheet.requestSheet_year",
                  },

                  sumBM: {
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
                  _id: "$cell_name",
                  label: { $first: "$cell_name" },
                  cellWiseTotal: {
                    $push: {
                      year: "$_id.date",
                      bdTimeSum: { $trunc: ["$sumBM", 1] },
                    },
                  },
                },
              },

              {
                $project: {
                  _id: 0,
                  // label: 1,
                  data: {
                    $map: {
                      input: [
                        `${req.previousYear}-${req.selectedYear}`,
                        req.query?.selectedYear,
                      ],
                      as: "year",
                      in: {
                        $cond: [
                          {
                            $in: ["$$year", "$cellWiseTotal.year"],
                          },
                          {
                            $arrayElemAt: [
                              "$cellWiseTotal.bdTimeSum",
                              {
                                $indexOfArray: [
                                  "$cellWiseTotal.month",
                                  "$$year",
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

              {
                $unwind: "$data",
              },
            ],
            as: "cell_data",
          },
        },
        // {
        //   $unwind: "$cell_data",
        // },

        {
          $sort: { cell_name: 1 },
        },

        {
          $project: {
            _id: 0,
            label: "$cell_name",
            data: "$cell_data.data",
          },
        },
      ]);
      return res.status(200).json({
        message: "Section Wise Yearly BD trend data get successfully",
        labels: [
          `${req.previousYear}-${req.selectedYear}`,
          req.query?.selectedYear,
        ],

        bdTrendData,
        bdTrendDataTarget: [req.previousYearlyTarget, req.currentYearlyTarget],
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

// ---------------- Major BD Count Chart -------------------

const labelMiddlewareForMajorBDChart = async (req, res, next) => {
  try {
    let labels = [];
    if (req.query?.selectedYear) {
      let splitYear = req.query?.selectedYear?.split("-");
      labels = allMonths?.map((item, index) =>
        index < 9
          ? `${item?.monthName}-${splitYear?.[0]?.slice(-2)}`
          : `${item?.monthName}-${splitYear?.[1]?.slice(-2)}`
      );
    }

    req.labels = labels;
    next();
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

router.get(
  "/majorBDCount/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  labelMiddlewareForMajorBDChart,
  targetMiddlewareForMBD,
  // middlewareForPlant,

  // filterForYearlyData,
  // BdTrendFilterMiddleware,
  async (req, res, next) => {
    try {
      let sectionIds;
      let sectionIdsYes;

      // console.log("mbssdsd", req.queryObj)

      if (req.params.selectedId) {
        const sections = await Section.find({
          plant_names: mongoose.Types.ObjectId(
            req.queryObj.plantRef.toString()
          ),
        });
        // console.log(sections);

        const noDashboardSections = sections.filter(
          (section) => section.dashboardLevel === "No"
        );
        const yesDashboardSections = sections.filter(
          (section) => section.dashboardLevel === "Yes"
        );

        sectionIds = noDashboardSections.map((section) =>
          section._id.toString()
        );
        sectionIdsYes = yesDashboardSections.map((section) =>
          section._id.toString()
        );
      }

      const subSectionQuery = await SubSection.aggregate([
        {
          $match: { section_names: mongoose.Types.ObjectId(...sectionIds) },
        },
        {
          $lookup: {
            from: "requestsheetofbms",
            let: { subsection: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$$subsection", "$subSectionRef"],
                  },
                  "preAggregationTimeStampOfRequestSheet.requestSheet_year":
                    req.query?.selectedYear,
                },
              },
              {
                $group: {
                  _id: {
                    date: "$preAggregationTimeStampOfRequestSheet.requestSheet_month",
                  },

                  count: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            {
                              $gt: [
                                "$maintenanceReportFilledByMTD.workEndedDateOfBM",
                                null,
                              ],
                            },
                            {
                              $gt: [
                                "$maintenanceReportFilledByMTD.breakDownTime",
                                120,
                              ],
                            },
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
                  _id: "$section_name",
                  label: { $first: "$section_name" },
                  sectionWiseTotal: {
                    $push: {
                      month: "$_id.date",

                      count: "$count",
                    },
                  },
                },
              },

              {
                $project: {
                  _id: 0,
                  // label: 1,
                  data: {
                    $map: {
                      input: allMonths,
                      as: "month",
                      in: {
                        $cond: [
                          {
                            $in: [
                              "$$month.monthName",
                              "$sectionWiseTotal.month",
                            ],
                          },
                          {
                            $arrayElemAt: [
                              "$sectionWiseTotal.count",
                              {
                                $indexOfArray: [
                                  "$sectionWiseTotal.month",
                                  "$$month.monthName",
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
              {
                $unwind: "$data",
              },
            ],
            as: "section_data",
          },
        },

        // {
        //   $unwind: "$section_data",
        // },

        {
          $sort: { subSection_name: 1 },
        },
        {
          $project: {
            _id: 0,
            label: "$subSection_name",
            data: "$section_data.data",
          },
        },
      ]);

      const sectionQuery = await Section.aggregate([
        {
          $match: { _id: mongoose.Types.ObjectId(...sectionIdsYes) },
        },

        // {
        //   $group : {
        //     _id : "$section_name"
        //   }
        // },

        {
          $lookup: {
            from: "requestsheetofbms",
            let: { section: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$$section", "$sectionRef"],
                  },
                  "preAggregationTimeStampOfRequestSheet.requestSheet_year":
                    req.query?.selectedYear,
                  maintenanceType: "BM",
                },
              },

              {
                $group: {
                  _id: {
                    date: "$preAggregationTimeStampOfRequestSheet.requestSheet_month",
                  },

                  count: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            {
                              $gt: [
                                "$maintenanceReportFilledByMTD.workEndedDateOfBM",
                                null,
                              ],
                            },
                            {
                              $gt: [
                                "$maintenanceReportFilledByMTD.breakDownTime",
                                120,
                              ],
                            },
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
                  _id: "$section_name",
                  label: { $first: "$section_name" },
                  sectionWiseTotal: {
                    $push: {
                      month: "$_id.date",

                      count: "$count",
                    },
                  },
                },
              },

              {
                $project: {
                  _id: 0,
                  // label: 1,
                  data: {
                    $map: {
                      input: allMonths,
                      as: "month",
                      in: {
                        $cond: [
                          {
                            $in: [
                              "$$month.monthName",
                              "$sectionWiseTotal.month",
                            ],
                          },
                          {
                            $arrayElemAt: [
                              "$sectionWiseTotal.count",
                              {
                                $indexOfArray: [
                                  "$sectionWiseTotal.month",
                                  "$$month.monthName",
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

              {
                $unwind: "$data",
              },
            ],
            as: "section_data",
          },
        },

        // {
        //   $unwind: "$section_data",
        // },

        {
          $sort: { section_name: 1 },
        },
        {
          $project: {
            _id: 0,
            label: "$section_name",
            data: "$section_data.data",
          },
        },
      ]);

      const bdTrendData = [...subSectionQuery, ...sectionQuery];
      return res.status(200).json({
        message: "Mbd Count data get successfully",

        labels: req.labels,
        bdTrendData,
        bdTrendDataTarget: req.targetForCount,
        targetTotal: req.targetForCountTotal,
        // sectionQuery,
        // subSectionQuery,
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/majorBDCountForSection/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  labelMiddlewareForMajorBDChart,
  targetMiddlewareForMBD,
  async (req, res, next) => {
    try {
      const bdTrendData = await Cell.aggregate([
        {
          $match: {
            $or: [
              {
                subSection_names: mongoose.Types.ObjectId(
                  req.params.selectedId
                ),
              },
              { section_names: mongoose.Types.ObjectId(req.params.selectedId) },
            ],
          },
        },

        // {
        //   $group : {
        //     _id : "$section_name"
        //   }
        // },

        {
          $lookup: {
            from: "requestsheetofbms",
            let: { cell: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$$cell", "$cellRef"],
                  },
                  "preAggregationTimeStampOfRequestSheet.requestSheet_year":
                    req.query?.selectedYear,
                },
              },

              {
                $group: {
                  _id: {
                    date: "$preAggregationTimeStampOfRequestSheet.requestSheet_month",
                  },

                  count: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            {
                              $gt: [
                                "$maintenanceReportFilledByMTD.workEndedDateOfBM",
                                null,
                              ],
                            },
                            {
                              $gt: [
                                "$maintenanceReportFilledByMTD.breakDownTime",
                                120,
                              ],
                            },
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
                  _id: "$section_name",
                  label: { $first: "$section_name" },
                  cellWiseTotal: {
                    $push: {
                      month: "$_id.date",

                      count: "$count",
                    },
                  },
                },
              },

              {
                $project: {
                  _id: 0,
                  // label: 1,
                  data: {
                    $map: {
                      input: allMonths,
                      as: "month",
                      in: {
                        $cond: [
                          {
                            $in: ["$$month.monthName", "$cellWiseTotal.month"],
                          },
                          {
                            $arrayElemAt: [
                              "$cellWiseTotal.count",
                              {
                                $indexOfArray: [
                                  "$cellWiseTotal.month",
                                  "$$month.monthName",
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

              {
                $unwind: "$data",
              },
            ],
            as: "cell_data",
          },
        },
        // {
        //   $unwind: "$cell_data",
        // },

        {
          $sort: { cell_name: 1 },
        },

        {
          $project: {
            _id: 0,
            label: "$cell_name",
            data: "$cell_data.data",
          },
        },
      ]);

      return res.status(200).json({
        message: "Mbd Count data get successfully",
        bdTrendData,
        labels: req.labels,
        bdTrendDataTarget: req.targetForCount,
        targetTotal: req.targetForCountTotal,
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

// ---------------- LineWise BD Contribution Charts -------------------

const middlewareForLineWiseContribution = async (req, res, next) => {
  try {
    let queryFilter;
    let queryObj;
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

    if (req.params?.filter === "based-on-plant") {
      queryFilter = {
        plant_names: mongoose.Types.ObjectId(req.params?.selectedId),
      };
    }
    if (req.params?.filter === "based-on-section") {
      queryFilter = {
        section_names: mongoose.Types.ObjectId(req.params?.selectedId),
      };
    }
    if (req.params?.filter === "based-on-subSection") {
      queryFilter = {
        subSection_names: mongoose.Types.ObjectId(req.params?.selectedId),
      };
    }
    if (req.params?.filter === "based-on-cell") {
      queryFilter = {
        cell_names: mongoose.Types.ObjectId(req.params?.selectedId),
      };
    }

    req.queryFilter = queryFilter;
    req.queryObj = queryObj;
    next();
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

router.get(
  "/lineWiseBdContribution/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  // BdTrendFilterMiddleware,
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
            bdHours: { $push: { $trunc: ["$bdHours", 1] } },
            percentages: { $push: { $trunc: ["$percentage", 1] } },
          },
        },

        {
          $project: {
            _id: 0,

            lineNames: 1,
            bdHours: 1,
            percentages: 1,
          },
        },
      ]);

      return res.status(200).json({
        message: "LineWise Bd contribution for Plant get successfully",
        lineWiseBDData,
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

// router.get(
//   "/lineWiseBdContributionForSection/:filter/:selectedId",
//   authenticate,
//   filterMiddleware,
//   async (req, res, next) => {
//     try {
//       const lineWiseBDData = await RequestSheetOfBM.aggregate([
//         {
//           $match: req.queryObj,
//         },

//         {
//           $lookup: {
//             from: "lines",
//             localField: "lineRef",
//             foreignField: "_id",
//             as: "line_data",
//           },
//         },
//         {
//           $unwind: "$line_data",
//         },
//         {
//           $group: {
//             _id: "$line_data.line_name",
//             // totalBdTime: { $sum: "$bdTime" },
//             bdHoursLineWise: {
//               $sum: {
//                 $cond: [
//                   {
//                     $gt: [
//                       "$maintenanceReportFilledByMTD.workEndedDateOfBM",
//                       null,
//                     ],
//                   },
//                   {
//                     $divide: [
//                       "$maintenanceReportFilledByMTD.breakDownTime",
//                       60,
//                     ],
//                   },
//                   0,
//                 ],
//               },
//             },
//           },
//         },
//         {
//           $group: {
//             _id: null,
//             totalBdTime: { $sum: "$bdHoursLineWise" },
//             lineData: {
//               $push: {
//                 line_name: "$_id",
//                 bdHoursLineWise: "$bdHoursLineWise",
//               },
//             },
//           },
//         },
//         {
//           $unwind: "$lineData",
//         },
//         {
//           $project: {
//             _id: "$lineData.line_name",
//             // totalBdTime: 1,
//             bdHours: "$lineData.bdHoursLineWise",
//             percentage: {
//               $multiply: [
//                 {
//                   $divide: ["$lineData.bdHoursLineWise", "$totalBdTime"],
//                 },
//                 100,
//               ],
//             },
//           },
//         },
//         {
//           $sort: {
//             percentage: -1,
//           },
//         },

//         {
//           $group: {
//             _id: "$totalBdTime",
//             lineNames: { $push: "$_id" },

//             bdHours: { $push: { $trunc: ["$bdHours", 1] } },

//             percentages: { $push: { $trunc: ["$percentage", 1] } },
//           },
//         },
//       ]);

//       return res.status(200).json({
//         message: "LineWise Bd contribution for Section get successfully",
//         lineWiseBDData,
//       });
//     } catch (error) {
//       res.status(500).json({ message: error?.message, error });
//     }
//   }
// );

// router.get(
//   "/lineWiseBdContributionForCell/:filter/:selectedId",
//   authenticate,
//   filterMiddleware,

//   async (req, res, next) => {
//     try {
//       console.log(req.queryObj);
//       const lineWiseBDData = await RequestSheetOfBM.aggregate([
//         {
//           $match: req.queryObj,
//         },

//         {
//           $lookup: {
//             from: "lines",
//             localField: "lineRef",
//             foreignField: "_id",
//             as: "line_data",
//           },
//         },

//         {
//           $unwind: "$line_data",
//         },
//         {
//           $group: {
//             _id: "$line_data.line_name",
//             // totalBdTime: { $sum: "$bdTime" },
//             bdHoursLineWise: {
//               $sum: {
//                 $cond: [
//                   {
//                     $gt: [
//                       "$maintenanceReportFilledByMTD.workEndedDateOfBM",
//                       null,
//                     ],
//                   },
//                   {
//                     $divide: [
//                       "$maintenanceReportFilledByMTD.breakDownTime",
//                       60,
//                     ],
//                   },
//                   0,
//                 ],
//               },
//             },
//           },
//         },
//         {
//           $group: {
//             _id: null,
//             totalBdTime: { $sum: "$bdHoursLineWise" },
//             lineData: {
//               $push: {
//                 line_name: "$_id",
//                 bdHoursLineWise: "$bdHoursLineWise",
//               },
//             },
//           },
//         },
//         {
//           $unwind: "$lineData",
//         },
//         {
//           $project: {
//             _id: "$lineData.line_name",
//             // totalBdTime: 1,
//             bdHours: "$lineData.bdHoursLineWise",
//             percentage: {
//               $multiply: [
//                 {
//                   $divide: ["$lineData.bdHoursLineWise", "$totalBdTime"],
//                 },
//                 100,
//               ],
//             },
//           },
//         },
//         {
//           $sort: {
//             percentage: -1,
//           },
//         },

//         {
//           $group: {
//             _id: null,

//             lineNames: { $push: "$_id" },
//             bdHours: { $push: { $trunc: ["$bdHours", 1] } },

//             percentages: { $push: { $trunc: ["$percentage", 1] } },
//           },
//         },
//       ]);

//       return res.status(200).json({
//         message: "LineWise Bd contribution for Cell get successfully",
//         lineWiseBDData,
//       });
//     } catch (error) {
//       res.status(500).json({ message: error?.message, error });
//     }
//   }
// );

router.get(
  "/getHistoryCard/:machineId",
  authenticate,
  productionHourFiltration,
  targetMiddlewareForMBD,
  bdHourTrendMiddleware,
  async (req, res, next) => {
    try {
      let productionHour = {
          $sum: [],
        },
        groupingObj = {
          groupId: "$preAggregationTimeStampOfRequestSheet.requestSheet_year",
        },
        queryObj = {
          machineRef: mongoose.Types.ObjectId(req.params.machineId),
          "preAggregationTimeStampOfRequestSheet.requestSheet_year":
            req.query?.selectedYear,
          "maintenanceReportFilledByMTD.breakDownTime": {
            $gt: 0,
          },
          maintenanceType: "BM",
        };

      if (req.query?.selectedMonth) {
        queryObj = {
          ...queryObj,
          "preAggregationTimeStampOfRequestSheet.requestSheet_month":
            req.query?.selectedMonth,
        };
        groupingObj = {
          groupId: "$preAggregationTimeStampOfRequestSheet.requestSheet_month",
        };
        productionHour = `$allTargetData.monthlyProductionHrs.${req.query?.selectedMonth}`;
      } else {
        for (let index = 0; index < allMonths.length; index++) {
          productionHour["$sum"].push(
            `$allTargetData.monthlyProductionHrs.${allMonths?.[index]?.monthName}`
          );
          if (
            allMonths?.[index]?.monthName === currentMonth &&
            currentYear === req?.query?.selectedYear
          ) {
            break;
          }
        }
      }

      const machineHistoryCardData = await RequestSheetOfBM.aggregate([
        { $match: queryObj },
        {
          $lookup: {
            from: "lines",
            localField: "lineRef",
            foreignField: "_id",
            pipeline: [
              {
                $unwind: "$allTargetData",
              },
              {
                $match: {
                  "allTargetData.current_year": req.query?.selectedYear,
                },
              },
              {
                $project: {
                  line_name: 1,
                  productionHour,
                },
              },
            ],
            as: "line",
          },
        },
        { $unwind: "$line" },
        {
          $group: {
            _id: groupingObj,
            productionHour: { $first: "$line.productionHour" },
            count: { $sum: 1 },
            bdHours: {
              $sum: {
                $divide: ["$maintenanceReportFilledByMTD.breakDownTime", 60],
              },
            },
          },
        },
        {
          $project: {
            count: 1,
            bdHours: truncValue("$bdHours"),
            mttr: truncValue({
              $divide: ["$bdHours", "$count"],
            }),
            mtbf: truncValue({
              $divide: [
                {
                  $divide: [
                    {
                      $subtract: ["$productionHour", "$bdHours"],
                    },
                    "$count",
                  ],
                },
                24,
              ],
            }),
          },
        },
      ]);

      let bdHoursFormula = {
        $divide: ["$maintenanceReportFilledByMTD.breakDownTime", 60],
      };

      const bdTrendData = await RequestSheetOfBM.aggregate([
        {
          $match: {
            machineRef: mongoose.Types.ObjectId(req.params.machineId),
            "preAggregationTimeStampOfRequestSheet.requestSheet_year":
              req.query?.selectedYear,
            "maintenanceReportFilledByMTD.breakDownTime": {
              $gt: 0,
            },
            maintenanceType: "BM",
          },
        },
        {
          $group: {
            _id: "$preAggregationTimeStampOfRequestSheet.requestSheet_month",
            lessThanOne: {
              $sum: {
                $cond: [
                  {
                    $lte: [bdHoursFormula, 1],
                  },
                  bdHoursFormula,
                  0,
                ],
              },
            },
            lessThanTwo: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      {
                        $gt: [bdHoursFormula, 1],
                      },
                      {
                        $lte: [bdHoursFormula, 2],
                      },
                    ],
                  },
                  bdHoursFormula,
                  0,
                ],
              },
            },
            greaterThanTwo: {
              $sum: {
                $cond: [
                  {
                    $gt: [bdHoursFormula, 2],
                  },
                  bdHoursFormula,
                  0,
                ],
              },
            },
            totalCount: { $sum: 1 },
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
                    { $in: ["$$month.monthName", "$array._id"] },
                    {
                      $arrayElemAt: [
                        "$array",
                        {
                          $indexOfArray: ["$array._id", "$$month.monthName"],
                        },
                      ],
                    },
                    {
                      _id: "$$month.monthName",
                      lessThanOne: 0,
                      lessThanTwo: 0,
                      greaterThanTwo: 0,
                      totalCount: 0,
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
            month: { $push: "$_id" },
            lessThanOne: { $push: truncValue("$lessThanOne") },
            lessThanTwo: { $push: truncValue("$lessThanTwo") },
            greaterThanTwo: { $push: truncValue("$greaterThanTwo") },
            totalCount: { $push: "$totalCount" },
          },
        },
        // {
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
      ]);

      const machine = await Machine.aggregate([
        {
          $match: {
            _id: mongoose.Types.ObjectId(req.params.machineId),
          },
        },
        {
          $unwind: "$checkSheet_data",
        },
        {
          $match: {
            "checkSheet_data.current_year": req.query?.selectedYear,
          },
        },
      ]);

      return res.status(201).json({
        message: "History Card data get successfully",
        PM_Status:
          machine?.[0]?.checkSheet_data?.PMStatus?.[
            req.query?.selectedMonth || currentMonth
          ],
        bdTrendData: bdTrendData?.[0],
        machineHistoryCardData: machineHistoryCardData?.[0],
        totalCount: bdTrendData?.[0].totalCount,

        bdTrendDataTarget: req.target,
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/getSummaryCard/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  // productionHourFiltration,
  // targetMiddlewareForMBD,
  // bdHourTrendMiddleware,
  async (req, res, next) => {
    try {
      let cells,
        bdHoursFormula = {
          $divide: ["$maintenanceReportFilledByMTD.breakDownTime", 60],
        },
        productionHour = {
          $sum: [],
        };

      groupingObj = {
        groupId: "$preAggregationTimeStampOfRequestSheet.requestSheet_year",
      };

      if (req.params?.filter === "based-on-subSection") {
        cells = await Cell.find({
          subSection_names: mongoose.Types.ObjectId(req.params?.selectedId),
        });
      } else {
        const subSections = await SubSection.find({
          section_names: mongoose.Types.ObjectId(req.params?.selectedId),
        });

        cells = await Cell.find({
          subSection_names: { $in: subSections?.map((item) => item?._id) },
        });
      }

      if (req.query?.selectedMonth) {
        groupingObj = {
          groupId: "$preAggregationTimeStampOfRequestSheet.requestSheet_month",
        };
        productionHour = `$allTargetData.monthlyProductionHrs.${req.query?.selectedMonth}`;
      } else {
        for (let index = 0; index < allMonths.length; index++) {
          productionHour["$sum"].push(
            `$allTargetData.monthlyProductionHrs.${allMonths?.[index]?.monthName}`
          );
          if (
            allMonths?.[index]?.monthName === currentMonth &&
            currentYear === req?.query?.selectedYear
          ) {
            break;
          }
        }
      }

      try {
        const machineSummaryCardData = await RequestSheetOfBM.aggregate([
          { $match: req.queryObj },
          {
            $group: {
              _id: "$lineRef",
              cellRef: { $first: "$cellRef" },
              count: { $sum: 1 },
              bdHours: {
                $sum: {
                  $divide: ["$maintenanceReportFilledByMTD.breakDownTime", 60],
                },
              },
            },
          },
          {
            $lookup: {
              from: "lines",
              localField: "_id",
              foreignField: "_id",
              pipeline: [
                {
                  $unwind: "$allTargetData",
                },
                {
                  $match: {
                    "allTargetData.current_year": req.query?.selectedYear,
                  },
                },
                {
                  $project: {
                    line_name: 1,
                    productionHour,
                  },
                },
              ],
              as: "line",
            },
          },
          { $unwind: "$line" },
          {
            $group: {
              _id: {
                cell: "$cellRef",
                // ...groupingObj,
              },
              productionHour: { $avg: "$line.productionHour" },
              count: { $sum: "$count" },
              bdHours: { $sum: "$bdHours" },
            },
          },
          {
            $project: {
              count: 1,
              bdHours: truncValue("$bdHours"),
              mttr: truncValue({
                $divide: ["$bdHours", "$count"],
              }),
              mtbf: truncValue({
                $divide: [
                  {
                    $divide: [
                      {
                        $subtract: ["$productionHour", "$bdHours"],
                      },
                      "$count",
                    ],
                  },
                  24,
                ],
              }),
            },
          },
        ]);

        let newQueryObj = { ...req.queryObj };
        delete newQueryObj[
          "preAggregationTimeStampOfRequestSheet.requestSheet_month"
        ];

        const bdTrendData = await RequestSheetOfBM.aggregate([
          {
            $match: newQueryObj,
          },
          {
            $group: {
              _id: {
                cellRef: "$cellRef",
                date: "$preAggregationTimeStampOfRequestSheet.requestSheet_month",
              },
              lessThanOne: {
                $sum: {
                  $cond: [
                    {
                      $lte: [bdHoursFormula, 1],
                    },
                    bdHoursFormula,
                    0,
                  ],
                },
              },
              lessThanTwo: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        {
                          $gt: [bdHoursFormula, 1],
                        },
                        {
                          $lte: [bdHoursFormula, 2],
                        },
                      ],
                    },
                    bdHoursFormula,
                    0,
                  ],
                },
              },
              greaterThanTwo: {
                $sum: {
                  $cond: [
                    {
                      $gt: [bdHoursFormula, 2],
                    },
                    bdHoursFormula,
                    0,
                  ],
                },
              },
              totalCount: { $sum: 1 },
            },
          },
          {
            $group: {
              _id: "$_id.cellRef",
              array: { $push: "$$ROOT" },
            },
          },

          {
            $project: {
              _id: 1,
              array: {
                $map: {
                  input: allMonths,
                  as: "month",
                  in: {
                    $cond: [
                      { $in: ["$$month.monthName", "$array._id.date"] },
                      {
                        month: "$$month.monthName",
                        value: {
                          $arrayElemAt: [
                            "$array",
                            {
                              $indexOfArray: [
                                "$array._id.date",
                                "$$month.monthName",
                              ],
                            },
                          ],
                        },
                      },
                      {
                        month: "$$month.monthName",
                        value: {
                          _id: "$$month.monthName",
                          lessThanOne: 0,
                          lessThanTwo: 0,
                          greaterThanTwo: 0,
                          totalCount: 0,
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
            $group: {
              _id: "$_id",
              month: { $push: "$array.month" },
              lessThanOne: {
                $push: { $trunc: ["$array.value.lessThanOne", 1] },
              },

              lessThanTwo: {
                $push: { $trunc: ["$array.value.lessThanTwo", 1] },
              },
              greaterThanTwo: {
                $push: { $trunc: ["$array.value.greaterThanTwo", 1] },
              },
              totalCount: { $push: "$array.value.totalCount" },
            },
          },
        ]);

        let statusKey = `$checkSheet_data.PMStatus.${[
          req.query?.selectedMonth || currentMonth,
        ]}`;

        const cellWiseCount = await Machine.aggregate([
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
            $group: {
              _id: "$cell_names",
              totalCount: {
                $sum: 1,
              },
              completedCount: {
                $sum: {
                  $cond: [
                    {
                      $eq: [statusKey, "Completed"],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        ]);

        return res.status(201).json({
          message: "Summary Card data get successfully",
          cells,
          cellWiseCount,
          bdTrendData,
          machineSummaryCardData: machineSummaryCardData,
          totalCount: bdTrendData?.[0].totalCount,
          bdTrendDataTarget: req.target,
        });
      } catch (error) {
        logger.error(error, { maintenanceType: maintenanceType?.[1] });
        res.status(500).json({ message: error?.message, error });
      }
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

const filterMiddlewareForTmMTTRSkillReport = async (req, res, next) => {
  try {
    req.queryPipeline = [];

    req.hourCalculationFormula = {
      $divide: ["$hours", "$count"],
    };

    next();
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

const middlewareForFindingTmMTTRSkillTrendData = async (req, res, next) => {
  try {
    const TrendData = await RequestSheetOfBM.aggregate([
      {
        $match: req.queryObj,
      },
      {
        $lookup: {
          from: "users",
          localField: "requestSheetCreatedBy",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                tm_name: 1,
              },
            },
          ],
          as: "tm_user",
        },
      },
      { $unwind: "$tm_user" },
      {
        $group: {
          _id: "$tm_user.tm_name",
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
        },
      },
      {
        $project: {
          count: 1,
          hours: req.hourCalculationFormula,
        },
      },

      {
        $group: {
          _id: null,
          labels: { $push: "$_id" },

          data: { $push: "$hours" },
        },
      },
    ]);

    req.TrendData = TrendData;

    next();
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

const middlewareForFindingTmProgressData = async (req, res, next) => {
  try {
    const hourToMin = req?.query?.time * 60;

    // console.log("TMPROGRESSqueryObj", req.queryObj);

    const tmProgress = await RequestSheetOfBM.aggregate([
      {
        $match: {
          ...req.queryObj,
          $or: [
            { assignUser: mongoose.Types.ObjectId(req?.params?.tmId) },
            { supportingTM: mongoose.Types.ObjectId(req?.params?.tmId) },
            { handOverUser: mongoose.Types.ObjectId(req?.params?.tmId) },
          ],

          // $and: [
          //   // {
          //   //   "maintenanceReportFilledByMTD.workEndedDateOfBM": { $gt: null },
          //   // },
          //   {
          //     "maintenanceReportFilledByMTD.breakDownTime": {
          //       $lt: hourToMin || 120,
          //     },
          //   },
          // ],
        },
      },
      {
        $group: {
          _id: {
            month: "$preAggregationTimeStampOfRequestSheet.requestSheet_month",
          },
          count: { $sum: 1 },
          hours: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $gt: [
                        "$maintenanceReportFilledByMTD.workEndedDateOfBM",
                        null,
                      ],
                    },
                    {
                      $lt: [
                        "$maintenanceReportFilledByMTD.breakDownTime",
                        hourToMin || 120,
                      ],
                    },
                  ],
                },
                {
                  $divide: [
                    {
                      $add: [
                        "$maintenanceReportFilledByMTD.breakDownTime",
                        {
                          $ifNull: [
                            "$maintenanceReportFilledByMTD.maintenanceTime",
                            0,
                          ],
                        },
                      ],
                    },
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
                  { $in: ["$$month.monthName", "$array._id.month"] },
                  {
                    month: "$$month.monthName",
                    value: {
                      $arrayElemAt: [
                        "$array",
                        {
                          $indexOfArray: [
                            "$array._id.month",
                            "$$month.monthName",
                          ],
                        },
                      ],
                    },
                  },
                  {
                    month: "$$month.monthName",
                    value: {
                      _id: "$$month.monthName",
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
          // _id: "$value._id.user",
          labels: { $push: "$month" },

          data: {
            $push: { $trunc: ["$value.hours", 1] },
          },
        },
      },
    ]);

    return res.status(201).json({
      message: "Tm progress Data get successsully!",
      // dataLength: tmProgress.length,
      data: tmProgress?.[0],
    });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

const responseMiddlewareForMTTRSkillReport = async (req, res, next) => {
  try {
    return res.status(201).json({
      message: req.message,
      data: req?.tmProgress,
      // alldata: req?.allData?.[0],
    });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};
// const middlewareForMttrTrend = async (req, res, next) => ;
const sectionOrSubSectionFilterMiddleware = async (req, res, next) => {
  try {
    let Model,
      findObj = {};
    if (req.query?.selectedSubSection) {
      Model = SubSection;
      findObj = {
        _id: mongoose.Types.ObjectId(req.query?.selectedSubSection),
      };
    } else {
      Model = Section;
      findObj = {
        _id: mongoose.Types.ObjectId(req.query?.selectedSection),
      };
    }

    req.Model = Model;
    req.findObj = findObj;

    next();
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

router.get(
  "/mttrTrend/tmMTTRSkill/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  sectionOrSubSectionFilterMiddleware,
  async (req, res, next) => {
    try {
      const hourToMin = req?.query?.time * 60;
      // queryObj = {
      //   ...queryObj,

      //   $and: [
      //     // {
      //     //   "maintenanceReportFilledByMTD.workEndedDateOfBM": { $gt: null },
      //     // },
      //     {
      //       "maintenanceReportFilledByMTD.breakDownTime": {
      //         $lt: hourToMin || 120,
      //       },
      //     },
      //   ],
      // };

      // console.log("TRENDqueryObj", req.queryObj);

      const result = await req.Model.findOne(req.findObj);

      const mttrTrend = await RequestSheetOfBM.aggregate([
        // ...pipelineForUser,

        {
          $match: req.queryObj,
        },

        {
          $addFields: {
            allUserVarForGrouping: {
              $setUnion: [
                ["$assignUser"],
                {
                  $cond: [
                    { $gt: ["$handOverUser", null] },
                    ["$handOverUser"],
                    [],
                  ],
                },
                "$supportingTM",
              ],
            },
          },
        },
        { $unwind: "$allUserVarForGrouping" },

        {
          $lookup: {
            from: "users",
            localField: "allUserVarForGrouping",
            foreignField: "_id",
            as: "user_data",
          },
        },

        {
          $unwind: "$user_data",
        },
        {
          $group: {
            _id: {
              tm_name: "$user_data.tm_name",
              tm_no: "$user_data.tm_no",
            },
            count: { $sum: 1 },
            // machines: { $push: "$machineRef" },
            sumOfBM: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      {
                        $gt: [
                          "$maintenanceReportFilledByMTD.workEndedDateOfBM",
                          null,
                        ],
                      },
                      {
                        $lt: [
                          "$maintenanceReportFilledByMTD.breakDownTime",
                          hourToMin || 120,
                        ],
                      },
                    ],
                  },
                  {
                    $divide: [
                      {
                        $add: [
                          "$maintenanceReportFilledByMTD.breakDownTime",
                          {
                            $ifNull: [
                              "$maintenanceReportFilledByMTD.maintenanceTime",
                              0,
                            ],
                          },
                        ],
                      },
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
            tm_name: "$_id.tm_name",
            tm_no: "$_id.tm_no",
            score: {
              $getField: {
                field: "score",
                input: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: result?.TmMttrSkillScoresAndLimit,
                        as: "item",
                        cond: {
                          $and: [
                            {
                              $gte: [
                                {
                                  $divide: ["$sumOfBM", "$count"],
                                },
                                "$$item.from",
                              ],
                            },
                            {
                              $lt: [
                                {
                                  $divide: ["$sumOfBM", "$count"],
                                },
                                "$$item.to",
                              ],
                            },
                          ],
                        },
                        // limit: 1,
                      },
                    },
                    0,
                  ],
                },
              },
            },
            hours: truncValue({
              $divide: ["$sumOfBM", "$count"],
            }),
          },
        },
        {
          $sort: { hours: 1 },
        },
        {
          $group: {
            _id: null,
            tm_names: {
              $push: "$tm_name",
            },

            data: {
              $push: { $trunc: ["$hours", 1] },
            },

            pieChartData: { $push: "$$ROOT" },
          },
        },
      ]);

      return res.status(201).json({
        message: "TM Mttr Trend data get successfully",
        data: mttrTrend?.[0],
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

// router.get(
//   "/mttrTrend/tmMTTRSkill/:filter/:selectedId",
//   authenticate,
//   sectionOrSubSectionFilterMiddleware,
//   middlewareForMttrTrend
// );

const filterMiddlewareForTmMTTR = async (req, res, next) => {
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
      };
    } else if (req.params?.filter === "based-on-line") {
      queryObj = {
        ...queryObj,
        lineRef: mongoose.Types.ObjectId(req.params?.selectedId),
      };
    } else {
      queryObj = {
        ...queryObj,
        machineRef: mongoose.Types.ObjectId(req.params?.selectedId),
      };
    }

    // // let allQuery = {};

    // // if (req.query.allFilter === "include-all") {
    // //   allQuery = queryObj;
    // // } else {
    // //   allQuery = {
    // //     "preAggregationTimeStampOfRequestSheet.requestSheet_year":
    // //       req.query?.selectedYear,
    // //     $or: [
    // //       { assignUser: mongoose.Types.ObjectId(req?.query?.tmId) },
    // //       { supportingTM: mongoose.Types.ObjectId(req?.query?.tmId) },
    // //       { handOverUser: mongoose.Types.ObjectId(req?.query?.tmId) },
    // //     ],
    // //   };
    // // }
    // let countQuery = {};

    // let mbdQuery = {};

    // if (req.query.time) {
    //   console.log("req.query.time", parseInt(req.query.time))

    //   mbdQuery = {
    //     $cond: [
    //       {
    //         $and: [
    //           {
    //             $gt: ["$maintenanceReportFilledByMTD.workEndedDateOfBM", null],
    //           },
    //           {
    //             $lt: ["$maintenanceReportFilledByMTD.breakDownTime", parseInt(req.query.time)],
    //           },
    //         ],
    //       },
    //       {
    //         $divide: ["$maintenanceReportFilledByMTD.breakDownTime", 60],
    //       },
    //       0,
    //     ],
    //   };

    // }
    // else{
    //   mbdQuery = {
    //     $cond: [
    //       {
    //         $and: [
    //           {
    //             $gt: ["$maintenanceReportFilledByMTD.workEndedDateOfBM", null],
    //           },
    //           {
    //             $lt: ["$maintenanceReportFilledByMTD.breakDownTime", 120],
    //           },
    //         ],
    //       },
    //       {
    //         $divide: ["$maintenanceReportFilledByMTD.breakDownTime", 60],
    //       },
    //       0,
    //     ],
    //   };

    // }

    req.queryObj = queryObj;
    // // req.countQuery = countQuery;
    // req.mbdQuery = mbdQuery;

    next();
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

const altfindTLandOperatorList = async (req, res, next) => {
  try {
    let findId = {
      _id: mongoose.Types.ObjectId(req.params?.selectedId),
    };

    let altTmUsers = [];

    if (req.params?.filter === "based-on-section") {
      const section = await Section.findOne(findId);

      altTmUsers = [
        {
          // $match: {
          section_data: `${section?.section_id}-${section?.section_name}`,
          // },
        },
      ];
    }
    if (req.params?.filter === "based-on-subSection") {
      const section = await SubSection.findOne(findId);

      altTmUsers = [
        {
          // $match: {
          subSection_data: `${section?.subSection_id}-${section?.subSection_name}`,
          // },
        },
      ];
    }
    if (req.params?.filter === "based-on-cell") {
      const cell = await Cell.findOne(findId);

      altTmUsers = [
        {
          // $match: {
          cell_data: `${cell?.cell_id}-${cell?.cell_name}`,
          // },
        },
      ];
    }

    // console.log("altTmUsers",altTmUsers);

    let TLHOSS_and_TM_user_list = await User.find(
      {
        // $or: [

        // {
        tm_no: { $ne: req?.rootUser?.tm_no },
        $and: [
          {
            $or: [
              {
                $and: [{ user_type: "TL/HOSS" }, { tm_department: "MTD" }],
              },

              { user_type: "Operator" },
            ],
          },
          // {
          //         tm_department: "MTD",
          //       },
          {
            $or: [
              {
                section_data: {
                  $in: altTmUsers.map((tm) => tm.section_data),
                },
              },
              {
                subSection_data: {
                  $in: altTmUsers.map((tm) => tm.subSection_data),
                },
              },
              {
                cell_data: {
                  $in: altTmUsers.map((tm) => tm.cell_data),
                },
              },
            ],
          },
        ],
      },
      // ],
      // },
      {
        tm_name: 1,
        tm_department: 1,
        tm_grade: 1,
        user_type: 1,
      }
    );

    return res.status(201).json({
      message: "TM load data get successfully",
      total: TLHOSS_and_TM_user_list.length,
      TLHOSS_and_TM_user_list,
    });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

router.get(
  "/getAllTmNames/:filter/:selectedId",
  authenticate,
  // filterMiddlewareForTmMTTR,
  altfindTLandOperatorList,
  async (req, res, next) => {
    try {
      return res.status(201).json({
        message: "TM names get successfully",
        data: req.TLHOSS_and_TM_user_list,
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/tmProgress/tmMTTRSkill/:filter/:selectedId/:tmId",
  authenticate,
  filterMiddleware,
  // filterMiddlewareForTmMTTRSkillReport,
  // filterMiddlewareForMTTRReport,
  middlewareForFindingTmProgressData
);

router.delete("/deleteRequestSheet/:id", async (req, res, next) => {
  try {
    const deletedRequestSheet = await RequestSheetOfBM.findByIdAndDelete(
      req.params.id
    );

    return res.status(201).json({
      message: "RequestSheet Deleted successfully",
      deletedRequestSheet,
    });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
});

const middlewareForFindingMaxValue = async (req, res, next) => {
  try {
    const maxScore = await req.Model.aggregate([
      {
        $match: req.findObj,
      },
      {
        $project: {
          maxValue: {
            $max: "$TmMttrSkillScoresAndLimit.score",
          },
        },
      },
    ]);

    req.maxScore = maxScore?.[0]?.maxValue;
    next();
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

router.get(
  "/tmMTTRSkill/getScore",
  authenticate,
  sectionOrSubSectionFilterMiddleware,
  middlewareForFindingMaxValue,
  async (req, res, next) => {
    try {
      const result = await req.Model.findOne(req.findObj);

      return res.status(201).json({
        message: "All score get successfully",
        maxScore: req.maxScore,
        allScore: result?.TmMttrSkillScoresAndLimit,
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.post(
  "/tmMTTRSkill/addNewScore",
  authenticate,
  sectionOrSubSectionFilterMiddleware,
  async (req, res, next) => {
    try {
      await req.Model.findOneAndUpdate(req.findObj, {
        $push: { TmMttrSkillScoresAndLimit: req.body },
      });

      next();
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  },
  middlewareForFindingMaxValue,
  async (req, res, next) => {
    try {
      return res.status(201).json({
        message: "Score added successfully",
        maxScore: req.maxScore,
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.patch(
  "/tmMTTRSkill/updateScore/:id",
  authenticate,
  sectionOrSubSectionFilterMiddleware,
  async (req, res, next) => {
    try {
      await req.Model.findOneAndUpdate(
        req.findObj,
        {
          $set: {
            "TmMttrSkillScoresAndLimit.$[outer]": req.body,
          },
        },
        {
          arrayFilters: [{ "outer._id": req.params?.id }],
        }
      );

      next();
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  },
  middlewareForFindingMaxValue,
  async (req, res, next) => {
    try {
      return res.status(201).json({
        message: "Score added successfully",
        maxScore: req.maxScore,
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.delete(
  "/tmMTTRSkill/deleteScore/:id",
  authenticate,
  sectionOrSubSectionFilterMiddleware,
  async (req, res, next) => {
    try {
      await req.Model.findOneAndUpdate(req.findObj, {
        $pull: {
          TmMttrSkillScoresAndLimit: {
            _id: mongoose.Types.ObjectId(req.params?.id),
          },
        },
      });

      return res.status(201).json({
        message: "Score added successfully",
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

const topFilterMiddleware = async (req, res, next) => {
  try {
    let topQuery;

    if (req.query.topFilter === "top-10") {
      topQuery = 10;
    }
    if (req.query.topFilter === "top-20") {
      topQuery = 20;
    }
    if (req.query.topFilter === "top-30") {
      topQuery = 30;
    }
    if (req.query.topFilter === "top-50") {
      topQuery = 50;
    }

    req.topQuery = topQuery;
    next();
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

router.get(
  "/getYearGroup/machineAge",
  sectionOrSubSectionFilterMiddleware,
  async (req, res, next) => {
    try {
      const getYearGroup = await req.Model.findOne(req.findObj);

      return res.status(201).json({
        message: "Year Group get successfully",

        yearGroups: getYearGroup?.yearGroup,
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.post(
  "/addYearGroup/machineAge",
  sectionOrSubSectionFilterMiddleware,
  async (req, res, next) => {
    try {
      const machine = await req.Model.findOneAndUpdate(
        req.findObj,
        {
          $push: { yearGroup: req.body },
        },
        { new: true }
      );

      return res.status(201).json({
        message: "Year Group added successfully",
        yearGroup: machine?.yearGroup,
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.patch(
  "/updateYearGroup/machineAge/:id",
  sectionOrSubSectionFilterMiddleware,
  async (req, res, next) => {
    try {
      const { group, from, to } = req.body;

      const yearGroup = await req.Model.findOneAndUpdate(
        req.findObj,
        {
          $set: {
            "yearGroup.$[outer].group": group,
            "yearGroup.$[outer].from": from,
            "yearGroup.$[outer].to": to,
          },
        },
        {
          arrayFilters: [
            { "outer._id": mongoose.Types.ObjectId(req.params?.id) },
          ],
        }
      );

      return res.status(201).json({
        message: "Year Group updated successfully",
        yearGroup,
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.delete(
  "/deleteYearGroup/machineAge/:id",
  sectionOrSubSectionFilterMiddleware,
  async (req, res, next) => {
    try {
      const yearGroup = await req.Model.findOneAndUpdate(req.findObj, {
        $pull: {
          yearGroup: {
            _id: mongoose.Types.ObjectId(req.params.id),
          },
        },
      });

      return res.status(201).json({
        message: "Year Group deleted successfully",

        yearGroup,
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

const middlewareForMachineAgeLookup = async (req, res, next) => {
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
            localField: "sectionRef",
            foreignField: "_id",
            as: "section_data",
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
            localField: "subSectionRef",
            foreignField: "_id",
            as: "subSection_data",
          },
        },
        {
          $unwind: "$subSection_data",
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
  "/getMachineAgeMonthwise/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  middlewareForMachineAgeLookup,
  async (req, res, next) => {
    const currentDate = new Date();

    // console.log("currentDate", currentDate);

    const machineData = await RequestSheetOfBM.aggregate([
      {
        $match: req.queryObj,
      },
      {
        $lookup: {
          from: "machinesalldatas",
          localField: "machineRef",
          foreignField: "_id",
          as: "machine_data",
        },
      },
      {
        $unwind: "$machine_data",
      },

      ...req.queryObjPipeline,
      // {
      //   $lookup: {
      //     from: "sections",
      //     localField: "sectionRef",
      //     foreignField: "_id",
      //     as: "section_data",
      //   },
      // },
      // {
      //   $unwind: "$section_data",
      // },
      {
        $addFields: {
          installationDate: {
            $dateFromString: {
              dateString: "$machine_data.installation_date",
            },
          },
        },
      },
      {
        $addFields: {
          yearDifference: {
            $dateDiff: {
              startDate: "$installationDate",
              endDate: currentDate,
              unit: "year",
              timezone: timezone,
            },
          },
        },
      },

      {
        $addFields: {
          groupName: {
            $arrayElemAt: [
              {
                $map: {
                  input: {
                    $filter: {
                      input: "$section_data.yearGroup",
                      as: "group",
                      cond: {
                        $or: [
                          {
                            $and: [
                              { $gte: ["$yearDifference", "$$group.from"] },
                              {
                                $or: [
                                  { $eq: ["$$group.to", null] },
                                  // { $lte: ["$yearDifference", "$$group.to"] },
                                ],
                              },
                            ],
                          },
                          {
                            $and: [
                              { $gte: ["$yearDifference", "$$group.from"] },
                              {
                                $or: [
                                  // { $eq: ["$$group.to", null] },
                                  { $lte: ["$yearDifference", "$$group.to"] },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    },
                  },
                  as: "matchedGroup",
                  in: "$$matchedGroup.group",
                },
              },
              0,
            ],
          },
        },
      },

      {
        $match: {
          groupName: { $exists: true, $ne: null },
        },
      },

      {
        $group: {
          _id: {
            groupName: "$groupName",
            date: "$preAggregationTimeStampOfRequestSheet.requestSheet_month",
          },

          bdHoursmachineWise: {
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
        },
      },

      {
        $group: {
          _id: "$_id.groupName",
          label: { $first: "$_id.groupName" },
          bdHoursmachineWiseTotal: {
            $push: {
              month: "$_id.date",
              bdTimeSum: { $trunc: ["$bdHoursmachineWise", 1] },
            },
          },
        },
      },

      {
        $sort: { _id: 1 },
      },

      {
        $project: {
          _id: 1,
          label: 1,
          data: {
            $map: {
              input: allMonths,
              as: "month",
              in: {
                $cond: [
                  {
                    $in: [
                      "$$month.monthName",
                      "$bdHoursmachineWiseTotal.month",
                    ],
                  },
                  {
                    $arrayElemAt: [
                      "$bdHoursmachineWiseTotal.bdTimeSum",
                      {
                        $indexOfArray: [
                          "$bdHoursmachineWiseTotal.month",
                          "$$month.monthName",
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

    // console.log(machineData);

    return res.status(201).json({
      message: "Monthwise Machine Age data get successfully",
      machineData,
    });
  }
);

router.get(
  "/getMachineAgeYearwise/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  middlewareForMachineAgeLookup,
  async (req, res, next) => {
    const currentDate = new Date();

    const machineData = await RequestSheetOfBM.aggregate([
      {
        $match: req.queryObj,
      },
      {
        $lookup: {
          from: "machinesalldatas",
          localField: "machineRef",
          foreignField: "_id",
          as: "machine_data",
        },
      },
      {
        $unwind: "$machine_data",
      },

      ...req.queryObjPipeline,

      {
        $addFields: {
          installationDate: {
            $dateFromString: {
              dateString: "$machine_data.installation_date",
            },
          },
        },
      },
      {
        $addFields: {
          yearDifference: {
            $dateDiff: {
              startDate: "$installationDate",
              endDate: currentDate,
              unit: "year",
              timezone: timezone,
            },
          },
        },
      },

      {
        $addFields: {
          groupName: {
            $arrayElemAt: [
              {
                $map: {
                  input: {
                    $filter: {
                      input: "$section_data.yearGroup",
                      as: "group",
                      cond: {
                        $or: [
                          {
                            $and: [
                              { $gte: ["$yearDifference", "$$group.from"] },
                              {
                                $or: [
                                  { $eq: ["$$group.to", null] },
                                  // { $lte: ["$yearDifference", "$$group.to"] },
                                ],
                              },
                            ],
                          },
                          {
                            $and: [
                              { $gte: ["$yearDifference", "$$group.from"] },
                              {
                                $or: [
                                  // { $eq: ["$$group.to", null] },
                                  { $lte: ["$yearDifference", "$$group.to"] },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    },
                  },
                  as: "matchedGroup",
                  in: "$$matchedGroup.group",
                },
              },
              0,
            ],
          },
        },
      },
      {
        $match: {
          groupName: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: {
            groupName: "$groupName",
            date: "$preAggregationTimeStampOfRequestSheet.requestSheet_year",
          },
          bdHoursmachineWise: {
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
        },
      },

      { $sort: { "_id.groupName": 1 } },

      {
        $group: {
          _id: null,
          label: { $push: "$_id.groupName" },
          data: { $push: { $trunc: ["$bdHoursmachineWise", 1] } },
        },
      },
    ]);

    // console.log(machineData);

    return res.status(201).json({
      message: "Yearwise Machine Age data get successfully",
      machineData,
    });
  }
);

router.get(
  "/getMachineAgePieChart/:filter/:selectedId/:groupId",
  authenticate,
  filterMiddleware,
  middlewareForMachineAgeLookup,
  async (req, res, next) => {
    try {
      const currentDate = new Date();
      const machineData = await RequestSheetOfBM.aggregate([
        {
          $match: req.queryObj,
        },
        {
          $lookup: {
            from: "machinesalldatas",
            localField: "machineRef",
            foreignField: "_id",
            as: "machine_data",
          },
        },
        {
          $unwind: "$machine_data",
        },

        ...req.queryObjPipeline,

        {
          $addFields: {
            installationDate: {
              $dateFromString: {
                dateString: "$machine_data.installation_date",
              },
            },
          },
        },
        {
          $addFields: {
            yearDifference: {
              $dateDiff: {
                startDate: "$installationDate",
                endDate: currentDate,
                unit: "year",
                timezone: timezone,
              },
            },
          },
        },

        {
          $addFields: {
            groupName: {
              $arrayElemAt: [
                {
                  $map: {
                    input: {
                      $filter: {
                        input: "$section_data.yearGroup",
                        as: "group",
                        cond: {
                          $or: [
                            {
                              $and: [
                                { $gte: ["$yearDifference", "$$group.from"] },
                                {
                                  $or: [
                                    { $eq: ["$$group.to", null] },
                                    // { $lte: ["$yearDifference", "$$group.to"] },
                                  ],
                                },
                              ],
                            },
                            {
                              $and: [
                                { $gte: ["$yearDifference", "$$group.from"] },
                                {
                                  $or: [
                                    // { $eq: ["$$group.to", null] },
                                    { $lte: ["$yearDifference", "$$group.to"] },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      },
                    },
                    as: "matchedGroup",
                    in: "$$matchedGroup",
                  },
                },
                0,
              ],
            },
          },
        },

        {
          $match: {
            "groupName._id": mongoose.Types.ObjectId(req?.params?.groupId),
          },
        },

        {
          $unwind: "$categoriesOfRequestSheet",
        },

        {
          $match: {
            "categoriesOfRequestSheet.subCategory": {
              $exists: true,
              $ne: null,
            },
          },
        },

        {
          $group: {
            _id: {
              groupName: "$groupName.group",
              date: "$preAggregationTimeStampOfRequestSheet.requestSheet_year",
              category: "$categoriesOfRequestSheet.category",
              subCategory: "$categoriesOfRequestSheet.subCategory",
            },
            count: { $sum: 1 },
            bdtime: {
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
          $sort: {
            "_id.subCategory": 1,
          },
        },

        {
          $group: {
            _id: {
              category: "$_id.category",
            },
            subcategories: {
              $push: "$_id.subCategory",
              // count: "$count",
              // bdtime: "$bdtime",
            },
            bdCount: {
              $push: "$count",
            },
            bdTime: {
              $push: { $trunc: ["$bdtime", 1] },
            },
          },
        },
        {
          $limit: 2,
        },

        {
          $sort: {
            "_id.category": 1,
          },
        },

        {
          $group: {
            _id: null,
            categories: {
              $push: {
                category: "$_id.category",
                subcategories: "$subcategories",
                bdCount: "$bdCount",
                bdTime: "$bdTime",
              },
            },
          },
        },

        {
          $project: {
            _id: 0,
            categories: 1,
          },
        },
      ]);

      // console.log(machineData);

      return res.status(201).json({
        message: "Machine Age data for Piechart get successfully",
        data: machineData?.[0]?.categories,
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/getYearGroupsDropdown",
  authenticate,
  sectionOrSubSectionFilterMiddleware,
  async (req, res, next) => {
    try {
      const yearDropdown = await req.Model.findOne(req.findObj);

      // console.log(yearDropdown)
      return res.status(201).json({
        message: "YearGroup Dropdown data get successfully",
        data: yearDropdown?.yearGroup,
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/topMachineBreakdown/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  async (req, res, next) => {
    try {
      const topMachineBd = await RequestSheetOfBM.aggregate([
        { $match: req.queryObj },

        {
          $lookup: {
            from: "machinesalldatas",
            localField: "machineRef",
            foreignField: "_id",
            as: "machine_data",
          },
        },

        {
          $unwind: "$machine_data",
        },

        {
          $group: {
            _id: "$machine_data.machine_nickname",
            count: { $sum: 1 },
            machine_hours: {
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
          $sort: { machine_hours: -1 },
        },
        {
          $limit: req.query?.documentLimitInTheGraph * 1,
        },
        {
          $group: {
            _id: null,
            labels: { $push: "$_id" },
            data: { $push: { $trunc: ["$machine_hours", 1] } },
          },
        },
      ]);

      // const topMachineBd = await Machine.aggregate([
      //   {
      //     $match: {
      //       $or: [
      //         {
      //           subSection_names: mongoose.Types.ObjectId(
      //             req.params.selectedId
      //           ),
      //         },
      //         { section_names: mongoose.Types.ObjectId(req.params.selectedId) },
      //         { cell_names: mongoose.Types.ObjectId(req.params.selectedId) },
      //         {
      //           subSection_names: mongoose.Types.ObjectId(
      //             req.params.selectedId
      //           ),
      //         },
      //         { line_names: mongoose.Types.ObjectId(req.params.selectedId) },
      //       ],
      //     },
      //   },

      //   {
      //     $lookup: {
      //       from: "requestsheetofbms",
      //       let: { machine: "$_id" },
      //       pipeline: [
      //         {
      //           $match: {
      //             $expr: {
      //               $eq: ["$$machine", "$machineRef"],
      //             },
      //           },
      //         },
      //         {
      //           $group: {
      //             _id: null,

      //             bdHoursmachineWise: {
      //               $sum: {
      //                 $cond: [
      //                   {
      //                     $gt: [
      //                       "$maintenanceReportFilledByMTD.workEndedDateOfBM",
      //                       null,
      //                     ],
      //                   },
      //                   {
      //                     $divide: [
      //                       "$maintenanceReportFilledByMTD.breakDownTime",
      //                       60,
      //                     ],
      //                   },
      //                   0,
      //                 ],
      //               },
      //             },
      //           },
      //         },
      //       ],
      //       as: "machine_data",
      //     },
      //   },

      //   {
      //     $project: {
      //       machine_code: 1,
      //       sumOfmachine: {
      //         $cond: [
      //           {
      //             $gt: [
      //               {
      //                 $arrayElemAt: ["$machine_data.bdHoursmachineWise", 0],
      //               },
      //               null,
      //             ],
      //           },
      //           { $arrayElemAt: ["$machine_data.bdHoursmachineWise", 0] },
      //           0,
      //         ],
      //       },
      //     },
      //   },

      //   {
      //     $sort: { sumOfmachine: -1 },
      //   },
      //   {
      //     $limit: req.query?.documentLimitInTheGraph * 1,
      //   },
      //   {
      //     $group: {
      //       _id: null,
      //       labels: { $push: "$machine_code" },
      //       data: { $push: "$sumOfmachine" },
      //     },
      //   },
      // ]);
      return res.status(201).json({
        message: "Top Machine Breakdown data get successfully",
        topMachineBd: topMachineBd?.[0],
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/getApprovalRequestSheetData",
  authenticate,
  async (req, res, next) => {
    try {
      const findLoggedUserPlantData = await Plant.findOne({
        plant_id: req?.rootUser?.plant_data?.split("-")?.[0],
      });

      // console.log(
      //   `${req?.rootUser?.tm_department} ${
      //     req?.rootUser?.user_type.split("/")[0]
      //   }`
      // );

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
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

//          MTTR Report

router.get(
  "/getSectionOrSubSectionDropdownValue",
  authenticate,
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
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

// middleware function for getting data of MTTR and MTBF
const middlewareForFindingTrendData = async (req, res, next) => {
  try {
    const TrendData = await RequestSheetOfBM.aggregate([
      {
        $match: { ...req.queryObj, lineRef: { $in: req?.line_ids } },
      },
      {
        $group: {
          _id: "$preAggregationTimeStampOfRequestSheet.requestSheet_month",

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
        },
      },
      {
        $project: {
          count: 1,
          hours: truncValue(req.hourCalculationFormula),
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
                  { $in: ["$$month.monthName", "$array._id"] },
                  {
                    month: "$$month.monthName",
                    value: {
                      $arrayElemAt: [
                        "$array",
                        {
                          $indexOfArray: ["$array._id", "$$month.monthName"],
                        },
                      ],
                    },
                  },
                  {
                    month: "$$month.monthName",
                    value: {
                      _id: "$$month.monthName",
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
          // backgroundColor: {
          //   $push: {
          //     $cond: [
          //       {
          //         $lte: ["$value.hours", "$value.target"],
          //       },
          //       "c2c933", //"green",
          //       "ca1f4b", //"red",
          //     ],
          //   },
          // },
        },
      },
    ]);
    req.TrendData = TrendData;
    next();
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

const middlewareForFindingLineWiseTrendData = async (req, res, next) => {
  try {
    let target = {
      $avg: [],
    };

    if (req.query?.selectedMonth) {
      target = `$allTargetData.${req.query?.monthTargetKey}.${req.query?.selectedMonth}`;
    } else {
      for (let index = 0; index < allMonths.length; index++) {
        target["$avg"].push(
          `$allTargetData.${req.query?.monthTargetKey}.${allMonths?.[index]?.monthName}`
        );
        if (
          allMonths?.[index]?.monthName === currentMonth &&
          currentYear === req?.query?.selectedYear
        ) {
          break;
        }
      }
    }
    const TrendData = await RequestSheetOfBM.aggregate([
      {
        $match: req.queryObj,
      },
      {
        $group: {
          _id: "$lineRef",
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
        },
      },
      {
        $lookup: {
          from: "lines",
          localField: "_id",
          foreignField: "_id",
          pipeline: [
            {
              $unwind: "$allTargetData",
            },
            {
              $match: {
                "allTargetData.current_year": req.query?.selectedYear,
                "allTargetData.yearTotalProductionHrs": { $ne: 0 },
              },
            },
            {
              $project: {
                line_name: 1,
                target,
                ...req.mtbfProductionHrs,
              },
            },
          ],
          as: "line",
        },
      },
      { $unwind: "$line" },
      {
        $project: {
          lineName: "$line.line_name",
          target: truncValue("$line.target"),
          hours: truncValue(req.hourCalculationFormula),
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
          labels: { $push: "$lineName" },
          target: { $push: "$target" },
          data: { $push: "$hours" },
        },
      },
    ]);

    req.TrendData = TrendData;

    next();
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
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
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};
const middlewareForFindingMachineWiseTrendData = async (req, res, next) => {
  try {
    const TrendData = await RequestSheetOfBM.aggregate([
      {
        $match: req.queryObj,
      },

      {
        $group: {
          _id: {
            machineRef: "$machineRef",
            lineRef: "$lineRef",
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
        },
      },
      {
        $lookup: {
          from: "machinesalldatas",
          localField: "_id.machineRef",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                machine_nickname: 1,
              },
            },
          ],
          as: "machine",
        },
      },
      { $unwind: "$machine" },
      ...req.queryPipeline,
      {
        $project: {
          machine: 1,
          hours: truncValue(req.hourCalculationFormula),
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
          machineId: { $push: "$machine._id" },
          labels: { $push: "$machine.machine_nickname" },
          data: { $push: "$hours" },
        },
      },
    ]);

    req.TrendData = TrendData;

    next();
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

// filter middleware for all the charts of MTTR Report
const filterMiddlewareForMTTRReport = async (req, res, next) => {
  try {
    req.mtbfProductionHrs = {};

    req.hourCalculationFormula = {
      $divide: ["$hours", "$count"],
    };

    req.queryPipeline = [];

    next();
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

// filter middleware for all the charts of MTBF Report
const filterMiddlewareForMTBFReport = async (req, res, next) => {
  try {
    let productionHour = {
      $sum: [],
    };

    if (req.query?.selectedMonth) {
      productionHour = `$allTargetData.monthlyProductionHrs.${req.query?.selectedMonth}`;
    } else {
      for (let index = 0; index < allMonths.length; index++) {
        productionHour["$sum"].push(
          `$allTargetData.monthlyProductionHrs.${allMonths?.[index]?.monthName}`
        );
        if (
          allMonths?.[index]?.monthName === currentMonth &&
          currentYear === req?.query?.selectedYear
        ) {
          break;
        }
      }
    }

    req.queryPipeline = [
      {
        $lookup: {
          from: "lines",
          localField: "_id.lineRef",
          foreignField: "_id",
          pipeline: [
            {
              $unwind: "$allTargetData",
            },
            {
              $match: {
                "allTargetData.current_year": req.query?.selectedYear,
                "allTargetData.yearTotalMTBFTarget": { $gt: 0 },
              },
            },
            {
              $project: {
                line_name: 1,
                productionHour,
              },
            },
          ],
          as: "line",
        },
      },
      { $unwind: "$line" },
    ];

    req.hourCalculationFormula = {
      $divide: [
        {
          $subtract: ["$line.productionHour", "$hours"],
        },
        "$count",
      ],
    };

    next();
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

const responseMiddlewareForReport = async (req, res, next) => {
  try {
    return res.status(201).json({
      message: req.message,
      total: req?.TrendData?.length,
      another: req?.TrendData,
      data: req?.TrendData?.[0],
    });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

const responseMiddlewareForDataTrendReport = async (req, res, next) => {
  try {
    return res.status(201).json({
      message: req.message,
      data: {
        ...req?.TrendData?.[0],
        target: req.target,
        backgroundColor: req.target?.map((item, index) =>
          req?.TrendData?.[0]?.data?.[index] >= item ? "#16FF00" : "red"
        ),
      },
    });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

//Whole MTTR Dashboard (MTTR Trend)
router.get(
  "/getTrendData/MTTR/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  targetMiddleware,
  filterMiddlewareForMTTRReport,
  middlewareForFindingTrendData,
  async (req, res, next) => {
    req.message = "MTTR trend graph data get successfully";
    next();
  },
  responseMiddlewareForDataTrendReport
);

router.get(
  "/getLineWiseMTTRTrendData/:filter/:selectedId",
  authenticate,
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
  authenticate,
  middlewareForLimitValidation,
  filterMiddleware,
  filterMiddlewareForMTTRReport,
  async (req, res, next) => {
    req.sort = -1;
    req.message = "Machine wise MTTR trend data get successfully";
    next();
  },
  middlewareForFindingMachineWiseTrendData,
  responseMiddlewareForReport
);

router.get(
  "/getRequestSheetDataBasedOnSelectedMachine/:machineCode/:toDate/:fromDate",
  authenticate,
  async (req, res, next) => {
    try {
      // let nextDate = new Date(req.params.date);
      // nextDate.setDate(nextDate.getDate() + 1);
      // if (req.params.date !== "undefined") {
      //   req.queryObj = {
      //     machineRef: mongoose.Types.ObjectId(req.params?.machineCode),
      //     problemOccurredDateAndTimeOfBM: {
      //       $gte: new Date(req.params.date),
      //       $lt: nextDate,
      //     },
      //   };
      // }
      if (
        req?.params?.toDate !== "undefined" &&
        req?.params?.fromDate !== "undefined"
      ) {
        req.queryObj = {
          machineRef: mongoose.Types.ObjectId(req.params?.machineCode),
          $and: [
            {
              problemOccurredDateAndTimeOfBM: {
                $gte: new Date(moment(req?.params?.fromDate).format()),
              },
            },
            {
              problemOccurredDateAndTimeOfBM: {
                $lte: new Date(
                  moment(req?.params?.toDate).endOf("day").format()
                ),
              },
            },
          ],
        };
      } else {
        req.queryObj = {
          machineRef: mongoose.Types.ObjectId(req.params?.machineCode),
        };
      }
      next();
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  },
  requestSheetMiddleware
);

//Whole MTBF Dashboard (MTBF Trend)
router.get(
  "/getTrendData/MTBF/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  targetMiddleware,
  productionHourFiltration,
  async (req, res, next) => {
    try {
      req.hourCalculationFormula = {
        $divide: [
          {
            $subtract: [
              {
                $getField: {
                  field: "v",
                  input: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: {
                            $objectToArray: req.productionHrs,
                          },
                          as: "monthlyProduction",
                          cond: {
                            $eq: ["$$monthlyProduction.k", "$_id"],
                          },
                        },
                      },
                      0,
                    ],
                  },
                },
              },
              "$hours",
            ],
          },
          "$count",
        ],
      };

      req.message = "MTBF trend data get successfully";
      next();
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  },
  middlewareForFindingTrendData,
  responseMiddlewareForDataTrendReport
);

router.get(
  "/getLineWiseMTBFTrendData/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  async (req, res, next) => {
    try {
      // let productionHrs = "$allTargetData.yearTotalProductionHrs";

      let productionHrs = {
        $sum: [],
      };

      if (req.query?.selectedMonth) {
        productionHrs = `$allTargetData.monthlyProductionHrs.${req.query?.selectedMonth}`;
      } else {
        for (let index = 0; index < allMonths.length; index++) {
          productionHrs["$sum"].push(
            `$allTargetData.monthlyProductionHrs.${allMonths?.[index]?.monthName}`
          );
          if (
            allMonths?.[index]?.monthName === currentMonth &&
            currentYear === req?.query?.selectedYear
          ) {
            break;
          }
        }
      }

      req.mtbfProductionHrs = {
        productionHrs,
      };

      req.hourCalculationFormula = {
        $divide: [
          {
            $subtract: ["$line.productionHrs", "$hours"],
          },
          "$count",
        ],
      };

      req.message = "Line wise MTBF trend data get successfully";

      next();
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  },
  middlewareForFindingLineWiseTrendData,
  responseMiddlewareForReport
);

router.get(
  "/getMachineWiseMTBFTrendData/:filter/:selectedId",
  authenticate,
  middlewareForLimitValidation,
  filterMiddleware,
  // productionHourFiltration,
  filterMiddlewareForMTBFReport,
  async (req, res, next) => {
    req.sort = 1;
    req.message = "Machine wise MTBF trend data get successfully";
    next();
  },
  middlewareForFindingMachineWiseTrendData,
  responseMiddlewareForReport
);

router.patch(
  "/approveRequestSheetFromHigherAuthority/:reqId/:machineRef",
  authenticate,
  getRequestSheetData,
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

      let keyOfChangeApprovalStatusFromPendingToAcceptedOrRejectedForCondition = `approvalStatusOf${requestSheetDataOfBM?.getDataForApprovalDashboard?.departmentAndGradeOfUser?.replace(
        " ",
        "_"
      )}`;

      let keyOfSendingEmailToNextHigherAuthority = `approvalOf${requestSheetDataOfBM?.getDataForApprovalDashboard?.departmentAndGradeOfUser?.replace(
        " ",
        "_"
      )}`;

      let keyOfApprovalDateAndTimeOfAcceptedOrRejected = `approvalDateAndTimeOf${requestSheetDataOfBM?.getDataForApprovalDashboard?.departmentAndGradeOfUser?.replace(
        " ",
        "_"
      )}`;

      const getRequestSheetData = await RequestSheetOfBM.findOne({
        _id: mongoose.Types.ObjectId(req.params?.reqId),
      });

      const lengthOfTheApprovalStatus =
        getRequestSheetData?.[
          keyOfChangeApprovalStatusFromPendingToAcceptedOrRejectedForCondition
        ]?.length || 1;

      const lengthOfTheApprovalOrRejectedDateAndTime =
        getRequestSheetData?.[keyOfApprovalDateAndTimeOfAcceptedOrRejected]
          ?.length || 1;

      getRequestSheetData[keyOfApprovalDateAndTimeOfAcceptedOrRejected][
        lengthOfTheApprovalOrRejectedDateAndTime - 1
      ] = new Date();

      //Approver approve the request-sheet
      if (approvalOfRequestSheet === "Yes") {
        let getNextApproverDepartmentAndGradeOfUser;
        let ListOfCCEmailOfOtherHigherAuthority;

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

          ListOfCCEmailOfOtherHigherAuthority = minorListForTheApprovalOfPlant
            .filter((value) => {
              if (
                value !==
                req?.requestSheetData?.[0]?.getDataForApprovalDashboard
                  ?.departmentAndGradeOfUser
              )
                return value;
            })
            .map((obj) => {
              return req?.requestSheetData?.[0]?.[
                `approvalOf${obj?.replace(" ", "_")}`
              ]?.email;
            });
        }
        //For under Major Request-sheet
        else {
          getNextApproverDepartmentAndGradeOfUser =
            (getRequestSheetData?.maintenanceType === "BM" ||
              (majorListForTheApprovalOfPlant[
                majorListForTheApprovalOfPlant.indexOf(
                  requestSheetDataOfBM?.getDataForApprovalDashboard
                    ?.departmentAndGradeOfUser
                ) + 1
              ] !== "MTD HOD" &&
                majorListForTheApprovalOfPlant[
                  majorListForTheApprovalOfPlant.indexOf(
                    requestSheetDataOfBM?.getDataForApprovalDashboard
                      ?.departmentAndGradeOfUser
                  ) + 1
                ] !== "PRD HOD")) &&
            majorListForTheApprovalOfPlant[
              majorListForTheApprovalOfPlant.indexOf(
                requestSheetDataOfBM?.getDataForApprovalDashboard
                  ?.departmentAndGradeOfUser
              ) + 1
            ];
          ListOfCCEmailOfOtherHigherAuthority = majorListForTheApprovalOfPlant
            .filter((value) => {
              if (
                value !==
                req?.requestSheetData?.[0]?.getDataForApprovalDashboard
                  ?.departmentAndGradeOfUser
              )
                return value;
            })
            .map((obj) => {
              return req?.requestSheetData?.[0]?.[
                `approvalOf${obj?.replace(" ", "_")}`
              ]?.email;
            });
        }
        getRequestSheetData[
          keyOfChangeApprovalStatusFromPendingToAcceptedOrRejectedForCondition
        ][lengthOfTheApprovalStatus - 1] = "Accepted";
        if (getNextApproverDepartmentAndGradeOfUser) {
          //Further approval is required

          let valueOfGetDataForApprovalDashboardId =
            requestSheetDataOfBM?.[
              `approvalOf${getNextApproverDepartmentAndGradeOfUser?.replace(
                " ",
                "_"
              )}`
            ]?._id;

          let updateApprovalStatusOfRequestSheet =
            await RequestSheetOfBM.findOneAndUpdate(
              {
                _id: mongoose.Types.ObjectId(req.params?.reqId),
                // [keyOfChangeApprovalStatusFromPendingToAcceptedOrRejectedForCondition]:
                //   "Pending",
              },
              {
                $set: {
                  requestSheetStatus: `Under ${getNextApproverDepartmentAndGradeOfUser} Approval`,
                  "getDataForApprovalDashboard.Id":
                    valueOfGetDataForApprovalDashboardId,
                  "getDataForApprovalDashboard.departmentAndGradeOfUser":
                    getNextApproverDepartmentAndGradeOfUser,
                  [keyOfChangeApprovalStatusFromPendingToAcceptedOrRejectedForCondition]:
                    getRequestSheetData?.[
                      keyOfChangeApprovalStatusFromPendingToAcceptedOrRejectedForCondition
                    ],
                  [keyOfApprovalDateAndTimeOfAcceptedOrRejected]:
                    getRequestSheetData[
                      keyOfApprovalDateAndTimeOfAcceptedOrRejected
                    ],
                },
              },
              { new: true }
            );
          if (updateApprovalStatusOfRequestSheet) {
            const bodyContent = ({ key, value, approvedDateAndTime }) => {
              return `<table style="font-family: arial, sans-serif;border-collapse: collapse;width: 100%;">

               <tr>
               <td style="border: 1px solid black;text-align: left;padding: 8px;">Cell/Product</td>
               <td style="border: 1px solid black;text-align: left;padding: 8px;">${
                 requestSheetDataOfBM?.cell
               }</td>
               </tr>

               <tr style="background-color: #dddddd;">
               <td style="border: 1px solid black;text-align: left;padding: 8px;">Line</td>
               <td style="border: 1px solid black;text-align: left;padding: 8px;">${
                 requestSheetDataOfBM?.line
               }</td>
               </tr>

               <tr>
                   <td style="border: 1px solid black;text-align: left;padding: 8px;">Machine</td>
                   <td style="border: 1px solid black;text-align: left;padding: 8px;">${
                     requestSheetDataOfBM?.machineName
                   }</td>
               </tr>

               <tr style="background-color: #dddddd;">
                   <td style="border: 1px solid black;text-align: left;padding: 8px;">Machine No.</td>
                   <td style="border: 1px solid black;text-align: left;padding: 8px;">${
                     requestSheetDataOfBM?.machineNo
                   }</td>
               </tr>

               <tr>
               <td style="border: 1px solid black;text-align: left;padding: 8px;">Request Sheet No.</td>
               <td style="border: 1px solid black;text-align: left;padding: 8px;">${
                 requestSheetDataOfBM?.requestSheetNoOfBM
               }</td>
               </tr>

               <tr style="background-color: #dddddd;">
               <td style="border: 1px solid black;text-align: left;padding: 8px;">${key}</td>
               <td style="border: 1px solid black;text-align: left;padding: 8px;">${value}</td>
               </tr>

               <tr>
               <td style="border: 1px solid black;text-align: left;padding: 8px;">Approved Date & Time</td>
               <td style="border: 1px solid black;text-align: left;padding: 8px;">${moment(
                 approvedDateAndTime
               )
                 .tz("Asia/Kolkata")
                 .format("DD-MM-YYYY THH:mm")}</td>
               </tr>

               <tr style="background-color: #dddddd;">
               <td style="border: 1px solid black;text-align: left;padding: 8px;">Request Sheet Status</td>
               <td style="border: 1px solid black;text-align: left;padding: 8px;">${
                 updateApprovalStatusOfRequestSheet?.requestSheetStatus
               }</td>
               </tr>

               <tr>
               <td style="border: 1px solid black;text-align: left;padding: 8px;">Work Order Status</td>
               <td style="border: 1px solid black;text-align: left;padding: 8px;">${
                 updateApprovalStatusOfRequestSheet?.work_order_status
               }</td>
               </tr>

           </table>`;
            };
            let bodyTable = bodyContent({
              key: "Approved By",
              value: req?.rootUser?.tm_name,
              approvedDateAndTime:
                getRequestSheetData[
                  keyOfApprovalDateAndTimeOfAcceptedOrRejected
                ],
            });
            sendMailForBD({
              subject: `Request Sheet Approval (${requestSheetDataOfBM?.cell}/${requestSheetDataOfBM?.line}/${requestSheetDataOfBM?.machineName}/${requestSheetDataOfBM?.requestSheetNoOfBM})`,
              title: `Kindly Approve Request-sheet`,
              greetings: `Sir\\Ma'am`,
              toEmailIds:
                requestSheetDataOfBM?.[keyOfSendingEmailToNextHigherAuthority]
                  ?.email,
              ccEmailIds: ListOfCCEmailOfOtherHigherAuthority,
              bodyTable: bodyTable,
            });

            return res.status(201).json({
              message: `${getRequestSheetData?.requestSheetNoOfBM} Request-sheet is approve !!`,
              errorType: "Approve",
            });
          }
        } else {
          //No further approver is required
          let updateApprovalStatusOfRequestSheet =
            await RequestSheetOfBM.findOneAndUpdate(
              {
                _id: mongoose.Types.ObjectId(req.params?.reqId),
                // [keyOfChangeApprovalStatusFromPendingToAcceptedOrRejectedForCondition]:
                //   "Pending",
              },
              {
                $set: {
                  requestSheetStatus: "Completed",
                  [keyOfChangeApprovalStatusFromPendingToAcceptedOrRejectedForCondition]:
                    getRequestSheetData?.[
                      keyOfChangeApprovalStatusFromPendingToAcceptedOrRejectedForCondition
                    ],
                  [keyOfApprovalDateAndTimeOfAcceptedOrRejected]:
                    getRequestSheetData[
                      keyOfApprovalDateAndTimeOfAcceptedOrRejected
                    ],
                },
                $unset: {
                  getDataForApprovalDashboard: "",
                },
              },
              { new: true }
            );

          if (updateApprovalStatusOfRequestSheet) {
            const bodyContent = ({ key, value, approvedDateAndTime }) => {
              return `<table style="font-family: arial, sans-serif;border-collapse: collapse;width: 100%;">

               <tr>
               <td style="border: 1px solid black;text-align: left;padding: 8px;">Cell/Product</td>
               <td style="border: 1px solid black;text-align: left;padding: 8px;">${
                 requestSheetDataOfBM?.cell
               }</td>
               </tr>

               <tr style="background-color: #dddddd;">
               <td style="border: 1px solid black;text-align: left;padding: 8px;">Line</td>
               <td style="border: 1px solid black;text-align: left;padding: 8px;">${
                 requestSheetDataOfBM?.line
               }</td>
               </tr>

               <tr>
                   <td style="border: 1px solid black;text-align: left;padding: 8px;">Machine</td>
                   <td style="border: 1px solid black;text-align: left;padding: 8px;">${
                     requestSheetDataOfBM?.machineName
                   }</td>
               </tr>

               <tr style="background-color: #dddddd;">
                   <td style="border: 1px solid black;text-align: left;padding: 8px;">Machine No.</td>
                   <td style="border: 1px solid black;text-align: left;padding: 8px;">${
                     requestSheetDataOfBM?.machineNo
                   }</td>
               </tr>

               <tr>
               <td style="border: 1px solid black;text-align: left;padding: 8px;">Request Sheet No.</td>
               <td style="border: 1px solid black;text-align: left;padding: 8px;">${
                 requestSheetDataOfBM?.requestSheetNoOfBM
               }</td>
               </tr>

               <tr style="background-color: #dddddd;">
               <td style="border: 1px solid black;text-align: left;padding: 8px;">${key}</td>
               <td style="border: 1px solid black;text-align: left;padding: 8px;">${value}</td>
               </tr>

               <tr>
               <td style="border: 1px solid black;text-align: left;padding: 8px;">Approved Date & Time</td>
               <td style="border: 1px solid black;text-align: left;padding: 8px;">${moment(
                 approvedDateAndTime
               )
                 .tz("Asia/Kolkata")
                 .format("DD-MM-YYYY THH:mm")}</td>
               </tr>

               <tr style="background-color: #dddddd;">
               <td style="border: 1px solid black;text-align: left;padding: 8px;">Request Sheet Status</td>
               <td style="border: 1px solid black;text-align: left;padding: 8px;">${
                 updateApprovalStatusOfRequestSheet?.requestSheetStatus
               }</td>
               </tr>

               <tr>
               <td style="border: 1px solid black;text-align: left;padding: 8px;">Work Order Status</td>
               <td style="border: 1px solid black;text-align: left;padding: 8px;">${
                 updateApprovalStatusOfRequestSheet?.work_order_status
               }</td>
               </tr>

           </table>`;
            };
            let bodyTable = bodyContent({
              key: "Approved By",
              value: req?.rootUser?.tm_name,
              approvedDateAndTime:
                getRequestSheetData[
                  keyOfApprovalDateAndTimeOfAcceptedOrRejected
                ],
            });
            sendMailForBD({
              subject: `Request Sheet Approval (${requestSheetDataOfBM?.cell}/${requestSheetDataOfBM?.line}/${requestSheetDataOfBM?.machineName}/${requestSheetDataOfBM?.requestSheetNoOfBM})`,
              title: `Kindly Approve Request-sheet`,
              greetings: `Sir\\Ma'am`,
              toEmailIds:
                requestSheetDataOfBM?.[keyOfSendingEmailToNextHigherAuthority]
                  ?.email,
              ccEmailIds: ListOfCCEmailOfOtherHigherAuthority,
              bodyTable: bodyTable,
            });
            return res.status(201).json({
              message: `${getRequestSheetData?.requestSheetNoOfBM} Request-sheet is approve !!`,
              errorType: "Approve",
            });
          }
        }
      }
      //Approver reject the request-sheet
      else {
        getRequestSheetData[
          keyOfChangeApprovalStatusFromPendingToAcceptedOrRejectedForCondition
        ][lengthOfTheApprovalStatus - 1] = "Rejected";

        let updateApprovalStatusOfRequestSheet =
          await RequestSheetOfBM.findOneAndUpdate(
            {
              _id: mongoose.Types.ObjectId(req.params?.reqId),
              // [keyOfChangeApprovalStatusFromPendingToAcceptedOrRejectedForCondition]:
              //   "Pending",
            },
            {
              $set: {
                requestSheetStatus: "Rejected",
                [keyOfChangeApprovalStatusFromPendingToAcceptedOrRejectedForCondition]:
                  getRequestSheetData?.[
                    keyOfChangeApprovalStatusFromPendingToAcceptedOrRejectedForCondition
                  ],
                "getDataForApprovalDashboard.Id":
                  requestSheetDataOfBM?.approvalOfMTD_TL?._id,
                "getDataForApprovalDashboard.departmentAndGradeOfUser":
                  "MTD TL",
                [keyOfApprovalDateAndTimeOfAcceptedOrRejected]:
                  getRequestSheetData[
                    keyOfApprovalDateAndTimeOfAcceptedOrRejected
                  ],
              },

              $push: {
                approvalOfMTD_TL: requestSheetDataOfBM?.approvalOfMTD_TL?._id,
                approvalStatusOfMTD_TL: "Pending",
                rejectedRemarksOfRequestSheet,
                approverNameLogOfMTD_TL:
                  requestSheetDataOfBM?.approvalOfMTD_TL?.tm_name,
              },
            },
            { new: true }
          );
        if (updateApprovalStatusOfRequestSheet)
          return res.status(201).json({
            message: `${getRequestSheetData?.requestSheetNoOfBM} Request-sheet is rejected !!`,
            errorType: "Rejected",
          });
      }
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      console.log(error);
      res.status(500).json({ message: error?.message, error });
    }
  }
);

//Getting data of approval log
router.get(
  "/getApprovalLogDetails/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  async (req, res, next) => {
    try {
      delete req?.queryObj?.maintenanceType;

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
      const getDataOfRequestSheetApprovalLogs =
        await RequestSheetOfBM?.aggregate([
          {
            $match: {
              ...req.queryObj,
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
              from: "cells",
              localField: "cellRef",
              foreignField: "_id",
              as: "cells",
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
              pipeline: [
                {
                  $project: {
                    user_type: 1,
                    tm_name: 1,
                  },
                },
              ],
              as: "handoverUserDetails",
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
              handOverUser: 1,

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
              cell: { $arrayElemAt: ["$cells.cell_name", 0] },
              machineNo: { $arrayElemAt: ["$machines.machine_code", 0] },
              machineName: { $arrayElemAt: ["$machines.machine_name", 0] },
              assignUser: {
                $arrayElemAt: ["$namesOperators.tm_name", 0],
              },
              handOverUser: {
                $arrayElemAt: ["$handoverUserDetails.tm_name", 0],
              },

              problemOccurredDateAndTimeOfBMForTable: {
                $dateToString: {
                  format: "%d-%m-%Y T%H:%M",
                  date: "$problemOccurredDateAndTimeOfBM",
                  timezone: "Asia/Kolkata",
                },
              },

              rejectedRemarksOfRequestSheet: 1,
            },
          },
        ]);

      res.status(201).json({
        message: "Get approval data successfully",
        approvalDataLogs: getDataOfRequestSheetApprovalLogs,
        mergedApprovalListArray,
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
// -------------------------------------------------------------------------------
//        Man-Hour Report APIS
// -------------------------------------------------------------------------------

const filtrationMiddleware = async (req, res, next) => {
  try {
    let queryObjForBM = {
      "preAggregationTimeStampOfRequestSheet.requestSheet_year":
        req.query?.selectedYear,
      "maintenanceReportFilledByMTD.breakDownTime": {
        $gt: 0,
      },
      maintenanceType: "BM",
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
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

router.get(
  "/manHourReport/hourTrend/:filter/:selectedId",
  authenticate,
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
                  truncValue({
                    $divide: [
                      {
                        $add: [
                          "$maintenanceReportFilledByMTD.breakDownTime",
                          {
                            $ifNull: [
                              "$maintenanceReportFilledByMTD.maintenanceTime",
                              0,
                            ],
                          },
                        ],
                      },
                      60,
                    ],
                  }),
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
              $sum: truncValue({
                $divide: ["$totalPMTime.v.totalWorkedPMTime", 60],
              }),
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
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/manHourReport/manHourTrend/:filter/:selectedId",
  authenticate,
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
              $sum: truncValue({
                $multiply: [
                  {
                    $divide: [
                      {
                        $add: [
                          "$maintenanceReportFilledByMTD.breakDownTime",
                          {
                            $ifNull: [
                              "$maintenanceReportFilledByMTD.maintenanceTime",
                              0,
                            ],
                          },
                        ],
                      },
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
              }),
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
              $sum: truncValue({
                $divide: ["$totalPMTime.v.supportingTMData.workedTime", 60],
              }),
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
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
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
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

router.get(
  "/manHourReport/lineTrend/:filter/:selectedId",
  authenticate,
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
          "maintenanceReportFilledByMTD.breakDownTime": {
            $gt: 0,
          },
          maintenanceType: "BM",
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
          cellRef: mongoose.Types.ObjectId(req.params?.selectedId),
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
                      {
                        $add: [
                          "$maintenanceReportFilledByMTD.breakDownTime",
                          {
                            $ifNull: [
                              "$maintenanceReportFilledByMTD.maintenanceTime",
                              0,
                            ],
                          },
                        ],
                      },
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
                            {
                              $add: [
                                "$maintenanceReportFilledByMTD.breakDownTime",
                                {
                                  $ifNull: [
                                    "$maintenanceReportFilledByMTD.maintenanceTime",
                                    0,
                                  ],
                                },
                              ],
                            },
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
          $match: {
            percentage: {
              $gt: 0,
            },
          },
        },
        {
          $group: {
            _id: null,
            lines: { $push: "$line_name" },
            totalSumOf_PM: {
              $push: truncValue("$sumOfPM"),
            },
            totalSumOf_BM: {
              $push: truncValue("$sumOfBM"),
            },
            percentage: {
              $push: truncValue("$percentage"),
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
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/manHourReport/tmLoad/:filter/:selectedId",
  authenticate,
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
          "maintenanceReportFilledByMTD.breakDownTime": {
            $gt: 0,
          },
          maintenanceType: "BM",
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
          cellRef: mongoose.Types.ObjectId(req.params?.selectedId),
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
              $setUnion: [
                ["$assignUser"],
                {
                  $cond: [
                    { $gt: ["$handOverUser", null] },
                    ["$handOverUser"],
                    [],
                  ],
                },
                "$supportingTM",
              ],
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
                      {
                        $add: [
                          "$maintenanceReportFilledByMTD.breakDownTime",
                          {
                            $ifNull: [
                              "$maintenanceReportFilledByMTD.maintenanceTime",
                              0,
                            ],
                          },
                        ],
                      },
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
                      {
                        $cond: [
                          { $gt: ["$handOverUser", null] },
                          ["$handOverUser"],
                          [],
                        ],
                      },
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
                            {
                              $add: [
                                "$maintenanceReportFilledByMTD.breakDownTime",
                                {
                                  $ifNull: [
                                    "$maintenanceReportFilledByMTD.maintenanceTime",
                                    0,
                                  ],
                                },
                              ],
                            },
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
          $match: {
            percentage: {
              $gt: 0,
            },
          },
        },
        {
          $group: {
            _id: null,
            tm_names: {
              $push: "$tm_name",
            },
            totalSumOf_PM: {
              $push: truncValue("$sumOfPM"),
            },
            totalSumOf_BM: {
              $push: truncValue("$sumOfBM"),
            },
            percentage: {
              $push: truncValue("$percentage"),
            },
          },
        },
      ]);

      return res.status(201).json({
        message: "TM load data get successfully",
        tmLoadData: tmLoadData?.[0],
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
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
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
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
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
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
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
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

      selectedSection: req.section?._id,
      sections: [],
      selectedSubSection: "",
      subSections: [],
      selectedCell: "",
      cells,
      selectedLine: "",
      lines: [],
    });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
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
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

const conditionMiddlewareForSubSectionQuery = async (req, res, next) => {
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
          selectedMachine: "",
          machines: [],
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
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

const sectionQueryMiddlewareForParamsId = async (req, res, next) => {
  try {
    req.sectionQuery = {
      _id: mongoose.Types.ObjectId(req.params?.id),
    };
    next();
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

const subSectionQueryMiddleware = async (req, res, next) => {
  try {
    req.subSectionQuery = {
      section_names: req.section?._id,
    };
    next();
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

const functionForFindingCellBasedOnSelectedSubSection = async (
  req,
  res,
  next
) => {
  try {
    const cells = await Cell.find({
      subSection_names: mongoose.Types.ObjectId(req.params?.id),
    });

    return res.status(201).json({
      message: "Cell dropdown value get successfully",

      selectedValue: req.params?.id,
      flagForTogglingFilter: "based-on-subSection",

      selectedSubSection: req.params?.id,

      selectedCell: "",
      cells,
      selectedLine: "",
      lines: [],
      selectedMachine: "",
      machines: [],
    });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

const functionForFindingLineBasedOnSelectedCell = async (req, res, next) => {
  try {
    const lines = await Line.find({
      cell_names: mongoose.Types.ObjectId(req.params?.id),
    });

    return res.status(201).json({
      message: "Line dropdown value get successfully",

      selectedValue: req.params?.id,
      flagForTogglingFilter: "based-on-cell",

      selectedCell: req.params?.id,

      selectedLine: "",
      lines,
      selectedMachine: "",
      machines: [],
    });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

router.get(
  "/getFiltrationValue/all-filtration/byDefault",
  authenticate,
  plantFiltrationMiddleware,
  conditionMiddlewareForSectionQuery,
  sectionFiltrationMiddleware,
  conditionMiddlewareForSubSectionQuery,
  subSectionFiltrationMiddleware,
  async (req, res, next) => {
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
            selectedMachine: "",
            machines: [],
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
            selectedMachine: "",
            machines: [],
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
          selectedMachine: "",
          machines: [],
        });
      }

      return res.status(201).json({
        message: "Cell dropdown value get successfully",

        flagForTogglingFilter: "based-on-section",
        selectedValue: req.section?._id,

        selectedSection: req.section?._id,
        sections: [],
        selectedSubSection: "",
        subSections: [],
        selectedCell: "",
        cells,
        selectedLine: "",
        lines: [],
        selectedMachine: "",
        machines: [],
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/getFiltrationValue/all-filtration/sectionBased/:id",
  authenticate,
  sectionQueryMiddlewareForParamsId,
  sectionFiltrationMiddleware,
  subSectionQueryMiddleware,
  subSectionFiltrationMiddleware,
  async (req, res, next) => {
    try {
      const cells = await Cell.find(req.cellQuery);

      if (req.section.dashboardLevel === "No") {
        return res.status(201).json({
          message: "SubSections get successfully",

          flagForTogglingFilter: "based-on-subSection",
          selectedValue: req.subSection?._id,

          selectedSection: req.section?._id,

          selectedSubSection: req.subSection?._id,
          subSections: req.subSections,
          selectedCell: "",
          cells,
          selectedLine: "",
          lines: [],
          selectedMachine: "",
          machines: [],
        });
      } else {
        return res.status(201).json({
          message: "Sections get successfully",

          flagForTogglingFilter: "based-on-section",
          selectedValue: req.section?._id,

          selectedSection: req.section?._id,

          selectedSubSection: "",
          subSections: [],
          selectedCell: "",
          cells,
          selectedLine: "",
          lines: [],
          selectedMachine: "",
          machines: [],
        });
      }
      // if (req.rootUser?.tm_grade === "HOD") {
      // }

      // if (req.section.dashboardLevel === "No") {
      //   return res.status(201).json({
      //     message: "SubSections get successfully",

      //     flagForTogglingFilter: "based-on-subSection",
      //     selectedValue: req.subSection?._id,

      //     selectedSection: "",
      //     sections: [],
      //     selectedSubSection: req.subSection?._id,
      //     subSections: req.subSections,
      //     selectedCell: "",
      //     cells,
      //     selectedLine: "",
      //     lines: [],
      //     selectedMachine: "",
      //     machines: [],
      //   });
      // }

      // return res.status(201).json({
      //   message: "Cell dropdown value get successfully",

      //   flagForTogglingFilter: "based-on-section",
      //   selectedValue: req.section?._id,

      //   selectedSection: req.section?._id,
      //   sections: [],
      //   selectedSubSection: "",
      //   subSections: [],
      //   selectedCell: "",
      //   cells,
      //   selectedLine: "",
      //   lines: [],
      //   selectedMachine: "",
      //   machines: [],
      // });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/getFiltrationValue/all-filtration/subSectionBased/:id",
  authenticate,
  functionForFindingCellBasedOnSelectedSubSection
);

router.get(
  "/getFiltrationValue/all-filtration/cellBased/:id",
  authenticate,
  functionForFindingLineBasedOnSelectedCell
);

router.get(
  "/getFiltrationValue/all-filtration/lineBased/:id",
  authenticate,
  async (req, res, next) => {
    try {
      const machines = await Machine.find({
        line_names: mongoose.Types.ObjectId(req.params?.id),
      });

      return res.status(201).json({
        message: "Machine dropdown value get successfully",

        selectedValue: req.params?.id,
        flagForTogglingFilter: "based-on-line",

        selectedLine: req.params?.id,

        selectedMachine: "",
        machines,
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
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
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

const lineFiltrationMiddleware = async (req, res, next) => {
  try {
    const lines = await Line.find({
      cell_names: mongoose.Types.ObjectId(req.cellID),
    });
    req.lineID = lines?.[0]?._id;
    req.lines = lines;
    return next();
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

const machineFiltrationMiddleware = async (req, res, next) => {
  try {
    const machines = await Machine.find({
      line_names: mongoose.Types.ObjectId(req?.lineID),
    });
    req.machineID = machines?.[0]?._id;
    req.machines = machines;
    return next();
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

router.get(
  "/getFiltrationValue/cell-level-filtration/byDefault",
  authenticate,
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
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
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
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/getFiltrationValue/cell-level-filtration/sectionBased/:id",
  authenticate,
  sectionQueryMiddlewareForParamsId,
  sectionFiltrationMiddleware,
  subSectionQueryMiddleware,
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

          selectedSection: req.section?._id,

          selectedSubSection: req.subSection?._id,
          subSections: req.subSections,
          selectedCell: req.cellID,
          cells: req.cells,
          selectedLine: "",
          lines: req.lines,

          selectedMachine: "",
          machines: [],
        });
      }

      return res.status(201).json({
        message: "Data get successfully",

        flagForTogglingFilter: "based-on-cell",
        selectedValue: req.cellID,

        selectedSection: req.section?._id,

        selectedSubSection: "",
        subSections: [],
        selectedCell: req.cellID,
        cells: req.cells,
        selectedLine: "",
        lines: req.lines,

        selectedMachine: "",
        machines: [],
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/getFiltrationValue/cell-level-filtration/subSectionBased/:id",
  authenticate,
  async (req, res, next) => {
    try {
      req.cellQuery = {
        subSection_names: mongoose.Types.ObjectId(req.params?.id),
      };
      return next();
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
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

        selectedSubSection: req.params?.id,

        selectedCell: req.cellID,
        cells: req.cells,
        selectedLine: "",
        lines: req.lines,
        selectedMachine: "",
        machines: [],
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/getFiltrationValue/cell-level-filtration/cellBased/:id",
  authenticate,
  async (req, res, next) => {
    try {
      req.cellID = mongoose.Types.ObjectId(req.params?.id);

      next();
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  },
  lineFiltrationMiddleware,
  async (req, res, next) => {
    try {
      return res.status(201).json({
        message: "Line dropdown value get successfully",

        selectedValue: req.params?.id,
        flagForTogglingFilter: "based-on-cell",

        selectedCell: req.params?.id,

        selectedLine: "",
        lines: req.lines,
        selectedMachine: "",
        machines: [],
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

//default Cell - Line - Machine selection
router.get(
  "/getFiltrationValue/machine-level-filtration/byDefault",
  authenticate,
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
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  },
  subSectionFiltrationMiddleware,
  cellFilterMiddleware,
  lineFiltrationMiddleware,
  machineFiltrationMiddleware,
  async (req, res, next) => {
    try {
      if (req.rootUser?.tm_grade === "HOD") {
        if (req.section.dashboardLevel === "No") {
          return res.status(201).json({
            message: "Data get successfully",

            flagForTogglingFilter: "based-on-machine",
            selectedValue: req.machineID,

            selectedSection: req.section?._id,
            sections: req.sections,
            selectedSubSection: req.subSection?._id,
            subSections: req.subSections,
            selectedCell: req.cellID,
            cells: req.cells,
            selectedLine: req.lineID,
            lines: req.lines,
            selectedMachine: req.machineID,
            machines: req.machines,
          });
        }

        return res.status(201).json({
          message: "Data get successfully",

          flagForTogglingFilter: "based-on-machine",
          selectedValue: req.machineID,

          selectedSection: req.section?._id,
          sections: req.sections,
          selectedSubSection: "",
          subSections: [],
          selectedCell: req.cellID,
          cells: req.cells,
          selectedLine: req.lineID,
          lines: req.lines,
          selectedMachine: req.machineID,
          machines: req.machines,
        });
      }

      if (req.section.dashboardLevel === "No") {
        return res.status(201).json({
          message: "Data get successfully",

          flagForTogglingFilter: "based-on-machine",
          selectedValue: req.machineID,

          selectedSection: "",
          sections: [],
          selectedSubSection: req.subSection?._id,
          subSections: req.subSections,
          selectedCell: req.cellID,
          cells: req.cells,
          selectedLine: req.lineID,
          lines: req.lines,
          selectedMachine: req.machineID,
          machines: req.machines,
        });
      }

      return res.status(201).json({
        message: "Data get successfully",

        flagForTogglingFilter: "based-on-machine",
        selectedValue: req.machineID,

        selectedSection: "",
        sections: [],
        selectedSubSection: "",
        subSections: [],
        selectedCell: req.cellID,
        cells: req.cells,
        selectedLine: req.lineID,
        lines: req.lines,
        selectedMachine: req.machineID,
        machines: req.machines,
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/getFiltrationValue/machine-level-filtration/sectionBased/:id",
  authenticate,
  sectionQueryMiddlewareForParamsId,
  sectionFiltrationMiddleware,
  subSectionQueryMiddleware,
  subSectionFiltrationMiddleware,
  cellFilterMiddleware,
  lineFiltrationMiddleware,
  machineFiltrationMiddleware,
  async (req, res, next) => {
    try {
      if (req.section.dashboardLevel === "No") {
        return res.status(201).json({
          message: "Data get successfully",

          flagForTogglingFilter: "based-on-machine",
          selectedValue: req.machineID,

          selectedSection: req.section?._id,

          selectedSubSection: req.subSection?._id,
          subSections: req.subSections,
          selectedCell: req.cellID,
          cells: req.cells,
          selectedLine: req.lineID,
          lines: req.lines,
          selectedMachine: req.machineID,
          machines: req.machines,
        });
      }

      return res.status(201).json({
        message: "Data get successfully",

        flagForTogglingFilter: "based-on-machine",
        selectedValue: req.machineID,

        selectedSection: req.section?._id,

        selectedSubSection: "",
        subSections: [],
        selectedCell: req.cellID,
        cells: req.cells,
        selectedLine: req.lineID,
        lines: req.lines,
        selectedMachine: req.machineID,
        machines: req.machines,
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/getFiltrationValue/machine-level-filtration/subSectionBased/:id",
  authenticate,
  async (req, res, next) => {
    try {
      req.cellQuery = {
        subSection_names: mongoose.Types.ObjectId(req.params?.id),
      };
      return next();
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  },
  cellFilterMiddleware,
  lineFiltrationMiddleware,
  machineFiltrationMiddleware,
  async (req, res, next) => {
    try {
      return res.status(201).json({
        message: "Data get successfully",

        flagForTogglingFilter: "based-on-machine",
        selectedValue: req.machineID,

        selectedSubSection: req.params?.id,

        selectedCell: req.cellID,
        cells: req.cells,
        selectedLine: req.lineID,
        lines: req.lines,
        selectedMachine: req.machineID,
        machines: req.machines,
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/getFiltrationValue/machine-level-filtration/cellBased/:id",
  authenticate,
  async (req, res, next) => {
    try {
      req.cellID = mongoose.Types.ObjectId(req.params?.id);

      next();
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  },
  lineFiltrationMiddleware,
  machineFiltrationMiddleware,
  async (req, res, next) => {
    try {
      return res.status(201).json({
        message: "Line dropdown value get successfully",

        flagForTogglingFilter: "based-on-machine",
        selectedValue: req.machineID,

        selectedCell: req.params?.id,

        selectedLine: req.lineID,
        lines: req.lines,
        selectedMachine: req.machineID,
        machines: req.machines,
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/getFiltrationValue/machine-level-filtration/lineBased/:id",
  authenticate,
  async (req, res, next) => {
    try {
      req.lineID = mongoose.Types.ObjectId(req.params?.id);

      next();
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  },
  machineFiltrationMiddleware,
  async (req, res, next) => {
    try {
      return res.status(201).json({
        message: "Machine dropdown value get successfully",

        flagForTogglingFilter: "based-on-machine",
        selectedValue: req?.machineID,

        selectedLine: req.params?.id,

        selectedMachine: req?.machineID,
        machines: req?.machines,
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

// -------------------------------------------------------------------------------
//        Filter API based For KPI from database report
// -------------------------------------------------------------------------------

router.get(
  "/getFiltrationValue/plant-level-filtration/byDefault",
  authenticate,
  async (req, res, next) => {
    try {
      const plant = await Plant.findOne({
        plant_id: req?.rootUser?.plant_data?.split("-")?.[0],
      });

      const sections = await Section.find({
        plant_names: plant?._id,
      });

      return res.status(201).json({
        message: "Sections get successfully",

        flagForTogglingFilter: "based-on-plant",
        selectedValue: plant?._id,

        selectedSection: "",
        sections,
        selectedSubSection: "",
        subSections: [],
        selectedCell: "",
        cells: [],
        selectedLine: "",
        lines: [],
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/getFiltrationValue/plant-level-filtration/sectionBased/:id",
  authenticate,
  sectionQueryMiddlewareForParamsId,
  sectionFiltrationMiddleware,
  subSectionQueryMiddleware,
  subSectionFiltrationMiddleware,
  async (req, res, next) => {
    try {
      const cells = await Cell.find(req.cellQuery);

      if (req.section.dashboardLevel === "No") {
        return res.status(201).json({
          message: "SubSections get successfully",

          flagForTogglingFilter: "based-on-subSection",
          selectedValue: req.subSection?._id,

          selectedSection: req.section?._id,

          selectedSubSection: req.subSection?._id,
          subSections: req.subSections,
          selectedCell: "",
          cells,
          selectedLine: "",
          lines: [],
          selectedMachine: "",
          machines: [],
        });
      }

      return res.status(201).json({
        message: "Cell dropdown value get successfully",

        flagForTogglingFilter: "based-on-section",
        selectedValue: req.section?._id,

        selectedSection: req.section?._id,

        selectedSubSection: "",
        subSections: [],
        selectedCell: "",
        cells,
        selectedLine: "",
        lines: [],
        selectedMachine: "",
        machines: [],
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/getFiltrationValue/plant-level-filtration/subSectionBased/:id",
  authenticate,
  functionForFindingCellBasedOnSelectedSubSection
);

router.get(
  "/getFiltrationValue/plant-level-filtration/cellBased/:id",
  authenticate,
  functionForFindingLineBasedOnSelectedCell
);

router.get(
  "/getFiltrationValue/monthly-breakdown-filter/byDefault",
  authenticate,
  async (req, res, next) => {
    try {
      const plant = await Plant.findOne({
        plant_id: req?.rootUser?.plant_data?.split("-")?.[0],
      });

      return res.status(201).json({
        message: "Plant get successfully",

        flagForTogglingFilter: "based-on-plant",
        selectedValue: plant?._id,

        selectedSection: "",
        sections: [],
        selectedSubSection: "",
        subSections: [],
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/getFiltrationValue/monthly-breakdown-filter/plant-section-toggle",
  authenticate,
  plantFiltrationMiddleware,
  conditionMiddlewareForSectionQuery,
  sectionFiltrationMiddleware,
  conditionMiddlewareForSubSectionQuery,
  async (req, res, next) => {
    try {
      const subSections = await SubSection.find(req.subSectionQuery);

      let selectedSubSection = subSections?.[0]?._id;

      if (req.rootUser?.tm_grade === "HOD") {
        if (req.section.dashboardLevel === "No") {
          return res.status(201).json({
            message: "SubSections get successfully",

            flagForTogglingFilter: "based-on-subSection",
            selectedValue: selectedSubSection,

            selectedSection: req.section?._id,
            sections: req.sections,
            selectedSubSection,
            subSections,
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
          });
        }
      }

      if (req.section.dashboardLevel === "No") {
        return res.status(201).json({
          message: "SubSections get successfully",

          flagForTogglingFilter: "based-on-subSection",
          selectedValue: selectedSubSection,

          selectedSection: "",
          sections: [],
          selectedSubSection,
          subSections,
        });
      }

      return res.status(201).json({
        message: "Cell dropdown value get successfully",

        flagForTogglingFilter: "based-on-section",
        selectedValue: req.section?._id,

        selectedSection: req.section?._id,
        sections: [],
        selectedSubSection: "",
        subSections: [],
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/getFiltrationValue/monthly-breakdown-filter/sectionBased/:id",
  authenticate,
  async (req, res, next) => {
    try {
      const subSections = await SubSection.find({
        section_names: mongoose.Types.ObjectId(req.params?.id),
      });

      let selectedSubSection = subSections?.[0]?._id;

      return res.status(201).json({
        message: "SubSections get successfully",

        flagForTogglingFilter: "based-on-subSection",
        selectedValue: selectedSubSection,
        selectedSection: req.params?.id,

        selectedSubSection,
        subSections,
        selectedCell: "",
        cells: [],
        selectedLine: "",
        lines: [],
        selectedMachine: "",
        machines: [],
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get("/dummyAPI", authenticate, async (req, res, next) => {
  try {
    // const updatePassword = await User.updateMany({

    //     $set: {
    //       password: "$2a$12$AzIjYPBD6mAgxnUPXkOYi.goO7bX/oj9CRXYOWAf28iL7BmW2hide"
    //     }

    // })
    // const machineFind = await Machine.aggregate([
    //   {
    //     $match: {},
    //   },
    //   {
    //     $lookup: {
    //       from: "lines",
    //       localField: "line_names",
    //       foreignField: "_id",
    //       pipeline: [
    //         {
    //           $lookup: {
    //             from: "cells",
    //             localField: "cell_names",
    //             foreignField: "_id",
    //             pipeline: [
    //               {
    //                 $lookup: {
    //                   from: "subsections",
    //                   localField: "subSection_names",
    //                   foreignField: "_id",
    //                   pipeline: [
    //                     {
    //                       $lookup: {
    //                         from: "sections",
    //                         localField: "section_names",
    //                         foreignField: "_id",
    //                         pipeline: [
    //                           {
    //                             $project: { plant_names: 1 },
    //                           },
    //                         ],
    //                         as: "section",
    //                       },
    //                     },
    //                     {
    //                       $project: {
    //                         section: 1,
    //                       },
    //                     },
    //                   ],
    //                   as: "subSection",
    //                 },
    //               },
    //               {
    //                 $project: {
    //                   subSection: 1,
    //                 },
    //               },
    //             ],
    //             as: "cell",
    //           },
    //         },
    //         {
    //           $project: {
    //             cell: 1,
    //           },
    //         },
    //       ],
    //       as: "line",
    //     },
    //   },
    //   {
    //     $project: {
    //       machine_code: 1,
    //       line: 1,
    //     },
    //   },
    //   // {
    //   //   $match: {
    //   //     "cell.0.subSection.0.section_names": mongoose.Types.ObjectId(
    //   //       req.params?.selectedId
    //   //     ),
    //   //   },
    //   // },
    // ]);

    // for (let i = 0; i < machineFind.length; i++) {
    //   await Machine.updateOne(
    //     {
    //       _id: machineFind[i]?._id,
    //     },
    //     {
    //       cell_names: machineFind[i]?.line?.[0]?.cell?.[0]?._id,
    //       subSection_names:
    //         machineFind[i]?.line?.[0]?.cell?.[0]?.subSection?.[0]?._id,
    //       section_names:
    //         machineFind[i]?.line?.[0]?.cell?.[0]?.subSection?.[0]?.section[0]
    //           ?._id,
    //       plant_names:
    //         machineFind[i]?.line?.[0]?.cell?.[0]?.subSection?.[0]?.section[0]
    //           ?.plant_names,
    //     }
    //   );

    //   // console.log("machine-updated : ", machineFind[i]?.machine_code);
    // }

    // const lineFind = await Line.aggregate([
    //   {
    //     $match: {},
    //   },
    //   {
    //     $lookup: {
    //       from: "cells",
    //       localField: "cell_names",
    //       foreignField: "_id",
    //       pipeline: [
    //         {
    //           $lookup: {
    //             from: "subsections",
    //             localField: "subSection_names",
    //             foreignField: "_id",
    //             pipeline: [
    //               {
    //                 $lookup: {
    //                   from: "sections",
    //                   localField: "section_names",
    //                   foreignField: "_id",
    //                   pipeline: [
    //                     {
    //                       $project: { plant_names: 1 },
    //                     },
    //                   ],
    //                   as: "section",
    //                 },
    //               },
    //               {
    //                 $project: {
    //                   section: 1,
    //                 },
    //               },
    //             ],
    //             as: "subSection",
    //           },
    //         },
    //         {
    //           $project: {
    //             subSection: 1,
    //           },
    //         },
    //       ],
    //       as: "cell",
    //     },
    //   },
    //   {
    //     $project: {
    //       line_name: 1,
    //       cell: 1,
    //     },
    //   },
    //   // {
    //   //   $match: {
    //   //     "cell.0.subSection.0.section_names": mongoose.Types.ObjectId(
    //   //       req.params?.selectedId
    //   //     ),
    //   //   },
    //   // },
    // ]);

    // for (let i = 0; i < lineFind.length; i++) {
    //   await Line.updateOne(
    //     {
    //       _id: lineFind[i]?._id,
    //     },
    //     {
    //       subSection_names: lineFind[i]?.cell?.[0]?.subSection?.[0]?._id,
    //       section_names:
    //         lineFind[i]?.cell?.[0]?.subSection?.[0]?.section[0]?._id,
    //       plant_names:
    //         lineFind[i]?.cell?.[0]?.subSection?.[0]?.section[0]?.plant_names,
    //     }
    //   );

    //   console.log("Line-updated : ", lineFind[i]?.line_name);
    // }

    // const cellFind = await Cell.aggregate([
    //   {
    //     $match: {},
    //   },
    //   {
    //     $lookup: {
    //       from: "subsections",
    //       localField: "subSection_names",
    //       foreignField: "_id",
    //       pipeline: [
    //         {
    //           $lookup: {
    //             from: "sections",
    //             localField: "section_names",
    //             foreignField: "_id",
    //             pipeline: [
    //               {
    //                 $project: { plant_names: 1 },
    //               },
    //             ],
    //             as: "section",
    //           },
    //         },
    //         {
    //           $project: {
    //             section: 1,
    //           },
    //         },
    //       ],
    //       as: "subSection",
    //     },
    //   },
    //   {
    //     $project: {
    //       cell_name: 1,
    //       subSection: 1,
    //     },
    //   },
    //   // {
    //   //   $match: {
    //   //     "cell.0.subSection.0.section_names": mongoose.Types.ObjectId(
    //   //       req.params?.selectedId
    //   //     ),
    //   //   },
    //   // },
    // ]);

    // for (let i = 0; i < cellFind.length; i++) {
    //   await Cell.updateOne(
    //     {
    //       _id: cellFind[i]?._id,
    //     },
    //     {
    //       section_names: cellFind[i]?.subSection?.[0]?.section[0]?._id,
    //       plant_names: cellFind[i]?.subSection?.[0]?.section[0]?.plant_names,
    //     }
    //   );

    //   console.log("Cell-updated : ", cellFind[i]?.cell_name);
    // }

    // ----------------------------------------------------------------------------------------------------------------------------

    const requestSheet = await RequestSheetOfBM.find({});

    for (let i = 0; i < requestSheet.length; i++) {
      const element = requestSheet[i];

      await RequestSheetOfBM.updateOne(
        {
          _id: element?._id,
        },
        {
          "preAggregationTimeStampOfRequestSheet.requestSheet_year":
            gettingFYYearForSelectedDate(
              element?.problemOccurredDateAndTimeOfBM
            ),
          "preAggregationTimeStampOfRequestSheet.requestSheet_month":
            gettingMonthForSelectedDate(
              element?.problemOccurredDateAndTimeOfBM
            ),
        }
      );

      console.log("machine-updated : ", i);
    }

    // const lineFind = await Line.aggregate([
    //   {
    //     $match: {},
    //   },
    //   {
    //     $lookup: {
    //       from: "cells",
    //       localField: "cell_names",
    //       foreignField: "_id",
    //       pipeline: [
    //         {
    //           $lookup: {
    //             from: "subsections",
    //             localField: "subSection_names",
    //             foreignField: "_id",
    //             pipeline: [
    //               {
    //                 $lookup: {
    //                   from: "sections",
    //                   localField: "section_names",
    //                   foreignField: "_id",
    //                   pipeline: [
    //                     {
    //                       $project: { plant_names: 1 },
    //                     },
    //                   ],
    //                   as: "section",
    //                 },
    //               },
    //               {
    //                 $project: {
    //                   section: 1,
    //                 },
    //               },
    //             ],
    //             as: "subSection",
    //           },
    //         },
    //         {
    //           $project: {
    //             subSection: 1,
    //           },
    //         },
    //       ],
    //       as: "cell",
    //     },
    //   },
    //   {
    //     $project: {
    //       line_name: 1,
    //       cell: 1,
    //     },
    //   },
    //   // {
    //   //   $match: {
    //   //     "cell.0.subSection.0.section_names": mongoose.Types.ObjectId(
    //   //       req.params?.selectedId
    //   //     ),
    //   //   },
    //   // },
    // ]);

    // for (let i = 0; i < lineFind.length; i++) {
    //   await Line.updateOne(
    //     {
    //       _id: lineFind[i]?._id,
    //     },
    //     {
    //       subSection_names: lineFind[i]?.cell?.[0]?.subSection?.[0]?._id,
    //       section_names:
    //         lineFind[i]?.cell?.[0]?.subSection?.[0]?.section[0]?._id,
    //       plant_names:
    //         lineFind[i]?.cell?.[0]?.subSection?.[0]?.section[0]?.plant_names,
    //     }
    //   );

    //   console.log("Line-updated : ", lineFind[i]?.line_name);
    // }

    // const cellFind = await Cell.aggregate([
    //   {
    //     $match: {},
    //   },
    //   {
    //     $lookup: {
    //       from: "subsections",
    //       localField: "subSection_names",
    //       foreignField: "_id",
    //       pipeline: [
    //         {
    //           $lookup: {
    //             from: "sections",
    //             localField: "section_names",
    //             foreignField: "_id",
    //             pipeline: [
    //               {
    //                 $project: { plant_names: 1 },
    //               },
    //             ],
    //             as: "section",
    //           },
    //         },
    //         {
    //           $project: {
    //             section: 1,
    //           },
    //         },
    //       ],
    //       as: "subSection",
    //     },
    //   },
    //   {
    //     $project: {
    //       cell_name: 1,
    //       subSection: 1,
    //     },
    //   },
    //   // {
    //   //   $match: {
    //   //     "cell.0.subSection.0.section_names": mongoose.Types.ObjectId(
    //   //       req.params?.selectedId
    //   //     ),
    //   //   },
    //   // },
    // ]);

    // for (let i = 0; i < cellFind.length; i++) {
    //   await Cell.updateOne(
    //     {
    //       _id: cellFind[i]?._id,
    //     },
    //     {
    //       section_names: cellFind[i]?.subSection?.[0]?.section[0]?._id,
    //       plant_names: cellFind[i]?.subSection?.[0]?.section[0]?.plant_names,
    //     }
    //   );

    //   console.log("Cell-updated : ", cellFind[i]?.cell_name);
    // }

    return res.status(201).json({
      message: "Success !!!!",
      // machineFind,
    });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
});

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
const filterMiddlewareForTargetData = async (req, res, next) => {
  try {
    let queryObj = {};
    let schemaName;
    if (req.params?.filter === "based-on-cell") {
      schemaName = Cell;
      queryObj = {
        _id: mongoose.Types.ObjectId(req.params?.selectedId),
      };
    } else if (req.params?.filter === "based-on-line") {
      schemaName = Line;
      queryObj = {
        _id: mongoose.Types.ObjectId(req.params?.selectedId),
      };
    }
    const allTargetData = await schemaName.aggregate([
      {
        $match: queryObj,
      },
      {
        $unwind: "$allTargetData",
      },
      {
        $match: {
          "allTargetData.current_year": req.query?.selectedYear,
        },
      },
    ]);
    if (allTargetData) {
      req.allTargetData = allTargetData;
    } else {
      res.status(404).json({ message: "Target data not found !!" });
    }
    next();
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
};

router.post(
  "/setTargetOfTheBDCharts/:filter/:selectedId",
  authenticate,
  async (req, res, next) => {
    try {
      const { targetValue } = req.body;

      if (req.params?.filter === "based-on-cell") {
        let sumOfMonthlyMBDtargetForYearlyTarget = Object.values(
          targetValue?.monthlyMBDCountTarget
        )?.reduce((acc, value) => acc + (value === "" ? 0 : value) * 1, 0);

        const yearExistsOrNotInCellTargetField = await Cell.findOne({
          _id: mongoose.Types.ObjectId(req?.params?.selectedId),
          "allTargetData.current_year": {
            $eq: req?.query?.selectedYear,
            $exists: true,
          },
        });

        if (yearExistsOrNotInCellTargetField) {
          const updateMonthlyMBDTargetValueInCell = await Cell.updateOne(
            {
              _id: mongoose.Types.ObjectId(req?.params?.selectedId),
              "allTargetData.current_year": {
                $eq: req?.query?.selectedYear,
                $exists: true,
              },
            },
            {
              $set: {
                "allTargetData.$[outer].monthlyMBDCountTarget":
                  targetValue?.monthlyMBDCountTarget,
                "allTargetData.$[outer].yearTotalMBDCountTarget":
                  sumOfMonthlyMBDtargetForYearlyTarget,
              },
            },
            {
              arrayFilters: [
                { "outer.current_year": req?.query?.selectedYear },
              ],
            }
          );

          if (updateMonthlyMBDTargetValueInCell) {
            return res.status(201).json({
              message: `MBD target updated successfully`,
              updateMonthlyMBDTargetValueInCell,
            });
          }
        } else {
          const addMonthlyMBDTargetValueInCell = await Cell.updateOne(
            {
              _id: mongoose.Types.ObjectId(req?.params?.selectedId),
            },
            {
              $push: {
                allTargetData: {
                  current_year: req?.query?.selectedYear,
                  monthlyMBDCountTarget: targetValue?.monthlyMBDCountTarget,
                  yearTotalMBDCountTarget: sumOfMonthlyMBDtargetForYearlyTarget,
                },
              },
            }
          );

          if (addMonthlyMBDTargetValueInCell)
            return res.status(201).json({
              message: `MBD target set successfully`,
              addMonthlyMBDTargetValueInCell,
            });
        }
      } else {
        let sumOfMonthlyProductionHrsTargetForYearlyTarget = Object.values(
          targetValue?.monthlyProductionHrs
        )?.reduce((acc, value) => acc + (value === "" ? 0 : value) * 1, 0);

        let sumOfMonthlyBDHrsTargetForYearlyTarget = Object.values(
          targetValue?.monthlyBDHrsTarget
        )?.reduce((acc, value) => acc + (value === "" ? 0 : value) * 1, 0);

        let sumOfMonthlyMTTRTargetForYearlyTarget = Object.values(
          targetValue?.monthlyMTTRTarget
        )?.reduce((acc, value) => acc + (value === "" ? 0 : value) * 1, 0);

        let sumOfMonthlyMTBFTargetForYearlyTarget = Object.values(
          targetValue?.monthlyMTBFTarget
        )?.reduce((acc, value) => acc + (value === "" ? 0 : value) * 1, 0);

        let sumOfMonthlyBDPercentageTargetForYearlyTarget = Object.values(
          targetValue?.monthlyBDPercentageTarget
        )?.reduce((acc, value) => acc + (value === "" ? 0 : value) * 1, 0);

        const yearExistsOrNotInLineTargetField = await Line.findOne({
          _id: mongoose.Types.ObjectId(req?.params?.selectedId),
          "allTargetData.current_year": {
            $eq: req?.query?.selectedYear,
            $exists: true,
          },
        });

        if (yearExistsOrNotInLineTargetField) {
          const updateMonthlyProductionAndBDHrsTargetValueInLine =
            await Line.updateOne(
              {
                _id: mongoose.Types.ObjectId(req?.params?.selectedId),
                "allTargetData.current_year": {
                  $eq: req?.query?.selectedYear,
                  $exists: true,
                },
              },
              {
                $set: {
                  "allTargetData.$[outer].monthlyProductionHrs":
                    targetValue?.monthlyProductionHrs,
                  "allTargetData.$[outer].monthlyBDHrsTarget":
                    targetValue?.monthlyBDHrsTarget,
                  "allTargetData.$[outer].monthlyMTTRTarget":
                    targetValue?.monthlyMTTRTarget,
                  "allTargetData.$[outer].monthlyMTBFTarget":
                    targetValue?.monthlyMTBFTarget,
                  "allTargetData.$[outer].monthlyBDPercentageTarget":
                    targetValue?.monthlyBDPercentageTarget,
                  "allTargetData.$[outer].yearTotalProductionHrs":
                    sumOfMonthlyProductionHrsTargetForYearlyTarget,
                  "allTargetData.$[outer].yearTotalBDHrsTarget":
                    sumOfMonthlyBDHrsTargetForYearlyTarget,
                  "allTargetData.$[outer].yearTotalMTTRTarget":
                    sumOfMonthlyMTTRTargetForYearlyTarget,
                  "allTargetData.$[outer].yearTotalMTBFTarget":
                    sumOfMonthlyMTBFTargetForYearlyTarget,
                  "allTargetData.$[outer].yearTotalBDPercentageTarget":
                    sumOfMonthlyBDPercentageTargetForYearlyTarget,
                },
              },
              {
                arrayFilters: [
                  { "outer.current_year": req?.query?.selectedYear },
                ],
              }
            );

          if (updateMonthlyProductionAndBDHrsTargetValueInLine) {
            return res.status(201).json({
              message: `Production and BD Hrs target updated successfully`,
              updateMonthlyProductionAndBDHrsTargetValueInLine,
            });
          }
        } else {
          const addMonthlyProductionAndBDHrsTargetValueInLine =
            await Line.updateOne(
              {
                _id: mongoose.Types.ObjectId(req?.params?.selectedId),
              },
              {
                $push: {
                  allTargetData: {
                    current_year: req?.query?.selectedYear,
                    monthlyProductionHrs: targetValue?.monthlyProductionHrs,
                    yearTotalProductionHrs:
                      sumOfMonthlyProductionHrsTargetForYearlyTarget,
                    monthlyBDHrsTarget: targetValue?.monthlyBDHrsTarget,
                    yearTotalBDHrsTarget:
                      sumOfMonthlyBDHrsTargetForYearlyTarget,
                    monthlyMTTRTarget: targetValue?.monthlyMTTRTarget,
                    yearTotalMTTRTarget: sumOfMonthlyMTTRTargetForYearlyTarget,
                    monthlyMTBFTarget: targetValue?.monthlyMTBFTarget,
                    yearTotalMTBFTarget: sumOfMonthlyMTBFTargetForYearlyTarget,
                    monthlyBDPercentageTarget:
                      targetValue?.monthlyBDPercentageTarget,
                    yearTotalBDPercentageTarget:
                      sumOfMonthlyBDPercentageTargetForYearlyTarget,
                  },
                },
              }
            );

          if (addMonthlyProductionAndBDHrsTargetValueInLine)
            return res.status(201).json({
              message: `Production and BD Hrs target set successfully`,
              addMonthlyProductionAndBDHrsTargetValueInLine,
            });
        }
      }
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      console.log(error);
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/getTargetDetails/:filter/:selectedId",
  authenticate,
  filterMiddlewareForTargetData,
  async (req, res, next) => {
    try {
      return res.status(201).json({
        message: "Target data get successfully",
        targetData: req?.allTargetData?.[0],
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

const storageForDataAttachmentFile = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, `./attachments/${req.params?.docVariable}`);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

// const filterOptions = (req, file, cb) => {
//   if (!file.originalname.match(/\.(xls|xlsx|csv)$/)) {
//     return cb(new Error("Only .xls, .xlsx, .csv format allowed!"));
//   } else {
//     cb(null, true);
//   }
// };

const uploadAttachments = multer({
  storage: storageForDataAttachmentFile,
  // limits: {
  //   fileSize: 1024 * 1024 * 1024,
  // },
  // fileFilter: filterOptions,
});

router.post(
  "/addNewAttachment/:docVariable",
  authenticate,
  uploadAttachments.array("attached_files"),
  async (req, res, next) => {
    try {
      const attachmentDetails = await Machine.findOneAndUpdate(
        req.query,
        {
          $push: {
            [req.params?.docVariable]: req.files?.map((item) => ({
              attached_file: item?.filename,
            })),
          },
        },
        {
          new: true,
        }
      );

      return res.status(201).json({
        message: "Attachment added successfully",
        attachmentDetails: attachmentDetails?.[req.params?.docVariable],
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res
        .status(500)
        .json({ message: error?.message, error: new Error(error) });
    }
  }
);

router.get(
  "/getAttachmentDetails/:docVariable",
  authenticate,
  async (req, res, next) => {
    try {
      const machine = await Machine.findOne(req.query, {
        [req.params?.docVariable]: 1,
      });

      return res.status(201).json({
        message: "Attachment details get successfully!",
        attachmentDetails: machine?.[req.params?.docVariable],
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res
        .status(500)
        .json({ message: error?.message, error: new Error(error) });
    }
  }
);

router.get(
  "/downloadAttachment/:folderName/:filePath",
  authenticate,
  async (req, res) => {
    try {
      res
        .status(201)
        .download(
          path.join(
            __dirname,
            `../attachments/${req.params?.folderName}/${req.params?.filePath}`
          )
        );
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res
        .status(500)
        .json({ message: error?.message, error: new Error(error) });
    }
  }
);

router.delete(
  "/deleteAttachment/:docVariable/:id",
  authenticate,
  async (req, res, next) => {
    try {
      let keyForMatchingDoc = `${req.params?.docVariable}._id`;

      const machine = await Machine.aggregate([
        {
          $match: req.query,
        },
        {
          $unwind: `$${req.params?.docVariable}`,
        },
        {
          $match: {
            [keyForMatchingDoc]: mongoose.Types.ObjectId(req.params?.id),
          },
        },
      ]);

      fs.unlink(
        path.join(
          __dirname,
          `../attachments/${req.params?.docVariable}/${
            machine?.[0]?.[req.params?.docVariable]?.attached_file
          }`
        ),

        function (err) {
          if (err) {
            console.error(err);
          }
        }
      );

      const attachmentDetails = await Machine.findOneAndUpdate(
        req.query,
        {
          $pull: {
            [req.params?.docVariable]: {
              _id: mongoose.Types.ObjectId(req.params?.id),
            },
          },
        },
        {
          new: true,
        }
      );

      return res.status(201).json({
        message: "Attachment deleted successfully",
        attachmentDetails: attachmentDetails?.[req.params?.docVariable],
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res
        .status(500)
        .json({ message: error?.message, error: new Error(error) });
    }
  }
);

router.get(
  "/getRequestSheetHistoryBasedOnMachine",
  authenticate,
  async (req, res, next) => {
    try {
      let queryObj = {
        machineRef: mongoose.Types.ObjectId(req.query?.machineId),
      };

      if (req.query?.selectedYear) {
        queryObj = {
          ...queryObj,
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

      req.queryObj = queryObj;

      next();
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  },
  requestSheetMiddleware
);

router.get("/getMachineHistory", authenticate, async (req, res, next) => {
  try {
    pmHistory = await LogHistory.aggregate([
      {
        $match: req.query,
      },
      {
        $addFields: {
          cell_name: "$cellInfo.cell_name",
          line_name: "$lineInfo.line_name",
          machine_name: "$machineInfo.machine_name",
          machine_Id: "$machineInfo.machine_Id",
          abnormality: {
            $cond: [{ $gt: ["$abnormality_remarks", null] }, "Yes", "No"],
          },
        },
      },
    ]);

    return res.status(201).json({
      message: "PmHistory get successfully",
      pmHistory,
    });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
});

router.get(
  "/getBreakdownTrendData",
  authenticate,
  async (req, res, next) => {
    try {
      let queryObj = {
        machineRef: mongoose.Types.ObjectId(req.query?.machineId),
        "preAggregationTimeStampOfRequestSheet.requestSheet_year":
          req.query?.selectedYear,
        "maintenanceReportFilledByMTD.breakDownTime": {
          $gt: 0,
        },
        maintenanceType: "BM",
      };
      req.queryObj = queryObj;
      next();
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  },
  yearlyBdHourMiddleware,
  async (req, res, next) => {
    try {
      const lastFiveProblem = await RequestSheetOfBM.aggregate([
        {
          $match: req.queryObj,
        },
        {
          $sort: {
            _id: -1,
          },
        },
        {
          $project: {
            problem: "$breakDownBasicDataFilledByPRD.problemFaced",
          },
        },
        {
          $limit: 5,
        },
      ]);

      return res.status(201).json({
        message: "Breakdown trend graph data get successfully",
        BdTrendAndLastFiveProblem: {
          breakdownTrendData: req.BDHours?.[0],
          lastFiveProblem,
        },
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.post(
  "/postNewNoLossBDData",
  authenticate,
  uploadDataSheetsOfBD.fields([
    { name: "attachedFilesForOtherLoss", maxCount: 10 },
  ]),
  async (req, res, next) => {
    try {
      const noLossRequestSheetData = JSON.parse(req.body.otherData);
      const dataSheet = req.files;
      // const {
      //   noLossData,
      //   problemsOfBM,
      //   actionAndCounterMeasureStep,
      //   selectedSupportedTM,
      //   breakDownTime,
      //   selectedSection,
      //   selectedSubSection,
      //   selectedCell,
      //   selectedLine,
      //   selectedMachine,
      // } = req.body;

      const noLossBDSheetExistsOrNot = await NoLossBD.findOne({
        _id: noLossRequestSheetData?._id,
      });

      let resultOfSaveOrUpdateNoLossBD;

      let convertedData =
        noLossRequestSheetData?.categories &&
        Object.keys(noLossRequestSheetData?.categories)?.map((key) => ({
          category: key,
          subCategory: noLossRequestSheetData?.categories?.[key],
        }));

      if (noLossBDSheetExistsOrNot) {
        if (dataSheet?.attachedFilesForOtherLoss?.length > 0) {
          noLossBDSheetExistsOrNot?.attachedFilesForOtherLoss?.map(
            (noLossFileName) => {
              fs.unlink(
                path.join(__dirname, `../OtherLossFiles/${noLossFileName}`),
                function (err) {
                  if (err) {
                    console.error(err);
                  } else {
                    console.log("Other loss files Removed Successfully");
                  }
                }
              );
            }
          );
        }

        resultOfSaveOrUpdateNoLossBD = await NoLossBD.findOneAndUpdate(
          {
            _id: noLossRequestSheetData?._id,
          },
          {
            $set: {
              ...noLossRequestSheetData,
              problemsOfBM: noLossRequestSheetData?.problemsOfBM,
              actionAndCounterMeasureStep:
                noLossRequestSheetData?.actionAndCounterMeasureStep,
              supportingTM: noLossRequestSheetData?.selectedSupportedTM?.map(
                (obj) => obj?._id
              ),
              breakDownTime: noLossRequestSheetData?.breakDownTime,
              categoriesOfRequestSheet: convertedData,
              attachedFilesForOtherLoss:
                dataSheet?.attachedFilesForOtherLoss?.map(
                  (obj) => obj?.filename
                ),
            },
          },
          {
            new: true,
          }
        );
      } else {
        const currentMonth = moment().format("MMM");
        const currentYear = moment().tz(timezone).year();

        const getPlantIdForNoLossBDEntry = await Plant.findOne({
          plant_id: req?.rootUser?.plant_data?.split("-")?.[0],
        });

        const addNewNoLossNo = await HandlingActions.findOneAndUpdate(
          { plant_id: getPlantIdForNoLossBDEntry._id },
          { $inc: { noLossBdNos: 1 } },
          {
            new: true,
          }
        );

        const noLossBDNo = `${currentYear}-${currentMonth}-${addNewNoLossNo.noLossBdNos}`;
        const addNewNoLossBD = new NoLossBD({
          ...noLossRequestSheetData,
          noLossBDNo,
          problemsOfBM: noLossRequestSheetData?.problemsOfBM,
          actionAndCounterMeasureStep:
            noLossRequestSheetData?.actionAndCounterMeasureStep,
          supportingTM: noLossRequestSheetData?.selectedSupportedTM?.map(
            (obj) => obj?._id
          ),
          breakDownTime: noLossRequestSheetData?.breakDownTime,
          categoriesOfRequestSheet: convertedData,
          attachedFilesForOtherLoss: dataSheet?.attachedFilesForOtherLoss?.map(
            (obj) => obj?.filename
          ),
          plantRef: getPlantIdForNoLossBDEntry?._id || null,
          sectionRef: noLossRequestSheetData?.selectedSection || null,
          subSectionRef: noLossRequestSheetData?.selectedSubSection || null,
          cellRef: noLossRequestSheetData?.selectedCell || null,
          lineRef: noLossRequestSheetData?.selectedLine || null,
          machineRef: noLossRequestSheetData?.selectedMachine || null,
          preAggregationTimeStampOfRequestSheet: {
            requestSheet_year: gettingFYYearForSelectedDate(
              noLossRequestSheetData?.DateOfNoLossBD
            ),
            requestSheet_month: gettingMonthForSelectedDate(
              noLossRequestSheetData?.DateOfNoLossBD
            ),
          },
        });

        resultOfSaveOrUpdateNoLossBD = await addNewNoLossBD.save();
      }
      if (resultOfSaveOrUpdateNoLossBD) {
        res.status(201).json({
          message: "No Loss data added successfully",
          resultOfSaveOrUpdateNoLossBD,
        });
      }
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      console.log(error);
      res
        .status(500)
        .json({ message: error?.message, error: new Error(error) });
    }
  }
);

router.get("/getNoLossBDEntryData", authenticate, async (req, res, next) => {
  try {
    const noLossBDRequestSheetData = await NoLossBD.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId(req?.query?._id),
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
          as: "machine",
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
          as: "line",
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
          as: "cell",
        },
      },
      {
        $lookup: {
          from: "subsections",
          localField: "subSectionRef",
          foreignField: "_id",
          as: "subSection",
        },
      },
      {
        $lookup: {
          from: "sections",
          localField: "sectionRef",
          foreignField: "_id",
          pipeline: [
            {
              $lookup: {
                from: "plants",
                localField: "plant_names",
                foreignField: "_id",
                as: "plant",
              },
            },
          ],
          as: "section",
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
          noLossBDNo: 1,
          maintenanceType: 1,
          problemsOfBM: 1,
          shiftOfBM: 1,
          workStartedDateOfBM: generateDateFormateObj("$workStartedDateOfBM"),
          workEndedDateOfBM: generateDateFormateObj("$workEndedDateOfBM"),
          breakDownTime: 1,
          causeOfNoLoss: 1,
          counterMeasureStep: 1,
          actionAndCounterMeasureStep: 1,
          categoriesOfRequestSheet: 1,
          doneByNoLossBD: 1,
          supportingTM: 1,
          machineStatus: 1,
          actionTemporaryOrNot: 1,
          machine: 1,
          line: 1,
          cell: 1,
          subSection: 1,
          section: 1,
          attachedFilesForOtherLoss: 1,
        },
      },
    ]);

    return res.status(201).json({
      message: "No loss break-down data get successfully",
      noLossBDRequestSheetData: noLossBDRequestSheetData?.[0],
    });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
});

router.delete("/deleteNoLossRequestSheet/", async (req, res, next) => {
  try {
    const deletedNoLossRequestSheet = await NoLossBD.findByIdAndDelete(
      req?.query?._id
    );

    return res.status(201).json({
      message: "No Loss RequestSheet Deleted successfully",
      deletedNoLossRequestSheet,
    });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[1] });
    res.status(500).json({ message: error?.message, error });
  }
});

router.post(
  "/sendSparePartsRequestMail",
  authenticate,
  async (req, res, next) => {
    try {
      const sparePartsDataMapping = (item, index) => {
        return `<tr>
                <td style="border: 1px solid black;text-align: left;padding: 8px;">${
                  index + 1
                }</td>
                <td style="border: 1px solid black;text-align: left;padding: 8px;">${
                  item?.partNo
                }</td>
                <td style="border: 1px solid black;text-align: left;padding: 8px;">${
                  item?.partName
                }</td>
                <td style="border: 1px solid black;text-align: left;padding: 8px;">${
                  item?.makerName
                }</td>
                <td style="border: 1px solid black;text-align: left;padding: 8px;">${
                  item?.quantity
                }</td>
                <td style="border: 1px solid black;text-align: left;padding: 8px;">${
                  item?.cost
                }</td>
                
            </tr>`;
      };

      let sparePartsListTable = `<table style="font-family: arial, sans-serif;border-collapse: collapse;width: 100%;">
                        <tr style="background-color: #dddddd;">
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>SR. NO.</b></td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>PART NO.</b></td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>PART NAME</b></td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>MAKER</b></td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>QUANTITY</b></td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;"><b>Cost</b></td>
                        </tr>
                        
                        ${await req?.body?.data?.parts
                          ?.map((item, index) =>
                            sparePartsDataMapping(item, index)
                          )
                          ?.join("")}
                        </table>`;

      const bodyContent = () => {
        return `<table style="font-family: arial, sans-serif;border-collapse: collapse;width: 100%;">

  
        <tr style="background-color: #dddddd;">
        <td style="border: 1px solid black;text-align: left;padding: 8px;">Line</td>
        <td style="border: 1px solid black;text-align: left;padding: 8px;">${
          req.body?.data?.line_name
        }</td>
        </tr>
  
        <tr>
            <td style="border: 1px solid black;text-align: left;padding: 8px;">Machine</td>
            <td style="border: 1px solid black;text-align: left;padding: 8px;">${
              req.body?.data?.machine_name
            }</td>
        </tr>
  
        <tr style="background-color: #dddddd;">
            <td style="border: 1px solid black;text-align: left;padding: 8px;">Machine No.</td>
            <td style="border: 1px solid black;text-align: left;padding: 8px;">${
              req.body?.data?.machine_code
            }</td>
        </tr>
  
        <tr>
        <td style="border: 1px solid black;text-align: left;padding: 8px;">Request Send By</td>
        <td style="border: 1px solid black;text-align: left;padding: 8px;">${
          req?.rootUser?.tm_name
        }</td>
        </tr>   

        <tr style="background-color: #dddddd;">
            <td style="border: 1px solid black;text-align: left;padding: 8px;">Machine No.</td>
            <td style="border: 1px solid black;text-align: left;padding: 8px;">${
              req?.rootUser?.user_type
            }</td>
        </tr>
  
        <tr>
        <td style="border: 1px solid black;text-align: left;padding: 8px;">Requested Date and Time</td>
        <td style="border: 1px solid black;text-align: left;padding: 8px;">${moment(
          new Date()
        )
          .tz("Asia/Kolkata")
          .format("DD-MM-YYYY THH:mm")}</td>
        </tr>

        <b><p>Requested Spare List Below In Table:</p></b>

        ${sparePartsListTable}
  
    </table>`;
      };

      let bodyTable = bodyContent();

      sendMailForSpareRequest({
        subject: `Request for Spare Parts (${req.body?.data?.line_name}/${req.body?.data?.machine_code}/${req.body?.data?.machine_name})`,
        title: `Request for Spare Parts`,
        greetings: `Sir\\Ma'am`,
        // toEmailIds: [
        //   req.requestSheetData?.[0]?.assignUserEmail,
        //   req.requestSheetData?.[0]?.requestSheetCreatedByForSendingEmail
        //     ?.email,
        // ],
        // ccEmailIds: getMTDTL
        //   ?.map((obj) => obj?.email)
        //   .concat(getMTDHOS?.map((obj) => obj?.email)),
        bodyTable: bodyTable,
        sparePartsListTable,
      });

      res.status(201).json({
        message: "Email sent successfully",
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

// safety form CRUD Operations

router.post(
  "/addSafetyForm/:requestSheetRef",
  authenticate,
  async (req, res) => {
    try {
      const safetyForm = await SafetyForm.create({
        requestSheetRef: req.params?.requestSheetRef,
        safetyFormFilledUpBy: req?.rootUser?.tm_name,
        ...req.body,
      });
      const reqSheetBM = await RequestSheetOfBM.findOneAndUpdate(
        { _id: req.params?.requestSheetRef },
        {
          $set: {
            IsSafetyFormCreated: true,
          },
        }
      );
      if (!safetyForm) {
        return res
          .status(400)
          .json({ message: "Error in creating safety form" });
      }
      res
        .status(201)
        .json({ message: "Safety form created successfully", safetyForm });
    } catch (error) {
      logger.error(error);
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/getSafetyForm/:requestSheetRef",
  authenticate,
  async (req, res) => {
    try {
      const safetyForm = await SafetyForm.findOne({
        requestSheetRef: mongoose.Types.ObjectId(req?.params?.requestSheetRef),
      });
      if (!safetyForm) {
        return res.status(400).json({ message: "Not Found!!!" });
      }
      res.status(200).json({
        message: "Safety form fetched successfully",
        safetyForm,
      });
    } catch (error) {
      console.log(error);
    }
  }
);

module.exports = router;
