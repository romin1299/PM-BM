const mongoose = require("mongoose");
const moment = require("moment-timezone");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const tryCatchHandler = require("../../errorHandler/tryCatchHandler");
const {
  spareApprovalStatus,
  spareRejectedStatus,
  spareApprovalUserType,
  dynamicApprovalStatus,
  hooksFormReferenceOfApproval,
  timezone,
  isBudgetChecked,
} = require("../../utils/spareManagementUtils");
const {
  generateTimestampIndividually,
  generateTimeStampWithBothFormat,
} = require("../../utils/spareTimestamp");

const User = require("../../model/userSchema");
const Plant = require("../../model/plantSchema");
const Section = require("../../model/sectionSchema");
const SubSection = require("../../model/subSectionSchema");
const Cell = require("../../model/cellSchema");
const Line = require("../../model/lineSchema");
const Machine = require("../../model/machineSchema");
const RequestSheetOfSpare = require("../../model/requestSheetDataOfSpare");
const {
  findAlreadyOrderedParts,
} = require("../../services/spare/alreadyOrderedPartsService");
const SpareMaster = require("../../model/spareMasterSchema");
const {
  syncSheetDrawingsToMasters,
  removeDrawingFileIfUnreferenced,
} = require("../../services/spare/masterDrawingService");
const {
  notifyApprovalChange,
} = require("../../services/spare/spareApprovalMailService");
const {
  resolveMachineHierarchy,
  requestSheetNoPrefix,
  nextSpareRequestSheetCount,
} = require("../../services/spare/machineHierarchyService");
const {
  listRejectedSheets,
  buildSheetCopy,
} = require("../../services/spare/rejectedSheetCopyService");

const {
  appendLedgerEntry,
} = require("../../services/spare/stockLedgerService");

const partFields = new Set([
  "rsPartReceive",
  "rsPartInspection",
  "rsMRNIssued",
  "rsMRNApproved",
]);

const getCostDetailsBasedOnPartId = async ({ masterId, partId }) =>
  (
    await SpareMaster.findOne(
      { _id: masterId },
      {
        costDetails: {
          $elemMatch: { partId },
        },
      },
    ).lean()
  )?.costDetails?.[0];

const isBlank = (value) => value === "" || value == null;

/**
 * Min/Max are stock levels, so they are checked only on a stock-in sheet; a
 * blank on either side is "no bound". Returns the message to refuse with, or
 * null when every part is in order. Mirrors the client rule so a request that
 * skips the form gets the same answer.
 */
const minMaxViolationMessage = ({ changeParts, newPartFor }) => {
  if (newPartFor !== "For stock in" || !Array.isArray(changeParts)) return null;

  const offending = changeParts
    .map((part, index) => ({ part, index }))
    .filter(({ part }) => {
      if (isBlank(part?.minQuantity) || isBlank(part?.maxQuantity))
        return false;
      const min = Number(part.minQuantity);
      const max = Number(part.maxQuantity);
      return Number.isFinite(min) && Number.isFinite(max) && min > max;
    })
    .map(
      ({ part, index }) =>
        part?.partName?.trim() || `Part Details ${index + 1}`,
    );

  if (!offending.length) return null;
  return `Min quantity cannot be greater than max quantity: ${offending.join(", ")}`;
};

const storageForDataSheetsOfBD = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../../spareDocuments"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

exports.uploadDrawingAttach = multer({
  storage: storageForDataSheetsOfBD,
});

exports.getNewSpareSheetNoByDefault = tryCatchHandler(
  async (req, res, next) => {
    const { selectedLine } = req.query;

    if (!selectedLine)
      return res.status(400).json({
        message: "Please provide the Line value",
      });

    let lineDetails = await Line.findOne(
      { _id: selectedLine },
      {
        line_name: 1,
        requestSheetNoSpare: 1,
        cell_names: 1,
      },
    ).populate({
      path: "cell_names",
      select: "subSection_names",
      populate: {
        path: "subSection_names",
        select: "subSection_name section_names",
        populate: {
          path: "section_names",
          select: "section_name dashboardLevel",
        },
      },
    });

    const subSection = lineDetails?.cell_names?.subSection_names;

    // The number is only previewed here, so the line's counter is read rather
    // than taken; submitting the sheet is what advances it.
    const requestSheetNo = `${requestSheetNoPrefix({
      section: subSection?.section_names,
      subSection,
    })}-${(lineDetails?.line_name ?? "").trim()}-${
      moment().tz("Asia/Kolkata").month() + 1
    }-SPARE-${
      lineDetails?.requestSheetNoSpare
        ? lineDetails?.requestSheetNoSpare + 1
        : 1
    }`.trim();

    return res.status(201).json({
      message: "Spare sheet number get successfully based on selected Line",
      requestSheetNo,
    });
  },
);
/** Options for the "copy from a rejected sheet" dropdown on a new request. */
exports.getRejectedSheetsForCopy = tryCatchHandler(async (req, res, next) => {
  const { tableData, nextCursor, hasMore } = await listRejectedSheets({
    search: req.query?.search,
    cursor: req.query?.cursor,
  });

  return res.status(200).json({
    message: "Rejected request-sheets fetched",
    tableData,
    nextCursor,
    hasMore,
  });
});

/** The copyable content of one rejected sheet, for prefilling a new request. */
exports.getRejectedSheetCopy = tryCatchHandler(async (req, res, next) => {
  const { isError, message, sheet, hierarchy } = await buildSheetCopy(
    req.query?._id,
  );

  if (isError) return res.status(400).json({ message, showToast: true });

  return res.status(200).json({
    message: "Request-sheet copied",
    sheet,
    hierarchy,
  });
});

const handleSetUploadedFileName = async ({
  data = {},
  uploadFileIndexesStr = "",
  filesInfo = [{ filename: "", originalname: "" }],
  fieldName = "drawingAttach",
  multiple = false,
}) => {
  try {
    if (uploadFileIndexesStr) {
      const uploadFileIndexes = JSON.parse(uploadFileIndexesStr);
      for (let i = 0; i < uploadFileIndexes?.length; i++) {
        const partIndex = uploadFileIndexes[i];
        if (data?.changeParts?.[partIndex]) {
          const { filename, originalname } = filesInfo?.[i];

          if (multiple) {
            if (!Array.isArray(data.changeParts[partIndex][fieldName]))
              data.changeParts[partIndex][fieldName] = [];

            data.changeParts[partIndex][fieldName].push({
              filename,
              originalname,
            });
          } else {
            data.changeParts[partIndex][fieldName] = filename;
            data.changeParts[partIndex][`${fieldName}OriginalName`] =
              originalname;
          }
        }
      }
    }
    return data;
  } catch (error) {
    throw new Error(error);
  }
};

