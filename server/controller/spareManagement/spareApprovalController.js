const tryCatchHandler = require("../../errorHandler/tryCatchHandler");

const RequestSheetOfSpare = require("../../model/requestSheetDataOfSpare");

exports.getApprovalRequestSheets = tryCatchHandler(async (req, res, next) => {
  const tableData = await RequestSheetOfSpare.aggregate([
    {
      $match: {},
    },
    {
      $project: {
        requestSheetNo: 1,
        cell: 1,
        line: 1,
        machine: 1,
        requestSheetStatus: 1,
        partQty: 1,
        "budget.budgetStatus": 1,
        remarkByRequestGeneratorIfBudgetIsNG: 1,
      },
    },
  ]);

  return res.status(201).json({
    message: "Approval request-sheets get successfully",
    showToast: true,
    tableData,
  });
});
