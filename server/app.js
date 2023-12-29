const dotenv = require("dotenv");
const express = require("express");
const app = express();
const path = require("path");

const Line = require("./model/lineSchema");

dotenv.config({ path: "./config.env" });

require("./db/conn");

require(path.join(__dirname, "./model/userSchema"));
require(path.join(__dirname, "./model/plantSchema"));
require(path.join(__dirname, "./model/sectionSchema"));
require(path.join(__dirname, "./model/subSectionSchema"));
require(path.join(__dirname, "./model/cellSchema"));
require(path.join(__dirname, "./model/lineSchema"));
require(path.join(__dirname, "./model/machineSchema"));

app.use(express.json());

app.use(require(path.join(__dirname, "./controller/auth")));
app.use(require(path.join(__dirname, "./controller/bmController")));

require(path.join(
  __dirname,
  "./controller/autoMailSendStartingOfEveryMonthController"
));
require(path.join(
  __dirname,
  "./controller/autoMailSendMidAndEndOfEveryMonthController"
));
require(path.join(
  __dirname,
  "./controller/autoUpdateAndSendMailForSixMonthApproval"
));
require(path.join(__dirname, "./controller/financialYearController"));
// require(path.join(__dirname, './controller/everyDayAutoBackup'));

//for logos and other image
app.use("/bm", express.static(path.join(__dirname, "images")));
// build folder path
app.use(express.static(path.join(__dirname, "build")));
//for PM images
app.use(express.static(path.join(__dirname, "PMimages")));
//for PM data-sheets
app.use(express.static(path.join(__dirname, "data_sheets")));

//for BM data-sheets
app.use(express.static(path.join(__dirname, "DataSheetOfBD")));
//for BM drawings
app.use(express.static(path.join(__dirname, "DrawingsOfBD")));

// index file path
app.get("/*", (req, res) => {
  return res.status(200).sendFile(__dirname + "/build/index.html");
});

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`server is running in port ${PORT} `);
});
