const moment = require("moment-timezone");
const multer = require("multer");

const tryCatchHandler = require("../../errorHandler/tryCatchHandler");

const User = require("../../model/userSchema");
const Plant = require("../../model/plantSchema");
const Section = require("../../model/sectionSchema");
const SubSection = require("../../model/subSectionSchema");
const Cell = require("../../model/cellSchema");
const Line = require("../../model/lineSchema");
const Machine = require("../../model/machineSchema");

const RequestSheetOfSpare = require("../../model/requestSheetDataOfSpare");
const path = require("path");
console.log(path.join(__dirname, "../../AttachedFilesByAssignedUser"));

const storageForDataSheetsOfBD = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../../AttachedFilesByAssignedUser"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

exports.uploadDrawingAttach = multer({
  storage: storageForDataSheetsOfBD,
});

exports.registerNewSpareRequest = tryCatchHandler(async (req, res, next) => {
  let data = JSON.parse(req.body?.data);
  const uploadFileIndexes = JSON.parse(req.body?.uploadFileIndexes);

  const { selectedCell, selectedLine, selectedMachine, budget } = data;
  let message = "Spare sheet generated successfully";

  if (!selectedCell || !selectedLine || !selectedMachine)
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

  for (let i = 0; i < uploadFileIndexes?.length; i++) {
    data.changeParts[uploadFileIndexes[i]].drawingAttach =
      req.files?.[i]?.filename;
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
      status: "Pending",
    };

    message = "Spare sheet send for MTD HOD approval";
  }

  const spare = new RequestSheetOfSpare(data);
  await spare.save();

  return res.status(201).json({
    message,
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
