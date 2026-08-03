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
} = require("../../controller/spareManagement/spareKPIController");
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

module.exports = router;
