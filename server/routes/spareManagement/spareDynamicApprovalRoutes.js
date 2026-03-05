const express = require("express");
const router = express.Router();

const {
  configureSpareDynamicApproval,
  getSpareDynamicApproval,
} = require("../../controller/spareManagement/spareDynamicApprovalCURDController");

router
  .route("/spareDynamicApproval")
  .patch(configureSpareDynamicApproval)
  .get(getSpareDynamicApproval);

module.exports = router;
