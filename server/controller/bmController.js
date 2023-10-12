const express = require("express");
const router = express.Router();

const RequestSheetOfBM = require("../model/requestSheetDataOfBM");
const Machine = require("../model/machineSchema");
const User = require("../model/userSchema");
const Section = require("../model/sectionSchema");

const authenticate = require("../middleware/authenticate");
const cookieParser = require("cookie-parser");

router.use(cookieParser());
router.use(authenticate);

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

    const requestSheet = new RequestSheetOfBM({
      ...req.body,
      ...req.query,
      ..._idObject,
      requestSheetCreatedBy: req.rootUser?._id,
    });

    await requestSheet.save();

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

module.exports = router;
