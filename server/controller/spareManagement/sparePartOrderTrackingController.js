const mongoose = require("mongoose");

const tryCatchHandler = require("../../errorHandler/tryCatchHandler");
const {
  paginationRowLimit,
  buildSearchQuery,
} = require("../../utils/spareManagementUtils");

const Plant = require("../../model/plantSchema");
const RequestSheetOfSpare = require("../../model/requestSheetDataOfSpare");

exports.orderTrackingAggregationFilters = tryCatchHandler(
  async (req, res, next) => {
    if (!req.isSpareSheetById) {
      req.queryObj.$or = [
        {
          "budget.budgetStatus": "OK",
        },
        {
          "budget.budgetStatus": "NG",
          "mtdHODApprovalIfBudgetIsNG.approvalStatus": "Accepted",
        },
      ];

      if (req.query?.pendingStage && req.query?.pendingStage !== "All")
        req.queryObj[req.query?.pendingStage] = null;

      if (req.query?.partRequestFor && req.query?.partRequestFor !== "All")
        req.queryObj.partRequestFor = req.query?.partRequestFor;

      if (req.query?.search)
        req.queryObj.$text = {
          $search: buildSearchQuery(req.query?.search),
        };
    }

    return next();
  },
);

exports.orderTrackingDashboardProjection = tryCatchHandler(
  async (req, res, next) => {
    let $project = {};

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
        "changeParts._id": 1,
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
          "changeParts.rsPartReceiveTimeStamp",
          plant?.leadTime?.POIssueToVendorToPartReceive,
        ),
        rsPartInspection: generateTrackingValueProjection(
          "changeParts.rsPartReceiveTimeStamp",
          "changeParts.rsPartInspectionTimeStamp",
          plant?.leadTime?.partReceiveToPartInspection,
        ),
        rsMRNIssued: generateTrackingValueProjection(
          "changeParts.rsPartInspectionTimeStamp",
          "changeParts.rsMRNIssuedTimeStamp",
          plant?.leadTime?.partInspectionToMRNIssued,
        ),
        rsMRNApproved: generateTrackingValueProjection(
          "changeParts.rsMRNIssuedTimeStamp",
          "changeParts.rsMRNApprovedTimeStamp",
          plant?.leadTime?.MRNIssuedToMRNApproved,
        ),
      };
    }

    req.$project = $project;
    return next();
  },
);

exports.getOKBudgetOrNGApprovedRequestSheets = tryCatchHandler(
  async (req, res, next) => {
    let $match = req.queryObj,
      otherPipeline = [];

    if (!req.isSpareSheetById) {
      otherPipeline = [{ $sort: { _id: -1 } }, { $limit: paginationRowLimit }];

      if (req.query.cursor)
        $match._id = { $lt: mongoose.Types.ObjectId(req.query.cursor) };

      req.$project.canConfigureMaster = {
        $cond: [{ $eq: ["$newPartFor", "For stock in"] }, true, false],
      };
    }

    const tableData = await RequestSheetOfSpare.aggregate([
      {
        $match,
      },
      ...otherPipeline,
      {
        $unwind: "$changeParts",
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
          "changeParts.partName": 1,
          "changeParts.partModel": 1,
          ...req.$project,
        },
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
        hasMore: tableData.length >= paginationRowLimit,
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
