const express = require("express");
const router = express.Router();

const {
  spareFilterMiddleware,
  spareFilterMiddlewareWithOptionalYear,
} = require("../../controller/spareManagement/spareMiddleware");

const {
  handleSpareIssuanceSheet,
  getMachineHierarchy,
  issuanceSummeryUpdate,
  getIssuanceSummeryBasedOnId,
  spareIssuanceFilters,
  issuanceSummeryQueryGeneration,
  requiredBudgetCalculation,
  issuanceSummeryProjection,
  responseIssuanceSummeryUpdate,
  getIssuanceSummery,
  issuanceSummaryResponse,
  getIssuanceColumnValues,
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

router.route("/spareIssuanceSheet/machineHierarchy").get(getMachineHierarchy);

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
  .route("/spareIssuanceSummary/columnValues")
  .get(spareFilterMiddlewareWithOptionalYear, getIssuanceColumnValues);

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
