const mongoose = require("mongoose");

const tryCatchHandler = require("../../errorHandler/tryCatchHandler");
const SpareMaster = require("../../model/spareMasterSchema");
const {
  generateRegexSearchString,
  paginationRowLimit,
} = require("../../utils/spareManagementUtils");

exports.getSearchParts = tryCatchHandler(async (req, res, next) => {
  if (Object.values(req.query)?.length <= 0)
    return res.status(400).json({
      message: "Please provide required search text",
    });

  const { machine_code, ...restQuery } = req.query;

  const $match = restQuery;

  if (req.query.cursor)
    $match._id = { $lt: mongoose.Types.ObjectId(req.query.cursor) };

  if (machine_code) $match["machine.machine_code"] = machine_code;

  req.$match = $match;
  req.otherPipeline = [{ $sort: { _id: -1 } }, { $limit: paginationRowLimit }];

  return next();
});

exports.searchPartResponse = tryCatchHandler(async (req, res, next) => {
  return res.status(201).json({
    message: "Spare details get successfully",
    tableData: req.tableData,
    nextCursor: req.tableData?.length
      ? req.tableData?.[req.tableData?.length - 1]._id
      : null,
    hasMore: req.tableData?.length >= paginationRowLimit,
  });
});

exports.getSearchPartsBasedOnLocation = tryCatchHandler(
  async (req, res, next) => {
    if (!req.query?.location)
      return res.status(400).json({
        message: "Please provide required search text",
      });

    req.$match = req.query;
    req.otherPipeline = [];
    return next();
  },
);

exports.searchPartBasedOnLocationResponse = tryCatchHandler(
  async (req, res, next) => {
    return res.status(201).json({
      message: "Spare details get successfully",
      master: req.tableData?.[0],
    });
  },
);

exports.findSearchMaster = tryCatchHandler(async (req, res, next) => {
  const tableData = await SpareMaster.aggregate([
    { $match: req.$match },
    ...req.otherPipeline,
    {
      $project: {
        _id: 0,
        masterId: "$_id",
        plantName: "$createdBy.plant_data",
        whichParts: 1,
        location: 1,
        uniqueID: 1,
        partName: 1,
        partModel: 1,
        maker: 1,
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
      },
    },
    {
      $addFields: {
        unitCost: {
          $cond: [
            {
              $or: [
                { $eq: ["$budgetDetails.overAllAvailableQty", 0] },
                { $eq: ["$budgetDetails.overAllAvailableQty", null] },
              ],
            },
            0,
            {
              $divide: [
                "$budgetDetails.overAllCostInINR",
                "$budgetDetails.overAllAvailableQty",
              ],
            },
          ],
        },
      },
    },
  ]);

  if (tableData?.length <= 0)
    return res.status(400).json({
      message: "No data to display",
      showToast: true,
    });

  req.tableData = tableData;
  return next();
});

exports.getMasterList = tryCatchHandler(async (req, res, next) => {
  const { search } = req.query;

  if (!search)
    return res.status(400).json({
      showToast: true,
      message: "Enter details to search",
    });

  const searchRegex = generateRegexSearchString(search);

  let $match = {
    $or: [
      { whichParts: searchRegex },
      { location: searchRegex },
      { uniqueID: searchRegex },
      { partName: searchRegex },
      { unit: searchRegex },
      { partModel: searchRegex },
      { partGroup: searchRegex },
      { maker: searchRegex },
      { registerSection: searchRegex },
      { supplierName: searchRegex },
      { currencyUnit: searchRegex },
      { vendorGroup: searchRegex },
      { "createdBy.tm_name": searchRegex },
      { "createdBy.plant_data": searchRegex },
      { "machine.machine_code": searchRegex },
      { "machine.machine_name": searchRegex },
    ],
  };

  if (req.query.cursor)
    $match._id = { $lt: mongoose.Types.ObjectId(req.query.cursor) };

  req.$match = $match;
  req.otherPipeline = [{ $sort: { _id: -1 } }, { $limit: paginationRowLimit }];

  return next();
});

exports.masterListResponse = tryCatchHandler(async (req, res, next) => {
  return res.status(201).json({
    message: "Master details get successfully",
    nextCursor: req.tableData.length
      ? req.tableData[req.tableData.length - 1]._id
      : null,
    hasMore: req.tableData.length >= paginationRowLimit,
    tableData: req.tableData,
  });
});
