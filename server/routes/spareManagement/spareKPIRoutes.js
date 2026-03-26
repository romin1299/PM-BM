const express = require("express");
const router = express.Router();

const {
  spareFilterMiddleware,
  getSpareRequestSheets,
} = require("../../controller/spareManagement/spareMiddleware");
const {
  getRequestSheets,
  getSpareSheetsSummery,
} = require("../../controller/spareManagement/spareKPIController");

router
  .route("/spareKPI/spareSheets")
  .get(spareFilterMiddleware, getSpareRequestSheets, getRequestSheets);

router
  .route("/spareKPI/spareSheetsSummery")
  .get(spareFilterMiddleware, getSpareSheetsSummery);

module.exports = router;
