/**
 * HTTPS entry point — the one to run on a plant server.
 *
 * Identical to app.js except for how it listens: app.js serves plain HTTP for
 * local development, this serves HTTPS from the certificate pair named in
 * config.env.
 *
 *   node appServer.js
 *
 * Everything either file requires is shared, so routes and middleware behave
 * the same; only the listener and its startup checks differ.
 */
const dotenv = require("dotenv");
const express = require("express");
const app = express();
const path = require("path");
const https = require("https");
const fs = require("fs");
const compression = require("compression");

/**
 * Resolved against this file, not the working directory. Left relative, the
 * config is only found when the server happens to be started from its own
 * folder: a Windows service, Task Scheduler or a shortcut with the wrong
 * "Start in" loads nothing, and the first symptom is Mongoose reporting a
 * connection error while MongoDB itself is running perfectly.
 */
dotenv.config({ path: path.join(__dirname, "config.env") });

const CONFIG_FILE = path.join(__dirname, "config.env");

/**
 * Refuse to start without a signing key.
 *
 * Running on without one is worse than not running: /signIn cannot mint a
 * token, so every user who "logs in" is handed the cookie `Token=undefined`
 * and then fails every request with "jwt malformed" for the 12 hours that
 * cookie lives. A server that stops here is fixed in a minute; one that keeps
 * serving takes the shop floor down for half a day.
 */
if (!process.env.SECRET_KEY) {
  console.error(
    [
      "FATAL: SECRET_KEY is not set — refusing to start.",
      `config.env expected at: ${CONFIG_FILE}`,
      `server started from  : ${process.cwd()}`,
      "Without it no one can log in, and every login would hand the browser a",
      "broken session cookie lasting 12 hours.",
    ].join("\n  "),
  );
  process.exit(1);
}

/**
 * The TLS certificate pair, read once at startup.
 *
 * Both paths come from config.env, which keeps a commented-out pair per site
 * (Plant-1, Plant-2, Denso-India, Denso-Kirloskar) — so the usual mistake is
 * having none of them uncommented, or the wrong site's. Read without checking,
 * `fs.readFileSync(undefined)` throws ERR_INVALID_ARG_TYPE before a single
 * line is logged, and a wrong path throws a bare ENOENT; neither names the
 * setting at fault. On a machine where changing a file needs approvals, the
 * message has to say exactly what to fix.
 */
const readCertificate = (variable) => {
  const file = process.env[variable];

  if (!file) {
    console.error(
      [
        `FATAL: ${variable} is not set — refusing to start.`,
        `config.env expected at: ${CONFIG_FILE}`,
        "HTTPS needs both CERTIFICATE_KEY and CERTIFICATE_CRT. Uncomment the",
        "pair for this site in config.env (they are grouped per plant).",
      ].join("\n  "),
    );
    process.exit(1);
  }

  try {
    return fs.readFileSync(file);
  } catch (error) {
    console.error(
      [
        `FATAL: cannot read ${variable} — refusing to start.`,
        `path given : ${file}`,
        `${error?.code ?? "Error"}: ${error?.message ?? error}`,
        "Check the path, and that the account running the server can read it.",
      ].join("\n  "),
    );
    process.exit(1);
  }
};

const keys = {
  key: readCertificate("CERTIFICATE_KEY"),
  cert: readCertificate("CERTIFICATE_CRT"),
};

/**
 * Last-resort net, and the reason the server could disappear mid-shift.
 *
 * Node terminates the process on an unhandled promise rejection. Nothing here
 * registered a handler, so one stray async error anywhere — a failed query in
 * a helper with no response object to answer with — ended the server outright,
 * long after a clean start. The shop floor then has nothing at all.
 *
 * Staying up is the lesser harm for a maintenance logbook: the one request
 * that failed is lost, every other user carries on, and the reason is written
 * down with a timestamp so the cause can be found afterwards.
 */
const logFatal = (label) => (problem) => {
  const when = new Date().toLocaleString();
  console.error(`\n${label} at ${when} — server kept alive`);
  console.error(problem?.stack ?? problem);
  try {
    require(path.join(__dirname, "./utils/LoggingController/loggers")).error(
      problem instanceof Error ? problem : new Error(String(problem)),
      { maintenanceType: label },
    );
  } catch {
    // Never let the logger itself bring down the handler of last resort.
  }
};

process.on("unhandledRejection", logFatal("UNHANDLED REJECTION"));
process.on("uncaughtException", logFatal("UNCAUGHT EXCEPTION"));

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
    /**
     * Level 3 instead of zlib's default 6.
     *
     * Compression is pure single-threaded CPU, and that thread is the shared
     * bottleneck. On a 10.5 MB dashboard response, measured here: level 6
     * costs 133ms of CPU to reach 1.26 MB, level 3 costs 60ms to reach
     * 1.58 MB. Over the plant LAN the extra 320 KB crosses in a few
     * milliseconds, so level 3 finishes the request sooner AND hands 73ms of
     * CPU back per large response for other users. It was also the fastest of
     * every level tested over a 50 Mbps link, so remote users do not lose out.
     *
     * Invisible to clients: gzip is gzip, the browser decompresses the same
     * bytes either way.
     */
    level: Number(process.env.GZIP_LEVEL ?? 3),
    filter: (req, res) =>
      req.headers["x-no-compression"] ? false : compression.filter(req, res),
  }),
);

