const mongoose = require("mongoose");

const tryCatchHandler = require("../../errorHandler/tryCatchHandler");
const { paginationRowLimit } = require("../../utils/spareManagementUtils");

const Plant = require("../../model/plantSchema");
const RequestSheetOfSpare = require("../../model/requestSheetDataOfSpare");

exports.getOKBudgetOrNGApprovedRequestSheets = tryCatchHandler(
  async (req, res, next) => {
    let $match = req.queryObj,
      otherPipeline = [],
      $project = {
        requestSheetNo: 1,
        cell: 1,
        line: 1,
        machine: 1,
        requestSheetStatus: 1,
        partQty: 1,
        "budget.budgetStatus": 1,
      };

    if (!req.isSpareSheetById) {
      $match.$or = [
        {
          "budget.budgetStatus": "OK",
        },
        {
          "budget.budgetStatus": "NG",
          "mtdHODApprovalIfBudgetIsNG.approvalStatus": "Accepted",
        },
      ];

      otherPipeline = [{ $sort: { _id: -1 } }, { $limit: paginationRowLimit }];

      if (req.query.cursor)
        $match._id = { $lt: mongoose.Types.ObjectId(req.query.cursor) };
    }

    const plant = await Plant.findOne({
      plant_id: req.rootUser?.plant_data?.split("-")?.[0],
    });

    if (Object.keys(plant?.leadTime)?.length > 0) {
      const generateTrackingValueProjection = (
        prev = "rsSubmittedTimeStamp",
        current = "rsHODApprovalTimeStamp",
        associatedLeadTime = plant?.leadTime?.orderRSSubmittedToHODApproval,
      ) => ({
        $cond: [
          {
            $gt: [`$${current}.inDate`, null],
          },
          {
            timeStamp: `$${current}.inString`,
            taskStatus: {
              $cond: [
                {
                  $lte: [
                    `$${current}.inDate`,
                    {
                      $dateAdd: {
                        startDate: `$${prev}.inDate`,
                        unit: "day",
                        amount: associatedLeadTime,
                      },
                    },
                  ],
                },
                "achieved",
                "delayedApproval",
              ],
            },
          },
          {
            $cond: [
              {
                $gt: [`$${prev}.inDate`, null],
              },
              {
                timeStamp: "",
                taskStatus: {
                  $cond: [
                    {
                      $lte: [
                        {
                          $dateAdd: {
                            startDate: `$${prev}.inDate`,
                            unit: "day",
                            amount: associatedLeadTime,
                          },
                        },
                        "$$NOW",
                      ],
                    },
                    "runningLate",
                    "assigned",
                  ],
                },
              },
              {
                timeStamp: "",
                taskStatus: null,
              },
            ],
          },
        ],
      });

      $project = {
        ...$project,
        rsSubmitted: {
          timeStamp: `$rsSubmittedTimeStamp.inString`,
          taskStatus: "achieved",
        },
        rsHODApproval: generateTrackingValueProjection(),
        rsPRSubmitByToolroom: generateTrackingValueProjection(
          "rsHODApprovalTimeStamp",
          "rsPRSubmitByToolroomTimeStamp",
          plant?.leadTime?.HODApprovalToPRSubmittedByToolroomToPPD,
        ),
        rsPRAssignToAllBuyers: generateTrackingValueProjection(
          "rsPRSubmitByToolroomTimeStamp",
          "rsPRAssignToAllBuyersTimeStamp",
          plant?.leadTime?.PRSubmittedByToolroomToPPDToPRAssignToAllBuyers,
        ),
        rsPOIssueToVendor: generateTrackingValueProjection(
          "rsPRAssignToAllBuyersTimeStamp",
          "rsPOIssueToVendorTimeStamp",
          plant?.leadTime?.PRAssignToAllBuyersToPOIssueToVendor,
        ),
        rsPartReceive: generateTrackingValueProjection(
          "rsPOIssueToVendorTimeStamp",
          "rsPartReceiveTimeStamp",
          plant?.leadTime?.POIssueToVendorToPartReceive,
        ),
      };
    }

    const tableData = await RequestSheetOfSpare.aggregate([
      {
        $match,
      },
      ...otherPipeline,
      {
        $project,
      },
    ]);

    if (tableData?.length <= 0)
      return res.status(400).json({
        message: "No spare sheets to display",
        showToast: true,
      });

    req.tableData = tableData;

    if (!req.isSpareSheetById) {
      req.otherResponse = {
        nextCursor: tableData.length
          ? tableData[tableData.length - 1]._id
          : null,
        hasMore: tableData.length === paginationRowLimit,
      };
    }
    return next();
  },
);

exports.findOrderTrackingData = tryCatchHandler(async (req, res, next) => {
  return res.status(201).json({
    message: "Request-sheets get successfully",
    ...req.otherResponse,
    tableData: req.tableData,
  });
});
