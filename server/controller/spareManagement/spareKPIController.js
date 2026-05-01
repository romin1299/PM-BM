const tryCatchHandler = require("../../errorHandler/tryCatchHandler");
const RequestSheetOfSpare = require("../../model/requestSheetDataOfSpare");

exports.getRequestSheets = tryCatchHandler(async (req, res, next) => {
  return res.status(201).json({
    message: "Request-sheets get successfully",
    tableData: req.tableData,
  });
});

exports.getSpareSheetsSummery = tryCatchHandler(async (req, res, next) => {
  const counters = await RequestSheetOfSpare.aggregate([
    {
      $match: req.queryObj,
    },
    {
      $group: {
        _id: null,
        totalRequestSheet: {
          $sum: 1,
        },
        openRequestSheet: {
          $sum: {
            $cond: [
              {
                $ne: ["$requestSheetStatus", "Completed"],
              },
              1,
              0,
            ],
          },
        },
        closedRequestSheet: {
          $sum: {
            $cond: [
              {
                $eq: ["$requestSheetStatus", "Completed"],
              },
              1,
              0,
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

  return res.status(201).json({
    message: "Spare sheet summery get successfully",
    counters: counters?.[0],
  });
});
