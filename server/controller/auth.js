const express = require('express')
const router = express.Router();
const mongoose = require('mongoose')
const multer = require('multer');
require('../db/conn')
const authenticate = require('../middleware/authenticate');


const User = require('../model/userSchema')
const Plant = require('../model/plantSchema')
const Section = require('../model/sectionSchema')
const SubSection = require('../model/subSectionSchema')
const Cell = require('../model/cellSchema')
const Line = require('../model/lineSchema')
const Machine = require('../model/machineSchema')
const sendMail = require('../sendMail/sendMail');
const sendApprovalOfImplementation = require('../sendMail/sendApprovalOfImplementation')
const BackupMachineData = require('../model/backupMachine')

//send request for approval mail function
const sendApproval = require('../sendMail/sendApproval')

const bcrypt = require('bcryptjs')
const crypto = require('crypto');

const cookieParser = require('cookie-parser');
const { match } = require('assert');
const path = require('path');
const { parse } = require('path');
const { Console, log } = require('console');
router.use(cookieParser())


//for profile image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // cb(null, pdfDestPath);
        cb(null, './images/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '_' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {

    // var filetypes = /jpeg|jpg/;
    // var mimetype = filetypes.test(file.mimetype);
    // var extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    // if (mimetype && extname) {
    //     return cb(null, true);
    // }
    // cb("Error: File upload only supports the following filetypes - " + filetypes);
    const allowedFileTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedFileTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        // cb(null, false);
        // console.log(new Error())
        return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
}

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5
    },
    fileFilter: fileFilter
});

//upload profile image 
router.post('/updateUserProfile', upload.single('photo'), async (req, res) => {
    try {
        // console.log(req.photo)

        const tm_name = req.body.tm_name;
        const tm_no = req.body.tm_no

        // console.log(tm_no);
        // console.log(tm_name);
        // console.log(req.file);


        if (req.file === undefined) {
            await User.updateOne({ tm_no: tm_no }, { $set: { tm_name: tm_name } })
        }
        else {
            const photo = req.file.filename
            await User.updateOne({ tm_no: tm_no }, { $set: { tm_name: tm_name, photo: photo } })
        }

        res.status(200).send("User name updated")
    }
    catch (err) {
        console.log("err")
        // res.status(400).send("error")
    }
});
//for PM images
const storage1 = multer.diskStorage({
    destination: function (req, file, cb) {
        // cb(null, pdfDestPath);
        cb(null, './PMimages/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '_' + file.originalname);
    }
});

const upload1 = multer({
    storage: storage1,
    limits: {
        fileSize: 1024 * 1024 * 5
    },
    fileFilter: fileFilter
});

//SignIN API
router.post('/signIn', async (req, res) => {
    try {
        let jwtToken
        const { tm_no, password } = req.body
        // console.log(tm_no, password)
        if (!tm_no || !password) {
            return res.status(422).json({ error: 'plz fill all the details' })
        }
        const userLogin = await User.findOne({ tm_no: tm_no });
        // console.log(userLogin);
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
                    httpOnly: true
                });
            }
            if (!passwordMatch) {
                res.status(400).json({ error: "Invalid password " })
            } else {
                // console.log("user login successfully")
                res.json({ message: "user login successfully" })
            }
            // }
        } else {
            res.status(400).json({ error: "Invalid user " })
        }
    } catch (error) {
        console.log("Credential not valid or received!!!");
        console.log(error)
    }
})

//reset password page ( enter email for validation )
router.post('/resetPass', (req, res) => {
    try {
        crypto.randomBytes(32, async (error, buffer) => {
            if (error) {
                console.log(error);
            }
            const token = buffer.toString("hex");
            const user = await User.findOne({ email: req.body.email })
            console.log(user)
            if (!user) {
                return res.status(422).send("User don't exists with that email");
            } else {
                try {
                    user.token = token
                    user.expireToken = Date.now() + 300000
                    user.save().then((result) => {
                        sendMail(user.email, token);
                    })
                    res.status(201).json("Email send successful!!!");
                } catch (error) {
                    res.status(554).json("Email not send");

                }
            }
        })
    } catch (error) {
        console.log("Reset password token is not valid or received!!!");

    }
})

//new password generation
router.post('/newPassword', async (req, res) => {
    const newPassword = req.body.newPassword;
    const confirmPassword = req.body.confirmPassword;
    const reciveToken = req.body.token;
    try {
        //finding token in database for user confirmation 
        User.findOne({ expireToken: reciveToken, expireToken: { $gt: Date.now() } })
            .then(user => {
                if (!user) {
                    return res.status(422).send("Try again link expired !!!");
                }
                else {
                    if (newPassword === confirmPassword) {
                        user.password = newPassword;
                        user.token = undefined;
                        user.expireToken = undefined;
                        user.save().then((saveUser) => {
                            res.send("Successfully");
                        })

                    } else {
                        return res.status(422).send("Your password should not match !!!");
                    }
                }
            })
    } catch (error) {
        console.log("Data not received !!!");
    }
})

//update the password
router.post('/updatePassword', authenticate, async (req, res) => {
    try {

        const { oldPassword, newPassword, confirmPassword } = req.body
        if (!oldPassword || !newPassword || !confirmPassword) {
            return res.status(422).json({ error: 'plz fill all the details' })
        }
        const userData = req.rootUser;
        //console.log(userData.user_id);
        const userLogin = await User.findOne({ tm_no: userData.tm_no });
        //console.log(userLogin);

        if (userLogin) {
            const passwordMatch = await bcrypt.compare(oldPassword, userLogin.password);
            if (!passwordMatch) {
                res.status(400).json({ error: "Invalid password " })
            } else {
                if (newPassword === confirmPassword) {
                    userLogin.password = newPassword;
                    res.clearCookie('Token', { path: '/' });
                    userLogin.save().then((saveUser) => {
                        console.log("Successfully");
                    })
                } else {
                    return res.status(422).send("Your password is not match !!!");
                }
                res.json({ message: "user password update successfully" })
            }
        } else {
            res.status(400).json({ error: "Invalid user " })
        }
    } catch (error) {
        console.log("New password data not received or bad request !!!");
    }
})


//API for create and save user 
router.post('/newUser', async (req, res) => {
    try {
        const userExist = await User.findOne({ tm_no: req.body.tm_no })
        if (userExist) {
            return res.status(409).json({ error: 'Employee number already exists' })
        }

        await User.create(req.body);

        res.status(201).json({ message: 'Employee register successfully' })
    } catch (error) {
        console.log(error)
        console.log("Data not valid or received !!!");
    }
})

//update the user in User management table
router.post('/updateUser', async (req, res) => {
    try {
        const { tm_no, tm_name, email, address } = req.body
        //console.log(user_type);

        // if (!tm_no || !tm_name || !user_type) {
        //     return res.status(422).send("plz fill all the details !!!");
        // }
        const updateUserData = await User.updateOne({ tm_no: tm_no }, { $set: { tm_name: tm_name, email: email, address: address } });
        res.status(201).json({ message: 'Employee updated successfully' })


    } catch (error) {
        res.status(409).json("user already exists!!!");
    }
})

//delete the user in User management table
router.post('/deleteUser', async (req, res) => {
    try {
        const tm_no = req.body;
        const emp_no = Object.values(tm_no);
        // console.log(emp_no);

        if (!emp_no) {
            return res.status(422).send("Employee number is not valid!!!");
        }
        const deleteUserData = await User.deleteOne({ tm_no: emp_no });

        if (deleteUserData) {
            return res.status(201).json("Employee deleted!!!");
        }
        else {
            return res.status(400).json("Employee not deleted!!!");
        }
    } catch (error) {
        console.log(error)
        console.log("Data not valid or received !!!");
    }
})

//Get the data from database and show on User management table
router.get('/displayUser', authenticate, async (req, res) => {
    try {
        const usersInfo = await User.find({ user_type: "Plant-Admin" }).sort({ _id: -1 });
        //req.usersInfo=usersInfo;
        // console.log(usersInfo)
        res.json(usersInfo);
    } catch (error) {
        console.log("User data not send or get!!!");
    }
})



//userLogin
router.get('/loggedUserDetails', authenticate, async (req, res) => {
    try {
        // console.log(req.rootUser);
        res.send(req.rootUser);

    } catch (error) {
        console.log("User data not send or get!!!");
    }
})

//API for create and save plant 
router.post('/addNewPlant', authenticate, async (req, res) => {
    const { plant_name } = req.body

    if (!plant_name) {
        return res.status(422).json({ error: 'plz fill all the details' })
    }
    try {
        let total = await Plant.find().sort({ _id: -1 }).limit(1);
        var plant_id;
        var plantName = "P";
        if (total.length === 0) {
            plant_id = plantName + 1;
        }
        else {
            var splitPlantId = (total[0].plant_id).substring(1,);
            plant_id = plantName + (Number(splitPlantId) + 1);
        }

        const plant = new Plant({ plant_id, plant_name })
        await plant.save()

        res.status(201).json({ message: 'Plant register successfully' })
    } catch (error) {
        console.log("Data not valid or received !!!");
    }
})

//Get the data from database and show on plant management table
router.get('/displayPlant', authenticate, async (req, res) => {
    try {
        const plantInfo = await Plant.find({}).sort({ _id: -1 });
        //req.plantInfo=plantInfo;
        res.json(plantInfo);
    } catch (error) {
        console.log("Plant data not send or get!!!");
    }
})

//update the plant in plant management table
router.post('/updatePlant', authenticate, async (req, res) => {
    try {
        const { plant_id, plant_name, oldRow } = req.body
        // console.log(plant_id, plant_name);

        // if (!plant_id || !plant_name || !user_type) {
        //     return res.status(422).send("plz fill all the details !!!");
        // }
        const updatePlantData = await Plant.updateOne({ plant_id: plant_id }, { $set: { plant_name: plant_name } });
        res.status(201).json({ message: 'Plant updated successfully' })
        let plantIdLiteral = `${plant_id}-${oldRow.plant_name}`
        const result = await User.updateMany({ plant_data: plantIdLiteral }, { $set: { plant_data: `${plant_id}-${plant_name}` } })

    } catch (error) {
        res.status(409).json("Plant already exists!!!");
    }
})


router.post('/deletePlant', authenticate, async (req, res) => {
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
        }
        else {
            return res.status(400).json("Plant not deleted!!!");
        }
    } catch (error) {
        console.log(error)
        console.log("Data not valid or received !!!");
    }
})

//API for create and save Section 
router.post('/addNewSection', authenticate, async (req, res) => {
    try {
        const { section_name, plant_names, dashboardLevel } = req.body
        // console.log(section_name)
        if (req.body.section_id) {

            const sectionExist = await Section.findOne({ section_id: req.body.section_id })
            if (sectionExist) {
                return res.status(409).json({ error: 'Section number already exists' })
            }
        }
        let total = await Section.find().sort({ _id: -1 }).limit(1);
        var section_id;
        var sectionName = "S";
        if (total.length === 0) {
            section_id = sectionName + 1;
        }
        else {
            var splitSectionId = (total[0].section_id).substring(1,);
            section_id = sectionName + (Number(splitSectionId) + 1);
        }
        let plantSplit = plant_names.split("-")
        const plantInfo = await Plant.find({ plant_id: plantSplit[0] })

        // console.log(plantInfo[0]._id)
        const newSection = new Section({ section_id, section_name, plant_names: plantInfo[0]._id, dashboardLevel })
        // console.log(newSection)

        await newSection.save()
        res.status(201).json({ message: 'Section register successfully' })
    } catch (error) {
        console.log(error)
        console.log("Data not valid or received !!!");
    }
})

//update the plant in plant management table
router.post('/updateSection', authenticate, async (req, res) => {
    try {
        const { section_id, section_name, oldRow } = req.body
        // console.log(section_id, section_name);

        // if (!section_id || !section_name || !user_type) {
        //     return res.status(422).send("plz fill all the details !!!");
        // }
        await Section.updateOne({ section_id: section_id }, { $set: { section_name: section_name } });
        res.status(201).json({ message: 'Section updated successfully' })
        let sectionIdLiteral = `${section_id}-${oldRow.section_name}`
        const result = await User.updateMany({ section_data: sectionIdLiteral }, { $set: { section_data: `${section_id}-${section_name}` } })


    } catch (error) {
        res.status(409).json("Section already exists!!!");
    }
})

router.post('/deleteSection', authenticate, async (req, res) => {
    try {
        const { _id, section_id } = req.body;
        // const plant_no = Object.values(section_id);
        // console.log(section_id);

        if (!section_id) {
            return res.status(422).send("Section number is not valid!!!");
        }

        // const result = await Section.find({ plant_names: _id })
        // console.log(result)
        const deleteSectionData = await Section.deleteOne({ section_id: section_id });

        if (deleteSectionData) {
            // console.log("Section deleted!!!")
            return res.status(201).json("Section deleted!!!");
        }
        else {
            return res.status(400).json("Section not deleted!!!");
        }
    } catch (error) {
        console.log(error)
        console.log("Data not valid or received !!!");
    }
})

//Get the data from database and show on Section management table
router.get('/displaySection', authenticate, async (req, res) => {
    try {
        const plantInfo = await Section.find({}).sort({ _id: -1 });
        //req.plantInfo=plantInfo;
        res.json(plantInfo);
    } catch (error) {
        console.log("Plant data not send or get!!!");
    }
})


//API for create and save SubSection 
router.post('/addNewSubSection', authenticate, async (req, res) => {
    try {
        const { subSection_name, section_names, subSection_sequence } = req.body
        // console.log(section_name)
        if (req.body.subSection_id) {

            const subSectionExist = await SubSection.findOne({ subSection_id: req.body.subSection_id })
            if (subSectionExist) {
                return res.status(409).json({ error: 'SubSection number already exists' })
            }
        }
        let total = await SubSection.find().sort({ _id: -1 }).limit(1);

        // console.log(total)
        var subSection_id;
        var subSectionName = "SS";
        if (total.length === 0) {
            subSection_id = subSectionName + 1;
        }
        else {
            var splitSubSectionId = (total[0].subSection_id).substring(2,);
            // console.log(splitSubSectionId)
            subSection_id = subSectionName + (Number(splitSubSectionId) + 1);
        }
        let sectionSplit = section_names.split("-")
        const sectionInfo = await Section.find({ section_id: sectionSplit[0] })

        const sequenceFind = await SubSection.find({ subSection_sequence: subSection_sequence });
        let newSubSection;
        if (sequenceFind) {
            const updateSequence = await SubSection.updateMany({ section_names: sectionInfo[0]._id, subSection_sequence: { $gte: subSection_sequence } }, { $inc: { subSection_sequence: 1 } })
            // console.log(updateSequence);
            newSubSection = new SubSection({ subSection_id, subSection_name, section_names: sectionInfo[0]._id, subSection_sequence })
        }
        else {
            newSubSection = new SubSection({ subSection_id, subSection_name, section_names: sectionInfo[0]._id, subSection_sequence })
        }
        // console.log(sectionInfo[0]._id)

        // console.log(newSubSection)

        await newSubSection.save()
        res.status(201).json({ message: 'SubSection register successfully' })
    } catch (error) {
        console.log(error)
        console.log("Data not valid or received !!!");
    }
})

router.post('/updateSubSection', authenticate, async (req, res) => {
    try {
        const { subSection_id, subSection_name, subSection_sequence, oldRow } = req.body
        // console.log(oldRow.section_names)


        const sequenceFind = await SubSection.find({ section_names: oldRow.section_names, subSection_sequence: subSection_sequence });
        if (sequenceFind) {
            if (oldRow.subSection_sequence < subSection_sequence) {
                const updateSequence = await SubSection.updateMany({ section_names: oldRow.section_names, subSection_sequence: { $gt: oldRow.subSection_sequence, $lte: subSection_sequence } }, { $inc: { subSection_sequence: -1 } })
            } else {
                const updateSequence = await SubSection.updateMany({ section_names: oldRow.section_names, subSection_sequence: { $lt: oldRow.subSection_sequence, $gte: subSection_sequence } }, { $inc: { subSection_sequence: 1 } })
            }
        }
        // if (!subSection_id || !subSection_name || !tm_group) {
        //     return res.status(422).send("plz fill all the details !!!");
        // }
        await SubSection.updateOne({ subSection_id: subSection_id }, { $set: { subSection_name: subSection_name, subSection_sequence } });
        res.status(201).json({ message: 'SubSection updated successfully' })
        let subSectionIdLiteral = `${subSection_id}-${oldRow.subSection_name}`
        console.log(subSectionIdLiteral)
        let newSubSectionIdLiteral = `${subSection_id}-${subSection_name}`
        const result = await User.updateMany({ subSection_data: subSectionIdLiteral }, { $set: { "subSection_data.$": newSubSectionIdLiteral } })


    } catch (error) {
        res.status(409).json("SubSection already exists!!!");
        console.log(error)
    }
})

router.post('/deleteSubSection', authenticate, async (req, res) => {
    try {
        const { _id, subSection_id, deleteRow } = req.body;
        // const plant_no = Object.values(subSection_id);
        // console.log(subSection_id);

        if (!subSection_id) {
            return res.status(422).send("Section number is not valid!!!");
        }
        const sequenceFind = await SubSection.find({ section_names: deleteRow.section_names, subSection_id: subSection_id, subSection_sequence: deleteRow.subSection_sequence });
        let deleteSubSectionData;
        if (sequenceFind) {
            const updateSequence = await SubSection.updateMany({ section_names: deleteRow.section_names, subSection_sequence: { $gte: deleteRow.subSection_sequence } }, { $inc: { subSection_sequence: -1 } })
            // console.log(updateSequence);
            deleteSubSectionData = await SubSection.deleteOne({ subSection_id: subSection_id });
        }
        else {
            deleteSubSectionData = await SubSection.deleteOne({ subSection_id: subSection_id });

        }
        // const result = await Section.find({ plant_names: _id })
        // console.log(result)

        if (deleteSubSectionData) {
            // console.log("SubSection deleted!!!")
            return res.status(201).json("SubSection deleted!!!");
        }
        else {
            return res.status(400).json("SubSection not deleted!!!");
        }
    } catch (error) {
        console.log(error)
        console.log("Data not valid or received !!!");
    }
})

router.post('/addNewCell', authenticate, async (req, res) => {
    try {
        const { cell_name, subSection, cell_sequence } = req.body
        // console.log(section_name)
        if (req.body.cell_id) {

            const cellExist = await Cell.findOne({ cell_id: req.body.cell_id })
            if (cellExist) {
                return res.status(409).json({ error: 'Cell number already exists' })
            }
        }
        let total = await Cell.find().sort({ _id: -1 }).limit(1);

        // console.log(total)
        var cell_id;
        var cellName = "C";
        if (total.length === 0) {
            cell_id = cellName + 1;
        }
        else {
            var splitCellId = (total[0].cell_id).substring(1,);
            // console.log(splitCellId)
            cell_id = cellName + (Number(splitCellId) + 1);
        }
        let subSectionSplit = subSection.split("-")
        const subSectionInfo = await SubSection.find({ subSection_id: subSectionSplit[0] })

        const sequenceFind = await Cell.find({ cell_sequence: cell_sequence });
        let newCell;
        if (sequenceFind) {
            const updateSequence = await Cell.updateMany({ subSection_names: subSectionInfo[0]._id, cell_sequence: { $gte: cell_sequence } }, { $inc: { cell_sequence: 1 } })
            // console.log(updateSequence);
            newCell = new Cell({ cell_id, cell_name, subSection_names: subSectionInfo[0]._id, cell_sequence })
        }
        else {
            newCell = new Cell({ cell_id, cell_name, subSection_names: subSectionInfo[0]._id, cell_sequence })
        }

        // console.log(subSectionInfo[0]._id)
        // console.log(newCell)

        await newCell.save()
        res.status(201).json({ message: 'Cell register successfully' })
    } catch (error) {
        console.log(error)
        console.log("Data not valid or received !!!");
    }
})

router.post('/updateCell', authenticate, async (req, res) => {
    try {
        const { cell_id, cell_name, cell_sequence, oldRow } = req.body
        // console.log(cell_id, cell_name);
        const sequenceFind = await Cell.find({ subSection_names: oldRow.subSection_names, cell_sequence: cell_sequence });
        if (sequenceFind) {
            if (oldRow.cell_sequence < cell_sequence) {
                const updateSequence = await Cell.updateMany({ subSection_names: oldRow.subSection_names, cell_sequence: { $gt: oldRow.cell_sequence, $lte: cell_sequence } }, { $inc: { cell_sequence: -1 } })
            } else {
                const updateSequence = await Cell.updateMany({ subSection_names: oldRow.subSection_names, cell_sequence: { $lt: oldRow.cell_sequence, $gte: cell_sequence } }, { $inc: { cell_sequence: 1 } })
            }
        }
        // if (!cell_id || !cell_name || !tm_group) {
        //     return res.status(422).send("plz fill all the details !!!");
        // }
        await Cell.updateOne({ cell_id: cell_id }, { $set: { cell_name: cell_name, cell_sequence } });
        res.status(201).json({ message: 'Cell updated successfully' })
        let cellIdLiteral = `${cell_id}-${oldRow.cell_name}`
        let newCellIdLiteral = `${cell_id}-${cell_name}`
        const result = await User.updateMany({ cell_data: cellIdLiteral }, { $set: { "cell_data.$": newCellIdLiteral } })


    } catch (error) {
        res.status(409).json("Cell already exists!!!");
    }
})

router.post('/deleteCell', authenticate, async (req, res) => {
    try {
        const { _id, cell_id, deleteRow } = req.body;
        // const plant_no = Object.values(cell_id);
        // console.log(cell_id);

        if (!cell_id) {
            return res.status(422).send("Cell number is not valid!!!");
        }
        const sequenceFind = await Cell.find({ cell_id: cell_id, subSection_names: deleteRow.subSection_names, cell_sequence: deleteRow.cell_sequence });
        let deleteCellData;
        if (sequenceFind) {
            const updateSequence = await Cell.updateMany({ subSection_names: deleteRow.subSection_names, cell_sequence: { $gte: deleteRow.cell_sequence } }, { $inc: { cell_sequence: -1 } })
            // console.log(updateSequence);
            deleteCellData = await Cell.deleteOne({ cell_id: cell_id });
        }
        else {
            deleteCellData = await Cell.deleteOne({ cell_id: cell_id });
        }

        // const result = await Section.find({ plant_names: _id })
        // console.log(result)

        if (deleteCellData) {
            // console.log("SubSection deleted!!!")
            return res.status(201).json("Cell deleted!!!");
        }
        else {
            return res.status(400).json("Cell not deleted!!!");
        }
    } catch (error) {
        console.log(error)
        console.log("Data not valid or received !!!");
    }
})


router.post('/addNewLine', authenticate, async (req, res) => {
    try {
        const { line_name, cell, line_sequence } = req.body
        // console.log(cell)
        if (req.body.line_id) {

            const lineExist = await Line.findOne({ line_id: req.body.line_id })
            if (lineExist) {
                return res.status(409).json({ error: 'Line number already exists' })
            }
        }
        let total = await Line.find().sort({ _id: -1 }).limit(1);

        // console.log(total)
        var line_id;
        var lineName = "L";
        if (total.length === 0) {
            line_id = lineName + 1;
        }
        else {
            var splitLineId = (total[0].line_id).substring(1,);
            // console.log(splitLineId)
            line_id = lineName + (Number(splitLineId) + 1);
        }
        let cellSplit = cell.split("-")
        const cellInfo = await Cell.find({ cell_id: cellSplit[0] })

        // console.log(cellInfo[0]._id)
        // console.log(cellInfo)

        const sequenceFind = await Line.find({ line_sequence: line_sequence });
        let newLine;
        if (sequenceFind) {
            const updateSequence = await Line.updateMany({ cell_names: cellInfo[0]._id, line_sequence: { $gte: line_sequence } }, { $inc: { line_sequence: 1 } })
            // console.log(updateSequence);
            newLine = new Line({ line_id, line_name, cell_names: cellInfo[0]._id, line_sequence })
        }
        else {
            newLine = new Line({ line_id, line_name, cell_names: cellInfo[0]._id, line_sequence })
        }

        // console.log(newLine)

        await newLine.save()
        res.status(201).json({ message: 'Line register successfully' })
    } catch (error) {
        console.log(error)
        console.log("Data not valid or received !!!");
    }
})


router.post('/updateLine', authenticate, async (req, res) => {
    try {
        const { line_id, line_name, line_sequence, oldRow } = req.body
        // console.log(line_id, line_name);
        const sequenceFind = await Line.find({ cell_names: oldRow.cell_names, line_sequence: line_sequence });
        if (sequenceFind) {
            if (oldRow.line_sequence < line_sequence) {
                const updateSequence = await Line.updateMany({ cell_names: oldRow.cell_names, line_sequence: { $gt: oldRow.line_sequence, $lte: line_sequence } }, { $inc: { line_sequence: -1 } })
            } else {
                const updateSequence = await Line.updateMany({ cell_names: oldRow.cell_names, line_sequence: { $lt: oldRow.line_sequence, $gte: line_sequence } }, { $inc: { line_sequence: 1 } })
            }
        }
        // if (!line_id || !line_name || !tm_group) {
        //     return res.status(422).send("plz fill all the details !!!");
        // }
        await Line.updateOne({ line_id: line_id }, { $set: { line_name: line_name, line_sequence } });
        res.status(201).json({ message: 'Line updated successfully' })


    } catch (error) {
        res.status(409).json("Line already exists!!!");
    }
})

router.post('/deleteLine', authenticate, async (req, res) => {
    try {
        const { _id, line_id, deleteRow } = req.body;
        // const plant_no = Object.values(line_id);
        // console.log(line_id);

        if (!line_id) {
            return res.status(422).send("Line number is not valid!!!");
        }
        const sequenceFind = await Line.find({ line_id: line_id, cell_names: deleteRow.cell_names, line_sequence: deleteRow.line_sequence });
        let deleteLineData;
        if (sequenceFind) {
            const updateSequence = await Line.updateMany({ cell_names: deleteRow.cell_names, line_sequence: { $gte: deleteRow.line_sequence } }, { $inc: { line_sequence: -1 } })
            // console.log(updateSequence);
            deleteLineData = await Line.deleteOne({ line_id: line_id });
        }
        else {
            deleteLineData = await Line.deleteOne({ line_id: line_id });
        }

        // const result = await Section.find({ plant_names: _id })
        // console.log(result)

        if (deleteLineData) {
            // console.log("SubSection deleted!!!")
            return res.status(201).json("Line deleted!!!");
        }
        else {
            return res.status(400).json("Line not deleted!!!");
        }
    } catch (error) {
        console.log(error)
        console.log("Data not valid or received !!!");
    }
})

//clear all token of logged user
router.post('/clearTokens', async (req, res) => {
    try {
        const { tm_no } = req.body
        // console.log(tm_no)
        if (!tm_no) {
            return res.status(422).json({ error: 'Employee number not received' })
        } else {
            const result = await User.updateOne({ tm_no: tm_no }, { $unset: { jwtTokens: "", moduleType: "" } });
            console.log(result);
            res.status(201).json({ message: 'Removed token !!!' })
        }
    } catch (error) {
        console.log("User id not received!!!");
    }
})


// logout functionality (clear the cookie from the browser)
router.get('/logout', (req, res) => {
    try {
        // console.log('Logout page ....');
        res.clearCookie('Token', { path: '/' });
        res.status(200).send('user Logout');
    } catch (error) {
        console.log("Cookies or Credential not clear !!!");
    }
})


router.get('/checking', async (req, res) => {
    try {
        const result = await Section.findOne({ "plant_names.plant_id": "P1" }).populate({ path: "", select: "" })
        // console.log(result);
        // console.log("*******************************************");
        // const xyz = await Section.deleteMany({_id:{$in:result.section_name}})
        // console.log(xyz)
        // const deleteChild  = await Section.deleteOne({plant_names._id})
        // res.json(WorkOrderNumbers);
    } catch (error) {
        console.log(error)
        console.log("Work order number not found");
    }
})

//fetch all section head for showing or selecting in dropdown by common user
router.get('/fetchPlantList', authenticate, async (req, res) => {
    try {
        const plantLists = await Plant.find({})
        let plantArray = []
        for (let i = 0; i < plantLists.length; i++) {
            plantArray.push(`${plantLists[i].plant_id}-${plantLists[i].plant_name}`);
        }
        // console.log(plantArray)
        res.json({ plantArray, plantLists });
    } catch (error) {
        console.log(error)
        console.log("User data not send or get!!!");
    }
})

router.post('/postPlantToGetSectionList', authenticate, async (req, res) => {
    try {
        let { plants } = req.body
        // console.log(plants);
        let plantSplit = plants.split("-")
        const plantInfo = await Plant.find({ plant_id: plantSplit[0] })
        // console.log("____________", plantInfo[0]._id)
        const sectionsInfo = await Section.find({ plant_names: plantInfo[0]._id })
        // console.log("____________", sectionsInfo)

        let sectionArray = []
        for (let i = 0; i < sectionsInfo.length; i++) {
            sectionArray.push(`${sectionsInfo[i].section_id}-${sectionsInfo[i].section_name}`);
        }

        // console.log(sectionArray)

        res.json({ sectionArray, sectionsInfo })
    } catch (error) {
        console.log(error)
        console.log("User id not received!!!");
    }
})



