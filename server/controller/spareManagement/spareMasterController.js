const moment = require("moment");
const { createColumnFilters, escapeRegex } = require("../../utils/columnFilters");
const mongoose = require("mongoose");
const tryCatchHandler = require("../../errorHandler/tryCatchHandler");

const RequestSheetOfSpare = require("../../model/requestSheetDataOfSpare");
const SpareMaster = require("../../model/spareMasterSchema");
const { spareMasterTypeFor } = require("../../model/spareMasterTypes");

const unparseJSONData = require("../../utils/unparseJSONData");
const {
  paginationRowLimit,
  dynamicApprovalStatus,
} = require("../../utils/spareManagementUtils");

const { generateTimestampIndividually } = require("../../utils/spareTimestamp");
const {
  generateMasterUniqueId,
} = require("../../services/spareMaster/masterUniqueIdService");
const {
  toFileEntry,
  removeDrawingFileIfUnreferenced,
} = require("../../services/spare/masterDrawingService");
const { isToolRoomUser } = require("../../utils/userScope");
const { appendLedgerEntry } = require("../../services/spare/stockLedgerService");
const {
  CHANGE_REQUEST_CHAINS,
  listApproversForStep,
  applyApprovalDecision,
  displayNameOf,
} = require("../../services/spare/changeRequestApprovalService");

/**
 * Additional machine codes are selected from the hierarchy by Tool Room users.
 * Keep only usable, unique codes and never duplicate the primary machine code.
 */
const normalizeAdditionalMachineCodes = ({ body, user, primaryMachineCode }) => {
  if (!Object.hasOwn(body, "additionalMachineCodes")) return null;

  if (!isToolRoomUser(user))
    return "Only Tool Room-authorized users can manage additional machine codes";

  body.additionalMachineCodes = [
    ...new Set(
      (Array.isArray(body.additionalMachineCodes)
        ? body.additionalMachineCodes
        : []
      )
        .filter((code) => typeof code === "string")
        .map((code) => code.trim())
        .filter((code) => code && code !== primaryMachineCode),
    ),
  ];

  return null;
};

/**
 * The master form posts multipart when it carries drawings, with its fields
 * as a JSON string under `data`; without drawings it posts plain JSON. Either
 * way this is the field object, with the uploaded drawings alongside.
 */
const readMasterRequest = (req) => {
  const body =
    typeof req.body?.data === "string" ? JSON.parse(req.body.data) : req.body;

  const uploadedDrawings = (req.files?.drawingAttach ?? []).map(toFileEntry);

  const removedDrawings =
    typeof body?.removedDrawingFiles === "string"
      ? JSON.parse(body.removedDrawingFiles)
      : (body?.removedDrawingFiles ?? []);
  delete body?.removedDrawingFiles;

  return { body, uploadedDrawings, removedDrawings };
};

/**
 * The catalogue a request is about: the stock-in master unless a route named
 * one of the uploaded masters (see resolveSpareMasterType) or the query
 * carries `masterType`, which the registration form sends when it edits a
 * Recycle or Repaired master. One implementation then serves all three.
 */
const masterModelOf = (req) =>
  req.spareMasterType?.model ??
  spareMasterTypeFor(req.query?.masterType)?.model ??
  SpareMaster;

