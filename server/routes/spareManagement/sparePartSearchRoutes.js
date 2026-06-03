const express = require("express");
const router = express.Router();

const {
  getSearchParts,
  getSearchPartsBasedOnLocation,
} = require("../../controller/spareManagement/sparePartSearchController");

router.route("/spareSearch").get(getSearchParts);
router.route("/spareSearch/location").get(getSearchPartsBasedOnLocation);

module.exports = router;
