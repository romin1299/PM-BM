const dotenv = require('dotenv')
const express = require('express');
const app = express();
const path = require('path');

dotenv.config({ path: './config.env' })


require('./db/conn')

require(path.join(__dirname, './model/userSchema'))
require(path.join(__dirname, './model/plantSchema'))
require(path.join(__dirname, './model/sectionSchema'))
require(path.join(__dirname, './model/subSectionSchema'))
require(path.join(__dirname, './model/cellSchema'))
require(path.join(__dirname, './model/lineSchema'))
require(path.join(__dirname, './model/machineSchema'))

app.use(express.json())

app.use(require(path.join(__dirname, './controller/auth')));



require(path.join(__dirname, './controller/autoMailSendStartingOfEveryMonthController'));
require(path.join(__dirname, './controller/autoMailSendMidAndEndOfEveryMonthController'));
require(path.join(__dirname, './controller/autoUpdateAndSendMailFor6MonthApproval'));


//for logos and other image
app.use(express.static(path.join(__dirname, 'images')));
// build folder path 
app.use(express.static(path.join(__dirname, 'build')));
//for PM images
app.use(express.static(path.join(__dirname, 'PMimages')));
//for PM data-sheets
app.use(express.static(path.join(__dirname, 'data_sheets')));

// index file path
app.get('/*', (req, res) => {
    return res.status(200).sendFile(__dirname + '/build/index.html')
})

const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log(`server is running in port ${PORT} `)
})
