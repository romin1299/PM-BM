const express = require("express");
const router = express.Router();

const {
  uploadDrawingAttach,
  registerNewSpareRequest,
} = require("../../controller/spareManagement/spareCRUDController");

router
  .route("/spareRequestSheet/register")
  .post(uploadDrawingAttach.any(), registerNewSpareRequest);

module.exports = router;
