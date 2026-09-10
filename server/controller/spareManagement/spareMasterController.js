const moment = require("moment");
const mongoose = require("mongoose");
const tryCatchHandler = require("../../errorHandler/tryCatchHandler");

const RequestSheetOfSpare = require("../../model/requestSheetDataOfSpare");
const SpareMaster = require("../../model/spareMasterSchema");

const unparseJSONData = require("../../utils/unparseJSONData");
const {
  paginationRowLimit,
} = require("../../utils/spareManagementUtils");

const { generateTimestampIndividually } = require("../../utils/spareTimestamp");
const {
  generateMasterUniqueId,
} = require("../../services/spareMaster/masterUniqueIdService");

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
          partNumber: 1,
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

/**
 * Shared shape of a Spare Master row. Kept narrow on purpose: this projection
 * feeds both the dashboard and the CSV export, so every field added here is paid
 * for on both.
 */
const spareMasterRowProjection = {
  uniqueID: 1,
  partNumber: 1,
  partName: 1,
  partModel: 1,
  partGroup: 1,
  maker: 1,
  supplierName: 1,
  supplierCategory: 1,
  vendorGroup: 1,
  unit: 1,
  location: 1,
  whichParts: 1,
  registerSection: 1,
  minQuantity: 1,
  maxQuantity: 1,
  leadTime: 1,
  orderPoint: 1,
  orderQty: 1,
  orderType: 1,
  controlType: 1,
  stockTaking: 1,
  remarks: 1,
  lastIssuedDate: 1,
  previousIssuedDate: 1,
  totalIssuedQty: 1,
  status: 1,
  additionalMachineCodes: 1,
  machineCode: "$machine.machine_code",
  machineName: "$machine.machine_name",
  lineName: "$line.line_name",
  cellName: "$cell.cell_name",
  subSectionName: "$subSection.subSection_name",
  sectionName: "$section.section_name",
  plantName: "$plant.plant_name",
  registeredBy: "$createdBy.tm_name",
  registeredOn: "$dateTime.inString",
  mcSectionName: "$legacyRef.mcSectionName",
  supplierCode: "$legacyRef.supplierCode",
  makerCode: "$legacyRef.makerCode",
  sectionCode: "$legacyRef.sectionCode",
  legacyChangedOn: "$legacyRef.changedOn",

  /**
   * Summed straight over the tranches. $sum over an array path already ignores
   * missing values, so it is the same result as the $reduce accumulator used
   * elsewhere in this module in one cheaper expression.
   */
  availableQty: { $sum: "$costDetails.availableQty" },
  stockQty: { $sum: "$costDetails.quantity" },
  issuedQty: { $sum: "$costDetails.issuedQty" },
  overAllCostInINR: { $sum: "$costDetails.overAllCost" },
};

/**
 * A page of the Spare Master catalogue.
 *
 * Unfiltered by design. A master is a standing record of a part, not something
 * that belongs to a financial year or to one place in the hierarchy, so the whole
 * catalogue is browsable and the client pages through it by scrolling.
 *
 * Cursor paging on _id rather than skip/limit: _id is monotonic, so `_id < cursor`
 * walks the collection at a constant cost per page instead of re-counting a
 * growing prefix, and rows cannot shift between pages as records are added.
 */
exports.getSpareMasterDashboard = tryCatchHandler(async (req, res, next) => {
  const { cursor } = req.query;

  if (cursor && !mongoose.Types.ObjectId.isValid(cursor))
    return res.status(400).json({
      success: false,
      message: "Invalid cursor",
    });

  const tableData = await SpareMaster.aggregate([
    ...(cursor
      ? [{ $match: { _id: { $lt: mongoose.Types.ObjectId(cursor) } } }]
      : []),
    { $sort: { _id: -1 } },
    { $limit: paginationRowLimit },
    { $project: spareMasterRowProjection },
  ]);

  /**
   * Counted on the first page only. The total does not change while the caller
   * scrolls, so repeating it for every page of 50 would be a full count per
   * page for a number the client already has.
   */
  const totalCount = cursor ? undefined : await SpareMaster.estimatedDocumentCount();

  return res.status(201).json({
    message: "Master details get successfully",
    tableData,
    nextCursor: tableData.length ? tableData[tableData.length - 1]._id : null,
    hasMore: tableData.length >= paginationRowLimit,
    ...(totalCount === undefined ? {} : { totalCount }),
  });
});

