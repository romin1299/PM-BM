const mongoose = require("mongoose");
const moment = require("moment");
const tryCatchHandler = require("../../errorHandler/tryCatchHandler");
const getFY = require("../../utils/getFY");

const User = require("../../model/userSchema");
const Plant = require("../../model/plantSchema");
const Machine = require("../../model/machineSchema");
const SpareIssuanceSummary = require("../../model/spareIssuanceSummarySchema");
const SpareMaster = require("../../model/spareMasterSchema");
const SpareBudget = require("../../model/spareBudgetSchema");
const RequestSheetOfSpare = require("../../model/requestSheetDataOfSpare");

const {
  spareApprovalStatus,
  generateRegexSearchString,
  paginationRowLimit,
  dynamicApprovalStatus,
} = require("../../utils/spareManagementUtils");
const {
  generateTimestampIndividually,
  generateTimeStampWithBothFormat,
} = require("../../utils/spareTimestamp");

const unparseJSONData = require("../../utils/unparseJSONData");

const getDynamicApprovalFromThePlant = async (plant_id) =>
  await Plant.findOne({ plant_id }, { spareIssuanceDynamicApproval: 1 });

exports.budgetDetailsProjection = budgetDetailsProjection = {
  $reduce: {
    input: "$spareMaster.costDetails",
    initialValue: {
      issuanceSheetRequired: {
        requiredBudget: 0,
        quantity: "$changeParts.quantityRequired",
      },
      overAllAvailableQty: 0,
      overAllCostInINR: 0,
    },
    in: {
      issuanceSheetRequired: {
        $cond: [
          { $gt: ["$$value.issuanceSheetRequired.quantity", 0] },
          {
            $switch: {
              branches: [
                {
                  case: {
                    $gte: [
                      "$$this.availableQty",
                      "$$value.issuanceSheetRequired.quantity",
                    ],
                  },
                  then: {
                    requiredBudget: {
                      $add: [
                        "$$value.issuanceSheetRequired.requiredBudget",
                        {
                          $multiply: [
                            "$$value.issuanceSheetRequired.quantity",
                            "$$this.costInINR",
                          ],
                        },
                      ],
                    },
                    quantity: 0,
                  },
                },
                {
                  case: {
                    $lte: [
                      "$$this.availableQty",
                      "$$value.issuanceSheetRequired.quantity",
                    ],
                  },
                  then: {
                    requiredBudget: {
                      $add: [
                        "$$value.issuanceSheetRequired.requiredBudget",
                        "$$this.overAllCost",
                      ],
                    },
                    quantity: {
                      $subtract: [
                        "$$value.issuanceSheetRequired.quantity",
                        "$$this.availableQty",
                      ],
                    },
                  },
                },
              ],
              default: "$$value.issuanceSheetRequired",
            },
          },
          "$$value.issuanceSheetRequired",
        ],
      },
      overAllAvailableQty: {
        $add: [
          "$$value.overAllAvailableQty",
          { $ifNull: ["$$this.availableQty", 0] },
        ],
      },
      overAllCostInINR: {
        $add: [
          "$$value.overAllCostInINR",
          { $ifNull: ["$$this.overAllCost", 0] },
        ],
      },
    },
  },
};

