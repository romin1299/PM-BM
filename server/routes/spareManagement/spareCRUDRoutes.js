const express = require("express");
const router = express.Router();

const {
  getNewSpareSheetNoByDefault,
  uploadDrawingAttach,
  registerNewSpareRequest,
  findSpareSheetBasedOnId,
  getSpareRequestSheetBasedOnId,
  updateSpareRequestSheet,

  getRequestSheets,
  getSpareSheetsSummery,
  deleteSparePartRequest,

  handelManualApprovalStatus,
  getManualApprovalStatus,
  manualApprovalStatusResponse,
} = require("../../controller/spareManagement/spareCRUDController");

const {
  spareFilterMiddleware,
  getSpareRequestSheets,
  ensureSpareSheetIsEditable,
} = require("../../controller/spareManagement/spareMiddleware");

const {
  orderTrackingAggregationFilters,
  orderTrackingDashboardProjection,
  getOKBudgetOrNGApprovedRequestSheets,
} = require("../../controller/spareManagement/sparePartOrderTrackingController");

router.route("/spareRequestSheet/newSheetNo").get(getNewSpareSheetNoByDefault);

router
  .route("/spareRequestSheet")
  .post(
    uploadDrawingAttach.fields([
      { name: "drawingAttach", maxCount: 10 },
      { name: "additionalAttachments", maxCount: 50 },
      { name: "documentByRequestGenerator", maxCount: 1 },
    ]),
    registerNewSpareRequest,
  )
  .get(findSpareSheetBasedOnId, getSpareRequestSheetBasedOnId)
  .patch(
    uploadDrawingAttach.fields([
      { name: "drawingAttach", maxCount: 10 },
      { name: "additionalAttachments", maxCount: 50 },
      { name: "documentByRequestGenerator", maxCount: 1 },
    ]),
    findSpareSheetBasedOnId,
    ensureSpareSheetIsEditable,
    updateSpareRequestSheet,
  )
  .delete(ensureSpareSheetIsEditable, deleteSparePartRequest);

router
  .route("/spareRequestSheet/all")
  .get(spareFilterMiddleware, getSpareRequestSheets, getRequestSheets);

router
  .route("/spareRequestSheet/summery")
  .get(
    spareFilterMiddleware,
    orderTrackingAggregationFilters,
    getSpareSheetsSummery,
  );

router
  .route("/spareRequestSheet/manualApprovalStatus")
  .patch(
    handelManualApprovalStatus,
    orderTrackingDashboardProjection,
    getOKBudgetOrNGApprovedRequestSheets,
    manualApprovalStatusResponse,
  )
  .get(getManualApprovalStatus);

module.exports = router;
