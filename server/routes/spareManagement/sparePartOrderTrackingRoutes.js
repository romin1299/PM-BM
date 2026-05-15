const express = require("express");
const router = express.Router();

const {
  spareFilterMiddleware,
} = require("../../controller/spareManagement/spareMiddleware");

const {
  orderTrackingAggregationFilters,
  orderTrackingDashboardProjection,
  getOKBudgetOrNGApprovedRequestSheets,
  findOrderTrackingData,
} = require("../../controller/spareManagement/sparePartOrderTrackingController");

router
  .route("/spareOrderTacking/spareRequestSheet")
  .get(
    spareFilterMiddleware,
    orderTrackingAggregationFilters,
    orderTrackingDashboardProjection,
    getOKBudgetOrNGApprovedRequestSheets,
    findOrderTrackingData,
  );

module.exports = router;
