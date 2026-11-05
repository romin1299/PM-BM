const mongoose = require("mongoose");
const moment = require("moment");
const tryCatchHandler = require("../../errorHandler/tryCatchHandler");
const getFY = require("../../utils/getFY");
const { isToolRoomUser } = require("../../utils/userScope");

/** `array` with `amount` added to the element at `index`, other months untouched. */
const addAtMonth = (array, index, amount) => ({
  $concatArrays: [
    { $slice: [array, index] },
    [{ $add: [{ $ifNull: [{ $arrayElemAt: [array, index] }, 0] }, amount] }],
    { $slice: [array, { $add: [index, 1] }, { $size: array }] },
  ],
});

/**
 * Books a stock-out against the cell's budget for the running month.
 *
 * The running month's actual grows with every stock-out. A month that has been
 * closed with its month-end BPD figure is left alone — that figure is the
 * month's actual — so the update is conditioned on the month still being open.
 * The cumulative is rebuilt from the twelve actuals rather than incremented, so
 * it always agrees with them.
 */
const applyIssuanceToBudget = ({ cellId, monthIndex, usedBudget }) =>
  SpareBudget.updateOne(
    {
      "cell._id": cellId,
      financialYear: getFY(),
      [`closedMonths.${monthIndex}`]: { $ne: true },
    },
    [
      {
        $set: {
          actual: addAtMonth("$actual", monthIndex, usedBudget),
          BPDActual: addAtMonth("$BPDActual", monthIndex, usedBudget),
        },
      },
      {
        $set: {
          cumulativeActual: {
            $reduce: {
              input: "$actual",
              initialValue: { total: 0, out: [] },
              in: {
                total: { $add: ["$$value.total", { $ifNull: ["$$this", 0] }] },
                out: {
                  $concatArrays: [
                    "$$value.out",
                    [{ $add: ["$$value.total", { $ifNull: ["$$this", 0] }] }],
                  ],
                },
              },
            },
          },
        },
      },
      { $set: { cumulativeActual: "$cumulativeActual.out" } },
    ],
  );


const User = require("../../model/userSchema");
const Plant = require("../../model/plantSchema");
const SpareIssuanceSummary = require("../../model/spareIssuanceSummarySchema");
const SpareMaster = require("../../model/spareMasterSchema");
const {
  SPARE_MASTER_TYPES,
  spareMasterTypeFor,
} = require("../../model/spareMasterTypes");
const SpareBudget = require("../../model/spareBudgetSchema");
const RequestSheetOfSpare = require("../../model/requestSheetDataOfSpare");
const { appendLedgerEntry } = require("../../services/spare/stockLedgerService");

const {
  spareApprovalStatus,
  generateRegexSearchString,
  paginationRowLimit,
  dynamicApprovalStatus,
  hooksFormReferenceOfApproval,
} = require("../../utils/spareManagementUtils");
const {
  generateTimestampIndividually,
  generateTimeStampWithBothFormat,
} = require("../../utils/spareTimestamp");
const {
  createColumnFilters,
  escapeRegex,
} = require("../../utils/columnFilters");

const unparseJSONData = require("../../utils/unparseJSONData");
const {
  resolveMachineHierarchy,
} = require("../../services/spare/machineHierarchyService");
const {
  isBelowReorderLevel,
  changePartFromMaster,
  canBuildSheetNumber,
  findMastersWithOpenReorder,
  reserveSheetNumbers,
  formatSheetNo,
  buildReorderSheet,
} = require("../../services/spare/reorderSheetService");

const getDynamicApprovalFromThePlant = async (plant_id) =>
  await Plant.findOne({ plant_id }, { spareIssuanceDynamicApproval: 1 });

/**
 * The parts on a sheet whose master has no stock left.
 *
 * A master with nothing available cannot be issued — there is no quantity to
 * take out. Manual "Issue Other" lines have no master and are not checked.
 * The repaired/recycle catalogues are checked against their own model.
 */
const partsWithoutAvailableStock = async (parts = []) => {
  const names = [];

  for (const part of parts) {
    // Manual lines have neither a master id nor the master's budget snapshot.
    const masterId =
      part?.masterId ?? (part?.budgetDetails ? part?._id : null);

    if (!masterId || !mongoose.Types.ObjectId.isValid(masterId)) continue;

    const MasterModel =
      spareMasterTypeFor(part?.masterType)?.model ?? SpareMaster;

    const master = await MasterModel.findById(masterId, {
      costDetails: 1,
    }).lean();

    const available = (master?.costDetails ?? []).reduce(
      (sum, tranche) => sum + (tranche?.availableQty ?? 0),
      0,
    );

    if (!master || available <= 0)
      names.push(part?.partName ?? part?.partNumber ?? "part");
  }

  return [...new Set(names)];
};

const noStockRefusal = async (parts) => {
  const names = await partsWithoutAvailableStock(parts);
  return names.length
    ? `No quantity available for: ${names.join(
        ", ",
      )}. Stock the part in before issuing it.`
    : null;
};

