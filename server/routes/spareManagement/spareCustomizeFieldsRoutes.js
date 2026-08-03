const express = require("express");
const router = express.Router();

const {
  requiredFieldsValidation,
  getCustomizedFieldValues,
  handleRegistration,
  handleUpdate,
} = require("../../controller/spareManagement/spareCustomizeFieldsController");

router
  .route("/customization/customizeField")
  .get(requiredFieldsValidation, getCustomizedFieldValues)
  .post(requiredFieldsValidation, handleRegistration)
  .patch(requiredFieldsValidation, handleUpdate);

module.exports = router;
