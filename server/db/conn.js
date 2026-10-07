const path = require("path");
const mongoose = require("mongoose");

const DB = process.env.DATABASE;
const CONFIG_FILE = path.join(__dirname, "..", "config.env");

/** The URI without its credentials, so a startup log cannot leak a password. */
const withoutCredentials = (uri) =>
  String(uri).replace(/\/\/[^/@]*@/, "//<credentials>@");

/**
 * `DATABASE` is read from config.env, which app.js loads by absolute path.
 *
 * It used to be loaded relative to the working directory, so starting the
 * server from anywhere but its own folder — a Windows service, Task Scheduler,
 * a shortcut with the wrong "Start in" — found no config at all. Nothing then
 * connected, and because Mongoose queues queries while disconnected the
 * symptom surfaced request by request as "Operation `users.findOne()`
 * buffering timed out after 10000ms": every page hanging ten seconds before
 * failing, which reads as a slow database rather than a missing config file.
 *
 * A missing DATABASE cannot fix itself, so the server stops instead of
 * limping. An unreachable one can — mongod gets restarted, a network blip
 * ends — so that case keeps running and lets Mongoose reconnect.
 */
if (!DB) {
  console.error(
    [
      "FATAL: DATABASE is not set — refusing to start.",
      `config.env expected at: ${CONFIG_FILE}`,
      `server started from  : ${process.cwd()}`,
      "Nothing would connect, and every request would hang for 10 seconds",
      "before failing with a buffering timeout.",
    ].join("\n  "),
  );
  process.exit(1);
}

mongoose
  .connect(DB)
  .then(async () => {
    console.log(`connection successful Mongodb (${withoutCredentials(DB)})`);
    const RequestSheetOfSpare = require("../model/requestSheetDataOfSpare");
    const SpareMaster = require("../model/spareMasterSchema");
    await RequestSheetOfSpare.syncIndexes();
    await SpareMaster.createIndexes();
  })
  .catch((error) => {
    console.error(
      [
        `MongoDB NOT connected: ${withoutCredentials(DB)}`,
        `${error?.name ?? "Error"}: ${error?.message ?? error}`,
        "Until this connects, every request hangs ~10s and then fails with a",
        "buffering timeout. Check that mongod is listening on that host/port,",
        "and that any credentials and authSource in the URI match this server.",
      ].join("\n  "),
    );
  });

/**
 * Connection state, logged as it changes. Without this a database that drops
 * mid-shift is invisible: the only trace is a burst of buffering timeouts in
 * the request logs, with nothing saying when the link went or came back.
 */
mongoose.connection.on("disconnected", () =>
  console.error(
    `MongoDB disconnected at ${new Date().toLocaleString()} — requests will buffer until it returns`,
  ),
);
mongoose.connection.on("reconnected", () =>
  console.log(`MongoDB reconnected at ${new Date().toLocaleString()}`),
);
mongoose.connection.on("error", (error) =>
  console.error(`MongoDB connection error: ${error?.message ?? error}`),
);
