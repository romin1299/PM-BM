const mongoose = require("mongoose");

const tryCatchHandler = require("../../errorHandler/tryCatchHandler");
const {
  paginationRowLimit,
  buildRegexSearchFilter,
} = require("../../utils/spareManagementUtils");

const Plant = require("../../model/plantSchema");
const RequestSheetOfSpare = require("../../model/requestSheetDataOfSpare");

/**
 * Everything the Order Tracking search looks through — the columns on screen
 * plus the hierarchy they sit under, so a search matches whatever the user can
 * see. Only string paths: a regex never matches a number.
 */
const orderTrackingSearchFields = [
  "requestSheetNo",
  "requestSheetStatus",
  "newOrReOrderRequest",
  "partRequestFor",
  "partQty",
  "newPartFor",
  "budget.budgetStatus",
  "requestSheetCreatedBy.tm_name",
  "plant.plant_name",
  "section.section_name",
  "subSection.subSection_name",
  "cell.cell_name",
  "line.line_name",
  "machine.machine_code",
  "machine.machine_name",
  "changeParts.partName",
  "changeParts.partModel",
  "changeParts.maker",
  "changeParts.supplierName",
  "changeParts.supplierCategory",
  "changeParts.standerOrManufacturingPart",
  "changeParts.normalOrUrgentPart",
];

exports.orderTrackingAggregationFilters = tryCatchHandler(
  async (req, res, next) => {
    /**
     * Collected under $and rather than assigned to $or. A sheet reaches this
     * dashboard once its budget is settled, and the search is a second, separate
     * condition — writing both to $or would have the later one replace the
     * former, letting sheets through that the budget rule excludes.
     */
    req.queryObj.$and = [
      {
        $or: [
          {
            "budget.budgetStatus": "OK",
          },
          {
            "budget.budgetStatus": "NG",
            "mtdHODApprovalIfBudgetIsNG.approvalStatus": "Accepted",
          },
        ],
      },
    ];

    if (req.query?.pendingStage && req.query?.pendingStage !== "All")
      req.queryObj[req.query?.pendingStage] = null;

    if (req.query?.partRequestFor && req.query?.partRequestFor !== "All")
      req.queryObj.partRequestFor = req.query?.partRequestFor;

    if (req.query?.search)
      req.queryObj.$and.push(
        buildRegexSearchFilter(req.query.search, orderTrackingSearchFields),
      );

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
        "changeParts.masterId": 1,
        "changeParts.maker": 1,
        rsSubmitted: {
          timeStamp: `$rsSubmittedTimeStamp.inString`,
          taskStatus: "achieved",
        },
        rsHODApproval: generateTrackingValueProjection(),
        rsToolroomApproval: generateTrackingValueProjection(
          "rsHODApprovalTimeStamp",
          "rsToolroomApprovalTimeStamp",
          plant?.leadTime?.HODApprovalToToolRoomApproval,
        ),
        rsPRGeneration: generateTrackingValueProjection(
          "rsToolroomApprovalTimeStamp",
          "changeParts.rsPRGenerationTimeStamp",
          plant?.leadTime?.ToolroomApprovalToPRSubmittedByToolroomToPPD,
        ),
        rsPRAssignToAllBuyers: generateTrackingValueProjection(
          "changeParts.rsPRGenerationTimeStamp",
          "changeParts.rsPRAssignToAllBuyersTimeStamp",
          plant?.leadTime?.PRSubmittedByToolroomToPPDToPRAssignToAllBuyers,
        ),
        rsPOIssueToVendor: generateTrackingValueProjection(
          "changeParts.rsPRAssignToAllBuyersTimeStamp",
          "changeParts.rsPOIssueToVendorTimeStamp",
          plant?.leadTime?.PRAssignToAllBuyersToPOIssueToVendor,
        ),
        rsPartReceive: generateTrackingValueProjection(
          "changeParts.rsPOIssueToVendorTimeStamp",
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
        canConfigureMaster: {
          $cond: [{ $eq: ["$newPartFor", "For stock in"] }, true, false],
        },
      };
    }

    req.$project = $project;
    return next();
  },
);

exports.getOKBudgetOrNGApprovedRequestSheets = tryCatchHandler(
  async (req, res, next) => {
    let $match = req.queryObj,
      otherPipeline = [],
      batchWiseSortPipeline = [];

    if (!req.isSpareSheetById) {
      otherPipeline = [{ $sort: { _id: -1 } }, { $limit: paginationRowLimit }];

      if (req.query.cursor)
        $match._id = { $lt: mongoose.Types.ObjectId(req.query.cursor) };

      batchWiseSortPipeline = [{ $sort: { "changeParts.batchId": -1 } }];
    }

    const tableData = await RequestSheetOfSpare.aggregate([
      {
        $match,
      },
      ...otherPipeline,
      {
        $unwind: "$changeParts",
      },
      ...batchWiseSortPipeline,
      {
        $project: {
          newOrReOrderRequest: 1,
          requestSheetNo: 1,
          cell: 1,
          line: 1,
          machine: 1,
          requestSheetStatus: 1,
          partQty: 1,
          "budget.budgetStatus": 1,
          "changeParts.batchId": 1,
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