exports.budgetDetailsProjection = budgetDetailsProjection = {
  $reduce: {
    input: "$spareMaster.costDetails",
    initialValue: {
      issuanceSheetRequired: {
        requiredBudget: 0,
        quantity: "$changeParts.quantityRequired",
      },
      overAllAvailableQty: 0,
      overAllCostInINR: 0,
    },
    in: {
      issuanceSheetRequired: {
        $cond: [
          { $gt: ["$$value.issuanceSheetRequired.quantity", 0] },
          {
            $switch: {
              branches: [
                {
                  case: {
                    $gte: [
                      "$$this.availableQty",
                      "$$value.issuanceSheetRequired.quantity",
                    ],
                  },
                  then: {
                    requiredBudget: {
                      $add: [
                        "$$value.issuanceSheetRequired.requiredBudget",
                        {
                          $multiply: [
                            "$$value.issuanceSheetRequired.quantity",
                            "$$this.costInINR",
                          ],
                        },
                      ],
                    },
                    quantity: 0,
                  },
                },
                {
                  case: {
                    $lte: [
                      "$$this.availableQty",
                      "$$value.issuanceSheetRequired.quantity",
                    ],
                  },
                  then: {
                    requiredBudget: {
                      $add: [
                        "$$value.issuanceSheetRequired.requiredBudget",
                        "$$this.overAllCost",
                      ],
                    },
                    quantity: {
                      $subtract: [
                        "$$value.issuanceSheetRequired.quantity",
                        "$$this.availableQty",
                      ],
                    },
                  },
                },
              ],
              default: "$$value.issuanceSheetRequired",
            },
          },
          "$$value.issuanceSheetRequired",
        ],
      },
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
};

exports.handleSpareIssuanceSheet = tryCatchHandler(async (req, res, next) => {
  if (!req.body?.machine?._id)
    return res.status(400).json({
      message: "Please provide the Line, Machine value",
      showToast: true,
    });

  const hierarchy = await resolveMachineHierarchy(req.body?.machine?._id);

  if (hierarchy?.isError)
    return res.status(400).json({
      message: hierarchy?.message,
      showToast: true,
    });

  req.body["plant"] = hierarchy?.plant;
  req.body["section"] = hierarchy?.section;
  req.body["subSection"] = hierarchy?.subSection;
  req.body["cell"] = hierarchy?.cell;
  req.body["line"] = hierarchy?.line;
  req.body["machine"] = hierarchy?.machine;

  req.body["createdBy"] = req.rootUser;
  req.body["requestedDepartment"] = req.rootUser?.tm_department
    ? req.rootUser?.tm_department
    : "MTD";
  req.body["rsTimeStamp"] = generateTimestampIndividually();

  /**
   * A master with no stock left cannot be issued: there is nothing to take
   * out. Refused here, before the sheet is written, so the requester sees
   * which part has to be stocked in first.
   */
  const noStockError = await noStockRefusal(req.body?.changeParts);
  if (noStockError)
    return res.status(400).json({ message: noStockError, showToast: true });

  req.body?.changeParts?.map((item) => ({
    ...item,
    returnTargetDateIfTemporary: item?.returnTargetDateIfTemporary?.inString
      ? generateTimeStampWithBothFormat(
          item?.returnTargetDateIfTemporary?.inString,
        )
      : null,
  }));

  if (req.body?.isTemporaryPartSelected) {
    const {
      emailReminderMTL,
      emailReminderHOSS,
      emailReminderHOS,
      emailReminderHOD,
    } = req.body;

    const reminderIds = [
      emailReminderMTL,
      emailReminderHOSS,
      emailReminderHOS,
      emailReminderHOD,
    ];

    const users = await User.find(
      {
        _id: {
          $in: reminderIds.filter(Boolean),
        },
      },
      {
        email: 1,
      },
    );

    const emailById = new Map(users.map((u) => [u._id.toString(), u.email]));

    const reminderEmails = reminderIds.map(
      (id) => emailById.get(id?.toString()) || null,
    );

    req.body["reminderEmails"] = reminderEmails;
  }

  await new SpareIssuanceSummary(req.body).save();

  return res.status(201).json({
    message: "Master registered successfully",
  });
});

/**
 * The names behind a machine id, for the issuance form to display.
 *
 * Request-sheet rows from BM and CM carry the cell / line / machine as bare
 * references - the embedded copies of their names are empty in the stored
 * sheets - so a form opened from one of them knew the ids but had nothing to
 * show. The sheet itself is stamped server-side from the machine id (see
 * handleSpareIssuanceSheet), so this only supplies what the screen prints.
 */
exports.getMachineHierarchy = tryCatchHandler(async (req, res, next) => {
  const hierarchy = await resolveMachineHierarchy(req.query?.machineId);

  if (hierarchy?.isError)
    return res.status(400).json({
      message: hierarchy?.message,
      showToast: true,
    });

  return res.status(201).json({
    message: "Machine hierarchy get successfully",
    hierarchy: {
      cell: hierarchy.cell,
      line: hierarchy.line,
      machine: hierarchy.machine,
    },
  });
});

exports.getIssuanceSummeryBasedOnId = tryCatchHandler(
  async (req, res, next) => {
    const { _id } = req.query;

    if (!_id)
      return res.status(400).json({
        message: "Please provide required Id",
        showToast: true,
      });

    const tableData = await SpareIssuanceSummary.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId(_id),
        },
      },
      {
        $unwind: "$changeParts",
      },
      ...req.budgetCalculationPipeline,
      {
        $addFields: {
          changeParts: {
            $let: {
              vars: {
                budgetDetails: {
                  $reduce: {
                    input: "$spareMaster.costDetails",
                    initialValue: {
                      overAllAvailableQty: 0,
                      overAllCostInINR: 0,
                    },
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
              in: {
                $mergeObjects: [
                  "$changeParts",
                  {
                    budgetDetails: "$$budgetDetails",
                    unitCost: {
                      $cond: [
                        {
                          $or: [
                            { $eq: ["$$budgetDetails.overAllAvailableQty", 0] },
                            {
                              $eq: [
                                "$$budgetDetails.overAllAvailableQty",
                                null,
                              ],
                            },
                          ],
                        },
                        0,
                        {
                          $divide: [
                            "$$budgetDetails.overAllCostInINR",
                            "$$budgetDetails.overAllAvailableQty",
                          ],
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $group: {
          _id: "$_id",
          root: { $first: "$$ROOT" },
          changeParts: { $push: "$changeParts" },
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ["$root", { changeParts: "$changeParts" }],
          },
        },
      },
    ]);

    if (tableData?.length <= 0)
      return res.status(400).json({
        message: "No sheets to display",
        showToast: true,
      });

    return res.status(201).json({
      message: "Issuance sheets get successfully",
      issuanceSheet: tableData[0],
    });
  },
);

exports.issuanceSummeryUpdate = tryCatchHandler(async (req, res, next) => {
  if (!req.query?._id)
    return res.status(400).json({
      message: "Please provide required Id",
      showToast: true,
    });

  if (req.body.changeParts && req.body?.isDateChanged) {
    req.body.changeParts = req.body.changeParts?.map((item) => {
      if (
        item?.returnTargetDateIfTemporary?.inString &&
        !item?.returnTargetDateRevision?.includes(
          item?.returnTargetDateIfTemporary?.inString,
        )
      ) {
        if (
          !item?.returnTargetDateRevision ||
          item?.returnTargetDateRevision?.length <= 0
        )
          item.returnTargetDateRevision = [
            item?.returnTargetDateIfTemporary?.inString,
          ];
        else
          item.returnTargetDateRevision.push(
            item?.returnTargetDateIfTemporary?.inString,
          );
      }

      return item;
    });
  }

  // Editing the parts must not slip a no-stock master onto the sheet either.
  if (req.body?.changeParts) {
    const noStockError = await noStockRefusal(req.body.changeParts);
    if (noStockError)
      return res.status(400).json({ message: noStockError, showToast: true });
  }

  const issuanceSheet = await SpareIssuanceSummary.updateOne(
    req.query,
    req.body,
  );

  if (!issuanceSheet)
    return res.status(404).json({
      message: "Issuance sheet not exists",
      showToast: true,
    });

  req.queryObj = { _id: mongoose.Types.ObjectId(req.query?._id) };
  req.otherAggregationPipeline = [];
  req.partQuery = {};
  return next();
});

exports.responseIssuanceSummeryUpdate = tryCatchHandler(
  async (req, res, next) => {
    return res.status(201).json({
      message: "Issuance sheets updated successfully",
      tableData: req.tableData,
    });
  },
);

/** The dashboard columns, as the raw issuance document names them. */
const ISSUANCE_FILTERABLE_COLUMNS = new Set([
  "issuedFrom",
  "cell.cell_name",
  "line.line_name",
  "machine.machine_code",
  "changeParts.whichParts",
  "changeParts.location",
  "changeParts.partName",
  "changeParts.partModel",
  "changeParts.maker",
  "changeParts.temporaryOrPermanent",
  "changeParts.returnTargetDateIfTemporary.inString",
  "changeParts.closingStatusIfTemporary",
  "changeParts.issuanceApprovalStatus",
  "createdBy.tm_name",
]);

const {
  parse: parseColumnFilters,
  match: columnFilterMatch,
} = createColumnFilters(ISSUANCE_FILTERABLE_COLUMNS);

const COLUMN_VALUES_LIMIT = 300;

exports.spareIssuanceFilters = tryCatchHandler(async (req, res, next) => {
  let $match = req.queryObj,
    searchQuery = {};

  const { from, to, search } = req.query;

  if (from || to) {
    $match.createdAt = {};
    if (from) $match.createdAt.$gte = moment(from).startOf("day").toDate();
    if (to) $match.createdAt.$lte = moment(to).endOf("day").toDate();
  }

  if (search) {
    const searchRegex = generateRegexSearchString(search);

    let $or = [
      { "machine.machine_code": searchRegex },
      { "machine.machine_name": searchRegex },
      { "line.line_name": searchRegex },
      { "cell.cell_name": searchRegex },
      { "createdBy.tm_name": searchRegex },
      { "changeParts.whichParts": searchRegex },
      { "changeParts.location": searchRegex },
      { "changeParts.partName": searchRegex },
      { "changeParts.partModel": searchRegex },
      { "changeParts.maker": searchRegex },
      { "changeParts.temporaryOrPermanent": searchRegex },
      { "changeParts.returnTargetDateIfTemporary.inString": searchRegex },
      { "changeParts.closingStatusIfTemporary": searchRegex },
    ];

    $match.$or = $or;
    searchQuery = { $or };
  }

  req.issuanceBaseMatch = $match;

  const filterMatch = columnFilterMatch(parseColumnFilters(req.query.filters));

  /**
   * Column filters are applied at both levels. The sheet-level match narrows
   * which sheets the page loads; the same match runs again after the parts are
   * unwound, so only the matching parts of those sheets are shown. Pagination
   * stays sheet-based (the cursor is the sheet _id).
   */
  if (filterMatch) {
    $match = { $and: [$match, filterMatch] };
    searchQuery = searchQuery?.$or
      ? { $and: [searchQuery, filterMatch] }
      : filterMatch;
  }

  req.columnFilterMatch = filterMatch;
  req.queryObj = $match;
  req.partQuery = searchQuery;
  return next();
});

exports.issuanceSummeryQueryGeneration = tryCatchHandler(
  async (req, res, next) => {
    if (req.query?.cursor)
      req.queryObj._id = { $lt: mongoose.Types.ObjectId(req.query.cursor) };

    req.otherAggregationPipeline = [
      { $sort: { _id: -1 } },
      { $limit: paginationRowLimit },
    ];

    return next();
  },
);

/**
 * Finds each part's master. A part can come from any of the three masters
 * (stock-in, recycle, repaired), which are separate collections, so the part's
 * masterId is looked up in all three; an id is unique across them, so at most
 * one answers. A part whose master is in none of them is dropped, as the
 * $unwind this replaces did.
 */
const masterLookupStages = Object.values(SPARE_MASTER_TYPES).map((type) => ({
  $lookup: {
    from: type.model.collection.name,
    localField: "changeParts.masterId",
    foreignField: "_id",
    pipeline: [{ $project: { costDetails: 1 } }],
    as: `spareMaster_${type.key}`,
  },
}));

const masterLookupFields = Object.values(SPARE_MASTER_TYPES).map(
  (type) => `spareMaster_${type.key}`,
);

exports.requiredBudgetCalculation = tryCatchHandler(async (req, res, next) => {
  req.budgetCalculationPipeline = [
    ...masterLookupStages,
    {
      $set: {
        spareMaster: {
          $arrayElemAt: [
            {
              $concatArrays: masterLookupFields.map((field) => `$${field}`),
            },
            0,
          ],
        },
      },
    },
    { $unset: masterLookupFields },
    { $match: { spareMaster: { $ne: null } } },
  ];
  return next();
});

exports.issuanceSummeryProjection = tryCatchHandler(async (req, res, next) => {
  req.$project = {
    issuedFrom: 1,
    cell: 1,
    line: 1,
    machine: 1,
    // spareMaster: 1,
    "changeParts._id": 1,
    "changeParts.masterId": 1,
    "changeParts.whichParts": 1,
    "changeParts.location": 1,
    "changeParts.partName": 1,
    "changeParts.partModel": 1,
    "changeParts.maker": 1,
    "changeParts.quantityRequired": 1,
    "changeParts.temporaryOrPermanent": 1,
    "changeParts.issuanceApprovalStatus": {
      $ifNull: ["$changeParts.issuanceApprovalStatus", "Generated"],
    },
    "changeParts.returnTargetDateIfTemporary.inString": {
      $cond: [
        {
          $in: [
            "$changeParts.returnTargetDateIfTemporary.inString",
            [null, ""],
          ],
        },
        "NA",
        "$changeParts.returnTargetDateIfTemporary.inString",
      ],
    },
    dayCount: {
      $cond: [
        {
          $eq: ["$changeParts.temporaryOrPermanent", "Temporary"],
        },
        {
          $dateDiff: {
            startDate: "$createdAt",
            endDate: "$$NOW",
            unit: "day",
          },
        },
        "NA",
      ],
    },
    "changeParts.closingStatusIfTemporary": 1,
    "createdBy.tm_name": 1,
    budgetDetails: budgetDetailsProjection,
    canEditIssuanceSheet: {
      $or: [
        {
          $eq: ["$createdBy._id", req.rootUser?._id],
        },
        /**
         * Decided here in node, not in the pipeline: this compared the stored
         * string ("Yes" / "No") against the boolean `true`, which is never
         * equal - so no tool-room user could edit an issuance sheet raised by
         * anyone else, whatever their rights.
         */
        isToolRoomUser(req.rootUser),
      ],
    },
  };

  req.unitCostAddFieldPipeline = [
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
  ];
  return next();
});

exports.exportIssuanceSummeryQueryGeneration = tryCatchHandler(
  async (req, res, next) => {
    req.otherAggregationPipeline = req.unitCostAddFieldPipeline = [];

    req.$project = {
      _id: 0,
      "Issued from": "$issuedFrom",
      Cell: "$cell.cell_name",
      Line: "$line.line_name",
      "Machine code": "$machine.machine_code",
      "Machine name": "$machine.machine_name",
      Master: "$changeParts.whichParts",
      Location: "$changeParts.location",
      "Part name": "$changeParts.partName",
      "Part modal": "$changeParts.partModel",
      Maker: "$changeParts.maker",
      "Available Quantity": "$changeParts.overAllAvailableQty",
      "Cost in INR": "$changeParts.overAllCostInINR",
      "Required Quantity": "$changeParts.quantityRequired",
      "Temporary/Permanent": "$changeParts.temporaryOrPermanent",
      "Return Target Date": {
        $cond: [
          {
            $in: [
              "$changeParts.returnTargetDateIfTemporary.inString",
              [null, ""],
            ],
          },
          "NA",
          "$changeParts.returnTargetDateIfTemporary.inString",
        ],
      },
      "Closing status": "$changeParts.closingStatusIfTemporary",
      "Created By": "$createdBy.tm_name",
    };

    return next();
  },
);

exports.getIssuanceSummery = tryCatchHandler(async (req, res, next) => {
  const tableData = await SpareIssuanceSummary.aggregate([
    {
      $match: req.queryObj,
    },
    ...req.otherAggregationPipeline,
    {
      $unwind: "$changeParts",
    },
    {
      $match: req.partQuery,
    },
    ...req.budgetCalculationPipeline,
    {
      $project: req.$project,
    },
    ...(req.columnFilterMatch ? [{ $match: req.columnFilterMatch }] : []),
    ...req.unitCostAddFieldPipeline,
  ]);

  if (tableData?.length <= 0)
    return res.status(400).json({
      message: "No sheets to display",
      showToast: true,
    });

  req.tableData = tableData;
  return next();
});

/**
 * Distinct values of one issuance column with row counts, for its filter.
 * Excel-style: narrowed by the other columns' filters, the search and the date
 * range. Counts are part rows (the table's rows), so the collection is unwound
 * the same way the list is.
 */
exports.getIssuanceColumnValues = tryCatchHandler(async (req, res, next) => {
  const { column, search = "", from, to } = req.query;

  if (!ISSUANCE_FILTERABLE_COLUMNS.has(column))
    return res.status(400).json({
      message: `"${column}" is not a filterable column`,
      showToast: true,
    });

  const otherMatch = columnFilterMatch(parseColumnFilters(req.query.filters), {
    except: column,
  });

  const baseMatch = req.queryObj ?? {};
  const dateMatch = {};
  if (from || to) {
    dateMatch.createdAt = {};
    if (from) dateMatch.createdAt.$gte = moment(from).startOf("day").toDate();
    if (to) dateMatch.createdAt.$lte = moment(to).endOf("day").toDate();
  }

  const matches = [baseMatch, dateMatch, otherMatch].filter(
    (match) => match && Object.keys(match).length,
  );
  const match = matches.length <= 1 ? matches[0] ?? {} : { $and: matches };

  const values = await SpareIssuanceSummary.aggregate([
    { $match: match },
    { $unwind: "$changeParts" },
    ...(otherMatch ? [{ $match: otherMatch }] : []),
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

exports.issuanceSummaryResponse = tryCatchHandler(async (req, res, next) => {
  return res.status(201).json({
    message: "Issuance sheets get successfully",
    nextCursor: req.tableData.length
      ? req.tableData[req.tableData.length - 1]._id
      : null,
    hasMore: req.tableData.length >= paginationRowLimit,
    tableData: req.tableData,
  });
});

exports.exportIssuanceSummaryResponse = tryCatchHandler(
  async (req, res, next) => {
    return res.status(201).json({
      message: "Issuance sheets get successfully",
      tableData: unparseJSONData(req.tableData),
      fileName: "Issuance Sheet Summary",
    });
  },
);

exports.getIssuanceSummeryCounters = tryCatchHandler(async (req, res, next) => {
  const counters = await SpareIssuanceSummary.aggregate([
    {
      $match: req.queryObj,
    },
    {
      $unwind: "$changeParts",
    },
    {
      $match: req.partQuery,
    },
    {
      $group: {
        _id: "$changeParts.temporaryOrPermanent",
        temporaryOrPermanentParts: {
          $sum: 1,
        },
      },
    },
  ]);

  if (counters?.length <= 0)
    return res.status(400).json({
      message: "No sheets counters to display",
      showToast: true,
    });

  let finalCounter = {
    total: 0,
    pending: 0,
    closed: 0,
  };

  for (let i = 0; i < counters.length; i++) {
    finalCounter.total =
      finalCounter.total + counters[i]?.temporaryOrPermanentParts;

    if (counters[i]?._id === "Temporary")
      finalCounter.pending = counters[i]?.temporaryOrPermanentParts;
    else finalCounter.closed = counters[i]?.temporaryOrPermanentParts;
  }

  return res.status(201).json({
    message: "Spare issuance sheet summery counters get successfully",
    counters: finalCounter,
  });
});

exports.handleSetPartApproval = tryCatchHandler(async (req, res, next) => {
  const { _id, partId, department } = req.query;

  if (!_id || !partId || !department)
    return res.status(400).json({
      message: "Please provide required data",
      showToast: true,
    });

  const plant = await getDynamicApprovalFromThePlant(
    req?.rootUser?.plant_data?.split("-")?.[0],
  );

  if (!plant)
    return res.status(400).json({
      message: "Plant does not exist",
      showToast: true,
    });

  const dynamicApproval = plant?.spareIssuanceDynamicApproval?.[department];

  if (!dynamicApproval || dynamicApproval?.length <= 0)
    return res.status(400).json({
      message: "Please configure dynamic approval first",
      showToast: true,
    });

  let allUser_Ids = [];

  for (let i = 0; i < dynamicApproval.length; i++) {
    if (!req.body?.[`approvalOf${dynamicApproval[i]}`]?.user?._id)
      return res.status(400).json({
        // Names the step, so a missing one is not a hunt through the dropdowns.
        message: `Please select the ${
          hooksFormReferenceOfApproval?.[dynamicApproval[i]]?.displayName ||
          dynamicApproval[i]
        } approval`,
        showToast: true,
      });

    allUser_Ids.push(req.body?.[`approvalOf${dynamicApproval[i]}`]?.user?._id);
  }

  const users = await User.find(
    {
      _id: { $in: allUser_Ids },
    },
    {
      _id: 1,
      tm_no: 1,
      tm_name: 1,
      email: 1,
      user_type: 1,
      tm_grade: 1,
      tm_department: 1,
    },
  );

  if (!users || users?.length <= 0)
    return res.status(400).json({
      message: "Selected approval users does not exists",
      showToast: true,
    });

  let dynamicApprovalKeys = [],
    $set = {},
    schemaKey = "changeParts.$[part].";

  for (let i = 0; i < dynamicApproval.length; i++) {
    const user = users.find(
      (item) =>
        item?._id.toString() ===
        req.body[`approvalOf${dynamicApproval[i]}`]?.user?._id,
    );

    if (user) {
      $set[`${schemaKey}approvalOf${dynamicApproval[i]}`] = {
        userType: dynamicApproval[i]?.split("_")?.join(" "),
        user,
        approvalStatus: "Pending",
      };

      dynamicApprovalKeys.push(`approvalOf${dynamicApproval[i]}`);

      if (i === 0) {
        $set[`${schemaKey}pendingApprovalBy`] = user?._id;
        $set[`${schemaKey}issuanceApprovalStatus`] =
          dynamicApprovalStatus?.[dynamicApproval[i]];
      }
    }
  }

  $set[`${schemaKey}dynamicApprovalKeys`] = dynamicApprovalKeys;
  $set[`${schemaKey}currentApprovalIndex`] = 0;

  await SpareIssuanceSummary.updateOne(
    { _id },
    { $set },
    {
      arrayFilters: [{ "part._id": partId }],
    },
  );

  req.queryObj = {
    _id: mongoose.Types.ObjectId(_id),
  };
  req.partQuery = {
    "changeParts._id": mongoose.Types.ObjectId(partId),
  };

  req.otherAggregationPipeline = [];

  return next();
});

exports.submitApprovalResponse = tryCatchHandler(async (req, res, next) => {
  return res.status(201).json({
    message: "Issuance sheet approval added successfully",
    spareParts: req.tableData,
  });
});

exports.getPartApprovalFilter = tryCatchHandler(async (req, res, next) => {
  const { _id, partId, department } = req.query;

  if (!_id || !partId || !department)
    return res.status(400).json({
      message: "Please provide required data",
      showToast: true,
    });

  req.queryObj = {
    _id: mongoose.Types.ObjectId(_id),
  };

  req.partQuery = {
    "changeParts._id": mongoose.Types.ObjectId(partId),
  };

  req.otherAggregationPipeline =
    req.budgetCalculationPipeline =
    req.unitCostAddFieldPipeline =
      [];

  return next();
});

exports.sendApprovalProjection = tryCatchHandler(async (req, res, next) => {
  req.$project = {
    approvals: {
      $map: {
        input: "$changeParts.dynamicApprovalKeys",
        as: "eachKey",
        in: {
          $getField: {
            field: "$$eachKey",
            input: "$changeParts",
          },
        },
      },
    },
    "changeParts._id": 1,
    "changeParts.issuanceApprovalStatus": 1,
    "changeParts.pendingApprovalBy": 1,
    canSendForApproval: {
      $eq: ["$createdBy._id", req.rootUser?._id],
    },
  };
  return next();
});

exports.getPartApprovalResponse = tryCatchHandler(async (req, res, next) => {
  return res.status(201).json({
    message: "Issuance sheets get successfully",
    part: req.tableData?.[0],
  });
});

exports.acceptOrRejectApprovalProjection = tryCatchHandler(
  async (req, res, next) => {
    req.$project = {
      ...(isToolRoomUser(req.rootUser)
        ? {
            cell: 1,
            section: 1,
            machine: 1,
            "changeParts.quantityRequired": 1,
            budgetDetails: budgetDetailsProjection,
          }
        : {}),
      "changeParts.masterType": 1,
      "changeParts.dynamicApprovalKeys": 1,
      "changeParts.currentApprovalIndex": 1,
      "changeParts.approvalOfMTD_TL": 1,
      "changeParts.approvalOfMTD_HOSS": 1,
      "changeParts.approvalOfPRD_TL": 1,
      "changeParts.approvalOfPRD_HOSS": 1,
      "changeParts.approvalOfMTD_HOS": 1,
      "changeParts.approvalOfPRD_HOS": 1,
      "changeParts.approvalOfMTD_HOD": 1,
      "changeParts.approvalOfPRD_HOD": 1,
      "changeParts.approvalOfTOOL_ROOM": 1,
    };
    return next();
  },
);

exports.acceptOrRejectPartApproval = tryCatchHandler(async (req, res, next) => {
  const { _id, partId } = req.query;
  const { isApproved, rejectedRemarks } = req.body;
  const [{ changeParts, section, machine }] = req.tableData;

  if (!isApproved)
    return res.status(400).json({
      message: "Please provide required data to approve",
      showToast: true,
    });

  let schemaKey = `changeParts.$[part].`,
    currentApprovalKey =
      changeParts?.dynamicApprovalKeys?.[changeParts?.currentApprovalIndex],
    nextApprovalKey =
      changeParts?.dynamicApprovalKeys?.[changeParts?.currentApprovalIndex + 1];

  let updateObj = {
    $set: {
      [`${schemaKey}${currentApprovalKey}.approvalStatus`]: "Accepted",
      [`${schemaKey}${currentApprovalKey}.approvalDateAndTime`]:
        moment().format("D/M/YYYY - h:mm a"),
      [`${schemaKey}${currentApprovalKey}.rejectedRemarks`]: "",
      [`${schemaKey}pendingApprovalBy`]: null,
      [`${schemaKey}closingStatusIfTemporary`]: "Close",
    },
  };

  let isIssuanceCompleted = false;

  if (isApproved === "No") {
    updateObj.$set[`${schemaKey}${currentApprovalKey}.approvalStatus`] =
      "Rejected";
    updateObj.$set[`${schemaKey}${currentApprovalKey}.rejectedRemarks`] =
      rejectedRemarks;
    updateObj.$set[`${schemaKey}issuanceApprovalStatus`] = "Rejected";
  } else {
    if (nextApprovalKey) {
      updateObj.$set[`${schemaKey}issuanceApprovalStatus`] =
        dynamicApprovalStatus[nextApprovalKey?.split("Of")?.[1]];
      updateObj.$inc = {
        [`${schemaKey}currentApprovalIndex`]: 1,
      };
      updateObj.$set[`${schemaKey}pendingApprovalBy`] =
        changeParts[nextApprovalKey]?.user?._id;
    } else {
      const [{ cell, budgetDetails }] = req.tableData;

      const monthIndex = (moment().month() + 12 - 3) % 12;
      const usedBudget =
        budgetDetails?.issuanceSheetRequired?.requiredBudget || 0;

      updateObj.$set[`${schemaKey}issuanceApprovalStatus`] =
        spareApprovalStatus[spareApprovalStatus?.length - 1];

      updateObj.$set[`${schemaKey}quantityRequired`] = 0;
      updateObj.$set[`${schemaKey}isStockOut`] = true;
      updateObj.$set[`${schemaKey}consumption`] = {
        cost: usedBudget,
        quantity: changeParts?.quantityRequired,
      };

      const masterId = req.query?.masterId;

      // Stock goes out of the master the part came from.
      const MasterModel =
        spareMasterTypeFor(changeParts?.masterType)?.model ?? SpareMaster;

      const [updatedMaster] = await Promise.all([
        MasterModel.findOneAndUpdate(
          { _id: masterId },
          [
            {
              $set: {
                // The stock-out is the part's latest movement; the rotation
                // buckets and the dead-stock list are judged on it.
                previousIssuedDate: "$lastIssuedDate",
                lastIssuedDate: "$$NOW",
                costDetails: {
                  $let: {
                    vars: {
                      final: {
                        $reduce: {
                          input: "$costDetails",
                          initialValue: {
                            remaining: changeParts?.quantityRequired,
                            result: [],
                          },
                          in: {
                            $let: {
                              vars: {
                                deduct: {
                                  $min: [
                                    "$$value.remaining",
                                    { $ifNull: ["$$this.availableQty", 0] },
                                  ],
                                },
                              },
                              in: {
                                remaining: {
                                  $subtract: ["$$value.remaining", "$$deduct"],
                                },
                                result: {
                                  $cond: [
                                    {
                                      $eq: [
                                        {
                                          $subtract: [
                                            "$$this.availableQty",
                                            "$$deduct",
                                          ],
                                        },
                                        0,
                                      ],
                                    },
                                    "$$value.result",
                                    {
                                      $concatArrays: [
                                        "$$value.result",
                                        [
                                          {
                                            $mergeObjects: [
                                              "$$this",
                                              {
                                                issuedQty: {
                                                  $add: [
                                                    {
                                                      $ifNull: [
                                                        "$$this.issuedQty",
                                                        0,
                                                      ],
                                                    },
                                                    "$$deduct",
                                                  ],
                                                },
                                                issuedCost: {
                                                  $add: [
                                                    {
                                                      $ifNull: [
                                                        "$$this.issuedCost",
                                                        0,
                                                      ],
                                                    },
                                                    {
                                                      $multiply: [
                                                        "$$deduct",
                                                        {
                                                          $ifNull: [
                                                            "$$this.costInINR",
                                                            0,
                                                          ],
                                                        },
                                                      ],
                                                    },
                                                  ],
                                                },
                                                availableQty: {
                                                  $subtract: [
                                                    "$$this.availableQty",
                                                    "$$deduct",
                                                  ],
                                                },
                                                overAllCost: {
                                                  $multiply: [
                                                    {
                                                      $subtract: [
                                                        "$$this.availableQty",
                                                        "$$deduct",
                                                      ],
                                                    },
                                                    {
                                                      $ifNull: [
                                                        "$$this.costInINR",
                                                        0,
                                                      ],
                                                    },
                                                  ],
                                                },
                                              },
                                            ],
                                          },
                                        ],
                                      ],
                                    },
                                  ],
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                    in: "$$final.result",
                  },
                },
              },
            },
          ],
          {
            new: true,
            projection: {
              costDetails: 1,
              minQuantity: 1,
              maxQuantity: 1,
              partNumber: 1,
              partName: 1,
            },
          },
        ),
        applyIssuanceToBudget({ cellId: cell?._id, monthIndex, usedBudget }),
      ]);

      /****************************
       * Reordering - Min qty touch
       ****************************/
      // Reorders are raised for the stock-in inventory only: the recycle and
      // repaired masters are reference catalogues, not stock that is reordered.
      if (
        MasterModel === SpareMaster &&
        updatedMaster &&
        isBelowReorderLevel(updatedMaster)
      ) {
        const openReorders = await findMastersWithOpenReorder([
          updatedMaster._id,
        ]);

        if (!openReorders.has(String(updatedMaster._id))) {
          const master = await SpareMaster.findOne({
            _id: updatedMaster._id,
          }).lean();

          /**
           * The sheet is always rebuilt from the master rather than cloned from
           * the previous one. A reorder raised on a later cycle has to reflect
           * today's stock, today's price and today's dates: cloning carried the
           * old quantity, the old budget and — worst — the previous cycle's
           * submitted/approval timestamps, which the Ordering Dashboard measures
           * every later stage against, so a fresh sheet would open already
           * running late. The earlier sheet is still consulted, but only for the
           * standing choices a person made that the master does not record.
           */
          const sourceSheet = await RequestSheetOfSpare.findOne({
            changeParts: { $elemMatch: { masterId: updatedMaster._id } },
          })
            .sort({ createdAt: -1 })
            .lean();

          if (master && canBuildSheetNumber(master)) {
            const changePart = changePartFromMaster(master);

            if (changePart.quantityRequired > 0) {
              const sequenceByLine = await reserveSheetNumbers([master]);

              await RequestSheetOfSpare.create(
                buildReorderSheet({
                  master,
                  sourceSheet,
                  requestSheetNo: formatSheetNo(
                    master,
                    sequenceByLine.get(String(master.line._id)),
                  ),
                  createdBy: req.rootUser,
                }),
              );
            }
          }
        }
      }


      // ── Stock-Ledger: STOCK_OUT entry ───────────────────────────────────
      // Final approver (Tool Room) just accepted this issuance part.
      // We look up the PO number from the most-recent request sheet that
      // contains this master's part, since the issuance document itself
      // does not store a PO number.
      const targetMasterId = req.query?.masterId || changeParts?.masterId;
      if (targetMasterId) {
        const poSheet = await RequestSheetOfSpare.findOne(
          { "changeParts.masterId": targetMasterId },
          { "changeParts.$": 1, requestSheetNo: 1 },
        )
          .sort({ createdAt: -1 })
          .lean();
        const poNumber = poSheet?.changeParts?.[0]?.poNumber || null;

        await appendLedgerEntry({
          masterId: targetMasterId,
          entryType: "STOCK_OUT",
          processingDate: new Date(),
          stockOutQtyNew: changeParts?.quantityRequired ?? null,
          orderNo: poNumber,
          // The issuance sheet's own hierarchy: where this stock was used.
          section,
          machine,
          referenceId: _id,
          referenceModel: "SpareIssuanceSummary",
          createdBy: req.rootUser,
        }).catch(() => {});
      }
      // ────────────────────────────────────────────────────────────────────

      isIssuanceCompleted = true;
    }
  }

  await SpareIssuanceSummary.updateOne({ _id }, updateObj, {
    arrayFilters: [{ "part._id": partId }],
  });

  if (isIssuanceCompleted) return next();

  return res.status(201).json({
    isIssuanceCompleted: false,
    message: "Issuance sheets approved successfully",
  });
});

exports.issuanceSheetCompletedResponse = tryCatchHandler(
  async (req, res, next) => {
    return res.status(201).json({
      message: "Issuance sheets approved successfully",
      isIssuanceCompleted: true,
      tableData: req.tableData,
    });
  },
);

exports.applyIssuanceToBudget = applyIssuanceToBudget;
