const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");
require("../db/conn");
const authenticate = require("../middleware/authenticate");
var cron = require("node-cron");

const User = require("../model/userSchema");
const Plant = require("../model/plantSchema");
const Section = require("../model/sectionSchema");
const SubSection = require("../model/subSectionSchema");
const Cell = require("../model/cellSchema");
const Line = require("../model/lineSchema");
const Machine = require("../model/machineSchema");
const LogHistory = require("../model/logHistorySchema");
const EmailConfigurations = require("../model/emailConfiguration");

const sendMail = require("../sendMail/sendMail");
const sendApprovalOfImplementation = require("../sendMail/sendApprovalOfImplementation");
const BackupMachineData = require("../model/backupMachine");
const HandlingOtherActions = require("../model/handlingActions");
const ApprovalOfSkipPM = require("../model/approvalSchemaOfSkipData");
// const MachineDummy = require('../model/machineOldSchema')
//send request for approval mail function
const sendApproval = require("../sendMail/sendApproval");
const autoSendMail = require("../sendMail/autoSendMail");
const sendApprovalOfSkippedPM = require("../sendMail/sendApprovalOfSkippedPM");
const sendMailForAnnualPmScheduleReport = require("../sendMail/sendMailForAnnualPmScheduleReport");
const filterMiddleware = require("../middleware/filterMiddleware");
const FinancialYear1 = require("../model/financialYearSchema");

const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const cookieParser = require("cookie-parser");
const { match } = require("assert");
const path = require("path");
const { parse } = require("path");
const { Console, log } = require("console");
router.use(cookieParser());
const truncValue = require("../utils/truncValue");
const moment = require("moment");
const logger = require("../utils/LoggingController/loggers");
const maintenanceType = require("../utils/maintenanceType");
const RequestSheetOfBM = require("../model/requestSheetDataOfBM");
const noLossBDData = require("../model/noLossBDSheetData");

//for profile image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // cb(null, pdfDestPath);
    cb(null, "./images/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  // var filetypes = /jpeg|jpg/;
  // var mimetype = filetypes.test(file.mimetype);
  // var extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  // if (mimetype && extname) {
  //     return cb(null, true);
  // }
  // cb("Error: File upload only supports the following filetypes - " + filetypes);
  const allowedFileTypes = ["image/jpeg", "image/jpg", "image/png"];
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // cb(null, false);
    // console.log(new Error())
    logger.error(new Error("Only .png, .jpg and .jpeg format allowed!"), {
      maintenanceType: maintenanceType?.[0],
    });
    return cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
  fileFilter: fileFilter,
});

//upload profile image
router.post("/updateUserProfile", upload.single("photo"), async (req, res) => {
  try {
    // console.log(req.photo)

    const tm_name = req.body.tm_name;
    const tm_no = req.body.tm_no;

    // console.log(tm_no);
    // console.log(tm_name);
    // console.log(req.file);

    if (req.file === undefined) {
      await User.updateOne({ tm_no: tm_no }, { $set: { tm_name: tm_name } });
    } else {
      const photo = req.file.filename;
      await User.updateOne(
        { tm_no: tm_no },
        { $set: { tm_name: tm_name, photo: photo } }
      );
    }

    res.status(200).send("User name updated");
  } catch (err) {
    logger.error(err, { maintenanceType: maintenanceType?.[0] });
    console.log("err");
    // res.status(400).send("error")
  }
});
//for PM images
const storage1 = multer.diskStorage({
  destination: function (req, file, cb) {
    // cb(null, pdfDestPath);
    cb(null, "./PMimages/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const upload1 = multer({
  storage: storage1,
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
  fileFilter: fileFilter,
});

//SignIN API
router.post("/signIn", async (req, res) => {
  try {
    let jwtToken;
    const { tm_no, password } = req.body;
    // console.log(tm_no, password)
    if (!tm_no || !password) {
      return res.status(422).json({ error: "plz fill all the details" });
    }
    const userLogin = await User.findOne({ tm_no: tm_no });
    if (userLogin) {
      // const IsUserOperator = await User.findOne({ tm_no: tm_no, user_type: "Operator" });
      // if (IsUserOperator) {
      //     const passwordMatch = await User.findOne({ tm_no: tm_no, operator_password: password });

      //     if (!passwordMatch) {
      //         res.status(400).json({ error: "Invalid password " })
      //     } else {
      //         res.json({ message: "user login successfully" })
      //     }
      // } else {
      //compare password
      const passwordMatch = await bcrypt.compare(password, userLogin.password);
      if (userLogin && passwordMatch) {
        //generate JWT token for authenticatigation
        jwtToken = await userLogin.generateAuthToken();
        // console.log(jwtToken);
        res.cookie("Token", jwtToken, {
          expires: new Date(Date.now() + 43200000),
          httpOnly: true,
        });
      }
      if (!passwordMatch) {
        res.status(400).json({ error: "Invalid password " });
      } else {
        res.json({
          message: "user login successfully",
          userLogin: {
            tm_no: userLogin?.tm_no,
            tm_name: userLogin?.tm_name,
            tm_department: userLogin?.tm_department,
            tm_grade: userLogin?.tm_grade,
            user_type: userLogin?.user_type,
          },
        });
      }
      // }
    } else {
      res.status(400).json({ error: "Invalid user " });
    }
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log("Credential not valid or received!!!");
    console.log(error);
  }
});

//reset password page ( enter email for validation )
router.post("/resetPass", (req, res) => {
  try {
    crypto.randomBytes(32, async (error, buffer) => {
      if (error) {
        console.log(error);
      }
      const token = buffer.toString("hex");
      const user = await User.findOne({ email: req.body?.email });
      // console.log(user);
      if (!user) {
        return res.status(422).send("User don't exists with that email");
      } else {
        try {
          user.token = token;
          user.expireToken = Date.now() + 300000;
          user.save().then((result) => {
            sendMail(user?.email, token);
          });
          res.status(201).json("Email send successful!!!");
        } catch (error) {
          logger.error(error, { maintenanceType: maintenanceType?.[0] });
          res.status(554).json("Email not send");
        }
      }
    });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log("Reset password token is not valid or received!!!");
  }
});

//new password generation
router.post("/newPassword", async (req, res) => {
  const newPassword = req.body.newPassword;
  const confirmPassword = req.body.confirmPassword;
  const reciveToken = req.body.token;
  try {
    //finding token in database for user confirmation
    User.findOne({
      expireToken: reciveToken,
      expireToken: { $gt: Date.now() },
    }).then((user) => {
      if (!user) {
        return res.status(422).send("Try again link expired !!!");
      } else {
        if (newPassword === confirmPassword) {
          user.password = newPassword;
          user.token = undefined;
          user.expireToken = undefined;
          user.save().then((saveUser) => {
            res.send("Successfully");
          });
        } else {
          return res.status(422).send("Your password should not match !!!");
        }
      }
    });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log("Data not received !!!");
  }
});

//update the password
router.post("/updatePassword", authenticate, async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(422).json({ error: "plz fill all the details" });
    }
    const userData = req.rootUser;
    //console.log(userData.user_id);
    const userLogin = await User.findOne({ tm_no: userData.tm_no });
    //console.log(userLogin);

    if (userLogin) {
      const passwordMatch = await bcrypt.compare(
        oldPassword,
        userLogin.password
      );
      if (!passwordMatch) {
        res.status(400).json({ error: "Invalid password " });
      } else {
        if (newPassword === confirmPassword) {
          userLogin.password = newPassword;
          res.clearCookie("Token", { path: "/" });
          userLogin.save().then((saveUser) => {
            console.log("Successfully");
          });
        } else {
          return res.status(422).send("Your password is not match !!!");
        }
        res.json({ message: "user password update successfully" });
      }
    } else {
      res.status(400).json({ error: "Invalid user " });
    }
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log("New password data not received or bad request !!!");
  }
});

//API for create and save user
router.post("/newUser", async (req, res) => {
  try {
    const userExist = await User.findOne({ tm_no: req.body.tm_no });
    if (userExist) {
      return res.status(409).json({ error: "Employee number already exists" });
    }

    await User.create(req.body);

    res.status(201).json({ message: "Employee register successfully" });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log(error);
    console.log("Data not valid or received !!!");
  }
});

//update the user in User management table
router.post("/updateUser", async (req, res) => {
  try {
    const { tm_no, tm_name, email, address } = req.body;
    //console.log(user_type);

    // if (!tm_no || !tm_name || !user_type) {
    //     return res.status(422).send("plz fill all the details !!!");
    // }
    const updateUserData = await User.updateOne(
      { tm_no: tm_no },
      { $set: { tm_name: tm_name, email: email, address: address } }
    );
    res.status(201).json({ message: "Employee updated successfully" });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    res.status(409).json("user already exists!!!");
  }
});

//delete the user in User management table
router.post("/deleteUser", async (req, res) => {
  try {
    const { tm_no } = req.body;
    // console.log(emp_no);

    if (!tm_no) {
      return res.status(422).send("Employee number is not valid!!!");
    }
    const deleteUserData = await User.deleteOne({ tm_no: tm_no });

    if (deleteUserData) {
      return res.status(201).json("Employee deleted!!!");
    } else {
      return res.status(400).json("Employee not deleted!!!");
    }
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log(error);
    console.log("Data not valid or received !!!");
  }
});

//Get the data from database and show on User management table
router.get("/displayUser", authenticate, async (req, res) => {
  try {
    const usersInfo = await User.find({ user_type: "Plant-Admin" }).sort({
      _id: -1,
    });
    //req.usersInfo=usersInfo;
    // console.log(usersInfo)
    res.json(usersInfo);
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log("User data not send or get!!!");
  }
});

//userLogin
router.get("/loggedUserDetails", authenticate, async (req, res) => {
  try {
    // console.log(req.rootUser);
    res.send(req.rootUser);
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log("User data not send or get!!!");
  }
});

//API for create and save plant
router.post("/addNewPlant", authenticate, async (req, res) => {
  const { plant_name } = req.body;

  if (!plant_name) {
    return res.status(422).json({ error: "plz fill all the details" });
  }
  try {
    let total = await Plant.find().sort({ _id: -1 }).limit(1);
    var plant_id;
    var plantName = "P";
    if (total.length === 0) {
      plant_id = plantName + 1;
    } else {
      var splitPlantId = total[0].plant_id.substring(1);
      plant_id = plantName + (Number(splitPlantId) + 1);
    }

    const plant = new Plant({ plant_id, plant_name });
    await plant.save();

    res.status(201).json({ message: "Plant register successfully" });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log("Data not valid or received !!!");
  }
});

//Get the data from database and show on plant management table
router.get("/displayPlant/:plant_data", authenticate, async (req, res) => {
  try {
    let plantInfo;
    if (req?.params) {
      plantInfo = await Plant.findOne({
        plant_id: req?.params?.plant_data?.split("-")?.[0],
      }).sort({ _id: -1 });
    } else {
      plantInfo = await Plant.find({}).sort({ _id: -1 });
    }
    //req.plantInfo=plantInfo;
    res.json(plantInfo);
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log("Plant data not send or get!!!");
  }
});

//update the plant in plant management table
router.post("/updatePlant", authenticate, async (req, res) => {
  try {
    const { plant_id, plant_name, oldRow } = req.body;
    // console.log(plant_id, plant_name);

    // if (!plant_id || !plant_name || !user_type) {
    //     return res.status(422).send("plz fill all the details !!!");
    // }
    const updatePlantData = await Plant.updateOne(
      { plant_id: plant_id },
      { $set: { plant_name: plant_name } }
    );
    res.status(201).json({ message: "Plant updated successfully" });
    let plantIdLiteral = `${plant_id}-${oldRow.plant_name}`;
    const result = await User.updateMany(
      { plant_data: plantIdLiteral },
      { $set: { plant_data: `${plant_id}-${plant_name}` } }
    );
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    res.status(409).json("Plant already exists!!!");
  }
});

router.post("/deletePlant", authenticate, async (req, res) => {
  try {
    const { _id, plant_id } = req.body;
    // const plant_no = Object.values(plant_id);
    // console.log(plant_id);

    if (!plant_id) {
      return res.status(422).send("Plant number is not valid!!!");
    }

    // const result = await Section.find({ plant_names: _id })
    // console.log(result)
    const deleteUserData = await Plant.deleteOne({ plant_id: plant_id });

    if (deleteUserData) {
      // console.log("Plant deleted!!!")
      return res.status(201).json("Plant deleted!!!");
    } else {
      return res.status(400).json("Plant not deleted!!!");
    }
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log(error);
    console.log("Data not valid or received !!!");
  }
});

//API for create and save Section
router.post("/addNewSection", authenticate, async (req, res) => {
  try {
    const { section_name, plant_names, dashboardLevel } = req.body;
    // console.log(section_name)
    if (req.body.section_id) {
      const sectionExist = await Section.findOne({
        section_id: req.body.section_id,
      });
      if (sectionExist) {
        return res.status(409).json({ error: "Section number already exists" });
      }
    }
    let total = await Section.find().sort({ _id: -1 }).limit(1);
    var section_id;
    var sectionName = "S";
    if (total.length === 0) {
      section_id = sectionName + 1;
    } else {
      var splitSectionId = total[0].section_id.substring(1);
      section_id = sectionName + (Number(splitSectionId) + 1);
    }
    let plantSplit = plant_names.split("-");
    const plantInfo = await Plant.find({ plant_id: plantSplit[0] });

    // console.log(plantInfo[0]._id)
    const newSection = new Section({
      section_id,
      section_name,
      plant_names: plantInfo[0]._id,
      dashboardLevel,
    });
    // console.log(newSection)

    await newSection.save();
    res.status(201).json({ message: "Section register successfully" });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log(error);
    console.log("Data not valid or received !!!");
  }
});

//update the plant in plant management table
router.post("/updateSection", authenticate, async (req, res) => {
  try {
    const { section_id, section_name, oldRow, updateRow } = req.body;
    // console.log(section_id, section_name);

    // if (!section_id || !section_name || !user_type) {
    //     return res.status(422).send("plz fill all the details !!!");
    // }
    await Section.updateOne(
      { section_id: section_id },
      {
        $set: {
          section_name: section_name,
          dashboardLevel: updateRow?.dashboardLevel,
        },
      }
    );
    res.status(201).json({ message: "Section updated successfully" });
    let sectionIdLiteral = `${section_id}-${oldRow.section_name}`;
    const result = await User.updateMany(
      { section_data: sectionIdLiteral },
      { $set: { section_data: `${section_id}-${section_name}` } }
    );
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    res.status(409).json("Section already exists!!!");
  }
});

router.post("/deleteSection", authenticate, async (req, res) => {
  try {
    const { _id, section_id } = req.body;
    // const plant_no = Object.values(section_id);
    // console.log(section_id);

    if (!section_id) {
      return res.status(422).send("Section number is not valid!!!");
    }

    // const result = await Section.find({ plant_names: _id })
    // console.log(result)
    const deleteSectionData = await Section.deleteOne({
      section_id: section_id,
    });

    if (deleteSectionData) {
      // console.log("Section deleted!!!")
      return res.status(201).json("Section deleted!!!");
    } else {
      return res.status(400).json("Section not deleted!!!");
    }
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log(error);
    console.log("Data not valid or received !!!");
  }
});

//Get the data from database and show on Section management table
router.get("/displaySection", authenticate, async (req, res) => {
  try {
    const plantInfo = await Section.find({}).sort({ _id: -1 });
    //req.plantInfo=plantInfo;
    res.json(plantInfo);
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log("Plant data not send or get!!!");
  }
});

//API for create and save SubSection
router.post("/addNewSubSection", authenticate, async (req, res) => {
  try {
    const { subSection_name, section_names, subSection_sequence } = req.body;
    // console.log(section_name)
    if (req.body.subSection_id) {
      const subSectionExist = await SubSection.findOne({
        subSection_id: req.body.subSection_id,
      });
      if (subSectionExist) {
        return res
          .status(409)
          .json({ error: "SubSection number already exists" });
      }
    }
    let total = await SubSection.find().sort({ _id: -1 }).limit(1);

    // console.log(total)
    var subSection_id;
    var subSectionName = "SS";
    if (total.length === 0) {
      subSection_id = subSectionName + 1;
    } else {
      var splitSubSectionId = total[0].subSection_id.substring(2);
      // console.log(splitSubSectionId)
      subSection_id = subSectionName + (Number(splitSubSectionId) + 1);
    }
    let sectionSplit = section_names.split("-");
    const sectionInfo = await Section.find({ section_id: sectionSplit[0] });

    const sequenceFind = await SubSection.find({
      subSection_sequence: subSection_sequence,
    });
    let newSubSection;
    if (sequenceFind) {
      const updateSequence = await SubSection.updateMany(
        {
          section_names: sectionInfo[0]._id,
          subSection_sequence: { $gte: subSection_sequence },
        },
        { $inc: { subSection_sequence: 1 } }
      );
      // console.log(updateSequence);
      newSubSection = new SubSection({
        subSection_id,
        subSection_name,
        section_names: sectionInfo[0]._id,
        subSection_sequence,
      });
    } else {
      newSubSection = new SubSection({
        subSection_id,
        subSection_name,
        section_names: sectionInfo[0]._id,
        subSection_sequence,
      });
    }
    // console.log(sectionInfo[0]._id)

    // console.log(newSubSection)

    await newSubSection.save();
    res.status(201).json({ message: "SubSection register successfully" });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log(error);
    console.log("Data not valid or received !!!");
  }
});

router.post("/updateSubSection", authenticate, async (req, res) => {
  try {
    const { subSection_id, subSection_name, subSection_sequence, oldRow } =
      req.body;
    // console.log(oldRow.section_names)

    const sequenceFind = await SubSection.find({
      section_names: oldRow.section_names,
      subSection_sequence: subSection_sequence,
    });
    if (sequenceFind) {
      if (oldRow.subSection_sequence < subSection_sequence) {
        const updateSequence = await SubSection.updateMany(
          {
            section_names: oldRow.section_names,
            subSection_sequence: {
              $gt: oldRow.subSection_sequence,
              $lte: subSection_sequence,
            },
          },
          { $inc: { subSection_sequence: -1 } }
        );
      } else {
        const updateSequence = await SubSection.updateMany(
          {
            section_names: oldRow.section_names,
            subSection_sequence: {
              $lt: oldRow.subSection_sequence,
              $gte: subSection_sequence,
            },
          },
          { $inc: { subSection_sequence: 1 } }
        );
      }
    }
    // if (!subSection_id || !subSection_name || !tm_group) {
    //     return res.status(422).send("plz fill all the details !!!");
    // }
    await SubSection.updateOne(
      { subSection_id: subSection_id },
      { $set: { subSection_name: subSection_name, subSection_sequence } }
    );
    res.status(201).json({ message: "SubSection updated successfully" });
    let subSectionIdLiteral = `${subSection_id}-${oldRow.subSection_name}`;
    // console.log(subSectionI  dLiteral)
    let newSubSectionIdLiteral = `${subSection_id}-${subSection_name}`;
    const result = await User.updateMany(
      { subSection_data: subSectionIdLiteral },
      { $set: { "subSection_data.$": newSubSectionIdLiteral } }
    );
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    res.status(409).json("SubSection already exists!!!");
    console.log(error);
  }
});

router.post("/deleteSubSection", authenticate, async (req, res) => {
  try {
    const { _id, subSection_id, deleteRow } = req.body;
    // const plant_no = Object.values(subSection_id);
    // console.log(subSection_id);

    if (!subSection_id) {
      return res.status(422).send("Section number is not valid!!!");
    }
    const sequenceFind = await SubSection.find({
      section_names: deleteRow.section_names,
      subSection_id: subSection_id,
      subSection_sequence: deleteRow.subSection_sequence,
    });
    let deleteSubSectionData;
    if (sequenceFind) {
      const updateSequence = await SubSection.updateMany(
        {
          section_names: deleteRow.section_names,
          subSection_sequence: { $gte: deleteRow.subSection_sequence },
        },
        { $inc: { subSection_sequence: -1 } }
      );
      // console.log(updateSequence);
      deleteSubSectionData = await SubSection.deleteOne({
        subSection_id: subSection_id,
      });
    } else {
      deleteSubSectionData = await SubSection.deleteOne({
        subSection_id: subSection_id,
      });
    }
    // const result = await Section.find({ plant_names: _id })
    // console.log(result)

    if (deleteSubSectionData) {
      // console.log("SubSection deleted!!!")
      return res.status(201).json("SubSection deleted!!!");
    } else {
      return res.status(400).json("SubSection not deleted!!!");
    }
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log(error);
    console.log("Data not valid or received !!!");
  }
});

router.post("/addNewCell", authenticate, async (req, res) => {
  try {
    const { cell_name, subSection, cell_sequence } = req.body;
    // console.log(section_name)
    if (req.body.cell_id) {
      const cellExist = await Cell.findOne({ cell_id: req.body.cell_id });
      if (cellExist) {
        return res.status(409).json({ error: "Cell number already exists" });
      }
    }
    let total = await Cell.find().sort({ _id: -1 }).limit(1);

    const findLoggedUserPlantData = await Plant.findOne({
      plant_id: req?.rootUser?.plant_data?.split("-")?.[0],
    });

    const findLoggedUserSectionData = await Section.findOne({
      section_id: req?.rootUser?.section_data?.split("-")?.[0],
    });
    // console.log(total)
    var cell_id;
    var cellName = "C";
    if (total.length === 0) {
      cell_id = cellName + 1;
    } else {
      var splitCellId = total[0].cell_id.substring(1);
      // console.log(splitCellId)
      cell_id = cellName + (Number(splitCellId) + 1);
    }
    let subSectionSplit = subSection.split("-");
    const subSectionInfo = await SubSection.find({
      subSection_id: subSectionSplit[0],
    });

    const sequenceFind = await Cell.find({ cell_sequence: cell_sequence });
    let newCell;
    if (sequenceFind) {
      const updateSequence = await Cell.updateMany(
        {
          subSection_names: subSectionInfo[0]._id,
          cell_sequence: { $gte: cell_sequence },
        },
        { $inc: { cell_sequence: 1 } }
      );
      // console.log(updateSequence);
      newCell = new Cell({
        cell_id,
        cell_name,
        subSection_names: subSectionInfo[0]._id,
        cell_sequence,
        plant_names: findLoggedUserPlantData?._id,
        section_names: findLoggedUserSectionData?._id,
      });
    } else {
      newCell = new Cell({
        cell_id,
        cell_name,
        subSection_names: subSectionInfo[0]._id,
        cell_sequence,
        plant_names: findLoggedUserPlantData?._id,
        section_names: findLoggedUserSectionData?._id,
      });
    }

    // console.log(subSectionInfo[0]._id)
    // console.log(newCell)

    await newCell.save();
    res.status(201).json({ message: "Cell register successfully" });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log(error);
    console.log("Data not valid or received !!!");
  }
});

router.post("/updateCell", authenticate, async (req, res) => {
  try {
    const { cell_id, cell_name, cell_sequence, oldRow } = req.body;
    // console.log(cell_id, cell_name);
    const sequenceFind = await Cell.find({
      subSection_names: oldRow.subSection_names,
      cell_sequence: cell_sequence,
    });
    if (sequenceFind) {
      if (oldRow.cell_sequence < cell_sequence) {
        const updateSequence = await Cell.updateMany(
          {
            subSection_names: oldRow.subSection_names,
            cell_sequence: { $gt: oldRow.cell_sequence, $lte: cell_sequence },
          },
          { $inc: { cell_sequence: -1 } }
        );
      } else {
        const updateSequence = await Cell.updateMany(
          {
            subSection_names: oldRow.subSection_names,
            cell_sequence: { $lt: oldRow.cell_sequence, $gte: cell_sequence },
          },
          { $inc: { cell_sequence: 1 } }
        );
      }
    }
    // if (!cell_id || !cell_name || !tm_group) {
    //     return res.status(422).send("plz fill all the details !!!");
    // }
    await Cell.updateOne(
      { cell_id: cell_id },
      { $set: { cell_name: cell_name, cell_sequence } }
    );
    res.status(201).json({ message: "Cell updated successfully" });
    let cellIdLiteral = `${cell_id}-${oldRow.cell_name}`;
    let newCellIdLiteral = `${cell_id}-${cell_name}`;
    const result = await User.updateMany(
      { cell_data: cellIdLiteral },
      { $set: { "cell_data.$": newCellIdLiteral } }
    );
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    res.status(409).json("Cell already exists!!!");
  }
});

router.post("/deleteCell", authenticate, async (req, res) => {
  try {
    const { _id, cell_id, deleteRow } = req.body;
    // const plant_no = Object.values(cell_id);
    // console.log(cell_id);

    if (!cell_id) {
      return res.status(422).send("Cell number is not valid!!!");
    }
    const sequenceFind = await Cell.find({
      cell_id: cell_id,
      subSection_names: deleteRow.subSection_names,
      cell_sequence: deleteRow.cell_sequence,
    });
    let deleteCellData;
    if (sequenceFind) {
      const updateSequence = await Cell.updateMany(
        {
          subSection_names: deleteRow.subSection_names,
          cell_sequence: { $gte: deleteRow.cell_sequence },
        },
        { $inc: { cell_sequence: -1 } }
      );
      // console.log(updateSequence);
      deleteCellData = await Cell.deleteOne({ cell_id: cell_id });
    } else {
      deleteCellData = await Cell.deleteOne({ cell_id: cell_id });
    }

    // const result = await Section.find({ plant_names: _id })
    // console.log(result)

    if (deleteCellData) {
      // console.log("SubSection deleted!!!")
      return res.status(201).json("Cell deleted!!!");
    } else {
      return res.status(400).json("Cell not deleted!!!");
    }
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log(error);
    console.log("Data not valid or received !!!");
  }
});

router.post("/addNewLine", authenticate, async (req, res) => {
  try {
    const { line_name, cell, line_sequence } = req.body;

    const commonVarForMonthlyApproval = {
      checkedByTL: undefined,

      assignHOS: undefined,
      approvedByHOS: "",

      assignHOD: undefined,
      approvedByHODIfDelay: "",
      remarksIfDelay: "",
    };

    let monthlyApprovalData = {
      Apr: commonVarForMonthlyApproval,

      May: commonVarForMonthlyApproval,

      June: commonVarForMonthlyApproval,

      July: commonVarForMonthlyApproval,

      Aug: commonVarForMonthlyApproval,

      Sep: commonVarForMonthlyApproval,

      Oct: commonVarForMonthlyApproval,

      Nov: commonVarForMonthlyApproval,

      Dec: commonVarForMonthlyApproval,

      Jan: commonVarForMonthlyApproval,

      Feb: commonVarForMonthlyApproval,

      Mar: commonVarForMonthlyApproval,
    };

    let currentYear =
      new Date().getMonth() < 3
        ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
        : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
    // console.log(cell)
    if (req.body.line_id) {
      const lineExist = await Line.findOne({ line_id: req.body.line_id });
      if (lineExist) {
        return res.status(409).json({ error: "Line number already exists" });
      }
    }
    let total = await Line.find().sort({ _id: -1 }).limit(1);

    // console.log(total)
    var line_id;
    var lineName = "L";
    if (total.length === 0) {
      line_id = lineName + 1;
    } else {
      var splitLineId = total[0].line_id.substring(1);
      // console.log(splitLineId)
      line_id = lineName + (Number(splitLineId) + 1);
    }
    let cellSplit = cell.split("-");
    const cellInfo = await Cell.find({ cell_id: cellSplit[0] });

    // console.log(cellInfo[0]._id)
    // console.log(cellInfo)

    const sequenceFind = await Line.find({ line_sequence: line_sequence });
    let newLine;
    if (sequenceFind) {
      const updateSequence = await Line.updateMany(
        { cell_names: cellInfo[0]._id, line_sequence: { $gte: line_sequence } },
        { $inc: { line_sequence: 1 } }
      );
      // console.log(updateSequence);
      newLine = new Line({
        line_id,
        line_name,
        plant_names: cellInfo[0]?.plant_names,
        section_names: cellInfo[0]?.section_names,
        subSection_names: cellInfo[0]?.subSection_names,
        cell_names: cellInfo[0]._id,
        line_sequence,
        annualPmScheduleApproval: {
          current_year: currentYear,
          monthlyApprovalData: monthlyApprovalData,
        },
      });
    } else {
      newLine = new Line({
        line_id,
        line_name,
        plant_names: cellInfo[0]?.plant_names,
        section_names: cellInfo[0]?.section_names,
        subSection_names: cellInfo[0]?.subSection_names,
        cell_names: cellInfo[0]._id,
        line_sequence,
        annualPmScheduleApproval: {
          current_year: currentYear,
          monthlyApprovalData: monthlyApprovalData,
        },
      });
    }

    // console.log(newLine)

    await newLine.save();
    res.status(201).json({ message: "Line register successfully" });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log(error);
    console.log("Data not valid or received !!!");
  }
});

router.post("/updateLine", authenticate, async (req, res) => {
  try {
    const { line_id, line_name, line_sequence, oldRow } = req.body;
    // console.log(line_id, line_name);
    const sequenceFind = await Line.find({
      cell_names: oldRow.cell_names,
      line_sequence: line_sequence,
    });
    if (sequenceFind) {
      if (oldRow.line_sequence < line_sequence) {
        const updateSequence = await Line.updateMany(
          {
            cell_names: oldRow.cell_names,
            line_sequence: { $gt: oldRow.line_sequence, $lte: line_sequence },
          },
          { $inc: { line_sequence: -1 } }
        );
      } else {
        const updateSequence = await Line.updateMany(
          {
            cell_names: oldRow.cell_names,
            line_sequence: { $lt: oldRow.line_sequence, $gte: line_sequence },
          },
          { $inc: { line_sequence: 1 } }
        );
      }
    }
    // if (!line_id || !line_name || !tm_group) {
    //     return res.status(422).send("plz fill all the details !!!");
    // }
    await Line.updateOne(
      { line_id: line_id },
      { $set: { line_name: line_name, line_sequence } }
    );
    res.status(201).json({ message: "Line updated successfully" });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    res.status(409).json("Line already exists!!!");
  }
});

router.post("/deleteLine", authenticate, async (req, res) => {
  try {
    const { _id, line_id, deleteRow } = req.body;
    // const plant_no = Object.values(line_id);
    // console.log(line_id);

    if (!line_id) {
      return res.status(422).send("Line number is not valid!!!");
    }
    const sequenceFind = await Line.find({
      line_id: line_id,
      cell_names: deleteRow.cell_names,
      line_sequence: deleteRow.line_sequence,
    });
    let deleteLineData;
    if (sequenceFind) {
      const updateSequence = await Line.updateMany(
        {
          cell_names: deleteRow.cell_names,
          line_sequence: { $gte: deleteRow.line_sequence },
        },
        { $inc: { line_sequence: -1 } }
      );
      // console.log(updateSequence);
      deleteLineData = await Line.deleteOne({ line_id: line_id });
    } else {
      deleteLineData = await Line.deleteOne({ line_id: line_id });
    }

    // const result = await Section.find({ plant_names: _id })
    // console.log(result)

    if (deleteLineData) {
      // console.log("SubSection deleted!!!")
      return res.status(201).json("Line deleted!!!");
    } else {
      return res.status(400).json("Line not deleted!!!");
    }
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log(error);
    console.log("Data not valid or received !!!");
  }
});

//clear all token of logged user
router.post("/clearTokens", async (req, res) => {
  try {
    const { tm_no } = req.body;
    // console.log(tm_no)
    if (!tm_no) {
      return res.status(422).json({ error: "Employee number not received" });
    } else {
      const result = await User.updateOne(
        { tm_no: tm_no },
        { $unset: { jwtTokens: "", moduleType: "" } }
      );
      // console.log(result);
      res.status(201).json({ message: "Removed token !!!" });
    }
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log("User id not received!!!");
  }
});

// logout functionality (clear the cookie from the browser)
router.get("/logout", (req, res) => {
  try {
    // console.log('Logout page ....');
    res.clearCookie("Token", { path: "/" });
    res.status(200).send("user Logout");
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log("Cookies or Credential not clear !!!");
  }
});

router.get("/checking", async (req, res) => {
  try {
    const result = await Section.findOne({
      "plant_names.plant_id": "P1",
    }).populate({ path: "", select: "" });
    // console.log(result);
    // console.log("*******************************************");
    // const xyz = await Section.deleteMany({_id:{$in:result.section_name}})
    // console.log(xyz)
    // const deleteChild  = await Section.deleteOne({plant_names._id})
    // res.json(WorkOrderNumbers);
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log(error);
    console.log("Work order number not found");
  }
});

//fetch all section head for showing or selecting in dropdown by common user
router.get("/fetchPlantList", authenticate, async (req, res) => {
  try {
    const plantLists = await Plant.find({});
    let plantArray = [];
    for (let i = 0; i < plantLists.length; i++) {
      plantArray.push(`${plantLists[i].plant_id}-${plantLists[i].plant_name}`);
    }
    // console.log(plantArray)
    res.json({ plantArray, plantLists });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log(error);
    console.log("User data not send or get!!!");
  }
});

router.post("/postPlantToGetSectionList", authenticate, async (req, res) => {
  try {
    let { plants } = req.body;
    // console.log(plants);
    let plantSplit = plants.split("-");
    const plantInfo = await Plant.find({ plant_id: plantSplit[0] });
    // console.log("____________", plantInfo[0]._id)
    const sectionsInfo = await Section.find({ plant_names: plantInfo[0]._id });
    // console.log("____________", sectionsInfo)

    let sectionArray = [];
    for (let i = 0; i < sectionsInfo.length; i++) {
      sectionArray.push(
        `${sectionsInfo[i].section_id}-${sectionsInfo[i].section_name}`
      );
    }

    // console.log(sectionArray)

    res.json({ sectionArray, sectionsInfo });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log(error);
    console.log("User id not received!!!");
  }
});

router.post(
  "/postSectionToGetSubSectionList",
  authenticate,
  async (req, res) => {
    try {
      let { section } = req.body;
      // console.log(section);
      let sectionSplit = section.split("-");
      const sectionInfo = await Section.findOne({
        section_id: sectionSplit[0],
      });
      // console.log("____________", sectionInfo?.dashboardLevel)

      // console.log(req.rootUser, "==========>", req.rootUser?.subSection_data)

      const subSectionsInfo = await SubSection.find({
        section_names: sectionInfo._id,
      }).sort({ subSection_sequence: 1 });
      // console.log("____________", subSectionsInfo)

      let subSectionArray = [];
      if (sectionInfo?.dashboardLevel === "No") {
        // console.log(req?.rootUser?.user_type)

        if (req?.rootUser?.user_type === "Plant-Admin") {
          for (let i = 0; i < subSectionsInfo.length; i++) {
            subSectionArray.push(
              `${subSectionsInfo[i].subSection_id}-${subSectionsInfo[i].subSection_name}`
            );
          }
        } else {
          subSectionArray = req.rootUser?.subSection_data;
        }
      } else {
        for (let i = 0; i < subSectionsInfo.length; i++) {
          subSectionArray.push(
            `${subSectionsInfo[i].subSection_id}-${subSectionsInfo[i].subSection_name}`
          );
        }
      }

      // console.log(subSectionArray)

      res.json({ subSectionArray, subSectionsInfo, sectionInfo });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("User id not received!!!");
    }
  }
);

router.post("/postSubSectionToGetCellList", authenticate, async (req, res) => {
  try {
    let { subSection } = req.body;
    // console.log(subSection);
    let subSectionSplit = subSection.split("-");
    // console.log(subSectionSplit);

    const subSectionInfo = await SubSection.find({
      subSection_id: subSectionSplit[0],
    });

    const cellInfo = await Cell.find({
      subSection_names: subSectionInfo[0]._id,
    }).sort({ cell_sequence: 1 });
    // console.log("____________", cellInfo)

    let cellArray = [];
    for (let i = 0; i < cellInfo.length; i++) {
      cellArray.push(`${cellInfo[i].cell_id}-${cellInfo[i].cell_name}`);
    }

    // console.log(cellArray)

    res.json({ cellArray, cellInfo });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log(error);
    console.log("User id not received!!!");
  }
});

router.post("/postCellToGetLineList", authenticate, async (req, res) => {
  try {
    let { cell } = req.body;
    // console.log(cell);
    let cellSplit = cell.split("-");
    const cellInfo = await Cell.find({ cell_id: cellSplit?.[0] });
    // console.log(cellInfo[0]._id)
    const LineInfo = await Line.find({ cell_names: cellInfo?.[0]?._id }).sort({
      line_sequence: 1,
    });
    // console.log("____________", LineInfo)

    let lineArray = [];
    for (let i = 0; i < LineInfo.length; i++) {
      lineArray.push(`${LineInfo[i].line_id}-${LineInfo[i].line_name}`);
    }

    // console.log(lineArray)

    res.json({ lineArray, lineInfo: LineInfo });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log(error);
    console.log("User id not received!!!");
  }
});

router.post("/postLineToGetMachineList", authenticate, async (req, res) => {
  try {
    let { line, selectedRequest, yearOfCheckSheet } = req.body;
    let lineSplit = line.split("-");
    const lineInfo = await Line.find({ line_id: lineSplit[0] });
    let machineInfoWithChecksheet;
    if (selectedRequest === "already_created") {
      //for checksheet preparation data copy to another checksheet
      machineInfoWithChecksheet = await Machine.aggregate([
        {
          $match: {
            line_names: lineInfo[0]._id,
            checkSheet_data: { $ne: undefined },
          },
        },
        // { $addFields: { checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] } } },
        {
          $unwind: "$checkSheet_data",
        },
        {
          $match: {
            "checkSheet_data.current_year": yearOfCheckSheet,
          },
        },
        {
          $match: {
            $and: [
              {
                "checkSheet_data.checkSheet": { $ne: undefined },
              },
              {
                "checkSheet_data.checkSheet": { $ne: [] },
              },
            ],
            // "checkSheet_data.checkSheet": { $ne: undefined }
          },
        },
        {
          $project: {
            machine_code: 1,
            machine_name: 1,
            machine_nickname: 1,
            machine_sequence: 1,
            installation_date: 1,
            maker_name: 1,
            maker_sr_no: 1,
            manufacturingDate: 1,
            isPM: 1,
            line_names: 1,
            checkSheet_data: 1,
          },
        },
      ]);
      // console.log(machineData)
      machineInfoWithChecksheet = await Machine.populate(
        machineInfoWithChecksheet,
        { path: "line_names", populate: { path: "cell_names", model: "Cells" } }
      );
    } else {
      machineInfoWithChecksheet = await BackupMachineData.find({
        line_names: lineInfo[0]._id,
      }).populate({
        path: "line_names",
        options: { sort: { machine_sequence: 1 } },
      });
    }

    const machineInfo = await Machine.find({
      line_names: lineInfo[0]._id,
    }).populate({
      path: "line_names",
      options: { sort: { machine_sequence: 1 } },
    });

    // const machineInfoWithChecksheet = await Machine.find({ line_names: lineInfo[0]._id, "checkSheet.inspection_parent_name": { $exists: true } }).populate({ path: 'line_names', options: { sort: { 'machine_sequence': 1 } } })
    // console.log(machineInfoWithChecksheet)
    let machineArray = [];
    for (let i = 0; i < machineInfo.length; i++) {
      machineArray.push(
        `${machineInfo[i].machine_code}-${machineInfo[i].machine_name}`
      );
    }

    // console.log(machineArray)

    res.json({ machineArray, machineInfo, machineInfoWithChecksheet });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log(error);
    console.log("User id not received!!!");
  }
});

//based on plant selection section list will display on section list dropdown in User Assign in plant user
router.post(
  "/postPlantToGetSectionListOfUserAssign",
  authenticate,
  async (req, res) => {
    try {
      let { plants } = req.body;
      // console.log(plants);
      let plantSplit = plants.split("-");
      const plantInfo = await Plant.find({ plant_id: plantSplit[0] });
      // console.log("____________", plantInfo[0]._id)
      const sectionsInfo = await Section.find({
        plant_names: plantInfo[0]._id,
      });
      // console.log("____________", sectionsInfo)

      let sectionArray = [];
      for (let i = 0; i < sectionsInfo.length; i++) {
        sectionArray.push(
          `${sectionsInfo[i].section_id}-${sectionsInfo[i].section_name}`
        );
      }

      // console.log(sectionArray)

      res.json({ sectionArray: sectionArray });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("User id not received!!!");
    }
  }
);

//based on section selection sub-section list will display on sub-section list dropdown in User Assign in plant user
router.post(
  "/postSectionToGetSubSectionListOfUserAssign",
  authenticate,
  async (req, res) => {
    try {
      let { section } = req.body;
      console.log(section);
      let sectionSplit = section.split("-");
      const sectionInfo = await Section.find({ section_id: sectionSplit[0] });
      // console.log("____________", sectionInfo[0]._id)
      const subSectionsInfo = await SubSection.find({
        section_names: sectionInfo[0]._id,
      });
      // console.log("____________", subSectionsInfo)

      let subSectionArray = [];
      for (let i = 0; i < subSectionsInfo.length; i++) {
        subSectionArray.push(
          `${subSectionsInfo[i].subSection_id}-${subSectionsInfo[i].section_name}`
        );
      }

      // console.log(subSectionArray)

      res.json({ subSectionArray: subSectionArray });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("User id not received!!!");
    }
  }
);

//based on sub-section selection cell list will display on cell list dropdown in User Assign in plant user
router.post(
  "/postSubSectionToGetCellListOfUserAssign",
  authenticate,
  async (req, res) => {
    try {
      let { subSection } = req.body;
      // console.log(subSection);
      let subSectionIdArray = [];
      subSection.map((subSectionId) => {
        let id = subSectionId.split("-");
        subSectionIdArray.push(id[0]);
      });
      // console.log(subSectionIdArray)
      // let subSectionSplit = subSection.split("-")
      const subSectionInfo = await SubSection.find({
        subSection_id: { $in: subSectionIdArray },
      });
      // console.log(subSectionInfo)
      let subSection_id = subSectionInfo.map((xyz) => xyz._id);
      // console.log(subSection_id)
      const cellInfo = await Cell.find({
        subSection_names: { $in: subSection_id },
      });
      // // console.log("____________", cellInfo)

      let cellArray = [];
      for (let i = 0; i < cellInfo.length; i++) {
        cellArray.push(`${cellInfo[i].cell_id}-${cellInfo[i].cell_name}`);
      }

      // // console.log(cellArray)

      res.json({ cellArray: cellArray });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("User id not received!!!");
    }
  }
);

//post new user in user management in plant & section user
router.post("/postUserAssign", async (req, res) => {
  try {
    const {
      tm_name,
      tm_no,
      isAuthorizedUserForUpdatingRequestSheetInAnyStatus,
      user_type,
      tm_grade,
      email,
      // operator_password,
      joining_date,
      plant_data,
      section_data,
      tm_department,
      subSection_data,
      cell_data,
      contact_no,
      address,
    } = req.body;

    // console.log(tm_name,
    //     tm_no,
    //     user_type,
    //     tm_grade,
    //     email,
    //     // operator_password,
    //     joining_date,
    //     plant_data,
    //     section_data,
    //     tm_department,
    //     subSection_data,
    //     cell_data,
    //     contact_no,
    //     address)

    const userExist = await User.findOne({ tm_no: req.body.tm_no });
    if (userExist) {
      return res.status(409).json({ error: "Employee number already exists" });
    }

    const addNewUser = new User({
      tm_name,
      tm_no,
      isAuthorizedUserForUpdatingRequestSheetInAnyStatus,
      user_type,
      tm_grade,
      email,
      password: process.env.COMMON_PASSWORD,
      joining_date,
      plant_data,
      section_data,
      tm_department,
      subSection_data,
      cell_data,
      contact_no,
      address,
    });

    const result = await addNewUser.save();
    // console.log(result)
    res.status(201).json({ message: "Employee register successfully" });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log(error);
    console.log("Data not valid or received !!!");
  }
});

//Get the data from database and show on User management table in plant user
router.get("/displayAssignUser", authenticate, async (req, res) => {
  try {
    let loggedUserData = req.rootUser;
    const usersInfo = await User.find({
      user_type: "Section-Admin",
      plant_data: loggedUserData.plant_data,
    }).sort({ _id: -1 });
    //req.usersInfo=usersInfo;
    res.json(usersInfo);
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log("User data not send or get!!!");
  }
});

//update the user in User management table in plant & section user
router.post("/updateAssignUser", authenticate, async (req, res) => {
  try {
    let {
      tm_no,
      tm_name,
      user_type,
      tm_grade,
      tm_department,
      email,
      operator_password,
      address,
      plant_data,
      section_data,
      subSection_data,
      cell_data,
      contact_no,
      joining_date,
      isAuthorizedUserForUpdatingRequestSheetInAnyStatus,
    } = req.body;

    // console.log(tm_no,
    //     tm_name,
    //     user_type,
    //     tm_grade,
    //     tm_department,
    //     email,
    //     operator_password,
    //     address,
    //     plant_data,
    //     section_data,
    //     subSection_data,
    //     cell_data,
    //     contact_no,
    //     joining_date)

    // console.log(req?.rootUser?.user_type)

    // if (req?.rootUser?.user_type === "Section-Admin") {
    //     await User.updateOne({ tm_no: tm_no }, {
    //         $set: {
    //             tm_name,
    //             tm_grade,
    //             user_type,
    //             tm_department,
    //             email,
    //             address,
    //             plant_data,
    //             section_data,
    //             subSection_data,
    //             cell_data,
    //             contact_no,
    //             joining_date
    //         }
    //     });
    // }

    if (tm_grade === "HOD") {
      subSection_data = "";
      // cell_data= "";

      await User.updateOne(
        { tm_no: tm_no },
        {
          $set: {
            tm_name,
            tm_grade,
            isAuthorizedUserForUpdatingRequestSheetInAnyStatus,
            tm_department,
            email,
            address,
            plant_data,
            section_data,
            subSection_data,
            contact_no,
            joining_date,
          },
        }
      );
    } else if (tm_grade === "HOS") {
      await User.updateOne(
        { tm_no: tm_no },
        {
          $set: {
            tm_name,
            tm_grade,
            isAuthorizedUserForUpdatingRequestSheetInAnyStatus,
            // tm_grade: user_type === "Section-Admin" ? "HOS" : "",
            user_type,
            tm_department,
            email,
            address,
            plant_data,
            section_data,
            subSection_data,
            cell_data,
            contact_no,
            joining_date,
          },
        }
      );
      // cell_data = "";
      // await User.updateOne({ tm_no: tm_no }, {
      //     $set: {
      //         tm_name,
      //         tm_grade,
      //         tm_department,
      //         email,
      //         address,
      //         plant_data,
      //         section_data,
      //         subSection_data,
      //         cell_data,
      //         contact_no,
      //         joining_date
      //     }
      // });
    } else if (user_type) {
      await User.updateOne(
        { tm_no: tm_no },
        {
          $set: {
            tm_name,
            tm_grade,
            isAuthorizedUserForUpdatingRequestSheetInAnyStatus,
            user_type,
            tm_department,
            email,
            address,
            plant_data,
            section_data,
            subSection_data,
            cell_data,
            contact_no,
            joining_date,
          },
        }
      );
    } else {
      await User.updateOne(
        { tm_no: tm_no },
        {
          $set: {
            tm_name,
            tm_grade,
            isAuthorizedUserForUpdatingRequestSheetInAnyStatus,
            tm_department,
            email,
            operator_password,
            address,
            plant_data,
            section_data,
            subSection_data,
            cell_data,
            contact_no,
            joining_date,
          },
        }
      );
    }
    res.status(201).json({ message: "Employee updated successfully" });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    res.status(409).json("user already exists!!!");
  }
});

//delete the user in User management table in plant & section user
router.post("/deleteAssignUser", async (req, res) => {
  try {
    const { tm_no } = req.body;

    if (!tm_no) {
      return res.status(422).send("Employee number is not valid!!!");
    }
    const deleteUserData = await User.deleteOne({ tm_no: tm_no });
    console.log(deleteUserData);
    if (deleteUserData) {
      return res.status(201).json("Employee deleted!!!");
    } else {
      return res.status(400).json("Employee not deleted!!!");
    }
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log(error);
    console.log("Data not valid or received !!!");
  }
});

//Get the data from database and show on User management table in section user
router.get("/displaySectionAssignUser", authenticate, async (req, res) => {
  try {
    let sectionId = req.rootUser.section_data;
    // let sectionSplitId = sectionId?.split("-")?.[0]
    // // console.log(sectionSplitId)

    // const sectionInfo = await Section.findOne({ section_id: sectionSplitId })
    // console.log(sectionInfo?.dashboardLevel)

    // let usersInfo
    // if (sectionInfo?.dashboardLevel === "Yes") {

    //     usersInfo = await User.find({ section_data: sectionId, tm_department: "MTD", user_type: { $in: ["TL/HOSS"] } }).sort({ _id: -1 });
    // } else {
    usersInfo = await User.find({
      section_data: sectionId,
      $or: [
        {
          tm_department: "PRD",
          tm_grade: "HOS",
          user_type: "Section-Admin",
        },
        {
          user_type: "TL/HOSS",
        },
        {
          user_type: "Operator",
        },
      ],
    }).sort({ _id: -1 });

    // }

    // console.log(req.rootUser, sectionId)
    //req.usersInfo=usersInfo;

    // console.log(usersInfo)
    res.json(usersInfo);
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log("User data not send or get!!!");
  }
});

router.get("/displayTLHOSSAssignUser", authenticate, async (req, res) => {
  try {
    let sectionId = req.rootUser.section_data;
    // let sectionSubID = sectionId?.split("-")

    // console.log(sectionSubID)
    // console.log(req.rootUser, sectionId)
    const usersInfo = await User.find({
      section_data: sectionId,
      $or: [
        {
          $and: [
            {
              user_type: "TL/HOSS",
            },
            {
              tm_department: "PRD",
            },
          ],
        },
        {
          user_type: "Operator",
        },
      ],
    }).sort({ _id: -1 });
    //req.usersInfo=usersInfo;

    // console.log(usersInfo)
    res.json(usersInfo);
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log("User data not send or get!!!");
  }
});

//post new machine in machine management in section admin
router.post("/addNewMachine", async (req, res) => {
  try {
    const {
      machine_code,
      machine_name,
      machine_nickname,
      isPM,
      machine_sequence,
      installation_date,
      manufacturingDate,
      maker_name,
      maker_sr_no,
      line,
    } = req.body;

    const machineExist = await Machine.findOne({ machine_code: machine_code });
    if (machineExist) {
      return res.status(409).json({ error: "Machine code already exists" });
    }
    let lineSplit = line.split("-");
    const lineInfo = await Line.find({ line_id: lineSplit[0] });
    // console.log(lineInfo[0])
    const sequenceFind = await Machine.find({
      machine_sequence: machine_sequence,
    });
    let newMachine;
    if (sequenceFind) {
      const updateSequence = await Machine.updateMany(
        {
          line_names: lineInfo[0]._id,
          machine_sequence: { $gte: machine_sequence },
        },
        { $inc: { machine_sequence: 1 } }
      );
      // console.log(updateSequence);
      newMachine = new Machine({
        machine_code,
        machine_name,
        isPM,
        machine_nickname,
        machine_sequence,
        installation_date,
        manufacturingDate,
        maker_name,
        maker_sr_no,
        plant_names: lineInfo[0]?.plant_names,
        section_names: lineInfo[0]?.section_names,
        subSection_names: lineInfo[0]?.subSection_names,
        cell_names: lineInfo[0]?.cell_names,
        line_names: lineInfo[0]._id,
      });
    } else {
      newMachine = new Machine({
        machine_code,
        machine_name,
        isPM,
        machine_nickname,
        machine_sequence,
        installation_date,
        manufacturingDate,
        maker_name,
        maker_sr_no,
        plant_names: lineInfo[0]?.plant_names,
        section_names: lineInfo[0]?.section_names,
        subSection_names: lineInfo[0]?.subSection_names,
        cell_names: lineInfo[0]?.cell_names,
        line_names: lineInfo[0]._id,
      });
    }

    await newMachine.save();

    res.status(201).json({ message: "Machine register successfully" });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log(error);
    console.log("Data not valid or received !!!");
  }
});

//delete machine based on machine_code
router.post("/deleteMachine", authenticate, async (req, res) => {
  try {
    const { _id, machine_code, deleteRow } = req.body;

    if (!machine_code) {
      return res.status(422).send("Machine code is not valid!!!");
    }
    const sequenceFind = await Machine.find({
      machine_code: machine_code,
      line_names: deleteRow.line_names,
      machine_sequence: deleteRow.machine_sequence,
    });
    let deleteMachineData;
    if (sequenceFind) {
      const updateSequence = await Machine.updateMany(
        {
          line_names: deleteRow.line_names,
          machine_sequence: { $gte: deleteRow.machine_sequence },
        },
        { $inc: { machine_sequence: -1 } }
      );
      // console.log(updateSequence);
      deleteMachineData = await Machine.deleteOne({ machine_code });
    } else {
      deleteMachineData = await Machine.deleteOne({ machine_code });
    }

    if (deleteMachineData) {
      return res.status(201).json("Machine deleted!!!");
    } else {
      return res.status(400).json("Machine not deleted!!!");
    }
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log(error);
    console.log("Data not valid or received !!!");
  }
});

//update machine based on machine-code
router.post("/updateMachine", authenticate, async (req, res) => {
  try {
    const {
      machine_code,
      machine_name,
      machine_nickname,
      machine_sequence,
      isPM,
      manufacturingDate,
      installation_date,
      maker_name,
      maker_sr_no,
      oldRow,
    } = req.body;
    // console.log(line_id, line_name);
    const sequenceFind = await Machine.find({
      line_names: oldRow.line_names,
      machine_sequence: machine_sequence,
    });
    if (sequenceFind) {
      if (oldRow.machine_sequence < machine_sequence) {
        const updateSequence = await Machine.updateMany(
          {
            line_names: oldRow.line_names,
            machine_sequence: {
              $gt: oldRow.machine_sequence,
              $lte: machine_sequence,
            },
          },
          { $inc: { machine_sequence: -1 } }
        );
      } else {
        const updateSequence = await Machine.updateMany(
          {
            line_names: oldRow.line_names,
            machine_sequence: {
              $lt: oldRow.machine_sequence,
              $gte: machine_sequence,
            },
          },
          { $inc: { machine_sequence: 1 } }
        );
      }
    }
    // if (!line_id || !line_name || !tm_group) {
    //     return res.status(422).send("plz fill all the details !!!");
    // }
    await Machine.updateOne(
      { machine_code: machine_code },
      {
        $set: {
          machine_name,
          machine_nickname,
          machine_sequence,
          isPM,
          installation_date,
          manufacturingDate,
          maker_name,
          maker_sr_no,
        },
      }
    );
    res.status(201).json({ message: "Machine updated successfully" });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    res.status(409).json("Machine already exists!!!");
  }
});

router.post("/postPlantToGetCellData", authenticate, async (req, res) => {
  try {
    let { plant } = req.body;

    const plantInfo = await Plant.findOne({ plant_id: plant?.split("-")?.[0] });

    const sectionInfo = await Section.find({ plant_names: plantInfo?._id });
    // console.log("____________", sectionInfo)
    let subSectionsData, cellData;

    subSectionsData = await SubSection.find({
      section_names: {
        $in: sectionInfo?.map((item) => item?._id),
      },
    }).sort({ subSection_sequence: 1 });

    cellData = await Cell.find({
      subSection_names: { $in: subSectionsData?.map((item) => item?._id) },
    }).sort({ cell_sequence: 1 });

    // console.log("---------------",cellData)

    res.json({ cellData });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log(error);
    console.log("User id not received!!!");
  }
});

router.post(
  "/postPlantToGetSectionDataBasedOnDashboardLevel",
  authenticate,
  async (req, res) => {
    try {
      let { plant } = req.body;

      const plantInfo = await Plant.findOne({
        plant_id: plant?.split("-")?.[0],
      });

      const sectionInfo = await Section.find({ plant_names: plantInfo?._id });

      // console.log("1761 -------->", sectionInfo)

      let subSectionsData,
        sectionDataArray = [];

      for (let i = 0; i < sectionInfo?.length; i++) {
        if (sectionInfo[i]?.dashboardLevel === "Yes") {
          sectionDataArray?.push(sectionInfo[i]);
        } else {
          // console.log("1771 -------->", sectionInfo[i])

          subSectionsData = await SubSection.find({
            section_names: sectionInfo[i]?._id,
          }).sort({ subSection_sequence: 1 });

          for (let j = 0; j < subSectionsData?.length; j++) {
            sectionDataArray?.push(
              new Object({
                _id: subSectionsData[j]?._id,
                section_name: subSectionsData[j]?.subSection_name,
                dashboardLevel: "No",
              })
            );
          }
        }
      }

      // console.log("---------------", sectionDataArray)

      res.json({ sectionDataArray });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("User id not received!!!");
    }
  }
);

router.post(
  "/postAssignSubSectionToGetAllDataOfSubSection",
  authenticate,
  async (req, res) => {
    try {
      let subSectionsData;

      // console.log("++++++++++", req?.rootUser?.subSection_data?.map((item) => item?.split("-")?.[0]))

      subSectionsData = await SubSection.find({
        subSection_id: {
          $in: req?.rootUser?.subSection_data?.map(
            (item) => item?.split("-")?.[0]
          ),
        },
      });

      // console.log("~~~~~~~~~~~~~~~~~~", subSectionsData)

      res.json({ subSectionsData });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("User id not received!!!");
    }
  }
);

// router.post('/postSectionToGetAllData12', authenticate, async (req, res) => {
//     try {
//         let { selectedYear } = req.body

//         let years = ['2022-2023', '2023-2024'];
//         const financialYearWiseMonthKeyArray = ['Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']

//         //for prd tl
//         const keyofimaplementation = {
//             status: 'implemetation_prd_tl_approval_status',
//             no: 'implementation_assign_PRD_TL_tm_no',
//             name: 'implementation_assign_PRD_TL_name',
//             email: 'implementation_assign_PRD_TL'
//         }

//         //for mtd tl
//         // const keyofimaplementation = {
//         //     status : 'implemetation_mtd_tl_approval_status',
//         //     no : 'implementation_assign_MTD_TL_tm_no',
//         //     name : 'implementation_assign_MTD_TL_name',
//         //     email: 'implementation_assign_MTD_TL'
//         // }

//         //for hos
//         // const keyofimaplementation = {
//         //     status : 'implemetation_mtd_hos_approval_status',
//         //     no : 'implementation_assign_MTD_HOS_tm_no',
//         //     name : 'implementation_assign_MTD_HOS_name',
//         //     email: 'implementation_assign_MTD_HOS'
//         // }

//         for (let i = 0; i < years.length; i++) {
//             for (let j = 0; j < financialYearWiseMonthKeyArray.length; j++) {
//                 let keyPrdTLstatus1 = `$checkSheet_data.${keyofimaplementation.status}.${financialYearWiseMonthKeyArray[j]}`
//                 let keyPrdTLstatus1no = `checkSheet_data.$[outer].${keyofimaplementation.no}.${financialYearWiseMonthKeyArray[j]}`

//                 machineDataOfImplementationApproval12 = await Machine.aggregate([
//                     {
//                         $unwind: "$checkSheet_data"
//                     },
//                     {
//                         $match: {
//                             "checkSheet_data.current_year": years[i]
//                         }
//                     },
//                     // { $addFields: { checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] } } },
//                     {
//                         $match: {

//                             $expr: { $eq: [{ $arrayElemAt: [keyPrdTLstatus1, -1] }, "Pending"] }

//                         }
//                     },
//                     {
//                         $project: {
//                             machine_code: 1,
//                             machine_name: 1,
//                             machine_nickname: 1,
//                             machine_sequence: 1,
//                             installation_date: 1,
//                             maker_name: 1,
//                             maker_sr_no: 1,
//                             manufacturingDate: 1,
//                             isPM: 1,
//                             line_names: 1,
//                             checkSheet_data: 1
//                         }
//                     },
//                 ])
//                 if (machineDataOfImplementationApproval12?.length > 0) {

//                     for (let k = 0; k < machineDataOfImplementationApproval12?.length; k++) {
//                         for (let l = 0; l < machineDataOfImplementationApproval12?.[k]?.checkSheet_data?.[keyofimaplementation?.status]?.[financialYearWiseMonthKeyArray?.[j]]?.length; l++) {
//                             let findTMNo = await User.findOne({
//                                 tm_name: machineDataOfImplementationApproval12?.[k]?.checkSheet_data?.[keyofimaplementation?.name]?.[financialYearWiseMonthKeyArray?.[j]]?.[l],
//                                 email: machineDataOfImplementationApproval12?.[k]?.checkSheet_data?.[keyofimaplementation?.email]?.[financialYearWiseMonthKeyArray?.[j]]?.[l]

//                             })
//                             // if(machineDataOfImplementationApproval12?.[k]?.checkSheet_data?.implementation_assign_PRD_TL_tm_no?.[financialYearWiseMonthKeyArray?.[j]]?.length > 0){
//                             const pushTmNo = await Machine.updateOne({
//                                 machine_code: machineDataOfImplementationApproval12?.[k]?.machine_code,

//                             },
//                                 {
//                                     $push: {
//                                         [keyPrdTLstatus1no]: findTMNo?.tm_no
//                                     }
//                                 },
//                                 {
//                                     arrayFilters: [{ 'outer.current_year': years[i] }],
//                                 }
//                             )
//                         }
//                     }
//                 }

//             }

//         }

//         //for add pending status in HOS ****************************************

//         machineDataOfImplementationApproval12 = await Machine.aggregate([
//             {
//                 $unwind: "$checkSheet_data"
//             },
//             {
//                 $match: {
//                     "checkSheet_data.current_year": selectedYear
//                 }
//             },
//             // { $addFields: { checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] } } },
//             {
//                 $match: {
//                     "checkSheet_data.implemetation_mtd_tl_approval_status.Apr": "Accepted",
//                     "checkSheet_data.implementation_approved_by_MTD_HOS": undefined,
//                 }
//             },
//             {
//                 $project: {
//                     machine_code: 1,
//                     machine_name: 1,
//                     machine_nickname: 1,
//                     machine_sequence: 1,
//                     installation_date: 1,
//                     maker_name: 1,
//                     maker_sr_no: 1,
//                     manufacturingDate: 1,
//                     isPM: 1,
//                     line_names: 1,
//                     checkSheet_data: 1
//                 }
//             },
//         ])

//         // console.log(machineDataOfImplementationApproval12)

//         for (let i = 0; i < machineDataOfImplementationApproval12?.length; i++) {
//             updated = await Machine.updateOne({
//                 machine_code: machineDataOfImplementationApproval12[i]?.machine_code
//             },
//                 {
//                     $push: {
//                         "checkSheet_data.$[outer].implemetation_mtd_hos_approval_status.Apr": "Pending"
//                     }
//                 },
//                 {
//                     arrayFilters: [{ 'outer.current_year': selectedYear }],
//                 }
//             )
//         }

//         //**************************************************************************************
//         console.log("Data updated .......... ")

//         // res.json({ pushTmNo })
//     } catch (error) {
//         console.log(error)
//         console.log("User id not received!!!");
//     }
// })

router.post("/postSectionToGetAllData", authenticate, async (req, res) => {
  try {
    let { section, selectedYear } = req.body;
    let loggedUserData = req.rootUser;
    console.log(section);

    let currentYear =
      new Date().getMonth() < 3
        ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
        : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
    let selectedYearOfCheckSheet =
      selectedYear === currentYear
        ? [
            {
              "checkSheet_data.current_year": selectedYear,
            },
            {
              checkSheet_data: [],
            },
            {
              checkSheet_data: undefined,
            },
          ]
        : [
            {
              "checkSheet_data.current_year": selectedYear,
            },
          ];

    // console.log(section);
    let sectionSplit = section.split("-");
    const sectionInfo = await Section.findOne({ section_id: sectionSplit[0] });
    // console.log("____________", sectionInfo[0]._id)
    let subSectionsData,
      subSectionIdArray = [],
      cellData,
      cellIdArray = [],
      lineData,
      lineIdArray = [],
      machineData,
      machineDataForChecksheet,
      machineDataOfPrepAndPlanApproval,
      subsectionSplitIdArrayForChecksheet = [],
      machineLastData;

    if (sectionInfo.dashboardLevel === "Yes") {
      subSectionsData = await SubSection.find({
        section_names: sectionInfo._id,
      }).sort({ subSection_sequence: 1 });

      for (let i = 0; i < subSectionsData.length; i++) {
        subSectionIdArray.push(subSectionsData[i]._id);
      }

      cellData = await Cell.find({
        subSection_names: { $in: subSectionIdArray },
      }).sort({ cell_sequence: 1 });

      for (let i = 0; i < cellData.length; i++) {
        cellIdArray.push(cellData[i]._id);
      }

      lineData = await Line.find({ cell_names: { $in: cellIdArray } }).sort({
        line_sequence: 1,
      });

      for (let i = 0; i < lineData.length; i++) {
        lineIdArray.push(lineData[i]._id);
      }

      machineDataOfImplementationApproval = await Machine.aggregate([
        {
          $match: {
            line_names: { $in: lineIdArray },
            isPM: "Yes",
          },
        },
        {
          $unwind: "$checkSheet_data",
        },
        {
          $match: {
            "checkSheet_data.current_year": selectedYear,
          },
        },
        // { $addFields: { checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] } } },
        {
          $match: {
            $and: [
              {
                "checkSheet_data.checksheet_status": "Implementation",
              },
              {
                "checkSheet_data.checksheet_status": { $ne: "" },
              },
            ],
          },
        },
        {
          $project: {
            machine_code: 1,
            machine_name: 1,
            machine_nickname: 1,
            machine_sequence: 1,
            installation_date: 1,
            maker_name: 1,
            maker_sr_no: 1,
            manufacturingDate: 1,
            isPM: 1,
            line_names: 1,
            checkSheet_data: 1,
          },
        },
      ]);
      // console.log(machineData)
      machineDataOfImplementationApproval = await Machine.populate(
        machineDataOfImplementationApproval,
        { path: "line_names", populate: { path: "cell_names", model: "Cells" } }
      );

      //machine data of preparation and planning approval
      machineDataOfPrepAndPlanApproval = await Machine.aggregate([
        {
          $match: {
            line_names: { $in: lineIdArray },
            isPM: "Yes",
          },
        },
        {
          $unwind: "$checkSheet_data",
        },
        {
          $match: {
            "checkSheet_data.current_year": selectedYear,
          },
        },
        // { $addFields: { checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] } } },
        {
          $match: {
            $and: [
              // {
              //     "checkSheet_data.checksheet_status": { $ne: "Implementation" }
              // },
              {
                "checkSheet_data.checksheet_status": { $ne: "" },
              },
              {
                "checkSheet_data.assign_TL": { $ne: [] },
              },
              {
                checkSheet_data: { $ne: undefined },
              },
            ],
          },
        },
        {
          $project: {
            machine_code: 1,
            machine_name: 1,
            machine_nickname: 1,
            machine_sequence: 1,
            installation_date: 1,
            maker_name: 1,
            maker_sr_no: 1,
            manufacturingDate: 1,
            isPM: 1,
            line_names: 1,
            checkSheet_data: 1,
          },
        },
      ]);
      // console.log(machineData)
      machineDataOfPrepAndPlanApproval = await Machine.populate(
        machineDataOfPrepAndPlanApproval,
        { path: "line_names", populate: { path: "cell_names", model: "Cells" } }
      );

      // console.log(selectedYear, typeof (selectedYear))
      // machineDataForChecksheet = await Machine.find({ line_names: { $in: lineIdArray } }).populate({ path: "line_names", populate: { path: "cell_names", model: "Cells" } })
      machineLastData = await Machine.aggregate([
        {
          $match: {
            line_names: { $in: lineIdArray },
            isPM: "Yes",
          },
        },
        {
          $project: {
            machine_code: 1,
            machine_name: 1,
            machine_nickname: 1,
            machine_sequence: 1,
            installation_date: 1,
            maker_name: 1,
            maker_sr_no: 1,
            manufacturingDate: 1,
            isPM: 1,
            line_names: 1,
            // checkSheet_data: 1
            checkSheet_data: 1,
          },
        },
        {
          $unwind: {
            path: "$checkSheet_data",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            $or: selectedYearOfCheckSheet,

            // "checkSheet_data.current_year": selectedYear
          },
        },
      ]);

      machineLastData = await Machine.populate(machineLastData, {
        path: "line_names",
        populate: { path: "cell_names", model: "Cells" },
      });

      // console.log(machineLastData)
    } else {
      // console.log(loggedUserData.subSection_data)
      loggedUserData.subSection_data.map((ids) => {
        let subsectionsId = ids.split("-");
        subsectionSplitIdArrayForChecksheet.push(subsectionsId[0]);
      });
      subSectionsData = await SubSection.find({
        subSection_id: { $in: subsectionSplitIdArrayForChecksheet },
      }).sort({ subSection_sequence: 1 });

      for (let i = 0; i < subSectionsData.length; i++) {
        subSectionIdArray.push(subSectionsData[i]._id);
      }

      cellData = await Cell.find({
        subSection_names: { $in: subSectionIdArray },
      }).sort({ cell_sequence: 1 });

      for (let i = 0; i < cellData.length; i++) {
        cellIdArray.push(cellData[i]._id);
      }

      lineData = await Line.find({ cell_names: { $in: cellIdArray } }).sort({
        line_sequence: 1,
      });

      for (let i = 0; i < lineData.length; i++) {
        lineIdArray.push(lineData[i]._id);
      }

      //machine data of preparation and planning approval
      machineDataOfPrepAndPlanApproval = await Machine.aggregate([
        {
          $match: {
            line_names: { $in: lineIdArray },
            isPM: "Yes",
          },
        },
        {
          $unwind: "$checkSheet_data",
        },
        {
          $match: {
            "checkSheet_data.current_year": selectedYear,
          },
        },
        // { $addFields: { checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] } } },
        {
          $match: {
            $and: [
              // {
              //     "checkSheet_data.checksheet_status": { $ne: "Implementation" }
              // },
              {
                "checkSheet_data.checksheet_status": { $ne: "" },
              },
              {
                "checkSheet_data.assign_TL": { $ne: [] },
              },
              {
                checkSheet_data: { $ne: undefined },
              },
            ],
          },
        },
        {
          $project: {
            machine_code: 1,
            machine_name: 1,
            machine_nickname: 1,
            machine_sequence: 1,
            installation_date: 1,
            maker_name: 1,
            maker_sr_no: 1,
            manufacturingDate: 1,
            isPM: 1,
            line_names: 1,
            checkSheet_data: 1,
          },
        },
      ]);
      // console.log(machineData)
      machineDataOfPrepAndPlanApproval = await Machine.populate(
        machineDataOfPrepAndPlanApproval,
        { path: "line_names", populate: { path: "cell_names", model: "Cells" } }
      );

      // machineData = await Machine.find({ line_names: { $in: lineIdArray }, checksheet_status: { $exists: true } }).populate({ path: "line_names", populate: { path: "cell_names", model: "Cells" } })
      machineDataOfImplementationApproval = await Machine.aggregate([
        {
          $match: {
            line_names: { $in: lineIdArray },
            isPM: "Yes",
          },
        },
        {
          $unwind: "$checkSheet_data",
        },
        {
          $match: {
            "checkSheet_data.current_year": selectedYear,
          },
        },
        // { $addFields: { checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] } } },
        {
          $match: {
            $and: [
              {
                "checkSheet_data.checksheet_status": "Implementation",
              },
              {
                "checkSheet_data.checksheet_status": { $ne: "" },
              },
            ],
          },
        },
        {
          $project: {
            machine_code: 1,
            machine_name: 1,
            machine_nickname: 1,
            machine_sequence: 1,
            installation_date: 1,
            maker_name: 1,
            maker_sr_no: 1,
            manufacturingDate: 1,
            isPM: 1,
            line_names: 1,
            checkSheet_data: 1,
          },
        },
      ]);
      // console.log(machineData)
      machineDataOfImplementationApproval = await Machine.populate(
        machineDataOfImplementationApproval,
        { path: "line_names", populate: { path: "cell_names", model: "Cells" } }
      );
      // machineDataForChecksheet = await Machine.find({ line_names: { $in: lineIdArray } }).populate({ path: "line_names", populate: { path: "cell_names", model: "Cells" } })

      machineLastData = await Machine.aggregate([
        {
          $match: {
            line_names: { $in: lineIdArray },
            // $or: selectedYearOfCheckSheet,
            isPM: "Yes",
          },
        },
        {
          $project: {
            machine_code: 1,
            machine_name: 1,
            machine_nickname: 1,
            machine_sequence: 1,
            installation_date: 1,
            maker_name: 1,
            maker_sr_no: 1,
            manufacturingDate: 1,
            isPM: 1,
            line_names: 1,
            checkSheet_data: 1,
          },
        },
        {
          $unwind: {
            path: "$checkSheet_data",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            $or: selectedYearOfCheckSheet,

            // "checkSheet_data.current_year": selectedYear
          },
        },
      ]);

      machineLastData = await Machine.populate(machineLastData, {
        path: "line_names",
        populate: { path: "cell_names", model: "Cells" },
      });
    }

    res.json({
      subSectionsData,
      subSectionIdArray,
      cellData,
      cellIdArray,
      lineData,
      lineIdArray,
      machineDataOfPrepAndPlanApproval,
      machineDataOfImplementationApproval,
      machineLastData,
    });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log(error);
    console.log("User id not received!!!");
  }
});

router.post(
  "/postSectionToGetPMSheetApprovalData/:dashboard",
  authenticate,
  async (req, res) => {
    try {
      let { section, selectedYear, selectedMonth } = req.body;
      let loggedUserData = req.rootUser;

      let subSectionsData,
        subSectionIdArray = [],
        cellData,
        cellIdArray = [],
        lineData,
        lineIdArray = [],
        approvalLogMiddleware = [],
        approvalLogOfPM,
        subsectionSplitIdArrayForChecksheet = [],
        acceptedAndTotalApprovalCount = [];

      let queryObjForPendingGroup = {};

      let sectionInfo =
        typeof section === "string"
          ? await Section.findOne({
              section_id: section.split("-")?.[0],
            })
          : section;

      if (sectionInfo.dashboardLevel === "Yes") {
        subSectionsData = await SubSection.find({
          section_names: sectionInfo._id,
        }).sort({ subSection_sequence: 1 });
      } else {
        if (loggedUserData?.tm_grade === "HOD") {
          subSectionsData = await SubSection.find({
            _id: section?._id,
          }).sort({ subSection_sequence: 1 });
        } else {
          loggedUserData.subSection_data.map((ids) => {
            let subsectionsId = ids.split("-");
            subsectionSplitIdArrayForChecksheet.push(subsectionsId[0]);
          });
          subSectionsData = await SubSection.find({
            subSection_id: { $in: subsectionSplitIdArrayForChecksheet },
          }).sort({ subSection_sequence: 1 });
        }
      }
      cellData = await Cell.find({
        subSection_names: { $in: subSectionsData?.map((item) => item?._id) },
      }).sort({ cell_sequence: 1 });

      lineData = await Line.find({
        cell_names: { $in: cellData?.map((item) => item?._id) },
      }).sort({ line_sequence: 1 });

      let queryObj = {};
      queryObj = {
        line_names: { $in: lineData?.map((item) => item?._id) },
      };
      if (req?.query?.lineId !== "undefined" && req?.query?.lineId) {
        queryObj = {
          line_names: mongoose.Types.ObjectId(req?.query?.lineId),
        };
      }
      if (
        req?.query?.machine_code !== "undefined" &&
        req?.query?.machine_code
      ) {
        queryObj = {
          ...queryObj,
          machine_code: req?.query?.machine_code,
        };
      }

      if (req?.params?.dashboard === "preparationAndPlanningPhaseApprovalLog") {
        approvalLogMiddleware = [
          {
            $match: {
              $and: [
                {
                  "checkSheet_data.checksheet_status": { $ne: "" },
                },
                {
                  "checkSheet_data.assign_TL": { $ne: [] },
                },
                {
                  checkSheet_data: { $ne: undefined },
                },
              ],
            },
          },
        ];
        acceptedAndTotalApprovalCount = [
          {
            $addFields: {
              userWithStatusInfo: [
                {
                  userType: "MTD TL/HOSS",
                  // userId: { $arrayElemAt: ["$approvalOfMTD_HOSS", -1] },
                  userName: {
                    $arrayElemAt: ["$checkSheet_data.assign_TL_name", -1],
                  },
                  status: {
                    $arrayElemAt: ["$checkSheet_data.tl_approval_status", -1],
                  },
                },
                {
                  userType: "MTD HOS",
                  // userId: { $arrayElemAt: ["$approvalOfMTD_HOS", -1] },
                  userName: {
                    $arrayElemAt: ["$checkSheet_data.assign_HOS_name", -1],
                  },
                  status: {
                    $arrayElemAt: ["$checkSheet_data.hos_approval_status", -1],
                  },
                },
                {
                  userType: "PRD TL",
                  // userId: { $arrayElemAt: ["$approvalOfPRD_TL", -1] },
                  userName: {
                    $arrayElemAt: ["$checkSheet_data.assign_PRD_TL_name", -1],
                  },
                  status: {
                    $arrayElemAt: [
                      "$checkSheet_data.prd_tl_approval_status",
                      -1,
                    ],
                  },
                },
              ],
            },
          },
        ];
      } else {
        approvalLogMiddleware = [
          {
            $match: {
              $and: [
                {
                  "checkSheet_data.checksheet_status": "Implementation",
                },
                {
                  "checkSheet_data.checksheet_status": { $ne: "" },
                },
              ],
            },
          },
        ];
        acceptedAndTotalApprovalCount = [
          {
            $addFields: {
              userWithStatusInfo: {
                $concatArrays: [
                  {
                    $map: {
                      input: {
                        $objectToArray:
                          "$checkSheet_data.implemetation_prd_tl_approval_status",
                      },
                      as: "prdStatusArray",
                      in: {
                        userType: "PRD TL/HOSS",
                        machine_code: "$machine_code",
                        userName: {
                          $arrayElemAt: [
                            {
                              $getField: {
                                field: "v",
                                input: {
                                  $arrayElemAt: [
                                    {
                                      $filter: {
                                        input: {
                                          $objectToArray:
                                            "$checkSheet_data.implementation_assign_PRD_TL_name",
                                        },
                                        as: "prdName",
                                        cond: {
                                          $eq: [
                                            "$$prdStatusArray.k",
                                            "$$prdName.k",
                                          ],
                                        },
                                      },
                                    },
                                    0,
                                  ],
                                },
                              },
                            },
                            -1,
                          ],
                        },
                        status: {
                          $arrayElemAt: ["$$prdStatusArray.v", -1],
                        },
                        month: "$$prdStatusArray.k",
                      },
                    },
                  },
                  {
                    $map: {
                      input: {
                        $objectToArray:
                          "$checkSheet_data.implemetation_mtd_tl_approval_status",
                      },
                      as: "mtdTlStatusArray",
                      in: {
                        userType: "MTD TL/HOSS",
                        machine_code: "$machine_code",
                        userName: {
                          $arrayElemAt: [
                            {
                              $getField: {
                                field: "v",
                                input: {
                                  $arrayElemAt: [
                                    {
                                      $filter: {
                                        input: {
                                          $objectToArray:
                                            "$checkSheet_data.implementation_assign_MTD_TL_name",
                                        },
                                        as: "mtdName",
                                        cond: {
                                          $eq: [
                                            "$$mtdTlStatusArray.k",
                                            "$$mtdName.k",
                                          ],
                                        },
                                      },
                                    },
                                    0,
                                  ],
                                },
                              },
                            },
                            -1,
                          ],
                        },
                        status: {
                          $arrayElemAt: ["$$mtdTlStatusArray.v", -1],
                        },
                        month: "$$mtdTlStatusArray.k",
                      },
                    },
                  },
                  {
                    $map: {
                      input: {
                        $objectToArray:
                          "$checkSheet_data.implemetation_mtd_hos_approval_status",
                      },
                      as: "mtdHosStatusArray",
                      in: {
                        userType: "MTD HOS",
                        machine_code: "$machine_code",
                        userName: {
                          $arrayElemAt: [
                            {
                              $getField: {
                                field: "v",
                                input: {
                                  $arrayElemAt: [
                                    {
                                      $filter: {
                                        input: {
                                          $objectToArray:
                                            "$checkSheet_data.implementation_assign_MTD_HOS_name",
                                        },
                                        as: "mtdHosName",
                                        cond: {
                                          $eq: [
                                            "$$mtdHosStatusArray.k",
                                            "$$mtdHosName.k",
                                          ],
                                        },
                                      },
                                    },
                                    0,
                                  ],
                                },
                              },
                            },
                            -1,
                          ],
                        },
                        status: {
                          $arrayElemAt: ["$$mtdHosStatusArray.v", -1],
                        },
                        month: "$$mtdHosStatusArray.k",
                      },
                    },
                  },
                ],
              },
            },
          },
        ];
        if (selectedMonth) {
          acceptedAndTotalApprovalCount = [
            {
              $addFields: {
                userWithStatusInfo: [
                  {
                    userType: "PRD TL/HOSS",
                    // userId: { $arrayElemAt: ["$approvalOfMTD_HOSS", -1] },
                    userName: {
                      $arrayElemAt: [
                        `$checkSheet_data.implementation_assign_PRD_TL_name.${selectedMonth}`,
                        -1,
                      ],
                    },
                    status: {
                      $arrayElemAt: [
                        `$checkSheet_data.implemetation_prd_tl_approval_status.${selectedMonth}`,
                        -1,
                      ],
                    },
                  },
                  {
                    userType: "MTD TL/HOSS",
                    // userId: { $arrayElemAt: ["$approvalOfMTD_HOS", -1] },
                    userName: {
                      $arrayElemAt: [
                        `$checkSheet_data.implementation_assign_MTD_TL_name.${selectedMonth}`,
                        -1,
                      ],
                    },
                    status: {
                      $arrayElemAt: [
                        `$checkSheet_data.implemetation_mtd_tl_approval_status.${selectedMonth}`,
                        -1,
                      ],
                    },
                  },
                  {
                    userType: "MTD HOS",
                    // userId: { $arrayElemAt: ["$approvalOfPRD_TL", -1] },
                    userName: {
                      $arrayElemAt: [
                        `$checkSheet_data.implementation_assign_MTD_HOS_name.${selectedMonth}`,
                        -1,
                      ],
                    },
                    status: {
                      $arrayElemAt: [
                        `$checkSheet_data.implemetation_mtd_hos_approval_status.${selectedMonth}`,
                        -1,
                      ],
                    },
                  },
                ],
              },
            },
          ];
        }
        if (req?.query?.pendingFilterValue === "true") {
          queryObjForPendingGroup = {
            approvalMonth: "$month",
          };
        }
      }
      let pendingFilterApplyOrNot = [];
      // if (req?.query?.pendingFilterValue === "true") {
      //   pendingFilterApplyOrNot = [
      //     ...acceptedAndTotalApprovalCount,
      //     {
      //       $unwind: "$userWithStatusInfo",
      //     },
      //     {
      //       $match: {
      //         "userWithStatusInfo.userName": { $nin: [undefined, null, ""] },
      //         "userWithStatusInfo.status": "Pending",
      //       },
      //     },
      //     {
      //       $group: {
      //         _id: {
      //           ...queryObjForPendingGroup,
      //           machine_code: "$machine_code",
      //         },
      //         machine_code: {
      //           $first: "$machine_code",
      //         },
      //         machine_name: {
      //           $first: "$machine_name",
      //         },
      //         line_names: {
      //           $first: "$line_names",
      //         },
      //         checkSheet_data: {
      //           $first: "$checkSheet_data",
      //         },
      //         userWithStatusInfo: {
      //           $first: "$userWithStatusInfo"
      //         }
      //       },
      //     },
      //   ];
      // }

      approvalLogOfPM = await Machine.aggregate([
        {
          $match: {
            ...queryObj,
          },
        },
        {
          $unwind: "$checkSheet_data",
        },
        {
          $match: {
            "checkSheet_data.current_year": selectedYear,
          },
        },
        ...approvalLogMiddleware,
        // ...pendingFilterApplyOrNot,
        {
          $project: {
            machine_code: 1,
            machine_name: 1,
            line_names: 1,
            checkSheet_data: 1,
            userWithStatusInfo: 1,
          },
        },
      ]);

      approvalLogOfPM = await Machine.populate(approvalLogOfPM, {
        path: "line_names",
        populate: { path: "cell_names", model: "Cells" },
      });

      const countOfAcceptedAndTotalApprovalOfUsers = await Machine.aggregate([
        {
          $match: {
            ...queryObj,
            // machine_code: "EETP-002",
          },
        },
        {
          $unwind: "$checkSheet_data",
        },
        {
          $match: {
            "checkSheet_data.current_year": selectedYear,
          },
        },
        ...acceptedAndTotalApprovalCount,
        {
          $unwind: "$userWithStatusInfo",
        },
        {
          $match: {
            "userWithStatusInfo.userName": {
              $nin: [undefined, null, ""],
            },
          },
        },

        {
          $group: {
            _id: {
              month: "$userWithStatusInfo.month",
              machine_code: "$userWithStatusInfo.machine_code",
            },
            data: {
              $push: {
                userName: "$userWithStatusInfo.userName",
                status: "$userWithStatusInfo.status",
                userType: "$userWithStatusInfo.userType",
              },
            },
          },
        },
        {
          $group: {
            _id: {
              month: "$_id.month",
              machine_code: "$_id.machine_code",
            },
            pendingUsersList: {
              $first: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$data",
                      as: "approvalData",
                      cond: {
                        $eq: ["$$approvalData.status", "Pending"],
                      },
                    },
                  },
                  0,
                ],
              },
            },
            acceptedUserList: {
              $push: {
                $filter: {
                  input: "$data",
                  as: "approvalData",
                  cond: {
                    $eq: ["$$approvalData.status", "Accepted"],
                  },
                },
              },
            },
          },
        },
        {
          $match: {
            $or: [
              {
                pendingUsersList: { $ne: null },
              },
              {
                acceptedUserList: { $ne: [] },
              },
            ],
          },
        },
        {
          $facet: {
            pendingCounts: [
              { $unwind: "$pendingUsersList" },
              {
                $group: {
                  _id: {
                    userName: "$pendingUsersList.userName",
                    userType: "$pendingUsersList.userType",
                  },
                  countOfPending: { $sum: 1 },
                },
              },
            ],
            acceptedCounts: [
              { $unwind: "$acceptedUserList" },
              {
                $unwind: "$acceptedUserList", // Unwind second level of nested array within the acceptedUserList
              },
              {
                $group: {
                  _id: {
                    userName: "$acceptedUserList.userName",
                    userType: "$acceptedUserList.userType",
                  },
                  countOfAccepted: { $sum: 1 },
                },
              },
            ],
          },
        },
        {
          $project: {
            combined: { $concatArrays: ["$pendingCounts", "$acceptedCounts"] },
          },
        },
        {
          $unwind: "$combined",
        },
        {
          $group: {
            _id: {
              userName: "$combined._id.userName",
              userType: "$combined._id.userType",
            },
            countOfPending: {
              $sum: { $ifNull: ["$combined.countOfPending", 0] },
            },
            countOfAccepted: {
              $sum: { $ifNull: ["$combined.countOfAccepted", 0] },
            },
          },
        },
        {
          $group: {
            _id: "$_id.userType",
            data: {
              $push: {
                userName: "$_id.userName",
                countOfPending: "$countOfPending",
                countOfAccepted: "$countOfAccepted",
              },
            },
          },
        },
        {
          $project: {
            userType: "$_id",
            data: 1,
            _id: 0,
          },
        },
        {
          $sort: {
            userType: -1,
          },
        },
      ]);

      res.json({
        subSectionsData,
        subSectionIdArray,
        cellData,
        cellIdArray,
        lineData,
        lineIdArray,
        approvalLogOfPM,
        countOfAcceptedAndTotalApprovalOfUsers,
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("User id not received!!!");
    }
  }
);

//for main dashboard of meters display for operator user
router.post(
  "/postSectionToGetAllDataForMainDashboard",
  authenticate,
  async (req, res) => {
    try {
      let { section, selectedYear } = req.body;
      let currentYear =
        new Date().getMonth() < 3
          ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
          : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
      let selectedYearOfCheckSheet =
        selectedYear === currentYear
          ? [
              {
                "checkSheet_data.current_year": selectedYear,
              },
              {
                checkSheet_data: [],
              },
              {
                checkSheet_data: undefined,
              },
            ]
          : [
              {
                "checkSheet_data.current_year": selectedYear,
              },
            ];

      let sectionSplit = section.split("-");
      const sectionInfo = await Section.find({ section_id: sectionSplit[0] });
      // console.log("____________", sectionInfo[0]._id)
      const subSectionsData = await SubSection.find({
        section_names: sectionInfo[0]._id,
      }).sort({ subSection_sequence: 1 });

      //for display default sub-section
      let defaultSubSectionArray = [];
      for (let i = 0; i < subSectionsData.length; i++) {
        defaultSubSectionArray.push(
          `${subSectionsData[i].subSection_id}-${subSectionsData[i].subSection_name}`
        );
      }

      let subSectionIdArray = [];
      for (let i = 0; i < subSectionsData.length; i++) {
        subSectionIdArray.push(subSectionsData[i]._id);
      }

      const cellData = await Cell.find({
        subSection_names: { $in: subSectionIdArray },
      }).sort({ cell_sequence: 1 });
      let cellIdArray = [];
      for (let i = 0; i < cellData.length; i++) {
        cellIdArray.push(cellData[i]._id);
      }

      const lineData = await Line.find({
        cell_names: { $in: cellIdArray },
      }).sort({ line_sequence: 1 });
      let lineIdArray = [];
      for (let i = 0; i < lineData.length; i++) {
        lineIdArray.push(lineData[i]._id);
      }

      const monthKeyArray = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "June",
        "July",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      let CarriedPMStatusArray = {
        Apr: "",

        May: "",

        June: "",

        July: "",

        Aug: "",

        Sep: "",

        Oct: "",

        Nov: "",

        Dec: "",

        Jan: "",

        Feb: "",

        Mar: "",
      };

      let CurrentMonthPMScheduleOrNotStatusArray = {
        Apr: "",

        May: "",

        June: "",

        July: "",

        Aug: "",

        Sep: "",

        Oct: "",

        Nov: "",

        Dec: "",

        Jan: "",

        Feb: "",

        Mar: "",
      };

      let monthForCompareSystemMonth = monthKeyArray[new Date().getMonth()];
      let previousMonth =
        monthKeyArray[new Date().getMonth() - 1] === undefined
          ? monthKeyArray.splice(-1)[0]
          : monthKeyArray[new Date().getMonth() - 1];
      let previousToPreviousMonth =
        new Date().getMonth() - 2 === -2
          ? monthKeyArray.splice(-1)[1]
          : new Date().getMonth() - 2 === -1
          ? monthKeyArray.splice(-1)[0]
          : monthKeyArray[new Date().getMonth() - 2];

      //for 1/1M skip status
      let keyOfPreviousMonth = `checkSheet_data.$[outer].checkSheet.$[inner].planningTableAnimationArray2.${previousMonth}`;
      let keyOfCarriedSkipMonthPM = `checkSheet_data.$[outer].PMStatus.${previousMonth}`;

      //for other clycle skip status
      let keyOfPreviousToPreviousMonthForSkipPM = `checkSheet_data.$[outer].checkSheet.$[inner].checkSheet.planningTableAnimationArray2.${previousToPreviousMonth}`;
      let keyOfCarriedSkipMonthPMForPreviousToPrevious = `checkSheet_data.$[outer].PMStatus.${previousToPreviousMonth}`;

      let arrayForPreviousMonthSkipPMData = [];
      arrayForPreviousMonthSkipPMData.push(2, "skip_previous");

      let arrayForSkipPerMonthPMData = [];
      arrayForSkipPerMonthPMData.push(1, "skip");

      let keyForCurrentMonthNoCompletion = `checkSheet_data.$[outer].PMStatus.${monthForCompareSystemMonth}`;

      // const machineData = await Machine.find({ line_names: { $in: lineIdArray } }).sort({ machine_sequence: 1 });

      let machineData = await Machine.aggregate([
        {
          $match: {
            line_names: { $in: lineIdArray },
            isPM: "Yes",
          },
        },
        {
          $project: {
            machine_code: 1,
            machine_name: 1,
            machine_nickname: 1,
            machine_sequence: 1,
            installation_date: 1,
            maker_name: 1,
            maker_sr_no: 1,
            manufacturingDate: 1,
            isPM: 1,
            line_names: 1,
            checkSheet_data: 1,
          },
        },
        {
          $unwind: {
            path: "$checkSheet_data",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            $or: selectedYearOfCheckSheet,
          },
        },
        {
          $sort: {
            machine_sequence: 1,
          },
        },
      ]);
      // machineData = await Machine.populate(machineData, { path: "line_names", populate: { path: "cell_names", model: "Cells" } })

      const updateOnesPerMonthStatusSkip = async (
        machine_code,
        tableRowId,
        yearOfCheckSheet
      ) => {
        updatePreviousMonth = await Machine.updateOne(
          { machine_code: machine_code },
          {
            $set: {
              [keyOfPreviousMonth]: arrayForSkipPerMonthPMData,
              [keyOfCarriedSkipMonthPM]: "PM Skip",
            },
          },
          {
            arrayFilters: [
              { "outer.current_year": yearOfCheckSheet },
              { "inner.tableRowId": tableRowId },
            ],
          }
        );
      };

      const updateOtherCyclesStatusSkip = async (
        machine_code,
        tableRowId,
        yearOfCheckSheet
      ) => {
        updatePreviousMonth = await Machine.updateOne(
          { machine_code: machine_code, yearOfCheckSheet },
          {
            $set: {
              [keyOfCarriedSkipMonthPMForPreviousToPrevious]: "PM Skip",
              [keyOfPreviousMonth]: arrayForPreviousMonthSkipPMData,
              [keyOfPreviousToPreviousMonthForSkipPM]:
                arrayForSkipPerMonthPMData,
            },
          },
          {
            arrayFilters: [
              { "outer.current_year": yearOfCheckSheet },
              { "inner.tableRowId": tableRowId },
            ],
          }
        );
      };

      const updatePMStatusOfPreviousMonthForNoCompletion = async (
        machine_code,
        yearOfCheckSheet
      ) => {
        // console.log(machine_code, yearOfCheckSheet)
        updatePreviousMonth = await Machine.updateOne(
          { machine_code: machine_code },
          {
            $set: {
              [keyOfCarriedSkipMonthPM]: "No Completion",
              [keyForCurrentMonthNoCompletion]: "No Completion",
            },
          },
          {
            arrayFilters: [{ "outer.current_year": yearOfCheckSheet }],
          }
        );
      };
      let updateCarriedPMStatus;
      const updateStatusOfLastMonthPendingForCount = async (
        machine_code,
        yearOfCheckSheet,
        carriedPMStatusExistsOrNot
      ) => {
        // console.log(carriedPMStatusExistupdateStatusOfLastMonthPendingForCountsOrNot)
        if (carriedPMStatusExistsOrNot === 0) {
          CarriedPMStatusArray[monthForCompareSystemMonth] = "CarriedPM";
          updateCarriedPMStatus = await Machine.updateOne(
            { machine_code: machine_code },
            {
              $set: {
                "checkSheet_data.$[outer].carriedPMStatus":
                  CarriedPMStatusArray,
              },
            },
            {
              arrayFilters: [{ "outer.current_year": yearOfCheckSheet }],
            }
          );
        } else {
          let keyOfCarriedPMStatus = `checkSheet_data.$[outer].carriedPMStatus.${monthForCompareSystemMonth}`;
          updateCarriedPMStatus = await Machine.updateOne(
            { machine_code: machine_code },
            {
              $set: {
                [keyOfCarriedPMStatus]: "CarriedPM",
              },
            },
            {
              arrayFilters: [{ "outer.current_year": yearOfCheckSheet }],
            }
          );
        }
      };

      let carryData;
      let arrayForPMData = [];
      arrayForPMData.push(1, "dummy");
      let keyOfMonth = `checkSheet_data.$[outer].checkSheet.$[inner].planningTableAnimationArray2.${monthForCompareSystemMonth}`;

      //for carry forward data at once
      const carryForwardOtherCycleData = async (
        machine_code,
        tableRowId,
        yearOfCheckSheet
      ) => {
        updatePreviousMonth = await Machine.updateOne(
          { machine_code: machine_code },
          {
            $set: {
              [keyOfPreviousMonth]: arrayForPMData,
            },
          },
          {
            arrayFilters: [
              { "outer.current_year": yearOfCheckSheet },
              { "inner.tableRowId": tableRowId },
            ],
          }
        );

        carryData = await Machine.updateOne(
          { machine_code: machine_code },
          {
            $set: {
              [keyOfMonth]: "2",
            },
          },
          {
            arrayFilters: [
              { "outer.current_year": yearOfCheckSheet },
              { "inner.tableRowId": tableRowId },
            ],
          }
        );
      };

      let updateCurrentMonthScheduleOrNotStatus;

      // const updateStatusOfCurrentMonthPMScheduleOrNot = async (machine_code, yearOfCheckSheet, currentMonthPMScheduleOrNot) => {
      //     // console.log(carriedPMStatusExistsOrNot)
      //     if (currentMonthPMScheduleOrNot === 0) {
      //         CurrentMonthPMScheduleOrNotStatusArray[monthForCompareSystemMonth] = "Scheduled"
      //         updateCurrentMonthScheduleOrNotStatus = await Machine.updateOne({ machine_code: machine_code }, {
      //             $set: { "checkSheet_data.$[outer].currentMonthScheduleOrNotStatus": CurrentMonthPMScheduleOrNotStatusArray }
      //         }, {
      //             arrayFilters: [{ 'outer.current_year': yearOfCheckSheet }],
      //         })
      //     } else {
      //         let keyOfCurrentMonthScheduleOrNotStatus = `checkSheet_data.$[outer].currentMonthScheduleOrNotStatus.${monthForCompareSystemMonth}`
      //         updateCurrentMonthScheduleOrNotStatus = await Machine.updateOne({ machine_code: machine_code }, {
      //             $set: {
      //                 [keyOfCurrentMonthScheduleOrNotStatus]: "Scheduled"
      //             }
      //         }, {
      //             arrayFilters: [{ 'outer.current_year': yearOfCheckSheet }],
      //         })
      //     }
      // }

      let updatePreviousMonth,
        carriedPMStatusExistsOrNot,
        currentMonthPMScheduleOrNot;
      if (previousMonth != "Mar") {
        machineData?.map((key) => {
          if (key?.checkSheet_data?.checksheet_status === "Implementation") {
            key?.checkSheet_data?.checkSheet?.map((key1) => {
              // if (key1?.isDeleted) {
              //     console.log(key.machine_code, "---->", key1.tableRowId)
              // }

              if (key1?.planningTableAnimationArray2) {
                if (
                  key1.planningTableAnimationArray2?.[previousMonth]?.[0] ===
                    "1" &&
                  key1.planningTableAnimationArray2?.[previousMonth]?.length <=
                    2 &&
                  key1.cycle === "1/1M" &&
                  !key1?.isDeleted &&
                  !key1?.isAdded &&
                  !key1?.isEdited
                ) {
                  // console.log("regular....");
                  updateOnesPerMonthStatusSkip(
                    key.machine_code,
                    key1.tableRowId,
                    key.checkSheet_data.current_year
                  );
                }
                //for mid year added 1/M skip
                else if (
                  (monthKeyArray.indexOf(monthForCompareSystemMonth) >
                    new Date(
                      mongoose.Types.ObjectId(key1?._id).getTimestamp()
                    ).getMonth() ||
                    monthKeyArray.indexOf(monthForCompareSystemMonth) < 3) &&
                  key1.planningTableAnimationArray2?.[previousMonth]?.[0] ===
                    "1" &&
                  key1.planningTableAnimationArray2?.[previousMonth]?.length <=
                    2 &&
                  key1.cycle === "1/1M" &&
                  (key1.isAdded || key1.isEdited)
                ) {
                  // console.log("..condition..");

                  updateOnesPerMonthStatusSkip(
                    key.machine_code,
                    key1.tableRowId,
                    key.checkSheet_data.current_year
                  );
                }

                if (
                  key1.planningTableAnimationArray2?.[previousMonth]?.[0] ===
                    "2" &&
                  key1.planningTableAnimationArray2?.[previousMonth]?.length <
                    2 &&
                  key1.cycle !== "1/1M" &&
                  !key1?.isDeleted &&
                  !key1?.isAdded &&
                  !key1?.isEdited
                ) {
                  updateOtherCyclesStatusSkip(
                    key.machine_code,
                    key1.tableRowId,
                    key.checkSheet_data.current_year
                  );
                }
                //for mid year added excluded !== 1/M
                else if (
                  (monthKeyArray.indexOf(monthForCompareSystemMonth) >
                    new Date(
                      mongoose.Types.ObjectId(key1?._id).getTimestamp()
                    ).getMonth() ||
                    monthKeyArray.indexOf(monthForCompareSystemMonth) < 3) &&
                  key1.planningTableAnimationArray2?.[previousMonth]?.[0] ===
                    "2" &&
                  key1.planningTableAnimationArray2?.[previousMonth]?.length <
                    2 &&
                  key1.cycle !== "1/1M" &&
                  (key1.isAdded || key1.isEdited)
                ) {
                  updateOtherCyclesStatusSkip(
                    key.machine_code,
                    key1.tableRowId,
                    key.checkSheet_data.current_year
                  );
                }

                if (
                  key1.planningTableAnimationArray2[
                    monthForCompareSystemMonth
                  ][0] === "2" &&
                  key1.cycle !== "1/1M" &&
                  !key1?.isDeleted
                ) {
                  if (key?.checkSheet_data?.carriedPMStatus != undefined) {
                    carriedPMStatusExistsOrNot = 1;
                  } else {
                    carriedPMStatusExistsOrNot = 0;
                  }
                  updateStatusOfLastMonthPendingForCount(
                    key.machine_code,
                    key.checkSheet_data.current_year,
                    carriedPMStatusExistsOrNot
                  );
                }
                if (
                  key1.planningTableAnimationArray2?.[previousMonth]?.[0] ===
                    "1" &&
                  key1.planningTableAnimationArray2?.[previousMonth]?.length <
                    2 &&
                  key1.cycle !== "1/1M" &&
                  key1.planningTableAnimationArray2?.[
                    monthForCompareSystemMonth
                  ]?.[0] != "1" &&
                  key1.planningTableAnimationArray2?.[
                    monthForCompareSystemMonth
                  ]?.length < 2 &&
                  key1.cycle !== "1/1M" &&
                  !key1?.isDeleted &&
                  !key1?.isAdded &&
                  !key1?.isEdited
                ) {
                  // console.log(key.machine_code, "next month 1 occure -----> ", key1.tableRowId)
                  carryForwardOtherCycleData(
                    key.machine_code,
                    key1.tableRowId,
                    key.checkSheet_data.current_year
                  );
                  //add dummy key word 1,dummy
                }
                //for mid year added carry forward after adding month
                else if (
                  (monthKeyArray.indexOf(monthForCompareSystemMonth) >
                    new Date(
                      mongoose.Types.ObjectId(key1?._id).getTimestamp()
                    ).getMonth() ||
                    monthKeyArray.indexOf(monthForCompareSystemMonth) < 3) &&
                  key1.planningTableAnimationArray2?.[previousMonth]?.[0] ===
                    "1" &&
                  key1.planningTableAnimationArray2?.[previousMonth]?.length <
                    2 &&
                  key1.cycle !== "1/1M" &&
                  key1.planningTableAnimationArray2?.[
                    monthForCompareSystemMonth
                  ]?.[0] != "1" &&
                  key1.planningTableAnimationArray2?.[
                    monthForCompareSystemMonth
                  ]?.length < 2 &&
                  key1.cycle !== "1/1M" &&
                  (key1.isAdded || key1.isEdited)
                ) {
                  // console.log(key.machine_code, "next month 1 occure -----> ", key1.tableRowId)
                  carryForwardOtherCycleData(
                    key.machine_code,
                    key1.tableRowId,
                    key.checkSheet_data.current_year
                  );
                  //add dummy key word 1,dummy
                }

                //Handle No-Completion status
                if (key?.checkSheet_data?.PMStatus) {
                  // console.log(key?.checkSheet_data?.PMStatus)
                  if (
                    key?.checkSheet_data?.PMStatus[previousMonth] ===
                      "Current Plan" &&
                    !key1?.isDeleted &&
                    !key1?.isAdded &&
                    !key1?.isEdited
                  ) {
                    // console.log("No completion check regular........");

                    updatePMStatusOfPreviousMonthForNoCompletion(
                      key.machine_code,
                      key.checkSheet_data.current_year
                    );
                  }
                  //for mid year No-completion status
                  else if (
                    (monthKeyArray.indexOf(monthForCompareSystemMonth) >
                      new Date(
                        mongoose.Types.ObjectId(key1?._id).getTimestamp()
                      ).getMonth() ||
                      monthKeyArray.indexOf(monthForCompareSystemMonth) < 3) &&
                    (key1.isAdded || key1.isEdited) &&
                    key?.checkSheet_data?.PMStatus[previousMonth] ===
                      "Current Plan"
                  ) {
                    // console.log("No completion check........");
                    updatePMStatusOfPreviousMonthForNoCompletion(
                      key.machine_code,
                      key.checkSheet_data.current_year
                    );
                  }
                }
              }
            });

            // if (key?.checkSheet_data?.PMStatus) {
            //     // console.log(key?.checkSheet_data?.PMStatus)
            //     if (key?.checkSheet_data?.PMStatus[previousMonth] === "Current Plan") {
            //         updatePMStatusOfPreviousMonthForNoCompletion(key.machine_code, key.checkSheet_data.current_year)
            //     }
            // }
          }
        });
      }

      res.json({
        sectionInfo,
        subSectionsData,
        subSectionIdArray,
        cellData,
        cellIdArray,
        lineData,
        lineIdArray,
        machineData,
        defaultSubSectionArray,
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("User id not received!!!");
    }
  }
);

//for main dashboard of meters display for other users
router.post(
  "/postSectionToGetAllDataForMainDashboardForOtherUser",
  authenticate,
  async (req, res) => {
    try {
      let { section, selectedYear } = req.body;

      // console.log("2029==>", selectedYear)

      let currentYear =
        new Date().getMonth() < 3
          ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
          : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
      let selectedYearOfCheckSheet =
        selectedYear === currentYear
          ? [
              {
                "checkSheet_data.current_year": selectedYear,
              },
              {
                checkSheet_data: [],
              },
            ]
          : [
              {
                "checkSheet_data.current_year": selectedYear,
              },
            ];

      // console.log(section, "_________", req.rootUser);
      let sectionSplit = section.split("-");
      const sectionInfo = await Section.find({ section_id: sectionSplit[0] });
      // console.log("____________", sectionInfo[0]._id)
      const subSectionsData = await SubSection.find({
        section_names: sectionInfo[0]._id,
      }).sort({ subSection_sequence: 1 });

      //for display default sub-section
      let defaultSubSectionArray = [];
      for (let i = 0; i < subSectionsData.length; i++) {
        defaultSubSectionArray.push(
          `${subSectionsData[i].subSection_id}-${subSectionsData[i].subSection_name}`
        );
      }

      let subSectionIdArray = [];
      for (let i = 0; i < subSectionsData.length; i++) {
        subSectionIdArray.push(subSectionsData[i]._id);
      }

      const cellData = await Cell.find({
        subSection_names: { $in: subSectionIdArray },
      }).sort({ cell_sequence: 1 });
      let cellIdArray = [];
      for (let i = 0; i < cellData.length; i++) {
        cellIdArray.push(cellData[i]._id);
      }

      const lineData = await Line.find({
        cell_names: { $in: cellIdArray },
      }).sort({ line_sequence: 1 });
      let lineIdArray = [];
      for (let i = 0; i < lineData.length; i++) {
        lineIdArray.push(lineData[i]._id);
      }

      let machineData = await Machine.aggregate([
        {
          $match: {
            line_names: { $in: lineIdArray },
            $or: selectedYearOfCheckSheet,
          },
        },
        {
          $project: {
            machine_code: 1,
            machine_name: 1,
            machine_nickname: 1,
            machine_sequence: 1,
            installation_date: 1,
            maker_name: 1,
            maker_sr_no: 1,
            manufacturingDate: 1,
            isPM: 1,
            line_names: 1,
            checkSheet_data: 1,
          },
        },
        {
          $unwind: "$checkSheet_data",
        },
        {
          $match: {
            "checkSheet_data.current_year": selectedYear,
          },
        },
        {
          $sort: {
            machine_sequence: 1,
          },
        },
      ]);

      res.json({
        sectionInfo,
        subSectionsData,
        subSectionIdArray,
        cellData,
        cellIdArray,
        lineData,
        lineIdArray,
        machineData,
        defaultSubSectionArray,
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("User id not received!!!");
    }
  }
);

//add new checksheet data for perticular machine
router.post("/addNewChecksheetData", async (req, res) => {
  try {
    const {
      category,
      inspection_parent_name,
      // inspection_child_name,
      inspection_point,
      judgement_criteria,
      action,
      cycle,
      personInCharge,
      PM_time,
      machineId,
      isAdded,
      remarksCompulsoryOrNot,
    } = req.body;
    // console.log(req.body)
    let tableRowId;

    const monthKeyArray = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "June",
      "July",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    let monthForCompareSystemMonth = monthKeyArray[new Date().getMonth()];

    //2022-2023
    let current_year = `${new Date().getFullYear()}-${
      new Date().getFullYear() + 1
    }`;

    //2023-2024
    // let current_year = `${new Date().getFullYear() + 1}-${new Date().getFullYear() + 2}`

    let findMachine;
    if (
      monthForCompareSystemMonth === "Jan" ||
      monthForCompareSystemMonth === "Feb" ||
      monthForCompareSystemMonth === "Mar"
    ) {
      let previous_year = `${
        new Date().getFullYear() - 1
      }-${new Date().getFullYear()}`;
      // console.log(previous_year)
      findMachine = await Machine.aggregate([
        {
          $match: {
            machine_code: machineId,
            "checkSheet_data.current_year": previous_year,
          },
        },
        { $unwind: "$checkSheet_data" },
        {
          $match: { "checkSheet_data.current_year": previous_year },
        },
        { $unwind: "$checkSheet_data.checkSheet" },
        {
          $sort: { "checkSheet_data.checkSheet.tableRowId": -1 },
        },
        {
          $project: {
            "checkSheet_data.checkSheet": 1,
            "checkSheet_data.current_year": 1,
          },
        },
      ]).limit(1);

      if (isAdded === true) {
        if (findMachine[0] === undefined) {
          // console.log("No data")
          tableRowId = 1;
          const addCheckSheetData = await Machine.updateOne(
            { machine_code: machineId },
            {
              $set: {
                checkSheet_data: {
                  current_year: previous_year,
                  checkSheet: {
                    tableRowId,
                    category,
                    inspection_parent_name,
                    // inspection_child_name,
                    inspection_point,
                    judgement_criteria,
                    action,
                    cycle,
                    personInCharge,
                    PM_time,
                    isAdded,
                  },
                  flagForRevisionContent: true,
                },
              },
            }
          );
        } else {
          // console.log("data")

          tableRowId = findMachine[0].checkSheet_data.checkSheet.tableRowId + 1;
          // console.log(tableRowId)
          const addCheckSheetData = await Machine.updateOne(
            {
              machine_code: machineId,
              "checkSheet_data.current_year": previous_year,
            },
            {
              $set: {
                "checkSheet_data.$.flagForRevisionContent": true,
              },
              $push: {
                "checkSheet_data.$.checkSheet": {
                  tableRowId,
                  category,
                  inspection_parent_name,
                  // inspection_child_name,
                  inspection_point,
                  judgement_criteria,
                  action,
                  cycle,
                  personInCharge,
                  PM_time,
                  isAdded,
                  remarksCompulsoryOrNot,
                },
              },
            }
          );
        }
      } else {
        if (findMachine[0] === undefined) {
          tableRowId = 1;
          const addCheckSheetData = await Machine.updateOne(
            { machine_code: machineId },
            {
              $set: {
                checkSheet_data: {
                  current_year: previous_year,
                  checkSheet: {
                    tableRowId,
                    category,
                    inspection_parent_name,
                    // inspection_child_name,
                    inspection_point,
                    judgement_criteria,
                    action,
                    cycle,
                    personInCharge,
                    PM_time,
                    remarksCompulsoryOrNot,
                  },
                },
              },
            }
          );
        } else {
          tableRowId = findMachine[0].checkSheet_data.checkSheet.tableRowId + 1;
          // console.log(tableRowId)
          const addCheckSheetData = await Machine.updateOne(
            {
              machine_code: machineId,
              "checkSheet_data.current_year": previous_year,
            },
            {
              $push: {
                "checkSheet_data.$.checkSheet": {
                  tableRowId,
                  category,
                  inspection_parent_name,
                  // inspection_child_name,
                  inspection_point,
                  judgement_criteria,
                  action,
                  cycle,
                  personInCharge,
                  PM_time,
                  remarksCompulsoryOrNot,
                },
              },
            }
          );
        }
      }
    } else {
      findMachine = await Machine.aggregate([
        {
          $match: {
            machine_code: machineId,
            "checkSheet_data.current_year": current_year,
          },
        },
        { $unwind: "$checkSheet_data" },
        {
          $match: { "checkSheet_data.current_year": current_year },
        },
        { $unwind: "$checkSheet_data.checkSheet" },
        {
          $sort: { "checkSheet_data.checkSheet.tableRowId": -1 },
        },
        {
          $project: {
            "checkSheet_data.checkSheet": 1,
            "checkSheet_data.current_year": 1,
          },
        },
      ]).limit(1);

      if (isAdded === true) {
        if (findMachine[0] === undefined) {
          tableRowId = 1;
          const addCheckSheetData = await Machine.updateOne(
            { machine_code: machineId },
            {
              $set: {
                checkSheet_data: {
                  current_year,
                  checkSheet: {
                    tableRowId,
                    category,
                    inspection_parent_name,
                    // inspection_child_name,
                    inspection_point,
                    judgement_criteria,
                    action,
                    cycle,
                    personInCharge,
                    PM_time,
                    isAdded,
                    remarksCompulsoryOrNot,
                  },
                  flagForRevisionContent: true,
                },
              },
            }
          );
        } else {
          tableRowId = findMachine[0].checkSheet_data.checkSheet.tableRowId + 1;
          const addCheckSheetData = await Machine.updateOne(
            {
              machine_code: machineId,
              "checkSheet_data.current_year": current_year,
            },
            {
              $set: {
                "checkSheet_data.$.flagForRevisionContent": true,
              },
              $push: {
                "checkSheet_data.$.checkSheet": {
                  tableRowId,
                  category,
                  inspection_parent_name,
                  // inspection_child_name,
                  inspection_point,
                  judgement_criteria,
                  action,
                  cycle,
                  personInCharge,
                  PM_time,
                  isAdded,
                  remarksCompulsoryOrNot,
                },
              },
            }
          );
        }
      } else {
        if (findMachine[0] === undefined) {
          tableRowId = 1;
          const addCheckSheetData = await Machine.updateOne(
            { machine_code: machineId },
            {
              $set: {
                checkSheet_data: {
                  current_year,
                  checkSheet: {
                    tableRowId,
                    category,
                    inspection_parent_name,
                    // inspection_child_name,
                    inspection_point,
                    judgement_criteria,
                    action,
                    cycle,
                    personInCharge,
                    PM_time,
                    remarksCompulsoryOrNot,
                  },
                },
              },
            }
          );
        } else {
          tableRowId = findMachine[0].checkSheet_data.checkSheet.tableRowId + 1;
          const addCheckSheetData = await Machine.updateOne(
            {
              machine_code: machineId,
              "checkSheet_data.current_year": current_year,
            },
            {
              $push: {
                "checkSheet_data.$.checkSheet": {
                  tableRowId,
                  category,
                  inspection_parent_name,
                  // inspection_child_name,
                  inspection_point,
                  judgement_criteria,
                  action,
                  cycle,
                  personInCharge,
                  PM_time,
                  remarksCompulsoryOrNot,
                },
              },
            }
          );
        }
      }
    }

    res
      .status(201)
      .json({ message: "Checksheet row data entered successfully" });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log("User id not received!!!");
    console.log(error);
  }
});

//get the checksheet table data of the selected machine
router.post(
  "/fetchSelectedMachineChecksheetTableData",
  authenticate,
  async (req, res) => {
    try {
      let { machineId, yearOfCheckSheet } = req.body;
      //2022-23
      let current_year = `${new Date().getFullYear()}-${
        new Date().getFullYear() + 1
      }`;

      //2023-2024
      // let current_year = `${new Date().getFullYear() + 1}-${new Date().getFullYear() + 2}`

      let previous_year = `${
        new Date().getFullYear() - 1
      }-${new Date().getFullYear()}`;

      let checkSheetDataKeyExistsOrNot = await Machine.findOne({
        machine_code: machineId,
        checkSheet_data: { $exists: true },
      });

      let currentYear =
        new Date().getMonth() < 3
          ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
          : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

      let machineLastData = await Machine.aggregate([
        {
          $match: {
            machine_code: machineId,
          },
        },
        {
          $unwind: "$checkSheet_data",
        },
        {
          $match: {
            "checkSheet_data.current_year": yearOfCheckSheet
              ? yearOfCheckSheet
              : currentYear,
          },
        },
        {
          $project: {
            machine_code: 1,
            machine_name: 1,
            machine_nickname: 1,
            machine_sequence: 1,
            installation_date: 1,
            maker_name: 1,
            maker_sr_no: 1,
            manufacturingDate: 1,
            isPM: 1,
            line_names: 1,
            flagForRevisionContent: 1,
            checkSheet_data: 1,
          },
        },
      ]);
      machineLastData = await Machine.populate(machineLastData, {
        path: "line_names",
        populate: { path: "cell_names", model: "Cells" },
      });

      // let getSelectedMachineChecksheet, machineData
      //     if(checkSheetDataKeyExistsOrNot){
      //         getSelectedMachineChecksheet = await Machine.aggregate([
      //             {
      //                 $match: { machine_code: machineId, "checkSheet_data.current_year": current_year }
      //             },
      //             { $unwind: '$checkSheet_data' },
      //             {
      //                 $match: {"checkSheet_data.current_year": current_year }
      //             },
      //             { $project: { "checkSheet_data.checkSheet": 1, "checkSheet_data.current_year": 1 } },
      //         ]);
      //         machineData = await Machine.aggregate([
      //             {
      //                 $match: { machine_code: machineId, "checkSheet_data.current_year": current_year }
      //             },
      //             { $unwind: '$checkSheet_data' },
      //             {
      //                 $match: {"checkSheet_data.current_year": current_year }
      //             }
      //         ]);
      //         machineData = await Machine.populate(machineData, { path: "line_names", populate: { path: "cell_names", model: "Cells" } })

      //         if(getSelectedMachineChecksheet[0] === undefined){
      //             getSelectedMachineChecksheet = await Machine.aggregate([
      //                 {
      //                     $match: { machine_code: machineId, "checkSheet_data.current_year": previous_year }
      //                 },
      //                 { $unwind: '$checkSheet_data' },
      //                 {
      //                     $match: {"checkSheet_data.current_year": previous_year }
      //                 },
      //                 { $project: { "checkSheet_data.checkSheet": 1, "checkSheet_data.current_year": 1 } },
      //             ]);
      //             machineData = await Machine.aggregate([
      //                 {
      //                     $match: { machine_code: machineId, "checkSheet_data.current_year": previous_year }
      //                 },
      //                 { $unwind: '$checkSheet_data' },
      //                 {
      //                     $match: {"checkSheet_data.current_year": previous_year }
      //                 }
      //             ]);
      //             machineData = await Machine.populate(machineData, { path: "line_names", populate: { path: "cell_names", model: "Cells" } })
      //         }
      // }

      // if(getSelectedMachineChecksheet){
      res.json({
        getSelectedMachineChecksheet:
          machineLastData[0]?.checkSheet_data?.checkSheet,
        yearOfCheckSheet: machineLastData[0]?.checkSheet_data?.current_year,
        machineData: machineLastData,
      });
      // }
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("User id not received!!!");
    }
  }
);

//update selcted machine checksheet data row
router.post(
  "/updateSelectedMachineChecksheetTableRowData",
  async (req, res) => {
    try {
      const { rowData, oldRow, machineId, yearOfCheckSheet, isEdited } =
        req.body;
      // console.log(isEdited, machineId, yearOfCheckSheet);
      let flagForCycleChange;
      if (isEdited === true) {
        const updateChecksheetRow = await Machine.updateOne(
          { machine_code: machineId },
          {
            $set: {
              "checkSheet_data.$[outer].checkSheet.$[inner].category":
                rowData.category,
              "checkSheet_data.$[outer].checkSheet.$[inner].inspection_parent_name":
                rowData.inspection_parent_name,
              // "checkSheet_data.$[outer].checkSheet.$[inner].inspection_child_name": rowData.inspection_child_name,
              "checkSheet_data.$[outer].checkSheet.$[inner].inspection_point":
                rowData.inspection_point,
              "checkSheet_data.$[outer].checkSheet.$[inner].judgement_criteria":
                rowData.judgement_criteria,
              "checkSheet_data.$[outer].checkSheet.$[inner].action":
                rowData.action,
              "checkSheet_data.$[outer].checkSheet.$[inner].cycle":
                rowData.cycle,
              "checkSheet_data.$[outer].checkSheet.$[inner].personInCharge":
                rowData.personInCharge,
              "checkSheet_data.$[outer].checkSheet.$[inner].PM_time":
                rowData.PM_time,
              "checkSheet_data.$[outer].checkSheet.$[inner].remarksCompulsoryOrNot":
                rowData.remarksCompulsoryOrNot,
              "checkSheet_data.$[outer].checkSheet.$[inner].isEdited": isEdited,
              "checkSheet_data.$[outer].isEditedMonth": new Date(),
              "checkSheet_data.$[outer].flagForRevisionContent": true,
            },
          },
          {
            arrayFilters: [
              { "outer.current_year": yearOfCheckSheet },
              { "inner.tableRowId": rowData.tableRowId },
            ],
          }
        );

        if (oldRow.cycle !== rowData.cycle) {
          flagForCycleChange = true;
        }
      } else {
        const updateChecksheetRow = await Machine.updateOne(
          { machine_code: machineId },
          {
            $set: {
              "checkSheet_data.$[outer].checkSheet.$[inner].category":
                rowData.category,
              "checkSheet_data.$[outer].checkSheet.$[inner].inspection_parent_name":
                rowData.inspection_parent_name,
              // "checkSheet_data.$[outer].checkSheet.$[inner].inspection_child_name": rowData.inspection_child_name,
              "checkSheet_data.$[outer].checkSheet.$[inner].inspection_point":
                rowData.inspection_point,
              "checkSheet_data.$[outer].checkSheet.$[inner].judgement_criteria":
                rowData.judgement_criteria,
              "checkSheet_data.$[outer].checkSheet.$[inner].action":
                rowData.action,
              "checkSheet_data.$[outer].checkSheet.$[inner].cycle":
                rowData.cycle,
              "checkSheet_data.$[outer].checkSheet.$[inner].personInCharge":
                rowData.personInCharge,
              "checkSheet_data.$[outer].checkSheet.$[inner].PM_time":
                rowData.PM_time,
              "checkSheet_data.$[outer].checkSheet.$[inner].remarksCompulsoryOrNot":
                rowData.remarksCompulsoryOrNot,
            },
          },
          {
            arrayFilters: [
              { "outer.current_year": yearOfCheckSheet },
              { "inner.tableRowId": rowData.tableRowId },
            ],
          }
        );
      }
      // console.log(updateChecksheetRow);
      res.status(201).json({
        message: "CheckSheet data updated successfully",
        flagForCycleChange,
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      res.status(409).json("user already exists!!!");
    }
  }
);

//delete selcted machine checksheet data row
router.post(
  "/deleteSelectedMachineChecksheetTableRowData",
  async (req, res) => {
    try {
      const { rowData, machineId, yearOfCheckSheet, isDeleted } = req.body;
      let deleteChecksheetRow, addFlagForDelete;
      // console.log(rowData, machineId, yearOfCheckSheet)

      if (isDeleted === true) {
        if (rowData.isAdded === true) {
          deleteChecksheetRow = await Machine.updateOne(
            {
              machine_code: machineId,
              "checkSheet_data.current_year": yearOfCheckSheet,
            },
            {
              $pull: {
                "checkSheet_data.$[outer].checkSheet": {
                  tableRowId: rowData.tableRowId,
                },
              },
            },
            {
              arrayFilters: [{ "outer.current_year": yearOfCheckSheet }],
            }
          );
        } else {
          addFlagForDelete = await Machine.updateOne(
            {
              machine_code: machineId,
            },
            {
              $set: {
                "checkSheet_data.$[outer].checkSheet.$[inner].isDeleted":
                  isDeleted,
                "checkSheet_data.$[outer].flagForRevisionContent": true,
                "checkSheet_data.$[outer].isDeletedMonth": new Date(),
              },
            },
            {
              arrayFilters: [
                { "outer.current_year": yearOfCheckSheet },
                { "inner.tableRowId": rowData.tableRowId },
              ],
            }
          );
        }
      } else {
        deleteChecksheetRow = await Machine.updateOne(
          {
            machine_code: machineId,
            "checkSheet_data.current_year": yearOfCheckSheet,
          },
          {
            $pull: {
              "checkSheet_data.$[outer].checkSheet": {
                tableRowId: rowData.tableRowId,
              },
            },
          },
          {
            arrayFilters: [{ "outer.current_year": yearOfCheckSheet }],
          }
        );
      }

      if (deleteChecksheetRow || addFlagForDelete) {
        return res.status(201).json("Checksheet row deleted!!!");
      } else {
        return res.status(400).json("Checksheet row not deleted!!!");
      }
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("Data not valid or received !!!");
    }
  }
);

//get TL/HOSS and MTD HOS list for approval
router.get("/getListForApproval", authenticate, async (req, res) => {
  try {
    let loggedUserData = req.rootUser;

    // console.log(loggedUserData?.plant_data)

    let sectionSplit = loggedUserData.section_data.split("-");
    const sectionInfo = await Section.findOne({ section_id: sectionSplit[0] });

    const HODList = await User.find({
      plant_data: loggedUserData.plant_data,
      user_type: "Plant-Admin",
    });

    let TLlist,
      HOSlist,
      PRDHOSlist,
      MTDHODlist,
      PRDHODlist,
      PRDTLlist,
      supportingOperatorList,
      allUser,
      MTDTLlist,
      MTDTLandOperatorList,
      supportingOperatorListArray,
      supportingOperatorListForReportDashboard = [];

    PRDHODlist = await User.find(
      {
        plant_data: loggedUserData.plant_data,
        user_type: "Plant-Admin",
        tm_grade: "HOD",
        tm_department: "PRD",
      },
      { tm_name: 1, email: 1, _id: 0 }
    );

    if (sectionInfo.dashboardLevel === "Yes") {
      TLlist = await User.find(
        {
          section_data: loggedUserData.section_data,
          user_type: "TL/HOSS",
          tm_no: { $ne: loggedUserData.tm_no },
        },
        { tm_name: 1, email: 1, _id: 0 }
      );

      HOSlist = await User.find({
        section_data: loggedUserData.section_data,
        tm_grade: "HOS",
        tm_department: "MTD",
      });

      PRDHOSlist = await User.find(
        {
          section_data: loggedUserData.section_data,
          tm_grade: "HOS",
          tm_department: "PRD",
        },
        { tm_name: 1, email: 1, _id: 0 }
      );

      MTDHODlist = await User.find(
        {
          plant_data: loggedUserData.plant_data,
          user_type: "Plant-Admin",
          tm_grade: "HOD",
          tm_department: "MTD",
        },
        { tm_name: 1, email: 1, _id: 0 }
      );

      PRDHODlist = await User.find(
        {
          plant_data: loggedUserData.plant_data,
          user_type: "Plant-Admin",
          tm_grade: "HOD",
          tm_department: "PRD",
        },
        { tm_name: 1, email: 1, _id: 0 }
      );

      PRDTLlist = await User.find({
        section_data: loggedUserData.section_data,
        user_type: "TL/HOSS",
        tm_no: { $ne: loggedUserData.tm_no },
        tm_department: "PRD",
      });

      supportingOperatorList = await User.find({
        section_data: loggedUserData.section_data,
        user_type: "Operator",
        tm_no: { $ne: loggedUserData.tm_no },
      });

      supportingOperatorListForReportDashboard = await User.find({
        section_data: loggedUserData.section_data,
        user_type: "Operator",
      });

      MTDTLlist = await User.find({
        section_data: loggedUserData.section_data,
        user_type: "TL/HOSS",
        tm_no: { $ne: loggedUserData.tm_no },
        tm_department: "MTD",
      });

      MTDTLandOperatorList = await User.find({
        $or: [
          {
            section_data: loggedUserData.section_data,
            user_type: "TL/HOSS",
            tm_no: { $ne: loggedUserData.tm_no },
            tm_department: "MTD",
          },
          {
            section_data: loggedUserData.section_data,
            user_type: "Operator",
            tm_no: { $ne: loggedUserData.tm_no },
          },
        ],
      });

      allUser = await User.find({
        section_data: loggedUserData.section_data,
        tm_no: { $ne: loggedUserData.tm_no },
      });

      // supportingOperatorList.map((key) => {
      //     supportingOperatorListArray.push(key.tm_name)
      // })
    } else {
      TLlist = await User.find(
        {
          section_data: loggedUserData.section_data,
          subSection_data: { $in: loggedUserData.subSection_data },
          user_type: "TL/HOSS",
          tm_no: { $ne: loggedUserData.tm_no },
        },
        { tm_name: 1, email: 1, _id: 0 }
      );

      HOSlist = await User.find({
        section_data: loggedUserData.section_data,
        subSection_data: { $in: loggedUserData.subSection_data },
        tm_grade: "HOS",
        tm_department: "MTD",
      });

      PRDHOSlist = await User.find(
        {
          section_data: loggedUserData.section_data,
          subSection_data: { $in: loggedUserData.subSection_data },
          tm_grade: "HOS",
          tm_department: "PRD",
        },
        { tm_name: 1, email: 1, _id: 0 }
      );

      MTDHODlist = await User.find(
        {
          plant_data: loggedUserData.plant_data,
          user_type: "Plant-Admin",
          tm_grade: "HOD",
          tm_department: "MTD",
        },
        { tm_name: 1, email: 1, _id: 0 }
      );

      // PRDHODlist = await User.find({ plant_data: loggedUserData.plant_data, user_type: "Plant-Admin", tm_grade: "HOD", tm_department: "PRD" }, { tm_name: 1, email: 1, _id: 0 })

      PRDTLlist = await User.find({
        section_data: loggedUserData.section_data,
        subSection_data: { $in: loggedUserData.subSection_data },
        user_type: "TL/HOSS",
        tm_no: { $ne: loggedUserData.tm_no },
        tm_department: "PRD",
      });

      supportingOperatorList = await User.find({
        section_data: loggedUserData.section_data,
        subSection_data: { $in: loggedUserData.subSection_data },
        user_type: "Operator",
        tm_no: { $ne: loggedUserData.tm_no },
      });

      supportingOperatorListForReportDashboard = await User.find({
        section_data: loggedUserData.section_data,
        subSection_data: { $in: loggedUserData.subSection_data },
        user_type: "Operator",
      });

      MTDTLlist = await User.find({
        section_data: loggedUserData.section_data,
        subSection_data: { $in: loggedUserData.subSection_data },
        user_type: "TL/HOSS",
        tm_no: { $ne: loggedUserData.tm_no },
        tm_department: "MTD",
      });

      MTDTLandOperatorList = await User.find(
        {
          $or: [
            {
              section_data: loggedUserData.section_data,
              subSection_data: { $in: loggedUserData.subSection_data },
              user_type: "TL/HOSS",
              tm_no: { $ne: loggedUserData.tm_no },
              tm_department: "MTD",
            },
            {
              section_data: loggedUserData.section_data,
              subSection_data: { $in: loggedUserData.subSection_data },
              user_type: "Operator",
              tm_no: { $ne: loggedUserData.tm_no },
            },
          ],
        },
        { tm_name: 1, _id: 0 }
      );

      // PRDTLlist = await User.find({ section_data: loggedUserData.section_data, subSection_data: { $in: loggedUserData.subSection_data }, user_type: "TL/HOSS", tm_no: { $ne: loggedUserData.tm_no }, tm_department: "PRD" }, { tm_name: 1, email: 1, _id: 0 })

      // supportingOperatorList = await User.find({ section_data: loggedUserData.section_data, subSection_data: { $in: loggedUserData.subSection_data }, user_type: "Operator", tm_department: "MTD", tm_no: { $ne: loggedUserData.tm_no } })

      // MTDTLlist = await User.find({ section_data: loggedUserData.section_data, subSection_data: { $in: loggedUserData.subSection_data }, user_type: "TL/HOSS", tm_no: { $ne: loggedUserData.tm_no }, tm_department: "MTD" }, { tm_name: 1, email: 1, _id: 0 })

      // MTDTLandOperatorList = await User.find({
      //     $or: [
      //         { section_data: loggedUserData.section_data, subSection_data: { $in: loggedUserData.subSection_data }, user_type: "TL/HOSS", tm_no: { $ne: loggedUserData.tm_no }, tm_department: "MTD" },
      //         { section_data: loggedUserData.section_data, subSection_data: { $in: loggedUserData.subSection_data }, user_type: "Operator", tm_department: "MTD", tm_no: { $ne: loggedUserData.tm_no } }
      //     ]
      // }, { tm_name: 1, _id: 0 })

      allUser = await User.find({
        section_data: loggedUserData.section_data,
        subSection_data: { $in: loggedUserData.subSection_data },
        tm_no: { $ne: loggedUserData.tm_no },
      });

      // supportingOperatorList.map((key) => {
      //     supportingOperatorListArray.push(key.tm_name)
      // })
    }

    // console.log(PRDHODlist, loggedUserData.plant_data)

    res.json({
      TLlist,
      HOSlist,
      PRDHOSlist,
      MTDHODlist,
      PRDHODlist,
      PRDTLlist,
      supportingOperatorList,
      MTDTLlist,
      allUser,
      MTDTLandOperatorList,
      supportingOperatorListForReportDashboard,
      HODList,
    });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log("User data not send or get!!!");
    console.log(error);
  }
});

//send request for approval for ALL checksheet approval flow
router.post("/sendRequestForApproval", authenticate, async (req, res) => {
  try {
    let loggedUserData = req.rootUser;

    let monthKeyArray = {
      Apr: [],

      May: [],

      June: [],

      July: [],

      Aug: [],

      Sep: [],

      Oct: [],

      Nov: [],

      Dec: [],

      Jan: [],

      Feb: [],

      Mar: [],
    };

    let KeyFor6MonthApproval = {
      Sep: [],

      Mar: [],
    };

    const monthKeyArrayForHODApproval = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "June",
      "July",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    let monthForCompareSystemMonthForHODApproval =
      monthKeyArray[new Date().getMonth()];

    // console.log(loggedUserData.email)
    const {
      request,
      tl_list,
      hos_list,
      selected_machine_data,
      prd_tl_list,
      phaseStatus,
      preparation_TL_date,
      planning_TL_date,
      machine_code,
      monthForCompareSystemMonth,
      implemetation_completed_date,
      // prd_tl_list,
      mtd_tl_list,
      mtd_hos_list,
      mtd_hod_list,
    } = req.body;
    // console.log(prd_tl_list, monthForCompareSystemMonth, selected_machine_data)
    // console.log("tl --->", tl_list, "hos ===> ", hos_list, "prd ----> ", prd_tl_list)
    let keyOfImplementation_assign_PRD_TL = `checkSheet_data.$[outer].implementation_assign_PRD_TL.${monthForCompareSystemMonth}`;
    let keyOfImplementation_assign_MTD_TL = `checkSheet_data.$[outer].implementation_assign_MTD_TL.${monthForCompareSystemMonth}`;
    let keyOfImplementation_assign_MTD_HOS = `checkSheet_data.$[outer].implementation_assign_MTD_HOS.${monthForCompareSystemMonth}`;

    let keyOfImplemetation_prd_tl_approval_status = `checkSheet_data.$[outer].implemetation_prd_tl_approval_status.${monthForCompareSystemMonth}`;
    let keyOfImplemetation_mtd_hos_approval_status = `checkSheet_data.$[outer].implemetation_mtd_hos_approval_status.${monthForCompareSystemMonth}`;
    let keyOfImplemetation_completed_date = `checkSheet_data.$[outer].implemetation_completed_date.${monthForCompareSystemMonth}`;
    let keyOfImplementation_due_date = `checkSheet_data.$[outer].implementation_due_date.${monthForCompareSystemMonth}`;

    let keyOfImplemetation_completed_tm_no = `checkSheet_data.$[outer].implemetation_completed_tm_no.${monthForCompareSystemMonth}`;
    let keyOfImplemetation_completed_tm_name = `checkSheet_data.$[outer].implemetation_completed_tm_name.${monthForCompareSystemMonth}`;
    let keyOfImplemetation_mtd_tl_approval_status = `checkSheet_data.$[outer].implemetation_mtd_tl_approval_status.${monthForCompareSystemMonth}`;

    let keyOfImplementation_assign_PRD_TL_name = `checkSheet_data.$[outer].implementation_assign_PRD_TL_name.${monthForCompareSystemMonth}`;
    let keyOfImplementation_assign_PRD_TL_tm_no = `checkSheet_data.$[outer].implementation_assign_PRD_TL_tm_no.${monthForCompareSystemMonth}`;
    let keyOfImplementation_assign_MTD_TL_name = `checkSheet_data.$[outer].implementation_assign_MTD_TL_name.${monthForCompareSystemMonth}`;
    let keyOfImplementation_assign_MTD_TL_tm_no = `checkSheet_data.$[outer].implementation_assign_MTD_TL_tm_no.${monthForCompareSystemMonth}`;
    let keyOfImplementation_assign_MTD_HOS_name = `checkSheet_data.$[outer].implementation_assign_MTD_HOS_name.${monthForCompareSystemMonth}`;
    let keyOfImplementation_assign_MTD_HOS_tm_no = `checkSheet_data.$[outer].implementation_assign_MTD_HOS_tm_no.${monthForCompareSystemMonth}`;

    let keyOfImplementation_assign_MTD_HOD = `checkSheet_data.$[outer].implementation_assign_MTD_HOD.${monthForCompareSystemMonth}`;
    let keyOfImplemetation_mtd_hod_approval_status = `checkSheet_data.$[outer].implemetation_mtd_hod_approval_status.${monthForCompareSystemMonth}`;
    let keyOfImplementation_assign_MTD_HOD_name = `checkSheet_data.$[outer].implementation_assign_MTD_HOD_name.${monthForCompareSystemMonth}`;

    const checksheet_status = "Preparation";

    let subject, title, greetings, bodyTable, sectionRelatedUser;

    let machineLastDataForKeyexistsOrNot = await Machine.aggregate([
      {
        $match: {
          machine_code: selected_machine_data.machine_code,
        },
      },
      { $unwind: "$checkSheet_data" },
      {
        $match: {
          "checkSheet_data.current_year":
            selected_machine_data.checkSheet_data.current_year,
        },
      },
      {
        $project: {
          machine_code: 1,
          machine_name: 1,
          machine_nickname: 1,
          machine_sequence: 1,
          installation_date: 1,
          maker_name: 1,
          maker_sr_no: 1,
          manufacturingDate: 1,
          isPM: 1,
          line_names: 1,
          checkSheet_data: 1,
        },
      },
    ]);

    // let tableStyle = "font-family: arial, sans-serif;border-collapse: collapse;width: 100%;"
    // let tdStyle = "border: 1px solid black;text-align: left;padding: 8px;"

    const sectionInfo = await Section.findOne({
      section_id: loggedUserData?.section_data?.split("-")?.[0],
    });

    if (request === "Yes" && tl_list?.email != "") {
      //for grreting of the mail
      const findAssignTlName = await User.findOne({
        tm_no: tl_list?.tm_no,
        email: tl_list?.email,
      });
      const findAssignHosName = await User.findOne({
        tm_no: hos_list?.tm_no,
        email: hos_list?.email,
      });

      const updateChecksheetStatus = await Machine.updateOne(
        { machine_code: selected_machine_data.machine_code },
        {
          $set: {
            "checkSheet_data.$[outer].checksheet_status": checksheet_status,
            "checkSheet_data.$[outer].flagForRevisionContent": false,
            "checkSheet_data.$[outer].flagForNewRevisionContentDataAdded": false,
          },
          $push: {
            "checkSheet_data.$[outer].tl_approval_status": "Pending",
            "checkSheet_data.$[outer].hos_approval_status": "Pending",
            "checkSheet_data.$[outer].assign_TL": tl_list?.email,
            "checkSheet_data.$[outer].assign_TL_name":
              findAssignTlName?.tm_name,
            "checkSheet_data.$[outer].assign_HOS": hos_list?.email,
            "checkSheet_data.$[outer].assign_HOS_name":
              findAssignHosName?.tm_name,
            "checkSheet_data.$[outer].sender_tm_no": loggedUserData?.tm_no,
            "checkSheet_data.$[outer].sender_tm_name": loggedUserData?.tm_name,
            "checkSheet_data.$[outer].checkSheetSendingUser":
              loggedUserData?.email,
            "checkSheet_data.$[outer].preparation_TL_date": preparation_TL_date,
          },
        },
        {
          arrayFilters: [
            {
              "outer.current_year":
                selected_machine_data.checkSheet_data.current_year,
            },
          ],
        }
      );

      subject = `Checksheet Preparation Approval (${selected_machine_data?.line_names?.cell_names?.cell_name}/${selected_machine_data?.line_names?.line_name}/${selected_machine_data?.machine_code})`;
      title = `Kindly Approve Check-sheet`;
      greetings = `Sir\\Ma'am`;
      bodyTable = `<table style="font-family: arial, sans-serif;border-collapse: collapse;width: 100%;">
          
            <tr>
              <td style="border: 1px solid black;text-align: left;padding: 8px;">Cell/Product</td>
              <td style="border: 1px solid black;text-align: left;padding: 8px;">${selected_machine_data?.line_names?.cell_names?.cell_name}</td>
            </tr>
            
            <tr style="background-color: #dddddd;">
              <td style="border: 1px solid black;text-align: left;padding: 8px;">Line</td>
              <td style="border: 1px solid black;text-align: left;padding: 8px;">${selected_machine_data?.line_names?.line_name}</td>
            </tr>

            <tr>
                <td style="border: 1px solid black;text-align: left;padding: 8px;">Machine</td>
                <td style="border: 1px solid black;text-align: left;padding: 8px;">${selected_machine_data?.machine_name}</td>
            </tr>
            
            <tr style="background-color: #dddddd;">
                <td style="border: 1px solid black;text-align: left;padding: 8px;">Machine No.</td>
                <td style="border: 1px solid black;text-align: left;padding: 8px;">${selected_machine_data?.machine_code}</td>
            </tr>
             
            <tr>
              <td style="border: 1px solid black;text-align: left;padding: 8px;">Submitted by</td>
              <td style="border: 1px solid black;text-align: left;padding: 8px;">${loggedUserData?.tm_name}</td>
            </tr>   
            
          </table>`;

      //send approval to TL/HOSS after his/her approval send request to HOS
      sendApproval(
        subject,
        title,
        greetings,
        bodyTable,
        undefined,
        findAssignTlName.tm_name,
        loggedUserData.tm_no,
        loggedUserData.tm_name,
        selected_machine_data.machine_code,
        selected_machine_data.machine_name,
        checksheet_status,
        tl_list?.email,
        hos_list?.email,
        undefined,
        undefined,
        request
      );
      return res.status(201).json("approval request send successfully!!!");
    } else if (prd_tl_list?.email && phaseStatus === "Planning") {
      //for grreting of the mail
      const findAssignTlName = await User.findOne({
        tm_no: prd_tl_list?.tm_no,
        email: prd_tl_list?.email,
      });

      if (sectionInfo?.dashboardLevel === "Yes") {
        sectionRelatedUser = await User.find({
          section_data: loggedUserData?.section_data,
          tm_department: "MTD",
          tm_grade: "HOS",
        });
      } else {
        sectionRelatedUser = await User.find({
          section_data: loggedUserData.section_data,
          tm_department: "MTD",
          tm_grade: "HOS",
          subSection_data: { $in: loggedUserData.subSection_data },
        });
      }

      let ccMail = sectionRelatedUser?.map((result) =>
        result?.email ? result?.email : undefined
      );
      // console.log(sectionRelatedUser, ccMail)
      // console.log(sectionRelatedUser?.length)

      // console.log(sectionRelatedUser?.map((result) => result?.email ? result?.email : undefined))

      const updateChecksheetStatus = await Machine.updateOne(
        { machine_code: selected_machine_data.machine_code },
        {
          $set: {
            "checkSheet_data.$[outer].flagForRevisionContent": false,

            "checkSheet_data.$[outer].flagForNewRevisionContentDataAdded": false,
          },
          $push: {
            "checkSheet_data.$[outer].prd_tl_approval_status": "Pending",
            "checkSheet_data.$[outer].assign_PRD_TL": prd_tl_list?.email,
            "checkSheet_data.$[outer].assign_PRD_TL_name":
              findAssignTlName?.tm_name,
            "checkSheet_data.$[outer].plan_prepared_tm_no":
              loggedUserData?.tm_no,
            "checkSheet_data.$[outer].plan_prepared_tm_name":
              loggedUserData?.tm_name,
            "checkSheet_data.$[outer].plan_prepared_email":
              loggedUserData?.email,
            "checkSheet_data.$[outer].planning_TL_date": planning_TL_date,
          },
        },
        {
          arrayFilters: [
            {
              "outer.current_year":
                selected_machine_data.checkSheet_data.current_year,
            },
          ],
        }
      );

      subject = `Checksheet Planning Approval (${selected_machine_data?.line_names?.cell_names?.cell_name}/${selected_machine_data?.line_names?.line_name}/${selected_machine_data?.machine_code})`;
      title = `Kindly approved Checksheet for Planning(FY${selected_machine_data?.checkSheet_data?.current_year})`;
      greetings = `${findAssignTlName.tm_name}`;
      bodyTable = `<table style="font-family: arial, sans-serif;border-collapse: collapse;width: 100%;">
          
            <tr>
              <td style="border: 1px solid black;text-align: left;padding: 8px;">Cell/Product</td>
              <td style="border: 1px solid black;text-align: left;padding: 8px;">${selected_machine_data?.line_names?.cell_names?.cell_name}</td>
            </tr>
            
            <tr style="background-color: #dddddd;">
              <td style="border: 1px solid black;text-align: left;padding: 8px;">Line</td>
              <td style="border: 1px solid black;text-align: left;padding: 8px;">${selected_machine_data?.line_names?.line_name}</td>
            </tr>

            <tr>
                <td style="border: 1px solid black;text-align: left;padding: 8px;">Machine</td>
                <td style="border: 1px solid black;text-align: left;padding: 8px;">${selected_machine_data?.machine_name}</td>
            </tr>
            
            <tr style="background-color: #dddddd;">
                <td style="border: 1px solid black;text-align: left;padding: 8px;">Machine No.</td>
                <td style="border: 1px solid black;text-align: left;padding: 8px;">${selected_machine_data?.machine_code}</td>
            </tr>
             
            <tr>
              <td style="border: 1px solid black;text-align: left;padding: 8px;">Submitted by</td>
              <td style="border: 1px solid black;text-align: left;padding: 8px;">${loggedUserData?.tm_name}</td>
            </tr>   
            
          </table>`;

      //send approval to TL/HOSS after his/her approval send request to HOS
      sendApproval(
        subject,
        title,
        greetings,
        bodyTable,
        ccMail,
        findAssignTlName.tm_name,
        loggedUserData.tm_no,
        loggedUserData.tm_name,
        selected_machine_data.machine_code,
        selected_machine_data.machine_name,
        selected_machine_data.checksheet_status,
        prd_tl_list?.email,
        undefined,
        undefined,
        undefined,
        undefined
      );
      return res.status(201).json("approval request send successfully!!!");
    } else if (
      prd_tl_list?.tm_no && //change prd_tl_list.email to tm_no for DENSO-INDIA
      mtd_tl_list?.tm_no && //change mtd_tl_list.email to tm_no for DENSO-INDIA
      mtd_hos_list?.email &&
      phaseStatus === "Implementation"
    ) {
      // if (selected_machine_data?.checkSheet_data?.totalPMTime?.[monthForCompareSystemMonth]?.totalWorkedPMTime === "" ||
      //     selected_machine_data?.checkSheet_data?.totalPMTime?.[monthForCompareSystemMonth]?.totalWorkedPMTime === undefined) {
      //     return res.status(409).json("PM time & supporting TM not entering!!!");

      // } else {

      // console.log(machineLastDataForKeyexistsOrNot)
      // const keyExistsCheck = await Machine.findOne({ machine_code: selected_machine_data.machine_code, "checkSheet_data.implemetation_completed_date": { $exists: true } });

      if (
        !machineLastDataForKeyexistsOrNot[0].checkSheet_data
          .implemetation_completed_date
      ) {
        const updateImplementationData = await Machine.updateOne(
          { machine_code: selected_machine_data.machine_code },
          {
            $set: {
              "checkSheet_data.$[outer].implemetation_completed_date":
                monthKeyArray,
              "checkSheet_data.$[outer].implemetation_completed_tm_no":
                monthKeyArray,
              "checkSheet_data.$[outer].implemetation_completed_tm_name":
                monthKeyArray,
              "checkSheet_data.$[outer].implementation_assign_PRD_TL":
                monthKeyArray,
              "checkSheet_data.$[outer].implementation_assign_MTD_TL":
                monthKeyArray,
              "checkSheet_data.$[outer].implementation_assign_MTD_HOS":
                monthKeyArray,
              "checkSheet_data.$[outer].implemetation_prd_tl_approval_status":
                monthKeyArray,
              "checkSheet_data.$[outer].implemetation_mtd_tl_approval_status":
                monthKeyArray,
              "checkSheet_data.$[outer].implemetation_mtd_hos_approval_status":
                monthKeyArray,
            },
          },
          {
            arrayFilters: [
              {
                "outer.current_year":
                  selected_machine_data.checkSheet_data.current_year,
              },
            ],
          }
        );
      }
      console.log(
        "implemetation_completed_date-----",
        implemetation_completed_date
      );
      const updateImplementationCompletionPhase = await Machine.updateOne(
        { machine_code: selected_machine_data.machine_code },
        {
          $push: {
            [keyOfImplemetation_prd_tl_approval_status]: "Pending",
            [keyOfImplemetation_mtd_tl_approval_status]: "Pending",
            [keyOfImplemetation_mtd_hos_approval_status]: "Pending",
            [keyOfImplementation_assign_PRD_TL]: prd_tl_list?.email,
            [keyOfImplementation_assign_MTD_TL]: mtd_tl_list?.email,
            [keyOfImplementation_assign_MTD_HOS]: mtd_hos_list?.email,
            [keyOfImplementation_assign_PRD_TL_name]: prd_tl_list?.tm_name,
            [keyOfImplementation_assign_PRD_TL_tm_no]: prd_tl_list?.tm_no,
            [keyOfImplementation_assign_MTD_TL_name]: mtd_tl_list?.tm_name,
            [keyOfImplementation_assign_MTD_TL_tm_no]: mtd_tl_list?.tm_no,
            [keyOfImplementation_assign_MTD_HOS_name]: mtd_hos_list?.tm_name,
            [keyOfImplementation_assign_MTD_HOS_tm_no]: mtd_hos_list?.tm_no,
            [keyOfImplemetation_completed_tm_no]: loggedUserData?.tm_no,
            [keyOfImplemetation_completed_tm_name]: loggedUserData?.tm_name,
            [keyOfImplemetation_completed_date]: implemetation_completed_date,
            [keyOfImplementation_due_date]: moment(
              implemetation_completed_date,
              "D/M/YYYY - hh:mm A"
            )
              .add(
                parseInt(
                  machineLastDataForKeyexistsOrNot[0]?.checkSheet_data?.checkSheet?.[0]?.cycle?.match(
                    /^(\d+)\/(\d+)M$/
                  )?.[2] || 1
                ),
                "M" || "y"
              )
              .format("DD-MM-YYYY THH:mm"),
          },
        },
        {
          arrayFilters: [
            {
              "outer.current_year":
                selected_machine_data.checkSheet_data.current_year,
            },
          ],
        }
      );
      // console.log(updateImplementationCompletionPhase)
      // console.log(prd_tl_list, mtd_tl_list, mtd_hos_list)

      let ccMail = [mtd_tl_list?.email, mtd_hos_list?.email];
      // for grreting of the mail
      const findAssignTlName = await User.findOne({
        tm_no: prd_tl_list?.tm_no,
        email: prd_tl_list?.email,
      });

      subject = `Checksheet Approval Plan vs Actual (${selected_machine_data?.line_names?.cell_names?.cell_name}/${selected_machine_data?.line_names?.line_name}/${selected_machine_data?.machine_code})`;
      title = `Kindly Approve after Quality Check`;
      greetings = `${findAssignTlName.tm_name} San`;
      bodyTable = `<table style="font-family: arial, sans-serif;border-collapse: collapse;width: 100%;">
              
                <tr>
                  <td style="border: 1px solid black;text-align: left;padding: 8px;">Cell/Product</td>
                  <td style="border: 1px solid black;text-align: left;padding: 8px;">${selected_machine_data?.line_names?.cell_names?.cell_name}</td>
                </tr>
                
                <tr style="background-color: #dddddd;">
                  <td style="border: 1px solid black;text-align: left;padding: 8px;">Line</td>
                  <td style="border: 1px solid black;text-align: left;padding: 8px;">${selected_machine_data?.line_names?.line_name}</td>
                </tr>
    
                <tr>
                    <td style="border: 1px solid black;text-align: left;padding: 8px;">Machine</td>
                    <td style="border: 1px solid black;text-align: left;padding: 8px;">${selected_machine_data?.machine_name}</td>
                </tr>
                
                <tr style="background-color: #dddddd;">
                    <td style="border: 1px solid black;text-align: left;padding: 8px;">Machine No.</td>
                    <td style="border: 1px solid black;text-align: left;padding: 8px;">${selected_machine_data?.machine_code}</td>
                </tr>
                 
                <tr>
                  <td style="border: 1px solid black;text-align: left;padding: 8px;">Done by</td>
                  <td style="border: 1px solid black;text-align: left;padding: 8px;">${loggedUserData?.tm_name}</td>
                </tr>
                   
                <tr style="background-color: #dddddd;">
                    <td style="border: 1px solid black;text-align: left;padding: 8px;">Date and Time</td>
                    <td style="border: 1px solid black;text-align: left;padding: 8px;">${implemetation_completed_date}</td>
                </tr>
                
              </table>`;

      //send approval to TL/HOSS after his/her approval send request to HOS
      sendApproval(
        subject,
        title,
        greetings,
        bodyTable,
        ccMail,
        findAssignTlName.tm_name,
        loggedUserData.tm_no,
        loggedUserData.tm_name,
        selected_machine_data.machine_code,
        selected_machine_data.machine_name,
        selected_machine_data.checksheet_status,
        prd_tl_list?.email,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined
      );

      return res.status(201).json("approval request send successfully!!!");

      // }
    } else if (
      (monthForCompareSystemMonthForHODApproval === "Sep" ||
        monthForCompareSystemMonthForHODApproval === "Mar") &&
      selected_machine_data?.checkSheet_data
        ?.implemetation_prd_tl_approval_status[
        selected_machine_data?.checkSheet_data
          ?.implemetation_prd_tl_approval_status?.length - 1
      ] === "Accepted" &&
      selected_machine_data?.checkSheet_data
        ?.implemetation_mtd_tl_approval_status[
        selected_machine_data?.checkSheet_data
          ?.implemetation_mtd_tl_approval_status?.length - 1
      ] === "Accepted" &&
      selected_machine_data?.checkSheet_data
        ?.implemetation_mtd_hos_approval_status[
        selected_machine_data?.checkSheet_data
          ?.implemetation_mtd_hos_approval_status?.length - 1
      ] === "Accepted"
    ) {
      if (
        !machineLastDataForKeyexistsOrNot[0]?.checkSheet_data
          ?.implementation_assign_MTD_HOD
      ) {
        const updateImplementationData = await Machine.updateOne(
          { machine_code: selected_machine_data.machine_code },
          {
            $set: {
              "checkSheet_data.$[outer].implementation_assign_MTD_HOD":
                KeyFor6MonthApproval,
              "checkSheet_data.$[outer].implementation_assign_MTD_HOD_name":
                KeyFor6MonthApproval,
              "checkSheet_data.$[outer].implementation_approved_by_MTD_HOD":
                KeyFor6MonthApproval,
              "checkSheet_data.$[outer].implementation_approved_MTD_HOD_date":
                KeyFor6MonthApproval,
              "checkSheet_data.$[outer].implemetation_mtd_hod_approval_status":
                KeyFor6MonthApproval,
            },
          },
          {
            arrayFilters: [
              {
                "outer.current_year":
                  selected_machine_data.checkSheet_data.current_year,
              },
            ],
          }
        );
        // console.log(updateImplementationData)
      }

      const updateImplementationCompletionPhase = await Machine.updateOne(
        { machine_code: selected_machine_data.machine_code },
        {
          $push: {
            [keyOfImplemetation_mtd_hod_approval_status]: "Pending",
            [keyOfImplementation_assign_MTD_HOD]: mtd_hod_list?.email,
            [keyOfImplementation_assign_MTD_HOD_name]: mtd_hod_list?.tm_name,
            [keyOfImplemetation_completed_date]: implemetation_completed_date,
          },
        },
        {
          arrayFilters: [
            {
              "outer.current_year":
                selected_machine_data.checkSheet_data.current_year,
            },
          ],
        }
      );
      return res.status(201).json("approval request send successfully!!!");
    } else {
      //for grreting of the mail
      const findAssignHosName = await User.findOne({
        tm_no: hos_list?.tm_no,
        email: hos_list?.email,
      });

      const updateChecksheetStatus = await Machine.updateOne(
        { machine_code: selected_machine_data.machine_code },
        {
          $set: {
            "checkSheet_data.$[outer].checksheet_status": checksheet_status,
            "checkSheet_data.$[outer].flagForRevisionContent": false,

            "checkSheet_data.$[outer].flagForNewRevisionContentDataAdded": false,
          },
          $push: {
            "checkSheet_data.$[outer].hos_approval_status": "Pending",
            "checkSheet_data.$[outer].assign_HOS": hos_list?.email,
            "checkSheet_data.$[outer].assign_HOS_name":
              findAssignHosName.tm_name,
            "checkSheet_data.$[outer].sender_tm_no": loggedUserData.tm_no,
            "checkSheet_data.$[outer].sender_tm_name": loggedUserData.tm_name,
            "checkSheet_data.$[outer].tl_approval_status": "",
            "checkSheet_data.$[outer].assign_TL": "",
            "checkSheet_data.$[outer].assign_TL_name": "",
            "checkSheet_data.$[outer].approved_by_TL": "",
            "checkSheet_data.$[outer].preparation_TL_date": preparation_TL_date,
            "checkSheet_data.$[outer].preparation_TL_HOSS_date": "",
            "checkSheet_data.$[outer].checkSheetSendingUser":
              loggedUserData?.email,
          },
        },
        {
          arrayFilters: [
            {
              "outer.current_year":
                selected_machine_data.checkSheet_data.current_year,
            },
          ],
        }
      );

      subject = `Checksheet Preparation Approval (${selected_machine_data?.line_names?.cell_names?.cell_name}/${selected_machine_data?.line_names?.line_name}/${selected_machine_data?.machine_code})`;
      title = `Kindly Approve Check-sheet`;
      greetings = `Sir\\Ma'am`;
      bodyTable = `<table style="font-family: arial, sans-serif;border-collapse: collapse;width: 100%;">
          
            <tr>
              <td style="border: 1px solid black;text-align: left;padding: 8px;">Cell/Product</td>
              <td style="border: 1px solid black;text-align: left;padding: 8px;">${selected_machine_data?.line_names?.cell_names?.cell_name}</td>
            </tr>
            
            <tr style="background-color: #dddddd;">
              <td style="border: 1px solid black;text-align: left;padding: 8px;">Line</td>
              <td style="border: 1px solid black;text-align: left;padding: 8px;">${selected_machine_data?.line_names?.line_name}</td>
            </tr>

            <tr>
                <td style="border: 1px solid black;text-align: left;padding: 8px;">Machine</td>
                <td style="border: 1px solid black;text-align: left;padding: 8px;">${selected_machine_data?.machine_name}</td>
            </tr>
            
            <tr style="background-color: #dddddd;">
                <td style="border: 1px solid black;text-align: left;padding: 8px;">Machine No.</td>
                <td style="border: 1px solid black;text-align: left;padding: 8px;">${selected_machine_data?.machine_code}</td>
            </tr>
             
            <tr>
              <td style="border: 1px solid black;text-align: left;padding: 8px;">Submitted by</td>
              <td style="border: 1px solid black;text-align: left;padding: 8px;">${loggedUserData?.tm_name}</td>
            </tr>   
            
          </table>`;

      //send approval direct MTD HOS
      sendApproval(
        subject,
        title,
        greetings,
        bodyTable,
        undefined,
        findAssignHosName.tm_name,
        loggedUserData.tm_no,
        loggedUserData.tm_name,
        selected_machine_data.machine_code,
        selected_machine_data.machine_name,
        checksheet_status,
        hos_list?.email,
        undefined,
        undefined,
        undefined,
        undefined,
        request
      );
      return res.status(201).json("approval request send successfully!!!");
    }
    // return res.status(201).json("approval request send successfully!!!");
    //  console.log(req.body)
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log(error);
    console.log("Data not valid or received !!!");
  }
});

//get approval request data for perticular user which was asssign by TL or Operator
router.get(
  "/getSixMonthApprovalRequestData/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  async (req, res) => {
    try {
      //  ------------------------------------- Real --------------------------------------------
      let keyOfImplemetation_mtd_hod_approval_status_sep = `$checkSheet_data.implemetation_mtd_hod_approval_status.Sep`;
      let keyOfImplemetation_mtd_hod_approval_status_mar = `$checkSheet_data.implemetation_mtd_hod_approval_status.Mar`;

      let requestData1, requestData2;

      requestData1 = await Machine.aggregate([
        { $match: req.queryObjForPM },
        {
          $unwind: "$checkSheet_data",
        },
        {
          $match: {
            "checkSheet_data.current_year": req?.query?.selectedYear,
            "checkSheet_data.implemetation_mtd_hod_approval_status": {
              $ne: undefined,
            },
            "checkSheet_data.checksheet_status": "Implementation",
          },
        },
        {
          $addFields: {
            senderApprovalMonth: {
              $getField: {
                field: "k",
                input: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: {
                          $objectToArray:
                            "$checkSheet_data.implemetation_mtd_hod_approval_status",
                        },
                        as: "approvalData",
                        cond: {
                          $eq: [
                            {
                              $arrayElemAt: ["$$approvalData.v", -1],
                            },
                            "Pending",
                          ],
                        },
                      },
                    },
                    0,
                  ],
                },
              },
            },
          },
        },
        {
          $match: {
            senderApprovalMonth: { $ne: undefined },
          },
        },
        {
          $lookup: {
            from: "lines",
            localField: "line_names",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  line_name: 1,
                },
              },
            ],
            as: "lines",
          },
        },
        {
          $lookup: {
            from: "cells",
            localField: "cell_names",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  cell_name: 1,
                },
              },
            ],
            as: "cells",
          },
        },
        {
          $project: {
            machine_name: 1,
            machine_code: 1,
            line_name: { $arrayElemAt: ["$lines.line_name", 0] },
            cell_name: { $arrayElemAt: ["$cells.cell_name", 0] },
            senderApprovalMonth: 1,
          },
        },
      ]);

      requestData2 = await Machine.aggregate([
        { $match: req.queryObjForPM },
        {
          $unwind: "$checkSheet_data",
        },
        {
          $match: {
            "checkSheet_data.current_year": req?.query?.selectedYear,
          },
        },
        {
          $addFields: {
            senderApprovalMonth: "Mar",
          },
        },
        {
          $match: {
            $and: [
              {
                $expr: {
                  $eq: [
                    {
                      $arrayElemAt: [
                        "$checkSheet_data.implemetation_mtd_hod_approval_status.Mar",
                        -1,
                      ],
                    },
                    "Pending",
                  ],
                },
              },
              {
                "checkSheet_data.checksheet_status": "Implementation",
              },
            ],
          },
        },
      ]);

      // console.log(requestData1,requestData2)

      // const requestData = await requestData1.concat(requestData2);

      const machineDataWithPopulate = await Machine.populate(requestData1, {
        path: "line_names",
        populate: { path: "cell_names", model: "Cells" },
      });

      res.json(machineDataWithPopulate);
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("User data not send or get!!!");
    }
  }
);

//get approval request data for Preparation phase
router.get(
  "/getApprovalRequestDataForPreparationPhase",
  authenticate,
  async (req, res) => {
    try {
      let loggedUserData = req.rootUser;
      const monthKeyArray = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "June",
        "July",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      let monthForCompareSystemMonth = monthKeyArray[new Date().getMonth()];

      let requestData, machineDataWithPopulate;
      if (loggedUserData.user_type === "TL/HOSS") {
        if (loggedUserData.tm_department === "MTD") {
          requestData = await Machine.aggregate([
            // { $addFields: { checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] } } },
            { $unwind: "$checkSheet_data" },
            {
              $match: {
                $and: [
                  {
                    $expr: {
                      $eq: [
                        { $arrayElemAt: ["$checkSheet_data.assign_TL", -1] },
                        loggedUserData?.email,
                      ],
                    },
                  },
                  {
                    $expr: {
                      $eq: [
                        {
                          $arrayElemAt: [
                            "$checkSheet_data.tl_approval_status",
                            -1,
                          ],
                        },
                        "Pending",
                      ],
                    },
                  },
                ],
              },
            },
          ]);
          machineDataWithPopulate = await Machine.populate(requestData, {
            path: "line_names",
            populate: { path: "cell_names", model: "Cells" },
          });
        }
      } else if (
        loggedUserData.user_type === "Section-Admin" &&
        loggedUserData.tm_grade === "HOS" &&
        loggedUserData.tm_department === "MTD"
      ) {
        requestData = await Machine.aggregate([
          // { $addFields: { checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] } } },
          { $unwind: "$checkSheet_data" },
          {
            $match: {
              $or: [
                {
                  $and: [
                    {
                      $expr: {
                        $eq: [
                          { $arrayElemAt: ["$checkSheet_data.assign_HOS", -1] },
                          loggedUserData?.email,
                        ],
                      },
                    },
                    {
                      $expr: {
                        $eq: [
                          {
                            $arrayElemAt: [
                              "$checkSheet_data.tl_approval_status",
                              -1,
                            ],
                          },
                          "Accepted",
                        ],
                      },
                    },
                    {
                      $expr: {
                        $eq: [
                          {
                            $arrayElemAt: [
                              "$checkSheet_data.hos_approval_status",
                              -1,
                            ],
                          },
                          "Pending",
                        ],
                      },
                    },
                    {
                      "checkSheet_data.checksheet_status": "Preparation",
                    },
                  ],
                },
                {
                  $and: [
                    {
                      $expr: {
                        $eq: [
                          {
                            $arrayElemAt: [
                              "$checkSheet_data.hos_approval_status",
                              -1,
                            ],
                          },
                          "Pending",
                        ],
                      },
                    },
                    {
                      $expr: {
                        $eq: [
                          { $arrayElemAt: ["$checkSheet_data.assign_TL", -1] },
                          "",
                        ],
                      },
                    },
                    {
                      $expr: {
                        $eq: [
                          { $arrayElemAt: ["$checkSheet_data.assign_HOS", -1] },
                          loggedUserData?.email,
                        ],
                      },
                    },
                    {
                      "checkSheet_data.checksheet_status": "Preparation",
                    },
                  ],
                },
              ],
            },
          },
        ]);
        // console.log(requestData)
        machineDataWithPopulate = await Machine.populate(requestData, {
          path: "line_names",
          populate: { path: "cell_names", model: "Cells" },
        });
      }

      // machineDataWithPopulate.map((item) => console.log(item?.machine_code))

      res.json(machineDataWithPopulate);
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("User data not send or get!!!");
    }
  }
);

//get approval request data for Planning phase
router.get(
  "/getApprovalRequestDataForPlanningPhase",
  authenticate,
  async (req, res) => {
    try {
      let loggedUserData = req.rootUser;
      const monthKeyArray = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "June",
        "July",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      let monthForCompareSystemMonth = monthKeyArray[new Date().getMonth()];

      let requestData, machineDataWithPopulate;
      if (loggedUserData.user_type === "TL/HOSS") {
        if (loggedUserData.tm_department === "PRD") {
          requestData = await Machine.aggregate([
            // { $addFields: { checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] } } },

            { $unwind: "$checkSheet_data" },
            {
              $match: {
                $and: [
                  {
                    $expr: {
                      $eq: [
                        {
                          $arrayElemAt: ["$checkSheet_data.assign_PRD_TL", -1],
                        },
                        loggedUserData?.email,
                      ],
                    },
                  },
                  {
                    $expr: {
                      $eq: [
                        {
                          $arrayElemAt: [
                            "$checkSheet_data.prd_tl_approval_status",
                            -1,
                          ],
                        },
                        "Pending",
                      ],
                    },
                  },
                ],
              },
            },
          ]);
          // console.log(requestData)
          machineDataWithPopulate = await Machine.populate(requestData, {
            path: "line_names",
            populate: { path: "cell_names", model: "Cells" },
          });
        }
      }

      // machineDataWithPopulate.map((item) => console.log(item?.machine_code))

      res.json(machineDataWithPopulate);
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("User data not send or get!!!");
    }
  }
);

//get approval request data for Implementation phase

router.get(
  "/getApprovalRequestDataForImplementationPhase/:selectedYear",
  authenticate,
  async (req, res) => {
    try {
      let loggedUserData = req.rootUser;

      const monthKeyArray = [
        "Jan",

        "Feb",

        "Mar",

        "Apr",

        "May",

        "June",

        "July",

        "Aug",

        "Sep",

        "Oct",

        "Nov",

        "Dec",
      ];

      let monthForCompareSystemMonth = monthKeyArray[new Date().getMonth()];

      const financialYearWiseMonthKeyArray = [
        "Apr",
        "May",
        "June",
        "July",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
        "Jan",
        "Feb",
        "Mar",
      ];

      let currentYear =
        new Date().getMonth() < 3
          ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
          : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

      let lengthOfTheMonthForCurrentYear = 12;

      if (currentYear === req?.params?.selectedYear) {
        lengthOfTheMonthForCurrentYear = financialYearWiseMonthKeyArray.indexOf(
          monthKeyArray[new Date().getMonth()]
        );
      }

      let requestData,
        machineDataWithPopulate,
        approvalDataOfDashboard = [];

      if (loggedUserData.user_type === "TL/HOSS") {
        if (loggedUserData.tm_department === "PRD") {
          for (
            let index = 0;
            index <= lengthOfTheMonthForCurrentYear &&
            index < financialYearWiseMonthKeyArray.length;
            index++
          ) {
            let keyOfImplementation_assign_PRD_TL = `$checkSheet_data.implementation_assign_PRD_TL.${financialYearWiseMonthKeyArray[index]}`;

            let keyOfImplementation_assign_PRD_TL_tm_no = `$checkSheet_data.implementation_assign_PRD_TL_tm_no.${financialYearWiseMonthKeyArray[index]}`;

            let keyOfImplemetation_prd_tl_approval_status = `$checkSheet_data.implemetation_prd_tl_approval_status.${financialYearWiseMonthKeyArray[index]}`;

            requestData = await Machine.aggregate([
              { $unwind: "$checkSheet_data" },

              {
                $match: {
                  "checkSheet_data.current_year": req?.params?.selectedYear,
                },
              },

              {
                $addFields: {
                  senderApprovalMonth: financialYearWiseMonthKeyArray[index],
                },
              },

              {
                $match: {
                  $and: [
                    {
                      $expr: {
                        $eq: [
                          {
                            $arrayElemAt: [
                              keyOfImplementation_assign_PRD_TL,
                              -1,
                            ],
                          },
                          loggedUserData?.email,
                        ],
                      },
                    },

                    {
                      $expr: {
                        $eq: [
                          {
                            $arrayElemAt: [
                              keyOfImplementation_assign_PRD_TL_tm_no,
                              -1,
                            ],
                          },
                          loggedUserData.tm_no,
                        ],
                      },
                    },

                    {
                      $expr: {
                        $eq: [
                          {
                            $arrayElemAt: [
                              keyOfImplemetation_prd_tl_approval_status,
                              -1,
                            ],
                          },
                          "Pending",
                        ],
                      },
                    },
                  ],
                },
              },
            ]);

            if (requestData[0]) {
              for (let i = 0; i < requestData?.length; i++) {
                approvalDataOfDashboard.push(requestData[i]);
              }
            }
          }

          // console.log(approvalDataOfDashboard)

          machineDataWithPopulate = await Machine.populate(
            approvalDataOfDashboard,
            {
              path: "line_names",
              populate: { path: "cell_names", model: "Cells" },
            }
          );
        } else {
          for (
            let index = 0;
            index <= lengthOfTheMonthForCurrentYear &&
            index < financialYearWiseMonthKeyArray.length;
            index++
          ) {
            let keyOfImplementation_assign_MTD_TL = `$checkSheet_data.implementation_assign_MTD_TL.${financialYearWiseMonthKeyArray[index]}`;

            let keyOfImplementation_assign_MTD_TL_tm_no = `$checkSheet_data.implementation_assign_MTD_TL_tm_no.${financialYearWiseMonthKeyArray[index]}`;

            let keyOfImplemetation_mtd_tl_approval_status = `$checkSheet_data.implemetation_mtd_tl_approval_status.${financialYearWiseMonthKeyArray[index]}`;

            let keyOfImplemetation_prd_tl_approval_status = `$checkSheet_data.implemetation_prd_tl_approval_status.${financialYearWiseMonthKeyArray[index]}`;

            requestData = await Machine.aggregate([
              { $unwind: "$checkSheet_data" },

              {
                $addFields: {
                  senderApprovalMonth: financialYearWiseMonthKeyArray[index],
                },
              },

              {
                $match: {
                  "checkSheet_data.current_year": req?.params?.selectedYear,
                },
              },

              // { $unwind: '$checkSheet_data' },

              {
                $match: {
                  $and: [
                    {
                      $expr: {
                        $eq: [
                          {
                            $arrayElemAt: [
                              keyOfImplementation_assign_MTD_TL,
                              -1,
                            ],
                          },
                          loggedUserData?.email,
                        ],
                      },
                    },

                    {
                      $expr: {
                        $eq: [
                          {
                            $arrayElemAt: [
                              keyOfImplementation_assign_MTD_TL_tm_no,
                              -1,
                            ],
                          },
                          loggedUserData.tm_no,
                        ],
                      },
                    },

                    {
                      $expr: {
                        $eq: [
                          {
                            $arrayElemAt: [
                              keyOfImplemetation_prd_tl_approval_status,
                              -1,
                            ],
                          },
                          "Accepted",
                        ],
                      },
                    },

                    {
                      $expr: {
                        $eq: [
                          {
                            $arrayElemAt: [
                              keyOfImplemetation_mtd_tl_approval_status,
                              -1,
                            ],
                          },
                          "Pending",
                        ],
                      },
                    },

                    {
                      "checkSheet_data.checksheet_status": "Implementation",
                    },
                  ],
                },
              },
            ]);

            if (requestData[0]) {
              for (let i = 0; i < requestData?.length; i++) {
                approvalDataOfDashboard.push(requestData[i]);
              }
            }
          }
        }

        // console.log(approvalDataOfDashboard)

        machineDataWithPopulate = await Machine.populate(
          approvalDataOfDashboard,
          {
            path: "line_names",
            populate: { path: "cell_names", model: "Cells" },
          }
        );

        // requestData = await Machine.find({ assign_TL: loggedUserData.email, tl_approval_status: "Pending" }).populate({path:"line_names",populate: {path: "cell_names", model: "Cells"} })
      } else if (
        loggedUserData.user_type === "Section-Admin" &&
        loggedUserData.tm_grade === "HOS" &&
        loggedUserData.tm_department === "MTD"
      ) {
        for (
          let index = 0;
          index <= lengthOfTheMonthForCurrentYear &&
          index < financialYearWiseMonthKeyArray.length;
          index++
        ) {
          let keyOfImplemetation_mtd_tl_approval_status = `$checkSheet_data.implemetation_mtd_tl_approval_status.${financialYearWiseMonthKeyArray[index]}`;

          let keyOfImplemetation_prd_tl_approval_status = `$checkSheet_data.implemetation_prd_tl_approval_status.${financialYearWiseMonthKeyArray[index]}`;

          let keyOfImplementation_assign_MTD_HOS = `$checkSheet_data.implementation_assign_MTD_HOS.${financialYearWiseMonthKeyArray[index]}`;

          let keyOfImplementation_assign_MTD_HOS_tm_no = `$checkSheet_data.implementation_assign_MTD_HOS_tm_no.${financialYearWiseMonthKeyArray[index]}`;

          let keyOfImplemetation_mtd_hos_approval_status = `$checkSheet_data.implemetation_mtd_hos_approval_status.${financialYearWiseMonthKeyArray[index]}`;

          requestData = await Machine.aggregate([
            { $unwind: "$checkSheet_data" },

            {
              $addFields: {
                senderApprovalMonth: financialYearWiseMonthKeyArray[index],
              },
            },

            {
              $match: {
                "checkSheet_data.current_year": req?.params?.selectedYear,
              },
            },

            // { $unwind: '$checkSheet_data' },

            {
              $match: {
                $and: [
                  {
                    $expr: {
                      $eq: [
                        {
                          $arrayElemAt: [
                            keyOfImplementation_assign_MTD_HOS,
                            -1,
                          ],
                        },
                        loggedUserData?.email,
                      ],
                    },
                  },

                  {
                    $expr: {
                      $eq: [
                        {
                          $arrayElemAt: [
                            keyOfImplementation_assign_MTD_HOS_tm_no,
                            -1,
                          ],
                        },
                        loggedUserData.tm_no,
                      ],
                    },
                  },

                  {
                    $expr: {
                      $eq: [
                        {
                          $arrayElemAt: [
                            keyOfImplemetation_prd_tl_approval_status,
                            -1,
                          ],
                        },
                        "Accepted",
                      ],
                    },
                  },

                  {
                    $expr: {
                      $eq: [
                        {
                          $arrayElemAt: [
                            keyOfImplemetation_mtd_tl_approval_status,
                            -1,
                          ],
                        },
                        "Accepted",
                      ],
                    },
                  },

                  {
                    $expr: {
                      $eq: [
                        {
                          $arrayElemAt: [
                            keyOfImplemetation_mtd_hos_approval_status,
                            -1,
                          ],
                        },
                        "Pending",
                      ],
                    },
                  },

                  {
                    "checkSheet_data.checksheet_status": "Implementation",
                  },
                ],
              },
            },
          ]);

          if (requestData[0]) {
            for (let i = 0; i < requestData?.length; i++) {
              approvalDataOfDashboard.push(requestData[i]);
            }
          }
        }

        // console.log(requestData)

        machineDataWithPopulate = await Machine.populate(
          approvalDataOfDashboard,
          {
            path: "line_names",
            populate: { path: "cell_names", model: "Cells" },
          }
        );
      }

      // machineDataWithPopulate.map((item) => console.log(item?.machine_code))

      res.json(machineDataWithPopulate);
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);

      console.log("User data not send or get!!!");
    }
  }
);

//Request approval from TL and HOS
router.post("/approveRequestFromTL_HOS_HOD", authenticate, async (req, res) => {
  try {
    const {
      request,
      rejected_remarks,
      selected_machine_data,
      selectedYear,
      approved_by_TL,
      approved_by_HOS,
      approved_by_PRD_TL,
      preparation_TL_HOSS_date,
      preparation_HOS_date,
      planning_PRD_TL_date,
      implementation_approved_PRD_TL_date,
      implementation_approved_by_PRD_TL,
      implementation_approved_by_MTD_TL,
      implementation_approved_MTD_TL_date,
      implementation_approved_by_MTD_HOS,
      implementation_approved_MTD_HOS_date,
      implemetation_quality_remarks,

      implementation_approved_by_MTD_HOD,
      implementation_approved_MTD_HOD_date,
      approval_remarks,
      senderApprovalMonth,
    } = req.body;
    let loggedUserData = req.rootUser;
    // console.log(selected_machine_data.checkSheetSendingUser[(selected_machine_data.checkSheetSendingUser).length - 1])
    const monthKeyArray = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "June",
      "July",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    let monthForCompareSystemMonth = monthKeyArray[new Date().getMonth()];

    // let previousMonth =
    //     monthKeyArray[new Date().getMonth() - 1] === undefined
    //         ? monthKeyArray.splice(-1)[0]
    //         : monthKeyArray[new Date().getMonth() - 1];

    let creationMonthKeyArray = {
      Apr: [],

      May: [],

      June: [],

      July: [],

      Aug: [],

      Sep: [],

      Oct: [],

      Nov: [],

      Dec: [],

      Jan: [],

      Feb: [],

      Mar: [],
    };

    const financialYearWiseMonthKeyArray = [
      "Apr",
      "May",
      "June",
      "July",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
      "Jan",
      "Feb",
      "Mar",
    ];
    let previousMonth =
      financialYearWiseMonthKeyArray[
        financialYearWiseMonthKeyArray.indexOf(senderApprovalMonth) - 1
      ];

    let PMStatusArray = {
      Apr: "",

      May: "",

      June: "",

      July: "",

      Aug: "",

      Sep: "",

      Oct: "",

      Nov: "",

      Dec: "",

      Jan: "",

      Feb: "",

      Mar: "",
    };
    let CurrentMonthPMScheduleOrNotStatusArray = {
      Apr: "",

      May: "",

      June: "",

      July: "",

      Aug: "",

      Sep: "",

      Oct: "",

      Nov: "",

      Dec: "",

      Jan: "",

      Feb: "",

      Mar: "",
    };

    let keyOfImplemetation_prd_tl_approval_status = `checkSheet_data.$[outer].implemetation_prd_tl_approval_status.${senderApprovalMonth}`;
    let keyOfImplemetation_mtd_tl_approval_status = `checkSheet_data.$[outer].implemetation_mtd_tl_approval_status.${senderApprovalMonth}`;
    let keyOfImplementation_approved_by_PRD_TL = `checkSheet_data.$[outer].implementation_approved_by_PRD_TL.${senderApprovalMonth}`;
    let keyOfImplementation_approved_PRD_TL_date = `checkSheet_data.$[outer].implementation_approved_PRD_TL_date.${senderApprovalMonth}`;
    let keyOfImplementation_rejected_remarks = `checkSheet_data.$[outer].implementation_rejected_remarks.${senderApprovalMonth}`;
    let keyOfImplementation_approved_by_MTD_TL = `checkSheet_data.$[outer].implementation_approved_by_MTD_TL.${senderApprovalMonth}`;
    let keyOfImplementation_approved_MTD_TL_date = `checkSheet_data.$[outer].implementation_approved_MTD_TL_date.${senderApprovalMonth}`;
    let keyOfImplemetation_mtd_hos_approval_status = `checkSheet_data.$[outer].implemetation_mtd_hos_approval_status.${senderApprovalMonth}`;
    let keyOfImplementation_approved_by_MTD_HOS = `checkSheet_data.$[outer].implementation_approved_by_MTD_HOS.${senderApprovalMonth}`;
    let keyOfImplementation_approved_MTD_HOS_date = `checkSheet_data.$[outer].implementation_approved_MTD_HOS_date.${senderApprovalMonth}`;
    let keyOfImplemetation_quality_remarks = `checkSheet_data.$[outer].implemetation_quality_remarks.${senderApprovalMonth}`;

    // let keyOfImplementation_approved_by_MTD_HOD = `checkSheet_data.$[outer].implementation_approved_by_MTD_HOD.Sep`
    // let keyOfImplementation_approved_MTD_HOD_date = `checkSheet_data.$[outer].implementation_approved_MTD_HOD_date.Sep`
    // let keyOfImplemetation_mtd_hod_approval_status = `checkSheet_data.$[outer].implemetation_mtd_hod_approval_status.Sep`

    let keyOfImplementation_approved_by_MTD_HOD = `checkSheet_data.$[outer].implementation_approved_by_MTD_HOD.${selected_machine_data?.senderApprovalMonth}`;
    let keyOfImplementation_approved_MTD_HOD_date = `checkSheet_data.$[outer].implementation_approved_MTD_HOD_date.${selected_machine_data?.senderApprovalMonth}`;
    let keyOfImplemetation_mtd_hod_approval_status = `checkSheet_data.$[outer].implemetation_mtd_hod_approval_status.${selected_machine_data?.senderApprovalMonth}`;
    let keyOfImplemetation_mtd_hod_approval_remarks = `checkSheet_data.$[outer].implementation_approval_hod_remarks.${selected_machine_data?.senderApprovalMonth}`;

    //storing all approval in done with delay in previous month
    let keyOfImplementation_approved_by_PRD_TL_for_doneWithDelay = `checkSheet_data.$[outer].implementation_approved_by_PRD_TL.${previousMonth}`;
    let keyOfImplementation_approved_by_MTD_TL_for_doneWithDelay = `checkSheet_data.$[outer].implementation_approved_by_MTD_TL.${previousMonth}`;
    let keyOfImplementation_approved_by_MTD_HOS_for_doneWithDelay = `checkSheet_data.$[outer].implementation_approved_by_MTD_HOS.${previousMonth}`;

    const sectionInfo = await Section.findOne({
      section_id: loggedUserData?.section_data?.split("-")?.[0],
    });

    // console.log(
    //     senderApprovalMonth, selected_machine_data.checkSheet_data.implemetation_prd_tl_approval_status
    // )

    let machineLastData = await Machine.aggregate([
      {
        $match: {
          machine_code: selected_machine_data?.machine_code,
        },
      },
      {
        $unwind: "$checkSheet_data",
      },
      {
        $match: {
          "checkSheet_data.current_year": selectedYear,
        },
      },
      {
        $lookup: {
          from: "lines",
          localField: "line_names",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                line_name: 1,
              },
            },
          ],
          as: "lines",
        },
      },
      {
        $lookup: {
          from: "cells",
          localField: "cell_names",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                cell_name: 1,
              },
            },
          ],
          as: "cells",
        },
      },
      {
        $project: {
          machine_code: 1,
          machine_name: 1,
          machine_nickname: 1,
          machine_sequence: 1,
          installation_date: 1,
          maker_name: 1,
          maker_sr_no: 1,
          manufacturingDate: 1,
          isPM: 1,
          line_name: { $arrayElemAt: ["$lines.line_name", 0] },
          cell_name: { $arrayElemAt: ["$cells.cell_name", 0] },
          checkSheet_data: 1,
        },
      },
    ]);

    if (request === "Yes") {
      if (
        machineLastData?.[0]?.checkSheet_data?.tl_approval_status?.[
          machineLastData?.[0].checkSheet_data?.tl_approval_status?.length - 1
        ] === "Pending"
      ) {
        let tlApproval = "Accepted";

        const requestSenderUserData = await User.findOne({
          tm_no:
            machineLastData[0]?.checkSheet_data?.sender_tm_no[
              machineLastData[0]?.checkSheet_data?.sender_tm_no?.length - 1
            ],
        });

        // console.log(
        //     machineLastData[0].tl_approval_status
        // )
        machineLastData[0].checkSheet_data.tl_approval_status[
          machineLastData[0].checkSheet_data.tl_approval_status.length - 1
        ] = "Accepted";
        const TLApprovalStatusUpdate = await Machine.updateOne(
          { machine_code: machineLastData[0].machine_code },
          {
            $set: {
              "checkSheet_data.$[outer].tl_approval_status":
                machineLastData[0].checkSheet_data.tl_approval_status,
              "checkSheet_data.$[outer].flagForRevisionContent": false,

              "checkSheet_data.$[outer].flagForNewRevisionContentDataAdded": false,
            },
            $push: {
              "checkSheet_data.$[outer].approved_by_TL": approved_by_TL,
              "checkSheet_data.$[outer].preparation_TL_HOSS_date":
                preparation_TL_HOSS_date,
            },
          },
          {
            arrayFilters: [
              {
                "outer.current_year":
                  machineLastData[0].checkSheet_data.current_year,
              },
            ],
          }
        );
        // console.log(TLApprovalStatusUpdate)
        const findAssignHosName = await User.findOne({
          email:
            machineLastData[0]?.checkSheet_data?.assign_HOS?.[
              machineLastData[0]?.checkSheet_data?.assign_HOS?.length - 1
            ],
        });

        subject = `Checksheet Preparation Approval (${machineLastData[0]?.cell_name}/${machineLastData[0]?.line_name}/${machineLastData[0]?.machine_code})`;
        title = `Checksheet is Approved`;
        greetings = `Sir\\Ma'am`;
        bodyTable = `<table style="font-family: arial, sans-serif;border-collapse: collapse;width: 100%;">

                        <tr>
                        <td style="border: 1px solid black;text-align: left;padding: 8px;">Cell/Product</td>
                        <td style="border: 1px solid black;text-align: left;padding: 8px;">${machineLastData[0]?.cell_name}</td>
                        </tr>

                        <tr style="background-color: #dddddd;">
                        <td style="border: 1px solid black;text-align: left;padding: 8px;">Line</td>
                        <td style="border: 1px solid black;text-align: left;padding: 8px;">${machineLastData[0]?.line_name}</td>
                        </tr>

                        <tr>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">Machine</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${machineLastData[0]?.machine_name}</td>
                        </tr>

                        <tr style="background-color: #dddddd;">
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">Machine No.</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${machineLastData[0]?.machine_code}</td>
                        </tr>

                        <tr>
                        <td style="border: 1px solid black;text-align: left;padding: 8px;">Approved by</td>
                        <td style="border: 1px solid black;text-align: left;padding: 8px;">${loggedUserData?.tm_name}</td>
                        </tr>   

                        <tr style="background-color: #dddddd;">
                        <td style="border: 1px solid black;text-align: left;padding: 8px;">Date and Time</td>
                        <td style="border: 1px solid black;text-align: left;padding: 8px;">${preparation_TL_HOSS_date}</td>
                        </tr>

                    </table>`;

        // console.log(
        //   "when click on button",
        //   machineLastData[0].checkSheet_data.assign_HOS[
        //     machineLastData[0].checkSheet_data.checkSheetSendingUser.length -
        //       1
        //   ]
        // );

        sendApproval(
          subject,
          title,
          greetings,
          bodyTable,
          undefined,
          findAssignHosName.tm_name,
          machineLastData[0].checkSheet_data.sender_tm_no[
            machineLastData[0].checkSheet_data.sender_tm_no.length - 1
          ],
          machineLastData[0].checkSheet_data.sender_tm_name[
            machineLastData[0].checkSheet_data.sender_tm_name.length - 1
          ],
          machineLastData[0].machine_code,
          machineLastData[0].machine_name,
          machineLastData[0].checkSheet_data.checksheet_status,
          requestSenderUserData?.user_type === "Operator"
            ? undefined
            : machineLastData[0].checkSheet_data.checkSheetSendingUser[
                machineLastData[0].checkSheet_data.checkSheetSendingUser
                  .length - 1
              ] || undefined,
          machineLastData[0].checkSheet_data.assign_HOS[
            machineLastData[0].checkSheet_data.checkSheetSendingUser.length - 1
          ],
          tlApproval,
          undefined,
          undefined
        );
      } else if (
        machineLastData[0]?.checkSheet_data?.tl_approval_status?.[
          machineLastData[0]?.checkSheet_data?.tl_approval_status?.length - 1
        ] === "Accepted" &&
        machineLastData[0]?.checkSheet_data?.hos_approval_status?.[
          machineLastData[0]?.checkSheet_data?.hos_approval_status?.length - 1
        ] === "Pending"
      ) {
        let hosApproval = "Accepted";
        machineLastData[0].checkSheet_data.hos_approval_status[
          machineLastData[0].checkSheet_data.hos_approval_status.length - 1
        ] = "Accepted";

        const requestSenderUserData = await User.findOne({
          tm_no:
            machineLastData[0]?.checkSheet_data?.sender_tm_no[
              machineLastData[0]?.checkSheet_data?.sender_tm_no?.length - 1
            ],
        });

        const TLApprovalStatusUpdate = await Machine.updateOne(
          { machine_code: machineLastData[0].machine_code },
          {
            $set: {
              "checkSheet_data.$[outer].hos_approval_status":
                machineLastData[0].checkSheet_data.hos_approval_status,
              "checkSheet_data.$[outer].checksheet_status": "Planning",
              "checkSheet_data.$[outer].flagForRevisionContent": false,

              "checkSheet_data.$[outer].flagForNewRevisionContentDataAdded": false,
            },
            $push: {
              "checkSheet_data.$[outer].approved_by_HOS": approved_by_HOS,
              "checkSheet_data.$[outer].preparation_HOS_date":
                preparation_HOS_date,
            },
          },
          {
            arrayFilters: [
              {
                "outer.current_year":
                  machineLastData[0].checkSheet_data.current_year,
              },
            ],
          }
        );

        if (requestSenderUserData?.user_type !== "Operator") {
          //  console.log(TLApprovalStatusUpdate)
          subject = `Checksheet Preparation Approval (${machineLastData[0]?.cell_name}/${machineLastData[0]?.line_name}/${machineLastData[0]?.machine_code})`;
          title = `Checksheet is Approved`;
          greetings = `Sir\\Ma'am`;
          bodyTable = `<table style="font-family: arial, sans-serif;border-collapse: collapse;width: 100%;">

                            <tr>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">Cell/Product</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${machineLastData[0]?.cell_name}</td>
                            </tr>
                            
                            <tr style="background-color: #dddddd;">
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">Line</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${machineLastData[0]?.line_name}</td>
                            </tr>

                            <tr>
                                <td style="border: 1px solid black;text-align: left;padding: 8px;">Machine</td>
                                <td style="border: 1px solid black;text-align: left;padding: 8px;">${machineLastData[0]?.machine_name}</td>
                            </tr>
                            
                            <tr style="background-color: #dddddd;">
                                <td style="border: 1px solid black;text-align: left;padding: 8px;">Machine No.</td>
                                <td style="border: 1px solid black;text-align: left;padding: 8px;">${machineLastData[0]?.machine_code}</td>
                            </tr>
                            
                            <tr>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">Approved by</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${loggedUserData?.tm_name}</td>
                            </tr>   
                            
                            <tr style="background-color: #dddddd;">
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">Date and Time</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${preparation_HOS_date}</td>
                            </tr>
                            
                        </table>`;

          sendApproval(
            subject,
            title,
            greetings,
            bodyTable,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            machineLastData[0].checkSheet_data.checkSheetSendingUser[
              machineLastData[0].checkSheet_data.checkSheetSendingUser.length -
                1
            ],
            undefined,
            hosApproval,
            undefined,
            undefined
          );
        }
      } else if (
        machineLastData[0]?.checkSheet_data?.hos_approval_status?.[
          machineLastData[0]?.checkSheet_data?.hos_approval_status?.length - 1
        ] === "Pending"
      ) {
        let hosApproval = "Accepted";

        const requestSenderUserData = await User.findOne({
          tm_no:
            machineLastData[0]?.checkSheet_data?.sender_tm_no[
              machineLastData[0]?.checkSheet_data?.sender_tm_no?.length - 1
            ],
        });

        machineLastData[0].checkSheet_data.hos_approval_status[
          machineLastData[0].checkSheet_data.hos_approval_status.length - 1
        ] = "Accepted";
        const TLApprovalStatusUpdate = await Machine.updateOne(
          { machine_code: machineLastData[0].machine_code },
          {
            $set: {
              "checkSheet_data.$[outer].checksheet_status": "Planning",
              "checkSheet_data.$[outer].hos_approval_status":
                machineLastData[0].checkSheet_data.hos_approval_status,
              "checkSheet_data.$[outer].flagForRevisionContent": false,

              "checkSheet_data.$[outer].flagForNewRevisionContentDataAdded": false,
            },
            $push: {
              "checkSheet_data.$[outer].approved_by_HOS": approved_by_HOS,
              "checkSheet_data.$[outer].preparation_HOS_date":
                preparation_HOS_date,
            },
          },
          {
            arrayFilters: [
              {
                "outer.current_year":
                  machineLastData[0].checkSheet_data.current_year,
              },
            ],
          }
        );

        if (requestSenderUserData?.user_type !== "Operator") {
          subject = `Checksheet Preparation Approval (${machineLastData[0]?.cell_name}/${machineLastData[0]?.line_name}/${machineLastData[0]?.machine_code})`;
          title = `Checksheet is Approved`;
          greetings = `Sir\\Ma'am`;
          bodyTable = `<table style="font-family: arial, sans-serif;border-collapse: collapse;width: 100%;">
          
                            <tr>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">Cell/Product</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${machineLastData[0]?.cell_name}</td>
                            </tr>
                            
                            <tr style="background-color: #dddddd;">
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">Line</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${machineLastData[0]?.line_name}</td>
                            </tr>
    
                            <tr>
                                <td style="border: 1px solid black;text-align: left;padding: 8px;">Machine</td>
                                <td style="border: 1px solid black;text-align: left;padding: 8px;">${machineLastData[0]?.machine_name}</td>
                            </tr>
                            
                            <tr style="background-color: #dddddd;">
                                <td style="border: 1px solid black;text-align: left;padding: 8px;">Machine No.</td>
                                <td style="border: 1px solid black;text-align: left;padding: 8px;">${machineLastData[0]?.machine_code}</td>
                            </tr>
                            
                            <tr>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">Approved by</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${loggedUserData?.tm_name}</td>
                            </tr>   
                            
                            <tr style="background-color: #dddddd;">
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">Date and Time</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${preparation_HOS_date}</td>
                            </tr>
                            
                        </table>`;

          sendApproval(
            subject,
            title,
            greetings,
            bodyTable,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            machineLastData[0].checkSheet_data.checkSheetSendingUser[
              machineLastData[0].checkSheet_data.checkSheetSendingUser.length -
                1
            ],
            undefined,
            hosApproval,
            undefined,
            undefined
          );
        }
      } else if (
        machineLastData[0]?.checkSheet_data?.prd_tl_approval_status?.[
          machineLastData[0]?.checkSheet_data?.prd_tl_approval_status?.length -
            1
        ] === "Pending"
      ) {
        let checkWhetherRevisionContentDeleted = 0;
        let checkWhetherRevisionContentAdded = 0;
        let checkWhetherRevisionContentEdited = 0;

        for (
          let i = 0;
          i < machineLastData[0]?.checkSheet_data?.checkSheet?.length;
          i++
        ) {
          if (machineLastData?.[0]?.checkSheet_data?.PMStatus) {
            if (
              machineLastData?.[0]?.checkSheet_data?.checkSheet?.[i]?.isDeleted
            ) {
              checkWhetherRevisionContentDeleted = 1;
            }
            if (
              machineLastData?.[0]?.checkSheet_data?.checkSheet?.[i]?.isAdded
            ) {
              // console.log("is Added ---- ")
              checkWhetherRevisionContentAdded = 1;
              for (let j = 0; j < financialYearWiseMonthKeyArray?.length; j++) {
                let month = financialYearWiseMonthKeyArray?.[j];
                // let previousMonthForMidYearChange = financialYearWiseMonthKeyArray[j - 1] || "Apr"
                // console.log("is added in loop ");
                if (
                  machineLastData?.[0]?.checkSheet_data?.checkSheet?.[i]
                    ?.planningTableAnimationArray2?.[month]?.[0] === "1" &&
                  (monthKeyArray.indexOf(month) >=
                    new Date(
                      mongoose.Types.ObjectId(
                        machineLastData?.[0]?.checkSheet_data?.checkSheet?.[i]
                          ?._id
                      ).getTimestamp()
                    ).getMonth() ||
                    monthKeyArray.indexOf(month) < 3)
                ) {
                  // console.log(month, "----inside if ......", new Date(mongoose.Types.ObjectId(machineLastData[0]?.checkSheet_data?.checkSheet?.[i]?._id).getTimestamp()).getMonth())
                  if (
                    machineLastData?.[0]?.checkSheet_data?.PMStatus?.[month] ===
                    ""
                  ) {
                    // console.log("Current........")

                    machineLastData[0].checkSheet_data.PMStatus[month] =
                      "Current Plan";
                    machineLastData[0].checkSheet_data.currentMonthScheduleOrNotStatus[
                      month
                    ] = "Scheduled";
                  } else if (
                    machineLastData?.[0]?.checkSheet_data?.PMStatus?.[month] ===
                    "Completed"
                  ) {
                    // console.log("Completed........")
                    machineLastData[0].checkSheet_data.PMStatus[month] =
                      "Ongoing";
                    machineLastData[0].checkSheet_data.currentMonthScheduleOrNotStatus[
                      month
                    ] = "Scheduled";
                  }
                }
              }
            }
            if (
              machineLastData?.[0].checkSheet_data?.checkSheet?.[i]?.isEdited
            ) {
              checkWhetherRevisionContentEdited = 1;
              console.log(
                machineLastData?.[0].checkSheet_data?.checkSheet?.[i]
              );
            }
          }
        }
        const changeMidYearStatusEditedOrDeleted = (keyOfMonth) => {
          for (let j = 0; j < financialYearWiseMonthKeyArray?.length; j++) {
            let month = financialYearWiseMonthKeyArray[j];
            let plannedPMCount = 0,
              totalCarriedPMCount = 0,
              completedPMCount = 0;
            if (
              monthKeyArray?.indexOf(month) >=
                new Date(
                  machineLastData?.[0]?.checkSheet_data?.[keyOfMonth]
                )?.getMonth() ||
              monthKeyArray?.indexOf(month) < 3
            ) {
              for (
                let i = 0;
                i < machineLastData?.[0]?.checkSheet_data?.checkSheet?.length;
                i++
              ) {
                // let previousMonthForMidYearChange = financialYearWiseMonthKeyArray[j - 1] || "Apr"
                // console.log("is edited in loop ");
                // console.log("in if condition in edited")
                //for completed status
                if (
                  machineLastData?.[0]?.checkSheet_data?.checkSheet?.[i]
                    ?.planningTableAnimationArray2?.[month]?.[0] === "1" &&
                  !machineLastData?.[0].checkSheet_data.checkSheet[i]?.isDeleted
                ) {
                  plannedPMCount = plannedPMCount + 1;
                }
                if (
                  machineLastData?.[0]?.checkSheet_data?.checkSheet?.[i]
                    ?.planningTableAnimationArray2?.[month]?.length >= 2 &&
                  machineLastData?.[0]?.checkSheet_data?.checkSheet?.[i]
                    ?.planningTableAnimationArray2?.[month]?.[0] === "1" &&
                  !machineLastData?.[0]?.checkSheet_data?.checkSheet?.[i]
                    ?.isDeleted
                ) {
                  completedPMCount = completedPMCount + 1;
                }
              }

              if (
                machineLastData?.[0]?.checkSheet_data?.PMStatus?.[month] ===
                "No Completion"
              ) {
                machineLastData[0].checkSheet_data.PMStatus[month] =
                  "No Completion";
              } else if (plannedPMCount) {
                // console.log(month, "----Planned----> ", plannedPMCount, "---> Completed ---", completedPMCount)
                if (plannedPMCount === completedPMCount) {
                  machineLastData[0].checkSheet_data.PMStatus[month] =
                    "Completed";
                } else if (completedPMCount === 1) {
                  machineLastData[0].checkSheet_data.PMStatus[month] =
                    "Ongoing";
                } else if (completedPMCount === 0) {
                  machineLastData[0].checkSheet_data.PMStatus[month] =
                    "Current Plan";
                }
              } else {
                // console.log("5570*******>>", month, "----Planned----> ", plannedPMCount, "---> Completed ---", completedPMCount)

                machineLastData[0].checkSheet_data.PMStatus[month] = "";
                machineLastData[0].checkSheet_data.currentMonthScheduleOrNotStatus[
                  month
                ] = "";
              }
            }
          }
        };

        //for mid year edited or deleted
        if (checkWhetherRevisionContentEdited === 1) {
          changeMidYearStatusEditedOrDeleted("isEditedMonth");
        }
        if (checkWhetherRevisionContentDeleted === 1) {
          changeMidYearStatusEditedOrDeleted("isDeletedMonth");
        }

        if (
          checkWhetherRevisionContentDeleted !== 1 &&
          checkWhetherRevisionContentAdded !== 1 &&
          checkWhetherRevisionContentEdited !== 1
        ) {
          // console.log(checkWhetherRevisionContentDeleted, "-----", checkWhetherRevisionContentAdded)
          for (
            let i = 0;
            i < machineLastData?.[0]?.checkSheet_data?.checkSheet?.length;
            i++
          ) {
            for (let j = 0; j < financialYearWiseMonthKeyArray.length; j++) {
              let month = financialYearWiseMonthKeyArray[j];
              if (
                machineLastData?.[0]?.checkSheet_data?.checkSheet?.[i]
                  ?.planningTableAnimationArray2?.[month]?.[0] === "1"
              ) {
                PMStatusArray[financialYearWiseMonthKeyArray[j]] =
                  "Current Plan";
                CurrentMonthPMScheduleOrNotStatusArray[
                  financialYearWiseMonthKeyArray[j]
                ] = "Scheduled";
              }
            }
          }
        }
        machineLastData[0].checkSheet_data.prd_tl_approval_status[
          machineLastData[0].checkSheet_data.prd_tl_approval_status.length - 1
        ] = "Accepted";
        // console.log(machineLastData?.[0].checkSheet_data.prd_tl_approval_status)
        const PRDTLApprovalStatusUpdate = await Machine.updateOne(
          { machine_code: machineLastData?.[0].machine_code },
          {
            $set: {
              "checkSheet_data.$[outer].prd_tl_approval_status":
                machineLastData?.[0]?.checkSheet_data?.prd_tl_approval_status,
              "checkSheet_data.$[outer].checksheet_status": "Implementation",
              "checkSheet_data.$[outer].PMStatus":
                checkWhetherRevisionContentDeleted !== 1 &&
                checkWhetherRevisionContentAdded !== 1 &&
                checkWhetherRevisionContentEdited !== 1
                  ? PMStatusArray
                  : machineLastData?.[0]?.checkSheet_data?.PMStatus,
              "checkSheet_data.$[outer].currentMonthScheduleOrNotStatus":
                checkWhetherRevisionContentDeleted !== 1 &&
                checkWhetherRevisionContentAdded !== 1 &&
                checkWhetherRevisionContentEdited !== 1
                  ? CurrentMonthPMScheduleOrNotStatusArray
                  : machineLastData?.[0]?.checkSheet_data
                      ?.currentMonthScheduleOrNotStatus,
              "checkSheet_data.$[outer].flagForRevisionContent": false,

              "checkSheet_data.$[outer].flagForNewRevisionContentDataAdded": false,
            },
            $push: {
              "checkSheet_data.$[outer].approved_by_PRD_TL": approved_by_PRD_TL,
              "checkSheet_data.$[outer].planning_PRD_TL_date":
                planning_PRD_TL_date,
            },
          },
          {
            arrayFilters: [
              {
                "outer.current_year":
                  machineLastData?.[0].checkSheet_data.current_year,
              },
            ],
          }
        );

        if (sectionInfo?.dashboardLevel === "Yes") {
          sectionRelatedUser = await User.find({
            section_data: loggedUserData?.section_data,
            tm_department: "MTD",
            tm_grade: "HOS",
          });
        } else {
          sectionRelatedUser = await User.find({
            section_data: loggedUserData.section_data,
            tm_department: "MTD",
            tm_grade: "HOS",
            subSection_data: { $in: loggedUserData.subSection_data },
          });
        }

        let ccMail = sectionRelatedUser?.map((result) =>
          result?.email ? result?.email : undefined
        );

        // console.log(machineLastData?.[0]?.checkSheet_data?.plan_prepared_email, machineLastData?.[0]?.checkSheet_data?.plan_prepared_tm_name)

        subject = `Checksheet Planning Approval (${machineLastData?.[0]?.cell_name}/${machineLastData?.[0]?.line_name}/${machineLastData?.[0]?.machine_code})`;
        title = `Checksheet Planning is Approved.`;
        greetings = `${machineLastData?.[0]?.checkSheet_data?.plan_prepared_tm_name} San`;
        bodyTable = `<table style="font-family: arial, sans-serif;border-collapse: collapse;width: 100%;">
      
                        <tr>
                        <td style="border: 1px solid black;text-align: left;padding: 8px;">Cell/Product</td>
                        <td style="border: 1px solid black;text-align: left;padding: 8px;">${machineLastData?.[0]?.cell_name}</td>
                        </tr>
                        
                        <tr style="background-color: #dddddd;">
                        <td style="border: 1px solid black;text-align: left;padding: 8px;">Line</td>
                        <td style="border: 1px solid black;text-align: left;padding: 8px;">${machineLastData?.[0]?.line_name}</td>
                        </tr>

                        <tr>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">Machine</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${machineLastData?.[0]?.machine_name}</td>
                        </tr>
                        
                        <tr style="background-color: #dddddd;">
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">Machine No.</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${machineLastData?.[0]?.machine_code}</td>
                        </tr>
                        
                        <tr>
                        <td style="border: 1px solid black;text-align: left;padding: 8px;">Approved by</td>
                        <td style="border: 1px solid black;text-align: left;padding: 8px;">${loggedUserData?.tm_name}</td>
                        </tr>   
                        
                        <tr style="background-color: #dddddd;">
                        <td style="border: 1px solid black;text-align: left;padding: 8px;">Date and Time</td>
                        <td style="border: 1px solid black;text-align: left;padding: 8px;">${planning_PRD_TL_date}</td>
                        </tr>
                        
                    </table>`;

        sendApproval(
          subject,
          title,
          greetings,
          bodyTable,
          ccMail,
          undefined, // findAssignHosName.tm_name,
          undefined, // machineLastData?.[0].checkSheet_data.sender_tm_no[(machineLastData?.[0].checkSheet_data.sender_tm_no).length - 1],
          undefined, // machineLastData?.[0].checkSheet_data.sender_tm_name[(machineLastData?.[0].checkSheet_data.sender_tm_name).length - 1],
          undefined, // machineLastData?.[0].machine_code,
          undefined, // machineLastData?.[0].machine_name,
          undefined, // machineLastData?.[0].checkSheet_data.checksheet_status,
          machineLastData?.[0]?.checkSheet_data?.plan_prepared_email[
            (machineLastData?.[0]?.checkSheet_data?.plan_prepared_email)
              .length - 1
          ],
          undefined, // machineLastData?.[0].checkSheet_data.assign_HOS[(machineLastData?.[0].checkSheet_data.checkSheetSendingUser).length - 1],
          undefined // tlApproval, undefined, undefined
        );
      } else if (
        machineLastData?.[0]?.checkSheet_data
          ?.implemetation_prd_tl_approval_status?.[senderApprovalMonth]?.[
          machineLastData?.[0]?.checkSheet_data
            ?.implemetation_prd_tl_approval_status?.[senderApprovalMonth]
            ?.length - 1
        ] === "Pending" &&
        req?.rootUser?.tm_grade !== "HOD"
      ) {
        let prd_tl_approval_status = "Accepted";

        let machineLastDataForKeyexistsOrNot = await Machine.aggregate([
          {
            $match: {
              machine_code: machineLastData[0].machine_code,
            },
          },
          { $unwind: "$checkSheet_data" },
          {
            $match: {
              "checkSheet_data.current_year":
                machineLastData[0].checkSheet_data.current_year,
            },
          },
          {
            $project: {
              machine_code: 1,
              machine_name: 1,
              machine_nickname: 1,
              machine_sequence: 1,
              installation_date: 1,
              maker_name: 1,
              maker_sr_no: 1,
              manufacturingDate: 1,
              isPM: 1,
              line_names: 1,
              checkSheet_data: 1,
              // checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] }
            },
          },
        ]);

        // const keyExistsCheck = await Machine.findOne({ machine_code: machineLastData[0].machine_code, "checkSheet_data.implementation_approved_by_PRD_TL": { $exists: true } });
        if (
          machineLastDataForKeyexistsOrNot?.[0]?.checkSheet_data
            ?.implementation_approved_by_PRD_TL === undefined
        ) {
          const updateImplementationData = await Machine.updateOne(
            { machine_code: machineLastData[0].machine_code },
            {
              $set: {
                "checkSheet_data.$[outer].implementation_approved_by_PRD_TL":
                  creationMonthKeyArray,
                "checkSheet_data.$[outer].implementation_approved_PRD_TL_date":
                  creationMonthKeyArray,
                "checkSheet_data.$[outer].implemetation_quality_remarks":
                  creationMonthKeyArray,
              },
            },
            {
              arrayFilters: [
                {
                  "outer.current_year":
                    machineLastData[0].checkSheet_data.current_year,
                },
              ],
            }
          );
        }

        machineLastData[0].checkSheet_data.implemetation_prd_tl_approval_status[
          senderApprovalMonth
        ][
          machineLastData[0].checkSheet_data
            .implemetation_prd_tl_approval_status[senderApprovalMonth].length -
            1
        ] = "Accepted";
        // machineLastData[0].checkSheet_data.implemetation_mtd_tl_approval_status[monthForCompareSystemMonth][(machineLastData[0].checkSheet_data.implemetation_mtd_tl_approval_status[monthForCompareSystemMonth]).length - 1] = "Pending"
        if (
          machineLastData[0]?.checkSheet_data?.PMStatus[previousMonth] ===
            "Done with delay" &&
          previousMonth !== undefined
        ) {
          const addPreviousMonthDonewithDelayApproval = await Machine.updateOne(
            { machine_code: machineLastData[0].machine_code },
            {
              $push: {
                [keyOfImplementation_approved_by_PRD_TL_for_doneWithDelay]:
                  implementation_approved_by_PRD_TL,
              },
            },
            {
              arrayFilters: [
                {
                  "outer.current_year":
                    machineLastData[0].checkSheet_data.current_year,
                },
              ],
            }
          );
        }
        const PRDTLApprovalStatusUpdateOfImplementation =
          await Machine.findOneAndUpdate(
            { machine_code: machineLastData[0].machine_code },
            {
              $set: {
                [keyOfImplemetation_prd_tl_approval_status]:
                  machineLastData[0].checkSheet_data
                    .implemetation_prd_tl_approval_status[senderApprovalMonth],
                //   [keyOfImplemetation_mtd_tl_approval_status]: machineLastData[0].checkSheet_data.implemetation_mtd_tl_approval_status[monthForCompareSystemMonth],
              },
              $push: {
                [keyOfImplementation_approved_by_PRD_TL]:
                  implementation_approved_by_PRD_TL,
                [keyOfImplementation_approved_PRD_TL_date]:
                  implementation_approved_PRD_TL_date,
                [keyOfImplemetation_quality_remarks]:
                  implemetation_quality_remarks,
              },
            },
            {
              arrayFilters: [
                {
                  "outer.current_year":
                    machineLastData[0].checkSheet_data.current_year,
                },
              ],
              new: true,
            }
          );
        // console.log(machineLastData[0].checkSheet_data.implementation_assign_MTD_HOS[monthForCompareSystemMonth])
        let ccMail =
          machineLastData[0]?.checkSheet_data?.implementation_assign_MTD_HOS?.[
            senderApprovalMonth
          ];
        const findAssignMTDTLNameOfImplementation = await User.findOne({
          email:
            machineLastData[0]?.checkSheet_data?.implementation_assign_MTD_TL?.[
              senderApprovalMonth
            ][
              machineLastData[0]?.checkSheet_data
                ?.implementation_assign_MTD_TL?.[senderApprovalMonth]?.length -
                1
            ],
        });

        subject = `Checksheet Approved by PRD TL Plan vs Actual (${machineLastData[0]?.cell_name}/${machineLastData[0]?.line_name}/${machineLastData[0]?.machine_code})`;
        title = `Checksheet Approved Plan vs Actual, Kindly proceed for further approval`;
        greetings = `${findAssignMTDTLNameOfImplementation.tm_name} San`;
        bodyTable = `<table style="font-family: arial, sans-serif;border-collapse: collapse;width: 100%;">
      
                        <tr>
                        <td style="border: 1px solid black;text-align: left;padding: 8px;">Cell/Product</td>
                        <td style="border: 1px solid black;text-align: left;padding: 8px;">${machineLastData[0]?.cell_name}</td>
                        </tr>
                        
                        <tr style="background-color: #dddddd;">
                        <td style="border: 1px solid black;text-align: left;padding: 8px;">Line</td>
                        <td style="border: 1px solid black;text-align: left;padding: 8px;">${machineLastData[0]?.line_name}</td>
                        </tr>

                        <tr>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">Machine</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${machineLastData[0]?.machine_name}</td>
                        </tr>
                        
                        <tr style="background-color: #dddddd;">
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">Machine No.</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${machineLastData[0]?.machine_code}</td>
                        </tr>
                        
                        <tr>
                        <td style="border: 1px solid black;text-align: left;padding: 8px;">Done by</td>
                        <td style="border: 1px solid black;text-align: left;padding: 8px;">${loggedUserData?.tm_name}</td>
                        </tr>   
                        
                        <tr style="background-color: #dddddd;">
                        <td style="border: 1px solid black;text-align: left;padding: 8px;">Date and Time</td>
                        <td style="border: 1px solid black;text-align: left;padding: 8px;">${implementation_approved_PRD_TL_date}</td>
                        </tr>
                        
                    </table>`;

        sendApproval(
          subject,
          title,
          greetings,
          bodyTable,
          ccMail,
          findAssignMTDTLNameOfImplementation.tm_name,
          machineLastData[0].checkSheet_data.implemetation_completed_tm_no[
            senderApprovalMonth
          ][
            machineLastData[0].checkSheet_data.implemetation_completed_tm_no[
              senderApprovalMonth
            ].length - 1
          ],
          machineLastData[0].checkSheet_data.implemetation_completed_tm_name[
            senderApprovalMonth
          ][
            machineLastData[0].checkSheet_data.implemetation_completed_tm_name[
              senderApprovalMonth
            ].length - 1
          ],
          machineLastData[0].machine_code,
          machineLastData[0].machine_name,
          machineLastData[0].checkSheet_data.checksheet_status,
          machineLastData[0]?.checkSheet_data?.implementation_assign_MTD_TL?.[
            senderApprovalMonth
          ][
            machineLastData[0]?.checkSheet_data?.implementation_assign_MTD_TL?.[
              senderApprovalMonth
            ]?.length - 1
          ],
          undefined,
          prd_tl_approval_status,
          undefined,
          undefined,
          undefined
        );

        // sendApprovalOfImplementation(findAssignMTDTLNameOfImplementation.tm_name,
        //     machineLastData[0].checkSheet_data.implemetation_completed_tm_no[monthForCompareSystemMonth][(machineLastData[0].checkSheet_data.implemetation_completed_tm_no[monthForCompareSystemMonth]).length - 1],
        //     machineLastData[0].checkSheet_data.implemetation_completed_tm_name[monthForCompareSystemMonth][(machineLastData[0].checkSheet_data.implemetation_completed_tm_name[monthForCompareSystemMonth]).length - 1],
        //     machineLastData[0].machine_code,
        //     machineLastData[0].machine_name,
        //     machineLastData[0].checkSheet_data.checksheet_status,
        //     machineLastData[0].checkSheet_data.implementation_assign_MTD_TL[monthForCompareSystemMonth][(machineLastData[0].checkSheet_data.implementation_assign_MTD_TL[monthForCompareSystemMonth]).length - 1],
        //     undefined,
        //     prd_tl_approval_status, undefined, undefined, undefined)
      } else if (
        machineLastData?.[0]?.checkSheet_data
          ?.implemetation_prd_tl_approval_status?.[senderApprovalMonth]?.[
          machineLastData?.[0]?.checkSheet_data
            ?.implemetation_prd_tl_approval_status?.[senderApprovalMonth]
            ?.length - 1
        ] === "Accepted" &&
        machineLastData?.[0]?.checkSheet_data
          ?.implemetation_mtd_tl_approval_status?.[senderApprovalMonth]?.[
          machineLastData?.[0]?.checkSheet_data
            ?.implemetation_mtd_tl_approval_status?.[senderApprovalMonth]
            ?.length - 1
        ] === "Pending" &&
        req?.rootUser?.tm_grade !== "HOD"
      ) {
        let mtd_tl_approval_status = "Accepted";

        let machineLastDataForKeyexistsOrNot = await Machine.aggregate([
          {
            $match: {
              machine_code: machineLastData[0].machine_code,
            },
          },
          { $unwind: "$checkSheet_data" },
          {
            $match: {
              "checkSheet_data.current_year":
                machineLastData[0].checkSheet_data.current_year,
            },
          },
          {
            $project: {
              machine_code: 1,
              machine_name: 1,
              machine_nickname: 1,
              machine_sequence: 1,
              installation_date: 1,
              maker_name: 1,
              maker_sr_no: 1,
              manufacturingDate: 1,
              isPM: 1,
              line_names: 1,
              checkSheet_data: 1,
            },
          },
        ]);

        // const keyExistsCheck = await Machine.findOne({ machine_code: machineLastData[0].machine_code, "checkSheet_data.implementation_approved_by_MTD_TL": { $exists: true } });

        if (
          machineLastDataForKeyexistsOrNot?.[0]?.checkSheet_data
            ?.implementation_approved_by_MTD_TL === undefined
        ) {
          const updateImplementationData = await Machine.updateOne(
            { machine_code: machineLastData[0].machine_code },
            {
              $set: {
                "checkSheet_data.$[outer].implementation_approved_by_MTD_TL":
                  creationMonthKeyArray,
                "checkSheet_data.$[outer].implementation_approved_MTD_TL_date":
                  creationMonthKeyArray,
              },
            },
            {
              arrayFilters: [
                {
                  "outer.current_year":
                    machineLastData[0].checkSheet_data.current_year,
                },
              ],
            }
          );
        }

        machineLastData[0].checkSheet_data.implemetation_mtd_tl_approval_status[
          senderApprovalMonth
        ][
          machineLastData[0].checkSheet_data
            .implemetation_mtd_tl_approval_status[senderApprovalMonth].length -
            1
        ] = "Accepted";
        // machineLastData[0].checkSheet_data.implemetation_mtd_hos_approval_status[senderApprovalMonth][(machineLastData[0].checkSheet_data.implemetation_mtd_hos_approval_status[senderApprovalMonth]).length - 1] = "Pending"
        if (
          machineLastData[0]?.checkSheet_data?.PMStatus[previousMonth] ===
            "Done with delay" &&
          previousMonth !== undefined
        ) {
          const addPreviousMonthDonewithDelayApproval = await Machine.updateOne(
            { machine_code: machineLastData[0].machine_code },
            {
              $push: {
                [keyOfImplementation_approved_by_MTD_TL_for_doneWithDelay]:
                  implementation_approved_by_MTD_TL,
              },
            },
            {
              arrayFilters: [
                {
                  "outer.current_year":
                    machineLastData[0].checkSheet_data.current_year,
                },
              ],
            }
          );
        }
        const MTDTLApprovalStatusUpdateOfImplementation =
          await Machine.updateOne(
            { machine_code: machineLastData[0].machine_code },
            {
              $set: {
                [keyOfImplemetation_mtd_tl_approval_status]:
                  machineLastData[0].checkSheet_data
                    .implemetation_mtd_tl_approval_status[senderApprovalMonth],
                // [keyOfImplemetation_mtd_hos_approval_status]: machineLastData[0].checkSheet_data.implemetation_mtd_hos_approval_status[senderApprovalMonth],
              },
              $push: {
                [keyOfImplementation_approved_by_MTD_TL]:
                  implementation_approved_by_MTD_TL,
                [keyOfImplementation_approved_MTD_TL_date]:
                  implementation_approved_MTD_TL_date,
              },
            },
            {
              arrayFilters: [
                {
                  "outer.current_year":
                    machineLastData[0].checkSheet_data.current_year,
                },
              ],
            }
          );
        const findAssignMTDHOSNameOfImplementation = await User.findOne({
          email:
            machineLastData[0]?.checkSheet_data
              ?.implementation_assign_MTD_HOS?.[senderApprovalMonth][
              machineLastData[0]?.checkSheet_data
                ?.implementation_assign_MTD_HOS?.[senderApprovalMonth]?.length -
                1
            ],
        });
        // console.log(
        //   machineLastData[0].checkSheet_data.implementation_assign_MTD_HOS[
        //     senderApprovalMonth
        //   ][
        //     machineLastData[0].checkSheet_data.implementation_assign_MTD_HOS[
        //       senderApprovalMonth
        //     ].length - 1
        //   ]
        // );

        subject = `Checksheet Approved by MTD TL/HoSS Plan vs Actual (${machineLastData[0]?.cell_name}/${machineLastData[0]?.line_name}/${machineLastData[0]?.machine_code})`;
        title = `Checksheet Approved Plan vs Actual`;
        greetings = `${findAssignMTDHOSNameOfImplementation.tm_name} San-(MTD HOS)`;
        bodyTable = `<table style="font-family: arial, sans-serif;border-collapse: collapse;width: 100%;">
      
                        <tr>
                        <td style="border: 1px solid black;text-align: left;padding: 8px;">Cell/Product</td>
                        <td style="border: 1px solid black;text-align: left;padding: 8px;">${machineLastData[0]?.cell_name}</td>
                        </tr>
                        
                        <tr style="background-color: #dddddd;">
                        <td style="border: 1px solid black;text-align: left;padding: 8px;">Line</td>
                        <td style="border: 1px solid black;text-align: left;padding: 8px;">${machineLastData[0]?.line_name}</td>
                        </tr>

                        <tr>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">Machine</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${machineLastData[0]?.machine_name}</td>
                        </tr>
                        
                        <tr style="background-color: #dddddd;">
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">Machine No.</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${machineLastData[0]?.machine_code}</td>
                        </tr>
                        
                        <tr>
                        <td style="border: 1px solid black;text-align: left;padding: 8px;">Done by</td>
                        <td style="border: 1px solid black;text-align: left;padding: 8px;">${loggedUserData?.tm_name}</td>
                        </tr>   
                        
                        <tr style="background-color: #dddddd;">
                        <td style="border: 1px solid black;text-align: left;padding: 8px;">Date and Time</td>
                        <td style="border: 1px solid black;text-align: left;padding: 8px;">${implementation_approved_MTD_TL_date}</td>
                        </tr>
                        
                    </table>`;

        sendApproval(
          subject,
          title,
          greetings,
          bodyTable,
          undefined,
          findAssignMTDHOSNameOfImplementation.tm_name,
          machineLastData[0].checkSheet_data.implemetation_completed_tm_no[
            senderApprovalMonth
          ][
            machineLastData[0].checkSheet_data.implemetation_completed_tm_no[
              senderApprovalMonth
            ].length - 1
          ],
          machineLastData[0].checkSheet_data.implemetation_completed_tm_name[
            senderApprovalMonth
          ][
            machineLastData[0].checkSheet_data.implemetation_completed_tm_name[
              senderApprovalMonth
            ].length - 1
          ],
          machineLastData[0].machine_code,
          machineLastData[0].machine_name,
          machineLastData[0].checkSheet_data.checksheet_status,
          machineLastData[0].checkSheet_data.implementation_assign_MTD_HOS[
            senderApprovalMonth
          ][
            machineLastData[0].checkSheet_data.implementation_assign_MTD_HOS[
              senderApprovalMonth
            ].length - 1
          ],
          undefined,
          machineLastData[0].checkSheet_data
            .implemetation_prd_tl_approval_status[senderApprovalMonth][
            machineLastData[0].checkSheet_data
              .implemetation_prd_tl_approval_status[senderApprovalMonth]
              .length - 1
          ],
          mtd_tl_approval_status,
          undefined,
          undefined
        );

        // sendApprovalOfImplementation(findAssignMTDHOSNameOfImplementation.tm_name,
        //     machineLastData[0].checkSheet_data.implemetation_completed_tm_no[senderApprovalMonth][(machineLastData[0].checkSheet_data.implemetation_completed_tm_no[senderApprovalMonth]).length - 1],
        //     machineLastData[0].checkSheet_data.implemetation_completed_tm_name[senderApprovalMonth][(machineLastData[0].checkSheet_data.implemetation_completed_tm_name[senderApprovalMonth]).length - 1],
        //     machineLastData[0].machine_code,
        //     machineLastData[0].machine_name,
        //     machineLastData[0].checkSheet_data.checksheet_status,
        //     machineLastData[0].checkSheet_data.implementation_assign_MTD_HOS[senderApprovalMonth][(machineLastData[0].checkSheet_data.implementation_assign_MTD_HOS[senderApprovalMonth]).length - 1],
        //     undefined,
        //     machineLastData[0].checkSheet_data.implemetation_prd_tl_approval_status[senderApprovalMonth][(machineLastData[0].checkSheet_data.implemetation_prd_tl_approval_status[senderApprovalMonth]).length - 1],
        //     mtd_tl_approval_status, undefined, undefined)
      } else if (
        machineLastData?.[0]?.checkSheet_data
          ?.implemetation_prd_tl_approval_status?.[senderApprovalMonth]?.[
          machineLastData?.[0]?.checkSheet_data
            ?.implemetation_prd_tl_approval_status?.[senderApprovalMonth]
            ?.length - 1
        ] === "Accepted" &&
        machineLastData?.[0]?.checkSheet_data
          ?.implemetation_mtd_tl_approval_status?.[senderApprovalMonth]?.[
          machineLastData?.[0]?.checkSheet_data
            ?.implemetation_mtd_tl_approval_status?.[senderApprovalMonth]
            ?.length - 1
        ] === "Accepted" &&
        machineLastData?.[0]?.checkSheet_data
          ?.implemetation_mtd_hos_approval_status?.[senderApprovalMonth]?.[
          machineLastData?.[0]?.checkSheet_data
            ?.implemetation_mtd_hos_approval_status?.[senderApprovalMonth]
            ?.length - 1
        ] === "Pending" &&
        req?.rootUser?.tm_grade !== "HOD"
      ) {
        // const keyExistsCheck = await Machine.findOne({ machine_code: machineLastData[0].machine_code, "checkSheet_data.implementation_approved_by_MTD_HOS": { $exists: true } });

        let machineLastDataForKeyexistsOrNot = await Machine.aggregate([
          {
            $match: {
              machine_code: machineLastData[0].machine_code,
            },
          },
          { $unwind: "$checkSheet_data" },
          {
            $match: {
              "checkSheet_data.current_year":
                machineLastData[0].checkSheet_data.current_year,
            },
          },
          {
            $project: {
              machine_code: 1,
              machine_name: 1,
              machine_nickname: 1,
              machine_sequence: 1,
              installation_date: 1,
              maker_name: 1,
              maker_sr_no: 1,
              manufacturingDate: 1,
              isPM: 1,
              line_names: 1,
              checkSheet_data: 1,
            },
          },
        ]);

        if (
          machineLastDataForKeyexistsOrNot?.[0]?.checkSheet_data
            ?.implementation_approved_by_MTD_HOS === undefined
        ) {
          const updateImplementationData = await Machine.updateOne(
            { machine_code: machineLastData[0].machine_code },
            {
              $set: {
                "checkSheet_data.$[outer].implementation_approved_by_MTD_HOS":
                  creationMonthKeyArray,
                "checkSheet_data.$[outer].implementation_approved_MTD_HOS_date":
                  creationMonthKeyArray,
              },
            },
            {
              arrayFilters: [
                {
                  "outer.current_year":
                    machineLastData[0].checkSheet_data.current_year,
                },
              ],
            }
          );
        }
        if (
          machineLastData[0]?.checkSheet_data?.PMStatus[previousMonth] ===
            "Done with delay" &&
          previousMonth !== undefined
        ) {
          const addPreviousMonthDonewithDelayApproval = await Machine.updateOne(
            { machine_code: machineLastData[0].machine_code },
            {
              $push: {
                [keyOfImplementation_approved_by_MTD_HOS_for_doneWithDelay]:
                  implementation_approved_by_MTD_HOS,
              },
            },
            {
              arrayFilters: [
                {
                  "outer.current_year":
                    machineLastData[0].checkSheet_data.current_year,
                },
              ],
            }
          );
        }

        machineLastData[0].checkSheet_data.implemetation_mtd_hos_approval_status[
          senderApprovalMonth
        ][
          machineLastData[0].checkSheet_data
            .implemetation_mtd_hos_approval_status[senderApprovalMonth].length -
            1
        ] = "Accepted";
        const MTDHOSApprovalStatusUpdateOfImplementation =
          await Machine.updateOne(
            { machine_code: machineLastData[0].machine_code },
            {
              $set: {
                [keyOfImplemetation_mtd_hos_approval_status]:
                  machineLastData[0].checkSheet_data
                    .implemetation_mtd_hos_approval_status[senderApprovalMonth],
              },
              $push: {
                [keyOfImplementation_approved_by_MTD_HOS]:
                  implementation_approved_by_MTD_HOS,
                [keyOfImplementation_approved_MTD_HOS_date]:
                  implementation_approved_MTD_HOS_date,
              },
            },
            {
              arrayFilters: [
                {
                  "outer.current_year":
                    machineLastData[0].checkSheet_data.current_year,
                },
              ],
            }
          );

        subject = `Checksheet Approved by MTD HOS Plan vs Actual (${machineLastData[0]?.cell_name}/${machineLastData[0]?.line_name}/${machineLastData[0]?.machine_code})`;
        title = `Checksheet Approved Plan vs Actual,`;
        // greetings = `${findAssignMTDHOSNameOfImplementation.tm_name} San-(MTD HOD)`
        bodyTable = `<table style="font-family: arial, sans-serif;border-collapse: collapse;width: 100%;">
      
                        <tr>
                        <td style="border: 1px solid black;text-align: left;padding: 8px;">Cell/Product</td>
                        <td style="border: 1px solid black;text-align: left;padding: 8px;">${machineLastData[0]?.cell_name}</td>
                        </tr>
                        
                        <tr style="background-color: #dddddd;">
                        <td style="border: 1px solid black;text-align: left;padding: 8px;">Line</td>
                        <td style="border: 1px solid black;text-align: left;padding: 8px;">${machineLastData[0]?.line_name}</td>
                        </tr>

                        <tr>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">Machine</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${machineLastData[0]?.machine_name}</td>
                        </tr>
                        
                        <tr style="background-color: #dddddd;">
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">Machine No.</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${machineLastData[0]?.machine_code}</td>
                        </tr>
                        
                        <tr>
                        <td style="border: 1px solid black;text-align: left;padding: 8px;">Done by</td>
                        <td style="border: 1px solid black;text-align: left;padding: 8px;">${loggedUserData?.tm_name}</td>
                        </tr>   
                        
                        <tr style="background-color: #dddddd;">
                        <td style="border: 1px solid black;text-align: left;padding: 8px;">Date and Time</td>
                        <td style="border: 1px solid black;text-align: left;padding: 8px;">${implementation_approved_MTD_HOS_date}</td>
                        </tr>
                        
                    </table>`;
      } else if (
        machineLastData[0]?.checkSheet_data
          ?.implemetation_mtd_hod_approval_status?.[
          selected_machine_data?.senderApprovalMonth
        ]?.[
          machineLastData[0]?.checkSheet_data
            ?.implemetation_mtd_hod_approval_status?.[
            selected_machine_data?.senderApprovalMonth
          ]?.length - 1
        ]
      ) {
        // let machineLastDataForKeyexistsOrNot = await Machine.aggregate([{
        //     $match: {
        //         machine_code: machineLastData[0].machine_code
        //     }
        // },
        // {
        //     $project: {
        //         machine_code: 1,
        //         machine_name: 1,
        //         machine_nickname: 1,
        //         machine_sequence: 1,
        //         installation_date: 1,
        //         maker_name: 1,
        //         maker_sr_no: 1,
        //         manufacturingDate: 1,
        //         isPM: 1,
        //         line_names: 1,
        //         checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] }
        //     }
        // }
        // ])

        // if (!machineLastDataForKeyexistsOrNot[0].checkSheet_data.implementation_approved_by_MTD_HOD) {

        //     const updateImplementationData = await Machine.updateOne({ machine_code: machineLastData[0].machine_code }, {
        //         $set: { "checkSheet_data.$[outer].implementation_approved_by_MTD_HOD": creationMonthKeyArray, "checkSheet_data.$[outer].implementation_approved_MTD_HOD_date": creationMonthKeyArray }
        //     }, {
        //         arrayFilters: [{ 'outer.current_year': machineLastData[0].checkSheet_data.current_year }],
        //     })

        // }

        // --------------------------------------------------------------------------------------------

        // let monthForCompareSystemMonth2 = "Sep"

        // console.log(".............", machineLastData[0]?.checkSheet_data?.implemetation_mtd_hod_approval_status?.[selected_machine_data?.senderApprovalMonth]?.[(machineLastData[0]?.checkSheet_data?.implemetation_mtd_hod_approval_status?.[selected_machine_data?.senderApprovalMonth])?.length - 1])

        machineLastData[0].checkSheet_data.implemetation_mtd_hod_approval_status[
          selected_machine_data?.senderApprovalMonth
        ][
          machineLastData[0].checkSheet_data
            .implemetation_mtd_hod_approval_status[
            selected_machine_data?.senderApprovalMonth
          ].length - 1
        ] = "Accepted";

        // console.log("++++++++++++++++++", machineLastData[0].checkSheet_data.implemetation_mtd_hod_approval_status[selected_machine_data?.senderApprovalMonth])

        const MTDHODApprovalStatusUpdateOfImplementation =
          await Machine.updateOne(
            { machine_code: machineLastData[0].machine_code },
            {
              $set: {
                [keyOfImplemetation_mtd_hod_approval_status]:
                  machineLastData[0].checkSheet_data
                    .implemetation_mtd_hod_approval_status[
                    selected_machine_data?.senderApprovalMonth
                  ],
                [keyOfImplemetation_mtd_hod_approval_remarks]: approval_remarks,
              },
              $push: {
                [keyOfImplementation_approved_by_MTD_HOD]:
                  implementation_approved_by_MTD_HOD,
                [keyOfImplementation_approved_MTD_HOD_date]:
                  implementation_approved_MTD_HOD_date,
              },
            },
            {
              arrayFilters: [
                {
                  "outer.current_year":
                    machineLastData[0].checkSheet_data.current_year,
                },
              ],
            }
          );

        // console.log(MTDHODApprovalStatusUpdateOfImplementation)
      }
    } else {
      if (
        machineLastData[0].checkSheet_data.tl_approval_status[
          machineLastData[0].checkSheet_data.tl_approval_status.length - 1
        ] === "Pending"
      ) {
        let tlApproval = "Rejected";
        machineLastData[0].checkSheet_data.tl_approval_status[
          machineLastData[0].checkSheet_data.tl_approval_status.length - 1
        ] = "Rejected";

        const requestSenderUserData = await User.findOne({
          tm_no:
            machineLastData[0]?.checkSheet_data?.sender_tm_no[
              machineLastData[0]?.checkSheet_data?.sender_tm_no?.length - 1
            ],
        });

        const TLApprovalStatusUpdate = await Machine.updateOne(
          { machine_code: machineLastData[0].machine_code },
          {
            $set: {
              "checkSheet_data.$[outer].tl_approval_status":
                machineLastData[0].checkSheet_data.tl_approval_status,
            },
            $push: {
              "checkSheet_data.$[outer].preparation_TL_HOSS_date":
                preparation_TL_HOSS_date,
              "checkSheet_data.$[outer].approved_by_TL": "",
              "checkSheet_data.$[outer].approved_by_HOS": "",
              "checkSheet_data.$[outer].preparation_HOS_date": "",
              "checkSheet_data.$[outer].rejected_remarks": rejected_remarks,
            },
          },
          {
            arrayFilters: [
              {
                "outer.current_year":
                  machineLastData[0].checkSheet_data.current_year,
              },
            ],
          }
        );

        const findAssignHOSName = await User.findOne({
          email:
            machineLastData[0]?.checkSheet_data?.assign_HOS?.[
              machineLastData[0]?.checkSheet_data?.checkSheetSendingUser
                ?.length - 1
            ],
        });

        let greetingNames = `${findAssignHOSName.tm_name} and ${
          machineLastData[0].checkSheet_data.sender_tm_name[
            machineLastData[0].checkSheet_data.sender_tm_name.length - 1
          ]
        }`;

        subject = `Checksheet Preparation Rejected (${machineLastData[0]?.cell_name}/${machineLastData[0]?.line_name}/${machineLastData[0]?.machine_code})`;
        title = `Checksheet is rejected for Below reason`;
        greetings = `Sir\\Ma'am`;
        bodyTable = `<table style="font-family: arial, sans-serif;border-collapse: collapse;width: 100%;">

                        <tr>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">Reason Detail</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${rejected_remarks}</td>
                        </tr>

                        <tr style="background-color: #dddddd;">
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">Cell/Product</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${machineLastData[0]?.cell_name}</td>
                        </tr>
                        
                        <tr >
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">Line</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${machineLastData[0]?.line_name}</td>
                        </tr>

                        <tr style="background-color: #dddddd;">
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">Machine</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${machineLastData[0]?.machine_name}</td>
                        </tr>
                    
                        <tr >
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">Rejected by</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${loggedUserData?.tm_name}</td>
                        </tr>   
                        
                        <tr style="background-color: #dddddd;">
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">Date and Time</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${preparation_TL_HOSS_date}</td>
                        </tr>
                        
                    </table>`;

        sendApproval(
          subject,
          title,
          greetings,
          bodyTable,
          undefined,
          greetingNames,
          machineLastData[0].checkSheet_data.sender_tm_no[
            machineLastData[0].checkSheet_data.sender_tm_no.length - 1
          ],
          machineLastData[0].checkSheet_data.sender_tm_name[
            machineLastData[0].checkSheet_data.sender_tm_name.length - 1
          ],
          machineLastData[0].machine_code,
          machineLastData[0].machine_name,
          machineLastData[0].checkSheet_data.checksheet_status,
          requestSenderUserData?.user_type === "Operator"
            ? undefined
            : machineLastData[0].checkSheet_data.checkSheetSendingUser[
                machineLastData[0].checkSheet_data.checkSheetSendingUser
                  .length - 1
              ] || undefined,
          machineLastData[0].checkSheet_data.assign_HOS[
            machineLastData[0].checkSheet_data.checkSheetSendingUser.length - 1
          ],
          tlApproval,
          undefined,
          undefined,
          rejected_remarks
        );
      } else if (
        machineLastData[0].checkSheet_data.tl_approval_status[
          machineLastData[0].checkSheet_data.tl_approval_status.length - 1
        ] === "Accepted" &&
        machineLastData[0].checkSheet_data.hos_approval_status[
          machineLastData[0].checkSheet_data.hos_approval_status.length - 1
        ] === "Pending"
      ) {
        let hosApproval = "Rejected";
        machineLastData[0].checkSheet_data.hos_approval_status[
          machineLastData[0].checkSheet_data.hos_approval_status.length - 1
        ] = "Rejected";

        const requestSenderUserData = await User.findOne({
          tm_no:
            machineLastData[0]?.checkSheet_data?.sender_tm_no[
              machineLastData[0]?.checkSheet_data?.sender_tm_no?.length - 1
            ],
        });

        const TLApprovalStatusUpdate = await Machine.updateOne(
          { machine_code: machineLastData[0].machine_code },
          {
            $set: {
              "checkSheet_data.$[outer].hos_approval_status":
                machineLastData[0].checkSheet_data.hos_approval_status,
            },
            $push: {
              "checkSheet_data.$[outer].preparation_HOS_date":
                preparation_HOS_date,
              "checkSheet_data.$[outer].rejected_remarks": rejected_remarks,
            },
          },
          {
            arrayFilters: [
              {
                "outer.current_year":
                  machineLastData[0].checkSheet_data.current_year,
              },
            ],
          }
        );

        subject = `Checksheet Preparation Rejected (${machineLastData[0]?.cell_name}/${machineLastData[0]?.line_name}/${machineLastData[0]?.machine_code})`;
        title = `Checksheet is rejected for Below reason`;
        greetings = `TM`;
        bodyTable = `<table style="font-family: arial, sans-serif;border-collapse: collapse;width: 100%;">
    
                            <tr>
                                <td style="border: 1px solid black;text-align: left;padding: 8px;">Reason Detail</td>
                                <td style="border: 1px solid black;text-align: left;padding: 8px;">${rejected_remarks}</td>
                            </tr>
    
                            <tr style="background-color: #dddddd;">
                                <td style="border: 1px solid black;text-align: left;padding: 8px;">Cell/Product</td>
                                <td style="border: 1px solid black;text-align: left;padding: 8px;">${machineLastData[0]?.cell_name}</td>
                            </tr>
                            
                            <tr >
                                <td style="border: 1px solid black;text-align: left;padding: 8px;">Line</td>
                                <td style="border: 1px solid black;text-align: left;padding: 8px;">${machineLastData[0]?.line_name}</td>
                            </tr>
    
                            <tr style="background-color: #dddddd;">
                                <td style="border: 1px solid black;text-align: left;padding: 8px;">Machine</td>
                                <td style="border: 1px solid black;text-align: left;padding: 8px;">${machineLastData[0]?.machine_name}</td>
                            </tr>
                        
                            <tr >
                                <td style="border: 1px solid black;text-align: left;padding: 8px;">Rejected by</td>
                                <td style="border: 1px solid black;text-align: left;padding: 8px;">${loggedUserData?.tm_name}</td>
                            </tr>   
                            
                            <tr style="background-color: #dddddd;">
                                <td style="border: 1px solid black;text-align: left;padding: 8px;">Date and Time</td>
                                <td style="border: 1px solid black;text-align: left;padding: 8px;">${preparation_HOS_date}</td>
                            </tr>
                            
                        </table>`;

        sendApproval(
          subject,
          title,
          greetings,
          bodyTable,
          undefined,
          machineLastData[0].checkSheet_data.sender_tm_name[
            machineLastData[0].checkSheet_data.sender_tm_name.length - 1
          ],
          machineLastData[0].checkSheet_data.sender_tm_no[
            machineLastData[0].checkSheet_data.sender_tm_no.length - 1
          ],
          machineLastData[0].checkSheet_data.sender_tm_name[
            machineLastData[0].checkSheet_data.sender_tm_name.length - 1
          ],
          machineLastData[0].machine_code,
          machineLastData[0].machine_name,
          machineLastData[0].checkSheet_data.checksheet_status,
          requestSenderUserData?.user_type === "Operator"
            ? undefined
            : machineLastData[0].checkSheet_data.checkSheetSendingUser[
                machineLastData[0].checkSheet_data.checkSheetSendingUser
                  .length - 1
              ] || undefined,
          undefined,
          machineLastData[0].checkSheet_data.tl_approval_status[
            machineLastData[0].checkSheet_data.tl_approval_status.length - 1
          ],
          hosApproval,
          undefined,
          rejected_remarks
        );
      } else if (
        machineLastData[0].checkSheet_data.hos_approval_status[
          machineLastData[0].checkSheet_data.hos_approval_status.length - 1
        ] === "Pending"
      ) {
        let hosApproval = "Rejected";

        const requestSenderUserData = await User.findOne({
          tm_no:
            machineLastData[0]?.checkSheet_data?.sender_tm_no[
              machineLastData[0]?.checkSheet_data?.sender_tm_no?.length - 1
            ],
        });

        machineLastData[0].checkSheet_data.hos_approval_status[
          machineLastData[0].checkSheet_data.hos_approval_status.length - 1
        ] = "Rejected";
        const TLApprovalStatusUpdate = await Machine.updateOne(
          { machine_code: machineLastData[0].machine_code },
          {
            $set: {
              "checkSheet_data.$[outer].hos_approval_status":
                machineLastData[0].checkSheet_data.hos_approval_status,
            },
            $push: {
              "checkSheet_data.$[outer].preparation_HOS_date":
                preparation_HOS_date,
              "checkSheet_data.$[outer].rejected_remarks": rejected_remarks,
            },
          },
          {
            arrayFilters: [
              {
                "outer.current_year":
                  machineLastData[0].checkSheet_data.current_year,
              },
            ],
          }
        );

        if (requestSenderUserData?.user_type !== "Operator") {
          subject = `Checksheet Preparation Rejected (${machineLastData[0]?.cell_name}/${machineLastData[0]?.line_name}/${machineLastData[0]?.machine_code})`;
          title = `Checksheet is rejected for Below reason`;
          greetings = `TM`;
          bodyTable = `<table style="font-family: arial, sans-serif;border-collapse: collapse;width: 100%;">

                        <tr>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">Reason Detail</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${rejected_remarks}</td>
                        </tr>

                        <tr style="background-color: #dddddd;">
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">Cell/Product</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${machineLastData[0]?.cell_name}</td>
                        </tr>
                        
                        <tr >
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">Line</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${machineLastData[0]?.line_name}</td>
                        </tr>

                        <tr style="background-color: #dddddd;">
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">Machine</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${machineLastData[0]?.machine_name}</td>
                        </tr>
                    
                        <tr >
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">Rejected by</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${loggedUserData?.tm_name}</td>
                        </tr>   
                        
                        <tr style="background-color: #dddddd;">
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">Date and Time</td>
                            <td style="border: 1px solid black;text-align: left;padding: 8px;">${preparation_HOS_date}</td>
                        </tr>
                        
                    </table>`;

          sendApproval(
            subject,
            title,
            greetings,
            bodyTable,
            undefined,
            machineLastData[0].checkSheet_data.sender_tm_name[
              machineLastData[0].checkSheet_data.sender_tm_name.length - 1
            ],
            machineLastData[0].checkSheet_data.sender_tm_no[
              machineLastData[0].checkSheet_data.sender_tm_no.length - 1
            ],
            machineLastData[0].checkSheet_data.sender_tm_name[
              machineLastData[0].checkSheet_data.sender_tm_name.length - 1
            ],
            machineLastData[0].machine_code,
            machineLastData[0].machine_name,
            machineLastData[0].checkSheet_data.checksheet_status,
            machineLastData[0].checkSheet_data.checkSheetSendingUser[
              machineLastData[0].checkSheet_data.checkSheetSendingUser.length -
                1
            ],
            undefined,
            undefined,
            hosApproval,
            "No",
            rejected_remarks
          );
        }
      } else if (
        machineLastData[0].checkSheet_data.prd_tl_approval_status[
          machineLastData[0].checkSheet_data.prd_tl_approval_status.length - 1
        ] === "Pending"
      ) {
        let prdTlApproval = "Rejected";
        machineLastData[0].checkSheet_data.prd_tl_approval_status[
          machineLastData[0].checkSheet_data.prd_tl_approval_status.length - 1
        ] = "Rejected";
        const PRDTLApprovalStatusUpdate = await Machine.updateOne(
          { machine_code: machineLastData[0].machine_code },
          {
            $set: {
              "checkSheet_data.$[outer].prd_tl_approval_status":
                machineLastData[0].checkSheet_data.prd_tl_approval_status,
              "checkSheet_data.$[outer].rejected_remarks": rejected_remarks,
            },
            $push: {
              "checkSheet_data.$[outer].planning_PRD_TL_date":
                planning_PRD_TL_date,
              "checkSheet_data.$[outer].approved_by_PRD_TL": "",
            },
          },
          {
            arrayFilters: [
              {
                "outer.current_year":
                  machineLastData[0].checkSheet_data.current_year,
              },
            ],
          }
        );
        // sendApproval(undefined, undefined, undefined, undefined, undefined, machineLastData[0].checkSheet_data.plan_prepared_tm_name[(machineLastData[0].checkSheet_data.plan_prepared_tm_name).length - 1], machineLastData[0].checkSheet_data.plan_prepared_tm_no[(machineLastData[0].checkSheet_data.plan_prepared_tm_no).length - 1],
        //     machineLastData[0].checkSheet_data.plan_prepared_tm_name[(machineLastData[0].checkSheet_data.plan_prepared_tm_name).length - 1],
        //     machineLastData[0].machine_code,
        //     machineLastData[0].machine_name,
        //     machineLastData[0].checkSheet_data.checksheet_status,
        //     machineLastData[0].checkSheet_data.plan_prepared_email[(machineLastData[0].checkSheet_data.plan_prepared_email).length - 1],
        //     undefined,
        //     undefined,
        //     prdTlApproval,
        //     "No", rejected_remarks)
      }
      //Implemetation rejected by PRD TL
      else if (
        machineLastData[0]?.checkSheet_data
          ?.implemetation_prd_tl_approval_status?.[senderApprovalMonth]?.[
          machineLastData[0]?.checkSheet_data
            ?.implemetation_prd_tl_approval_status?.[senderApprovalMonth]
            ?.length - 1
        ] === "Pending"
      ) {
        let machineLastDataForKeyexistsOrNot = await Machine.aggregate([
          {
            $match: {
              machine_code: machineLastData[0].machine_code,
            },
          },
          { $unwind: "$checkSheet_data" },
          {
            $match: {
              "checkSheet_data.current_year":
                machineLastData[0].checkSheet_data.current_year,
            },
          },
          {
            $project: {
              machine_code: 1,
              machine_name: 1,
              machine_nickname: 1,
              machine_sequence: 1,
              installation_date: 1,
              maker_name: 1,
              maker_sr_no: 1,
              manufacturingDate: 1,
              isPM: 1,
              line_names: 1,
              checkSheet_data: 1,
            },
          },
        ]);

        // const keyExistsCheck = await Machine.findOne({ machine_code: machineLastData[0].machine_code, "checkSheet_data.implementation_rejected_remarks": { $exists: true } });

        if (
          machineLastDataForKeyexistsOrNot?.[0]?.checkSheet_data
            ?.implementation_rejected_remarks === undefined
        ) {
          const updateImplementationData = await Machine.updateOne(
            { machine_code: machineLastData[0].machine_code },
            {
              $set: {
                "checkSheet_data.$[outer].implementation_rejected_remarks":
                  creationMonthKeyArray,
                "checkSheet_data.$[outer].implementation_approved_MTD_TL_date":
                  creationMonthKeyArray,
                "checkSheet_data.$[outer].implementation_approved_MTD_HOS_date":
                  creationMonthKeyArray,
                "checkSheet_data.$[outer].implementation_approved_by_MTD_HOS":
                  creationMonthKeyArray,
                "checkSheet_data.$[outer].implementation_approved_by_MTD_TL":
                  creationMonthKeyArray,
                "checkSheet_data.$[outer].implementation_approved_by_PRD_TL":
                  creationMonthKeyArray,
                "checkSheet_data.$[outer].implementation_approved_PRD_TL_date":
                  creationMonthKeyArray,
              },
            },
            {
              arrayFilters: [
                {
                  "outer.current_year":
                    machineLastData[0].checkSheet_data.current_year,
                },
              ],
            }
          );
        }

        machineLastData[0].checkSheet_data.implemetation_prd_tl_approval_status[
          senderApprovalMonth
        ][
          machineLastData[0].checkSheet_data
            .implemetation_prd_tl_approval_status[senderApprovalMonth].length -
            1
        ] = "Rejected";

        const PRDTLApprovalStatusUpdateOfImplementation =
          await Machine.updateOne(
            { machine_code: machineLastData[0].machine_code },
            {
              $set: {
                [keyOfImplemetation_prd_tl_approval_status]:
                  machineLastData[0]?.checkSheet_data
                    ?.implemetation_prd_tl_approval_status?.[
                    senderApprovalMonth
                  ],
              },
              $push: {
                [keyOfImplementation_approved_PRD_TL_date]:
                  implementation_approved_PRD_TL_date,
                [keyOfImplementation_approved_by_PRD_TL]: "",
                [keyOfImplemetation_quality_remarks]: "",
                [keyOfImplementation_approved_MTD_TL_date]: "",
                [keyOfImplementation_rejected_remarks]: rejected_remarks,
                [keyOfImplementation_approved_by_MTD_TL]: "",
                [keyOfImplementation_approved_by_MTD_HOS]: "",
                [keyOfImplementation_approved_MTD_HOS_date]: "",
              },
            },
            {
              arrayFilters: [
                {
                  "outer.current_year":
                    machineLastData[0].checkSheet_data.current_year,
                },
              ],
            }
          );
      } else if (
        machineLastData[0].checkSheet_data.implemetation_prd_tl_approval_status[
          senderApprovalMonth
        ][
          machineLastData[0].checkSheet_data
            .implemetation_prd_tl_approval_status[senderApprovalMonth].length -
            1
        ] === "Accepted" &&
        machineLastData[0].checkSheet_data.implemetation_mtd_tl_approval_status[
          senderApprovalMonth
        ][
          machineLastData[0].checkSheet_data
            .implemetation_mtd_tl_approval_status[senderApprovalMonth].length -
            1
        ] === "Pending"
      ) {
        let mtd_tl_approval_status = "Rejected";
        // console.log(implementation_approved_MTD_TL_date);

        let machineLastDataForKeyexistsOrNot = await Machine.aggregate([
          {
            $match: {
              machine_code: machineLastData[0].machine_code,
            },
          },
          { $unwind: "$checkSheet_data" },
          {
            $match: {
              "checkSheet_data.current_year":
                machineLastData[0].checkSheet_data.current_year,
            },
          },
          {
            $project: {
              machine_code: 1,
              machine_name: 1,
              machine_nickname: 1,
              machine_sequence: 1,
              installation_date: 1,
              maker_name: 1,
              maker_sr_no: 1,
              manufacturingDate: 1,
              isPM: 1,
              line_names: 1,
              checkSheet_data: 1,
            },
          },
        ]);

        // const keyExistsCheck = await Machine.findOne({ machine_code: machineLastData[0].machine_code, "checkSheet_data.implementation_rejected_remarks": { $exists: true } });

        if (
          machineLastDataForKeyexistsOrNot?.[0]?.checkSheet_data
            ?.implementation_rejected_remarks === undefined
        ) {
          const updateImplementationData = await Machine.updateOne(
            { machine_code: machineLastData[0].machine_code },
            {
              $set: {
                "checkSheet_data.$[outer].implementation_rejected_remarks":
                  creationMonthKeyArray,
                "checkSheet_data.$[outer].implementation_approved_MTD_TL_date":
                  creationMonthKeyArray,
                "checkSheet_data.$[outer].implementation_approved_MTD_HOS_date":
                  creationMonthKeyArray,
                "checkSheet_data.$[outer].implementation_approved_by_MTD_HOS":
                  creationMonthKeyArray,
                "checkSheet_data.$[outer].implementation_approved_by_MTD_TL":
                  creationMonthKeyArray,
              },
            },
            {
              arrayFilters: [
                {
                  "outer.current_year":
                    machineLastData[0].checkSheet_data.current_year,
                },
              ],
            }
          );
        }

        machineLastData[0].checkSheet_data.implemetation_mtd_tl_approval_status[
          senderApprovalMonth
        ][
          machineLastData[0].checkSheet_data
            .implemetation_mtd_tl_approval_status[senderApprovalMonth].length -
            1
        ] = "Rejected";
        const MTDTLApprovalStatusUpdateOfImplementation =
          await Machine.updateOne(
            { machine_code: machineLastData[0].machine_code },
            {
              $set: {
                [keyOfImplemetation_mtd_tl_approval_status]:
                  machineLastData[0].checkSheet_data
                    .implemetation_mtd_tl_approval_status[senderApprovalMonth],
              },
              $push: {
                [keyOfImplementation_approved_MTD_TL_date]:
                  implementation_approved_MTD_TL_date,
                [keyOfImplementation_rejected_remarks]: rejected_remarks,
                [keyOfImplementation_approved_by_MTD_TL]: "",
                [keyOfImplementation_approved_by_MTD_HOS]: "",
                [keyOfImplementation_approved_MTD_HOS_date]: "",
              },
            },
            {
              arrayFilters: [
                {
                  "outer.current_year":
                    machineLastData[0].checkSheet_data.current_year,
                },
              ],
            }
          );
        const findAssignMTDHOSNameOfImplementation = await User.findOne({
          email:
            machineLastData[0]?.checkSheet_data
              ?.implementation_assign_MTD_HOS?.[senderApprovalMonth][
              machineLastData[0]?.checkSheet_data
                ?.implementation_assign_MTD_HOS?.[senderApprovalMonth]?.length -
                1
            ],
        });
        let greetingNamesForAll = "All";
        // sendApprovalOfImplementation(findAssignMTDHOSNameOfImplementation,
        //     machineLastData[0].checkSheet_data.implemetation_completed_tm_no[senderApprovalMonth][(machineLastData[0].checkSheet_data.implemetation_completed_tm_no[senderApprovalMonth]).length - 1],
        //     machineLastData[0].checkSheet_data.implemetation_completed_tm_name[senderApprovalMonth][(machineLastData[0].checkSheet_data.implemetation_completed_tm_name[senderApprovalMonth]).length - 1],
        //     machineLastData[0].machine_code,
        //     machineLastData[0].machine_name,
        //     machineLastData[0].checkSheet_data.checksheet_status,
        //     machineLastData[0].checkSheet_data.implementation_assign_MTD_HOS[senderApprovalMonth][(machineLastData[0].checkSheet_data.implementation_assign_MTD_HOS[senderApprovalMonth]).length - 1],
        //     undefined,
        //     machineLastData[0].checkSheet_data.implemetation_prd_tl_approval_status[senderApprovalMonth][(machineLastData[0].checkSheet_data.implemetation_prd_tl_approval_status[senderApprovalMonth]).length - 1],
        //     mtd_tl_approval_status,
        //     undefined, rejected_remarks)
      } else if (
        machineLastData[0].checkSheet_data.implemetation_prd_tl_approval_status[
          senderApprovalMonth
        ][
          machineLastData[0].checkSheet_data
            .implemetation_prd_tl_approval_status[senderApprovalMonth].length -
            1
        ] === "Accepted" &&
        machineLastData[0].checkSheet_data.implemetation_mtd_tl_approval_status[
          senderApprovalMonth
        ][
          machineLastData[0].checkSheet_data
            .implemetation_mtd_tl_approval_status[senderApprovalMonth].length -
            1
        ] === "Accepted" &&
        machineLastData[0].checkSheet_data
          .implemetation_mtd_hos_approval_status[senderApprovalMonth][
          machineLastData[0].checkSheet_data
            .implemetation_mtd_hos_approval_status[senderApprovalMonth].length -
            1
        ] === "Pending"
      ) {
        let machineLastDataForKeyexistsOrNot = await Machine.aggregate([
          {
            $match: {
              machine_code: machineLastData[0].machine_code,
            },
          },
          { $unwind: "$checkSheet_data" },
          {
            $match: {
              "checkSheet_data.current_year":
                machineLastData[0].checkSheet_data.current_year,
            },
          },
          {
            $project: {
              machine_code: 1,
              machine_name: 1,
              machine_nickname: 1,
              machine_sequence: 1,
              installation_date: 1,
              maker_name: 1,
              maker_sr_no: 1,
              manufacturingDate: 1,
              isPM: 1,
              line_names: 1,
              checkSheet_data: 1,
            },
          },
        ]);

        // const keyExistsCheck = await Machine.findOne({ machine_code: machineLastData[0].machine_code, "checkSheet_data.implementation_rejected_remarks": { $exists: true } });

        if (
          machineLastDataForKeyexistsOrNot?.[0]?.checkSheet_data
            ?.implementation_rejected_remarks === undefined
        ) {
          const updateImplementationData = await Machine.updateOne(
            { machine_code: machineLastData[0].machine_code },
            {
              $set: {
                "checkSheet_data.$[outer].implementation_rejected_remarks":
                  creationMonthKeyArray,
              },
            },
            {
              arrayFilters: [
                {
                  "outer.current_year":
                    machineLastData[0].checkSheet_data.current_year,
                },
              ],
            }
          );
        }
        machineLastData[0].checkSheet_data.implemetation_mtd_hos_approval_status[
          senderApprovalMonth
        ][
          machineLastData[0].checkSheet_data
            .implemetation_mtd_hos_approval_status[senderApprovalMonth].length -
            1
        ] = "Rejected";
        const MTDHOSApprovalStatusUpdateOfImplementation =
          await Machine.updateOne(
            { machine_code: machineLastData[0].machine_code },
            {
              $set: {
                [keyOfImplemetation_mtd_hos_approval_status]:
                  machineLastData[0].checkSheet_data
                    .implemetation_mtd_hos_approval_status[senderApprovalMonth],
              },
              $push: {
                [keyOfImplementation_approved_MTD_HOS_date]:
                  implementation_approved_MTD_HOS_date,
                [keyOfImplementation_rejected_remarks]: rejected_remarks,
                [keyOfImplementation_approved_by_MTD_HOS]: "",
              },
            },
            {
              arrayFilters: [
                {
                  "outer.current_year":
                    machineLastData[0].checkSheet_data.current_year,
                },
              ],
            }
          );
      } else if (
        machineLastData[0].checkSheet_data
          .implemetation_mtd_hod_approval_status[
          machineLastData[0]?.senderApprovalMonth
        ]?.[
          machineLastData[0].checkSheet_data
            .implemetation_mtd_hod_approval_status[
            machineLastData[0]?.senderApprovalMonth
          ] - 1
        ] === "Pending"
      ) {
        let machineLastDataForKeyexistsOrNot = await Machine.aggregate([
          {
            $match: {
              machine_code: machineLastData[0].machine_code,
            },
          },
          { $unwind: "$checkSheet_data" },
          {
            $match: {
              "checkSheet_data.current_year":
                machineLastData[0].checkSheet_data.current_year,
            },
          },
          {
            $project: {
              machine_code: 1,
              machine_name: 1,
              machine_nickname: 1,
              machine_sequence: 1,
              installation_date: 1,
              maker_name: 1,
              maker_sr_no: 1,
              manufacturingDate: 1,
              isPM: 1,
              line_names: 1,
              checkSheet_data: 1,
            },
          },
        ]);

        // const keyExistsCheck = await Machine.findOne({ machine_code: machineLastData[0].machine_code, "checkSheet_data.implementation_rejected_remarks": { $exists: true } });

        if (
          !machineLastDataForKeyexistsOrNot[0].checkSheet_data
            .implementation_rejected_remarks
        ) {
          const updateImplementationData = await Machine.updateOne(
            { machine_code: machineLastData[0].machine_code },
            {
              $set: {
                "checkSheet_data.$[outer].implementation_rejected_remarks":
                  creationMonthKeyArray,
              },
            },
            {
              arrayFilters: [
                {
                  "outer.current_year":
                    machineLastData[0].checkSheet_data.current_year,
                },
              ],
            }
          );
        }
        machineLastData[0].checkSheet_data.implemetation_mtd_hos_approval_status[
          monthForCompareSystemMonth
        ][
          machineLastData[0].checkSheet_data
            .implemetation_mtd_hos_approval_status[monthForCompareSystemMonth]
            .length - 1
        ] = "Rejected";
        const MTDHOSApprovalStatusUpdateOfImplementation =
          await Machine.updateOne(
            { machine_code: machineLastData[0].machine_code },
            {
              $set: {
                [keyOfImplemetation_mtd_hos_approval_status]:
                  machineLastData[0].checkSheet_data
                    .implemetation_mtd_hos_approval_status[
                    monthForCompareSystemMonth
                  ],
              },
              $push: {
                [keyOfImplementation_approved_MTD_HOS_date]:
                  implementation_approved_MTD_HOS_date,
                [keyOfImplementation_rejected_remarks]: rejected_remarks,
                [keyOfImplementation_approved_by_MTD_HOS]: "",
              },
            },
            {
              arrayFilters: [
                {
                  "outer.current_year":
                    machineLastData[0].checkSheet_data.current_year,
                },
              ],
            }
          );
      }
    }

    return res.status(201).json("Checksheet approval done!!!");
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log(error);
    console.log("Data not valid or received !!!");
  }
});

//update selcted machine checksheet data row
router.post(
  "/updateSelectedMachineCheckSheetTableRowDataForStartingMonth",
  async (req, res) => {
    try {
      const { oldRow, machineId, yearOfCheckSheet } = req.body;
      let { rowData } = req.body;
      // console.log(rowData)

      let planningTableAnimationArray2 = {
        Apr: ["0"],

        May: ["0"],

        June: ["0"],

        July: ["0"],

        Aug: ["0"],

        Sep: ["0"],

        Oct: ["0"],

        Nov: ["0"],

        Dec: ["0"],

        Jan: ["0"],

        Feb: ["0"],

        Mar: ["0"],
      };

      let getSelectedMachineChecksheet = await Machine.aggregate([
        {
          $match: {
            machine_code: machineId,
            "checkSheet_data.current_year": yearOfCheckSheet,
          },
        },
        { $unwind: "$checkSheet_data" },
        {
          $match: { "checkSheet_data.current_year": yearOfCheckSheet },
        },
      ]);
      const monthKeyArrayForMidYearChangeMonth = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "June",
        "July",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      let monthForCompareSystemMonth =
        monthKeyArrayForMidYearChangeMonth[new Date().getMonth()];

      // console.log(getSelectedMachineChecksheet)
      const monthKeyArray = [
        "Apr",
        "May",
        "June",
        "July",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
        "Jan",
        "Feb",
        "Mar",
      ];
      // console.log(planningTableAnimationArray2);
      let someArray = [
        "0",
        "0",
        "0",
        "0",
        "0",
        "0",
        "0",
        "0",
        "0",
        "0",
        "0",
        "0",
      ];

      let cycleValue =
        oldRow.cycle === "1/1M"
          ? 1
          : oldRow.cycle === "1/2M"
          ? 2
          : oldRow.cycle === "1/3M"
          ? 3
          : oldRow.cycle === "1/4M"
          ? 4
          : oldRow.cycle === "1/6M"
          ? 6
          : 12;

      let Cycle = cycleValue;

      let startMonth = rowData.start_month;

      let updateChecksheetRow;

      for (let i = 0; i < 12 / Cycle && rowData.start_month < 12; i++) {
        let monthOfkey = monthKeyArray[rowData.start_month];

        planningTableAnimationArray2[monthOfkey][0] = "1";

        rowData.start_month = parseInt(rowData.start_month) + Cycle;
      }

      // console.log(planningTableAnimationArray2)
      // console.log("ROw data---> ", rowData.planningTableAnimationArray2)
      if (
        getSelectedMachineChecksheet[0]?.checkSheet_data?.revisionContentData
          ?.length > 0
      ) {
        //for mid year new inception item added and add start month
        if (rowData?.isAdded === true) {
          updateChecksheetRow = await Machine.updateOne(
            { machine_code: machineId },
            {
              $set: {
                "checkSheet_data.$[outer].checkSheet.$[inner].start_month":
                  startMonth,
                "checkSheet_data.$[outer].checkSheet.$[inner].planningTableAnimationArray2":
                  planningTableAnimationArray2,
                // "checkSheet_data.$[outer].flagForRevisionContent": true,
              },
            },
            {
              arrayFilters: [
                { "outer.current_year": yearOfCheckSheet },
                { "inner.tableRowId": rowData.tableRowId },
              ],
            }
          );
        } else {
          for (
            let i = monthKeyArray.indexOf(monthForCompareSystemMonth);
            i < monthKeyArray.length;
            i++
          ) {
            rowData.planningTableAnimationArray2[monthKeyArray[i]] =
              planningTableAnimationArray2[monthKeyArray[i]];
          }
          console.log("after dt --->", rowData.planningTableAnimationArray2);
          updateChecksheetRow = await Machine.updateOne(
            { machine_code: machineId },
            {
              $set: {
                "checkSheet_data.$[outer].checkSheet.$[inner].start_month":
                  startMonth,
                "checkSheet_data.$[outer].checkSheet.$[inner].planningTableAnimationArray2":
                  rowData.planningTableAnimationArray2,
                // "checkSheet_data.$[outer].flagForRevisionContent": true,
              },
            },
            {
              arrayFilters: [
                { "outer.current_year": yearOfCheckSheet },
                { "inner.tableRowId": rowData.tableRowId },
              ],
            }
          );
        }
      } else {
        updateChecksheetRow = await Machine.updateOne(
          { machine_code: machineId },
          {
            $set: {
              "checkSheet_data.$[outer].checkSheet.$[inner].start_month":
                startMonth,
              "checkSheet_data.$[outer].checkSheet.$[inner].planningTableAnimationArray2":
                planningTableAnimationArray2,
            },
          },
          {
            arrayFilters: [
              { "outer.current_year": yearOfCheckSheet },
              { "inner.tableRowId": rowData.tableRowId },
            ],
          }
        );
      }
      if (updateChecksheetRow) {
        res.status(201).json({ message: "TableRow updated successfully" });
      } else {
        res.status(400).json("TableRow not updated!!!");
      }
      // console.log(updateChecksheetRow)
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      res.status(409).json("TableRow already exists!!!");
      // console.log(error)
    }
  }
);

let fileNameForLogHistory;
//add data of implementation when operator worked on machine PM
router.post(
  "/postImplementationWorkedData/:dashboardName",
  upload1.single("photoUpload"),
  authenticate,
  async (req, res) => {
    try {
      const {
        workedOnPM,
        remarksOfImplementation,
        machineId,
        tableRowId,
        yearOfCheckSheet,
        monthForCompareSystemMonth,
        previousMonth,
        abnormalityRemarks,
        abnormalityStatus,
        targetDate,
        spareParts,
        partName,
        partNo,
        cost,
        completionDateOfInspection,
      } = req.body;

      const loggedUserData = req.rootUser;

      let arrayForPMData = [];
      arrayForPMData.push(1, workedOnPM, remarksOfImplementation);

      let arrayForDonePreviousMonthPMPMData = [];
      arrayForDonePreviousMonthPMPMData.push(
        2,
        workedOnPM,
        remarksOfImplementation
      );

      let PMStatusArray = {
        Apr: "",

        May: "",

        June: "",

        July: "",

        Aug: "",

        Sep: "",

        Oct: "",

        Nov: "",

        Dec: "",

        Jan: "",

        Feb: "",

        Mar: "",
      };

      let PMDelayRemarksMonthArray = {
        Apr: "",

        May: "",

        June: "",

        July: "",

        Aug: "",

        Sep: "",

        Oct: "",

        Nov: "",

        Dec: "",

        Jan: "",

        Feb: "",

        Mar: "",
      };

      let plannedPMCount = 0;
      let completedPMCount = 0;
      let totalCarriedPMCount = 0;
      let completedCarriedPMCount = 0;

      let perticularMachine = await Machine.aggregate([
        {
          $match: {
            machine_code: machineId,
          },
        },
        {
          $unwind: "$checkSheet_data",
        },
        {
          $match: {
            "checkSheet_data.current_year": yearOfCheckSheet,
          },
        },
        {
          $project: {
            machine_code: 1,
            machine_name: 1,
            machine_nickname: 1,
            machine_sequence: 1,
            installation_date: 1,
            maker_name: 1,
            maker_sr_no: 1,
            manufacturingDate: 1,
            isPM: 1,
            line_names: 1,
            checkSheet_data: 1,
          },
        },
      ]);

      let machinePopulateData = await Machine.populate(perticularMachine, {
        path: "line_names",
        populate: {
          path: "cell_names",
          populate: {
            path: "subSection_names",
            model: "SubSections",
          },
        },
      });

      // const perticularMachine = await Machine.findOne({ machine_code: machineId })

      PMStatusArray[monthForCompareSystemMonth] = "Ongoing";

      // console.log(PMworkedTMNameArray)

      let updateStatus;
      let keyOfCompletedMonthPM = `checkSheet_data.$[outer].PMStatus.${monthForCompareSystemMonth}`;
      let keyOfCarriedCompletedMonthPM = `checkSheet_data.$[outer].PMStatus.${previousMonth}`;
      let keyOfPreviousMonth = `checkSheet_data.$[outer].checkSheet.$[inner].planningTableAnimationArray2.${previousMonth}`;

      let arrayForUpdatePreviousMonthDelayPMData = [];
      arrayForUpdatePreviousMonthDelayPMData.push(1, "delay");

      let keyOfMonth = `checkSheet_data.$[outer].checkSheet.$[inner].planningTableAnimationArray2.${monthForCompareSystemMonth}`;
      let keyOfPMOkImage = `checkSheet_data.$[outer].checkSheet.$[inner].PMOkImage.${monthForCompareSystemMonth}`;
      let keyOfCompletionDateOfInspection = `checkSheet_data.$[outer].checkSheet.$[inner].completionDateOfInspection.${monthForCompareSystemMonth}`;
      let keyOfInspectionCompletionBy = `checkSheet_data.$[outer].checkSheet.$[inner].inspectionCompletionBy.${monthForCompareSystemMonth}`;

      //for abnormality
      let keyOfAbnormalityRemarks = `checkSheet_data.$[outer].checkSheet.$[inner].abnormalityDetails.${monthForCompareSystemMonth}.abnormalityRemarks`;
      let keyOfAbnormalityStatus = `checkSheet_data.$[outer].checkSheet.$[inner].abnormalityDetails.${monthForCompareSystemMonth}.abnormalityStatus`;
      let keyOfTargetdate = `checkSheet_data.$[outer].checkSheet.$[inner].abnormalityDetails.${monthForCompareSystemMonth}.targetDate`;
      let keyOfAbnormalityImage = `checkSheet_data.$[outer].checkSheet.$[inner].abnormalityDetails.${monthForCompareSystemMonth}.PMuploadedImage`;

      //for spare parts
      let keyOfSpareParts = `checkSheet_data.$[outer].checkSheet.$[inner].spareDetails.${monthForCompareSystemMonth}.spareParts`;
      let keyOfPartName = `checkSheet_data.$[outer].checkSheet.$[inner].spareDetails.${monthForCompareSystemMonth}.partName`;
      let keyOfPartNo = `checkSheet_data.$[outer].checkSheet.$[inner].spareDetails.${monthForCompareSystemMonth}.partNo`;
      let keyOfCost = `checkSheet_data.$[outer].checkSheet.$[inner].spareDetails.${monthForCompareSystemMonth}.cost`;

      //mail content for abnormality open with target date
      const sectionInfo = await Section.findOne({
        section_id: loggedUserData?.section_data?.split("-")?.[0],
      });
      if (sectionInfo.dashboardLevel === "Yes") {
        userInfo = await User.find({
          section_data: `${sectionInfo?.section_id}-${sectionInfo?.section_name}`,
        });
        toEmailArray = userInfo?.map((result) => {
          if (result.user_type === "TL/HOSS") {
            // return result
            return result?.email ? result?.email : undefined;
          }
        });

        ccEmailArray = userInfo?.map((result) => {
          if (
            ((result.tm_department === "PRD" ||
              result.tm_department === "MTD") &&
              result.user_type === "HOS") ||
            (result.tm_department === "MTD" && result.user_type === "HOD")

            // (result.tm_department === "PRD" || result.tm_department === "MTD")
            // && (result.user_type === "TL/HOSS" || result.user_type === "HOS" || result.user_type === "HOD")
          ) {
            return result;
            // return result?.email ? result?.email : undefined
          }
        });
      } else {
        userInfo = await User.find({
          subSection_data: `${machinePopulateData[0]?.line_names?.cell_names?.subSection_names?.subSection_id}-${machinePopulateData[0]?.line_names?.cell_names?.subSection_names?.subSection_name}`,
        });
        toEmailArray = userInfo?.map((result) => {
          if (result.user_type === "TL/HOSS") {
            // return result
            return result?.email ? result?.email : undefined;
          }
        });

        ccEmailArray = userInfo?.map((result) => {
          if (
            ((result.tm_department === "PRD" ||
              result.tm_department === "MTD") &&
              result.user_type === "HOS") ||
            (result.tm_department === "MTD" && result.user_type === "HOD")

            // (result.tm_department === "PRD" || result.tm_department === "MTD")
            // && (result.user_type === "TL/HOSS" || result.user_type === "HOS" || result.user_type === "HOD")
          ) {
            return result;
            // return result?.email ? result?.email : undefined
          }
        });
      }

      subject = `Abnormality Opened (${machinePopulateData[0]?.line_names?.cell_names?.cell_name}/${machinePopulateData[0]?.line_names?.line_name}/${machinePopulateData[0]?.machine_code})`;
      title = `Abnormality found in below Machine and will be Closed by "${targetDate}"`;
      greetings = `Sir/Mam`;
      bodyTable = `<table style="font-family: arial, sans-serif;border-collapse: collapse;width: 100%;">

<tr>
  <td style="border: 1px solid black;text-align: left;padding: 8px;">Cell/Product</td>
  <td style="border: 1px solid black;text-align: left;padding: 8px;">${machinePopulateData[0]?.line_names?.cell_names?.cell_name}</td>
</tr>

<tr style="background-color: #dddddd;">
  <td style="border: 1px solid black;text-align: left;padding: 8px;">Line</td>
  <td style="border: 1px solid black;text-align: left;padding: 8px;">${machinePopulateData[0]?.line_names?.line_name}</td>
</tr>

<tr>
    <td style="border: 1px solid black;text-align: left;padding: 8px;">Machine</td>
    <td style="border: 1px solid black;text-align: left;padding: 8px;">${machinePopulateData[0]?.machine_name}</td>
</tr>

<tr style="background-color: #dddddd;">
    <td style="border: 1px solid black;text-align: left;padding: 8px;">Machine No.</td>
    <td style="border: 1px solid black;text-align: left;padding: 8px;">${machinePopulateData[0]?.machine_code}</td>
</tr>
 
<tr>
  <td style="border: 1px solid black;text-align: left;padding: 8px;">Submitted by</td>
  <td style="border: 1px solid black;text-align: left;padding: 8px;">${loggedUserData?.tm_name}</td>
</tr>   

<tr style="background-color: #dddddd;">
    <td style="border: 1px solid black;text-align: left;padding: 8px;">Date and Time</td>
    <td style="border: 1px solid black;text-align: left;padding: 8px;">${completionDateOfInspection}</td>
</tr>
<tr style="background-color: #dddddd;">
    <td style="border: 1px solid black;text-align: left;padding: 8px;">Abnormality Remark</td>
    <td style="border: 1px solid black;text-align: left;padding: 8px;">${abnormalityRemarks}</td>
</tr>

</table>`;

      // console.log(perticularMachine)
      let addPmData;
      if (workedOnPM === "Yes") {
        // const checkField = await Machine.findOne({ machine_code: machineId, "checkSheet.tableRowId": tableRowId, "checkSheet.abnormalityDetails": { $exists: true }, "checkSheet.spareDetails": { $exists: true } })
        // // console.log(checkField)
        // let result
        // if (checkField) {
        //     result = await Machine.updateOne({ machine_code: machineId }, { $unset: { "checkSheet.$[].abnormalityDetails": "", "checkSheet.$[].spareDetails": "" } })
        // }
        let checkCarriedPM = 0;

        //for done with delay
        perticularMachine[0].checkSheet_data.checkSheet.map((key) => {
          //check if the any previous moth data carried in current month or not

          if (
            key.planningTableAnimationArray2[monthForCompareSystemMonth][0] ==
              "2" &&
            key.tableRowId == tableRowId &&
            !key?.isDeleted
          ) {
            checkCarriedPM = 1;
          }
        });
        if (checkCarriedPM === 1) {
          addPmData = await Machine.updateOne(
            { machine_code: machineId },
            {
              $set: {
                // [keyOfMonth]: {$each:[workedOnPM, remarksOfImplementation]}
                [keyOfMonth]: arrayForDonePreviousMonthPMPMData,
                [keyOfPreviousMonth]: arrayForUpdatePreviousMonthDelayPMData,
                [keyOfCompletionDateOfInspection]: completionDateOfInspection,
                [keyOfInspectionCompletionBy]: loggedUserData.tm_name,
              },
            },
            {
              arrayFilters: [
                { "outer.current_year": yearOfCheckSheet },
                { "inner.tableRowId": tableRowId },
              ],
            }
          );
        } else {
          if (req.file === undefined) {
            addPmData = await Machine.updateOne(
              { machine_code: machineId },
              {
                $set: {
                  // [keyOfMonth]: {$each:[workedOnPM, remarksOfImplementation]}
                  [keyOfMonth]: arrayForPMData,
                  [keyOfCompletionDateOfInspection]: completionDateOfInspection,
                  [keyOfInspectionCompletionBy]: loggedUserData.tm_name,
                },
              },
              {
                arrayFilters: [
                  { "outer.current_year": yearOfCheckSheet },
                  { "inner.tableRowId": tableRowId },
                ],
              }
            );
          } else {
            let PMuploadedImage = req.file.filename;
            fileNameForLogHistory = req?.file?.filename;
            addPmData = await Machine.updateOne(
              { machine_code: machineId },
              {
                $set: {
                  // [keyOfMonth]: {$each:[workedOnPM, remarksOfImplementation]}
                  [keyOfMonth]: arrayForPMData,
                  [keyOfPMOkImage]: PMuploadedImage,
                  [keyOfCompletionDateOfInspection]: completionDateOfInspection,
                  [keyOfInspectionCompletionBy]: loggedUserData.tm_name,
                },
              },
              {
                arrayFilters: [
                  { "outer.current_year": yearOfCheckSheet },
                  { "inner.tableRowId": tableRowId },
                ],
              }
            );
            // console.log(addPmData)
          }
        }
        // console.log(result)
      } else if (workedOnPM === "Rectify") {
        if (req.file === undefined) {
          let checkCarriedPM = 0;

          //for done with delay
          perticularMachine[0].checkSheet_data.checkSheet.map((key) => {
            //check if the any previous moth data carried in current month or not
            if (
              key.planningTableAnimationArray2[monthForCompareSystemMonth][0] ==
                "2" &&
              key.tableRowId == tableRowId &&
              !key?.isDeleted
            ) {
              checkCarriedPM = 1;
            }
          });
          if (checkCarriedPM === 1) {
            addPmData = await Machine.updateOne(
              { machine_code: machineId },
              {
                $set: {
                  // [keyOfMonth]: {$each:[workedOnPM, remarksOfImplementation]},
                  [keyOfMonth]: arrayForDonePreviousMonthPMPMData,
                  [keyOfPreviousMonth]: arrayForUpdatePreviousMonthDelayPMData,
                  [keyOfAbnormalityRemarks]: abnormalityRemarks,
                  [keyOfAbnormalityStatus]: abnormalityStatus,
                  [keyOfSpareParts]: spareParts,
                  [keyOfPartName]: partName,
                  [keyOfPartNo]: partNo,
                  [keyOfCost]: cost,
                  [keyOfCompletionDateOfInspection]: completionDateOfInspection,
                  [keyOfInspectionCompletionBy]: loggedUserData.tm_name,
                },
              },
              {
                arrayFilters: [
                  { "outer.current_year": yearOfCheckSheet },
                  { "inner.tableRowId": tableRowId },
                ],
              }
            );
          } else {
            addPmData = await Machine.updateOne(
              { machine_code: machineId },
              {
                $set: {
                  // [keyOfMonth]: {$each:[workedOnPM, remarksOfImplementation]},
                  [keyOfMonth]: arrayForPMData,
                  [keyOfAbnormalityRemarks]: abnormalityRemarks,
                  [keyOfAbnormalityStatus]: abnormalityStatus,
                  [keyOfSpareParts]: spareParts,
                  [keyOfPartName]: partName,
                  [keyOfPartNo]: partNo,
                  [keyOfCost]: cost,
                  [keyOfCompletionDateOfInspection]: completionDateOfInspection,
                  [keyOfInspectionCompletionBy]: loggedUserData.tm_name,
                },
              },
              {
                arrayFilters: [
                  { "outer.current_year": yearOfCheckSheet },
                  { "inner.tableRowId": tableRowId },
                ],
              }
            );
          }
        } else {
          let PMuploadedImage = req.file.filename;
          fileNameForLogHistory = req?.file?.filename;
          let checkCarriedPM = 0;

          //for done with delay
          perticularMachine[0].checkSheet_data.checkSheet.map((key) => {
            //check if the any previous moth data carried in current month or not
            if (
              key.planningTableAnimationArray2[monthForCompareSystemMonth][0] ==
                "2" &&
              key.tableRowId == tableRowId &&
              !key?.isDeleted
            ) {
              checkCarriedPM = 1;
            }
          });
          if (checkCarriedPM === 1) {
            addPmData = await Machine.updateOne(
              { machine_code: machineId },
              {
                $set: {
                  // [keyOfMonth]: {$each:[workedOnPM, remarksOfImplementation]},
                  [keyOfMonth]: arrayForDonePreviousMonthPMPMData,
                  [keyOfPreviousMonth]: arrayForUpdatePreviousMonthDelayPMData,
                  [keyOfAbnormalityRemarks]: abnormalityRemarks,
                  [keyOfAbnormalityStatus]: abnormalityStatus,
                  [keyOfAbnormalityImage]: PMuploadedImage,
                  [keyOfSpareParts]: spareParts,
                  [keyOfPartName]: partName,
                  [keyOfPartNo]: partNo,
                  [keyOfCost]: cost,
                  [keyOfCompletionDateOfInspection]: completionDateOfInspection,
                  [keyOfInspectionCompletionBy]: loggedUserData.tm_name,
                },
              },
              {
                arrayFilters: [
                  { "outer.current_year": yearOfCheckSheet },
                  { "inner.tableRowId": tableRowId },
                ],
              }
            );
          } else {
            addPmData = await Machine.updateOne(
              { machine_code: machineId },
              {
                $set: {
                  // [keyOfMonth]: {$each:[workedOnPM, remarksOfImplementation]},
                  [keyOfMonth]: arrayForPMData,
                  [keyOfAbnormalityRemarks]: abnormalityRemarks,
                  [keyOfAbnormalityStatus]: abnormalityStatus,
                  [keyOfAbnormalityImage]: PMuploadedImage,
                  [keyOfSpareParts]: spareParts,
                  [keyOfPartName]: partName,
                  [keyOfPartNo]: partNo,
                  [keyOfCost]: cost,
                  [keyOfCompletionDateOfInspection]: completionDateOfInspection,
                  [keyOfInspectionCompletionBy]: loggedUserData.tm_name,
                },
              },
              {
                arrayFilters: [
                  { "outer.current_year": yearOfCheckSheet },
                  { "inner.tableRowId": tableRowId },
                ],
              }
            );
          }
        }
      } else {
        if (req.file === undefined) {
          let checkCarriedPM = 0;

          //for done with delay
          perticularMachine[0].checkSheet_data.checkSheet.map((key) => {
            //check if the any previous moth data carried in current month or not
            if (
              key.planningTableAnimationArray2[monthForCompareSystemMonth][0] ==
                "2" &&
              key.tableRowId == tableRowId &&
              !key?.isDeleted
            ) {
              checkCarriedPM = 1;
            }
          });

          if (checkCarriedPM === 1) {
            addPmData = await Machine.updateOne(
              { machine_code: machineId },
              {
                $set: {
                  // [keyOfMonth]: {$each:[workedOnPM, remarksOfImplementation]},
                  [keyOfMonth]: arrayForDonePreviousMonthPMPMData,
                  [keyOfPreviousMonth]: arrayForUpdatePreviousMonthDelayPMData,
                  [keyOfAbnormalityRemarks]: abnormalityRemarks,
                  [keyOfAbnormalityStatus]: abnormalityStatus,
                  [keyOfTargetdate]: targetDate,
                  [keyOfSpareParts]: spareParts,
                  [keyOfPartName]: partName,
                  [keyOfPartNo]: partNo,
                  [keyOfCost]: cost,
                  [keyOfCompletionDateOfInspection]: completionDateOfInspection,
                  [keyOfInspectionCompletionBy]: loggedUserData.tm_name,
                },
              },
              {
                arrayFilters: [
                  { "outer.current_year": yearOfCheckSheet },
                  { "inner.tableRowId": tableRowId },
                ],
              }
            );

            sendApproval(
              subject,
              title,
              greetings,
              bodyTable,
              ccEmailArray,
              undefined,
              undefined,
              undefined,
              undefined,
              undefined,
              undefined,
              toEmailArray,
              undefined,
              undefined,
              undefined,
              undefined
            );
          } else {
            addPmData = await Machine.updateOne(
              { machine_code: machineId },
              {
                $set: {
                  // [keyOfMonth]: {$each:[workedOnPM, remarksOfImplementation]},
                  [keyOfMonth]: arrayForPMData,
                  [keyOfAbnormalityRemarks]: abnormalityRemarks,
                  [keyOfAbnormalityStatus]: abnormalityStatus,
                  [keyOfTargetdate]: targetDate,
                  [keyOfSpareParts]: spareParts,
                  [keyOfPartName]: partName,
                  [keyOfPartNo]: partNo,
                  [keyOfCost]: cost,
                  [keyOfCompletionDateOfInspection]: completionDateOfInspection,
                  [keyOfInspectionCompletionBy]: loggedUserData.tm_name,
                },
              },
              {
                arrayFilters: [
                  { "outer.current_year": yearOfCheckSheet },
                  { "inner.tableRowId": tableRowId },
                ],
              }
            );
            sendApproval(
              subject,
              title,
              greetings,
              bodyTable,
              ccEmailArray,
              undefined,
              undefined,
              undefined,
              undefined,
              undefined,
              undefined,
              toEmailArray,
              undefined,
              undefined,
              undefined,
              undefined
            );
          }
        } else {
          let PMuploadedImage = req.file.filename;
          fileNameForLogHistory = req?.file?.filename;
          let checkCarriedPM = 0;

          //for done with delay
          perticularMachine[0].checkSheet_data.checkSheet.map((key) => {
            //check if the any previous moth data carried in current month or not
            if (
              key.planningTableAnimationArray2[monthForCompareSystemMonth][0] ==
                "2" &&
              key.tableRowId == tableRowId &&
              !key?.isDeleted
            ) {
              checkCarriedPM = 1;
            }
          });
          if (checkCarriedPM === 1) {
            addPmData = await Machine.updateOne(
              { machine_code: machineId },
              {
                $set: {
                  // [keyOfMonth]: {$each:[workedOnPM, remarksOfImplementation]},
                  [keyOfMonth]: arrayForDonePreviousMonthPMPMData,
                  [keyOfPreviousMonth]: arrayForUpdatePreviousMonthDelayPMData,
                  [keyOfAbnormalityRemarks]: abnormalityRemarks,
                  [keyOfAbnormalityStatus]: abnormalityStatus,
                  [keyOfTargetdate]: targetDate,
                  [keyOfAbnormalityImage]: PMuploadedImage,
                  [keyOfSpareParts]: spareParts,
                  [keyOfPartName]: partName,
                  [keyOfPartNo]: partNo,
                  [keyOfCost]: cost,
                  [keyOfCompletionDateOfInspection]: completionDateOfInspection,
                  [keyOfInspectionCompletionBy]: loggedUserData.tm_name,
                },
              },
              {
                arrayFilters: [
                  { "outer.current_year": yearOfCheckSheet },
                  { "inner.tableRowId": tableRowId },
                ],
              }
            );
            sendApproval(
              subject,
              title,
              greetings,
              bodyTable,
              ccEmailArray,
              undefined,
              undefined,
              undefined,
              undefined,
              undefined,
              undefined,
              toEmailArray,
              undefined,
              undefined,
              undefined,
              undefined
            );
          } else {
            addPmData = await Machine.updateOne(
              { machine_code: machineId },
              {
                $set: {
                  // [keyOfMonth]: {$each:[workedOnPM, remarksOfImplementation]},
                  [keyOfMonth]: arrayForPMData,
                  [keyOfAbnormalityRemarks]: abnormalityRemarks,
                  [keyOfAbnormalityStatus]: abnormalityStatus,
                  [keyOfTargetdate]: targetDate,
                  [keyOfAbnormalityImage]: PMuploadedImage,
                  [keyOfSpareParts]: spareParts,
                  [keyOfPartName]: partName,
                  [keyOfPartNo]: partNo,
                  [keyOfCost]: cost,
                  [keyOfCompletionDateOfInspection]: completionDateOfInspection,
                  [keyOfInspectionCompletionBy]: loggedUserData.tm_name,
                },
              },
              {
                arrayFilters: [
                  { "outer.current_year": yearOfCheckSheet },
                  { "inner.tableRowId": tableRowId },
                ],
              }
            );
            sendApproval(
              subject,
              title,
              greetings,
              bodyTable,
              ccEmailArray,
              undefined,
              undefined,
              undefined,
              undefined,
              undefined,
              undefined,
              toEmailArray,
              undefined,
              undefined,
              undefined,
              undefined
            );
          }
        }
      }
      //     // console.log(addPmData)
      // const machineDataAfterSaveAllData = await Machine.findOne({ machine_code: machineId })
      let machineDataAfterSaveAllData = await Machine.aggregate([
        {
          $match: {
            machine_code: machineId,
          },
        },
        {
          $unwind: "$checkSheet_data",
        },
        {
          $match: {
            "checkSheet_data.current_year": yearOfCheckSheet,
          },
        },
        {
          $project: {
            machine_code: 1,
            machine_name: 1,
            machine_nickname: 1,
            machine_sequence: 1,
            installation_date: 1,
            maker_name: 1,
            maker_sr_no: 1,
            manufacturingDate: 1,
            isPM: 1,
            line_names: 1,
            checkSheet_data: 1,
          },
        },
      ]);

      machineDataAfterSaveAllData[0].checkSheet_data.checkSheet.map((key) => {
        //for completed status
        if (
          key.planningTableAnimationArray2[monthForCompareSystemMonth][0] ===
            "1" &&
          !key?.isDeleted
        ) {
          plannedPMCount = plannedPMCount + 1;
        }
        if (
          key.planningTableAnimationArray2[monthForCompareSystemMonth][0] ===
            "2" &&
          !key?.isDeleted
        ) {
          totalCarriedPMCount = totalCarriedPMCount + 1;
        }
        if (
          key.planningTableAnimationArray2[monthForCompareSystemMonth].length >=
            2 &&
          key.planningTableAnimationArray2[monthForCompareSystemMonth][0] ===
            "1" &&
          !key?.isDeleted
        ) {
          completedPMCount = completedPMCount + 1;
        }
        //for done with delay status

        if (
          key.planningTableAnimationArray2[monthForCompareSystemMonth].length >=
            2 &&
          key.planningTableAnimationArray2[monthForCompareSystemMonth][0] ===
            "2" &&
          !key?.isDeleted
        ) {
          completedCarriedPMCount = completedCarriedPMCount + 1;
        }

        // console.log(key.planningTableAnimationArray2[monthForCompareSystemMonth])
        // console.log(count)
      });
      // console.log(
      //   "plannedPMCount",
      //   plannedPMCount,
      //   "completedPMCount",
      //   completedPMCount,
      //   "totalCarriedPMCount",
      //   totalCarriedPMCount
      // );
      // console.log(completedPMCount)

      if (completedPMCount === 1) {
        //ongoing status
        updateStatus = await Machine.updateOne(
          { machine_code: machineId },
          {
            $set: {
              [keyOfCompletedMonthPM]: "Ongoing",
            },
          },
          {
            arrayFilters: [{ "outer.current_year": yearOfCheckSheet }],
          }
        );
      }

      //for completed status
      if (plannedPMCount) {
        if (plannedPMCount === completedPMCount) {
          updateStatus = await Machine.updateOne(
            { machine_code: machineId },
            {
              $set: {
                [keyOfCompletedMonthPM]: "Completed",
              },
            },
            {
              arrayFilters: [{ "outer.current_year": yearOfCheckSheet }],
            }
          );
        }
      }

      //for delay remarks
      if (totalCarriedPMCount) {
        updateStatus = await Machine.updateOne(
          { machine_code: machineId },
          {
            $set: {
              PMDelayRemark: PMDelayRemarksMonthArray,
            },
          },
          {
            arrayFilters: [{ "outer.current_year": yearOfCheckSheet }],
          }
        );
      }
      let keyOfPMworkedTMNameForPreviosMonthDoneWithDelay = `checkSheet_data.$[outer].PMworkedTMName.${previousMonth}`;
      //for add time and worked PM operator for skip pm data
      let PMworkedTMNameArray = {
        Apr: [],

        May: [],

        June: [],

        July: [],

        Aug: [],

        Sep: [],

        Oct: [],

        Nov: [],

        Dec: [],

        Jan: [],

        Feb: [],

        Mar: [],
      };

      PMworkedTMNameArray?.[previousMonth]?.push(
        loggedUserData.tm_name?.split(" ")?.[0]
      );

      let keyOfMonthOfTotalWorkedPMTime = `checkSheet_data.$[outer].PMworkedTMName`;

      //for done with delay status
      if (
        totalCarriedPMCount &&
        req?.params?.dashboardName === "editDataAsFlowWise"
      ) {
        if (completedCarriedPMCount >= 1) {
          if (
            machineDataAfterSaveAllData[0].checkSheet_data.PMworkedTMName !=
            undefined
          ) {
            if (
              !machineDataAfterSaveAllData[0]?.checkSheet_data?.PMworkedTMName?.[
                previousMonth
              ]?.includes(loggedUserData.tm_name?.split(" ")?.[0])
            ) {
              updatePMworkedTMName = await Machine.updateOne(
                {
                  machine_code: machineId,
                },
                {
                  $push: {
                    [keyOfPMworkedTMNameForPreviosMonthDoneWithDelay]:
                      loggedUserData.tm_name?.split(" ")?.[0],
                  },
                },
                {
                  arrayFilters: [{ "outer.current_year": yearOfCheckSheet }],
                }
              );
            }
          } else {
            updatePMworkedTMName = await Machine.updateOne(
              {
                machine_code: machineId,
              },
              {
                $set: {
                  [keyOfMonthOfTotalWorkedPMTime]: PMworkedTMNameArray,
                },
              },
              {
                arrayFilters: [{ "outer.current_year": yearOfCheckSheet }],
              }
            );
          }
        }
        if (plannedPMCount) {
          if (!completedPMCount) {
            updateStatus = await Machine.updateOne(
              { machine_code: machineId },
              {
                $set: {
                  [keyOfCompletedMonthPM]: "Current Plan",
                },
              },
              {
                arrayFilters: [{ "outer.current_year": yearOfCheckSheet }],
              }
            );
          }
        } else {
          if (totalCarriedPMCount === completedCarriedPMCount) {
            updateStatus = await Machine.updateOne(
              { machine_code: machineId, "checkSheet.tableRowId": tableRowId },
              {
                $set: {
                  [keyOfCarriedCompletedMonthPM]: "Done with delay",
                  [keyOfCompletedMonthPM]: "",
                },
              },
              {
                arrayFilters: [{ "outer.current_year": yearOfCheckSheet }],
              }
            );
          } else {
            updateStatus = await Machine.updateOne(
              { machine_code: machineId },
              {
                $set: {
                  [keyOfCompletedMonthPM]: "No Completion",
                },
              },
              {
                arrayFilters: [{ "outer.current_year": yearOfCheckSheet }],
              }
            );
          }
        }
      }

      if (addPmData) {
        return res.status(201).json("Checksheet worked data posted!!!");
      } else {
        return res.status(400).json("Checksheet worked data not posted!!!");
      }
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("Data not valid or received !!!");
    }
  }
);

router.post("/submitLogHistory", authenticate, async (req, res) => {
  try {
    //-----------------------------------------------------

    const {
      yearOfCheckSheet,
      values,
      inceptionValueForLogHistory,
      completionDateOfInspection,

      refKeyForScheduleMonthInLogHistory,
      schedule_month,

      machineId,
    } = req.body;

    let { machineAllData } = req.body;

    //-----------------------------------------------------

    const monthKeyArray = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "June",
      "July",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    let newLog, sectionOrSubSection_Id, sectionOrSubSection_name;

    let scheduleMonth = schedule_month
      ? schedule_month
      : refKeyForScheduleMonthInLogHistory === "2"
      ? monthKeyArray[new Date().getMonth() - 1] === undefined
        ? monthKeyArray.splice(-1)[0]
        : monthKeyArray[new Date().getMonth() - 1]
      : monthKeyArray[new Date().getMonth()];

    // console.log(machineId, machineAllData)
    if (machineId) {
      machineAllData = await Machine.findOne({ _id: machineId }).populate({
        path: "line_names",
        populate: {
          path: "cell_names",
          populate: {
            path: "subSection_names",
            model: "SubSections",
          },
        },
      });
    }
    // console.log(machineId, "5745 =============>", machineAllData)

    // console.log(

    //     fileNameForLogHistory,

    //     yearOfCheckSheet,
    //     values,
    //     inceptionValueForLogHistory,
    //     refKeyForScheduleMonthInLogHistory,
    //     scheduleMonth,
    //     "machineInfo ===========================>",
    //     machineAllData?.machine_code,
    //     machineAllData?.machine_name,

    //     " lineInfo ===========================>",

    //     machineAllData?.line_names?.line_id,
    //     machineAllData?.line_names?.line_name,

    //     "cellInfo ===========================>",

    //     machineAllData?.line_names?.cell_names?.cell_id,
    //     machineAllData?.line_names?.cell_names?.cell_name,

    //     "subSectionInfo ===========================>",

    //     machineAllData?.line_names?.cell_names?.subSection_names?.subSection_id,
    //     machineAllData?.line_names?.cell_names?.subSection_names?.subSection_name,
    // )

    const sectionInfo = await Section.findOne({
      section_id: req?.rootUser?.section_data?.split("-")?.[0],
    }).populate({ path: "plant_names" });

    if (sectionInfo?.dashboardLevel === "Yes") {
      (sectionOrSubSection_Id = sectionInfo?.section_id),
        (sectionOrSubSection_name = sectionInfo?.section_name);
    } else {
      (sectionOrSubSection_Id =
        machineAllData?.line_names?.cell_names?.subSection_names
          ?.subSection_id),
        (sectionOrSubSection_name =
          machineAllData?.line_names?.cell_names?.subSection_names
            ?.subSection_name);
    }

    if (values?.workedOnPM === "Yes") {
      newLog = new LogHistory({
        //-------------------
        current_year: yearOfCheckSheet,
        schedule_month: scheduleMonth,

        //--------------------- Plant
        "plantInfo.plant_Id": sectionInfo?.plant_names?.plant_id,
        "plantInfo.plant_name": sectionInfo?.plant_names?.plant_name,

        //--------------------- Section Or SubSection based on Dashboard Level
        "sectionOrSubSectionInfo.sectionOrSubSection_Id":
          sectionOrSubSection_Id,
        "sectionOrSubSectionInfo.sectionOrSubSection_name":
          sectionOrSubSection_name,

        //--------------------- Cell
        "cellInfo.cell_Id": machineAllData?.line_names?.cell_names?.cell_id,
        "cellInfo.cell_name": machineAllData?.line_names?.cell_names?.cell_name,

        //--------------------- Line
        "lineInfo.line_Id": machineAllData?.line_names?.line_id,
        "lineInfo.line_name": machineAllData?.line_names?.line_name,

        //--------------------- Machine
        "machineInfo.machine_Id": machineAllData?.machine_code,
        "machineInfo.machine_name": machineAllData?.machine_name,

        //--------------------- Done By
        done_by: req?.rootUser?.tm_name,

        // cell_id: machineAllData?.line_names?.cell_names?._id,
        // line_id: machineAllData?.line_names?._id,
        // machine_id: machineAllData?._id,

        //-------------
        inception_point: inceptionValueForLogHistory,
        remarks: values?.remarksOfImplementation,
        uploaded_file_name: fileNameForLogHistory,
        date: completionDateOfInspection,

        //--------------------- Reason For Delay
        reason_for_delay: values?.reasonForDelayWhenSkip,
      });

      // remarksOfImplementation,fileNameForLogHistory
    } else if (values?.workedOnPM === "Rectify") {
      //remarksOfImplementation,fileNameForLogHistory,abnormalityRemarks,abnormalityStatus,spareParts
      // spareParts === yes then => partName,partNo,cost

      if (values?.spareParts === "Yes") {
        newLog = new LogHistory({
          //-------------------
          current_year: yearOfCheckSheet,
          schedule_month: scheduleMonth,

          //---------------------

          //--------------------- Plant
          "plantInfo.plant_Id": sectionInfo?.plant_names?.plant_id,
          "plantInfo.plant_name": sectionInfo?.plant_names?.plant_name,

          //--------------------- Section Or SubSection based on Dashboard Level
          "sectionOrSubSectionInfo.sectionOrSubSection_Id":
            sectionOrSubSection_Id,
          "sectionOrSubSectionInfo.sectionOrSubSection_name":
            sectionOrSubSection_name,

          //--------------------- Cell
          "cellInfo.cell_Id": machineAllData?.line_names?.cell_names?.cell_id,
          "cellInfo.cell_name":
            machineAllData?.line_names?.cell_names?.cell_name,

          //--------------------- Line
          "lineInfo.line_Id": machineAllData?.line_names?.line_id,
          "lineInfo.line_name": machineAllData?.line_names?.line_name,

          //--------------------- Machine
          "machineInfo.machine_Id": machineAllData?.machine_code,
          "machineInfo.machine_name": machineAllData?.machine_name,

          //--------------------- Done By
          done_by: req?.rootUser?.tm_name,

          // cell_id: machineAllData?.line_names?.cell_names?._id,
          // line_id: machineAllData?.line_names?._id,
          // machine_id: machineAllData?._id,

          //-------------
          inception_point: inceptionValueForLogHistory,
          remarks: values?.remarksOfImplementation,
          uploaded_file_name: fileNameForLogHistory,
          date: completionDateOfInspection,

          abnormality_remarks: values?.abnormalityRemarks,
          abnormality_status: "Closed",
          spare_used: values?.spareParts,
          part_name: values?.partName,
          part_no: values?.partNo,
          part_cost: values?.cost,

          //--------------------- Reason For Delay
          reason_for_delay: values?.reasonForDelayWhenSkip,
        });
      } else {
        newLog = new LogHistory({
          //-------------------
          current_year: yearOfCheckSheet,
          schedule_month: scheduleMonth,

          //---------------------

          //--------------------- Plant
          "plantInfo.plant_Id": sectionInfo?.plant_names?.plant_id,
          "plantInfo.plant_name": sectionInfo?.plant_names?.plant_name,

          //--------------------- Section Or SubSection based on Dashboard Level
          "sectionOrSubSectionInfo.sectionOrSubSection_Id":
            sectionOrSubSection_Id,
          "sectionOrSubSectionInfo.sectionOrSubSection_name":
            sectionOrSubSection_name,

          //--------------------- Cell
          "cellInfo.cell_Id": machineAllData?.line_names?.cell_names?.cell_id,
          "cellInfo.cell_name":
            machineAllData?.line_names?.cell_names?.cell_name,

          //--------------------- Line
          "lineInfo.line_Id": machineAllData?.line_names?.line_id,
          "lineInfo.line_name": machineAllData?.line_names?.line_name,

          //--------------------- Machine
          "machineInfo.machine_Id": machineAllData?.machine_code,
          "machineInfo.machine_name": machineAllData?.machine_name,

          //--------------------- Done By
          done_by: req?.rootUser?.tm_name,

          // cell_id: machineAllData?.line_names?.cell_names?._id,
          // line_id: machineAllData?.line_names?._id,
          // machine_id: machineAllData?._id,

          //-------------
          inception_point: inceptionValueForLogHistory,
          remarks: values?.remarksOfImplementation,
          uploaded_file_name: fileNameForLogHistory,
          date: completionDateOfInspection,

          abnormality_remarks: values?.abnormalityRemarks,
          abnormality_status: "Closed",
          spare_used: values?.spareParts,

          //--------------------- Reason For Delay
          reason_for_delay: values?.reasonForDelayWhenSkip,
        });
      }
    } else {
      // remarksOfImplementation,fileNameForLogHistory

      //targetDate

      if (values?.spareParts === "Yes") {
        newLog = new LogHistory({
          //-------------------
          current_year: yearOfCheckSheet,
          schedule_month: scheduleMonth,

          //---------------------

          //--------------------- Plant
          "plantInfo.plant_Id": sectionInfo?.plant_names?.plant_id,
          "plantInfo.plant_name": sectionInfo?.plant_names?.plant_name,

          //--------------------- Section Or SubSection based on Dashboard Level
          "sectionOrSubSectionInfo.sectionOrSubSection_Id":
            sectionOrSubSection_Id,
          "sectionOrSubSectionInfo.sectionOrSubSection_name":
            sectionOrSubSection_name,

          //--------------------- Cell
          "cellInfo.cell_Id": machineAllData?.line_names?.cell_names?.cell_id,
          "cellInfo.cell_name":
            machineAllData?.line_names?.cell_names?.cell_name,

          //--------------------- Line
          "lineInfo.line_Id": machineAllData?.line_names?.line_id,
          "lineInfo.line_name": machineAllData?.line_names?.line_name,

          //--------------------- Machine
          "machineInfo.machine_Id": machineAllData?.machine_code,
          "machineInfo.machine_name": machineAllData?.machine_name,

          //--------------------- Done By
          done_by: req?.rootUser?.tm_name,

          // cell_id: machineAllData?.line_names?.cell_names?._id,
          // line_id: machineAllData?.line_names?._id,
          // machine_id: machineAllData?._id,

          //-------------
          inception_point: inceptionValueForLogHistory,
          remarks: values?.remarksOfImplementation,
          uploaded_file_name: fileNameForLogHistory,
          date: completionDateOfInspection,

          abnormality_remarks: values?.abnormalityRemarks,
          abnormality_status: "Open",
          target: values?.targetDate,
          spare_used: values?.spareParts,
          part_name: values?.partName,
          part_no: values?.partNo,
          part_cost: values?.cost,

          //--------------------- Reason For Delay
          reason_for_delay: values?.reasonForDelayWhenSkip,
        });
      } else {
        newLog = new LogHistory({
          //-------------------
          current_year: yearOfCheckSheet,
          schedule_month: scheduleMonth,

          //---------------------

          //--------------------- Plant
          "plantInfo.plant_Id": sectionInfo?.plant_names?.plant_id,
          "plantInfo.plant_name": sectionInfo?.plant_names?.plant_name,

          //--------------------- Section Or SubSection based on Dashboard Level
          "sectionOrSubSectionInfo.sectionOrSubSection_Id":
            sectionOrSubSection_Id,
          "sectionOrSubSectionInfo.sectionOrSubSection_name":
            sectionOrSubSection_name,

          //--------------------- Cell
          "cellInfo.cell_Id": machineAllData?.line_names?.cell_names?.cell_id,
          "cellInfo.cell_name":
            machineAllData?.line_names?.cell_names?.cell_name,

          //--------------------- Line
          "lineInfo.line_Id": machineAllData?.line_names?.line_id,
          "lineInfo.line_name": machineAllData?.line_names?.line_name,

          //--------------------- Machine
          "machineInfo.machine_Id": machineAllData?.machine_code,
          "machineInfo.machine_name": machineAllData?.machine_name,

          //--------------------- Done By
          done_by: req?.rootUser?.tm_name,

          // cell_id: machineAllData?.line_names?.cell_names?._id,
          // line_id: machineAllData?.line_names?._id,
          // machine_id: machineAllData?._id,

          //-------------
          inception_point: inceptionValueForLogHistory,
          remarks: values?.remarksOfImplementation,
          uploaded_file_name: fileNameForLogHistory,
          date: completionDateOfInspection,

          abnormality_remarks: values?.abnormalityRemarks,
          abnormality_status: "Open",
          target: values?.targetDate,
          spare_used: values?.spareParts,

          //--------------------- Reason For Delay
          reason_for_delay: values?.reasonForDelayWhenSkip,
        });
      }
    }

    // console.log(newLog)

    const logSaved = await newLog.save();

    fileNameForLogHistory = undefined;

    if (logSaved) {
      return res.status(201).json("Log data added successfully");
    } else {
      return res.status(400).json("Getting error");
    }
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log(error);
    console.log("Data not valid or received !!!");
  }
});

router.post(
  "/submitLogHistoryOfAbnormalityClosed",
  authenticate,
  async (req, res) => {
    try {
      //-----------------------------------------------------

      const { selectedRow } = req.body;

      //-----------------------------------------------------

      const monthKeyArray = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "June",
        "July",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      let newLog,
        sectionOrSubSection_Id,
        sectionOrSubSection_name,
        machineAllData;

      // console.log(machineId, machineAllData)
      if (selectedRow?.machine_code) {
        machineAllData = await Machine.findOne({
          machine_code: selectedRow?.machine_code,
        }).populate({
          path: "line_names",
          populate: {
            path: "cell_names",
            populate: {
              path: "subSection_names",
              model: "SubSections",
            },
          },
        });
      }

      const sectionInfo = await Section.findOne({
        section_id: req?.rootUser?.section_data?.split("-")?.[0],
      }).populate({ path: "plant_names" });

      if (sectionInfo?.dashboardLevel === "Yes") {
        (sectionOrSubSection_Id = sectionInfo?.section_id),
          (sectionOrSubSection_name = sectionInfo?.section_name);
      } else {
        (sectionOrSubSection_Id =
          machineAllData?.line_names?.cell_names?.subSection_names
            ?.subSection_id),
          (sectionOrSubSection_name =
            machineAllData?.line_names?.cell_names?.subSection_names
              ?.subSection_name);
      }

      // remarksOfImplementation,fileNameForLogHistory

      //targetDate

      if (selectedRow?.spareParts === "Yes") {
        newLog = new LogHistory({
          //-------------------
          current_year: selectedRow?.yearOfCheckSheet,
          schedule_month: selectedRow?.schedule_month,

          //---------------------

          //--------------------- Plant
          "plantInfo.plant_Id": sectionInfo?.plant_names?.plant_id,
          "plantInfo.plant_name": sectionInfo?.plant_names?.plant_name,

          //--------------------- Section Or SubSection based on Dashboard Level
          "sectionOrSubSectionInfo.sectionOrSubSection_Id":
            sectionOrSubSection_Id,
          "sectionOrSubSectionInfo.sectionOrSubSection_name":
            sectionOrSubSection_name,

          //--------------------- Cell
          "cellInfo.cell_Id": machineAllData?.line_names?.cell_names?.cell_id,
          "cellInfo.cell_name":
            machineAllData?.line_names?.cell_names?.cell_name,

          //--------------------- Line
          "lineInfo.line_Id": machineAllData?.line_names?.line_id,
          "lineInfo.line_name": machineAllData?.line_names?.line_name,

          //--------------------- Machine
          "machineInfo.machine_Id": machineAllData?.machine_code,
          "machineInfo.machine_name": machineAllData?.machine_name,

          //--------------------- Done By
          done_by: selectedRow?.doneBy,

          // cell_id: machineAllData?.line_names?.cell_names?._id,
          // line_id: machineAllData?.line_names?._id,
          // machine_id: machineAllData?._id,

          //-------------
          inception_point: selectedRow?.inspection_point,
          remarks: selectedRow?.remarksOfImplementation,
          uploaded_file_name: selectedRow?.PMuploadedImage,
          date: selectedRow?.doneDate,

          abnormality_remarks: selectedRow?.abnormalityRemarks,
          abnormality_status: "Closed",
          target: selectedRow?.targetDate,
          spare_used: selectedRow?.spare_used,
          part_name: selectedRow?.part_name,
          part_no: selectedRow?.part_no,
          part_cost: selectedRow?.part_cost,

          //--------------------- Reason For Delay
          // reason_for_delay: values?.reasonForDelayWhenSkip
          actionDetailsOfAbnormalityClose: selectedRow?.remarksOnClose,
        });
      } else {
        newLog = new LogHistory({
          //-------------------
          current_year: selectedRow?.yearOfCheckSheet,
          schedule_month: selectedRow?.schedule_month,

          //---------------------

          //--------------------- Plant
          "plantInfo.plant_Id": sectionInfo?.plant_names?.plant_id,
          "plantInfo.plant_name": sectionInfo?.plant_names?.plant_name,

          //--------------------- Section Or SubSection based on Dashboard Level
          "sectionOrSubSectionInfo.sectionOrSubSection_Id":
            sectionOrSubSection_Id,
          "sectionOrSubSectionInfo.sectionOrSubSection_name":
            sectionOrSubSection_name,

          //--------------------- Cell
          "cellInfo.cell_Id": machineAllData?.line_names?.cell_names?.cell_id,
          "cellInfo.cell_name":
            machineAllData?.line_names?.cell_names?.cell_name,

          //--------------------- Line
          "lineInfo.line_Id": machineAllData?.line_names?.line_id,
          "lineInfo.line_name": machineAllData?.line_names?.line_name,

          //--------------------- Machine
          "machineInfo.machine_Id": machineAllData?.machine_code,
          "machineInfo.machine_name": machineAllData?.machine_name,

          //--------------------- Done By
          done_by: selectedRow?.doneBy,

          // cell_id: machineAllData?.line_names?.cell_names?._id,
          // line_id: machineAllData?.line_names?._id,
          // machine_id: machineAllData?._id,

          //-------------
          inception_point: selectedRow?.inspection_point,
          remarks: selectedRow?.remarksOfImplementation,
          uploaded_file_name: selectedRow?.PMuploadedImage,
          date: selectedRow?.doneDate,

          abnormality_remarks: selectedRow?.abnormalityRemarks,
          abnormality_status: "Closed",
          target: selectedRow?.targetDate,
          spare_used: selectedRow?.spareParts,

          //--------------------- Reason For Delay
          // reason_for_delay: values?.reasonForDelayWhenSkip
          actionDetailsOfAbnormalityClose: selectedRow?.remarksOnClose,
        });
      }

      // console.log(newLog)

      const logSaved = await newLog.save();

      fileNameForLogHistory = undefined;

      if (logSaved) {
        return res.status(201).json("Log data added successfully");
      } else {
        return res.status(400).json("Getting error");
      }
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("Data not valid or received !!!");
    }
  }
);

router.post(
  "/submitLogHistoryAfterRejection",
  authenticate,
  async (req, res) => {
    try {
      //-----------------------------------------------------

      const {
        yearOfCheckSheet,
        values,
        inceptionValueForLogHistory,
        completionDateOfInspection,

        remarks,
        refKeyForScheduleMonthInLogHistory,
        workedOnPM,
        abnormalityRemarks,

        spareParts,
        part_name,
        part_no,
        part_cost,

        target,

        machineId,
      } = req.body;

      let { machineAllData } = req.body;

      //-----------------------------------------------------

      const monthKeyArray = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "June",
        "July",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      let newLog, sectionOrSubSection_Id, sectionOrSubSection_name;

      let scheduleMonth =
        refKeyForScheduleMonthInLogHistory === "2"
          ? monthKeyArray[new Date().getMonth() - 1] === undefined
            ? monthKeyArray.splice(-1)[0]
            : monthKeyArray[new Date().getMonth() - 1]
          : monthKeyArray[new Date().getMonth()];

      // console.log(machineId, machineAllData)
      if (machineId) {
        machineAllData = await Machine.findOne({ _id: machineId }).populate({
          path: "line_names",
          populate: {
            path: "cell_names",
            populate: {
              path: "subSection_names",
              model: "SubSections",
            },
          },
        });
      }

      const sectionInfo = await Section.findOne({
        section_id: req?.rootUser?.section_data?.split("-")?.[0],
      }).populate({ path: "plant_names" });

      if (sectionInfo?.dashboardLevel === "Yes") {
        (sectionOrSubSection_Id = sectionInfo?.section_id),
          (sectionOrSubSection_name = sectionInfo?.section_name);
      } else {
        (sectionOrSubSection_Id =
          machineAllData?.line_names?.cell_names?.subSection_names
            ?.subSection_id),
          (sectionOrSubSection_name =
            machineAllData?.line_names?.cell_names?.subSection_names
              ?.subSection_name);
      }

      if (workedOnPM === "Yes") {
        newLog = new LogHistory({
          //-------------------
          current_year: yearOfCheckSheet,
          schedule_month: scheduleMonth,

          //--------------------- Plant
          "plantInfo.plant_Id": sectionInfo?.plant_names?.plant_id,
          "plantInfo.plant_name": sectionInfo?.plant_names?.plant_name,

          //--------------------- Section Or SubSection based on Dashboard Level
          "sectionOrSubSectionInfo.sectionOrSubSection_Id":
            sectionOrSubSection_Id,
          "sectionOrSubSectionInfo.sectionOrSubSection_name":
            sectionOrSubSection_name,

          //--------------------- Cell
          "cellInfo.cell_Id": machineAllData?.line_names?.cell_names?.cell_id,
          "cellInfo.cell_name":
            machineAllData?.line_names?.cell_names?.cell_name,

          //--------------------- Line
          "lineInfo.line_Id": machineAllData?.line_names?.line_id,
          "lineInfo.line_name": machineAllData?.line_names?.line_name,

          //--------------------- Machine
          "machineInfo.machine_Id": machineAllData?.machine_code,
          "machineInfo.machine_name": machineAllData?.machine_name,

          //--------------------- Done By
          done_by: req?.rootUser?.tm_name,

          // cell_id: machineAllData?.line_names?.cell_names?._id,
          // line_id: machineAllData?.line_names?._id,
          // machine_id: machineAllData?._id,

          //-------------
          inception_point: inceptionValueForLogHistory,
          remarks: remarks,
          date: completionDateOfInspection,

          uploaded_file_name: fileNameForLogHistory,
        });

        // remarksOfImplementation,fileNameForLogHistory
      } else if (workedOnPM === "Rectify") {
        //remarksOfImplementation,fileNameForLogHistory,abnormalityRemarks,abnormalityStatus,spareParts
        // spareParts === yes then => partName,partNo,cost

        if (spareParts === "Yes") {
          newLog = new LogHistory({
            //-------------------
            current_year: yearOfCheckSheet,
            schedule_month: scheduleMonth,

            //---------------------

            //--------------------- Plant
            "plantInfo.plant_Id": sectionInfo?.plant_names?.plant_id,
            "plantInfo.plant_name": sectionInfo?.plant_names?.plant_name,

            //--------------------- Section Or SubSection based on Dashboard Level
            "sectionOrSubSectionInfo.sectionOrSubSection_Id":
              sectionOrSubSection_Id,
            "sectionOrSubSectionInfo.sectionOrSubSection_name":
              sectionOrSubSection_name,

            //--------------------- Cell
            "cellInfo.cell_Id": machineAllData?.line_names?.cell_names?.cell_id,
            "cellInfo.cell_name":
              machineAllData?.line_names?.cell_names?.cell_name,

            //--------------------- Line
            "lineInfo.line_Id": machineAllData?.line_names?.line_id,
            "lineInfo.line_name": machineAllData?.line_names?.line_name,

            //--------------------- Machine
            "machineInfo.machine_Id": machineAllData?.machine_code,
            "machineInfo.machine_name": machineAllData?.machine_name,

            //--------------------- Done By
            done_by: req?.rootUser?.tm_name,

            // cell_id: machineAllData?.line_names?.cell_names?._id,
            // line_id: machineAllData?.line_names?._id,
            // machine_id: machineAllData?._id,

            //-------------
            inception_point: inceptionValueForLogHistory,
            remarks: remarks,
            date: completionDateOfInspection,

            abnormality_remarks: abnormalityRemarks,
            abnormality_status: "Closed",

            spare_used: spareParts,
            part_name: part_name,
            part_no: part_no,
            part_cost: part_cost,

            uploaded_file_name: fileNameForLogHistory,
          });
        } else {
          newLog = new LogHistory({
            //-------------------
            current_year: yearOfCheckSheet,
            schedule_month: scheduleMonth,

            //---------------------

            //--------------------- Plant
            "plantInfo.plant_Id": sectionInfo?.plant_names?.plant_id,
            "plantInfo.plant_name": sectionInfo?.plant_names?.plant_name,

            //--------------------- Section Or SubSection based on Dashboard Level
            "sectionOrSubSectionInfo.sectionOrSubSection_Id":
              sectionOrSubSection_Id,
            "sectionOrSubSectionInfo.sectionOrSubSection_name":
              sectionOrSubSection_name,

            //--------------------- Cell
            "cellInfo.cell_Id": machineAllData?.line_names?.cell_names?.cell_id,
            "cellInfo.cell_name":
              machineAllData?.line_names?.cell_names?.cell_name,

            //--------------------- Line
            "lineInfo.line_Id": machineAllData?.line_names?.line_id,
            "lineInfo.line_name": machineAllData?.line_names?.line_name,

            //--------------------- Machine
            "machineInfo.machine_Id": machineAllData?.machine_code,
            "machineInfo.machine_name": machineAllData?.machine_name,

            //--------------------- Done By
            done_by: req?.rootUser?.tm_name,

            // cell_id: machineAllData?.line_names?.cell_names?._id,
            // line_id: machineAllData?.line_names?._id,
            // machine_id: machineAllData?._id,

            //-------------
            inception_point: inceptionValueForLogHistory,
            remarks: remarks,
            date: completionDateOfInspection,

            abnormality_remarks: abnormalityRemarks,
            abnormality_status: "Closed",
            spare_used: spareParts,

            uploaded_file_name: fileNameForLogHistory,
          });
        }
      } else {
        // remarksOfImplementation,fileNameForLogHistory

        //targetDate

        if (spareParts === "Yes") {
          newLog = new LogHistory({
            //-------------------
            current_year: yearOfCheckSheet,
            schedule_month: scheduleMonth,

            //---------------------

            //--------------------- Plant
            "plantInfo.plant_Id": sectionInfo?.plant_names?.plant_id,
            "plantInfo.plant_name": sectionInfo?.plant_names?.plant_name,

            //--------------------- Section Or SubSection based on Dashboard Level
            "sectionOrSubSectionInfo.sectionOrSubSection_Id":
              sectionOrSubSection_Id,
            "sectionOrSubSectionInfo.sectionOrSubSection_name":
              sectionOrSubSection_name,

            //--------------------- Cell
            "cellInfo.cell_Id": machineAllData?.line_names?.cell_names?.cell_id,
            "cellInfo.cell_name":
              machineAllData?.line_names?.cell_names?.cell_name,

            //--------------------- Line
            "lineInfo.line_Id": machineAllData?.line_names?.line_id,
            "lineInfo.line_name": machineAllData?.line_names?.line_name,

            //--------------------- Machine
            "machineInfo.machine_Id": machineAllData?.machine_code,
            "machineInfo.machine_name": machineAllData?.machine_name,

            //--------------------- Done By
            done_by: req?.rootUser?.tm_name,

            // cell_id: machineAllData?.line_names?.cell_names?._id,
            // line_id: machineAllData?.line_names?._id,
            // machine_id: machineAllData?._id,

            //-------------
            inception_point: inceptionValueForLogHistory,
            remarks: remarks,
            uploaded_file_name: fileNameForLogHistory,
            date: completionDateOfInspection,

            abnormality_remarks: abnormalityRemarks,
            abnormality_status: "Open",
            target: target,
            spare_used: spareParts,
            part_name: part_name,
            part_no: part_no,
            part_cost: part_cost,

            uploaded_file_name: fileNameForLogHistory,
          });
        } else {
          newLog = new LogHistory({
            //-------------------
            current_year: yearOfCheckSheet,
            schedule_month: scheduleMonth,

            //---------------------

            //--------------------- Plant
            "plantInfo.plant_Id": sectionInfo?.plant_names?.plant_id,
            "plantInfo.plant_name": sectionInfo?.plant_names?.plant_name,

            //--------------------- Section Or SubSection based on Dashboard Level
            "sectionOrSubSectionInfo.sectionOrSubSection_Id":
              sectionOrSubSection_Id,
            "sectionOrSubSectionInfo.sectionOrSubSection_name":
              sectionOrSubSection_name,

            //--------------------- Cell
            "cellInfo.cell_Id": machineAllData?.line_names?.cell_names?.cell_id,
            "cellInfo.cell_name":
              machineAllData?.line_names?.cell_names?.cell_name,

            //--------------------- Line
            "lineInfo.line_Id": machineAllData?.line_names?.line_id,
            "lineInfo.line_name": machineAllData?.line_names?.line_name,

            //--------------------- Machine
            "machineInfo.machine_Id": machineAllData?.machine_code,
            "machineInfo.machine_name": machineAllData?.machine_name,

            //--------------------- Done By
            done_by: req?.rootUser?.tm_name,

            // cell_id: machineAllData?.line_names?.cell_names?._id,
            // line_id: machineAllData?.line_names?._id,
            // machine_id: machineAllData?._id,

            //-------------
            inception_point: inceptionValueForLogHistory,
            remarks: remarks,
            uploaded_file_name: fileNameForLogHistory,
            date: completionDateOfInspection,

            abnormality_remarks: abnormalityRemarks,
            abnormality_status: "Open",
            target: target,
            spare_used: spareParts,

            uploaded_file_name: fileNameForLogHistory,
          });
        }
      }

      // console.log(newLog)

      const logSaved = await newLog.save();

      // fileNameForLogHistory = undefined

      if (logSaved) {
        return res.status(201).json("Log data added successfully");
      } else {
        return res.status(400).json("Getting error");
      }
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("Data not valid or received !!!");
    }
  }
);

router.post("/savedWorkedPMData", async (req, res) => {
  try {
    const {
      totalPMTime,
      yearOfCheckSheet,
      delayRemarks,
      PMworkedTMNo,
      PMworkedTMName,
      selectedSupportedTM,
      finishedPMTime,
      machine_code,
      monthForCompareSystemMonth,
    } = req.body;
    // console.log(totalPMTime,yearOfCheckSheet, delayRemarks,PMworkedTMNo, PMworkedTMName, selectedSupportedTM, finishedPMTime, machine_code, monthForCompareSystemMonth)

    let PMworkedTMNameArray = {
      Apr: [],

      May: [],

      June: [],

      July: [],

      Aug: [],

      Sep: [],

      Oct: [],

      Nov: [],

      Dec: [],

      Jan: [],

      Feb: [],

      Mar: [],
    };
    let keyOfMonth = `checkSheet_data.$[outer].PMworkedTMName.${monthForCompareSystemMonth}`;
    let keyOfMonthOfTotalWorkedPMTime = `checkSheet_data.$[outer].PMworkedTMName`;

    let getSelectedMachineChecksheet = await Machine.aggregate([
      {
        $match: {
          machine_code: machine_code,
          "checkSheet_data.current_year": yearOfCheckSheet,
        },
      },
      { $unwind: "$checkSheet_data" },
      {
        $match: { "checkSheet_data.current_year": yearOfCheckSheet },
      },
    ]);
    let workedOperator = {
      tm_name: PMworkedTMName,
      tm_no: PMworkedTMNo,
    };
    selectedSupportedTM.push(workedOperator);
    // console.log(selectedSupportedTM)

    const monthKeyArray = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "June",
      "July",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    let previousMonth =
      monthKeyArray[new Date().getMonth() - 1] === undefined
        ? monthKeyArray.splice(-1)[0]
        : monthKeyArray[new Date().getMonth() - 1];

    let keyOfTotalWorkedPMTime = `checkSheet_data.$[outer].totalPMTime.${monthForCompareSystemMonth}.totalWorkedPMTime`;
    let keyOfSupportingTMData = `checkSheet_data.$[outer].totalPMTime.${monthForCompareSystemMonth}.supportingTMData`;
    // let keyOfSupportingTMDataTm_name = `checkSheet_data.$[outer].totalPMTime.${monthForCompareSystemMonth}.supportingTMData.tm_name`
    // let keyOfSupportingTMDataTm_no = `checkSheet_data.$[outer].totalPMTime.${monthForCompareSystemMonth}.supportingTMData.tm_no`
    let keyOfTotalWorkedPMTimeIncrement = `checkSheet_data.$.totalPMTime.${monthForCompareSystemMonth}.totalWorkedPMTime`;

    let keyOfFindSupportingTM = `checkSheet_data.totalPMTime.${monthForCompareSystemMonth}.supportingTMData.tm_no`;
    let keyOfSupportingTMDataWorkedIncrementTime = `checkSheet_data.$[outer].totalPMTime.${monthForCompareSystemMonth}.supportingTMData.$[inner].workedTime`;

    let keyOfDelayRemarksMonthPM = `checkSheet_data.$[outer].PMDelayRemark.${monthForCompareSystemMonth}`;
    PMworkedTMNameArray[monthForCompareSystemMonth].push(PMworkedTMName);

    // console.log(getSelectedMachineChecksheet[0].checkSheet_data)
    let updateTotalTimeAndWorkedAndSupportingOperator, incrementTotalTime;
    if (
      getSelectedMachineChecksheet[0].checkSheet_data?.totalPMTime?.[
        monthForCompareSystemMonth
      ]?.totalWorkedPMTime != undefined
    ) {
      incrementTotalTime = await Machine.updateOne(
        {
          machine_code: machine_code,
          "checkSheet_data.current_year": yearOfCheckSheet,
        },
        {
          $inc: {
            [keyOfTotalWorkedPMTimeIncrement]: totalPMTime,
          },
        }
      );
      for (let i = 0; i < selectedSupportedTM.length; i++) {
        let isOperatorOrNot =
          getSelectedMachineChecksheet[0].checkSheet_data.totalPMTime[
            monthForCompareSystemMonth
          ].supportingTMData.some(
            (value) => value.tm_no === selectedSupportedTM[i].tm_no
          );
        if (isOperatorOrNot) {
          updateTotalTimeAndWorkedAndSupportingOperator =
            await Machine.updateOne(
              {
                machine_code: machine_code,
                "checkSheet_data.current_year": yearOfCheckSheet,
                [keyOfFindSupportingTM]: selectedSupportedTM[i].tm_no,
              },
              {
                // $inc: { [keyOfTotalWorkedPMTimeIncrement]: totalPMTime },
                $inc: {
                  [keyOfSupportingTMDataWorkedIncrementTime]: totalPMTime,
                },
              },
              {
                arrayFilters: [
                  { "outer.current_year": yearOfCheckSheet },
                  { "inner.tm_no": selectedSupportedTM[i].tm_no },
                ],
              }
            );
        } else {
          updateTotalTimeAndWorkedAndSupportingOperator =
            await Machine.updateOne(
              { machine_code: machine_code },
              {
                $push: {
                  [keyOfSupportingTMData]: {
                    tm_name: selectedSupportedTM[i].tm_name,
                    tm_no: selectedSupportedTM[i].tm_no,
                    workedTime: totalPMTime,
                  },
                },
              },
              {
                arrayFilters: [{ "outer.current_year": yearOfCheckSheet }],
              }
            );
        }
      }
    } else {
      for (let i = 0; i < selectedSupportedTM.length; i++) {
        updateTotalTimeAndWorkedAndSupportingOperator = await Machine.updateOne(
          { machine_code: machine_code },
          {
            $set: {
              [keyOfTotalWorkedPMTime]: totalPMTime,
            },
            $push: {
              [keyOfSupportingTMData]: {
                tm_name: selectedSupportedTM[i].tm_name,
                tm_no: selectedSupportedTM[i].tm_no,
                workedTime: totalPMTime,
              },
            },
          },
          {
            arrayFilters: [{ "outer.current_year": yearOfCheckSheet }],
          }
        );
      }
      // console.log(updateTotalTimeAndWorkedAndSupportingOperator)
    }

    let updatePMworkedTMName;
    if (
      getSelectedMachineChecksheet[0].checkSheet_data.PMworkedTMName !=
      undefined
    ) {
      if (
        !getSelectedMachineChecksheet[0]?.checkSheet_data?.PMworkedTMName[
          monthForCompareSystemMonth
        ]?.includes(PMworkedTMName)
      ) {
        updatePMworkedTMName = await Machine.updateOne(
          {
            machine_code: machine_code,
          },
          {
            $set: {
              [keyOfDelayRemarksMonthPM]: delayRemarks,
            },
            $push: {
              [keyOfMonth]: PMworkedTMName,
            },
          },
          {
            arrayFilters: [{ "outer.current_year": yearOfCheckSheet }],
          }
        );
      }
    } else {
      updatePMworkedTMName = await Machine.updateOne(
        {
          machine_code: machine_code,
        },
        {
          $set: {
            [keyOfMonthOfTotalWorkedPMTime]: PMworkedTMNameArray,
          },
        },
        {
          arrayFilters: [{ "outer.current_year": yearOfCheckSheet }],
        }
      );
    }

    if (updateTotalTimeAndWorkedAndSupportingOperator || incrementTotalTime) {
      return res.status(201).json("PM worked data save sucessfully...!!!");
    } else {
      return res.status(400).json("PM worked data not save...!!!");
    }
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log(error);
    console.log("User id not received!!!");
  }
});

router.post("/deleteCheckSheet", authenticate, async (req, res) => {
  try {
    const { selectedRow } = req.body;
    if (!selectedRow.machine_code) {
      return res.status(422).json({ error: "Machine doesn't exist" });
    } else {
      let removeFields = await Machine.updateOne(
        { machine_code: selectedRow.machine_code },
        {
          $unset: {
            "checkSheet_data.$[outer].checkSheet.$[].start_month": "",
            "checkSheet_data.$[outer].checkSheet.$[].planningTableAnimationArray2":
              "",
            "checkSheet_data.$[outer].checkSheet.$[].abnormalityDetails": "",
            "checkSheet_data.$[outer].checkSheet.$[].spareDetails": "",
            "checkSheet_data.$[outer].checkSheet.$[].completionDateOfInspection":
              "",
            "checkSheet_data.$[outer].checkSheet.$[].reasonForDelayWhenSkip":
              "",
            "checkSheet_data.$[outer].checkSheet.$[].inspectionCompletionBy":
              "",
            "checkSheet_data.$[outer].checkSheet.$[].PMOkImage": "",
            "checkSheet_data.$[outer].checkSheet.$[].completionDateOfInspection":
              "",
            "checkSheet_data.$[outer].checkSheet.$[].isAdded": "",
            "checkSheet_data.$[outer].checkSheet.$[].isEdited": "",
            "checkSheet_data.$[outer].checkSheet.$[].isDeleted": "",
          },
        },
        {
          arrayFilters: [
            { "outer.current_year": selectedRow.checkSheet_data.current_year },
          ],
        }
      );

      let machineLastData;
      machineLastData = await Machine.aggregate([
        {
          $match: {
            machine_code: selectedRow.machine_code,
            "checkSheet_data.current_year":
              selectedRow.checkSheet_data.current_year,
          },
        },
        {
          $project: {
            machine_code: 1,
            machine_name: 1,
            machine_nickname: 1,
            machine_sequence: 1,
            installation_date: 1,
            maker_name: 1,
            maker_sr_no: 1,
            manufacturingDate: 1,
            isPM: 1,
            line_names: 1,
            checkSheet_data: 1,
          },
        },
        {
          $unwind: "$checkSheet_data",
        },
        {
          $match: {
            "checkSheet_data.current_year":
              selectedRow.checkSheet_data.current_year,
          },
        },
      ]);

      let backupNewMachineCode = `R${selectedRow.machine_code}`;

      const findMachine = await BackupMachineData.findOne({
        machine_code: backupNewMachineCode,
      });

      if (findMachine) {
        let removeFieldsFromBackupData = await BackupMachineData.updateOne(
          { machine_code: backupNewMachineCode },
          {
            $unset: {
              "checkSheet_data.$[]checkSheet.$[].start_month": "",
              "checkSheet_data.$[]checkSheet.$[].planningTableAnimationArray2":
                "",
              "checkSheet_data.$[]checkSheet.$[].abnormalityDetails": "",
              "checkSheet_data.$[]checkSheet.$[].spareDetails": "",
              "checkSheet_data.$[outer].checkSheet.$[].completionDateOfInspection":
                "",
              "checkSheet_data.$[outer].checkSheet.$[].reasonForDelayWhenSkip":
                "",
              "checkSheet_data.$[outer].checkSheet.$[].inspectionCompletionBy":
                "",
              "checkSheet_data.$[outer].checkSheet.$[].PMOkImage": "",
              "checkSheet_data.$[outer].checkSheet.$[].completionDateOfInspection":
                "",
              "checkSheet_data.$[outer].checkSheet.$[].isAdded": "",
              "checkSheet_data.$[outer].checkSheet.$[].isEdited": "",
              "checkSheet_data.$[outer].checkSheet.$[].isDeleted": "",
            },
          }
        );
        const updateBackupPreparationMachineData =
          await BackupMachineData.updateOne(
            {
              machine_code: backupNewMachineCode,
            },
            {
              $set: {
                checkSheet_data: {
                  checkSheet: machineLastData[0].checkSheet_data.checkSheet,
                },
              },
            }
          );
      } else {
        const backupPreparationMachineData = await new BackupMachineData({
          machine_code: backupNewMachineCode,
          machine_name: selectedRow.machine_name,
          line_names: selectedRow.line_names,
          checkSheet_data: {
            checkSheet: machineLastData[0].checkSheet_data.checkSheet,
          },
        });

        const result = await backupPreparationMachineData.save();
      }
      // console.log(selectedRow.checkSheet_data)

      // console.log("checksheet year --->  ", selectedRow.checkSheet_data.current_year)

      const deleteChecksheet = await Machine.updateOne(
        { machine_code: selectedRow.machine_code },
        {
          $pull: {
            checkSheet_data: {
              current_year: selectedRow.checkSheet_data.current_year,
            },
          },

          // $unset: {

          //     // "checkSheet_data.$[outer].checkSheet.$[].tableRowId": "",
          //     // "checkSheet_data.$[outer].checkSheet.$[].category": "",
          //     // "checkSheet_data.$[outer].checkSheet.$[].inspection_parent_name": "",
          //     // "checkSheet_data.$[outer].checkSheet.$[].inspection_point": "",
          //     // "checkSheet_data.$[outer].checkSheet.$[].judgement_criteria": "",
          //     // "checkSheet_data.$[outer].checkSheet.$[].action": "",
          //     // "checkSheet_data.$[outer].checkSheet.$[].cycle": "",
          //     // "checkSheet_data.$[outer].checkSheet.$[].personInCharge": "",
          //     // "checkSheet_data.$[outer].checkSheet.$[].PM_time": "",
          //     // "checkSheet_data.$[outer].checkSheet.$[].start_month": "",
          //     // "checkSheet_data.$[outer].checkSheet.$[].planningTableAnimationArray2": "",
          //     // "checkSheet_data.$[outer].checkSheet.$[].abnormalityDetails": "",
          //     // "checkSheet_data.$[outer].checkSheet.$[].spareDetails": "",
          //     // "checkSheet_data.$[outer].checkSheet.$[].PMOkImage": "",
          //     // "checkSheet_data.$[outer].checkSheet.$[].completionDateOfInspection": "",
          //     // "checkSheet_data.$[outer].checkSheet.$[].reasonForDelayWhenSkip": "",
          //     // "checkSheet_data.$[outer].checkSheet.$[].isAdded": "",
          //     // "checkSheet_data.$[outer].checkSheet.$[].isEdited": "",
          //     // "checkSheet_data.$[outer].checkSheet.$[].isDeleted": "",
          //     // "checkSheet_data.$[outer].checkSheet.$[].inspectionCompletionBy": "",

          //     // "checkSheet_data.$[outer].checkSheet.$[]": "",
          //     "checkSheet_data.$[outer].checkSheet": [],

          //     "checkSheet_data.$[outer].flagOfDoneWithDelayForOneMonth": "",
          //     "checkSheet_data.$[outer].completionTargetDate": "",
          //     "checkSheet_data.$[outer].dataSheet": "",
          //     "checkSheet_data.$[outer].checksheet_status": "",

          //     "checkSheet_data.$[outer].tl_approval_status": "",
          //     "checkSheet_data.$[outer].hos_approval_status": "",
          //     "checkSheet_data.$[outer].sender_tm_no": "",
          //     "checkSheet_data.$[outer].sender_tm_name": "",
          //     "checkSheet_data.$[outer].checkSheetSendingUser": "",
          //     "checkSheet_data.$[outer].assign_TL": "",
          //     "checkSheet_data.$[outer].assign_HOS": "",
          //     "checkSheet_data.$[outer].assign_TL_name": "",
          //     "checkSheet_data.$[outer].assign_HOS_name": "",
          //     "checkSheet_data.$[outer].rejected_remarks": "",
          //     "checkSheet_data.$[outer].approved_by_TL": "",
          //     "checkSheet_data.$[outer].approved_by_HOS": "",
          //     "checkSheet_data.$[outer].preparation_TL_date": "",
          //     "checkSheet_data.$[outer].preparation_TL_HOSS_date": "",
          //     "checkSheet_data.$[outer].preparation_HOS_date": "",

          //     "checkSheet_data.$[outer].prd_tl_approval_status": "",
          //     "checkSheet_data.$[outer].plan_prepared_tm_no": "",
          //     "checkSheet_data.$[outer].plan_prepared_tm_name": "",
          //     "checkSheet_data.$[outer].plan_prepared_email": "",
          //     "checkSheet_data.$[outer].assign_PRD_TL": "",
          //     "checkSheet_data.$[outer].assign_PRD_TL_name": "",
          //     "checkSheet_data.$[outer].approved_by_PRD_TL": "",
          //     "checkSheet_data.$[outer].planning_TL_date": "",
          //     "checkSheet_data.$[outer].planning_PRD_TL_date": "",

          //     "checkSheet_data.$[outer].totalPMTime": "",
          //     // "checkSheet_data.$[outer].supportingOperatorList": "",
          //     "checkSheet_data.$[outer].PMworkedTMName": "",
          //     "checkSheet_data.$[outer].PMStatus": "",
          //     "checkSheet_data.$[outer].carriedPMStatus": "",
          //     "checkSheet_data.$[outer].currentMonthScheduleOrNotStatus": "",
          //     "checkSheet_data.$[outer].PMDelayRemark": "",

          //     "checkSheet_data.$[outer].implemetation_completed_date": "",
          //     "checkSheet_data.$[outer].implemetation_completed_tm_no": "",
          //     "checkSheet_data.$[outer].implemetation_completed_tm_name": "",
          //     "checkSheet_data.$[outer].implementation_assign_PRD_TL": "",
          //     "checkSheet_data.$[outer].implementation_assign_MTD_TL": "",
          //     "checkSheet_data.$[outer].implementation_assign_MTD_HOS": "",
          //     "checkSheet_data.$[outer].implementation_approval_month_of_hod": "",
          //     "checkSheet_data.$[outer].implementation_approval_hod_remarks": "",
          //     "checkSheet_data.$[outer].implementation_assign_MTD_HOD": "",

          //     "checkSheet_data.$[outer].implementation_assign_PRD_TL_name": "",
          //     "checkSheet_data.$[outer].implementation_assign_MTD_TL_name": "",
          //     "checkSheet_data.$[outer].implementation_assign_MTD_HOS_name": "",
          //     "checkSheet_data.$[outer].implementation_assign_MTD_HOD_name": "",
          //     "checkSheet_data.$[outer].implemetation_quality_remarks": "",

          //     "checkSheet_data.$[outer].implementation_rejected_remarks": "",
          //     "checkSheet_data.$[outer].implementation_approved_by_PRD_TL": "",
          //     "checkSheet_data.$[outer].implementation_approved_by_MTD_TL": "",
          //     "checkSheet_data.$[outer].implementation_approved_by_MTD_HOS": "",
          //     "checkSheet_data.$[outer].implementation_approved_by_MTD_HOD": "",

          //     "checkSheet_data.$[outer].implementation_approved_PRD_TL_date": "",
          //     "checkSheet_data.$[outer].implementation_approved_MTD_TL_date": "",
          //     "checkSheet_data.$[outer].implementation_approved_MTD_HOS_date": "",

          //     "checkSheet_data.$[outer].implementation_approved_MTD_HOD_date": "",

          //     "checkSheet_data.$[outer].implemetation_prd_tl_approval_status": "",
          //     "checkSheet_data.$[outer].implemetation_mtd_tl_approval_status": "",
          //     "checkSheet_data.$[outer].implemetation_mtd_hos_approval_status": "",
          //     "checkSheet_data.$[outer].implemetation_mtd_hod_approval_status": "",

          //     "checkSheet_data.$[outer].revisionContentData": "",
          //     "checkSheet_data.$[outer].flagForRevisionContent": "",
          //     "checkSheet_data.$[outer].flagForNewRevisionContentDataAdded": "",
          //     "checkSheet_data.$[outer].extraSpareDetails": "",

          // }
        }
        // {
        //     arrayFilters: [{ 'outer.current_year': selectedRow.checkSheet_data.current_year }],
        // }
      );

      const deleteChecksheet1 = await Machine.updateOne(
        { machine_code: selectedRow.machine_code },
        {
          $push: {
            checkSheet_data: {
              current_year: selectedRow.checkSheet_data.current_year,
            },
          },
        }
      );

      res.status(201).json({ message: "Removed Checksheet !!!" });
    }
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log(error);
    console.log("Data not valid or received !!!");
  }
});

router.post("/PMCarryOnToNextMonth", async (req, res) => {
  try {
    const {
      machine_code,
      monthForCompareSystemMonth,
      tableRowId,
      previousMonth,
      cycleOfPerticularRow,
      skipCountForStatusUpdate,
      previousToPreviousMonth,
      yearOfCheckSheet,
    } = req.body;
    // console.log(machine_code, monthForCompareSystemMonth, tableRowId, previousMonth, cycleOfPerticularRow, skipCountForStatusUpdate, previousToPreviousMonth, yearOfCheckSheet)

    let keyOfMonth = `checkSheet_data.$[outer].checkSheet.$[inner].planningTableAnimationArray2.${monthForCompareSystemMonth}`;

    let keyOfPreviousMonth = `checkSheet_data.$[outer].checkSheet.$[inner].planningTableAnimationArray2.${previousMonth}`;

    let carryData;
    let updatePreviousMonth;
    let arrayForPMData = [];
    arrayForPMData.push(1, "dummy");

    updatePreviousMonth = await Machine.updateOne(
      { machine_code: machine_code },
      {
        $set: {
          [keyOfPreviousMonth]: arrayForPMData,
        },
      },
      {
        arrayFilters: [
          { "outer.current_year": yearOfCheckSheet },
          { "inner.tableRowId": tableRowId },
        ],
      }
    );

    carryData = await Machine.updateOne(
      { machine_code: machine_code },
      {
        $set: {
          [keyOfMonth]: "2",
        },
      },
      {
        arrayFilters: [
          { "outer.current_year": yearOfCheckSheet },
          { "inner.tableRowId": tableRowId },
        ],
      }
    );

    if (carryData || updatePreviousMonth) {
      return res.status(201).json("Checksheet data carried!!!");
    } else {
      return res.status(400).json("Checksheet data not carried!!!");
    }
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log(error);
    console.log("Data not valid or received !!!");
  }
});

router.post(
  "/postMachineIdToGetAllDetailsOfMachine",
  authenticate,
  async (req, res) => {
    try {
      let { machine_code, selectedYear } = req.body;
      // console.log(machineID)

      let currentYear =
        new Date().getMonth() < 3
          ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
          : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
      let selectedYearOfCheckSheet =
        req?.query?.selectedYear === currentYear
          ? [
              {
                "checkSheet_data.current_year": req?.query?.selectedYear,
              },
              {
                checkSheet_data: [],
              },
            ]
          : [
              {
                "checkSheet_data.current_year": req?.query?.selectedYear,
              },
            ];

      // const machineData = await Machine.findOne({ _id: machineID })
      let machineLastData;
      machineLastData = await Machine.aggregate([
        {
          $match: {
            machine_code,
            $or: selectedYearOfCheckSheet,
          },
        },
        {
          $project: {
            machine_code: 1,
            machine_name: 1,
            machine_nickname: 1,
            machine_sequence: 1,
            installation_date: 1,
            maker_name: 1,
            maker_sr_no: 1,
            manufacturingDate: 1,
            isPM: 1,
            line_names: 1,
            checkSheet_data: 1,
          },
        },
        {
          $unwind: "$checkSheet_data",
        },
        {
          $match: {
            "checkSheet_data.current_year": req?.query?.selectedYear,
          },
        },
      ]);

      machineLastData = await Machine.populate(machineLastData, {
        path: "line_names",
        populate: {
          path: "cell_names",
          populate: {
            path: "subSection_names",
            model: "SubSections",
          },
        },
      });

      const section = await Section.findOne({
        section_id: req?.rootUser?.section_data?.split("-")?.[0],
      });

      let queryObj = {
        plant_data: req?.rootUser?.plant_data,
        _id: { $ne: req?.rootUser?._id },
      };

      if (req?.query?.getAllUser) {
        delete queryObj?._id;
      }

      if (req?.rootUser?.tm_grade !== "HOD") {
        if (section.dashboardLevel === "Yes") {
          queryObj = {
            ...queryObj,
            section_data: req?.rootUser?.section_data,
          };
        } else {
          queryObj = {
            ...queryObj,
            section_data: req?.rootUser?.section_data,
            subSection_data: { $in: req?.rootUser?.subSection_data },
          };
        }
      }

      const mtdHOS = await User.find(
        {
          ...queryObj,
          tm_department: "MTD",
          tm_grade: "HOS",
        },
        { tm_no: 1, tm_name: 1, email: 1 }
      );
      const mtdTL = await User.find(
        {
          ...queryObj,
          tm_department: "MTD",
          user_type: "TL/HOSS",
        },
        { tm_no: 1, tm_name: 1, email: 1 }
      );
      const mtdHOD = await User.find(
        {
          plant_data: req?.rootUser?.plant_data,
          _id: { $ne: req?.rootUser?._id },
          tm_department: "MTD",
          tm_grade: "HOD",
        },
        { tm_no: 1, tm_name: 1, email: 1 }
      );
      const prdTL = await User.find(
        {
          ...queryObj,
          tm_department: "PRD",
          user_type: "TL/HOSS",
        },
        { tm_no: 1, tm_name: 1, email: 1 }
      );

      const operatorList = await User.find(
        {
          ...queryObj,
          user_type: "Operator",
        },
        { tm_no: 1, tm_name: 1, email: 1 }
      );

      // console.log(machineLastData)

      res.send({
        machineLastData: machineLastData[0],
        mtdHOS,
        mtdTL,
        mtdHOD,
        prdTL,
        operatorList,
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("User id not received!!!");
    }
  }
);

//get data from selected machine and respond it's checksheet preparation data
router.post(
  "/postMachineToGetChacksheetPreparationData",
  authenticate,
  async (req, res) => {
    try {
      let { selectedMachine, copyPreparationDataToSelectedMachine, request } =
        req.body;

      let getChecksheetPreparationDataOfSelectedMachine,
        copyPreparationData,
        newUpdatedPreparationDataOfSelectedmachine,
        checkSheetExistsOrNot;
      //2022-23
      let current_year =
        new Date().getMonth() < 3
          ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
          : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
      checkSheetExistsOrNot = await Machine.aggregate([
        {
          $match: {
            machine_code: copyPreparationDataToSelectedMachine,
          },
        },
        {
          $project: {
            machine_code: 1,
            machine_name: 1,
            machine_nickname: 1,
            machine_sequence: 1,
            installation_date: 1,
            maker_name: 1,
            maker_sr_no: 1,
            manufacturingDate: 1,
            isPM: 1,
            line_names: 1,
            checkSheet_data: 1,
          },
        },
        {
          $unwind: "$checkSheet_data",
        },
        {
          $match: {
            "checkSheet_data.current_year": current_year,
          },
        },
      ]);

      if (request === "deleted") {
        getChecksheetPreparationDataOfSelectedMachine =
          await BackupMachineData.findOne({
            machine_code: selectedMachine,
          });

        if (
          checkSheetExistsOrNot?.[0]?.checkSheet_data?.checkSheet?.length === 0
        ) {
          copyPreparationData = await Machine.updateOne(
            {
              machine_code: copyPreparationDataToSelectedMachine,
            },
            {
              $set: {
                "checkSheet_data.$[outer].checkSheet":
                  // current_year: current_year,
                  getChecksheetPreparationDataOfSelectedMachine
                    .checkSheet_data[0].checkSheet,
              },
            },
            {
              arrayFilters: [{ "outer.current_year": current_year }],
            }
          );

          // console.log(copyPreparationData)
        } else {
          copyPreparationData = await Machine.updateOne(
            {
              machine_code: copyPreparationDataToSelectedMachine,
            },
            {
              $push: {
                checkSheet_data: {
                  current_year: current_year,
                  checkSheet:
                    getChecksheetPreparationDataOfSelectedMachine
                      .checkSheet_data[0].checkSheet,
                },
              },
            }
          );
        }

        newUpdatedPreparationDataOfSelectedmachine = await Machine.findOne({
          machine_code: copyPreparationDataToSelectedMachine,
        });
      } else {
        getChecksheetPreparationDataOfSelectedMachine = await Machine.aggregate(
          [
            {
              $match: {
                machine_code: selectedMachine,
              },
            },
            {
              $project: {
                machine_code: 1,
                machine_name: 1,
                machine_nickname: 1,
                machine_sequence: 1,
                installation_date: 1,
                maker_name: 1,
                maker_sr_no: 1,
                manufacturingDate: 1,
                isPM: 1,
                line_names: 1,
                checkSheet_data: 1,
              },
            },
            {
              $unwind: "$checkSheet_data",
            },
            {
              $match: {
                "checkSheet_data.current_year": current_year,
              },
            },
          ]
        );

        // console.log(getChecksheetPreparationDataOfSelectedMachine)
        // getChecksheetPreparationDataOfSelectedMachine[0].checkSheet_data.current_year = current_year
        // console.log(checkSheetExistsOrNot?.[0]?.checkSheet_data?.checkSheet?.length)
        if (
          checkSheetExistsOrNot?.[0]?.checkSheet_data?.checkSheet?.length === 0
        ) {
          copyPreparationData = await Machine.updateOne(
            { machine_code: copyPreparationDataToSelectedMachine },
            {
              $set: {
                "checkSheet_data.$[outer].checkSheet":
                  // current_year: getChecksheetPreparationDataOfSelectedMachine[0].checkSheet_data.current_year = current_year,
                  getChecksheetPreparationDataOfSelectedMachine[0]
                    .checkSheet_data.checkSheet,
              },
            },
            {
              arrayFilters: [{ "outer.current_year": current_year }],
            }
          );
        } else {
          copyPreparationData = await Machine.updateOne(
            { machine_code: copyPreparationDataToSelectedMachine },
            {
              $push: {
                checkSheet_data: {
                  current_year:
                    (getChecksheetPreparationDataOfSelectedMachine[0].checkSheet_data.current_year =
                      current_year),
                  checkSheet:
                    getChecksheetPreparationDataOfSelectedMachine[0]
                      .checkSheet_data.checkSheet,
                },
              },
            }
          );
          let removeFields = await Machine.updateOne(
            { machine_code: copyPreparationDataToSelectedMachine },
            {
              $unset: {
                "checkSheet_data.$[outer].checkSheet.$[].start_month": "",
                "checkSheet_data.$[outer].checkSheet.$[].planningTableAnimationArray2":
                  "",
                "checkSheet_data.$[outer].checkSheet.$[].abnormalityDetails":
                  "",
                "checkSheet_data.$[outer].checkSheet.$[].spareDetails": "",
                "checkSheet_data.$[outer].checkSheet.$[].PMOkImage": "",
              },
            },
            {
              arrayFilters: [{ "outer.current_year": current_year }],
            }
          );
          let againCopy = await Machine.aggregate([
            {
              $match: {
                machine_code: copyPreparationDataToSelectedMachine,
              },
            },
            {
              $project: {
                machine_code: 1,
                machine_name: 1,
                machine_nickname: 1,
                machine_sequence: 1,
                installation_date: 1,
                maker_name: 1,
                maker_sr_no: 1,
                manufacturingDate: 1,
                isPM: 1,
                line_names: 1,
                checkSheet_data: 1,
              },
            },
            {
              $unwind: "$checkSheet_data",
            },
            {
              $match: {
                "checkSheet_data.current_year": current_year,
              },
            },
          ]);
          copyPreparationData = await Machine.updateOne(
            { machine_code: copyPreparationDataToSelectedMachine },
            {
              $set: {
                "checkSheet_data.$[outer]": {
                  current_year: (againCopy[0].checkSheet_data.current_year =
                    current_year),
                  checkSheet: againCopy[0].checkSheet_data.checkSheet,
                },
              },
            },
            {
              arrayFilters: [{ "outer.current_year": current_year }],
            }
          );
        }
      }

      if (copyPreparationData || removeFields) {
        return res.status(201).json("Checksheet data carried!!!");
      } else {
        return res.status(400).json("Checksheet data not carried!!!");
      }
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("User id not received!!!");
    }
  }
);

router.post(
  "/postCellToGetLineListForReport",
  authenticate,
  async (req, res) => {
    try {
      let { cell } = req.body;

      // console.log("============>",cell)

      const refKeyForPopulateHosHodUser = [
        {
          tl: "annualPmScheduleApproval.monthlyApprovalData.Jan.checkedByTL",
          hos: "annualPmScheduleApproval.monthlyApprovalData.Jan.assignHOS",
          hod: "annualPmScheduleApproval.monthlyApprovalData.Jan.assignHOD",
        },

        {
          tl: "annualPmScheduleApproval.monthlyApprovalData.Feb.checkedByTL",
          hos: "annualPmScheduleApproval.monthlyApprovalData.Feb.assignHOS",
          hod: "annualPmScheduleApproval.monthlyApprovalData.Feb.assignHOD",
        },

        {
          tl: "annualPmScheduleApproval.monthlyApprovalData.Mar.checkedByTL",
          hos: "annualPmScheduleApproval.monthlyApprovalData.Mar.assignHOS",
          hod: "annualPmScheduleApproval.monthlyApprovalData.Mar.assignHOD",
        },
        {
          tl: "annualPmScheduleApproval.monthlyApprovalData.Apr.checkedByTL",
          hos: "annualPmScheduleApproval.monthlyApprovalData.Apr.assignHOS",
          hod: "annualPmScheduleApproval.monthlyApprovalData.Apr.assignHOD",
        },
        {
          tl: "annualPmScheduleApproval.monthlyApprovalData.May.checkedByTL",
          hos: "annualPmScheduleApproval.monthlyApprovalData.May.assignHOS",
          hod: "annualPmScheduleApproval.monthlyApprovalData.May.assignHOD",
        },
        {
          tl: "annualPmScheduleApproval.monthlyApprovalData.June.checkedByTL",
          hos: "annualPmScheduleApproval.monthlyApprovalData.June.assignHOS",
          hod: "annualPmScheduleApproval.monthlyApprovalData.June.assignHOD",
        },
        {
          tl: "annualPmScheduleApproval.monthlyApprovalData.July.checkedByTL",
          hos: "annualPmScheduleApproval.monthlyApprovalData.July.assignHOS",
          hod: "annualPmScheduleApproval.monthlyApprovalData.July.assignHOD",
        },
        {
          tl: "annualPmScheduleApproval.monthlyApprovalData.Aug.checkedByTL",
          hos: "annualPmScheduleApproval.monthlyApprovalData.Aug.assignHOS",
          hod: "annualPmScheduleApproval.monthlyApprovalData.Aug.assignHOD",
        },
        {
          tl: "annualPmScheduleApproval.monthlyApprovalData.Sep.checkedByTL",
          hos: "annualPmScheduleApproval.monthlyApprovalData.Sep.assignHOS",
          hod: "annualPmScheduleApproval.monthlyApprovalData.Sep.assignHOD",
        },
        {
          tl: "annualPmScheduleApproval.monthlyApprovalData.Oct.checkedByTL",
          hos: "annualPmScheduleApproval.monthlyApprovalData.Oct.assignHOS",
          hod: "annualPmScheduleApproval.monthlyApprovalData.Oct.assignHOD",
        },
        {
          tl: "annualPmScheduleApproval.monthlyApprovalData.Nov.checkedByTL",
          hos: "annualPmScheduleApproval.monthlyApprovalData.Nov.assignHOS",
          hod: "annualPmScheduleApproval.monthlyApprovalData.Nov.assignHOD",
        },
        {
          tl: "annualPmScheduleApproval.monthlyApprovalData.Dec.checkedByTL",
          hos: "annualPmScheduleApproval.monthlyApprovalData.Dec.assignHOS",
          hod: "annualPmScheduleApproval.monthlyApprovalData.Dec.assignHOD",
        },
      ];

      const lineInfo = await Line.find({ cell_names: cell })
        .populate({ path: "cell_names" })
        .populate({ path: "annualPmScheduleApproval.mtdTlId", model: "Users" })
        .populate({
          path: "annualPmScheduleApproval.mtdHos.mtdHosId",
          model: "Users",
        })
        .populate({
          path: "annualPmScheduleApproval.mtdHod.mtdHodId",
          model: "Users",
        })
        .populate({
          path: "annualPmScheduleApproval.prdHos.prdHosId",
          model: "Users",
        })

        .populate({ path: refKeyForPopulateHosHodUser[0].tl, model: "Users" })
        .populate({ path: refKeyForPopulateHosHodUser[0].hos, model: "Users" })
        .populate({ path: refKeyForPopulateHosHodUser[0].hod, model: "Users" })

        .populate({ path: refKeyForPopulateHosHodUser[1].tl, model: "Users" })
        .populate({ path: refKeyForPopulateHosHodUser[1].hos, model: "Users" })
        .populate({ path: refKeyForPopulateHosHodUser[1].hod, model: "Users" })

        .populate({ path: refKeyForPopulateHosHodUser[2].tl, model: "Users" })
        .populate({ path: refKeyForPopulateHosHodUser[2].hos, model: "Users" })
        .populate({ path: refKeyForPopulateHosHodUser[2].hod, model: "Users" })

        .populate({ path: refKeyForPopulateHosHodUser[3].tl, model: "Users" })
        .populate({ path: refKeyForPopulateHosHodUser[3].hos, model: "Users" })
        .populate({ path: refKeyForPopulateHosHodUser[3].hod, model: "Users" })

        .populate({ path: refKeyForPopulateHosHodUser[4].tl, model: "Users" })
        .populate({ path: refKeyForPopulateHosHodUser[4].hos, model: "Users" })
        .populate({ path: refKeyForPopulateHosHodUser[4].hod, model: "Users" })

        .populate({ path: refKeyForPopulateHosHodUser[5].tl, model: "Users" })
        .populate({ path: refKeyForPopulateHosHodUser[5].hos, model: "Users" })
        .populate({ path: refKeyForPopulateHosHodUser[5].hod, model: "Users" })

        .populate({ path: refKeyForPopulateHosHodUser[6].tl, model: "Users" })
        .populate({ path: refKeyForPopulateHosHodUser[6].hos, model: "Users" })
        .populate({ path: refKeyForPopulateHosHodUser[6].hod, model: "Users" })

        .populate({ path: refKeyForPopulateHosHodUser[7].tl, model: "Users" })
        .populate({ path: refKeyForPopulateHosHodUser[7].hos, model: "Users" })
        .populate({ path: refKeyForPopulateHosHodUser[7].hod, model: "Users" })

        .populate({ path: refKeyForPopulateHosHodUser[8].tl, model: "Users" })
        .populate({ path: refKeyForPopulateHosHodUser[8].hos, model: "Users" })
        .populate({ path: refKeyForPopulateHosHodUser[8].hod, model: "Users" })

        .populate({ path: refKeyForPopulateHosHodUser[9].tl, model: "Users" })
        .populate({ path: refKeyForPopulateHosHodUser[9].hos, model: "Users" })
        .populate({ path: refKeyForPopulateHosHodUser[9].hod, model: "Users" })

        .populate({ path: refKeyForPopulateHosHodUser[10].tl, model: "Users" })
        .populate({ path: refKeyForPopulateHosHodUser[10].hos, model: "Users" })
        .populate({ path: refKeyForPopulateHosHodUser[10].hod, model: "Users" })

        .populate({ path: refKeyForPopulateHosHodUser[11].tl, model: "Users" })
        .populate({ path: refKeyForPopulateHosHodUser[11].hos, model: "Users" })
        .populate({
          path: refKeyForPopulateHosHodUser[11].hod,
          model: "Users",
        });
      // .populate({ path: "annualPmScheduleApproval.monthlyApprovalData.Apr.assignHOD", model: "Users" })

      // console.log(lineInfo)

      // lineInfo?.map((item) => {
      //     if (item?.line_name === "Linbe11") {

      //         console.log(
      //             item?.annualPmScheduleApproval?.[0]
      //         )
      //     }

      // })

      res.json({ lineInfo });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log("============= 5690", error);
      console.log("User id not received!!!");
    }
  }
);

router.post(
  "/postLineToGetMachineListForReportDashboard",
  authenticate,
  async (req, res) => {
    try {
      let { line, selectedYear } = req.body;
      // console.log(line, selectedYear)
      // selectedYear = "2023-2024"

      // console.log("============>", selectedYear)
      let current_year =
        new Date().getMonth() < 3
          ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
          : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

      let selectedYearOfCheckSheet =
        selectedYear === current_year
          ? [
              {
                "checkSheet_data.current_year": selectedYear,
              },
              {
                checkSheet_data: [],
              },
              {
                checkSheet_data: undefined,
              },
            ]
          : [
              {
                "checkSheet_data.current_year": selectedYear,
              },
            ];

      const ObjectId = mongoose.Types.ObjectId;
      // console.log(ObjectId(line))

      // if (req?.rootUser?.user_type === "Operator") {

      //     machineInfo = await Machine.aggregate([{
      //         $match: {
      //             line_names: ObjectId(line),
      //         }
      //     },
      //     // { $addFields: { checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] } } },

      //     {
      //         $project: {
      //             machine_code: 1,
      //             machine_name: 1,
      //             machine_nickname: 1,
      //             machine_sequence: 1,
      //             installation_date: 1,
      //             maker_name: 1,
      //             maker_sr_no: 1,
      //             manufacturingDate: 1,
      //             isPM: 1,
      //             line_names: 1,
      //             checkSheet_data: 1
      //         }
      //     },

      //     {
      //         $unwind: {
      //             path: "$checkSheet_data",
      //             preserveNullAndEmptyArrays: true
      //         }
      //     },
      //     {
      //         $match: {
      //             $or: selectedYearOfCheckSheet
      //         }
      //     },
      //         // {
      //         //     $match: {
      //         //         $and: [{
      //         //             "checkSheet_data.checksheet_status": "Implementation"
      //         //         },
      //         //         {
      //         //             "checkSheet_data.checksheet_status": { $ne: "" }
      //         //         }
      //         //         ]

      //         //     }
      //         // },
      //     ])

      // } else {

      machineInfo = await Machine.aggregate([
        {
          $match: {
            line_names: ObjectId(line),
            isPM: "Yes",
          },
        },
        {
          $project: {
            machine_code: 1,
            machine_name: 1,
            machine_nickname: 1,
            machine_sequence: 1,
            installation_date: 1,
            maker_name: 1,
            maker_sr_no: 1,
            manufacturingDate: 1,
            isPM: 1,
            line_names: 1,
            // checkSheet_data: 1
            checkSheet_data: 1,
          },
        },
        {
          $unwind: {
            path: "$checkSheet_data",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            $or: selectedYearOfCheckSheet,
          },
        },
      ]);
      // }

      // const machineInfo = await Machine.find({ line_names: line }).populate({ path: "line_names", populate: { path: "cell_names", model: "Cells" } })
      machineInfo = await Machine.populate(machineInfo, {
        path: "line_names",
        populate: {
          path: "cell_names",
          model: "Cells",
          // path: "annualPmScheduleApproval[0]", model: "Cells"
        },
      });

      // console.log(machineInfo)

      res.json({ machineInfo });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log("========== 5751", error);
      console.log("User id not received!!!");
    }
  }
);

router.post(
  "/postSectionToGetAllDataForReport",
  authenticate,
  async (req, res) => {
    try {
      let { section, month, selectedYear, selectedLine } = req.body;
      // console.log(selectedLine, "********")
      let loggedUserData = req.rootUser;

      // console.log("____________", sectionInfo)

      let subSectionsData,
        subSectionIdArray = [],
        cellData,
        cellIdArray = [],
        lineData,
        lineIdArray = [],
        machineData,
        machineDataForChecksheet,
        subsectionSplitIdArrayForChecksheet = [];

      if (typeof section !== "object") {
        let sectionSplit = section.split("-");
        const sectionInfo = await Section.findOne({
          section_id: sectionSplit[0],
        });

        if (sectionInfo.dashboardLevel === "Yes") {
          subSectionsData = await SubSection.find({
            section_names: sectionInfo._id,
          }).sort({ subSection_sequence: 1 });
        } else {
          loggedUserData.subSection_data.map((ids) => {
            let subsectionsId = ids.split("-");
            subsectionSplitIdArrayForChecksheet.push(subsectionsId[0]);
          });
          subSectionsData = await SubSection.find({
            subSection_id: { $in: subsectionSplitIdArrayForChecksheet },
          }).sort({ subSection_sequence: 1 });
        }
      } else {
        if (section?.dashboardLevel === "Yes") {
          subSectionsData = await SubSection.find({
            section_names: section?._id,
          }).sort({ subSection_sequence: 1 });
        } else {
          subSectionsData = await SubSection.find({ _id: section?._id }).sort({
            subSection_sequence: 1,
          });
        }
      }

      for (let i = 0; i < subSectionsData.length; i++) {
        subSectionIdArray.push(subSectionsData[i]._id);
      }

      cellData = await Cell.find({
        subSection_names: { $in: subSectionIdArray },
      }).sort({ cell_sequence: 1 });

      for (let i = 0; i < cellData.length; i++) {
        cellIdArray.push(cellData[i]._id);
      }

      lineData = await Line.find({ cell_names: { $in: cellIdArray } }).sort({
        line_sequence: 1,
      });

      for (let i = 0; i < lineData.length; i++) {
        lineIdArray.push(lineData[i]._id);
      }

      let currentYear =
        new Date().getMonth() < 3
          ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
          : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

      let selectedYearOfCheckSheet =
        selectedYear === currentYear
          ? [
              {
                "checkSheet_data.current_year": selectedYear,
              },
              {
                checkSheet_data: [],
              },
            ]
          : [
              {
                "checkSheet_data.current_year": selectedYear,
              },
            ];

      // console.log(selectedYear, month)

      let groupData;
      let allData = [];
      // y = "Nov"
      let x = `$checkSheet_data.PMStatus.${month}`;
      let keyForCurrentMonthScheduleOrNotStatus = `$checkSheet_data.currentMonthScheduleOrNotStatus.${month}`;

      const monthKeyArray = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "June",
        "July",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      let previousMonth =
        monthKeyArray[monthKeyArray.indexOf(month) - 1] === undefined
          ? monthKeyArray.splice(-1)[0]
          : monthKeyArray[monthKeyArray.indexOf(month) - 1];

      let keyForPreviousMonth = `$checkSheet_data.PMStatus.${previousMonth}`;
      let keyForPreviousMonthCarriedPM = `$checkSheet_data.carriedPMStatus.${month}`;
      let lineDataWithCounter;
      //by default all line
      if (selectedLine === "" || selectedLine === undefined) {
        for (let i = 0; i < lineData.length; i++) {
          groupData = await Machine.aggregate([
            {
              $match: {
                line_names: lineData[i]._id,
                $or: selectedYearOfCheckSheet,
                isPM: "Yes",
              },
            },
            {
              $project: {
                machine_code: 1,
                machine_name: 1,
                machine_nickname: 1,
                machine_sequence: 1,
                installation_date: 1,
                maker_name: 1,
                maker_sr_no: 1,
                manufacturingDate: 1,
                isPM: 1,
                line_names: 1,
                checkSheet_data: 1,
              },
            },
            {
              $unwind: "$checkSheet_data",
            },
            {
              $match: {
                "checkSheet_data.current_year": selectedYear,
              },
            },
            {
              $match: {
                "checkSheet_data.PMStatus": { $ne: undefined },
              },
            },

            // {
            //     $match: {

            //         line_names: lineData[i]._id,
            //         "PMStatus": { $ne: undefined }

            //     }
            // },
            {
              $group: {
                _id: "$line_names",
                machine: {
                  $push: {
                    machine_code: "$machine_code",
                    machine_name: "$machine_name",
                    machineStatus: x,
                    previousStatus: keyForPreviousMonthCarriedPM,
                  },
                },
                total_pmSchedule: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          {
                            $ne: [x, ""],
                          },
                          {
                            $ne: [keyForCurrentMonthScheduleOrNotStatus, ""],
                          },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                total_current: {
                  $sum: {
                    $cond: [
                      {
                        $eq: [x, "Current Plan"],
                      },
                      1,
                      0,
                    ],
                  },
                },
                total_completed: {
                  $sum: {
                    $cond: [
                      {
                        $eq: [x, "Completed"],
                      },
                      1,
                      0,
                    ],
                  },
                },
                total_done_with_delay: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          {
                            $eq: [keyForPreviousMonth, "Done with delay"],
                          },

                          {
                            $eq: [keyForCurrentMonthScheduleOrNotStatus, ""],
                          },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                total_Previous: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          {
                            $eq: [keyForPreviousMonthCarriedPM, "CarriedPM"],
                          },
                          // {
                          //     $eq: [x, "No Completion"]
                          // },
                          {
                            $eq: [keyForCurrentMonthScheduleOrNotStatus, ""],
                          },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                // $group: {
                //     _id: "$line_names",
                //     machinePrevious: { $push: { machine_code: "$machine_code", machine_name: "$machine_name", machineStatus: keyForPreviousMonth } },
                //     total_Previous: {
                //         $sum: {
                //             $cond: [
                //                 {
                //                     $eq: [keyForPreviousMonth, "Current Plan"]
                //                 },
                //                 1, 0
                //             ]
                //         }
                //     },

                // }
              },
            },
            {
              $project: {
                _id: 0,
                line_names: "$_id",
                total_pmSchedule: 1,
                total_current: 1,
                total_completed: 1,
                machine: 1,
                total_Previous: 1,
                total_done_with_delay: 1,
              },
            },
          ]);

          if (groupData.length > 0) {
            for (let i = 0; i < groupData.length; i++) {
              allData.push(groupData[i]);
            }
          }
          // console.log(groupData)
        }

        lineDataWithCounter = await Machine.populate(allData, {
          path: "line_names",
        });
      }
      //for line selection
      else {
        groupData = await Machine.aggregate([
          {
            $match: {
              line_names: mongoose.Types.ObjectId(selectedLine),
              $or: selectedYearOfCheckSheet,
              isPM: "Yes",
            },
          },
          {
            $project: {
              machine_code: 1,
              machine_name: 1,
              machine_nickname: 1,
              machine_sequence: 1,
              installation_date: 1,
              maker_name: 1,
              maker_sr_no: 1,
              manufacturingDate: 1,
              isPM: 1,
              line_names: 1,
              checkSheet_data: 1,
            },
          },
          {
            $unwind: "$checkSheet_data",
          },
          {
            $match: {
              "checkSheet_data.current_year": selectedYear,
            },
          },
          {
            $match: {
              "checkSheet_data.PMStatus": { $ne: undefined },
            },
          },
          {
            $group: {
              _id: "$line_names",
              machine: {
                $push: {
                  machine_code: "$machine_code",
                  machine_name: "$machine_name",
                  machineStatus: x,
                  previousStatus: keyForPreviousMonthCarriedPM,
                },
              },
              total_pmSchedule: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        {
                          $ne: [x, ""],
                        },
                        {
                          $ne: [keyForCurrentMonthScheduleOrNotStatus, ""],
                        },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
              total_current: {
                $sum: {
                  $cond: [
                    {
                      $eq: [x, "Current Plan"],
                    },
                    1,
                    0,
                  ],
                },
              },
              total_completed: {
                $sum: {
                  $cond: [
                    {
                      $eq: [x, "Completed"],
                    },
                    1,
                    0,
                  ],
                },
              },
              total_done_with_delay: {
                $sum: {
                  $cond: [
                    {
                      $eq: [keyForPreviousMonth, "Done with delay"],
                    },
                    1,
                    0,
                  ],
                },
              },
              total_Previous: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        {
                          $eq: [keyForPreviousMonthCarriedPM, "CarriedPM"],
                        },
                        // {
                        //     $eq: [x, "No Completion"]
                        // },
                        {
                          $eq: [keyForCurrentMonthScheduleOrNotStatus, ""],
                        },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
          {
            $project: {
              _id: 0,
              line_names: "$_id",
              total_pmSchedule: 1,
              total_current: 1,
              total_completed: 1,
              machine: 1,
              total_Previous: 1,
              total_done_with_delay: 1,
            },
          },
        ]);

        if (groupData.length > 0) {
          for (let i = 0; i < groupData.length; i++) {
            allData.push(groupData[i]);
          }
        }
        // console.log(groupData)

        lineDataWithCounter = await Machine.populate(allData, {
          path: "line_names",
        });
      }

      // console.log("==============>", lineDataWithCounter, "<===================")

      res.json({ lineDataWithCounter, lineData });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("User id not received!!!");
    }
  }
);

let downloadFileName;

router.post("/postFileName", authenticate, async (req, res) => {
  // const file = fs.createWriteStream(filePath);

  try {
    const { fileName } = req.body;
    let filePath = path.join(__dirname, `../PMimages/${fileName}`);
    downloadFileName = filePath;
    if (downloadFileName) {
      res.status(201).json({ message: "File name posted" });
    }
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    // console.log("2032", error)
    console.log("Filename not received");
  }
});
router.get("/downloadFile", authenticate, async (req, res) => {
  try {
    // console.log(downloadFileName)
    res.download(downloadFileName);
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log("2032", error);
    console.log("Filename not received");
  }
});

router.post("/updateOpenPMData", authenticate, async (req, res) => {
  try {
    let { updateRow, oldRow } = req.body;
    // console.log(updateRow)
    let keyOfTargetdate = `checkSheet_data.$[outer].checkSheet.$[inner].abnormalityDetails.${updateRow.schedule_month}.targetDate`;

    let keyOfRemarksOnClose = `checkSheet_data.$[outer].checkSheet.$[inner].abnormalityDetails.${updateRow.schedule_month}.remarksOnClose`;
    let keyOfDoneDate = `checkSheet_data.$[outer].checkSheet.$[inner].abnormalityDetails.${updateRow.schedule_month}.doneDate`;
    let keyOfDoneBy = `checkSheet_data.$[outer].checkSheet.$[inner].abnormalityDetails.${updateRow.schedule_month}.doneBy`;

    let updateChecksheetPMData;
    if (
      typeof updateRow.targetDate === "object" &&
      updateRow.remarksOnClose != "" &&
      updateRow.doneDate != "" &&
      updateRow.doneBy != ""
    ) {
      updateChecksheetPMData = await Machine.updateOne(
        { machine_code: updateRow.machine_code },
        {
          $set: {
            [keyOfRemarksOnClose]: updateRow.remarksOnClose,
            [keyOfDoneDate]: updateRow.doneDate,
            [keyOfDoneBy]: updateRow.doneBy,
          },
        },
        {
          arrayFilters: [
            { "outer.current_year": updateRow.yearOfCheckSheet },
            { "inner.tableRowId": updateRow.table_id },
          ],
        }
      );
    } else {
      updateChecksheetPMData = await Machine.updateOne(
        { machine_code: updateRow.machine_code },
        {
          $push: {
            [keyOfTargetdate]: updateRow.targetDate,
          },
        },
        {
          arrayFilters: [
            { "outer.current_year": updateRow.yearOfCheckSheet },
            { "inner.tableRowId": updateRow.table_id },
          ],
        }
      );
    }

    if (updateChecksheetPMData) {
      return res.status(201).json("Checksheet data updated!!!");
    } else {
      return res.status(400).json("Checksheet data not updated!!!");
    }

    // res.json({ machineInfo })
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log(error);
    console.log("User id not received!!!");
  }
});

router.post("/updateOpenPMToClose", authenticate, async (req, res) => {
  try {
    const { selectedRow } = req.body;
    // console.log(selectedRow)

    let dateSplit = selectedRow.doneDate.split("-");
    let finalDateForDoneDate = `${dateSplit[2]}-${dateSplit[1]}`;

    let keyOfAddDoneDateAfterClosePM = `checkSheet_data.$[outer].checkSheet.$[inner].planningTableAnimationArray2.${selectedRow.schedule_month}`;
    let keyOfAbnormalityStatusOpenToClose = `checkSheet_data.$[outer].checkSheet.$[inner].abnormalityDetails.${selectedRow.schedule_month}.abnormalityStatus`;

    const updatePM = await Machine.updateOne(
      { machine_code: selectedRow.machine_code },
      {
        $set: {
          [keyOfAbnormalityStatusOpenToClose]: "Close",
        },
        $push: {
          [keyOfAddDoneDateAfterClosePM]: finalDateForDoneDate,
        },
      },
      {
        arrayFilters: [
          { "outer.current_year": selectedRow.yearOfCheckSheet },
          { "inner.tableRowId": selectedRow.table_id },
        ],
      }
    );

    if (updatePM) {
      return res.status(201).json("Checksheet status updated!!!");
    } else {
      return res.status(400).json("Checksheet status not updated!!!");
    }
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    res.status(409).json("Section already exists!!!");
  }
});

router.post(
  "/postSectionAndMonthToGetAllDataForReport",
  authenticate,
  async (req, res) => {
    // cron.schedule('1 59 * * * *', async () => {

    //     console.log("Calling at  54")

    // });

    try {
      let { section, currentMonth, selectedYear, previousMonth } = req.body;
      let loggedUserData = req.rootUser;
      let skipMachineDataWithEveryMonth = [];
      const monthKeyArray = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "June",
        "July",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      let currentYear =
        new Date().getMonth() < 3
          ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
          : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

      // let previousMonth = monthKeyArray[new Date().getMonth() - 1] === undefined ?
      //     monthKeyArray.splice(-1)[0] :
      //     monthKeyArray[new Date().getMonth() - 1];
      let monthForCompareSystemMonth = monthKeyArray[new Date().getMonth()];
      let currentMonthInNumber = new Date().getMonth();

      let keyForCurrentMonthPMStatus = `checkSheet_data.PMStatus.${currentMonth}`;
      let keyForPreviousMonthPMStatus = `checkSheet_data.carriedPMStatus.${currentMonth}`;
      let keyForCurrentMonthScheduleOrNotStatus = `checkSheet_data.currentMonthScheduleOrNotStatus.${currentMonth}`;

      const financialYearWiseMonthKeyArray = [
        "Apr",
        "May",
        "June",
        "July",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
        "Jan",
        "Feb",
        "Mar",
      ];

      let selectedYearOfCheckSheet =
        selectedYear === currentYear
          ? [
              {
                "checkSheet_data.current_year": selectedYear,
              },
              {
                checkSheet_data: [],
              },
            ]
          : [
              {
                "checkSheet_data.current_year": selectedYear,
              },
            ];

      // console.log(currentMonth, selectedYear)
      // console.log(monthKeyArray[monthKeyArray.indexOf(currentMonth) - 1], monthKeyArray.splice(-1)[0])

      // console.log(section);

      // console.log("____________", sectionInfo)
      let subSectionsData,
        subSectionIdArray = [],
        cellData,
        cellIdArray = [],
        lineData,
        lineIdArray = [],
        machineData,
        machineDataForChecksheet,
        subsectionSplitIdArrayForChecksheet = [];
      let machineDataForPreviousMonth, machineDataForCurrentMonth;

      if (typeof section !== "object") {
        let sectionSplit = section.split("-");
        const sectionInfo = await Section.findOne({
          section_id: sectionSplit[0],
        });

        if (sectionInfo.dashboardLevel === "Yes") {
          subSectionsData = await SubSection.find({
            section_names: sectionInfo._id,
          }).sort({ subSection_sequence: 1 });
        } else {
          loggedUserData.subSection_data.map((ids) => {
            let subsectionsId = ids.split("-");
            subsectionSplitIdArrayForChecksheet.push(subsectionsId[0]);
          });
          subSectionsData = await SubSection.find({
            subSection_id: { $in: subsectionSplitIdArrayForChecksheet },
          }).sort({ subSection_sequence: 1 });
        }
      } else {
        if (section?.dashboardLevel === "Yes") {
          subSectionsData = await SubSection.find({
            section_names: section?._id,
          }).sort({ subSection_sequence: 1 });
        } else {
          subSectionsData = await SubSection.find({ _id: section?._id }).sort({
            subSection_sequence: 1,
          });
        }
      }

      for (let i = 0; i < subSectionsData.length; i++) {
        subSectionIdArray.push(subSectionsData[i]._id);
      }

      cellData = await Cell.find({
        subSection_names: { $in: subSectionIdArray },
      }).sort({ cell_sequence: 1 });

      for (let i = 0; i < cellData.length; i++) {
        cellIdArray.push(cellData[i]._id);
      }

      lineData = await Line.find({ cell_names: { $in: cellIdArray } }).sort({
        line_sequence: 1,
      });

      for (let i = 0; i < lineData.length; i++) {
        lineIdArray.push(lineData[i]._id);
      }

      let keyOfPMStatusOfCurrentMonth = `checkSheet_data.PMStatus.${monthForCompareSystemMonth}`;

      machineDataForCurrentMonth = await Machine.aggregate([
        {
          $match: {
            line_names: { $in: lineIdArray },
            $or: selectedYearOfCheckSheet,
            checkSheet_data: { $ne: [] },
          },
        },
        {
          $project: {
            machine_code: 1,
            machine_name: 1,
            machine_nickname: 1,
            machine_sequence: 1,
            installation_date: 1,
            maker_name: 1,
            maker_sr_no: 1,
            manufacturingDate: 1,
            isPM: 1,
            line_names: 1,
            checkSheet_data: 1,
          },
        },
        {
          $unwind: "$checkSheet_data",
        },
        {
          $match: {
            "checkSheet_data.current_year": selectedYear,
          },
        },
        {
          $match: {
            $and: [
              {
                [keyForCurrentMonthPMStatus]: { $ne: "" },
              },
              {
                [keyForCurrentMonthScheduleOrNotStatus]: { $ne: "" },
              },
            ],
            "checkSheet_data.PMStatus": { $ne: undefined },
            // [keyOfPMStatusOfCurrentMonth]: { $ne:  "No Completion" }
          },
        },
      ]);

      let GetAllPlanAndCompletedHours;
      if (req?.query?.filter === "Hours") {
        const commonMiddleware = [
          {
            $match: {
              line_names: { $in: lineIdArray },
              checkSheet_data: { $ne: [] },
            },
          },
          {
            $unwind: "$checkSheet_data",
          },
          {
            $match: {
              "checkSheet_data.current_year": selectedYear,
              $and: [
                {
                  [keyForCurrentMonthPMStatus]: { $ne: "" },
                },
                {
                  [keyForCurrentMonthScheduleOrNotStatus]: { $ne: "" },
                },
              ],
              "checkSheet_data.PMStatus": { $ne: undefined },
            },
          },
        ];

        let GetAllPlanHours = await Machine.aggregate([
          ...commonMiddleware,
          {
            $unwind: "$checkSheet_data.checkSheet",
          },
          {
            $group: {
              _id: null,
              schedulePm: {
                $sum: {
                  $cond: {
                    if: {
                      $eq: [
                        {
                          $arrayElemAt: [
                            `$checkSheet_data.checkSheet.planningTableAnimationArray2.${currentMonth}`,
                            0,
                          ],
                        },
                        "1",
                      ],
                    },
                    then: {
                      $round: [
                        {
                          $divide: [
                            {
                              $toDouble: "$checkSheet_data.checkSheet.PM_time",
                            },
                            60,
                          ],
                        },
                        1,
                      ],
                    },
                    else: 0,
                  },
                },
              },
            },
          },
        ]);

        const GetAllCompletedHours = await Machine.aggregate([
          ...commonMiddleware,
          {
            $group: {
              _id: null,
              completed: {
                $sum: {
                  $round: [
                    {
                      $divide: [
                        {
                          $toDouble: `$checkSheet_data.totalPMTime.${currentMonth}.totalWorkedPMTime`,
                        },
                        60,
                      ],
                    },
                    1,
                  ],
                },
              },
            },
          },
        ]);

        GetAllPlanAndCompletedHours = {
          ...GetAllPlanHours?.[0],
          ...GetAllCompletedHours?.[0],
        };
      }

      machineDataForPreviousMonth = await Machine.aggregate([
        {
          $match: {
            line_names: { $in: lineIdArray },
            $or: selectedYearOfCheckSheet,
            checkSheet_data: { $ne: [] },
          },
        },
        {
          $project: {
            machine_code: 1,
            machine_name: 1,
            machine_nickname: 1,
            machine_sequence: 1,
            installation_date: 1,
            maker_name: 1,
            maker_sr_no: 1,
            manufacturingDate: 1,
            isPM: 1,
            line_names: 1,
            checkSheet_data: 1,
          },
        },
        {
          $unwind: "$checkSheet_data",
        },
        {
          $match: {
            "checkSheet_data.current_year": selectedYear,
          },
        },
        {
          $match: {
            // [keyForPreviousMonthPMStatus]: { $ne: "" },
            "checkSheet_data.PMStatus": { $ne: undefined },
          },
        },
      ]);
      machineDataForPreviousMonth = await Machine.populate(
        machineDataForPreviousMonth,
        { path: "line_names", populate: { path: "cell_names", model: "Cells" } }
      );

      machineDataForPreviousMonth.map((keyForCheckSheet) => {
        for (
          let i = 0;
          i < Object.keys(keyForCheckSheet?.checkSheet_data?.PMStatus)?.length;
          i++
        ) {
          let month = financialYearWiseMonthKeyArray[i];

          if (
            keyForCheckSheet?.checkSheet_data?.PMStatus[month] === "PM Skip"
          ) {
            for (
              let j = 0;
              j < keyForCheckSheet?.checkSheet_data?.checkSheet?.length;
              j++
            ) {
              if (
                // (keyForCheckSheet?.checkSheet_data?.checkSheet[j]?.cycle !== '1/1M' ||
                //     keyForCheckSheet?.checkSheet_data?.checkSheet[j]?.cycle !== '1/2M')
                (keyForCheckSheet?.checkSheet_data?.checkSheet[j]?.cycle ===
                  "1/3M" ||
                  keyForCheckSheet?.checkSheet_data?.checkSheet[j]?.cycle ===
                    "1/4M" ||
                  keyForCheckSheet?.checkSheet_data?.checkSheet[j]?.cycle ===
                    "1/6M" ||
                  keyForCheckSheet?.checkSheet_data?.checkSheet[j]?.cycle ===
                    "1/Y") &&
                keyForCheckSheet?.checkSheet_data?.checkSheet[j]
                  ?.planningTableAnimationArray2[month][1] === "skip" &&
                keyForCheckSheet?.checkSheet_data?.checkSheet[j]
                  ?.planningTableAnimationArray2[month][0] === "1" &&
                !keyForCheckSheet?.checkSheet_data?.checkSheet[j]?.isDeleted
              ) {
                // console.log(keyForCheckSheet?.checkSheet_data?.checkSheet[j]?.tableRowId, "-----", keyForCheckSheet?.machine_code, "--->", keyForCheckSheet?.checkSheet_data?.checkSheet[j]?.cycle, "---", j, "month---", month)

                skipMachineDataWithEveryMonth.push(
                  new Object({
                    machine_id: keyForCheckSheet?._id,
                    machine_name: keyForCheckSheet?.machine_name,
                    machine_code: keyForCheckSheet?.machine_code,
                    yearOfCheckSheet:
                      keyForCheckSheet?.checkSheet_data?.current_year,
                    schedule_month: month,
                    line_names: keyForCheckSheet?.line_names,
                    PMStatus:
                      keyForCheckSheet?.checkSheet_data?.PMStatus[month],
                    completionTargetDate:
                      keyForCheckSheet?.checkSheet_data?.completionTargetDate?.[
                        month
                      ],
                    checkSheet_data: keyForCheckSheet?.checkSheet_data,
                  })
                );
                break;
              }
            }
          }
          // console.log(keyForCheckSheet?.checkSheet_data?.PMStatus[month], "----", keyForCheckSheet?.machine_name)
          if (
            keyForCheckSheet?.checkSheet_data?.PMStatus[month] ===
              "Done with delay" &&
            keyForCheckSheet?.checkSheet_data?.flagOfDoneWithDelayForOneMonth?.[
              month
            ] === currentMonthInNumber
          ) {
            skipMachineDataWithEveryMonth.push(
              new Object({
                machine_id: keyForCheckSheet?._id,
                machine_name: keyForCheckSheet?.machine_name,
                machine_code: keyForCheckSheet?.machine_code,
                yearOfCheckSheet:
                  keyForCheckSheet?.checkSheet_data?.current_year,
                schedule_month: month,
                line_names: keyForCheckSheet?.line_names,
                PMStatus: keyForCheckSheet?.checkSheet_data?.PMStatus[month],
                checkSheet_data: keyForCheckSheet?.checkSheet_data,
                completionTargetDate:
                  keyForCheckSheet?.checkSheet_data?.completionTargetDate?.[
                    month
                  ],
              })
            );
          }
        }
        if (previousMonth != "Mar") {
          if (
            keyForCheckSheet?.checkSheet_data?.carriedPMStatus?.[
              currentMonth
            ] != "" &&
            keyForCheckSheet?.checkSheet_data?.carriedPMStatus != undefined &&
            keyForCheckSheet?.checkSheet_data
              ?.currentMonthScheduleOrNotStatus?.[currentMonth] === ""
          ) {
            skipMachineDataWithEveryMonth.push(
              new Object({
                machine_id: keyForCheckSheet?._id,
                machine_name: keyForCheckSheet?.machine_name,
                machine_code: keyForCheckSheet?.machine_code,
                yearOfCheckSheet:
                  keyForCheckSheet?.checkSheet_data?.current_year,
                line_names: keyForCheckSheet?.line_names,
                schedule_month: previousMonth,
                PMStatus:
                  keyForCheckSheet?.checkSheet_data?.PMStatus[previousMonth],
                checkSheet_data: keyForCheckSheet?.checkSheet_data,
                flagForPreviousMonthData: true,
                // completionTargetDate:
                //       keyForCheckSheet?.checkSheet_data?.completionTargetDate?.[
                //         previousMonth
                //       ],
              })
            );
          }
        }
      });

      machineDataForCurrentMonth = await Machine.populate(
        machineDataForCurrentMonth,
        { path: "line_names", populate: { path: "cell_names", model: "Cells" } }
      );
      skipMachineDataWithEveryMonth = await Machine.populate(
        skipMachineDataWithEveryMonth,
        { path: "line_names", populate: { path: "cell_names", model: "Cells" } }
      );

      res.json({
        skipMachineDataWithEveryMonth,
        machineDataForCurrentMonth,
        machineDataForPreviousMonth,
        cellData,
        lineData,
        GetAllPlanAndCompletedHours,
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("User id not received!!!");
    }
  }
);

router.post(
  "/postSectionToGetAllDataForAnnualStatusReport/:id",
  authenticate,
  async (req, res) => {
    let { sectionOrSubSection, dashboardLevel, selectedYear } = req.body;

    const loggedUserData = req.rootUser;

    try {
      let subSectionsData,
        cellData,
        lineData,
        subsectionSplitIdArrayForChecksheet = [];
      // console.log(sectionOrSubSection)
      if (req.params.id === "AnnualReport") {
        if (typeof sectionOrSubSection !== "object") {
          const sectionInfo = await Section.findOne({
            section_id: sectionOrSubSection.split("-")[0],
          });

          if (sectionInfo.dashboardLevel === "Yes") {
            subSectionsData = await SubSection.find({
              section_names: sectionInfo._id,
            }).sort({ subSection_sequence: 1 });
          } else {
            loggedUserData.subSection_data.map((ids) => {
              let subsectionsId = ids.split("-");
              subsectionSplitIdArrayForChecksheet.push(subsectionsId[0]);
            });
            subSectionsData = await SubSection.find({
              subSection_id: { $in: subsectionSplitIdArrayForChecksheet },
            }).sort({ subSection_sequence: 1 });
          }
        } else {
          if (sectionOrSubSection?.dashboardLevel === "Yes") {
            subSectionsData = await SubSection.find({
              section_names: sectionOrSubSection?._id,
            }).sort({ subSection_sequence: 1 });
          } else {
            subSectionsData = await SubSection.find({
              _id: sectionOrSubSection?._id,
            }).sort({ subSection_sequence: 1 });
          }
        }

        cellData = await Cell.find({
          subSection_names: { $in: subSectionsData?.map((item) => item?._id) },
        }).sort({ cell_sequence: 1 });
      } else {
        if (dashboardLevel === "Yes") {
          subSectionsData = await SubSection.find({
            section_names: sectionOrSubSection,
          }).sort({ subSection_sequence: 1 });

          cellData = await Cell.find({
            subSection_names: {
              $in: subSectionsData?.map((item) => item?._id),
            },
          }).sort({ cell_sequence: 1 });
        } else {
          cellData = await Cell.find({
            subSection_names: { $in: sectionOrSubSection },
          }).sort({ cell_sequence: 1 });
        }
      }

      lineData = await Line.find({
        cell_names: { $in: cellData?.map((item) => item?._id) },
      }).sort({ line_sequence: 1 });

      let currentYear =
        new Date().getMonth() < 3
          ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
          : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

      let selectedYearOfCheckSheet =
        selectedYear === currentYear
          ? [
              {
                "checkSheet_data.current_year": selectedYear,
              },
              {
                checkSheet_data: [],
              },
            ]
          : [
              {
                "checkSheet_data.current_year": selectedYear,
              },
            ];

      // console.log(selectedYear)
      let groupData;
      let allData = [];
      // y = "Nov"

      const monthKeyArray = [
        "Apr",
        "May",
        "June",
        "July",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
        "Jan",
        "Feb",
        "Mar",
      ];

      let annual_total_current_schedule = [];
      let annual_completed = [];
      let annual_previous_pending = [];

      // console.log(i, "------->")

      for (let j = 0; j < monthKeyArray.length; j++) {
        let sumVariableForTotalSchedule = 0;
        let sumVariableForTotalCompleted = 0;
        let sumVariableForTotalPreviousPending = 0;

        let x = `$checkSheet_data.PMStatus.${monthKeyArray[j]}`;
        let keyOfTotalDoneWithDelay = `$checkSheet_data.PMStatus.${
          monthKeyArray[j - 1]
        }`;
        let keyForCurrentMonthScheduleOrNotStatus = `$checkSheet_data.currentMonthScheduleOrNotStatus.${monthKeyArray[j]}`;

        // let previousMonth = monthKeyArray[j - 1] === undefined ? monthKeyArray.splice(-1)[0] : monthKeyArray[j - 1]
        let keyForPreviousMonth = `$checkSheet_data.carriedPMStatus.${monthKeyArray[j]}`;

        for (let i = 0; i < lineData.length; i++) {
          // console.log(x, keyForPreviousMonth)

          // let previousMonth =
          //     monthKeyArray[monthKeyArray.indexOf(month) - 1] === undefined
          //         ? monthKeyArray.splice(-1)[0]
          //         : monthKeyArray[monthKeyArray.indexOf(month) - 1];
          groupData = await Machine.aggregate([
            {
              $match: {
                line_names: lineData[i]._id,
                $or: selectedYearOfCheckSheet,
                isPM: "Yes",
              },
            },
            {
              $project: {
                machine_code: 1,
                machine_name: 1,
                machine_nickname: 1,
                machine_sequence: 1,
                installation_date: 1,
                maker_name: 1,
                maker_sr_no: 1,
                manufacturingDate: 1,
                isPM: 1,
                line_names: 1,
                checkSheet_data: 1,
              },
            },
            {
              $unwind: "$checkSheet_data",
            },
            {
              $match: {
                "checkSheet_data.current_year": selectedYear,
              },
            },
            {
              $match: {
                "checkSheet_data.PMStatus": { $ne: undefined },
                // "checkSheet_data.carriedPMStatus": { $ne: undefined },
              },
            },
            {
              $group: {
                _id: "$line_names",
                machine: {
                  $push: {
                    machine_code: "$machine_code",
                    machine_name: "$machine_name",
                  },
                },
                total_pmSchedule: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          {
                            $ne: [x, ""],
                          },
                          {
                            $ne: [keyForCurrentMonthScheduleOrNotStatus, ""],
                          },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                total_completed: {
                  $sum: {
                    $cond: [
                      {
                        $eq: [x, "Completed"],
                      },
                      1,
                      0,
                    ],
                  },
                },
                total_done_with_delay: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          {
                            $eq: [keyOfTotalDoneWithDelay, "Done with delay"],
                          },
                          {
                            $eq: [keyForCurrentMonthScheduleOrNotStatus, ""],
                          },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                total_Previous: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          {
                            $eq: [keyForPreviousMonth, "CarriedPM"],
                          },
                          // {
                          //     $eq: [x, "No Completion"]
                          // },
                          {
                            $eq: [keyForCurrentMonthScheduleOrNotStatus, ""],
                          },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },

            {
              $project: {
                _id: 0,
                line_names: "$_id",
                machine: 1,
                total_pmSchedule: 1,
                total_completed: 1,
                total_Previous: 1,
                total_done_with_delay: 1,
              },
            },
          ]);
          if (groupData.length > 0) {
            // console.log("---------------------------", groupData)
            sumVariableForTotalSchedule =
              sumVariableForTotalSchedule + groupData[0].total_pmSchedule;
            sumVariableForTotalCompleted =
              sumVariableForTotalCompleted +
              groupData[0].total_completed +
              groupData[0].total_done_with_delay;
            sumVariableForTotalPreviousPending =
              sumVariableForTotalPreviousPending + groupData[0].total_Previous;
          }
        }

        // console.log(sumVariableForTotalSchedule, "=====>", j)

        annual_total_current_schedule.push(sumVariableForTotalSchedule);
        annual_completed.push(sumVariableForTotalCompleted);
        annual_previous_pending.push(sumVariableForTotalPreviousPending);

        if (groupData?.length > 0) {
          for (let i = 0; i < groupData.length; i++) {
            allData.push(groupData[i]);
          }
        }
      }
      // console.log(annual_total_current_schedule)
      // console.log("***************************")
      // console.log(annual_completed)
      // console.log("=========================")
      // console.log(annual_previous_pending)

      // let lineDataWithCounter = await Machine.populate(allData, { path: "line_names" })

      // console.log("==============>", lineDataWithCounter, "<===================")

      res.json({
        annual_total_current_schedule,
        annual_completed,
        annual_previous_pending,
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("User id not received!!!");
    }
  }
);

router.post("/postSectionToGetSectionInfo", authenticate, async (req, res) => {
  try {
    let { section } = req.body;

    let sectionSplit = section.split("-");

    const sectionInfo = await Section.findOne({ section_id: sectionSplit[0] });

    res.json({
      sectionInfo,
    });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log(error);
    console.log("User id not received!!!");
  }
});

router.post(
  "/postSubSectionToGetSubSectionInfo",
  authenticate,
  async (req, res) => {
    try {
      let { subSection } = req.body;

      // console.log(subSection)

      let subSectionSplit = subSection.split("-");

      const subSectionInfo = await SubSection.findOne({
        subSection_id: subSectionSplit[0],
      });

      res.json({
        subSectionInfo,
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("User id not received!!!");
    }
  }
);

router.post(
  "/postSectionToGetAllDataForMainDashboardGraph",
  authenticate,
  async (req, res) => {
    try {
      let { sectionOrSubSection, dashboardLevel, selectedMonth, selectedYear } =
        req.body;

      // console.log(selectedYear)

      let subSectionsData, cellData, lineData;

      if (dashboardLevel === "Yes") {
        subSectionsData = await SubSection.find({
          section_names: sectionOrSubSection,
        }).sort({ subSection_sequence: 1 });

        cellData = await Cell.find({
          subSection_names: { $in: subSectionsData?.map((item) => item?._id) },
        }).sort({ cell_sequence: 1 });
      } else {
        cellData = await Cell.find({
          subSection_names: { $in: sectionOrSubSection },
        }).sort({ cell_sequence: 1 });
      }

      lineData = await Line.find({
        cell_names: { $in: cellData?.map((item) => item?._id) },
      }).sort({ line_sequence: 1 });

      let currentYear =
        new Date().getMonth() < 3
          ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
          : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

      let selectedYearOfCheckSheet =
        selectedYear === currentYear
          ? [
              {
                "checkSheet_data.current_year": selectedYear,
              },
              {
                checkSheet_data: [],
              },
            ]
          : [
              {
                "checkSheet_data.current_year": selectedYear,
              },
            ];

      const financialYearWiseMonthKeyArray = [
        "Apr",
        "May",
        "June",
        "July",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
        "Jan",
        "Feb",
        "Mar",
      ];
      // console.log(financialYearWiseMonthKeyArray[financialYearWiseMonthKeyArray.indexOf('Apr') - 1])
      let previousMonth =
        financialYearWiseMonthKeyArray[
          financialYearWiseMonthKeyArray.indexOf(selectedMonth) - 1
        ];

      let groupData;

      let keyForSelectedMonth = `$checkSheet_data.PMStatus.${selectedMonth}`;
      let keyForPreviousMonth = `$checkSheet_data.carriedPMStatus.${selectedMonth}`;
      let keyForCurrentMonthScheduleOrNotStatus = `$checkSheet_data.currentMonthScheduleOrNotStatus.${selectedMonth}`;

      let sumVariableForTotalSchedule = 0;
      let sumVariableForTotalCompleted = 0;
      let sumVariableForTotalOngoing = 0;
      let sumVariableForTotalPreviousPending = 0;
      let sumVariableForTotalDoneWithDelay = 0;

      let keyOfTotalDoneWithDelay = `$checkSheet_data.PMStatus.${previousMonth}`;

      let groupCondition = previousMonth
        ? {
            _id: "$line_names",
            machine: {
              $push: {
                machine_code: "$machine_code",
                machine_name: "$machine_name",
              },
            },
            total_pmSchedule: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      {
                        $ne: [keyForSelectedMonth, ""],
                      },
                      {
                        $ne: [keyForCurrentMonthScheduleOrNotStatus, ""],
                      },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            total_completed: {
              $sum: {
                $cond: [
                  {
                    $eq: [keyForSelectedMonth, "Completed"],
                  },
                  1,
                  0,
                ],
              },
            },
            total_done_with_delay: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      {
                        $eq: [keyOfTotalDoneWithDelay, "Done with delay"],
                      },
                      {
                        $eq: [keyForCurrentMonthScheduleOrNotStatus, ""],
                      },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            total_ongoing: {
              $sum: {
                $cond: [
                  {
                    $eq: [keyForSelectedMonth, "Ongoing"],
                  },
                  1,
                  0,
                ],
              },
            },
            total_previous_pending: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      {
                        $eq: [keyForPreviousMonth, "CarriedPM"],
                      },
                      // {
                      //     $eq: [keyForSelectedMonth, "No Completion"]
                      // },
                      {
                        $eq: [keyForCurrentMonthScheduleOrNotStatus, ""],
                      },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          }
        : {
            _id: "$line_names",
            machine: {
              $push: {
                machine_code: "$machine_code",
                machine_name: "$machine_name",
              },
            },
            total_pmSchedule: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      {
                        $ne: [keyForSelectedMonth, ""],
                      },
                      {
                        $ne: [keyForCurrentMonthScheduleOrNotStatus, ""],
                      },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            total_completed: {
              $sum: {
                $cond: [
                  {
                    $eq: [keyForSelectedMonth, "Completed"],
                  },
                  1,
                  0,
                ],
              },
            },
            total_ongoing: {
              $sum: {
                $cond: [
                  {
                    $eq: [keyForSelectedMonth, "Ongoing"],
                  },
                  1,
                  0,
                ],
              },
            },
            total_previous_pending: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      {
                        $eq: [keyForPreviousMonth, "CarriedPM"],
                      },
                      // {
                      //     $eq: [keyForSelectedMonth, "No Completion"]
                      // },
                      {
                        $eq: [keyForCurrentMonthScheduleOrNotStatus, ""],
                      },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          };

      for (let i = 0; i < lineData.length; i++) {
        groupData = await Machine.aggregate([
          {
            $match: {
              line_names: lineData[i]._id,
              $or: selectedYearOfCheckSheet,
              isPM: "Yes",
            },
          },
          {
            $project: {
              machine_code: 1,
              machine_name: 1,
              machine_nickname: 1,
              machine_sequence: 1,
              installation_date: 1,
              maker_name: 1,
              maker_sr_no: 1,
              manufacturingDate: 1,
              isPM: 1,
              line_names: 1,
              checkSheet_data: 1,
            },
          },
          {
            $unwind: "$checkSheet_data",
          },
          {
            $match: {
              "checkSheet_data.current_year": selectedYear,
            },
          },
          {
            $match: {
              "checkSheet_data.PMStatus": { $ne: undefined },
            },
          },
          {
            $group: groupCondition,
          },

          {
            $project: {
              _id: 0,
              line_names: "$_id",
              machine: 1,
              total_pmSchedule: 1,
              total_completed: 1,
              total_ongoing: 1,
              total_previous_pending: 1,
              total_done_with_delay: 1,
            },
          },
        ]);
        if (groupData.length > 0) {
          sumVariableForTotalSchedule =
            sumVariableForTotalSchedule + groupData[0].total_pmSchedule;
          sumVariableForTotalCompleted =
            sumVariableForTotalCompleted + groupData[0].total_completed;
          sumVariableForTotalOngoing =
            sumVariableForTotalOngoing + groupData[0].total_ongoing;
          sumVariableForTotalPreviousPending =
            sumVariableForTotalPreviousPending +
            groupData[0].total_previous_pending;
          sumVariableForTotalDoneWithDelay =
            sumVariableForTotalDoneWithDelay +
            (groupData[0].total_done_with_delay
              ? groupData[0].total_done_with_delay
              : 0);
        }
      }

      // console.log(sumVariableForTotalSchedule)
      // console.log("***************************")
      // console.log(sumVariableForTotalCompleted)
      // console.log("***************************")
      // sumVariableForTotalPreviousPending = sumVariableForTotalPreviousPending - sumVariableForTotalDoneWithDelay
      sumVariableForTotalCompleted =
        sumVariableForTotalCompleted + sumVariableForTotalDoneWithDelay;

      res.json({
        sumVariableForTotalSchedule,
        sumVariableForTotalCompleted,
        sumVariableForTotalOngoing,
        sumVariableForTotalPreviousPending,
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("User id not received!!!");
    }
  }
);

router.post(
  "/postSectionForAddNewCheckSheetAfterChangeFinancialYear",
  authenticate,
  async (req, res) => {
    try {
      const monthKeyArray = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "June",
        "July",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      let monthForCompareSystemMonth = monthKeyArray[new Date().getMonth()];

      //2022-23
      let current_year = `${new Date().getFullYear()}-${
        new Date().getFullYear() + 1
      }`;

      //2023-2024
      // let current_year = `${new Date().getFullYear() + 1}-${new Date().getFullYear() + 2}`

      let previous_year = `${
        new Date().getFullYear() - 1
      }-${new Date().getFullYear()}`;

      // let current_year =
      //     new Date().getMonth() < 3 ?
      //         `${new Date().getFullYear() - 1}-${new Date().getFullYear()}` :
      //         `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

      const financialYearWiseMonthKeyArray = [
        "Apr",
        "May",
        "June",
        "July",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
        "Jan",
        "Feb",
        "Mar",
      ];

      // let newFinancialCheckSheetPlanningData = {
      //     Apr: ["0"],

      //     May: ["0"],

      //     June: ["0"],

      //     July: ["0"],

      //     Aug: ["0"],

      //     Sep: ["0"],

      //     Oct: ["0"],

      //     Nov: ["0"],

      //     Dec: ["0"],

      //     Jan: ["0"],

      //     Feb: ["0"],

      //     Mar: ["0"],
      // }

      let copyCheckSheetData,
        removeFieldsFromPreviousYear,
        addNewFinancialYears;

      if (monthForCompareSystemMonth === "Apr") {
        const plantInfo = await Plant.findOne({
          plant_id: req?.rootUser?.plant_data?.split("-")?.[0],
        });

        const sectionInfo = await Section.find({ plant_names: plantInfo?._id });

        const subSectionsData = await SubSection.find({
          section_names: sectionInfo?.map((item) => item?._id),
        }).sort({ subSection_sequence: 1 });

        const cellData = await Cell.find({
          subSection_names: { $in: subSectionsData?.map((item) => item?._id) },
        }).sort({ cell_sequence: 1 });

        const lineData = await Line.find({
          cell_names: { $in: cellData?.map((item) => item?._id) },
        }).sort({ line_sequence: 1 });

        // console.log(lineIdArray)

        // machineData = await Machine.find({ line_names: { $in: lineIdArray }, checkSheet_data:{$exists:true}}).populate({ path: "line_names", populate: { path: "cell_names", model: "Cells" } })

        let deleteMidYearDeletedInceptionItem = await Machine.updateMany(
          { line_names: { $in: lineData?.map((item) => item?._id) } },
          {
            $pull: {
              "checkSheet_data.$[outer].checkSheet": { isDeleted: true },
            },
          },
          {
            arrayFilters: [{ "outer.current_year": previous_year }],
          }
        );

        let previousYearCheckCheetDataOfPeraticularSection;
        previousYearCheckCheetDataOfPeraticularSection =
          await Machine.aggregate([
            {
              $match: {
                line_names: { $in: lineData?.map((item) => item?._id) },
                "checkSheet_data.current_year": previous_year,
              },
            },
            { $unwind: "$checkSheet_data" },
            {
              $match: { "checkSheet_data.current_year": previous_year },
            },
            // { $unwind: '$checkSheet_data.checkSheet' },

            // { $project: { "checkSheet_data.checkSheet": 1, "checkSheet_data.current_year": 1 } },
          ]);

        for (
          let i = 0;
          i < previousYearCheckCheetDataOfPeraticularSection.length;
          i++
        ) {
          // console.log(previousYearCheckCheetDataOfPeraticularSection?.[i].checkSheet_data.current_year)
          // if (previousYearCheckCheetDataOfPeraticularSection?.[i]?.machine_code === "EETP-005") {
          previousYearCheckCheetDataOfPeraticularSection[
            i
          ].checkSheet_data.checksheet_status =
            previousYearCheckCheetDataOfPeraticularSection?.[i].checkSheet_data
              .checksheet_status
              ? previousYearCheckCheetDataOfPeraticularSection?.[i]
                  .checkSheet_data.checksheet_status === "Preparation"
                ? "Preparation"
                : "Planning"
              : undefined;
          previousYearCheckCheetDataOfPeraticularSection[
            i
          ].checkSheet_data.current_year = current_year;
          for (
            let k = 0;
            k <
            previousYearCheckCheetDataOfPeraticularSection?.[i]?.checkSheet_data
              ?.checkSheet?.length;
            k++
          ) {
            // for (let j = 0; j < financialYearWiseMonthKeyArray.length; j++) {
            //     let month = financialYearWiseMonthKeyArray[j];
            //     if (previousYearCheckCheetDataOfPeraticularSection?.[i].checkSheet_data.checkSheet[k].planningTableAnimationArray2[month][0] == "2") {
            //         previousYearCheckCheetDataOfPeraticularSection?.[i].checkSheet_data.checkSheet[k].planningTableAnimationArray2[month][0] = "0"
            //     }
            //     if (previousYearCheckCheetDataOfPeraticularSection?.[i].checkSheet_data.checkSheet[k].planningTableAnimationArray2[month][0]) {
            //         newFinancialCheckSheetPlanningData[month][0] = previousYearCheckCheetDataOfPeraticularSection?.[i].checkSheet_data.checkSheet[0].planningTableAnimationArray2[month][0]

            //     } else {
            //         continue
            //     }

            // }

            let cycleValue =
              previousYearCheckCheetDataOfPeraticularSection?.[i]?.checkSheet_data
                ?.checkSheet?.[k]?.cycle === "1/1M"
                ? 1
                : previousYearCheckCheetDataOfPeraticularSection?.[i]
                    ?.checkSheet_data?.checkSheet?.[k]?.cycle === "1/2M"
                ? 2
                : previousYearCheckCheetDataOfPeraticularSection?.[i]
                    ?.checkSheet_data?.checkSheet?.[k]?.cycle === "1/3M"
                ? 3
                : previousYearCheckCheetDataOfPeraticularSection?.[i]
                    ?.checkSheet_data?.checkSheet?.[k]?.cycle === "1/4M"
                ? 4
                : previousYearCheckCheetDataOfPeraticularSection?.[i]
                    ?.checkSheet_data?.checkSheet?.[k]?.cycle === "1/6M"
                ? 6
                : 12;

            let Cycle = cycleValue;

            let newFinancialCheckSheetPlanningData = {
              Apr: ["0"],

              May: ["0"],

              June: ["0"],

              July: ["0"],

              Aug: ["0"],

              Sep: ["0"],

              Oct: ["0"],

              Nov: ["0"],

              Dec: ["0"],

              Jan: ["0"],

              Feb: ["0"],

              Mar: ["0"],
            };
            let startMonthForCopyData =
              previousYearCheckCheetDataOfPeraticularSection?.[i]?.checkSheet_data
                ?.checkSheet?.[k]?.start_month;
            // console.log("before update ----> ", previousYearCheckCheetDataOfPeraticularSection?.[i].checkSheet_data.checkSheet[k].planningTableAnimationArray2)
            for (
              let l = 0;
              l < 12 / Cycle &&
              previousYearCheckCheetDataOfPeraticularSection?.[i]?.checkSheet_data
                ?.checkSheet?.[k]?.start_month < 12;
              l++
            ) {
              // console.log("=====>", previousYearCheckCheetDataOfPeraticularSection?.[i].checkSheet_data.checkSheet[k].start_month )
              let monthOfkey =
                financialYearWiseMonthKeyArray?.[
                  previousYearCheckCheetDataOfPeraticularSection?.[i]
                    ?.checkSheet_data?.checkSheet?.[k]?.start_month
                ];

              newFinancialCheckSheetPlanningData[monthOfkey][0] = "1";

              previousYearCheckCheetDataOfPeraticularSection[
                i
              ].checkSheet_data.checkSheet[k].start_month =
                parseInt(
                  previousYearCheckCheetDataOfPeraticularSection?.[i]
                    ?.checkSheet_data?.checkSheet?.[k]?.start_month
                ) + Cycle;
            }
            previousYearCheckCheetDataOfPeraticularSection[
              i
            ].checkSheet_data.checkSheet[k].start_month = startMonthForCopyData;

            previousYearCheckCheetDataOfPeraticularSection[
              i
            ].checkSheet_data.checkSheet[k].planningTableAnimationArray2 =
              newFinancialCheckSheetPlanningData;
            // console.log(previousYearCheckCheetDataOfPeraticularSection?.[i]?.machine_code, "------>", newFinancialCheckSheetPlanningData)
          }
          // console.log(previousYearCheckCheetDataOfPeraticularSection?.[i].checkSheet_data.checkSheet[0].planningTableAnimationArray2)
          copyCheckSheetData = await Machine.updateOne(
            {
              machine_code:
                previousYearCheckCheetDataOfPeraticularSection?.[i]?.machine_code,
            },
            {
              $push: {
                checkSheet_data:
                  previousYearCheckCheetDataOfPeraticularSection?.[i]
                    ?.checkSheet_data,
              },
            }
          );

          removeFieldsFromPreviousYear = await Machine.updateOne(
            {
              machine_code:
                previousYearCheckCheetDataOfPeraticularSection?.[i].machine_code,
            },
            {
              $unset: {
                "checkSheet_data.$[outer].checkSheet.$[].abnormalityDetails":
                  "",
                "checkSheet_data.$[outer].checkSheet.$[].spareDetails": "",
                "checkSheet_data.$[outer].checkSheet.$[].PMOkImage": "",
                "checkSheet_data.$[outer].checkSheet.$[].completionDateOfInspection":
                  "",
                "checkSheet_data.$[outer].checkSheet.$[].reasonForDelayWhenSkip":
                  "",
                "checkSheet_data.$[outer].checkSheet.$[].isAdded": "",
                "checkSheet_data.$[outer].checkSheet.$[].isEdited": "",
                "checkSheet_data.$[outer].checkSheet.$[].isDeleted": "",
                "checkSheet_data.$[outer].checkSheet.$[].inspectionCompletionBy":
                  "",

                "checkSheet_data.$[outer].flagOfDoneWithDelayForOneMonth": "",
                "checkSheet_data.$[outer].completionTargetDate": "",
                "checkSheet_data.$[outer].dataSheet": "",
                "checkSheet_data.$[outer].totalPMTime": "",
                "checkSheet_data.$[outer].currentMonthScheduleOrNotStatus": "",

                "checkSheet_data.$[outer].supportingOperatorList": "",
                "checkSheet_data.$[outer].PMworkedTMName": "",
                "checkSheet_data.$[outer].PMStatus": "",
                "checkSheet_data.$[outer].carriedPMStatus": "",
                "checkSheet_data.$[outer].PMDelayRemark": "",

                "checkSheet_data.$[outer].prd_tl_approval_status": "",
                "checkSheet_data.$[outer].plan_prepared_tm_no": "",
                "checkSheet_data.$[outer].plan_prepared_tm_name": "",
                "checkSheet_data.$[outer].plan_prepared_email": "",
                "checkSheet_data.$[outer].assign_PRD_TL": "",
                "checkSheet_data.$[outer].assign_PRD_TL_name": "",
                "checkSheet_data.$[outer].approved_by_PRD_TL": "",
                "checkSheet_data.$[outer].planning_TL_date": "",
                "checkSheet_data.$[outer].planning_PRD_TL_date": "",

                "checkSheet_data.$[outer].implemetation_completed_date": "",
                "checkSheet_data.$[outer].implemetation_completed_tm_no": "",
                "checkSheet_data.$[outer].implemetation_completed_tm_name": "",
                "checkSheet_data.$[outer].implementation_assign_PRD_TL": "",
                "checkSheet_data.$[outer].implementation_assign_MTD_TL": "",
                "checkSheet_data.$[outer].implementation_assign_MTD_HOS": "",
                "checkSheet_data.$[outer].implementation_approval_month_of_hod":
                  "",
                "checkSheet_data.$[outer].implementation_approval_hod_remarks":
                  "",
                "checkSheet_data.$[outer].implementation_assign_MTD_HOD": "",

                "checkSheet_data.$[outer].implementation_assign_PRD_TL_name":
                  "",
                "checkSheet_data.$[outer].implementation_assign_MTD_TL_name":
                  "",
                "checkSheet_data.$[outer].implementation_assign_MTD_HOS_name":
                  "",
                "checkSheet_data.$[outer].implementation_assign_MTD_HOD_name":
                  "",
                "checkSheet_data.$[outer].implemetation_quality_remarks": "",

                "checkSheet_data.$[outer].implementation_rejected_remarks": "",
                "checkSheet_data.$[outer].implementation_approved_by_PRD_TL":
                  "",
                "checkSheet_data.$[outer].implementation_approved_by_MTD_TL":
                  "",
                "checkSheet_data.$[outer].implementation_approved_by_MTD_HOS":
                  "",
                "checkSheet_data.$[outer].implementation_approved_by_MTD_HOD":
                  "",

                "checkSheet_data.$[outer].implementation_assign_PRD_TL_tm_no":
                  "",
                "checkSheet_data.$[outer].implementation_assign_MTD_TL_tm_no":
                  "",
                "checkSheet_data.$[outer].implementation_assign_MTD_HOS_tm_no":
                  "",

                "checkSheet_data.$[outer].implementation_approved_PRD_TL_date":
                  "",
                "checkSheet_data.$[outer].implementation_approved_MTD_TL_date":
                  "",
                "checkSheet_data.$[outer].implementation_approved_MTD_HOS_date":
                  "",

                "checkSheet_data.$[outer].implementation_approved_MTD_HOD_date":
                  "",

                "checkSheet_data.$[outer].implemetation_prd_tl_approval_status":
                  "",
                "checkSheet_data.$[outer].implemetation_mtd_tl_approval_status":
                  "",
                "checkSheet_data.$[outer].implemetation_mtd_hos_approval_status":
                  "",
                "checkSheet_data.$[outer].implemetation_mtd_hod_approval_status":
                  "",

                "checkSheet_data.$[outer].revisionContentData": "",
                "checkSheet_data.$[outer].flagForRevisionContent": "",
                "checkSheet_data.$[outer].flagForNewRevisionContentDataAdded":
                  "",
                "checkSheet_data.$[outer].extraSpareDetails": "",
              },
            },
            {
              arrayFilters: [{ "outer.current_year": current_year }],
            }
          );
          // console.log(removeFieldsFromPreviousYear)
          // }
        }

        // machineDataForChecksheet = await Machine.find({ line_names: { $in: lineIdArray } }).populate({ path: "line_names", populate: { path: "cell_names", model: "Cells" } })

        // console.log(
        //     (removeFieldsFromPreviousYear && copyCheckSheetData) || addNewFinancialYears
        // )

        const yearAvailableOrNot = await HandlingOtherActions.findOne({
          plant_id: plantInfo?._id,
        });
        const yearAvailableOrNotForDropDown = await FinancialYear1.findOne({
          yearDropdownID: "FY01",
        });
        if (
          !yearAvailableOrNotForDropDown?.financialYears?.includes(current_year)
        ) {
          let addNewFinancialYearsForDropDown = await FinancialYear1.updateOne(
            { yearDropdownID: "FY01" },
            {
              $push: {
                financialYears: current_year,
              },
            }
          );
        }
        // console.log(yearAvailableOrNot)
        if (yearAvailableOrNot) {
          if (!yearAvailableOrNot.financialYears.includes(current_year)) {
            addNewFinancialYears = await HandlingOtherActions.updateOne(
              { plant_id: plantInfo?._id },
              {
                $push: {
                  financialYears: current_year,
                },
              }
            );
          }
        } else {
          addNewFinancialYears = await new HandlingOtherActions({
            plant_id: plantInfo?._id,
            financialYears: current_year,
          });
          addNewFinancialYears.save();
        }

        const commonVarForMonthlyApproval = {
          checkedByTL: undefined,

          assignHOS: undefined,
          approvedByHOS: "",

          assignHOD: undefined,
          approvedByHODIfDelay: "",
          remarksIfDelay: "",
        };

        let monthlyApprovalData = {
          Apr: commonVarForMonthlyApproval,

          May: commonVarForMonthlyApproval,

          June: commonVarForMonthlyApproval,

          July: commonVarForMonthlyApproval,

          Aug: commonVarForMonthlyApproval,

          Sep: commonVarForMonthlyApproval,

          Oct: commonVarForMonthlyApproval,

          Nov: commonVarForMonthlyApproval,

          Dec: commonVarForMonthlyApproval,

          Jan: commonVarForMonthlyApproval,

          Feb: commonVarForMonthlyApproval,

          Mar: commonVarForMonthlyApproval,
        };

        let addNewYearAndAnnualPmScheduleFields = await Line.updateMany(
          {},
          {
            $push: {
              annualPmScheduleApproval: {
                current_year,
                monthlyApprovalData: monthlyApprovalData,
              },
            },
          }
        );

        if (
          (removeFieldsFromPreviousYear && copyCheckSheetData) ||
          addNewFinancialYears
        ) {
          return res.status(201).json("Checksheet copied!!!");
        } else {
          return res.status(400).json("Checksheet not copied!!!");
        }
      } else {
        return res
          .status(409)
          .json({ error: "Current month is not financial year start month" });
      }
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("User id not received!!!");
    }
  }
);

router.get("/getFinancialYears", authenticate, async (req, res) => {
  try {
    const plantInfo = await Plant.findOne({
      plant_id: req?.rootUser?.plant_data?.split("-")?.[0],
    });

    const getFinancialYearsArray = await HandlingOtherActions.findOne({
      plant_id: plantInfo?._id,
    });

    // console.log("?????????????????", getFinancialYearsArray)
    if (getFinancialYearsArray) {
      res.json({ getFinancialYearsArray });
    } else {
      return res.status(400).json("Checksheet not copied!!!");
    }
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log(error);
    console.log("User data not send or get!!!");
  }
});

router.get(
  "/getFinancialYearsDropdownValue",
  authenticate,
  async (req, res) => {
    try {
      const getFinancialYearsArray = await FinancialYear1.findOne({
        yearDropdownID: "FY01",
      });

      // console.log("?????????????????", getFinancialYearsArray)
      if (getFinancialYearsArray) {
        res.json({ getFinancialYearsArray });
      } else {
        return res.status(400).json("Checksheet not copied!!!");
      }
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("User data not send or get!!!");
    }
  }
);

router.post(
  "/getDataForOpenAbnormalityTracking",
  authenticate,
  async (req, res) => {
    try {
      let { section, selectedLine, selectedYear } = req.body;
      let loggedUserData = req.rootUser;
      // console.log(section, "_________", req.rootUser);
      let onlyOpenAbnormalityWithAllMonths = [],
        subSectionsData,
        lineData,
        subsectionSplitIdArrayForChecksheet = [];
      if (typeof section !== "object") {
        let sectionSplit = section.split("-");
        const sectionInfo = await Section.find({ section_id: sectionSplit[0] });

        if (sectionInfo.dashboardLevel === "Yes") {
          subSectionsData = await SubSection.find({
            section_names: sectionInfo._id,
          }).sort({ subSection_sequence: 1 });
          // console.log(machineLastData)
        } else {
          loggedUserData.subSection_data.map((ids) => {
            let subsectionsId = ids.split("-");
            subsectionSplitIdArrayForChecksheet.push(subsectionsId[0]);
          });
          subSectionsData = await SubSection.find({
            subSection_id: { $in: subsectionSplitIdArrayForChecksheet },
          }).sort({ subSection_sequence: 1 });
        }
      } else {
        if (section?.dashboardLevel === "Yes") {
          subSectionsData = await SubSection.find({
            section_names: section?._id,
          }).sort({ subSection_sequence: 1 });
        } else {
          subSectionsData = await SubSection.find({ _id: section?._id }).sort({
            subSection_sequence: 1,
          });
        }
      }

      let subSectionIdArray = [];
      for (let i = 0; i < subSectionsData.length; i++) {
        subSectionIdArray.push(subSectionsData[i]._id);
      }

      const cellData = await Cell.find({
        subSection_names: { $in: subSectionIdArray },
      }).sort({ cell_sequence: 1 });
      let cellIdArray = [];
      for (let i = 0; i < cellData.length; i++) {
        cellIdArray.push(cellData[i]._id);
      }

      lineData = await Line.find({ cell_names: { $in: cellIdArray } }).sort({
        line_sequence: 1,
      });
      let lineIdArray = [];
      for (let i = 0; i < lineData.length; i++) {
        lineIdArray.push(lineData[i]._id);
      }
      if (selectedLine === "" || selectedLine === undefined) {
        const machineData = await Machine.find({
          line_names: { $in: lineIdArray },
        }).sort({ machine_sequence: 1 });

        let openAbnormality = await Machine.aggregate([
          {
            $match: {
              line_names: { $in: lineIdArray },
            },
          },
          {
            $project: {
              machine_code: 1,
              machine_name: 1,
              machine_nickname: 1,
              machine_sequence: 1,
              installation_date: 1,
              maker_name: 1,
              maker_sr_no: 1,
              manufacturingDate: 1,
              isPM: 1,
              line_names: 1,
              checkSheet_data: 1,
            },
          },
          { $unwind: "$checkSheet_data" },
          {
            $match: { "checkSheet_data.current_year": selectedYear },
          },
          {
            $match: {
              "checkSheet_data.checkSheet.abnormalityDetails": { $ne: "" },
              // machine_code: "666"
            },
          },
        ]);
        // console.log(openAbnormality)
        openAbnormality = await Machine.populate(openAbnormality, {
          path: "line_names",
          populate: { path: "cell_names", model: "Cells" },
        });

        // const openAbnormality = await Machine.find({ line_names: { $in: lineIdArray }, "checkSheet.abnormalityDetails": { $exists: true } }).populate({ path: "line_names", populate: { path: "cell_names", model: "Cells" } })
        const financialYearWiseMonthKeyArray = [
          "Apr",
          "May",
          "June",
          "July",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
          "Jan",
          "Feb",
          "Mar",
        ];

        openAbnormality?.map((keyForCheckSheet) => {
          keyForCheckSheet?.checkSheet_data?.checkSheet?.map(
            (keyForAbnormality) => {
              if (keyForAbnormality?.abnormalityDetails) {
                for (
                  let i = 0;
                  i < financialYearWiseMonthKeyArray?.length;
                  i++
                ) {
                  let month = financialYearWiseMonthKeyArray[i];
                  if (
                    keyForAbnormality?.abnormalityDetails?.[month]
                      ?.abnormalityStatus !== undefined
                  ) {
                    // console.log("Checking open");
                    if (
                      keyForAbnormality?.abnormalityDetails?.[month]
                        ?.abnormalityStatus === "Open"
                    ) {
                      onlyOpenAbnormalityWithAllMonths.push(
                        new Object({
                          line_name: keyForCheckSheet.line_names.line_name,
                          machine_name: keyForCheckSheet.machine_name,
                          machine_code: keyForCheckSheet.machine_code,
                          yearOfCheckSheet:
                            keyForCheckSheet?.checkSheet_data?.current_year,
                          schedule_month: month,
                          table_id: keyForAbnormality.tableRowId,
                          inspection_point: keyForAbnormality?.inspection_point,
                          remarksOfImplementation:
                            keyForAbnormality?.planningTableAnimationArray2[
                              month
                            ][2],
                          checked_by:
                            keyForAbnormality?.inspectionCompletionBy?.[month],
                          abnormalityRemarks:
                            keyForAbnormality?.abnormalityDetails[month]
                              ?.abnormalityRemarks,
                          targetDate:
                            keyForAbnormality?.abnormalityDetails[month]
                              ?.targetDate,
                          PMuploadedImage:
                            keyForAbnormality?.abnormalityDetails[month]
                              ?.PMuploadedImage,
                          remarksOnClose:
                            keyForAbnormality?.abnormalityDetails[month]
                              ?.remarksOnClose,
                          doneDate:
                            keyForAbnormality?.abnormalityDetails[month]
                              ?.doneDate,
                          doneBy:
                            keyForAbnormality?.abnormalityDetails[month]
                              ?.doneBy,
                          spare_used:
                            keyForAbnormality?.spareDetails[month]?.spareParts,
                          part_name:
                            keyForAbnormality?.spareDetails[month]?.partName,
                          part_no:
                            keyForAbnormality?.spareDetails[month]?.partNo,
                          part_cost:
                            keyForAbnormality?.spareDetails[month]?.cost,
                        })
                      );
                    }
                  }
                }
              }
            }
          );
        });
      } else {
        let openAbnormality = await Machine.aggregate([
          {
            $match: {
              line_names: mongoose.Types.ObjectId(selectedLine),
            },
          },
          {
            $project: {
              machine_code: 1,
              machine_name: 1,
              machine_nickname: 1,
              machine_sequence: 1,
              installation_date: 1,
              maker_name: 1,
              maker_sr_no: 1,
              manufacturingDate: 1,
              isPM: 1,
              line_names: 1,
              checkSheet_data: 1,
            },
          },
          { $unwind: "$checkSheet_data" },
          {
            $match: { "checkSheet_data.current_year": selectedYear },
          },
          {
            $match: {
              "checkSheet_data.checkSheet.abnormalityDetails": { $ne: "" },
              // machine_code: "666"
            },
          },
        ]);
        // console.log(openAbnormality)
        openAbnormality = await Machine.populate(openAbnormality, {
          path: "line_names",
          populate: { path: "cell_names", model: "Cells" },
        });

        // const openAbnormality = await Machine.find({ line_names: { $in: lineIdArray }, "checkSheet.abnormalityDetails": { $exists: true } }).populate({ path: "line_names", populate: { path: "cell_names", model: "Cells" } })
        const financialYearWiseMonthKeyArray = [
          "Apr",
          "May",
          "June",
          "July",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
          "Jan",
          "Feb",
          "Mar",
        ];

        openAbnormality.map((keyForCheckSheet) => {
          keyForCheckSheet?.checkSheet_data?.checkSheet?.map(
            (keyForAbnormality) => {
              if (keyForAbnormality?.abnormalityDetails) {
                for (
                  let i = 0;
                  i < financialYearWiseMonthKeyArray?.length;
                  i++
                ) {
                  let month = financialYearWiseMonthKeyArray[i];
                  if (
                    keyForAbnormality.abnormalityDetails[month]
                      ?.abnormalityStatus != undefined
                  ) {
                    if (
                      keyForAbnormality.abnormalityDetails[month]
                        ?.abnormalityStatus === "Open"
                    ) {
                      onlyOpenAbnormalityWithAllMonths.push(
                        new Object({
                          line_name: keyForCheckSheet.line_names.line_name,
                          machine_name: keyForCheckSheet.machine_name,
                          machine_code: keyForCheckSheet.machine_code,
                          yearOfCheckSheet:
                            keyForCheckSheet?.checkSheet_data?.current_year,
                          schedule_month: month,
                          table_id: keyForAbnormality.tableRowId,
                          inspection_point: keyForAbnormality?.inspection_point,
                          remarksOfImplementation:
                            keyForAbnormality?.planningTableAnimationArray2[
                              month
                            ][2],
                          checked_by:
                            keyForAbnormality?.inspectionCompletionBy?.[month],
                          abnormalityRemarks:
                            keyForAbnormality?.abnormalityDetails[month]
                              ?.abnormalityRemarks,
                          targetDate:
                            keyForAbnormality?.abnormalityDetails[month]
                              ?.targetDate,
                          PMuploadedImage:
                            keyForAbnormality?.abnormalityDetails[month]
                              ?.PMuploadedImage,
                          remarksOnClose:
                            keyForAbnormality?.abnormalityDetails[month]
                              ?.remarksOnClose,
                          doneDate:
                            keyForAbnormality?.abnormalityDetails[month]
                              ?.doneDate,
                          doneBy:
                            keyForAbnormality?.abnormalityDetails[month]
                              ?.doneBy,
                          spare_used:
                            keyForAbnormality?.spareDetails[month]?.spareParts,
                          part_name:
                            keyForAbnormality?.spareDetails[month]?.partName,
                          part_no:
                            keyForAbnormality?.spareDetails[month]?.partNo,
                          part_cost:
                            keyForAbnormality?.spareDetails[month]?.cost,
                        })
                      );
                    }
                  }
                }
              }
            }
          );
        });
      }

      console.log(onlyOpenAbnormalityWithAllMonths);

      res.json({ onlyOpenAbnormalityWithAllMonths, lineData });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("User id not received!!!");
    }
  }
);

//                      SUMMERY DASHBOARD

router.post(
  "/postPlantToGetSectionInfoForSummeryDashboard",
  authenticate,
  async (req, res) => {
    try {
      let { plants, selectedMonth, selectedYear } = req.body;
      let loggedUserData = req.rootUser;
      let SectionInfo, subSectionsData, cellData, lineData;
      let monthlyChartDataOfSummery = [];

      let currentYear =
        new Date().getMonth() < 3
          ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
          : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

      let selectedYearOfCheckSheet =
        selectedYear === currentYear
          ? [
              {
                "checkSheet_data.current_year": selectedYear,
              },
              {
                checkSheet_data: [],
              },
            ]
          : [
              {
                "checkSheet_data.current_year": selectedYear,
              },
            ];

      const monthKeyArray = [
        "Apr",
        "May",
        "June",
        "July",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
        "Jan",
        "Feb",
        "Mar",
      ];

      const financialYearWiseMonthKeyArray = [
        "Apr",
        "May",
        "June",
        "July",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
        "Jan",
        "Feb",
        "Mar",
      ];
      // console.log(financialYearWiseMonthKeyArray[financialYearWiseMonthKeyArray.indexOf('Apr') - 1])
      let previousMonth =
        financialYearWiseMonthKeyArray[
          financialYearWiseMonthKeyArray.indexOf(selectedMonth) - 1
        ];

      let keyForSelectedMonth = `$checkSheet_data.PMStatus.${selectedMonth}`;
      let keyForPreviousMonth = `$checkSheet_data.carriedPMStatus.${selectedMonth}`;
      let keyForCurrentMonthScheduleOrNotStatus = `$checkSheet_data.currentMonthScheduleOrNotStatus.${selectedMonth}`;
      let keyOfTotalDoneWithDelay = `$checkSheet_data.PMStatus.${previousMonth}`;

      let groupCondition = previousMonth
        ? {
            _id: "$line_names",
            machine: {
              $push: {
                machine_code: "$machine_code",
                machine_name: "$machine_name",
              },
            },
            total_pmSchedule: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      {
                        $ne: [keyForSelectedMonth, ""],
                      },
                      {
                        $ne: [keyForCurrentMonthScheduleOrNotStatus, ""],
                      },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            total_completed: {
              $sum: {
                $cond: [
                  {
                    $eq: [keyForSelectedMonth, "Completed"],
                  },
                  1,
                  0,
                ],
              },
            },
            total_ongoing: {
              $sum: {
                $cond: [
                  {
                    $eq: [keyForSelectedMonth, "Ongoing"],
                  },
                  1,
                  0,
                ],
              },
            },
            total_done_with_delay: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      {
                        $eq: [keyOfTotalDoneWithDelay, "Done with delay"],
                      },
                      {
                        $eq: [keyForCurrentMonthScheduleOrNotStatus, ""],
                      },
                      // {
                      //     $eq: [keyForPreviousMonth, "CarriedPM"]
                      // },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            total_previous_pending: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      {
                        $eq: [keyForPreviousMonth, "CarriedPM"],
                      },
                      // {
                      //     $eq: [keyForSelectedMonth, "No Completion"]
                      // },
                      {
                        $eq: [keyForCurrentMonthScheduleOrNotStatus, ""],
                      },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          }
        : {
            _id: "$line_names",
            machine: {
              $push: {
                machine_code: "$machine_code",
                machine_name: "$machine_name",
              },
            },
            total_pmSchedule: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      {
                        $ne: [keyForSelectedMonth, ""],
                      },
                      {
                        $ne: [keyForCurrentMonthScheduleOrNotStatus, ""],
                      },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            total_completed: {
              $sum: {
                $cond: [
                  {
                    $eq: [keyForSelectedMonth, "Completed"],
                  },
                  1,
                  0,
                ],
              },
            },
            total_ongoing: {
              $sum: {
                $cond: [
                  {
                    $eq: [keyForSelectedMonth, "Ongoing"],
                  },
                  1,
                  0,
                ],
              },
            },
            total_previous_pending: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      {
                        $eq: [keyForPreviousMonth, "CarriedPM"],
                      },
                      // {
                      //     $eq: [keyForSelectedMonth, "No Completion"]
                      // },
                      {
                        $eq: [keyForCurrentMonthScheduleOrNotStatus, ""],
                      },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          };

      const functionForGroupDataOfAnnualChart = async (
        x,
        keyForPreviousMonth,
        keyForCurrentMonthScheduleOrNotStatus,
        keyOfTotalDoneWithDelayForAnnualChart,
        previousMonthForAnnualChart
      ) => {
        return previousMonthForAnnualChart
          ? {
              _id: "$line_names",
              machine: {
                $push: {
                  machine_code: "$machine_code",
                  machine_name: "$machine_name",
                },
              },
              total_pmSchedule: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        {
                          $ne: [x, ""],
                        },
                        {
                          $ne: [keyForCurrentMonthScheduleOrNotStatus, ""],
                        },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },

              total_completed: {
                $sum: {
                  $cond: [
                    {
                      $eq: [x, "Completed"],
                    },
                    1,
                    0,
                  ],
                },
              },
              total_done_with_delay: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        {
                          $eq: [
                            keyOfTotalDoneWithDelayForAnnualChart,
                            "Done with delay",
                          ],
                        },
                        {
                          $eq: [keyForCurrentMonthScheduleOrNotStatus, ""],
                        },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
              total_Previous: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        {
                          $eq: [keyForPreviousMonth, "CarriedPM"],
                        },
                        // {
                        //     $eq: [x, "No Completion"]
                        // },
                        {
                          $eq: [keyForCurrentMonthScheduleOrNotStatus, ""],
                        },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
            }
          : {
              _id: "$line_names",
              machine: {
                $push: {
                  machine_code: "$machine_code",
                  machine_name: "$machine_name",
                },
              },
              total_pmSchedule: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        {
                          $ne: [x, ""],
                        },
                        {
                          $ne: [keyForCurrentMonthScheduleOrNotStatus, ""],
                        },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },

              total_completed: {
                $sum: {
                  $cond: [
                    {
                      $eq: [x, "Completed"],
                    },
                    1,
                    0,
                  ],
                },
              },
              total_Previous: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        {
                          $eq: [keyForPreviousMonth, "CarriedPM"],
                        },
                        // {
                        //     $eq: [x, "No Completion"]
                        // },
                        {
                          $eq: [keyForCurrentMonthScheduleOrNotStatus, ""],
                        },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
            };
      };

      // console.log(plants.map(item => item._id))
      // const SectionInfo = await Section.find({ plant_names: { $in: plants.map(item => item._id) } }).populate({ path: "plant_names", model: "Plants" })

      for (let j = 0; j < plants.length; j++) {
        let groupData, groupData2;

        SectionInfo = await Section.find({ plant_names: plants[j]._id });

        for (let i = 0; i < SectionInfo.length; i++) {
          // console.log("----------------------------")

          if (SectionInfo[i].dashboardLevel === "Yes") {
            let sumVariableForTotalSchedule = 0;
            let sumVariableForTotalCompleted = 0;
            let sumVariableForTotalOngoing = 0;
            let sumVariableForTotalPreviousPending = 0;
            let sumVariableForTotalDoneWithDelay = 0;

            //  console.log(plants[j].plant_name, "----" ,SectionInfo[i].section_name, "---", SectionInfo[i].dashboardLevel)
            let annual_completed = [];
            subSectionsData = await SubSection.find({
              section_names: SectionInfo[i]._id,
            }).sort({ subSection_sequence: 1 });

            cellData = await Cell.find({
              subSection_names: {
                $in: subSectionsData.map((item) => item._id),
              },
            }).sort({ cell_sequence: 1 });

            lineData = await Line.find({
              cell_names: { $in: cellData.map((item) => item._id) },
            }).sort({ line_sequence: 1 });

            for (let k = 0; k < lineData.length; k++) {
              groupData = await Machine.aggregate([
                {
                  $match: {
                    line_names: lineData[k]._id,
                    // "checkSheet_data": { $ne: undefined },
                    $or: selectedYearOfCheckSheet,
                  },
                },
                {
                  $project: {
                    machine_code: 1,
                    machine_name: 1,
                    machine_nickname: 1,
                    machine_sequence: 1,
                    installation_date: 1,
                    maker_name: 1,
                    maker_sr_no: 1,
                    manufacturingDate: 1,
                    isPM: 1,
                    line_names: 1,
                    checkSheet_data: 1,
                  },
                },
                {
                  $unwind: "$checkSheet_data",
                },
                {
                  $match: {
                    "checkSheet_data.current_year": selectedYear,
                  },
                },
                {
                  $match: {
                    "checkSheet_data.PMStatus": { $ne: undefined },
                    checkSheet_data: { $ne: undefined },
                  },
                },
                {
                  $group: groupCondition,
                },

                {
                  $project: {
                    _id: 0,
                    line_names: "$_id",
                    machine: 1,
                    total_pmSchedule: 1,
                    total_completed: 1,
                    total_ongoing: 1,
                    total_previous_pending: 1,
                    total_done_with_delay: 1,
                  },
                },
              ]);
              // console.log(groupData)
              if (groupData.length > 0) {
                // console.log(plants[j]?.plant_name, "---->", SectionInfo[i]?.section_name, "--->", SectionInfo[i]?.dashboardLevel)

                // console.log("---------------------------", groupData)
                sumVariableForTotalSchedule =
                  sumVariableForTotalSchedule +
                  groupData?.[0]?.total_pmSchedule;
                sumVariableForTotalCompleted =
                  sumVariableForTotalCompleted +
                  groupData?.[0]?.total_completed;
                sumVariableForTotalOngoing =
                  sumVariableForTotalOngoing + groupData?.[0]?.total_ongoing;
                sumVariableForTotalPreviousPending =
                  sumVariableForTotalPreviousPending +
                  groupData?.[0]?.total_previous_pending;
                sumVariableForTotalDoneWithDelay =
                  sumVariableForTotalDoneWithDelay +
                  (groupData?.[0]?.total_done_with_delay
                    ? groupData?.[0]?.total_done_with_delay
                    : 0);

                // console.log(groupData)
              }
            }

            // sumVariableForTotalPreviousPending = sumVariableForTotalPreviousPending - sumVariableForTotalDoneWithDelay
            sumVariableForTotalCompleted =
              sumVariableForTotalCompleted + sumVariableForTotalDoneWithDelay;

            monthlyChartDataOfSummery.push(
              new Object({
                chartData: {
                  sumVariableForTotalSchedule: sumVariableForTotalSchedule,
                  sumVariableForTotalCompleted: sumVariableForTotalCompleted,
                  sumVariableForTotalOngoing: sumVariableForTotalOngoing,
                  sumVariableForTotalPreviousPending:
                    sumVariableForTotalPreviousPending,
                },
                plant_name: plants[j]?._id,
                section_name: SectionInfo[i]?.section_name,
                section_id: SectionInfo[i]?._id,
              })
            );

            if (
              !monthlyChartDataOfSummery.some(
                (e) => e?.section_id === SectionInfo[i]?._id
              )
            ) {
              SectionInfo[i]?._id
                ? monthlyChartDataOfSummery.push(
                    new Object({
                      plant_name: plants[j]._id,
                      section_name: SectionInfo[i]?.section_name,
                      section_id: SectionInfo[i]?._id,
                    })
                  )
                : "";
            }

            // for annual chart
            for (let m = 0; m < monthKeyArray.length; m++) {
              let sumVariableForTotalCompletedForAnnualChart = 0;
              let sumVariableForTotalSchedule = 0;
              let sumVariableForTotalPreviousPending = 0;
              let sumVariableForTotalDoneWithDelay = 0;

              let x = `$checkSheet_data.PMStatus.${monthKeyArray[m]}`;
              let previousMonthForAnnualChart = monthKeyArray[m - 1];
              let keyOfTotalDoneWithDelayForAnnualChart = `$checkSheet_data.PMStatus.${previousMonthForAnnualChart}`;
              let keyForPreviousMonth = `$checkSheet_data.carriedPMStatus.${monthKeyArray[m]}`;
              let keyForCurrentMonthScheduleOrNotStatus = `$checkSheet_data.currentMonthScheduleOrNotStatus.${monthKeyArray[m]}`;

              let groupConditionForAnnualChart =
                await functionForGroupDataOfAnnualChart(
                  x,
                  keyForPreviousMonth,
                  keyForCurrentMonthScheduleOrNotStatus,
                  keyOfTotalDoneWithDelayForAnnualChart,
                  previousMonthForAnnualChart
                );

              for (let n = 0; n < lineData.length; n++) {
                // console.log(lineData[n].line_name)
                groupData2 = await Machine.aggregate([
                  {
                    $match: {
                      line_names: lineData[n]._id,
                      // line_names: mongoose.Types.ObjectId('633d0627416d0f692a1fc3ca'),
                      $or: selectedYearOfCheckSheet,
                      checkSheet_data: { $ne: undefined },
                    },
                  },
                  {
                    $project: {
                      machine_code: 1,
                      machine_name: 1,
                      machine_nickname: 1,
                      machine_sequence: 1,
                      installation_date: 1,
                      maker_name: 1,
                      maker_sr_no: 1,
                      manufacturingDate: 1,
                      isPM: 1,
                      line_names: 1,
                      checkSheet_data: 1,
                    },
                  },
                  {
                    $unwind: "$checkSheet_data",
                  },
                  {
                    $match: {
                      "checkSheet_data.current_year": selectedYear,
                    },
                  },
                  {
                    $match: {
                      "checkSheet_data.PMStatus": { $ne: undefined },
                      // "checkSheet_data.carriedPMStatus": { $ne: undefined },
                    },
                  },
                  {
                    $group: groupConditionForAnnualChart,
                  },

                  {
                    $project: {
                      _id: 0,
                      line_names: "$_id",
                      total_pmSchedule: 1,
                      total_completed: 1,
                      total_done_with_delay: 1,
                      total_Previous: 1,
                    },
                  },
                ]);
                if (groupData2.length > 0) {
                  // console.log("**********", monthKeyArray[m])
                  // console.log( groupData2)
                  sumVariableForTotalDoneWithDelay =
                    sumVariableForTotalDoneWithDelay +
                    (groupData2?.[0]?.total_done_with_delay
                      ? groupData2?.[0]?.total_done_with_delay
                      : 0);
                  sumVariableForTotalCompletedForAnnualChart =
                    sumVariableForTotalCompletedForAnnualChart +
                    groupData2[0].total_completed;
                  sumVariableForTotalSchedule =
                    sumVariableForTotalSchedule +
                    groupData2[0].total_pmSchedule;
                  sumVariableForTotalPreviousPending =
                    sumVariableForTotalPreviousPending +
                    groupData2[0].total_Previous;
                }
              }
              sumVariableForTotalCompletedForAnnualChart =
                sumVariableForTotalCompletedForAnnualChart +
                sumVariableForTotalDoneWithDelay;

              sumVariableForTotalCompletedForAnnualChart = (
                (sumVariableForTotalCompletedForAnnualChart * 100) /
                (sumVariableForTotalSchedule +
                  sumVariableForTotalPreviousPending)
              ).toFixed(2);

              annual_completed.push(
                sumVariableForTotalCompletedForAnnualChart !== NaN
                  ? sumVariableForTotalCompletedForAnnualChart
                  : 0
              );
            }

            if (
              monthlyChartDataOfSummery.some(
                (e) => e?.section_id === SectionInfo[i]?._id
              )
            ) {
              monthlyChartDataOfSummery.map((key) => {
                if (
                  key?.section_id === SectionInfo[i]?._id &&
                  key?.chartData != undefined
                ) {
                  // console.log(annual_completed, "-----", SectionInfo[i]?.section_name),
                  key["annualChartData"] = annual_completed;
                }
              });
            }
          } else {
            let groupData, groupData2;

            subSectionsData = await SubSection.find({
              section_names: SectionInfo[i]._id,
            }).sort({ subSection_sequence: 1 });

            for (let l = 0; l < subSectionsData.length; l++) {
              let sumVariableForTotalSchedule = 0;
              let sumVariableForTotalCompleted = 0;
              let sumVariableForTotalOngoing = 0;
              let sumVariableForTotalPreviousPending = 0;
              let sumVariableForTotalDoneWithDelay = 0;

              // console.log("****************************")
              // console.log(subSectionsData[l].subSection_name)
              let annual_completed = [];

              cellData = await Cell.find({
                subSection_names: { $in: subSectionsData[l]._id },
              }).sort({ cell_sequence: 1 });

              lineData = await Line.find({
                cell_names: { $in: cellData.map((item) => item._id) },
              }).sort({ line_sequence: 1 });

              for (let k = 0; k < lineData.length; k++) {
                groupData = await Machine.aggregate([
                  {
                    $match: {
                      line_names: lineData[k]._id,
                      // "checkSheet_data": { $ne: undefined },
                      $or: selectedYearOfCheckSheet,
                    },
                  },
                  {
                    $project: {
                      machine_code: 1,
                      machine_name: 1,
                      machine_nickname: 1,
                      machine_sequence: 1,
                      installation_date: 1,
                      maker_name: 1,
                      maker_sr_no: 1,
                      manufacturingDate: 1,
                      isPM: 1,
                      line_names: 1,
                      checkSheet_data: 1,
                    },
                  },
                  {
                    $unwind: "$checkSheet_data",
                  },
                  {
                    $match: {
                      "checkSheet_data.current_year": selectedYear,
                    },
                  },
                  {
                    $match: {
                      "checkSheet_data.PMStatus": { $ne: undefined },
                    },
                  },
                  {
                    $group: groupCondition,
                  },

                  {
                    $project: {
                      _id: 0,
                      line_names: "$_id",
                      machine: 1,
                      total_pmSchedule: 1,
                      total_completed: 1,
                      total_ongoing: 1,
                      total_previous_pending: 1,
                      total_done_with_delay: 1,
                    },
                  },
                ]);
                if (groupData.length > 0) {
                  // console.log(l, "====", subSectionsData[l]?.subSection_name, "-------", groupData?.[0]?.total_pmSchedule, "****", groupData?.[0]?.total_previous_pending)
                  sumVariableForTotalSchedule =
                    sumVariableForTotalSchedule +
                    groupData?.[0]?.total_pmSchedule;
                  sumVariableForTotalCompleted =
                    sumVariableForTotalCompleted +
                    groupData?.[0]?.total_completed;
                  sumVariableForTotalOngoing =
                    sumVariableForTotalOngoing + groupData?.[0]?.total_ongoing;
                  sumVariableForTotalPreviousPending =
                    sumVariableForTotalPreviousPending +
                    groupData?.[0]?.total_previous_pending;
                  sumVariableForTotalDoneWithDelay =
                    sumVariableForTotalDoneWithDelay +
                    (groupData[0].total_done_with_delay
                      ? groupData[0].total_done_with_delay
                      : 0);

                  // console.log(groupData)
                }
                // else {
                //     subSectionsData[j]?.subSection_name ?
                //         monthlyChartDataOfSummery.push(
                //             new Object({
                //                 plant_name: plants[j]._id,
                //                 section_name: subSectionsData[l]?.subSection_name
                // section_id: subSectionsData[l]?._id
                //             })
                //         ) : ""
                // }
              }

              // sumVariableForTotalPreviousPending = sumVariableForTotalPreviousPending - sumVariableForTotalDoneWithDelay
              sumVariableForTotalCompleted =
                sumVariableForTotalCompleted + sumVariableForTotalDoneWithDelay;

              monthlyChartDataOfSummery.push(
                new Object({
                  chartData: {
                    sumVariableForTotalSchedule: sumVariableForTotalSchedule,
                    sumVariableForTotalCompleted: sumVariableForTotalCompleted,
                    sumVariableForTotalOngoing: sumVariableForTotalOngoing,
                    sumVariableForTotalPreviousPending:
                      sumVariableForTotalPreviousPending,
                  },
                  plant_name: plants[j]._id,
                  section_name: subSectionsData[l]?.subSection_name,
                  section_id: subSectionsData[l]?._id,
                })
              );
              if (
                !monthlyChartDataOfSummery.some(
                  (e) => e?.section_id === subSectionsData[l]?._id
                )
              ) {
                subSectionsData[j]?.subSection_name
                  ? monthlyChartDataOfSummery.push(
                      new Object({
                        plant_name: plants[j]?._id,
                        section_name: subSectionsData[l]?.subSection_name,
                        section_id: subSectionsData[l]?._id,
                      })
                    )
                  : "";
              }

              // for annual chart
              for (let o = 0; o < monthKeyArray.length; o++) {
                let sumVariableForTotalCompletedForAnnualChart = 0;
                let sumVariableForTotalSchedule = 0;
                let sumVariableForTotalPreviousPending = 0;
                let sumVariableForTotalDoneWithDelay = 0;
                let x = `$checkSheet_data.PMStatus.${monthKeyArray[o]}`;
                let keyForCurrentMonthScheduleOrNotStatus = `$checkSheet_data.currentMonthScheduleOrNotStatus.${monthKeyArray[o]}`;
                let previousMonthForAnnualChart = monthKeyArray[o - 1];
                let keyOfTotalDoneWithDelayForAnnualChart = `$checkSheet_data.PMStatus.${previousMonthForAnnualChart}`;
                // let previousMonth = monthKeyArray[m - 1] === undefined ? monthKeyArray.splice(-1)[0] : monthKeyArray[m - 1]
                let keyForPreviousMonth = `$checkSheet_data.carriedPMStatus.${monthKeyArray[o]}`;
                let groupConditionForAnnualChart =
                  await functionForGroupDataOfAnnualChart(
                    x,
                    keyForPreviousMonth,
                    keyForCurrentMonthScheduleOrNotStatus,
                    keyOfTotalDoneWithDelayForAnnualChart,
                    previousMonthForAnnualChart
                  );

                for (let p = 0; p < lineData.length; p++) {
                  // console.log(lineData[n].line_name)
                  groupData2 = await Machine.aggregate([
                    {
                      $match: {
                        line_names: lineData[p]._id,
                        // line_names: mongoose.Types.ObjectId('633d0627416d0f692a1fc3ca'),
                        $or: selectedYearOfCheckSheet,
                        checkSheet_data: { $ne: undefined },
                      },
                    },
                    {
                      $project: {
                        machine_code: 1,
                        machine_name: 1,
                        machine_nickname: 1,
                        machine_sequence: 1,
                        installation_date: 1,
                        maker_name: 1,
                        maker_sr_no: 1,
                        manufacturingDate: 1,
                        isPM: 1,
                        line_names: 1,
                        checkSheet_data: 1,
                      },
                    },
                    {
                      $unwind: "$checkSheet_data",
                    },
                    {
                      $match: {
                        "checkSheet_data.current_year": selectedYear,
                      },
                    },
                    {
                      $match: {
                        "checkSheet_data.PMStatus": { $ne: undefined },
                        // "checkSheet_data.carriedPMStatus": { $ne: undefined },
                      },
                    },
                    {
                      $group: groupConditionForAnnualChart,
                    },

                    {
                      $project: {
                        _id: 0,
                        line_names: "$_id",
                        total_completed: 1,
                        total_done_with_delay: 1,
                        total_Previous: 1,
                        total_pmSchedule: 1,
                      },
                    },
                  ]);
                  if (groupData2.length > 0) {
                    sumVariableForTotalDoneWithDelay =
                      sumVariableForTotalDoneWithDelay +
                      (groupData2?.[0]?.total_done_with_delay
                        ? groupData2?.[0]?.total_done_with_delay
                        : 0);
                    sumVariableForTotalCompletedForAnnualChart =
                      sumVariableForTotalCompletedForAnnualChart +
                      groupData2[0].total_completed;
                    sumVariableForTotalSchedule =
                      sumVariableForTotalSchedule +
                      groupData2[0].total_pmSchedule;
                    sumVariableForTotalPreviousPending =
                      sumVariableForTotalPreviousPending +
                      groupData2[0].total_Previous;
                  }
                }

                sumVariableForTotalCompletedForAnnualChart =
                  sumVariableForTotalCompletedForAnnualChart +
                  sumVariableForTotalDoneWithDelay;

                sumVariableForTotalCompletedForAnnualChart = (
                  (sumVariableForTotalCompletedForAnnualChart * 100) /
                  (sumVariableForTotalSchedule +
                    sumVariableForTotalPreviousPending)
                ).toFixed(2);

                annual_completed.push(
                  sumVariableForTotalCompletedForAnnualChart !== NaN
                    ? sumVariableForTotalCompletedForAnnualChart
                    : 0
                );
              }
              // console.log(annual_completed)
              if (
                monthlyChartDataOfSummery.some(
                  (e) => e?.section_id === subSectionsData[l]?._id
                )
              ) {
                monthlyChartDataOfSummery.map((key) => {
                  if (
                    key?.section_id === subSectionsData[l]?._id?._id &&
                    key?.chartData != undefined
                  ) {
                    key["annualChartData"] = annual_completed;
                  }
                });
              }
            }
          }
        }
      }

      // for (let m = 0; m < monthKeyArray.length; m++) {

      //     let sumVariableForTotalCompletedForAnnualChart = 0
      //     let x = `$checkSheet_data.PMStatus.${monthKeyArray[m]}`
      //     // let previousMonth = monthKeyArray[m - 1] === undefined ? monthKeyArray.splice(-1)[0] : monthKeyArray[m - 1]
      //     let keyForPreviousMonth = `$checkSheet_data.carriedPMStatus.${monthKeyArray[m]}`

      //     for (let n = 0; n < lineData.length; n++) {
      //         // console.log(lineData[n].line_name)
      //         groupData2 = await Machine.aggregate([

      //             {

      //                 $match: {
      //                     line_names: lineData[n]._id,
      //                     // line_names: mongoose.Types.ObjectId('633d0627416d0f692a1fc3ca'),
      //                     $or: selectedYearOfCheckSheet,
      //                     "checkSheet_data": { $ne: undefined }
      //                 }
      //             },
      //             {
      //                 $project: {
      //                     machine_code: 1,
      //                     machine_name: 1,
      //                     machine_nickname: 1,
      //                     machine_sequence: 1,
      //                     installation_date: 1,
      //                     maker_name: 1,
      //                     maker_sr_no: 1,
      //                     manufacturingDate: 1,
      //                     isPM: 1,
      //                     line_names: 1,
      //                     checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] }
      //                 }
      //             },
      //             {
      //                 $match: {
      //                     "checkSheet_data.PMStatus": { $ne: undefined },
      //                     // "checkSheet_data.carriedPMStatus": { $ne: undefined },

      //                 }
      //             },
      //             {
      //                 $group: {
      //                     _id: "$line_names",
      //                     machine: { $push: { machine_code: "$machine_code", machine_name: "$machine_name" } },

      //                     total_completed: {
      //                         $sum: {
      //                             $cond: [
      //                                 {
      //                                     $eq: [x, "Completed"]
      //                                 },
      //                                 1, 0
      //                             ]
      //                         }
      //                     },
      //                     // total_done_with_delay: {
      //                     //     $sum: {
      //                     //         $cond: [
      //                     //             {
      //                     //                 $eq: [keyOfTotalDoneWithDelay, "Done with delay"]
      //                     //             },
      //                     //             1, 0
      //                     //         ]
      //                     //     }
      //                     // },

      //                 },
      //             },

      //             {
      //                 $project: {
      //                     _id: 0,
      //                     line_names: "$_id",
      //                     machine:1,
      //                     "total_completed": 1,
      //                     "total_done_with_delay": 1
      //                 }
      //             },

      //         ])
      //         if (groupData2.length > 0) {
      //             console.log(groupData2)
      //             sumVariableForTotalCompletedForAnnualChart = sumVariableForTotalCompletedForAnnualChart + groupData2[0].total_completed
      //         }
      //     }

      //     annual_completed.push(sumVariableForTotalCompletedForAnnualChart)

      //     // if (groupData.length > 0) {
      //     //     for (let i = 0; i < groupData.length; i++) {
      //     //         allData.push(groupData[i])
      //     //     }
      //     // }

      // }
      // console.log(annual_completed)

      res.json({ SectionInfo, monthlyChartDataOfSummery });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("User id not received!!!");
    }
  }
);

router.get("/fetchAllSummeryData", authenticate, async (req, res, next) => {
  try {
    const financialYearWiseMonthKeyArray = [
      "Apr",
      "May",
      "June",
      "July",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
      "Jan",
      "Feb",
      "Mar",
    ];
    let previousMonth =
      financialYearWiseMonthKeyArray[
        financialYearWiseMonthKeyArray.indexOf(req.query?.selectedMonth) - 1
      ];

    let keyForSelectedMonth = `$checkSheet_data.PMStatus.${req.query?.selectedMonth}`;
    let keyForPreviousMonth = `$checkSheet_data.carriedPMStatus.${req.query?.selectedMonth}`;
    let keyForCurrentMonthScheduleOrNotStatus = `$checkSheet_data.currentMonthScheduleOrNotStatus.${req.query?.selectedMonth}`;
    let keyOfTotalDoneWithDelay = `$checkSheet_data.PMStatus.${previousMonth}`;

    let monthWiseAllStatusArray = [];
    for (let i = 0; i < financialYearWiseMonthKeyArray.length; i++) {
      monthWiseAllStatusArray.push({
        indexForSorting: i,
        currentMonth: financialYearWiseMonthKeyArray[i],
        previousMonth: financialYearWiseMonthKeyArray[i - 1],
        PMStatus: `$checkSheet_data.PMStatus.${financialYearWiseMonthKeyArray[i]}`,
        carriedPMStatus: `$checkSheet_data.carriedPMStatus.${financialYearWiseMonthKeyArray[i]}`,
        currentMonthScheduleOrNotStatus: `$checkSheet_data.currentMonthScheduleOrNotStatus.${financialYearWiseMonthKeyArray[i]}`,
        keyOfTotalDoneWithDelayForAnnualChart: `$checkSheet_data.PMStatus.${
          financialYearWiseMonthKeyArray[i - 1]
        }`,
      });
    }

    let groupId = {
        _id: "$cell_names",
      },
      addFieldsPipeline = [],
      addFieldsPipelineForAnnualData = [
        {
          $addFields: {
            monthWiseAllStatusArray,
          },
        },
      ];

    if (req.query?.filter === "Section") {
      const sections_with_dashboard_level_yes = await Section.aggregate([
        {
          $match: {
            dashboardLevel: "Yes",
          },
        },
        {
          $group: {
            _id: null,
            data: {
              $push: "$_id",
            },
          },
        },
      ]);

      addFieldsPipeline = [
        {
          $addFields: {
            groupId: {
              $cond: [
                {
                  $in: [
                    "$section_names",
                    sections_with_dashboard_level_yes?.[0]?.data,
                  ],
                },
                "$section_names",
                "$subSection_names",
              ],
            },
          },
        },
      ];

      addFieldsPipelineForAnnualData = [
        {
          $addFields: {
            groupId: {
              $cond: [
                {
                  $in: [
                    "$section_names",
                    sections_with_dashboard_level_yes?.[0]?.data,
                  ],
                },
                "$section_names",
                "$subSection_names",
              ],
            },
            monthWiseAllStatusArray,
          },
        },
      ];

      groupId = {
        _id: "$groupId",
      };
    }

    const monthData = await Machine.aggregate([
      {
        $unwind: "$checkSheet_data",
      },
      {
        $match: {
          "checkSheet_data.current_year": req.query?.selectedYear,
          "checkSheet_data.PMStatus": { $ne: undefined },
        },
      },
      ...addFieldsPipeline,
      {
        $group: {
          ...groupId,
          total_pmSchedule: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $ne: [keyForSelectedMonth, ""],
                    },
                    {
                      $ne: [keyForCurrentMonthScheduleOrNotStatus, ""],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
          total_completed: {
            $sum: {
              $cond: [
                {
                  $eq: [keyForSelectedMonth, "Completed"],
                },
                1,
                0,
              ],
            },
          },
          total_ongoing: {
            $sum: {
              $cond: [
                {
                  $eq: [keyForSelectedMonth, "Ongoing"],
                },
                1,
                0,
              ],
            },
          },
          total_done_with_delay: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $eq: [keyOfTotalDoneWithDelay, "Done with delay"],
                    },
                    {
                      $eq: [keyForCurrentMonthScheduleOrNotStatus, ""],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
          total_previous_pending: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $eq: [keyForPreviousMonth, "CarriedPM"],
                    },
                    {
                      $eq: [keyForCurrentMonthScheduleOrNotStatus, ""],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          total_pmSchedule: 1,
          total_previous_pending: 1,
          total_completed: {
            $sum: ["$total_completed", "$total_done_with_delay"],
          },
          total_ongoing: 1,
          total_remaining_current_month: {
            $subtract: [
              {
                $sum: ["$total_pmSchedule", "$total_previous_pending"],
              },
              {
                $sum: [
                  "$total_completed",
                  "$total_done_with_delay",
                  "$total_ongoing",
                ],
              },
            ],
          },
          percentage: {
            $trunc: [
              {
                $cond: [
                  {
                    $ne: [
                      {
                        $sum: ["$total_pmSchedule", "$total_previous_pending"],
                      },
                      0,
                    ],
                  },
                  {
                    $divide: [
                      {
                        $multiply: [
                          {
                            $sum: [
                              "$total_completed",
                              "$total_done_with_delay",
                            ],
                          },
                          100,
                        ],
                      },
                      {
                        $sum: ["$total_pmSchedule", "$total_previous_pending"],
                      },
                    ],
                  },
                  0,
                ],
              },
              2,
            ],
          },
        },
      },
    ]);

    const annualData = await Machine.aggregate([
      {
        $unwind: "$checkSheet_data",
      },
      {
        $match: {
          "checkSheet_data.current_year": req.query?.selectedYear,
          "checkSheet_data.PMStatus": { $ne: undefined },
        },
      },
      ...addFieldsPipelineForAnnualData,
      {
        $unwind: "$monthWiseAllStatusArray",
      },
      {
        $group: {
          _id: {
            ...groupId,
            month: "$monthWiseAllStatusArray.currentMonth",
            indexForSorting: "$monthWiseAllStatusArray.indexForSorting",
          },
          total_pmSchedule: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $ne: ["$monthWiseAllStatusArray.PMStatus", ""],
                    },
                    {
                      $ne: [
                        "$monthWiseAllStatusArray.currentMonthScheduleOrNotStatus",
                        "",
                      ],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
          total_completed: {
            $sum: {
              $cond: [
                {
                  $eq: ["$monthWiseAllStatusArray.PMStatus", "Completed"],
                },
                1,
                0,
              ],
            },
          },
          total_done_with_delay: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $eq: [
                        "$monthWiseAllStatusArray.keyOfTotalDoneWithDelayForAnnualChart",
                        "Done with delay",
                      ],
                    },
                    {
                      $eq: [
                        "$monthWiseAllStatusArray.currentMonthScheduleOrNotStatus",
                        "",
                      ],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
          total_Previous: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $eq: [
                        "$monthWiseAllStatusArray.carriedPMStatus",
                        "CarriedPM",
                      ],
                    },
                    {
                      $eq: [
                        "$monthWiseAllStatusArray.currentMonthScheduleOrNotStatus",
                        "",
                      ],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $group: {
          _id: "$_id._id",
          annualData: {
            $push: {
              month: "$_id.month",
              indexForSorting: "$_id.indexForSorting",
              data: {
                $trunc: [
                  {
                    $cond: [
                      {
                        $ne: [
                          {
                            $add: ["$total_pmSchedule", "$total_Previous"],
                          },
                          0,
                        ],
                      },
                      {
                        $divide: [
                          {
                            $multiply: [
                              {
                                $add: [
                                  "$total_completed",
                                  "$total_done_with_delay",
                                ],
                              },
                              100,
                            ],
                          },
                          {
                            $add: ["$total_pmSchedule", "$total_Previous"],
                          },
                        ],
                      },
                      0,
                    ],
                  },
                  2,
                ],
              },
            },
          },
        },
      },
      {
        $project: {
          total_done_with_delay: 1,
          total_completed: 1,
          completedPer: 1,
          annualData: {
            $sortArray: {
              input: "$annualData",
              sortBy: { indexForSorting: 1 },
            },
          },
        },
      },
    ]);

    let finalData = [];
    const conditionFunctionForDashboardLevel = {
      $eq: ["$section.dashboardLevel", "Yes"],
    };

    if (req.query?.filter === "Section") {
      const sectionOrSubSection = await SubSection.aggregate([
        {
          $match: {},
        },
        {
          $lookup: {
            from: "sections",
            localField: "section_names",
            foreignField: "_id",
            as: "section",
          },
        },
        {
          $unwind: "$section",
        },
        {
          $project: {
            _id: {
              $cond: [
                conditionFunctionForDashboardLevel,
                "$section._id",
                "$_id",
              ],
            },
            name: {
              $cond: [
                conditionFunctionForDashboardLevel,
                "$section.section_name",
                "$subSection_name",
              ],
            },
            plant_names: "$section.plant_names",
          },
        },
        {
          $group: {
            _id: {
              _id: "$_id",
              name: "$name",
              plant_names: "$plant_names",
            },
          },
        },
        {
          $group: {
            _id: "$_id.plant_names",
            details: {
              $push: {
                _id: "$_id._id",
                name: "$_id.name",
              },
            },
          },
        },
        {
          $lookup: {
            from: "plants",
            localField: "_id",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  plant_name: 1,
                },
              },
            ],
            as: "plant",
          },
        },
        {
          $unwind: "$plant",
        },
        {
          $sort: {
            "plant._id": 1,
          },
        },
        {
          $project: {
            plant: 1,
            details: {
              $sortArray: {
                input: "$details",
                sortBy: { _id: 1 },
              },
            },
          },
        },
      ]);

      finalData = sectionOrSubSection?.map((item) => ({
        plant_name: item?.plant?.plant_name,
        details: item?.details?.map((item1) => {
          let monthDataForSelectedSection = monthData?.find(
            (item2) => item2?._id?.toString() === item1?._id?.toString()
          );
          let annualDataForSelectedSection = annualData?.find(
            (item2) => item2?._id?.toString() === item1?._id?.toString()
          );

          return {
            ...item1,
            monthData: monthDataForSelectedSection,
            annualData: annualDataForSelectedSection?.annualData?.map(
              (monthWiseData) => monthWiseData?.data
            ),
          };
        }),
      }));
    } else {
      const cells = await Cell.aggregate([
        {
          $match: {},
        },
        {
          $lookup: {
            from: "sections",
            localField: "section_names",
            foreignField: "_id",
            as: "section",
          },
        },
        {
          $unwind: "$section",
        },
        {
          $lookup: {
            from: "subsections",
            localField: "subSection_names",
            foreignField: "_id",
            as: "subSection",
          },
        },
        {
          $unwind: "$subSection",
        },
        {
          $project: {
            toggleId: {
              $cond: [
                conditionFunctionForDashboardLevel,
                "$section._id",
                "$subSection._id",
              ],
            },
            toggleName: {
              $cond: [
                conditionFunctionForDashboardLevel,
                "$section.section_name",
                "$subSection.subSection_name",
              ],
            },
            plant_names: "$plant_names",
            cell_name: 1,
          },
        },
        {
          $group: {
            _id: {
              plant_names: "$plant_names",
              sectionOrSubSection: "$toggleId",
              nameSectionOrSubSection: "$toggleName",
            },
            cells: {
              $push: {
                _id: "$_id",
                cell_name: "$cell_name",
              },
            },
          },
        },
        {
          $group: {
            _id: "$_id.plant_names",
            details: {
              $push: {
                _id: "$_id.sectionOrSubSection",
                sectionOrSubSection: "$_id.sectionOrSubSection",
                nameSectionOrSubSection: "$_id.nameSectionOrSubSection",
                cells: "$cells",
              },
            },
          },
        },
        {
          $lookup: {
            from: "plants",
            localField: "_id",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  plant_name: 1,
                },
              },
            ],
            as: "plant",
          },
        },
        {
          $unwind: "$plant",
        },
        {
          $sort: {
            "plant._id": 1,
          },
        },
        {
          $project: {
            plant: 1,
            details: {
              $sortArray: {
                input: "$details",
                sortBy: { _id: 1 },
              },
            },
          },
        },
      ]);

      finalData = cells?.map((item) => ({
        plant_name: item?.plant?.plant_name,
        sectionOrSubSectionWiseData: item?.details?.map((item1) => ({
          nameSectionOrSubSection: item1?.nameSectionOrSubSection,
          details: item1?.cells?.map((item2) => {
            // console.log(item2);

            let monthDataForSelectedSection = monthData?.find(
              (item3) => item3?._id?.toString() === item2?._id?.toString()
            );
            let annualDataForSelectedSection = annualData?.find(
              (item3) => item3?._id?.toString() === item2?._id?.toString()
            );

            return {
              name: item2?.cell_name,
              monthData: monthDataForSelectedSection,
              annualData: annualDataForSelectedSection?.annualData?.map(
                (monthWiseData) => monthWiseData?.data
              ),
            };
          }),
        })),
      }));
    }

    return res.status(201).json({
      message: "Summery data get successfully!!!",
      annualData,
      finalData,
    });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log(error);
    res.status(500).json({
      message: "Something went wrong...",
      error,
    });
  }
});

router.post(
  "/postSectionToGetSubSectionForSummeryDashboard",
  authenticate,
  async (req, res) => {
    try {
      let { section } = req.body;

      let idForDashboardLevelNo = [];
      await section.map((item) => {
        if (item.dashboardLevel === "No") idForDashboardLevelNo.push(item);
      });

      // console.log(idForDashboardLevelNo)

      const subSectionInfo = await SubSection.find({
        section_names: { $in: idForDashboardLevelNo.map((item) => item._id) },
      });
      // const subSectionInfo = await SubSection.find({ section_names: { $in: section.map(item => item.dashboardLevel === "No" ? item._id : "") } })

      // console.log(subSectionInfo);

      res.json({ subSectionInfo });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("User id not received!!!");
    }
  }
);

router.post(
  "/submitRemarksForMainDashboardSectionWise",
  authenticate,
  async (req, res) => {
    try {
      let { section, remarks } = req.body;
      let sectionSplit = section.split("-");

      let updatedSectionInfo = await Section.updateOne(
        { section_id: sectionSplit[0] },
        {
          $set: {
            remarksOnMainDashboard: remarks,
          },
        }
      );

      if (updatedSectionInfo) {
        res.status(200).json({ msg: "uploaded successfully" });
      }
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("User id not received!!!");
    }
  }
);

router.post(
  "/submitRemarksForMainDashboardSubSectionWise",
  authenticate,
  async (req, res) => {
    try {
      let { subSection, remarks } = req.body;
      let subSectionSplit = subSection.split("-");

      // console.log(subSection, subSectionSplit[0])

      let updatedSubSectionInfo = await SubSection.updateOne(
        { subSection_id: subSectionSplit[0] },
        {
          $set: {
            remarksOnMainDashboard: remarks,
          },
        }
      );

      if (updatedSubSectionInfo) {
        res.status(200).json({ msg: "uploaded successfully" });
      }
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("User id not received!!!");
    }
  }
);

router.get(
  "/fetchRemarksForMainDashboardSectionWise",
  authenticate,
  async (req, res) => {
    try {
      let sectionSplit = req.rootUser.section_data.split("-");

      // console.log(req.rootUser)
      const sectionInfo = await Section.findOne({
        section_id: sectionSplit[0],
      });

      if (sectionInfo?.dashboardLevel === "Yes") {
        res.json({ sectionInfo });
      } else {
        console.log("No");
      }
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("User id not received!!!");
    }
  }
);

router.post(
  "/fetchRemarksForMainDashboardSubSectionWise",
  authenticate,
  async (req, res) => {
    try {
      let { subSection } = req.body;

      // console.log(subSection)

      let subSectionInfo;

      if (subSection) {
        let subSectionSplit = subSection?.split("-");

        // console.log(subSection, subSectionSplit[0])

        subSectionInfo = await SubSection.findOne({
          subSection_id: subSectionSplit[0],
        });
      }

      // console.log(subSectionInfo)

      res.json({ subSectionInfo });
      // if (subSectionInfo) {
      // }
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("User id not received!!!");
    }
  }
);

router.get(
  "/getDeletedMachineCheckSheetData",
  authenticate,
  async (req, res) => {
    try {
      const getDeletedDataOfCheckSheet = await BackupMachineData.find(
        {}
      ).populate({
        path: "line_names",
        populate: { path: "cell_names", model: "Cells" },
      });
      if (getDeletedDataOfCheckSheet) {
        res.json({ getDeletedDataOfCheckSheet });
      } else {
        return res.status(400).json("Checksheet not copied!!!");
      }
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("User data not send or get!!!");
    }
  }
);

//below two API for total time with month and line selection

router.post(
  "/postSectionToGetAllDataForTotalTimeMonthWiseReport",
  authenticate,
  async (req, res) => {
    try {
      let { section, selectedYear } = req.body;
      // let selectedYear = "2022-2023"
      let loggedUserData = req.rootUser;
      // console.log("____________", sectionInfo[0]._id)
      let subSectionsData,
        subSectionIdArray = [],
        cellData,
        cellIdArray = [],
        lineData,
        lineIdArray = [],
        machineData,
        machineDataForChecksheet,
        subsectionSplitIdArrayForChecksheet = [];
      if (typeof section !== "object") {
        let sectionSplit = section.split("-");
        const sectionInfo = await Section.findOne({
          section_id: sectionSplit[0],
        });
        if (sectionInfo.dashboardLevel === "Yes") {
          subSectionsData = await SubSection.find({
            section_names: sectionInfo._id,
          }).sort({ subSection_sequence: 1 });
        } else {
          loggedUserData.subSection_data.map((ids) => {
            let subsectionsId = ids.split("-");
            subsectionSplitIdArrayForChecksheet.push(subsectionsId[0]);
          });
          subSectionsData = await SubSection.find({
            subSection_id: { $in: subsectionSplitIdArrayForChecksheet },
          }).sort({ subSection_sequence: 1 });
        }
      } else {
        if (section?.dashboardLevel === "Yes") {
          subSectionsData = await SubSection.find({
            section_names: section?._id,
          }).sort({ subSection_sequence: 1 });
        } else {
          subSectionsData = await SubSection.find({ _id: section?._id }).sort({
            subSection_sequence: 1,
          });
        }
      }

      for (let i = 0; i < subSectionsData.length; i++) {
        subSectionIdArray.push(subSectionsData[i]._id);
      }

      cellData = await Cell.find({
        subSection_names: { $in: subSectionIdArray },
      }).sort({ cell_sequence: 1 });
      for (let i = 0; i < cellData.length; i++) {
        cellIdArray.push(cellData[i]._id);
      }
      lineData = await Line.find({ cell_names: { $in: cellIdArray } }).sort({
        line_sequence: 1,
      });
      for (let i = 0; i < lineData.length; i++) {
        lineIdArray.push(lineData[i]._id);
      }
      // console.log(lineData)
      let currentYear =
        new Date().getMonth() < 3
          ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
          : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
      let selectedYearOfCheckSheet =
        selectedYear === currentYear
          ? [
              {
                "checkSheet_data.current_year": selectedYear,
              },
              {
                checkSheet_data: [],
              },
            ]
          : [
              {
                "checkSheet_data.current_year": selectedYear,
              },
            ];
      // console.log(selectedYear)
      let groupData;
      let allData = [];
      // y = "Nov"
      const monthKeyArray = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "June",
        "July",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const financialYearWiseMonthKeyArray = [
        "Apr",
        "May",
        "June",
        "July",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
        "Jan",
        "Feb",
        "Mar",
      ];

      let total_time_month_wise = [];
      // console.log(i, "------->")
      for (let j = 0; j < monthKeyArray.length; j++) {
        let sumOfTotalTime = 0;

        for (let i = 0; i < lineData.length; i++) {
          let x = `checkSheet_data.totalPMTime.${financialYearWiseMonthKeyArray[j]}`;
          // let previousMonth = monthKeyArray[j - 1] === undefined ? monthKeyArray.splice(-1)[0] : monthKeyArray[j - 1]
          let keyForTotalTime = `checkSheet_data.totalPMTime.${financialYearWiseMonthKeyArray[j]}.totalWorkedPMTime`;
          let keyForTotalTimeForSum = `$checkSheet_data.totalPMTime.${financialYearWiseMonthKeyArray[j]}.totalWorkedPMTime`;

          groupData = await Machine.aggregate([
            {
              $match: {
                line_names: lineData[i]._id,
                checkSheet_data: { $ne: undefined },
                $or: selectedYearOfCheckSheet,
              },
            },
            {
              $unwind: "$checkSheet_data",
            },
            {
              $match: {
                "checkSheet_data.current_year": selectedYear,
              },
            },
            // { $addFields: { checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] } } },
            {
              $match: {
                [x]: { $ne: undefined },
                [keyForTotalTime]: { $ne: undefined },
                // "checkSheet_data.carriedPMStatus": { $ne: undefined },
              },
            },
            {
              $group: {
                _id: "$line_names",
                machine: {
                  $push: {
                    machine_code: "$machine_code",
                    machine_name: "$machine_name",
                  },
                },
                total_pmTime: {
                  $sum: { $divide: [keyForTotalTimeForSum, 60] },
                },
              },
            },
            {
              $project: {
                _id: 0,
                line_names: "$_id",
                machine: 1,
                total_pmTime: 1,
              },
            },
          ]);

          if (groupData.length > 0) {
            sumOfTotalTime = sumOfTotalTime + groupData[0].total_pmTime;
            // console.log(lineData[i]?.line_name,"---------------", sumOfTotalTime)
          }
        }
        if (sumOfTotalTime) {
          total_time_month_wise.push(sumOfTotalTime);
        } else {
          total_time_month_wise.push(0);
        }
      }

      res.json({
        subSectionsData,
        subSectionIdArray,
        cellData,
        cellIdArray,
        lineData,
        lineIdArray,
        total_time_month_wise,
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("User id not received!!!");
    }
  }
);

router.post(
  "/postPerticularLineToGetDataForTotalTimeMonthWiseReport",
  authenticate,
  async (req, res) => {
    try {
      let { line, selectedYear } = req.body;
      // console.log(line)
      // let selectedYear = "2022-2023"
      let current_year =
        new Date().getMonth() < 3
          ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
          : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

      let selectedYearOfCheckSheet =
        selectedYear === current_year
          ? [
              {
                "checkSheet_data.current_year": selectedYear,
              },
              {
                checkSheet_data: [],
              },
            ]
          : [
              {
                "checkSheet_data.current_year": selectedYear,
              },
            ];
      const ObjectId = mongoose.Types.ObjectId;

      let groupData;
      let allData = [];
      // y = "Nov"
      const monthKeyArray = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "June",
        "July",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const financialYearWiseMonthKeyArray = [
        "Apr",
        "May",
        "June",
        "July",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
        "Jan",
        "Feb",
        "Mar",
      ];

      let totalTimeMonthWiseForPerticularLine = [];
      // console.log(i, "------->")
      for (let j = 0; j < monthKeyArray.length; j++) {
        let sumOfTotalTime;

        let x = `checkSheet_data.totalPMTime.${financialYearWiseMonthKeyArray[j]}`;
        // let previousMonth = monthKeyArray[j - 1] === undefined ? monthKeyArray.splice(-1)[0] : monthKeyArray[j - 1]
        let keyForTotalTime = `checkSheet_data.totalPMTime.${financialYearWiseMonthKeyArray[j]}.totalWorkedPMTime`;
        let keyForTotalTimeForSum = `$checkSheet_data.totalPMTime.${financialYearWiseMonthKeyArray[j]}.totalWorkedPMTime`;

        groupData = await Machine.aggregate([
          {
            $match: {
              line_names: ObjectId(line),
              checkSheet_data: { $ne: undefined },
              $or: selectedYearOfCheckSheet,
            },
          },
          {
            $unwind: "$checkSheet_data",
          },
          {
            $match: {
              "checkSheet_data.current_year": selectedYear,
            },
          },
          // { $addFields: { checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] } } },
          {
            $match: {
              [x]: { $ne: undefined },
              [keyForTotalTime]: { $ne: undefined },
              // "checkSheet_data.carriedPMStatus": { $ne: undefined },
            },
          },
          {
            $group: {
              _id: "$line_names",
              machine: {
                $push: {
                  machine_code: "$machine_code",
                  machine_name: "$machine_name",
                },
              },
              total_pmTime: {
                $sum: { $divide: [keyForTotalTimeForSum, 60] },
              },
            },
          },
          {
            $project: {
              _id: 0,
              line_names: "$_id",
              machine: 1,
              total_pmTime: 1,
            },
          },
        ]);

        if (groupData.length > 0) {
          sumOfTotalTime = groupData[0].total_pmTime;
        }
        if (sumOfTotalTime) {
          totalTimeMonthWiseForPerticularLine.push(sumOfTotalTime);
        } else {
          totalTimeMonthWiseForPerticularLine.push(0);
        }
      }

      // console.log(totalTimeMonthWiseForPerticularLine)

      res.json({ totalTimeMonthWiseForPerticularLine });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("User id not received!!!");
    }
  }
);

//below two API for total time man hour wise with month and line selection

router.post(
  "/postSectionToGetAllDataForTotalTimeManHoursMonthWise",
  authenticate,
  async (req, res) => {
    try {
      let { section, selectedYear } = req.body;
      // let selectedYear = "2022-2023"
      let loggedUserData = req.rootUser;

      // console.log("____________", sectionInfo[0]._id)
      let subSectionsData,
        subSectionIdArray = [],
        cellData,
        cellIdArray = [],
        lineData,
        lineIdArray = [],
        machineData,
        machineDataForChecksheet,
        subsectionSplitIdArrayForChecksheet = [];

      if (typeof section !== "object") {
        let sectionSplit = section.split("-");
        const sectionInfo = await Section.findOne({
          section_id: sectionSplit[0],
        });
        if (sectionInfo.dashboardLevel === "Yes") {
          subSectionsData = await SubSection.find({
            section_names: sectionInfo._id,
          }).sort({ subSection_sequence: 1 });
        } else {
          loggedUserData.subSection_data.map((ids) => {
            let subsectionsId = ids.split("-");
            subsectionSplitIdArrayForChecksheet.push(subsectionsId[0]);
          });
          subSectionsData = await SubSection.find({
            subSection_id: { $in: subsectionSplitIdArrayForChecksheet },
          }).sort({ subSection_sequence: 1 });
        }
      } else {
        if (section?.dashboardLevel === "Yes") {
          subSectionsData = await SubSection.find({
            section_names: section?._id,
          }).sort({ subSection_sequence: 1 });
        } else {
          subSectionsData = await SubSection.find({ _id: section?._id }).sort({
            subSection_sequence: 1,
          });
        }
      }
      for (let i = 0; i < subSectionsData.length; i++) {
        subSectionIdArray.push(subSectionsData[i]._id);
      }
      cellData = await Cell.find({
        subSection_names: { $in: subSectionIdArray },
      }).sort({ cell_sequence: 1 });
      for (let i = 0; i < cellData.length; i++) {
        cellIdArray.push(cellData[i]._id);
      }
      lineData = await Line.find({ cell_names: { $in: cellIdArray } }).sort({
        line_sequence: 1,
      });
      for (let i = 0; i < lineData.length; i++) {
        lineIdArray.push(lineData[i]._id);
      }
      // console.log(lineData)
      let currentYear =
        new Date().getMonth() < 3
          ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
          : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
      let selectedYearOfCheckSheet =
        selectedYear === currentYear
          ? [
              {
                "checkSheet_data.current_year": selectedYear,
              },
              {
                checkSheet_data: [],
              },
            ]
          : [
              {
                "checkSheet_data.current_year": selectedYear,
              },
            ];
      // console.log(selectedYear)
      let groupData;
      let allData = [];
      // y = "Nov"
      const monthKeyArray = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "June",
        "July",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const financialYearWiseMonthKeyArray = [
        "Apr",
        "May",
        "June",
        "July",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
        "Jan",
        "Feb",
        "Mar",
      ];

      let totalTimeManHoursMonthWise = [];
      // console.log(i, "------->")
      for (let j = 0; j < monthKeyArray.length; j++) {
        let sumOfTotalTimeManHours = 0;

        for (let i = 0; i < lineData.length; i++) {
          let keyOfTotalPMTime = `checkSheet_data.totalPMTime.${financialYearWiseMonthKeyArray[j]}`;
          let keyOfTotalWorkedPMTime = `checkSheet_data.totalPMTime.${financialYearWiseMonthKeyArray[j]}.totalWorkedPMTime`;

          // let previousMonth = monthKeyArray[j - 1] === undefined ? monthKeyArray.splice(-1)[0] : monthKeyArray[j - 1]
          let keyofSupportingTMData = `checkSheet_data.totalPMTime.${financialYearWiseMonthKeyArray[j]}.supportingTMData`;
          let keyForTotalTimeManHoursForSum = `$checkSheet_data.totalPMTime.${financialYearWiseMonthKeyArray[j]}.supportingTMData.workedTime`;
          let keyForTotalTimeManHoursForUnwind = `$checkSheet_data.totalPMTime.${financialYearWiseMonthKeyArray[j]}.supportingTMData`;

          groupData = await Machine.aggregate([
            {
              $match: {
                line_names: lineData[i]._id,
                checkSheet_data: { $ne: undefined },
                $or: selectedYearOfCheckSheet,
              },
            },
            {
              $unwind: "$checkSheet_data",
            },
            {
              $match: {
                "checkSheet_data.current_year": selectedYear,
              },
            },
            // { $addFields: { checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] } } },
            {
              $match: {
                [keyOfTotalPMTime]: { $ne: undefined },
                [keyOfTotalWorkedPMTime]: { $ne: undefined },
                [keyofSupportingTMData]: { $ne: [] },
                // "checkSheet_data.carriedPMStatus": { $ne: undefined },
              },
            },
            {
              $unwind: keyForTotalTimeManHoursForUnwind,
            },
            {
              $group: {
                _id: "$line_names",
                machine: {
                  $push: {
                    machine_code: "$machine_code",
                    machine_name: "$machine_name",
                  },
                },
                totalTimeManHours: {
                  $sum: { $divide: [keyForTotalTimeManHoursForSum, 60] },
                },
              },
            },
            {
              $project: {
                _id: 0,
                line_names: "$_id",
                machine: 1,
                totalTimeManHours: 1,
              },
            },
          ]);
          // console.log("---------------", groupData)

          if (groupData.length > 0) {
            // console.log("---------------", groupData[0].machine)

            sumOfTotalTimeManHours =
              sumOfTotalTimeManHours + groupData[0].totalTimeManHours;
          }
        }
        // console.log("---------------", groupData)

        if (sumOfTotalTimeManHours) {
          totalTimeManHoursMonthWise.push(sumOfTotalTimeManHours);
        } else {
          totalTimeManHoursMonthWise.push(0);
        }
      }

      res.json({
        subSectionsData,
        subSectionIdArray,
        cellData,
        cellIdArray,
        lineData,
        lineIdArray,
        totalTimeManHoursMonthWise,
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("User id not received!!!");
    }
  }
);

router.post(
  "/postPerticularLineToGetDataForTotalTimeManHours",
  authenticate,
  async (req, res) => {
    try {
      let { line, selectedYear } = req.body;
      // let selectedYear = "2022-2023"

      let currentYear =
        new Date().getMonth() < 3
          ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
          : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
      let selectedYearOfCheckSheet =
        selectedYear === currentYear
          ? [
              {
                "checkSheet_data.current_year": selectedYear,
              },
              {
                checkSheet_data: [],
              },
            ]
          : [
              {
                "checkSheet_data.current_year": selectedYear,
              },
            ];
      // console.log(selectedYear)
      const ObjectId = mongoose.Types.ObjectId;

      let groupData;
      let allData = [];
      // y = "Nov"
      const monthKeyArray = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "June",
        "July",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const financialYearWiseMonthKeyArray = [
        "Apr",
        "May",
        "June",
        "July",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
        "Jan",
        "Feb",
        "Mar",
      ];

      let totalTimeManHoursMonthWiseOfLineWise = [];
      // console.log(i, "------->")
      for (let j = 0; j < monthKeyArray.length; j++) {
        let sumOfTotalTimeManHoursOfLineWise;

        let keyOfTotalPMTime = `checkSheet_data.totalPMTime.${financialYearWiseMonthKeyArray[j]}`;
        let keyOfTotalWorkedPMTime = `checkSheet_data.totalPMTime.${financialYearWiseMonthKeyArray[j]}.totalWorkedPMTime`;

        // let previousMonth = monthKeyArray[j - 1] === undefined ? monthKeyArray.splice(-1)[0] : monthKeyArray[j - 1]
        let keyofSupportingTMData = `checkSheet_data.totalPMTime.${financialYearWiseMonthKeyArray[j]}.supportingTMData`;
        let keyForTotalTimeManHoursForSum = `$checkSheet_data.totalPMTime.${financialYearWiseMonthKeyArray[j]}.supportingTMData.workedTime`;
        let keyForTotalTimeManHoursForUnwind = `$checkSheet_data.totalPMTime.${financialYearWiseMonthKeyArray[j]}.supportingTMData`;

        groupData = await Machine.aggregate([
          {
            $match: {
              line_names: ObjectId(line),
              checkSheet_data: { $ne: undefined },
              $or: selectedYearOfCheckSheet,
            },
          },
          {
            $unwind: "$checkSheet_data",
          },
          {
            $match: {
              "checkSheet_data.current_year": selectedYear,
            },
          },
          // { $addFields: { checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] } } },
          {
            $match: {
              [keyOfTotalPMTime]: { $ne: undefined },
              [keyOfTotalWorkedPMTime]: { $ne: undefined },
              [keyofSupportingTMData]: { $ne: [] },
              // "checkSheet_data.carriedPMStatus": { $ne: undefined },
            },
          },
          {
            $unwind: keyForTotalTimeManHoursForUnwind,
          },
          {
            $group: {
              _id: "$line_names",
              machine: {
                $push: {
                  machine_code: "$machine_code",
                  machine_name: "$machine_name",
                },
              },
              totalTimeManHours: {
                $sum: keyForTotalTimeManHoursForSum,
              },
            },
          },
          {
            $project: {
              _id: 0,
              line_names: "$_id",
              machine: 1,
              totalTimeManHours: 1,
            },
          },
        ]);

        if (groupData.length > 0) {
          sumOfTotalTimeManHoursOfLineWise = groupData[0].totalTimeManHours;
        }
        if (sumOfTotalTimeManHoursOfLineWise) {
          totalTimeManHoursMonthWiseOfLineWise.push(
            sumOfTotalTimeManHoursOfLineWise
          );
        } else {
          totalTimeManHoursMonthWiseOfLineWise.push(0);
        }
      }

      res.json({ totalTimeManHoursMonthWiseOfLineWise });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("User id not received!!!");
    }
  }
);

//below API for get data for actual time taken TM wise for perticular selected TM name

router.post(
  "/postPerticularOperatorToGetDataForActualTimeTakenTMWise",
  authenticate,
  async (req, res) => {
    try {
      let { section, tm_no, selectedYear } = req.body;
      // console.log(tm_no)
      // let selectedYear = "2022-2023"
      let loggedUserData = req.rootUser;

      let subSectionsData,
        subSectionIdArray = [],
        cellData,
        cellIdArray = [],
        lineData,
        lineIdArray = [],
        machineData,
        machineDataForChecksheet,
        subsectionSplitIdArrayForChecksheet = [];

      if (typeof section !== "object") {
        let sectionSplit = section.split("-");
        const sectionInfo = await Section.findOne({
          section_id: sectionSplit[0],
        });

        if (sectionInfo.dashboardLevel === "Yes") {
          subSectionsData = await SubSection.find({
            section_names: sectionInfo._id,
          }).sort({ subSection_sequence: 1 });
        } else {
          loggedUserData.subSection_data.map((ids) => {
            let subsectionsId = ids.split("-");
            subsectionSplitIdArrayForChecksheet.push(subsectionsId[0]);
          });
          subSectionsData = await SubSection.find({
            subSection_id: { $in: subsectionSplitIdArrayForChecksheet },
          }).sort({ subSection_sequence: 1 });
        }
      } else {
        if (section?.dashboardLevel === "Yes") {
          subSectionsData = await SubSection.find({
            section_names: section?._id,
          }).sort({ subSection_sequence: 1 });
        } else {
          subSectionsData = await SubSection.find({ _id: section?._id }).sort({
            subSection_sequence: 1,
          });
        }
      }

      for (let i = 0; i < subSectionsData.length; i++) {
        subSectionIdArray.push(subSectionsData[i]._id);
      }
      cellData = await Cell.find({
        subSection_names: { $in: subSectionIdArray },
      }).sort({ cell_sequence: 1 });
      for (let i = 0; i < cellData.length; i++) {
        cellIdArray.push(cellData[i]._id);
      }
      lineData = await Line.find({ cell_names: { $in: cellIdArray } }).sort({
        line_sequence: 1,
      });
      for (let i = 0; i < lineData.length; i++) {
        lineIdArray.push(lineData[i]._id);
      }
      // console.log(lineData)
      let currentYear =
        new Date().getMonth() < 3
          ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
          : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
      let selectedYearOfCheckSheet =
        selectedYear === currentYear
          ? [
              {
                "checkSheet_data.current_year": selectedYear,
              },
              {
                checkSheet_data: [],
              },
            ]
          : [
              {
                "checkSheet_data.current_year": selectedYear,
              },
            ];
      // console.log(selectedYear)
      let groupData;
      let allData = [];
      // y = "Nov"
      const monthKeyArray = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "June",
        "July",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const financialYearWiseMonthKeyArray = [
        "Apr",
        "May",
        "June",
        "July",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
        "Jan",
        "Feb",
        "Mar",
      ];

      let actualTotalTimeTakenOfTM = [];
      // console.log(i, "------->")
      for (let j = 0; j < monthKeyArray.length; j++) {
        let sumOfActualTimeTakenTM = 0;

        for (let i = 0; i < lineData.length; i++) {
          let keyOfTotalPMTime = `checkSheet_data.totalPMTime.${financialYearWiseMonthKeyArray[j]}`;
          let keyOfTotalWorkedPMTime = `checkSheet_data.totalPMTime.${financialYearWiseMonthKeyArray[j]}.totalWorkedPMTime`;

          // let previousMonth = monthKeyArray[j - 1] === undefined ? monthKeyArray.splice(-1)[0] : monthKeyArray[j - 1]
          let keyofSupportingTMData = `checkSheet_data.totalPMTime.${financialYearWiseMonthKeyArray[j]}.supportingTMData`;
          let keyForTotalTimeManHoursForSum = `$checkSheet_data.totalPMTime.${financialYearWiseMonthKeyArray[j]}.supportingTMData.workedTime`;
          let keyForTotalTimeManHoursForUnwind = `$checkSheet_data.totalPMTime.${financialYearWiseMonthKeyArray[j]}.supportingTMData`;

          let keyForTM_no = `checkSheet_data.totalPMTime.${financialYearWiseMonthKeyArray[j]}.supportingTMData.tm_no`;

          groupData = await Machine.aggregate([
            {
              $match: {
                line_names: lineData[i]._id,
                checkSheet_data: { $ne: undefined },
                $or: selectedYearOfCheckSheet,
              },
            },
            {
              $unwind: "$checkSheet_data",
            },
            {
              $match: {
                "checkSheet_data.current_year": selectedYear,
              },
            },
            // { $addFields: { checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] } } },
            {
              $match: {
                [keyOfTotalPMTime]: { $ne: undefined },
                [keyOfTotalWorkedPMTime]: { $ne: undefined },
                [keyofSupportingTMData]: { $ne: [] },
                // "checkSheet_data.carriedPMStatus": { $ne: undefined },
              },
            },
            {
              $unwind: keyForTotalTimeManHoursForUnwind,
            },
            {
              $match: {
                [keyForTM_no]: parseInt(tm_no),
              },
            },
            {
              $group: {
                _id: "$line_names",
                machine: {
                  $push: {
                    machine_code: "$machine_code",
                    machine_name: "$machine_name",
                  },
                },
                actualTotalTimeTM: {
                  $sum: keyForTotalTimeManHoursForSum,
                },
              },
            },
            {
              $project: {
                _id: 0,
                line_names: "$_id",
                machine: 1,
                actualTotalTimeTM: 1,
                // "checkSheet_data.totalPMTime": 1
              },
            },
          ]);
          // console.log(financialYearWiseMonthKeyArray[j],"---------------", groupData)

          if (groupData.length > 0) {
            sumOfActualTimeTakenTM =
              sumOfActualTimeTakenTM + groupData[0].actualTotalTimeTM;
          }
        }
        // console.log("---------------", groupData)

        if (sumOfActualTimeTakenTM) {
          actualTotalTimeTakenOfTM.push(sumOfActualTimeTakenTM);
        } else {
          actualTotalTimeTakenOfTM.push(0);
        }
      }
      // console.log(actualTotalTimeTakenOfTM)
      res.json({ actualTotalTimeTakenOfTM });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("User id not received!!!");
    }
  }
);

//for tag name XLSx file upload
const storage2 = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./data_sheets/");
  },
  filename: function (req, file, cb) {
    // cb(null, Date.now() + '_' + file.originalname);
    cb(null, file.originalname);
  },
});

const fileFilter2 = (req, file, cb) => {
  const allowedFileTypes = ["xls", "xlsx"];
  if (!file.originalname.match(/\.(xls|xlsx|csv)$/)) {
    return cb(new Error("Only .xls, .xlsx, .csv format allowed!"));
  } else {
    cb(null, true);

    // cb(null, false);
  }
};

const upload2 = multer({
  storage: storage2,
  limits: {
    fileSize: 52428800,
  },
  fileFilter: fileFilter2,
});

//upload tag ( XLS , XLSX ) file
router.post(
  "/uploadDataSheetFile",
  upload2.single("data_sheet"),
  async (req, res) => {
    try {
      // console.log(req.body)
      const machine_code = req.body.machine_code;
      const yearOfCheckSheet = req.body.yearOfCheckSheet;
      let keyForUpdateDataSheet = `checkSheet_data.$[outer].dataSheet`;

      let uploadDataSheet;
      if (req.file === undefined) {
        return res.status(422).json({ error: "plz select the file" });
      } else {
        const dataSheet = req.file?.filename;
        uploadDataSheet = await Machine.updateOne(
          {
            machine_code: machine_code,
          },
          {
            $set: {
              [keyForUpdateDataSheet]: dataSheet,
            },
          },
          {
            arrayFilters: [{ "outer.current_year": yearOfCheckSheet }],
          }
        );
      }
      let machineLastData = await Machine.aggregate([
        {
          $match: {
            machine_code: machine_code,
            "checkSheet_data.current_year": yearOfCheckSheet,
          },
        },
        {
          $unwind: "$checkSheet_data",
        },
        {
          $match: {
            "checkSheet_data.current_year": yearOfCheckSheet,
          },
        },
        {
          $project: {
            machine_code: 1,
            machine_name: 1,
            machine_nickname: 1,
            machine_sequence: 1,
            installation_date: 1,
            maker_name: 1,
            maker_sr_no: 1,
            manufacturingDate: 1,
            isPM: 1,
            line_names: 1,
            checkSheet_data: 1,
          },
        },
      ]);
      if (uploadDataSheet) {
        res.json({ machineLastData: machineLastData[0] });
      } else {
        res.status(422).send("Data sheet not uploaded ");
      }
    } catch (err) {
      logger.error(err, { maintenanceType: maintenanceType?.[0] });
      console.log(err);
      // res.status(400).send("error")
    }
  }
);

router.post("/deleteBackUpData", authenticate, async (req, res) => {
  try {
    const { selectedRow } = req.body;
    // const plant_no = Object.values(plant_id);
    // console.log(plant_id);

    if (!selectedRow) {
      return res.status(422).send(" Back-up data is not valid!!!");
    }

    // const result = await Section.find({ plant_names: _id })
    // console.log(result)
    const deleteBackupData = await BackupMachineData.deleteOne({
      machine_code: selectedRow.machine_code,
    });

    if (deleteBackupData) {
      // console.log("Plant deleted!!!")
      return res.status(201).json("Backup Data deleted!!!");
    } else {
      return res.status(400).json("Backup data not deleted!!!");
    }
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log(error);
    console.log("Data not valid or received !!!");
  }
});

let downloadDataSheetFileName;

router.post("/postDataSheetFileName", authenticate, async (req, res) => {
  // const file = fs.createWriteStream(filePath);

  try {
    const { fileName } = req.body;
    let filePath = path.join(__dirname, `../data_sheets/${fileName}`);
    downloadDataSheetFileName = filePath;
    if (downloadDataSheetFileName) {
      res.status(201).json({ message: "File name posted" });
    }
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    // console.log("2032", error)
    console.log("Filename not received");
  }
});

router.get("/downloadDataSheetFile", authenticate, async (req, res) => {
  try {
    // console.log(downloadDataSheetFileName)
    res.download(downloadDataSheetFileName);
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log("Filename not received");
  }
});

//get the skip table data of the selected machine
router.post(
  "/fetchSelectedMachineSkipWorkPMTableData",
  authenticate,
  async (req, res) => {
    try {
      let { machineId, schedule_month } = req.body;

      //2022-23
      let current_year = `${new Date().getFullYear()}-${
        new Date().getFullYear() + 1
      }`;

      //2023-2024
      // let current_year = `${new Date().getFullYear() + 1}-${new Date().getFullYear() + 2}`

      let previous_year = `${
        new Date().getFullYear() - 1
      }-${new Date().getFullYear()}`;

      let checkSheetDataKeyExistsOrNot = await Machine.findOne({
        machine_code: machineId,
        checkSheet_data: { $exists: true },
      });

      let machineLastData = await Machine.aggregate([
        {
          $match: {
            machine_code: machineId,
          },
        },
        { $unwind: "$checkSheet_data" },
        {
          $match: {
            "checkSheet_data.current_year": current_year,
          },
        },
        {
          $project: {
            machine_code: 1,
            machine_name: 1,
            machine_nickname: 1,
            machine_sequence: 1,
            installation_date: 1,
            maker_name: 1,
            maker_sr_no: 1,
            manufacturingDate: 1,
            isPM: 1,
            line_names: 1,
            checkSheet_data: 1,
          },
        },
      ]);

      machineLastData = await Machine.populate(machineLastData, {
        path: "line_names",
        populate: { path: "cell_names", model: "Cells" },
      });
      let selectedMachineSkipData = [];
      for (
        let j = 0;
        j < machineLastData[0]?.checkSheet_data?.checkSheet?.length;
        j++
      ) {
        if (
          // (keyForCheckSheet?.checkSheet_data?.checkSheet[j]?.cycle !== '1/1M' ||
          //     keyForCheckSheet?.checkSheet_data?.checkSheet[j]?.cycle !== '1/2M')
          (machineLastData[0]?.checkSheet_data?.checkSheet[j]?.cycle ===
            "1/3M" ||
            machineLastData[0]?.checkSheet_data?.checkSheet[j]?.cycle ===
              "1/4M" ||
            machineLastData[0]?.checkSheet_data?.checkSheet[j]?.cycle ===
              "1/6M" ||
            machineLastData[0]?.checkSheet_data?.checkSheet[j]?.cycle ===
              "1/Y") &&
          machineLastData[0]?.checkSheet_data?.checkSheet[j]
            ?.planningTableAnimationArray2[schedule_month][1] === "skip" &&
          machineLastData[0]?.checkSheet_data?.checkSheet[j]
            ?.planningTableAnimationArray2[schedule_month][0] === "1" &&
          !machineLastData[0]?.checkSheet_data?.checkSheet[j]?.isDeleted
        ) {
          // console.log(keyForCheckSheet?.checkSheet_data?.checkSheet[j]?.tableRowId, "-----", keyForCheckSheet?.machine_code, "--->", keyForCheckSheet?.checkSheet_data?.checkSheet[j]?.cycle, "---", j, "month---", month)

          selectedMachineSkipData.push(
            new Object({
              machine_code: machineLastData[0].machine_code,
              schedule_month: schedule_month,
              tableRowId:
                machineLastData[0].checkSheet_data.checkSheet[j]?.tableRowId,
              inspection_parent_name:
                machineLastData[0]?.checkSheet_data?.checkSheet[j]
                  .inspection_parent_name,
              inspection_point:
                machineLastData[0]?.checkSheet_data?.checkSheet[j]
                  .inspection_point,
              judgement_criteria:
                machineLastData[0]?.checkSheet_data?.checkSheet[j]
                  .judgement_criteria,
              action: machineLastData[0]?.checkSheet_data?.checkSheet[j].action,
              cycle: machineLastData[0]?.checkSheet_data?.checkSheet[j].cycle,
              yearOfCheckSheet:
                machineLastData[0]?.checkSheet_data?.current_year,
            })
          );
        }
      }
      // if(getSelectedMachineChecksheet){
      res.json({ selectedMachineSkipData });
      // }
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("User id not received!!!");
    }
  }
);

//add data of implementation when operator worked on machine PM
router.post(
  "/postSkipWorkedData",
  upload1.single("photoUpload"),
  async (req, res) => {
    try {
      const {
        workedOnPM,
        remarksOfImplementation,
        reasonForDelayWhenSkip,
        schedule_month,
        pmTime,
        machineId,
        tableRowId,
        yearOfCheckSheet,
        PMworkedTMName,
        PMworkedTMNo,
        // monthForCompareSystemMonth,
        // previousMonth,
        abnormalityRemarks,
        abnormalityStatus,
        targetDate,
        spareParts,
        partName,
        partNo,
        cost,
        completionDateOfInspection,
      } = req.body;

      const loggedUserData = req.rootUser;

      let selectedSupportedTM = JSON.parse(req.body?.selectedSupportedTM);

      let arrayForPMData = [];
      arrayForPMData.push(1, workedOnPM, remarksOfImplementation);

      let plannedPMCount = 0;
      let completedPMCount = 0;

      let updateStatus;
      let keyOfCompletedMonthPM = `checkSheet_data.$[outer].PMStatus.${schedule_month}`;
      // let keyOfCarriedCompletedMonthPM = `checkSheet_data.$[outer].PMStatus.${previousMonth}`
      // let keyOfPreviousMonth = `checkSheet_data.$[outer].checkSheet.$[inner].planningTableAnimationArray2.${previousMonth}`

      let arrayForUpdatePreviousMonthDelayPMData = [];
      arrayForUpdatePreviousMonthDelayPMData.push(1, "delay");

      let keyOfMonth = `checkSheet_data.$[outer].checkSheet.$[inner].planningTableAnimationArray2.${schedule_month}`;
      let keyOfPMOkImage = `checkSheet_data.$[outer].checkSheet.$[inner].PMOkImage.${schedule_month}`;
      let keyOfCompletionDateOfInspection = `checkSheet_data.$[outer].checkSheet.$[inner].completionDateOfInspection.${schedule_month}`;
      let keyOfReasonForDelayWhenSkip = `checkSheet_data.$[outer].checkSheet.$[inner].reasonForDelayWhenSkip.${schedule_month}`;
      let keyOfFlagOfDoneWithDelayForOneMonth = `checkSheet_data.$[outer].flagOfDoneWithDelayForOneMonth.${schedule_month}`;
      let keyOfInspectionCompletionBy = `checkSheet_data.$[outer].checkSheet.$[inner].inspectionCompletionBy.${schedule_month}`;

      //for abnormality
      let keyOfAbnormalityRemarks = `checkSheet_data.$[outer].checkSheet.$[inner].abnormalityDetails.${schedule_month}.abnormalityRemarks`;
      let keyOfAbnormalityStatus = `checkSheet_data.$[outer].checkSheet.$[inner].abnormalityDetails.${schedule_month}.abnormalityStatus`;
      let keyOfTargetdate = `checkSheet_data.$[outer].checkSheet.$[inner].abnormalityDetails.${schedule_month}.targetDate`;
      let keyOfAbnormalityImage = `checkSheet_data.$[outer].checkSheet.$[inner].abnormalityDetails.${schedule_month}.PMuploadedImage`;

      //for spare parts
      let keyOfSpareParts = `checkSheet_data.$[outer].checkSheet.$[inner].spareDetails.${schedule_month}.spareParts`;
      let keyOfPartName = `checkSheet_data.$[outer].checkSheet.$[inner].spareDetails.${schedule_month}.partName`;
      let keyOfPartNo = `checkSheet_data.$[outer].checkSheet.$[inner].spareDetails.${schedule_month}.partNo`;
      let keyOfCost = `checkSheet_data.$[outer].checkSheet.$[inner].spareDetails.${schedule_month}.cost`;

      let keyOfPMworkedTMName = `checkSheet_data.$[outer].PMworkedTMName`;

      let currentMonth = new Date().getMonth();

      //for add time and worked PM operator for skip pm data
      let PMworkedTMNameArray = {
        Apr: [],

        May: [],

        June: [],

        July: [],

        Aug: [],

        Sep: [],

        Oct: [],

        Nov: [],

        Dec: [],

        Jan: [],

        Feb: [],

        Mar: [],
      };
      let keyOfMonthPMworkedTMName = `checkSheet_data.$[outer].PMworkedTMName.${schedule_month}`;
      let workedOperator = {
        tm_name: PMworkedTMName,
        tm_no: parseInt(PMworkedTMNo),
      };
      selectedSupportedTM.push(workedOperator);
      // console.log(selectedSupportedTM)

      let keyOfTotalWorkedPMTime = `checkSheet_data.$[outer].totalPMTime.${schedule_month}.totalWorkedPMTime`;
      let keyOfSupportingTMData = `checkSheet_data.$[outer].totalPMTime.${schedule_month}.supportingTMData`;
      // let keyOfSupportingTMDataTm_name = `checkSheet_data.$[outer].totalPMTime.${schedule_month}.supportingTMData.tm_name`
      // let keyOfSupportingTMDataTm_no = `checkSheet_data.$[outer].totalPMTime.${schedule_month}.supportingTMData.tm_no`
      let keyOfTotalWorkedPMTimeIncrement = `checkSheet_data.$.totalPMTime.${schedule_month}.totalWorkedPMTime`;

      let keyOfFindSupportingTM = `checkSheet_data.totalPMTime.${schedule_month}.supportingTMData.tm_no`;
      let keyOfSupportingTMDataWorkedIncrementTime = `checkSheet_data.$[outer].totalPMTime.${schedule_month}.supportingTMData.$[inner].workedTime`;

      let keyOfDelayRemarksMonthPM = `checkSheet_data.$[outer].PMDelayRemark.${schedule_month}`;
      PMworkedTMNameArray[schedule_month].push(PMworkedTMName);

      // console.log(perticularMachine)
      let addPmData;
      if (workedOnPM === "Yes") {
        if (req.file === undefined) {
          addPmData = await Machine.updateOne(
            { machine_code: machineId },
            {
              $set: {
                // [keyOfMonth]: {$each:[workedOnPM, remarksOfImplementation]}
                [keyOfMonth]: arrayForPMData,
                [keyOfCompletionDateOfInspection]: completionDateOfInspection,
                [keyOfInspectionCompletionBy]: loggedUserData.tm_name,
                [keyOfReasonForDelayWhenSkip]: reasonForDelayWhenSkip,
              },
            },
            {
              arrayFilters: [
                { "outer.current_year": yearOfCheckSheet },
                { "inner.tableRowId": tableRowId },
              ],
            }
          );
        } else {
          let PMuploadedImage = req.file.filename;
          fileNameForLogHistory = req?.file?.filename;

          addPmData = await Machine.updateOne(
            { machine_code: machineId },
            {
              $set: {
                // [keyOfMonth]: {$each:[workedOnPM, remarksOfImplementation]}
                [keyOfMonth]: arrayForPMData,
                [keyOfPMOkImage]: PMuploadedImage,
                [keyOfCompletionDateOfInspection]: completionDateOfInspection,
                [keyOfInspectionCompletionBy]: loggedUserData.tm_name,
                [keyOfReasonForDelayWhenSkip]: reasonForDelayWhenSkip,
              },
            },
            {
              arrayFilters: [
                { "outer.current_year": yearOfCheckSheet },
                { "inner.tableRowId": tableRowId },
              ],
            }
          );
          // console.log(addPmData)
        }

        // console.log(result)
      } else if (workedOnPM === "Rectify") {
        if (req.file === undefined) {
          addPmData = await Machine.updateOne(
            { machine_code: machineId },
            {
              $set: {
                // [keyOfMonth]: {$each:[workedOnPM, remarksOfImplementation]},
                [keyOfMonth]: arrayForPMData,
                [keyOfAbnormalityRemarks]: abnormalityRemarks,
                [keyOfAbnormalityStatus]: abnormalityStatus,
                [keyOfSpareParts]: spareParts,
                [keyOfPartName]: partName,
                [keyOfPartNo]: partNo,
                [keyOfCost]: cost,
                [keyOfCompletionDateOfInspection]: completionDateOfInspection,
                [keyOfInspectionCompletionBy]: loggedUserData.tm_name,
                [keyOfReasonForDelayWhenSkip]: reasonForDelayWhenSkip,
              },
            },
            {
              arrayFilters: [
                { "outer.current_year": yearOfCheckSheet },
                { "inner.tableRowId": tableRowId },
              ],
            }
          );
        } else {
          let PMuploadedImage = req.file.filename;
          fileNameForLogHistory = req?.file?.filename;

          addPmData = await Machine.updateOne(
            { machine_code: machineId },
            {
              $set: {
                // [keyOfMonth]: {$each:[workedOnPM, remarksOfImplementation]},
                [keyOfMonth]: arrayForPMData,
                [keyOfAbnormalityRemarks]: abnormalityRemarks,
                [keyOfAbnormalityStatus]: abnormalityStatus,
                [keyOfAbnormalityImage]: PMuploadedImage,
                [keyOfSpareParts]: spareParts,
                [keyOfPartName]: partName,
                [keyOfPartNo]: partNo,
                [keyOfCost]: cost,
                [keyOfCompletionDateOfInspection]: completionDateOfInspection,
                [keyOfInspectionCompletionBy]: loggedUserData.tm_name,
                [keyOfReasonForDelayWhenSkip]: reasonForDelayWhenSkip,
              },
            },
            {
              arrayFilters: [
                { "outer.current_year": yearOfCheckSheet },
                { "inner.tableRowId": tableRowId },
              ],
            }
          );
        }
      } else {
        if (req.file === undefined) {
          addPmData = await Machine.updateOne(
            { machine_code: machineId },
            {
              $set: {
                // [keyOfMonth]: {$each:[workedOnPM, remarksOfImplementation]},
                [keyOfMonth]: arrayForPMData,
                [keyOfAbnormalityRemarks]: abnormalityRemarks,
                [keyOfAbnormalityStatus]: abnormalityStatus,
                [keyOfTargetdate]: targetDate,
                [keyOfSpareParts]: spareParts,
                [keyOfPartName]: partName,
                [keyOfPartNo]: partNo,
                [keyOfCost]: cost,
                [keyOfCompletionDateOfInspection]: completionDateOfInspection,
                [keyOfInspectionCompletionBy]: loggedUserData.tm_name,
                [keyOfReasonForDelayWhenSkip]: reasonForDelayWhenSkip,
              },
            },
            {
              arrayFilters: [
                { "outer.current_year": yearOfCheckSheet },
                { "inner.tableRowId": tableRowId },
              ],
            }
          );
        } else {
          let PMuploadedImage = req.file.filename;
          fileNameForLogHistory = req?.file?.filename;

          addPmData = await Machine.updateOne(
            { machine_code: machineId },
            {
              $set: {
                // [keyOfMonth]: {$each:[workedOnPM, remarksOfImplementation]},
                [keyOfMonth]: arrayForPMData,
                [keyOfAbnormalityRemarks]: abnormalityRemarks,
                [keyOfAbnormalityStatus]: abnormalityStatus,
                [keyOfTargetdate]: targetDate,
                [keyOfAbnormalityImage]: PMuploadedImage,
                [keyOfSpareParts]: spareParts,
                [keyOfPartName]: partName,
                [keyOfPartNo]: partNo,
                [keyOfCost]: cost,
                [keyOfCompletionDateOfInspection]: completionDateOfInspection,
                [keyOfInspectionCompletionBy]: loggedUserData?.tm_name,
                [keyOfReasonForDelayWhenSkip]: reasonForDelayWhenSkip,
              },
            },
            {
              arrayFilters: [
                { "outer.current_year": yearOfCheckSheet },
                { "inner.tableRowId": tableRowId },
              ],
            }
          );
        }
      }
      //     // console.log(addPmData)
      // const machineDataAfterSaveAllData = await Machine.findOne({ machine_code: machineId })
      let machineDataAfterSaveAllData = await Machine.aggregate([
        {
          $match: {
            machine_code: machineId,
          },
        },
        {
          $unwind: "$checkSheet_data",
        },
        {
          $match: {
            "checkSheet_data.current_year": yearOfCheckSheet,
          },
        },
        {
          $project: {
            machine_code: 1,
            machine_name: 1,
            machine_nickname: 1,
            machine_sequence: 1,
            installation_date: 1,
            maker_name: 1,
            maker_sr_no: 1,
            manufacturingDate: 1,
            isPM: 1,
            line_names: 1,
            checkSheet_data: 1,
          },
        },
      ]);

      machineDataAfterSaveAllData[0].checkSheet_data.checkSheet.map((key) => {
        //for done with delay status after skip data worked
        if (
          key.planningTableAnimationArray2[schedule_month][0] === "1" &&
          !key?.isDeleted
        ) {
          plannedPMCount = plannedPMCount + 1;
        }
        if (
          key.planningTableAnimationArray2[schedule_month].length >= 2 &&
          key.planningTableAnimationArray2[schedule_month][0] === "1" &&
          (key.planningTableAnimationArray2[schedule_month][1] === "Yes" ||
            key.planningTableAnimationArray2[schedule_month][1] === "Rectify" ||
            key.planningTableAnimationArray2[schedule_month][1] === "No") &&
          !key?.isDeleted
        ) {
          completedPMCount = completedPMCount + 1;
        }
      });
      //for done with delay status of Skip PM data not including 1/1M & 1/2M
      if (plannedPMCount) {
        if (plannedPMCount === completedPMCount) {
          updateStatus = await Machine.updateOne(
            { machine_code: machineId },
            {
              $set: {
                [keyOfCompletedMonthPM]: "Done with delay",
                [keyOfFlagOfDoneWithDelayForOneMonth]: currentMonth,
              },
            },
            {
              arrayFilters: [{ "outer.current_year": yearOfCheckSheet }],
            }
          );
        }
      }

      //for add time and worked PM operator for skip pm data
      let updateTotalTimeAndWorkedAndSupportingOperator, incrementTotalTime;
      if (
        machineDataAfterSaveAllData[0].checkSheet_data.totalPMTime?.[
          schedule_month
        ].totalWorkedPMTime != undefined
      ) {
        incrementTotalTime = await Machine.updateOne(
          {
            machine_code: machineId,
            "checkSheet_data.current_year": yearOfCheckSheet,
          },
          {
            $inc: {
              [keyOfTotalWorkedPMTimeIncrement]: pmTime,
            },
          }
        );
        for (let i = 0; i < selectedSupportedTM.length; i++) {
          let isOperatorOrNot =
            machineDataAfterSaveAllData[0].checkSheet_data.totalPMTime[
              schedule_month
            ].supportingTMData.some(
              (value) => value.tm_no === selectedSupportedTM[i].tm_no
            );
          if (isOperatorOrNot) {
            updateTotalTimeAndWorkedAndSupportingOperator =
              await Machine.updateOne(
                {
                  machine_code: machineId,
                  "checkSheet_data.current_year": yearOfCheckSheet,
                  [keyOfFindSupportingTM]: selectedSupportedTM[i].tm_no,
                },
                {
                  // $inc: { [keyOfTotalWorkedPMTimeIncrement]: pmTime },
                  $inc: {
                    [keyOfSupportingTMDataWorkedIncrementTime]: pmTime,
                  },
                },
                {
                  arrayFilters: [
                    { "outer.current_year": yearOfCheckSheet },
                    { "inner.tm_no": selectedSupportedTM[i].tm_no },
                  ],
                }
              );
          } else {
            updateTotalTimeAndWorkedAndSupportingOperator =
              await Machine.updateOne(
                { machine_code: machineId },
                {
                  $push: {
                    [keyOfSupportingTMData]: {
                      tm_name: selectedSupportedTM[i].tm_name,
                      tm_no: selectedSupportedTM[i].tm_no,
                      workedTime: pmTime,
                    },
                  },
                },
                {
                  arrayFilters: [{ "outer.current_year": yearOfCheckSheet }],
                }
              );
          }
        }
      } else {
        for (let i = 0; i < selectedSupportedTM.length; i++) {
          updateTotalTimeAndWorkedAndSupportingOperator =
            await Machine.updateOne(
              { machine_code: machineId },
              {
                $set: {
                  [keyOfTotalWorkedPMTime]: pmTime,
                },
                $push: {
                  [keyOfSupportingTMData]: {
                    tm_name: selectedSupportedTM[i].tm_name,
                    tm_no: selectedSupportedTM[i].tm_no,
                    workedTime: pmTime,
                  },
                },
              },
              {
                arrayFilters: [{ "outer.current_year": yearOfCheckSheet }],
              }
            );
        }
        // console.log(updateTotalTimeAndWorkedAndSupportingOperator)
      }

      let updatePMworkedTMName;
      if (
        machineDataAfterSaveAllData[0].checkSheet_data.PMworkedTMName !=
        undefined
      ) {
        if (
          !machineDataAfterSaveAllData[0]?.checkSheet_data?.PMworkedTMName[
            monthForCompareSystemMonth
          ].includes(PMworkedTMName)
        ) {
          updatePMworkedTMName = await Machine.updateOne(
            {
              machine_code: machineId,
            },
            {
              $set: {
                [keyOfDelayRemarksMonthPM]: delayRemarks,
              },
              $push: {
                [keyOfMonthPMworkedTMName]: PMworkedTMName,
              },
            },
            {
              arrayFilters: [{ "outer.current_year": yearOfCheckSheet }],
            }
          );
        }
      } else {
        updatePMworkedTMName = await Machine.updateOne(
          {
            machine_code: machineId,
          },
          {
            $set: {
              [keyOfPMworkedTMName]: PMworkedTMNameArray,
            },
          },
          {
            arrayFilters: [{ "outer.current_year": yearOfCheckSheet }],
          }
        );
      }

      if (
        addPmData ||
        updateStatus ||
        updateTotalTimeAndWorkedAndSupportingOperator ||
        updatePMworkedTMName
      ) {
        return res.status(201).json("Checksheet worked data posted!!!");
      } else {
        return res.status(400).json("Checksheet worked data not posted!!!");
      }
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("Data not valid or received !!!");
    }
  }
);

//add and update completion target date of skip data
router.post(
  "/updateCompletionTargetDateForSkipPM",
  authenticate,
  async (req, res) => {
    try {
      const { updatedRow } = req.body;
      console.log(updatedRow);
      if (!updatedRow) {
        return res.status(422).send("Employee number is not valid!!!");
      }

      let completionTargetDateArray = {
        Apr: "",

        May: "",

        June: "",

        July: "",

        Aug: "",

        Sep: "",

        Oct: "",

        Nov: "",

        Dec: "",

        Jan: "",

        Feb: "",

        Mar: "",
      };

      let machineData = await Machine.aggregate([
        {
          $match: {
            machine_code: updatedRow.machine_code,
          },
        },
        {
          $unwind: "$checkSheet_data",
        },
        {
          $match: {
            "checkSheet_data.current_year": updatedRow.yearOfCheckSheet,
          },
        },
        {
          $project: {
            machine_code: 1,
            machine_name: 1,
            machine_nickname: 1,
            machine_sequence: 1,
            installation_date: 1,
            maker_name: 1,
            maker_sr_no: 1,
            manufacturingDate: 1,
            isPM: 1,
            line_names: 1,
            checkSheet_data: 1,
          },
        },
      ]);

      completionTargetDateArray[updatedRow.schedule_month] =
        updatedRow.completionTargetDate;
      let keyOfCompletiontargertDateOfSkipPM = `checkSheet_data.$[outer].completionTargetDate.${updatedRow.schedule_month}`;
      let keyOfCompletiontargertDateOfSkipPMWithAllMonth = `checkSheet_data.$[outer].completionTargetDate`;

      let updateCompletionTargetDate;

      console.log(machineData[0]?.checkSheet_data?.completionTargetDate);

      if (machineData[0]?.checkSheet_data?.completionTargetDate) {
        updateCompletionTargetDate = await Machine.updateOne(
          {
            machine_code: updatedRow.machine_code,
          },
          {
            $set: {
              [keyOfCompletiontargertDateOfSkipPM]:
                updatedRow.completionTargetDate,
            },
          },
          {
            arrayFilters: [
              { "outer.current_year": updatedRow.yearOfCheckSheet },
            ],
          }
        );
      } else {
        updateCompletionTargetDate = await Machine.updateOne(
          {
            machine_code: updatedRow.machine_code,
          },
          {
            $set: {
              [keyOfCompletiontargertDateOfSkipPMWithAllMonth]:
                completionTargetDateArray,
            },
          },
          {
            arrayFilters: [
              { "outer.current_year": updatedRow.yearOfCheckSheet },
            ],
          }
        );
      }

      console.log(updateCompletionTargetDate);
      if (updateCompletionTargetDate) {
        res.status(201).json({ message: "Completion date added" });
      }
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      // console.log("2032", error)
      console.log("Filename not received");
    }
  }
);

router.post(
  "/sendRequestForApprovalOfSkipPMDataWork",
  authenticate,
  async (req, res) => {
    try {
      const {
        mtd_hod_list,
        mtd_hos_list,
        prd_hod_list,
        prd_hos_list,
        reasonForDelayOfTL,
        skipApprovalStatusData,
      } = req.body;
      // console.log(mtd_hod_list, mtd_hos_list, prd_hod_list, prd_hos_list, reasonForDelayOfTL)
      const loggedUserData = req.rootUser;
      // console.log(updatedRow)

      // console.log(
      //     mtd_hod_list, mtd_hos_list, prd_hod_list, prd_hos_list, reasonForDelayOfTL
      // )
      if (
        !mtd_hod_list ||
        !mtd_hos_list ||
        !prd_hod_list ||
        !prd_hos_list ||
        !reasonForDelayOfTL
      ) {
        return res.status(422).send("Employee number is not valid!!!");
      }
      const approvalStatusOfMTDHOS = "Pending";
      const approvalStatusOfMTDHOD = "Pending";
      const approvalStatusOfPRDHOS = "Pending";
      const approvalStatusOfPRDHOD = "Pending";
      let newApprovalOfSkipPM, updateStatusOfSkippedPM;

      const sectionInfo = await Section.findOne({
        section_id: req?.rootUser?.section_data?.split("-")?.[0],
      });
      // console.log("----------", sectionInfo)

      console.log(skipApprovalStatusData);

      if (skipApprovalStatusData) {
        updateStatusOfSkippedPM = await ApprovalOfSkipPM.updateOne(
          {
            _id: skipApprovalStatusData?._id,
          },
          {
            $set: {
              reasonForDelayOfTL,
              rejectedRemarksOfSkipPMMachines: "",
              skippedDataApprovalSender: {
                senderTLNo: loggedUserData?.tm_no,
                senderTLName: loggedUserData?.tm_name,
                senderTLEmail: loggedUserData?.email,
              },
              assignAndApprovedHOSlist: {
                assignMTDHOSemail: mtd_hos_list?.email,
                assignMTDHOSname: mtd_hos_list?.tm_name,
              },
              assignAndApprovedMTDHODlist: {
                assignMTDHODname: mtd_hod_list?.tm_name,
                assignMTDHODemail: mtd_hod_list?.email,
              },
              assignAndApprovedPRDHOSlist: {
                assignPRDHOSname: prd_hos_list.tm_name,
                assignPRDHOSemail: prd_hos_list.email,
              },
              assignAndApprovedPRDHODlist: {
                assignPRDHODname: prd_hod_list?.tm_name,
                assignPRDHODemail: prd_hod_list?.email,
              },
              approvalStatusOfMTDHOS: "Pending",
              approvalStatusOfMTDHOD: "Pending",
              approvalStatusOfPRDHOS: "Pending",
              approvalStatusOfPRDHOD: "Pending",
            },
          }
        );
      } else if (sectionInfo?.dashboardLevel === "Yes") {
        newApprovalOfSkipPM = await new ApprovalOfSkipPM({
          section_id: sectionInfo?._id,
          reasonForDelayOfTL,
          skippedDataApprovalSender: {
            senderTLNo: loggedUserData?.tm_no,
            senderTLName: loggedUserData?.tm_name,
            senderTLEmail: loggedUserData?.email,
          },
          assignAndApprovedHOSlist: {
            assignMTDHOSemail: mtd_hos_list?.email,
            assignMTDHOSname: mtd_hos_list?.tm_name,
          },
          assignAndApprovedMTDHODlist: {
            assignMTDHODname: mtd_hod_list?.tm_name,
            assignMTDHODemail: mtd_hod_list?.email,
          },
          assignAndApprovedPRDHOSlist: {
            assignPRDHOSname: prd_hos_list?.tm_name,
            assignPRDHOSemail: prd_hos_list?.email,
          },
          assignAndApprovedPRDHODlist: {
            assignPRDHODname: prd_hod_list?.tm_name,
            assignPRDHODemail: prd_hod_list?.email,
          },
          approvalStatusOfMTDHOS: "Pending",
          approvalStatusOfMTDHOD: "Pending",
          approvalStatusOfPRDHOS: "Pending",
          approvalStatusOfPRDHOD: "Pending",
        });
        await newApprovalOfSkipPM.save();
      } else {
        subSectionsData = await SubSection.findOne({
          subSection_id: req?.rootUser?.subSection_data?.[0]?.split("-")?.[0],
        }).sort({ subSection_sequence: 1 });

        // console.log("****", subSectionsData)

        newApprovalOfSkipPM = await new ApprovalOfSkipPM({
          subSection_id: subSectionsData?._id,
          reasonForDelayOfTL,
          skippedDataApprovalSender: {
            senderTLNo: loggedUserData?.tm_no,
            senderTLName: loggedUserData?.tm_name,
            senderTLEmail: loggedUserData?.email,
          },
          assignAndApprovedHOSlist: {
            assignMTDHOSemail: mtd_hos_list?.email,
            assignMTDHOSname: mtd_hos_list?.tm_name,
          },
          assignAndApprovedMTDHODlist: {
            assignMTDHODname: mtd_hod_list?.tm_name,
            assignMTDHODemail: mtd_hod_list?.email,
          },
          assignAndApprovedPRDHOSlist: {
            assignPRDHOSname: prd_hos_list?.tm_name,
            assignPRDHOSemail: prd_hos_list?.email,
          },
          assignAndApprovedPRDHODlist: {
            assignPRDHODname: prd_hod_list?.tm_name,
            assignPRDHODemail: prd_hod_list?.email,
          },
          approvalStatusOfMTDHOS: "Pending",
          approvalStatusOfMTDHOD: "Pending",
          approvalStatusOfPRDHOS: "Pending",
          approvalStatusOfPRDHOD: "Pending",
        });
        await newApprovalOfSkipPM.save();
      }

      sendApprovalOfSkippedPM(
        loggedUserData.tm_no,
        loggedUserData.tm_name,
        mtd_hos_list?.email,
        mtd_hod_list?.email,
        prd_hos_list?.email,
        prd_hod_list?.email,
        approvalStatusOfMTDHOS,
        approvalStatusOfMTDHOD,
        approvalStatusOfPRDHOS,
        approvalStatusOfPRDHOD,
        undefined,
        reasonForDelayOfTL
      );

      res.status(201).json({ message: "Approval send" });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log("2032", error);
      console.log("Filename not received");
    }
  }
);

router.post(
  "/getDataOfSkippedApprovalStatus",
  authenticate,
  async (req, res) => {
    try {
      const { sectionOrSubSectionData } = req.body;

      let getApprovalDataOfSkipPM;

      if (!sectionOrSubSectionData?.dashboardLevel) {
        getApprovalDataOfSkipPM = await ApprovalOfSkipPM.findOne({
          subSection_id: sectionOrSubSectionData?._id,
        });
      } else if (sectionOrSubSectionData?.dashboardLevel === "No") {
        getApprovalDataOfSkipPM = await ApprovalOfSkipPM.findOne({
          subSection_id: sectionOrSubSectionData?._id,
        });
      } else {
        getApprovalDataOfSkipPM = await ApprovalOfSkipPM.findOne({
          section_id: sectionOrSubSectionData?._id,
        });
      }

      // console.log(sectionOrSubSectionData)

      res.json({ getApprovalDataOfSkipPM: getApprovalDataOfSkipPM });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log("User data not send or get!!!");
    }
  }
);

//all skip machines data approved by different deparment and grade Section Admin
router.post(
  "/approvedSkipMachinesBySectionAdmins",
  authenticate,
  async (req, res) => {
    try {
      const {
        request,
        rejectedRemarksOfSkipPMMachines,
        skipApprovalStatusData,
        selectedSectionOrSubSection,
      } = req.body;
      // console.log(skipApprovalStatusData)
      const loggedUserData = req.rootUser;

      // console.log(selectedSectionOrSubSection)

      const refObjectForFindingAndUpdatingDocumentInDB =
        selectedSectionOrSubSection?.dashboardLevel === "Yes"
          ? {
              section_id: selectedSectionOrSubSection?._id,
            }
          : {
              subSection_id: selectedSectionOrSubSection?._id,
            };

      // !selectedSectionOrSubSection?.dashboardLevel ? {
      //     subSection_id: selectedSectionOrSubSection?._id
      // } : selectedSectionOrSubSection?.dashboardLevel === "No" ? {
      //     subSection_id: selectedSectionOrSubSection?._id
      // } : {
      //     section_id: selectedSectionOrSubSection?._id
      // }

      // console.log(refObjectForFindingAndUpdatingDocumentInDB)

      let updateStatusOfSkipPM;
      if (request === "Yes") {
        if (skipApprovalStatusData.approvalStatusOfMTDHOS === "Pending") {
          let approvalStatusOfMTDHOS = "Accepted";
          updateStatusOfSkipPM = await ApprovalOfSkipPM.updateOne(
            refObjectForFindingAndUpdatingDocumentInDB,
            {
              $set: {
                approvalStatusOfMTDHOS,
              },
            }
          );
          sendApprovalOfSkippedPM(
            loggedUserData.tm_no,
            loggedUserData.tm_name,
            skipApprovalStatusData.skippedDataApprovalSender?.senderTLEmail,
            skipApprovalStatusData.assignAndApprovedMTDHODlist
              .assignMTDHODemail,
            skipApprovalStatusData.assignAndApprovedPRDHOSlist
              .assignPRDHOSemail,
            skipApprovalStatusData.assignAndApprovedPRDHODlist
              .assignPRDHODemail,
            approvalStatusOfMTDHOS,
            skipApprovalStatusData.approvalStatusOfMTDHOD,
            skipApprovalStatusData.approvalStatusOfPRDHOS,
            skipApprovalStatusData.approvalStatusOfPRDHOD,
            undefined,
            skipApprovalStatusData.reasonForDelayOfTL
          );
        } else if (
          skipApprovalStatusData.approvalStatusOfMTDHOS === "Accepted" &&
          skipApprovalStatusData.approvalStatusOfMTDHOD === "Pending"
        ) {
          let approvalStatusOfMTDHOD = "Accepted";
          updateStatusOfSkipPM = await ApprovalOfSkipPM.updateOne(
            refObjectForFindingAndUpdatingDocumentInDB,
            {
              $set: {
                approvalStatusOfMTDHOD,
              },
            }
          );
          sendApprovalOfSkippedPM(
            loggedUserData.tm_no,
            loggedUserData.tm_name,
            skipApprovalStatusData.skippedDataApprovalSender.senderTLEmail,
            skipApprovalStatusData.assignAndApprovedHOSlist.assignMTDHOSemail,
            skipApprovalStatusData.assignAndApprovedPRDHOSlist
              .assignPRDHOSemail,
            skipApprovalStatusData.assignAndApprovedPRDHODlist
              .assignPRDHODemail,
            skipApprovalStatusData.approvalStatusOfMTDHOS,
            approvalStatusOfMTDHOD,
            skipApprovalStatusData.approvalStatusOfPRDHOS,
            skipApprovalStatusData.approvalStatusOfPRDHOD,
            undefined,
            skipApprovalStatusData.reasonForDelayOfTL
          );
        } else if (
          skipApprovalStatusData.approvalStatusOfMTDHOS === "Accepted" &&
          skipApprovalStatusData.approvalStatusOfMTDHOD === "Accepted" &&
          skipApprovalStatusData.approvalStatusOfPRDHOS === "Pending"
        ) {
          let approvalStatusOfPRDHOS = "Accepted";
          updateStatusOfSkipPM = await ApprovalOfSkipPM.updateOne(
            refObjectForFindingAndUpdatingDocumentInDB,
            {
              $set: {
                approvalStatusOfPRDHOS,
              },
            }
          );
          sendApprovalOfSkippedPM(
            loggedUserData.tm_no,
            loggedUserData.tm_name,
            skipApprovalStatusData.skippedDataApprovalSender.senderTLEmail,
            skipApprovalStatusData.assignAndApprovedHOSlist.assignMTDHOSemail,
            skipApprovalStatusData.assignAndApprovedMTDHODlist
              .assignMTDHODemail,
            skipApprovalStatusData.assignAndApprovedPRDHODlist
              .assignPRDHODemail,
            skipApprovalStatusData.approvalStatusOfMTDHOS,
            skipApprovalStatusData.approvalStatusOfMTDHOD,
            approvalStatusOfPRDHOS,
            skipApprovalStatusData.approvalStatusOfPRDHOD,
            undefined,
            skipApprovalStatusData.reasonForDelayOfTL
          );
        } else if (
          skipApprovalStatusData.approvalStatusOfMTDHOS === "Accepted" &&
          skipApprovalStatusData.approvalStatusOfMTDHOD === "Accepted" &&
          skipApprovalStatusData.approvalStatusOfPRDHOS === "Accepted" &&
          skipApprovalStatusData.approvalStatusOfPRDHOD === "Pending"
        ) {
          let approvalStatusOfPRDHOD = "Accepted";
          updateStatusOfSkipPM = await ApprovalOfSkipPM.updateOne(
            refObjectForFindingAndUpdatingDocumentInDB,
            {
              $set: {
                approvalStatusOfPRDHOD,
              },
            }
          );
          sendApprovalOfSkippedPM(
            loggedUserData.tm_no,
            loggedUserData.tm_name,
            skipApprovalStatusData.skippedDataApprovalSender.senderTLEmail,
            skipApprovalStatusData.assignAndApprovedHOSlist.assignMTDHOSemail,
            skipApprovalStatusData.assignAndApprovedMTDHODlist
              .assignMTDHODemail,
            skipApprovalStatusData.assignAndApprovedPRDHOSlist
              .assignPRDHOSemail,
            skipApprovalStatusData.approvalStatusOfMTDHOS,
            skipApprovalStatusData.approvalStatusOfMTDHOD,
            skipApprovalStatusData.approvalStatusOfPRDHOS,
            approvalStatusOfPRDHOD,
            undefined,
            skipApprovalStatusData.reasonForDelayOfTL
          );
        }
      } else {
        if (skipApprovalStatusData.approvalStatusOfMTDHOS === "Pending") {
          let approvalStatusOfMTDHOS = "Rejected";
          updateStatusOfSkipPM = await ApprovalOfSkipPM.updateOne(
            refObjectForFindingAndUpdatingDocumentInDB,
            {
              $set: {
                approvalStatusOfMTDHOS,
                rejectedRemarksOfSkipPMMachines,
              },
            }
          );
          sendApprovalOfSkippedPM(
            loggedUserData.tm_no,
            loggedUserData.tm_name,
            skipApprovalStatusData.skippedDataApprovalSender.senderTLEmail,
            skipApprovalStatusData.assignAndApprovedMTDHODlist
              .assignMTDHODemail,
            skipApprovalStatusData.assignAndApprovedPRDHOSlist
              .assignPRDHOSemail,
            skipApprovalStatusData.assignAndApprovedPRDHODlist
              .assignPRDHODemail,
            approvalStatusOfMTDHOS,
            skipApprovalStatusData.approvalStatusOfMTDHOD,
            skipApprovalStatusData.approvalStatusOfPRDHOS,
            skipApprovalStatusData.approvalStatusOfPRDHOD,
            rejectedRemarksOfSkipPMMachines,
            skipApprovalStatusData.reasonForDelayOfTL
          );
        } else if (
          skipApprovalStatusData.approvalStatusOfMTDHOS === "Accepted" &&
          skipApprovalStatusData.approvalStatusOfMTDHOD === "Pending"
        ) {
          let approvalStatusOfMTDHOD = "Rejected";
          updateStatusOfSkipPM = await ApprovalOfSkipPM.updateOne(
            refObjectForFindingAndUpdatingDocumentInDB,
            {
              $set: {
                approvalStatusOfMTDHOD,
                rejectedRemarksOfSkipPMMachines,
              },
            }
          );
          sendApprovalOfSkippedPM(
            loggedUserData.tm_no,
            loggedUserData.tm_name,
            skipApprovalStatusData.skippedDataApprovalSender.senderTLEmail,
            skipApprovalStatusData.assignAndApprovedHOSlist.assignMTDHOSemail,
            skipApprovalStatusData.assignAndApprovedPRDHOSlist
              .assignPRDHOSemail,
            skipApprovalStatusData.assignAndApprovedPRDHODlist
              .assignPRDHODemail,
            skipApprovalStatusData.approvalStatusOfMTDHOS,
            approvalStatusOfMTDHOD,
            skipApprovalStatusData.approvalStatusOfPRDHOS,
            skipApprovalStatusData.approvalStatusOfPRDHOD,
            rejectedRemarksOfSkipPMMachines,
            skipApprovalStatusData.reasonForDelayOfTL
          );
        } else if (
          skipApprovalStatusData.approvalStatusOfMTDHOS === "Accepted" &&
          skipApprovalStatusData.approvalStatusOfMTDHOD === "Accepted" &&
          skipApprovalStatusData.approvalStatusOfPRDHOS === "Pending"
        ) {
          let approvalStatusOfPRDHOS = "Rejected";
          updateStatusOfSkipPM = await ApprovalOfSkipPM.updateOne(
            refObjectForFindingAndUpdatingDocumentInDB,
            {
              $set: {
                approvalStatusOfPRDHOS,
                rejectedRemarksOfSkipPMMachines,
              },
            }
          );
          sendApprovalOfSkippedPM(
            loggedUserData.tm_no,
            loggedUserData.tm_name,
            skipApprovalStatusData.skippedDataApprovalSender.senderTLEmail,
            skipApprovalStatusData.assignAndApprovedHOSlist.assignMTDHOSemail,
            skipApprovalStatusData.assignAndApprovedMTDHODlist
              .assignMTDHODemail,
            skipApprovalStatusData.assignAndApprovedPRDHODlist
              .assignPRDHODemail,
            skipApprovalStatusData.approvalStatusOfMTDHOS,
            skipApprovalStatusData.approvalStatusOfMTDHOD,
            approvalStatusOfPRDHOS,
            skipApprovalStatusData.approvalStatusOfPRDHOD,
            rejectedRemarksOfSkipPMMachines,
            skipApprovalStatusData.reasonForDelayOfTL
          );
        } else if (
          skipApprovalStatusData.approvalStatusOfMTDHOS === "Accepted" &&
          skipApprovalStatusData.approvalStatusOfMTDHOD === "Accepted" &&
          skipApprovalStatusData.approvalStatusOfPRDHOS === "Accepted" &&
          skipApprovalStatusData.approvalStatusOfPRDHOD === "Pending"
        ) {
          let approvalStatusOfPRDHOD = "Rejected";
          updateStatusOfSkipPM = await ApprovalOfSkipPM.updateOne(
            refObjectForFindingAndUpdatingDocumentInDB,
            {
              $set: {
                approvalStatusOfPRDHOD,
                rejectedRemarksOfSkipPMMachines,
              },
            }
          );
          sendApprovalOfSkippedPM(
            loggedUserData.tm_no,
            loggedUserData.tm_name,
            skipApprovalStatusData.skippedDataApprovalSender.senderTLEmail,
            skipApprovalStatusData.assignAndApprovedHOSlist.assignMTDHOSemail,
            skipApprovalStatusData.assignAndApprovedMTDHODlist
              .assignMTDHODemail,
            skipApprovalStatusData.assignAndApprovedPRDHOSlist
              .assignPRDHOSemail,
            skipApprovalStatusData.approvalStatusOfMTDHOS,
            skipApprovalStatusData.approvalStatusOfMTDHOD,
            skipApprovalStatusData.approvalStatusOfPRDHOS,
            approvalStatusOfPRDHOD,
            rejectedRemarksOfSkipPMMachines,
            skipApprovalStatusData.reasonForDelayOfTL
          );
        }
      }
      console.log(updateStatusOfSkipPM);
      if (updateStatusOfSkipPM) {
        res.status(201).json({ message: "Skip PM approval status updated" });
      }
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      // console.log("2032", error)
      console.log("Filename not received");
    }
  }
);

router.post(
  "/postSectionToGetAllDataForLogHistory",
  authenticate,
  async (req, res) => {
    try {
      let { section, selectedYear } = req.body;
      let loggedUserData = req.rootUser;

      let subSectionsData,
        subSectionIdArray = [],
        cellData,
        cellIdArray = [],
        lineData,
        lineIdArray = [],
        sectionInfo,
        machineData,
        machineDataForChecksheet,
        subsectionSplitIdArrayForChecksheet = [];

      if (typeof section !== "object") {
        let sectionSplit = section.split("-");

        sectionInfo = await Section.findOne({ section_id: sectionSplit[0] });

        if (sectionInfo.dashboardLevel === "Yes") {
          subSectionsData = await SubSection.find({
            section_names: sectionInfo._id,
          }).sort({ subSection_sequence: 1 });
        } else {
          loggedUserData.subSection_data.map((ids) => {
            let subsectionsId = ids.split("-");
            subsectionSplitIdArrayForChecksheet.push(subsectionsId[0]);
          });
          subSectionsData = await SubSection.find({
            subSection_id: { $in: subsectionSplitIdArrayForChecksheet },
          }).sort({ subSection_sequence: 1 });
        }

        for (let i = 0; i < subSectionsData.length; i++) {
          subSectionIdArray.push(subSectionsData[i]._id);
        }

        cellData = await Cell.find({
          subSection_names: { $in: subSectionIdArray },
        }).sort({ cell_sequence: 1 });

        for (let i = 0; i < cellData.length; i++) {
          cellIdArray.push(cellData[i]._id);
        }

        lineData = await Line.find({ cell_names: { $in: cellIdArray } }).sort({
          line_sequence: 1,
        });

        for (let i = 0; i < lineData.length; i++) {
          lineIdArray.push(lineData[i]._id);
        }
      } else {
        if (section?.dashboardLevel === "Yes") {
          subSectionsData = await SubSection.find({
            section_names: section?._id,
          }).sort({ subSection_sequence: 1 });
        } else {
          subSectionsData = await SubSection.find({ _id: section?._id }).sort({
            subSection_sequence: 1,
          });
        }

        for (let i = 0; i < subSectionsData.length; i++) {
          subSectionIdArray.push(subSectionsData[i]._id);
        }

        cellData = await Cell.find({
          subSection_names: { $in: subSectionIdArray },
        }).sort({ cell_sequence: 1 });

        for (let i = 0; i < cellData.length; i++) {
          cellIdArray.push(cellData[i]._id);
        }

        lineData = await Line.find({ cell_names: { $in: cellIdArray } }).sort({
          line_sequence: 1,
        });

        for (let i = 0; i < lineData.length; i++) {
          lineIdArray.push(lineData[i]._id);
        }
      }

      let currentYear =
        new Date().getMonth() < 3
          ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
          : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

      let selectedYearOfCheckSheet =
        selectedYear === currentYear
          ? [
              {
                "checkSheet_data.current_year": selectedYear,
              },
              {
                checkSheet_data: [],
              },
            ]
          : [
              {
                "checkSheet_data.current_year": selectedYear,
              },
            ];

      // machineData = await Machine.aggregate([{
      //     $match: {
      //         line_names: { $in: lineIdArray },
      //         $or: selectedYearOfCheckSheet,
      //         "checkSheet_data": { $ne: undefined }
      //     }
      // },
      // {
      //     $project: {
      //         machine_code: 1,
      //         machine_name: 1,
      //         machine_nickname: 1,
      //         machine_sequence: 1,
      //         installation_date: 1,
      //         maker_name: 1,
      //         maker_sr_no: 1,
      //         manufacturingDate: 1,
      //         isPM: 1,
      //         line_names: 1,
      //         checkSheet_data: 1
      //     }
      // },
      // {
      //     $unwind: "$checkSheet_data"
      // },
      // {
      //     $match: {
      //         "checkSheet_data.current_year": selectedYear
      //     }
      // },
      // {
      //     $sort: {
      //         machine_sequence: 1
      //     }
      // }
      // ])
      // machineData = await Machine.populate(machineData, { path: "line_names", populate: { path: "cell_names", model: "Cells" } })

      // const financialYearWiseMonthKeyArray = ['Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']
      // let logHistoryAllData = [], serialNoForLogHistory = 0
      // machineData?.map((keyForCheckSheet) => {
      //     keyForCheckSheet?.checkSheet_data?.checkSheet?.map((keyOfChecksheetData) => {
      //         if (keyOfChecksheetData?.reasonForDelayWhenSkip === undefined) {
      //             for (let i = 0; i < financialYearWiseMonthKeyArray.length; i++) {
      //                 let month = financialYearWiseMonthKeyArray[i]
      //                 if (keyOfChecksheetData?.planningTableAnimationArray2?.[month]?.length >= 2 &&
      //                     (keyOfChecksheetData?.planningTableAnimationArray2?.[month][1] !== "dummy" ||
      //                         keyOfChecksheetData?.planningTableAnimationArray2?.[month][1] !== "delay")) {
      //                     let abnormality = keyOfChecksheetData?.abnormalityDetails?.[month]?.abnormalityRemarks ? "Yes" : "No"

      //                     // console.log(
      //                     //     keyOfChecksheetData?.abnormalityDetails?.[month]?.PMuploadedImage
      //                     // )

      //                     logHistoryAllData.push(
      //                         new Object({
      //                             sr_no: ++serialNoForLogHistory,
      //                             schedule_month: month,
      //                             cell_names: keyForCheckSheet?.line_names?.cell_names,
      //                             line_names: keyForCheckSheet?.line_names,
      //                             machine_code: keyForCheckSheet?.machine_code,
      //                             machine_name: keyForCheckSheet?.machine_name,
      //                             tableRowId: keyOfChecksheetData?.tableRowId,
      //                             inspection_parent_name: keyOfChecksheetData?.inspection_parent_name,
      //                             completionDateOfInspection: keyOfChecksheetData?.completionDateOfInspection?.[month],
      //                             remarksOfWorkedImplementaion: keyOfChecksheetData?.planningTableAnimationArray2?.[month]?.[2],
      //                             abnormality,
      //                             abnormalityRemarks: keyOfChecksheetData?.abnormalityDetails?.[month]?.abnormalityRemarks,
      //                             abnormalityStatus: keyOfChecksheetData?.abnormalityDetails?.[month]?.abnormalityStatus,
      //                             targetDate: keyOfChecksheetData?.abnormalityDetails?.[month]?.targetDate,
      //                             spareParts: keyOfChecksheetData?.spareDetails?.[month]?.spareParts,
      //                             partName: keyOfChecksheetData?.spareDetails?.[month]?.partName,
      //                             partNo: keyOfChecksheetData?.spareDetails?.[month]?.partNo,
      //                             cost: keyOfChecksheetData?.spareDetails?.[month]?.cost,
      //                             doneBy: keyForCheckSheet?.checkSheet_data?.PMworkedTMName?.[month]
      //                         })
      //                     )
      //                 }
      //             }
      //         }
      //     })
      // })

      res.json({
        sectionInfo,
        subSectionsData,
        subSectionIdArray,
        cellData,
        cellIdArray,
        lineData,
        lineIdArray,
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log("2032", error);
      console.log("Filename not received");
    }
  }
);

//pending PM log history dashboard
router.post(
  "/postSectionToGetAllPendingPMLogHistory",
  authenticate,
  async (req, res) => {
    try {
      let { section, selectedYear } = req.body;
      let loggedUserData = req.rootUser;

      let sectionSplit = section.split("-");

      const sectionInfo = await Section.findOne({
        section_id: sectionSplit[0],
      });

      // console.log("____________", sectionInfo[0]._id)
      let subSectionsData,
        subSectionIdArray = [],
        cellData,
        cellIdArray = [],
        lineData,
        lineIdArray = [],
        machineData,
        machineDataForChecksheet,
        subsectionSplitIdArrayForChecksheet = [];

      if (sectionInfo.dashboardLevel === "Yes") {
        subSectionsData = await SubSection.find({
          section_names: sectionInfo._id,
        }).sort({ subSection_sequence: 1 });
      } else {
        loggedUserData.subSection_data.map((ids) => {
          let subsectionsId = ids.split("-");
          subsectionSplitIdArrayForChecksheet.push(subsectionsId[0]);
        });
        subSectionsData = await SubSection.find({
          subSection_id: { $in: subsectionSplitIdArrayForChecksheet },
        }).sort({ subSection_sequence: 1 });
      }

      for (let i = 0; i < subSectionsData.length; i++) {
        subSectionIdArray.push(subSectionsData[i]._id);
      }

      cellData = await Cell.find({
        subSection_names: { $in: subSectionIdArray },
      }).sort({ cell_sequence: 1 });

      for (let i = 0; i < cellData.length; i++) {
        cellIdArray.push(cellData[i]._id);
      }

      lineData = await Line.find({ cell_names: { $in: cellIdArray } }).sort({
        line_sequence: 1,
      });

      for (let i = 0; i < lineData.length; i++) {
        lineIdArray.push(lineData[i]._id);
      }
      // console.log(lineData)

      let currentYear =
        new Date().getMonth() < 3
          ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
          : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

      let selectedYearOfCheckSheet =
        selectedYear === currentYear
          ? [
              {
                "checkSheet_data.current_year": selectedYear,
              },
              {
                checkSheet_data: [],
              },
            ]
          : [
              {
                "checkSheet_data.current_year": selectedYear,
              },
            ];

      machineData = await Machine.aggregate([
        {
          $match: {
            line_names: { $in: lineIdArray },
            $or: selectedYearOfCheckSheet,
            checkSheet_data: { $ne: undefined },
          },
        },
        {
          $project: {
            machine_code: 1,
            machine_name: 1,
            machine_nickname: 1,
            machine_sequence: 1,
            installation_date: 1,
            maker_name: 1,
            maker_sr_no: 1,
            manufacturingDate: 1,
            isPM: 1,
            line_names: 1,
            checkSheet_data: 1,
          },
        },
        {
          $unwind: "$checkSheet_data",
        },
        {
          $match: {
            "checkSheet_data.current_year": selectedYear,
          },
        },
        {
          $sort: {
            machine_sequence: 1,
          },
        },
      ]);
      machineData = await Machine.populate(machineData, {
        path: "line_names",
        populate: { path: "cell_names", model: "Cells" },
      });

      const financialYearWiseMonthKeyArray = [
        "Apr",
        "May",
        "June",
        "July",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
        "Jan",
        "Feb",
        "Mar",
      ];
      let logHistoryAllPendingPMData = [],
        serialNoForLogHistory = 0;
      machineData?.map((keyForCheckSheet) => {
        keyForCheckSheet?.checkSheet_data?.checkSheet?.map(
          (keyOfChecksheetData) => {
            for (let i = 0; i < financialYearWiseMonthKeyArray.length; i++) {
              let month = financialYearWiseMonthKeyArray[i];
              if (keyOfChecksheetData?.reasonForDelayWhenSkip?.[month]) {
                if (
                  keyOfChecksheetData?.planningTableAnimationArray2?.[month]
                    ?.length >= 2 &&
                  (keyOfChecksheetData?.planningTableAnimationArray2?.[
                    month
                  ][1] !== "dummy" ||
                    keyOfChecksheetData?.planningTableAnimationArray2?.[
                      month
                    ][1] !== "delay")
                ) {
                  let abnormality = keyOfChecksheetData?.abnormalityDetails?.[
                    month
                  ]?.abnormalityRemarks
                    ? "Yes"
                    : "No";

                  logHistoryAllPendingPMData.push(
                    new Object({
                      sr_no: ++serialNoForLogHistory,
                      schedule_month: month,
                      cell_names: keyForCheckSheet?.line_names?.cell_names,
                      line_names: keyForCheckSheet?.line_names,
                      machine_code: keyForCheckSheet?.machine_code,
                      machine_name: keyForCheckSheet?.machine_name,
                      tableRowId: keyOfChecksheetData?.tableRowId,
                      reasonForDelayWhenSkip:
                        keyOfChecksheetData?.reasonForDelayWhenSkip?.[month],
                      inspection_parent_name:
                        keyOfChecksheetData?.inspection_parent_name,
                      completionDateOfInspection:
                        keyOfChecksheetData?.completionDateOfInspection?.[
                          month
                        ],
                      remarksOfWorkedImplementaion:
                        keyOfChecksheetData?.planningTableAnimationArray2?.[
                          month
                        ]?.[2],
                      abnormality,
                      abnormalityRemarks:
                        keyOfChecksheetData?.abnormalityDetails?.[month]
                          ?.abnormalityRemarks,
                      abnormalityStatus:
                        keyOfChecksheetData?.abnormalityDetails?.[month]
                          ?.abnormalityStatus,
                      targetDate:
                        keyOfChecksheetData?.abnormalityDetails?.[month]
                          ?.targetDate,
                      spareParts:
                        keyOfChecksheetData?.spareDetails?.[month]?.spareParts,
                      partName:
                        keyOfChecksheetData?.spareDetails?.[month]?.partName,
                      partNo:
                        keyOfChecksheetData?.spareDetails?.[month]?.partNo,
                      cost: keyOfChecksheetData?.spareDetails?.[month]?.cost,
                      doneBy:
                        keyForCheckSheet?.checkSheet_data?.PMworkedTMName?.[
                          month
                        ],
                    })
                  );
                }
              }
            }
          }
        );
      });

      res.json({
        sectionInfo,
        subSectionsData,
        subSectionIdArray,
        cellData,
        cellIdArray,
        lineData,
        lineIdArray,
        logHistoryAllPendingPMData,
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log("2032", error);
      console.log("data not received");
    }
  }
);

router.post("/addRevisionContent", authenticate, async (req, res) => {
  // const file = fs.createWriteStream(filePath);

  try {
    const { selectedRow, machineAllData } = req.body;
    const loggedUserData = req.rootUser;
    let keyOfRevisionContentData =
      "checkSheet_data.$[outer].revisionContentData";
    const addRevisionContentForMidYearChange = await Machine.updateOne(
      {
        machine_code: machineAllData.machine_code,
      },
      {
        $set: {
          "checkSheet_data.$[outer].flagForNewRevisionContentDataAdded": true,
        },
        $push: {
          [keyOfRevisionContentData]: {
            revisionContent: selectedRow.revisionContent,
            revisionContentDate: selectedRow.revisionContentDate,
            revisedBy: loggedUserData.tm_name,
          },
        },
      },
      {
        arrayFilters: [
          { "outer.current_year": machineAllData.checkSheet_data.current_year },
        ],
      }
    );
    // console.log(addRevisionContentForMidYearChange)
    if (addRevisionContentForMidYearChange) {
      res.status(201).json({ message: "Revision content added" });
    }
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    // console.log("2032", error)
    console.log("Revision content not added");
  }
});

//delete revision content table row
router.post("/deleteRevisionContentData", authenticate, async (req, res) => {
  try {
    const { rowData, machineId, yearOfCheckSheet } = req.body;

    let deleteRevisionContentTableRow = await Machine.updateOne(
      {
        machine_code: machineId,
        "checkSheet_data.current_year": yearOfCheckSheet,
      },
      {
        $pull: {
          "checkSheet_data.$[outer].revisionContentData": { _id: rowData._id },
        },
      },
      {
        arrayFilters: [{ "outer.current_year": yearOfCheckSheet }],
      }
    );
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    res.status(400).json("TableRow not updated!!!");
  }
});

router.post("/postSectionToGetLineData", authenticate, async (req, res) => {
  try {
    let { section, selectedYear } = req.body;
    let loggedUserData = req.rootUser;

    let allSpareDetailsWithCategories = [],
      subSectionsData,
      cellData,
      lineData,
      machineDataForSpareHistory,
      subsectionSplitIdArrayForChecksheet = [];

    let currentYear =
      new Date().getMonth() < 3
        ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
        : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

    let selectedYearOfCheckSheet =
      selectedYear === currentYear
        ? [
            {
              "checkSheet_data.current_year": selectedYear,
            },
            {
              checkSheet_data: [],
            },
          ]
        : [
            {
              "checkSheet_data.current_year": selectedYear,
            },
          ];

    if (typeof section !== "object") {
      let sectionSplit = section.split("-");
      const sectionInfo = await Section.findOne({
        section_id: sectionSplit[0],
      });

      if (sectionInfo.dashboardLevel === "Yes") {
        subSectionsData = await SubSection.find({
          section_names: sectionInfo._id,
        }).sort({ subSection_sequence: 1 });
        // console.log(machineLastData)
      } else {
        loggedUserData.subSection_data.map((ids) => {
          let subsectionsId = ids.split("-");
          subsectionSplitIdArrayForChecksheet.push(subsectionsId[0]);
        });
        subSectionsData = await SubSection.find({
          subSection_id: { $in: subsectionSplitIdArrayForChecksheet },
        }).sort({ subSection_sequence: 1 });
      }

      cellData = await Cell.find({
        subSection_names: { $in: subSectionsData?.map((item) => item?._id) },
      }).sort({ cell_sequence: 1 });

      lineData = await Line.find({
        cell_names: { $in: cellData?.map((item) => item?._id) },
      }).sort({ line_sequence: 1 });

      let spareDetailsLog = await Machine.aggregate([
        {
          $match: {
            line_names: { $in: lineData?.map((item) => item?._id) },
            $or: selectedYearOfCheckSheet,
            checkSheet_data: { $ne: undefined },
            // "checkSheet_data.checkSheet": { $ne: [] },
          },
        },
        {
          $project: {
            machine_code: 1,
            machine_name: 1,
            machine_nickname: 1,
            machine_sequence: 1,
            installation_date: 1,
            maker_name: 1,
            maker_sr_no: 1,
            manufacturingDate: 1,
            isPM: 1,
            line_names: 1,
            checkSheet_data: 1,
          },
        },
        {
          $unwind: "$checkSheet_data",
        },
        {
          $match: {
            "checkSheet_data.current_year": selectedYear,
          },
        },
        {
          $match: {
            checkSheet_data: { $ne: undefined },
          },
        },
      ]);
      // console.log(spareDetailsLog)
      spareDetailsLog = await Machine.populate(spareDetailsLog, {
        path: "line_names",
        populate: { path: "cell_names", model: "Cells" },
      });

      // const spareDetailsLog = await Machine.find({ line_names: { $in: lineIdArray }, "checkSheet.abnormalityDetails": { $exists: true } }).populate({ path: "line_names", populate: { path: "cell_names", model: "Cells" } })
      const financialYearWiseMonthKeyArray = [
        "Apr",
        "May",
        "June",
        "July",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
        "Jan",
        "Feb",
        "Mar",
      ];
      let serialNoForLogHistory = 0;
      spareDetailsLog?.map((keyForCheckSheet) => {
        if (keyForCheckSheet?.checkSheet_data?.checkSheet?.length > 0) {
          // console.log(keyForCheckSheet)
          keyForCheckSheet?.checkSheet_data?.checkSheet?.map(
            (keyForSpareDetails) => {
              if (keyForSpareDetails?.spareDetails !== undefined) {
                // console.log(keyForSpareDetails?.spareDetails)

                for (
                  let i = 0;
                  i < financialYearWiseMonthKeyArray?.length;
                  i++
                ) {
                  let month = financialYearWiseMonthKeyArray[i];
                  if (
                    keyForSpareDetails?.spareDetails?.[month]?.spareParts ===
                    "Yes"
                  ) {
                    allSpareDetailsWithCategories.push(
                      new Object({
                        sr_no: ++serialNoForLogHistory,
                        line_names: keyForCheckSheet?.line_names,
                        machine_name: keyForCheckSheet?.machine_name,
                        machineId: keyForCheckSheet?._id,
                        machine_code: keyForCheckSheet?.machine_code,
                        yearOfCheckSheet:
                          keyForCheckSheet?.checkSheet_data?.current_year,
                        schedule_month: month,
                        type: "PM",
                        table_id: keyForSpareDetails?.tableRowId,
                        spareParts:
                          keyForSpareDetails?.spareDetails?.[month]?.spareParts,
                        partName:
                          keyForSpareDetails?.spareDetails?.[month]?.partName,
                        partNo:
                          keyForSpareDetails?.spareDetails?.[month]?.partNo,
                        cost: keyForSpareDetails?.spareDetails?.[month]?.cost,
                        completionDateOfInspection:
                          keyForSpareDetails?.completionDateOfInspection?.[
                            month
                          ],
                        inspectionCompletionBy:
                          keyForSpareDetails?.inspectionCompletionBy?.[month],
                      })
                    );
                  }
                }
              }
            }
          );
        }
        for (let i = 0; i < financialYearWiseMonthKeyArray?.length; i++) {
          let monthForOtherCategoryOfSpare = financialYearWiseMonthKeyArray[i];

          if (keyForCheckSheet?.checkSheet_data?.extraSpareDetails) {
            for (
              let j = 0;
              j <
              keyForCheckSheet?.checkSheet_data?.extraSpareDetails?.[
                monthForOtherCategoryOfSpare
              ]?.length;
              j++
            ) {
              // console.log(keyForCheckSheet?.machine_name, monthForOtherCategoryOfSpare)
              // console.log(keyForCheckSheet?.checkSheet_data?.extraSpareDetails?.[monthForOtherCategoryOfSpare][j]?._id)

              allSpareDetailsWithCategories.push(
                new Object({
                  sr_no: ++serialNoForLogHistory,
                  line_names: keyForCheckSheet?.line_names,
                  machine_name: keyForCheckSheet?.machine_name,
                  machineId: keyForCheckSheet?._id,
                  machine_code: keyForCheckSheet?.machine_code,
                  yearOfCheckSheet:
                    keyForCheckSheet?.checkSheet_data?.current_year,
                  schedule_month: monthForOtherCategoryOfSpare,
                  type: keyForCheckSheet?.checkSheet_data?.extraSpareDetails?.[
                    monthForOtherCategoryOfSpare
                  ][j].type,
                  completionDateOfInspection:
                    keyForCheckSheet?.checkSheet_data?.extraSpareDetails?.[
                      monthForOtherCategoryOfSpare
                    ][j].date,
                  inspectionCompletionBy:
                    keyForCheckSheet?.checkSheet_data?.extraSpareDetails?.[
                      monthForOtherCategoryOfSpare
                    ][j].usedBy,
                  partName:
                    keyForCheckSheet?.checkSheet_data?.extraSpareDetails?.[
                      monthForOtherCategoryOfSpare
                    ][j].partName,
                  partNo:
                    keyForCheckSheet?.checkSheet_data?.extraSpareDetails?.[
                      monthForOtherCategoryOfSpare
                    ][j].partNo,
                  cost: keyForCheckSheet?.checkSheet_data?.extraSpareDetails?.[
                    monthForOtherCategoryOfSpare
                  ][j].cost,
                  abnormalityRemarks:
                    keyForCheckSheet?.checkSheet_data?.extraSpareDetails?.[
                      monthForOtherCategoryOfSpare
                    ][j].abnormalityRemarks,
                  sparePurpose:
                    keyForCheckSheet?.checkSheet_data?.extraSpareDetails?.[
                      monthForOtherCategoryOfSpare
                    ][j].sparePurpose,
                  _id: keyForCheckSheet?.checkSheet_data?.extraSpareDetails?.[
                    monthForOtherCategoryOfSpare
                  ][j]?._id,
                })
              );
            }
          }
        }
      });
    } else {
      if (section?.dashboardLevel === "Yes") {
        subSectionsData = await SubSection.find({
          section_names: section?._id,
        }).sort({ subSection_sequence: 1 });
      } else {
        subSectionsData = await SubSection.find({ _id: section?._id }).sort({
          subSection_sequence: 1,
        });
      }

      cellData = await Cell.find({
        subSection_names: { $in: subSectionsData?.map((item) => item?._id) },
      }).sort({ cell_sequence: 1 });

      lineData = await Line.find({
        cell_names: { $in: cellData?.map((item) => item?._id) },
      }).sort({ line_sequence: 1 });

      let spareDetailsLog = await Machine.aggregate([
        {
          $match: {
            line_names: { $in: lineData?.map((item) => item?._id) },
            $or: selectedYearOfCheckSheet,
            checkSheet_data: { $ne: undefined },
            // "checkSheet_data.checkSheet": { $ne: [] },
          },
        },
        {
          $project: {
            machine_code: 1,
            machine_name: 1,
            machine_nickname: 1,
            machine_sequence: 1,
            installation_date: 1,
            maker_name: 1,
            maker_sr_no: 1,
            manufacturingDate: 1,
            isPM: 1,
            line_names: 1,
            checkSheet_data: 1,
          },
        },
        {
          $unwind: "$checkSheet_data",
        },
        {
          $match: {
            "checkSheet_data.current_year": selectedYear,
          },
        },
        {
          $match: {
            checkSheet_data: { $ne: undefined },
          },
        },
      ]);
      // console.log(spareDetailsLog)
      spareDetailsLog = await Machine.populate(spareDetailsLog, {
        path: "line_names",
        populate: { path: "cell_names", model: "Cells" },
      });

      // const spareDetailsLog = await Machine.find({ line_names: { $in: lineIdArray }, "checkSheet.abnormalityDetails": { $exists: true } }).populate({ path: "line_names", populate: { path: "cell_names", model: "Cells" } })
      const financialYearWiseMonthKeyArray = [
        "Apr",
        "May",
        "June",
        "July",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
        "Jan",
        "Feb",
        "Mar",
      ];
      let serialNoForLogHistory = 0;
      spareDetailsLog?.map((keyForCheckSheet) => {
        if (keyForCheckSheet?.checkSheet_data?.checkSheet?.length > 0) {
          // console.log(keyForCheckSheet)
          keyForCheckSheet?.checkSheet_data?.checkSheet?.map(
            (keyForSpareDetails) => {
              if (keyForSpareDetails?.spareDetails !== undefined) {
                // console.log(keyForSpareDetails?.spareDetails)

                for (
                  let i = 0;
                  i < financialYearWiseMonthKeyArray?.length;
                  i++
                ) {
                  let month = financialYearWiseMonthKeyArray[i];
                  if (
                    keyForSpareDetails?.spareDetails?.[month]?.spareParts ===
                    "Yes"
                  ) {
                    allSpareDetailsWithCategories.push(
                      new Object({
                        sr_no: ++serialNoForLogHistory,
                        line_names: keyForCheckSheet?.line_names,
                        machine_name: keyForCheckSheet?.machine_name,
                        machineId: keyForCheckSheet?._id,
                        machine_code: keyForCheckSheet?.machine_code,
                        yearOfCheckSheet:
                          keyForCheckSheet?.checkSheet_data?.current_year,
                        schedule_month: month,
                        type: "PM",
                        table_id: keyForSpareDetails?.tableRowId,
                        spareParts:
                          keyForSpareDetails?.spareDetails?.[month]?.spareParts,
                        partName:
                          keyForSpareDetails?.spareDetails?.[month]?.partName,
                        partNo:
                          keyForSpareDetails?.spareDetails?.[month]?.partNo,
                        cost: keyForSpareDetails?.spareDetails?.[month]?.cost,
                        completionDateOfInspection:
                          keyForSpareDetails?.completionDateOfInspection?.[
                            month
                          ],
                        inspectionCompletionBy:
                          keyForSpareDetails?.inspectionCompletionBy?.[month],
                      })
                    );
                  }
                }
              }
            }
          );
        }
        for (let i = 0; i < financialYearWiseMonthKeyArray?.length; i++) {
          let monthForOtherCategoryOfSpare = financialYearWiseMonthKeyArray[i];

          if (keyForCheckSheet?.checkSheet_data?.extraSpareDetails) {
            for (
              let j = 0;
              j <
              keyForCheckSheet?.checkSheet_data?.extraSpareDetails?.[
                monthForOtherCategoryOfSpare
              ]?.length;
              j++
            ) {
              // console.log(keyForCheckSheet?.machine_name, monthForOtherCategoryOfSpare)
              // console.log(keyForCheckSheet?.checkSheet_data?.extraSpareDetails?.[monthForOtherCategoryOfSpare][j]?._id)

              allSpareDetailsWithCategories.push(
                new Object({
                  sr_no: ++serialNoForLogHistory,
                  line_names: keyForCheckSheet?.line_names,
                  machine_name: keyForCheckSheet?.machine_name,
                  machineId: keyForCheckSheet?._id,
                  machine_code: keyForCheckSheet?.machine_code,
                  yearOfCheckSheet:
                    keyForCheckSheet?.checkSheet_data?.current_year,
                  schedule_month: monthForOtherCategoryOfSpare,
                  type: keyForCheckSheet?.checkSheet_data?.extraSpareDetails?.[
                    monthForOtherCategoryOfSpare
                  ][j].type,
                  completionDateOfInspection:
                    keyForCheckSheet?.checkSheet_data?.extraSpareDetails?.[
                      monthForOtherCategoryOfSpare
                    ][j].date,
                  inspectionCompletionBy:
                    keyForCheckSheet?.checkSheet_data?.extraSpareDetails?.[
                      monthForOtherCategoryOfSpare
                    ][j].usedBy,
                  partName:
                    keyForCheckSheet?.checkSheet_data?.extraSpareDetails?.[
                      monthForOtherCategoryOfSpare
                    ][j].partName,
                  partNo:
                    keyForCheckSheet?.checkSheet_data?.extraSpareDetails?.[
                      monthForOtherCategoryOfSpare
                    ][j].partNo,
                  cost: keyForCheckSheet?.checkSheet_data?.extraSpareDetails?.[
                    monthForOtherCategoryOfSpare
                  ][j].cost,
                  abnormalityRemarks:
                    keyForCheckSheet?.checkSheet_data?.extraSpareDetails?.[
                      monthForOtherCategoryOfSpare
                    ][j].abnormalityRemarks,
                  sparePurpose:
                    keyForCheckSheet?.checkSheet_data?.extraSpareDetails?.[
                      monthForOtherCategoryOfSpare
                    ][j].sparePurpose,
                  _id: keyForCheckSheet?.checkSheet_data?.extraSpareDetails?.[
                    monthForOtherCategoryOfSpare
                  ][j]?._id,
                })
              );
            }
          }
        }
      });
    }

    // console.log(allSpareDetailsWithCategories)
    res.json({ lineData, allSpareDetailsWithCategories });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log(error);
    console.log("User id not received!!!");
  }
});

router.post("/newOperatorDataEntry", async (req, res) => {
  try {
    const {
      selectedType,
      date,
      selectedMachine,
      usedBy,
      part_name,
      part_no,
      cost,
      abnormalityRemarks,
      sparePurpose,
    } = req.body;

    let currentYear =
      new Date().getMonth() < 3
        ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
        : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

    const monthKeyArray = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "June",
      "July",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    let currentMonth = monthKeyArray[new Date(date).getMonth()];

    let updatedMachine;

    let keyOfAddingExtraSpareDetails = `checkSheet_data.$[outer].extraSpareDetails.${currentMonth}`;

    if ("checkSheet_data" in selectedMachine) {
      updatedMachine = await Machine.updateOne(
        { _id: selectedMachine?._id },
        {
          $push: {
            [keyOfAddingExtraSpareDetails]: {
              type: selectedType,
              date,
              usedBy,
              partName: part_name,
              partNo: part_no,
              cost,
              abnormalityRemarks,
              sparePurpose,
            },
          },
        },
        {
          arrayFilters: [{ "outer.current_year": currentYear }],
        }
      );
    } else {
      updatedMachine = await Machine.updateOne(
        { _id: selectedMachine?._id },
        {
          $set: {
            checkSheet_data: {
              current_year: currentYear,
              extraSpareDetails: {
                [currentMonth]: {
                  type: selectedType,
                  date,
                  usedBy,
                  partName: part_name,
                  partNo: part_no,
                  cost,
                  abnormalityRemarks,
                  sparePurpose,
                },
              },
            },
          },
        }
      );
    }

    if (updatedMachine) {
      res
        .status(200)
        .json({ msg: "Machine extraSpareDetails updated successfully" });
    }

    // console.log(updatedMachine)
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log(error);
    console.log("Data not valid or received !!!");
  }
});

router.post("/annualPmScheduleApproval", async (req, res) => {
  try {
    const {
      selectedLine,
      selectedPrdHos,
      selectedMtdHod,
      selectedMtdHos,
      selectedMtdTl,
    } = req.body;

    // console.log(
    // selectedLine,
    // selectedPrdHos,
    // selectedMtdHod,
    // selectedMtdHos,
    // selectedMtdTl,
    // )

    let currentYear =
      new Date().getMonth() < 3
        ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
        : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

    let updatedLine = await Line.updateOne(
      { _id: selectedLine?._id },

      {
        $set: {
          //prepared User
          "annualPmScheduleApproval.$[outer].mtdTlId": selectedMtdTl,

          //MTD HOS
          "annualPmScheduleApproval.$[outer].mtdHos.mtdHosId": selectedMtdHos,
          "annualPmScheduleApproval.$[outer].mtdHos.mtdHosApprovalStatus":
            "Pending",

          //MTD HOD
          "annualPmScheduleApproval.$[outer].mtdHod.mtdHodId": selectedMtdHod,
          "annualPmScheduleApproval.$[outer].mtdHod.mtdHodApprovalStatus":
            "Pending",

          //PRD HOS
          "annualPmScheduleApproval.$[outer].prdHos.prdHosId": selectedPrdHos,
          "annualPmScheduleApproval.$[outer].prdHos.prdHosApprovalStatus":
            "Pending",
        },
      },

      {
        arrayFilters: [{ "outer.current_year": currentYear }],
      }
    );

    const userInfoForMail = await User.findOne({ _id: selectedMtdHos });

    // console.log(userInfoForMail?.email)

    sendMailForAnnualPmScheduleReport(userInfoForMail?.email, selectedLine);

    // console.log(updatedLine)

    res.status(200).json({ msg: "uploaded successfully" });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log(error);
    console.log("Data not valid or received !!!");
  }
});

router.post("/approveRequestForAnnualPmSchedule", async (req, res) => {
  try {
    const { lineData, ID, supportingKey, objOfAnnualPmScheduleApproval } =
      req.body;

    let currentYear =
      new Date().getMonth() < 3
        ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
        : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

    let keyForApprovalOfUser = `annualPmScheduleApproval.$[outer].${ID}.${ID}ApprovalStatus`;

    await Line.updateOne(
      { _id: lineData?._id },
      {
        $set: {
          [keyForApprovalOfUser]: "Accepted",
        },
      },
      {
        arrayFilters: [{ "outer.current_year": currentYear }],
      }
    );

    let toEmail;

    if (supportingKey === "mtdTlId") {
      // console.log(objOfAnnualPmScheduleApproval?.[supportingKey]?.email)
      toEmail = objOfAnnualPmScheduleApproval?.[supportingKey]?.email;
    } else {
      // console.log(objOfAnnualPmScheduleApproval?.[supportingKey]?.[`${supportingKey}Id`]?.email)
      toEmail =
        objOfAnnualPmScheduleApproval?.[supportingKey]?.[`${supportingKey}Id`]
          ?.email;
    }

    // console.log(toEmail)

    sendMailForAnnualPmScheduleReport(toEmail, lineData);

    res.status(200).json({ msg: "uploaded successfully" });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log(error);
    console.log("Data not valid or received !!!");
  }
});

router.post(
  "/submitMonthlyApprovalRequestForAnnualPmSchedule",
  authenticate,
  async (req, res) => {
    try {
      const {
        values,
        selectedYear,
        lineInfo,
        month,

        assignHOS,
        assignHOD,
      } = req.body;

      // console.log(
      //     values,
      //     selectedYear,
      //     lineInfo,

      //     month,

      //     assignHOS,
      //     assignHOD
      // )

      // console.log(
      //     req.rootUser?._id
      // )

      let keyForAssignHOD, keyOfStatusForAssignHOD, keyOfRemarksForAssignHOD;

      let objectForSetValueInDB;

      let keyForApprovalSenderUser = `annualPmScheduleApproval.$[outer].monthlyApprovalData.${month}.checkedByTL`;

      let keyForAssignHOS = `annualPmScheduleApproval.$[outer].monthlyApprovalData.${month}.assignHOS`;
      let keyOfStatusForAssignHOS = `annualPmScheduleApproval.$[outer].monthlyApprovalData.${month}.approvedByHOS`;

      if (values?.delay === "Yes") {
        keyForAssignHOD = `annualPmScheduleApproval.$[outer].monthlyApprovalData.${month}.assignHOD`;
        keyOfStatusForAssignHOD = `annualPmScheduleApproval.$[outer].monthlyApprovalData.${month}.approvedByHODIfDelay`;
        keyOfRemarksForAssignHOD = `annualPmScheduleApproval.$[outer].monthlyApprovalData.${month}.remarksIfDelay`;

        objectForSetValueInDB = {
          [keyForApprovalSenderUser]: req.rootUser?._id,

          [keyForAssignHOS]: assignHOS,
          [keyOfStatusForAssignHOS]: "Pending",

          [keyForAssignHOD]: assignHOD,
          [keyOfStatusForAssignHOD]: "Pending",
          [keyOfRemarksForAssignHOD]: values?.remarks,
        };
      } else {
        objectForSetValueInDB = {
          [keyForApprovalSenderUser]: req.rootUser?._id,

          [keyForAssignHOS]: assignHOS,
          [keyOfStatusForAssignHOS]: "Pending",
        };
      }

      await Line.updateOne(
        { _id: lineInfo?._id },
        {
          $set: objectForSetValueInDB,
        },
        {
          arrayFilters: [{ "outer.current_year": selectedYear }],
        }
      );

      res.status(200).json({ msg: "uploaded successfully" });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("Data not valid or received !!!");
    }
  }
);

router.post(
  "/approveMonthlyRequestForAnnualPmSchedule",
  authenticate,
  async (req, res) => {
    try {
      const { selectedYear, month, keyRefForHosOrHod, lineInfo } = req.body;

      // console.log(
      //     selectedYear,
      //     month,
      //     keyRefForHosOrHod,
      //     lineInfo
      // )

      let keyOfStatusForAssignHOSOrHOD;

      if (keyRefForHosOrHod === "hos") {
        keyOfStatusForAssignHOSOrHOD = `annualPmScheduleApproval.$[outer].monthlyApprovalData.${month}.approvedByHOS`;
      } else {
        keyOfStatusForAssignHOSOrHOD = `annualPmScheduleApproval.$[outer].monthlyApprovalData.${month}.approvedByHODIfDelay`;
      }

      await Line.updateOne(
        { _id: lineInfo?._id },
        {
          $set: {
            [keyOfStatusForAssignHOSOrHOD]: "Accepted",
          },
        },
        {
          arrayFilters: [{ "outer.current_year": selectedYear }],
        }
      );

      res.status(200).json({ msg: "uploaded successfully" });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("Data not valid or received !!!");
    }
  }
);

//Get data for spare parts all line report ( monthly spare consumption )

router.post(
  "/postSectionToGetAllDataForSparePartsReport",
  authenticate,
  async (req, res) => {
    try {
      let { section, selectedYear } = req.body;
      // let selectedYear = "2022-2023"
      let loggedUserData = req.rootUser;
      // console.log("____________", sectionInfo[0]._id)
      let subSectionsData,
        subSectionIdArray = [],
        cellData,
        cellIdArray = [],
        lineData,
        lineIdArray = [],
        machineData,
        machineDataForChecksheet,
        subsectionSplitIdArrayForChecksheet = [];
      if (typeof section !== "object") {
        let sectionSplit = section.split("-");
        const sectionInfo = await Section.findOne({
          section_id: sectionSplit[0],
        });
        if (sectionInfo.dashboardLevel === "Yes") {
          subSectionsData = await SubSection.find({
            section_names: sectionInfo._id,
          }).sort({ subSection_sequence: 1 });
        } else {
          loggedUserData.subSection_data.map((ids) => {
            let subsectionsId = ids.split("-");
            subsectionSplitIdArrayForChecksheet.push(subsectionsId[0]);
          });
          subSectionsData = await SubSection.find({
            subSection_id: { $in: subsectionSplitIdArrayForChecksheet },
          }).sort({ subSection_sequence: 1 });
        }
      } else {
        if (section?.dashboardLevel === "Yes") {
          subSectionsData = await SubSection.find({
            section_names: section?._id,
          }).sort({ subSection_sequence: 1 });
        } else {
          subSectionsData = await SubSection.find({ _id: section?._id }).sort({
            subSection_sequence: 1,
          });
        }
      }

      cellData = await Cell.find({
        subSection_names: { $in: subSectionsData?.map((item) => item?._id) },
      }).sort({ cell_sequence: 1 });

      lineData = await Line.find({
        cell_names: { $in: cellData?.map((item) => item?._id) },
      }).sort({ line_sequence: 1 });

      // console.log(lineData)
      let currentYear =
        new Date().getMonth() < 3
          ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
          : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
      let selectedYearOfCheckSheet =
        selectedYear === currentYear
          ? [
              {
                "checkSheet_data.current_year": selectedYear,
              },
              {
                checkSheet_data: [],
              },
            ]
          : [
              {
                "checkSheet_data.current_year": selectedYear,
              },
            ];
      // console.log(selectedYear)
      let groupData;

      const financialYearWiseMonthKeyArray = [
        "Apr",
        "May",
        "June",
        "July",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
        "Jan",
        "Feb",
        "Mar",
      ];

      let totalMonthlyPMSpareConsumption = [];
      let totalMonthlyBMSpareConsumption = [];
      let totalMonthlyCorrectiveSpareConsumption = [];
      let totalMonthlyPridictiveSpareConsumption = [];
      let totalMonthlyKaizenSpareConsumption = [];

      //For Spare PM count
      for (let j = 0; j < financialYearWiseMonthKeyArray.length; j++) {
        let sumOfTotalPMSpareCost = 0;

        let keyOfSpareDetailsExistsOrNot = `checkSheet_data.checkSheet.spareDetails.${financialYearWiseMonthKeyArray[j]}`;
        // let previousMonth = monthKeyArray[j - 1] === undefined ? monthKeyArray.splice(-1)[0] : monthKeyArray[j - 1]
        let keyForSparePartsUsedOrNot = `checkSheet_data.checkSheet.spareDetails.${financialYearWiseMonthKeyArray[j]}.spareParts`;
        let keyForTotalCostOfPMSpareParts = `$checkSheet_data.checkSheet.spareDetails.${financialYearWiseMonthKeyArray[j]}.cost`;

        groupData = await Machine.aggregate([
          {
            $match: {
              line_names: { $in: lineData?.map((item) => item?._id) },
              checkSheet_data: { $ne: undefined },
              $or: selectedYearOfCheckSheet,
            },
          },
          {
            $unwind: "$checkSheet_data",
          },
          {
            $match: {
              "checkSheet_data.current_year": selectedYear,
            },
          },
          // { $addFields: { checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] } } },
          { $unwind: "$checkSheet_data.checkSheet" },
          {
            $match: {
              [keyOfSpareDetailsExistsOrNot]: { $ne: undefined },
              [keyForSparePartsUsedOrNot]: { $ne: undefined },
            },
          },
          {
            $group: {
              _id: "$line_names",
              machine: {
                $push: {
                  machine_code: "$machine_code",
                  machine_name: "$machine_name",
                  checkSheet_data: "$checkSheet_data",
                },
              },
              totalPMSpareCost: {
                $sum: keyForTotalCostOfPMSpareParts,
              },
            },
          },
          {
            $project: {
              _id: 1,
              line_names: "$_id",
              machine: 1,
              totalPMSpareCost: 1,
            },
          },
        ]);
        if (groupData?.length > 0) {
          groupData?.map((item) => {
            sumOfTotalPMSpareCost =
              sumOfTotalPMSpareCost + item?.totalPMSpareCost;
          });
        }

        if (sumOfTotalPMSpareCost) {
          totalMonthlyPMSpareConsumption.push(sumOfTotalPMSpareCost);
        } else {
          totalMonthlyPMSpareConsumption.push(0);
        }
      }

      //For other spare categories  count
      for (let j = 0; j < financialYearWiseMonthKeyArray.length; j++) {
        let sumOfTotalBMSpareCost = 0;
        let sumOfTotalCorrectiveSpareCost = 0;
        let sumOfTotalPridictiveSpareCost = 0;
        let sumOfTotalKaizenSpareCost = 0;

        let keyOfSpareDetailsExistsOrNot = `checkSheet_data.checkSheet.spareDetails.${financialYearWiseMonthKeyArray[j]}`;
        // let previousMonth = monthKeyArray[j - 1] === undefined ? monthKeyArray.splice(-1)[0] : monthKeyArray[j - 1]
        let keyForSparePartsUsedOrNot = `checkSheet_data.checkSheet.spareDetails.${financialYearWiseMonthKeyArray[j]}.spareParts`;
        let keyForTotalCostOfPMSpareParts = `$checkSheet_data.checkSheet.spareDetails.${financialYearWiseMonthKeyArray[j]}.cost`;
        let keyForSparePartTypes = `$checkSheet_data.extraSpareDetails.${financialYearWiseMonthKeyArray[j]}.type`;
        let keyForTotalCostOfExtraSpareDetails = `$checkSheet_data.extraSpareDetails.${financialYearWiseMonthKeyArray[j]}.cost`;
        let keyForTotalCostOfExtraSpareDetailsUnwind = `$checkSheet_data.extraSpareDetails.${financialYearWiseMonthKeyArray[j]}`;

        groupData = await Machine.aggregate([
          {
            $match: {
              line_names: { $in: lineData?.map((item) => item?._id) },
              checkSheet_data: { $ne: undefined },
              $or: selectedYearOfCheckSheet,
            },
          },
          {
            $unwind: "$checkSheet_data",
          },
          {
            $match: {
              "checkSheet_data.current_year": selectedYear,
            },
          },
          // { $addFields: { checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] } } },
          { $unwind: keyForTotalCostOfExtraSpareDetailsUnwind },
          {
            $group: {
              _id: "$line_names",
              machine: {
                $push: {
                  machine_code: "$machine_code",
                  machine_name: "$machine_name",
                  checkSheet_data: "$checkSheet_data",
                },
              },
              totalBMSpareCost: {
                $sum: {
                  $cond: [
                    {
                      $eq: [keyForSparePartTypes, "BM"],
                    },
                    keyForTotalCostOfExtraSpareDetails,
                    0,
                  ],
                },
              },
              totalCorrectiveSpareCost: {
                $sum: {
                  $cond: [
                    {
                      $eq: [keyForSparePartTypes, "Corrective"],
                    },
                    keyForTotalCostOfExtraSpareDetails,
                    0,
                  ],
                },
              },
              totalPridictiveSpareCost: {
                $sum: {
                  $cond: [
                    {
                      $eq: [keyForSparePartTypes, "Predictive"],
                    },
                    keyForTotalCostOfExtraSpareDetails,
                    0,
                  ],
                },
              },
              totalKaizenSpareCost: {
                $sum: {
                  $cond: [
                    {
                      $eq: [keyForSparePartTypes, "Kaizen"],
                    },
                    keyForTotalCostOfExtraSpareDetails,
                    0,
                  ],
                },
              },
            },
          },
          {
            $project: {
              _id: 0,
              line_names: "$_id",
              machine: 1,
              totalBMSpareCost: 1,
              totalCorrectiveSpareCost: 1,
              totalPridictiveSpareCost: 1,
              totalKaizenSpareCost: 1,

              // machine_code: 1,
              // checkSheet_data: 1
            },
          },
        ]);

        // console.log(financialYearWiseMonthKeyArray[j], "---------------", groupData)

        if (groupData?.length > 0) {
          for (let i = 0; i < groupData?.length; i++) {
            sumOfTotalBMSpareCost =
              sumOfTotalBMSpareCost + groupData[i]?.totalBMSpareCost;
            sumOfTotalCorrectiveSpareCost =
              sumOfTotalCorrectiveSpareCost +
              groupData[i]?.totalCorrectiveSpareCost;
            sumOfTotalPridictiveSpareCost =
              sumOfTotalPridictiveSpareCost +
              groupData[i]?.totalPridictiveSpareCost;
            sumOfTotalKaizenSpareCost =
              sumOfTotalKaizenSpareCost + groupData[i]?.totalKaizenSpareCost;
          }
        }

        // //push the value of sum of BM category spare details in array
        if (sumOfTotalBMSpareCost > 0) {
          totalMonthlyBMSpareConsumption.push(sumOfTotalBMSpareCost);
        } else {
          totalMonthlyBMSpareConsumption.push(0);
        }
        //push the value of sum of Corrective category spare details in array
        if (sumOfTotalCorrectiveSpareCost > 0) {
          totalMonthlyCorrectiveSpareConsumption.push(
            sumOfTotalCorrectiveSpareCost
          );
        } else {
          totalMonthlyCorrectiveSpareConsumption.push(0);
        }

        //push the value of sum of Pridictive category spare details in array
        if (sumOfTotalPridictiveSpareCost > 0) {
          totalMonthlyPridictiveSpareConsumption.push(
            sumOfTotalPridictiveSpareCost
          );
        } else {
          totalMonthlyPridictiveSpareConsumption.push(0);
        }

        //push the value of sum of Kaizen category spare details in array
        if (sumOfTotalKaizenSpareCost > 0) {
          totalMonthlyKaizenSpareConsumption.push(sumOfTotalKaizenSpareCost);
        } else {
          totalMonthlyKaizenSpareConsumption.push(0);
        }
      }

      // console.log(totalMonthlyBMSpareConsumption, "------BM")
      // console.log(totalMonthlyCorrectiveSpareConsumption, "-----Corre")
      // console.log(totalMonthlyPridictiveSpareConsumption, "----Pridic"),
      // console.log(totalMonthlyKaizenSpareConsumption, "-----kaizen")

      res.json({
        subSectionsData,
        cellData,
        lineData,
        totalMonthlyPMSpareConsumption,
        totalMonthlyBMSpareConsumption,
        totalMonthlyCorrectiveSpareConsumption,
        totalMonthlyPridictiveSpareConsumption,
        totalMonthlyKaizenSpareConsumption,
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("User id not received!!!");
    }
  }
);

//Get data for spare parts perticular line( monthly spare consumption )

router.post(
  "/postPerticularLineToGetDataForMonthlySpareConsumption",
  authenticate,
  async (req, res) => {
    try {
      let { line, selectedYear } = req.body;
      // console.log(line)
      // let selectedYear = "2022-2023"
      let current_year =
        new Date().getMonth() < 3
          ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
          : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

      let selectedYearOfCheckSheet =
        selectedYear === current_year
          ? [
              {
                "checkSheet_data.current_year": selectedYear,
              },
              {
                checkSheet_data: [],
              },
            ]
          : [
              {
                "checkSheet_data.current_year": selectedYear,
              },
            ];
      const ObjectId = mongoose.Types.ObjectId;

      let groupData;
      let allData = [];
      // y = "Nov"
      const monthKeyArray = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "June",
        "July",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const financialYearWiseMonthKeyArray = [
        "Apr",
        "May",
        "June",
        "July",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
        "Jan",
        "Feb",
        "Mar",
      ];

      let totalMonthlyPMSpareConsumption = [];
      let totalMonthlyBMSpareConsumption = [];
      let totalMonthlyCorrectiveSpareConsumption = [];
      let totalMonthlyPridictiveSpareConsumption = [];
      let totalMonthlyKaizenSpareConsumption = [];

      //For Spare PM count
      for (let j = 0; j < financialYearWiseMonthKeyArray.length; j++) {
        let sumOfTotalPMSpareCost = 0;

        let keyOfSpareDetailsExistsOrNot = `checkSheet_data.checkSheet.spareDetails.${financialYearWiseMonthKeyArray[j]}`;
        // let previousMonth = monthKeyArray[j - 1] === undefined ? monthKeyArray.splice(-1)[0] : monthKeyArray[j - 1]
        let keyForSparePartsUsedOrNot = `checkSheet_data.checkSheet.spareDetails.${financialYearWiseMonthKeyArray[j]}.spareParts`;
        let keyForTotalCostOfPMSpareParts = `$checkSheet_data.checkSheet.spareDetails.${financialYearWiseMonthKeyArray[j]}.cost`;

        groupData = await Machine.aggregate([
          {
            $match: {
              line_names: ObjectId(line),
              checkSheet_data: { $ne: undefined },
              $or: selectedYearOfCheckSheet,
            },
          },
          {
            $unwind: "$checkSheet_data",
          },
          {
            $match: {
              "checkSheet_data.current_year": selectedYear,
            },
          },
          // { $addFields: { checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] } } },
          { $unwind: "$checkSheet_data.checkSheet" },
          {
            $match: {
              [keyOfSpareDetailsExistsOrNot]: { $ne: undefined },
              [keyForSparePartsUsedOrNot]: { $ne: undefined },
            },
          },
          {
            $group: {
              _id: "$line_names",
              machine: {
                $push: {
                  machine_code: "$machine_code",
                  machine_name: "$machine_name",
                  checkSheet_data: "$checkSheet_data",
                },
              },
              totalPMSpareCost: {
                $sum: keyForTotalCostOfPMSpareParts,
              },
            },
          },
          {
            $project: {
              _id: 1,
              line_names: "$_id",
              machine: 1,
              totalPMSpareCost: 1,
            },
          },
        ]);
        // console.log(groupData)
        if (groupData?.length > 0) {
          sumOfTotalPMSpareCost = groupData[0]?.totalPMSpareCost;
        }

        if (sumOfTotalPMSpareCost) {
          totalMonthlyPMSpareConsumption.push(sumOfTotalPMSpareCost);
        } else {
          totalMonthlyPMSpareConsumption.push(0);
        }
      }

      //For other spare categories  count
      for (let j = 0; j < financialYearWiseMonthKeyArray.length; j++) {
        let sumOfTotalBMSpareCost = 0;
        let sumOfTotalCorrectiveSpareCost = 0;
        let sumOfTotalPridictiveSpareCost = 0;
        let sumOfTotalKaizenSpareCost = 0;

        let keyOfSpareDetailsExistsOrNot = `checkSheet_data.checkSheet.spareDetails.${financialYearWiseMonthKeyArray[j]}`;
        // let previousMonth = monthKeyArray[j - 1] === undefined ? monthKeyArray.splice(-1)[0] : monthKeyArray[j - 1]
        let keyForSparePartsUsedOrNot = `checkSheet_data.checkSheet.spareDetails.${financialYearWiseMonthKeyArray[j]}.spareParts`;
        let keyForTotalCostOfPMSpareParts = `$checkSheet_data.checkSheet.spareDetails.${financialYearWiseMonthKeyArray[j]}.cost`;
        let keyForSparePartTypes = `$checkSheet_data.extraSpareDetails.${financialYearWiseMonthKeyArray[j]}.type`;
        let keyForTotalCostOfExtraSpareDetails = `$checkSheet_data.extraSpareDetails.${financialYearWiseMonthKeyArray[j]}.cost`;
        let keyForTotalCostOfExtraSpareDetailsUnwind = `$checkSheet_data.extraSpareDetails.${financialYearWiseMonthKeyArray[j]}`;

        groupData = await Machine.aggregate([
          {
            $match: {
              line_names: ObjectId(line),
              checkSheet_data: { $ne: undefined },
              $or: selectedYearOfCheckSheet,
            },
          },
          {
            $unwind: "$checkSheet_data",
          },
          {
            $match: {
              "checkSheet_data.current_year": selectedYear,
            },
          },
          // { $addFields: { checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] } } },
          { $unwind: keyForTotalCostOfExtraSpareDetailsUnwind },
          {
            $group: {
              _id: "$line_names",
              machine: {
                $push: {
                  machine_code: "$machine_code",
                  machine_name: "$machine_name",
                  checkSheet_data: "$checkSheet_data",
                },
              },
              totalBMSpareCost: {
                $sum: {
                  $cond: [
                    {
                      $eq: [keyForSparePartTypes, "BM"],
                    },
                    keyForTotalCostOfExtraSpareDetails,
                    0,
                  ],
                },
              },
              totalCorrectiveSpareCost: {
                $sum: {
                  $cond: [
                    {
                      $eq: [keyForSparePartTypes, "Corrective"],
                    },
                    keyForTotalCostOfExtraSpareDetails,
                    0,
                  ],
                },
              },
              totalPridictiveSpareCost: {
                $sum: {
                  $cond: [
                    {
                      $eq: [keyForSparePartTypes, "Predictive"],
                    },
                    keyForTotalCostOfExtraSpareDetails,
                    0,
                  ],
                },
              },
              totalKaizenSpareCost: {
                $sum: {
                  $cond: [
                    {
                      $eq: [keyForSparePartTypes, "Kaizen"],
                    },
                    keyForTotalCostOfExtraSpareDetails,
                    0,
                  ],
                },
              },
            },
          },
          {
            $project: {
              _id: 0,
              line_names: "$_id",
              machine: 1,
              totalBMSpareCost: 1,
              totalCorrectiveSpareCost: 1,
              totalPridictiveSpareCost: 1,
              totalKaizenSpareCost: 1,

              // machine_code: 1,
              // checkSheet_data: 1
            },
          },
        ]);

        // console.log(financialYearWiseMonthKeyArray[j], "---------------", groupData)

        if (groupData?.length > 0) {
          for (let i = 0; i < groupData?.length; i++) {
            sumOfTotalBMSpareCost =
              sumOfTotalBMSpareCost + groupData[i]?.totalBMSpareCost;
            sumOfTotalCorrectiveSpareCost =
              sumOfTotalCorrectiveSpareCost +
              groupData[i]?.totalCorrectiveSpareCost;
            sumOfTotalPridictiveSpareCost =
              sumOfTotalPridictiveSpareCost +
              groupData[i]?.totalPridictiveSpareCost;
            sumOfTotalKaizenSpareCost =
              sumOfTotalKaizenSpareCost + groupData[i]?.totalKaizenSpareCost;
          }
        }

        // //push the value of sum of BM category spare details in array
        if (sumOfTotalBMSpareCost > 0) {
          totalMonthlyBMSpareConsumption.push(sumOfTotalBMSpareCost);
        } else {
          totalMonthlyBMSpareConsumption.push(0);
        }
        //push the value of sum of Corrective category spare details in array
        if (sumOfTotalCorrectiveSpareCost > 0) {
          totalMonthlyCorrectiveSpareConsumption.push(
            sumOfTotalCorrectiveSpareCost
          );
        } else {
          totalMonthlyCorrectiveSpareConsumption.push(0);
        }

        //push the value of sum of Pridictive category spare details in array
        if (sumOfTotalPridictiveSpareCost > 0) {
          totalMonthlyPridictiveSpareConsumption.push(
            sumOfTotalPridictiveSpareCost
          );
        } else {
          totalMonthlyPridictiveSpareConsumption.push(0);
        }

        //push the value of sum of Kaizen category spare details in array
        if (sumOfTotalKaizenSpareCost > 0) {
          totalMonthlyKaizenSpareConsumption.push(sumOfTotalKaizenSpareCost);
        } else {
          totalMonthlyKaizenSpareConsumption.push(0);
        }
      }

      // console.log(totalTimeMonthWiseForPerticularLine)

      res.json({
        totalMonthlyPMSpareConsumption,
        totalMonthlyBMSpareConsumption,
        totalMonthlyCorrectiveSpareConsumption,
        totalMonthlyPridictiveSpareConsumption,
        totalMonthlyKaizenSpareConsumption,
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("User id not received!!!");
    }
  }
);

//get data for line wise spare consumption
router.post(
  "/postSectionToGetAllDataForLineWiseSpareConsumption",
  authenticate,
  async (req, res) => {
    try {
      let { section, selectedYear } = req.body;
      // let selectedYear = "2022-2023"
      let loggedUserData = req.rootUser;
      // console.log("____________", sectionInfo[0]._id)
      let subSectionsData,
        subSectionIdArray = [],
        cellData,
        cellIdArray = [],
        lineData,
        lineIdArray = [],
        machineData,
        machineDataForChecksheet,
        subsectionSplitIdArrayForChecksheet = [];

      if (typeof section !== "object") {
        let sectionSplit = section.split("-");
        const sectionInfo = await Section.findOne({
          section_id: sectionSplit[0],
        });
        if (sectionInfo.dashboardLevel === "Yes") {
          subSectionsData = await SubSection.find({
            section_names: sectionInfo._id,
          }).sort({ subSection_sequence: 1 });
        } else {
          loggedUserData.subSection_data.map((ids) => {
            let subsectionsId = ids.split("-");
            subsectionSplitIdArrayForChecksheet.push(subsectionsId[0]);
          });
          subSectionsData = await SubSection.find({
            subSection_id: { $in: subsectionSplitIdArrayForChecksheet },
          }).sort({ subSection_sequence: 1 });
        }
      } else {
        if (section?.dashboardLevel === "Yes") {
          subSectionsData = await SubSection.find({
            section_names: section?._id,
          }).sort({ subSection_sequence: 1 });
        } else {
          subSectionsData = await SubSection.find({ _id: section?._id }).sort({
            subSection_sequence: 1,
          });
        }
      }

      cellData = await Cell.find({
        subSection_names: { $in: subSectionsData?.map((item) => item?._id) },
      }).sort({ cell_sequence: 1 });

      lineData = await Line.find({
        cell_names: { $in: cellData?.map((item) => item?._id) },
      }).sort({ line_sequence: 1 });

      // console.log(lineData)
      let currentYear =
        new Date().getMonth() < 3
          ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
          : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
      let selectedYearOfCheckSheet =
        selectedYear === currentYear
          ? [
              {
                "checkSheet_data.current_year": selectedYear,
              },
              {
                checkSheet_data: [],
              },
            ]
          : [
              {
                "checkSheet_data.current_year": selectedYear,
              },
            ];
      // console.log(selectedYear)
      let groupData, groupData1;

      const financialYearWiseMonthKeyArray = [
        "Apr",
        "May",
        "June",
        "July",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
        "Jan",
        "Feb",
        "Mar",
      ];

      let lineWiseSpareCost = [];

      for (let i = 0; i < lineData?.length; i++) {
        let sumOfTotalPMSpareCost = 0;
        let sumOfTotalBMSpareCost = 0;
        let sumOfTotalCorrectiveSpareCost = 0;
        let sumOfTotalPridictiveSpareCost = 0;
        let sumOfTotalKaizenSpareCost = 0;

        //For Spare PM count
        for (let j = 0; j < financialYearWiseMonthKeyArray.length; j++) {
          let keyOfSpareDetailsExistsOrNot = `checkSheet_data.checkSheet.spareDetails.${financialYearWiseMonthKeyArray[j]}`;
          // let previousMonth = monthKeyArray[j - 1] === undefined ? monthKeyArray.splice(-1)[0] : monthKeyArray[j - 1]
          let keyForSparePartsUsedOrNot = `checkSheet_data.checkSheet.spareDetails.${financialYearWiseMonthKeyArray[j]}.spareParts`;
          let keyForTotalCostOfPMSpareParts = `$checkSheet_data.checkSheet.spareDetails.${financialYearWiseMonthKeyArray[j]}.cost`;
          let keyForSparePartTypes = `$checkSheet_data.extraSpareDetails.${financialYearWiseMonthKeyArray[j]}.type`;
          let keyForTotalCostOfExtraSpareDetails = `$checkSheet_data.extraSpareDetails.${financialYearWiseMonthKeyArray[j]}.cost`;
          let keyForTotalCostOfExtraSpareDetailsUnwind = `$checkSheet_data.extraSpareDetails.${financialYearWiseMonthKeyArray[j]}`;

          groupData = await Machine.aggregate([
            {
              $match: {
                line_names: lineData[i]._id,
                checkSheet_data: { $ne: undefined },
                $or: selectedYearOfCheckSheet,
              },
            },
            {
              $unwind: "$checkSheet_data",
            },
            {
              $match: {
                "checkSheet_data.current_year": selectedYear,
              },
            },
            // { $addFields: { checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] } } },
            { $unwind: "$checkSheet_data.checkSheet" },
            {
              $match: {
                [keyOfSpareDetailsExistsOrNot]: { $ne: undefined },
                [keyForSparePartsUsedOrNot]: { $ne: undefined },
              },
            },
            {
              $group: {
                _id: "$line_names",
                machine: {
                  $push: {
                    machine_code: "$machine_code",
                    machine_name: "$machine_name",
                    checkSheet_data: "$checkSheet_data",
                  },
                },
                totalPMSpareCost: {
                  $sum: keyForTotalCostOfPMSpareParts,
                },
              },
            },
            {
              $project: {
                _id: 1,
                line_names: "$_id",
                machine: 1,
                totalPMSpareCost: 1,
              },
            },
          ]);

          groupData1 = await Machine.aggregate([
            {
              $match: {
                line_names: lineData[i]._id,
                checkSheet_data: { $ne: undefined },
                $or: selectedYearOfCheckSheet,
              },
            },
            {
              $unwind: "$checkSheet_data",
            },
            {
              $match: {
                "checkSheet_data.current_year": selectedYear,
              },
            },
            // { $addFields: { checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] } } },
            { $unwind: keyForTotalCostOfExtraSpareDetailsUnwind },
            {
              $group: {
                _id: "$line_names",
                machine: {
                  $push: {
                    machine_code: "$machine_code",
                    machine_name: "$machine_name",
                    checkSheet_data: "$checkSheet_data",
                  },
                },
                totalBMSpareCost: {
                  $sum: {
                    $cond: [
                      {
                        $eq: [keyForSparePartTypes, "BM"],
                      },
                      keyForTotalCostOfExtraSpareDetails,
                      0,
                    ],
                  },
                },
                totalCorrectiveSpareCost: {
                  $sum: {
                    $cond: [
                      {
                        $eq: [keyForSparePartTypes, "Corrective"],
                      },
                      keyForTotalCostOfExtraSpareDetails,
                      0,
                    ],
                  },
                },
                totalPridictiveSpareCost: {
                  $sum: {
                    $cond: [
                      {
                        $eq: [keyForSparePartTypes, "Predictive"],
                      },
                      keyForTotalCostOfExtraSpareDetails,
                      0,
                    ],
                  },
                },
                totalKaizenSpareCost: {
                  $sum: {
                    $cond: [
                      {
                        $eq: [keyForSparePartTypes, "Kaizen"],
                      },
                      keyForTotalCostOfExtraSpareDetails,
                      0,
                    ],
                  },
                },
              },
            },
            {
              $project: {
                _id: 0,
                line_names: "$_id",
                machine: 1,
                totalBMSpareCost: 1,
                totalCorrectiveSpareCost: 1,
                totalPridictiveSpareCost: 1,
                totalKaizenSpareCost: 1,

                // machine_code: 1,
                // checkSheet_data: 1
              },
            },
          ]);

          // console.log(financialYearWiseMonthKeyArray[j], "---------------", groupData)
          if (groupData?.length > 0) {
            sumOfTotalPMSpareCost =
              sumOfTotalPMSpareCost + groupData[0]?.totalPMSpareCost;
          }
          if (groupData1?.length > 0) {
            for (let i = 0; i < groupData1?.length; i++) {
              sumOfTotalBMSpareCost =
                sumOfTotalBMSpareCost + groupData1[i]?.totalBMSpareCost;
              sumOfTotalCorrectiveSpareCost =
                sumOfTotalCorrectiveSpareCost +
                groupData1[i]?.totalCorrectiveSpareCost;
              sumOfTotalPridictiveSpareCost =
                sumOfTotalPridictiveSpareCost +
                groupData1[i]?.totalPridictiveSpareCost;
              sumOfTotalKaizenSpareCost =
                sumOfTotalKaizenSpareCost + groupData1[i]?.totalKaizenSpareCost;
            }
          }
        }
        lineWiseSpareCost.push(
          new Object({
            line_name: lineData[i]?.line_name,
            sumOfTotalPMSpareCost: sumOfTotalPMSpareCost,
            sumOfTotalBMSpareCost: sumOfTotalBMSpareCost,
            sumOfTotalCorrectiveSpareCost: sumOfTotalCorrectiveSpareCost,
            sumOfTotalPridictiveSpareCost: sumOfTotalPridictiveSpareCost,
            sumOfTotalKaizenSpareCost: sumOfTotalKaizenSpareCost,
          })
        );
      }

      res.json({
        subSectionsData,
        cellData,
        lineData,
        lineWiseSpareCost,
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("User id not received!!!");
    }
  }
);

router.post("/submitRemarksAfterTLOrHosRejection", async (req, res) => {
  try {
    const { machineData, updatedRow, senderApprovalMonth } = req.body;

    let keyOfRemarksAfterRejection = `checkSheet_data.$[outer].checkSheet.$[inner].planningTableAnimationArray2.${senderApprovalMonth}.2`;

    const updateChecksheetRow = await Machine.updateOne(
      { machine_code: machineData?.machine_code },
      {
        $set: {
          [keyOfRemarksAfterRejection]: updatedRow?.remarks,
        },
      },
      {
        arrayFilters: [
          { "outer.current_year": machineData?.checkSheet_data?.current_year },
          { "inner.tableRowId": updatedRow.tableRowId },
        ],
      }
    );

    // console.log(updateChecksheetRow)

    res.status(201).json({ message: "CheckSheet data updated successfully" });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log(error);
    console.log("Data not valid or received !!!");
  }
});

router.post("/deleteCategoryPoint", async (req, res) => {
  try {
    const { rowValue } = req.body;

    let keyOfDeletingExtraSpareDetails = `checkSheet_data.$[outer].extraSpareDetails.${rowValue?.schedule_month}`;

    const updateChecksheetRow = await Machine.updateOne(
      { _id: rowValue?.machineId },
      {
        $pull: { [keyOfDeletingExtraSpareDetails]: { _id: rowValue?._id } },
      },
      {
        arrayFilters: [{ "outer.current_year": rowValue?.yearOfCheckSheet }],
      }
    );

    res.status(201).json({ message: "Spare entry deleted successfully" });
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log(error);
    console.log("Data not valid or received !!!");
  }
});

router.post(
  "/postSectionToGetAllDataForTop20MachineSparePartsReport",
  authenticate,
  async (req, res) => {
    try {
      let { section, selectedYear } = req.body;
      // console.log(section, selectedYear)
      // let selectedYear = "2022-2023"
      let loggedUserData = req.rootUser;
      // console.log("____________", sectionInfo[0]._id)
      let subSectionsData,
        subSectionIdArray = [],
        cellData,
        cellIdArray = [],
        lineData,
        lineIdArray = [],
        machineData,
        machineDataForChecksheet,
        subsectionSplitIdArrayForChecksheet = [];

      if (typeof section !== "object") {
        let sectionSplit = section.split("-");
        const sectionInfo = await Section.findOne({
          section_id: sectionSplit[0],
        });
        if (sectionInfo.dashboardLevel === "Yes") {
          subSectionsData = await SubSection.find({
            section_names: sectionInfo._id,
          }).sort({ subSection_sequence: 1 });
        } else {
          loggedUserData.subSection_data.map((ids) => {
            let subsectionsId = ids.split("-");
            subsectionSplitIdArrayForChecksheet.push(subsectionsId[0]);
          });
          subSectionsData = await SubSection.find({
            subSection_id: { $in: subsectionSplitIdArrayForChecksheet },
          }).sort({ subSection_sequence: 1 });
        }
      } else {
        if (section?.dashboardLevel === "Yes") {
          subSectionsData = await SubSection.find({
            section_names: section?._id,
          }).sort({ subSection_sequence: 1 });
        } else {
          subSectionsData = await SubSection.find({ _id: section?._id }).sort({
            subSection_sequence: 1,
          });
        }
      }
      cellData = await Cell.find({
        subSection_names: { $in: subSectionsData?.map((item) => item?._id) },
      }).sort({ cell_sequence: 1 });

      lineData = await Line.find({
        cell_names: { $in: cellData?.map((item) => item?._id) },
      }).sort({ line_sequence: 1 });

      // machineData = await Machine.find({ line_names: { $in: lineData?.map((item) => item?._id) } }).sort({ machine_sequence: 1 });

      let currentYear =
        new Date().getMonth() < 3
          ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
          : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
      let selectedYearOfCheckSheet =
        selectedYear === currentYear
          ? [
              {
                "checkSheet_data.current_year": selectedYear,
              },
              {
                checkSheet_data: [],
              },
            ]
          : [
              {
                "checkSheet_data.current_year": selectedYear,
              },
            ];
      // console.log(selectedYear)

      machineData = await Machine.aggregate([
        {
          $match: {
            line_names: { $in: lineData?.map((item) => item?._id) },
            $or: selectedYearOfCheckSheet,
            checkSheet_data: { $ne: undefined },
            // "checkSheet_data.checkSheet": { $ne: [] },
          },
        },
        {
          $project: {
            machine_code: 1,
            machine_name: 1,
            machine_nickname: 1,
            machine_sequence: 1,
            installation_date: 1,
            maker_name: 1,
            maker_sr_no: 1,
            manufacturingDate: 1,
            isPM: 1,
            line_names: 1,
            checkSheet_data: 1,
          },
        },
        {
          $unwind: "$checkSheet_data",
        },
        {
          $match: {
            "checkSheet_data.current_year": selectedYear,
          },
        },
        {
          $match: {
            checkSheet_data: { $ne: undefined },
          },
        },
      ]);

      // console.log(machineData)

      let groupData, groupData1;

      const financialYearWiseMonthKeyArray = [
        "Apr",
        "May",
        "June",
        "July",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
        "Jan",
        "Feb",
        "Mar",
      ];

      let top20MachineSparePartConsumption = [];

      for (let i = 0; i < machineData?.length; i++) {
        let sumOfTotalPMSpareCost = 0;
        let sumOfTotalBMSpareCost = 0;
        let sumOfTotalCorrectiveSpareCost = 0;
        let sumOfTotalPridictiveSpareCost = 0;
        let sumOfTotalKaizenSpareCost = 0;
        //For Spare PM count
        for (let j = 0; j < financialYearWiseMonthKeyArray.length; j++) {
          let keyOfSpareDetailsExistsOrNot = `checkSheet_data.checkSheet.spareDetails.${financialYearWiseMonthKeyArray[j]}`;
          // let previousMonth = monthKeyArray[j - 1] === undefined ? monthKeyArray.splice(-1)[0] : monthKeyArray[j - 1]
          let keyForSparePartsUsedOrNot = `checkSheet_data.checkSheet.spareDetails.${financialYearWiseMonthKeyArray[j]}.spareParts`;
          let keyForTotalCostOfPMSpareParts = `$checkSheet_data.checkSheet.spareDetails.${financialYearWiseMonthKeyArray[j]}.cost`;
          let keyForSparePartTypes = `$checkSheet_data.extraSpareDetails.${financialYearWiseMonthKeyArray[j]}.type`;
          let keyForTotalCostOfExtraSpareDetails = `$checkSheet_data.extraSpareDetails.${financialYearWiseMonthKeyArray[j]}.cost`;
          let keyForTotalCostOfExtraSpareDetailsUnwind = `$checkSheet_data.extraSpareDetails.${financialYearWiseMonthKeyArray[j]}`;

          groupData = await Machine.aggregate([
            {
              $match: {
                _id: machineData[i]._id,
                checkSheet_data: { $ne: undefined },
                $or: selectedYearOfCheckSheet,
              },
            },
            {
              $unwind: "$checkSheet_data",
            },
            {
              $match: {
                "checkSheet_data.current_year": selectedYear,
              },
            },
            // { $addFields: { checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] } } },
            { $unwind: "$checkSheet_data.checkSheet" },
            {
              $match: {
                [keyOfSpareDetailsExistsOrNot]: { $ne: undefined },
                [keyForSparePartsUsedOrNot]: { $ne: undefined },
              },
            },
            {
              $group: {
                _id: "$_id",
                machine: {
                  $push: {
                    machine_code: "$machine_code",
                    machine_name: "$machine_name",
                    checkSheet_data: "$checkSheet_data",
                    line_names: "$line_names",
                  },
                },
                totalPMSpareCost: {
                  $sum: keyForTotalCostOfPMSpareParts,
                },
              },
            },
            {
              $project: {
                _id: 1,
                machine: 1,
                totalPMSpareCost: 1,
              },
            },
          ]);

          groupData1 = await Machine.aggregate([
            {
              $match: {
                _id: machineData[i]._id,
                checkSheet_data: { $ne: undefined },
                $or: selectedYearOfCheckSheet,
              },
            },
            {
              $unwind: "$checkSheet_data",
            },
            {
              $match: {
                "checkSheet_data.current_year": selectedYear,
              },
            },
            // { $addFields: { checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] } } },
            { $unwind: keyForTotalCostOfExtraSpareDetailsUnwind },
            {
              $group: {
                _id: "$_id",
                machine: {
                  $push: {
                    machine_code: "$machine_code",
                    machine_name: "$machine_name",
                    checkSheet_data: "$checkSheet_data",
                    line_names: "$line_names",
                  },
                },
                totalBMSpareCost: {
                  $sum: {
                    $cond: [
                      {
                        $eq: [keyForSparePartTypes, "BM"],
                      },
                      keyForTotalCostOfExtraSpareDetails,
                      0,
                    ],
                  },
                },
                totalCorrectiveSpareCost: {
                  $sum: {
                    $cond: [
                      {
                        $eq: [keyForSparePartTypes, "Corrective"],
                      },
                      keyForTotalCostOfExtraSpareDetails,
                      0,
                    ],
                  },
                },
                totalPridictiveSpareCost: {
                  $sum: {
                    $cond: [
                      {
                        $eq: [keyForSparePartTypes, "Predictive"],
                      },
                      keyForTotalCostOfExtraSpareDetails,
                      0,
                    ],
                  },
                },
                totalKaizenSpareCost: {
                  $sum: {
                    $cond: [
                      {
                        $eq: [keyForSparePartTypes, "Kaizen"],
                      },
                      keyForTotalCostOfExtraSpareDetails,
                      0,
                    ],
                  },
                },
              },
            },
            {
              $project: {
                _id: 0,
                machine: 1,
                totalBMSpareCost: 1,
                totalCorrectiveSpareCost: 1,
                totalPridictiveSpareCost: 1,
                totalKaizenSpareCost: 1,

                // machine_code: 1,
                // checkSheet_data: 1
              },
            },
          ]);

          if (groupData?.length > 0) {
            // console.log(financialYearWiseMonthKeyArray[j], "---------------",groupData[0].machine[0].machine_code,"=====>", groupData)

            sumOfTotalPMSpareCost =
              sumOfTotalPMSpareCost + groupData[0]?.totalPMSpareCost;
          }
          if (groupData1?.length > 0) {
            for (let i = 0; i < groupData1?.length; i++) {
              sumOfTotalBMSpareCost =
                sumOfTotalBMSpareCost + groupData1[i]?.totalBMSpareCost;
              sumOfTotalCorrectiveSpareCost =
                sumOfTotalCorrectiveSpareCost +
                groupData1[i]?.totalCorrectiveSpareCost;
              sumOfTotalPridictiveSpareCost =
                sumOfTotalPridictiveSpareCost +
                groupData1[i]?.totalPridictiveSpareCost;
              sumOfTotalKaizenSpareCost =
                sumOfTotalKaizenSpareCost + groupData1[i]?.totalKaizenSpareCost;
            }
          }
        }

        if (
          sumOfTotalPMSpareCost ||
          sumOfTotalBMSpareCost ||
          sumOfTotalCorrectiveSpareCost ||
          sumOfTotalPridictiveSpareCost ||
          sumOfTotalKaizenSpareCost
        ) {
          let totalCost =
            sumOfTotalPMSpareCost +
            sumOfTotalBMSpareCost +
            sumOfTotalCorrectiveSpareCost +
            sumOfTotalPridictiveSpareCost +
            sumOfTotalKaizenSpareCost;
          top20MachineSparePartConsumption.push(
            new Object({
              line_names: machineData[i]?.line_names,
              machine_name: machineData[i]?.machine_name,
              machine_code: machineData[i]?.machine_code,
              cost: totalCost,
            })
          );
        }
      }

      top20MachineSparePartConsumption = await Machine.populate(
        top20MachineSparePartConsumption,
        { path: "line_names" }
      );
      top20MachineSparePartConsumption = top20MachineSparePartConsumption
        .sort((a, b) => parseFloat(b.cost) - parseFloat(a.cost))
        .slice(0, 20);
      res.json({
        subSectionsData,
        cellData,
        lineData,
        top20MachineSparePartConsumption,
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("User id not received!!!");
    }
  }
);

//get summuary data for perticular machine in checksheet
router.post(
  "/postMachineToGetAllDataForSummary",
  authenticate,
  async (req, res) => {
    try {
      let { machine_code, selectedYear } = req.body;
      let loggedUserData = req.rootUser;

      machineData = await Machine.aggregate([
        {
          $match: {
            machine_code: machine_code,
            "checkSheet_data.current_year": selectedYear,
            checkSheet_data: { $ne: undefined },
          },
        },
        {
          $unwind: "$checkSheet_data",
        },
        {
          $match: {
            "checkSheet_data.current_year": selectedYear,
          },
        },
        {
          $project: {
            machine_code: 1,
            machine_name: 1,
            machine_nickname: 1,
            machine_sequence: 1,
            installation_date: 1,
            maker_name: 1,
            maker_sr_no: 1,
            manufacturingDate: 1,
            isPM: 1,
            line_names: 1,
            checkSheet_data: 1,
          },
        },
        {
          $sort: {
            machine_sequence: 1,
          },
        },
      ]);
      machineData = await Machine.populate(machineData, {
        path: "line_names",
        populate: { path: "cell_names", model: "Cells" },
      });
      // console.log(machineData)
      const financialYearWiseMonthKeyArray = [
        "Apr",
        "May",
        "June",
        "July",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
        "Jan",
        "Feb",
        "Mar",
      ];
      let logHistoryAllData = [],
        serialNoForLogHistory = 0;
      machineData?.map((keyForCheckSheet) => {
        keyForCheckSheet?.checkSheet_data?.checkSheet?.map(
          (keyOfChecksheetData) => {
            for (let i = 0; i < financialYearWiseMonthKeyArray.length; i++) {
              let month = financialYearWiseMonthKeyArray[i];
              if (
                keyOfChecksheetData?.planningTableAnimationArray2?.[
                  month
                ][0] === "1" ||
                keyOfChecksheetData?.planningTableAnimationArray2?.[month]
                  ?.length >= 2
              ) {
                let abnormality = keyOfChecksheetData?.abnormalityDetails?.[
                  month
                ]?.abnormalityRemarks
                  ? "Yes"
                  : "No";

                logHistoryAllData.push(
                  new Object({
                    sr_no: ++serialNoForLogHistory,
                    schedule_month: month,
                    cell_names: keyForCheckSheet?.line_names?.cell_names,
                    line_names: keyForCheckSheet?.line_names,
                    machine_code: keyForCheckSheet?.machine_code,
                    machine_name: keyForCheckSheet?.machine_name,
                    tableRowId: keyOfChecksheetData?.tableRowId,
                    inspection_parent_name:
                      keyOfChecksheetData?.inspection_parent_name,
                    remarks:
                      keyOfChecksheetData?.planningTableAnimationArray2?.[
                        month
                      ]?.[2],
                    completionDateOfInspection:
                      keyOfChecksheetData?.completionDateOfInspection?.[month],
                    remarksOfWorkedImplementaion:
                      keyOfChecksheetData?.planningTableAnimationArray2?.[
                        month
                      ]?.[2],
                    abnormality,
                    abnormalityRemarks:
                      keyOfChecksheetData?.abnormalityDetails?.[month]
                        ?.abnormalityRemarks,
                    abnormalityStatus:
                      keyOfChecksheetData?.abnormalityDetails?.[month]
                        ?.abnormalityStatus,
                    targetDate:
                      keyOfChecksheetData?.abnormalityDetails?.[month]
                        ?.targetDate,
                    spareParts:
                      keyOfChecksheetData?.spareDetails?.[month]?.spareParts,
                    partName:
                      keyOfChecksheetData?.spareDetails?.[month]?.partName,
                    partNo: keyOfChecksheetData?.spareDetails?.[month]?.partNo,
                    cost: keyOfChecksheetData?.spareDetails?.[month]?.cost,
                    doneBy:
                      keyOfChecksheetData?.inspectionCompletionBy?.[month],
                  })
                );
              }
            }
          }
        );
      });

      res.json({ logHistoryAllData });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log("2032", error);
      console.log("Filename not received");
    }
  }
);

router.post(
  "/fetchSectionWiseLogHistory/:id",
  authenticate,
  async (req, res) => {
    try {
      const { section, selectedYear } = req.body;

      let logHistoryData, conditionVarForLogHistory;
      let commonFilterForSectionLevel = {
        reason_for_delay: conditionVarForLogHistory,
        current_year: selectedYear,
      };
      conditionVarForLogHistory =
        req.params.id === "simpleLogHistory" ? undefined : { $ne: undefined };

      if (typeof section !== "object") {
        const sectionInfo = await Section.findOne({
          section_id: section?.split("-")?.[0],
        }).populate({ path: "plant_names" });

        if (sectionInfo?.dashboardLevel === "Yes") {
          commonFilterForSectionLevel = {
            ...commonFilterForSectionLevel,
            "sectionOrSubSectionInfo.sectionOrSubSection_Id":
              sectionInfo?.section_id,
          };
        } else {
          commonFilterForSectionLevel = {
            ...commonFilterForSectionLevel,
            "sectionOrSubSectionInfo.sectionOrSubSection_Id": {
              $in: req?.rootUser?.subSection_data?.map(
                (item, index) => item?.split("-")?.[0]
              ),
            },
          };
        }

        logHistoryData = await LogHistory.aggregate([
          {
            $match: {
              ...commonFilterForSectionLevel,
            },
          },
          {
            $addFields: {
              abnormality: {
                $cond: {
                  if: { $gt: [{ $type: "$abnormality_remarks" }, "missing"] },
                  then: "Yes",
                  else: "No",
                },
              },
            },
          },
        ]);
      } else {
        if (section?.dashboardLevel === "Yes") {
          const sectionInfo = await Section.findOne({
            _id: section?._id,
          }).populate({ path: "plant_names" });

          commonFilterForSectionLevel = {
            ...commonFilterForSectionLevel,
            "sectionOrSubSectionInfo.sectionOrSubSection_Id":
              sectionInfo?.section_id,
          };
        } else {
          let subSectionInfo = await SubSection.findOne({
            _id: section?._id,
          });
          commonFilterForSectionLevel = {
            ...commonFilterForSectionLevel,
            "sectionOrSubSectionInfo.sectionOrSubSection_Id":
              subSectionInfo?.subSection_id,
          };
        }
        logHistoryData = await LogHistory.aggregate([
          {
            $match: {
              ...commonFilterForSectionLevel,
            },
          },
          {
            $addFields: {
              abnormality: {
                $cond: {
                  if: { $gt: [{ $type: "$abnormality_remarks" }, "missing"] },
                  then: "Yes",
                  else: "No",
                },
              },
            },
          },
        ]);
      }
      // console.log(
      //     logHistoryData
      // )

      // const logHistoryData = await LogHistory.find({ section_names: sectionInfo._id }).sort({ subSection_sequence: 1 })

      res.status(201).json({ logHistoryData });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      console.log("Data not valid or received !!!");
    }
  }
);

router.get(
  "/downloadUploadedImage/:fileName",
  authenticate,
  async (req, res) => {
    try {
      // console.log(req?.params?.fileName)
      res.download(
        path.join(__dirname, `../PMimages/${req?.params?.fileName}`)
      );
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log("Filename not received");
    }
  }
);

// router.get('/dummyApi', authenticate, async (req, res) => {
//     try {

//         const findFinancialYear = await FinancialYear1.findOne({ yearDropdownID: "FY01" })

//         let current_year = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`

//         if (findFinancialYear) {
//             if (!findFinancialYear?.financialYears?.includes(current_year)) {
//                 addNewFinancialYears = await FinancialYear1.updateOne({ yearDropdownID: "FY01" }, {
//                     $push: {
//                         financialYears: current_year
//                     }
//                 })
//             }
//             console.log("true")

//         } else {
//             addNewFinancialYears = await new FinancialYear1({
//                 yearDropdownID: "FY01",
//                 financialYears: current_year
//             })
//             addNewFinancialYears.save()
//             console.log("false")

//         }

//     } catch (error) {
//         console.log(error);
//     }
// })

// router.get('/dummyApi', authenticate, async (req, res) => {
//     try {

//         let currentYear =
//             new Date().getMonth() < 3 ?
//                 `${new Date().getFullYear() - 1}-${new Date().getFullYear()}` :
//                 `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

//         let plantInfo = await Plant.find({})

//         let subSectionsData,
//             cellData,
//             lineData,
//             MachineInfo,
//             userInfo

//         let KeyFor6MonthApproval = {

//             Sep: [],

//             Mar: [],

//         }

//         const monthKeyArray = [
//             "Jan",
//             "Feb",
//             "Mar",
//             "Apr",
//             "May",
//             "June",
//             "July",
//             "Aug",
//             "Sep",
//             "Oct",
//             "Nov",
//             "Dec",
//         ];
//         let currentMonth = monthKeyArray[new Date().getMonth()];

//         // console.log(currentMonth)

//         //  ------------------------------------- Real --------------------------------------------
//         let keyOfImplementation_assign_MTD_HOD = `checkSheet_data.$[outer].implementation_assign_MTD_HOD.${currentMonth}`;
//         let keyOfImplemetation_mtd_hod_approval_status = `checkSheet_data.$[outer].implemetation_mtd_hod_approval_status.${currentMonth}`
//         let keyOfImplementation_assign_MTD_HOD_name = `checkSheet_data.$[outer].implementation_assign_MTD_HOD_name.${currentMonth}`;

//         //  ------------------------------------- For Testing --------------------------------------------
//         // let keyOfImplementation_assign_MTD_HOD = `checkSheet_data.$[outer].implementation_assign_MTD_HOD.Sep`;
//         // let keyOfImplemetation_mtd_hod_approval_status = `checkSheet_data.$[outer].implemetation_mtd_hod_approval_status.Sep`
//         // let keyOfImplementation_assign_MTD_HOD_name = `checkSheet_data.$[outer].implementation_assign_MTD_HOD_name.Sep`;

//         const funForUpdateParticularMachine = async (sectionOrSubSectionData, userInfo, particularMachineData) => {

//             // console.log(sectionOrSubSectionData, "=============>", particularMachineData)

//             // console.log(particularMachineData)

//             if (!particularMachineData?.checkSheet_data?.implementation_assign_MTD_HOD_name) {
//                 await Machine.updateOne({ machine_code: particularMachineData.machine_code }, {
//                     $set: {
//                         //  ------------------------------------- Real --------------------------------------------
//                         "checkSheet_data.$[outer].implementation_approval_month_of_hod": currentMonth,

//                         //  ------------------------------------- For Testing --------------------------------------------
//                         // "checkSheet_data.$[outer].implementation_approval_month_of_hod": "Sep",

//                         "checkSheet_data.$[outer].implementation_assign_MTD_HOD": KeyFor6MonthApproval,
//                         "checkSheet_data.$[outer].implementation_assign_MTD_HOD_name": KeyFor6MonthApproval,
//                         // "checkSheet_data.$[outer].implementation_approved_by_MTD_HOD": KeyFor6MonthApproval,
//                         "checkSheet_data.$[outer].implemetation_mtd_hod_approval_status": KeyFor6MonthApproval,
//                     }
//                 }, {
//                     arrayFilters: [{ 'outer.current_year': currentYear }],
//                 })
//                 // console.log(updateImplementationData)
//             }

//             const updateImplementationCompletionPhase = await Machine.updateOne({ machine_code: particularMachineData.machine_code }, {
//                 $set: {

//                     //  ------------------------------------- Real --------------------------------------------
//                     "checkSheet_data.$[outer].implementation_approval_month_of_hod": currentMonth,

//                     //  ------------------------------------- For Testing --------------------------------------------
//                     // "checkSheet_data.$[outer].implementation_approval_month_of_hod": "Sep",
//                 },
//                 $push: {

//                     [keyOfImplemetation_mtd_hod_approval_status]: "Pending",
//                     [keyOfImplementation_assign_MTD_HOD]: userInfo.email,
//                     [keyOfImplementation_assign_MTD_HOD_name]: userInfo.tm_name,
//                 }
//             }, {
//                 arrayFilters: [{ 'outer.current_year': currentYear }],
//             })

//             console.log(updateImplementationCompletionPhase)

//         }

//         for (let i = 0; i < plantInfo?.length; i++) {

//             // userInfo = await User.find({ section_data: `${sectionInfo[i]?.section_id}-${sectionInfo[i]?.section_name}` });

//             userInfo = await User.find(
//                 {
//                     plant_data: `${plantInfo[i]?.plant_id}-${plantInfo[i]?.plant_name}`,
//                     tm_grade: "HOD",
//                     tm_department: "MTD"
//                 },

//             )

//             // console.log(`${sectionInfo[i]?.section_id}-${sectionInfo[i]?.section_name}`, userInfo?.[0])

//             sectionInfo = await Section.find({ plant_names: plantInfo[i]?._id })

//             subSectionsData = await SubSection.find({ section_names: { $in: sectionInfo?.map((item) => item._id) } }).sort({ subSection_sequence: 1 })

//             cellData = await Cell.find({ subSection_names: { $in: subSectionsData?.map((item) => item._id) } }).sort({ cell_sequence: 1 });

//             lineData = await Line.find({ cell_names: { $in: cellData?.map((item) => item._id) } }).sort({ line_sequence: 1 });

//             // console.log("=========>  ", i, "<============", lineData)

//             MachineInfo = await Machine.aggregate([{
//                 $match: {
//                     line_names: { $in: lineData?.map((item) => item?._id) },
//                     $or: [
//                         {
//                             "checkSheet_data": { $ne: [] }

//                         },
//                         {
//                             "checkSheet_data.current_year": currentYear

//                         },

//                     ]
//                 }
//             },
//             {
//                 $project: {
//                     machine_code: 1,
//                     machine_name: 1,
//                     machine_nickname: 1,
//                     machine_sequence: 1,
//                     // installation_date: 1,
//                     // maker_name: 1,
//                     // maker_sr_no: 1,
//                     // manufacturingDate: 1,
//                     // isPM: 1,
//                     line_names: 1,
//                     // checkSheet_data: 1
//                     checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] }
//                 }
//             }
//             ])

//             // MachineInfo = await Machine.populate(MachineInfo, { path: "line_names", populate: { path: "cell_names", model: "Cells" } })

//             MachineInfo?.map(item => {
//                 // console.log(item)
//                 if (userInfo?.length > 0) {

//                     funForUpdateParticularMachine(sectionInfo[i], userInfo?.[0], item)
//                 }

//             })
//             // console.log("=========>  ", i, "<============", MachineInfo)

//         }

//     } catch (error) {
//         console.log(error)
//     }
// })

// router.get('/dummyApi', authenticate, async (req, res) => {
//     try {

//         const commonVarForMonthlyApproval = {
//             checkedByTL: undefined,

//             assignHOS: undefined,
//             approvedByHOS: "",

//             assignHOD: undefined,
//             approvedByHODIfDelay: "",
//             remarksIfDelay: "",
//         }

//         let monthlyApprovalData = {
//             Apr: commonVarForMonthlyApproval,

//             May: commonVarForMonthlyApproval,

//             June: commonVarForMonthlyApproval,

//             July: commonVarForMonthlyApproval,

//             Aug: commonVarForMonthlyApproval,

//             Sep: commonVarForMonthlyApproval,

//             Oct: commonVarForMonthlyApproval,

//             Nov: commonVarForMonthlyApproval,

//             Dec: commonVarForMonthlyApproval,

//             Jan: commonVarForMonthlyApproval,

//             Feb: commonVarForMonthlyApproval,

//             Mar: commonVarForMonthlyApproval,
//         }
//         let currentYear =
//             new Date().getMonth() < 3 ?
//                 `${new Date().getFullYear() - 1}-${new Date().getFullYear()}` :
//                 `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

//         let result = await Line.updateMany(
//             {},
//             {
//                 $set: {
//                     annualPmScheduleApproval: {
//                         current_year: currentYear,
//                         monthlyApprovalData: monthlyApprovalData
//                     },
//                 }
//             }
//         )
//         console.log(result)
//     } catch (error) {
//         console.log("Filename not received");
//     }
// })

router.post("/postEmailConfiguration", async (req, res) => {
  try {
    const { values } = req.body;
    // console.log(values)

    let addEmailConf = await EmailConfigurations.findOne({
      emailConfID: "EmailConf1",
    });
    let updateEmailConf, addNewEmailConf, result;
    if (addEmailConf) {
      updateEmailConf = await EmailConfigurations.updateOne(
        {
          emailConfID: "EmailConf1",
        },
        {
          $set: {
            serverIP: values.server_ip,
            emailPort: values.email_port,
            fromEmailId: values.email,
            emailForSpareRequest: values.emailForSpareRequest,
          },
        }
      );
    } else {
      addNewEmailConf = await new EmailConfigurations({
        emailConfID: "EmailConf1",
        serverIP: values.server_ip,
        emailPort: values.email_port,
        fromEmailId: values.email,
        emailForSpareRequest: values.emailForSpareRequest,
      });
      result = addNewEmailConf.save();
    }

    if (addNewEmailConf || updateEmailConf) {
      res.status(201).json({ message: "Email configuration added !!!" });
    } else {
      res.status(422).json({ message: "Email configuration not added !!!" });
    }
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log(error);
    console.log("User id not received!!!");
  }
});

//Get the data from database and show on User management table
router.get("/fetchEmailConfigurationData", authenticate, async (req, res) => {
  try {
    const addEmailConf = await EmailConfigurations.findOne({
      emailConfID: "EmailConf1",
    });
    res.json(addEmailConf);
  } catch (error) {
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
    console.log("Email data not send or get!!!");
  }
});

router.post(
  "/supportingOperatorListForReportDashboard",
  authenticate,
  async (req, res) => {
    try {
      const { section } = req.body;
      let loggedUserData = req.rootUser;
      let supportingOperatorListForReportDashboard,
        subSectionsData,
        SectionsData;
      if (typeof section !== "object") {
        let sectionSplit = loggedUserData.section_data.split("-");
        const sectionInfo = await Section.findOne({
          section_id: sectionSplit[0],
        });

        if (sectionInfo.dashboardLevel === "Yes") {
          supportingOperatorListForReportDashboard = await User.find({
            section_data: loggedUserData.section_data,
            user_type: "Operator",
          });
        } else {
          supportingOperatorListForReportDashboard = await User.find({
            section_data: loggedUserData.section_data,
            subSection_data: { $in: loggedUserData.subSection_data },
            user_type: "Operator",
          });
        }
      } else {
        if (section?.dashboardLevel === "Yes") {
          SectionsData = await Section.findOne({ _id: section?._id }).sort({
            section_sequence: 1,
          });
          supportingOperatorListForReportDashboard = await User.find({
            section_data: `${SectionsData.section_id}-${SectionsData.section_name}`,
            user_type: "Operator",
          });
        } else {
          subSectionsData = await SubSection.findOne({
            _id: section?._id,
          }).sort({ subSection_sequence: 1 });
          supportingOperatorListForReportDashboard = await User.find({
            section_data: loggedUserData.section_data,
            user_type: "Operator",
          });
        }
      }
      res.send({ supportingOperatorListForReportDashboard });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
    }
  }
);

router.get(
  "/getMachineWithSelectedYear/:selectedId",
  authenticate,
  async (req, res, next) => {
    try {
      const machine = await Machine.aggregate([
        {
          $match: {
            _id: mongoose.Types.ObjectId(req.params?.selectedId),
          },
        },
        {
          $unwind: "$checkSheet_data",
        },
        {
          $match: req.query,
        },
      ]);

      res.status(201).json({
        message: "Machine data get successfully",
        machine: machine?.[0],
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.post(
  "/submitDataOfTheEditedApproval/:selectedYear",
  async (req, res, next) => {
    try {
      const { editedApprovalData } = req?.body;

      let queryObjForUpdateFields = {},
        queryObjForPushData = {};

      // console.log(editedApprovalData);

      let machineCheckSheetData = await Machine.aggregate([
        {
          $match: {
            ...req?.query,
          },
        },
        { $unwind: "$checkSheet_data" },
        {
          $match: {
            "checkSheet_data.current_year": req?.params?.selectedYear,
          },
        },
        {
          $project: {
            machine_code: 1,
            machine_name: 1,
            machine_nickname: 1,
            machine_sequence: 1,
            installation_date: 1,
            maker_name: 1,
            maker_sr_no: 1,
            manufacturingDate: 1,
            isPM: 1,
            line_names: 1,
            checkSheet_data: 1,
          },
        },
      ]);

      const updateAndPushApprovalDataOfImplementation = async (
        userDepAndType
      ) => {
        let keyOfImplemetationUserApprovalStatus = `checkSheet_data.$[outer].implemetation_${userDepAndType.toLowerCase()}_approval_status.${
          editedApprovalData?.selectedMonth
        }`;
        let keyOfImplementationApprovedByUserName = `checkSheet_data.$[outer].implementation_approved_by_${userDepAndType}.${editedApprovalData?.selectedMonth}`;
        let keyOfImplementationApprovedDate = `checkSheet_data.$[outer].implementation_approved_${userDepAndType}_date.${editedApprovalData?.selectedMonth}`;
        let keyOfImplementationAssignUserEmail = `checkSheet_data.$[outer].implementation_assign_${userDepAndType}.${editedApprovalData?.selectedMonth}`;
        let keyOfImplementationAssignUserName = `checkSheet_data.$[outer].implementation_assign_${userDepAndType}_name.${editedApprovalData?.selectedMonth}`;
        let keyOfImplementationAssignUserTmNo = `checkSheet_data.$[outer].implementation_assign_${userDepAndType}_tm_no.${editedApprovalData?.selectedMonth}`;

        let arrayOfKeyForAddingMonthsKey = [
          `implemetation_${userDepAndType.toLowerCase()}_approval_status`,
          `implementation_approved_by_${userDepAndType}`,
          `implementation_approved_${userDepAndType}_date`,
          `implementation_assign_${userDepAndType}`,
          `implementation_assign_${userDepAndType}_name`,
          `implementation_assign_${userDepAndType}_tm_no`,
        ];

        const updateFieldForEmptyOrSomeFieldsContainOfApprover = async (
          keyForAddEmptyArrayofMonthsOfImplementationApprovalFields,
          updateFieldWithAllMonthOrSix
        ) => {
          const updateFieldsWithAllMonthsData = await Machine.updateOne(
            { ...req?.query },
            {
              $set: {
                [keyForAddEmptyArrayofMonthsOfImplementationApprovalFields]:
                  updateFieldWithAllMonthOrSix,
              },
            },
            {
              arrayFilters: [
                {
                  "outer.current_year": req?.params?.selectedYear,
                },
              ],
            }
          );
        };

        for (
          let index = 0;
          index < arrayOfKeyForAddingMonthsKey?.length;
          index++
        ) {
          let updateFieldWithAllMonthOrSix = {};

          userDepAndType !== "MTD_HOD"
            ? (updateFieldWithAllMonthOrSix = {
                Apr: [],

                May: [],

                June: [],

                July: [],

                Aug: [],

                Sep: [],

                Oct: [],

                Nov: [],

                Dec: [],

                Jan: [],

                Feb: [],

                Mar: [],
              })
            : (updateFieldWithAllMonthOrSix = {
                Sep: [],

                Mar: [],
              });
          let keyForAddEmptyArrayofMonthsOfImplementationApprovalFields;
          if (
            machineCheckSheetData?.[0]?.checkSheet_data?.[
              arrayOfKeyForAddingMonthsKey?.[index]
            ]
          ) {
            if (
              Object.keys(
                machineCheckSheetData?.[0]?.checkSheet_data?.[
                  arrayOfKeyForAddingMonthsKey?.[index]
                ]
              )?.length <= 12
            ) {
              Object.keys(
                machineCheckSheetData?.[0]?.checkSheet_data?.[
                  arrayOfKeyForAddingMonthsKey?.[index]
                ]
              )?.map((key) => {
                updateFieldWithAllMonthOrSix[key] =
                  machineCheckSheetData?.[0]?.checkSheet_data?.[
                    arrayOfKeyForAddingMonthsKey?.[index]
                  ]?.[key];
              });
              keyForAddEmptyArrayofMonthsOfImplementationApprovalFields = `checkSheet_data.$[outer].${[
                arrayOfKeyForAddingMonthsKey?.[index],
              ]}`;

              updateFieldForEmptyOrSomeFieldsContainOfApprover(
                keyForAddEmptyArrayofMonthsOfImplementationApprovalFields,
                updateFieldWithAllMonthOrSix
              );
            }
          }
          if (
            machineCheckSheetData?.[0]?.checkSheet_data?.[
              arrayOfKeyForAddingMonthsKey?.[index]
            ] === undefined
          ) {
            keyForAddEmptyArrayofMonthsOfImplementationApprovalFields = `checkSheet_data.$[outer].${[
              arrayOfKeyForAddingMonthsKey?.[index],
            ]}`;

            updateFieldForEmptyOrSomeFieldsContainOfApprover(
              keyForAddEmptyArrayofMonthsOfImplementationApprovalFields,
              updateFieldWithAllMonthOrSix
            );
          }
        }

        let commonEditedFields = async () => {
          machineCheckSheetData[0].checkSheet_data[
            `implemetation_${userDepAndType.toLowerCase()}_approval_status`
          ][`${editedApprovalData?.selectedMonth}`][
            machineCheckSheetData[0].checkSheet_data[
              `implemetation_${userDepAndType.toLowerCase()}_approval_status`
            ][`${editedApprovalData?.selectedMonth}`].length -
              1 <
            0
              ? 0
              : machineCheckSheetData[0].checkSheet_data[
                  `implemetation_${userDepAndType.toLowerCase()}_approval_status`
                ][`${editedApprovalData?.selectedMonth}`].length - 1
          ] = "Accepted";

          machineCheckSheetData[0].checkSheet_data[
            `implementation_assign_${userDepAndType}`
          ][`${editedApprovalData?.selectedMonth}`][
            machineCheckSheetData[0].checkSheet_data[
              `implementation_assign_${userDepAndType}`
            ][`${editedApprovalData?.selectedMonth}`].length -
              1 <
            0
              ? 0
              : machineCheckSheetData[0].checkSheet_data[
                  `implementation_assign_${userDepAndType}`
                ][`${editedApprovalData?.selectedMonth}`].length - 1
          ] =
            editedApprovalData?.[`${userDepAndType.toLowerCase()}_list`]?.email;

          machineCheckSheetData[0].checkSheet_data[
            `implementation_assign_${userDepAndType}_name`
          ][`${editedApprovalData?.selectedMonth}`][
            machineCheckSheetData[0].checkSheet_data[
              `implementation_assign_${userDepAndType}_name`
            ][`${editedApprovalData?.selectedMonth}`].length -
              1 <
            0
              ? 0
              : machineCheckSheetData[0].checkSheet_data[
                  `implementation_assign_${userDepAndType}_name`
                ][`${editedApprovalData?.selectedMonth}`].length - 1
          ] =
            editedApprovalData?.[
              `${userDepAndType.toLowerCase()}_list`
            ]?.tm_name;

          if (userDepAndType !== "MTD_HOD")
            machineCheckSheetData[0].checkSheet_data[
              `implementation_assign_${userDepAndType}_tm_no`
            ][`${editedApprovalData?.selectedMonth}`][
              machineCheckSheetData[0].checkSheet_data[
                `implementation_assign_${userDepAndType}_tm_no`
              ][`${editedApprovalData?.selectedMonth}`].length -
                1 <
              0
                ? 0
                : machineCheckSheetData[0].checkSheet_data[
                    `implementation_assign_${userDepAndType}_tm_no`
                  ][`${editedApprovalData?.selectedMonth}`].length - 1
            ] =
              editedApprovalData?.[
                `${userDepAndType.toLowerCase()}_list`
              ]?.tm_no;

          //for adding in query
          queryObjForUpdateFields = {
            ...queryObjForUpdateFields,
            [keyOfImplemetationUserApprovalStatus]:
              machineCheckSheetData[0].checkSheet_data[
                `implemetation_${userDepAndType.toLowerCase()}_approval_status`
              ][`${editedApprovalData?.selectedMonth}`],
            [keyOfImplementationAssignUserEmail]:
              machineCheckSheetData[0].checkSheet_data[
                `implementation_assign_${userDepAndType}`
              ][`${editedApprovalData?.selectedMonth}`],
            [keyOfImplementationAssignUserName]:
              machineCheckSheetData[0].checkSheet_data[
                `implementation_assign_${userDepAndType}_name`
              ][`${editedApprovalData?.selectedMonth}`],
          };
          if (userDepAndType !== "MTD_HOD") {
            queryObjForUpdateFields = {
              ...queryObjForUpdateFields,
              [keyOfImplementationAssignUserTmNo]:
                machineCheckSheetData[0].checkSheet_data[
                  `implementation_assign_${userDepAndType}_tm_no`
                ][`${editedApprovalData?.selectedMonth}`],
            };
          }
        };

        let commonPushFields = async () => {
          queryObjForPushData = {
            ...queryObjForPushData,
            [keyOfImplementationApprovedByUserName]:
              editedApprovalData?.[`${userDepAndType.toLowerCase()}_list`]
                ?.tm_name,
            [keyOfImplementationApprovedDate]:
              editedApprovalData?.[
                `implementation_approved_${userDepAndType}_date`
              ],
          };
        };

        //if Accepted any approval
        if (
          machineCheckSheetData?.[0]?.checkSheet_data?.[
            `implemetation_${userDepAndType.toLowerCase()}_approval_status`
          ]?.[`${editedApprovalData?.selectedMonth}`]?.[
            machineCheckSheetData?.[0]?.checkSheet_data?.[
              `implemetation_${userDepAndType.toLowerCase()}_approval_status`
            ]?.[`${editedApprovalData?.selectedMonth}`]?.length -
              1 <
            0
              ? 0
              : machineCheckSheetData?.[0]?.checkSheet_data?.[
                  `implemetation_${userDepAndType.toLowerCase()}_approval_status`
                ]?.[`${editedApprovalData?.selectedMonth}`]?.length - 1
          ] === "Accepted"
        ) {
          // console.log("------Accepted called----------------");
          machineCheckSheetData[0].checkSheet_data[
            `implementation_approved_by_${userDepAndType}`
          ][`${editedApprovalData?.selectedMonth}`][
            machineCheckSheetData[0].checkSheet_data[
              `implementation_approved_by_${userDepAndType}`
            ][`${editedApprovalData?.selectedMonth}`].length -
              1 <
            0
              ? 0
              : machineCheckSheetData[0].checkSheet_data[
                  `implementation_approved_by_${userDepAndType}`
                ][`${editedApprovalData?.selectedMonth}`].length - 1
          ] =
            editedApprovalData[`${userDepAndType.toLowerCase()}_list`]?.tm_name;

          machineCheckSheetData[0].checkSheet_data[
            `implementation_approved_${userDepAndType}_date`
          ][`${editedApprovalData?.selectedMonth}`][
            machineCheckSheetData[0].checkSheet_data[
              `implementation_approved_${userDepAndType}_date`
            ][`${editedApprovalData?.selectedMonth}`].length -
              1 <
            0
              ? 0
              : machineCheckSheetData[0].checkSheet_data[
                  `implementation_approved_${userDepAndType}_date`
                ][`${editedApprovalData?.selectedMonth}`].length - 1
          ] =
            editedApprovalData[
              `implementation_approved_${userDepAndType}_date`
            ];

          await commonEditedFields();
          //for adding in query
          queryObjForUpdateFields = {
            ...queryObjForUpdateFields,
            [keyOfImplementationApprovedByUserName]:
              machineCheckSheetData?.[0]?.checkSheet_data?.[
                `implementation_approved_by_${userDepAndType}`
              ][`${editedApprovalData?.selectedMonth}`],
            [keyOfImplementationApprovedDate]:
              machineCheckSheetData?.[0]?.checkSheet_data?.[
                `implementation_approved_${userDepAndType}_date`
              ][`${editedApprovalData?.selectedMonth}`],
          };
        }
        //if Pending / Rejected any approval
        else if (
          machineCheckSheetData[0]?.checkSheet_data[
            `implemetation_${userDepAndType.toLowerCase()}_approval_status`
          ]?.[`${editedApprovalData?.selectedMonth}`]?.[
            machineCheckSheetData[0]?.checkSheet_data?.[
              `implemetation_${userDepAndType.toLowerCase()}_approval_status`
            ]?.[`${editedApprovalData?.selectedMonth}`]?.length -
              1 <
            0
              ? 0
              : machineCheckSheetData[0]?.checkSheet_data?.[
                  `implemetation_${userDepAndType.toLowerCase()}_approval_status`
                ]?.[`${editedApprovalData?.selectedMonth}`]?.length - 1
          ] === "Pending" ||
          machineCheckSheetData[0]?.checkSheet_data?.[
            `implemetation_${userDepAndType.toLowerCase()}_approval_status`
          ]?.[`${editedApprovalData?.selectedMonth}`]?.[
            machineCheckSheetData[0]?.checkSheet_data?.[
              `implemetation_${userDepAndType.toLowerCase()}_approval_status`
            ]?.[`${editedApprovalData?.selectedMonth}`]?.length -
              1 <
            0
              ? 0
              : machineCheckSheetData[0]?.checkSheet_data?.[
                  `implemetation_${userDepAndType.toLowerCase()}_approval_status`
                ]?.[`${editedApprovalData?.selectedMonth}`]?.length - 1
          ] === "Rejected"
        ) {
          // console.log("------Pending/ Rejected called----------------");

          await commonEditedFields();
          await commonPushFields();
        } else {
          // console.log("------Other called----------------");

          await commonPushFields();
          queryObjForPushData = {
            ...queryObjForPushData,
            [keyOfImplementationAssignUserTmNo]:
              editedApprovalData[`${userDepAndType.toLowerCase()}_list`]?.tm_no,
            [keyOfImplementationAssignUserName]:
              editedApprovalData[`${userDepAndType.toLowerCase()}_list`]
                ?.tm_name,
            [keyOfImplementationAssignUserEmail]:
              editedApprovalData[`${userDepAndType.toLowerCase()}_list`]?.email,
            [keyOfImplemetationUserApprovalStatus]: "Accepted",
          };
        }
      };

      if (editedApprovalData?.prd_tl_list?._id) {
        await updateAndPushApprovalDataOfImplementation("PRD_TL");
      }

      if (editedApprovalData?.mtd_tl_list?._id) {
        await updateAndPushApprovalDataOfImplementation("MTD_TL");
      }

      if (editedApprovalData?.mtd_hos_list?._id) {
        await updateAndPushApprovalDataOfImplementation("MTD_HOS");
      }

      if (editedApprovalData?.mtd_hod_list?._id) {
        await updateAndPushApprovalDataOfImplementation("MTD_HOD");
      }

      if (editedApprovalData?.PMworkedTMName?._id) {
        let keyOfPMworkedTMName = `checkSheet_data.$[outer].PMworkedTMName.${editedApprovalData?.selectedMonth}`;
        let keyOfImplemantationCompleted_tm_no = `checkSheet_data.$[outer].implemetation_completed_tm_no.${editedApprovalData?.selectedMonth}`;
        let keyOfImplemantationCompleted_tm_name = `checkSheet_data.$[outer].implemetation_completed_tm_name.${editedApprovalData?.selectedMonth}`;
        let keyOfImplemantationCompleted_date = `checkSheet_data.$[outer].implemetation_completed_date.${editedApprovalData?.selectedMonth}`;

        let keyForAddEmptyArrayOfMonthsOfPMworkedTMName = `checkSheet_data.$[outer].PMworkedTMName`;
        let keyForAddEmptyArrayOfMonthsOfImplemantationCompleted_tm_no = `checkSheet_data.$[outer].implemetation_completed_tm_no`;
        let keyForAddEmptyArrayOfMonthsOfImplemantationCompleted_tm_name = `checkSheet_data.$[outer].implemetation_completed_tm_name`;
        let keyForAddEmptyArrayOfMonthsOfImplemantationCompleted_date = `checkSheet_data.$[outer].implemetation_completed_date`;

        let updateFieldWithAllMonthForPMworkedTMName = {
          Apr: [],

          May: [],

          June: [],

          July: [],

          Aug: [],

          Sep: [],

          Oct: [],

          Nov: [],

          Dec: [],

          Jan: [],

          Feb: [],

          Mar: [],
        };

        if (
          // machineCheckSheetData?.[0]?.checkSheet_data?.PMworkedTMName?.[
          //   `${editedApprovalData?.selectedMonth}`
          // ]?.length >= 0

          machineCheckSheetData?.[0]?.checkSheet_data?.PMworkedTMName !==
          undefined
        ) {
          queryObjForUpdateFields = {
            ...queryObjForUpdateFields,
            [keyOfPMworkedTMName]: editedApprovalData?.PMworkedTMName?.tm_name,
            [keyOfImplemantationCompleted_tm_no]:
              editedApprovalData?.PMworkedTMName?.tm_no,
            [keyOfImplemantationCompleted_tm_name]:
              editedApprovalData?.PMworkedTMName?.tm_name,
            [keyOfImplemantationCompleted_date]:
              editedApprovalData?.implemetation_completed_date,
          };
        } else {
          const updateImplementationData = await Machine.updateOne(
            { ...req?.query },
            {
              $set: {
                [keyForAddEmptyArrayOfMonthsOfPMworkedTMName]:
                  updateFieldWithAllMonthForPMworkedTMName,
                [keyForAddEmptyArrayOfMonthsOfImplemantationCompleted_tm_no]:
                  updateFieldWithAllMonthForPMworkedTMName,
                [keyForAddEmptyArrayOfMonthsOfImplemantationCompleted_tm_name]:
                  updateFieldWithAllMonthForPMworkedTMName,
                [keyForAddEmptyArrayOfMonthsOfImplemantationCompleted_date]:
                  updateFieldWithAllMonthForPMworkedTMName,
              },
            },
            {
              arrayFilters: [
                {
                  "outer.current_year": req?.params?.selectedYear,
                },
              ],
            }
          );

          queryObjForUpdateFields = {
            ...queryObjForUpdateFields,
            [keyOfPMworkedTMName]: editedApprovalData?.PMworkedTMName?.tm_name,
            [keyOfImplemantationCompleted_tm_no]:
              editedApprovalData?.PMworkedTMName?.tm_no,
            [keyOfImplemantationCompleted_tm_name]:
              editedApprovalData?.PMworkedTMName?.tm_name,
            [keyOfImplemantationCompleted_date]:
              editedApprovalData?.implemetation_completed_date,
          };
        }
      }

      const updateAfterAllApprovalOfImplementation = await Machine.updateOne(
        { ...req?.query },
        {
          $set: {
            ...queryObjForUpdateFields,
          },
          $push: {
            ...queryObjForPushData,
          },
        },
        {
          arrayFilters: [
            {
              "outer.current_year": req?.params?.selectedYear,
            },
          ],
          new: true,
        }
      );

      res.status(201).json({
        message: "Approval data updated successfully",
        machine: updateAfterAllApprovalOfImplementation,
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/topMachinePmTimeMonitoringData/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  async (req, res, next) => {
    try {
      let queryPipelineForMontlyTimeMonitoring = [];

      if (req?.query?.selectedMonth) {
        queryPipelineForMontlyTimeMonitoring = [
          {
            $match: {
              "totalPMTime.k": req?.query?.selectedMonth,
            },
          },
        ];
      }

      const getTopMachinePmTimeMonitoringData = await Machine.aggregate([
        { $match: req.queryObjForPM },
        {
          $unwind: "$checkSheet_data",
        },
        {
          $match: {
            "checkSheet_data.current_year": req.query?.selectedYear,
          },
        },
        {
          $addFields: {
            totalPMTime: {
              $objectToArray: "$checkSheet_data.totalPMTime",
            },
          },
        },
        {
          $unwind: "$totalPMTime",
        },
        ...queryPipelineForMontlyTimeMonitoring,
        {
          $group: {
            _id: "$machine_code",
            machine_name: { $first: "$machine_name" },
            totalSumOf_PM: {
              $sum: truncValue({
                $divide: ["$totalPMTime.v.totalWorkedPMTime", 60],
              }),
            },
          },
        },
        {
          $sort: { totalSumOf_PM: -1 },
        },
        {
          $limit: req.query?.documentLimitInTheGraph * 1,
        },
        {
          $group: {
            _id: null,
            labels: { $push: "$machine_name" },
            data: { $push: "$totalSumOf_PM" },
          },
        },
      ]);

      return res.status(201).json({
        message: "Top Machine Breakdown data get successfully",
        topMachineTimeMonitoring: getTopMachinePmTimeMonitoringData?.[0],
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.get(
  "/yearlyTrendPmTimeMonitoringData/:filter/:selectedId",
  authenticate,
  filterMiddleware,
  async (req, res, next) => {
    try {
      const selectedYear = req.query?.selectedYear?.split("-")?.[0];
      const isValidYear = /^\d{4}$/.test(selectedYear);

      let previousYear;
      if (isValidYear) {
        previousYear = (parseInt(selectedYear, 10) - 1).toString();
      }

      const getYearTrendPmTimeMonitoringData = await Machine.aggregate([
        { $match: req.queryObjForPM },
        {
          $unwind: "$checkSheet_data",
        },
        {
          $match: {
            $or: [
              {
                "checkSheet_data.current_year": req.query?.selectedYear,
              },
              {
                "checkSheet_data.current_year": `${previousYear}-${selectedYear}`,
              },
            ],
          },
        },
        {
          $addFields: {
            totalPMTime: {
              $objectToArray: "$checkSheet_data.totalPMTime",
            },
          },
        },
        {
          $unwind: "$totalPMTime",
        },
        {
          $group: {
            _id: "$checkSheet_data.current_year",
            totalSumOf_PM: {
              $sum: truncValue({
                $divide: ["$totalPMTime.v.totalWorkedPMTime", 60],
              }),
            },
          },
        },
        {
          $sort: { _id: 1 },
        },
        {
          $group: {
            _id: null,
            labels: { $push: "$_id" },
            data: { $push: "$totalSumOf_PM" },
          },
        },
      ]);

      return res.status(201).json({
        message: "Top Machine Breakdown data get successfully",
        yearTrendMachineTimeMonitoring: getYearTrendPmTimeMonitoringData?.[0],
      });
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      res.status(500).json({ message: error?.message, error });
    }
  }
);

router.patch(
  "/updateCellAndLineIdInMachineWhileMovingMachine",
  authenticate,
  async (req, res, next) => {
    try {
      const { submittedData } = req.body;

      const sequenceFind = await Machine.aggregate([
        {
          $match: {
            line_names: mongoose.Types.ObjectId(submittedData?.line_id),
          },
        },
        {
          $sort: {
            machine_sequence: -1,
          },
        },
      ]).limit(1);

      let updatedMachineSeq = 0;
      if (sequenceFind?.length === 1) {
        updatedMachineSeq = sequenceFind[0].machine_sequence + 1;
      } else {
        updatedMachineSeq = 1;
      }

      const updateSequence = await Machine.updateMany(
        {
          line_names: req?.query?.line_names,
          machine_sequence: {
            $gt: req?.query?.machine_sequence,
          },
        },
        { $inc: { machine_sequence: -1 } }
      );
      const updateReqestSheetData = await RequestSheetOfBM.updateMany(
        { machineRef: req?.query?._id },
        {
          $set: {
            lineRef: submittedData?.line_id,
            cellRef: submittedData?.cell_id,
          },
        },
        { new: true }
      );

      const updateNoLossReqestSheetData = await noLossBDData.updateMany(
        { machineRef: req?.query?._id },
        {
          $set: {
            lineRef: submittedData?.line_id,
            cellRef: submittedData?.cell_id,
          },
        },
        { new: true }
      );

      const updateMachineLineAndCellId = await Machine.findOneAndUpdate(
        { _id: req?.query?._id },
        {
          $set: {
            line_names: submittedData?.line_id,
            cell_names: submittedData?.cell_id,
            machine_sequence: updatedMachineSeq,
          },
        }
      );

      if (updateMachineLineAndCellId) {
        return res.status(201).json({
          message: "Machine move successfully to another line/cell",
        });
      }
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[0] });
      console.log(error);
      res.status(500).json({ message: error?.message, error });
    }
  }
);

// router.post('/postSectionToGetAllData12', authenticate, async (req, res) => {
//     try {
//         let { selectedYear } = req.body

//         let removeFlag = await LogHistory.update(

//             {},
//             {
//                 $unset: { flag: "" }
//             }

//         )
//             console.log(removeFlag)
//         // machineDataOfImplementationApproval12 = await Machine.aggregate([
//         //     // {
//         //     //     $match: {
//         //     //         machine_code: "EEAT-131"
//         //     //     }
//         //     // },
//         //     {
//         //         $unwind: "$checkSheet_data"
//         //     },
//         //     {
//         //         $match: {
//         //             "checkSheet_data.current_year": "2023-2024"
//         //         }
//         //     },
//         //     // { $addFields: { checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] } } },
//         //     {
//         //         $match: {
//         //             "checkSheet_data.PMStatus.Apr": "PM Skip",
//         //             "checkSheet_data.PMStatus.May": { $ne: "No Completion" },
//         //         }
//         //     },
//         //     {
//         //         $project: {
//         //             machine_code: 1,
//         //             machine_name: 1,
//         //             machine_nickname: 1,
//         //             machine_sequence: 1,
//         //             installation_date: 1,
//         //             maker_name: 1,
//         //             maker_sr_no: 1,
//         //             manufacturingDate: 1,
//         //             isPM: 1,
//         //             line_names: 1,
//         //             checkSheet_data: 1
//         //         }
//         //     },
//         // ])
//         // console.log(machineDataOfImplementationApproval12)
//         // console.log(machineDataOfImplementationApproval12.length)

//         // const updateOneCycleData = async (machine_code, inception_point) => {
//         //     let logHistoryAllData1 = await LogHistory.find({
//         //         "machineInfo.machine_Id": machine_code,
//         //         inception_point,
//         //         current_year: "2023-2024",
//         //         schedule_month: "Apr",
//         //         flag: { $ne: "true" }
//         //     })

//         //     // console.log("Log data ---->", logHistoryAllData1)

//         //     let arrayValue = [1, 'skip']
//         //     let setArrayValue = [1, logHistoryAllData1?.[0]?.abnormality_remarks ? "No" : "Yes", logHistoryAllData1?.[0]?.remarks]
//         //     let updateMachineData = await Machine.updateOne({
//         //         machine_code: machine_code,
//         //         "checkSheet_data.$[outer].checkSheet.$[inner].planningTableAnimationArray2.Apr": arrayValue
//         //     },
//         //         {
//         //             $set: {
//         //                 "checkSheet_data.$[outer].checkSheet.$[inner].planningTableAnimationArray2.Apr": setArrayValue,
//         //                 "checkSheet_data.$[outer].PMStatus.Apr": "Completed"
//         //             }
//         //         },
//         //         {
//         //             arrayFilters: [{ 'outer.current_year': "2023-2024" }, { 'inner.inspection_parent_name': inception_point }],
//         //         }
//         //     )

//         //     // console.log("Update value of point and status", updateMachineData)

//         //     let addFlagInLog = await LogHistory.updateOne({
//         //         _id: logHistoryAllData1?.[0]?._id
//         //     },
//         //         {
//         //             $set: {
//         //                 flag: "true"
//         //             }
//         //         }
//         //     )

//         //     // console.log("Add flag", addFlagInLog)
//         // }

//         // for (let i = 0; i < machineDataOfImplementationApproval12.length; i++) {

//         //     for (let j = 0; j < machineDataOfImplementationApproval12[i]?.checkSheet_data?.checkSheet?.length; j++) {
//         //         if (machineDataOfImplementationApproval12?.[i]?.checkSheet_data?.checkSheet?.[j].cycle === '1/1M') {
//         //             await updateOneCycleData(machineDataOfImplementationApproval12?.[i]?.machine_code, machineDataOfImplementationApproval12?.[i]?.checkSheet_data?.checkSheet?.[j]?.inspection_parent_name)
//         //         }

//         //     }

//         // }

//     } catch (error) {
//         console.log(error)
//         console.log("User id not received!!!");
//     }
// })

module.exports = router;
