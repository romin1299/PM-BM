const mongoose = require("mongoose");
const moment = require("moment");
const tryCatchHandler = require("../../errorHandler/tryCatchHandler");
const getFY = require("../../utils/getFY");

const Cell = require("../../model/cellSchema");
const SpareBudget = require("../../model/spareBudgetSchema");

const {
  filterKeys,
  sumArrayField,
} = require("../../utils/spareManagementUtils");

const handleMapGeneration = (firstArr = "$plan", secondArr = "$BPDActual") => ({
  $map: {
    input: { $range: [0, 12] },
    as: "index",
    in: {
      $cond: [
        {
          $gte: [
            { $arrayElemAt: [firstArr, "$$index"] },
            { $arrayElemAt: [secondArr, "$$index"] },
          ],
        },
        "Ok",
        "NG",
      ],
    },
  },
});

exports.budgetFilterMiddleware = tryCatchHandler(async (req, res, next) => {
  let $match = {
    financialYear: getFY(),
  };

  if (req.query?.selectedYear)
    $match = {
      "financialYear.inString": req.query?.selectedYear,
    };

  if (req.query.selectedValue) {
    let matchingKey = filterKeys?.[req.query?.flagForTogglingFilter] || "cell";
    $match[`${matchingKey}._id`] = mongoose.Types.ObjectId(
      req.query.selectedValue,
    );
  } else $match["isSectionWise"] = false;

  req.$match = $match;
  return next();
});

exports.getFYBudget = tryCatchHandler(async (req, res, next) => {
  const statusFields = {
    monthlyStatus: handleMapGeneration(),
    cumulativeStatus: handleMapGeneration(
      "$cumulativePlan",
      "$cumulativeActual",
    ),
  };

  let pipeline = [
    {
      $project: {
        plan: 1,
        actual: 1,
        BPDActual: 1,
        cumulativePlan: 1,
        cumulativeActual: 1,
      },
    },
  ];

  if (
    req.query.selectedValue &&
    req.query.flagForTogglingFilter !== "based-on-cell"
  ) {
    const matchingKey = filterKeys?.[req.query?.flagForTogglingFilter];

    pipeline = [
      {
        $group: {
          _id: `$${matchingKey}._id`,
          planArr: { $push: "$plan" },
          actualArr: { $push: "$actual" },
          BPDActualArr: { $push: "$BPDActual" },
          cumulativePlanArr: { $push: "$cumulativePlan" },
          cumulativeActualArr: { $push: "$cumulativeActual" },
        },
      },
      {
        $project: {
          _id: 1,
          plan: sumArrayField("plan"),
          actual: sumArrayField("actual"),
          BPDActual: sumArrayField("BPDActual"),
          cumulativePlan: sumArrayField("cumulativePlan"),
          cumulativeActual: sumArrayField("cumulativeActual"),
        },
      },
      {
        $addFields: statusFields,
      },
    ];
  } else
    pipeline[0].$project = {
      ...pipeline[0].$project,
      ...statusFields,
      remarks: 1,
    };

  const budget = await SpareBudget.aggregate([
    {
      $match: req.$match,
    },
    ...pipeline,
  ]);

  if (!budget || budget?.length <= 0)
    return res.status(404).json({
      message: "No data to display",
    });

  return res.status(201).json({
    message: "Budget get successfully",
    budget: budget[0],
  });
});

