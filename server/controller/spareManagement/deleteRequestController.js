const mongoose = require("mongoose");
const moment = require("moment");

const tryCatchHandler = require("../../errorHandler/tryCatchHandler");

const SpareDeleteRequest = require("../../model/spareDeleteRequestSchema");

const {
  CHANGE_REQUEST_CHAINS,
  listApproversForStep,
  resolveApprovalSelection,
  applyApprovalDecision,
  displayNameOf,
} = require("../../services/spare/changeRequestApprovalService");
const {
  resolveMachineHierarchy,
} = require("../../services/spare/machineHierarchyService");
const { nextRequestNo } = require("../../services/spare/requestNumberService");

const {
  paginationRowLimit,
  generateRegexSearchString,
  dynamicApprovalStatus,
  numberOrNull,
} = require("../../utils/spareManagementUtils");
const {
  createColumnFilters,
  escapeRegex,
} = require("../../utils/columnFilters");
const {
  generateTimestampIndividually,
  generateTimeStampWithBothFormat,
} = require("../../utils/spareTimestamp");
const { isToolRoomUser } = require("../../utils/userScope");
const unparseJSONData = require("../../utils/unparseJSONData");

/**
 * A delete request follows the same fixed route and the same approval machinery
 * as a change request (TL → HOSS → HOS → HOD → Tool Room); only its part fields
 * differ, so it reuses the shared service and decision helper.
 */

/** The tool-room section of the paper form is answered by tool-room staff only. */
const normalizeToolRoom = (toolRoom, user) => ({
  requestStatus:
    isToolRoomUser(user) && ["OK", "NOT OK"].includes(toolRoom?.requestStatus)
      ? toolRoom.requestStatus
      : null,
});

const deleteRequestRowProjection = () => ({
  requestNo: 1,
  requestFor: 1,
  partName: 1,
  partNo: 1,
  maker: 1,
  price: 1,
  qty: 1,
  line: 1,
  machine: 1,
  reason: 1,
  requestDate: 1,
  toolRoom: 1,
  requestStatus: 1,
  pendingApprovalBy: 1,
  currentApprovalIndex: 1,
  approvals: 1,
  createdAt: 1,
  "createdBy.tm_name": 1,
  "createdBy.tm_no": 1,
  pendingWith: {
    $cond: [
      { $in: ["$requestStatus", ["Completed", "Rejected"]] },
      "",
      {
        $let: {
          vars: {
            step: { $arrayElemAt: ["$approvals", "$currentApprovalIndex"] },
          },
          in: { $ifNull: ["$$step.user.tm_name", ""] },
        },
      },
    ],
  },
});

const buildListMatch = (query = {}) => {
  const match = {};

  if (query.selectedYear)
    match["rsTimeStamp.year.inString"] = query.selectedYear;
  if (query.requestFor && query.requestFor !== "All")
    match.requestFor = query.requestFor;
  if (query.status && query.status !== "All")
    match.requestStatus =
      query.status === "Pending" ? { $regex: /^Under / } : query.status;

  if (query.search) {
    const regex = generateRegexSearchString(query.search);
    match.$or = [
      { requestNo: regex },
      { requestFor: regex },
      { partName: regex },
      { partNo: regex },
      { maker: regex },
      { "line.line_name": regex },
      { "machine.machine_code": regex },
      { "machine.machine_name": regex },
      { reason: regex },
      { requestStatus: regex },
      { "createdBy.tm_name": regex },
    ];
  }

  if (query.cursor && mongoose.Types.ObjectId.isValid(query.cursor))
    match._id = { $lt: mongoose.Types.ObjectId(query.cursor) };

  return match;
};

/** The dashboard columns, as the row projection names them. */
const DELETE_REQUEST_FILTERABLE_COLUMNS = new Set([
  "requestNo",
  "requestDate",
  "requestFor",
  "partName",
  "partNo",
  "maker",
  "price",
  "qty",
  "line.line_name",
  "machine.machine_code",
  "reason",
  "requestStatus",
  "pendingWith",
  "createdBy.tm_name",
]);

const {
  parse: parseColumnFilters,
  match: columnFilterMatch,
} = createColumnFilters(DELETE_REQUEST_FILTERABLE_COLUMNS);

const COLUMN_VALUES_LIMIT = 300;

