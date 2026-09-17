const mongoose = require("mongoose");

const tryCatchHandler = require("../errorHandler/tryCatchHandler");

/**
 * Builds the CM request-sheet hierarchy filter middleware.
 *
 * Kept as a factory so the two flavours below are plain modules: the regular CM
 * filter (filterMiddleware.js) and the one for sheets that keep their timestamp
 * at the document root (filterMiddlewareForRootTimeStamp.js). Each is a single
 * default export a route requires directly — nothing hangs off a function, so
 * a missing or stale file fails loudly at require time instead of handing a
 * route an undefined handler.
 */

const TIME_STAMP_YEAR = "preAggregationTimeStampOfRequestSheet.requestSheet_year";
const TIME_STAMP_MONTH =
  "preAggregationTimeStampOfRequestSheet.requestSheet_month";

/**
 * The year/month part of the filter.
 *
 * A regular CM sheet keeps its timestamp on each entry of the
 * commonDataFilledByAssignUser array, so the match has to be an $elemMatch. A
 * New-Machine-CM sheet keeps one timestamp on the document itself and has no
 * such array — matched the array way, no New-Machine-CM sheet could ever be
 * found, and the dashboard came up empty.
 */
const buildTimeStampFilter = ({ selectedYear, selectedMonth }, atRoot) => {
  const period = {
    ...(selectedYear ? { [TIME_STAMP_YEAR]: selectedYear } : {}),
    ...(selectedMonth ? { [TIME_STAMP_MONTH]: selectedMonth } : {}),
  };

  if (!Object.keys(period).length) return {};

  return atRoot
    ? period
    : { commonDataFilledByAssignUser: { $elemMatch: period } };
};

const createFilterMiddleware = ({ timeStampAtRoot = false } = {}) =>
  tryCatchHandler(async (req, res, next) => {
    try {
      let queryObj = buildTimeStampFilter(req.query || {}, timeStampAtRoot),
        queryObjForPM = {};

      if (req.params?.filter === "based-on-plant") {
        queryObj = {
          ...queryObj,
          plantRef: mongoose.Types.ObjectId(req.params?.selectedId),
        };

        queryObjForPM = {
          plant_names: mongoose.Types.ObjectId(req.params?.selectedId),
        };
      } else if (req.params?.filter === "based-on-section") {
        queryObj = {
          ...queryObj,
          sectionRef: mongoose.Types.ObjectId(req.params?.selectedId),
        };

        queryObjForPM = {
          section_names: mongoose.Types.ObjectId(req.params?.selectedId),
        };
      } else if (req.params?.filter === "based-on-subSection") {
        queryObj = {
          ...queryObj,
          subSectionRef: mongoose.Types.ObjectId(req.params?.selectedId),
        };

        queryObjForPM = {
          subSection_names: mongoose.Types.ObjectId(req.params?.selectedId),
        };
      } else if (req.params?.filter === "based-on-cell") {
        queryObj = {
          ...queryObj,
          cellRef: mongoose.Types.ObjectId(req.params?.selectedId),
        };

        queryObjForPM = {
          cell_names: mongoose.Types.ObjectId(req.params?.selectedId),
        };
      } else if (req.params?.filter === "based-on-line") {
        queryObj = {
          ...queryObj,
          lineRef: mongoose.Types.ObjectId(req.params?.selectedId),
        };

        queryObjForPM = {
          line_names: mongoose.Types.ObjectId(req.params?.selectedId),
        };
      } else if (req.params?.filter === "based-on-machine") {
        queryObj = {
          ...queryObj,
          machineRef: mongoose.Types.ObjectId(req.params?.selectedId),
        };

        queryObjForPM = {
          _id: mongoose.Types.ObjectId(req.params?.selectedId),
        };
      } else if (req.params?.filter === "based-on-requestSheetIdOfBM") {
        queryObj = {
          ...queryObj,
          requestSheetOfBMRef: mongoose.Types.ObjectId(req.params?.selectedId),
        };
      } else if (req.params?.filter === "based-on-requestSheetIdOfBM") {
        queryObj = {
          ...queryObj,
          requestSheetOfBMRef: mongoose.Types.ObjectId(req.params?.selectedId),
        };
      }

      req.queryObj = queryObj;
      req.queryObjForPM = queryObjForPM;
      next();
    } catch (error) {
      res.status(500).json({ message: error?.message, error });
    }
  });

module.exports = createFilterMiddleware;