router.post('/postSectionToGetSubSectionList', authenticate, async (req, res) => {
    try {
        let { section } = req.body
        // console.log(section);
        let sectionSplit = section.split("-")
        const sectionInfo = await Section.findOne({ section_id: sectionSplit[0] })
        // console.log("____________", sectionInfo)
        const subSectionsInfo = await SubSection.find({ section_names: sectionInfo._id }).sort({ subSection_sequence: 1 })
        // console.log("____________", subSectionsInfo)

        let subSectionArray = []
        for (let i = 0; i < subSectionsInfo.length; i++) {
            subSectionArray.push(`${subSectionsInfo[i].subSection_id}-${subSectionsInfo[i].subSection_name}`);
        }

        // console.log(subSectionArray)

        res.json({ subSectionArray, subSectionsInfo, sectionInfo })
    } catch (error) {
        console.log(error)
        console.log("User id not received!!!");
    }
})


router.post('/postSubSectionToGetCellList', authenticate, async (req, res) => {
    try {
        let { subSection } = req.body
        // console.log(subSection);
        let subSectionSplit = subSection.split("-")
        // console.log(subSectionSplit);

        const subSectionInfo = await SubSection.find({ subSection_id: subSectionSplit[0] })

        const cellInfo = await Cell.find({ subSection_names: subSectionInfo[0]._id }).sort({ cell_sequence: 1 })
        // console.log("____________", cellInfo)

        let cellArray = []
        for (let i = 0; i < cellInfo.length; i++) {
            cellArray.push(`${cellInfo[i].cell_id}-${cellInfo[i].cell_name}`);
        }

        // console.log(cellArray)

        res.json({ cellArray, cellInfo })
    } catch (error) {
        console.log(error)
        console.log("User id not received!!!");
    }
})

router.post('/postCellToGetLineList', authenticate, async (req, res) => {
    try {
        let { cell } = req.body
        // console.log(cell);
        let cellSplit = cell.split("-")
        const cellInfo = await Cell.find({ cell_id: cellSplit[0] })
        // console.log(cellInfo[0]._id)
        const LineInfo = await Line.find({ cell_names: cellInfo[0]._id }).sort({ line_sequence: 1 })
        // console.log("____________", LineInfo)

        let lineArray = []
        for (let i = 0; i < LineInfo.length; i++) {
            lineArray.push(`${LineInfo[i].line_id}-${LineInfo[i].line_name}`);
        }

        // console.log(lineArray)

        res.json({ lineArray, lineInfo: LineInfo })
    } catch (error) {
        console.log(error)
        console.log("User id not received!!!");
    }
})

router.post('/postLineToGetMachineList', authenticate, async (req, res) => {
    try {
        let { line, selectedRequest } = req.body
        // console.log(line);
        let lineSplit = line.split("-")
        const lineInfo = await Line.find({ line_id: lineSplit[0] })
        let machineInfoWithChecksheet
        if (selectedRequest === "already_created") {
            //for checksheet preparation data copy to another checksheet
            machineInfoWithChecksheet = await Machine.aggregate([
                {
                    $match: {
                        line_names: lineInfo[0]._id
                    }
                },
                { $addFields: { checkSheet_data: { $last: "$checkSheet_data" } } },
                {
                    $match: {
                        $and: [
                            {
                                "checkSheet_data.checkSheet.inspection_parent_name": { $ne: "" }

                            },
                            {
                                "checkSheet_data": { $ne: undefined }
                            }
                        ]

                    }
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
                        checkSheet_data: 1
                    }
                },
            ])
            // console.log(machineData)
            machineInfoWithChecksheet = await Machine.populate(machineInfoWithChecksheet, { path: "line_names", populate: { path: "cell_names", model: "Cells" } })
        } else {
            machineInfoWithChecksheet = await BackupMachineData.find({ line_names: lineInfo[0]._id }).populate({ path: 'line_names', options: { sort: { 'machine_sequence': 1 } } })

        }

        const machineInfo = await Machine.find({ line_names: lineInfo[0]._id }).populate({ path: 'line_names', options: { sort: { 'machine_sequence': 1 } } })



        // const machineInfoWithChecksheet = await Machine.find({ line_names: lineInfo[0]._id, "checkSheet.inspection_parent_name": { $exists: true } }).populate({ path: 'line_names', options: { sort: { 'machine_sequence': 1 } } })
        // console.log(machineInfoWithChecksheet)
        let machineArray = []
        for (let i = 0; i < machineInfo.length; i++) {
            machineArray.push(`${machineInfo[i].machine_code}-${machineInfo[i].machine_name}`);
        }

        // console.log(machineArray)

        res.json({ machineArray, machineInfo, machineInfoWithChecksheet })
    } catch (error) {
        console.log(error)
        console.log("User id not received!!!");
    }
})

//based on plant selection section list will display on section list dropdown in User Assign in plant user
router.post('/postPlantToGetSectionListOfUserAssign', authenticate, async (req, res) => {
    try {
        let { plants } = req.body
        // console.log(plants);
        let plantSplit = plants.split("-")
        const plantInfo = await Plant.find({ plant_id: plantSplit[0] })
        // console.log("____________", plantInfo[0]._id)
        const sectionsInfo = await Section.find({ plant_names: plantInfo[0]._id })
        // console.log("____________", sectionsInfo)

        let sectionArray = []
        for (let i = 0; i < sectionsInfo.length; i++) {
            sectionArray.push(`${sectionsInfo[i].section_id}-${sectionsInfo[i].section_name}`);
        }

        // console.log(sectionArray)

        res.json({ sectionArray: sectionArray })
    } catch (error) {
        console.log(error)
        console.log("User id not received!!!");
    }
})

//based on section selection sub-section list will display on sub-section list dropdown in User Assign in plant user
router.post('/postSectionToGetSubSectionListOfUserAssign', authenticate, async (req, res) => {
    try {
        let { section } = req.body
        console.log(section);
        let sectionSplit = section.split("-")
        const sectionInfo = await Section.find({ section_id: sectionSplit[0] })
        // console.log("____________", sectionInfo[0]._id)
        const subSectionsInfo = await SubSection.find({ section_names: sectionInfo[0]._id })
        // console.log("____________", subSectionsInfo)

        let subSectionArray = []
        for (let i = 0; i < subSectionsInfo.length; i++) {
            subSectionArray.push(`${subSectionsInfo[i].subSection_id}-${subSectionsInfo[i].section_name}`);
        }

        // console.log(subSectionArray)

        res.json({ subSectionArray: subSectionArray })
    } catch (error) {
        console.log(error)
        console.log("User id not received!!!");
    }
})

//based on sub-section selection cell list will display on cell list dropdown in User Assign in plant user
router.post('/postSubSectionToGetCellListOfUserAssign', authenticate, async (req, res) => {
    try {
        let { subSection } = req.body
        // console.log(subSection);
        let subSectionIdArray = []
        subSection.map((subSectionId) => {
            let id = subSectionId.split("-")
            subSectionIdArray.push(id[0])
        })
        // console.log(subSectionIdArray)
        // let subSectionSplit = subSection.split("-")
        const subSectionInfo = await SubSection.find({ subSection_id: { $in: subSectionIdArray } })
        // console.log(subSectionInfo)
        let subSection_id = subSectionInfo.map(xyz => xyz._id);
        // console.log(subSection_id)
        const cellInfo = await Cell.find({ subSection_names: { $in: subSection_id } })
        // // console.log("____________", cellInfo)

        let cellArray = []
        for (let i = 0; i < cellInfo.length; i++) {
            cellArray.push(`${cellInfo[i].cell_id}-${cellInfo[i].cell_name}`);
        }

        // // console.log(cellArray)

        res.json({ cellArray: cellArray })
    } catch (error) {
        console.log(error)
        console.log("User id not received!!!");
    }
})

//post new user in user management in plant & section user
router.post('/postUserAssign', async (req, res) => {
    try {
        const {
            tm_name,
            tm_no,
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
        } = req.body

        const userExist = await User.findOne({ tm_no: req.body.tm_no })
        if (userExist) {
            return res.status(409).json({ error: 'Employee number already exists' })
        }

        const addNewUser = new User({
            tm_name,
            tm_no,
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
        res.status(201).json({ message: 'Employee register successfully' })
    } catch (error) {
        console.log(error)
        console.log("Data not valid or received !!!");
    }

})

//Get the data from database and show on User management table in plant user 
router.get('/displayAssignUser', authenticate, async (req, res) => {
    try {
        let loggedUserData = req.rootUser;
        const usersInfo = await User.find({ user_type: "Section-Admin", plant_data: loggedUserData.plant_data }).sort({ _id: -1 });
        //req.usersInfo=usersInfo;
        res.json(usersInfo);
    } catch (error) {
        console.log("User data not send or get!!!");
    }
})

//update the user in User management table in plant & section user
router.post('/updateAssignUser', async (req, res) => {
    try {
        let { tm_no, tm_name, user_type, tm_grade, tm_department, email, operator_password, address, plant_data, section_data, subSection_data, cell_data, contact_no, joining_date } = req.body
        if (tm_grade === "HOD") {
            subSection_data = "";
            // cell_data= "";

            await User.updateOne({ tm_no: tm_no }, { $set: { tm_name, tm_grade, tm_department, email, address, plant_data, section_data, subSection_data, contact_no, joining_date } });

        } else if (tm_grade === "HOS") {
            cell_data = "";

            await User.updateOne({ tm_no: tm_no }, { $set: { tm_name, tm_grade, tm_department, email, address, plant_data, section_data, subSection_data, cell_data, contact_no, joining_date } });

        } else {
            await User.updateOne({ tm_no: tm_no }, { $set: { tm_name, tm_grade, tm_department, email, operator_password, address, plant_data, section_data, subSection_data, cell_data, contact_no, joining_date } });
        }
        res.status(201).json({ message: 'Employee updated successfully' })
    } catch (error) {
        res.status(409).json("user already exists!!!");
    }
})

//delete the user in User management table in plant & section user
router.post('/deleteAssignUser', async (req, res) => {
    try {
        const tm_no = req.body;
        const emp_no = Object.values(tm_no);
        // console.log(emp_no);

        if (!emp_no) {
            return res.status(422).send("Employee number is not valid!!!");
        }
        const deleteUserData = await User.deleteOne({ tm_no: emp_no });

        if (deleteUserData) {
            return res.status(201).json("Employee deleted!!!");
        }
        else {
            return res.status(400).json("Employee not deleted!!!");
        }
    } catch (error) {
        console.log(error)
        console.log("Data not valid or received !!!");
    }
})


//Get the data from database and show on User management table in section user 
router.get('/displaySectionAssignUser', authenticate, async (req, res) => {
    try {
        let sectionId = req.rootUser.section_data;
        // console.log(sectionId)
        const usersInfo = await User.find({ section_data: sectionId, user_type: { $in: ["Operator", "TL/HOSS"] } }).sort({ _id: -1 });
        //req.usersInfo=usersInfo;
        res.json(usersInfo);
    } catch (error) {
        console.log("User data not send or get!!!");
    }
})

//post new machine in machine management in section admin
router.post('/addNewMachine', async (req, res) => {
    try {
        const { machine_code, machine_name, machine_nickname, isPM, machine_sequence, installation_date, manufacturingDate, maker_name, maker_sr_no, line } = req.body

        const machineExist = await Machine.findOne({ machine_code: machine_code })
        if (machineExist) {
            return res.status(409).json({ error: 'Machine code already exists' })
        }
        let lineSplit = line.split("-")
        const lineInfo = await Line.find({ line_id: lineSplit[0] })
        // console.log(lineInfo[0])
        const sequenceFind = await Machine.find({ machine_sequence: machine_sequence });
        let newMachine;
        if (sequenceFind) {
            const updateSequence = await Machine.updateMany({ line_names: lineInfo[0]._id, machine_sequence: { $gte: machine_sequence } }, { $inc: { machine_sequence: 1 } })
            // console.log(updateSequence);
            newMachine = new Machine({ machine_code, machine_name, isPM, machine_nickname, machine_sequence, installation_date, manufacturingDate, maker_name, maker_sr_no, line_names: lineInfo[0]._id })
        }
        else {
            newMachine = new Machine({ machine_code, machine_name, isPM, machine_nickname, machine_sequence, installation_date, manufacturingDate, maker_name, maker_sr_no, line_names: lineInfo[0]._id })
        }

        await newMachine.save()

        res.status(201).json({ message: 'Machine register successfully' })
    } catch (error) {
        console.log(error)
        console.log("Data not valid or received !!!");
    }

})

//delete machine based on machine_code
router.post('/deleteMachine', authenticate, async (req, res) => {
    try {
        const { _id, machine_code, deleteRow } = req.body;

        if (!machine_code) {
            return res.status(422).send("Machine code is not valid!!!");
        }
        const sequenceFind = await Machine.find({ machine_code: machine_code, line_names: deleteRow.line_names, machine_sequence: deleteRow.machine_sequence });
        let deleteMachineData;
        if (sequenceFind) {
            const updateSequence = await Machine.updateMany({ line_names: deleteRow.line_names, machine_sequence: { $gte: deleteRow.machine_sequence } }, { $inc: { machine_sequence: -1 } })
            // console.log(updateSequence);
            deleteMachineData = await Machine.deleteOne({ machine_code });
        }
        else {
            deleteMachineData = await Machine.deleteOne({ machine_code });
        }

        if (deleteMachineData) {
            return res.status(201).json("Machine deleted!!!");
        }
        else {
            return res.status(400).json("Machine not deleted!!!");
        }
    } catch (error) {
        console.log(error)
        console.log("Data not valid or received !!!");
    }
})

//update machine based on machine-code
router.post('/updateMachine', authenticate, async (req, res) => {
    try {
        const { machine_code,
            machine_name,
            machine_nickname,
            machine_sequence,
            installation_date,
            maker_name,
            maker_sr_no,
            oldRow } = req.body
        // console.log(line_id, line_name);
        const sequenceFind = await Machine.find({ line_names: oldRow.line_names, machine_sequence: machine_sequence });
        if (sequenceFind) {
            if (oldRow.machine_sequence < machine_sequence) {
                const updateSequence = await Machine.updateMany({ line_names: oldRow.line_names, machine_sequence: { $gt: oldRow.machine_sequence, $lte: machine_sequence } }, { $inc: { machine_sequence: -1 } })
            } else {
                const updateSequence = await Machine.updateMany({ line_names: oldRow.line_names, machine_sequence: { $lt: oldRow.machine_sequence, $gte: machine_sequence } }, { $inc: { machine_sequence: 1 } })
            }
        }
        // if (!line_id || !line_name || !tm_group) {
        //     return res.status(422).send("plz fill all the details !!!");
        // }
        await Machine.updateOne({ machine_code: machine_code }, {
            $set: {
                machine_name,
                machine_nickname,
                machine_sequence,
                installation_date,
                maker_name,
                maker_sr_no,
            }
        });
        res.status(201).json({ message: 'Machine updated successfully' })


    } catch (error) {
        res.status(409).json("Machine already exists!!!");
    }
})


router.post('/postSectionToGetAllData', authenticate, async (req, res) => {
    try {
        let { section, selectedYear } = req.body
        let loggedUserData = req.rootUser;


        let currentYear =
            new Date().getMonth() <= 3
                ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
                : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
        let selectedYearOfCheckSheet =
            selectedYear === currentYear ?
                [
                    {
                        "checkSheet_data.current_year": selectedYear

                    },
                    {
                        "checkSheet_data": []

                    }
                ] : [
                    {
                        "checkSheet_data.current_year": selectedYear

                    },

                ]

        // console.log(section);
        let sectionSplit = section.split("-")
        const sectionInfo = await Section.findOne({ section_id: sectionSplit[0] })
        // console.log("____________", sectionInfo[0]._id)
        let subSectionsData, subSectionIdArray = [], cellData, cellIdArray = [], lineData, lineIdArray = [], machineData, machineDataForChecksheet, subsectionSplitIdArrayForChecksheet = [], machineLastData



        if (sectionInfo.dashboardLevel === "Yes") {
            subSectionsData = await SubSection.find({ section_names: sectionInfo._id }).sort({ subSection_sequence: 1 })


            for (let i = 0; i < subSectionsData.length; i++) {
                subSectionIdArray.push(subSectionsData[i]._id);
            }

            cellData = await Cell.find({ subSection_names: { $in: subSectionIdArray } }).sort({ cell_sequence: 1 });

            for (let i = 0; i < cellData.length; i++) {
                cellIdArray.push(cellData[i]._id);
            }

            lineData = await Line.find({ cell_names: { $in: cellIdArray } }).sort({ line_sequence: 1 });

            for (let i = 0; i < lineData.length; i++) {
                lineIdArray.push(lineData[i]._id);
            }
            // console.log("==========>", lineData)


            // console.log(cellIdArray)

            // const x = "new ObjectId("63243decc42b17be9a33f982")"
            // let groupData
            // let linedataWithGroup = []
            // for (let i = 0; i < cellIdArray.length; i++) {
            //     groupData = await Line.aggregate([

            //         {
            //             $group:{
            //                 _id:"$cell_names",
            //                 books: { $push: "$$ROOT" }
            //             }

            //         },
            //         {
            //             $match:{
            //                 "books": {
            //                     $elemMatch:{cell_names: cellIdArray[i]}
            //                 }
            //             }
            //         },
            //         // {$match: {"books[0].cell_names":{$in: [
            //         //     `new ObjectId("63243decc42b17be9a33f982")`

            //         //   ]}}},
            //         {
            //             $project:{
            //                 "_id":0
            //             }
            //         }

            //     ])  
            //     if(groupData.length > 0){
            //         for (let i = 0; i < groupData[0].books.length; i++) {
            //             linedataWithGroup.push(groupData[0].books[i])  
            //         }
            //     }     


            // }
            // let xyz = await Line.populate(linedataWithGroup,{path:"cell_names"})
            // console.log(xyz);
            // console.log(linedataWithGroup)


            // machineData = await Machine.find({ line_names: { $in: lineIdArray }, checksheet_status: { $exists: true } }).populate({ path: "line_names", populate: { path: "cell_names", model: "Cells" } })

            machineDataOfImplementationApproval = await Machine.aggregate([
                {
                    $match: {
                        line_names: { $in: lineIdArray }
                    }
                },
                { $addFields: { checkSheet_data: { $last: "$checkSheet_data" } } },
                {
                    $match: {
                        $and: [
                            {
                                "checkSheet_data.checksheet_status": "Implementation"
                            },
                            {
                                "checkSheet_data.checksheet_status": { $ne: "" }
                            }
                        ]

                    }
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
                        checkSheet_data: 1
                    }
                },
            ])
            // console.log(machineData)
            machineDataOfImplementationApproval = await Machine.populate(machineDataOfImplementationApproval, { path: "line_names", populate: { path: "cell_names", model: "Cells" } })

            //machine data of preparation and planning approval
            machineDataOfPrepAndPlanApproval = await Machine.aggregate([
                {
                    $match: {
                        line_names: { $in: lineIdArray }
                    }
                },
                { $addFields: { checkSheet_data: { $last: "$checkSheet_data" } } },
                {
                    $match: {
                        $and: [
                            // {
                            //     "checkSheet_data.checksheet_status": { $ne: "Implementation" }
                            // },
                            {
                                "checkSheet_data.checksheet_status": { $ne: "" }
                            },
                            {
                                "checkSheet_data.assign_TL": { $ne: [] }
                            },
                        ]

                    }
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
                        checkSheet_data: 1
                    }
                },
            ])
            // console.log(machineData)
            machineDataOfPrepAndPlanApproval = await Machine.populate(machineDataOfPrepAndPlanApproval, { path: "line_names", populate: { path: "cell_names", model: "Cells" } })

            // console.log(selectedYear, typeof (selectedYear))
            // machineDataForChecksheet = await Machine.find({ line_names: { $in: lineIdArray } }).populate({ path: "line_names", populate: { path: "cell_names", model: "Cells" } })
            machineLastData = await Machine.aggregate([
                {
                    $match: {
                        line_names: { $in: lineIdArray },

                        $or: selectedYearOfCheckSheet
                    }
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
                        checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] }
                    }
                }
            ])

            machineLastData = await Machine.populate(machineLastData, { path: "line_names", populate: { path: "cell_names", model: "Cells" } })

            // console.log(machineLastData)
        } else {
            loggedUserData.subSection_data.map((ids) => {
                let subsectionsId = ids.split("-")
                subsectionSplitIdArrayForChecksheet.push(subsectionsId[0])
            })
            subSectionsData = await SubSection.find({ subSection_id: { $in: subsectionSplitIdArrayForChecksheet } }).sort({ subSection_sequence: 1 })


            for (let i = 0; i < subSectionsData.length; i++) {
                subSectionIdArray.push(subSectionsData[i]._id);
            }

            cellData = await Cell.find({ subSection_names: { $in: subSectionIdArray } }).sort({ cell_sequence: 1 });

            for (let i = 0; i < cellData.length; i++) {
                cellIdArray.push(cellData[i]._id);
            }

            lineData = await Line.find({ cell_names: { $in: cellIdArray } }).sort({ line_sequence: 1 });

            for (let i = 0; i < lineData.length; i++) {
                lineIdArray.push(lineData[i]._id);
            }

            // console.log(cellIdArray)

            // const x = "new ObjectId("63243decc42b17be9a33f982")"
            // let groupData
            // let linedataWithGroup = []
            // for (let i = 0; i < cellIdArray.length; i++) {
            //     groupData = await Line.aggregate([

            //         {
            //             $group:{
            //                 _id:"$cell_names",
            //                 books: { $push: "$$ROOT" }
            //             }

            //         },
            //         {
            //             $match:{
            //                 "books": {
            //                     $elemMatch:{cell_names: cellIdArray[i]}
            //                 }
            //             }
            //         },
            //         // {$match: {"books[0].cell_names":{$in: [
            //         //     `new ObjectId("63243decc42b17be9a33f982")`

            //         //   ]}}},
            //         {
            //             $project:{
            //                 "_id":0
            //             }
            //         }

            //     ])  
            //     if(groupData.length > 0){
            //         for (let i = 0; i < groupData[0].books.length; i++) {
            //             linedataWithGroup.push(groupData[0].books[i])  
            //         }
            //     }     


            // }
            // let xyz = await Line.populate(linedataWithGroup,{path:"cell_names"})
            // console.log(xyz);
            // console.log(linedataWithGroup)


            // machineData = await Machine.find({ line_names: { $in: lineIdArray }, checksheet_status: { $exists: true } }).populate({ path: "line_names", populate: { path: "cell_names", model: "Cells" } })
            machineDataOfImplementationApproval = await Machine.aggregate([
                {
                    $match: {
                        line_names: { $in: lineIdArray }
                    }
                },
                { $addFields: { checkSheet_data: { $last: "$checkSheet_data" } } },
                {
                    $match: {
                        $and: [
                            {
                                "checkSheet_data.checksheet_status": "Implementation"
                            },
                            {
                                "checkSheet_data.checksheet_status": { $ne: "" }
                            }
                        ]

                    }
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
                        checkSheet_data: 1
                    }
                },
            ])
            // console.log(machineData)
            machineDataOfImplementationApproval = await Machine.populate(machineDataOfImplementationApproval, { path: "line_names", populate: { path: "cell_names", model: "Cells" } })
            // machineDataForChecksheet = await Machine.find({ line_names: { $in: lineIdArray } }).populate({ path: "line_names", populate: { path: "cell_names", model: "Cells" } })

            machineLastData = await Machine.aggregate([
                {
                    $match: {
                        line_names: { $in: lineIdArray },
                        $or: selectedYearOfCheckSheet

                    }
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
                        checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] }
                    }
                }
            ])

            machineLastData = await Machine.populate(machineLastData, { path: "line_names", populate: { path: "cell_names", model: "Cells" } })
        }



        res.json({ subSectionsData, subSectionIdArray, cellData, cellIdArray, lineData, lineIdArray, machineDataOfPrepAndPlanApproval, machineDataOfImplementationApproval, machineLastData })
    } catch (error) {
        console.log(error)
        console.log("User id not received!!!");
    }
})

//for main dashboard of meters display for operator user
router.post('/postSectionToGetAllDataForMainDashboard', authenticate, async (req, res) => {
    try {
        let { section, selectedYear } = req.body
        // console.log("1755==>",selectedYear);


        let currentYear =
            new Date().getMonth() <= 3
                ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
                : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
        let selectedYearOfCheckSheet =
            selectedYear === currentYear ?
                [
                    {
                        "checkSheet_data.current_year": selectedYear

                    },
                    {
                        "checkSheet_data": []

                    }
                ] : [
                    {
                        "checkSheet_data.current_year": selectedYear

                    },

                ]



        let sectionSplit = section.split("-")
        const sectionInfo = await Section.find({ section_id: sectionSplit[0] })
        // console.log("____________", sectionInfo[0]._id)
        const subSectionsData = await SubSection.find({ section_names: sectionInfo[0]._id }).sort({ subSection_sequence: 1 })

        //for display default sub-section 
        let defaultSubSectionArray = []
        for (let i = 0; i < subSectionsData.length; i++) {
            defaultSubSectionArray.push(`${subSectionsData[i].subSection_id}-${subSectionsData[i].subSection_name}`);
        }

        let subSectionIdArray = []
        for (let i = 0; i < subSectionsData.length; i++) {
            subSectionIdArray.push(subSectionsData[i]._id);
        }

        const cellData = await Cell.find({ subSection_names: { $in: subSectionIdArray } }).sort({ cell_sequence: 1 });
        let cellIdArray = []
        for (let i = 0; i < cellData.length; i++) {
            cellIdArray.push(cellData[i]._id);
        }

        const lineData = await Line.find({ cell_names: { $in: cellIdArray } }).sort({ line_sequence: 1 });
        let lineIdArray = []
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

        let CarriedPMStatusArray =
        {
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
        }

        let monthForCompareSystemMonth = monthKeyArray[new Date().getMonth()];
        let previousMonth = monthKeyArray[new Date().getMonth() - 1];
        let previousToPreviousMonth = monthKeyArray[new Date().getMonth() - 2];

        //for 1/1M skip status 
        let keyOfPreviousMonth = `checkSheet_data.$[outer].checkSheet.$[inner].planningTableAnimationArray2.${previousMonth}`
        let keyOfCarriedSkipMonthPM = `checkSheet_data.$[outer].PMStatus.${previousMonth}`

        //for other clycle skip status
        let keyOfPreviousToPreviousMonthForSkipPM = `checkSheet_data.$[outer].checkSheet.$[inner].checkSheet.planningTableAnimationArray2.${previousToPreviousMonth}`
        let keyOfCarriedSkipMonthPMForPreviousToPrevious = `checkSheet_data.$[outer].PMStatus.${previousToPreviousMonth}`

        let arrayForPreviousMonthSkipPMData = []
        arrayForPreviousMonthSkipPMData.push(2, "skip_previous")

        let arrayForSkipPerMonthPMData = []
        arrayForSkipPerMonthPMData.push(1, "skip")

        let keyForCurrentMonthNoCompletion = `checkSheet_data.$[outer].PMStatus.${monthForCompareSystemMonth}`

        // const machineData = await Machine.find({ line_names: { $in: lineIdArray } }).sort({ machine_sequence: 1 });

        let machineData = await Machine.aggregate([
            {
                $match: {
                    line_names: { $in: lineIdArray },
                    $or: selectedYearOfCheckSheet

                }
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
                    checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] }
                }
            },
            {
                $sort: {
                    machine_sequence: 1
                }
            }
        ])
        // machineData = await Machine.populate(machineData, { path: "line_names", populate: { path: "cell_names", model: "Cells" } })


        const updateOnesPerMonthStatusSkip = async (machine_code, tableRowId, yearOfCheckSheet) => {
            updatePreviousMonth = await Machine.updateOne({ machine_code: machine_code },
                {
                    $set: {
                        [keyOfPreviousMonth]: arrayForSkipPerMonthPMData,
                        [keyOfCarriedSkipMonthPM]: "PM Skip"
                    }
                },
                {
                    arrayFilters: [{ 'outer.current_year': yearOfCheckSheet }, { 'inner.tableRowId': tableRowId }],
                }
            )
        }

        const updateOtherCyclesStatusSkip = async (machine_code, tableRowId, yearOfCheckSheet) => {

            updatePreviousMonth = await Machine.updateOne({ machine_code: machine_code, yearOfCheckSheet },
                {
                    $set: {
                        [keyOfPreviousMonth]: arrayForPreviousMonthSkipPMData,
                        [keyOfPreviousToPreviousMonthForSkipPM]: arrayForSkipPerMonthPMData,
                        [keyOfCarriedSkipMonthPMForPreviousToPrevious]: "PM Skip",
                    }
                },
                {
                    arrayFilters: [{ 'outer.current_year': yearOfCheckSheet }],
                }
            )
        }

        const updatePMStatusOfPreviousMonthForNoCompletion = async (machine_code, yearOfCheckSheet) => {
            updatePreviousMonth = await Machine.updateOne({ machine_code: machine_code },
                {
                    $set: {
                        [keyOfCarriedSkipMonthPM]: "No Completion",
                        [keyForCurrentMonthNoCompletion]: "No Completion"
                    }
                },
                {
                    arrayFilters: [{ 'outer.current_year': yearOfCheckSheet }],
                })
        }
        let updateCarriedPMStatus
        const updateStatusOfLastMonthPendingForCount = async (machine_code, yearOfCheckSheet, carriedPMStatusExistsOrNot) => {
            // console.log(carriedPMStatusExistsOrNot)
            if (carriedPMStatusExistsOrNot === 0) {
                CarriedPMStatusArray[monthForCompareSystemMonth] = "CarriedPM"
                updateCarriedPMStatus = await Machine.updateOne({ machine_code: machine_code },
                    {
                        $set: { "checkSheet_data.$[outer].carriedPMStatus": CarriedPMStatusArray }
                    },
                    {
                        arrayFilters: [{ 'outer.current_year': yearOfCheckSheet }],
                    }
                )
            } else {
                let keyOfCarriedPMStatus = `checkSheet_data.$[outer].carriedPMStatus.${monthForCompareSystemMonth}`
                updateCarriedPMStatus = await Machine.updateOne({ machine_code: machine_code },
                    {
                        $set:
                            { [keyOfCarriedPMStatus]: "CarriedPM" }
                    },
                    {
                        arrayFilters: [{ 'outer.current_year': yearOfCheckSheet }],
                    }
                )
            }
        }

        let updatePreviousMonth, carriedPMStatusExistsOrNot
        machineData?.map((key) => {
            key?.checkSheet_data?.checkSheet?.map((key1) => {
                if (key1?.planningTableAnimationArray2) {
                    if (key1.planningTableAnimationArray2[previousMonth][0] === "1" &&
                        key1.cycle === "1/1M"
                    ) {
                        updateOnesPerMonthStatusSkip(key.machine_code, key1.tableRowId, key.checkSheet_data.current_year)
                    }

                    if (key1.planningTableAnimationArray2[previousMonth][0] === "2" &&
                        key1.planningTableAnimationArray2[previousMonth].length < 2 &&
                        key1.cycle !== "1/1M") {
                        updateOtherCyclesStatusSkip(key.machine_code, key1.tableRowId, key.checkSheet_data.current_year)

                    }

                    if (key1.planningTableAnimationArray2[monthForCompareSystemMonth][0] === "2" &&
                        key1.cycle !== "1/1M") {
                        // console.log(key?.checkSheet_data?.carriedPMStatus)
                        if (key?.checkSheet_data?.carriedPMStatus != undefined) {
                            carriedPMStatusExistsOrNot = 1
                        } else {
                            carriedPMStatusExistsOrNot = 0
                        }
                        updateStatusOfLastMonthPendingForCount(key.machine_code, key.checkSheet_data.current_year, carriedPMStatusExistsOrNot)
                    }
                }


            })
            if (key?.PMStatus) {
                if (key.PMStatus[previousMonth] === "Current Plan") {
                    updatePMStatusOfPreviousMonthForNoCompletion(key.machine_code, key.checkSheet_data.current_year)
                }
            }

        })



        res.json({ sectionInfo, subSectionsData, subSectionIdArray, cellData, cellIdArray, lineData, lineIdArray, machineData, defaultSubSectionArray })
    } catch (error) {
        console.log(error)
        console.log("User id not received!!!");
    }
})


