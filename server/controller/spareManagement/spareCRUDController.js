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
const SpareMaster = require("../../model/spareMasterSchema");

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

    let requestSheetNoPrefix = "";

    if (
      lineDetails?.cell_names?.subSection_names?.section_names
        ?.dashboardLevel === "Yes"
    )
      requestSheetNoPrefix = `${(lineDetails?.cell_names?.subSection_names?.section_names?.section_name)
        .trim()
        .substring(0, 2)
        .toUpperCase()}`;
    else
      requestSheetNoPrefix = `${(lineDetails?.cell_names?.subSection_names?.subSection_name)
        .trim()
        .substring(0, 2)
        .toUpperCase()}`;

    const requestSheetNo =
      `${requestSheetNoPrefix}-${(lineDetails?.line_name).trim()}-${
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
    });
  }

  const incomingModelsSet = new Set(incomingModels);

  const existingMasters = await SpareMaster.find(
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
    });
  }

  const machine = await Machine.findOne(
    {
      _id: selectedMachine,
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

  data["plant"] = machine?.plant_names;
  data["section"] = machine?.section_names;
  data["subSection"] = machine?.subSection_names;
  data["cell"] = machine?.cell_names;
  data["line"] = machine?.line_names;
  data["machine"] = machine;

  let increaseCountOfRequestSheetInLine = await Line.findOneAndUpdate(
    { _id: machine?.line_names?._id },
    {
      $set: {
        requestSheetNoSpare: machine?.line_names?.requestSheetNoSpare
          ? machine?.line_names?.requestSheetNoSpare + 1
          : 1,
      },
    },
    { new: true },
  );

  let requestSheetNoPrefix = "";

  if (machine?.section_names?.dashboardLevel === "Yes")
    requestSheetNoPrefix = `${(machine?.section_names?.section_name)
      .trim()
      .substring(0, 2)
      .toUpperCase()}`;
  else
    requestSheetNoPrefix = `${(machine?.subSection_names?.subSection_name)
      .trim()
      .substring(0, 2)
      .toUpperCase()}`;

  data["requestSheetNo"] =
    `${requestSheetNoPrefix}-${(machine?.line_names?.line_name).trim()}-${
      moment().tz("Asia/Kolkata").month() + 1
    }-SPARE-${increaseCountOfRequestSheetInLine?.requestSheetNoSpare}`.trim();

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

  const { budget } = data;

  if (!budget?.budgetStatus || !budget?.requiredBudget)
    return res.status(400).json({
      message: "Please provide details",
      showToast: true,
    });

  if (budget?.requiredBudget <= 0)
    return res.status(400).json({
      message: "Required budget should be greater then zero",
      showToast: true,
    });

  if (budget?.budgetStatus === "NG") {
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
      // Rejected sheets carry their own status so the requester can see what
      // happened, but are otherwise identical to "Generated": the chain is
      // cleared and the sheet is theirs to edit and re-submit.
      data["pendingApprovalBy"] = null;
      data["requestSheetStatus"] = spareRejectedStatus;
      data["dynamicApprovalKeys"] = [];
      data["isSpareSheetSendForApproval"] = false;

      // Clear every approver slot, not only the ones after the rejection.
      // The requester re-picks the whole chain from the start, and a slot left
      // holding its previous user would render pre-filled, so the form would
      // never mark it dirty, never send it back, and the re-submit would fail
      // with "Please select all the approvals".
      // mtdHODApprovalIfBudgetIsNG is deliberately untouched: it is a separate
      // budget gate, not part of the approval chain being restarted.
      Object.values(hooksFormReferenceOfApproval).forEach(({ approvalKey }) => {
        data[approvalKey] = null;
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
   * cannot reach anything else in the documents folder.
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

    removedAttachmentFiles.forEach((filename) => {
      if (ownedFileNames.has(filename)) handleRemoveFile(filename);
    });
  }

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
        projection: {
          changeParts: { $elemMatch: { partId } },
        },
      },
    );

    if (requestedField === "rsPartReceive") {
      const existingCostDetails = await getCostDetailsBasedOnPartId({
        masterId,
        partId,
      });

      if (!existingCostDetails) {
        if (
          spareSheet?.changeParts?.[0]?.quantityRequired <
          req.body?.formValue?.costDetails?.quantity * 1
        )
          return res.status(400).json({
            message: "You can't add more then required qty",
            showToast: true,
          });

        await SpareMaster.updateOne(
          { _id: masterId },
          {
            $push: {
              costDetails: {
                partId,
                quantity: req.body?.formValue?.costDetails?.quantity * 1,
                currencyUnit:
                  req.body?.formValue?.costDetails?.currencyUnit || "INR",
                cost: req.body?.formValue?.costDetails?.cost || 0,
                costInINR: req.body?.formValue?.costDetails?.costInINR || 0,
                issuedQty: 0,
                issuedCost: 0,
                balanceQty:
                  spareSheet?.changeParts?.[0]?.quantityRequired -
                  req.body?.formValue?.costDetails?.quantity * 1,
                availableQty: req.body?.formValue?.costDetails?.quantity * 1,
                overAllCost:
                  req.body?.formValue?.costDetails?.quantity *
                  1 *
                  (req.body?.formValue?.costDetails?.costInINR || 0),
              },
            },
          },
        );
      } else {
        const availableQty =
          (existingCostDetails?.availableQty || 0) +
          (req.body?.formValue?.costDetails?.quantity * 1 || 0);

        const quantity =
          existingCostDetails?.quantity +
            req.body?.formValue?.costDetails?.quantity * 1 || 0;

        if (spareSheet?.changeParts?.[0]?.quantityRequired < quantity)
          return res.status(400).json({
            message: "You can't add more then required qty",
            showToast: true,
          });

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
                balanceQty:
                  spareSheet?.changeParts?.[0]?.quantityRequired - quantity,
                availableQty,
                overAllCost:
                  availableQty * (existingCostDetails?.costInINR || 0),
              },
            },
          },
        );
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

  if (requestedField === "rsPartReceive")
    $project["changePart.quantityRequired"] = 1;

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
    const costDetails = await getCostDetailsBasedOnPartId({ masterId, partId });
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
