const express = require("express");
const router = express.Router();

const {
  getApprovalRequestSheets,
} = require("../../controller/spareManagement/spareApprovalController");

router.route("/spareRequestSheet/approval").get(getApprovalRequestSheets);

module.exports = router;
