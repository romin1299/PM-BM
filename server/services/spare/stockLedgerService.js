const SpareMasterStockLedger = require("../../model/spareMasterStockLedger");

/**
 * Stock-Ledger Service
 *
 * Centralises every write to the SpareMasterStockLedger collection so the
 * three hook sites (spare-sheet creation, part receipt, issuance approval)
 * share the same balance-computation logic.
 */

/**
 * Compute the latest running balance for a master from the last ledger row.
 *
 * @param {string|import("mongoose").Types.ObjectId} masterId
 * @returns {Promise<{ stockQtyNew: number, stockQtyUsed: number }>}
 */
const getLastBalance = async (masterId) => {
  const last = await SpareMasterStockLedger.findOne({ masterId })
    .sort({ processingDate: -1, createdAt: -1 })
    .select("stockQtyNew stockQtyUsed")
    .lean();

  if (last) {
    return {
      stockQtyNew: last?.stockQtyNew ?? 0,
      stockQtyUsed: last?.stockQtyUsed ?? 0,
    };
  }

  // Baseline fallback: if no ledger history exists yet, seed from master's current stock
  try {
    const SpareMaster = require("../../model/spareMasterSchema");
    const master = await SpareMaster.findById(masterId, { costDetails: 1 }).lean();
    const currentStock = (master?.costDetails ?? []).reduce(
      (sum, tranche) => sum + (tranche?.availableQty ?? 0),
      0,
    );
    return {
      stockQtyNew: currentStock,
      stockQtyUsed: 0,
    };
  } catch {
    return {
      stockQtyNew: 0,
      stockQtyUsed: 0,
    };
  }
};

/**
 * Append one ledger entry for a master, computing the new running balance
 * from the previous row.
 *
 * Qty sign convention (caller always passes positive numbers):
 *   stockInQty  → adds to balance
 *   stockOutQty → subtracts from balance
 *   orderQty    → no balance change (it is a forward-looking order, not a
 *                  physical movement yet)
 *   adjustedQty → no balance change (reserved for future manual corrections)
 *
 * @param {Object} params
 * @param {string|import("mongoose").Types.ObjectId} params.masterId          - SpareMaster _id
 * @param {"ORDER"|"STOCK_IN"|"STOCK_OUT"}           params.entryType
 * @param {Date}   [params.processingDate]            - defaults to now
 * @param {number} [params.stockInQtyNew]
 * @param {number} [params.stockInQtyUsed]
 * @param {number} [params.stockOutQtyNew]
 * @param {number} [params.stockOutQtyUsed]
 * @param {number} [params.orderQty]
 * @param {string} [params.orderNo]
 * @param {Object} [params.section]                   - section the stock went out to (STOCK_OUT)
 * @param {Object} [params.machine]                   - machine the stock went out to (STOCK_OUT)
 * @param {string|import("mongoose").Types.ObjectId} [params.referenceId]
 * @param {string} [params.referenceModel]
 * @param {{ tm_no?: number, tm_name?: string }} [params.createdBy]
 * @returns {Promise<import("mongoose").Document>}
 */
const appendLedgerEntry = async ({
  masterId,
  entryType,
  processingDate = new Date(),
  stockInQtyNew = null,
  stockInQtyUsed = null,
  stockOutQtyNew = null,
  stockOutQtyUsed = null,
  adjustedQtyNew = null,
  adjustedQtyUsed = null,
  orderQty = null,
  orderNo = null,
  section = null,
  machine = null,
  referenceId = null,
  referenceModel = null,
  createdBy = {},
}) => {
  const { stockQtyNew: prevNew, stockQtyUsed: prevUsed } =
    await getLastBalance(masterId);

  /* Running balance: in adds, out subtracts, order/adjusted do not move it. */
  const stockQtyNew =
    prevNew + (stockInQtyNew ?? 0) - (stockOutQtyNew ?? 0);
  const stockQtyUsed =
    prevUsed + (stockInQtyUsed ?? 0) - (stockOutQtyUsed ?? 0);

  const entry = new SpareMasterStockLedger({
    masterId,
    entryType,
    processingDate,
    stockInQtyNew,
    stockInQtyUsed,
    stockOutQtyNew,
    stockOutQtyUsed,
    adjustedQtyNew,
    adjustedQtyUsed,
    stockQtyNew,
    stockQtyUsed,
    orderQty,
    orderNo: entryType === "STOCK_OUT" ? orderNo : null,
    section: entryType === "STOCK_OUT" ? section : null,
    machine: entryType === "STOCK_OUT" ? machine : null,
    referenceId,
    referenceModel,
    createdBy: {
      tm_no: createdBy?.tm_no ?? null,
      tm_name: createdBy?.tm_name ?? null,
    },
  });

  return entry.save();
};

/**
 * Return all ledger rows for one master, newest first.
 *
 * @param {string|import("mongoose").Types.ObjectId} masterId
 * @returns {Promise<Array>}
 */
const mongoose = require("mongoose");

const encodeCursor = (row) =>
  Buffer.from(
    JSON.stringify({
      d: row.processingDate ? new Date(row.processingDate).toISOString() : null,
      i: String(row._id),
    }),
  ).toString("base64url");

const decodeCursor = (cursor) => {
  try {
    const { d, i } = JSON.parse(Buffer.from(cursor, "base64url").toString());
    if (!mongoose.Types.ObjectId.isValid(i)) return null;
    return {
      date: d ? new Date(d) : null,
      _id: new mongoose.Types.ObjectId(i),
    };
  } catch {
    if (mongoose.Types.ObjectId.isValid(cursor)) {
      return { date: null, _id: new mongoose.Types.ObjectId(cursor) };
    }
    return null;
  }
};

/**
 * Return paged ledger rows for one master in FIFO order using cursor-based pagination.
 *
 * @param {Object|string} args - { masterId, cursor, limit } or masterId string
 * @returns {Promise<{ tableData: Array, nextCursor: string|null, hasMore: boolean }>}
 */
const getLedgerForMaster = async (args) => {
  const masterId =
    typeof args === "object" && args !== null ? args.masterId : args;
  const cursor = typeof args === "object" ? args.cursor : null;
  const pageSize =
    typeof args === "object" && args.limit ? Number(args.limit) : 20;

  const match = { masterId: new mongoose.Types.ObjectId(masterId) };

  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (decoded) {
      const { date, _id } = decoded;
      if (date) {
        match.$or = [
          { processingDate: { $gt: date } },
          { processingDate: date, _id: { $gt: _id } },
        ];
      } else {
        match._id = { $gt: _id };
      }
    }
  }

  const tableData = await SpareMasterStockLedger.find(match)
    .sort({ processingDate: 1, _id: 1 })
    .limit(pageSize)
    .lean();

  const nextCursor =
    tableData.length >= pageSize
      ? encodeCursor(tableData[tableData.length - 1])
      : null;

  return {
    tableData,
    nextCursor,
    hasMore: Boolean(nextCursor) && tableData.length >= pageSize,
  };
};

module.exports = { appendLedgerEntry, getLedgerForMaster };
