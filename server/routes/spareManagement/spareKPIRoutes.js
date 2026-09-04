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
  getReasonForZeroStock,
  handleReasonForZeroStock,

  getMTDRAndPlanVsActual,
  getInventoryBifurcationEachCellWise,
  getNewSparesOrderingTrend,
  getTemporaryPartIssueTrend,
  getReceivingInspectionManufacturingParts,
} = require("../../controller/spareManagement/spareKPIController");

const {
  spareFilterMiddleware,
} = require("../../controller/spareManagement/spareMiddleware");

const {
  requiredBudgetCalculation,
} = require("../../controller/spareManagement/spareIssuanceSummaryController");

router
  .route("/kpi/summery/inventory")
  .get(yearMonthFilter, getInventorySummery);

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

router
  .route("/kpi/summery/stockLifeTime")
  .get(yearMonthFilter, getStockLifeTimelineSummery);

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
    spareFilterMiddleware,
    yearMonthFilter,
    getInventoryBifurcationHierarchyWise,
  );

router
  .route("/kpi/topInventory")
  .get(spareFilterMiddleware, yearMonthFilter, getTopInventoryItems);

router
  .route("/kpi/supplierCategoryWise")
  .get(
    spareFilterMiddleware,
    yearMonthFilter,
    getSpareDetailsSupplierCategoryWise,
  );

router.route("/kpi/stockLevelWiseAnalysis").get(getStockLevelWiseAnalysis);

router.route("/kpi/partList").get(yearMonthFilter, getZeroStockPartList);

router
  .route("/kpi/remarks")
  .get(getReasonForZeroStock)
  .patch(handleReasonForZeroStock);

router.route("/kpi/mtdRAndPlanVsActual").get(getMTDRAndPlanVsActual);
router
  .route("/kpi/inventoryBifurcation/eachCellWise")
  .get(getInventoryBifurcationEachCellWise);

router.route("/kpi/newSparesOrderingTrend").get(getNewSparesOrderingTrend);
router
  .route("/kpi/temporaryPartIssueTrend")
  .get(requiredBudgetCalculation, getTemporaryPartIssueTrend);

router
  .route("/kpi/receivingInspectionManufacturingParts")
  .get(yearMonthFilter, getReceivingInspectionManufacturingParts);

module.exports = router;