const handleSetNGBudgetData = async ({
  data = {},
  documentByRequestGenerator = [],
  existingSpare = {},
}) => {
  try {
    const { mtdHODApprovalIfBudgetIsNG } = data;
    if (!mtdHODApprovalIfBudgetIsNG?.user?._id)
      return {
        isError: true,
        message: "Please select MTD HOD",
      };

    const user = await User.findOne({
      _id: mtdHODApprovalIfBudgetIsNG?.user?._id,
    });

    if (!user)
      return {
        isError: true,
        message: "User does not exist",
      };

    data["mtdHODApprovalIfBudgetIsNG"] = {
      user,
      userType: spareApprovalUserType[0],
      approvalStatus: "Pending",
    };
    data["requestSheetStatus"] = spareApprovalStatus?.[0];
    data["pendingApprovalBy"] = user?._id;
    data["dynamicApprovalKeys"] = ["mtdHODApprovalIfBudgetIsNG"];

    if (
      !existingSpare?.mtdHODApprovalIfBudgetIsNGApprovalLogs ||
      existingSpare?.mtdHODApprovalIfBudgetIsNGApprovalLogs?.length <= 0
    )
      data["mtdHODApprovalIfBudgetIsNGApprovalLogs"] = [
        data?.mtdHODApprovalIfBudgetIsNG,
      ];
    else {
      existingSpare.mtdHODApprovalIfBudgetIsNGApprovalLogs?.push(
        data?.mtdHODApprovalIfBudgetIsNG,
      );

      data[`mtdHODApprovalIfBudgetIsNGApprovalLogs`] =
        existingSpare?.mtdHODApprovalIfBudgetIsNGApprovalLogs;
    }

    if (documentByRequestGenerator?.[0]) {
      if (data?.ifBudgetIsNG)
        data.ifBudgetIsNG.documentByRequestGenerator =
          documentByRequestGenerator?.[0];
      else
        data["ifBudgetIsNG.documentByRequestGenerator"] =
          documentByRequestGenerator?.[0];
    }
    return data;
  } catch (error) {
    throw new Error(error);
  }
};

