const dotenv = require("dotenv");
const express = require("express");
const app = express();
const path = require("path");
dotenv.config({ path: "./config.env" });
const https = require("https");
const fs = require("fs");
const compression = require("compression");

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
  express.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }),
);

app.use(
  compression({
    filter: (req, res) =>
      req.headers["x-no-compression"] ? false : compression.filter(req, res),
  }),
);

//for when deploying application on AWS

// const keys = {
//   key: fs.readFileSync(process.env.CERTIFICATE_KEY),
//   cert: fs.readFileSync(process.env.CERTIFICATE_CRT),
// };

// const { dummyCron } = require(path.join(__dirname, "./controller/dummyCron"));
// dummyCron();

// One-off Spare Master load from a parts-master workbook. Left commented: it is
// run by hand when a new/updated Excel arrives, not on every boot. Omit
// `commit` for a dry run that validates and reports without writing anything.
// const {
//   runSpareMasterImport,
// } = require(path.join(__dirname, "./scripts/importSpareMaster"));
// runSpareMasterImport({
//   filePath: "Old Master data/dbo_VM_PartsMaster-All Data31-08-2026.xlsx",
//   commit: true,
//   tmNo: 89898,
// });

// Catch-up sweep that raises a REORDER request-sheet for every master already at
// or below its minimum level. The per-issuance trigger only sees the one part
// just issued, so a bulk-loaded catalogue needs this once. Safe to re-run — an
// open reorder for a part blocks a second one. Omit `commit` to dry-run and just
// write the skipped-parts report.
// const {
//   runReorderGeneration,
// } = require(path.join(__dirname, "./scripts/generateReorderSheets"));
// runReorderGeneration({ commit: true, tmNo: 89898 });

app.use(require(path.join(__dirname, "./controller/auth")));
app.use(require(path.join(__dirname, "./controller/bmController")));
app.use(require(path.join(__dirname, "./controller/cmcontroller")));
app.use(
  "/v1/spare",
  require("./middleware/authenticate"),
  express.static(path.join(__dirname, "spareDocuments")),
  require("./routes/spareManagement/userRoutes"),
  require("./routes/spareManagement/spareCRUDRoutes"),
  require("./routes/spareManagement/spareApprovalRoutes"),
  require("./routes/spareManagement/spareDynamicApprovalRoutes"),
  require("./routes/spareManagement/sparePartOrderTrackingRoutes"),
  require("./routes/spareManagement/sparePartSearchRoutes"),
  require("./routes/spareManagement/spareMasterRoutes"),
  require("./routes/spareManagement/spareIssuanceSummaryRoutes"),
  require("./routes/spareManagement/spareBudgetManagementRoutes"),
  require("./routes/spareManagement/spareCustomizeFieldsRoutes"),
  require("./routes/spareManagement/spareKPIRoutes"),
);

app.use(
  "/common",
  require(path.join(__dirname, "./controller/commonController")),
);

require(
  path.join(
    __dirname,
    "./controller/autoMailSendStartingOfEveryMonthController",
  ),
);
require(
  path.join(
    __dirname,
    "./controller/autoMailSendMidAndEndOfEveryMonthController",
  ),
);
require(
  path.join(__dirname, "./controller/autoUpdateAndSendMailForSixMonthApproval"),
);
require(path.join(__dirname, "./controller/financialYearController"));

//When deploying please comment this backup code
require(path.join(__dirname, "./controller/everyDayAutoBackup"));

require(path.join(__dirname, "./middleware/cronRunForRequestSheetOfCM"));

require(
  path.join(__dirname, "./sendMail/spare/returnTemporaryPartsReminder.js"),
);

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

//for CM Files uploaded by MTD user while creation of the CM sheet
app.use(express.static(path.join(__dirname, "AttachedFilesByAssignedUser")));

//for CM Files uploaded by MTD OperATOR user while filling the CM request-sheet
app.use(express.static(path.join(__dirname, "AttachedFilesByOperatorUser")));

//for User manual
app.use(express.static(path.join(__dirname, "UploadQRFile")));

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
