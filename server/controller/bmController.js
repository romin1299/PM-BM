const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const RequestSheetOfBM = require("../model/requestSheetDataOfBM");
const Machine = require("../model/machineSchema");
const User = require("../model/userSchema");
const Section = require("../model/sectionSchema");
const SubSection = require("../model/subSectionSchema");

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
  } = req.body;

  // console.log(req.body);

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
    if (Machine) {

    }
    const _idObject = {
      machineRef: machine?._id,
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
    // console.log("ddddd", requestNo);

    const requestSheet = new RequestSheetOfBM({
      // ...req.query,
      ..._idObject,
      requestSheetCreatedBy: req.rootUser?._id,
      // ...req.body,
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
        $lookup: {
          from: "machines",
          localField: "machineRef",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                machine_code: 1,
              },
            },
          ],
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
      // {
      //   $lookup: {
      //     from: "subsections",
      //     localField: "subSectionRef",
      //     foreignField: "_id",
      //     pipeline: [
      //       {
      //         $project: {
      //           subSection_name: 1,
      //         },
      //       },
      //     ],
      //     as: "subSections",
      //   },
      // },
      // {
      //   $lookup: {
      //     from: "sections",
      //     localField: "sectionRef",
      //     foreignField: "_id",
      //     pipeline: [
      //       {
      //         $project: {
      //           section_name: 1,
      //         },
      //       },
      //     ],
      //     as: "sections",
      //   },
      // },
      {
        $project: {
          requestSheetCreatedBy: 1,
          requestSheetNoOfBM: 1,
          cell: { $arrayElemAt: ["$cells.cell_name", 0] },
          line: { $arrayElemAt: ["$lines.line_name", 0] },
          machine: { $arrayElemAt: ["$machines.machine_code", 0] },
          problem: "$breakDownBasicDataFilledByPRD.problemFaced",
        },
      },
    ]);

    if (requestSheetData?.length === 0) {
      return res.status(400).json({
        message: "No data to display",
      });
    }

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
      counters: {
        ...counters?.[0],
        total_request_sheet_count: requestSheetData?.length,
      },
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
router.get("/getMachineDetailsOnScanningRequest/:generateType", async (req, res, next) => {

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

  // console.log("machine", machine);
  if (machine) {
    res.status(201).json({
      message: "Sheet data get successfully",
      machine,
    });
  } else {
    res.status(404).json({message :'Machine not found'});
  }
});

module.exports = router;