exports.listDeleteRequests = tryCatchHandler(async (req, res, next) => {
  const filterMatch = columnFilterMatch(parseColumnFilters(req.query.filters));

  const tableData = await SpareDeleteRequest.aggregate([
    { $match: buildListMatch(req.query) },
    { $project: deleteRequestRowProjection() },
    ...(filterMatch ? [{ $match: filterMatch }] : []),
    { $sort: { _id: -1 } },
    { $limit: paginationRowLimit },
  ]);

  return res.status(201).json({
    message: "Delete requests get successfully",
    tableData,
    nextCursor: tableData.length ? tableData[tableData.length - 1]._id : null,
    hasMore: tableData.length >= paginationRowLimit,
  });
});

exports.exportDeleteRequests = tryCatchHandler(async (req, res, next) => {
  const { cursor, ...filters } = req.query;
  const filterMatch = columnFilterMatch(parseColumnFilters(filters.filters));

  const docs = await SpareDeleteRequest.aggregate([
    { $match: buildListMatch(filters) },
    { $project: deleteRequestRowProjection() },
    ...(filterMatch ? [{ $match: filterMatch }] : []),
    { $sort: { _id: -1 } },
  ]);

  const rows = docs.map((doc) => ({
    "Request No": doc.requestNo,
    Date: doc.requestDate,
    Department: doc.requestFor,
    "Part Name": doc.partName,
    "Part No": doc.partNo,
    Maker: doc.maker ?? "",
    Price: doc.price ?? "",
    Qty: doc.qty ?? "",
    Line: doc.line?.line_name ?? "",
    "Machine Code": doc.machine?.machine_code ?? "",
    "Machine Name": doc.machine?.machine_name ?? "",
    Reason: doc.reason,
    Status: doc.requestStatus,
    "Pending With": doc.pendingWith ?? "",
    "Tool Room Request": doc.toolRoom?.requestStatus ?? "",
  }));

  return res.status(201).json({
    message: "Delete requests exported successfully",
    tableData: unparseJSONData(rows),
    fileName: "Delete Requests",
  });
});

/**
 * The approver choices the form renders: one dropdown per step of the shared
 * route. TL and HOSS are separate slots over the same "TL/HOSS" users.
 */
exports.getDeleteRequestApprovers = tryCatchHandler(async (req, res, next) => {
  const { department } = req.query;

  if (!CHANGE_REQUEST_CHAINS[department])
    return res.status(400).json({
      message: "Please select the department (MTD or PRD)",
      showToast: true,
    });

  const allUsers = [];

  for (const key of CHANGE_REQUEST_CHAINS[department]) {
    const users = await listApproversForStep(key, {
      plantData: req.rootUser?.plant_data,
      sectionData: req.rootUser?.section_data,
    });

    allUsers.push({
      fieldRef: {
        approvalKey: `approvalOf${key}`,
        displayName: displayNameOf(key),
      },
      users,
    });
  }

  return res.status(201).json({
    message: "Approvers get successfully",
    allUsers,
  });
});

/**
 * Distinct values of one dashboard column with their row counts — the list the
 * Excel-style filter shows. Narrowed by the other columns' filters, and by a
 * search, the same way the master dashboards do.
 */
exports.getDeleteRequestColumnValues = tryCatchHandler(
  async (req, res, next) => {
    const { column, search = "" } = req.query;

    if (!DELETE_REQUEST_FILTERABLE_COLUMNS.has(column))
      return res.status(400).json({
        message: `"${column}" is not a filterable column`,
        showToast: true,
      });

    const otherMatch = columnFilterMatch(parseColumnFilters(req.query.filters), {
      except: column,
    });

    const values = await SpareDeleteRequest.aggregate([
      { $project: deleteRequestRowProjection() },
      ...(otherMatch ? [{ $match: otherMatch }] : []),
      { $unwind: { path: `$${column}`, preserveNullAndEmptyArrays: true } },
      {
        $set: {
          value: {
            $cond: [{ $in: [`$${column}`, [null, ""]] }, null, `$${column}`],
          },
        },
      },
      ...(search
        ? [
            {
              $match: {
                $expr: {
                  $regexMatch: {
                    input: { $toString: { $ifNull: ["$value", ""] } },
                    regex: escapeRegex(search),
                    options: "i",
                  },
                },
              },
            },
          ]
        : []),
      { $group: { _id: "$value", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $limit: COLUMN_VALUES_LIMIT + 1 },
      { $project: { _id: 0, value: "$_id", count: 1 } },
    ]);

    const truncated = values.length > COLUMN_VALUES_LIMIT;

    return res.status(201).json({
      message: "Column values get successfully",
      values: truncated ? values.slice(0, COLUMN_VALUES_LIMIT) : values,
      truncated,
    });
  },
);

exports.getDeleteRequestById = tryCatchHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(400).json({ message: "Invalid request id" });

  const deleteRequest = await SpareDeleteRequest.findById(id).lean();
  if (!deleteRequest)
    return res.status(404).json({ message: "Delete request not found" });

  return res.status(201).json({
    message: "Delete request get successfully",
    deleteRequest,
  });
});

