/**
 * Optional multi-process launcher.
 *
 * One Node process is one CPU core, and an out-of-memory abort in it takes the
 * whole application down — the shop floor then has nothing until someone
 * restarts it by hand. Run through here and the app is several processes
 * sharing port 7000: a worker that dies is replaced within a second while the
 * others keep serving, and the work spreads across the cores.
 *
 * OFF BY DEFAULT. With no CLUSTER_WORKERS set this simply runs the entry file
 * in-process, behaving exactly as `node app.js` does today, so deploying
 * it changes nothing until the setting is added.
 *
 *   node cluster.js                      -> single process (unchanged)
 *   CLUSTER_WORKERS=4 node cluster.js    -> 4 workers, auto-restarted
 *   CLUSTER_WORKERS=max node cluster.js  -> one worker per core
 *
 * Pick the entry with CLUSTER_ENTRY. The default, app.js, listens over plain
 * HTTP; appServer.js is the HTTPS one. Set CLUSTER_ENTRY=appServer.js to serve
 * TLS directly from node.
 *
 * With CLUSTER_WORKERS unset or 1 this file requires the entry in the current
 * process and forks nothing, so it behaves exactly like running `node app.js`
 * by hand - while still setting the working directory and the heap limit.
 */
const cluster = require("cluster");
const os = require("os");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "config.env") });

const ENTRY = process.env.CLUSTER_ENTRY || "app.js";
const requested = String(process.env.CLUSTER_WORKERS ?? "").toLowerCase();
const workerCount =
  requested === "max"
    ? os.cpus().length
    : Number.isFinite(Number(requested))
      ? Number(requested)
      : 0;

/** Restarting faster than this means the worker is failing at boot, not under load. */
const MIN_UPTIME_MS = 5_000;
const RESTART_BACKOFF_MS = 2_000;

if (workerCount < 2) {
  // Nothing to gain from a primary that supervises a single worker.
  require(path.join(__dirname, ENTRY));
} else if (cluster.isPrimary) {
  console.log(
    `cluster: starting ${workerCount} workers of ${ENTRY} (${os.cpus().length} cores available)`,
  );

  const startedAt = new Map();

  const start = (index) => {
    /**
     * Only one worker may run the crons and the mail senders. Every worker is
     * a full copy of the app, so without this the monthly approval mails, the
     * reminder mails and the nightly backup would each fire once per worker —
     * users would get duplicate mail, which is worse than the problem this
     * launcher solves.
     */
    const worker = cluster.fork({
      RUN_BACKGROUND_JOBS: index === 0 ? "yes" : "no",
      WORKER_INDEX: String(index),
    });

    startedAt.set(worker.id, Date.now());
    worker.on("exit", (code, signal) => {
      const uptime = Date.now() - (startedAt.get(worker.id) ?? Date.now());
      startedAt.delete(worker.id);

      const why = signal ? `signal ${signal}` : `code ${code}`;
      console.error(
        `cluster: worker ${worker.process.pid} (slot ${index}) exited with ${why} after ${Math.round(uptime / 1000)}s — restarting`,
      );

      // A worker that dies immediately is misconfigured; pausing stops a
      // restart loop from pinning the CPU while the logs fill up.
      setTimeout(
        () => start(index),
        uptime < MIN_UPTIME_MS ? RESTART_BACKOFF_MS : 0,
      );
    });
  };

  for (let index = 0; index < workerCount; index++) start(index);

  // Ctrl-C / service stop should take the workers with it, not orphan them.
  for (const signal of ["SIGINT", "SIGTERM"])
    process.on(signal, () => {
      console.log(`cluster: ${signal} — stopping workers`);
      for (const id in cluster.workers) cluster.workers[id]?.kill();
      process.exit(0);
    });
} else {
  require(path.join(__dirname, ENTRY));
}