exports.handleSpareIssuanceSheet = tryCatchHandler(async (req, res, next) => {
  if (!req.body?.machine?._id)
    return res.status(400).json({
      message: "Please provide the Line, Machine value",
      showToast: true,
    });

  const machine = await Machine.findOne(
    {
      _id: req.body?.machine?._id,
    },
    {
      machine_code: 1,
      machine_name: 1,
      machine_nickname: 1,
      plant_names: 1,
      section_names: 1,
      subSection_names: 1,
      cell_names: 1,
      line_names: 1,
    },
  )
    .populate({
      path: "plant_names",
      select: "plant_id plant_name",
    })
    .populate({
      path: "section_names",
      select: "section_id section_name dashboardLevel",
    })
    .populate({
      path: "subSection_names",
      select: "subSection_id subSection_name",
    })
    .populate({
      path: "cell_names",
      select: "cell_id cell_name",
    })
    .populate({
      path: "line_names",
      select: "line_id line_name requestSheetNoSpare",
    });

  if (
    !machine?.plant_names ||
    !machine?.section_names ||
    !machine?.subSection_names ||
    !machine?.cell_names ||
    !machine?.line_names ||
    !machine
  )
    return res.status(400).json({
      message: "Plant/Section/Sub-section/Cell/Line/Machine not exist",
      showToast: true,
    });

  req.body["plant"] = machine?.plant_names;
  req.body["section"] = machine?.section_names;
  req.body["subSection"] = machine?.subSection_names;
  req.body["cell"] = machine?.cell_names;
  req.body["line"] = machine?.line_names;
  req.body["machine"] = machine;

  req.body["createdBy"] = req.rootUser;
  req.body["requestedDepartment"] = req.rootUser?.tm_department
    ? req.rootUser?.tm_department
    : "MTD";
  req.body["rsTimeStamp"] = generateTimestampIndividually();

  req.body?.changeParts?.map((item) => ({
    ...item,
    returnTargetDateIfTemporary: item?.returnTargetDateIfTemporary?.inString
      ? generateTimeStampWithBothFormat(
          item?.returnTargetDateIfTemporary?.inString,
        )
      : null,
  }));

  if (req.body?.isTemporaryPartSelected) {
    const {
      emailReminderMTL,
      emailReminderHOSS,
      emailReminderHOS,
      emailReminderHOD,
    } = req.body;

    const reminderIds = [
      emailReminderMTL,
      emailReminderHOSS,
      emailReminderHOS,
      emailReminderHOD,
    ];

    const users = await User.find(
      {
        _id: {
          $in: reminderIds.filter(Boolean),
        },
      },
      {
        email: 1,
      },
    );

    const emailById = new Map(users.map((u) => [u._id.toString(), u.email]));

    const reminderEmails = reminderIds.map(
      (id) => emailById.get(id?.toString()) || null,
    );

    req.body["reminderEmails"] = reminderEmails;
  }

  await new SpareIssuanceSummary(req.body).save();

  return res.status(201).json({
    message: "Master registered successfully",
  });
});

