const express = require("express");
const router = express.Router();

const {
  getMasterStockLedger,
} = require("../../controller/spareManagement/spareMasterStockLedgerController");

/**
 * Stock ledger for a spare-part master.
 * GET  /v1/spare/master/stockLedger?masterId=<id>
 */
router.route("/master/stockLedger").get(getMasterStockLedger);

module.exports = router;