const handleSetSpareSheetDynamicApproval = async ({
  plant_id = "",
  data = {},
  existingSpare = {},
  dynamicApprovalSelectionKey = "",
}) => {
  try {
    if (
      data?.approvalOfMTD_TL ||
      data?.approvalOfMTD_HOSS ||
      data?.approvalOfPRD_TL ||
      data?.approvalOfPRD_HOSS ||
      data?.approvalOfMTD_HOS ||
      data?.approvalOfPRD_HOS ||
      data?.approvalOfMTD_HOD ||
      data?.approvalOfPRD_HOD ||
      data?.approvalOfTOOL_ROOM
    ) {
      const plant = await Plant.findOne(
        { plant_id },
        { spareSheetDynamicApproval: 1 },
      );

      if (!plant)
        return {
          isError: true,
          message: "Plant does not exist",
        };

      const dynamicApproval =
        plant?.spareSheetDynamicApproval?.[dynamicApprovalSelectionKey];

      if (!dynamicApproval || dynamicApproval?.length <= 0)
        return {
          isError: true,
          message: "Please configure dynamic approval first",
        };

      let allUser_Ids = [];

      console.log(data);

      /**
       * The form sends only the fields the user actually changed, so a slot they
       * left untouched never reaches this point. Fall back to whatever is already
       * stored for that slot, otherwise editing a single approver would be
       * reported as "Please select all the approvals" even though the rest are
       * validly selected.
       *
       * This does not weaken the post-rejection rule: a rejection nulls every
       * slot, so nothing falls back and the requester has to pick the whole
       * chain from the start.
       */
      const selectedApprovalUserIds = {};

      for (let i = 0; i < dynamicApproval.length; i++) {
        const approvalKey = `approvalOf${dynamicApproval[i]}`;
        const selectedUserId =
          data?.[approvalKey]?.user?._id ??
          existingSpare?.[approvalKey]?.user?._id;

        if (!selectedUserId)
          return {
            isError: true,
            message: `Please select the ${
              hooksFormReferenceOfApproval?.[dynamicApproval[i]]?.displayName ||
              dynamicApproval[i]
            } approval`,
          };

        selectedApprovalUserIds[approvalKey] = selectedUserId.toString();
        allUser_Ids.push(selectedUserId);
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
        return {
          isError: true,
          message: "Selected approval users does not exists",
        };

      let dynamicApprovalKeys = [];

      for (let i = 0; i < dynamicApproval.length; i++) {
        const user = users.find(
          (item) =>
            item?._id.toString() ===
            selectedApprovalUserIds[`approvalOf${dynamicApproval[i]}`],
        );

        if (user) {
          data[`approvalOf${dynamicApproval[i]}`] = {
            userType: dynamicApproval[i]?.split("_")?.join(" "),
            user,
            approvalStatus: "Pending",
          };

          if (
            !existingSpare[`approvalOf${dynamicApproval[i]}ApprovalLogs`] ||
            existingSpare[`approvalOf${dynamicApproval[i]}ApprovalLogs`]
              ?.length <= 0
          )
            data[`approvalOf${dynamicApproval[i]}ApprovalLogs`] = [
              data?.[`approvalOf${dynamicApproval[i]}`],
            ];
          else {
            existingSpare[`approvalOf${dynamicApproval[i]}ApprovalLogs`]?.push(
              data?.[`approvalOf${dynamicApproval[i]}`],
            );

            data[`approvalOf${dynamicApproval[i]}ApprovalLogs`] =
              existingSpare?.[`approvalOf${dynamicApproval[i]}ApprovalLogs`];
          }

          dynamicApprovalKeys.push(`approvalOf${dynamicApproval[i]}`);
          if (i === 0) {
            data["pendingApprovalBy"] = user?._id;
            data["requestSheetStatus"] =
              dynamicApprovalStatus?.[dynamicApproval[i]];
          }
        }
      }

      data["dynamicApprovalKeys"] = dynamicApprovalKeys;
      data.isSpareSheetSendForApproval = true;
    }

    return data;
  } catch (error) {
    throw new Error(error);
  }
};

exports.registerNewSpareRequest = tryCatchHandler(async (req, res, next) => {
  if (!req.body?.data)
    return res.status(400).json({
      message: "Please provide required details",
      showToast: true,
    });

  let data = JSON.parse(req.body?.data);

  const { selectedMachine } = req.query;
  let message = "Spare sheet generated successfully";

  if (!selectedMachine)
    return res.status(400).json({
      message: "Please provide the Cell, Line, Machine value",
      showToast: true,
    });

  if (!data?.changeParts || data?.changeParts?.length <= 0)
    return res.status(400).json({
      message: "Please add at least one part",
      showToast: true,
    });

  const minMaxMessage = minMaxViolationMessage(data);
  if (minMaxMessage)
    return res.status(400).json({ message: minMaxMessage, showToast: true });

  const incomingModels = data?.changeParts
    .map((p) => p?.partModel?.trim())
    .filter(Boolean);

  const uniqueModels = new Set(incomingModels);

  if (uniqueModels.size !== incomingModels.length) {
    const duplicates = incomingModels.filter(
      (model, i) => incomingModels.indexOf(model) !== i,
    );

    return res.status(400).json({
      message: `Duplicate part models in your request: ${[...new Set(duplicates)].join(", ")}`,
      showToast: true,
      // Drawn as the large red alert on the client; the list of clashes is the
      // whole point of the message and must stay readable.
      toastVariant: "alert",
    });
  }

  const incomingModelsSet = new Set(incomingModels);

  /**
   * The two "already there" checks belong to different requests:
   *   - For stock in: the part will become a master, so one that already is
   *     a master cannot be requested again.
   *   - For use: the part is consumed on the machine and never gets a master,
   *     so "already exists" does not apply; what matters is whether it is
   *     already being ordered.
   */
  const isForUse = data?.newPartFor === "For use";

  const existingMasters = isForUse
    ? []
    : await SpareMaster.find(
        { partModel: { $in: incomingModels } },
        { partModel: 1 },
      ).lean();

  if (existingMasters.length > 0) {
    const conflicts = [];

    for (const master of existingMasters)
      if (incomingModelsSet.has(master.partModel))
        conflicts.push(master.partModel);

    return res.status(400).json({
      message: `Part models already exist: ${conflicts.join(", ")}`,
      showToast: true,
      toastVariant: "alert",
    });
  }

  /**
   * For use only: a part already on a request-sheet in the ordering dashboard is
   * being ordered already; requesting it again would order it twice.
   */
  const alreadyOrdered = isForUse
    ? await findAlreadyOrderedParts([...incomingModelsSet])
    : [];

  if (alreadyOrdered.length > 0)
    return res.status(400).json({
      message: `Duplicate or Already Ordered: ${alreadyOrdered
        .map(
          ({ partModel, requestSheetNo }) =>
            `${partModel} (on ${requestSheetNo})`,
        )
        .join(", ")}`,
      showToast: true,
      toastVariant: "alert",
    });

  const hierarchy = await resolveMachineHierarchy(selectedMachine);

  if (hierarchy?.isError)
    return res.status(400).json({
      message: hierarchy?.message,
      showToast: true,
    });

  data["plant"] = hierarchy?.plant;
  data["section"] = hierarchy?.section;
  data["subSection"] = hierarchy?.subSection;
  data["cell"] = hierarchy?.cell;
  data["line"] = hierarchy?.line;
  data["machine"] = hierarchy?.machine;

  const sheetCount = await nextSpareRequestSheetCount(hierarchy?.line?._id);

  data["requestSheetNo"] =
    `${requestSheetNoPrefix(hierarchy)}-${(hierarchy?.line?.line_name ?? "").trim()}-${
      moment().tz("Asia/Kolkata").month() + 1
    }-SPARE-${sheetCount}`.trim();

  data = await handleSetUploadedFileName({
    data,
    uploadFileIndexesStr: req.body?.uploadFileIndexes,
    filesInfo: req.files?.drawingAttach,
    multiple: true,
  });

  data = await handleSetUploadedFileName({
    data,
    uploadFileIndexesStr: req.body?.uploadAdditionalFileIndexes,
    filesInfo: req.files?.additionalAttachments,
    fieldName: "additionalAttachments",
    multiple: true,
  });

  /**
   * A PRD sheet is not weighed against the budget: whatever the client sent is
   * set aside and no NG approval is ever asked for. It is recorded as budget OK
   * (and no amount), which sends it straight to its approval chain and lets it
   * through the Ordering dashboard like any sheet whose budget is fine.
   */
  const budgetChecked = isBudgetChecked(data?.partRequestFor);

  if (!budgetChecked) {
    data["budget"] = { budgetStatus: "OK" };
    delete data["ifBudgetIsNG"];
    delete data["mtdHODApprovalIfBudgetIsNG"];
  }

  const { budget } = data;

  if (budgetChecked && (!budget?.budgetStatus || budget?.requiredBudget < 0))
    return res.status(400).json({
      message: "Please provide details",
      showToast: true,
    });

  if (budgetChecked && budget?.requiredBudget <= 0)
    return res.status(400).json({
      message: "Required budget should be greater then zero",
      showToast: true,
    });

  if (budgetChecked && budget?.budgetStatus === "NG") {
    delete data["approvalOfMTD_TL"];
    delete data["approvalOfMTD_HOSS"];
    delete data["approvalOfPRD_TL"];
    delete data["approvalOfPRD_HOSS"];
    delete data["approvalOfMTD_HOS"];
    delete data["approvalOfPRD_HOS"];
    delete data["approvalOfMTD_HOD"];
    delete data["approvalOfPRD_HOD"];
    delete data["approvalOfTOOL_ROOM"];

    let returnData = await handleSetNGBudgetData({
      data,
      documentByRequestGenerator: req.files?.documentByRequestGenerator,
    });

    if (returnData?.isError)
      return res.status(400).json({
        message: returnData?.message,
        showToast: true,
      });

    data = returnData;
    message = "Spare sheet send for MTD HOD approval";
  } else {
    delete data["mtdHODApprovalIfBudgetIsNG"];
    let returnData = await handleSetSpareSheetDynamicApproval({
      plant_id: req?.rootUser?.plant_data?.split("-")?.[0],
      data,
      dynamicApprovalSelectionKey: data?.partRequestFor,
    });

    if (returnData?.isError)
      return res.status(400).json({
        message: returnData?.message,
        showToast: true,
      });

    returnData["rsSubmittedTimeStamp"] = generateTimeStampWithBothFormat();
    data = returnData;
  }

  data["requestSheetCreatedBy"] = req.rootUser;
  data["rsTimeStamp"] = generateTimestampIndividually();

  const spare = new RequestSheetOfSpare(data);
  await spare.save();

  // A drawing attached to a part belongs to the part's master as well. Parts
  // raised against an existing master (re-orders) carry it across now; a new
  // part's drawings follow when its master is registered.
  await syncSheetDrawingsToMasters(spare);

  // ── Stock-Ledger: ORDER entry ──────────────────────────────────────────
  // For every part on the new request sheet that has a masterId (i.e. a
  // re-order for a known stock master), create an ORDER ledger row so the
  // master's history shows the requested quantity and when the order was placed.
  // New parts (no masterId yet) will get their first ledger entry when the
  // master is configured via Tool Room approval.
  const ledgerHooks = (spare.changeParts ?? [])
    .filter((p) => p?.masterId)
    .map(
      (part) =>
        appendLedgerEntry({
          masterId: part.masterId,
          entryType: "ORDER",
          processingDate: new Date(),
          orderQty: part?.quantityRequired ?? null,
          orderNo: null,
          referenceId: spare._id,
          referenceModel: "RequestSheetOfSpare",
          createdBy: req.rootUser,
        }).catch(() => {}), // Non-critical: a ledger failure must not abort the sheet save
    );
  await Promise.allSettled(ledgerHooks);
  // ──────────────────────────────────────────────────────────────────────

  // A new sheet may already be with its first approver (or with MTD HOD for an
  // NG budget); they are told by mail. Not awaited: the mail is a courtesy.
  notifyApprovalChange({ before: null, after: spare, actor: req.rootUser });

  return res.status(201).json({
    message,
    showToast: true,
    spare,
  });
});

exports.findSpareSheetBasedOnId = tryCatchHandler(async (req, res, next) => {
  if (!req.query?._id)
    return res.status(400).json({
      message: "Please provide the required details",
    });

  const spare = await RequestSheetOfSpare.findOne(req.query);

  if (!spare)
    return res.status(400).json({
      message: "No spare sheet to found",
      showToast: true,
    });

  req.spare = spare;
  return next();
});

exports.getSpareRequestSheetBasedOnId = tryCatchHandler(
  async (req, res, next) => {
    return res.status(201).json({
      message: "Spare request sheet data get successfully",
      spare: req.spare,
    });
  },
);

exports.updateSpareRequestSheet = tryCatchHandler(async (req, res, next) => {
  if (!req.body?.data)
    return res.status(400).json({
      message: "Please provide required details",
      showToast: true,
    });

  let spare = req.spare,
    data = JSON.parse(req.body?.data);

  // The sheet as it stood, for deciding afterwards whom the save affects: who
  // it moved on to, or whose request was rejected.
  const previousSpare = req.spare;

  // Checked when the requester saves the parts. An approval decision is not a
  // part edit, so it is not held up by figures the approver cannot change.
  if (data?.changeParts && !data?.isApproved) {
    const minMaxMessage = minMaxViolationMessage({
      changeParts: data.changeParts,
      newPartFor: data?.newPartFor ?? spare?.newPartFor,
    });
    if (minMaxMessage)
      return res.status(400).json({ message: minMaxMessage, showToast: true });
  }

  if (data?.isApproved) {
    let key = spare?.dynamicApprovalKeys?.[0];

    if (!spare?.[key]?.user)
      return res.status(400).json({
        message: "Fist you need to send for approval",
        showToast: true,
      });

    if (spare?.[key]?.user?._id?.toString() !== req.rootUser?._id?.toString())
      return res.status(400).json({
        message: "You are not authorized to approve this spare sheet",
        showToast: true,
      });

    let approvalStatus = "Accepted",
      approvalDateAndTime = moment().format("D/M/YYYY - h:mm a");

    if (data?.isApproved === "No") approvalStatus = "Rejected";
    else {
      if (key === "mtdHODApprovalIfBudgetIsNG")
        data["rsSubmittedTimeStamp"] = generateTimeStampWithBothFormat();
      else if (["approvalOfMTD_HOD", "approvalOfPRD_HOD"]?.includes(key))
        data["rsHODApprovalTimeStamp"] = generateTimeStampWithBothFormat();
      else if (key === "approvalOfTOOL_ROOM")
        data["rsToolroomApprovalTimeStamp"] = generateTimeStampWithBothFormat();
    }

    /**
     * The decision is recorded on the approver's own slot, so the sheet itself
     * shows who accepted, who rejected and who never got to see it. Slots are
     * never cleared: a rejection is final, and the chain as it stood is the
     * record. Written as an object when the client posted the slot, else as
     * child paths — never both ways for one slot, which MongoDB would refuse.
     */
    if (data?.[key]) {
      data[key].approvalStatus = approvalStatus;
      data[key].approvalDateAndTime = approvalDateAndTime;
      if (data?.isApproved === "No")
        data[key].rejectedRemarks = data?.rejectedRemarks;
    } else {
      data[`${key}.approvalStatus`] = approvalStatus;
      data[`${key}.approvalDateAndTime`] = approvalDateAndTime;
      if (data?.isApproved === "No")
        data[`${key}.rejectedRemarks`] = data?.rejectedRemarks;
    }

    const index = spare?.[`${key}ApprovalLogs`]?.length - 1;

    data[`${key}ApprovalLogs.${index}.approvalStatus`] = approvalStatus;
    data[`${key}ApprovalLogs.${index}.approvalDateAndTime`] =
      approvalDateAndTime;
    if (data?.isApproved === "No")
      data[`${key}ApprovalLogs.${index}.rejectedRemarks`] =
        data?.rejectedRemarks;

    if (data?.isApproved === "Yes") {
      spare?.dynamicApprovalKeys?.shift();
      data["dynamicApprovalKeys"] = spare?.dynamicApprovalKeys;

      if (key === "mtdHODApprovalIfBudgetIsNG") {
        data["pendingApprovalBy"] = null;
        data["requestSheetStatus"] = spareApprovalStatus?.[1];
      } else if (spare?.dynamicApprovalKeys?.[0]) {
        data["pendingApprovalBy"] =
          spare?.[spare?.dynamicApprovalKeys?.[0]]?.user?._id;
        data["requestSheetStatus"] =
          dynamicApprovalStatus[
            spare?.dynamicApprovalKeys?.[0]?.split("Of")?.[1]
          ];
      } else {
        data["pendingApprovalBy"] = null;
        data["requestSheetStatus"] =
          spareApprovalStatus[spareApprovalStatus?.length - 1];
      }
    } else {
      /**
       * A rejection ends the sheet. Nothing further is pending, the remaining
       * chain is dropped, and isSpareSheetSendForApproval stays true so the
       * sheet is never offered for approval selection again. The approvers who
       * had already accepted keep their slots for the record; the ones who were
       * still to come never got a decision to make, so their slot and the
       * "Pending" log entry they were given when the sheet was sent are
       * cleared — otherwise the logs would show them as pending for ever.
       */
      data["pendingApprovalBy"] = null;
      data["requestSheetStatus"] = spareRejectedStatus;
      data["dynamicApprovalKeys"] = [];

      spare?.dynamicApprovalKeys?.slice(1).forEach((laterKey) => {
        data[laterKey] = null;
        data[`${laterKey}ApprovalLogs`] = (
          spare?.[`${laterKey}ApprovalLogs`] ?? []
        )
          .map((entry) => entry?.toObject?.() ?? entry)
          .filter((entry) => entry?.approvalStatus !== "Pending");
      });
    }
  }

  data = await handleSetUploadedFileName({
    data,
    uploadFileIndexesStr: req.body?.uploadFileIndexes,
    filesInfo: req.files?.drawingAttach,
    multiple: true,
  });

  data = await handleSetUploadedFileName({
    data,
    uploadFileIndexesStr: req.body?.uploadAdditionalFileIndexes,
    filesInfo: req.files?.additionalAttachments,
    fieldName: "additionalAttachments",
    multiple: true,
  });

  const handleRemoveFile = (propFileName) =>
    fs.unlink(
      path.join(__dirname, `../../spareDocuments/${propFileName}`),
      function (err) {
        if (err) return console.error(err);
      },
    );

  /**
   * Files the requester deleted from the form, named directly.
   *
   * Replaces two lists of change-part ids that meant "drop everything attached
   * to this part": with several drawings and several additional files per part,
   * removing one has to be able to leave the rest alone. The stored arrays are
   * pruned by the changeParts the client sends back, so all that is left to do
   * here is delete the files themselves.
   *
   * Only files this sheet actually holds are unlinked, so a crafted request
   * cannot reach anything else in the documents folder. A drawing the part's
   * master also holds stays on disk: dropping it from the sheet does not drop
   * it from the master, and the master's link must keep working.
   */
  if (req.body?.removedAttachmentFiles) {
    const removedAttachmentFiles = new Set(
      JSON.parse(req.body.removedAttachmentFiles),
    );

    const ownedFileNames = new Set();

    (spare?.changeParts ?? []).forEach((part) => {
      [...(part?.drawingAttach ?? []), ...(part?.additionalAttachments ?? [])]
        .map((file) => file?.filename)
        .filter(Boolean)
        .forEach((filename) => ownedFileNames.add(filename));
    });

    for (const filename of removedAttachmentFiles) {
      if (ownedFileNames.has(filename))
        await removeDrawingFileIfUnreferenced(filename, {
          except: { sheetId: spare._id },
        });
    }
  }

  // A PRD sheet has no budget to change: ignore any the client sends.
  if (!isBudgetChecked(spare?.partRequestFor)) delete data["budget"];

  const { budget } = data;
  if (budget?.budgetStatus === "NG" && spare?.budget?.budgetStatus === "OK") {
    let returnData = await handleSetNGBudgetData({
      data,
      documentByRequestGenerator: req.files?.documentByRequestGenerator,
      existingSpare: spare,
    });
    if (returnData?.isError)
      return res.status(400).json({
        message: returnData?.message,
        showToast: true,
      });

    data = returnData;
  } else if (
    budget?.budgetStatus === "OK" &&
    spare?.budget?.budgetStatus === "NG"
  ) {
    handleRemoveFile(spare?.ifBudgetIsNG?.documentByRequestGenerator?.filename);
    data.ifBudgetIsNG = null;
    data.mtdHODApprovalIfBudgetIsNG = null;
    data.requestSheetStatus = spareApprovalStatus?.[1];
  }

  let returnData = await handleSetSpareSheetDynamicApproval({
    plant_id: req?.rootUser?.plant_data?.split("-")?.[0],
    data,
    existingSpare: spare,
    dynamicApprovalSelectionKey: data?.partRequestFor ?? spare?.partRequestFor,
  });

  if (returnData?.isError)
    return res.status(400).json({
      message: returnData?.message,
      showToast: true,
    });

  data = returnData;

  spare = await RequestSheetOfSpare.findOneAndUpdate(req.query, data, {
    new: true,
  });

  // Newly attached drawings reach the parts' masters; see registration.
  await syncSheetDrawingsToMasters(spare);

  // Next approver in the chain, or the requester on a rejection.
  notifyApprovalChange({
    before: previousSpare,
    after: spare,
    actor: req.rootUser,
    rejectedRemarks: data?.rejectedRemarks,
  });

  return res.status(201).json({
    message: "Spare sheet updated successfully",
    showToast: true,
    spare,
  });
});

exports.getRequestSheets = tryCatchHandler(async (req, res, next) => {
  return res.status(201).json({
    message: "Request-sheets get successfully",
    tableData: req.tableData,
  });
});

exports.getSpareSheetsSummery = tryCatchHandler(async (req, res, next) => {
  const counters = await RequestSheetOfSpare.aggregate([
    {
      $match: req.queryObj,
    },
    {
      $addFields: {
        statusCountRelatedToEachParts: {
          $reduce: {
            input: "$changeParts",
            initialValue: {
              urgentParts: 0,
              completedProcessParts: 0,
            },
            in: {
              completedProcessParts: {
                $add: [
                  "$$value.completedProcessParts",
                  {
                    $cond: [
                      {
                        $gt: ["$$this.rsMRNApprovedTimeStamp.inDate", null],
                      },
                      1,
                      0,
                    ],
                  },
                ],
              },
            },
          },
        },
        totalParts: { $size: "$changeParts" },
      },
    },
    {
      $group: {
        _id: null,
        totalParts: {
          $sum: "$totalParts",
        },
        completedProcessParts: {
          $sum: "$statusCountRelatedToEachParts.completedProcessParts",
        },
      },
    },
    {
      $project: {
        total: "$totalParts",
        closed: "$completedProcessParts",
        pending: { $subtract: ["$totalParts", "$completedProcessParts"] },
      },
    },
  ]);

  if (counters?.length <= 0)
    return res.status(400).json({
      message: "No spare sheet summery found",
    });

  return res.status(201).json({
    message: "Spare sheet summery get successfully",
    counters: counters[0],
  });
});

exports.deleteSparePartRequest = tryCatchHandler(async (req, res, next) => {
  const { _id, partId } = req.query;

  if (!_id || !partId)
    return res.status(400).json({
      message: "Please select spare sheet to delete",
      showToast: true,
    });

  await RequestSheetOfSpare.updateOne(
    { _id },
    {
      $pull: {
        changeParts: { _id: partId },
      },
    },
  );

  return res.status(201).json({
    message: "Spare sheet deleted successfully",
    showToast: true,
  });
});

exports.handelManualApprovalStatus = tryCatchHandler(async (req, res, next) => {
  let { _id, requestedField, partId, masterId, batchId } = req.query;

  if (!_id || !partId)
    return res.status(400).json({
      message: "Please select spare sheet to update",
      showToast: true,
    });

  if (!requestedField)
    return res.status(500).json({
      message: "Something went wrong!!!",
      showToast: true,
    });

  // return console.log(req.query, req.body, partFields.has(requestedField));

  const { cellId, maker } = req.query;

  let filterObj = {
      _id,
    },
    schemaKey = "changeParts.$[part].",
    partArrayFilter = {
      arrayFilters: [{ "part._id": partId }],
    },
    $set = {},
    isIndividualPartUpdate = partFields.has(requestedField);

  if (!isIndividualPartUpdate) {
    if (batchId) {
      filterObj = {
        "cell._id": cellId,
        changeParts: {
          $elemMatch: {
            batchId,
          },
        },
      };

      partArrayFilter = {
        arrayFilters: [{ "part.batchId": batchId }],
      };
    } else {
      $set[`${schemaKey}batchId`] = new mongoose.Types.ObjectId();

      if (req.body?.partIdsToUpdate?.length > 0) {
        filterObj = {
          "cell._id": cellId,
          changeParts: {
            $elemMatch: {
              _id: { $in: req.body?.partIdsToUpdate },
              maker,
            },
          },
        };

        partArrayFilter = {
          arrayFilters: [{ "part._id": { $in: req.body?.partIdsToUpdate } }],
        };
      }
    }
  }

  schemaKey = schemaKey + requestedField;

  if (req.body?.formValue?.[`${requestedField}TimeStamp`]?.inString)
    $set[`${schemaKey}TimeStamp`] = generateTimeStampWithBothFormat(
      req.body?.formValue?.[`${requestedField}TimeStamp`]?.inString,
    );
  else $set[`${schemaKey}TimeStamp`] = null;
  $set[`${schemaKey}Remarks`] = req.body?.formValue[`${requestedField}Remarks`];

  if (isIndividualPartUpdate) {
    const spareSheet = await RequestSheetOfSpare.findOneAndUpdate(
      filterObj,
      { $set },
      {
        ...partArrayFilter,
        new: true,
        // Change-parts are keyed by _id; matching on a "partId" field returned
        // nothing, which left quantityRequired undefined and the "more than
        // required" check below never firing.
        projection: {
          requestSheetNo: 1,
          changeParts: { $elemMatch: { _id: partId } },
        },
      },
    );

    if (requestedField === "rsPartReceive") {
      const part = spareSheet?.changeParts?.[0];
      const receivedNow = req.body?.formValue?.costDetails?.quantity * 1 || 0;
      const overRequired = (total) =>
        res.status(400).json({
          message: `You can't add more then required qty (required ${part?.quantityRequired ?? "?"}, would be ${total})`,
          showToast: true,
        });

      /**
       * A "For use" part has no master to carry a cost tranche — it is consumed
       * on the machine, not stocked — so its receipt is kept on the part
       * itself, accumulating quantity with the unit cost fixed by the first
       * receipt, exactly as the master tranche does for a stock-in part.
       */
      if (!masterId) {
        // Mongoose hands back the nested path as an empty object before any
        // receipt, so "existing" means a quantity has actually been recorded.
        const existing = part?.receivedDetails?.quantity
          ? part.receivedDetails
          : null;
        const quantity = (existing?.quantity || 0) + receivedNow;

        if (part?.quantityRequired < quantity) return overRequired(quantity);

        const costInINR = existing
          ? existing.costInINR || 0
          : req.body?.formValue?.costDetails?.costInINR * 1 || 0;

        await RequestSheetOfSpare.updateOne(
          { _id, "changeParts._id": partId },
          {
            $set: {
              "changeParts.$.receivedDetails": {
                quantity,
                currencyUnit: existing
                  ? existing.currencyUnit || "INR"
                  : req.body?.formValue?.costDetails?.currencyUnit || "INR",
                cost: existing
                  ? existing.cost || 0
                  : req.body?.formValue?.costDetails?.cost * 1 || 0,
                costInINR,
                balanceQty: (part?.quantityRequired ?? 0) - quantity,
                overAllCost: quantity * costInINR,
              },
            },
          },
        );
      } else {
        const existingCostDetails = await getCostDetailsBasedOnPartId({
          masterId,
          partId,
        });

        if (!existingCostDetails) {
          if (part?.quantityRequired < receivedNow)
            return overRequired(receivedNow);

          await SpareMaster.updateOne(
            { _id: masterId },
            {
              $push: {
                costDetails: {
                  partId,
                  quantity: receivedNow,
                  currencyUnit:
                    req.body?.formValue?.costDetails?.currencyUnit || "INR",
                  cost: req.body?.formValue?.costDetails?.cost || 0,
                  costInINR: req.body?.formValue?.costDetails?.costInINR || 0,
                  issuedQty: 0,
                  issuedCost: 0,
                  balanceQty: part?.quantityRequired - receivedNow,
                  availableQty: receivedNow,
                  overAllCost:
                    receivedNow *
                    (req.body?.formValue?.costDetails?.costInINR || 0),
                },
              },
            },
          );
        } else {
          const availableQty =
            (existingCostDetails?.availableQty || 0) + receivedNow;

          const quantity = (existingCostDetails?.quantity || 0) + receivedNow;

          if (part?.quantityRequired < quantity) return overRequired(quantity);

          await SpareMaster.updateOne(
            { _id: masterId, "costDetails.partId": partId },
            {
              $set: {
                "costDetails.$": {
                  partId,
                  quantity,
                  currencyUnit: existingCostDetails?.currencyUnit || "INR",
                  cost: existingCostDetails?.cost || 0,
                  costInINR: existingCostDetails?.costInINR || 0,
                  issuedQty: existingCostDetails?.issuedQty || 0,
                  issuedCost: existingCostDetails?.issuedCost || 0,
                  balanceQty: part?.quantityRequired - quantity,
                  availableQty,
                  overAllCost:
                    availableQty * (existingCostDetails?.costInINR || 0),
                },
              },
            },
          );
        }

        // ── Stock-Ledger: STOCK_IN entry ─────────────────────────────────
        // Only fire for stock-in parts (those with a masterId). "For use" parts
        // have no master and never enter the ledger via this route.
        const orderNo = part?.poNumber || spareSheet?.requestSheetNo || null;
        const receivedQty =
          receivedNow ?? (req.body?.formValue?.costDetails?.quantity * 1 || 0);

        await appendLedgerEntry({
          masterId,
          entryType: "STOCK_IN",
          processingDate: req.body?.formValue?.rsPartReceiveTimeStamp?.inDate
            ? new Date(req.body.formValue.rsPartReceiveTimeStamp.inDate)
            : new Date(),
          stockInQtyNew: receivedQty || null,
          orderNo: null,
          referenceId: spareSheet?._id ?? null,
          referenceModel: "RequestSheetOfSpare",
          createdBy: req.rootUser,
        }).catch(() => {});
      }
    }
  } else
    await RequestSheetOfSpare.updateMany(filterObj, { $set }, partArrayFilter);

  req.queryObj = {
    _id: mongoose.Types.ObjectId(_id),
    changeParts: {
      $elemMatch: {
        _id: mongoose.Types.ObjectId(partId),
      },
    },
  };
  if (!isIndividualPartUpdate) {
    if (batchId)
      req.queryObj = {
        "cell._id": mongoose.Types.ObjectId(cellId),
        changeParts: {
          $elemMatch: {
            batchId: mongoose.Types.ObjectId(batchId),
          },
        },
      };
    else if (req.body?.partIdsToUpdate?.length > 0)
      req.queryObj = {
        "cell._id": mongoose.Types.ObjectId(cellId),
        changeParts: {
          $elemMatch: {
            _id: {
              $in: req.body?.partIdsToUpdate?.map((item) =>
                mongoose.Types.ObjectId(item),
              ),
            },
            maker,
          },
        },
      };
  }

  req.isSpareSheetById = true;

  return next();
});

exports.manualApprovalStatusResponse = tryCatchHandler(
  async (req, res, next) => {
    return res.status(201).json({
      message: "Spare sheet updated successfully",
      spareParts: req.tableData,
    });
  },
);

/**
 * The PO number beside PO Made on the tracking dashboard. It is a plain field
 * on the part — no timestamp, no status, no Tool Room gate — so it has its own
 * light handlers rather than passing through handelManualApprovalStatus, which
 * is built around a stage's timestamp and remarks. Any logged-in user may read
 * or set it; the save then reuses the order-tracking projection so the edited
 * row comes back in the same shape the dashboard already refreshes with.
 */
exports.getPartPONumber = tryCatchHandler(async (req, res, next) => {
  const { _id, partId } = req.query;

  if (!_id || !partId)
    return res.status(400).json({
      message: "Please select spare sheet to update",
      showToast: true,
    });

  const [spare] = await RequestSheetOfSpare.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(_id),
        "changeParts._id": mongoose.Types.ObjectId(partId),
      },
    },
    {
      $addFields: {
        changePart: {
          $arrayElemAt: [
            {
              $filter: {
                input: "$changeParts",
                as: "part",
                cond: {
                  $eq: ["$$part._id", mongoose.Types.ObjectId(partId)],
                },
              },
            },
            0,
          ],
        },
      },
    },
    {
      $project: { _id: 0, poNumber: "$changePart.poNumber" },
    },
  ]);

  return res.status(200).json({ spare: spare ?? {} });
});