exports.addFYBudget = tryCatchHandler(async (req, res, next) => {
  if (req.query.selectedValue && req.query.flagForTogglingFilter) {
    if (req.query.flagForTogglingFilter !== "based-on-cell")
      return res.status(400).json({
        message: "Please select cell",
        showToast: true,
      });

    const cell = await Cell.findOne(
      { _id: req.query.selectedValue },
      "cell_id cell_name subSection_names",
    ).populate({
      path: "subSection_names",
      select: "subSection_id subSection_name section_names",
      populate: {
        path: "section_names",
        select: "section_id section_name dashboardLevel",
      },
    });

    if (!cell)
      return res.status(400).json({
        message: "Cell does not exist",
        showToast: true,
      });
    else if (!cell?.subSection_names?._id)
      return res.status(400).json({
        message: "Sub section does not exist",
        showToast: true,
      });
    else if (!cell?.subSection_names?.section_names?._id)
      return res.status(400).json({
        message: "Section does not exist",
        showToast: true,
      });

    req.body["section"] = cell?.subSection_names?.section_names;
    req.body["subSection"] = cell?.subSection_names;
    req.body["cell"] = cell;

    req.body["isSectionWise"] = true;
  }
  req.body["financialYear"] = getFY();

  const budget = new SpareBudget(req.body);
  await budget.save();

  return res.status(201).json({
    message: "Budget added successfully",
    budget,
    showToast: true,
  });
});

exports.updateFYBudget = tryCatchHandler(async (req, res, next) => {
  delete req.body["actual"];
  delete req.body["cumulativeActual"];

  const budget = await SpareBudget.findOneAndUpdate(
    {
      _id: req.query?._id,
    },
    {
      $set: req.body,
    },
    {
      new: true,
    },
  );
  return res.status(201).json({
    message: "Budget updated successfully",
    budget,
    showToast: true,
  });
});

exports.getFYPlanVsActualBudget = tryCatchHandler(async (req, res, next) => {
  const currentRunningMonth = (moment().month() + 12 - 3) % 12;

  let pipeline = [];

  if (
    req.query.selectedValue &&
    req.query?.flagForTogglingFilter !== "based-on-cell"
  ) {
    const matchingKey = filterKeys?.[req.query?.flagForTogglingFilter];
    pipeline = [
      {
        $group: {
          _id: `$${matchingKey}._id`,
          plan: {
            $push: {
              $sum: "$plan",
            },
          },
          actual: {
            $push: {
              $sum: "$actual",
            },
          },
        },
      },
    ];
  }

  const plantVsActual = await SpareBudget.aggregate([
    {
      $match: req.$match,
    },
    ...pipeline,
    {
      $project: {
        plantVsActual: [
          {
            $sum: "$plan",
          },
          {
            $sum: "$actual",
          },
        ],
      },
    },
  ]);

  if (!plantVsActual || plantVsActual?.length <= 0)
    return res.status(404).json({
      message: "No data to display",
    });

  return res.status(201).json({
    message: "FY Plant Vs actual budget get successfully",
    ...plantVsActual[0],
  });
});

// exports.getMonthlyStatus = tryCatchHandler(async (req, res, next) => {
//   const { requestedFor, selectedMonth } = req.query;

//   if (!selectedMonth || !requestedFor)
//     return res.status(400).json({
//       message: "Please provide required data",
//       showToast: true,
//     });

//   const month =
//     (moment(
//       selectedMonth,
//       `MMM${["June", "July"].includes(selectedMonth) ? "M" : ""}`,
//     ).month() +
//       12 -
//       3) %
//     12;

//   let keys = {
//     planKey: "$plan",
//     actualKey: "$BPDActual",
//   };

//   if (requestedFor === "cumulative")
//     keys = {
//       planKey: "$cumulativePlan",
//       actualKey: "$cumulativeActual",
//     };

//   let pipeline = [],
//     $gte = [
//       { $arrayElemAt: [keys.planKey, month] },
//       { $arrayElemAt: [keys.actualKey, month] },
//     ];

//   if (
//     req.query.selectedValue &&
//     req.query?.flagForTogglingFilter !== "based-on-cell"
//   ) {
//     const matchingKey = filterKeys?.[req.query?.flagForTogglingFilter];
//     pipeline = [
//       {
//         $group: {
//           _id: `$${matchingKey}._id`,
//           groupedPlan: {
//             $sum: { $arrayElemAt: [keys.planKey, month] },
//           },
//           groupedActual: {
//             $sum: { $arrayElemAt: [keys.actualKey, month] },
//           },
//         },
//       },
//     ];

