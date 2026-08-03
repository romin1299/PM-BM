const express = require("express");
const router = express.Router();

const {
  yearMonthFilter,
  getInventorySummery,
  IsToolRoomPerson,
  getMachineCost,
  registerMachineCost,
  updateMachineCost,
} = require("../../controller/spareManagement/spareKPIController");
router
  .route("/inventory/summery")
  //   .patch(authorizedToCustomize, configureSpareDynamicApproval)
  .get(yearMonthFilter, getInventorySummery);

router
  .route("/kpi/machineCost")
  .post(IsToolRoomPerson, registerMachineCost)
  .patch(IsToolRoomPerson, updateMachineCost)
  .get(getMachineCost);

module.exports = router;
