const express = require("express");
const router = express.Router();

const {
  getDefaultValueForMasterRegistration,
  handleMasterConfiguration,
  handleMasterUpdate,
  getSpareMasterDashboard,
  exportSpareMasterDashboard,
  getSpareMasterColumnValues,
  resolveSpareMasterType,
} = require("../../controller/spareManagement/spareMasterController");
const {
  uploadSpareMasterFile,
  handleSpareMasterImport,
} = require("../../controller/spareManagement/spareMasterImportController");
const {
  toolRoomAuthorizedToCustomize,
} = require("../../controller/spareManagement/spareDynamicApprovalCURDController");
const {
  uploadDrawingAttach,
} = require("../../controller/spareManagement/spareCRUDController");

// Drawings on a master share the request-sheet uploader, so they land in the
// same spareDocuments folder the sheets' drawings do and are served the same way.
const masterDrawings = uploadDrawingAttach.fields([
  { name: "drawingAttach", maxCount: 10 },
]);

router
  .route("/master")
  .get(getDefaultValueForMasterRegistration)
  .post(masterDrawings, handleMasterConfiguration)
  .patch(masterDrawings, handleMasterUpdate);

// The whole master catalogue, paged by cursor as the client scrolls. Deliberately
// unfiltered — a master is a standing record of a part, not a per-year or
// per-section one.
router.route("/master/dashboard").get(getSpareMasterDashboard);

// Same catalogue as CSV, read from the database so the file is complete
// regardless of how far the table has been scrolled.
router.route("/master/dashboard/export").get(exportSpareMasterDashboard);

// Distinct values of one dashboard column, for its Excel-style filter list.
router.route("/master/dashboard/columnValues").get(getSpareMasterColumnValues);

// Bulk load from a legacy/updated parts-master workbook. Dry-runs unless the
// caller passes commit=Yes, and is restricted to Tool Room like every other
// Spare-wide configuration action.
router
  .route("/master/import")
  .post(
    toolRoomAuthorizedToCustomize,
    uploadSpareMasterFile.single("file"),
    handleSpareMasterImport,
  );

/**
 * The uploaded masters — Recycle Parts and Repaired Parts — under
 * /master/:masterType. Same dashboard, export and import handlers as the
 * stock-in master; the segment selects the catalogue. Registered after the
 * literal /master/... routes so "dashboard" and "import" are never read as a
 * type name.
 */
router
  .route("/master/:masterType/dashboard")
  .get(resolveSpareMasterType, getSpareMasterDashboard);

router
  .route("/master/:masterType/dashboard/export")
  .get(resolveSpareMasterType, exportSpareMasterDashboard);

router
  .route("/master/:masterType/dashboard/columnValues")
  .get(resolveSpareMasterType, getSpareMasterColumnValues);

router
  .route("/master/:masterType/import")
  .post(
    resolveSpareMasterType,
    toolRoomAuthorizedToCustomize,
    uploadSpareMasterFile.single("file"),
    handleSpareMasterImport,
  );

module.exports = router;
