const tryCatchHandler = require("../../errorHandler/tryCatchHandler");

exports.NGBudgetMTD_HODFilters = tryCatchHandler(async (req, res, next) => {
  req.queryObj["budget.budgetStatus"] = "NG";
  req.queryObj["mtdHODApprovalIfBudgetIsNG.user._id"] = req.rootUser?._id;
  req.queryObj["mtdHODApprovalIfBudgetIsNG.approvalStatus"] = "Pending";

  return next();
});

exports.getApprovalRequestSheets = tryCatchHandler(async (req, res, next) => {
  return res.status(201).json({
    message: "Approval request-sheets get successfully",
    showToast: true,
    tableData: req.tableData,
  });
});