exports.handlePartPONumber = tryCatchHandler(async (req, res, next) => {
  const { _id, partId } = req.query;

  if (!_id || !partId)
    return res.status(400).json({
      message: "Please select spare sheet to update",
      showToast: true,
    });

  const poNumber = String(req.body?.formValue?.poNumber ?? "").trim();
  if (poNumber.length > 100)
    return res.status(400).json({
      message: "PO number is too long (maximum 100 characters)",
      showToast: true,
    });

  await RequestSheetOfSpare.updateOne(
    {
      _id: mongoose.Types.ObjectId(_id),
      "changeParts._id": mongoose.Types.ObjectId(partId),
    },
    { $set: { "changeParts.$.poNumber": poNumber } },
  );

  // Hand the updated row back through the dashboard projection, as the manual
  // approval save does, so the client refreshes that one row.
  req.queryObj = {
    _id: mongoose.Types.ObjectId(_id),
    changeParts: {
      $elemMatch: { _id: mongoose.Types.ObjectId(partId) },
    },
  };
  req.isSpareSheetById = true;
  return next();
});

// const handleGeneratePipeline = ({ _id, requestedField, partId }) => {
//   let $match = {
//       _id: mongoose.Types.ObjectId(_id),
//     },
//     otherPipeline = [],
//     $project = {
//       [`${requestedField}TimeStamp.inString`]: {
//         $dateToString: {
//           format: "%Y-%m-%dT%H:%M",
//           date: `$${requestedField}TimeStamp.inDate`,
//           timezone,
//         },
//       },
//       [`${requestedField}Remarks`]: 1,
//     };

