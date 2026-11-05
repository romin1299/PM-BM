const express = require("express");
const router = express.Router();

const {
  listDeleteRequests,
  exportDeleteRequests,
  getDeleteRequestColumnValues,
  getDeleteRequestApprovers,
  getDeleteRequestById,
  createDeleteRequest,
  actOnDeleteRequest,
} = require("../../controller/spareManagement/deleteRequestController");

router.route("/deleteRequest").get(listDeleteRequests).post(createDeleteRequest);

router.route("/deleteRequest/export").get(exportDeleteRequests);

router.route("/deleteRequest/columnValues").get(getDeleteRequestColumnValues);

router.route("/deleteRequest/approvers").get(getDeleteRequestApprovers);

router.route("/deleteRequest/approval").patch(actOnDeleteRequest);

router.route("/deleteRequest/:id").get(getDeleteRequestById);

module.exports = router;
