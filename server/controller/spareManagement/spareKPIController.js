const mongoose = require("mongoose");
const moment = require("moment-timezone");
const { gettingFYYear } = require("../../middleware/gettingFYYear");
const {
  createColumnFilters,
  escapeRegex,
} = require("../../utils/columnFilters");
const tryCatchHandler = require("../../errorHandler/tryCatchHandler");
const unparseJSONData = require("../../utils/unparseJSONData");
const { isToolRoomUser } = require("../../utils/userScope");

const Cell = require("../../model/cellSchema");
const RequestSheetOfSpare = require("../../model/requestSheetDataOfSpare");
const SpareMaster = require("../../model/spareMasterSchema");
const MachineCost = require("../../model/machineCostSchema");
const SpareIssuanceSummary = require("../../model/spareIssuanceSummarySchema");
const SpareInventoryTarget = require("../../model/spareInventoryTargetSchema");
const SpareCellInventoryTarget = require("../../model/spareCellInventoryTargetSchema");
const {
  monthKey,
  buildCumulativeCellInventory,
} = require("../../services/spare/cumulativeCellInventoryService");
const {
  validateCellTargetInput,
  normalizedTarget,
} = require("../../services/spare/cellInventoryTargetService");
const SpareBudget = require("../../model/spareBudgetSchema");

const { budgetDetailsProjection } = require("./spareIssuanceSummaryController");

const {
  allMonths,
  allMonthsStr,
  convertCostInMilUnitInJS,
  convertCostInMilUnitInMongoose,
} = require("../../utils/spareManagementUtils");
const getFY = require("../../utils/getFY");

const filterKeys = {
  "based-on-plant": "plant",
  "based-on-section": "section",
  "based-on-subSection": "subSection",
  "based-on-cell": "cell",
  "based-on-line": "line",
  "based-on-machine": "machine",
};

/**
 * When stock of a master last moved: its latest issue (kept up to date by the
 * issuance stock-out, seeded from the legacy ShippingDate), or, for a part never
 * issued, the day it entered stock. The rotation buckets and the dead-stock
 * list are both judged on this, so they agree. The master's updatedAt is not a
 * movement — any edit or a re-import would have made every part "moving".
 */
const lastMovementDate = {
  $ifNull: [
    "$lastIssuedDate",
    { $ifNull: ["$createDate", "$dateTime.inDate"] },
  ],
};

/** True when the last movement is within the past `years` years, to the day. */
const movedWithinYears = (years) => ({
  $gt: [
    lastMovementDate,
    { $dateSubtract: { startDate: "$$NOW", unit: "year", amount: years } },
  ],
});

const addFieldsForInventoryBifurcation = {
  // Exact elapsed time rather than $dateDiff's calendar-year boundaries, so a
  // part counted as dead here is the same part the dead-stock list shows.
  ageBucket: {
    $switch: {
      branches: [
        { case: movedWithinYears(1), then: "LESS_THEN_1" },
        { case: movedWithinYears(5), then: "1_TO_5" },
        { case: movedWithinYears(10), then: "5_TO_10" },
      ],
      default: "GRATER_THEN_10",
    },
  },
  budgetDetails: {
    $reduce: {
      input: "$costDetails",
      initialValue: { overAllAvailableQty: 0, overAllCostInINR: 0 },
      in: {
        overAllAvailableQty: {
          $add: [
            "$$value.overAllAvailableQty",
            { $ifNull: ["$$this.availableQty", 0] },
          ],
        },
        overAllCostInINR: {
          $add: [
            "$$value.overAllCostInINR",
            { $ifNull: ["$$this.overAllCost", 0] },
          ],
        },
      },
    },
  },
};

/**
 * Rotation buckets over the parts that are actually in stock — a master with
 * nothing on the shelf is the "Zero stock" figure, not a slow mover — counted
 * as masters, the same unit as the inventory count, so the five figures add up
 * to the catalogue. availableQty is kept for the quantity charts.
 */