/**
 * Everything a Spare Master holds, flattened one row per part.
 *
 * Separate from the dashboard projection on purpose: the dashboard shows the
 * columns people work with, the export is the complete record, so the two are
 * allowed to diverge rather than one being trimmed to suit the other.
 *
 * costDetails is a list of FIFO tranches and cannot become columns without
 * multiplying rows, so it is summarised — totals, the count, and the newest
 * tranche's pricing — and the untouched array is carried alongside as JSON so
 * nothing in it is lost.
 */
const spareMasterExportProjection = {
  uniqueID: 1,
  partNumber: 1,
  partName: 1,
  partModel: 1,
  partGroup: 1,
  whichParts: 1,
  maker: 1,
  supplierName: 1,
  supplierCategory: 1,
  vendorGroup: 1,
  unit: 1,
  location: 1,
  registerSection: 1,
  status: 1,

  minQuantity: 1,
  maxQuantity: 1,
  quantityRequired: 1,
  leadTime: 1,
  orderPoint: 1,
  orderQty: 1,
  orderType: 1,
  controlType: 1,
  stockTaking: 1,

  remarks: 1,
  reasonForZeroStockRemarks: 1,
  reasonForKeepingDeadStockRemarks: 1,

  lastIssuedDate: 1,
  previousIssuedDate: 1,
  totalIssuedQty: 1,
  secondaryTotalIssuedQty: 1,
  additionalMachineCodes: 1,

  machineCode: "$machine.machine_code",
  machineName: "$machine.machine_name",
  machineNickname: "$machine.machine_nickname",
  lineCode: "$line.line_id",
  lineName: "$line.line_name",
  cellCode: "$cell.cell_id",
  cellName: "$cell.cell_name",
  subSectionCode: "$subSection.subSection_id",
  subSectionName: "$subSection.subSection_name",
  sectionHierarchyCode: "$section.section_id",
  sectionName: "$section.section_name",
  sectionDashboardLevel: "$section.dashboardLevel",
  plantCode: "$plant.plant_id",
  plantName: "$plant.plant_name",

  legacySupplierCode: "$legacyRef.supplierCode",
  legacyMakerCode: "$legacyRef.makerCode",
  legacyUnitCode: "$legacyRef.unitCode",
  legacyCurrencyCode: "$legacyRef.currencyCode",
  legacySectionCode: "$legacyRef.sectionCode",
  legacyMcSectionCode: "$legacyRef.mcSectionCode",
  legacyMcSectionName: "$legacyRef.mcSectionName",
  legacySecondaryUnitPrice: "$legacyRef.secondaryUnitPrice",
  legacyDrawingYN: "$legacyRef.drawingYN",
  legacyDrawingPrintYN: "$legacyRef.drawingPrintYN",
  legacyDrawingPrintQty: "$legacyRef.drawingPrintQty",
  legacySubPartsSwitch: "$legacyRef.subPartsSwitch",
  legacyChangedOn: "$legacyRef.changedOn",

  createdByTmNo: "$createdBy.tm_no",
  createdByName: "$createdBy.tm_name",
  createdByEmail: "$createdBy.email",
  createdByPlantData: "$createdBy.plant_data",

  registeredOn: "$dateTime.inString",
  registeredOnDate: "$dateTime.inDate",
  financialYear: "$rsTimeStamp.year.inString",
  financialYearNumber: "$rsTimeStamp.year.inNumber",
  financialMonth: "$rsTimeStamp.month.inString",
  financialMonthNumber: "$rsTimeStamp.month.inNumber",
  createdAt: 1,
  updatedAt: 1,

  stockQty: { $sum: "$costDetails.quantity" },
  issuedQty: { $sum: "$costDetails.issuedQty" },
  availableQty: { $sum: "$costDetails.availableQty" },
  issuedCost: { $sum: "$costDetails.issuedCost" },
  balanceQty: { $sum: "$costDetails.balanceQty" },
  overAllCostInINR: { $sum: "$costDetails.overAllCost" },
  costTrancheCount: { $size: { $ifNull: ["$costDetails", []] } },
  latestCurrencyUnit: { $arrayElemAt: ["$costDetails.currencyUnit", -1] },
  latestUnitCost: { $arrayElemAt: ["$costDetails.cost", -1] },
  latestCostInINR: { $arrayElemAt: ["$costDetails.costInINR", -1] },
  /**
   * Rebuilt field by field so the tranche _id and partId — database keys with no
   * meaning outside the application — stay out of the exported JSON.
   */
  costDetails: {
    $map: {
      input: { $ifNull: ["$costDetails", []] },
      as: "tranche",
      in: {
        quantity: "$$tranche.quantity",
        currencyUnit: "$$tranche.currencyUnit",
        cost: "$$tranche.cost",
        costInINR: "$$tranche.costInINR",
        issuedQty: "$$tranche.issuedQty",
        issuedCost: "$$tranche.issuedCost",
        balanceQty: "$$tranche.balanceQty",
        availableQty: "$$tranche.availableQty",
        overAllCost: "$$tranche.overAllCost",
      },
    },
  },
};

