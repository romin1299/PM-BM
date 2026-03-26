const express = require("express");
const router = express.Router();

const {
  getNewSpareSheetNoByDefault,
  uploadDrawingAttach,
  registerNewSpareRequest,
  findSpareSheetBasedOnId,
  getSpareRequestSheetBasedOnId,
  updateSpareRequestSheet,
} = require("../../controller/spareManagement/spareCRUDController");

router.route("/spareRequestSheet/newSheetNo").get(getNewSpareSheetNoByDefault);

router
  .route("/spareRequestSheet")
  .post(
    uploadDrawingAttach.fields([
      { name: "drawingAttach", maxCount: 10 },
      { name: "documentByRequestGenerator", maxCount: 1 },
    ]),
    registerNewSpareRequest
  )
  .get(findSpareSheetBasedOnId, getSpareRequestSheetBasedOnId)
  .patch(
    uploadDrawingAttach.fields([
      { name: "drawingAttach", maxCount: 10 },
      { name: "documentByRequestGenerator", maxCount: 1 },
    ]),
    findSpareSheetBasedOnId,
    updateSpareRequestSheet
  );

module.exports = router;