//   if (partId) {
//     $match["changeParts._id"] = mongoose.Types.ObjectId(partId);

//     otherPipeline = [
//       {
//         $addFields: {
//           changePart: {
//             $arrayElemAt: [
//               {
//                 $filter: {
//                   input: "$changeParts",
//                   as: "part",
//                   cond: {
//                     $eq: ["$$part._id", mongoose.Types.ObjectId(partId)],
//                   },
//                 },
//               },
//               0,
//             ],
//           },
//         },
//       },
//     ];

//     $project = {
//       [`${requestedField}TimeStamp.inString`]: {
//         $dateToString: {
//           format: "%Y-%m-%dT%H:%M",
//           date: `$changePart.${requestedField}TimeStamp.inDate`,
//           timezone,
//         },
//       },
//       [`${requestedField}Remarks`]: `$changePart.${requestedField}Remarks`,
//     };
//   }

//   return [
//     {
//       $match,
//     },
//     ...otherPipeline,
//     {
//       $project,
//     },
//   ];
// };

exports.getManualApprovalStatus = tryCatchHandler(async (req, res, next) => {
  const { _id, partId, masterId, requestedField } = req.query;

  if (!_id || !partId)
    return res.status(400).json({
      message: "Please select spare sheet to update",
      showToast: true,
    });

  if (!requestedField)
    return res.status(500).json({
      message: "Something went wrong!!!",
      showToast: true,
    });

  let $project = {
    [`${requestedField}TimeStamp.inString`]: {
      $dateToString: {
        format: "%Y-%m-%dT%H:%M",
        date: `$changePart.${requestedField}TimeStamp.inDate`,
        timezone,
      },
    },
    [`${requestedField}Remarks`]: `$changePart.${requestedField}Remarks`,
  };

  if (requestedField === "rsPartReceive") {
    $project["changePart.quantityRequired"] = 1;
    $project["changePart.receivedDetails"] = 1;
  }

  let spare = await RequestSheetOfSpare.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(_id),
        "changeParts._id": mongoose.Types.ObjectId(partId),
      },
    },
    {
      $addFields: {
        changePart: {
          $arrayElemAt: [
            {
              $filter: {
                input: "$changeParts",
                as: "part",
                cond: {
                  $eq: ["$$part._id", mongoose.Types.ObjectId(partId)],
                },
              },
            },
            0,
          ],
        },
      },
    },
    {
      $project,
    },
  ]);

  if (!spare || spare?.length <= 0)
    return res.status(400).json({
      message: "No spare sheet data to display",
    });

  spare = spare?.[0];

  if (requestedField === "rsPartReceive") {
    // A stock-in part's receipts sit on its master; a "For use" part keeps them
    // on the part itself. Either way the popup shows what has come in so far.
    const costDetails = masterId
      ? await getCostDetailsBasedOnPartId({ masterId, partId })
      : spare?.changePart?.receivedDetails?.quantity
        ? spare.changePart.receivedDetails
        : null;
    if (!costDetails) spare["disableFieldAfterOneTimeConfiguration"] = false;
    else {
      spare["disableFieldAfterOneTimeConfiguration"] = true;
      spare["costDetails"] = costDetails;
    }
  }

  return res.status(201).json({
    message: "Data get successfully",
    spare,
  });
});

