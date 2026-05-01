const express = require("express");
const router = express.Router();

const {
  authorizedToCustomize,
  configureSpareDynamicApproval,
  getSpareDynamicApproval,
  configureLeadTime,
  getLeadTime,
} = require("../../controller/spareManagement/spareDynamicApprovalCURDController");

router
  .route("/customization/dynamicApproval")
  .patch(authorizedToCustomize, configureSpareDynamicApproval)
  .get(getSpareDynamicApproval);

router
  .route("/customization/leadTime")
  .patch(authorizedToCustomize, configureLeadTime)
  .get(getLeadTime);

module.exports = router;
