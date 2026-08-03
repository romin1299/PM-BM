const express = require("express");
const router = express.Router();

const {
  budgetFilterMiddleware,
  getFYBudget,
  addFYBudget,
  updateFYBudget,
  getFYPlanVsActualBudget,
  getMonthlyStatus,
  getSectionWiseBudget,
} = require("../../controller/spareManagement/spareBudgetManagementController");

router
  .route("/budget")
  .get(budgetFilterMiddleware, getFYBudget)
  .post(addFYBudget)
  .patch(updateFYBudget);

router
  .route("/FYplanVsActualBudget")
  .get(budgetFilterMiddleware, getFYPlanVsActualBudget);

router
  .route("/monthlyStatus")
  .get(budgetFilterMiddleware, getMonthlyStatus);

router
  .route("/budget/forNewPartRequest")
  .get(budgetFilterMiddleware, getSectionWiseBudget);

module.exports = router;
