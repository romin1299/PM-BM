const moment = require("moment");
const mongoose = require("mongoose");
const tryCatchHandler = require("../../errorHandler/tryCatchHandler");

const RequestSheetOfSpare = require("../../model/requestSheetDataOfSpare");
const SpareMaster = require("../../model/spareMasterSchema");

const { generateTimestampIndividually } = require("../../utils/spareTimestamp");

exports.getDefaultValueForMasterRegistration = tryCatchHandler(
  async (req, res, next) => {
    const { _id } = req.query;

    if (_id) {
      if (!mongoose.Types.ObjectId.isValid(_id))
        return res.status(400).json({
          success: false,
          message: "Invalid ObjectId format",
        });

      const master = await SpareMaster.findOne(
        {
          _id,
        },
        {
          _id: 1,
          whichParts: 1,
          location: 1,
          uniqueID: 1,
          partName: 1,
          unit: 1,
          partModel: 1,
          partGroup: 1,
          maker: 1,
          registerSection: 1,
          supplierName: 1,
          vendorGroup: 1,
          minQuantity: 1,
          maxQuantity: 1,
          leadTime: 1,
          quantityRequired: 1,
          machine: 1,
          status: 1,
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
          createdBy: 1,
          costDetails: 1,
          dateTime: 1,
        },
      );

      if (master)
        return res.status(201).json({
          message: "Master get successfully",
          master,
        });
    }

    const { sheetId, partId } = req.query;

    if (
      !mongoose.Types.ObjectId.isValid(sheetId) ||
      !mongoose.Types.ObjectId.isValid(partId)
    )
      return res.status(400).json({
        success: false,
        message: "Invalid ObjectId format",
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
          maxQuantity: "$changeParts.maxQuantity",
          quantityRequired: "$changeParts.quantityRequired",
          maker: "$changeParts.maker",
          supplierName: "$changeParts.supplierName",
          supplierCategory: "$changeParts.supplierCategory",
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
      master: {
        ...tableData?.[0],
        dateTime: {
          inString: moment().format("YYYY-MM-DDTHH:mm"),
          inDate: null,
        },
      },
    });
  },
);

exports.handleMasterConfiguration = tryCatchHandler(async (req, res, next) => {
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

  const existingRSSheet = await RequestSheetOfSpare.findOne(
    {
      _id: sheetId,
    },
    {
      machine: 1,
      line: 1,
      cell: 1,
      subSection: 1,
      section: 1,
      plant: 1,
    },
  );

  if (!existingRSSheet)
    return res.status(400).json({
      success: false,
      message: "Request sheet does not exists",
    });

  const { machine, line, cell, subSection, section, plant } = existingRSSheet;

  req.body["machine"] = machine;
  req.body["line"] = line;
  req.body["cell"] = cell;
  req.body["subSection"] = subSection;
  req.body["section"] = section;
  req.body["plant"] = plant;

  req.body["createdBy"] = req.rootUser;
  req.body["rsTimeStamp"] = generateTimestampIndividually();

  let { inString } = req.body?.dateTime;

  if (!inString) inString = new Date();

  req.body["dateTime"] = {
    inString: moment(inString).format("YYYY-MM-DDTHH:mm"),
    inDate: moment(inString),
  };

  const master = await new SpareMaster(req.body).save();

  await RequestSheetOfSpare.findOneAndUpdate(
    {
      _id: sheetId,
    },
    {
      $set: {
        "changeParts.$[part].masterId": master?._id,
      },
    },
    {
      arrayFilters: [{ "part._id": partId }],
    },
  );

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

  await SpareMaster.findOneAndUpdate(req.query, req.body);

  return res.status(201).json({
    message: "Master updated successfully",
  });
});
