const express = require("express");
const router = express.Router();

const {
  findRequestedUser,
  getDynamicApprovalListForSpareSheet,
  findUsers,
  toolRoomUserByIdFilter,
  getToolRoomUserById,
  addToolRoomUser,
  updateToolRoomUser,
  toolRoomUserFilters,
  getToolRoomUsers,
  deleteToolRoomUser,
} = require("../../controller/spareManagement/userController");

router.route("/user").get(findRequestedUser);
router.route("/approvalUsers").get(getDynamicApprovalListForSpareSheet);

router
  .route("/toolRoom/user")
  .post(addToolRoomUser)
  .get(toolRoomUserByIdFilter, findUsers, getToolRoomUserById)
  .delete(toolRoomUserByIdFilter, deleteToolRoomUser)
  .patch(
    toolRoomUserByIdFilter,
    findUsers,
    updateToolRoomUser,
    findUsers,
    getToolRoomUserById,
  );

router
  .route("/toolRoom/user/all")
  .get(toolRoomUserFilters, findUsers, getToolRoomUsers);

module.exports = router;
