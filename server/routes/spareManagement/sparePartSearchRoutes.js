const express = require("express");
const router = express.Router();

const {
  getSearchParts,
  searchPartResponse,
  getSearchPartsBasedOnLocation,
  searchPartBasedOnLocationResponse,
  getMasterList,
  findSearchMaster,
  masterListResponse,
} = require("../../controller/spareManagement/sparePartSearchController");

router
  .route("/spareSearch")
  .get(getSearchParts, findSearchMaster, searchPartResponse);
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
