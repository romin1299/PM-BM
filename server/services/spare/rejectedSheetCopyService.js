const mongoose = require("mongoose");

const RequestSheetOfSpare = require("../../model/requestSheetDataOfSpare");
const { toFileEntry } = require("./masterDrawingService");
const {
  spareRejectedStatus,
  paginationRowLimit,
  buildRegexSearchFilter,
  hooksFormReferenceOfApproval,
} = require("../../utils/spareManagementUtils");

/**
 * Raising a new request-sheet from a rejected one.
 *
 * A rejection is final — the sheet is closed rather than handed back — so a
 * requester answering one had to key every part in again from scratch. This
 * copies the requester's own choices: the request type, the parts, their
 * drawings and the approvers picked for the chain.
 *
 * Nothing the sheet earned afterwards comes with it — no number, status,
 * decisions, approval logs or order tracking, and no masterId, so the copy is a
 * fresh request rather than a second claim on the same part record. Only the
 * approvers' identities are taken from the slots; their decisions are not.
 *
 * The hierarchy is returned beside the sheet rather than inside it: the form
 * does not hold those fields — the filter bar does, and the server reads them
 * back off the chosen machine when the sheet is submitted. They travel as ids
 * so the filter bar can preselect the place the original sheet was raised for,
 * which the requester is then free to change.
 *
 * Drawings are carried over by reference rather than duplicated on disk: both
 * sheets then name the same file, which `isDrawingReferenced` already accounts
 * for when deciding whether removing one may delete it.
 */

/** Sheet-level answers that describe the request itself. */
const SHEET_FIELDS = ["newPartFor", "partQty", "partRequestFor"];

/** What the requester filled in for a part, minus anything the sheet earned later. */
const PART_FIELDS = [
  "partName",
  "partModel",
  "minQuantity",
  "maxQuantity",
  "quantityRequired",
  "maker",
  "supplierName",
  "supplierCategory",
  "approxUnitPrice",
  "standerOrManufacturingPart",
  "normalOrUrgentPart",
];

const ATTACHMENT_FIELDS = ["drawingAttach", "additionalAttachments"];

/**
 * The levels the new-request filter bar offers, in cascade order. Plant is not
 * among them: the bar starts at section, and the plant follows from the machine.
 */
const HIERARCHY_LEVELS = ["section", "subSection", "cell", "line", "machine"];

/**
 * Every approval slot a sheet can carry: the dynamic chain, plus the NG-budget
 * one that sits outside it. Derived from the chain definition so a slot added
 * there is copied without this list being remembered.
 */
const APPROVAL_KEYS = [
  ...Object.values(hooksFormReferenceOfApproval).map((ref) => ref.approvalKey),
  "mtdHODApprovalIfBudgetIsNG",
];

/**
 * Who the original requester chose for each approval slot, so the chain comes
 * back preselected instead of being picked again.
 *
 * A rejection ends the sheet: the approvers who had already decided keep their
 * slots, while the ones who never got to are cleared along with the "Pending"
 * entry they were given when the sheet was sent. Whoever is still on record is
 * recovered — slot first, then the newest log entry naming a user — and any
 * slot the rejection erased is simply left for the requester to fill.
 */
const copyApprovals = (sheet) =>
  APPROVAL_KEYS.reduce((approvals, key) => {
    const userId =
      sheet?.[key]?.user?._id ??
      [...(sheet?.[`${key}ApprovalLogs`] ?? [])]
        .reverse()
        .find((entry) => entry?.user?._id)?.user?._id;

    if (userId) approvals[key] = { user: { _id: userId } };

    return approvals;
  }, {});

/** What the dropdown searches on: the sheet's own identifiers and its parts. */
const SEARCH_FIELDS = [
  "requestSheetNo",
  "machine.machine_name",
  "machine.machine_code",
  "cell.cell_name",
  "line.line_name",
  "changeParts.partName",
  "changeParts.partModel",
];

const pick = (source, keys) =>
  keys.reduce((picked, key) => {
    if (source?.[key] !== undefined) picked[key] = source[key];
    return picked;
  }, {});

/**
 * One page of rejected sheets for the copy dropdown, newest first. Paged on
 * `_id` against that same order, so the cursor walks the list without repeats.
 */
const listRejectedSheets = async ({ search, cursor } = {}) => {
  const $match = { requestSheetStatus: spareRejectedStatus };

  if (cursor) $match._id = { $lt: mongoose.Types.ObjectId(cursor) };
  if (search) Object.assign($match, buildRegexSearchFilter(search, SEARCH_FIELDS));

  const tableData = await RequestSheetOfSpare.aggregate([
    { $match },
    { $sort: { _id: -1 } },
    { $limit: paginationRowLimit },
    {
      $project: {
        requestSheetNo: 1,
        "cell.cell_name": 1,
        "line.line_name": 1,
        "machine.machine_name": 1,
        "requestSheetCreatedBy.tm_name": 1,
        partCount: { $size: { $ifNull: ["$changeParts", []] } },
      },
    },
  ]);

  return {
    tableData,
    nextCursor: tableData.length ? tableData[tableData.length - 1]._id : null,
    hasMore: tableData.length === paginationRowLimit,
  };
};

/**
 * @returns `{ isError, message }` when the sheet cannot be copied, otherwise
 *   `{ sheet }` holding only the fields the new-request form fills in.
 */
const buildSheetCopy = async (sheetId) => {
  if (!sheetId || !mongoose.Types.ObjectId.isValid(sheetId))
    return { isError: true, message: "Please select a rejected request sheet" };

  const projection = [...SHEET_FIELDS, ...PART_FIELDS, ...ATTACHMENT_FIELDS]
    .reduce(
      (fields, key) => ({
        ...fields,
        [SHEET_FIELDS.includes(key) ? key : `changeParts.${key}`]: 1,
      }),
      {
        _id: 0,
        ...HIERARCHY_LEVELS.reduce(
          (levels, level) => ({ ...levels, [`${level}._id`]: 1 }),
          {},
        ),
        ...APPROVAL_KEYS.reduce(
          (slots, key) => ({
            ...slots,
            [`${key}.user._id`]: 1,
            [`${key}ApprovalLogs.user._id`]: 1,
          }),
          {},
        ),
      },
    );

  const sheet = await RequestSheetOfSpare.findOne(
    { _id: sheetId, requestSheetStatus: spareRejectedStatus },
    projection,
  ).lean();

  if (!sheet)
    return {
      isError: true,
      message: "That request sheet is no longer available to copy",
    };

  return {
    // Only levels the sheet actually recorded; a gap stops the cascade there
    // rather than leaving the filter bar on a place the sheet never named.
    hierarchy: HIERARCHY_LEVELS.reduce((levels, level) => {
      if (sheet?.[level]?._id) levels[level] = sheet[level]._id;
      return levels;
    }, {}),
    sheet: {
      ...pick(sheet, SHEET_FIELDS),
      ...copyApprovals(sheet),
      changeParts: (sheet.changeParts ?? []).map((part) => ({
        ...pick(part, PART_FIELDS),
        ...ATTACHMENT_FIELDS.reduce(
          (attachments, fieldName) => ({
            ...attachments,
            // Mapped rather than passed through, so the subdocument ids of the
            // sheet being copied do not travel with the files.
            [fieldName]: (part?.[fieldName] ?? []).map(toFileEntry),
          }),
          {},
        ),
      })),
    },
  };
};

module.exports = { listRejectedSheets, buildSheetCopy };
