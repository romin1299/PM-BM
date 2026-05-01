const express = require("express");
const router = express.Router();

const {
  spareFilterMiddleware,
} = require("../../controller/spareManagement/spareMiddleware");

const {
  getOKBudgetOrNGApprovedRequestSheets,
  findOrderTrackingData,
} = require("../../controller/spareManagement/sparePartOrderTrackingController");

router
  .route("/spareOrderTacking/spareRequestSheet")
  .get(
    spareFilterMiddleware,
    getOKBudgetOrNGApprovedRequestSheets,
    findOrderTrackingData,
  );

module.exports = router;
