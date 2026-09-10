const express = require("express");
const router = express.Router();

const {
  getDefaultValueForMasterRegistration,
  handleMasterConfiguration,
  handleMasterUpdate,
  getSpareMasterDashboard,
  exportSpareMasterDashboard,
} = require("../../controller/spareManagement/spareMasterController");
const {
  uploadSpareMasterFile,
  handleSpareMasterImport,
} = require("../../controller/spareManagement/spareMasterImportController");
const {
  toolRoomAuthorizedToCustomize,
} = require("../../controller/spareManagement/spareDynamicApprovalCURDController");

router
  .route("/master")
  .get(getDefaultValueForMasterRegistration)
  .post(handleMasterConfiguration)
  .patch(handleMasterUpdate);

// The whole master catalogue, paged by cursor as the client scrolls. Deliberately
// unfiltered — a master is a standing record of a part, not a per-year or
// per-section one.
router.route("/master/dashboard").get(getSpareMasterDashboard);

// Same catalogue as CSV, read from the database so the file is complete
// regardless of how far the table has been scrolled.
router.route("/master/dashboard/export").get(exportSpareMasterDashboard);

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

module.exports = router;
