const mongoose = require("mongoose");
const tryCatchHandler = require("../../errorHandler/tryCatchHandler");

const RequestSheetOfSpare = require("../../model/requestSheetDataOfSpare");

const filterKeys = {
  "based-on-plant": "plant",
  "based-on-section": "section",
  "based-on-subSection": "subSection",
  "based-on-cell": "cell",
  "based-on-line": "line",
  "based-on-machine": "machine",
};

exports.spareFilterMiddleware = tryCatchHandler(async (req, res, next) => {
  // {
  //     flagForTogglingFilter: 'based-on-section',
  //     selectedValue: '6322e558fdb4a3119153b9c2',
  //     selectedYear: '2025-2026'
  //   }

  if (!req.query.selectedValue || !req.query.flagForTogglingFilter)
    return res.status(400).json({
      message: "Please provide the required filter value",
      showToast: true,
    });

  const { selectedValue, flagForTogglingFilter } = req.query;

  req.queryObj = {
    [`${filterKeys?.[flagForTogglingFilter]}._id`]:
      mongoose.Types.ObjectId(selectedValue),
  };

  // PENDING : Selected Year
  return next();
});

exports.getSpareRequestSheets = tryCatchHandler(async (req, res, next) => {
  const tableData = await RequestSheetOfSpare.aggregate([
    {
      $match: req.queryObj,
    },
    {
      $project: {
        requestSheetNo: 1,
        cell: 1,
        line: 1,
        machine: 1,
        requestSheetStatus: 1,
        partQty: 1,
        "budget.budgetStatus": 1,
      },
    },
  ]);

  if (tableData?.length <= 0)
    return res.status(400).json({
      message: "No spare sheets to display",
      showToast: true,
    });

  req.tableData = tableData;
  return next();
});
