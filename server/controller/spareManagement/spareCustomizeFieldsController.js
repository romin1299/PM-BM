const mongoose = require("mongoose");
const tryCatchHandler = require("../../errorHandler/tryCatchHandler");
const {
  Maker,
  Supplier,
  Unit,
  PartGroup,
  VendorGroup,
  SupplierCategory,
} = require("../../model/customizedFieldSchema");

const {
  paginationRowLimit,
  generateRegexSearchString,
} = require("../../utils/spareManagementUtils");

const schema = {
  maker: Maker,
  supplierName: Supplier,
  unit: Unit,
  partGroup: PartGroup,
  vendorGroup: VendorGroup,
  supplierCategory: SupplierCategory,
};

exports.requiredFieldsValidation = tryCatchHandler(async (req, res, next) => {
  if (!req.query?.requestedFor)
    return res.status(400).json({
      message: "Please provide required fields",
      showToast: true,
    });

  return next();
});

exports.getCustomizedFieldValues = tryCatchHandler(async (req, res, next) => {
  const { requestedFor, cursor, search } = req.query;

  let $match = {};

  if (cursor) $match._id = { $lt: mongoose.Types.ObjectId(cursor) };
  if (search) $match[requestedFor] = generateRegexSearchString(search);

  const tableData = await schema[requestedFor].aggregate([
    { $match },
    { $sort: { _id: -1 } },
    { $limit: paginationRowLimit },
  ]);

  return res.status(201).json({
    message: "Data get successfully",
    tableData,
    nextCursor: tableData.length ? tableData[tableData.length - 1]._id : null,
    hasMore: tableData.length === paginationRowLimit,
  });
});

exports.handleRegistration = tryCatchHandler(async (req, res, next) => {
  const { requestedFor } = req.query;

  const row = new schema[requestedFor](req.body);
  await row.save();

  return res.status(201).json({
    message: "Data added successfully",
    row,
  });
});

exports.handleUpdate = tryCatchHandler(async (req, res, next) => {
  const { requestedFor, _id } = req.query;

  if (!_id)
    return res.status(400).json({
      message: "Please select row to update",
      showToast: true,
    });

  delete req.body["_id"];

  const row = await schema[requestedFor].findOneAndUpdate(
    { _id },
    { $set: req.body },
    { new: true },
  );

  return res.status(201).json({
    message: "Data updated successfully",
    row,
  });
});