const handleDBUpdate = async () => {
  const p2Plants = await Plant.find({
    plant_id: "P2",
  });
  console.log("1", p2Plants?.length);

  const p2Sections = await Section.find({
    plant_names: { $in: p2Plants?.map((item) => item?._id) },
  });

  console.log("2", p2Sections?.length);

  const p2SubSections = await SubSection.find({
    section_names: { $in: p2Sections?.map((item) => item?._id) },
  });

  console.log("3", p2SubSections?.length);

  const p2Cells = await Cell.find({
    subSection_names: { $in: p2SubSections?.map((item) => item?._id) },
  });

  console.log("4", p2Cells?.length);

  const p2Lines = await Line.find({
    cell_names: { $in: p2Cells?.map((item) => item?._id) },
  });

  console.log("5", p2Lines?.length);

  const p2Machines = await Machine.find({
    line_names: { $in: p2Lines?.map((item) => item?._id) },
  });

  console.log("6", p2Machines?.length);

  const p2Users = await User.find({
    section_data: {
      $in: p2Sections?.map(
        ({ section_id, section_name }) => `${section_id}-${section_name}`,
      ),
    },
  });

  console.log("7", p2Users?.length);

  // await Plant.deleteMany({
  //   _id: p2Plants?.map((item) => item?._id),
  // });

  // await Section.deleteMany({
  //   _id: p2Sections?.map((item) => item?._id),
  // });

  // await SubSection.deleteMany({
  //   _id: p2SubSections?.map((item) => item?._id),
  // });
  // await Cell.deleteMany({
  //   _id: p2Cells?.map((item) => item?._id),
  // });
  // await Line.deleteMany({
  //   _id: p2Lines?.map((item) => item?._id),
  // });
  // await Machine.deleteMany({
  //   _id: p2Machines?.map((item) => item?._id),
  // });
  // await User.deleteMany({
  //   section_data: {
  //     $in: p2Sections?.map(
  //       ({ section_id, section_name }) => `${section_id}-${section_name}`,
  //     ),
  //   },
  // });

  console.log("P2 data deleted");
};

// First BACKUP the DATA...
// handleDBUpdate();
