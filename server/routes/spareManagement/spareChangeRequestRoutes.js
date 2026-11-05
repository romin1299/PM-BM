const express = require("express");
const router = express.Router();

const {
  listChangeRequests,
  exportChangeRequests,
  getChangeRequestColumnValues,
  getChangeRequestApprovers,
  getChangeRequestById,
  createChangeRequest,
  actOnChangeRequest,
} = require("../../controller/spareManagement/changeRequestController");

router.route("/changeRequest").get(listChangeRequests).post(createChangeRequest);

router.route("/changeRequest/export").get(exportChangeRequests);

router.route("/changeRequest/columnValues").get(getChangeRequestColumnValues);

router.route("/changeRequest/approvers").get(getChangeRequestApprovers);

router.route("/changeRequest/approval").patch(actOnChangeRequest);

router.route("/changeRequest/:id").get(getChangeRequestById);

module.exports = router;
