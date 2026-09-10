const mongoose = require("mongoose");
const moment = require("moment");
const tryCatchHandler = require("../../errorHandler/tryCatchHandler");

// const Cell = require("../../model/cellSchema");
const RequestSheetOfSpare = require("../../model/requestSheetDataOfSpare");
const SpareMaster = require("../../model/spareMasterSchema");
const MachineCost = require("../../model/machineCostSchema");
const SpareIssuanceSummary = require("../../model/spareIssuanceSummarySchema");
const SpareInventoryTarget = require("../../model/spareInventoryTargetSchema");
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

const dateBasedOnLastUpdate = {
  $dateDiff: {
    startDate: "$updatedAt",
    endDate: new Date(),
    unit: "year",
  },
};

const addFieldsForInventoryBifurcation = {
  ageBucket: {
    $switch: {
      branches: [
        {
          case: {
            $lt: [dateBasedOnLastUpdate, 1],
          },
          then: "LESS_THEN_1",
        },
        {
          case: {
            $lt: [dateBasedOnLastUpdate, 5],
          },
          then: "1_TO_5",
        },
        {
          case: {
            $lt: [dateBasedOnLastUpdate, 10],
          },
          then: "5_TO_10",
        },
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

const inventoryBifurcationPipeline = [
  {
    $group: {
      _id: "$ageBucket",
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
              title: "Dead stock",
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

exports.getInventorySummery = tryCatchHandler(async (req, res, next) => {
  const summery = await SpareMaster.aggregate([
    {
      $match: req.$match,
    },
    {
      $unwind: "$costDetails",
    },
    {
      $group: {
        _id: null,
        overAllAvailableQty: {
          $sum: { $ifNull: ["$costDetails.availableQty", 0] },
        },
        overAllCostInINR: {
          $sum: { $ifNull: ["$costDetails.overAllCost", 0] },
        },
      },
    },
    {
      $project: {
        _id: 0,
        overAllAvailableQty: 1,
        overAllCostInINR: convertCostInMilUnitInMongoose("$overAllCostInINR"),
      },
    },
  ]);

  if (summery?.length <= 0)
    return res.status(400).json({
      message: "No summery found",
    });

  const [{ overAllAvailableQty, overAllCostInINR }] = summery;

  let counters = [
    {
      title: "Inventory Cost (Mil.)",
      value: overAllCostInINR || 0,
    },
    {
      title: "Inventory Count (Nos.)",
      value: overAllAvailableQty || 0,
    },
  ];

  if (req.query?.withHoldingRation === "Yes") {
    const machineCostDetails = await MachineCost.findOne({
      ID: "MC1",
    });

    counters.push({
      title: "Holding ratio",
      value:
        Number(
          (overAllCostInINR / machineCostDetails?.machineCost).toFixed(2),
        ) || 0,
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

exports.IsToolRoomPerson = tryCatchHandler(async (req, res, next) => {
  if (req.rootUser?.toolRoomPerson === "No")
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
      counters,
    });
  },
);

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
  const { selectedYear } = req.query;

  const machineCostDetails = await MachineCost.findOne({
    ID: "MC1",
  });

  const machineCost = machineCostDetails?.machineCost || 1;

  const cellWiseData = await SpareMaster.aggregate([
    {
      $match: {
        "rsTimeStamp.year.inString": selectedYear,
      },
    },
    {
      $unwind: "$costDetails",
    },
    {
      $group: {
        _id: { cellId: "$cell._id", month: "$rsTimeStamp.month.inString" },
        cell: { $first: "$cell" },
        // overAllAvailableQty: {
        //   $sum: { $ifNull: ["$costDetails.availableQty", 0] },
        // },
        overAllCostInINR: {
          $sum: { $ifNull: ["$costDetails.overAllCost", 0] },
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
            data: {
              $round: [
                {
                  $divide: ["$overAllCostInINR", machineCost],
                },
                2,
              ],
            },
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
                    "$dataWithMonth.data",
                    {
                      $indexOfArray: [
                        "$dataWithMonth.month",
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

  if (cellWiseData?.length <= 0)
    return res.status(404).json({
      message: "No data found",
    });

  const dataLength = cellWiseData?.length;

  let datasets = [];

  const target = await SpareInventoryTarget.findOne({
    ID: "IN_TARGET",
  });

  if (target)
    datasets.push({
      type: "line",
      label: "Target",
      data: target?.inventoryTarget,
      borderColor: "#9F0000",
      backgroundColor: "#9F0000",
      pointStyle: "rectRot",
    });

  cellWiseData?.map((item, index) => {
    datasets.push({
      type: "bar",
      stack: "bar-stacked",
      backgroundColor: `hsl(${Math.round((360 / dataLength) * index)}, 65%, 62%)`,
      borderColor: "#fff",
      borderWidth: 1,
      ...item,
    });
  });

  return res.status(201).json({
    message: "Data get successfully",
    chartData: {
      labels: allMonthsStr,
      datasets,
    },
  });
});

exports.getInventoryBifurcation = tryCatchHandler(async (req, res, next) => {
  const counters = await SpareMaster.aggregate([
    {
      $match: req.$match,
    },
    {
      $addFields: addFieldsForInventoryBifurcation,
    },
    ...inventoryBifurcationPipeline,
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
      data: [item?.value?.availableQty],
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
        $group: {
          _id: {
            timeFrame: "$ageBucket",
            cellId: "$cell._id",
          },
          cell: { $first: "$cell" },
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
          labels: { $push: "$cell.cell_name" },
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
        data: item?.availableQty,
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
  const { selectedYear, requestFor } = req.query;

  if (typeof selectedYear !== "string" || !selectedYear) {
    return res.status(400).json({
      message: "selectedYear is required",
    });
  }

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
        "rsTimeStamp.year.inString": selectedYear,
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
        availableQty: { $sum: "$stockTotals.overAllAvailableQty" },
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

  const availableQty = allLevels.map(
    (level) => dataByStockLevel.get(level)?.availableQty || 0,
  );
  const costInINR = allLevels.map(
    (level) =>
      convertCostInMilUnitInJS(dataByStockLevel.get(level)?.costInINR) || 0,
  );

  if (requestFor === "pie") {
    const totalCostInINR = costInINR.reduce((sum, value) => sum + value, 0);

    const pieEntries = allLevels
      .map((level, index) => {
        const rawCost = costInINR[index];
        const percentage =
          totalCostInINR > 0
            ? Number(((rawCost / totalCostInINR) * 100).toFixed(2))
            : 0;

        return { label: labels[index], percentage, rawCost };
      })
      .filter((entry) => entry.percentage > 0);

    return res.status(200).json({
      message: "Data fetched successfully",
      counters: {
        labels: pieEntries.map((entry) => entry.label),
        data1: pieEntries.map((entry) => entry.percentage),
        data2: pieEntries.map((entry) => entry.rawCost),
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
          label: "Cost in INR",
          data: costInINR,
          borderColor: "#7F7F7F",
          backgroundColor: "#7F7F7F",
          pointStyle: "circle",
          yAxisID: "y1",
        },
        {
          type: "bar",
          label: "Available Quantity",
          data: availableQty,
          backgroundColor: "#70AD47",
          borderColor: "#fff",
          borderWidth: 1,
          yAxisID: "y",
        },
      ],
    },
  });
});

exports.getZeroStockPartList = tryCatchHandler(async (req, res, next) => {
  const { requestFor } = req.query;
  let $match = req.$match;

  if (requestFor === "reasonForKeepingDeadStock") {
    $match.$expr = {
      $lt: [dateBasedOnLastUpdate, 1],
    };
  }

  const tableData = await SpareMaster.aggregate([
    {
      $match: req.$match,
    },
    {
      $project: {
        budgetDetails: addFieldsForInventoryBifurcation?.budgetDetails,
        location: 1,
        partName: 1,
        partModel: 1,
        [`${requestFor}Remarks`]: 1,
        line: 1,
        machine: 1,
      },
    },
    {
      $match: {
        "budgetDetails.overAllAvailableQty": { $lte: 0 },
      },
    },
  ]);

  if (tableData?.length <= 0)
    return res.status(404).json({
      message: "No data found",
    });

  return res.status(201).json({
    message: "Data get successfully",
    tableData,
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
            label: "Cum Plant",
            data: "$cumulativePlan",
            borderColor: "#fdb515",
            backgroundColor: "#fdb515",
            pointStyle: "rectRot",
          },
          {
            type: "line",
            label: "Cum Actual",
            data: "$cumulativeActual",
            borderColor: "#667788",
            backgroundColor: "#667788",
            pointStyle: "rectRot",
          },
          {
            type: "bar",
            stack: "bar-stacked",
            label: "Monthly Plant",
            data: "$plan",
            backgroundColor: "#4A6EA8",
            borderRadius: 4,
            pointStyle: "rect",
          },
          {
            type: "bar",
            label: "Monthly Actual",
            data: "$actual",
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

exports.getInventoryBifurcationEachCellWise = tryCatchHandler(
  async (req, res, next) => {
    const { selectedYear } = req.query;

    if (!selectedYear || typeof selectedYear !== "string") {
      return res.status(400).json({ message: "selectedYear is required" });
    }

    const rawData = await SpareMaster.aggregate([
      {
        $match: {
          "rsTimeStamp.year.inString": selectedYear,
        },
      },
      {
        $addFields: addFieldsForInventoryBifurcation,
      },
      {
        $group: {
          _id: {
            cellId: "$cell._id",
            month: "$rsTimeStamp.month.inString",
            timeFrame: "$ageBucket",
          },
          cell: { $first: "$cell" },
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
          entries: {
            $push: {
              month: "$_id.month",
              timeFrame: "$_id.timeFrame",
              availableQty: "$availableQty",
              costInINR: convertCostInMilUnitInMongoose("$costInINR"),
            },
          },
        },
      },
    ]).allowDiskUse(true);

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

    const chartData = rawData.map(({ _id: cellId, cell, entries }) => {
      const lookup = new Map(
        entries.map((e) => [`${e.timeFrame}_${e.month}`, e]),
      );

      const datasets = AGE_BUCKETS.map((bucket) => {
        const data = [];
        const costInINR = [];
        for (const month of allMonths) {
          const entry = lookup.get(`${bucket.key}_${month.monthName}`);
          data.push(entry ? entry.availableQty : 0);
          costInINR.push(entry ? entry.costInINR : 0);
        }

        return {
          ...bucket,
          data,
          costInINR,
        };
      });

      return { _id: cellId, cell, datasets };
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
