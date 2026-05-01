const express = require("express");
const router = express.Router();

const {
  spareFilterMiddleware,
  getSpareRequestSheets,
} = require("../../controller/spareManagement/spareMiddleware");

const {
  getSpareSheetGenerateAndCompletedCount,
  NGBudgetMTD_HODFilters,
  getApprovalRequestSheets,
  getApprovalLogs,
  getApproveAndPendingUsersWiseCount,
} = require("../../controller/spareManagement/spareApprovalController");

router
  .route("/generatedAndCompletedCount")
  .get(spareFilterMiddleware, getSpareSheetGenerateAndCompletedCount);

router
  .route("/spareRequestSheet/approval")
  .get(
    spareFilterMiddleware,
    NGBudgetMTD_HODFilters,
    getSpareRequestSheets,
    getApprovalRequestSheets,
  );

router
  .route("/spareRequestSheet/logs")
  .get(spareFilterMiddleware, getApprovalLogs);

router
  .route("/spareRequestSheet/approveAndPendingCount")
  .get(spareFilterMiddleware, getApproveAndPendingUsersWiseCount);

module.exports = router;
