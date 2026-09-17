const createFilterMiddleware = require("./createFilterMiddleware");

/**
 * The same hierarchy filter for sheets that carry their year/month on the
 * document itself (New-Machine-CM) rather than on the per-quarter array.
 */
module.exports = createFilterMiddleware({ timeStampAtRoot: true });
