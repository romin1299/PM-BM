const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const RequestSheetOfBM = require("../model/requestSheetDataOfBM");
const Machine = require("../model/machineSchema");
const User = require("../model/userSchema");
const Section = require("../model/sectionSchema");

const authenticate = require("../middleware/authenticate");
const cookieParser = require("cookie-parser");

router.use(cookieParser());
router.use(authenticate);

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

  console.log(req.body);

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

    const _idObject = {
      lineRef: machine?.line_names?._id,
      cellRef: machine?.line_names?.cell_names?._id,
      subSectionRef: machine?.line_names?.cell_names?.subSection_names?._id,
      sectionRef:
        machine?.line_names?.cell_names?.subSection_names?.section_names?._id,
      plantRef:
        machine?.line_names?.cell_names?.subSection_names?.section_names
          ?.plant_names?._id,
    };

    const combinedDateTimeString = `${requestSheetdate}T${requestSheettime}`;
    const requestSheetDateTime = new Date(combinedDateTimeString);
    const currentDateTime = new Date();

    // const requestNo = `${machine?.line_names?.cell_names?.subSection_names?.section_names?.section_name} - ${machine?.line_names?.line_name} - ${}`;

    const requestSheet = new RequestSheetOfBM({
      ...req.query,
      ..._idObject,
      requestSheetCreatedBy: req.rootUser?._id,
      ...req.body,
      priorityCode: priorityCode,
      qualityRelated: qualityRelated,
      shiftOfBM: shiftOfBM,
      breakDownAttendedBy: req.rootUser?._id,
      maintenanceType: maintenanceType || "BM",
      problemOccurredDateAndTimeOfBM: requestSheetDateTime,
      sheetIssuedDateAndTimeOfBM: currentDateTime,
      "breakDownBasicDataFilledByPRD.problemFaced": problemFaced,
      "breakDownBasicDataFilledByPRD.PRD_ObservationForProblem_5Why_1How":
        PRD_ObservationForProblem_5Why_1How,
      "breakDownBasicDataFilledByPRD.why_5M_1E": why_5M_1E,
      "breakDownBasicDataFilledByPRD.where_process": where_process,
      "breakDownBasicDataFilledByPRD.when_frequency": when_frequency,
      "breakDownBasicDataFilledByPRD.who_person": who_person,
      "breakDownBasicDataFilledByPRD.which_defectLocation":
        which_defectLocation,
      "breakDownBasicDataFilledByPRD.how_details": how_details,
    });

    await requestSheet.save();
    console.log(requestSheet);

    res
      .status(201)
      .json({ message: "Request-sheet generated successfully", requestSheet });
  } catch (error) {
    res.status(500).json({ message: error?.message, error });
  }
});

router.get("/getRequestSheetData", async (req, res, next) => {
  try {
    const requestSheetData = await RequestSheetOfBM.aggregate([
      {
        $match: {
          requestSheetCreatedBy: req.rootUser?._id,
        },
      },
      {
        $project: {
          requestSheetCreatedBy: 1,
          machineRef: 1,
          lineRef: 1,
          cellRef: 1,
          subSectionRef: 1,
          sectionRef: 1,
          plantRef: 1,
        },
      },
    ]);

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

    res.status(201).json({
      message: "Request-sheet data get successfully",
      requestSheetData,
      counters: counters?.[0],
    });
  } catch (error) {
    res.status(500).json({ message: error?.message, error });
  }
});

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

router.get("/getMachineDetailsOnScanningRequest", async (req, res, next) => {
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

  // console.log("machine", machine);

  res.status(201).json({
    message: "Sheet data get successfully",
    machine,
  });
});

module.exports = router;