//     $gte = ["$groupedPlan", "$groupedActual"];
//   }

//   const budget = await SpareBudget.aggregate([
//     {
//       $match: req.$match,
//     },
//     ...pipeline,
//     {
//       $project: {
//         status: {
//           $cond: [{ $gte }, "Ok", "NG"],
//         },
//       },
//     },
//   ]);

//   if (!budget || budget?.length <= 0)
//     return res.status(404).json({
//       message: "No data to display",
//     });

//   return res.status(201).json({
//     message: "FY Plant Vs actual budget get successfully",
//     ...budget[0],
//   });
// });

exports.getMonthlyStatus = tryCatchHandler(async (req, res, next) => {
  const { requestedFor, selectedMonth } = req.query;

  if (!selectedMonth || !requestedFor)
    return res.status(400).json({
      message: "Please provide required data",
      showToast: true,
    });

  const month =
    (moment(
      selectedMonth,
      `MMM${["June", "July"].includes(selectedMonth) ? "M" : ""}`,
    ).month() +
      12 -
      3) %
    12;

  let keys = [
    {
      label: "Monthly",
      planKey: "$plan",
      actualKey: "$BPDActual",
      groupKey: {
        key1: "groupedPlan1",
        key2: "groupedActual1",
      },
    },
  ];

  if (requestedFor !== "simple") {
    const cumulativeObj = {
      label: "Cumu",
      planKey: "$cumulativePlan",
      actualKey: "$cumulativeActual",
      groupKey: {
        key1: "groupedPlan2",
        key2: "groupedActual2",
      },
    };

    if (requestedFor === "cumulative") keys = [cumulativeObj];
    else keys.push(cumulativeObj);
  }

  let pipeline = [],
    status = [];

  if (
    req.query.selectedValue &&
    req.query?.flagForTogglingFilter !== "based-on-cell"
  ) {
    const matchingKey = filterKeys?.[req.query?.flagForTogglingFilter];
    pipeline = [
      {
        $group: {
          _id: `$${matchingKey}._id`,
        },
      },
    ];

    keys.map((item) => {
      pipeline[0].$group[item?.groupKey?.key1] = {
        $sum: { $arrayElemAt: [item?.planKey, month] },
      };
      pipeline[0].$group[item?.groupKey?.key2] = {
        $sum: { $arrayElemAt: [item?.actualKey, month] },
      };

      status.push({
        label: item?.label,
        value: {
          $cond: [
            {
              $gte: [`$${item?.groupKey?.key1}`, `$${item?.groupKey?.key2}`],
            },
            "Ok",
            "NG",
          ],
        },
      });
    });
  } else {
    keys.map((item) =>
      status.push({
        label: item?.label,
        value: {
          $cond: [
            {
              $gte: [
                { $arrayElemAt: [item?.planKey, month] },
                { $arrayElemAt: [item?.actualKey, month] },
              ],
            },
            "Ok",
            "NG",
          ],
        },
      }),
    );
  }

  const budget = await SpareBudget.aggregate([
    {
      $match: req.$match,
    },
    ...pipeline,
    {
      $project: {
        status,
      },
    },
  ]);

  if (!budget || budget?.length <= 0)
    return res.status(404).json({
      message: "No data to display",
    });

  return res.status(201).json({
    message: "FY Plant Vs actual budget get successfully",
    ...budget[0],
  });
});

exports.getSectionWiseBudget = tryCatchHandler(async (req, res, next) => {
  const sectionWiseBudget = await SpareBudget.aggregate([
    {
      $match: req.$match,
    },
    {
      $project: {
        sectionWiseCurrentMonthBudget: {
          $arrayElemAt: ["$plan", (moment().month() + 12 - 3) % 12],
        },
      },
    },
  ]);

  if (!sectionWiseBudget || sectionWiseBudget?.length <= 0)
    return res.status(404).json({
      message: "No data to display",
    });

  return res.status(201).json({
    message: "FY Plant Vs actual budget get successfully",
    budget: sectionWiseBudget[0],
  });
});
