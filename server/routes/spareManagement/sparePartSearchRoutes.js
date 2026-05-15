const express = require("express");
const router = express.Router();

const {
  searchFilter,
} = require("../../controller/spareManagement/sparePartSearchController");

const {
  getOKBudgetOrNGApprovedRequestSheets,
  findOrderTrackingData,
} = require("../../controller/spareManagement/sparePartOrderTrackingController");

router
  .route("/spareSearch")
  .get(
    searchFilter,
    getOKBudgetOrNGApprovedRequestSheets,
    findOrderTrackingData,
  );

module.exports = router;
