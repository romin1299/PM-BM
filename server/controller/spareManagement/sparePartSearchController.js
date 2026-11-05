const mongoose = require("mongoose");

const tryCatchHandler = require("../../errorHandler/tryCatchHandler");
const SpareMaster = require("../../model/spareMasterSchema");
const { SPARE_MASTER_TYPES } = require("../../model/spareMasterTypes");
const {
  generateRegexSearchString,
  paginationRowLimit,
} = require("../../utils/spareManagementUtils");
const { createColumnFilters, escapeRegex } = require("../../utils/columnFilters");

/** Params that steer the request rather than filter the masters. */
const searchControlParams = new Set([
  "cursor",
  "showToast",
  "filters",
  "column",
  "search",
]);

/**
 * The result columns a reader can filter Excel-style, each mapped to the master
 * field it reads from. Plain text columns only: the computed quantity and unit
 * cost are summed per part and are not value-pickable, and the Master column is
 * already narrowed by the "Master List" choice.
 */
const SEARCH_FILTER_COLUMNS = {
  plantName: "createdBy.plant_data",
  location: "location",
  uniqueID: "uniqueID",
  partNumber: "partNumber",
  partName: "partName",
  partModel: "partModel",
  machineCode: "machine.machine_code",
  machineName: "machine.machine_name",
};

const { parse: parseColumnFilters, match: columnFilterMatch } =
  createColumnFilters(new Set(Object.keys(SEARCH_FILTER_COLUMNS)));

/**
 * The column filters as a $match over the master's own fields. The client keys
 * them by result-column name; each is mapped to the field behind it so the
 * match can run before paging rather than over one already-paged slice.
 */
const columnFiltersToMatch = (filters) => {
  const reKeyed = {};
  for (const [column, values] of Object.entries(filters)) {
    const path = SEARCH_FILTER_COLUMNS[column];
    if (path) reKeyed[path] = values;
  }
  return columnFilterMatch(reKeyed);
};

/** Ands the non-empty matches together, so none overwrites another's field. */
const combineMatches = (matches) => {
  const clauses = matches.filter((m) => m && Object.keys(m).length > 0);
  if (clauses.length === 0) return {};
  return clauses.length === 1 ? clauses[0] : { $and: clauses };
};

/** How many values a filter dropdown lists before it says "search to narrow". */
const COLUMN_VALUES_LIMIT = 300;

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
      // Only on the first page; later pages continue the same search.
      ...(req.totalCount !== undefined ? { totalCount: req.totalCount } : {}),
    });
  });

/**
 * The "Master List" choice on the search page: which parts master to search.
 * It picks collections rather than filtering a field - Stock-in, Recycle and
 * Repaired are three catalogues in three collections - and the label is what
 * the results table shows in its Master column. Stock-in masters carry no
 * whichParts value at all (only the legacy import's one exception), so a field
 * match on it found nothing.
 */
const MASTER_LIST_CHOICES = {
  "Stock-in Parts": SPARE_MASTER_TYPES.stockIn,
  "Recycle Parts": SPARE_MASTER_TYPES.recycle,
  "Repaired Parts": SPARE_MASTER_TYPES.repaired,
};

/** Every master list, in the order the choices are offered. */
const ALL_MASTER_LISTS = Object.entries(MASTER_LIST_CHOICES).map(
  ([label, type]) => ({ label, type: type.key, model: type.model }),
);

/** The lists a search covers: the one chosen, or all three when none is. */
const searchSourcesFor = (choice) =>
  ALL_MASTER_LISTS.filter((source) => !choice || source.label === choice);

/**
 * The master-list choice and typed search fields as a $match, plus the lists to
 * search. Shared by the results page and the column-value dropdowns, so both
 * read one definition of "the current search".
 *
 * Every typed field is matched as a case-insensitive fragment via
 * generateRegexSearchString, which escapes the term so the symbols in codes like
 * "SET-AO-PCI(51)-C11" are matched literally rather than as regex syntax. The
 * match is built field by field, and the control params (cursor, column filters,
 * the dropdown's own column/search) are skipped so none of them lands in it.
 *
 * @returns {{ formMatch, sources }} or `{ error }` for an unknown master list or
 *   an empty search.
 */
const resolveSearch = (query) => {
  const { machine_code, whichParts } = query;

  const masterListChoice =
    typeof whichParts === "string" ? whichParts.trim() : "";

  if (masterListChoice && !MASTER_LIST_CHOICES[masterListChoice])
    return { error: `"${masterListChoice}" is not a master list` };

  const formMatch = {};
  Object.entries(query).forEach(([field, value]) => {
    if (
      searchControlParams.has(field) ||
      field === "machine_code" ||
      field === "whichParts"
    )
      return;

    const term = typeof value === "string" ? value.trim() : value;
    if (!term) return;

    formMatch[field] = generateRegexSearchString(String(term));
  });

  if (machine_code)
    formMatch["machine.machine_code"] = generateRegexSearchString(machine_code);

  // Choosing a master list on its own is a search too: it lists that master.
  if (Object.keys(formMatch).length <= 0 && !masterListChoice)
    return { error: "Please provide required search text" };

  return { formMatch, sources: searchSourcesFor(masterListChoice) };
};

