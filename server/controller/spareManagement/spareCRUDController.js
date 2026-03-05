const moment = require("moment-timezone");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const tryCatchHandler = require("../../errorHandler/tryCatchHandler");
const { spareApprovalStatus } = require("../../utils/spareManagementUtils");

const User = require("../../model/userSchema");
const Plant = require("../../model/plantSchema");
const Section = require("../../model/sectionSchema");
const SubSection = require("../../model/subSectionSchema");
const Cell = require("../../model/cellSchema");
const Line = require("../../model/lineSchema");
const Machine = require("../../model/machineSchema");
const RequestSheetOfSpare = require("../../model/requestSheetDataOfSpare");

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
      }
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
  }
);

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
    }
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

  const uploadFileIndexes = JSON.parse(req.body?.uploadFileIndexes);

  if (uploadFileIndexes?.length > 0) {
    for (let i = 0; i < uploadFileIndexes?.length; i++) {
      const { filename, originalname } = req.files?.drawingAttach?.[i];
      data.changeParts[uploadFileIndexes[i]].drawingAttach = filename;
      data.changeParts[uploadFileIndexes[i]].drawingAttachOriginalName =
        originalname;
    }
  }

  let increaseCountOfRequestSheetInLine = await Line.findOneAndUpdate(
    { _id: machine?.line_names?._id },
    {
      $set: {
        requestSheetNoSpare: machine?.line_names?.requestSheetNoSpare
          ? machine?.line_names?.requestSheetNoSpare + 1
          : 1,
      },
    },
    { new: true }
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

  const { budget } = data;

  if (!budget?.budgetStatus || !budget?.requiredBudget)
    return res.status(400).json({
      message: "Please provide details",
      showToast: true,
    });

  if (budget?.budgetStatus === "NG") {
    const { mtdHODApprovalIfBudgetIsNG } = data;
    if (!mtdHODApprovalIfBudgetIsNG?.user?._id)
      return res.status(400).json({
        message: "Please select MTD HOD",
        showToast: true,
      });

    const user = await User.findOne({
      _id: mtdHODApprovalIfBudgetIsNG?.user?._id,
    });

    if (!user)
      return res.status(400).json({
        message: "User does not exist",
        showToast: true,
      });

    data["mtdHODApprovalIfBudgetIsNG"] = {
      user,
      approvalStatus: "Pending",
    };
    data["requestSheetStatus"] = spareApprovalStatus?.[0];

    if (req.files?.documentByRequestGenerator?.[0])
      data["ifBudgetIsNG.documentByRequestGenerator"] =
        req.files?.documentByRequestGenerator?.[0];

    message = "Spare sheet send for MTD HOD approval";
  }

  data["requestSheetCreatedBy"] = req.rootUser;
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
  }
);