//for main dashboard of meters display for other users
router.post('/postSectionToGetAllDataForMainDashboardForOtherUser', authenticate, async (req, res) => {
    try {
        let { section, selectedYear } = req.body

        // console.log("2029==>", selectedYear)

        let currentYear =
            new Date().getMonth() <= 3
                ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
                : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
        let selectedYearOfCheckSheet =
            selectedYear === currentYear ?
                [
                    {
                        "checkSheet_data.current_year": selectedYear

                    },
                    {
                        "checkSheet_data": []

                    }
                ] : [
                    {
                        "checkSheet_data.current_year": selectedYear

                    },

                ]


        // console.log(section, "_________", req.rootUser);
        let sectionSplit = section.split("-")
        const sectionInfo = await Section.find({ section_id: sectionSplit[0] })
        // console.log("____________", sectionInfo[0]._id)
        const subSectionsData = await SubSection.find({ section_names: sectionInfo[0]._id }).sort({ subSection_sequence: 1 })

        //for display default sub-section 
        let defaultSubSectionArray = []
        for (let i = 0; i < subSectionsData.length; i++) {
            defaultSubSectionArray.push(`${subSectionsData[i].subSection_id}-${subSectionsData[i].subSection_name}`);
        }

        let subSectionIdArray = []
        for (let i = 0; i < subSectionsData.length; i++) {
            subSectionIdArray.push(subSectionsData[i]._id);
        }

        const cellData = await Cell.find({ subSection_names: { $in: subSectionIdArray } }).sort({ cell_sequence: 1 });
        let cellIdArray = []
        for (let i = 0; i < cellData.length; i++) {
            cellIdArray.push(cellData[i]._id);
        }

        const lineData = await Line.find({ cell_names: { $in: cellIdArray } }).sort({ line_sequence: 1 });
        let lineIdArray = []
        for (let i = 0; i < lineData.length; i++) {
            lineIdArray.push(lineData[i]._id);
        }

        let machineData = await Machine.aggregate([
            {
                $match: {
                    line_names: { $in: lineIdArray },
                    $or: selectedYearOfCheckSheet
                }
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
                    checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] }
                }
            },
            {
                $sort: {
                    machine_sequence: 1
                }
            }
        ])

        res.json({ sectionInfo, subSectionsData, subSectionIdArray, cellData, cellIdArray, lineData, lineIdArray, machineData, defaultSubSectionArray })
    } catch (error) {
        console.log(error)
        console.log("User id not received!!!");
    }
})

//add new checksheet data for perticular machine
router.post('/addNewChecksheetData', async (req, res) => {
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
            machineId } = req.body
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
        let current_year = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`

        //2023-2024
        // let current_year = `${new Date().getFullYear() + 1}-${new Date().getFullYear() + 2}`


        let findMachine
        if (monthForCompareSystemMonth === "Jan" || monthForCompareSystemMonth === "Feb" || monthForCompareSystemMonth === "Mar") {
            let previous_year = `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
            findMachine = await Machine.aggregate([
                {
                    $match: { machine_code: machineId, "checkSheet_data.current_year": previous_year }
                },
                { $unwind: '$checkSheet_data' },
                {
                    $match: { "checkSheet_data.current_year": previous_year }
                },
                { $unwind: '$checkSheet_data.checkSheet' },
                {
                    $sort: { 'checkSheet_data.checkSheet.tableRowId': -1 }
                },
                { $project: { "checkSheet_data.checkSheet": 1, "checkSheet_data.current_year": 1 } },

            ]).limit(1);

            if (findMachine[0] === undefined) {
                tableRowId = 1;
                const addCheckSheetData = await Machine.updateOne({ machine_code: machineId }, {

                    $set: {
                        checkSheet_data: {
                            previous_year,
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
                            }
                        }

                    }
                })
            }
            else {
                tableRowId = findMachine[0].checkSheet_data.checkSheet.tableRowId + 1
                const addCheckSheetData = await Machine.updateOne({ machine_code: machineId, "checkSheet_data.current_year": previous_year }, {

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
                        }


                    }
                })
            }
        } else {

            findMachine = await Machine.aggregate([
                {
                    $match: { machine_code: machineId, "checkSheet_data.current_year": current_year }
                },
                { $unwind: '$checkSheet_data' },
                {
                    $match: { "checkSheet_data.current_year": current_year }
                },
                { $unwind: '$checkSheet_data.checkSheet' },
                {
                    $sort: { 'checkSheet_data.checkSheet.tableRowId': -1 }
                },
                { $project: { "checkSheet_data.checkSheet": 1, "checkSheet_data.current_year": 1 } },


            ]).limit(1);

            if (findMachine[0] === undefined) {
                tableRowId = 1;
                const addCheckSheetData = await Machine.updateOne({ machine_code: machineId }, {

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
                            }
                        }

                    }
                })
            }
            else {
                tableRowId = findMachine[0].checkSheet_data.checkSheet.tableRowId + 1
                const addCheckSheetData = await Machine.updateOne({ machine_code: machineId, "checkSheet_data.current_year": current_year }, {

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
                        }


                    }
                })
            }
        }


        // console.log(findMachine[0].checkSheet_data);

        //     const IsCurrentYearMachineData = await Machine.findOne({ machine_code: machineId, "checkSheet_data.current_year": current_year })
        //     if (!IsCurrentYearMachineData) {
        //         if (monthForCompareSystemMonth === "Dec") {
        //             tableRowId = 1;

        //             // const addCheckSheetData = await Machine.updateOne({ machine_code: machineId }, {

        //             //     $push: {
        //             //         checkSheet_data: {
        //             //             current_year,
        //             //             checkSheet: {
        //             //                 tableRowId,
        //             //                 category,
        //             //                 inspection_parent_name,
        //             //                 // inspection_child_name,
        //             //                 inspection_point,
        //             //                 judgement_criteria,
        //             //                 action,
        //             //                 cycle,
        //             //                 personInCharge,
        //             //                 PM_time,
        //             //             }
        //             //         }

        //             //     }
        //             // })
        //         }

        res.status(201).json({ message: 'Checksheet row data entered successfully' })

    } catch (error) {
        console.log("User id not received!!!");
        console.log(error)
    }
})

//get the checksheet table data of the selected machine 
router.post('/fetchSelectedMachineChecksheetTableData', authenticate, async (req, res) => {
    try {
        let { machineId } = req.body

        //2022-23
        let current_year = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`

        //2023-2024
        // let current_year = `${new Date().getFullYear() + 1}-${new Date().getFullYear() + 2}`

        let previous_year = `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`

        let checkSheetDataKeyExistsOrNot = await Machine.findOne({ machine_code: machineId, checkSheet_data: { $exists: true } })


        let machineLastData = await Machine.aggregate([
            {
                $match: {
                    machine_code: machineId
                }
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
                    checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] }
                }
            }
        ])
        machineLastData = await Machine.populate(machineLastData, { path: "line_names", populate: { path: "cell_names", model: "Cells" } })


        // console.log(machineLastData);
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
        res.json({ getSelectedMachineChecksheet: machineLastData[0]?.checkSheet_data?.checkSheet, yearOfCheckSheet: machineLastData[0]?.checkSheet_data?.current_year, machineData: machineLastData })
        // }
    } catch (error) {
        console.log(error)
        console.log("User id not received!!!");
    }
})

//update selcted machine checksheet data row 
router.post('/updateSelectedMachineChecksheetTableRowData', async (req, res) => {
    try {
        const { rowData, machineId, yearOfCheckSheet } = req.body
        console.log(rowData, machineId, yearOfCheckSheet)
        const updateChecksheetRow = await Machine.updateOne(
            { machine_code: machineId },
            {
                $set: {
                    "checkSheet_data.$[outer].checkSheet.$[inner].category": rowData.category,
                    "checkSheet_data.$[outer].checkSheet.$[inner].inspection_parent_name": rowData.inspection_parent_name,
                    // "checkSheet_data.$[outer].checkSheet.$[inner].inspection_child_name": rowData.inspection_child_name,
                    "checkSheet_data.$[outer].checkSheet.$[inner].inspection_point": rowData.inspection_point,
                    "checkSheet_data.$[outer].checkSheet.$[inner].judgement_criteria": rowData.judgement_criteria,
                    "checkSheet_data.$[outer].checkSheet.$[inner].action": rowData.action,
                    "checkSheet_data.$[outer].checkSheet.$[inner].cycle": rowData.cycle,
                    "checkSheet_data.$[outer].checkSheet.$[inner].personInCharge": rowData.personInCharge,
                    "checkSheet_data.$[outer].checkSheet.$[inner].PM_time": rowData.PM_time
                }
            },
            {
                arrayFilters: [{ 'outer.current_year': yearOfCheckSheet }, { 'inner.tableRowId': rowData.tableRowId }],
            }
        )
        // console.log(updateChecksheetRow)
        res.status(201).json({ message: 'Employee updated successfully' })
    } catch (error) {
        res.status(409).json("user already exists!!!");
    }
})

//delete selcted machine checksheet data row 
router.post('/deleteSelectedMachineChecksheetTableRowData', async (req, res) => {
    try {
        const { rowData, machineId, yearOfCheckSheet } = req.body
        // console.log(rowData, machineId, yearOfCheckSheet)
        const deleteChecksheetRow = await Machine.updateOne({ machine_code: machineId, "checkSheet_data.current_year": yearOfCheckSheet, },
            { $pull: { "checkSheet_data.$[outer].checkSheet": { tableRowId: rowData.tableRowId } } },
            {
                arrayFilters: [{ 'outer.current_year': yearOfCheckSheet }],
            }
        )
        if (deleteChecksheetRow) {
            return res.status(201).json("Checksheet row deleted!!!");
        }
        else {
            return res.status(400).json("Checksheet row not deleted!!!");
        }
    } catch (error) {
        console.log(error)
        console.log("Data not valid or received !!!");
    }
})

//get TL/HOSS and MTD HOS list for approval 
router.get('/getListForApproval', authenticate, async (req, res) => {
    try {
        let loggedUserData = req.rootUser;

        let sectionSplit = loggedUserData.section_data.split("-")
        const sectionInfo = await Section.findOne({ section_id: sectionSplit[0] })

        let TLlist, HOSlist, PRDTLlist, supportingOperatorList, MTDTLlist, MTDTLandOperatorList, supportingOperatorListArray, supportingOperatorListForReportDashboard = []

        if (sectionInfo.dashboardLevel === "Yes") {

            TLlist = await User.find({ section_data: loggedUserData.section_data, user_type: "TL/HOSS", tm_no: { $ne: loggedUserData.tm_no } }, { tm_name: 1, email: 1, _id: 0 })

            HOSlist = await User.find({ section_data: loggedUserData.section_data, tm_grade: "HOS", tm_department: "MTD" }, { tm_name: 1, email: 1, _id: 0 })

            PRDTLlist = await User.find({ section_data: loggedUserData.section_data, user_type: "TL/HOSS", tm_no: { $ne: loggedUserData.tm_no }, tm_department: "PRD" }, { tm_name: 1, email: 1, _id: 0 })

            supportingOperatorList = await User.find({ section_data: loggedUserData.section_data, user_type: "Operator", tm_department: "MTD", tm_no: { $ne: loggedUserData.tm_no } })

            supportingOperatorListForReportDashboard = await User.find({ section_data: loggedUserData.section_data, user_type: "Operator", tm_department: "MTD" })

            MTDTLlist = await User.find({ section_data: loggedUserData.section_data, user_type: "TL/HOSS", tm_no: { $ne: loggedUserData.tm_no }, tm_department: "MTD" }, { tm_name: 1, email: 1, _id: 0 })

            MTDTLandOperatorList = await User.find({
                $or: [
                    { section_data: loggedUserData.section_data, user_type: "TL/HOSS", tm_no: { $ne: loggedUserData.tm_no }, tm_department: "MTD" },
                    { section_data: loggedUserData.section_data, user_type: "Operator", tm_department: "MTD", tm_no: { $ne: loggedUserData.tm_no } }
                ]
            })

            // supportingOperatorList.map((key) => {
            //     supportingOperatorListArray.push(key.tm_name)
            // })

        } else {

            TLlist = await User.find({ section_data: loggedUserData.section_data, subSection_data: { $in: loggedUserData.subSection_data }, user_type: "TL/HOSS", tm_no: { $ne: loggedUserData.tm_no } }, { tm_name: 1, email: 1, _id: 0 })

            HOSlist = await User.find({ section_data: loggedUserData.section_data, subSection_data: { $in: loggedUserData.subSection_data }, tm_grade: "HOS", tm_department: "MTD" }, { tm_name: 1, email: 1, _id: 0 })

            PRDTLlist = await User.find({ section_data: loggedUserData.section_data, subSection_data: { $in: loggedUserData.subSection_data }, user_type: "TL/HOSS", tm_no: { $ne: loggedUserData.tm_no }, tm_department: "PRD" }, { tm_name: 1, email: 1, _id: 0 })

            supportingOperatorList = await User.find({ section_data: loggedUserData.section_data, subSection_data: { $in: loggedUserData.subSection_data }, user_type: "Operator", tm_department: "MTD", tm_no: { $ne: loggedUserData.tm_no } }, { tm_name: 1, _id: 0 })

            supportingOperatorListForReportDashboard = await User.find({ section_data: loggedUserData.section_data, subSection_data: { $in: loggedUserData.subSection_data }, user_type: "Operator", tm_department: "MTD", }, { tm_name: 1, _id: 0 })

            MTDTLlist = await User.find({ section_data: loggedUserData.section_data, subSection_data: { $in: loggedUserData.subSection_data }, user_type: "TL/HOSS", tm_no: { $ne: loggedUserData.tm_no }, tm_department: "MTD" }, { tm_name: 1, email: 1, _id: 0 })

            MTDTLandOperatorList = await User.find({
                $or: [
                    { section_data: loggedUserData.section_data, subSection_data: { $in: loggedUserData.subSection_data }, user_type: "TL/HOSS", tm_no: { $ne: loggedUserData.tm_no }, tm_department: "MTD" },
                    { section_data: loggedUserData.section_data, subSection_data: { $in: loggedUserData.subSection_data }, user_type: "Operator", tm_department: "MTD", tm_no: { $ne: loggedUserData.tm_no } }
                ]
            }, { tm_name: 1, _id: 0 })

            HOSlist = await User.find({ section_data: loggedUserData.section_data, subSection_data: { $in: loggedUserData.subSection_data }, tm_grade: "HOS", tm_department: "MTD" }, { tm_name: 1, email: 1, _id: 0 })

            PRDTLlist = await User.find({ section_data: loggedUserData.section_data, subSection_data: { $in: loggedUserData.subSection_data }, user_type: "TL/HOSS", tm_no: { $ne: loggedUserData.tm_no }, tm_department: "PRD" }, { tm_name: 1, email: 1, _id: 0 })

            supportingOperatorList = await User.find({ section_data: loggedUserData.section_data, subSection_data: { $in: loggedUserData.subSection_data }, user_type: "Operator", tm_department: "MTD", tm_no: { $ne: loggedUserData.tm_no } })

            MTDTLlist = await User.find({ section_data: loggedUserData.section_data, subSection_data: { $in: loggedUserData.subSection_data }, user_type: "TL/HOSS", tm_no: { $ne: loggedUserData.tm_no }, tm_department: "MTD" }, { tm_name: 1, email: 1, _id: 0 })

            MTDTLandOperatorList = await User.find({
                $or: [
                    { section_data: loggedUserData.section_data, subSection_data: { $in: loggedUserData.subSection_data }, user_type: "TL/HOSS", tm_no: { $ne: loggedUserData.tm_no }, tm_department: "MTD" },
                    { section_data: loggedUserData.section_data, subSection_data: { $in: loggedUserData.subSection_data }, user_type: "Operator", tm_department: "MTD", tm_no: { $ne: loggedUserData.tm_no } }
                ]
            }, { tm_name: 1, _id: 0 })

            // supportingOperatorList.map((key) => {
            //     supportingOperatorListArray.push(key.tm_name)
            // })
        }



        res.json({ TLlist, HOSlist, PRDTLlist, supportingOperatorListArray, MTDTLlist, MTDTLandOperatorList, supportingOperatorListForReportDashboard });
    } catch (error) {
        console.log("User data not send or get!!!");
        console.log(error)
    }
})


//send request for approval for ALL checksheet approval flow
router.post('/sendRequestForApproval', authenticate, async (req, res) => {
    try {
        let loggedUserData = req.rootUser;

        let monthKeyArray =
        {
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
        }

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
        } = req.body
        console.log(prd_tl_list, monthForCompareSystemMonth, selected_machine_data)
        // console.log(tl_list, hos_list)
        let keyOfImplementation_assign_PRD_TL = `checkSheet_data.$[outer].implementation_assign_PRD_TL.${monthForCompareSystemMonth}`;
        let keyOfImplementation_assign_MTD_TL = `checkSheet_data.$[outer].implementation_assign_MTD_TL.${monthForCompareSystemMonth}`;
        let keyOfImplementation_assign_MTD_HOS = `checkSheet_data.$[outer].implementation_assign_MTD_HOS.${monthForCompareSystemMonth}`;
        let keyOfImplemetation_prd_tl_approval_status = `checkSheet_data.$[outer].implemetation_prd_tl_approval_status.${monthForCompareSystemMonth}`
        let keyOfImplemetation_mtd_hos_approval_status = `checkSheet_data.$[outer].implemetation_mtd_hos_approval_status.${monthForCompareSystemMonth}`
        let keyOfImplemetation_completed_date = `checkSheet_data.$[outer].implemetation_completed_date.${monthForCompareSystemMonth}`
        let keyOfImplemetation_completed_tm_no = `checkSheet_data.$[outer].implemetation_completed_tm_no.${monthForCompareSystemMonth}`
        let keyOfImplemetation_completed_tm_name = `checkSheet_data.$[outer].implemetation_completed_tm_name.${monthForCompareSystemMonth}`
        let keyOfImplemetation_mtd_tl_approval_status = `checkSheet_data.$[outer].implemetation_mtd_tl_approval_status.${monthForCompareSystemMonth}`




        const checksheet_status = "Preparation"
        if (request === "Yes" && tl_list != "") {
            //for grreting of the mail
            const findAssignTlName = await User.findOne({ email: tl_list })
            const findAssignHosName = await User.findOne({ email: hos_list })

            const updateChecksheetStatus = await Machine.updateOne({ machine_code: selected_machine_data.machine_code },
                {
                    $set: {
                        "checkSheet_data.$[outer].checksheet_status": checksheet_status,
                    },
                    $push:
                    {
                        "checkSheet_data.$[outer].tl_approval_status": "Pending",
                        "checkSheet_data.$[outer].hos_approval_status": "Pending",
                        "checkSheet_data.$[outer].assign_TL": tl_list,
                        "checkSheet_data.$[outer].assign_TL_name": findAssignTlName.tm_name,
                        "checkSheet_data.$[outer].assign_HOS": hos_list,
                        "checkSheet_data.$[outer].assign_HOS_name": findAssignHosName.tm_name,
                        "checkSheet_data.$[outer].sender_tm_no": loggedUserData.tm_no,
                        "checkSheet_data.$[outer].sender_tm_name": loggedUserData.tm_name,
                        "checkSheet_data.$[outer].checkSheetSendingUser": loggedUserData.email,
                        "checkSheet_data.$[outer].preparation_TL_date": preparation_TL_date
                    }
                },
                {
                    arrayFilters: [{ 'outer.current_year': selected_machine_data.checkSheet_data.current_year }],
                }
            )

            //send approval to TL/HOSS after his/her approval send request to HOS
            sendApproval(findAssignTlName.tm_name, loggedUserData.tm_no, loggedUserData.tm_name, selected_machine_data.machine_code, selected_machine_data.machine_name, checksheet_status, tl_list, hos_list, undefined, undefined, request)
        }
        else if (prd_tl_list && phaseStatus === "Planning") {
            //for grreting of the mail
            const findAssignTlName = await User.findOne({ email: prd_tl_list })

            const updateChecksheetStatus = await Machine.updateOne({ machine_code: selected_machine_data.machine_code },
                {
                    $push: { "checkSheet_data.$[outer].prd_tl_approval_status": "Pending", "checkSheet_data.$[outer].assign_PRD_TL": prd_tl_list, "checkSheet_data.$[outer].assign_PRD_TL_name": findAssignTlName.tm_name, "checkSheet_data.$[outer].plan_prepared_tm_no": loggedUserData.tm_no, "checkSheet_data.$[outer].plan_prepared_tm_name": loggedUserData.tm_name, "checkSheet_data.$[outer].plan_prepared_email": loggedUserData.email, "checkSheet_data.$[outer].planning_TL_date": planning_TL_date }
                },
                {
                    arrayFilters: [{ 'outer.current_year': selected_machine_data.checkSheet_data.current_year }],
                })

            //send approval to TL/HOSS after his/her approval send request to HOS
            sendApproval(findAssignTlName.tm_name, loggedUserData.tm_no, loggedUserData.tm_name, selected_machine_data.machine_code, selected_machine_data.machine_name, selected_machine_data.checksheet_status, prd_tl_list, undefined, undefined, undefined, undefined)
        }
        else if (prd_tl_list && mtd_tl_list && mtd_hos_list && phaseStatus === "Implementation") {

            let machineLastDataForKeyexistsOrNot = await Machine.aggregate([
                {
                    $match: {
                        machine_code: selected_machine_data.machine_code
                    }
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
                        checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] }
                    }
                }
            ])
            // console.log(machineLastDataForKeyexistsOrNot)
            // const keyExistsCheck = await Machine.findOne({ machine_code: selected_machine_data.machine_code, "checkSheet_data.implemetation_completed_date": { $exists: true } });

            if (!machineLastDataForKeyexistsOrNot[0].checkSheet_data.implemetation_completed_date) {
                const updateImplementationData = await Machine.updateOne({ machine_code: selected_machine_data.machine_code },
                    {
                        $set: { "checkSheet_data.$[outer].implemetation_completed_date": monthKeyArray, "checkSheet_data.$[outer].implemetation_completed_tm_no": monthKeyArray, "checkSheet_data.$[outer].implemetation_completed_tm_name": monthKeyArray, "checkSheet_data.$[outer].implementation_assign_PRD_TL": monthKeyArray, "checkSheet_data.$[outer].implementation_assign_MTD_TL": monthKeyArray, "checkSheet_data.$[outer].implementation_assign_MTD_HOS": monthKeyArray, "checkSheet_data.$[outer].implemetation_prd_tl_approval_status": monthKeyArray, "checkSheet_data.$[outer].implemetation_mtd_tl_approval_status": monthKeyArray, "checkSheet_data.$[outer].implemetation_mtd_hos_approval_status": monthKeyArray }
                    },
                    {
                        arrayFilters: [{ 'outer.current_year': selected_machine_data.checkSheet_data.current_year }],
                    }
                )
                // console.log(updateImplementationData)
            }
            const updateImplementationCompletionPhase = await Machine.updateOne({ machine_code: selected_machine_data.machine_code },
                {
                    $push: {
                        [keyOfImplemetation_prd_tl_approval_status]: "Pending",
                        [keyOfImplemetation_mtd_tl_approval_status]: "Pending",
                        [keyOfImplemetation_mtd_hos_approval_status]: "Pending",
                        [keyOfImplementation_assign_PRD_TL]: prd_tl_list, [keyOfImplementation_assign_MTD_TL]: mtd_tl_list, [keyOfImplementation_assign_MTD_HOS]: mtd_hos_list, [keyOfImplemetation_completed_tm_no]: loggedUserData.tm_no, [keyOfImplemetation_completed_tm_name]: loggedUserData.tm_name, [keyOfImplemetation_completed_date]: implemetation_completed_date
                    }
                },
                {
                    arrayFilters: [{ 'outer.current_year': selected_machine_data.checkSheet_data.current_year }],
                }
            )
            // console.log(updateImplementationCompletionPhase)
            // for grreting of the mail
            const findAssignTlName = await User.findOne({ email: prd_tl_list })
            //send approval to TL/HOSS after his/her approval send request to HOS
            sendApprovalOfImplementation(findAssignTlName.tm_name, loggedUserData.tm_no, loggedUserData.tm_name, selected_machine_data.machine_code, selected_machine_data.machine_name, selected_machine_data.checksheet_status, prd_tl_list, undefined, undefined, undefined, undefined, undefined)
        }
        else {
            //for grreting of the mail
            const findAssignHosName = await User.findOne({ email: hos_list })

            const updateChecksheetStatus = await Machine.updateOne({ machine_code: selected_machine_data.machine_code }, {
                $set: { "checkSheet_data.$[outer].checksheet_status": checksheet_status },
                $push: {
                    "checkSheet_data.$[outer].hos_approval_status": "Pending", "checkSheet_data.$[outer].assign_HOS": hos_list, "checkSheet_data.$[outer].assign_HOS_name": findAssignHosName.tm_name, "checkSheet_data.$[outer].sender_tm_no": loggedUserData.tm_no,
                    "checkSheet_data.$[outer].sender_tm_name": loggedUserData.tm_name, "checkSheet_data.$[outer].tl_approval_status": "", "checkSheet_data.$[outer].assign_TL": "", "checkSheet_data.$[outer].assign_TL_name": "", "checkSheet_data.$[outer].approved_by_TL": "", "checkSheet_data.$[outer].preparation_TL_date": preparation_TL_date,
                    "checkSheet_data.$[outer].preparation_TL_HOSS_date": "", "checkSheet_data.$[outer].checkSheetSendingUser": loggedUserData.email
                }
            },
                {
                    arrayFilters: [{ 'outer.current_year': selected_machine_data.checkSheet_data.current_year }],
                })

            //send approval direct MTD HOS
            sendApproval(findAssignHosName.tm_name, loggedUserData.tm_no, loggedUserData.tm_name, selected_machine_data.machine_code, selected_machine_data.machine_name, checksheet_status, hos_list, undefined, undefined, undefined, undefined, request)
        }
        return res.status(201).json("approval request send successfully!!!");
        //  console.log(req.body)
    } catch (error) {
        console.log(error)
        console.log("Data not valid or received !!!");
    }
})

//get approval request data for perticular user which was asssign by TL or Operator
router.get('/getApprovalRequestData', authenticate, async (req, res) => {
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
        let keyOfImplementation_assign_PRD_TL = `$checkSheet_data.implementation_assign_PRD_TL.${monthForCompareSystemMonth}`;
        let keyOfImplemetation_prd_tl_approval_status = `$checkSheet_data.implemetation_prd_tl_approval_status.${monthForCompareSystemMonth}`
        let keyOfImplementation_assign_MTD_TL = `checkSheet_data.implementation_assign_MTD_TL.${monthForCompareSystemMonth}`
        let keyOfImplemetation_mtd_tl_approval_status = `$checkSheet_data.implemetation_mtd_tl_approval_status.${monthForCompareSystemMonth}`
        let keyOfImplementation_assign_MTD_HOS = `$checkSheet_data.implementation_assign_MTD_HOS.${monthForCompareSystemMonth}`
        let keyOfImplemetation_mtd_hos_approval_status = `$checkSheet_data.implemetation_mtd_hos_approval_status.${monthForCompareSystemMonth}`

        //2022-23
        let current_year = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`

        //2023-2024
        // let current_year = `${new Date().getFullYear() + 1}-${new Date().getFullYear() + 2}`

        let previous_year = `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`


        let requestData, machineDataWithPopulate;
        if (loggedUserData.user_type === "TL/HOSS") {
            if (loggedUserData.tm_department === "PRD") {
                requestData = await Machine.aggregate([
                    { $addFields: { checkSheet_data: { $last: "$checkSheet_data" } } },

                    // { $unwind: '$checkSheet_data' },
                    {
                        $match: {

                            $or: [
                                { $expr: { $eq: [{ $arrayElemAt: ["$checkSheet_data.assign_TL", -1] }, loggedUserData.email], $eq: [{ $arrayElemAt: ["$checkSheet_data.tl_approval_status", -1] }, "Pending"] } },
                                { $expr: { $eq: [{ $arrayElemAt: ["$checkSheet_data.assign_PRD_TL", -1] }, loggedUserData.email], $eq: [{ $arrayElemAt: ["$checkSheet_data.prd_tl_approval_status", -1] }, "Pending"], $eq: [{ $arrayElemAt: ["$checkSheet_data.prd_tl_approval_status", -1] }, "Pending"] } },
                                {
                                    $expr: {
                                        $eq: [{ $arrayElemAt: [keyOfImplementation_assign_PRD_TL, -1] }, loggedUserData.email],
                                        $eq: [{ $arrayElemAt: [keyOfImplemetation_prd_tl_approval_status, -1] }, "Pending"]
                                    },
                                }
                            ]

                        }
                    }
                ])
                // console.log(requestData)
                machineDataWithPopulate = await Machine.populate(requestData, { path: "line_names", populate: { path: "cell_names", model: "Cells" } })
            } else {
                requestData = await Machine.aggregate([
                    { $addFields: { checkSheet_data: { $last: "$checkSheet_data" } } },

                    // { $unwind: '$checkSheet_data' },
                    {
                        $match: {
                            $or: [
                                { $expr: { $eq: [{ $arrayElemAt: ["$checkSheet_data.assign_TL", -1] }, loggedUserData.email], $eq: [{ $arrayElemAt: ["$checkSheet_data.tl_approval_status", -1] }, "Pending"] }, "checkSheet_data.checksheet_status": "Preparation" },
                                {
                                    $expr: {
                                        $eq: [{ $arrayElemAt: [keyOfImplementation_assign_MTD_TL, -1] }, loggedUserData.email],
                                        $eq: [{ $arrayElemAt: [keyOfImplemetation_prd_tl_approval_status, -1] }, "Accepted"],
                                        $eq: [{ $arrayElemAt: [keyOfImplemetation_mtd_tl_approval_status, -1] }, "Pending"],
                                    },
                                    "checkSheet_data.checksheet_status": "Implementation"
                                }]
                        }
                    }

                ])

            }
            machineDataWithPopulate = await Machine.populate(requestData, { path: "line_names", populate: { path: "cell_names", model: "Cells" } })

            // requestData = await Machine.find({ assign_TL: loggedUserData.email, tl_approval_status: "Pending" }).populate({path:"line_names",populate: {path: "cell_names", model: "Cells"} })

        }
        else {
            if (loggedUserData.user_type === "Section-Admin" && loggedUserData.tm_grade === "HOS") {
                requestData = await Machine.aggregate([

                    { $addFields: { checkSheet_data: { $last: "$checkSheet_data" } } },
                    // { $unwind: '$checkSheet_data' },
                    {
                        $match: {
                            $or: [
                                { $expr: { $eq: [{ $arrayElemAt: ["$checkSheet_data.assign_HOS", -1] }, loggedUserData.email], $eq: [{ $arrayElemAt: ["$checkSheet_data.tl_approval_status", -1] }, "Accepted"], $eq: [{ $arrayElemAt: ["$checkSheet_data.hos_approval_status", -1] }, "Pending"] }, "checkSheet_data.checksheet_status": "Preparation" },
                                { $expr: { $eq: [{ $arrayElemAt: ["$checkSheet_data.hos_approval_status", -1] }, "Pending"], $eq: [{ $arrayElemAt: ["$checkSheet_data.assign_TL", -1] }, ""], $eq: [{ $arrayElemAt: ["$checkSheet_data.assign_HOS", -1] }, loggedUserData.email] }, "checkSheet_data.checksheet_status": "Preparation" },
                                {
                                    $expr: {
                                        $eq: [{ $arrayElemAt: [keyOfImplementation_assign_MTD_HOS, -1] }, loggedUserData.email],
                                        $eq: [{ $arrayElemAt: [keyOfImplemetation_prd_tl_approval_status, -1] }, "Accepted"],
                                        $eq: [{ $arrayElemAt: [keyOfImplemetation_mtd_tl_approval_status, -1] }, "Accepted"],
                                        $eq: [{ $arrayElemAt: [keyOfImplemetation_mtd_hos_approval_status, -1] }, "Pending"]
                                    },
                                    // [keyOfImplementation_assign_MTD_HOS]: loggedUserData.email, 
                                    // [keyOfImplemetation_prd_tl_approval_status]: "Accepted", 
                                    // [keyOfImplemetation_mtd_tl_approval_status]: "Accepted", 
                                    // [keyOfImplemetation_mtd_hos_approval_status]: "Pending", 
                                    "checkSheet_data.checksheet_status": "Implementation"
                                }
                            ]
                        }
                    }
                ])
                // console.log(requestData)
                machineDataWithPopulate = await Machine.populate(requestData, { path: "line_names", populate: { path: "cell_names", model: "Cells" } })

            }
        }

        res.json(machineDataWithPopulate)
    } catch (error) {
        console.log(error)
        console.log("User data not send or get!!!");
    }
})