exports.getSearchParts = tryCatchHandler(async (req, res, next) => {
  const { formMatch, sources, error } = resolveSearch(req.query);
  if (error) return res.status(400).json({ message: error });

  // The typed search and the ticked column filters narrow together, before
  // paging, so a filter applies to the whole result and not just a loaded page.
  const columnMatch = columnFiltersToMatch(parseColumnFilters(req.query.filters));
  const countMatch = combineMatches([formMatch, columnMatch]);

  const cursorMatch = buildCursorMatch(req.query.cursor);

  if (cursorMatch === null)
    return res.status(400).json({
      message: "Invalid cursor",
    });

  req.searchSources = sources;
  req.$match = combineMatches([countMatch, cursorMatch]);
  req.otherPipeline = [{ $sort: { _id: -1 } }, { $limit: paginationRowLimit }];

  // How many parts the search matches in all, for the reader to see above a
  // list that only ever shows a page at a time. Counted once, with the first
  // page; the cursor pages are the same search continued.
  if (!req.query.cursor)
    req.totalCount = (
      await Promise.all(
        req.searchSources.map(({ model }) => model.countDocuments(countMatch)),
      )
    ).reduce((total, count) => total + count, 0);

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

/**
 * The stages that gather matching masters from every list the search covers.
 *
 * The first list is the collection aggregated; the rest are brought in with
 * $unionWith, each matched on its own so only matches travel. Every row is
 * stamped with the list it came from for the Master column. _id orders the
 * union and serves as the page cursor: an ObjectId is unique across the
 * collections, and newest-first reads the same in all of them.
 *
 * Without `searchSources` (the location lookup and the master-list type-ahead
 * the request forms use) it is the stock-in master alone, as before.
 */
const gatherSources = (sources, $match) => {
  if (!sources?.length) return { Model: SpareMaster, stages: [{ $match }] };

  const [first, ...others] = sources;
  // masterType rides along so a part picked from the results can be found
  // again in its own collection (issuance reads and deducts its stock there).
  const label = (source) => ({
    $addFields: { whichParts: source.label, masterType: source.type },
  });

  return {
    Model: first.model,
    stages: [
      { $match },
      label(first),
      ...others.map((source) => ({
        $unionWith: {
          coll: source.model.collection.name,
          pipeline: [{ $match }, label(source)],
        },
      })),
    ],
  };
};

exports.findSearchMaster = tryCatchHandler(async (req, res, next) => {
  const { Model, stages } = gatherSources(req.searchSources, req.$match);

  const tableData = await Model.aggregate([
    ...stages,
    ...req.otherPipeline,
    {
      $project: {
        _id: 0,
        masterId: "$_id",
        masterType: 1,
        plantName: "$createdBy.plant_data",
        whichParts: 1,
        location: 1,
        uniqueID: 1,
        partNumber: 1,
        partName: 1,
        partModel: 1,
        machineCode: "$machine.machine_code",
        machineName: "$machine.machine_name",
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

/**
 * Distinct values of one result column with how many parts hold each — the list
 * a column's filter dropdown shows. Narrowed by the current search and by the
 * other columns' filters, the way Excel narrows its lists, and by the dropdown's
 * own search box. Blank cells come back as a single null entry. Drawn from the
 * same lists the results come from, so the values on offer are the ones that can
 * actually appear in the table.
 */
exports.getSearchPartColumnValues = tryCatchHandler(async (req, res, next) => {
  const { column, search = "" } = req.query;

  const sourcePath = SEARCH_FILTER_COLUMNS[column];
  if (!sourcePath)
    return res.status(400).json({
      message: `"${column}" is not a filterable column`,
      showToast: true,
    });

  const { formMatch, sources, error } = resolveSearch(req.query);
  if (error) return res.status(400).json({ message: error });

  // Narrow by the other ticked columns, not by this one, so its own list stays
  // whole while the others shrink it.
  const otherFilters = parseColumnFilters(req.query.filters);
  delete otherFilters[column];

  const baseMatch = combineMatches([
    formMatch,
    columnFiltersToMatch(otherFilters),
  ]);

  const { Model, stages } = gatherSources(sources, baseMatch);

  const values = await Model.aggregate([
    ...stages,
    {
      $set: {
        value: {
          $cond: [{ $in: [`$${sourcePath}`, [null, ""]] }, null, `$${sourcePath}`],
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

  // The request forms look a part up across all three masters.
  req.searchSources = ALL_MASTER_LISTS;
  req.$match = { ...$match, ...cursorMatch };
  req.otherPipeline = [{ $sort: { _id: -1 } }, { $limit: paginationRowLimit }];

  return next();
});

exports.masterListResponse = searchPageResponse("Master details get successfully");
