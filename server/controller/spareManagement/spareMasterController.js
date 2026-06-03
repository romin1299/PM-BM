const mongoose = require("mongoose");
const tryCatchHandler = require("../../errorHandler/tryCatchHandler");

const RequestSheetOfSpare = require("../../model/requestSheetDataOfSpare");
const SpareMaster = require("../../model/spareMasterSchema");

exports.sheetAndPartIdValidation = tryCatchHandler(async (req, res, next) => {
  const { sheetId, partId } = req.query;

  if (!sheetId || !partId)
    return res.status(400).json({
      success: false,
      message: "Missing required query parameters: sheetId and partId",
    });

  if (
    !mongoose.Types.ObjectId.isValid(sheetId) ||
    !mongoose.Types.ObjectId.isValid(partId)
  )
    return res.status(400).json({
      success: false,
      message: "Invalid ObjectId format",
    });

  return next();
});

exports.getDefaultValueForMasterRegistration = tryCatchHandler(
  async (req, res, next) => {
    const { sheetId, partId } = req.query;

    const master = await SpareMaster.findOne({
      "spareSheet._id": sheetId,
      "spareSheet.partId": partId,
    }).select(
      "_id whichParts location uniqueID partName unit partModel partGroup manufacture registerSection supplier stockQty currencyUnit vendorGroup minQuantity leadTime quantityRequired machine status createdBy",
    );

    if (master)
      return res.status(201).json({
        message: "Master get successfully",
        isMasterExist: true,
        master,
      });

    const tableData = await RequestSheetOfSpare.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId(sheetId),
        },
      },
      {
        $unwind: "$changeParts",
      },
      {
        $match: {
          "changeParts._id": mongoose.Types.ObjectId(partId),
        },
      },
      {
        $project: {
          _id: 0,
          machine: 1,
          partName: "$changeParts.partName",
          partModel: "$changeParts.partModel",
          minQuantity: "$changeParts.minQuantity",
          quantityRequired: "$changeParts.quantityRequired",
          manufacture: "$changeParts.manufacture",
          supplier: "$changeParts.supplier",
        },
      },
    ]);

    if (tableData?.length <= 0)
      return res.status(400).json({
        message: "No spare sheets to display",
        showToast: true,
      });

    return res.status(201).json({
      message: "Master get successfully",
      master: tableData?.[0],
    });
  },
);

exports.handleMasterConfiguration = tryCatchHandler(async (req, res, next) => {
  const { sheetId, partId } = req.query;

  req.body["spareSheet"] = {
    _id: sheetId,
    partId,
  };

  req.body["createdBy"] = req.rootUser;

  await new SpareMaster(req.body).save();

  return res.status(201).json({
    message: "Master registered successfully",
  });
});

exports.handleMasterUpdate = tryCatchHandler(async (req, res, next) => {
  const { _id } = req.query;

  if (!_id)
    return res.status(400).json({
      success: false,
      message: "Missing required query parameters: _id",
    });

  if (!mongoose.Types.ObjectId.isValid(_id))
    return res.status(400).json({
      success: false,
      message: "Invalid ObjectId format",
    });

  await SpareMaster.findOneAndUpdate(req.query, req.body, { new: true });

  return res.status(201).json({
    message: "Master updated successfully",
  });
});
