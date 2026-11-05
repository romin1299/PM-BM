const logger = require("../utils/LoggingController/loggers");
const maintenanceType = require("../utils/maintenanceType");

/**
 * Guarantees that every request is answered.
 *
 * Across the controllers there are 155 catch blocks that log the error and
 * return nothing — no `res.json`, no `res.status`. The request then never
 * completes: the browser spins forever, and on the server the request keeps
 * its memory and its socket until Node's own 5-minute timeout. Under load
 * those accumulate alongside everything else and help push the process into
 * the heap limit.
 *
 * Fixing all 155 by hand is a large, risky diff. This does the same job from
 * one place and cannot change any working path: it only acts on requests that
 * would otherwise have hung, turning a permanent hang into a 503 the front end
 * can react to.
 *
 * It also names the route that hung, so the underlying catch blocks can be
 * fixed from evidence instead of guesswork.
 */
/**
 * Deliberately generous. The heaviest dashboards genuinely take tens of
 * seconds under load, and cutting those off would turn a slow page into a
 * broken one. This only has to be shorter than forever: it exists to release
 * requests that were never going to be answered at all.
 */
const DEFAULT_TIMEOUT_MS = 120_000;

const responseGuard = ({ timeoutMs = DEFAULT_TIMEOUT_MS } = {}) =>
  function guardResponse(req, res, next) {
    const timer = setTimeout(() => {
      if (res.headersSent || res.writableEnded) return;

      const route = `${req.method} ${req.originalUrl.split("?")[0]}`;
      const message = `Request was never answered by its handler after ${timeoutMs}ms: ${route}`;

      console.error(`UNANSWERED REQUEST: ${route}`);
      try {
        logger.error(new Error(message), {
          maintenanceType: maintenanceType?.[0],
        });
      } catch {
        // Logging must never be the reason a request stays open.
      }

      res
        .status(503)
        .json({ message: "Server could not complete this request. Please retry." });
    }, timeoutMs);

    // Clear on every way a response can finish, so a normal request costs
    // nothing but one timer that is torn down again.
    const clear = () => clearTimeout(timer);
    res.on("finish", clear);
    res.on("close", clear);

    next();
  };

module.exports = responseGuard;
