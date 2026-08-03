const moment = require("moment");
const tryCatchHandler = require("../../errorHandler/tryCatchHandler");
const RequestSheetOfSpare = require("../../model/requestSheetDataOfSpare");
const SpareMaster = require("../../model/spareMasterSchema");
const MachineCost = require("../../model/machineCostSchema");

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
  const counters = await SpareMaster.aggregate([
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
        overAllCostInINR: {
          $round: [{ $divide: ["$overAllCostInINR", 1000000] }, 1],
        },
      },
    },
  ]);

  if (counters?.length <= 0)
    return res.status(400).json({
      message: "No summery found",
    });

  const [{ overAllAvailableQty, overAllCostInINR }] = counters;

  return res.status(201).json({
    message: "Summery get successfully",
    counters: [
      {
        title: "Inventory Cost (Mil.)",
        value: overAllCostInINR || 0,
      },
      {
        title: "Inventory Count (Nos.)",
        value: overAllAvailableQty || 0,
      },
    ],
  });
});

exports.getSpareSheetsSummeryForKPI = tryCatchHandler(
  async (req, res, next) => {
    const [totalNewSheets, counters] = await Promise.all([
      RequestSheetOfSpare.countDocuments({
        ...req.$match,
        // isNewRequest: true,
      }),
      RequestSheetOfSpare.aggregate([
        {
          $match: req.$match,
        },
        {
          $unwind: "$changeParts",
        },
        {
          $group: {
            _id: {
              cell: "$cell._id",
              maker: "$changeParts.maker",
              batchId: "$changeParts.batchId",
            },
            requestSheetNos: { $push: "$requestSheetNo" },
            rsPRGenerationTimeStamp: {
              $first: "$changeParts.rsPRGenerationTimeStamp",
            },
            rsPOIssueToVendorTimeStamp: {
              $first: "$changeParts.rsPOIssueToVendorTimeStamp",
            },
            // partReceiveCounts: {
            //   $sum: {
            //     $cond: [
            //       { $ifNull: ["$changeParts.rsPartReceiveTimeStamp", false] },
            //       1,
            //       0,
            //     ],
            //   },
            // },
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
        {
          $group: {
            _id: null,
            PRGenerationCounts: {
              $sum: {
                $cond: [{ $ifNull: ["$rsPRGenerationTimeStamp", false] }, 1, 0],
              },
            },
            PRGenerationPendingCounts: {
              $sum: {
                $cond: [{ $ifNull: ["$rsPRGenerationTimeStamp", false] }, 0, 1],
              },
            },
            POIssuePending: {
              $sum: {
                $cond: [
                  { $ifNull: ["$rsPOIssueToVendorTimeStamp", false] },
                  0,
                  1,
                ],
              },
            },
            // partReceiveCounts: {
            //   $sum: {
            //     $cond: [
            //       { $ifNull: ["$changeParts.rsPartReceiveTimeStamp", false] },
            //       1,
            //       0,
            //     ],
            //   },
            // },
            partNotReceiveCounts: {
              $sum: "$partNotReceiveCounts",
            },
          },
        },
      ]),
    ]);

    if (totalNewSheets <= 0 && counters?.length <= 0)
      return res.status(400).json({
        message: "No spare sheet summery found",
      });

    const [
      {
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
          title: "New Requests",
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
      message: "You are not authorizedPerson",
    });

  return next();
});
exports.getMachineCost = tryCatchHandler(async (req, res, next) => {
  const doc = await MachineCost.findOne({
    ID: "MC1",
  });

  if (!doc)
    return res.status(404).json({
      message: "No data to display",
    });

  return res.status(201).json({
    message: "Data get successfully",
    machineCost: doc?.machineCost,
  });
});

exports.registerMachineCost = tryCatchHandler(async (req, res, next) => {
  const doc = new MachineCost({
    ID: "MC1",
    ...req.body,
  });
  await doc.save();

  return res.status(201).json({
    message: "Data get successfully",
    machineCost: doc?.machineCost,
  });
});

exports.updateMachineCost = tryCatchHandler(async (req, res, next) => {
  const doc = await MachineCost.findOneAndUpdate(
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
    machineCost: doc?.machineCost,
  });
});