const inventoryBifurcationPipeline = [
  {
    $match: {
      ageBucket: {
        $in: ["LESS_THEN_1", "1_TO_5", "5_TO_10", "GRATER_THEN_10"],
      },
    },
  },
  {
    $group: {
      _id: "$ageBucket",
      masterCount: { $sum: 1 },
      availableQty: { $sum: "$budgetDetails.overAllAvailableQty" },
      costInINR: {
        $sum: convertCostInMilUnitInMongoose("$budgetDetails.overAllCostInINR"),
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
          input: [
            {
              key: "LESS_THEN_1",
              title: "Moving",
            },
            {
              key: "1_TO_5",
              title: "Slow moving(1 to 5)",
            },
            {
              key: "5_TO_10",
              title: "Slow moving(5 to 10)",
            },
            {
              key: "GRATER_THEN_10",
              title: "No Rotation >10 yr",
            },
          ],
          as: "stockTimeFrame",
          in: {
            $cond: [
              { $in: ["$$stockTimeFrame.key", "$array._id"] },
              {
                title: "$$stockTimeFrame.title",
                value: {
                  $arrayElemAt: [
                    "$array",
                    {
                      $indexOfArray: ["$array._id", "$$stockTimeFrame.key"],
                    },
                  ],
                },
              },
              {
                title: "$$stockTimeFrame.title",
                value: {
                  _id: "$$stockTimeFrame.key",
                  masterCount: 0,
                  availableQty: 0,
                  costInINR: 0,
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
];

exports.getRequestSheets = tryCatchHandler(async (req, res, next) => {
  return res.status(201).json({
    message: "Request-sheets get successfully",
    tableData: req.tableData,
  });
});

exports.yearMonthFilter = tryCatchHandler(async (req, res, next) => {
  const { selectedYear, selectedMonth } = req.query;

  let $match = {};

  if (selectedYear)
    $match = {
      "rsTimeStamp.year.inString": selectedYear,
    };

  if (selectedMonth)
    $match = {
      ...$match,
      "rsTimeStamp.month.inString": moment().month(selectedMonth).format("MMM"),
    };

  req.$match = $match;
  return next();
});

/**
 * Holding ratio = Inventory Cost (Mil.) / Machine Cost (Mil.) x 100, as a
 * percentage to two decimals. Used by the KPI card and the inventory-trend
 * chart alike, so the chart's line and its percentage target share one scale.
 *
 * Both sides are in millions — the unit the machine cost is entered in and the
 * unit the inventory card shows — so the figure can be checked against the two
 * numbers on screen rather than against rupee totals that are never displayed.
 */
const holdingRatioPercent = (costInMil, machineCostInMil) => {
  if (!machineCostInMil) return 0;
  return Number(((costInMil / machineCostInMil) * 100).toFixed(2)) || 0;
};

/**
 * The inventory as it stands: every master in the catalogue, whatever year it
 * was registered in. It used to be narrowed by the dashboard's FY / month
 * filter, which turned a stock figure into "masters created this year" — a
 * small fraction of the real inventory value.
 */
exports.getInventorySummery = tryCatchHandler(async (req, res, next) => {
  const summery = await SpareMaster.aggregate([
    {
      $group: {
        _id: null,
        masterCount: { $sum: 1 },
        // Inner $sum adds a master's tranches; the outer accumulates masters.
        overAllCostInINR: {
          $sum: { $sum: { $ifNull: ["$costDetails.overAllCost", []] } },
        },
      },
    },
    {
      $project: {
        _id: 0,
        masterCount: 1,
        overAllCostInINR: 1,
        overAllCostInMil: convertCostInMilUnitInMongoose("$overAllCostInINR"),
      },
    },
  ]);

  if (summery?.length <= 0)
    return res.status(400).json({
      message: "No summery found",
    });

  const [{ masterCount, overAllCostInMil }] = summery;

  let counters = [
    {
      title: "Inventory Cost (Mil.)",
      value: overAllCostInMil || 0,
    },
    {
      title: "Inventory Count (Nos.)",
      value: masterCount || 0,
    },
  ];

  if (req.query?.withHoldingRation === "Yes") {
    const machineCostDetails = await MachineCost.findOne({
      ID: "MC1",
    });

    // The same millions figure the Inventory Cost card above shows, so the two
    // cards and the ratio between them agree.
    counters.push({
      title: "Holding ratio (%)",
      value: holdingRatioPercent(
        overAllCostInMil,
        machineCostDetails?.machineCost,
      ),
    });
  }
  return res.status(201).json({
    message: "Summery get successfully",
    counters,
  });
});

exports.getSpareSheetsSummeryForKPI = tryCatchHandler(
  async (req, res, next) => {
    const counters = await RequestSheetOfSpare.aggregate([
      {
        $match: req.$match,
      },
      {
        $unwind: "$changeParts",
      },
      {
        $group: {
          _id: null,
          totalNewSheets: { $sum: 1 },
          PRGenerationCounts: {
            $sum: {
              $cond: [
                { $ifNull: ["$changeParts.rsPRGenerationTimeStamp", false] },
                1,
                0,
              ],
            },
          },
          PRGenerationPendingCounts: {
            $sum: {
              $cond: [
                { $ifNull: ["$changeParts.rsPRGenerationTimeStamp", false] },
                0,
                1,
              ],
            },
          },
          POIssuePending: {
            $sum: {
              $cond: [
                { $ifNull: ["$changeParts.rsPOIssueToVendorTimeStamp", false] },
                0,
                1,
              ],
            },
          },
          partNotReceiveCounts: {
            $sum: {
              $cond: [
                { $ifNull: ["$changeParts.rsPartReceiveTimeStamp", false] },
                0,
                1,
              ],
            },
          },
        },
      },
    ]);

    if (counters?.length <= 0)
      return res.status(400).json({
        message: "No spare sheet summery found",
      });

    const [
      {
        totalNewSheets,
        PRGenerationCounts,
        PRGenerationPendingCounts,
        POIssuePending,
        partNotReceiveCounts,
      },
    ] = counters;

    return res.status(201).json({
      message: "Summery get successfully",
      counters: [
        {
          title: "New Part Requests",
          value: totalNewSheets || 0,
        },
        {
          title: "PR made",
          value: PRGenerationCounts || 0,
        },
        {
          title: "PR pending",
          value: PRGenerationPendingCounts || 0,
        },
        {
          title: "PO pending",
          value: POIssuePending || 0,
        },
        {
          title: "Receiving pending",
          value: partNotReceiveCounts || 0,
        },
      ],
    });
  },
);

/**
 * Now includes a PM user who also works in the tool room.
 *
 * Also closed a gate that failed open: it rejected only the exact string "No",
 * so every user whose toolRoomPerson has never been set - 115 of the 342 in the
 * plant - passed it. It now asks whether they are a tool-room user at all.
 */
exports.IsToolRoomPerson = tryCatchHandler(async (req, res, next) => {
  if (!isToolRoomUser(req.rootUser))
    return res.status(400).json({
      showToast: true,
      message: "You are not authorizedPerson",
    });

  return next();
});
exports.getMachineCost = tryCatchHandler(async (req, res, next) => {
  const machineCostDetails = await MachineCost.findOne({
    ID: "MC1",
  });

  if (!machineCostDetails)
    return res.status(404).json({
      message: "No data to display",
    });

  return res.status(201).json({
    message: "Data get successfully",
    machineCostDetails,
  });
});

exports.registerMachineCost = tryCatchHandler(async (req, res, next) => {
  const machineCostDetails = new MachineCost({
    ID: "MC1",
    ...req.body,
  });
  await machineCostDetails.save();

  return res.status(201).json({
    message: "Data get successfully",
    showToast: true,
    machineCostDetails,
  });
});

exports.updateMachineCost = tryCatchHandler(async (req, res, next) => {
  const machineCostDetails = await MachineCost.findOneAndUpdate(
    {
      ID: "MC1",
    },
    { machineCost: req.body?.machineCost },
    {
      new: true,
    },
  );

  return res.status(201).json({
    message: "Data get successfully",
    showToast: true,
    machineCostDetails,
  });
});

const consumptionTrendBasedOnRequest = {
  costWise: {
    "changeParts.isStockOut": true,
  },
  temporaryPart: {
    "changeParts.temporaryOrPermanent": "Temporary",
  },
};

const consumptionTypes = {
  section: {
    groupKeys: () => ({
      _id: "$section._id",
      section: { $first: "$section" },
    }),
    $sort: {
      _id: 1,
    },
    labels: () => ({ $push: "$section.section_name" }),
  },
  top: {
    groupKeys: (visualizationBasedOn = "spare") => {
      let returnObj = {
        _id: "$changeParts.partModel",
      };
      if (visualizationBasedOn === "machine")
        returnObj = {
          _id: "machine._id",
          machine: { $first: "$machine" },
        };
      return returnObj;
    },
    $sort: {
      data2: 1,
    },
    labels: (visualizationBasedOn = "spare") => {
      let returnObj = { $push: "$_id" };
      if (visualizationBasedOn === "machine")
        returnObj.$push = "$machine.machine_name";
      return returnObj;
    },
  },
};

exports.getConsumptionTrendData = tryCatchHandler(async (req, res, next) => {
  const { requestFor, consumptionFor, visualizationBasedOn, limit } = req.query;

  if (!requestFor || !consumptionFor)
    return res.status(400).json({
      message: "Please provide the required field",
    });

  let otherPipeline = [];

  if (consumptionFor === "top") {
    if (!limit || !visualizationBasedOn)
      return res.status(400).json({
        message: "Please provide the required limit",
      });

    otherPipeline = [
      {
        $limit: limit * 1 || 1,
      },
    ];
  }
  const { groupKeys, $sort, labels } = consumptionTypes[consumptionFor];

  const counters = await SpareIssuanceSummary.aggregate([
    {
      $match: req.$match,
    },
    {
      $unwind: "$changeParts",
    },
    {
      $match: consumptionTrendBasedOnRequest[requestFor],
    },
    {
      $group: {
        ...groupKeys(visualizationBasedOn),
        data1: { $sum: "$changeParts.consumption.quantity" },
        data2: { $sum: "$changeParts.consumption.cost" },
      },
    },
    {
      $sort,
    },
    ...otherPipeline,
    {
      $group: {
        _id: null,
        labels: labels(visualizationBasedOn),
        data1: { $push: "$data1" },
        data2: {
          $push: convertCostInMilUnitInMongoose("$data2"),
        },
      },
    },
  ]);

  if (counters?.length <= 0)
    return res.status(404).json({
      message: "No data found",
    });

  return res.status(201).json({
    message: "Data get successfully",
    counters: counters[0],
  });
});

exports.getStockLifeTimelineSummery = tryCatchHandler(
  async (req, res, next) => {
    const counters = await SpareMaster.aggregate([
      {
        $addFields: addFieldsForInventoryBifurcation,
      },
      {
        $facet: {
          stockCounters: inventoryBifurcationPipeline,
          zeroStockCounters: [
            {
              $group: {
                _id: null,
                value: {
                  $sum: {
                    $cond: [
                      { $lte: ["$budgetDetails.overAllAvailableQty", 0] },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
            {
              $project: {
                title: "Zero stock parts",
                value: 1,
              },
            },
          ],
        },
      },
      {
        $project: {
          datasets: {
            $concatArrays: ["$stockCounters", "$zeroStockCounters"],
          },
        },
      },
      {
        $unwind: "$datasets",
      },
      {
        $replaceRoot: { newRoot: "$datasets" },
      },
    ]);

    if (counters?.length <= 0)
      return res.status(404).json({
        message: "No data found",
      });

    return res.status(201).json({
      message: "Data get successfully",
      counters: foldSlowMovingIntoDeadStock(counters),
    });
  },
);

/**
 * The summary cards show three rotation figures — Moving, Slow moving (1 to 5)
 * and Dead stock — so on the cards anything not moved for over five years is
 * dead stock. The shared pipeline keeps its 5-to-10 bucket because the charts
 * and the dead-stock list still split at ten years; only the cards fold it in.
 */
const foldSlowMovingIntoDeadStock = (counters) => {
  const slow = counters.find((c) => c?.value?._id === "5_TO_10");
  const empty = { masterCount: 0, availableQty: 0, costInINR: 0 };

  return counters
    .filter((c) => c !== slow)
    .map((c) => {
      if (typeof c?.value !== "object") return c;
      const add =
        c.value._id === "GRATER_THEN_10" ? (slow?.value ?? empty) : empty;
      return {
        ...c,
        value: {
          ...c.value,
          ...(c.value._id === "GRATER_THEN_10" ? { _id: "GRATER_THEN_5" } : {}),
          masterCount: (c.value.masterCount ?? 0) + (add.masterCount ?? 0),
          availableQty: (c.value.availableQty ?? 0) + (add.availableQty ?? 0),
          // Summed from per-master millions, so the total picks up float noise.
          costInINR: Number(
            ((c.value.costInINR ?? 0) + (add.costInINR ?? 0)).toFixed(2),
          ),
        },
      };
    });
};

exports.getNewAndStockInSparesOrderingTrend = tryCatchHandler(
  async (req, res, next) => {
    const { selectedYear } = req.query;

    if (!selectedYear || typeof selectedYear !== "string")
      return res.status(400).json({ message: "selectedYear is required" });

    const conditionGenerator = (key = "$changePartsTotals.qty") => ({
      $cond: [{ $eq: ["$newPartFor", "For stock in"] }, key, 0],
    });

    const spareOrderData = await RequestSheetOfSpare.aggregate([
      {
        $match: {
          "rsTimeStamp.year.inString": selectedYear,
        },
      },
      {
        $addFields: {
          changePartsTotals: {
            $reduce: {
              input: { $ifNull: ["$changeParts", []] },
              initialValue: { qty: 0, cost: 0 },
              in: {
                qty: {
                  $add: [
                    "$$value.qty",
                    { $ifNull: ["$$this.quantityRequired", 0] },
                  ],
                },
                cost: {
                  $add: [
                    "$$value.cost",
                    {
                      $multiply: [
                        { $ifNull: ["$$this.quantityRequired", 0] },
                        { $ifNull: ["$$this.approxUnitPrice", 0] },
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
      },
      {
        $group: {
          _id: "$rsTimeStamp.month.inString",
          totalNewSpareOrders: { $sum: "$changePartsTotals.qty" },
          costInINR: { $sum: "$changePartsTotals.cost" },
          stockInSpareOrders: { $sum: conditionGenerator() },
          stockInCostInINR: {
            $sum: conditionGenerator("$changePartsTotals.cost"),
          },
        },
      },
    ]).allowDiskUse(true);

    if (!spareOrderData?.length)
      return res.status(404).json({ message: "No data found" });

    let labels = [],
      totalNewSpareOrders = [],
      costInINR = [],
      stockInSpareOrders = [],
      stockInCostInINR = [];

    for (let i = 0; i < allMonths.length; i++) {
      labels.push(allMonths[i]?.monthName);
      const data = spareOrderData.find(
        (item) => item?._id === allMonths[i]?.monthName,
      );
      if (data) {
        totalNewSpareOrders.push(data?.totalNewSpareOrders);
        costInINR.push(convertCostInMilUnitInJS(data?.costInINR));
        stockInSpareOrders.push(data?.stockInSpareOrders);
        stockInCostInINR.push(convertCostInMilUnitInJS(data?.stockInCostInINR));
      } else {
        totalNewSpareOrders.push(0);
        costInINR.push(0);
        stockInSpareOrders.push(0);
        stockInCostInINR.push(0);
      }
    }

    return res.status(200).json({
      message: "Data get successfully",
      chartData: {
        labels,
        datasets: [
          {
            type: "line",
            label: "Total new order cost",
            data: costInINR,
            borderColor: "hsl(0, 65%, 62%)",
            backgroundColor: "hsl(0, 65%, 62%)",
            pointStyle: "rectRot",
            yAxisID: "y1",
          },
          {
            type: "line",
            label: "Stock-in cost",
            data: stockInCostInINR,
            borderColor: "hsl(180, 65%, 62%)",
            backgroundColor: "hsl(180, 65%, 62%)",
            pointStyle: "rectRot",
            yAxisID: "y1",
          },
          {
            type: "bar",
            label: "Total new orders",
            data: totalNewSpareOrders,
            backgroundColor: "hsl(90, 65%, 62%)",
            borderRadius: 4,
            pointStyle: "rect",
          },
          {
            type: "bar",
            label: "Stock-in orders",
            data: stockInSpareOrders,
            backgroundColor: "hsl(270, 65%, 62%)",
            borderRadius: 4,
            pointStyle: "rect",
          },
        ],
      },
    });
  },
);

exports.getInventoryTarget = tryCatchHandler(async (req, res, next) => {
  const target = await SpareInventoryTarget.findOne({
    ID: "IN_TARGET",
  });

  if (!target)
    return res.status(404).json({
      message: "No data to display",
    });

  return res.status(201).json({
    message: "Target get successfully",
    target,
  });
});

exports.registerInventoryTarget = tryCatchHandler(async (req, res, next) => {
  req.body["ID"] = "IN_TARGET";
  req.body["financialYear"] = getFY();

  const target = new SpareInventoryTarget(req.body);
  await target.save();

  return res.status(201).json({
    message: "Data added successfully",
    showToast: true,
    target,
  });
});

exports.updateInventoryTarget = tryCatchHandler(async (req, res, next) => {
  const { _id } = req.query;

  if (!_id)
    return res.status(400).json({
      message: "Please provide required data",
      showToast: true,
    });

  const target = await SpareInventoryTarget.findOneAndUpdate(
    {
      _id,
    },
    {
      $set: req.body,
    },
    {
      new: true,
    },
  );
  return res.status(201).json({
    message: "Target updated successfully",
    target,
    showToast: true,
  });
});

exports.getInventoryTrend = tryCatchHandler(async (req, res, next) => {
  // The dashboard no longer asks for a year: the trend opens on the current
  // financial year.
  const selectedYear = req.query?.selectedYear || gettingFYYear(new Date());

  /**
   * The bars are each cell's carried-forward inventory value, month by month -
   * the same running balance the Each-Cell-Wise Bifurcation draws, so the two
   * agree on what is on the shelf. A running year stops at the current month;
   * later months carry no figure (null), so the whole chart ends there.
   */
  const { rawData, lastMonthIndex, invalid } =
    await loadCumulativeCellInventory(selectedYear);

  if (invalid) return res.status(400).json({ message: invalid });

  if (!rawData?.length)
    return res.status(404).json({ message: "No data found" });

  const machineCostDetails = await MachineCost.findOne({ ID: "MC1" });

  /**
   * Machine cost, in millions - the unit the inventory value is taken to below,
   * so the holding ratio divides two figures on one scale. Missing or zero
   * means the ratio cannot be formed, so no label is shown rather than dividing
   * by zero (see holdingRatioPercent). Entered on the Target Dashboard.
   */
  const machineCostMil = Number(machineCostDetails?.machineCost) || 0;

  const monthCount = 12;
  const reportedMonths = lastMonthIndex === null ? monthCount : lastMonthIndex + 1;
  const round2 = (value) => Number((Number(value) || 0).toFixed(2));

  // Each cell's inventory value per month, in millions of rupees: its rotation
  // buckets summed, since this chart does not split by bucket. Months past the
  // current one carry no figure.
  const cells = rawData
    .map(({ cell, buckets }) => ({
      label: cell?.cell_name ?? "Unassigned cell",
      cellId: cell?._id ?? null,
      data: Array.from({ length: monthCount }, (_, monthIndex) => {
        if (monthIndex >= reportedMonths) return null;
        const costInINR = Object.values(buckets).reduce(
          (sum, bucket) => sum + (Number(bucket.cost?.[monthIndex]) || 0),
          0,
        );
        return convertCostInMilUnitInJS(costInINR);
      }),
    }))
    // Stable order, so a cell keeps its colour and legend position between calls.
    .sort((a, b) => String(a.label).localeCompare(String(b.label)));

  // Total inventory value per month = the height of the stacked bar; the chart
  // draws it as the label above the bar, and the holding ratio is formed from it.
  const totalInventory = Array.from({ length: monthCount }, (_, monthIndex) =>
    monthIndex >= reportedMonths
      ? null
      : round2(
          cells.reduce((sum, cell) => sum + (Number(cell.data[monthIndex]) || 0), 0),
        ),
  );

  /**
   * Holding ratio per month, as a percentage: total inventory value / machine
   * cost x 100, the same formula the KPI card uses. Null where there is no
   * machine cost or the month is not reported, so nothing misleading is plotted
   * and nothing is divided by zero.
   */
  const holdingRatio = totalInventory.map((value) =>
    value !== null && machineCostMil > 0
      ? round2((value / machineCostMil) * 100)
      : null,
  );

  const dataLength = cells.length;

  // One stacked bar series per cell, on the left (inventory value) axis.
  // A higher `order` than the lines keeps the bars behind the dots and target,
  // so the holding ratio and target are never hidden by a tall stack.
  const datasets = cells.map((cell, index) => ({
    type: "bar",
    stack: "bar-stacked",
    yAxisID: "y",
    unit: "Mil INR",
    label: cell.label,
    data: cell.data,
    order: 2,
    backgroundColor: `hsl(${Math.round((360 / dataLength) * index)}, 65%, 62%)`,
    borderColor: "#fff",
    borderWidth: 1,
  }));

  // Holding ratio is retained as an invisible dataset on the right-hand
  // percentage axis. The chart uses it only to render the percentage label
  // above the corresponding total-inventory label, not as dots on the bars.
  datasets.push({
    type: "line",
    label: "Holding ratio",
    data: holdingRatio,
    yAxisID: "y1",
    unit: "%",
    role: "ratio",
    order: 0,
    showLine: false,
    spanGaps: false,
    hideInLegend: true,
    borderColor: "transparent",
    backgroundColor: "transparent",
    pointRadius: 0,
    pointHoverRadius: 0,
    pointHitRadius: 0,
  });

  /**
   * The inventory target is an actual inventory value (Mil INR), set per month
   * on the Target Dashboard. It therefore belongs on the primary inventory
   * axis, not the holding-ratio percentage axis. Cut at the current month,
   * like everything else.
   */
  const target = await SpareInventoryTarget.findOne({ ID: "IN_TARGET" });

  if (target?.inventoryTarget?.length)
    datasets.push({
      type: "line",
      label: "Target",
      data: target.inventoryTarget.map((value, monthIndex) =>
        monthIndex >= reportedMonths ? null : value,
      ),
      yAxisID: "y",
      unit: "Mil INR",
      role: "target",
      order: 1,
      borderColor: "#9F0000",
      backgroundColor: "#9F0000",
      // A solid line, so the target reads as a reference level rather than a
      // forecast; the value labels are added by the client.
      borderWidth: 2,
      pointStyle: "rectRot",
      pointRadius: 4,
    });

  return res.status(201).json({
    message: "Data get successfully",
    chartData: {
      labels: allMonthsStr,
      // For the tooltip footer: the stack total and the machine cost behind the
      // holding ratio. machineCost is null when none is configured.
      machineCost: machineCostMil || null,
      totalInventory,
      datasets,
    },
  });
});

exports.getInventoryBifurcation = tryCatchHandler(async (req, res, next) => {
  const counters = await SpareMaster.aggregate([
    {
      $match: req.$match ?? {},
    },
    {
      $addFields: addFieldsForInventoryBifurcation,
    },
    {
      $facet: {
        rotationBuckets: inventoryBifurcationPipeline,
      },
    },
    { $unwind: "$rotationBuckets" },
    { $replaceRoot: { newRoot: "$rotationBuckets" } },
  ]);

  if (counters?.length <= 0)
    return res.status(404).json({
      message: "No data found",
    });

  const dataLength = counters?.length;
  let datasets = [];

  counters?.map((item, index) => {
    datasets.push({
      type: "bar",
      stack: "bar-stacked",
      backgroundColor: `hsl(${Math.round((360 / dataLength) * index)}, 65%, 62%)`,
      borderColor: "#fff",
      borderWidth: 1,
      label: item?.title,
      // Masters per bucket, matching the counters above the chart.
      data: [item?.value?.masterCount],
    });
  });

  return res.status(201).json({
    message: "Data get successfully",
    chartData: {
      labels: ["Bifurcation"],
      datasets,
    },
  });
});

exports.getInventoryBifurcationHierarchyWise = tryCatchHandler(
  async (req, res, next) => {
    const counters = await SpareMaster.aggregate([
      {
        $match: { ...req.$match, ...req.queryObj },
      },
      {
        $addFields: addFieldsForInventoryBifurcation,
      },
      {
        $match: {
          ageBucket: {
            $in: ["LESS_THEN_1", "1_TO_5", "5_TO_10", "GRATER_THEN_10"],
          },
        },
      },
      {
        $group: {
          _id: {
            timeFrame: "$ageBucket",
            cellId: "$cell._id",
          },
          cell: { $first: "$cell" },
          masterCount: { $sum: 1 },
          availableQty: { $sum: "$budgetDetails.overAllAvailableQty" },
          costInINR: {
            $sum: "$budgetDetails.overAllCostInINR",
          },
        },
      },
      {
        $group: {
          _id: "$_id.cellId",
          cell: { $first: "$cell" },
          array: {
            $push: {
              timeFrame: "$_id.timeFrame",
              masterCount: "$masterCount",
              availableQty: "$availableQty",
              costInINR: convertCostInMilUnitInMongoose("$costInINR"),
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          cell: 1,
          allTimeFrameData: {
            $map: {
              input: [
                {
                  key: "GRATER_THEN_10",
                  label: "No Rotation >10 yr",
                },
                {
                  key: "5_TO_10",
                  label: "Rotation Cycle 5~10 years",
                },
                {
                  key: "1_TO_5",
                  label: "Rotation Cycle 1~5 year",
                },
                {
                  key: "LESS_THEN_1",
                  label: "Rotation Cycle < 1 year",
                },
              ],
              as: "stockTimeFrame",
              in: {
                $cond: [
                  { $in: ["$$stockTimeFrame.key", "$array.timeFrame"] },
                  {
                    label: "$$stockTimeFrame.label",
                    value: {
                      $arrayElemAt: [
                        "$array",
                        {
                          $indexOfArray: [
                            "$array.timeFrame",
                            "$$stockTimeFrame.key",
                          ],
                        },
                      ],
                    },
                  },
                  {
                    label: "$$stockTimeFrame.label",
                    value: {
                      timeFrame: "$$stockTimeFrame.key",
                      masterCount: 0,
                      availableQty: 0,
                      costInINR: 0,
                    },
                  },
                ],
              },
            },
          },
        },
      },
      { $unwind: "$allTimeFrameData" },
      {
        $group: {
          _id: "$allTimeFrameData.label",
          // $push skips a missing field, so a master with no cell dropped its label
          // but kept its data, and every bar after it carried the next cell's name.
          labels: { $push: { $ifNull: ["$cell.cell_name", UNASSIGNED_CELL_LABEL] } },
          masterCount: { $push: "$allTimeFrameData.value.masterCount" },
          availableQty: { $push: "$allTimeFrameData.value.availableQty" },
          costInINR: { $push: "$allTimeFrameData.value.costInINR" },
        },
      },
    ]);

    if (counters?.length <= 0)
      return res.status(404).json({
        message: "No data found",
      });

    const dataLength = counters?.length;
    let labels = [],
      datasets = [];

    counters?.map((item, index) => {
      datasets.push({
        type: "bar",
        stack: "bar-stacked",
        backgroundColor: `hsl(${Math.round((360 / dataLength) * index)}, 65%, 62%)`,
        borderColor: "#fff",
        borderWidth: 1,
        label: item?._id,
        // This chart is a master-data bifurcation, not a stock-quantity chart:
        // the four stacks must add up to the same master count as the overall
        // bifurcation for the active hierarchy filter.
        data: item?.masterCount,
      });
    });

    return res.status(201).json({
      message: "Data get successfully",
      chartData: {
        labels: counters?.[0]?.labels,
        datasets,
      },
    });
  },
);

/**
 * The line-wise inventory charts are rankings, not censuses.
 *
 * The catalogue spans 76 production lines, of which the first ten hold roughly
 * four fifths of the stock. Plotting every one of them left bars a pixel wide
 * under a row of labels overlapping each other, so both charts take the top few
 * by quantity and let the reader ask for more.
 */
const TOP_INVENTORY_DEFAULT_LIMIT = 10;
const TOP_INVENTORY_MAX_LIMIT = 50;

const resolveTopLimit = (limit) => {
  const requested = Math.trunc(Number(limit));

  if (!Number.isFinite(requested) || requested < 1)
    return TOP_INVENTORY_DEFAULT_LIMIT;

  return Math.min(requested, TOP_INVENTORY_MAX_LIMIT);
};

/**
 * Masters that never resolved to a machine carry no line either, and they hold
 * close to half the stock. Naming that bucket keeps the chart honest; dropping
 * it would quietly hide the larger half of the catalogue.
 */
const UNASSIGNED_LINE_LABEL = "Unassigned line";

/** The cell counterpart: masters that never resolved to a machine have no cell. */
const UNASSIGNED_CELL_LABEL = "Unassigned cell";

/** Every master imported from the old catalogue arrived without this field. */
const UNSPECIFIED_SUPPLIER_CATEGORY = "Not specified";

exports.getTopInventoryItems = tryCatchHandler(async (req, res, next) => {
  const limit = resolveTopLimit(req.query.limit);

  const counters = await SpareMaster.aggregate([
    {
      $match: { ...req.$match, ...req.queryObj },
    },
    {
      $unwind: "$costDetails",
    },
    {
      $group: {
        _id: `$line._id`,
        label: { $first: `$line.line_name` },
        overAllAvailableQty: {
          $sum: { $ifNull: ["$costDetails.availableQty", 0] },
        },
        overAllCostInINR: {
          $sum: { $ifNull: ["$costDetails.overAllCost", 0] },
        },
      },
    },
    // Quantity is what the bars are drawn from, so it is what they are ranked
    // by; _id only breaks ties so equal lines keep a stable order between calls.
    {
      $sort: { overAllAvailableQty: -1, _id: 1 },
    },
    {
      $limit: limit,
    },
    {
      $group: {
        _id: null,
        labels: { $push: { $ifNull: ["$label", UNASSIGNED_LINE_LABEL] } },
        data1: { $push: "$overAllAvailableQty" },
        data2: { $push: convertCostInMilUnitInMongoose("$overAllCostInINR") },
      },
    },
  ]);

  if (counters?.length <= 0)
    return res.status(404).json({
      message: "No data found",
    });

  return res.status(201).json({
    message: "Data get successfully",
    counters: counters?.[0],
  });
});

exports.getSpareDetailsSupplierCategoryWise = tryCatchHandler(
  async (req, res, next) => {
    const limit = resolveTopLimit(req.query.limit);

    const lines = await SpareMaster.aggregate([
      {
        $match: { ...req.$match, ...req.queryObj },
      },
      {
        $unwind: "$costDetails",
      },
      {
        $group: {
          _id: {
            supplierCategory: {
              $ifNull: ["$supplierCategory", UNSPECIFIED_SUPPLIER_CATEGORY],
            },
            groupId: `$line._id`,
          },
          label: { $first: `$line.line_name` },
          availableQty: {
            $sum: { $ifNull: ["$costDetails.availableQty", 0] },
          },
        },
      },
      {
        $group: {
          _id: "$_id.groupId",
          label: { $first: "$label" },
          overAllAvailableQty: { $sum: "$availableQty" },
          categories: {
            $push: {
              supplierCategory: "$_id.supplierCategory",
              availableQty: "$availableQty",
            },
          },
        },
      },
      {
        $sort: { overAllAvailableQty: -1, _id: 1 },
      },
      {
        $limit: limit,
      },
    ]);

    if (lines?.length <= 0)
      return res.status(404).json({
        message: "No data found",
      });

    /**
     * The stack is built from the categories the data actually holds rather
     * than a fixed Local/Imported pair. Supplier category is a customisable
     * field, and the imported catalogue carries none at all — against a fixed
     * pair that rendered as two series of zeroes with nothing to read.
     */
    const supplierCategories = [
      ...new Set(
        lines.flatMap(({ categories }) =>
          categories.map(({ supplierCategory }) => supplierCategory),
        ),
      ),
    ].sort();

    const datasets = supplierCategories.map((supplierCategory, index) => ({
      type: "bar",
      stack: "bar-stacked",
      backgroundColor: `hsl(${Math.round((360 / supplierCategories.length) * index)}, 65%, 62%)`,
      borderColor: "#fff",
      borderWidth: 1,
      label: supplierCategory,
      data: lines.map(
        ({ categories }) =>
          categories.find(
            (category) => category.supplierCategory === supplierCategory,
          )?.availableQty ?? 0,
      ),
    }));

    return res.status(201).json({
      message: "Data get successfully",
      chartData: {
        labels: lines.map(({ label }) => label ?? UNASSIGNED_LINE_LABEL),
        datasets,
      },
    });
  },
);

const VALID_REQUEST_TYPES = ["barline", "pie"];

exports.getStockLevelWiseAnalysis = tryCatchHandler(async (req, res, next) => {
  const { requestFor } = req.query;

  if (
    typeof requestFor !== "string" ||
    !VALID_REQUEST_TYPES.includes(requestFor)
  ) {
    return res.status(400).json({
      message: `requestFor must be one of: ${VALID_REQUEST_TYPES.join(", ")}`,
    });
  }

  const stockLevelData = await SpareMaster.aggregate([
    {
      $match: {
        // The year and/or month the reader chose; nothing chosen is every master.
        ...req.$match,
        maxQuantity: { $gte: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        stockLevel: {
          $cond: [{ $gt: ["$maxQuantity", 10] }, 11, "$maxQuantity"],
        },
        stockTotals: {
          $reduce: {
            input: { $ifNull: ["$costDetails", []] },
            initialValue: { overAllAvailableQty: 0, overAllCostInINR: 0 },
            in: {
              overAllAvailableQty: {
                $add: [
                  "$$value.overAllAvailableQty",
                  { $ifNull: ["$$this.availableQty", 0] },
                ],
              },
              overAllCostInINR: {
                $add: [
                  "$$value.overAllCostInINR",
                  { $ifNull: ["$$this.overAllCost", 0] },
                ],
              },
            },
          },
        },
      },
    },
    {
      $group: {
        _id: "$stockLevel",
        // How many masters sit at this level - what the charts plot. The
        // quantity on the shelf is not: the level is a reference value set on
        // each master, and the charts count the masters that share it.
        masterCount: { $sum: 1 },
        costInINR: { $sum: "$stockTotals.overAllCostInINR" },
      },
    },
  ])
    .option({ maxTimeMS: 8000 })
    .read("secondaryPreferred");

  const stockLevels = Array.from({ length: 10 }, (_, index) => index + 1);
  const dataByStockLevel = new Map(
    stockLevelData.map((item) => [item._id, item]),
  );
  const allLevels = [...stockLevels, 11];
  const labels = [...stockLevels.map(String), ">10"];

  const masterCounts = allLevels.map(
    (level) => dataByStockLevel.get(level)?.masterCount || 0,
  );
  const costInINR = allLevels.map(
    (level) =>
      convertCostInMilUnitInJS(dataByStockLevel.get(level)?.costInINR) || 0,
  );

  if (requestFor === "pie") {
    const totalMasters = masterCounts.reduce((sum, value) => sum + value, 0);

    // Each slice is the share of masters at that level.
    const pieEntries = allLevels
      .map((level, index) => {
        const count = masterCounts[index];
        const percentage =
          totalMasters > 0
            ? Number(((count / totalMasters) * 100).toFixed(2))
            : 0;

        return { label: labels[index], percentage, count };
      })
      .filter((entry) => entry.percentage > 0);

    return res.status(200).json({
      message: "Data fetched successfully",
      counters: {
        labels: pieEntries.map((entry) => entry.label),
        data1: pieEntries.map((entry) => entry.percentage),
        data2: pieEntries.map((entry) => entry.count),
      },
    });
  }

  return res.status(200).json({
    message: "Data fetched successfully",
    chartData: {
      labels: [...stockLevels.map(String), ">10"],
      datasets: [
        {
          type: "line",
          label: "Cost (Mil INR)",
          data: costInINR,
          borderColor: "#7F7F7F",
          backgroundColor: "#7F7F7F",
          pointStyle: "circle",
          yAxisID: "y1",
        },
        {
          type: "bar",
          label: "Number of Masters",
          data: masterCounts,
          backgroundColor: "#70AD47",
          borderColor: "#fff",
          borderWidth: 1,
          yAxisID: "y",
        },
      ],
    },
  });
});

const DEAD_STOCK_YEARS = 10;

/**
 * Masters that have been issued from within the dead-stock window through this
 * application. Any master here has moved recently by definition, whatever its
 * legacy dates say, so the dead-stock list excludes it.
 */
const mastersIssuedSince = async (since) =>
  SpareIssuanceSummary.distinct("changeParts.masterId", {
    createdAt: { $gte: since },
  });

/**
 * Zero-stock and dead-stock part lists.
 *
 * Zero stock: nothing available, across the whole catalogue.
 *
 * The FY / month filter is not applied. What is on the shelf is a fact about
 * today, not about a financial year, and the filter matches on the year the
 * master was *registered* — so the list held only the parts registered in the
 * selected year, 404 of the 1418 the Inventory Dashboard counts. The dashboard
 * counter never filtered, which is why the two disagreed; the same reasoning
 * already governs the inventory summary and the dead-stock list below.
 *
 * Dead stock: stock lying without any stock-out for DEAD_STOCK_YEARS. The last
 * movement is the newest of the legacy last-issued date and any issuance made
 * here; a part never issued at all counts from the day it entered stock
 * (createDate, else the master's own creation stamp). The FY filter is not
 * applied — a part that has not moved for ten years belongs to no particular
 * year, and filtering on the year the master was registered would hide the
 * whole list. It used to be built on the master's updatedAt, so any edit to a
 * master — or a re-import — made it "moving" again.
 */
const DEAD_STOCK_REQUEST = "reasonForKeepingDeadStock";

/**
 * The rows of one list, in table order. Shared by the table and its CSV export
 * so the file always holds exactly what the table shows.
 */
const ZERO_STOCK_REQUEST = "reasonForZeroStock";

/**
 * The columns of both tables as flat fields, named for what the reader sees.
 * They are what the column filters match on and what the filter dropdowns list,
 * so a value in the dropdown is exactly the text in the cell.
 */
const PART_LIST_COLUMNS = new Set([
  "lineName",
  "machineName",
  "machineCode",
  "location",
  "partName",
  "partModel",
  "availableQty",
  "costInINR",
  "lastMovement",
  "remarks",
]);

const partListFilters = createColumnFilters(PART_LIST_COLUMNS);

/** The dead-stock "Last movement" cell, as the table prints it. */
const lastMovementTextExpression = {
  $cond: [
    { $ifNull: ["$lastMovementDate", false] },
    {
      $concat: [
        { $cond: ["$hasBeenIssued", "Issued ", "In stock since "] },
        {
          $dateToString: {
            format: "%d/%m/%Y",
            date: "$lastMovementDate",
            timezone: "Asia/Kolkata",
          },
        },
      ],
    },
    "-",
  ],
};

/**
 * The rows of one list, in table order. Shared by the table, its CSV export and
 * the filter dropdowns so all three always agree.
 *
 * `filters` are the column filters the reader set; `exceptColumn` leaves one
 * column's own filter out, the way Excel lists a column's values.
 */
const zeroOrDeadStockPipeline = async ({
  requestFor,
  filters = {},
  exceptColumn,
}) => {
  const isDeadStock = requestFor === DEAD_STOCK_REQUEST;
  const remarksField = `${isDeadStock ? DEAD_STOCK_REQUEST : ZERO_STOCK_REQUEST}Remarks`;

  const projection = {
    budgetDetails: addFieldsForInventoryBifurcation?.budgetDetails,
    location: 1,
    partName: 1,
    partModel: 1,
    [remarksField]: 1,
    line: 1,
    machine: 1,
  };

  const flatColumns = {
    $set: {
      lineName: "$line.line_name",
      machineName: "$machine.machine_name",
      machineCode: "$machine.machine_code",
      availableQty: "$budgetDetails.overAllAvailableQty",
      costInINR: "$budgetDetails.overAllCostInINR",
      remarks: `$${remarksField}`,
      lastMovement: isDeadStock ? lastMovementTextExpression : null,
    },
  };

  const columnMatch = partListFilters.match(filters, { except: exceptColumn });
  const filterStage = columnMatch ? [{ $match: columnMatch }] : [];

  if (isDeadStock) {
    const since = moment().subtract(DEAD_STOCK_YEARS, "years").toDate();
    const recentlyIssued = await mastersIssuedSince(since);

    return [
      {
        $match: {
          _id: { $nin: recentlyIssued },
          $expr: { $lte: [lastMovementDate, since] },
        },
      },
      {
        $project: {
          ...projection,
          lastMovementDate,
          hasBeenIssued: { $gt: ["$lastIssuedDate", null] },
        },
      },
      { $match: { "budgetDetails.overAllAvailableQty": { $gt: 0 } } },
      flatColumns,
      ...filterStage,
      { $sort: { lastMovementDate: 1 } },
    ];
  }

  return [
    { $project: projection },
    { $match: { "budgetDetails.overAllAvailableQty": { $lte: 0 } } },
    flatColumns,
    ...filterStage,
  ];
};

const zeroOrDeadStockParts = async (options) =>
  SpareMaster.aggregate(await zeroOrDeadStockPipeline(options));

/** Both lists are asked for by `requestFor`; anything else is the zero list. */
const partListRequestFor = (query) =>
  query?.requestFor === DEAD_STOCK_REQUEST
    ? DEAD_STOCK_REQUEST
    : ZERO_STOCK_REQUEST;

exports.getZeroStockPartList = tryCatchHandler(async (req, res, next) => {
  const tableData = await zeroOrDeadStockParts({
    requestFor: partListRequestFor(req.query),
    filters: partListFilters.parse(req.query.filters),
  });

  if (tableData?.length <= 0)
    return res.status(404).json({
      message: "No data found",
    });

  return res.status(201).json({
    message: "Data get successfully",
    tableData,
  });
});

/**
 * Distinct values of one column of a part list, with how many rows hold each -
 * what the column's filter dropdown shows. Narrowed by the other columns'
 * filters and by an optional search. Blank cells come back as one null entry.
 */
const PART_LIST_COLUMN_VALUES_LIMIT = 300;

exports.getPartListColumnValues = tryCatchHandler(async (req, res, next) => {
  const { column, search = "" } = req.query;

  if (!PART_LIST_COLUMNS.has(column))
    return res.status(400).json({
      message: `"${column}" is not a filterable column`,
      showToast: true,
    });

  const pipeline = await zeroOrDeadStockPipeline({
    requestFor: partListRequestFor(req.query),
    filters: partListFilters.parse(req.query.filters),
    exceptColumn: column,
  });

  const values = await SpareMaster.aggregate([
    ...pipeline,
    {
      $set: {
        value: {
          $cond: [{ $in: [`$${column}`, [null, ""]] }, null, `$${column}`],
        },
      },
    },
    ...(search
      ? [
          {
            $match: {
              $expr: {
                $regexMatch: {
                  input: { $toString: { $ifNull: ["$value", ""] } },
                  regex: escapeRegex(search),
                  options: "i",
                },
              },
            },
          },
        ]
      : []),
    { $group: { _id: "$value", count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
    { $limit: PART_LIST_COLUMN_VALUES_LIMIT + 1 },
    { $project: { _id: 0, value: "$_id", count: 1 } },
  ]);

  const truncated = values.length > PART_LIST_COLUMN_VALUES_LIMIT;

  return res.status(201).json({
    message: "Column values get successfully",
    values: truncated ? values.slice(0, PART_LIST_COLUMN_VALUES_LIMIT) : values,
    truncated,
  });
});

/**
 * The same list as CSV, one column per table column, with the column filters
 * applied. The dead-stock table's "Last movement" text is reproduced as written
 * on screen.
 */
exports.exportZeroStockPartList = tryCatchHandler(async (req, res, next) => {
  const requestFor = partListRequestFor(req.query);
  const isDeadStock = requestFor === DEAD_STOCK_REQUEST;

  const tableData = await zeroOrDeadStockParts({
    requestFor,
    filters: partListFilters.parse(req.query.filters),
  });

  if (tableData?.length <= 0)
    return res.status(404).json({
      message: "No data found",
      showToast: true,
    });

  const rows = tableData.map((row, index) => ({
    "S.No": index + 1,
    "Line name": row.line?.line_name ?? "",
    "Mc name": row.machine?.machine_name ?? "",
    "Mc number": row.machine?.machine_code ?? "",
    Location: row.location ?? "",
    "Part name": row.partName ?? "",
    "Part model": row.partModel ?? "",
    "Available Qty": row.budgetDetails?.overAllAvailableQty ?? 0,
    "Total cost(in INR)": row.budgetDetails?.overAllCostInINR ?? 0,
    ...(isDeadStock ? { "Last movement": row.lastMovement ?? "-" } : {}),
    [isDeadStock ? "Reason For Keeping" : "Reason For Zero Stock"]:
      row.remarks ?? "",
  }));

  // No period in the name: neither list is scoped to one, so naming a year
  // would claim a narrowing the file does not have.
  const title = isDeadStock ? "Dead Stock" : "Zero Stock";

  return res.status(201).json({
    message: "Data get successfully",
    tableData: unparseJSONData(rows),
    fileName: `${title} Parts ${moment().format("DD-MM-YYYY")}.csv`,
  });
});

exports.getReasonForZeroStock = tryCatchHandler(async (req, res, next) => {
  const { _id, requestFor } = req.query;

  if (!_id || !requestFor)
    return res.status(400).json({
      success: false,
      message: "Missing required query parameters: _id & requestFor",
    });

  if (!mongoose.Types.ObjectId.isValid(_id))
    return res.status(400).json({
      success: false,
      message: "Invalid ObjectId format",
    });

  const master = await SpareMaster.findOne(req.query, {
    [`${requestFor}Remarks`]: 1,
  });

  return res.status(201).json({
    message: "Reason submitted",
    spare: master,
  });
});

exports.handleReasonForZeroStock = tryCatchHandler(async (req, res, next) => {
  const { _id, requestFor } = req.query;

  if (!_id || !requestFor)
    return res.status(400).json({
      success: false,
      message: "Missing required query parameters: _id & requestFor",
    });

  if (!mongoose.Types.ObjectId.isValid(_id))
    return res.status(400).json({
      success: false,
      message: "Invalid ObjectId format",
    });

  const master = await SpareMaster.findOneAndUpdate(
    req.query,
    req.body?.formValue,
    {
      new: true,
      projection: {
        budgetDetails: addFieldsForInventoryBifurcation?.budgetDetails,
        location: 1,
        partName: 1,
        partModel: 1,
        [`${requestFor}Remarks`]: 1,
        line: 1,
        machine: 1,
      },
    },
  );

  return res.status(201).json({
    message: "Reason submitted",
    spareParts: [master],
  });
});

exports.getMTDRAndPlanVsActual = tryCatchHandler(async (req, res, next) => {
  const { selectedYear, selectedMonth } = req.query;

  const month =
    (moment(
      selectedMonth,
      `MMM${["June", "July"].includes(selectedMonth) ? "M" : ""}`,
    ).month() +
      12 -
      3) %
    12;

  const statusGenerator = (key1 = "$plan", key2 = "$BPDActual") => ({
    $cond: [
      {
        $gte: [
          { $arrayElemAt: [key1, month] },
          { $arrayElemAt: [key2, month] },
        ],
      },
      "Ok",
      "NG",
    ],
  });

  // This report only: plot rupees in millions. Other budget screens keep INR.
  const toMil = (field) => ({
    $map: {
      input: { $ifNull: [field, []] },
      as: "value",
      in: convertCostInMilUnitInMongoose("$$value"),
    },
  });

  const budgets = await SpareBudget.aggregate([
    {
      $match: {
        "financialYear.inString": selectedYear,
      },
    },
    {
      $project: {
        cell: 1,
        datasets: [
          {
            type: "line",
            label: "Cum Plan",
            data: toMil("$cumulativePlan"),
            borderColor: "#fdb515",
            backgroundColor: "#fdb515",
            pointStyle: "rectRot",
            // Cumulatives dwarf the monthly bars, so they ride the right axis.
            yAxisID: "y1",
          },
          {
            type: "line",
            label: "Cum Actual",
            data: toMil("$cumulativeActual"),
            borderColor: "#667788",
            backgroundColor: "#667788",
            pointStyle: "rectRot",
            yAxisID: "y1",
          },
          {
            type: "bar",
            stack: "bar-stacked",
            label: "Monthly Plan",
            data: toMil("$plan"),
            backgroundColor: "#4A6EA8",
            borderRadius: 4,
            pointStyle: "rect",
          },
          {
            type: "bar",
            label: "Monthly Actual",
            data: toMil("$actual"),
            backgroundColor: "#837618",
            borderRadius: 4,
            pointStyle: "rect",
          },
        ],
        monthlyStatus: [
          {
            label: "Monthly",
            value: statusGenerator(),
          },
          {
            label: "Cumu",
            value: statusGenerator("$cumulativePlan", "$cumulativeActual"),
          },
        ],
      },
    },
  ]);

  if (!budgets || budgets?.length <= 0)
    return res.status(404).json({
      message: "No data to display",
    });

  return res.status(201).json({
    message: "Data get successfully",
    chartData: {
      labels: allMonthsStr,
      data: budgets,
    },
  });
});

/**
 * The month-by-month inventory of one cell, carried forward - see
 * services/spare/cumulativeCellInventoryService.js for the rule.
 */
const IST = "Asia/Kolkata";

/** The master's registration month (when its stock came in) as a month key. */
const receivedMonthKeyOf = (master) => {
  const year = master.rsTimeStamp?.year?.inNumber;
  const month = master.rsTimeStamp?.month?.inNumber;

  // rsTimeStamp holds the financial year's first calendar year.
  if (year && month)
    return monthKey(month >= 4 ? year : year + 1, month);

  const date = master.createDate ?? master.dateTime?.inDate;
  if (!date) return null;

  const when = moment(date).tz(IST);
  return monthKey(when.year(), when.month() + 1);
};

const monthKeyOfDate = (date) => {
  if (!date) return null;
  const when = moment(date).tz(IST);
  return monthKey(when.year(), when.month() + 1);
};

/** The stock-out part's month: when its last approval - the one that issued it - was given. */
const issueMonthKeyOf = (part, sheetUpdatedAt) => {
  const lastKey = part.dynamicApprovalKeys?.[part.dynamicApprovalKeys.length - 1];
  const approvedAt = part[lastKey]?.approvalDateAndTime;

  const parsed = approvedAt
    ? moment.tz(approvedAt, "D/M/YYYY - h:mm a", IST)
    : null;

  return monthKeyOfDate(parsed?.isValid() ? parsed.toDate() : sheetUpdatedAt);
};

/**
 * The carried-forward inventory of every cell for a financial year: each cell's
 * stock at the end of each month, split by rotation bucket, up to the current
 * month (future months blank). Shared by the Each-Cell-Wise Bifurcation and the
 * Inventory Trend, so both read one definition of "what is on the shelf".
 *
 * @returns {Promise<{ rawData, lastMonthIndex } | { invalid: string }>}
 *   `rawData` is the cumulative service's output (one entry per cell with stock);
 *   `lastMonthIndex` is the last month to report (0 = April), or null for a past
 *   year reported in full. `invalid` is set instead when the year is unusable.
 */
const loadCumulativeCellInventory = async (selectedYear) => {
  if (!selectedYear || typeof selectedYear !== "string")
    return { invalid: "selectedYear is required" };

  const fyStartYear = Number(selectedYear.slice(0, 4));
  if (!Number.isInteger(fyStartYear))
    return { invalid: "selectedYear is not valid" };

  // A year still running is reported up to the current month only.
  const currentFyStart = Number(gettingFYYear(new Date()).slice(0, 4));
  const currentMonthIndex = (moment().tz(IST).month() + 9) % 12;
  const lastMonthIndex =
    fyStartYear === currentFyStart
      ? currentMonthIndex
      : fyStartYear > currentFyStart
        ? -1
        : null;

  const [mastersRead, issuanceSheets] = await Promise.all([
    SpareMaster.aggregate([
      { $addFields: addFieldsForInventoryBifurcation },
      {
        $project: {
          "cell._id": 1,
          "cell.cell_name": 1,
          ageBucket: 1,
          quantity: { $sum: "$costDetails.quantity" },
          cost: {
            $sum: {
              $map: {
                input: { $ifNull: ["$costDetails", []] },
                as: "tranche",
                in: {
                  $multiply: [
                    { $ifNull: ["$$tranche.quantity", 0] },
                    { $ifNull: ["$$tranche.costInINR", 0] },
                  ],
                },
              },
            },
          },
          legacyIssuedQty: { $sum: "$costDetails.issuedQty" },
          lastIssuedDate: 1,
          createDate: 1,
          dateTime: 1,
          rsTimeStamp: 1,
        },
      },
    ]).allowDiskUse(true),
    SpareIssuanceSummary.aggregate([
      { $unwind: "$changeParts" },
      { $match: { "changeParts.isStockOut": true } },
      {
        $project: {
          updatedAt: 1,
          "changeParts.masterId": 1,
          "changeParts.consumption": 1,
          "changeParts.dynamicApprovalKeys": 1,
          "changeParts.approvalOfMTD_TL": 1,
          "changeParts.approvalOfMTD_HOSS": 1,
          "changeParts.approvalOfPRD_TL": 1,
          "changeParts.approvalOfPRD_HOSS": 1,
          "changeParts.approvalOfMTD_HOS": 1,
          "changeParts.approvalOfPRD_HOS": 1,
          "changeParts.approvalOfMTD_HOD": 1,
          "changeParts.approvalOfPRD_HOD": 1,
          "changeParts.approvalOfTOOL_ROOM": 1,
        },
      },
    ]),
  ]);

  const masters = mastersRead.map((master) => ({
    ...master,
    cell: master.cell?._id ? master.cell : null,
    receivedMonthKey: receivedMonthKeyOf(master),
    legacyIssuedMonthKey: monthKeyOfDate(master.lastIssuedDate),
  }));

  const issues = issuanceSheets
    .filter(({ changeParts }) => changeParts?.masterId)
    .map(({ changeParts, updatedAt }) => ({
      masterId: changeParts.masterId,
      quantity: Number(changeParts.consumption?.quantity) || 0,
      monthKey: issueMonthKeyOf(changeParts, updatedAt),
    }))
    .filter((issue) => issue.quantity > 0 && issue.monthKey !== null);

  const rawData = buildCumulativeCellInventory({
    masters,
    issues,
    fyStartYear,
    lastMonthIndex,
  });

  return { rawData, lastMonthIndex };
};

exports.getInventoryBifurcationEachCellWise = tryCatchHandler(
  async (req, res, next) => {
    const { selectedYear } = req.query;

    const { rawData, lastMonthIndex, invalid } =
      await loadCumulativeCellInventory(selectedYear);

    if (invalid) return res.status(400).json({ message: invalid });

    if (!rawData?.length)
      return res.status(404).json({ message: "No data found" });

    const AGE_BUCKETS = [
      {
        key: "GRATER_THEN_10",
        label: "No Rotation >10 yr",
        type: "bar",
        stack: "bar-stacked",
        backgroundColor: "hsl(90, 65%, 62%)",
        borderColor: "#fff",
        borderWidth: 1,
      },
      {
        key: "5_TO_10",
        label: "Rotation Cycle 5~10 years",
        type: "bar",
        stack: "bar-stacked",
        backgroundColor: "hsl(0, 65%, 62%)",
        borderColor: "#fff",
        borderWidth: 1,
      },
      {
        key: "1_TO_5",
        label: "Rotation Cycle 1~5 year",
        type: "bar",
        stack: "bar-stacked",
        backgroundColor: "hsl(180, 65%, 62%)",
        borderColor: "#fff",
        borderWidth: 1,
      },
      {
        key: "LESS_THEN_1",
        label: "Rotation Cycle < 1 year",
        type: "bar",
        stack: "bar-stacked",
        backgroundColor: "hsl(270, 65%, 62%)",
        borderColor: "#fff",
        borderWidth: 1,
      },
    ];

    // The targets set for these cells in this year, one line per cell.
    const cellTargets = await SpareCellInventoryTarget.find(
      {
        financialYear: selectedYear,
        cell: { $in: rawData.map(({ cell }) => cell?._id).filter(Boolean) },
      },
      { cell: 1, target: 1 },
    ).lean();

    const targetByCell = new Map(
      cellTargets.map(({ cell, target }) => [String(cell), target]),
    );

    const reportedMonths = lastMonthIndex === null ? 12 : lastMonthIndex + 1;
    const noStock = Array.from({ length: 12 }, (_, index) =>
      index < reportedMonths ? 0 : null,
    );

    const chartData = rawData.map(({ cell, buckets }) => {
      const datasets = AGE_BUCKETS.map((bucket) => {
        const found = buckets[bucket.key];

        return {
          ...bucket,
          // The chart plots what the stock is worth, in millions of rupees.
          data: (found?.cost ?? noStock).map((value) =>
            value === null ? null : convertCostInMilUnitInJS(value),
          ),
          // Carried for downloads; deliberately not drawn on the chart.
          quantity: found?.qty ?? noStock,
        };
      });

      const target = cell?._id ? targetByCell.get(String(cell._id)) : null;

      // Drawn over the bars, on the same cost axis they use.
      if (target)
        datasets.unshift({
          type: "line",
          label: "Target",
          data: target,
          borderColor: "#9F0000",
          backgroundColor: "#9F0000",
          pointStyle: "rectRot",
        });

      return {
        _id: cell?._id ?? null,
        cell: cell ?? { cell_name: "Unassigned cell" },
        datasets,
        hasTarget: Boolean(target),
      };
    });

    return res.status(200).json({
      message: "Data get successfully",
      chartData: {
        labels: allMonthsStr,
        data: chartData,
      },
    });
  },
);

/**
 * The target a cell has for a year, for the popup to open with. Cells without
 * one come back as twelve zeros, so the form always has something to edit.
 */
exports.getCellInventoryTarget = tryCatchHandler(async (req, res, next) => {
  const { selectedYear, cellId } = req.query;

  const problem = validateCellTargetInput({
    selectedYear,
    cellId,
    target: Array(12).fill(0),
  });
  if (problem)
    return res.status(400).json({ message: problem, showToast: true });

  const stored = await SpareCellInventoryTarget.findOne(
    { financialYear: selectedYear, cell: cellId },
    { target: 1 },
  ).lean();

  return res.status(201).json({
    message: "Target get successfully",
    target: stored?.target ?? Array(12).fill(0),
  });
});

/** Saves (adds or replaces) one cell's monthly target for one financial year. */
exports.saveCellInventoryTarget = tryCatchHandler(async (req, res, next) => {
  const { selectedYear, cellId, target } = req.body ?? {};

  const problem = validateCellTargetInput({ selectedYear, cellId, target });
  if (problem)
    return res.status(400).json({ message: problem, showToast: true });

  const cell = await Cell.findById(cellId, { cell_name: 1 }).lean();
  if (!cell)
    return res.status(404).json({
      message: "Cell does not exist",
      showToast: true,
    });

  const saved = await SpareCellInventoryTarget.findOneAndUpdate(
    { financialYear: selectedYear, cell: cellId },
    {
      $set: { target: normalizedTarget(target), updatedBy: req.rootUser?._id },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean();

  return res.status(201).json({
    message: `Target for ${cell.cell_name} saved for ${selectedYear}`,
    showToast: true,
    target: saved.target,
  });
});

exports.getNewSparesOrderingTrend = tryCatchHandler(async (req, res, next) => {
  const { selectedYear } = req.query;

  if (!selectedYear || typeof selectedYear !== "string")
    return res.status(400).json({ message: "selectedYear is required" });

  const spareOrderData = await RequestSheetOfSpare.aggregate([
    {
      $match: {
        "rsTimeStamp.year.inString": selectedYear,
      },
    },
    {
      $addFields: {
        changePartsTotals: {
          $reduce: {
            input: { $ifNull: ["$changeParts", []] },
            initialValue: { qty: 0, cost: 0 },
            in: {
              qty: {
                $add: [
                  "$$value.qty",
                  { $ifNull: ["$$this.quantityRequired", 0] },
                ],
              },
              cost: {
                $add: [
                  "$$value.cost",
                  {
                    $multiply: [
                      { $ifNull: ["$$this.quantityRequired", 0] },
                      { $ifNull: ["$$this.approxUnitPrice", 0] },
                    ],
                  },
                ],
              },
            },
          },
        },
      },
    },
    {
      $group: {
        _id: { cellId: "$cell._id", month: "$rsTimeStamp.month.inString" },
        cell: { $first: "$cell" },
        totalNewSpareOrders: { $sum: "$changePartsTotals.qty" },
        costInINR: { $sum: "$changePartsTotals.cost" },
      },
    },
    {
      $group: {
        _id: "$_id.cellId",
        cell: { $first: "$cell" },
        dataWithMonth: {
          $push: {
            month: "$_id.month",
            totalNewSpareOrders: "$totalNewSpareOrders",
            costInINR: convertCostInMilUnitInMongoose("$costInINR"),
          },
        },
      },
    },
    {
      $project: {
        label: "$cell.cell_name",
        data: {
          $map: {
            input: allMonths,
            as: "month",
            in: {
              $cond: [
                { $in: ["$$month.monthName", "$dataWithMonth.month"] },
                {
                  $arrayElemAt: [
                    "$dataWithMonth",
                    {
                      $indexOfArray: [
                        "$dataWithMonth.month",
                        "$$month.monthName",
                      ],
                    },
                  ],
                },
                {
                  month: "$$month.monthName",
                  totalNewSpareOrders: 0,
                  costInINR: 0,
                },
              ],
            },
          },
        },
      },
    },
  ]).allowDiskUse(true);

  if (!spareOrderData?.length)
    return res.status(404).json({ message: "No data found" });

  const dataLength = spareOrderData.length;

  const datasets = spareOrderData.map(({ label, data }, index) => {
    const values = [];
    const costInINR = [];
    for (const d of data) {
      values.push(d.totalNewSpareOrders);
      costInINR.push(d.costInINR);
    }
    return {
      type: "bar",
      stack: "bar-stacked",
      backgroundColor: `hsl(${Math.round((360 / dataLength) * index)}, 65%, 62%)`,
      borderColor: "#fff",
      borderWidth: 1,
      label,
      data: values,
      costInINR,
    };
  });

  return res.status(200).json({
    message: "Data get successfully",
    chartData: {
      labels: allMonthsStr,
      datasets,
    },
  });
});

exports.getTemporaryPartIssueTrend = tryCatchHandler(async (req, res, next) => {
  const { selectedYear } = req.query;

  if (!selectedYear || typeof selectedYear !== "string") {
    return res.status(400).json({ message: "selectedYear is required" });
  }

  const spareOrderData = await SpareIssuanceSummary.aggregate([
    {
      $match: {
        "rsTimeStamp.year.inString": selectedYear,
      },
    },
    {
      $unwind: "$changeParts",
    },
    {
      $match: {
        "changeParts.temporaryOrPermanent": "Temporary",
      },
    },
    ...req.budgetCalculationPipeline,
    {
      $addFields: {
        budgetDetails: budgetDetailsProjection,
      },
    },
    {
      $group: {
        _id: { cellId: "$cell._id", month: "$rsTimeStamp.month.inString" },
        cell: { $first: "$cell" },
        totalTemporaryPartIssued: { $sum: "$changeParts.quantityRequired" },
        requiredBudget: {
          $sum: "$budgetDetails.issuanceSheetRequired.requiredBudget",
        },
      },
    },
    {
      $group: {
        _id: "$_id.cellId",
        cell: { $first: "$cell" },
        dataWithMonth: {
          $push: {
            month: "$_id.month",
            totalTemporaryPartIssued: "$totalTemporaryPartIssued",
            costInINR: convertCostInMilUnitInMongoose("$requiredBudget"),
          },
        },
      },
    },
    {
      $project: {
        label: "$cell.cell_name",
        data: {
          $map: {
            input: allMonths,
            as: "month",
            in: {
              $cond: [
                { $in: ["$$month.monthName", "$dataWithMonth.month"] },
                {
                  $arrayElemAt: [
                    "$dataWithMonth",
                    {
                      $indexOfArray: [
                        "$dataWithMonth.month",
                        "$$month.monthName",
                      ],
                    },
                  ],
                },
                {
                  month: "$$month.monthName",
                  totalTemporaryPartIssued: 0,
                  costInINR: 0,
                },
              ],
            },
          },
        },
      },
    },
  ]).allowDiskUse(true);

  if (!spareOrderData?.length)
    return res.status(404).json({ message: "No data found" });

  const dataLength = spareOrderData.length;

  const datasets = spareOrderData.map(({ label, data }, index) => {
    const values = [];
    const costInINR = [];
    for (const d of data) {
      values.push(d.totalTemporaryPartIssued);
      costInINR.push(d.costInINR);
    }
    return {
      type: "bar",
      stack: "bar-stacked",
      backgroundColor: `hsl(${Math.round((360 / dataLength) * index) + 200}, 60%, 45%)`,
      borderColor: "#fff",
      borderWidth: 1,
      label,
      data: values,
      costInINR,
    };
  });

  return res.status(200).json({
    message: "Data get successfully",
    chartData: {
      labels: allMonthsStr,
      datasets,
    },
  });
});

exports.getReceivingInspectionManufacturingParts = tryCatchHandler(
  async (req, res, next) => {
    const requestSheetData = await RequestSheetOfSpare.aggregate([
      { $match: req.$match },
      {
        $project: {
          masterId: 1,
          changeParts: {
            $filter: {
              input: "$changeParts",
              as: "cp",
              cond: {
                $and: [
                  {
                    $eq: [
                      "$$cp.standerOrManufacturingPart",
                      "Manufacturing Parts",
                    ],
                  },
                  {
                    $in: [
                      { $ifNull: ["$$cp.rsMRNApprovedTimeStamp", null] },
                      ["", null],
                    ],
                  },
                ],
              },
            },
          },
        },
      },
      { $match: { "changeParts.0": { $exists: true } } },
      { $unwind: "$changeParts" },
      {
        $lookup: {
          from: "sparemasters",
          localField: "changeParts.masterId",
          foreignField: "_id",
          let: { rsPartId: "$changeParts._id" },
          pipeline: [
            {
              $project: {
                costDetail: {
                  $first: {
                    $filter: {
                      input: "$costDetails",
                      as: "cd",
                      cond: { $eq: ["$$cd.partId", "$$rsPartId"] },
                    },
                  },
                },
              },
            },
            { $match: { costDetail: { $ne: null } } },
          ],
          as: "spareMaster",
        },
      },
      { $unwind: "$spareMaster" },
      {
        $match: {
          $expr: {
            $lte: [
              "$changeParts.quantityRequired",
              "$spareMaster.costDetail.quantity",
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$changeParts.quantityRequired" },
          pending: {
            $sum: {
              $cond: [
                {
                  $in: [
                    {
                      $ifNull: ["$changeParts.rsPartInspectionTimeStamp", null],
                    },
                    [null, ""],
                  ],
                },
                "$changeParts.quantityRequired",
                0,
              ],
            },
          },
          completed: {
            $sum: {
              $cond: [
                {
                  $in: [
                    {
                      $ifNull: ["$changeParts.rsPartInspectionTimeStamp", null],
                    },
                    [null, ""],
                  ],
                },
                0,
                "$changeParts.quantityRequired",
              ],
            },
          },
        },
      },
    ])
      .option({ maxTimeMS: 8000 })
      .read("secondaryPreferred");

    if (requestSheetData?.length <= 0)
      return res.status(404).json({
        message: "No data to display",
      });

    const { total, pending, completed } = requestSheetData?.[0];

    const pendingPercent =
      total === 0 ? 0 : Number(((pending / total) * 100).toFixed(2));
    const completedPercent =
      total === 0 ? 0 : Number(((completed / total) * 100).toFixed(2));

    return res.status(200).json({
      message: "Data fetched successfully",
      counters: {
        labels: ["Insp Completed", "Insp Pending"],
        data1: [completedPercent, pendingPercent],
        data2: [completed, pending],
      },
    });
  },
);