exports.updateSpareRequestSheet = tryCatchHandler(async (req, res, next) => {
  if (!req.body?.data)
    return res.status(400).json({
      message: "Please provide required details",
      showToast: true,
    });

  let spare = req.spare,
    data = JSON.parse(req.body?.data);

  if (data?.mtdApprovalIfNGBudget) {
    if (!spare?.mtdHODApprovalIfBudgetIsNG?.user)
      return res.status(400).json({
        message: "Fist you need to send for HOD approval",
        showToast: true,
      });

    if (
      spare?.mtdHODApprovalIfBudgetIsNG?.user?._id?.toString() !==
      req.rootUser?._id?.toString()
    )
      return res.status(400).json({
        message: "You are not authorized to approve this spare sheet",
        showToast: true,
      });

    let approvalStatus = "Accepted",
      approvalDateAndTime = new Date();

    if (data?.mtdApprovalIfNGBudget === "No") approvalStatus = "Rejected";

    if (data?.mtdHODApprovalIfBudgetIsNG) {
      data.mtdHODApprovalIfBudgetIsNG.approvalStatus = approvalStatus;
      data.mtdHODApprovalIfBudgetIsNG.approvalDateAndTime = approvalDateAndTime;
    } else {
      data["mtdHODApprovalIfBudgetIsNG.approvalStatus"] = approvalStatus;
      data["mtdHODApprovalIfBudgetIsNG.approvalDateAndTime"] =
        approvalDateAndTime;
    }
  }

  if (req.body?.uploadFileIndexes) {
    const uploadFileIndexes = JSON.parse(req.body?.uploadFileIndexes);
    for (let i = 0; i < uploadFileIndexes?.length; i++) {
      if (data?.changeParts[uploadFileIndexes[i]]) {
        const { filename, originalname } = req.files?.drawingAttach?.[i];
        data.changeParts[uploadFileIndexes[i]].drawingAttach = filename;
        data.changeParts[uploadFileIndexes[i]].drawingAttachOriginalName =
          originalname;
      }
    }
  }

  const handleRemoveFile = (propFileName) =>
    fs.unlink(
      path.join(__dirname, `../../spareDocuments/${propFileName}`),
      function (err) {
        if (err) return console.error(err);
      }
    );

  if (req.body?.removeFileIDs) {
    const removeFileIDs = JSON.parse(req.body?.removeFileIDs);
    for (let i = 0; i < removeFileIDs?.length; i++) {
      const drawingAttach = spare?.changeParts?.find(
        (item) => item?._id === removeFileIDs[i]
      );

      if (drawingAttach) handleRemoveFile(drawingAttach);
    }
  }

  const { budget } = data;
  if (budget?.budgetStatus === "NG" && spare?.budget?.budgetStatus === "OK") {
    const { mtdHODApprovalIfBudgetIsNG } = data;
    if (!mtdHODApprovalIfBudgetIsNG?.user?._id)
      return res.status(400).json({
        message: "Please select MTD HOD",
        showToast: true,
      });

    const user = await User.findOne({
      _id: mtdHODApprovalIfBudgetIsNG?.user?._id,
    });

    if (!user)
      return res.status(400).json({
        message: "User does not exist",
        showToast: true,
      });

    data["mtdHODApprovalIfBudgetIsNG"] = {
      user,
      approvalStatus: "Pending",
    };
    data["requestSheetStatus"] = spareApprovalStatus?.[0];

    if (req.files?.documentByRequestGenerator?.[0]) {
      if (data?.ifBudgetIsNG)
        data.ifBudgetIsNG.documentByRequestGenerator =
          req.files?.documentByRequestGenerator?.[0];
      else
        data["ifBudgetIsNG.documentByRequestGenerator"] =
          req.files?.documentByRequestGenerator?.[0];
    }
  } else if (
    budget?.budgetStatus === "OK" &&
    spare?.budget?.budgetStatus === "NG"
  ) {
    handleRemoveFile(spare?.ifBudgetIsNG?.documentByRequestGenerator?.filename);
    data.ifBudgetIsNG = null;
    data.mtdHODApprovalIfBudgetIsNG = null;
    data.requestSheetStatus = spareApprovalStatus?.[1];
  }

  spare = await RequestSheetOfSpare.findOneAndUpdate(req.query, data, {
    new: true,
  });

  return res.status(201).json({
    message: "Spare sheet updated successfully",
    showToast: true,
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

  await Plant.deleteMany({
    _id: p2Plants?.map((item) => item?._id),
  });

  await Section.deleteMany({
    _id: p2Sections?.map((item) => item?._id),
  });

  await SubSection.deleteMany({
    _id: p2SubSections?.map((item) => item?._id),
  });
  await Cell.deleteMany({
    _id: p2Cells?.map((item) => item?._id),
  });
  await Line.deleteMany({
    _id: p2Lines?.map((item) => item?._id),
  });
  await Machine.deleteMany({
    _id: p2Machines?.map((item) => item?._id),
  });

  console.log("P2 data deleted");
};

// First BACKUP the DATA...
// handleDBUpdate();
