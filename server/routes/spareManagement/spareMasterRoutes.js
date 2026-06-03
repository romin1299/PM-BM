const express = require("express");
const router = express.Router();

const {
  sheetAndPartIdValidation,
  getDefaultValueForMasterRegistration,
  handleMasterConfiguration,
  handleMasterUpdate,
} = require("../../controller/spareManagement/spareMasterController");

router
  .route("/master")
  .get(sheetAndPartIdValidation, getDefaultValueForMasterRegistration)
  .post(sheetAndPartIdValidation, handleMasterConfiguration)
  .patch(handleMasterUpdate);

module.exports = router;
