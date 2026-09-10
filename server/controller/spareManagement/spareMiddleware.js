const mongoose = require("mongoose");
const tryCatchHandler = require("../../errorHandler/tryCatchHandler");

const RequestSheetOfSpare = require("../../model/requestSheetDataOfSpare");
const {
  spareRequesterEditableStatuses,
} = require("../../utils/spareManagementUtils");

const filterKeys = {
  "based-on-plant": "plant",
  "based-on-section": "section",
  "based-on-subSection": "subSection",
  "based-on-cell": "cell",
  "based-on-line": "line",
  "based-on-machine": "machine",
};

/**
 * The plant-hierarchy half of every Spare filter.
 *
 * No hierarchy selection means "everything". Users who are not scoped to a
 * section open their dashboards unfiltered and narrow down by choosing a
 * section, sub-section or cell, at which point the matching filter appears here.
 */
const buildHierarchyFilter = ({ selectedValue, flagForTogglingFilter } = {}) => {
  const hierarchyKey = filterKeys?.[flagForTogglingFilter];

  if (!selectedValue || !hierarchyKey) return {};

  return {
    [`${hierarchyKey}._id`]: mongoose.Types.ObjectId(selectedValue),
  };
};

exports.spareFilterMiddleware = tryCatchHandler(async (req, res, next) => {
  const { selectedYear } = req.query;

  if (!selectedYear)
    return res.status(400).json({
      message: "Please provide the required filter value",
      showToast:
        req.query.showToast && req.query.showToast === "No" ? false : true,
    });

  req.queryObj = {
    "rsTimeStamp.year.inString": selectedYear,
    ...buildHierarchyFilter(req.query),
  };

  return next();
});

/**
 * Guard for any write to an existing spare request-sheet.
 *
 * A sheet belongs to the person who raised it only while it is "Generated" or
 * "Rejected" — newly created, or handed back by an approver. Sending it for
 * approval transfers it to whoever it is waiting on, and completing the chain
 * closes it to everyone. So the only two ways to hold a write permit are:
 *
 *   - the sheet is in a requester-editable status, or
 *   - you are the approver named in pendingApprovalBy.
 *
 * Status is the signal rather than isSpareSheetSendForApproval, because that
 * flag is not reliable on older records: one Completed sheet in production
 * carries isSpareSheetSendForApproval === false.
 *
 * Runs after findSpareSheetBasedOnId where the route already loads the sheet,
 * and falls back to a projected lookup for routes that do not.
 */
exports.ensureSpareSheetIsEditable = tryCatchHandler(async (req, res, next) => {
  const spare =
    req.spare ||
    (req.query?._id &&
      (await RequestSheetOfSpare.findOne(
        { _id: req.query._id },
        { pendingApprovalBy: 1, requestSheetStatus: 1 },
      )));

  if (!spare)
    return res.status(404).json({
      message: "Spare sheet not found",
      showToast: true,
    });

  if (spareRequesterEditableStatuses.includes(spare.requestSheetStatus))
    return next();

  if (spare.pendingApprovalBy?.toString() === req.rootUser?._id?.toString())
    return next();

  return res.status(403).json({
    message: spare.pendingApprovalBy
      ? `This request-sheet is ${spare.requestSheetStatus} and can only be changed by the approver it is waiting on`
      : `This request-sheet is ${spare.requestSheetStatus} and can no longer be changed`,
    showToast: true,
  });
});

exports.getSpareRequestSheets = tryCatchHandler(async (req, res, next) => {
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
      },
    },
  ]);

  if (tableData?.length <= 0)
    return res.status(400).json({
      message: "No spare sheets to display",
      showToast: true,
    });

  req.tableData = tableData;
  return next();
});
