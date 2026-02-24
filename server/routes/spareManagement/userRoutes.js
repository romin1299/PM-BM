const express = require("express");
const router = express.Router();

const {
  findRequestedUser,
} = require("../../controller/spareManagement/userController");

router.route("/user").get(findRequestedUser);

module.exports = router;