exports.getDefaultValueForMasterRegistration = tryCatchHandler(
  async (req, res, next) => {
    const { _id } = req.query;

    if (_id) {
      if (!mongoose.Types.ObjectId.isValid(_id))
        return res.status(400).json({
          success: false,
          message: "Invalid ObjectId format",
        });

      const master = await masterModelOf(req).findOne(
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
          additionalMachineCodes: 1,
          machine: 1,
          status: 1,
          issueProblem: 1,
          repairedItem: 1,
          repairedOn: 1,
          repairedBy: 1,
          qualityConfirmedBy: 1,
          qualityConfirmationMethod: 1,
          qualityConfirmationDate: 1,
          toolRoomRequestStatus: 1,
          requestStatus: 1,
          pendingApprovalBy: 1,
          drawingAttach: 1,
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
          masterId: "$changeParts.masterId",
          partName: "$changeParts.partName",
          partModel: "$changeParts.partModel",
          minQuantity: "$changeParts.minQuantity",
          maxQuantity: "$changeParts.maxQuantity",
          quantityRequired: "$changeParts.quantityRequired",
          maker: "$changeParts.maker",
          supplierName: "$changeParts.supplierName",
          supplierCategory: "$changeParts.supplierCategory",
          // The part's drawings seed the master's, so they show on the
          // registration form and are stored with the master on save.
          drawingAttach: { $ifNull: ["$changeParts.drawingAttach", []] },
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
  issueProblem: 1,
  repairedItem: 1,
  repairedOn: 1,
  repairedBy: 1,
  qualityConfirmedBy: 1,
  qualityConfirmationMethod: 1,
  qualityConfirmationDate: 1,
  toolRoomRequestStatus: 1,
  requestStatus: 1,
  pendingApprovalBy: 1,
  currentApprovalIndex: 1,
  approvals: 1,
  /**
   * The person the record is waiting on, for the "Pending With" column. Blank
   * once the chain is closed; uploaded masters have no chain and show blank.
   */
  pendingWith: {
    $cond: [
      { $in: ["$requestStatus", ["Completed", "Rejected"]] },
      "",
      {
        $let: {
          vars: {
            step: { $arrayElemAt: ["$approvals", "$currentApprovalIndex"] },
          },
          in: { $ifNull: ["$$step.user.tm_name", ""] },
        },
      },
    ],
  },
  additionalMachineCodes: 1,
  drawingAttach: 1,
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
 * Excel-style column filters.
 *
 * The client sends `filters` as JSON — `{ maker: ["SKF", null], status: [...] }`
 * — one entry per filtered column, listing the values the reader ticked; `null`
 * stands for the blank cells Excel shows as "(Blanks)". Columns are the keys
 * of the dashboard row (spareMasterRowProjection), computed ones included, so
 * the match runs after the projection: 17k light rows is cheap, and it keeps
 * one set of column names between the table, the filter and the export.
 */
const FILTERABLE_COLUMNS = new Set(
  Object.keys(spareMasterRowProjection).filter((key) => key !== "drawingAttach"),
);

const {
  parse: parseColumnFilters,
  match: columnFilterMatch,
} = createColumnFilters(FILTERABLE_COLUMNS);

/** The same $match with every field path under `prefix`. */
const prefixMatch = (match, prefix) => {
  if (Array.isArray(match)) return match.map((m) => prefixMatch(m, prefix));
  if (match && typeof match === "object" && !(match instanceof Date))
    return Object.fromEntries(
      Object.entries(match).map(([key, value]) =>
        key.startsWith("$")
          ? [key, prefixMatch(value, prefix)]
          : [`${prefix}${key}`, value],
      ),
    );
  return match;
};

/**
 * The dashboard row as an expression object, for building it as a sub-document
 * next to the full record: inside `$set` a bare `1` is not an inclusion, so
 * each plain field becomes a "$field" reference and computed fields stay as
 * they are.
 */
const spareMasterRowExpression = Object.fromEntries(
  Object.entries(spareMasterRowProjection).map(([key, value]) => [
    key,
    value === 1 ? `$${key}` : value,
  ]),
);

/** Projection then filter — the stages every filtered read starts with. */
const projectedAndFiltered = (filters) => {
  const match = columnFilterMatch(filters);
  return [
    { $project: spareMasterRowProjection },
    ...(match ? [{ $match: match }] : []),
  ];
};

/**
 * Dashboard order: by Unique ID, ascending unless the reader flips it. The ids
 * are zero-padded per plant ("DNHAP1-0000001"), so a plain string sort is
 * their numeric order; _id breaks the tie for the few masters that have no id
 * yet, which sort first (last, descending).
 */
const sortDirectionOf = (query) => (query?.sort === "desc" ? -1 : 1);
const dashboardSort = (direction) => ({ uniqueID: direction, _id: direction });

/**
 * Keyset cursor for that order: the last row's (uniqueID, _id), opaque to the
 * client. Walking `(uniqueID, _id) > cursor` costs the same for every page,
 * where skip/limit would re-count a growing prefix, and a row added or removed
 * while the reader scrolls cannot shift the others between pages.
 */
const encodeCursor = (row) =>
  Buffer.from(
    JSON.stringify({ u: row.uniqueID ?? null, i: String(row._id) }),
  ).toString("base64url");

const decodeCursor = (cursor) => {
  try {
    const { u, i } = JSON.parse(Buffer.from(cursor, "base64url").toString());
    if (!mongoose.Types.ObjectId.isValid(i)) return null;
    return { uniqueID: typeof u === "string" ? u : null, _id: new mongoose.Types.ObjectId(i) };
  } catch {
    return null;
  }
};

// $expr, so a missing uniqueID compares as null (below every string) the same
// way the sort places it; a query-operator $gt against null would match nothing.
// "After" follows the sort direction: greater when ascending, less when not.
const afterCursorMatch = ({ uniqueID, _id }, direction) => {
  const beyond = direction === -1 ? "$lt" : "$gt";
  return {
    $expr: {
      $or: [
        { [beyond]: [{ $ifNull: ["$uniqueID", null] }, uniqueID] },
        {
          $and: [
            { $eq: [{ $ifNull: ["$uniqueID", null] }, uniqueID] },
            { [beyond]: ["$_id", _id] },
          ],
        },
      ],
    },
  };
};

/**
 * A page of the Spare Master catalogue.
 *
 * No year or hierarchy filter by design: a master is a standing record of a
 * part, so the whole catalogue is browsable and the client pages through it by
 * scrolling. What it does take is the column filters above.
 */
/**
 * Reads the master type out of the `:masterType` route segment. Only the
 * uploaded catalogues are reachable this way; the stock-in master keeps its
 * own unsegmented routes.
 */
exports.resolveSpareMasterType = tryCatchHandler(async (req, res, next) => {
  const type = spareMasterTypeFor(req.params?.masterType);

  if (!type?.uploadable)
    return res.status(404).json({
      message: `Unknown master type "${req.params?.masterType}"`,
      showToast: true,
    });

  req.spareMasterType = type;
  return next();
});

exports.getSpareMasterDashboard = tryCatchHandler(async (req, res, next) => {
  const { cursor } = req.query;
  const Model = masterModelOf(req);

  const after = cursor ? decodeCursor(cursor) : null;
  if (cursor && !after)
    return res.status(400).json({
      success: false,
      message: "Invalid cursor",
    });

  const filters = parseColumnFilters(req.query.filters);
  const isFiltered = Object.keys(filters).length > 0;
  const direction = sortDirectionOf(req.query);

  const tableData = await Model.aggregate([
    ...(after ? [{ $match: afterCursorMatch(after, direction) }] : []),
    { $sort: dashboardSort(direction) },
    // Unfiltered, the limit comes first and the projection touches one page;
    // filtered, the match has to see the projected rows before the limit.
    ...(isFiltered
      ? [...projectedAndFiltered(filters), { $limit: paginationRowLimit }]
      : [{ $limit: paginationRowLimit }, { $project: spareMasterRowProjection }]),
  ]);

  /**
   * Counted on the first page only. The total does not change while the caller
   * scrolls, so repeating it for every page of 50 would be a full count per
   * page for a number the client already has.
   */
  let totalCount;
  if (!cursor) {
    if (isFiltered) {
      const [counted] = await Model.aggregate([
        ...projectedAndFiltered(filters),
        { $count: "n" },
      ]);
      totalCount = counted?.n ?? 0;
    } else totalCount = await Model.estimatedDocumentCount();
  }

  return res.status(201).json({
    message: "Master details get successfully",
    tableData,
    nextCursor: tableData.length ? encodeCursor(tableData[tableData.length - 1]) : null,
    hasMore: tableData.length >= paginationRowLimit,
    ...(totalCount === undefined ? {} : { totalCount }),
  });
});

/**
 * Distinct values of one column with how many rows hold each — the list the
 * filter dropdown shows. Narrowed by the other columns' filters, as Excel
 * does, and by an optional search, so a 17k-row column is browsed a few
 * hundred values at a time. Blank cells come back as a single null entry.
 */
const COLUMN_VALUES_LIMIT = 300;

exports.getSpareMasterColumnValues = tryCatchHandler(async (req, res, next) => {
  const { column, search = "" } = req.query;

  if (!FILTERABLE_COLUMNS.has(column))
    return res.status(400).json({
      message: `"${column}" is not a filterable column`,
      showToast: true,
    });

  const otherMatch = columnFilterMatch(parseColumnFilters(req.query.filters), {
    except: column,
  });

  const values = await masterModelOf(req).aggregate([
    { $project: spareMasterRowProjection },
    ...(otherMatch ? [{ $match: otherMatch }] : []),
    // A list column (other machine codes) is counted per entry, as Excel
    // counts a multi-value cell once per value.
    { $unwind: { path: `$${column}`, preserveNullAndEmptyArrays: true } },
    {
      $set: {
        value: {
          $cond: [{ $in: [`$${column}`, [null, ""]] }, null, `$${column}`],
        },
      },
    },
    ...(search
      ? [
          {
            $match: {
              $expr: {
                $regexMatch: {
                  input: { $toString: { $ifNull: ["$value", ""] } },
                  regex: escapeRegex(search),
                  options: "i",
                },
              },
            },
          },
        ]
      : []),
    { $group: { _id: "$value", count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
    { $limit: COLUMN_VALUES_LIMIT + 1 },
    { $project: { _id: 0, value: "$_id", count: 1 } },
  ]);

  const truncated = values.length > COLUMN_VALUES_LIMIT;

  return res.status(201).json({
    message: "Column values get successfully",
    values: truncated ? values.slice(0, COLUMN_VALUES_LIMIT) : values,
    truncated,
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
  drawings: {
    $map: {
      input: { $ifNull: ["$drawingAttach", []] },
      as: "drawing",
      in: "$$drawing.originalname",
    },
  },
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
  ["Drawings", "drawings"],
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
  const filterMatch = columnFilterMatch(parseColumnFilters(req.query.filters));

  // Filtered the same way the table is, so the file is what the reader sees.
  // The filters name dashboard columns while the export projection is wider,
  // so the row is projected alongside the document, matched, then dropped.
  const tableData = await masterModelOf(req).aggregate([
    ...(filterMatch
      ? [
          { $set: { row: spareMasterRowExpression } },
          { $match: prefixMatch(filterMatch, "row.") },
          { $unset: "row" },
        ]
      : []),
    { $sort: dashboardSort(sortDirectionOf(req.query)) },
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
    fileName: `${req.spareMasterType?.label ?? "Spare Master"} Details ${moment().format("DD-MM-YYYY")}.csv`,
  });
});

exports.handleMasterConfiguration = tryCatchHandler(async (req, res, next) => {
  const { sheetId, partId } = req.query;

  const { body, uploadedDrawings } = readMasterRequest(req);
  req.body = body;

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
      requestSheetNo: 1,
      createdAt: 1,
      requestSheetCreatedBy: 1,
      changeParts: 1,
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

  const additionalMachineCodesError = normalizeAdditionalMachineCodes({
    body: req.body,
    user: req.rootUser,
    primaryMachineCode: machine?.machine_code,
  });
  if (additionalMachineCodesError)
    return res.status(403).json({
      message: additionalMachineCodesError,
      showToast: true,
    });

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

  // The drawings kept on the form (seeded from the part) plus any picked now.
  req.body["drawingAttach"] = [
    ...(Array.isArray(req.body.drawingAttach)
      ? req.body.drawingAttach.filter((f) => f?.filename).map(toFileEntry)
      : []),
    ...uploadedDrawings,
  ];

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


  // ── Stock-Ledger: Initial ORDER entry ────────────────────────────────
  // When a master is newly created from a request sheet, log its very first
  // ledger row: the order qty requested and the request sheet number as Order No.
  const partData = existingRSSheet?.changeParts?.find(
    (p) => p?._id?.toString() === partId?.toString(),
  );

  await appendLedgerEntry({
    masterId: master._id,
    entryType: "ORDER",
    processingDate: existingRSSheet?.createdAt || new Date(),
    orderQty: partData?.quantityRequired ?? req.body?.quantityRequired ?? null,
    orderNo: null,
    referenceId: sheetId,
    referenceModel: "RequestSheetOfSpare",
    createdBy: existingRSSheet?.requestSheetCreatedBy ?? req.rootUser,
  }).catch(() => {});

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

  const { body, uploadedDrawings, removedDrawings } = readMasterRequest(req);

  // uniqueID identifies the part across every request-sheet ever raised for it,
  // so it is fixed once assigned and an update can never carry a new one.
  delete body["uniqueID"];

  if (Object.hasOwn(body, "additionalMachineCodes")) {
    const currentMaster = await masterModelOf(req).findOne(
      { _id },
      { machine: 1 },
    );

    if (!currentMaster)
      return res.status(404).json({
        message: "Master not found",
        showToast: true,
      });

    const additionalMachineCodesError = normalizeAdditionalMachineCodes({
      body,
      user: req.rootUser,
      primaryMachineCode: currentMaster.machine?.machine_code,
    });
    if (additionalMachineCodesError)
      return res.status(403).json({
        message: additionalMachineCodesError,
        showToast: true,
      });
  }

  /**
   * Drawings. The form sends the list it kept only when it changed; new files
   * arrive as uploads either way. So: a kept list replaces the stored one (with
   * the uploads appended), while uploads alone are added to what is stored.
   */
  const update = { ...body };
  delete update.drawingAttach;

  const keptDrawings = Array.isArray(body.drawingAttach)
    ? body.drawingAttach.filter((f) => f?.filename).map(toFileEntry)
    : null;

  if (keptDrawings) update.drawingAttach = [...keptDrawings, ...uploadedDrawings];
  else if (uploadedDrawings.length)
    update.$push = { drawingAttach: { $each: uploadedDrawings } };

  // Filtered on the id alone: the query may also name the master type.
  await masterModelOf(req).findOneAndUpdate({ _id }, update);

  // A drawing dropped from the master keeps its file while a request-sheet
  // still shows it; otherwise the file goes with it.
  for (const filename of removedDrawings)
    await removeDrawingFileIfUnreferenced(filename, {
      except: { masterId: _id },
    });

  return res.status(201).json({
    message: "Master updated successfully",
  });
});

/**
 * The Repaired Part Quality Confirmation Sheet (FO/MTD/05/09/00).
 *
 * One part per record. The paper's fields are stored on the master itself —
 * part name / part no / maker in the master's own fields, the repair and
 * quality details in the fields added for this sheet — so the submitted part
 * appears in the Repaired Parts Master table and is maintained through the
 * normal edit form.
 *
 * The route is the plant's MTD approval flow. There is no department choice:
 * the sheet is only used by MTD. The chain is written with the record, with the
 * same fixed steps the request sheets use, so it cannot shift later.
 */
exports.createRepairedQualityConfirmation = tryCatchHandler(
  async (req, res, next) => {
    const masterType = req.spareMasterType;

    if (masterType?.key !== "repaired")
      return res.status(400).json({
        message:
          "The quality confirmation sheet is only for the Repaired Parts Master",
        showToast: true,
      });

    const {
      partName,
      partNo,
      maker,
      issueProblem,
      repairedItem,
      repairedOn,
      repairedBy,
      qualityConfirmedBy,
      qualityConfirmationMethod,
      qualityConfirmationDate,
      toolRoomRequestStatus,
    } = req.body ?? {};

    if (!String(partName ?? "").trim() || !String(partNo ?? "").trim())
      return res.status(400).json({
        message: "Please enter the part name and number",
        showToast: true,
      });

    const user = req.rootUser;

    const steps = [];

    for (const key of CHANGE_REQUEST_CHAINS.MTD) {
      const [approver] = await listApproversForStep(key, {
        plantData: user?.plant_data,
        sectionData: user?.section_data,
      });

      if (!approver)
        return res.status(400).json({
          message: `No ${displayNameOf(key)} user is registered for ${
            user?.plant_data ?? "this plant"
          }. Register one before submitting.`,
          showToast: true,
        });

      steps.push({
        key,
        userType: displayNameOf(key),
        user: {
          _id: approver._id,
          tm_no: approver.tm_no,
          tm_name: approver.tm_name,
          email: approver.email,
        },
        approvalStatus: "Pending",
      });
    }

    const master = new masterType.model({
      partName: String(partName).trim(),
      partNumber: String(partNo).trim(),
      maker: String(maker ?? "").trim(),
      issueProblem: String(issueProblem ?? "").trim(),
      repairedItem: String(repairedItem ?? "").trim(),
      repairedOn: String(repairedOn ?? "").trim(),
      repairedBy: String(repairedBy ?? "").trim(),
      qualityConfirmedBy: String(qualityConfirmedBy ?? "").trim(),
      qualityConfirmationMethod: String(qualityConfirmationMethod ?? "").trim(),
      qualityConfirmationDate: String(qualityConfirmationDate ?? "").trim(),
      toolRoomRequestStatus:
        isToolRoomUser(user) &&
        ["OK", "NOT OK"].includes(toolRoomRequestStatus)
          ? toolRoomRequestStatus
          : null,
      status: "masterCreated",
      approvals: steps,
      currentApprovalIndex: 0,
      pendingApprovalBy: steps[0]?.user?._id,
      requestStatus:
        dynamicApprovalStatus?.[steps[0]?.key] ?? steps[0]?.userType,
      createdBy: {
        _id: user?._id,
        tm_no: user?.tm_no,
        tm_name: user?.tm_name,
        email: user?.email,
        plant_data: user?.plant_data,
      },
      dateTime: {
        inString: moment().format("YYYY-MM-DDTHH:mm"),
        inDate: new Date(),
      },
      rsTimeStamp: generateTimestampIndividually(),
    });

    master.uniqueID = await generateMasterUniqueId({
      master,
      fallbackUser: user,
    });

    await master.save();

    return res.status(201).json({
      message: "Repaired part quality confirmation submitted",
      showToast: true,
      master,
    });
  },
);

/**
 * One approver on the MTD chain accepts or rejects a quality confirmation.
 * Same decision helper as the request sheets, so the route advances by the
 * same rules.
 */
exports.actOnRepairedQualityConfirmation = tryCatchHandler(
  async (req, res, next) => {
    const { _id } = req.query;
    const { isApproved, remarks } = req.body ?? {};

    if (req.spareMasterType?.key !== "repaired")
      return res.status(400).json({
        message:
          "The quality confirmation sheet is only for the Repaired Parts Master",
        showToast: true,
      });

    if (!mongoose.Types.ObjectId.isValid(_id))
      return res.status(400).json({ message: "Invalid request id" });
    if (!["Yes", "No"].includes(isApproved))
      return res.status(400).json({
        message: "Please accept or reject the request",
        showToast: true,
      });
    if (isApproved === "No" && !String(remarks ?? "").trim())
      return res.status(400).json({
        message: "Please enter the rejection remarks",
        showToast: true,
      });

    const master = await req.spareMasterType.model.findById(_id);
    if (!master)
      return res.status(404).json({ message: "Repaired part not found" });

    const step = master.approvals?.[master.currentApprovalIndex];
    if (!step || step.approvalStatus !== "Pending")
      return res.status(400).json({
        message: "This step has already been decided",
        showToast: true,
      });

    /**
     * Any user eligible for the current step may decide it, not only the one
     * name the chain happened to carry: TL and HOSS share one pool, so naming
     * a single person at creation left the rest of the level with no action.
     * The person who actually decides is recorded on the step.
     */
    const eligible = await listApproversForStep(step.key, {
      plantData: req.rootUser?.plant_data,
      sectionData: req.rootUser?.section_data,
    });
    const actor = eligible.find(
      (user) => String(user._id) === String(req.rootUser?._id ?? ""),
    );

    if (!actor)
      return res.status(403).json({
        message: "You are not an approver for this step",
        showToast: true,
      });

    step.user = {
      _id: actor._id,
      tm_no: actor.tm_no,
      tm_name: actor.tm_name,
      email: actor.email,
    };

    const decisionError = applyApprovalDecision(master, {
      isApproved,
      remarks,
    });
    if (decisionError)
      return res.status(400).json({ message: decisionError, showToast: true });

    await master.save();

    return res.status(201).json({
      message:
        isApproved === "Yes"
          ? "Quality confirmation approved"
          : "Quality confirmation rejected",
      showToast: true,
      master,
    });
  },
);