//Request approval from TL and HOS 
router.post('/approveRequestFromTLandHOS', async (req, res) => {
    try {
        const { request, rejected_remarks, selected_machine_data, approved_by_TL, approved_by_HOS, approved_by_PRD_TL, preparation_TL_HOSS_date, preparation_HOS_date, planning_PRD_TL_date, implementation_approved_PRD_TL_date, implementation_approved_by_PRD_TL, implementation_approved_by_MTD_TL, implementation_approved_MTD_TL_date, implementation_approved_by_MTD_HOS, implementation_approved_MTD_HOS_date, implemetation_quality_remarks } = req.body

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

        let creationMonthKeyArray =
        {
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
        }

        const financialYearWiseMonthKeyArray = ['Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']


        let PMStatusArray =
        {
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
        }

        let keyOfImplemetation_prd_tl_approval_status = `checkSheet_data.$[outer].implemetation_prd_tl_approval_status.${monthForCompareSystemMonth}`
        let keyOfImplemetation_mtd_tl_approval_status = `checkSheet_data.$[outer].implemetation_mtd_tl_approval_status.${monthForCompareSystemMonth}`
        let keyOfImplementation_approved_by_PRD_TL = `checkSheet_data.$[outer].implementation_approved_by_PRD_TL.${monthForCompareSystemMonth}`
        let keyOfImplementation_approved_PRD_TL_date = `checkSheet_data.$[outer].implementation_approved_PRD_TL_date.${monthForCompareSystemMonth}`
        let keyOfImplementation_rejected_remarks = `checkSheet_data.$[outer].implementation_rejected_remarks.${monthForCompareSystemMonth}`
        let keyOfImplementation_approved_by_MTD_TL = `checkSheet_data.$[outer].implementation_approved_by_MTD_TL.${monthForCompareSystemMonth}`
        let keyOfImplementation_approved_MTD_TL_date = `checkSheet_data.$[outer].implementation_approved_MTD_TL_date.${monthForCompareSystemMonth}`
        let keyOfImplemetation_mtd_hos_approval_status = `checkSheet_data.$[outer].implemetation_mtd_hos_approval_status.${monthForCompareSystemMonth}`
        let keyOfImplementation_approved_by_MTD_HOS = `checkSheet_data.$[outer].implementation_approved_by_MTD_HOS.${monthForCompareSystemMonth}`
        let keyOfImplementation_approved_MTD_HOS_date = `checkSheet_data.$[outer].implementation_approved_MTD_HOS_date.${monthForCompareSystemMonth}`
        let keyOfImplemetation_quality_remarks = `checkSheet_data.$[outer].implemetation_quality_remarks.${monthForCompareSystemMonth}`


        if (request === "Yes") {
            if (selected_machine_data.checkSheet_data.tl_approval_status[(selected_machine_data.checkSheet_data.tl_approval_status).length - 1] === "Pending") {
                let tlApproval = "Accepted"

                // selected_machine_data.tl_approval_status[(selected_machine_data.tl_approval_status).length - 1] = "Accepted"
                selected_machine_data.checkSheet_data.tl_approval_status[(selected_machine_data.checkSheet_data.tl_approval_status).length - 1] = "Accepted"
                const TLApprovalStatusUpdate = await Machine.updateOne({ machine_code: selected_machine_data.machine_code },
                    {
                        $set: { "checkSheet_data.$[outer].tl_approval_status": selected_machine_data.checkSheet_data.tl_approval_status },
                        $push: {
                            "checkSheet_data.$[outer].approved_by_TL": approved_by_TL,
                            "checkSheet_data.$[outer].preparation_TL_HOSS_date": preparation_TL_HOSS_date
                        }
                    },
                    {
                        arrayFilters: [{ 'outer.current_year': selected_machine_data.checkSheet_data.current_year }],
                    }
                )
                // console.log(TLApprovalStatusUpdate)
                const findAssignHosName = await User.findOne({ email: selected_machine_data.checkSheet_data.assign_HOS[(selected_machine_data.checkSheet_data.assign_HOS).length - 1] })

                sendApproval(findAssignHosName.tm_name,
                    selected_machine_data.checkSheet_data.sender_tm_no[(selected_machine_data.checkSheet_data.sender_tm_no).length - 1],
                    selected_machine_data.checkSheet_data.sender_tm_name[(selected_machine_data.checkSheet_data.sender_tm_name).length - 1],
                    selected_machine_data.machine_code,
                    selected_machine_data.machine_name,
                    selected_machine_data.checkSheet_data.checksheet_status,
                    selected_machine_data.checkSheet_data.checkSheetSendingUser[(selected_machine_data.checkSheet_data.checkSheetSendingUser).length - 1],
                    selected_machine_data.checkSheet_data.assign_HOS[(selected_machine_data.checkSheet_data.checkSheetSendingUser).length - 1],
                    tlApproval, undefined, undefined)
            }
            else if (selected_machine_data.checkSheet_data.tl_approval_status[(selected_machine_data.checkSheet_data.tl_approval_status).length - 1] === "Accepted" && selected_machine_data.checkSheet_data.hos_approval_status[(selected_machine_data.checkSheet_data.hos_approval_status).length - 1] === "Pending") {
                let hosApproval = "Accepted"
                selected_machine_data.checkSheet_data.hos_approval_status[(selected_machine_data.checkSheet_data.hos_approval_status).length - 1] = "Accepted"
                const TLApprovalStatusUpdate = await Machine.updateOne({ machine_code: selected_machine_data.machine_code },
                    {
                        $set: { "checkSheet_data.$[outer].hos_approval_status": selected_machine_data.checkSheet_data.hos_approval_status, "checkSheet_data.$[outer].checksheet_status": "Planning" },
                        $push: { "checkSheet_data.$[outer].approved_by_HOS": approved_by_HOS, "checkSheet_data.$[outer].preparation_HOS_date": preparation_HOS_date }
                    },
                    {
                        arrayFilters: [{ 'outer.current_year': selected_machine_data.checkSheet_data.current_year }],
                    }
                )
                //  console.log(TLApprovalStatusUpdate)
                // sendApproval(selected_machine_data.checkSheet_data.sender_tm_no[(selected_machine_data.checkSheet_data.sender_tm_no).length - 1],
                //     selected_machine_data.checkSheet_data.sender_tm_name[(selected_machine_data.checkSheet_data.sender_tm_name).length - 1],
                //     selected_machine_data.machine_code,
                //     selected_machine_data.machine_name,
                //     selected_machine_data.checkSheet_data.checksheet_status,
                //     selected_machine_data.checkSheet_data.checkSheetSendingUser[(selected_machine_data.checkSheet_data.checkSheetSendingUser).length - 1],
                //     selected_machine_data.checkSheet_data.assign_TL,
                //     selected_machine_data.checkSheet_data.tl_approval_status,
                //     hosApproval, undefined)

            }
            else if (selected_machine_data.checkSheet_data.hos_approval_status[(selected_machine_data.checkSheet_data.hos_approval_status).length - 1] === "Pending") {
                let hosApproval = "Accepted"
                selected_machine_data.checkSheet_data.hos_approval_status[(selected_machine_data.checkSheet_data.hos_approval_status).length - 1] = "Accepted"
                const TLApprovalStatusUpdate = await Machine.updateOne({ machine_code: selected_machine_data.machine_code },
                    {
                        $set: { "checkSheet_data.$[outer].checksheet_status": "Planning", "checkSheet_data.$[outer].hos_approval_status": selected_machine_data.checkSheet_data.hos_approval_status }
                        , $push: { "checkSheet_data.$[outer].approved_by_HOS": approved_by_HOS, "checkSheet_data.$[outer].preparation_HOS_date": preparation_HOS_date }
                    },
                    {
                        arrayFilters: [{ 'outer.current_year': selected_machine_data.checkSheet_data.current_year }],
                    }
                )
                // sendApproval(selected_machine_data.checkSheet_data.sender_tm_no[(selected_machine_data.checkSheet_data.sender_tm_no).length - 1],
                //     selected_machine_data.checkSheet_data.sender_tm_name[(selected_machine_data.checkSheet_data.sender_tm_name).length - 1],
                //     selected_machine_data.machine_code,
                //     selected_machine_data.machine_name,
                //     selected_machine_data.checkSheet_data.checksheet_status,
                //     selected_machine_data.checkSheet_data.checkSheetSendingUser[(selected_machine_data.checkSheet_data.checkSheetSendingUser).length - 1],
                //     undefined,
                //     undefined,
                //     hosApproval,
                //     "No")
            }
            else if (selected_machine_data.checkSheet_data.prd_tl_approval_status[(selected_machine_data.checkSheet_data.prd_tl_approval_status).length - 1] === "Pending") {
                for (let i = 0; i < selected_machine_data.checkSheet_data.checkSheet.length; i++) {
                    for (let j = 0; j < financialYearWiseMonthKeyArray.length; j++) {
                        let month = financialYearWiseMonthKeyArray[j]
                        if (selected_machine_data.checkSheet_data.checkSheet[i].planningTableAnimationArray2[month][0] === "1") {
                            PMStatusArray[financialYearWiseMonthKeyArray[j]] = "Current Plan"
                        }
                    }
                }

                selected_machine_data.checkSheet_data.prd_tl_approval_status[(selected_machine_data.checkSheet_data.prd_tl_approval_status).length - 1] = "Accepted"
                // console.log(selected_machine_data.checkSheet_data.prd_tl_approval_status)
                const PRDTLApprovalStatusUpdate = await Machine.updateOne({ machine_code: selected_machine_data.machine_code },
                    {
                        $set: { "checkSheet_data.$[outer].prd_tl_approval_status": selected_machine_data.checkSheet_data.prd_tl_approval_status, "checkSheet_data.$[outer].checksheet_status": "Implementation", "checkSheet_data.$[outer].PMStatus": PMStatusArray },
                        $push: { "checkSheet_data.$[outer].approved_by_PRD_TL": approved_by_PRD_TL, "checkSheet_data.$[outer].planning_PRD_TL_date": planning_PRD_TL_date }
                    },
                    {
                        arrayFilters: [{ 'outer.current_year': selected_machine_data.checkSheet_data.current_year }],
                    }
                )
            }
            else if (selected_machine_data.checkSheet_data.implemetation_prd_tl_approval_status[monthForCompareSystemMonth][(selected_machine_data.checkSheet_data.implemetation_prd_tl_approval_status[monthForCompareSystemMonth]).length - 1] === "Pending") {
                let prd_tl_approval_status = "Accepted"

                let machineLastDataForKeyexistsOrNot = await Machine.aggregate([
                    {
                        $match: {
                            machine_code: selected_machine_data.machine_code
                        }
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
                            checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] }
                        }
                    }
                ])

                // const keyExistsCheck = await Machine.findOne({ machine_code: selected_machine_data.machine_code, "checkSheet_data.implementation_approved_by_PRD_TL": { $exists: true } });

                if (!machineLastDataForKeyexistsOrNot[0].checkSheet_data.implementation_approved_by_PRD_TL) {
                    const updateImplementationData = await Machine.updateOne({ machine_code: selected_machine_data.machine_code },
                        {
                            $set: { "checkSheet_data.$[outer].implementation_approved_by_PRD_TL": creationMonthKeyArray, "checkSheet_data.$[outer].implementation_approved_PRD_TL_date": creationMonthKeyArray, "checkSheet_data.$[outer].implemetation_quality_remarks": creationMonthKeyArray }
                        },
                        {
                            arrayFilters: [{ 'outer.current_year': selected_machine_data.checkSheet_data.current_year }],
                        }
                    )

                }

                selected_machine_data.checkSheet_data.implemetation_prd_tl_approval_status[monthForCompareSystemMonth][(selected_machine_data.checkSheet_data.implemetation_prd_tl_approval_status[monthForCompareSystemMonth]).length - 1] = "Accepted"
                // selected_machine_data.checkSheet_data.implemetation_mtd_tl_approval_status[monthForCompareSystemMonth][(selected_machine_data.checkSheet_data.implemetation_mtd_tl_approval_status[monthForCompareSystemMonth]).length - 1] = "Pending"

                const PRDTLApprovalStatusUpdateOfImplementation = await Machine.updateOne({ machine_code: selected_machine_data.machine_code },
                    {
                        $set:
                        {
                            [keyOfImplemetation_prd_tl_approval_status]: selected_machine_data.checkSheet_data.implemetation_prd_tl_approval_status[monthForCompareSystemMonth],
                            //   [keyOfImplemetation_mtd_tl_approval_status]: selected_machine_data.checkSheet_data.implemetation_mtd_tl_approval_status[monthForCompareSystemMonth], 

                        },
                        $push: {

                            [keyOfImplementation_approved_by_PRD_TL]: implementation_approved_by_PRD_TL,
                            [keyOfImplementation_approved_PRD_TL_date]: implementation_approved_PRD_TL_date,
                            [keyOfImplemetation_quality_remarks]: implemetation_quality_remarks
                        }
                    },
                    {
                        arrayFilters: [{ 'outer.current_year': selected_machine_data.checkSheet_data.current_year }],
                    }
                )
                const findAssignMTDTLNameOfImplementation = await User.findOne({ email: selected_machine_data.checkSheet_data.implementation_assign_MTD_TL[monthForCompareSystemMonth][(selected_machine_data.checkSheet_data.implementation_assign_MTD_TL[monthForCompareSystemMonth]).length - 1] })

                sendApprovalOfImplementation(findAssignMTDTLNameOfImplementation.tm_name,
                    selected_machine_data.checkSheet_data.implemetation_completed_tm_no[monthForCompareSystemMonth][(selected_machine_data.checkSheet_data.implemetation_completed_tm_no[monthForCompareSystemMonth]).length - 1],
                    selected_machine_data.checkSheet_data.implemetation_completed_tm_name[monthForCompareSystemMonth][(selected_machine_data.checkSheet_data.implemetation_completed_tm_name[monthForCompareSystemMonth]).length - 1],
                    selected_machine_data.machine_code,
                    selected_machine_data.machine_name,
                    selected_machine_data.checkSheet_data.checksheet_status,
                    selected_machine_data.checkSheet_data.implementation_assign_MTD_TL[monthForCompareSystemMonth][(selected_machine_data.checkSheet_data.implementation_assign_MTD_TL[monthForCompareSystemMonth]).length - 1],
                    undefined,
                    prd_tl_approval_status, undefined, undefined, undefined)
            } else if (selected_machine_data.checkSheet_data.implemetation_prd_tl_approval_status[monthForCompareSystemMonth][(selected_machine_data.checkSheet_data.implemetation_prd_tl_approval_status[monthForCompareSystemMonth]).length - 1] === "Accepted"
                && selected_machine_data.checkSheet_data.implemetation_mtd_tl_approval_status[monthForCompareSystemMonth][(selected_machine_data.checkSheet_data.implemetation_mtd_tl_approval_status[monthForCompareSystemMonth]).length - 1] === "Pending") {
                let mtd_tl_approval_status = "Accepted"

                let machineLastDataForKeyexistsOrNot = await Machine.aggregate([
                    {
                        $match: {
                            machine_code: selected_machine_data.machine_code
                        }
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
                            checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] }
                        }
                    }
                ])

                // const keyExistsCheck = await Machine.findOne({ machine_code: selected_machine_data.machine_code, "checkSheet_data.implementation_approved_by_MTD_TL": { $exists: true } });

                if (!machineLastDataForKeyexistsOrNot[0].checkSheet_data.implementation_approved_by_MTD_TL) {
                    const updateImplementationData = await Machine.updateOne({ machine_code: selected_machine_data.machine_code },
                        {
                            $set: { "checkSheet_data.$[outer].implementation_approved_by_MTD_TL": creationMonthKeyArray, "checkSheet_data.$[outer].implementation_approved_MTD_TL_date": creationMonthKeyArray, "checkSheet_data.$[outer].implemetation_mtd_hos_approval_status": creationMonthKeyArray }
                        },
                        {
                            arrayFilters: [{ 'outer.current_year': selected_machine_data.checkSheet_data.current_year }],
                        }
                    )

                }

                selected_machine_data.checkSheet_data.implemetation_mtd_tl_approval_status[monthForCompareSystemMonth][(selected_machine_data.checkSheet_data.implemetation_mtd_tl_approval_status[monthForCompareSystemMonth]).length - 1] = "Accepted"
                // selected_machine_data.checkSheet_data.implemetation_mtd_hos_approval_status[monthForCompareSystemMonth][(selected_machine_data.checkSheet_data.implemetation_mtd_hos_approval_status[monthForCompareSystemMonth]).length - 1] = "Pending"

                const MTDTLApprovalStatusUpdateOfImplementation = await Machine.updateOne({ machine_code: selected_machine_data.machine_code },
                    {
                        $set:
                        {
                            [keyOfImplemetation_mtd_tl_approval_status]: selected_machine_data.checkSheet_data.implemetation_mtd_tl_approval_status[monthForCompareSystemMonth],
                            // [keyOfImplemetation_mtd_hos_approval_status]: selected_machine_data.checkSheet_data.implemetation_mtd_hos_approval_status[monthForCompareSystemMonth], 

                        },
                        $push: {
                            [keyOfImplementation_approved_by_MTD_TL]: implementation_approved_by_MTD_TL,
                            [keyOfImplementation_approved_MTD_TL_date]: implementation_approved_MTD_TL_date
                        }
                    },
                    {
                        arrayFilters: [{ 'outer.current_year': selected_machine_data.checkSheet_data.current_year }],
                    })
                const findAssignMTDHOSNameOfImplementation = await User.findOne({ email: selected_machine_data.checkSheet_data.implementation_assign_MTD_HOS[monthForCompareSystemMonth][(selected_machine_data.checkSheet_data.implementation_assign_MTD_HOS[monthForCompareSystemMonth]).length - 1] })

                sendApprovalOfImplementation(findAssignMTDHOSNameOfImplementation.tm_name,
                    selected_machine_data.checkSheet_data.implemetation_completed_tm_no[monthForCompareSystemMonth][(selected_machine_data.checkSheet_data.implemetation_completed_tm_no[monthForCompareSystemMonth]).length - 1],
                    selected_machine_data.checkSheet_data.implemetation_completed_tm_name[monthForCompareSystemMonth][(selected_machine_data.checkSheet_data.implemetation_completed_tm_name[monthForCompareSystemMonth]).length - 1],
                    selected_machine_data.machine_code,
                    selected_machine_data.machine_name,
                    selected_machine_data.checkSheet_data.checksheet_status,
                    selected_machine_data.checkSheet_data.implementation_assign_MTD_HOS[monthForCompareSystemMonth][(selected_machine_data.checkSheet_data.implementation_assign_MTD_HOS[monthForCompareSystemMonth]).length - 1],
                    undefined,
                    selected_machine_data.checkSheet_data.implemetation_prd_tl_approval_status[monthForCompareSystemMonth][(selected_machine_data.checkSheet_data.implemetation_prd_tl_approval_status[monthForCompareSystemMonth]).length - 1],
                    mtd_tl_approval_status, undefined, undefined)
            } else if (selected_machine_data.checkSheet_data.implemetation_prd_tl_approval_status[monthForCompareSystemMonth][(selected_machine_data.checkSheet_data.implemetation_prd_tl_approval_status[monthForCompareSystemMonth]).length - 1] === "Accepted" &&
                selected_machine_data.checkSheet_data.implemetation_mtd_tl_approval_status[monthForCompareSystemMonth][(selected_machine_data.checkSheet_data.implemetation_mtd_tl_approval_status[monthForCompareSystemMonth]).length - 1] === "Accepted" &&
                selected_machine_data.checkSheet_data.implemetation_mtd_hos_approval_status[monthForCompareSystemMonth][(selected_machine_data.checkSheet_data.implemetation_mtd_hos_approval_status[monthForCompareSystemMonth]).length - 1] === "Pending") {
                // const keyExistsCheck = await Machine.findOne({ machine_code: selected_machine_data.machine_code, "checkSheet_data.implementation_approved_by_MTD_HOS": { $exists: true } });

                let machineLastDataForKeyexistsOrNot = await Machine.aggregate([
                    {
                        $match: {
                            machine_code: selected_machine_data.machine_code
                        }
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
                            checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] }
                        }
                    }
                ])

                if (!machineLastDataForKeyexistsOrNot[0].checkSheet_data.implementation_approved_by_MTD_HOS) {

                    const updateImplementationData = await Machine.updateOne({ machine_code: selected_machine_data.machine_code },
                        {
                            $set: { "checkSheet_data.$[outer].implementation_approved_by_MTD_HOS": creationMonthKeyArray, "checkSheet_data.$[outer].implementation_approved_MTD_HOS_date": creationMonthKeyArray }
                        },
                        {
                            arrayFilters: [{ 'outer.current_year': selected_machine_data.checkSheet_data.current_year }],
                        })

                }

                selected_machine_data.checkSheet_data.implemetation_mtd_hos_approval_status[monthForCompareSystemMonth][(selected_machine_data.checkSheet_data.implemetation_mtd_hos_approval_status[monthForCompareSystemMonth]).length - 1] = "Accepted"
                const MTDHOSApprovalStatusUpdateOfImplementation = await Machine.updateOne({ machine_code: selected_machine_data.machine_code },
                    {
                        $set:
                        {
                            [keyOfImplemetation_mtd_hos_approval_status]: selected_machine_data.checkSheet_data.implemetation_mtd_hos_approval_status[monthForCompareSystemMonth],

                        },
                        $push: {
                            [keyOfImplementation_approved_by_MTD_HOS]: implementation_approved_by_MTD_HOS,
                            [keyOfImplementation_approved_MTD_HOS_date]: implementation_approved_MTD_HOS_date
                        }
                    },
                    {
                        arrayFilters: [{ 'outer.current_year': selected_machine_data.checkSheet_data.current_year }],
                    })
            }
        }
        else {
            if (selected_machine_data.checkSheet_data.tl_approval_status[(selected_machine_data.checkSheet_data.tl_approval_status).length - 1] === "Pending") {
                let tlApproval = "Rejected"
                selected_machine_data.checkSheet_data.tl_approval_status[(selected_machine_data.checkSheet_data.tl_approval_status).length - 1] = "Rejected"

                const TLApprovalStatusUpdate = await Machine.updateOne({ machine_code: selected_machine_data.machine_code },
                    {
                        $set: { "checkSheet_data.$[outer].tl_approval_status": selected_machine_data.checkSheet_data.tl_approval_status, "checkSheet_data.$[outer].rejected_remarks": rejected_remarks },
                        $push: { "checkSheet_data.$[outer].preparation_TL_HOSS_date": preparation_TL_HOSS_date, "checkSheet_data.$[outer].approved_by_TL": "", "checkSheet_data.$[outer].approved_by_HOS": "", "checkSheet_data.$[outer].preparation_HOS_date": "" }
                    },
                    {
                        arrayFilters: [{ 'outer.current_year': selected_machine_data.checkSheet_data.current_year }],
                    })

                const findAssignHOSName = await User.findOne({ email: selected_machine_data.checkSheet_data.assign_HOS[(selected_machine_data.checkSheet_data.checkSheetSendingUser).length - 1] })

                let greetingNames = `${findAssignHOSName.tm_name} and ${selected_machine_data.checkSheet_data.sender_tm_name[(selected_machine_data.checkSheet_data.sender_tm_name).length - 1]}`

                sendApproval(greetingNames, selected_machine_data.checkSheet_data.sender_tm_no[(selected_machine_data.checkSheet_data.sender_tm_no).length - 1],
                    selected_machine_data.checkSheet_data.sender_tm_name[(selected_machine_data.checkSheet_data.sender_tm_name).length - 1],
                    selected_machine_data.machine_code,
                    selected_machine_data.machine_name,
                    selected_machine_data.checkSheet_data.checksheet_status,
                    selected_machine_data.checkSheet_data.checkSheetSendingUser[(selected_machine_data.checkSheet_data.checkSheetSendingUser).length - 1],
                    selected_machine_data.checkSheet_data.assign_HOS[(selected_machine_data.checkSheet_data.checkSheetSendingUser).length - 1],
                    tlApproval, undefined, undefined,
                    rejected_remarks)
            } else if (selected_machine_data.checkSheet_data.tl_approval_status[(selected_machine_data.checkSheet_data.tl_approval_status).length - 1] === "Accepted" && selected_machine_data.checkSheet_data.hos_approval_status[(selected_machine_data.checkSheet_data.hos_approval_status).length - 1] === "Pending") {
                let hosApproval = "Rejected"
                selected_machine_data.checkSheet_data.hos_approval_status[(selected_machine_data.checkSheet_data.hos_approval_status).length - 1] = "Rejected"
                const TLApprovalStatusUpdate = await Machine.updateOne({ machine_code: selected_machine_data.machine_code },
                    {
                        $set: { "checkSheet_data.$[outer].hos_approval_status": selected_machine_data.checkSheet_data.hos_approval_status, "checkSheet_data.$[outer].rejected_remarks": rejected_remarks },
                        $push: { "checkSheet_data.$[outer].preparation_HOS_date": preparation_HOS_date }
                    },
                    {
                        arrayFilters: [{ 'outer.current_year': selected_machine_data.checkSheet_data.current_year }],
                    }
                )
                sendApproval(selected_machine_data.checkSheet_data.sender_tm_name[(selected_machine_data.checkSheet_data.sender_tm_name).length - 1], selected_machine_data.checkSheet_data.sender_tm_no[(selected_machine_data.checkSheet_data.sender_tm_no).length - 1],
                    selected_machine_data.checkSheet_data.sender_tm_name[(selected_machine_data.checkSheet_data.sender_tm_name).length - 1],
                    selected_machine_data.machine_code,
                    selected_machine_data.machine_name,
                    selected_machine_data.checkSheet_data.checksheet_status,
                    selected_machine_data.checkSheet_data.checkSheetSendingUser[(selected_machine_data.checkSheet_data.checkSheetSendingUser).length - 1],
                    undefined,
                    selected_machine_data.checkSheet_data.tl_approval_status[(selected_machine_data.checkSheet_data.tl_approval_status).length - 1],
                    hosApproval, undefined, rejected_remarks)
            } else if (selected_machine_data.checkSheet_data.hos_approval_status[(selected_machine_data.checkSheet_data.hos_approval_status).length - 1] === "Pending") {
                let hosApproval = "Rejected"
                selected_machine_data.checkSheet_data.hos_approval_status[(selected_machine_data.checkSheet_data.hos_approval_status).length - 1] = "Rejected"
                const TLApprovalStatusUpdate = await Machine.updateOne({ machine_code: selected_machine_data.machine_code },
                    {
                        $set: { "checkSheet_data.$[outer].hos_approval_status": selected_machine_data.checkSheet_data.hos_approval_status, "checkSheet_data.$[outer].rejected_remarks": rejected_remarks },
                        $push: { "checkSheet_data.$[outer].preparation_HOS_date": preparation_HOS_date }
                    },
                    {
                        arrayFilters: [{ 'outer.current_year': selected_machine_data.checkSheet_data.current_year }],
                    })
                sendApproval(selected_machine_data.checkSheet_data.sender_tm_name[(selected_machine_data.checkSheet_data.sender_tm_name).length - 1], selected_machine_data.checkSheet_data.sender_tm_no[(selected_machine_data.checkSheet_data.sender_tm_no).length - 1],
                    selected_machine_data.checkSheet_data.sender_tm_name[(selected_machine_data.checkSheet_data.sender_tm_name).length - 1],
                    selected_machine_data.machine_code,
                    selected_machine_data.machine_name,
                    selected_machine_data.checkSheet_data.checksheet_status,
                    selected_machine_data.checkSheet_data.checkSheetSendingUser[(selected_machine_data.checkSheet_data.checkSheetSendingUser).length - 1],
                    undefined,
                    undefined,
                    hosApproval,
                    "No", rejected_remarks)
            } else if (selected_machine_data.checkSheet_data.prd_tl_approval_status[(selected_machine_data.checkSheet_data.prd_tl_approval_status).length - 1] === "Pending") {
                let prdTlApproval = "Rejected"
                selected_machine_data.checkSheet_data.prd_tl_approval_status[(selected_machine_data.checkSheet_data.prd_tl_approval_status).length - 1] = "Rejected"
                const PRDTLApprovalStatusUpdate = await Machine.updateOne({ machine_code: selected_machine_data.machine_code },
                    {
                        $set: { "checkSheet_data.$[outer].prd_tl_approval_status": selected_machine_data.checkSheet_data.prd_tl_approval_status, "checkSheet_data.$[outer].rejected_remarks": rejected_remarks },
                        $push: { "checkSheet_data.$[outer].planning_PRD_TL_date": planning_PRD_TL_date, "checkSheet_data.$[outer].approved_by_PRD_TL": "" }
                    },
                    {
                        arrayFilters: [{ 'outer.current_year': selected_machine_data.checkSheet_data.current_year }],
                    })
                sendApproval(selected_machine_data.checkSheet_data.plan_prepared_tm_name[(selected_machine_data.checkSheet_data.plan_prepared_tm_name).length - 1], selected_machine_data.checkSheet_data.plan_prepared_tm_no[(selected_machine_data.checkSheet_data.plan_prepared_tm_no).length - 1],
                    selected_machine_data.checkSheet_data.plan_prepared_tm_name[(selected_machine_data.checkSheet_data.plan_prepared_tm_name).length - 1],
                    selected_machine_data.machine_code,
                    selected_machine_data.machine_name,
                    selected_machine_data.checkSheet_data.checksheet_status,
                    selected_machine_data.checkSheet_data.plan_prepared_email[(selected_machine_data.checkSheet_data.plan_prepared_email).length - 1],
                    undefined,
                    undefined,
                    prdTlApproval,
                    "No", rejected_remarks)
            }
            //Implemetation rejected by PRD TL

            // else if (selected_machine_data.checkSheet_data.implemetation_prd_tl_approval_status[monthForCompareSystemMonth][(selected_machine_data.checkSheet_data.implemetation_prd_tl_approval_status[monthForCompareSystemMonth]).length - 1] === "Pending") {
            //     let prd_tl_approval_status = "Rejected"

            //     let machineLastDataForKeyexistsOrNot = await Machine.aggregate([
            //         {
            //             $match:{
            //                 machine_code: selected_machine_data.machine_code
            //             }
            //         },
            //         {
            //             $project:{
            //                 machine_code:1,
            //                 machine_name:1,
            //                 machine_nickname:1,
            //                 machine_sequence: 1,
            //                 installation_date:1,
            //                 maker_name:1,
            //                 maker_sr_no:1,
            //                 manufacturingDate:1,
            //                 isPM:1,
            //                 line_names: 1,
            //                 checkSheet_data:{$arrayElemAt: ["$checkSheet_data", -1]}
            //             }
            //         }
            //     ])

            //     // const keyExistsCheck = await Machine.findOne({ machine_code: selected_machine_data.machine_code, "checkSheet_data.implementation_rejected_remarks": { $exists: true } });

            //     if (!machineLastDataForKeyexistsOrNot[0].checkSheet_data.implementation_rejected_remarks){
            //         const updateImplementationData = await Machine.updateOne({ machine_code: selected_machine_data.machine_code },
            //              { $set: { "checkSheet_data.$[outer].implementation_rejected_remarks": creationMonthKeyArray } },
            //              {
            //                 arrayFilters: [{ 'outer.current_year':selected_machine_data.checkSheet_data.current_year }],
            //             })

            //     }

            //     selected_machine_data.checkSheet_data.implemetation_prd_tl_approval_status[monthForCompareSystemMonth][(selected_machine_data.checkSheet_data.implemetation_prd_tl_approval_status[monthForCompareSystemMonth]).length - 1] = "Rejected"

            //     const PRDTLApprovalStatusUpdateOfImplementation = await Machine.updateOne({ machine_code: selected_machine_data.machine_code },
            //          { $set: 
            //             { 
            //                 [keyOfImplemetation_prd_tl_approval_status]: selected_machine_data.checkSheet_data.implemetation_prd_tl_approval_status[monthForCompareSystemMonth],
            //                 [keyOfImplementation_approved_PRD_TL_date]: implementation_approved_PRD_TL_date, 
            //                 [keyOfImplementation_rejected_remarks]: rejected_remarks } },
            //          {
            //             arrayFilters: [{ 'outer.current_year':selected_machine_data.checkSheet_data.current_year }],
            //         })
            //     const findAssignMTDTLNameOfImplementation = await User.findOne({ email: selected_machine_data.checkSheet_data.implementation_assign_MTD_TL[monthForCompareSystemMonth][(selected_machine_data.checkSheet_data.implementation_assign_MTD_TL[monthForCompareSystemMonth]).length - 1] })
            //     let greetingNamesForAll = "All"
            //     sendApprovalOfImplementation(greetingNamesForAll,
            //         selected_machine_data.checkSheet_data.implemetation_completed_tm_no[monthForCompareSystemMonth][(selected_machine_data.checkSheet_data.implemetation_completed_tm_no[monthForCompareSystemMonth]).length - 1],
            //         selected_machine_data.checkSheet_data.implemetation_completed_tm_name[monthForCompareSystemMonth][(selected_machine_data.checkSheet_data.implemetation_completed_tm_name[monthForCompareSystemMonth]).length - 1],
            //         selected_machine_data.machine_code,
            //         selected_machine_data.machine_name,
            //         selected_machine_data.checkSheet_data.checksheet_status,
            //         selected_machine_data.checkSheet_data.implementation_assign_MTD_TL[monthForCompareSystemMonth][(selected_machine_data.checkSheet_data.implementation_assign_MTD_TL[monthForCompareSystemMonth]).length - 1],
            //         selected_machine_data.checkSheet_data.implementation_assign_MTD_HOS[monthForCompareSystemMonth][(selected_machine_data.checkSheet_data.implementation_assign_MTD_HOS[monthForCompareSystemMonth]).length - 1],
            //         prd_tl_approval_status,
            //         undefined,
            //         undefined, rejected_remarks)
            // } 
            else if (selected_machine_data.checkSheet_data.implemetation_prd_tl_approval_status[monthForCompareSystemMonth][(selected_machine_data.checkSheet_data.implemetation_prd_tl_approval_status[monthForCompareSystemMonth]).length - 1] === "Accepted"
                && selected_machine_data.checkSheet_data.implemetation_mtd_tl_approval_status[monthForCompareSystemMonth][(selected_machine_data.checkSheet_data.implemetation_mtd_tl_approval_status[monthForCompareSystemMonth]).length - 1] === "Pending") {
                let mtd_tl_approval_status = "Rejected"

                let machineLastDataForKeyexistsOrNot = await Machine.aggregate([
                    {
                        $match: {
                            machine_code: selected_machine_data.machine_code
                        }
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
                            checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] }
                        }
                    }
                ])

                // const keyExistsCheck = await Machine.findOne({ machine_code: selected_machine_data.machine_code, "checkSheet_data.implementation_rejected_remarks": { $exists: true } });

                if (!machineLastDataForKeyexistsOrNot[0].checkSheet_data.implementation_rejected_remarks) {
                    const updateImplementationData = await Machine.updateOne({ machine_code: selected_machine_data.machine_code },
                        {
                            $set: {
                                "checkSheet_data.$[outer].implementation_rejected_remarks": creationMonthKeyArray,
                                "checkSheet_data.$[outer].implementation_approved_MTD_TL_date": creationMonthKeyArray,
                                "checkSheet_data.$[outer].implementation_approved_MTD_HOS_date": creationMonthKeyArray,
                                "checkSheet_data.$[outer].implementation_approved_by_MTD_HOS": creationMonthKeyArray,
                                "checkSheet_data.$[outer].implementation_approved_by_MTD_TL": creationMonthKeyArray,
                            }
                        },
                        {
                            arrayFilters: [{ 'outer.current_year': selected_machine_data.checkSheet_data.current_year }],
                        })

                }

                selected_machine_data.checkSheet_data.implemetation_mtd_tl_approval_status[monthForCompareSystemMonth][(selected_machine_data.checkSheet_data.implemetation_mtd_tl_approval_status[monthForCompareSystemMonth]).length - 1] = "Rejected"
                const MTDTLApprovalStatusUpdateOfImplementation = await Machine.updateOne({ machine_code: selected_machine_data.machine_code },
                    {
                        $set:
                        {
                            [keyOfImplemetation_mtd_tl_approval_status]: selected_machine_data.checkSheet_data.implemetation_mtd_tl_approval_status[monthForCompareSystemMonth],
                        },
                        $push: {
                            [keyOfImplementation_approved_MTD_TL_date]: implementation_approved_MTD_TL_date,
                            [keyOfImplementation_rejected_remarks]: rejected_remarks,
                            [keyOfImplementation_approved_by_MTD_TL]: "",
                            [keyOfImplementation_approved_MTD_TL_date]: "",
                            [keyOfImplementation_approved_by_MTD_HOS]: "",
                            [keyOfImplementation_approved_MTD_HOS_date]: ""
                        }
                    },
                    {
                        arrayFilters: [{ 'outer.current_year': selected_machine_data.checkSheet_data.current_year }],
                    })
                const findAssignMTDHOSNameOfImplementation = await User.findOne({ email: selected_machine_data.checkSheet_data.implementation_assign_MTD_HOS[monthForCompareSystemMonth][(selected_machine_data.checkSheet_data.implementation_assign_MTD_HOS[monthForCompareSystemMonth]).length - 1] })
                let greetingNamesForAll = "All"
                sendApprovalOfImplementation(findAssignMTDHOSNameOfImplementation,
                    selected_machine_data.checkSheet_data.implemetation_completed_tm_no[monthForCompareSystemMonth][(selected_machine_data.checkSheet_data.implemetation_completed_tm_no[monthForCompareSystemMonth]).length - 1],
                    selected_machine_data.checkSheet_data.implemetation_completed_tm_name[monthForCompareSystemMonth][(selected_machine_data.checkSheet_data.implemetation_completed_tm_name[monthForCompareSystemMonth]).length - 1],
                    selected_machine_data.machine_code,
                    selected_machine_data.machine_name,
                    selected_machine_data.checkSheet_data.checksheet_status,
                    selected_machine_data.checkSheet_data.implementation_assign_MTD_HOS[monthForCompareSystemMonth][(selected_machine_data.checkSheet_data.implementation_assign_MTD_HOS[monthForCompareSystemMonth]).length - 1],
                    undefined,
                    selected_machine_data.checkSheet_data.implemetation_prd_tl_approval_status[monthForCompareSystemMonth][(selected_machine_data.checkSheet_data.implemetation_prd_tl_approval_status[monthForCompareSystemMonth]).length - 1],
                    mtd_tl_approval_status,
                    undefined, rejected_remarks)
            } else if (selected_machine_data.checkSheet_data.implemetation_prd_tl_approval_status[monthForCompareSystemMonth][(selected_machine_data.checkSheet_data.implemetation_prd_tl_approval_status[monthForCompareSystemMonth]).length - 1] === "Accepted" &&
                selected_machine_data.checkSheet_data.implemetation_mtd_tl_approval_status[monthForCompareSystemMonth][(selected_machine_data.checkSheet_data.implemetation_mtd_tl_approval_status[monthForCompareSystemMonth]).length - 1] === "Accepted" &&
                selected_machine_data.checkSheet_data.implemetation_mtd_hos_approval_status[monthForCompareSystemMonth][(selected_machine_data.checkSheet_data.implemetation_mtd_hos_approval_status[monthForCompareSystemMonth]).length - 1] === "Pending") {

                let machineLastDataForKeyexistsOrNot = await Machine.aggregate([
                    {
                        $match: {
                            machine_code: selected_machine_data.machine_code
                        }
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
                            checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] }
                        }
                    }
                ])

                // const keyExistsCheck = await Machine.findOne({ machine_code: selected_machine_data.machine_code, "checkSheet_data.implementation_rejected_remarks": { $exists: true } });

                if (!machineLastDataForKeyexistsOrNot[0].checkSheet_data.implementation_rejected_remarks) {
                    const updateImplementationData = await Machine.updateOne({ machine_code: selected_machine_data.machine_code },
                        {
                            $set: { "checkSheet_data.$[outer].implementation_rejected_remarks": creationMonthKeyArray }
                        },
                        {
                            arrayFilters: [{ 'outer.current_year': selected_machine_data.checkSheet_data.current_year }],
                        })

                }
                selected_machine_data.checkSheet_data.implemetation_mtd_hos_approval_status[monthForCompareSystemMonth][(selected_machine_data.checkSheet_data.implemetation_mtd_hos_approval_status[monthForCompareSystemMonth]).length - 1] = "Rejected"
                const MTDHOSApprovalStatusUpdateOfImplementation = await Machine.updateOne({ machine_code: selected_machine_data.machine_code },
                    {
                        $set:
                        {
                            [keyOfImplemetation_mtd_hos_approval_status]: selected_machine_data.checkSheet_data.implemetation_mtd_hos_approval_status[monthForCompareSystemMonth],
                        },
                        $push: {
                            [keyOfImplementation_approved_MTD_HOS_date]: implementation_approved_MTD_HOS_date,
                            [keyOfImplementation_rejected_remarks]: rejected_remarks,
                            [keyOfImplementation_approved_by_MTD_HOS]: "",
                        }
                    },
                    {
                        arrayFilters: [{ 'outer.current_year': selected_machine_data.checkSheet_data.current_year }],
                    })
            }
        }

        return res.status(201).json("Checksheet approval done!!!");


    } catch (error) {
        console.log(error)
        console.log("Data not valid or received !!!");
    }
})