/**
 * Column order and headings for the CSV, as [heading, field] pairs.
 *
 * Needed because the exporter takes its columns from the keys of the first row,
 * and a projection's key order is the database's to choose — which produced a
 * file with the columns in an arbitrary order under their internal names.
 */
const spareMasterExportColumns = [
  ["Unique ID", "uniqueID"],
  ["Part No", "partNumber"],
  ["Part Name", "partName"],
  ["Part Model", "partModel"],
  ["Part Group", "partGroup"],
  ["Part For", "whichParts"],
  ["Maker", "maker"],
  ["Supplier", "supplierName"],
  ["Supplier Category", "supplierCategory"],
  ["Vendor Group", "vendorGroup"],
  ["Unit", "unit"],
  ["Location", "location"],
  ["Register Section", "registerSection"],
  ["Status", "status"],

  ["Min Qty", "minQuantity"],
  ["Max Qty", "maxQuantity"],
  ["Quantity Required", "quantityRequired"],
  ["Lead Time", "leadTime"],
  ["Order Point", "orderPoint"],
  ["Order Qty", "orderQty"],
  ["Order Type", "orderType"],
  ["Control Type", "controlType"],
  ["Stock Taking", "stockTaking"],

  ["Stock Qty", "stockQty"],
  ["Issued Qty", "issuedQty"],
  ["Available Qty", "availableQty"],
  ["Balance Qty", "balanceQty"],
  ["Issued Cost", "issuedCost"],
  ["Overall Cost (INR)", "overAllCostInINR"],
  ["Cost Tranches", "costTrancheCount"],
  ["Latest Currency Unit", "latestCurrencyUnit"],
  ["Latest Unit Cost", "latestUnitCost"],
  ["Latest Cost (INR)", "latestCostInINR"],

  ["Legacy Issued Qty", "totalIssuedQty"],
  ["Legacy Issued Qty 2", "secondaryTotalIssuedQty"],
  ["Last Issued On", "lastIssuedDate"],
  ["Previous Issued On", "previousIssuedDate"],

  ["Remarks", "remarks"],
  ["Zero Stock Remarks", "reasonForZeroStockRemarks"],
  ["Dead Stock Remarks", "reasonForKeepingDeadStockRemarks"],

  ["Machine No", "machineCode"],
  ["Machine Name", "machineName"],
  ["Machine Nickname", "machineNickname"],
  ["Other M/C Codes", "additionalMachineCodes"],
  ["Line", "lineName"],
  ["Line Code", "lineCode"],
  ["Product", "cellName"],
  ["Product Code", "cellCode"],
  ["Sub Section", "subSectionName"],
  ["Sub Section Code", "subSectionCode"],
  ["Section", "sectionName"],
  ["Section Code", "sectionHierarchyCode"],
  ["Section Dashboard Level", "sectionDashboardLevel"],
  ["Plant", "plantName"],
  ["Plant Code", "plantCode"],

  ["Legacy Supplier Code", "legacySupplierCode"],
  ["Legacy Maker Code", "legacyMakerCode"],
  ["Legacy Unit Code", "legacyUnitCode"],
  ["Legacy Currency Code", "legacyCurrencyCode"],
  ["Legacy Section Code", "legacySectionCode"],
  ["Legacy M/C Section Code", "legacyMcSectionCode"],
  ["Legacy M/C Section", "legacyMcSectionName"],
  ["Legacy Secondary Unit Price", "legacySecondaryUnitPrice"],
  ["Legacy Drawing YN", "legacyDrawingYN"],
  ["Legacy Drawing Print YN", "legacyDrawingPrintYN"],
  ["Legacy Drawing Print Qty", "legacyDrawingPrintQty"],
  ["Legacy Sub Parts Switch", "legacySubPartsSwitch"],
  ["Legacy Changed On", "legacyChangedOn"],

  ["Registered By", "createdByName"],
  ["Registered By TM No", "createdByTmNo"],
  ["Registered By Email", "createdByEmail"],
  ["Registered By Plant", "createdByPlantData"],
  ["Registered On", "registeredOn"],
  ["Registered On (Date)", "registeredOnDate"],
  ["Financial Year", "financialYear"],
  ["Financial Year No", "financialYearNumber"],
  ["Financial Month", "financialMonth"],
  ["Financial Month No", "financialMonthNumber"],
  ["Created At", "createdAt"],
  ["Updated At", "updatedAt"],

  ["Cost Details (JSON)", "costDetails"],
];

