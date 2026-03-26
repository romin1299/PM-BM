const tryCatchHandler = require("../../errorHandler/tryCatchHandler");
const RequestSheetOfSpare = require("../../model/requestSheetDataOfSpare");
const { allMonths, allMonthsStr } = require("../../utils/spareManagementUtils");

exports.getSpareSheetGenerateAndCompletedCount = tryCatchHandler(
  async (req, res, next) => {
    const countData = await RequestSheetOfSpare.aggregate([
      {
        $match: req.queryObj,
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          generatedCount: { $sum: 1 },
          completedCount: {
            $sum: {
              $cond: [{ $eq: ["$requestSheetStatus", "Completed"] }, 1, 0],
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          array: { $push: "$$ROOT" },
        },
      },
      {
        $project: {
          _id: 0,
          generatedArray: {
            $map: {
              input: allMonths,
              as: "month",
              in: {
                $let: {
                  vars: {
                    matched: {
                      $first: {
                        $filter: {
                          input: "$array",
                          as: "item",
                          cond: {
                            $eq: ["$$item._id", "$$month.monthInDecimal"],
                          },
                        },
                      },
                    },
                  },
                  in: { $ifNull: ["$$matched.generatedCount", 0] },
                },
              },
            },
          },
          completedArray: {
            $map: {
              input: allMonths,
              as: "month",
              in: {
                $let: {
                  vars: {
                    matched: {
                      $first: {
                        $filter: {
                          input: "$array",
                          as: "item",
                          cond: {
                            $eq: ["$$item._id", "$$month.monthInDecimal"],
                          },
                        },
                      },
                    },
                  },
                  in: { $ifNull: ["$$matched.completedCount", 0] },
                },
              },
            },
          },
        },
      },
    ]);

    if (!countData?.[0]?.generatedArray || countData?.[0]?.generatedArray <= 0)
      return res.status(400).json({
        message: "No data to display",
      });

    return res.status(201).json({
      message: "Approval request-sheets get successfully",
      tableData: {
        headers: ["Status", ...allMonthsStr],
        rows: [
          {
            status: "Generated",
            counts: countData?.[0]?.generatedArray,
          },
          {
            status: "Completed",
            counts: countData?.[0]?.completedArray,
          },
        ],
      },
    });
  }
);

exports.NGBudgetMTD_HODFilters = tryCatchHandler(async (req, res, next) => {
  // req.queryObj["budget.budgetStatus"] = "NG";
  // req.queryObj["mtdHODApprovalIfBudgetIsNG.user._id"] = req.rootUser?._id;
  // req.queryObj["mtdHODApprovalIfBudgetIsNG.approvalStatus"] = "Pending";

  req.queryObj["pendingApprovalBy"] = req.rootUser?._id;

  return next();
});

exports.getApprovalRequestSheets = tryCatchHandler(async (req, res, next) => {
  return res.status(201).json({
    message: "Approval request-sheets get successfully",
    showToast: true,
    tableData: req.tableData,
  });
});

exports.getApprovalLogs = tryCatchHandler(async (req, res, next) => {
  const tableData = await RequestSheetOfSpare.aggregate([
    {
      $match: req.queryObj,
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

        mtdHODApprovalIfBudgetIsNGApprovalLogs: 1,
        approvalOfMTD_TLApprovalLogs: 1,
        approvalOfMTD_HOSSApprovalLogs: 1,
        approvalOfPRD_TLApprovalLogs: 1,
        approvalOfMTD_HOSApprovalLogs: 1,
        approvalOfPRD_HOSApprovalLogs: 1,
        approvalOfMTD_HODApprovalLogs: 1,
        approvalOfPRD_HODApprovalLogs: 1,
      },
    },
  ]);

  if (!tableData || tableData <= 0)
    return res.status(400).json({
      message: "No data to display",
    });

  return res.status(201).json({
    message: "Approval logs get successfully",
    showToast: true,
    tableData,
  });
});