//update selcted machine checksheet data row 
router.post('/updateSelectedMachineCheckSheetTableRowDataForStartingMonth', async (req, res) => {
    try {
        const { oldRow, machineId, yearOfCheckSheet } = req.body
        let { rowData } = req.body
        // console.log(rowData)

        let planningTableAnimationArray2 =
        {
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
        }


        // let x =[
        //     {
        //         Apr : [1,true,"abc",0],
        //         May : [0]
        //     }
        // ]
        // console.log(x)
        const monthKeyArray = ['Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']
        // console.log(planningTableAnimationArray2);
        let someArray = ["0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0"];
        // const cycle = [
        //     {
        //         label: "1/1M",
        //         value: 1,
        //     },
        //     {
        //         label: "1/2M",
        //         value: 2,
        //     },
        //     {
        //         label: "1/3M",
        //         value: 3,
        //     },
        //     {
        //         label: "1/4M",
        //         value: 4,
        //     },
        //     {
        //         label: "1/6M",
        //         value: 6,
        //     },
        //     {
        //         label: "1/Y",
        //         value: 12,
        //     },
        // ];

        // let cycleValue = await cycle.map((index) => {
        //     return index.label === oldRow.label ? index.value : 1
        // })

        let cycleValue = (oldRow.cycle === "1/1M" ? 1 :
            oldRow.cycle === "1/2M" ? 2 :
                oldRow.cycle === "1/3M" ? 3 :
                    oldRow.cycle === "1/4M" ? 4 :
                        oldRow.cycle === "1/6M" ? 6 :
                            12)

        let finalArray = [];
        let Cycle = cycleValue

        // console.log(oldRow.cycle, "=>", Cycle)

        let startMonth = rowData.start_month
        // console.log(someArray.length);s
        let arrayLength = someArray.length;
        // for (let i = 0; i < arrayLength; i++) {
        //     // console.log(i)
        //     // console.log(arrayLength);

        //     someArray.splice(startMonth, 1, "1");
        //     finalArray.push(someArray[i]);
        //     // console.log("_________", someArray[i]);

        //     // console.log(finalArray)
        //     startMonth = startMonth + Cycle
        // }

        let getKeyForUpdateValue

        for (let i = 0; (i < (12 / Cycle)) && (rowData.start_month < 12); i++) {
            let monthOfkey = monthKeyArray[rowData.start_month]


            planningTableAnimationArray2[monthOfkey][0] = "1"

            rowData.start_month = parseInt(rowData.start_month) + Cycle
        }
        // console.log(planningTableAnimationArray2)

        const updateChecksheetRow = await Machine.updateOne({ machine_code: machineId },
            {
                $set: {
                    "checkSheet_data.$[outer].checkSheet.$[inner].start_month": startMonth,
                    "checkSheet_data.$[outer].checkSheet.$[inner].planningTableAnimationArray2": planningTableAnimationArray2,
                },

            },
            {
                arrayFilters: [{ 'outer.current_year': yearOfCheckSheet }, { 'inner.tableRowId': rowData.tableRowId }],
            }
        )
        // console.log(updateChecksheetRow)
        res.status(201).json({ message: 'TableRow updated successfully' })
    } catch (error) {
        res.status(409).json("TableRow already exists!!!");
        console.log(error)
    }
})

//add data of implementation when operator worked on machine PM
router.post('/postImplementationWorkedData', upload1.single('photoUpload'), async (req, res) => {
    try {
        const { workedOnPM,
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
            cost } = req.body

        let arrayForPMData = []
        arrayForPMData.push(1, workedOnPM, remarksOfImplementation)

        let arrayForDonePreviousMonthPMPMData = []
        arrayForDonePreviousMonthPMPMData.push(2, workedOnPM, remarksOfImplementation)

        let PMStatusArray =
        {
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
        }

        let PMDelayRemarksMonthArray =
        {
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
        }

        let plannedPMCount = 0;
        let completedPMCount = 0;
        let totalCarriedPMCount = 0;
        let completedCarriedPMCount = 0;

        let perticularMachine = await Machine.aggregate([
            {
                $match: {
                    machine_code: machineId
                }
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
                    checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] }
                }
            }
        ])

        // machineLastData = await Machine.populate(machineLastData, { path: "line_names", populate: { path: "cell_names", model: "Cells" } })

        // const perticularMachine = await Machine.findOne({ machine_code: machineId })

        PMStatusArray[monthForCompareSystemMonth] = "Ongoing"

        // console.log(PMworkedTMNameArray)

        let updateStatus;
        let keyOfCompletedMonthPM = `checkSheet_data.$[outer].PMStatus.${monthForCompareSystemMonth}`
        let keyOfCarriedCompletedMonthPM = `checkSheet_data.$[outer].PMStatus.${previousMonth}`
        let keyOfPreviousMonth = `checkSheet_data.$[outer].checkSheet.$[inner].planningTableAnimationArray2.${previousMonth}`

        let arrayForUpdatePreviousMonthDelayPMData = []
        arrayForUpdatePreviousMonthDelayPMData.push(1, "delay")

        let keyOfMonth = `checkSheet_data.$[outer].checkSheet.$[inner].planningTableAnimationArray2.${monthForCompareSystemMonth}`
        let keyOfPMOkImage = `checkSheet_data.$[outer].checkSheet.$[inner].PMOkImage.${monthForCompareSystemMonth}`

        //for abnormality
        let keyOfAbnormalityRemarks = `checkSheet_data.$[outer].checkSheet.$[inner].abnormalityDetails.${monthForCompareSystemMonth}.abnormalityRemarks`
        let keyOfAbnormalityStatus = `checkSheet_data.$[outer].checkSheet.$[inner].abnormalityDetails.${monthForCompareSystemMonth}.abnormalityStatus`
        let keyOfTargetdate = `checkSheet_data.$[outer].checkSheet.$[inner].abnormalityDetails.${monthForCompareSystemMonth}.targetDate`
        let keyOfAbnormalityImage = `checkSheet_data.$[outer].checkSheet.$[inner].abnormalityDetails.${monthForCompareSystemMonth}.PMuploadedImage`

        //for spare parts
        let keyOfSpareParts = `checkSheet_data.$[outer].checkSheet.$[inner].spareDetails.${monthForCompareSystemMonth}.spareParts`
        let keyOfPartName = `checkSheet_data.$[outer].checkSheet.$[inner].spareDetails.${monthForCompareSystemMonth}.partName`
        let keyOfPartNo = `checkSheet_data.$[outer].checkSheet.$[inner].spareDetails.${monthForCompareSystemMonth}.partNo`
        let keyOfCost = `checkSheet_data.$[outer].checkSheet.$[inner].spareDetails.${monthForCompareSystemMonth}.cost`

        // console.log(perticularMachine)
        let addPmData
        if (workedOnPM === "Yes") {
            // const checkField = await Machine.findOne({ machine_code: machineId, "checkSheet.tableRowId": tableRowId, "checkSheet.abnormalityDetails": { $exists: true }, "checkSheet.spareDetails": { $exists: true } })
            // // console.log(checkField)
            // let result
            // if (checkField) {
            //     result = await Machine.updateOne({ machine_code: machineId }, { $unset: { "checkSheet.$[].abnormalityDetails": "", "checkSheet.$[].spareDetails": "" } })
            // }
            let checkCarriedPM = 0

            //for done with delay
            perticularMachine[0].checkSheet_data.checkSheet.map((key) => {
                //check if the any previous moth data carried in current month or not 

                if (key.planningTableAnimationArray2[monthForCompareSystemMonth][0] == "2" && key.tableRowId == tableRowId) {
                    checkCarriedPM = 1
                }

            })
            if (checkCarriedPM === 1) {
                addPmData = await Machine.updateOne({ machine_code: machineId },
                    {
                        $set: {
                            // [keyOfMonth]: {$each:[workedOnPM, remarksOfImplementation]}
                            [keyOfMonth]: arrayForDonePreviousMonthPMPMData,
                            [keyOfPreviousMonth]: arrayForUpdatePreviousMonthDelayPMData,
                        }
                    },
                    {
                        arrayFilters: [{ 'outer.current_year': yearOfCheckSheet }, { 'inner.tableRowId': tableRowId }],
                    }
                )
            } else {
                if (req.file === undefined) {
                    addPmData = await Machine.updateOne({ machine_code: machineId },
                        {
                            $set: {
                                // [keyOfMonth]: {$each:[workedOnPM, remarksOfImplementation]}
                                [keyOfMonth]: arrayForPMData,
                            }
                        },
                        {
                            arrayFilters: [{ 'outer.current_year': yearOfCheckSheet }, { 'inner.tableRowId': tableRowId }],
                        }
                    )
                } else {
                    let PMuploadedImage = req.file.filename
                    addPmData = await Machine.updateOne({ machine_code: machineId },
                        {
                            $set: {
                                // [keyOfMonth]: {$each:[workedOnPM, remarksOfImplementation]}
                                [keyOfMonth]: arrayForPMData,
                                [keyOfPMOkImage]: PMuploadedImage
                            }
                        },
                        {
                            arrayFilters: [{ 'outer.current_year': yearOfCheckSheet }, { 'inner.tableRowId': tableRowId }],
                        }
                    )
                    // console.log(addPmData)
                }

            }
            // console.log(result)

        }
        else if (workedOnPM === "Rectify") {

            if (req.file === undefined) {
                let checkCarriedPM = 0

                //for done with delay
                perticularMachine[0].checkSheet_data.checkSheet.map((key) => {
                    //check if the any previous moth data carried in current month or not 
                    if (key.planningTableAnimationArray2[monthForCompareSystemMonth][0] == "2" && key.tableRowId == tableRowId) {
                        checkCarriedPM = 1
                    }

                })
                if (checkCarriedPM === 1) {
                    addPmData = await Machine.updateOne({ machine_code: machineId },
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
                                [keyOfCost]: cost
                            }
                        },
                        {
                            arrayFilters: [{ 'outer.current_year': yearOfCheckSheet }, { 'inner.tableRowId': tableRowId }],
                        }
                    )

                } else {
                    addPmData = await Machine.updateOne({ machine_code: machineId },
                        {
                            $set: {
                                // [keyOfMonth]: {$each:[workedOnPM, remarksOfImplementation]},
                                [keyOfMonth]: arrayForPMData,
                                [keyOfAbnormalityRemarks]: abnormalityRemarks,
                                [keyOfAbnormalityStatus]: abnormalityStatus,
                                [keyOfSpareParts]: spareParts,
                                [keyOfPartName]: partName,
                                [keyOfPartNo]: partNo,
                                [keyOfCost]: cost
                            }
                        },
                        {
                            arrayFilters: [{ 'outer.current_year': yearOfCheckSheet }, { 'inner.tableRowId': tableRowId }],
                        }
                    )

                }
            } else {
                let PMuploadedImage = req.file.filename

                let checkCarriedPM = 0

                //for done with delay
                perticularMachine[0].checkSheet_data.checkSheet.map((key) => {
                    //check if the any previous moth data carried in current month or not 
                    if (key.planningTableAnimationArray2[monthForCompareSystemMonth][0] == "2" && key.tableRowId == tableRowId) {
                        checkCarriedPM = 1
                    }

                })
                if (checkCarriedPM === 1) {
                    addPmData = await Machine.updateOne({ machine_code: machineId },
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
                                [keyOfCost]: cost
                            }
                        },
                        {
                            arrayFilters: [{ 'outer.current_year': yearOfCheckSheet }, { 'inner.tableRowId': tableRowId }],
                        }
                    )

                } else {
                    addPmData = await Machine.updateOne({ machine_code: machineId },
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
                                [keyOfCost]: cost
                            }
                        },
                        {
                            arrayFilters: [{ 'outer.current_year': yearOfCheckSheet }, { 'inner.tableRowId': tableRowId }],
                        }
                    )

                }
            }



        }
        else {
            if (req.file === undefined) {
                let checkCarriedPM = 0

                //for done with delay
                perticularMachine[0].checkSheet_data.checkSheet.map((key) => {
                    //check if the any previous moth data carried in current month or not 
                    if (key.planningTableAnimationArray2[monthForCompareSystemMonth][0] == "2" && key.tableRowId == tableRowId) {
                        checkCarriedPM = 1
                    }

                })

                if (checkCarriedPM === 1) {
                    addPmData = await Machine.updateOne({ machine_code: machineId },
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
                                [keyOfCost]: cost

                            }
                        },
                        {
                            arrayFilters: [{ 'outer.current_year': yearOfCheckSheet }, { 'inner.tableRowId': tableRowId }],
                        }
                    )
                } else {
                    addPmData = await Machine.updateOne({ machine_code: machineId },
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
                                [keyOfCost]: cost

                            }
                        },
                        {
                            arrayFilters: [{ 'outer.current_year': yearOfCheckSheet }, { 'inner.tableRowId': tableRowId }],
                        }
                    )
                }

            } else {
                let PMuploadedImage = req.file.filename
                let checkCarriedPM = 0

                //for done with delay
                perticularMachine[0].checkSheet_data.checkSheet.map((key) => {
                    //check if the any previous moth data carried in current month or not 
                    if (key.planningTableAnimationArray2[monthForCompareSystemMonth][0] == "2" && key.tableRowId == tableRowId) {
                        checkCarriedPM = 1
                    }

                })
                if (checkCarriedPM === 1) {
                    addPmData = await Machine.updateOne({ machine_code: machineId },
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
                                [keyOfCost]: cost
                            }
                        },
                        {
                            arrayFilters: [{ 'outer.current_year': yearOfCheckSheet }, { 'inner.tableRowId': tableRowId }],
                        }
                    )

                } else {
                    addPmData = await Machine.updateOne({ machine_code: machineId },
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
                                [keyOfCost]: cost
                            }
                        },
                        {
                            arrayFilters: [{ 'outer.current_year': yearOfCheckSheet }, { 'inner.tableRowId': tableRowId }],
                        })
                }

            }

        }
        //     // console.log(addPmData)
        // const machineDataAfterSaveAllData = await Machine.findOne({ machine_code: machineId })
        let machineDataAfterSaveAllData = await Machine.aggregate([
            {
                $match: {
                    machine_code: machineId
                }
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
                    checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] }
                }
            }
        ])

        machineDataAfterSaveAllData[0].checkSheet_data.checkSheet.map((key) => {
            //for completed status
            if (key.planningTableAnimationArray2[monthForCompareSystemMonth][0] === "1") {
                plannedPMCount = plannedPMCount + 1
            }
            if (key.planningTableAnimationArray2[monthForCompareSystemMonth][0] === "2") {
                totalCarriedPMCount = totalCarriedPMCount + 1
            }
            if (key.planningTableAnimationArray2[monthForCompareSystemMonth].length >= 2 && key.planningTableAnimationArray2[monthForCompareSystemMonth][0] === "1") {
                completedPMCount = completedPMCount + 1
            }
            //for done with delay status

            if (key.planningTableAnimationArray2[monthForCompareSystemMonth].length >= 2 && key.planningTableAnimationArray2[monthForCompareSystemMonth][0] === "2") {
                completedCarriedPMCount = completedCarriedPMCount + 1
            }

            // console.log(key.planningTableAnimationArray2[monthForCompareSystemMonth])
            // console.log(count)
        })
        // console.log(plannedPMCount)
        // console.log(completedPMCount)

        if (completedPMCount === 1) {
            //ongoing status
            updateStatus = await Machine.updateOne(
                { machine_code: machineId },
                {
                    $set: {
                        [keyOfCompletedMonthPM]: "Ongoing"
                    }
                },
                {
                    arrayFilters: [{ 'outer.current_year': yearOfCheckSheet }],
                })
        }

        //for completed status
        if (plannedPMCount) {
            if (plannedPMCount === completedPMCount) {
                updateStatus = await Machine.updateOne(
                    { machine_code: machineId },
                    {
                        $set: {
                            [keyOfCompletedMonthPM]: "Completed"
                        }
                    },
                    {
                        arrayFilters: [{ 'outer.current_year': yearOfCheckSheet }],
                    }
                )
            }
        }


        //for delay remarks 
        if (totalCarriedPMCount) {
            updateStatus = await Machine.updateOne(
                { machine_code: machineId },
                {
                    $set: {
                        PMDelayRemark: PMDelayRemarksMonthArray,
                    }
                },
                {
                    arrayFilters: [{ 'outer.current_year': yearOfCheckSheet }],
                }
            )
        }

        //for done with delay status
        if (totalCarriedPMCount) {
            if (totalCarriedPMCount === completedCarriedPMCount) {
                updateStatus = await Machine.updateOne(
                    { machine_code: machineId, "checkSheet.tableRowId": tableRowId },
                    {
                        $set: {
                            [keyOfCarriedCompletedMonthPM]: "Done with delay",
                        }
                    },
                    {
                        arrayFilters: [{ 'outer.current_year': yearOfCheckSheet }],
                    }
                )
            }
            if (plannedPMCount) {
                if (!completedPMCount) {
                    updateStatus = await Machine.updateOne({ machine_code: machineId },
                        {
                            $set: {
                                [keyOfCompletedMonthPM]: "Current Plan",
                            }
                        },
                        {
                            arrayFilters: [{ 'outer.current_year': yearOfCheckSheet }],
                        })
                }

            } else {
                updateStatus = await Machine.updateOne({ machine_code: machineId },
                    {
                        $set: {
                            [keyOfCompletedMonthPM]: "",
                        }
                    },
                    {
                        arrayFilters: [{ 'outer.current_year': yearOfCheckSheet }],
                    })
            }
        }




        if (addPmData) {
            return res.status(201).json("Checksheet worked data posted!!!");
        }
        else {
            return res.status(400).json("Checksheet worked data not posted!!!");
        }
    } catch (error) {
        console.log(error)
        console.log("Data not valid or received !!!");
    }
})