exports.createDeleteRequest = tryCatchHandler(async (req, res, next) => {
  const {
    requestFor,
    partName,
    partNo,
    maker,
    price,
    qty,
    reason,
    requestDate,
    toolRoom,
    machineId,
  } = req.body ?? {};

  if (!["MTD", "PRD"].includes(requestFor))
    return res.status(400).json({
      message: "Please select the department (MTD or PRD)",
      showToast: true,
    });
  if (!String(partName ?? "").trim() || !String(partNo ?? "").trim())
    return res.status(400).json({
      message: "Please enter the part name and number",
      showToast: true,
    });
  if (!String(reason ?? "").trim())
    return res.status(400).json({
      message: "Please enter the reason",
      showToast: true,
    });
  if (!machineId)
    return res.status(400).json({
      message: "Please select the line and machine",
      showToast: true,
    });

  const hierarchy = await resolveMachineHierarchy(machineId);
  if (hierarchy?.isError)
    return res.status(400).json({
      message: hierarchy?.message,
      showToast: true,
    });

  const user = req.rootUser;

  const selections = Object.fromEntries(
    CHANGE_REQUEST_CHAINS[requestFor].map((key) => [
      key,
      req.body?.[`approvalOf${key}`]?.user?._id,
    ]),
  );

  const { steps, error } = await resolveApprovalSelection({
    requestFor,
    user,
    selections,
  });
  if (error)
    return res.status(400).json({ message: error, showToast: true });

  const { requestNo, error: sequenceError } = await nextRequestNo({
    plantData: user?.plant_data,
    counterField: "spareDeleteRequestSeq",
    prefix: "DR",
  });
  if (sequenceError)
    return res.status(400).json({ message: sequenceError, showToast: true });

  const deleteRequest = new SpareDeleteRequest({
    requestNo,
    requestFor,
    partName: String(partName).trim(),
    partNo: String(partNo).trim(),
    maker: String(maker ?? "").trim(),
    price: numberOrNull(price),
    qty: numberOrNull(qty),
    line: hierarchy.line,
    machine: hierarchy.machine,
    reason: String(reason).trim(),
    requestDate: requestDate || moment().format("YYYY-MM-DD"),
    toolRoom: normalizeToolRoom(toolRoom, user),
    approvals: steps,
    currentApprovalIndex: 0,
    pendingApprovalBy: steps[0]?.user?._id,
    requestStatus: dynamicApprovalStatus?.[steps[0]?.key] ?? steps[0]?.userType,
    createdBy: {
      _id: user?._id,
      tm_no: user?.tm_no,
      tm_name: user?.tm_name,
      email: user?.email,
      plant_data: user?.plant_data,
      section_data: user?.section_data,
    },
    dateTime: generateTimeStampWithBothFormat(),
    rsTimeStamp: generateTimestampIndividually(),
  });

  await deleteRequest.save();

  return res.status(201).json({
    message: "Delete request submitted for approval",
    showToast: true,
    deleteRequest,
  });
});

exports.actOnDeleteRequest = tryCatchHandler(async (req, res, next) => {
  const { _id } = req.query;
  const { isApproved, remarks } = req.body ?? {};

  if (!mongoose.Types.ObjectId.isValid(_id))
    return res.status(400).json({ message: "Invalid request id" });
  if (!["Yes", "No"].includes(isApproved))
    return res.status(400).json({
      message: "Please accept or reject the request",
      showToast: true,
    });
  if (isApproved === "No" && !String(remarks ?? "").trim())
    return res.status(400).json({
      message: "Please enter the rejection remarks",
      showToast: true,
    });

  const deleteRequest = await SpareDeleteRequest.findById(_id);
  if (!deleteRequest)
    return res.status(404).json({ message: "Delete request not found" });

  if (
    String(deleteRequest.pendingApprovalBy ?? "") !==
    String(req.rootUser?._id ?? "")
  )
    return res.status(403).json({
      message: "This delete request is not waiting on you",
      showToast: true,
    });

  const decisionError = applyApprovalDecision(deleteRequest, {
    isApproved,
    remarks,
  });
  if (decisionError)
    return res.status(400).json({ message: decisionError, showToast: true });

  await deleteRequest.save();

  return res.status(201).json({
    message:
      isApproved === "Yes" ? "Delete request approved" : "Delete request rejected",
    showToast: true,
    deleteRequest,
  });
});
