const dotenv = require("dotenv");
const express = require("express");
const app = express();
const path = require("path");
dotenv.config({ path: "./config.env" });

require("./db/conn");

require(path.join(__dirname, "./model/userSchema"));
require(path.join(__dirname, "./model/plantSchema"));
require(path.join(__dirname, "./model/sectionSchema"));
require(path.join(__dirname, "./model/subSectionSchema"));
require(path.join(__dirname, "./model/cellSchema"));
require(path.join(__dirname, "./model/lineSchema"));
require(path.join(__dirname, "./model/machineSchema"));

app.use(express.json({ limit: "50mb" }));
app.use(
  express.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 })
);

//for when deploying application on AWS

// const keys = {
//   key: fs.readFileSync(process.env.CERTIFICATE_KEY),
//   cert: fs.readFileSync(process.env.CERTIFICATE_CRT),
// };

// const { dummyCron } = require(path.join(__dirname, "./controller/dummyCron"));
// dummyCron();

app.use(require(path.join(__dirname, "./controller/auth")));
app.use(require(path.join(__dirname, "./controller/bmController")));
app.use(require(path.join(__dirname, "./controller/cmController")));
app.use(
  "/common",
  require(path.join(__dirname, "./controller/commonController"))
);

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

//When deploying please comment this backup code
// require(path.join(__dirname, "./controller/everyDayAutoBackup"));

require(path.join(__dirname, "./middleware/cronRunForRequestSheetOfCM"));

//for logos and other image
app.use(express.static(path.join(__dirname, "images")));
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
//for attachments
app.use(express.static(path.join(__dirname, "attachments")));
//for BM Image or Video By PRD User while generate request-sheet
app.use(express.static(path.join(__dirname, "ImagesOrVideoOfPRD")));
//for Other Loss BM Files
app.use(express.static(path.join(__dirname, "OtherLossFiles")));
//for User manual
app.use(express.static(path.join(__dirname, "manuals")));

// index file path
app.get("/*", (req, res) => {
  return res.status(200).sendFile(__dirname + "/build/index.html");
});

const PORT = process.env.PORT;

//for when deploying application on AWS
// const server = https.createServer(keys, app);

app.listen(PORT, () => {
  console.log(`server is running in port ${PORT} `);
});