router.post('/savedWorkedPMData', async (req, res) => {
    try {
        const { totalPMTime, yearOfCheckSheet, delayRemarks, PMworkedTMNo, PMworkedTMName, selectedSupportedTM, finishedPMTime, machine_code, monthForCompareSystemMonth } = req.body
        // console.log(totalPMTime,yearOfCheckSheet, delayRemarks,PMworkedTMNo, PMworkedTMName, selectedSupportedTM, finishedPMTime, machine_code, monthForCompareSystemMonth)

        let PMworkedTMNameArray =
        {
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
        }
        let keyOfMonth = `checkSheet_data.$[outer].PMworkedTMName.${monthForCompareSystemMonth}`

        let getSelectedMachineChecksheet = await Machine.aggregate([
            {
                $match: { machine_code: machine_code, "checkSheet_data.current_year": yearOfCheckSheet }
            },
            { $unwind: '$checkSheet_data' },
            {
                $match: { "checkSheet_data.current_year": yearOfCheckSheet }
            }
        ]);
        let workedOperator = {
            tm_name: PMworkedTMName,
            tm_no: PMworkedTMNo
        }
        selectedSupportedTM.push(workedOperator)
        // console.log(selectedSupportedTM)

        let keyOfTotalWorkedPMTime = `checkSheet_data.$[outer].totalPMTime.${monthForCompareSystemMonth}.totalWorkedPMTime`
        let keyOfSupportingTMData = `checkSheet_data.$[outer].totalPMTime.${monthForCompareSystemMonth}.supportingTMData`
        // let keyOfSupportingTMDataTm_name = `checkSheet_data.$[outer].totalPMTime.${monthForCompareSystemMonth}.supportingTMData.tm_name`
        // let keyOfSupportingTMDataTm_no = `checkSheet_data.$[outer].totalPMTime.${monthForCompareSystemMonth}.supportingTMData.tm_no`
        let keyOfTotalWorkedPMTimeIncrement = `checkSheet_data.$.totalPMTime.${monthForCompareSystemMonth}.totalWorkedPMTime`

        let keyOfFindSupportingTM = `checkSheet_data.totalPMTime.${monthForCompareSystemMonth}.supportingTMData.tm_no`
        let keyOfSupportingTMDataWorkedIncrementTime = `checkSheet_data.$[outer].totalPMTime.${monthForCompareSystemMonth}.supportingTMData.$[inner].workedTime`

        let keyOfDelayRemarksMonthPM = `checkSheet_data.$[outer].PMDelayRemark.${monthForCompareSystemMonth}`
        PMworkedTMNameArray[monthForCompareSystemMonth].push(PMworkedTMName)

        // console.log(getSelectedMachineChecksheet[0].checkSheet_data)
        let updateTotalTimeAndWorkedAndSupportingOperator, incrementTotalTime;
        if (getSelectedMachineChecksheet[0].checkSheet_data.totalPMTime?.[monthForCompareSystemMonth].totalWorkedPMTime != undefined) {
            incrementTotalTime = await Machine.updateOne(
                { machine_code: machine_code, "checkSheet_data.current_year": yearOfCheckSheet },
                {
                    $inc: { [keyOfTotalWorkedPMTimeIncrement]: totalPMTime }

                }
            )
            for (let i = 0; i < selectedSupportedTM.length; i++) {
                let isOperatorOrNot = getSelectedMachineChecksheet[0].checkSheet_data.totalPMTime[monthForCompareSystemMonth].supportingTMData.some(
                    value => value.tm_no === selectedSupportedTM[i].tm_no)
                if (isOperatorOrNot) {
                    updateTotalTimeAndWorkedAndSupportingOperator = await Machine.updateOne(
                        { machine_code: machine_code, "checkSheet_data.current_year": yearOfCheckSheet, [keyOfFindSupportingTM]: selectedSupportedTM[i].tm_no },
                        {
                            // $inc: { [keyOfTotalWorkedPMTimeIncrement]: totalPMTime },
                            $inc: { [keyOfSupportingTMDataWorkedIncrementTime]: totalPMTime },

                        },
                        {
                            arrayFilters: [{ 'outer.current_year': yearOfCheckSheet }, { 'inner.tm_no': selectedSupportedTM[i].tm_no }],
                        }
                    )
                } else {
                    updateTotalTimeAndWorkedAndSupportingOperator = await Machine.updateOne({ machine_code: machine_code },
                        {
                            $push: {
                                [keyOfSupportingTMData]: {
                                    tm_name: selectedSupportedTM[i].tm_name,
                                    tm_no: selectedSupportedTM[i].tm_no,
                                    workedTime: totalPMTime
                                }
                            }
                        },
                        {
                            arrayFilters: [{ 'outer.current_year': yearOfCheckSheet }],
                        }
                    )
                }
            }

        } else {
            for (let i = 0; i < selectedSupportedTM.length; i++) {
                updateTotalTimeAndWorkedAndSupportingOperator = await Machine.updateOne({ machine_code: machine_code },
                    {
                        $set: {
                            [keyOfTotalWorkedPMTime]: totalPMTime,
                        },
                        $push: {
                            [keyOfSupportingTMData]: {
                                tm_name: selectedSupportedTM[i].tm_name,
                                tm_no: selectedSupportedTM[i].tm_no,
                                workedTime: totalPMTime
                            }
                        }
                    },
                    {
                        arrayFilters: [{ 'outer.current_year': yearOfCheckSheet }],
                    }
                )
            }
            // console.log(updateTotalTimeAndWorkedAndSupportingOperator)
        }

        let updatePMworkedTMName
        if (getSelectedMachineChecksheet[0].checkSheet_data.PMworkedTMName != undefined) {
            updatePMworkedTMName = await Machine.updateOne({
                machine_code: machine_code
            },
                {
                    $set: {
                        [keyOfDelayRemarksMonthPM]: delayRemarks
                    },
                    $push: {
                        [keyOfMonth]: PMworkedTMName,
                    }
                },
                {
                    arrayFilters: [{ 'outer.current_year': yearOfCheckSheet }],
                }
            )
        } else {
            updatePMworkedTMName = await Machine.updateOne({
                machine_code: machine_code
            },
                {
                    $set: {
                        PMworkedTMName: PMworkedTMNameArray,
                    }
                },
                {
                    arrayFilters: [{ 'outer.current_year': yearOfCheckSheet }],
                }
            )
        }

        if (updateTotalTimeAndWorkedAndSupportingOperator || incrementTotalTime) {
            return res.status(201).json("PM worked data save sucessfully...!!!");
        }
        else {
            return res.status(400).json("PM worked data not save...!!!");
        }

    } catch (error) {
        console.log(error)
        console.log("User id not received!!!");
    }
})



router.post('/deleteCheckSheet', authenticate, async (req, res) => {
    try {
        const { selectedRow } = req.body;
        if (!selectedRow.machine_code) {
            return res.status(422).json({ error: "Machine doesn't exist" })
        } else {

            let removeFields = await Machine.updateOne(
                { machine_code: selectedRow.machine_code },
                {
                    $unset: {
                        "checkSheet_data.$[outer].checkSheet.$[].start_month": "",
                        "checkSheet_data.$[outer].checkSheet.$[].planningTableAnimationArray2": "",
                        "checkSheet_data.$[outer].checkSheet.$[].abnormalityDetails": "",
                        "checkSheet_data.$[outer].checkSheet.$[].spareDetails": "",
                    }
                },
                {
                    arrayFilters: [{ 'outer.current_year': selectedRow.checkSheet_data.current_year }],
                }
            )


            let backupNewMachineCode = `R${selectedRow.machine_code}`

            const findMachine = await BackupMachineData.findOne({ machine_code: backupNewMachineCode })

            if (findMachine) {
                const updateBackupPreparationMachineData = await BackupMachineData.updateOne({
                    machine_code: backupNewMachineCode
                },
                    {
                        $set: {
                            checkSheet_data: {
                                checkSheet: selectedRow.checkSheet_data.checkSheet
                            }
                        }
                    },
                )
            } else {
                const backupPreparationMachineData = await new BackupMachineData({
                    machine_code: backupNewMachineCode,
                    machine_name: selectedRow.machine_name,
                    line_names: selectedRow.line_names,
                    checkSheet_data: { checkSheet: selectedRow.checkSheet_data.checkSheet }
                })

                const result = await backupPreparationMachineData.save();

            }

            const deleteChecksheet = await Machine.updateOne({ machine_code: selectedRow.machine_code },
                {
                    $pull: {
                        checkSheet_data: {
                            current_year: selectedRow.checkSheet_data.current_year
                        }
                    }
                },
                // {
                //     arrayFilters: [{ 'outer.current_year': selectedRow.checkSheet_data.current_year }],
                // }
            );
            // console.log(result);
            res.status(201).json({ message: 'Removed Checksheet !!!' })
        }

    } catch (error) {
        console.log(error)
        console.log("Data not valid or received !!!");
    }
})

router.post('/PMCarryOnToNextMonth', async (req, res) => {
    try {
        const { machine_code, monthForCompareSystemMonth, tableRowId, previousMonth, cycleOfPerticularRow, skipCountForStatusUpdate, previousToPreviousMonth, yearOfCheckSheet } = req.body
        // console.log(machine_code, monthForCompareSystemMonth, tableRowId, previousMonth, cycleOfPerticularRow, skipCountForStatusUpdate, previousToPreviousMonth, yearOfCheckSheet)

        let CarriedPMStatusArray =
        {
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
        }

        let keyOfMonth = `checkSheet_data.$[outer].checkSheet.$[inner].planningTableAnimationArray2.${monthForCompareSystemMonth}`

        let keyOfPreviousMonth = `checkSheet_data.$[outer].checkSheet.$[inner].planningTableAnimationArray2.${previousMonth}`
        let keyOfCarriedSkipMonthPM = `checkSheet_data.$[outer].PMStatus.${previousMonth}`

        let keyOfPreviousToPreviousMonthForSkipPM = `checkSheet_data.$[outer].checkSheet.$[inner].planningTableAnimationArray2.${previousToPreviousMonth}`
        let keyOfCarriedSkipMonthPMForPreviousToPrevious = `checkSheet_data.$[outer].PMStatus.${previousToPreviousMonth}`

        let carryData
        let updatePreviousMonth, updateCarriedPMStatus
        let arrayForPMData = []
        arrayForPMData.push(1, "dummy")

        let arrayForPreviousMonthSkipPMData = []
        arrayForPreviousMonthSkipPMData.push(2, "skip_previous")

        let arrayForSkipPerMonthPMData = []
        arrayForSkipPerMonthPMData.push(1, "skip")

        updatePreviousMonth = await Machine.updateOne({ machine_code: machine_code },
            {
                $set: {
                    [keyOfPreviousMonth]: arrayForPMData
                }
            },
            {
                arrayFilters: [{ 'outer.current_year': yearOfCheckSheet }, { 'inner.tableRowId': tableRowId }],
            }
        )

        carryData = await Machine.updateOne({ machine_code: machine_code },
            {
                $set: {
                    [keyOfMonth]: "2"
                }
            },
            {
                arrayFilters: [{ 'outer.current_year': yearOfCheckSheet }, { 'inner.tableRowId': tableRowId }],
            }
        )



        if (carryData || updatePreviousMonth) {
            return res.status(201).json("Checksheet data carried!!!");
        }
        else {
            return res.status(400).json("Checksheet data not carried!!!");
        }
    } catch (error) {
        console.log(error)
        console.log("Data not valid or received !!!");
    }
})


router.post('/postMachineIdToGetAllDetailsOfMachine', authenticate, async (req, res) => {
    try {
        let { machineID, selectedYear } = req.body
        // console.log(machineID)

        let currentYear =
            new Date().getMonth() <= 3
                ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
                : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
        let selectedYearOfCheckSheet =
            selectedYear === currentYear ?
                [
                    {
                        "checkSheet_data.current_year": selectedYear

                    },
                    {
                        "checkSheet_data": []

                    }
                ] : [
                    {
                        "checkSheet_data.current_year": selectedYear

                    },

                ]

        // const machineData = await Machine.findOne({ _id: machineID })

        let machineLastData
        machineLastData = await Machine.aggregate([
            {
                $match: {
                    machine_code: machineID,
                    $or: selectedYearOfCheckSheet

                }
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
                    checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] }
                }
            }
        ])

        machineLastData = await Machine.populate(machineLastData, { path: "line_names", populate: { path: "cell_names", model: "Cells" } })

        // console.log(machineLastData)

        res.send({ machineLastData: machineLastData[0] })
    } catch (error) {
        console.log(error)
        console.log("User id not received!!!");
    }
})

//get data from selected machine and respond it's checksheet preparation data
router.post('/postMachineToGetChacksheetPreparationData', authenticate, async (req, res) => {
    try {
        let { selectedMachine, copyPreparationDataToSelectedMachine, request } = req.body

        let getChecksheetPreparationDataOfSelectedMachine, copyPreparationData, newUpdatedPreparationDataOfSelectedmachine
        //2022-23
        let current_year =
            new Date().getMonth() <= 3
                ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
                : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

        if (request === "deleted") {
            getChecksheetPreparationDataOfSelectedMachine = await BackupMachineData.findOne({
                machine_code: selectedMachine
            })

            // console.log(getChecksheetPreparationDataOfSelectedMachine)

            copyPreparationData = await Machine.updateOne(
                {
                    machine_code: copyPreparationDataToSelectedMachine
                },
                {
                    $push: {
                        checkSheet_data: {
                            current_year: current_year,
                            checkSheet: getChecksheetPreparationDataOfSelectedMachine.checkSheet_data[0].checkSheet
                        }
                    }
                }

            )
            newUpdatedPreparationDataOfSelectedmachine = await Machine.findOne({ machine_code: copyPreparationDataToSelectedMachine })


        }
        else {
            getChecksheetPreparationDataOfSelectedMachine = await Machine.aggregate([
                {
                    $match: {
                        machine_code: selectedMachine
                    }
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
                        checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] }
                    }
                }
            ])

            // console.log(getChecksheetPreparationDataOfSelectedMachine)
            // getChecksheetPreparationDataOfSelectedMachine[0].checkSheet_data.current_year = current_year
            copyPreparationData = await Machine.updateOne({ machine_code: copyPreparationDataToSelectedMachine },
                {

                    $push: {
                        checkSheet_data: {
                            current_year: getChecksheetPreparationDataOfSelectedMachine[0].checkSheet_data.current_year = current_year,
                            checkSheet: getChecksheetPreparationDataOfSelectedMachine[0].checkSheet_data.checkSheet
                        }
                    }
                }
            )

            let removeFields = await Machine.updateOne(
                { machine_code: copyPreparationDataToSelectedMachine },
                {
                    $unset: {
                        "checkSheet_data.$[outer].checkSheet.$[].start_month": "",
                        "checkSheet_data.$[outer].checkSheet.$[].planningTableAnimationArray2": "",
                        "checkSheet_data.$[outer].checkSheet.$[].abnormalityDetails": "",
                        "checkSheet_data.$[outer].checkSheet.$[].spareDetails": "",
                        "checkSheet_data.$[outer].checkSheet.$[].PMOkImage": "",
                    },
                },
                {
                    arrayFilters: [{ 'outer.current_year': current_year }],
                }
            )

            let againCopy = await Machine.aggregate([
                {
                    $match: {
                        machine_code: copyPreparationDataToSelectedMachine
                    }
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
                        checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] }
                    }
                }
            ])
            copyPreparationData = await Machine.updateOne({ machine_code: copyPreparationDataToSelectedMachine },
                {

                    $set: {
                        "checkSheet_data.$[outer]": {
                            current_year: againCopy[0].checkSheet_data.current_year = current_year,
                            checkSheet: againCopy[0].checkSheet_data.checkSheet
                        }
                    }
                },
                {
                    arrayFilters: [{ 'outer.current_year': current_year }],
                }
            )
        }

        if (copyPreparationData || removeFields) {
            return res.status(201).json("Checksheet data carried!!!");
        }
        else {
            return res.status(400).json("Checksheet data not carried!!!");
        }
    } catch (error) {
        console.log(error)
        console.log("User id not received!!!");
    }
})



router.post('/postCellToGetLineListForReport', authenticate, async (req, res) => {
    try {
        let { cell } = req.body
        const lineInfo = await Line.find({ cell_names: cell }).populate({ path: "cell_names" })

        // console.log(lineInfo)

        res.json({ lineInfo })

    } catch (error) {
        console.log(error)
        console.log("User id not received!!!");
    }
})




router.post('/postLineToGetMachineListForReportDashboard', authenticate, async (req, res) => {
    try {
        let { line, selectedYear } = req.body
        // console.log(line, selectedYear)
        // let selectedYear = "2022-2023"
        let current_year =
            new Date().getMonth() <= 3
                ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
                : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

        let selectedYearOfCheckSheet =
            selectedYear === current_year ?
                [
                    {
                        "checkSheet_data.current_year": selectedYear
                    },
                    {
                        "checkSheet_data": []
                    }
                ] : [
                    {
                        "checkSheet_data.current_year": selectedYear
                    },
                ]
        const ObjectId = mongoose.Types.ObjectId;
        // console.log(ObjectId(line))
        machineInfo = await Machine.aggregate([
            {
                $match: {
                    line_names: ObjectId(line),
                    $or: selectedYearOfCheckSheet
                }
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
                    checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] }
                }
            }
        ])
        // const machineInfo = await Machine.find({ line_names: line }).populate({ path: "line_names", populate: { path: "cell_names", model: "Cells" } })
        machineInfo = await Machine.populate(machineInfo, { path: "line_names", populate: { path: "cell_names", model: "Cells" } })


        // console.log(machineInfo)

        res.json({ machineInfo })
    } catch (error) {
        console.log(error)
        console.log("User id not received!!!");
    }
})

router.post('/postSectionToGetAllDataForReport', authenticate, async (req, res) => {
    try {
        let { section, month, selectedYear } = req.body
        let loggedUserData = req.rootUser;

        let sectionSplit = section.split("-")
        const sectionInfo = await Section.findOne({ section_id: sectionSplit[0] })
        // console.log("____________", sectionInfo)

        let subSectionsData, subSectionIdArray = [], cellData, cellIdArray = [], lineData, lineIdArray = [], machineData, machineDataForChecksheet, subsectionSplitIdArrayForChecksheet = []

        if (sectionInfo.dashboardLevel === "Yes") {
            subSectionsData = await SubSection.find({ section_names: sectionInfo._id }).sort({ subSection_sequence: 1 })

        } else {
            loggedUserData.subSection_data.map((ids) => {
                let subsectionsId = ids.split("-")
                subsectionSplitIdArrayForChecksheet.push(subsectionsId[0])
            })
            subSectionsData = await SubSection.find({ subSection_id: { $in: subsectionSplitIdArrayForChecksheet } }).sort({ subSection_sequence: 1 })

        }



        for (let i = 0; i < subSectionsData.length; i++) {
            subSectionIdArray.push(subSectionsData[i]._id);
        }

        cellData = await Cell.find({ subSection_names: { $in: subSectionIdArray } }).sort({ cell_sequence: 1 });

        for (let i = 0; i < cellData.length; i++) {
            cellIdArray.push(cellData[i]._id);
        }

        lineData = await Line.find({ cell_names: { $in: cellIdArray } }).sort({ line_sequence: 1 });

        for (let i = 0; i < lineData.length; i++) {
            lineIdArray.push(lineData[i]._id);
        }

        let currentYear =
            new Date().getMonth() <= 3
                ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
                : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;



        let selectedYearOfCheckSheet =
            selectedYear === currentYear ?
                [
                    {
                        "checkSheet_data.current_year": selectedYear

                    },
                    {
                        "checkSheet_data": []

                    }
                ] : [
                    {
                        "checkSheet_data.current_year": selectedYear

                    },

                ]





        // console.log(selectedYear, month)

        let groupData
        let allData = []
        // y = "Nov"
        let x = `$checkSheet_data.PMStatus.${month}`

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

        let keyForPreviousMonth = `$checkSheet_data.PMStatus.${previousMonth}`


        for (let i = 0; i < lineData.length; i++) {


            groupData = await Machine.aggregate([
                {

                    $match: {
                        line_names: lineData[i]._id,
                        $or: selectedYearOfCheckSheet,

                    }
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
                        checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] }
                    }
                },
                {
                    $match: {
                        "checkSheet_data.PMStatus": { $ne: undefined },

                    }
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
                        machine: { $push: { machine_code: "$machine_code", machine_name: "$machine_name", machineStatus: x, previousStatus: keyForPreviousMonth } },
                        total_pmSchedule: {
                            $sum: {
                                $cond: [
                                    {
                                        $ne: [x, ""]
                                    },
                                    1, 0
                                ]
                            }
                        },
                        total_current: {
                            $sum: {
                                $cond: [
                                    {
                                        $eq: [x, "Current Plan"]
                                    },
                                    1, 0
                                ]
                            }
                        },
                        total_completed: {
                            $sum: {
                                $cond: [
                                    {
                                        $eq: [x, "Completed"]
                                    },
                                    1, 0
                                ]
                            }
                        },
                        total_Previous: {
                            $sum: {
                                $cond: [
                                    {
                                        $eq: [keyForPreviousMonth, "Ongoing"]
                                    },
                                    1, 0
                                ]
                            }
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
                        "total_pmSchedule": 1,
                        "total_current": 1,
                        "total_completed": 1,
                        machine: 1,
                        "total_Previous": 1,
                    }
                },

            ])

            if (groupData.length > 0) {
                for (let i = 0; i < groupData.length; i++) {
                    allData.push(groupData[i])
                }
            }
            // console.log(groupData)

        }

        let lineDataWithCounter = await Machine.populate(allData, { path: "line_names" })

        console.log("==============>", lineDataWithCounter, "<===================")


        res.json({ lineDataWithCounter })
    } catch (error) {
        console.log(error)
        console.log("User id not received!!!");
    }

})

let downloadFileName

router.post('/postFileName', authenticate, async (req, res) => {
    // const file = fs.createWriteStream(filePath);

    try {
        const { fileName } = req.body
        let filePath = path.join(__dirname, `../PMimages/${fileName}`)
        downloadFileName = filePath
        if (downloadFileName) {
            res.status(201).json({ message: "File name posted" });
        }
    } catch (error) {
        // console.log("2032", error)
        console.log("Filename not received");
    }
})
router.get('/downloadFile', authenticate, async (req, res) => {
    try {
        // console.log(downloadFileName)
        res.download(downloadFileName)
    } catch (error) {
        console.log("2032", error)
        console.log("Filename not received");
    }
})

router.post('/updateOpenPMData', authenticate, async (req, res) => {
    try {
        let { updateRow, oldRow } = req.body
        console.log(updateRow)
        let keyOfTargetdate = `checkSheet_data.$[outer].checkSheet.$[inner].abnormalityDetails.${updateRow.schedule_month}.targetDate`

        let keyOfRemarksOnClose = `checkSheet_data.$[outer].checkSheet.$[inner].abnormalityDetails.${updateRow.schedule_month}.remarksOnClose`
        let keyOfDoneDate = `checkSheet_data.$[outer].checkSheet.$[inner].abnormalityDetails.${updateRow.schedule_month}.doneDate`
        let keyOfDoneBy = `checkSheet_data.$[outer].checkSheet.$[inner].abnormalityDetails.${updateRow.schedule_month}.doneBy`

        let updateChecksheetPMData
        if (typeof (updateRow.targetDate) === "object" && updateRow.remarksOnClose != "" && updateRow.doneDate != "" && updateRow.doneBy != "") {
            updateChecksheetPMData = await Machine.updateOne({ machine_code: updateRow.machine_code },
                {
                    $set: {
                        [keyOfRemarksOnClose]: updateRow.remarksOnClose,
                        [keyOfDoneDate]: updateRow.doneDate,
                        [keyOfDoneBy]: updateRow.doneBy
                    }
                },
                {
                    arrayFilters: [{ 'outer.current_year': updateRow.yearOfCheckSheet }, { 'inner.tableRowId': updateRow.table_id }],
                }
            )
        } else {
            updateChecksheetPMData = await Machine.updateOne({ machine_code: updateRow.machine_code },
                {
                    $push: {
                        [keyOfTargetdate]: updateRow.targetDate
                    }
                },
                {
                    arrayFilters: [{ 'outer.current_year': updateRow.yearOfCheckSheet }, { 'inner.tableRowId': updateRow.table_id }],
                }
            )
        }

        if (updateChecksheetPMData) {
            return res.status(201).json("Checksheet data updated!!!");
        }
        else {
            return res.status(400).json("Checksheet data not updated!!!");
        }

        // res.json({ machineInfo })
    } catch (error) {
        console.log(error)
        console.log("User id not received!!!");
    }
})

