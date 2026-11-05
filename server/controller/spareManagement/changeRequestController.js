const mongoose = require("mongoose");
const moment = require("moment");

const tryCatchHandler = require("../../errorHandler/tryCatchHandler");

const SpareChangeRequest = require("../../model/spareChangeRequestSchema");

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

const STRING_PART_FIELDS = ["partName", "partNo", "maker"];
const NUMBER_PART_FIELDS = [
  "maxQty",
  "minQty",
  "monthlyRequirement",
  "stockInQty",
];

/** Trims the text fields and keeps only usable, non-negative numbers. */
const normalizePart = (part = {}) => {
  const normalized = {};
  STRING_PART_FIELDS.forEach(
    (field) => (normalized[field] = String(part?.[field] ?? "").trim()),
  );
  NUMBER_PART_FIELDS.forEach(
    (field) => (normalized[field] = numberOrNull(part?.[field])),
  );
  return normalized;
};

/** The tool-room section of the paper form is filled by tool-room staff only. */
const normalizeToolRoom = (toolRoom, user) => {
  if (!isToolRoomUser(user))
    return { locationNo: "", requestStatus: null };

  return {
    locationNo: String(toolRoom?.locationNo ?? "").trim(),
    requestStatus: ["OK", "NOT OK"].includes(toolRoom?.requestStatus)
      ? toolRoom.requestStatus
      : null,
  };
};

