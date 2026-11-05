const express = require("express");
const router = express.Router();

const {
  getSearchParts,
  searchPartResponse,
  getSearchPartColumnValues,
  getSearchPartsBasedOnLocation,
  searchPartBasedOnLocationResponse,
  getMasterList,
  findSearchMaster,
  masterListResponse,
} = require("../../controller/spareManagement/sparePartSearchController");

router
  .route("/spareSearch")
  .get(getSearchParts, findSearchMaster, searchPartResponse);
// The distinct values a result column's Excel-style filter dropdown offers.
router.route("/spareSearch/columnValues").get(getSearchPartColumnValues);
router
  .route("/spareSearch/location")
  .get(
    getSearchPartsBasedOnLocation,
    findSearchMaster,
    searchPartBasedOnLocationResponse,
  );
router
  .route("/masterList")
  .get(getMasterList, findSearchMaster, masterListResponse);

module.exports = router;