router.post('/updateOpenPMToClose', authenticate, async (req, res) => {
    try {
        const { selectedRow } = req.body
        // console.log(selectedRow)

        let dateSplit = selectedRow.doneDate.split('-');
        let finalDateForDoneDate = `${dateSplit[2]}-${dateSplit[1]}`

        let keyOfAddDoneDateAfterClosePM = `checkSheet_data.$[outer].checkSheet.$[inner].planningTableAnimationArray2.${selectedRow.schedule_month}`
        let keyOfAbnormalityStatusOpenToClose = `checkSheet_data.$[outer].checkSheet.$[inner].abnormalityDetails.${selectedRow.schedule_month}.abnormalityStatus`


        const updatePM = await Machine.updateOne({ machine_code: selectedRow.machine_code },
            {
                $set: {
                    [keyOfAbnormalityStatusOpenToClose]: "Close"
                },
                $push: {
                    [keyOfAddDoneDateAfterClosePM]: finalDateForDoneDate
                }
            },
            {
                arrayFilters: [{ 'outer.current_year': selectedRow.yearOfCheckSheet }, { 'inner.tableRowId': selectedRow.table_id }],
            }
        )

        if (updatePM) {
            return res.status(201).json("Checksheet status updated!!!");
        }
        else {
            return res.status(400).json("Checksheet status not updated!!!");
        }

    } catch (error) {
        res.status(409).json("Section already exists!!!");
    }
})

router.post('/postSectionAndMonthToGetAllDataForReport', authenticate, async (req, res) => {
    try {
        let { section, currentMonth, selectedYear } = req.body
        let loggedUserData = req.rootUser;

        let currentYear =
            new Date().getMonth() <= 3
                ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
                : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

        let keyForCurrentMonthPMStatus = `checkSheet_data.PMStatus.${currentMonth}`
        let keyForPreviousMonthPMStatus = `checkSheet_data.carriedPMStatus.${currentMonth}`

        let selectedYearOfCheckSheet =
            selectedYear === currentYear ?
                [
                    {
                        "checkSheet_data.current_year": selectedYear

                    },
                    {
                        "checkSheet_data": []

                    }
                ] : [
                    {
                        "checkSheet_data.current_year": selectedYear

                    },

                ]

        // console.log(currentMonth, selectedYear)
        // console.log(monthKeyArray[monthKeyArray.indexOf(currentMonth) - 1], monthKeyArray.splice(-1)[0])

        // console.log(section);
        let sectionSplit = section.split("-")
        const sectionInfo = await Section.findOne({ section_id: sectionSplit[0] })
        // console.log("____________", sectionInfo[0]._id)
        let subSectionsData, subSectionIdArray = [], cellData, cellIdArray = [], lineData, lineIdArray = [], machineData, machineDataForChecksheet, subsectionSplitIdArrayForChecksheet = []
        if (sectionInfo.dashboardLevel === "Yes") {
            subSectionsData = await SubSection.find({ section_names: sectionInfo._id }).sort({ subSection_sequence: 1 })


            for (let i = 0; i < subSectionsData.length; i++) {
                subSectionIdArray.push(subSectionsData[i]._id);
            }

            cellData = await Cell.find({ subSection_names: { $in: subSectionIdArray } }).sort({ cell_sequence: 1 });

            for (let i = 0; i < cellData.length; i++) {
                cellIdArray.push(cellData[i]._id);
            }

            lineData = await Line.find({ cell_names: { $in: cellIdArray } }).sort({ line_sequence: 1 });

            for (let i = 0; i < lineData.length; i++) {
                lineIdArray.push(lineData[i]._id);
            }

            // machineDataForCurrentMonth = await Machine.find({ line_names: { $in: lineIdArray }, [keyForCurrentMonthPMStatus]: { $ne: "" }, PMStatus: { $exists: true } }).populate({ path: "line_names", populate: { path: "cell_names", model: "Cells" } })
            // machineDataForPreviousMonth = await Machine.find({ line_names: { $in: lineIdArray }, [keyForPreviousMonthPMStatus]: { $ne: "" }, carriedPMStatus: { $exists: true } }).populate({ path: "line_names", populate: { path: "cell_names", model: "Cells" } })




            // const machineData = await Machine.findOne({ _id: machineID })

            machineDataForCurrentMonth = await Machine.aggregate([
                {
                    $match: {
                        line_names: { $in: lineIdArray },
                        $or: selectedYearOfCheckSheet,

                    }
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
                        checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] }
                    }
                },
                {
                    $match: {
                        [keyForCurrentMonthPMStatus]: { $ne: "" },
                        "checkSheet_data.PMStatus": { $ne: "" },

                    }
                },
            ])


            // console.log("========>", machineDataForCurrentMonth)

            machineDataForPreviousMonth = await Machine.aggregate([
                {
                    $match: {
                        line_names: { $in: lineIdArray },
                        $or: selectedYearOfCheckSheet

                    }
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
                        checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] }
                    }
                },
                {
                    $match: {
                        [keyForPreviousMonthPMStatus]: { $ne: "" },
                        "checkSheet_data.PMStatus": { $ne: "" },

                    }
                },
            ])

            machineDataForCurrentMonth = await Machine.populate(machineDataForCurrentMonth, { path: "line_names", populate: { path: "cell_names", model: "Cells" } })
            machineDataForPreviousMonth = await Machine.populate(machineDataForPreviousMonth, { path: "line_names", populate: { path: "cell_names", model: "Cells" } })

            // console.log("========>", machineDataForCurrentMonth)
            // console.log("========>", machineDataForPreviousMonth)


            // machineDataForChecksheet = await Machine.find({ line_names: { $in: lineIdArray } }).populate({ path: "line_names", populate: { path: "cell_names", model: "Cells" } })

        } else {
            loggedUserData.subSection_data.map((ids) => {
                let subsectionsId = ids.split("-")
                subsectionSplitIdArrayForChecksheet.push(subsectionsId[0])
            })
            subSectionsData = await SubSection.find({ subSection_id: { $in: subsectionSplitIdArrayForChecksheet } }).sort({ subSection_sequence: 1 })


            for (let i = 0; i < subSectionsData.length; i++) {
                subSectionIdArray.push(subSectionsData[i]._id);
            }

            cellData = await Cell.find({ subSection_names: { $in: subSectionIdArray } }).sort({ cell_sequence: 1 });

            for (let i = 0; i < cellData.length; i++) {
                cellIdArray.push(cellData[i]._id);
            }

            lineData = await Line.find({ cell_names: { $in: cellIdArray } }).sort({ line_sequence: 1 });

            for (let i = 0; i < lineData.length; i++) {
                lineIdArray.push(lineData[i]._id);
            }

            machineDataForCurrentMonth = await Machine.aggregate([
                {
                    $match: {
                        line_names: { $in: lineIdArray },
                        $or: selectedYearOfCheckSheet,

                    }
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
                        checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] }
                    }
                },
                {
                    $match: {
                        [keyForCurrentMonthPMStatus]: { $ne: "" },
                        "checkSheet_data.PMStatus": { $ne: "" },

                    }
                },
            ])


            // console.log("========>", machineDataForCurrentMonth)

            machineDataForPreviousMonth = await Machine.aggregate([
                {
                    $match: {
                        line_names: { $in: lineIdArray },
                        $or: selectedYearOfCheckSheet

                    }
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
                        checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] }
                    }
                },
                {
                    $match: {
                        [keyForPreviousMonthPMStatus]: { $ne: "" },
                        "checkSheet_data.PMStatus": { $ne: "" },

                    }
                },
            ])

            machineDataForCurrentMonth = await Machine.populate(machineDataForCurrentMonth, { path: "line_names", populate: { path: "cell_names", model: "Cells" } })
            machineDataForPreviousMonth = await Machine.populate(machineDataForPreviousMonth, { path: "line_names", populate: { path: "cell_names", model: "Cells" } })
        }



        res.json({
            machineDataForCurrentMonth
            , machineDataForPreviousMonth
        })
    } catch (error) {
        console.log(error)
        console.log("User id not received!!!");
    }
})


router.post('/postSectionToGetAllDataForAnnualStatusReport', authenticate, async (req, res) => {
    try {
        let { section, selectedYear } = req.body
        let loggedUserData = req.rootUser;

        let sectionSplit = section.split("-")

        const sectionInfo = await Section.findOne({ section_id: sectionSplit[0] })


        // console.log("____________", sectionInfo[0]._id)
        let subSectionsData, subSectionIdArray = [], cellData, cellIdArray = [], lineData, lineIdArray = [], machineData, machineDataForChecksheet, subsectionSplitIdArrayForChecksheet = []


        if (sectionInfo.dashboardLevel === "Yes") {
            subSectionsData = await SubSection.find({ section_names: sectionInfo._id }).sort({ subSection_sequence: 1 })

        } else {
            loggedUserData.subSection_data.map((ids) => {
                let subsectionsId = ids.split("-")
                subsectionSplitIdArrayForChecksheet.push(subsectionsId[0])
            })
            subSectionsData = await SubSection.find({ subSection_id: { $in: subsectionSplitIdArrayForChecksheet } }).sort({ subSection_sequence: 1 })

        }



        for (let i = 0; i < subSectionsData.length; i++) {
            subSectionIdArray.push(subSectionsData[i]._id);
        }

        cellData = await Cell.find({ subSection_names: { $in: subSectionIdArray } }).sort({ cell_sequence: 1 });

        for (let i = 0; i < cellData.length; i++) {
            cellIdArray.push(cellData[i]._id);
        }

        lineData = await Line.find({ cell_names: { $in: cellIdArray } }).sort({ line_sequence: 1 });

        for (let i = 0; i < lineData.length; i++) {
            lineIdArray.push(lineData[i]._id);
        }
        // console.log(lineData)

        let currentYear =
            new Date().getMonth() <= 3
                ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
                : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;


        let selectedYearOfCheckSheet =
            selectedYear === currentYear ?
                [
                    {
                        "checkSheet_data.current_year": selectedYear

                    },
                    {
                        "checkSheet_data": []

                    }
                ] : [
                    {
                        "checkSheet_data.current_year": selectedYear

                    },

                ]

        // console.log(selectedYear)
        let groupData
        let allData = []
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
        let annual_completed = []
        let annual_previous_pending = []


        // console.log(i, "------->")


        for (let j = 0; j < monthKeyArray.length; j++) {

            let sumVariableForTotalSchedule = 0
            let sumVariableForTotalCompleted = 0
            let sumVariableForTotalPreviousPending = 0



            let x = `$checkSheet_data.PMStatus.${monthKeyArray[j]}`
            // let previousMonth = monthKeyArray[j - 1] === undefined ? monthKeyArray.splice(-1)[0] : monthKeyArray[j - 1]
            let keyForPreviousMonth = `$checkSheet_data.carriedPMStatus.${monthKeyArray[j]}`

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

                        }
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
                            checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] }
                        }
                    },
                    {
                        $match: {
                            "checkSheet_data.PMStatus": { $ne: undefined },
                            // "checkSheet_data.carriedPMStatus": { $ne: undefined },

                        }
                    },
                    {
                        $group: {
                            _id: "$line_names",
                            machine: { $push: { machine_code: "$machine_code", machine_name: "$machine_name" } },
                            total_pmSchedule: {
                                $sum: {
                                    $cond: [
                                        {
                                            $ne: [x, ""]
                                        },
                                        1, 0
                                    ]
                                }
                            },
                            total_completed: {
                                $sum: {
                                    $cond: [
                                        {
                                            $eq: [x, "Completed"]
                                        },
                                        1, 0
                                    ]
                                }
                            },
                            total_Previous: {
                                $sum: {
                                    $cond: [
                                        {
                                            $eq: [keyForPreviousMonth, "CarriedPM"]
                                        },
                                        1, 0
                                    ]
                                }
                            },



                        },
                    },

                    {
                        $project: {
                            _id: 0,
                            line_names: "$_id",
                            machine: 1,
                            "total_pmSchedule": 1,
                            "total_completed": 1,
                            "total_Previous": 1
                        }
                    },


                ])
                if (groupData.length > 0) {
                    // console.log("---------------------------", groupData)
                    sumVariableForTotalSchedule = sumVariableForTotalSchedule + groupData[0].total_pmSchedule
                    sumVariableForTotalCompleted = sumVariableForTotalCompleted + groupData[0].total_completed
                    sumVariableForTotalPreviousPending = sumVariableForTotalPreviousPending + groupData[0].total_Previous
                }
            }

            // console.log(sumVariableForTotalSchedule, "=====>", j)


            annual_total_current_schedule.push(sumVariableForTotalSchedule)
            annual_completed.push(sumVariableForTotalCompleted)
            annual_previous_pending.push(sumVariableForTotalPreviousPending)



            if (groupData.length > 0) {
                for (let i = 0; i < groupData.length; i++) {
                    allData.push(groupData[i])
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
            annual_previous_pending
        })
    } catch (error) {
        console.log(error)
        console.log("User id not received!!!");
    }

})

router.post('/postSectionToGetAllDataForMainDashboardGraph', authenticate, async (req, res) => {
    try {
        let { section, selectedMonth, selectedYear } = req.body
        let loggedUserData = req.rootUser;

        let sectionSplit = section.split("-")

        const sectionInfo = await Section.findOne({ section_id: sectionSplit[0] })

        let subSectionsData, subSectionIdArray = [], cellData, cellIdArray = [], lineData, lineIdArray = [], machineData, machineDataForChecksheet, subsectionSplitIdArrayForChecksheet = []


        if (sectionInfo.dashboardLevel === "Yes") {
            subSectionsData = await SubSection.find({ section_names: sectionInfo._id }).sort({ subSection_sequence: 1 })

        } else {
            loggedUserData.subSection_data.map((ids) => {
                let subsectionsId = ids.split("-")
                subsectionSplitIdArrayForChecksheet.push(subsectionsId[0])
            })
            subSectionsData = await SubSection.find({ subSection_id: { $in: subsectionSplitIdArrayForChecksheet } }).sort({ subSection_sequence: 1 })

        }

        for (let i = 0; i < subSectionsData.length; i++) {
            subSectionIdArray.push(subSectionsData[i]._id);
        }

        cellData = await Cell.find({ subSection_names: { $in: subSectionIdArray } }).sort({ cell_sequence: 1 });

        for (let i = 0; i < cellData.length; i++) {
            cellIdArray.push(cellData[i]._id);
        }

        lineData = await Line.find({ cell_names: { $in: cellIdArray } }).sort({ line_sequence: 1 });

        for (let i = 0; i < lineData.length; i++) {
            lineIdArray.push(lineData[i]._id);
        }
        let currentYear =
            new Date().getMonth() <= 3
                ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
                : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;


        let selectedYearOfCheckSheet =
            selectedYear === currentYear ?
                [
                    {
                        "checkSheet_data.current_year": selectedYear

                    },
                    {
                        "checkSheet_data": []

                    }
                ] : [
                    {
                        "checkSheet_data.current_year": selectedYear

                    },

                ]


        let groupData

        let keyForSelectedMonth = `$checkSheet_data.PMStatus.${selectedMonth}`

        let sumVariableForTotalSchedule = 0
        let sumVariableForTotalCompleted = 0
        let sumVariableForTotalOngoing = 0


        for (let i = 0; i < lineData.length; i++) {

            groupData = await Machine.aggregate([

                {

                    $match: {
                        line_names: lineData[i]._id,
                        $or: selectedYearOfCheckSheet,

                    }
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
                        checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] }
                    }
                },
                {
                    $match: {
                        "checkSheet_data.PMStatus": { $ne: undefined },

                    }
                },
                {
                    $group: {
                        _id: "$line_names",
                        machine: { $push: { machine_code: "$machine_code", machine_name: "$machine_name" } },
                        total_pmSchedule: {
                            $sum: {
                                $cond: [
                                    {
                                        $ne: [keyForSelectedMonth, ""]
                                    },
                                    1, 0
                                ]
                            }
                        },
                        total_completed: {
                            $sum: {
                                $cond: [
                                    {
                                        $eq: [keyForSelectedMonth, "Completed"]
                                    },
                                    1, 0
                                ]
                            }
                        },
                        total_ongoing: {
                            $sum: {
                                $cond: [
                                    {
                                        $eq: [keyForSelectedMonth, "Ongoing"]
                                    },
                                    1, 0
                                ]
                            }
                        },




                    },
                },

                {
                    $project: {
                        _id: 0,
                        line_names: "$_id",
                        machine: 1,
                        "total_pmSchedule": 1,
                        "total_completed": 1,
                        "total_ongoing": 1,
                    }
                },


            ])
            if (groupData.length > 0) {
                // console.log("---------------------------", groupData)
                sumVariableForTotalSchedule = sumVariableForTotalSchedule + groupData[0].total_pmSchedule
                sumVariableForTotalCompleted = sumVariableForTotalCompleted + groupData[0].total_completed
                sumVariableForTotalOngoing = sumVariableForTotalOngoing + groupData[0].total_ongoing
            }
        }


        // console.log(sumVariableForTotalSchedule)
        // console.log("***************************")
        // console.log(sumVariableForTotalCompleted)
        // console.log("***************************")
        // console.log(sumVariableForTotalOngoing)


        res.json({
            sumVariableForTotalSchedule,
            sumVariableForTotalCompleted,
            sumVariableForTotalOngoing
        })
    } catch (error) {
        console.log(error)
        console.log("User id not received!!!");
    }

})

