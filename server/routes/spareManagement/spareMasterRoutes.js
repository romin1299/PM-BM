const express = require("express");
const router = express.Router();

const {
  getDefaultValueForMasterRegistration,
  handleMasterConfiguration,
  handleMasterUpdate,
} = require("../../controller/spareManagement/spareMasterController");

router
  .route("/master")
  .get(getDefaultValueForMasterRegistration)
  .post(handleMasterConfiguration)
  .patch(handleMasterUpdate);

module.exports = router;
