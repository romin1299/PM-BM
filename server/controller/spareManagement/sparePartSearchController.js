const mongoose = require("mongoose");

const tryCatchHandler = require("../../errorHandler/tryCatchHandler");
const {
  paginationRowLimit,
  buildSearchQuery,
} = require("../../utils/spareManagementUtils");

const Plant = require("../../model/plantSchema");
const RequestSheetOfSpare = require("../../model/requestSheetDataOfSpare");

exports.searchFilter = tryCatchHandler(async (req, res, next) => {
  if (!req.query?.search)
    return res.status(400).json({
      message: "Please provide search text",
    });

  req.queryObj = {
    $text: {
      $search: buildSearchQuery(req.query?.search),
    },
  };

  return next();
});
