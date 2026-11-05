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

/** Running total of a monthly plan, Apr through Mar; blanks count as 0. */
const cumulativeOf = (plan = []) => {
  let total = 0;
  return Array.from({ length: 12 }, (_, i) => {
    const value = Number(plan[i]);
    total += Number.isFinite(value) ? value : 0;
    return total;
  });
};

/**
 * Applies month-end BPD figures. Each month whose BPD value was entered or
 * changed is closed: the BPD value becomes that month's actual, and the
 * cumulative actual is rebuilt from the twelve actuals.
 */
const applyBPDActual = ({ existing = {}, incoming }) => {
  const actual = [...(existing.actual ?? Array(12).fill(0))];
  const closedMonths = [...(existing.closedMonths ?? Array(12).fill(false))];
  const previous = existing.BPDActual ?? Array(12).fill(0);

  incoming.forEach((raw, i) => {
    const value = Number(raw);
    if (!Number.isFinite(value) || value === Number(previous[i] ?? 0)) return;
    actual[i] = value;
    closedMonths[i] = true;
  });

  return { actual, closedMonths, cumulativeActual: cumulativeOf(actual) };
};

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

/**
 * The plant's budget has no record of its own: it is every cell's budget added
 * up, exactly as a section's is its cells' budgets added up. These two halves
 * turn a set of cell budgets into one monthly series — `$push` collects each
 * document's arrays and sumArrayField adds them index by index (Apr..Mar) — so
 * the plant, section and sub-section views share one summation step and can
 * never disagree about how a total is formed.
 */
const groupedBudgetArrays = () => ({
  planArr: { $push: "$plan" },
  actualArr: { $push: "$actual" },
  BPDActualArr: { $push: "$BPDActual" },
  cumulativePlanArr: { $push: "$cumulativePlan" },
  cumulativeActualArr: { $push: "$cumulativeActual" },
});

const summedBudgetFields = {
  plan: sumArrayField("plan"),
  actual: sumArrayField("actual"),
  BPDActual: sumArrayField("BPDActual"),
  cumulativePlan: sumArrayField("cumulativePlan"),
  cumulativeActual: sumArrayField("cumulativeActual"),
};

/** The group key for the selected level; null is the whole plant. */
const budgetGroupKey = (req) =>
  req.query?.selectedValue
    ? `$${filterKeys?.[req.query?.flagForTogglingFilter]}._id`
    : null;

const isCellSelected = (req) =>
  Boolean(req.query?.selectedValue) &&
  req.query?.flagForTogglingFilter === "based-on-cell";

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
  } else {
    /**
     * Plant-wide: every cell budget is in scope, across every section — the
     * overall figure is their sum. The old hand-entered overall record
     * (isSectionWise false) is deliberately not read any more, so the plant
     * figure cannot drift from the sections it is made of.
     */
    $match["isSectionWise"] = true;
  }

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

  let pipeline;

  if (isCellSelected(req)) {
    // One cell's own record, with its remarks.
    pipeline = [
      {
        $project: {
          plan: 1,
          actual: 1,
          BPDActual: 1,
          cumulativePlan: 1,
          cumulativeActual: 1,
          ...statusFields,
          remarks: 1,
        },
      },
    ];
  } else {
    /**
     * A section, a sub-section, or the whole plant: the cells' monthly series
     * are added up first, then the statuses are derived from the summed plan
     * and BPD. The plant case groups on null, so all sections — Powertrain,
     * Electronics and the rest — are in the one figure.
     */
    pipeline = [
      {
        $group: {
          _id: budgetGroupKey(req),
          ...groupedBudgetArrays(),
        },
      },
      {
        $project: {
          _id: 1,
          ...summedBudgetFields,
        },
      },
      {
        $addFields: statusFields,
      },
    ];
  }

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
  /**
   * Budgets are entered per cell; the section, sub-section and plant figures
   * are all summed from them. A plant-level record would be a second source of
   * truth for the overall figure, so only a cell may be stored.
   */
  if (
    !req.query.selectedValue ||
    req.query.flagForTogglingFilter !== "based-on-cell"
  )
    return res.status(400).json({
      message:
        "The overall budget is calculated from cell budgets. Please select a cell to enter its budget.",
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

  req.body["financialYear"] = getFY();
  if (req.body.plan) req.body.cumulativePlan = cumulativeOf(req.body.plan);
  // Actuals come from issuances and month-end BPD figures, never typed in.
  delete req.body["actual"];
  delete req.body["cumulativeActual"];
  delete req.body["closedMonths"];
  if (req.body.BPDActual)
    Object.assign(req.body, applyBPDActual({ incoming: req.body.BPDActual }));

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
  delete req.body["closedMonths"];
  // A changed plan re-derives its cumulative; a client cannot send one alone.
  if (req.body.plan) req.body.cumulativePlan = cumulativeOf(req.body.plan);
  else delete req.body["cumulativePlan"];

  if (req.body.BPDActual) {
    const existing = await SpareBudget.findOne(
      { _id: req.query?._id },
      { actual: 1, BPDActual: 1, closedMonths: 1 },
    ).lean();

    if (!existing)
      return res.status(404).json({ message: "Budget not found", showToast: true });

    Object.assign(
      req.body,
      applyBPDActual({ existing, incoming: req.body.BPDActual }),
    );
  }

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

  if (!isCellSelected(req)) {
    /**
     * Plant-wide, section or sub-section: each cell's yearly series is summed
     * first, then the series are summed into the two totals below. A cell
     * selection is already a single document and needs no grouping.
     */
    pipeline = [
      {
        $group: {
          _id: budgetGroupKey(req),
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

  const planVsActual = await SpareBudget.aggregate([
    {
      $match: req.$match,
    },
    ...pipeline,
    {
      $project: {
        planVsActual: [
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

  if (!planVsActual || planVsActual?.length <= 0)
    return res.status(404).json({
      message: "No data to display",
    });

  return res.status(201).json({
    message: "FY Plan Vs actual budget get successfully",
    ...planVsActual[0],
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
//     message: "FY Plan Vs actual budget get successfully",
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

  const isGrouped =
    Boolean(req.query.selectedValue) &&
    req.query?.flagForTogglingFilter !== "based-on-cell";

  if (isGrouped) {
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
    /**
     * Plant-wide: the cells' monthly series are summed first, so the plan and
     * BPD compared below are the plant's, not one cell's. A selected cell is
     * one document and is compared exactly as stored.
     */
    if (!req.query.selectedValue)
      pipeline = [
        {
          $group: {
            _id: null,
            ...groupedBudgetArrays(),
          },
        },
        {
          $project: {
            _id: 0,
            ...summedBudgetFields,
          },
        },
      ];

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
    message: "FY Plan Vs actual budget get successfully",
    ...budget[0],
  });
});

exports.getSectionWiseBudget = tryCatchHandler(async (req, res, next) => {
  /**
   * The budget a request-sheet is weighed against is the cell's, so this
   * endpoint is cell-only. Without a selection the plant-wide match would
   * return an arbitrary cell's figure. Answered as "no data" rather than a
   * refusal: the request form asks before a cell has been chosen, and that
   * must stay silent.
   */
  if (!req.query.selectedValue)
    return res.status(404).json({
      message: "No data to display",
    });

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
    message: "FY Plan Vs actual budget get successfully",
    budget: sectionWiseBudget[0],
  });
});
