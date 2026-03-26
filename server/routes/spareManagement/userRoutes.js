const express = require("express");
const router = express.Router();

const {
  findRequestedUser,
  getDynamicApprovalListForSpareSheet,
} = require("../../controller/spareManagement/userController");

router.route("/user").get(findRequestedUser);
router.route("/approvalUsers").get(getDynamicApprovalListForSpareSheet);

module.exports = router;