/** Arrays, dates and sub-documents have no CSV form of their own, so give them one. */
const toExportValue = (value) => {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return moment(value).format("DD-MM-YYYY HH:mm");
  if (Array.isArray(value))
    return value.every((item) => typeof item !== "object")
      ? value.join(", ")
      : JSON.stringify(value);
  if (typeof value === "object") return String(value);
  return value;
};

/**
 * The whole catalogue as CSV, carrying every field the schema holds.
 *
 * Read from the database rather than from whatever the table has scrolled into
 * view, so the file is complete however far the user got.
 */
exports.exportSpareMasterDashboard = tryCatchHandler(async (req, res, next) => {
  const tableData = await SpareMaster.aggregate([
    { $sort: { _id: -1 } },
    { $project: spareMasterExportProjection },
  ]);

  const rows = tableData.map((row) =>
    Object.fromEntries(
      spareMasterExportColumns.map(([heading, field]) => [
        heading,
        toExportValue(row[field]),
      ]),
    ),
  );

  return res.status(201).json({
    message: "Master details get successfully",
    tableData: unparseJSONData(rows),
    fileName: `Spare Master Details ${moment().format("DD-MM-YYYY")}.csv`,
  });
});

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

  /**
   * uniqueID is assigned by the system, never by the requester, so anything the
   * client sent is discarded before a fresh id is taken from the plant counter.
   */
  delete req.body["uniqueID"];

  req.body["uniqueID"] = await generateMasterUniqueId({
    master: req.body,
    fallbackUser: req.rootUser,
  });

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

  // uniqueID identifies the part across every request-sheet ever raised for it,
  // so it is fixed once assigned and an update can never carry a new one.
  delete req.body["uniqueID"];

  await SpareMaster.findOneAndUpdate(req.query, req.body);

  return res.status(201).json({
    message: "Master updated successfully",
  });
});
