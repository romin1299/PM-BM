const mongoose = require("mongoose");
const tryCatchHandler = require("../../errorHandler/tryCatchHandler");
const RequestSheetOfSpare = require("../../model/requestSheetDataOfSpare");
const {
  allMonths,
  allMonthsStr,
  paginationRowLimit,
} = require("../../utils/spareManagementUtils");

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
  },
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
    tableData: req.tableData,
  });
});

exports.getApprovalLogs = tryCatchHandler(async (req, res, next) => {
  const limit = paginationRowLimit;
  const cursor = req.query.cursor;

  let matchStage = req.queryObj;

  if (cursor) matchStage._id = { $lt: mongoose.Types.ObjectId(cursor) };

  const tableData = await RequestSheetOfSpare.aggregate([
    { $match: matchStage },
    { $sort: { _id: -1 } },
    { $limit: limit },
    {
      $project: {
        requestSheetNo: 1,
        "cell.cell_name": 1,
        "line.line_name": 1,
        "machine.machine_code": 1,
        "machine.machine_name": 1,
        // requestSheetStatus: 1,
        partQty: 1,
        budgetStatus: "$budget.budgetStatus",

        mtdHODApprovalIfBudgetIsNGApprovalLogs: 1,
        approvalOfMTD_TLApprovalLogs: 1,
        approvalOfMTD_HOSSApprovalLogs: 1,
        approvalOfPRD_TLApprovalLogs: 1,
        approvalOfMTD_HOSApprovalLogs: 1,
        approvalOfPRD_HOSApprovalLogs: 1,
        approvalOfMTD_HODApprovalLogs: 1,
        approvalOfPRD_HODApprovalLogs: 1,
        approvalOfTOOL_ROOMApprovalLogs: 1,
      },
    },
  ]);

  return res.status(200).json({
    message: "Approval logs fetched",
    tableData,
    nextCursor: tableData.length ? tableData[tableData.length - 1]._id : null,
    hasMore: tableData.length === limit,
  });
});

exports.getApproveAndPendingUsersWiseCount = tryCatchHandler(
  async (req, res, next) => {
    const tableData = await RequestSheetOfSpare.aggregate([
      { $match: req.queryObj },
      {
        $project: {
          pendingAndCompletedApproval: {
            $concatArrays: [
              {
                $cond: [
                  {
                    $and: [
                      { $isArray: "$dynamicApprovalKeys" },
                      { $gt: [{ $size: "$dynamicApprovalKeys" }, 0] },
                    ],
                  },
                  [
                    {
                      $ifNull: [
                        {
                          $getField: {
                            field: { $first: "$dynamicApprovalKeys" },
                            input: "$$ROOT",
                          },
                        },
                        null,
                      ],
                    },
                  ],
                  [],
                ],
              },
              {
                $reduce: {
                  input: {
                    $setDifference: [
                      {
                        $cond: [
                          {
                            $eq: ["$partRequestFor", "MTD"],
                          },
                          [
                            "mtdHODApprovalIfBudgetIsNG",
                            "approvalOfMTD_TL",
                            "approvalOfMTD_HOSS",
                            "approvalOfMTD_HOS",
                            "approvalOfMTD_HOD",
                            "approvalOfTOOL_ROOM",
                          ],
                          [
                            "mtdHODApprovalIfBudgetIsNG",
                            "approvalOfPRD_TL",
                            "approvalOfPRD_HOS",
                            "approvalOfPRD_HOD",
                            "approvalOfTOOL_ROOM",
                          ],
                        ],
                      },

                      {
                        $cond: [
                          {
                            $and: [
                              { $isArray: "$dynamicApprovalKeys" },
                              { $gt: [{ $size: "$dynamicApprovalKeys" }, 0] },
                            ],
                          },
                          [{ $first: "$dynamicApprovalKeys" }],
                          [],
                        ],
                      },
                    ],
                  },
                  initialValue: [],
                  in: {
                    $cond: [
                      {
                        $or: [
                          {
                            $not: [
                              {
                                $getField: { field: "$$this", input: "$$ROOT" },
                              },
                            ],
                          },
                          {
                            $eq: [
                              {
                                $getField: {
                                  field: "approvalStatus",
                                  input: {
                                    $getField: {
                                      field: "$$this",
                                      input: "$$ROOT",
                                    },
                                  },
                                },
                              },
                              "Pending",
                            ],
                          },
                        ],
                      },
                      "$$value",
                      {
                        $concatArrays: [
                          "$$value",
                          [{ $getField: { field: "$$this", input: "$$ROOT" } }],
                        ],
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      },
      {
        $unwind: {
          path: "$pendingAndCompletedApproval",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $group: {
          _id: {
            _id: "$pendingAndCompletedApproval.user._id",
            tm_no: "$pendingAndCompletedApproval.user.tm_no",
            tm_name: "$pendingAndCompletedApproval.user.tm_name",
            email: "$pendingAndCompletedApproval.user.email",
            userType: "$pendingAndCompletedApproval.userType",
            approvalStatus: "$pendingAndCompletedApproval.approvalStatus",
          },
          count: {
            $sum: 1,
          },
        },
      },
      {
        $group: {
          _id: {
            _id: "$_id._id",
            tm_no: "$_id.tm_no",
            tm_name: "$_id.tm_name",
            email: "$_id.email",
            userType: "$_id.userType",
          },
          approved: {
            $sum: {
              $cond: [
                {
                  $eq: ["$_id.approvalStatus", "Accepted"],
                },
                "$count",
                0,
              ],
            },
          },
          pending: {
            $sum: {
              $cond: [
                {
                  $eq: ["$_id.approvalStatus", "Pending"],
                },
                "$count",
                0,
              ],
            },
          },
        },
      },
      {
        $group: {
          _id: "$_id.userType",
          userWithCount: {
            $push: {
              tm_name: "$_id.tm_name",
              approved: "$approved",
              pending: "$pending",
            },
          },
        },
      },
    ]);

    return res.status(200).json({
      message: "Approve and pending count of users get successfully",
      tableData,
    });
  },
);
