const express = require("express");
const router = express.Router();

const {
  yearMonthFilter,
  getInventorySummery,
  getSpareSheetsSummeryForKPI,
  IsToolRoomPerson,
  getMachineCost,
  registerMachineCost,
  updateMachineCost,
  getConsumptionTrendData,
  getStockLifeTimelineSummery,
  getNewAndStockInSparesOrderingTrend,

  // inventoryTargetValidationAndFilter,
  getInventoryTarget,
  registerInventoryTarget,
  updateInventoryTarget,

  getInventoryTrend,
  getInventoryBifurcation,
  getInventoryBifurcationHierarchyWise,
  getTopInventoryItems,
  getSpareDetailsSupplierCategoryWise,
  getStockLevelWiseAnalysis,
  getZeroStockPartList,
  exportZeroStockPartList,
  getPartListColumnValues,
  getReasonForZeroStock,
  handleReasonForZeroStock,

  getMTDRAndPlanVsActual,
  getInventoryBifurcationEachCellWise,
  getCellInventoryTarget,
  saveCellInventoryTarget,
  getNewSparesOrderingTrend,
  getTemporaryPartIssueTrend,
  getReceivingInspectionManufacturingParts,
} = require("../../controller/spareManagement/spareKPIController");

const {
  spareFilterMiddlewareWithOptionalYear,
} = require("../../controller/spareManagement/spareMiddleware");

const {
  requiredBudgetCalculation,
} = require("../../controller/spareManagement/spareIssuanceSummaryController");

router
  .route("/kpi/summery/inventory")
  .get(getInventorySummery);

router
  .route("/kpi/summery/requestSheet")
  .get(yearMonthFilter, getSpareSheetsSummeryForKPI);

router
  .route("/kpi/machineCost")
  .post(IsToolRoomPerson, registerMachineCost)
  .patch(IsToolRoomPerson, updateMachineCost)
  .get(getMachineCost);

router
  .route("/kpi/consumptionTrend")
  .get(yearMonthFilter, getConsumptionTrendData);

// Likewise unfiltered — the handler has always ignored the filter, and the
// zero-stock and rotation figures it returns are current-state counts.
router.route("/kpi/summery/stockLifeTime").get(getStockLifeTimelineSummery);

router
  .route("/kpi/newAndStockInSparesOrderingTrend")
  .get(getNewAndStockInSparesOrderingTrend);

router
  .route("/kpi/target/inventory")
  .get(getInventoryTarget)
  .patch(updateInventoryTarget)
  .post(registerInventoryTarget);

router.route("/kpi/inventoryTrend").get(getInventoryTrend);
router
  .route("/kpi/inventoryBifurcation/overAll")
  .get(yearMonthFilter, getInventoryBifurcation);

router
  .route("/kpi/inventoryBifurcation/hierarchyWise")
  .get(
    spareFilterMiddlewareWithOptionalYear,
    yearMonthFilter,
    getInventoryBifurcationHierarchyWise,
  );

router
  .route("/kpi/topInventory")
  .get(spareFilterMiddlewareWithOptionalYear, yearMonthFilter, getTopInventoryItems);

router
  .route("/kpi/supplierCategoryWise")
  .get(
    spareFilterMiddlewareWithOptionalYear,
    yearMonthFilter,
    getSpareDetailsSupplierCategoryWise,
  );

// Year and month are optional: with neither it covers every master, and each
// one chosen narrows it.
router
  .route("/kpi/stockLevelWiseAnalysis")
  .get(yearMonthFilter, getStockLevelWiseAnalysis);

/**
 * No yearMonthFilter: what is on the shelf is a fact about today, and these
 * lists are counted whole so they agree with the Inventory Dashboard's stock
 * figures, which never filtered either.
 */
router.route("/kpi/partList").get(getZeroStockPartList);
router.route("/kpi/partList/export").get(exportZeroStockPartList);
router.route("/kpi/partList/columnValues").get(getPartListColumnValues);

router
  .route("/kpi/remarks")
  .get(getReasonForZeroStock)
  .patch(handleReasonForZeroStock);

router.route("/kpi/mtdRAndPlanVsActual").get(getMTDRAndPlanVsActual);
router
  .route("/kpi/inventoryBifurcation/eachCellWise")
  .get(getInventoryBifurcationEachCellWise);

// Setting a target is tool-room work, like the other KPI targets and the
// machine cost; reading one is open to everyone who can see the chart.
router
  .route("/kpi/inventoryBifurcation/eachCellWise/target")
  .get(getCellInventoryTarget)
  .post(IsToolRoomPerson, saveCellInventoryTarget);

router.route("/kpi/newSparesOrderingTrend").get(getNewSparesOrderingTrend);
router
  .route("/kpi/temporaryPartIssueTrend")
  .get(requiredBudgetCalculation, getTemporaryPartIssueTrend);

router
  .route("/kpi/receivingInspectionManufacturingParts")
  .get(yearMonthFilter, getReceivingInspectionManufacturingParts);

module.exports = router;
