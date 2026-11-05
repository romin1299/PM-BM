const express = require("express");
const router = express.Router();

const {
  getNewSpareSheetNoByDefault,
  getRejectedSheetsForCopy,
  getRejectedSheetCopy,
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
  getPartPONumber,
  handlePartPONumber,
} = require("../../controller/spareManagement/spareCRUDController");

const {
  downloadPartRequestTemplate,
  uploadPartsWorkbook,
  importPartRequestParts,
} = require("../../controller/spareManagement/partRequestExcelController");

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

// Filling a sheet's parts from an Excel workbook: the template to download, and
// the upload that reads it.
router.route("/spareRequestSheet/template").get(downloadPartRequestTemplate);
router
  .route("/spareRequestSheet/importParts")
  .post(uploadPartsWorkbook, importPartRequestParts);

// Raising a new sheet from a rejected one: the picker, then the copied content.
router.route("/spareRequestSheet/rejected").get(getRejectedSheetsForCopy);
router.route("/spareRequestSheet/rejected/copy").get(getRejectedSheetCopy);

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

// The PO number beside PO Made: a free field any user can set/edit. The save
// reuses the order-tracking projection so the edited row returns in the shape
// the dashboard refreshes with.
router
  .route("/spareRequestSheet/poNumber")
  .patch(
    handlePartPONumber,
    orderTrackingDashboardProjection,
    getOKBudgetOrNGApprovedRequestSheets,
    manualApprovalStatusResponse,
  )
  .get(getPartPONumber);

module.exports = router;