exports.getIssuanceSummeryBasedOnId = tryCatchHandler(
  async (req, res, next) => {
    const { _id } = req.query;

    if (!_id)
      return res.status(400).json({
        message: "Please provide required Id",
        showToast: true,
      });

    const tableData = await SpareIssuanceSummary.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId(_id),
        },
      },
      {
        $unwind: "$changeParts",
      },
      ...req.budgetCalculationPipeline,
      {
        $addFields: {
          changeParts: {
            $let: {
              vars: {
                budgetDetails: {
                  $reduce: {
                    input: "$spareMaster.costDetails",
                    initialValue: {
                      overAllAvailableQty: 0,
                      overAllCostInINR: 0,
                    },
                    in: {
                      overAllAvailableQty: {
                        $add: [
                          "$$value.overAllAvailableQty",
                          { $ifNull: ["$$this.availableQty", 0] },
                        ],
                      },
                      overAllCostInINR: {
                        $add: [
                          "$$value.overAllCostInINR",
                          { $ifNull: ["$$this.overAllCost", 0] },
                        ],
                      },
                    },
                  },
                },
              },
              in: {
                $mergeObjects: [
                  "$changeParts",
                  {
                    budgetDetails: "$$budgetDetails",
                    unitCost: {
                      $cond: [
                        {
                          $or: [
                            { $eq: ["$$budgetDetails.overAllAvailableQty", 0] },
                            {
                              $eq: [
                                "$$budgetDetails.overAllAvailableQty",
                                null,
                              ],
                            },
                          ],
                        },
                        0,
                        {
                          $divide: [
                            "$$budgetDetails.overAllCostInINR",
                            "$$budgetDetails.overAllAvailableQty",
                          ],
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $group: {
          _id: "$_id",
          root: { $first: "$$ROOT" },
          changeParts: { $push: "$changeParts" },
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ["$root", { changeParts: "$changeParts" }],
          },
        },
      },
    ]);

    if (tableData?.length <= 0)
      return res.status(400).json({
        message: "No sheets to display",
        showToast: true,
      });

    return res.status(201).json({
      message: "Issuance sheets get successfully",
      issuanceSheet: tableData[0],
    });
  },
);

exports.issuanceSummeryUpdate = tryCatchHandler(async (req, res, next) => {
  if (!req.query?._id)
    return res.status(400).json({
      message: "Please provide required Id",
      showToast: true,
    });

  if (req.body.changeParts && req.body?.isDateChanged) {
    req.body.changeParts = req.body.changeParts?.map((item) => {
      if (
        item?.returnTargetDateIfTemporary?.inString &&
        !item?.returnTargetDateRevision?.includes(
          item?.returnTargetDateIfTemporary?.inString,
        )
      ) {
        if (
          !item?.returnTargetDateRevision ||
          item?.returnTargetDateRevision?.length <= 0
        )
          item.returnTargetDateRevision = [
            item?.returnTargetDateIfTemporary?.inString,
          ];
        else
          item.returnTargetDateRevision.push(
            item?.returnTargetDateIfTemporary?.inString,
          );
      }

      return item;
    });
  }

  const issuanceSheet = await SpareIssuanceSummary.updateOne(
    req.query,
    req.body,
  );

  if (!issuanceSheet)
    return res.status(404).json({
      message: "Issuance sheet not exists",
      showToast: true,
    });

  req.queryObj = { _id: mongoose.Types.ObjectId(req.query?._id) };
  req.otherAggregationPipeline = [];
  req.partQuery = {};
  return next();
});

exports.responseIssuanceSummeryUpdate = tryCatchHandler(
  async (req, res, next) => {
    return res.status(201).json({
      message: "Issuance sheets updated successfully",
      tableData: req.tableData,
    });
  },
);

exports.spareIssuanceFilters = tryCatchHandler(async (req, res, next) => {
  let $match = req.queryObj,
    searchQuery = {};

  const { from, to, search } = req.query;

  if (from || to) {
    $match.createdAt = {};
    if (from) $match.createdAt.$gte = moment(from).startOf("day").toDate();
    if (to) $match.createdAt.$lte = moment(to).endOf("day").toDate();
  }

  if (search) {
    const searchRegex = generateRegexSearchString(search);

    let $or = [
      { "machine.machine_code": searchRegex },
      { "machine.machine_name": searchRegex },
      { "line.line_name": searchRegex },
      { "cell.cell_name": searchRegex },
      { "createdBy.tm_name": searchRegex },
      { "changeParts.whichParts": searchRegex },
      { "changeParts.location": searchRegex },
      { "changeParts.partName": searchRegex },
      { "changeParts.partModel": searchRegex },
      { "changeParts.maker": searchRegex },
      { "changeParts.temporaryOrPermanent": searchRegex },
      { "changeParts.returnTargetDateIfTemporary.inString": searchRegex },
      { "changeParts.closingStatusIfTemporary": searchRegex },
    ];

    $match.$or = $or;
    searchQuery = { $or };
  }

  req.queryObj = $match;
  req.partQuery = searchQuery;
  return next();
});

exports.issuanceSummeryQueryGeneration = tryCatchHandler(
  async (req, res, next) => {
    if (req.query?.cursor)
      req.queryObj._id = { $lt: mongoose.Types.ObjectId(req.query.cursor) };

    req.otherAggregationPipeline = [
      { $sort: { _id: -1 } },
      { $limit: paginationRowLimit },
    ];

    return next();
  },
);

exports.requiredBudgetCalculation = tryCatchHandler(async (req, res, next) => {
  req.budgetCalculationPipeline = [
    {
      $lookup: {
        from: "sparemasters",
        localField: "changeParts.masterId",
        foreignField: "_id",
        pipeline: [
          {
            $project: {
              costDetails: 1,
            },
          },
        ],
        as: "spareMaster",
      },
    },
    {
      $unwind: "$spareMaster",
    },
  ];
  return next();
});

exports.issuanceSummeryProjection = tryCatchHandler(async (req, res, next) => {
  req.$project = {
    issuedFrom: 1,
    cell: 1,
    line: 1,
    machine: 1,
    // spareMaster: 1,
    "changeParts._id": 1,
    "changeParts.masterId": 1,
    "changeParts.whichParts": 1,
    "changeParts.location": 1,
    "changeParts.partName": 1,
    "changeParts.partModel": 1,
    "changeParts.maker": 1,
    "changeParts.quantityRequired": 1,
    "changeParts.temporaryOrPermanent": 1,
    "changeParts.issuanceApprovalStatus": {
      $ifNull: ["$changeParts.issuanceApprovalStatus", "Generated"],
    },
    "changeParts.returnTargetDateIfTemporary.inString": {
      $cond: [
        {
          $in: [
            "$changeParts.returnTargetDateIfTemporary.inString",
            [null, ""],
          ],
        },
        "NA",
        "$changeParts.returnTargetDateIfTemporary.inString",
      ],
    },
    dayCount: {
      $cond: [
        {
          $eq: ["$changeParts.temporaryOrPermanent", "Temporary"],
        },
        {
          $dateDiff: {
            startDate: "$createdAt",
            endDate: "$$NOW",
            unit: "day",
          },
        },
        "NA",
      ],
    },
    "changeParts.closingStatusIfTemporary": 1,
    "createdBy.tm_name": 1,
    budgetDetails: budgetDetailsProjection,
    canEditIssuanceSheet: {
      $or: [
        {
          $eq: ["$createdBy._id", req.rootUser?._id],
        },
        {
          $eq: [req.rootUser?.toolRoomPerson, true],
        },
      ],
    },
  };

  req.unitCostAddFieldPipeline = [
    {
      $addFields: {
        unitCost: {
          $cond: [
            {
              $or: [
                { $eq: ["$budgetDetails.overAllAvailableQty", 0] },
                { $eq: ["$budgetDetails.overAllAvailableQty", null] },
              ],
            },
            0,
            {
              $divide: [
                "$budgetDetails.overAllCostInINR",
                "$budgetDetails.overAllAvailableQty",
              ],
            },
          ],
        },
      },
    },
  ];
  return next();
});

exports.exportIssuanceSummeryQueryGeneration = tryCatchHandler(
  async (req, res, next) => {
    req.otherAggregationPipeline = req.unitCostAddFieldPipeline = [];

    req.$project = {
      _id: 0,
      "Issued from": "$issuedFrom",
      Cell: "$cell.cell_name",
      Line: "$line.line_name",
      "Machine code": "$machine.machine_code",
      "Machine name": "$machine.machine_name",
      Master: "$changeParts.whichParts",
      Location: "$changeParts.location",
      "Part name": "$changeParts.partName",
      "Part modal": "$changeParts.partModel",
      Maker: "$changeParts.maker",
      "Available Quantity": "$changeParts.overAllAvailableQty",
      "Cost in INR": "$changeParts.overAllCostInINR",
      "Required Quantity": "$changeParts.quantityRequired",
      "Temporary/Permanent": "$changeParts.temporaryOrPermanent",
      "Return Target Date": {
        $cond: [
          {
            $in: [
              "$changeParts.returnTargetDateIfTemporary.inString",
              [null, ""],
            ],
          },
          "NA",
          "$changeParts.returnTargetDateIfTemporary.inString",
        ],
      },
      "Closing status": "$changeParts.closingStatusIfTemporary",
      "Created By": "$createdBy.tm_name",
    };

    return next();
  },
);

exports.getIssuanceSummery = tryCatchHandler(async (req, res, next) => {
  const tableData = await SpareIssuanceSummary.aggregate([
    {
      $match: req.queryObj,
    },
    ...req.otherAggregationPipeline,
    {
      $unwind: "$changeParts",
    },
    {
      $match: req.partQuery,
    },
    ...req.budgetCalculationPipeline,
    {
      $project: req.$project,
    },
    ...req.unitCostAddFieldPipeline,
  ]);

  if (tableData?.length <= 0)
    return res.status(400).json({
      message: "No sheets to display",
      showToast: true,
    });

  req.tableData = tableData;
  return next();
});

exports.issuanceSummaryResponse = tryCatchHandler(async (req, res, next) => {
  return res.status(201).json({
    message: "Issuance sheets get successfully",
    nextCursor: req.tableData.length
      ? req.tableData[req.tableData.length - 1]._id
      : null,
    hasMore: req.tableData.length >= paginationRowLimit,
    tableData: req.tableData,
  });
});

exports.exportIssuanceSummaryResponse = tryCatchHandler(
  async (req, res, next) => {
    return res.status(201).json({
      message: "Issuance sheets get successfully",
      tableData: unparseJSONData(req.tableData),
      fileName: "Issuance Sheet Summary",
    });
  },
);

exports.getIssuanceSummeryCounters = tryCatchHandler(async (req, res, next) => {
  const counters = await SpareIssuanceSummary.aggregate([
    {
      $match: req.queryObj,
    },
    {
      $unwind: "$changeParts",
    },
    {
      $match: req.partQuery,
    },
    {
      $group: {
        _id: "$changeParts.temporaryOrPermanent",
        temporaryOrPermanentParts: {
          $sum: 1,
        },
      },
    },
  ]);

  if (counters?.length <= 0)
    return res.status(400).json({
      message: "No sheets counters to display",
      showToast: true,
    });

  let finalCounter = {
    total: 0,
    pending: 0,
    closed: 0,
  };

  for (let i = 0; i < counters.length; i++) {
    finalCounter.total =
      finalCounter.total + counters[i]?.temporaryOrPermanentParts;

    if (counters[i]?._id === "Temporary")
      finalCounter.pending = counters[i]?.temporaryOrPermanentParts;
    else finalCounter.closed = counters[i]?.temporaryOrPermanentParts;
  }

  return res.status(201).json({
    message: "Spare issuance sheet summery counters get successfully",
    counters: finalCounter,
  });
});

exports.handleSetPartApproval = tryCatchHandler(async (req, res, next) => {
  const { _id, partId, department } = req.query;

  if (!_id || !partId || !department)
    return res.status(400).json({
      message: "Please provide required data",
      showToast: true,
    });

  const plant = await getDynamicApprovalFromThePlant(
    req?.rootUser?.plant_data?.split("-")?.[0],
  );

  if (!plant)
    return res.status(400).json({
      message: "Plant does not exist",
      showToast: true,
    });

  const dynamicApproval = plant?.spareIssuanceDynamicApproval?.[department];

  if (!dynamicApproval || dynamicApproval?.length <= 0)
    return res.status(400).json({
      message: "Please configure dynamic approval first",
      showToast: true,
    });

  let allUser_Ids = [];

  for (let i = 0; i < dynamicApproval.length; i++) {
    if (!req.body?.[`approvalOf${dynamicApproval[i]}`]?.user?._id)
      return res.status(400).json({
        message: "Please select all the approvals",
        showToast: true,
      });

    allUser_Ids.push(req.body?.[`approvalOf${dynamicApproval[i]}`]?.user?._id);
  }

  const users = await User.find(
    {
      _id: { $in: allUser_Ids },
    },
    {
      _id: 1,
      tm_no: 1,
      tm_name: 1,
      email: 1,
      user_type: 1,
      tm_grade: 1,
      tm_department: 1,
    },
  );

  if (!users || users?.length <= 0)
    return res.status(400).json({
      message: "Selected approval users does not exists",
      showToast: true,
    });

  let dynamicApprovalKeys = [],
    $set = {},
    schemaKey = "changeParts.$[part].";

  for (let i = 0; i < dynamicApproval.length; i++) {
    const user = users.find(
      (item) =>
        item?._id.toString() ===
        req.body[`approvalOf${dynamicApproval[i]}`]?.user?._id,
    );

    if (user) {
      $set[`${schemaKey}approvalOf${dynamicApproval[i]}`] = {
        userType: dynamicApproval[i]?.split("_")?.join(" "),
        user,
        approvalStatus: "Pending",
      };

      dynamicApprovalKeys.push(`approvalOf${dynamicApproval[i]}`);

      if (i === 0) {
        $set[`${schemaKey}pendingApprovalBy`] = user?._id;
        $set[`${schemaKey}issuanceApprovalStatus`] =
          dynamicApprovalStatus?.[dynamicApproval[i]];
      }
    }
  }

  $set[`${schemaKey}dynamicApprovalKeys`] = dynamicApprovalKeys;
  $set[`${schemaKey}currentApprovalIndex`] = 0;

  await SpareIssuanceSummary.updateOne(
    { _id },
    { $set },
    {
      arrayFilters: [{ "part._id": partId }],
    },
  );

  req.queryObj = {
    _id: mongoose.Types.ObjectId(_id),
  };
  req.partQuery = {
    "changeParts._id": mongoose.Types.ObjectId(partId),
  };

  req.otherAggregationPipeline = [];

  return next();
});

exports.submitApprovalResponse = tryCatchHandler(async (req, res, next) => {
  return res.status(201).json({
    message: "Issuance sheet approval added successfully",
    spareParts: req.tableData,
  });
});

exports.getPartApprovalFilter = tryCatchHandler(async (req, res, next) => {
  const { _id, partId, department } = req.query;

  if (!_id || !partId || !department)
    return res.status(400).json({
      message: "Please provide required data",
      showToast: true,
    });

  req.queryObj = {
    _id: mongoose.Types.ObjectId(_id),
  };

  req.partQuery = {
    "changeParts._id": mongoose.Types.ObjectId(partId),
  };

  req.otherAggregationPipeline =
    req.budgetCalculationPipeline =
    req.unitCostAddFieldPipeline =
      [];

  return next();
});

exports.sendApprovalProjection = tryCatchHandler(async (req, res, next) => {
  req.$project = {
    approvals: {
      $map: {
        input: "$changeParts.dynamicApprovalKeys",
        as: "eachKey",
        in: {
          $getField: {
            field: "$$eachKey",
            input: "$changeParts",
          },
        },
      },
    },
    "changeParts._id": 1,
    "changeParts.issuanceApprovalStatus": 1,
    "changeParts.pendingApprovalBy": 1,
    canSendForApproval: {
      $eq: ["$createdBy._id", req.rootUser?._id],
    },
  };
  return next();
});

exports.getPartApprovalResponse = tryCatchHandler(async (req, res, next) => {
  return res.status(201).json({
    message: "Issuance sheets get successfully",
    part: req.tableData?.[0],
  });
});

exports.acceptOrRejectApprovalProjection = tryCatchHandler(
  async (req, res, next) => {
    req.$project = {
      ...(req.rootUser?.toolRoomPerson === "Yes"
        ? {
            cell: 1,
            "changeParts.quantityRequired": 1,
            budgetDetails: budgetDetailsProjection,
          }
        : {}),
      "changeParts.dynamicApprovalKeys": 1,
      "changeParts.currentApprovalIndex": 1,
      "changeParts.approvalOfMTD_TL": 1,
      "changeParts.approvalOfMTD_HOSS": 1,
      "changeParts.approvalOfPRD_TL": 1,
      "changeParts.approvalOfPRD_HOSS": 1,
      "changeParts.approvalOfMTD_HOS": 1,
      "changeParts.approvalOfPRD_HOS": 1,
      "changeParts.approvalOfMTD_HOD": 1,
      "changeParts.approvalOfPRD_HOD": 1,
      "changeParts.approvalOfTOOL_ROOM": 1,
    };
    return next();
  },
);

exports.acceptOrRejectPartApproval = tryCatchHandler(async (req, res, next) => {
  const { _id, partId } = req.query;
  const { isApproved, rejectedRemarks } = req.body;
  const [{ changeParts }] = req.tableData;

  if (!isApproved)
    return res.status(400).json({
      message: "Please provide required data to approve",
      showToast: true,
    });

  let schemaKey = `changeParts.$[part].`,
    currentApprovalKey =
      changeParts?.dynamicApprovalKeys?.[changeParts?.currentApprovalIndex],
    nextApprovalKey =
      changeParts?.dynamicApprovalKeys?.[changeParts?.currentApprovalIndex + 1];

  let updateObj = {
    $set: {
      [`${schemaKey}${currentApprovalKey}.approvalStatus`]: "Accepted",
      [`${schemaKey}${currentApprovalKey}.approvalDateAndTime`]:
        moment().format("D/M/YYYY - h:mm a"),
      [`${schemaKey}${currentApprovalKey}.rejectedRemarks`]: "",
      [`${schemaKey}pendingApprovalBy`]: null,
      [`${schemaKey}closingStatusIfTemporary`]: "Close",
    },
  };

  let isIssuanceCompleted = false;

  if (isApproved === "No") {
    updateObj.$set[`${schemaKey}${currentApprovalKey}.approvalStatus`] =
      "Rejected";
    updateObj.$set[`${schemaKey}${currentApprovalKey}.rejectedRemarks`] =
      rejectedRemarks;
    updateObj.$set[`${schemaKey}issuanceApprovalStatus`] = "Rejected";
  } else {
    if (nextApprovalKey) {
      updateObj.$set[`${schemaKey}issuanceApprovalStatus`] =
        dynamicApprovalStatus[nextApprovalKey?.split("Of")?.[1]];
      updateObj.$inc = {
        [`${schemaKey}currentApprovalIndex`]: 1,
      };
      updateObj.$set[`${schemaKey}pendingApprovalBy`] =
        changeParts[nextApprovalKey]?.user?._id;
    } else {
      const [{ cell, budgetDetails }] = req.tableData;

      const monthIndex = (moment().month() + 12 - 3) % 12;
      const usedBudget =
        budgetDetails?.issuanceSheetRequired?.requiredBudget || 0;

      updateObj.$set[`${schemaKey}issuanceApprovalStatus`] =
        spareApprovalStatus[spareApprovalStatus?.length - 1];

      updateObj.$set[`${schemaKey}quantityRequired`] = 0;
      updateObj.$set[`${schemaKey}isStockOut`] = true;
      updateObj.$set[`${schemaKey}consumption`] = {
        cost: usedBudget,
        quantity: changeParts?.quantityRequired,
      };

      const masterId = req.query?.masterId;

      const [updatedMaster] = await Promise.all([
        SpareMaster.findOneAndUpdate(
          { _id: masterId },
          [
            {
              $set: {
                costDetails: {
                  $let: {
                    vars: {
                      final: {
                        $reduce: {
                          input: "$costDetails",
                          initialValue: {
                            remaining: changeParts?.quantityRequired,
                            result: [],
                          },
                          in: {
                            $let: {
                              vars: {
                                deduct: {
                                  $min: [
                                    "$$value.remaining",
                                    { $ifNull: ["$$this.availableQty", 0] },
                                  ],
                                },
                              },
                              in: {
                                remaining: {
                                  $subtract: ["$$value.remaining", "$$deduct"],
                                },
                                result: {
                                  $cond: [
                                    {
                                      $eq: [
                                        {
                                          $subtract: [
                                            "$$this.availableQty",
                                            "$$deduct",
                                          ],
                                        },
                                        0,
                                      ],
                                    },
                                    "$$value.result",
                                    {
                                      $concatArrays: [
                                        "$$value.result",
                                        [
                                          {
                                            $mergeObjects: [
                                              "$$this",
                                              {
                                                issuedQty: {
                                                  $add: [
                                                    {
                                                      $ifNull: [
                                                        "$$this.issuedQty",
                                                        0,
                                                      ],
                                                    },
                                                    "$$deduct",
                                                  ],
                                                },
                                                issuedCost: {
                                                  $add: [
                                                    {
                                                      $ifNull: [
                                                        "$$this.issuedCost",
                                                        0,
                                                      ],
                                                    },
                                                    {
                                                      $multiply: [
                                                        "$$deduct",
                                                        {
                                                          $ifNull: [
                                                            "$$this.costInINR",
                                                            0,
                                                          ],
                                                        },
                                                      ],
                                                    },
                                                  ],
                                                },
                                                availableQty: {
                                                  $subtract: [
                                                    "$$this.availableQty",
                                                    "$$deduct",
                                                  ],
                                                },
                                                overAllCost: {
                                                  $multiply: [
                                                    {
                                                      $subtract: [
                                                        "$$this.availableQty",
                                                        "$$deduct",
                                                      ],
                                                    },
                                                    {
                                                      $ifNull: [
                                                        "$$this.costInINR",
                                                        0,
                                                      ],
                                                    },
                                                  ],
                                                },
                                              },
                                            ],
                                          },
                                        ],
                                      ],
                                    },
                                  ],
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                    in: "$$final.result",
                  },
                },
              },
            },
          ],
          {
            new: true,
            projection: {
              costDetails: 1,
              minQuantity: 1,
              maxQuantity: 1,
              partNumber: 1,
              partName: 1,
            },
          },
        ),
        SpareBudget.updateOne(
          {
            "cell._id": cell?._id,
            financialYear: getFY(),
          },
          [
            {
              $set: {
                actual: {
                  $concatArrays: [
                    { $slice: ["$actual", monthIndex] },
                    [
                      {
                        $add: [
                          { $arrayElemAt: ["$actual", monthIndex] },
                          usedBudget,
                        ],
                      },
                    ],
                    {
                      $slice: [
                        "$actual",
                        { $add: [monthIndex, 1] },
                        { $size: "$actual" },
                      ],
                    },
                  ],
                },
                BPDActual: {
                  $concatArrays: [
                    { $slice: ["$BPDActual", monthIndex] },
                    [
                      {
                        $add: [
                          { $arrayElemAt: ["$BPDActual", monthIndex] },
                          usedBudget,
                        ],
                      },
                    ],
                    {
                      $slice: [
                        "$BPDActual",
                        { $add: [monthIndex, 1] },
                        { $size: "$BPDActual" },
                      ],
                    },
                  ],
                },
                cumulativeActual: {
                  $map: {
                    input: { $range: [0, { $size: "$cumulativeActual" }] },
                    as: "i",
                    in: {
                      $cond: [
                        { $gte: ["$$i", monthIndex] },
                        {
                          $add: [
                            { $arrayElemAt: ["$cumulativeActual", "$$i"] },
                            usedBudget,
                          ],
                        },
                        { $arrayElemAt: ["$cumulativeActual", "$$i"] },
                      ],
                    },
                  },
                },
              },
            },
          ],
        ),
      ]);

      /****************************
       * Reordering - Min qty touch
       ****************************/
      if (updatedMaster) {
        const overallRemaining = (updatedMaster.costDetails ?? []).reduce(
          (sum, tranche) => sum + (tranche.availableQty ?? 0),
          0,
        );

        if (overallRemaining <= (updatedMaster.minQuantity ?? 0)) {
          const existingOpenRequest = await RequestSheetOfSpare.findOne(
            {
              newOrReOrderRequest: "REORDER",
              changeParts: {
                $elemMatch: {
                  masterId: updatedMaster._id,
                  $or: [
                    { "rsMRNApprovedTimeStamp.inString": { $exists: false } },
                    { "rsMRNApprovedTimeStamp.inString": null },
                    { "rsMRNApprovedTimeStamp.inString": "" },
                  ],
                },
              },
            },
            { _id: 1 },
          );

          if (!existingOpenRequest) {
            const sourceSheet = await RequestSheetOfSpare.findOne({
              // newOrReOrderRequest: "NEW",
              changeParts: { $elemMatch: { masterId: updatedMaster._id } },
            })
              .sort({ createdAt: -1 })
              .lean();

            if (sourceSheet) {
              const {
                _id,
                requestSheetStatus,
                pendingApprovalBy,
                dynamicApprovalKeys,
                isSpareSheetSendForApproval,
                changeParts,
                ...rest
              } = sourceSheet;

              await RequestSheetOfSpare.create({
                ...rest,
                newOrReOrderRequest: "REORDER",
                requestSheetStatus:
                  spareApprovalStatus[spareApprovalStatus.length - 1],
                pendingApprovalBy: null,
                dynamicApprovalKeys: [],
                isSpareSheetSendForApproval: false,
                rsTimeStamp: generateTimestampIndividually(),
                changeParts: changeParts
                  .filter(
                    (part) =>
                      String(part.masterId) === String(updatedMaster._id),
                  )
                  .map((part) => ({
                    partName: part?.partName,
                    partModel: part?.partModel,
                    minQuantity: part?.minQuantity,
                    maxQuantity: part?.maxQuantity,
                    quantityRequired: part?.quantityRequired,
                    maker: part?.maker,
                    supplierName: part?.supplierName,
                    supplierCategory: part?.supplierCategory,
                    approxUnitPrice: part?.approxUnitPrice,
                    standerOrManufacturingPart:
                      part?.standerOrManufacturingPart,
                    normalOrUrgentPart: part?.normalOrUrgentPart,
                    masterId: part?.masterId,
                  })),
              });
            }
          }
        }
      }
      isIssuanceCompleted = true;
    }
  }

  await SpareIssuanceSummary.updateOne({ _id }, updateObj, {
    arrayFilters: [{ "part._id": partId }],
  });

  if (isIssuanceCompleted) return next();

  return res.status(201).json({
    isIssuanceCompleted: false,
    message: "Issuance sheets approved successfully",
  });
});

exports.issuanceSheetCompletedResponse = tryCatchHandler(
  async (req, res, next) => {
    return res.status(201).json({
      message: "Issuance sheets approved successfully",
      isIssuanceCompleted: true,
      tableData: req.tableData,
    });
  },
);