/**
 * Before the routes, so it covers every one of them: no request may hang
 * forever because a catch block logged its error and returned nothing.
 */
app.use(
  require(path.join(__dirname, "./middleware/responseGuard"))({
    timeoutMs: Number(process.env.REQUEST_TIMEOUT_MS) || 120_000,
  }),
);

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
  require("./routes/spareManagement/spareMasterStockLedgerRoutes"),
  require("./routes/spareManagement/spareChangeRequestRoutes"),
  require("./routes/spareManagement/spareDeleteRequestRoutes"),
  require("./routes/spareManagement/spareIssuanceSummaryRoutes"),
  require("./routes/spareManagement/spareBudgetManagementRoutes"),
  require("./routes/spareManagement/spareCustomizeFieldsRoutes"),
  require("./routes/spareManagement/spareKPIRoutes"),
);

app.use(
  "/common",
  require(path.join(__dirname, "./controller/commonController")),
);

/**
 * Scheduled work: the mail senders, the nightly backup and the CM crons.
 *
 * Registered on one process only. Run under cluster.js every worker is a full
 * copy of the app, so without this guard each monthly approval mail, each
 * reminder and each backup would fire once per worker and users would get
 * duplicate mail. cluster.js sets RUN_BACKGROUND_JOBS=no on all but the first
 * worker; unset — a plain `node appServer.js` — means yes, so single-process
 * behaviour is exactly as before.
 */
if (process.env.RUN_BACKGROUND_JOBS !== "no") {
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
    path.join(
      __dirname,
      "./controller/autoUpdateAndSendMailForSixMonthApproval",
    ),
  );
  require(path.join(__dirname, "./controller/financialYearController"));

  //When deploying please comment this backup code
  require(path.join(__dirname, "./controller/everyDayAutoBackup"));

  require(path.join(__dirname, "./middleware/cronRunForRequestSheetOfCM"));

  require(
    path.join(__dirname, "./sendMail/spare/returnTemporaryPartsReminder.js"),
  );

  require(
    path.join(__dirname, "./sendMail/spare/orderTrackingLeadTimeReminder.js"),
  );
} else {
  console.log(
    `worker ${process.env.WORKER_INDEX ?? "?"}: serving requests only (scheduled jobs run on worker 0)`,
  );
}

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
// Detail sheets attached to a New-Machine-CM modification request, and the
// work photos MTD adds to it; both land in this folder.
app.use(
  express.static(path.join(__dirname, "AttachedPhotosOfNewMachineCMByMTD")),
);
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

const server = https.createServer(keys, app);

/**
 * Bound how long a single request may occupy the process.
 *
 * Node's own default is 5 minutes. A request held that long keeps its result
 * set, its JSON and its socket alive the whole time, and it is the number of
 * requests alive at once that decides whether the heap runs out. Cutting the
 * ceiling to a minute means a stuck request releases its memory in a minute
 * instead of five — fewer alive at any moment, which is the difference between
 * degrading and aborting.
 *
 * Generous on purpose: the heaviest dashboards legitimately take tens of
 * seconds today, so this must not cut off work that would have succeeded.
 */
/**
 * Kept above the responseGuard window on purpose. The guard answers with a
 * readable 503; Node's own timeout just destroys the socket, which the browser
 * reports as a network error. Leaving headroom means the guard always gets
 * there first and the client is told what happened.
 */
const GUARD_MS = Number(process.env.REQUEST_TIMEOUT_MS) || 120_000;
server.requestTimeout = GUARD_MS + 15_000;
server.headersTimeout = server.requestTimeout + 5_000;
server.keepAliveTimeout = 65_000;

server.listen(PORT, () => {
  console.log(
    `server is running in port ${PORT} (https)` +
      (process.env.WORKER_INDEX !== undefined
        ? ` [worker ${process.env.WORKER_INDEX}, pid ${process.pid}]`
        : ""),
  );
});

/**
 * A server that cannot take the port has to stop, and say why.
 *
 * This is the one failure the net above must not swallow: left alive, the
 * process sits there having bound nothing, so a deploy looks like it started
 * while the old copy is still the one answering — which is how you end up
 * believing new code is live when it is not.
 */
server.on("error", (error) => {
  if (error?.code === "EADDRINUSE")
    console.error(
      [
        `FATAL: port ${PORT} is already in use — another copy of this server is still running.`,
        "Stop it first, then start this one:",
        `  netstat -ano | findstr :${PORT}`,
        "  taskkill /PID <pid> /F",
      ].join("\n  "),
    );
  else console.error(`FATAL: could not listen on port ${PORT}`, error);

  process.exit(1);
});