router.post('/postSectionForAddNewCheckSheetAfterChangeFinancialYear', authenticate, async (req, res) => {
    try {
        let { section } = req.body
        // console.log(section)
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

        //2022-23
        let current_year = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`

        //2023-2024
        // let current_year = `${new Date().getFullYear() + 1}-${new Date().getFullYear() + 2}`

        let previous_year = `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`

        const financialYearWiseMonthKeyArray = ['Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']

        let newFinancialCheckSheetPlanningData =
        {
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
        }
        let subSectionsData, subSectionIdArray = [], cellData, cellIdArray = [], lineData, lineIdArray = [], machineData, machineDataForChecksheet, subsectionSplitIdArrayForChecksheet = []
        let copyCheckSheetData, removeFieldsFromPreviousYear
        if (monthForCompareSystemMonth === "Apr") {
            // console.log(section);
            let sectionSplit = section.split("-")
            const sectionInfo = await Section.findOne({ section_id: sectionSplit[0] })
            if (sectionInfo.dashboardLevel === "Yes") {
                subSectionsData = await SubSection.find({ section_names: sectionInfo._id }).sort({ subSection_sequence: 1 })


                for (let i = 0; i < subSectionsData.length; i++) {
                    subSectionIdArray.push(subSectionsData[i]._id);
                }

                cellData = await Cell.find({ subSection_names: { $in: subSectionIdArray } }).sort({ cell_sequence: 1 });

                for (let i = 0; i < cellData.length; i++) {
                    cellIdArray.push(cellData[i]._id);
                }

                lineData = await Line.find({ cell_names: { $in: cellIdArray } }).sort({ line_sequence: 1 });
                for (let i = 0; i < lineData.length; i++) {
                    lineIdArray.push(lineData[i]._id);
                }
                // console.log(lineIdArray)

                // machineData = await Machine.find({ line_names: { $in: lineIdArray }, checkSheet_data:{$exists:true}}).populate({ path: "line_names", populate: { path: "cell_names", model: "Cells" } })

                let previousYearCheckCheetDataOfPeraticularSection
                previousYearCheckCheetDataOfPeraticularSection = await Machine.aggregate([
                    {
                        $match: { line_names: { $in: lineIdArray }, "checkSheet_data.current_year": previous_year }
                    },
                    { $unwind: '$checkSheet_data' },
                    {
                        $match: { "checkSheet_data.current_year": previous_year }
                    },
                    // { $unwind: '$checkSheet_data.checkSheet' },

                    // { $project: { "checkSheet_data.checkSheet": 1, "checkSheet_data.current_year": 1 } },
                ]);

                for (let i = 0; i < previousYearCheckCheetDataOfPeraticularSection.length; i++) {
                    // console.log(previousYearCheckCheetDataOfPeraticularSection[i].checkSheet_data.current_year)
                    previousYearCheckCheetDataOfPeraticularSection[i].checkSheet_data.checksheet_status = "Planning"
                    previousYearCheckCheetDataOfPeraticularSection[i].checkSheet_data.current_year = current_year
                    for (let k = 0; k < previousYearCheckCheetDataOfPeraticularSection[i].checkSheet_data.checkSheet.length; k++) {
                        for (let j = 0; j < financialYearWiseMonthKeyArray.length; j++) {
                            let month = financialYearWiseMonthKeyArray[j];
                            if (previousYearCheckCheetDataOfPeraticularSection[i].checkSheet_data.checkSheet[k].planningTableAnimationArray2[month][0] == "2") {
                                previousYearCheckCheetDataOfPeraticularSection[i].checkSheet_data.checkSheet[k].planningTableAnimationArray2[month][0] = "0"
                            }
                            if (previousYearCheckCheetDataOfPeraticularSection[i].checkSheet_data.checkSheet[k].planningTableAnimationArray2[month][0]) {
                                newFinancialCheckSheetPlanningData[month][0] = previousYearCheckCheetDataOfPeraticularSection[i].checkSheet_data.checkSheet[0].planningTableAnimationArray2[month][0]

                            } else {
                                continue
                            }

                        }
                        previousYearCheckCheetDataOfPeraticularSection[i].checkSheet_data.checkSheet[k].planningTableAnimationArray2 = newFinancialCheckSheetPlanningData
                    }

                    // console.log(previousYearCheckCheetDataOfPeraticularSection[i].checkSheet_data.checkSheet[0].planningTableAnimationArray2)
                    copyCheckSheetData = await Machine.updateOne({ machine_code: previousYearCheckCheetDataOfPeraticularSection[i].machine_code },
                        {
                            $push: {
                                checkSheet_data: previousYearCheckCheetDataOfPeraticularSection[i].checkSheet_data
                            }
                        }
                    )

                    removeFieldsFromPreviousYear = await Machine.updateOne(
                        { machine_code: previousYearCheckCheetDataOfPeraticularSection[i].machine_code },
                        {
                            $unset: {
                                "checkSheet_data.$[outer].checkSheet.$[].abnormalityDetails": "",
                                "checkSheet_data.$[outer].checkSheet.$[].spareDetails": "",
                                "checkSheet_data.$[outer].supportingOperatorList": "",
                                "checkSheet_data.$[outer].PMworkedTMName": "",
                                "checkSheet_data.$[outer].PMStatus": "",
                                "checkSheet_data.$[outer].carriedPMStatus": "",
                                "checkSheet_data.$[outer].PMDelayRemark": "",
                                "checkSheet_data.$[outer].implemetation_completed_date": "",
                                "checkSheet_data.$[outer].implemetation_completed_tm_no": "",
                                "checkSheet_data.$[outer].implemetation_completed_tm_name": "",
                                "checkSheet_data.$[outer].implementation_assign_PRD_TL": "",
                                "checkSheet_data.$[outer].implementation_assign_MTD_TL": "",
                                "checkSheet_data.$[outer].implementation_assign_MTD_HOS": "",
                                "checkSheet_data.$[outer].implementation_rejected_remarks": "",
                                "checkSheet_data.$[outer].implementation_approved_by_PRD_TL": "",
                                "checkSheet_data.$[outer].implementation_approved_by_MTD_TL": "",
                                "checkSheet_data.$[outer].implementation_approved_by_MTD_HOS": "",
                                "checkSheet_data.$[outer].implementation_approved_PRD_TL_date": "",
                                "checkSheet_data.$[outer].implementation_approved_MTD_HOS_date": "",
                                "checkSheet_data.$[outer].implemetation_prd_tl_approval_status": "",
                                "checkSheet_data.$[outer].implemetation_mtd_tl_approval_status": "",
                                "checkSheet_data.$[outer].implemetation_mtd_hos_approval_status": "",
                            }
                        },
                        {
                            arrayFilters: [{ 'outer.current_year': current_year }],
                        }
                    )
                    // console.log(removeFieldsFromPreviousYear)

                }
                if (removeFieldsFromPreviousYear && copyCheckSheetData) {
                    return res.status(201).json("Checksheet copied!!!");
                }
                else {
                    return res.status(400).json("Checksheet not copied!!!");
                }

                // machineDataForChecksheet = await Machine.find({ line_names: { $in: lineIdArray } }).populate({ path: "line_names", populate: { path: "cell_names", model: "Cells" } })

            } else {
                loggedUserData.subSection_data.map((ids) => {
                    let subsectionsId = ids.split("-")
                    subsectionSplitIdArrayForChecksheet.push(subsectionsId[0])
                })
                subSectionsData = await SubSection.find({ subSection_id: { $in: subsectionSplitIdArrayForChecksheet } }).sort({ subSection_sequence: 1 })


                for (let i = 0; i < subSectionsData.length; i++) {
                    subSectionIdArray.push(subSectionsData[i]._id);
                }

                cellData = await Cell.find({ subSection_names: { $in: subSectionIdArray } }).sort({ cell_sequence: 1 });

                for (let i = 0; i < cellData.length; i++) {
                    cellIdArray.push(cellData[i]._id);
                }

                lineData = await Line.find({ cell_names: { $in: cellIdArray } }).sort({ line_sequence: 1 });

                for (let i = 0; i < lineData.length; i++) {
                    lineIdArray.push(lineData[i]._id);
                }


                // machineData = await Machine.find({ line_names: { $in: lineIdArray }, checksheet_status: { $exists: true } }).populate({ path: "line_names", populate: { path: "cell_names", model: "Cells" } })

                let previousYearCheckCheetDataOfPeraticularSection
                previousYearCheckCheetDataOfPeraticularSection = await Machine.aggregate([
                    {
                        $match: { line_names: { $in: lineIdArray }, "checkSheet_data.current_year": previous_year }
                    },
                    { $unwind: '$checkSheet_data' },
                    {
                        $match: { "checkSheet_data.current_year": previous_year }
                    },
                    // { $unwind: '$checkSheet_data.checkSheet' },

                    // { $project: { "checkSheet_data.checkSheet": 1, "checkSheet_data.current_year": 1 } },
                ]);

                for (let i = 0; i < previousYearCheckCheetDataOfPeraticularSection.length; i++) {
                    // console.log(previousYearCheckCheetDataOfPeraticularSection[i].checkSheet_data.current_year)
                    previousYearCheckCheetDataOfPeraticularSection[i].checkSheet_data.checksheet_status = "Planning"
                    previousYearCheckCheetDataOfPeraticularSection[i].checkSheet_data.current_year = current_year
                    for (let k = 0; k < previousYearCheckCheetDataOfPeraticularSection[i].checkSheet_data.checkSheet.length; k++) {
                        for (let j = 0; j < financialYearWiseMonthKeyArray.length; j++) {
                            let month = financialYearWiseMonthKeyArray[j];
                            if (previousYearCheckCheetDataOfPeraticularSection[i].checkSheet_data.checkSheet[k].planningTableAnimationArray2[month][0] == "2") {
                                previousYearCheckCheetDataOfPeraticularSection[i].checkSheet_data.checkSheet[k].planningTableAnimationArray2[month][0] = "0"
                            }
                            if (previousYearCheckCheetDataOfPeraticularSection[i].checkSheet_data.checkSheet[k].planningTableAnimationArray2[month][0]) {
                                newFinancialCheckSheetPlanningData[month][0] = previousYearCheckCheetDataOfPeraticularSection[i].checkSheet_data.checkSheet[0].planningTableAnimationArray2[month][0]

                            } else {
                                continue
                            }

                        }
                        previousYearCheckCheetDataOfPeraticularSection[i].checkSheet_data.checkSheet[k].planningTableAnimationArray2 = newFinancialCheckSheetPlanningData
                    }

                    // console.log(previousYearCheckCheetDataOfPeraticularSection[i].checkSheet_data.checkSheet[0].planningTableAnimationArray2)
                    copyCheckSheetData = await Machine.updateOne({ machine_code: previousYearCheckCheetDataOfPeraticularSection[i].machine_code },
                        {
                            $push: {
                                checkSheet_data: previousYearCheckCheetDataOfPeraticularSection[i].checkSheet_data
                            }
                        }
                    )

                    removeFieldsFromPreviousYear = await Machine.updateOne(
                        { machine_code: previousYearCheckCheetDataOfPeraticularSection[i].machine_code },
                        {
                            $unset: {
                                "checkSheet_data.$[outer].checkSheet.$[].abnormalityDetails": "",
                                "checkSheet_data.$[outer].checkSheet.$[].spareDetails": "",
                                "checkSheet_data.$[outer].supportingOperatorList": "",
                                "checkSheet_data.$[outer].PMworkedTMName": "",
                                "checkSheet_data.$[outer].PMStatus": "",
                                "checkSheet_data.$[outer].carriedPMStatus": "",
                                "checkSheet_data.$[outer].PMDelayRemark": "",
                                "checkSheet_data.$[outer].implemetation_completed_date": "",
                                "checkSheet_data.$[outer].implemetation_completed_tm_no": "",
                                "checkSheet_data.$[outer].implemetation_completed_tm_name": "",
                                "checkSheet_data.$[outer].implementation_assign_PRD_TL": "",
                                "checkSheet_data.$[outer].implementation_assign_MTD_TL": "",
                                "checkSheet_data.$[outer].implementation_assign_MTD_HOS": "",
                                "checkSheet_data.$[outer].implementation_rejected_remarks": "",
                                "checkSheet_data.$[outer].implementation_approved_by_PRD_TL": "",
                                "checkSheet_data.$[outer].implementation_approved_by_MTD_TL": "",
                                "checkSheet_data.$[outer].implementation_approved_by_MTD_HOS": "",
                                "checkSheet_data.$[outer].implementation_approved_PRD_TL_date": "",
                                "checkSheet_data.$[outer].implementation_approved_MTD_HOS_date": "",
                                "checkSheet_data.$[outer].implemetation_prd_tl_approval_status": "",
                                "checkSheet_data.$[outer].implemetation_mtd_tl_approval_status": "",
                                "checkSheet_data.$[outer].implemetation_mtd_hos_approval_status": "",
                            }
                        },
                        {
                            arrayFilters: [{ 'outer.current_year': current_year }],
                        }
                    )
                    // console.log(removeFieldsFromPreviousYear)

                }
                if (removeFieldsFromPreviousYear && copyCheckSheetData) {
                    return res.status(201).json("Checksheet copied!!!");
                }
                else {
                    return res.status(400).json("Checksheet not copied!!!");
                }

                // machineDataForChecksheet = await Machine.find({ line_names: { $in: lineIdArray } }).populate({ path: "line_names", populate: { path: "cell_names", model: "Cells" } })
            }
        } else {
            return res.status(409).json({ error: 'Current month is not financial year start month' })
        }

    } catch (error) {
        console.log(error)
        console.log("User id not received!!!");
    }
})


router.post('/getDataForOpenAbnormalityTracking', authenticate, async (req, res) => {
    try {
        let { section } = req.body
        // console.log(section, "_________", req.rootUser);
        let sectionSplit = section.split("-")
        const sectionInfo = await Section.find({ section_id: sectionSplit[0] })
        // console.log("____________", sectionInfo[0]._id)
        const subSectionsData = await SubSection.find({ section_names: sectionInfo[0]._id }).sort({ subSection_sequence: 1 })

        //for display default sub-section 
        let defaultSubSectionArray = []
        for (let i = 0; i < subSectionsData.length; i++) {
            defaultSubSectionArray.push(`${subSectionsData[i].subSection_id}-${subSectionsData[i].subSection_name}`);
        }

        let subSectionIdArray = []
        for (let i = 0; i < subSectionsData.length; i++) {
            subSectionIdArray.push(subSectionsData[i]._id);
        }

        const cellData = await Cell.find({ subSection_names: { $in: subSectionIdArray } }).sort({ cell_sequence: 1 });
        let cellIdArray = []
        for (let i = 0; i < cellData.length; i++) {
            cellIdArray.push(cellData[i]._id);
        }

        const lineData = await Line.find({ cell_names: { $in: cellIdArray } }).sort({ line_sequence: 1 });
        let lineIdArray = []
        for (let i = 0; i < lineData.length; i++) {
            lineIdArray.push(lineData[i]._id);
        }

        const machineData = await Machine.find({ line_names: { $in: lineIdArray } }).sort({ machine_sequence: 1 });

        let openAbnormality = await Machine.aggregate([
            {
                $match: {
                    line_names: { $in: lineIdArray }
                }
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
                    checkSheet_data: { $arrayElemAt: ["$checkSheet_data", -1] }
                }
            },
            {
                $match: {
                    "checkSheet_data.checkSheet.abnormalityDetails": { $ne: "" },
                    // machine_code: "666"
                }
            },

        ])
        // console.log(openAbnormality)
        openAbnormality = await Machine.populate(openAbnormality, { path: "line_names", populate: { path: "cell_names", model: "Cells" } })

        // const openAbnormality = await Machine.find({ line_names: { $in: lineIdArray }, "checkSheet.abnormalityDetails": { $exists: true } }).populate({ path: "line_names", populate: { path: "cell_names", model: "Cells" } })
        const financialYearWiseMonthKeyArray = ['Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']

        let onlyOpenAbnormalityWithAllMonths = [];
        openAbnormality.map((keyForCheckSheet) => {
            keyForCheckSheet?.checkSheet_data?.checkSheet?.map((keyForAbnormality) => {
                for (let i = 0; i < Object.keys(keyForAbnormality?.abnormalityDetails)?.length; i++) {
                    let month = financialYearWiseMonthKeyArray[i]
                    if (keyForAbnormality.abnormalityDetails[month]?.abnormalityStatus != undefined) {
                        if (keyForAbnormality.abnormalityDetails[month]?.abnormalityStatus === "Open") {
                            onlyOpenAbnormalityWithAllMonths.push(
                                new Object({
                                    line_name: keyForCheckSheet.line_names.line_name,
                                    machine_name: keyForCheckSheet.machine_name,
                                    machine_code: keyForCheckSheet.machine_code,
                                    yearOfCheckSheet: keyForCheckSheet?.checkSheet_data?.current_year,
                                    schedule_month: month,
                                    table_id: keyForAbnormality.tableRowId,
                                    checked_by: keyForCheckSheet?.checkSheet_data?.PMworkedTMName[month],
                                    abnormalityRemarks: keyForAbnormality?.abnormalityDetails[month]?.abnormalityRemarks,
                                    targetDate: keyForAbnormality?.abnormalityDetails[month]?.targetDate,
                                    PMuploadedImage: keyForAbnormality?.abnormalityDetails[month]?.PMuploadedImage,
                                    remarksOnClose: keyForAbnormality?.abnormalityDetails[month]?.remarksOnClose,
                                    doneDate: keyForAbnormality?.abnormalityDetails[month]?.doneDate,
                                    doneBy: keyForAbnormality?.abnormalityDetails[month]?.doneBy,
                                })
                            );
                        }
                    }



                }
            })
        })
        // console.log(onlyOpenAbnormalityWithAllMonths)

        res.json({ onlyOpenAbnormalityWithAllMonths })
    } catch (error) {
        console.log(error)
        console.log("User id not received!!!");
    }
})

//                      SUMMERY DASHBOARD


router.post('/postPlantToGetSectionInfoForSummeryDashboard', authenticate, async (req, res) => {
    try {
        let { plants } = req.body

        // console.log(plants.map(item => item._id))
        // const SectionInfo = await Section.find({ plant_names: { $in: plants.map(item => item._id) } }).populate({ path: "plant_names", model: "Plants" })
        const SectionInfo = await Section.find({ plant_names: { $in: plants.map(item => item._id) } })

        // console.log(SectionInfo);


        // console.log(sectionArray)

        res.json({ SectionInfo })
    } catch (error) {
        console.log(error)
        console.log("User id not received!!!");
    }
})

router.post('/postSectionToGetSubSectionForSummeryDashboard', authenticate, async (req, res) => {
    try {
        let { section } = req.body

        let idForDashboardLevelNo = []
        await section.map(item => {
            if (item.dashboardLevel === "No") idForDashboardLevelNo.push(item)
        });

        // console.log(idForDashboardLevelNo)

        const subSectionInfo = await SubSection.find({ section_names: { $in: idForDashboardLevelNo.map(item => item._id) } })
        // const subSectionInfo = await SubSection.find({ section_names: { $in: section.map(item => item.dashboardLevel === "No" ? item._id : "") } })


        // console.log(subSectionInfo);


        res.json({ subSectionInfo })
    } catch (error) {
        console.log(error)
        console.log("User id not received!!!");
    }
})

router.post('/submitRemarksForMainDashboardSectionWise', authenticate, async (req, res) => {
    try {
        let { section, remarks } = req.body
        let sectionSplit = section.split("-")


        let updatedSectionInfo = await Section.updateOne({ section_id: sectionSplit[0] }, {
            $set: {
                remarksOnMainDashboard: remarks
            }
        })

        if (updatedSectionInfo) {
            res.status(200).json({ msg: "uploaded successfully" })
        }
    } catch (error) {
        console.log(error)
        console.log("User id not received!!!");
    }
})

router.post('/submitRemarksForMainDashboardSubSectionWise', authenticate, async (req, res) => {
    try {
        let { subSection, remarks } = req.body
        let subSectionSplit = subSection.split("-")

        // console.log(subSection, subSectionSplit[0])

        let updatedSubSectionInfo = await SubSection.updateOne({ subSection_id: subSectionSplit[0] }, {
            $set: {
                remarksOnMainDashboard: remarks
            }
        })

        if (updatedSubSectionInfo) {
            res.status(200).json({ msg: "uploaded successfully" })
        }
    } catch (error) {
        console.log(error)
        console.log("User id not received!!!");
    }
})

router.get('/fetchRemarksForMainDashboardSectionWise', authenticate, async (req, res) => {
    try {
        let sectionSplit = req.rootUser.section_data.split("-")

        // console.log(req.rootUser)
        const sectionInfo = await Section.findOne({ section_id: sectionSplit[0] })

        if (sectionInfo?.dashboardLevel === "Yes") {
            res.json({ sectionInfo })
        } else {
            console.log("No")
        }

    } catch (error) {
        console.log(error)
        console.log("User id not received!!!");
    }
})


router.post('/fetchRemarksForMainDashboardSubSectionWise', authenticate, async (req, res) => {
    try {
        let { subSection, } = req.body
        let subSectionSplit = subSection.split("-")

        // console.log(subSection, subSectionSplit[0])

        let subSectionInfo = await SubSection.findOne({ subSection_id: subSectionSplit[0] })

        // console.log(subSectionInfo)

        res.json({ subSectionInfo })
        // if (subSectionInfo) {
        // }
    } catch (error) {
        console.log(error)
        console.log("User id not received!!!");
    }
})

router.get('/getDeletedMachineCheckSheetData', authenticate, async (req, res) => {
    try {
        const getDeletedDataOfCheckSheet = await BackupMachineData.find({}).populate({ path: "line_names", populate: { path: "cell_names", model: "Cells" } })
        if (getDeletedDataOfCheckSheet) {
            res.json({ getDeletedDataOfCheckSheet });

        } else {
            return res.status(400).json("Checksheet not copied!!!");
        }
    } catch (error) {
        console.log(error)
        console.log("User data not send or get!!!");
    }
})

//below two API for total time with month and line selection

router.post('/postSectionToGetAllDataForTotalTimeMonthWiseReport', authenticate, async (req, res) => {
    try {
        let { section } = req.body
        let selectedYear = "2022-2023"
        let loggedUserData = req.rootUser;
        let sectionSplit = section.split("-")
        const sectionInfo = await Section.findOne({ section_id: sectionSplit[0] })
        // console.log("____________", sectionInfo[0]._id)
        let subSectionsData, subSectionIdArray = [], cellData, cellIdArray = [], lineData, lineIdArray = [], machineData, machineDataForChecksheet, subsectionSplitIdArrayForChecksheet = []
        subSectionsData = await SubSection.find({ section_names: sectionInfo._id }).sort({ subSection_sequence: 1 })
        for (let i = 0; i < subSectionsData.length; i++) {
            subSectionIdArray.push(subSectionsData[i]._id);
        }
        cellData = await Cell.find({ subSection_names: { $in: subSectionIdArray } }).sort({ cell_sequence: 1 });
        for (let i = 0; i < cellData.length; i++) {
            cellIdArray.push(cellData[i]._id);
        }
        lineData = await Line.find({ cell_names: { $in: cellIdArray } }).sort({ line_sequence: 1 });
        for (let i = 0; i < lineData.length; i++) {
            lineIdArray.push(lineData[i]._id);
        }
        // console.log(lineData)
        let currentYear =
            new Date().getMonth() <= 3
                ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
                : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
        let selectedYearOfCheckSheet =
            selectedYear === currentYear ?
                [
                    {
                        "checkSheet_data.current_year": selectedYear
                    },
                    {
                        "checkSheet_data": []
                    }
                ] : [
                    {
                        "checkSheet_data.current_year": selectedYear
                    },
                ]
        // console.log(selectedYear)
        let groupData
        let allData = []
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
        const financialYearWiseMonthKeyArray = ['Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']

        let total_time_month_wise = [];
        // console.log(i, "------->")
        for (let j = 0; j < monthKeyArray.length; j++) {
            let sumOfTotalTime

            for (let i = 0; i < lineData.length; i++) {
                let x = `checkSheet_data.totalPMTime.${financialYearWiseMonthKeyArray[j]}`
                // let previousMonth = monthKeyArray[j - 1] === undefined ? monthKeyArray.splice(-1)[0] : monthKeyArray[j - 1]
                let keyForTotalTime = `checkSheet_data.totalPMTime.${financialYearWiseMonthKeyArray[j]}.totalWorkedPMTime`
                let keyForTotalTimeForSum = `$checkSheet_data.totalPMTime.${financialYearWiseMonthKeyArray[j]}.totalWorkedPMTime`

                groupData = await Machine.aggregate([
                    {
                        $match: {
                            line_names: lineData[i]._id,
                            "checkSheet_data": { $ne: undefined },
                            $or: selectedYearOfCheckSheet,
                        }
                    },
                    { $addFields: { checkSheet_data: { $last: "$checkSheet_data" } } },
                    {
                        $match: {
                            [x]: { $ne: undefined },
                            [keyForTotalTime]: { $ne: undefined },
                            // "checkSheet_data.carriedPMStatus": { $ne: undefined },
                        }
                    },
                    {
                        $group: {
                            _id: "$line_names",
                            machine: { $push: { machine_code: "$machine_code", machine_name: "$machine_name" } },
                            total_pmTime: {
                                $sum: keyForTotalTimeForSum
                            },

                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            line_names: "$_id",
                            machine: 1,
                            "total_pmTime": 1,
                        }
                    },
                ])

                if (groupData.length > 0) {
                    sumOfTotalTime = groupData[0].total_pmTime
                }

            }
            // console.log("---------------", groupData)

            if (sumOfTotalTime) {
                total_time_month_wise.push(sumOfTotalTime)
            } else {
                total_time_month_wise.push(0)
            }
        }

        res.json({ subSectionsData, subSectionIdArray, cellData, cellIdArray, lineData, lineIdArray, total_time_month_wise })

    } catch (error) {
        console.log(error)
        console.log("User id not received!!!");
    }
})


router.post('/postPerticularLineToGetDataForTotalTimeMonthWiseReport', authenticate, async (req, res) => {
    try {
        let { line } = req.body
        // console.log(line)
        let selectedYear = "2022-2023"
        let current_year =
            new Date().getMonth() <= 3
                ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
                : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

        let selectedYearOfCheckSheet =
            selectedYear === current_year ?
                [
                    {
                        "checkSheet_data.current_year": selectedYear
                    },
                    {
                        "checkSheet_data": []
                    }
                ] : [
                    {
                        "checkSheet_data.current_year": selectedYear
                    },
                ]
        const ObjectId = mongoose.Types.ObjectId;

        let groupData
        let allData = []
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
        const financialYearWiseMonthKeyArray = ['Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']

        let totalTimeMonthWiseForPerticularLine = [];
        // console.log(i, "------->")
        for (let j = 0; j < monthKeyArray.length; j++) {
            let sumOfTotalTime

            let x = `checkSheet_data.totalPMTime.${financialYearWiseMonthKeyArray[j]}`
            // let previousMonth = monthKeyArray[j - 1] === undefined ? monthKeyArray.splice(-1)[0] : monthKeyArray[j - 1]
            let keyForTotalTime = `checkSheet_data.totalPMTime.${financialYearWiseMonthKeyArray[j]}.totalWorkedPMTime`
            let keyForTotalTimeForSum = `$checkSheet_data.totalPMTime.${financialYearWiseMonthKeyArray[j]}.totalWorkedPMTime`

            groupData = await Machine.aggregate([
                {
                    $match: {
                        line_names: ObjectId(line),
                        "checkSheet_data": { $ne: undefined },
                        $or: selectedYearOfCheckSheet,
                    }
                },
                { $addFields: { checkSheet_data: { $last: "$checkSheet_data" } } },
                {
                    $match: {
                        [x]: { $ne: undefined },
                        [keyForTotalTime]: { $ne: undefined },
                        // "checkSheet_data.carriedPMStatus": { $ne: undefined },
                    }
                },
                {
                    $group: {
                        _id: "$line_names",
                        machine: { $push: { machine_code: "$machine_code", machine_name: "$machine_name" } },
                        total_pmTime: {
                            $sum: keyForTotalTimeForSum
                        },

                    },
                },
                {
                    $project: {
                        _id: 0,
                        line_names: "$_id",
                        machine: 1,
                        "total_pmTime": 1,
                    }
                },
            ])

            if (groupData.length > 0) {
                sumOfTotalTime = groupData[0].total_pmTime
            }
            if (sumOfTotalTime) {
                totalTimeMonthWiseForPerticularLine.push(sumOfTotalTime)
            } else {
                totalTimeMonthWiseForPerticularLine.push(0)
            }
        }

        // console.log(totalTimeMonthWiseForPerticularLine)

        res.json({ totalTimeMonthWiseForPerticularLine })
    } catch (error) {
        console.log(error)
        console.log("User id not received!!!");
    }
})


//below two API for total time man hour wise with month and line selection

router.post('/postSectionToGetAllDataForTotalTimeManHoursMonthWise', authenticate, async (req, res) => {
    try {
        let { section } = req.body
        let selectedYear = "2022-2023"
        let loggedUserData = req.rootUser;
        let sectionSplit = section.split("-")
        const sectionInfo = await Section.findOne({ section_id: sectionSplit[0] })
        // console.log("____________", sectionInfo[0]._id)
        let subSectionsData, subSectionIdArray = [], cellData, cellIdArray = [], lineData, lineIdArray = [], machineData, machineDataForChecksheet, subsectionSplitIdArrayForChecksheet = []
        subSectionsData = await SubSection.find({ section_names: sectionInfo._id }).sort({ subSection_sequence: 1 })
        for (let i = 0; i < subSectionsData.length; i++) {
            subSectionIdArray.push(subSectionsData[i]._id);
        }
        cellData = await Cell.find({ subSection_names: { $in: subSectionIdArray } }).sort({ cell_sequence: 1 });
        for (let i = 0; i < cellData.length; i++) {
            cellIdArray.push(cellData[i]._id);
        }
        lineData = await Line.find({ cell_names: { $in: cellIdArray } }).sort({ line_sequence: 1 });
        for (let i = 0; i < lineData.length; i++) {
            lineIdArray.push(lineData[i]._id);
        }
        // console.log(lineData)
        let currentYear =
            new Date().getMonth() <= 3
                ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
                : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
        let selectedYearOfCheckSheet =
            selectedYear === currentYear ?
                [
                    {
                        "checkSheet_data.current_year": selectedYear
                    },
                    {
                        "checkSheet_data": []
                    }
                ] : [
                    {
                        "checkSheet_data.current_year": selectedYear
                    },
                ]
        // console.log(selectedYear)
        let groupData
        let allData = []
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
        const financialYearWiseMonthKeyArray = ['Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']

        let totalTimeManHoursMonthWise = [];
        // console.log(i, "------->")
        for (let j = 0; j < monthKeyArray.length; j++) {
            let sumOfTotalTimeManHours

            for (let i = 0; i < lineData.length; i++) {
                let keyOfTotalPMTime = `checkSheet_data.totalPMTime.${financialYearWiseMonthKeyArray[j]}`
                let keyOfTotalWorkedPMTime = `checkSheet_data.totalPMTime.${financialYearWiseMonthKeyArray[j]}.totalWorkedPMTime`

                // let previousMonth = monthKeyArray[j - 1] === undefined ? monthKeyArray.splice(-1)[0] : monthKeyArray[j - 1]
                let keyofSupportingTMData = `checkSheet_data.totalPMTime.${financialYearWiseMonthKeyArray[j]}.supportingTMData`
                let keyForTotalTimeManHoursForSum = `$checkSheet_data.totalPMTime.${financialYearWiseMonthKeyArray[j]}.supportingTMData.workedTime`
                let keyForTotalTimeManHoursForUnwind = `$checkSheet_data.totalPMTime.${financialYearWiseMonthKeyArray[j]}.supportingTMData`

                groupData = await Machine.aggregate([
                    {
                        $match: {
                            line_names: lineData[i]._id,
                            "checkSheet_data": { $ne: undefined },
                            $or: selectedYearOfCheckSheet,
                        }
                    },
                    { $addFields: { checkSheet_data: { $last: "$checkSheet_data" } } },
                    {
                        $match: {
                            [keyOfTotalPMTime]: { $ne: undefined },
                            [keyOfTotalWorkedPMTime]: { $ne: undefined },
                            [keyofSupportingTMData]: { $ne: [] },
                            // "checkSheet_data.carriedPMStatus": { $ne: undefined },
                        }
                    },
                    {
                        $unwind: keyForTotalTimeManHoursForUnwind
                    },
                    {
                        $group: {
                            _id: "$line_names",
                            machine: { $push: { machine_code: "$machine_code", machine_name: "$machine_name" } },
                            totalTimeManHours: {
                                $sum: keyForTotalTimeManHoursForSum
                            },

                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            line_names: "$_id",
                            machine: 1,
                            "totalTimeManHours": 1,
                        }
                    },
                ])
                // console.log("---------------", groupData)

                if (groupData.length > 0) {
                    // console.log("---------------", groupData[0].machine)

                    sumOfTotalTimeManHours = groupData[0].totalTimeManHours
                }

            }
            // console.log("---------------", groupData)

            if (sumOfTotalTimeManHours) {
                totalTimeManHoursMonthWise.push(sumOfTotalTimeManHours)
            } else {
                totalTimeManHoursMonthWise.push(0)
            }
        }

        res.json({ subSectionsData, subSectionIdArray, cellData, cellIdArray, lineData, lineIdArray, totalTimeManHoursMonthWise })

    } catch (error) {
        console.log(error)
        console.log("User id not received!!!");
    }
})

router.post('/postPerticularLineToGetDataForTotalTimeManHours', authenticate, async (req, res) => {
    try {
        let { line } = req.body
        let selectedYear = "2022-2023"

        let currentYear =
            new Date().getMonth() <= 3
                ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
                : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
        let selectedYearOfCheckSheet =
            selectedYear === currentYear ?
                [
                    {
                        "checkSheet_data.current_year": selectedYear
                    },
                    {
                        "checkSheet_data": []
                    }
                ] : [
                    {
                        "checkSheet_data.current_year": selectedYear
                    },
                ]
        // console.log(selectedYear)
        const ObjectId = mongoose.Types.ObjectId;

        let groupData
        let allData = []
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
        const financialYearWiseMonthKeyArray = ['Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']

        let totalTimeManHoursMonthWiseOfLineWise = [];
        // console.log(i, "------->")
        for (let j = 0; j < monthKeyArray.length; j++) {
            let sumOfTotalTimeManHoursOfLineWise

            let keyOfTotalPMTime = `checkSheet_data.totalPMTime.${financialYearWiseMonthKeyArray[j]}`
            let keyOfTotalWorkedPMTime = `checkSheet_data.totalPMTime.${financialYearWiseMonthKeyArray[j]}.totalWorkedPMTime`

            // let previousMonth = monthKeyArray[j - 1] === undefined ? monthKeyArray.splice(-1)[0] : monthKeyArray[j - 1]
            let keyofSupportingTMData = `checkSheet_data.totalPMTime.${financialYearWiseMonthKeyArray[j]}.supportingTMData`
            let keyForTotalTimeManHoursForSum = `$checkSheet_data.totalPMTime.${financialYearWiseMonthKeyArray[j]}.supportingTMData.workedTime`
            let keyForTotalTimeManHoursForUnwind = `$checkSheet_data.totalPMTime.${financialYearWiseMonthKeyArray[j]}.supportingTMData`

            groupData = await Machine.aggregate([
                {
                    $match: {
                        line_names: ObjectId(line),
                        "checkSheet_data": { $ne: undefined },
                        $or: selectedYearOfCheckSheet,
                    }
                },
                { $addFields: { checkSheet_data: { $last: "$checkSheet_data" } } },
                {
                    $match: {
                        [keyOfTotalPMTime]: { $ne: undefined },
                        [keyOfTotalWorkedPMTime]: { $ne: undefined },
                        [keyofSupportingTMData]: { $ne: [] },
                        // "checkSheet_data.carriedPMStatus": { $ne: undefined },
                    }
                },
                {
                    $unwind: keyForTotalTimeManHoursForUnwind
                },
                {
                    $group: {
                        _id: "$line_names",
                        machine: { $push: { machine_code: "$machine_code", machine_name: "$machine_name" } },
                        totalTimeManHours: {
                            $sum: keyForTotalTimeManHoursForSum
                        },

                    },
                },
                {
                    $project: {
                        _id: 0,
                        line_names: "$_id",
                        machine: 1,
                        "totalTimeManHours": 1,
                    }
                },
            ])

            if (groupData.length > 0) {
                sumOfTotalTimeManHoursOfLineWise = groupData[0].totalTimeManHours
            }
            if (sumOfTotalTimeManHoursOfLineWise) {
                totalTimeManHoursMonthWiseOfLineWise.push(sumOfTotalTimeManHoursOfLineWise)
            } else {
                totalTimeManHoursMonthWiseOfLineWise.push(0)
            }
        }

        res.json({totalTimeManHoursMonthWiseOfLineWise })

    } catch (error) {
        console.log(error)
        console.log("User id not received!!!");
    }
})


//below API for get data for actual time taken TM wise for perticular selected TM name

router.post('/postPerticularOperatorToGetDataForActualTimeTakenTMWise', authenticate, async (req, res) => {
    try {
        let { section, tm_no } = req.body
        // console.log(tm_no)
        let selectedYear = "2022-2023"
        let loggedUserData = req.rootUser;
        let sectionSplit = section.split("-")
        const sectionInfo = await Section.findOne({ section_id: sectionSplit[0] })
        // console.log("____________", sectionInfo[0]._id)
        let subSectionsData, subSectionIdArray = [], cellData, cellIdArray = [], lineData, lineIdArray = [], machineData, machineDataForChecksheet, subsectionSplitIdArrayForChecksheet = []
        subSectionsData = await SubSection.find({ section_names: sectionInfo._id }).sort({ subSection_sequence: 1 })
        for (let i = 0; i < subSectionsData.length; i++) {
            subSectionIdArray.push(subSectionsData[i]._id);
        }
        cellData = await Cell.find({ subSection_names: { $in: subSectionIdArray } }).sort({ cell_sequence: 1 });
        for (let i = 0; i < cellData.length; i++) {
            cellIdArray.push(cellData[i]._id);
        }
        lineData = await Line.find({ cell_names: { $in: cellIdArray } }).sort({ line_sequence: 1 });
        for (let i = 0; i < lineData.length; i++) {
            lineIdArray.push(lineData[i]._id);
        }
        // console.log(lineData)
        let currentYear =
            new Date().getMonth() <= 3
                ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
                : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
        let selectedYearOfCheckSheet =
            selectedYear === currentYear ?
                [
                    {
                        "checkSheet_data.current_year": selectedYear
                    },
                    {
                        "checkSheet_data": []
                    }
                ] : [
                    {
                        "checkSheet_data.current_year": selectedYear
                    },
                ]
        // console.log(selectedYear)
        let groupData
        let allData = []
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
        const financialYearWiseMonthKeyArray = ['Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']

        let actualTotalTimeTakenOfTM = [];
        // console.log(i, "------->")
        for (let j = 0; j < monthKeyArray.length; j++) {
            let sumOfActualTimeTakenTM

            for (let i = 0; i < lineData.length; i++) {
                let keyOfTotalPMTime = `checkSheet_data.totalPMTime.${financialYearWiseMonthKeyArray[j]}`
                let keyOfTotalWorkedPMTime = `checkSheet_data.totalPMTime.${financialYearWiseMonthKeyArray[j]}.totalWorkedPMTime`

                // let previousMonth = monthKeyArray[j - 1] === undefined ? monthKeyArray.splice(-1)[0] : monthKeyArray[j - 1]
                let keyofSupportingTMData = `checkSheet_data.totalPMTime.${financialYearWiseMonthKeyArray[j]}.supportingTMData`
                let keyForTotalTimeManHoursForSum = `$checkSheet_data.totalPMTime.${financialYearWiseMonthKeyArray[j]}.supportingTMData.workedTime`
                let keyForTotalTimeManHoursForUnwind = `$checkSheet_data.totalPMTime.${financialYearWiseMonthKeyArray[j]}.supportingTMData`

                let keyForTM_no = `checkSheet_data.totalPMTime.${financialYearWiseMonthKeyArray[j]}.supportingTMData.tm_no`


                groupData = await Machine.aggregate([
                    {
                        $match: {
                            line_names: lineData[i]._id,
                            "checkSheet_data": { $ne: undefined },
                            $or: selectedYearOfCheckSheet,
                        }
                    },
                    { $addFields: { checkSheet_data: { $last: "$checkSheet_data" } } },
                    {
                        $match: {
                            [keyOfTotalPMTime]: { $ne: undefined },
                            [keyOfTotalWorkedPMTime]: { $ne: undefined },
                            [keyofSupportingTMData]: { $ne: [] },
                            // "checkSheet_data.carriedPMStatus": { $ne: undefined },
                        }
                    },
                    {
                        $unwind: keyForTotalTimeManHoursForUnwind
                    },
                    {
                        $match: {
                           [keyForTM_no] : parseInt(tm_no)
                        }
                    },
                    {
                        $group: {
                            _id: "$line_names",
                            machine: { $push: { machine_code: "$machine_code", machine_name: "$machine_name" } },
                            actualTotalTimeTM: {
                                $sum: keyForTotalTimeManHoursForSum
                            },

                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            line_names: "$_id",
                            machine: 1,
                            "actualTotalTimeTM": 1,
                            // "checkSheet_data.totalPMTime": 1

                        }
                    },
                ])
                // console.log(financialYearWiseMonthKeyArray[j],"---------------", groupData)

                if (groupData.length > 0) {
                    sumOfActualTimeTakenTM = groupData[0].actualTotalTimeTM
                }

            }
            // console.log("---------------", groupData)

            if (sumOfActualTimeTakenTM) {
                actualTotalTimeTakenOfTM.push(sumOfActualTimeTakenTM)
            } else {
                actualTotalTimeTakenOfTM.push(0)
            }
        }
        // console.log(actualTotalTimeTakenOfTM)
        res.json({ actualTotalTimeTakenOfTM })

    } catch (error) {
        console.log(error)
        console.log("User id not received!!!");
    }
})

module.exports = router;