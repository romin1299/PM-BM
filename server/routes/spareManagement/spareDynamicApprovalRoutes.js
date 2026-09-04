const express = require("express");
const router = express.Router();

const {
  authorizedToCustomize,
  configureSpareDynamicApproval,
  getSpareDynamicApproval,
  toolRoomAuthorizedToCustomize,
  configureLeadTime,
  getLeadTime,
  configureCurrencyConversion,
  getCurrencyConversion,
} = require("../../controller/spareManagement/spareDynamicApprovalCURDController");

router
  .route("/customization/dynamicApproval")
  .patch(authorizedToCustomize, configureSpareDynamicApproval)
  .get(getSpareDynamicApproval);

router
  .route("/customization/dynamicCurrencyConversion")
  .patch(toolRoomAuthorizedToCustomize, configureCurrencyConversion)
  .get(getCurrencyConversion);

router
  .route("/customization/leadTime")
  .patch(toolRoomAuthorizedToCustomize, configureLeadTime)
  .get(getLeadTime);

router
  .route("/customization/makerConfiguration")
  .patch(authorizedToCustomize, configureLeadTime)
  .get(getLeadTime);

router
  .route("/customization/supplierConfiguration")
  .patch(authorizedToCustomize, configureLeadTime)
  .get(getLeadTime);

module.exports = router;
