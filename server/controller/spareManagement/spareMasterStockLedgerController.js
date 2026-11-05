const tryCatchHandler = require("../../errorHandler/tryCatchHandler");
const { getLedgerForMaster } = require("../../services/spare/stockLedgerService");

/**
 * GET /v1/spare/master/stockLedger?masterId=<id>&cursor=<cursor>&limit=<limit>
 *
 * Returns cursor-paginated ledger rows for the requested master in FIFO order.
 * Paged continuously on scroll by the client.
 */
exports.getMasterStockLedger = tryCatchHandler(async (req, res) => {
  const { masterId, cursor, limit } = req.query;

  if (!masterId)
    return res.status(400).json({
      message: "Please provide masterId",
      showToast: true,
    });

  const { tableData, nextCursor, hasMore } = await getLedgerForMaster({
    masterId,
    cursor,
    limit,
  });

  return res.status(200).json({
    message: "Stock ledger fetched successfully",
    tableData,
    ledger: tableData, // backward compatibility
    nextCursor,
    hasMore,
  });
});