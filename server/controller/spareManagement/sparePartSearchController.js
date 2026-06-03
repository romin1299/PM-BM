const mongoose = require("mongoose");

const tryCatchHandler = require("../../errorHandler/tryCatchHandler");
const SpareMaster = require("../../model/spareMasterSchema");
const { paginationRowLimit } = require("../../utils/spareManagementUtils");

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

  const tableData = await SpareMaster.aggregate([
    {
      $match,
    },
    { $sort: { _id: -1 } },
    { $limit: paginationRowLimit },
    {
      $project: {
        _id: 1,
        whichParts: 1,
        location: 1,
        uniqueID: 1,
        partName: 1,
        // unit: 1,
        partModel: 1,
        // partGroup: 1,
        // manufacture: 1,
        // registerSection: 1,
        // supplier: 1,
        stockQty: 1,
        // currencyUnit: 1,
        // vendorGroup: 1,
        // minQuantity: 1,
        // leadTime: 1,
        // quantityRequired: 1,
        machine: 1,
        plantName: "$createdBy.plant_data",
        // status: 1,
        // createdBy: 1,
      },
    },
  ]);

  if (tableData?.length <= 0)
    return res.status(400).json({
      message: "No spare details to display",
      showToast: true,
    });

  return res.status(201).json({
    message: "Spare details get successfully",
    tableData,
    nextCursor: tableData.length ? tableData[tableData.length - 1]._id : null,
    hasMore: tableData.length >= paginationRowLimit,
  });
});

exports.getSearchPartsBasedOnLocation = tryCatchHandler(
  async (req, res, next) => {
    if (!req.query?.location)
      return res.status(400).json({
        message: "Please provide required search text",
      });

    const tableData = await SpareMaster.aggregate([
      {
        $match: req.query,
      },
      {
        $project: {
          _id: 1,
          whichParts: 1,
          location: 1,
          uniqueID: 1,
          partName: 1,
          // unit: 1,
          partModel: 1,
          // partGroup: 1,
          manufacture: 1,
          // registerSection: 1,
          // supplier: 1,
          stockQty: 1,
          // currencyUnit: 1,
          // vendorGroup: 1,
          // minQuantity: 1,
          // leadTime: 1,
          // quantityRequired: 1,
          machine: 1,
          // status: 1,
          // createdBy: 1,
        },
      },
    ]);

    if (tableData?.length <= 0)
      return res.status(400).json({
        message: "No spare details to display",
        showToast: true,
      });

    return res.status(201).json({
      message: "Spare details get successfully",
      master: tableData?.[0],
    });
  },
);