const changeRequestRowProjection = () => ({
  requestNo: 1,
  requestFor: 1,
  partsCategory: 1,
  newPart: 1,
  oldPart: 1,
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

  if (query.selectedYear) match["rsTimeStamp.year.inString"] = query.selectedYear;
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
      { partsCategory: regex },
      { "newPart.partName": regex },
      { "newPart.partNo": regex },
      { "newPart.maker": regex },
      { "newPart.line.line_name": regex },
      { "newPart.machine.machine_code": regex },
      { "newPart.machine.machine_name": regex },
      { "oldPart.partName": regex },
      { "oldPart.partNo": regex },
      { "oldPart.maker": regex },
      { "oldPart.line.line_name": regex },
      { "oldPart.machine.machine_code": regex },
      { "oldPart.machine.machine_name": regex },
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
const CHANGE_REQUEST_FILTERABLE_COLUMNS = new Set([
  "requestNo",
  "requestDate",
  "requestFor",
  "partsCategory",
  "newPart.partName",
  "newPart.partNo",
  "oldPart.partName",
  "oldPart.partNo",
  "newPart.line.line_name",
  "newPart.machine.machine_code",
  "oldPart.line.line_name",
  "oldPart.machine.machine_code",
  "reason",
  "requestStatus",
  "pendingWith",
  "createdBy.tm_name",
]);

const {
  parse: parseColumnFilters,
  match: columnFilterMatch,
} = createColumnFilters(CHANGE_REQUEST_FILTERABLE_COLUMNS);

const COLUMN_VALUES_LIMIT = 300;

exports.listChangeRequests = tryCatchHandler(async (req, res, next) => {
  const filterMatch = columnFilterMatch(parseColumnFilters(req.query.filters));

  const tableData = await SpareChangeRequest.aggregate([
    { $match: buildListMatch(req.query) },
    { $project: changeRequestRowProjection() },
    ...(filterMatch ? [{ $match: filterMatch }] : []),
    { $sort: { _id: -1 } },
    { $limit: paginationRowLimit },
  ]);

  return res.status(201).json({
    message: "Change requests get successfully",
    tableData,
    nextCursor: tableData.length ? tableData[tableData.length - 1]._id : null,
    hasMore: tableData.length >= paginationRowLimit,
  });
});

exports.exportChangeRequests = tryCatchHandler(async (req, res, next) => {
  const { cursor, ...filters } = req.query;
  const filterMatch = columnFilterMatch(parseColumnFilters(filters.filters));

  const docs = await SpareChangeRequest.aggregate([
    { $match: buildListMatch(filters) },
    { $project: changeRequestRowProjection() },
    ...(filterMatch ? [{ $match: filterMatch }] : []),
    { $sort: { _id: -1 } },
  ]);

  const rows = docs.map((doc) => ({
    "Request No": doc.requestNo,
    Date: doc.requestDate,
    Department: doc.requestFor,
    "Parts Category": doc.partsCategory,
    "New Part Name": doc.newPart?.partName ?? "",
    "New Part No": doc.newPart?.partNo ?? "",
    // Records raised before the maker/line/machine fields moved keep their
    // values in the old places; the export reads both.
    "New Maker": doc.newPart?.maker ?? doc.newPart?.manufacturer ?? "",
    "New Max Qty": doc.newPart?.maxQty ?? "",
    "New Min Qty": doc.newPart?.minQty ?? "",
    "New Monthly Req": doc.newPart?.monthlyRequirement ?? "",
    "New Stock In Qty": doc.newPart?.stockInQty ?? "",
    "Old Part Name": doc.oldPart?.partName ?? "",
    "Old Part No": doc.oldPart?.partNo ?? "",
    "Old Maker": doc.oldPart?.maker ?? doc.oldPart?.manufacturer ?? "",
    "Old Max Qty": doc.oldPart?.maxQty ?? "",
    "Old Min Qty": doc.oldPart?.minQty ?? "",
    "Old Monthly Req": doc.oldPart?.monthlyRequirement ?? "",
    "Old Stock In Qty": doc.oldPart?.stockInQty ?? "",
    "New Line":
      doc.newPart?.line?.line_name ?? doc.line?.line_name ?? doc.newPart?.line ?? "",
    "New Machine Code":
      doc.newPart?.machine?.machine_code ??
      doc.machine?.machine_code ??
      doc.newPart?.machineNo ??
      "",
    "New Machine Name":
      doc.newPart?.machine?.machine_name ??
      doc.machine?.machine_name ??
      doc.newPart?.machineName ??
      "",
    "Old Line":
      doc.oldPart?.line?.line_name ?? doc.line?.line_name ?? doc.oldPart?.line ?? "",
    "Old Machine Code":
      doc.oldPart?.machine?.machine_code ??
      doc.machine?.machine_code ??
      doc.oldPart?.machineNo ??
      "",
    "Old Machine Name":
      doc.oldPart?.machine?.machine_name ??
      doc.machine?.machine_name ??
      doc.oldPart?.machineName ??
      "",
    Reason: doc.reason,
    Status: doc.requestStatus,
    "Pending With": doc.pendingWith ?? "",
    "Location No": doc.toolRoom?.locationNo ?? "",
    "Tool Room Request": doc.toolRoom?.requestStatus ?? "",
  }));

  return res.status(201).json({
    message: "Change requests exported successfully",
    tableData: unparseJSONData(rows),
    fileName: "Change Requests",
  });
});

/**
 * Distinct values of one dashboard column with their row counts — the list the
 * Excel-style filter shows. Narrowed by the other columns' filters, and by a
 * search, the same way the master dashboards do.
 */
exports.getChangeRequestColumnValues = tryCatchHandler(
  async (req, res, next) => {
    const { column, search = "" } = req.query;

    if (!CHANGE_REQUEST_FILTERABLE_COLUMNS.has(column))
      return res.status(400).json({
        message: `"${column}" is not a filterable column`,
        showToast: true,
      });

    const otherMatch = columnFilterMatch(parseColumnFilters(req.query.filters), {
      except: column,
    });

    const values = await SpareChangeRequest.aggregate([
      { $project: changeRequestRowProjection() },
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

exports.getChangeRequestById = tryCatchHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(400).json({ message: "Invalid request id" });

  const changeRequest = await SpareChangeRequest.findById(id).lean();
  if (!changeRequest)
    return res.status(404).json({ message: "Change request not found" });

  return res.status(201).json({
    message: "Change request get successfully",
    changeRequest,
  });
});

/**
 * The approver choices the form renders: one dropdown per step of the
 * department's fixed route. TL and HOSS are separate steps fed from the same
 * "TL/HOSS" user type, so the requester can name the same person twice or two
 * different people — the paper form has a box for each.
 */
exports.getChangeRequestApprovers = tryCatchHandler(async (req, res, next) => {
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

exports.createChangeRequest = tryCatchHandler(async (req, res, next) => {
  const { requestFor, partsCategory, newPart, oldPart, reason, requestDate, toolRoom } =
    req.body ?? {};

  if (!["MTD", "PRD"].includes(requestFor))
    return res.status(400).json({
      message: "Please select the department (MTD or PRD)",
      showToast: true,
    });
  if (!["NEW", "RE-USE"].includes(partsCategory))
    return res.status(400).json({
      message: "Please select the parts category",
      showToast: true,
    });

  const normalizedNew = normalizePart(newPart);
  const normalizedOld = normalizePart(oldPart);

  if (!normalizedNew.partName || !normalizedNew.partNo)
    return res.status(400).json({
      message: "Please enter the new part name and number",
      showToast: true,
    });
  if (!normalizedOld.partName || !normalizedOld.partNo)
    return res.status(400).json({
      message: "Please enter the old part name and number",
      showToast: true,
    });
  if (!String(reason ?? "").trim())
    return res.status(400).json({
      message: "Please enter the reason",
      showToast: true,
    });

  const { newPartMachineId, oldPartMachineId } = req.body ?? {};

  if (!newPartMachineId)
    return res.status(400).json({
      message: "Please select the NEW line and machine",
      showToast: true,
    });
  if (!oldPartMachineId)
    return res.status(400).json({
      message: "Please select the OLD line and machine",
      showToast: true,
    });

  /**
   * Each column has its own machine id from its own cascade; the line, cell and
   * plant above it are resolved here so the request is stamped with both.
   */
  const [newHierarchy, oldHierarchy] = await Promise.all([
    resolveMachineHierarchy(newPartMachineId),
    resolveMachineHierarchy(oldPartMachineId),
  ]);

  if (newHierarchy?.isError)
    return res.status(400).json({
      message: `NEW: ${newHierarchy.message}`,
      showToast: true,
    });
  if (oldHierarchy?.isError)
    return res.status(400).json({
      message: `OLD: ${oldHierarchy.message}`,
      showToast: true,
    });

  const user = req.rootUser;

  /**
   * The requester names one approver per step. The keys are the department's
   * fixed route; resolveApprovalSelection re-checks each choice against the
   * same list its dropdown offered, so a forged id cannot enter the chain.
   */
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
    counterField: "spareChangeRequestSeq",
    prefix: "CR",
  });
  if (sequenceError)
    return res.status(400).json({ message: sequenceError, showToast: true });

  const changeRequest = new SpareChangeRequest({
    requestNo,
    requestFor,
    partsCategory,
    newPart: {
      ...normalizedNew,
      line: newHierarchy.line,
      machine: newHierarchy.machine,
    },
    oldPart: {
      ...normalizedOld,
      line: oldHierarchy.line,
      machine: oldHierarchy.machine,
    },
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

  await changeRequest.save();

  return res.status(201).json({
    message: "Change request submitted for approval",
    showToast: true,
    changeRequest,
  });
});

exports.actOnChangeRequest = tryCatchHandler(async (req, res, next) => {
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

  const changeRequest = await SpareChangeRequest.findById(_id);
  if (!changeRequest)
    return res.status(404).json({ message: "Change request not found" });

  if (String(changeRequest.pendingApprovalBy ?? "") !== String(req.rootUser?._id ?? ""))
    return res.status(403).json({
      message: "This change request is not waiting on you",
      showToast: true,
    });

  const decisionError = applyApprovalDecision(changeRequest, {
    isApproved,
    remarks,
  });
  if (decisionError)
    return res.status(400).json({ message: decisionError, showToast: true });

  await changeRequest.save();

  return res.status(201).json({
    message:
      isApproved === "Yes"
        ? "Change request approved"
        : "Change request rejected",
    showToast: true,
    changeRequest,
  });
});
