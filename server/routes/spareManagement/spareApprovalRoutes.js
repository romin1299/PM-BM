const express = require("express");
const router = express.Router();

const {
  spareFilterMiddleware,
  getSpareRequestSheets,
} = require("../../controller/spareManagement/spareMiddleware");
const {
  NGBudgetMTD_HODFilters,
  getApprovalRequestSheets,
} = require("../../controller/spareManagement/spareApprovalController");

router
  .route("/spareRequestSheet/approval")
  .get(
    spareFilterMiddleware,
    NGBudgetMTD_HODFilters,
    getSpareRequestSheets,
    getApprovalRequestSheets
  );

module.exports = router;
