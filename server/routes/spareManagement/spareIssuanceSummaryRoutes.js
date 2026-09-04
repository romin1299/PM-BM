const express = require("express");
const router = express.Router();

const {
  spareFilterMiddleware,
} = require("../../controller/spareManagement/spareMiddleware");

const {
  handleSpareIssuanceSheet,
  issuanceSummeryUpdate,
  getIssuanceSummeryBasedOnId,
  spareIssuanceFilters,
  issuanceSummeryQueryGeneration,
  requiredBudgetCalculation,
  issuanceSummeryProjection,
  responseIssuanceSummeryUpdate,
  getIssuanceSummery,
  issuanceSummaryResponse,
  exportIssuanceSummeryQueryGeneration,
  exportIssuanceSummaryResponse,
  getIssuanceSummeryCounters,
  handleSetPartApproval,
  submitApprovalResponse,
  getPartApprovalFilter,
  sendApprovalProjection,
  getPartApprovalResponse,
  acceptOrRejectApprovalProjection,
  acceptOrRejectPartApproval,
  issuanceSheetCompletedResponse,
} = require("../../controller/spareManagement/spareIssuanceSummaryController");

router
  .route("/spareIssuanceSheet")
  .post(handleSpareIssuanceSheet)
  .patch(
    issuanceSummeryUpdate,
    requiredBudgetCalculation,
    issuanceSummeryProjection,
    getIssuanceSummery,
    responseIssuanceSummeryUpdate,
  )
  .get(requiredBudgetCalculation, getIssuanceSummeryBasedOnId);

router
  .route("/spareIssuanceSummary")
  .get(
    spareFilterMiddleware,
    spareIssuanceFilters,
    issuanceSummeryQueryGeneration,
    requiredBudgetCalculation,
    issuanceSummeryProjection,
    getIssuanceSummery,
    issuanceSummaryResponse,
  );

router
  .route("/spareIssuanceSummary/export")
  .get(
    spareFilterMiddleware,
    spareIssuanceFilters,
    exportIssuanceSummeryQueryGeneration,
    requiredBudgetCalculation,
    getIssuanceSummery,
    exportIssuanceSummaryResponse,
  );

router
  .route("/spareIssuanceSummaryCounters")
  .get(spareFilterMiddleware, spareIssuanceFilters, getIssuanceSummeryCounters);

router
  .route("/spareIssuance/approval")
  .post(
    handleSetPartApproval,
    requiredBudgetCalculation,
    issuanceSummeryProjection,
    getIssuanceSummery,
    submitApprovalResponse,
  )
  .get(
    getPartApprovalFilter,
    sendApprovalProjection,
    getIssuanceSummery,
    getPartApprovalResponse,
  )
  .patch(
    getPartApprovalFilter,
    requiredBudgetCalculation,
    acceptOrRejectApprovalProjection,
    getIssuanceSummery,
    acceptOrRejectPartApproval,
    issuanceSummeryProjection,
    getIssuanceSummery,
    issuanceSheetCompletedResponse,
  );

module.exports = router;
