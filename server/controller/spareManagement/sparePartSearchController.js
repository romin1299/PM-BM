const mongoose = require("mongoose");

const tryCatchHandler = require("../../errorHandler/tryCatchHandler");
const SpareMaster = require("../../model/spareMasterSchema");
const {
  generateRegexSearchString,
  paginationRowLimit,
} = require("../../utils/spareManagementUtils");

/** Params that steer the request rather than filter it. */
const searchControlParams = new Set(["cursor", "showToast"]);

/**
 * Cursor paging on _id: `_id < cursor` against a descending sort walks the
 * collection at a constant cost per page.
 *
 * Returns null for a cursor that is not an id at all, which the caller answers
 * with a 400 — mongoose.Types.ObjectId throws on anything else.
 */
const buildCursorMatch = (cursor) => {
  if (!cursor) return {};

  if (!mongoose.Types.ObjectId.isValid(cursor)) return null;

  return { _id: { $lt: mongoose.Types.ObjectId(cursor) } };
};

/**
 * The page envelope shared by the two cursor-scrolled master searches.
 *
 * The cursor is read from masterId rather than _id. findSearchMaster projects
 * the document id out and re-exposes it under that name, so reading _id here
 * handed back an undefined cursor on every page while hasMore stayed true. The
 * scrolling table then re-requested page one for each scroll: the results were
 * capped at the first 50 rows and the loading panel flashed continuously as the
 * same page was fetched over and over.
 *
 * hasMore is therefore tied to holding a usable cursor, so that a page which
 * cannot be continued from ends the scroll instead of restarting it.
 */
const searchPageResponse = (message) =>
  tryCatchHandler(async (req, res, next) => {
    const tableData = req.tableData ?? [];
    const nextCursor = tableData[tableData.length - 1]?.masterId ?? null;

    return res.status(201).json({
      message,
      tableData,
      nextCursor,
      hasMore: Boolean(nextCursor) && tableData.length >= paginationRowLimit,
    });
  });

/**
 * Picked from a fixed list, so matched exactly. Everything else is free text a
 * person typed and is matched as a fragment.
 */
const searchExactMatchFields = new Set(["whichParts"]);

/**
 * Filters for the Spare Part Search Button.
 *
 * Every typed field is matched as a case-insensitive fragment. They used to be
 * copied into the match as-is, which meant an exact, case-sensitive equality:
 * searching a part name found the part only if the whole name was typed with the
 * same capitalisation, and a model like "SET-AO-PCI(51)-C11" could not be found
 * by any part of it. generateRegexSearchString escapes the term, so the symbols
 * in these codes are matched literally rather than as regex syntax.
 *
 * The query is also built field by field rather than spread wholesale, so that
 * cursor — which paginates the request and is not a field on the document —
 * cannot end up in the match. It previously did, and since no master has a
 * "cursor" field, every page after the first came back empty.
 */
exports.getSearchParts = tryCatchHandler(async (req, res, next) => {
  const { machine_code, ...restQuery } = req.query;

  const $match = {};

  Object.entries(restQuery).forEach(([field, value]) => {
    if (searchControlParams.has(field)) return;

    const term = typeof value === "string" ? value.trim() : value;
    if (!term) return;

    $match[field] = searchExactMatchFields.has(field)
      ? term
      : generateRegexSearchString(String(term));
  });

  if (machine_code)
    $match["machine.machine_code"] = generateRegexSearchString(machine_code);

  if (Object.keys($match).length <= 0)
    return res.status(400).json({
      message: "Please provide required search text",
    });

  const cursorMatch = buildCursorMatch(req.query.cursor);

  if (cursorMatch === null)
    return res.status(400).json({
      message: "Invalid cursor",
    });

  req.$match = { ...$match, ...cursorMatch };
  req.otherPipeline = [{ $sort: { _id: -1 } }, { $limit: paginationRowLimit }];

  return next();
});

exports.searchPartResponse = searchPageResponse("Spare details get successfully");

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
        partNumber: 1,
        partName: 1,
        partModel: 1,
        maker: 1,
        closingStatusIfTemporary: "Open",
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
      { partNumber: searchRegex },
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

  const cursorMatch = buildCursorMatch(req.query.cursor);

  if (cursorMatch === null)
    return res.status(400).json({
      message: "Invalid cursor",
    });

  req.$match = { ...$match, ...cursorMatch };
  req.otherPipeline = [{ $sort: { _id: -1 } }, { $limit: paginationRowLimit }];

  return next();
});

exports.masterListResponse = searchPageResponse("Master details get successfully");
