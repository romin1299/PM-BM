const mongoose = require("mongoose");

const tryCatchHandler = require("../errorHandler/tryCatchHandler");

// module.exports = tryCatchHandler(async (req, res, next) => {
//   try {
//     let queryObj = {},
//       queryObjForPM = {};

//     if (req.query?.selectedYear) {
//       queryObj = {
//         $or: [
//           {
//             commonDataFilledByAssignUser: {
//               $elemMatch: {
//                 "preAggregationTimeStampOfRequestSheet.requestSheet_year":
//                   req.query?.selectedYear,
//               },
//             },
//           },
//           {
//             "preAggregationTimeStampOfRequestSheet.requestSheet_year":
//               req.query?.selectedYear,
//           },
//         ],
//       };
//     }

//     if (req.query?.selectedMonth) {
//       queryObj = {
//         ...queryObj,
//         commonDataFilledByAssignUser: {
//           $elemMatch: {
//             "preAggregationTimeStampOfRequestSheet.requestSheet_month":
//               req.query?.selectedMonth,
//           },
//         },
//         "preAggregationTimeStampOfRequestSheet.requestSheet_month":
//           req.query?.selectedMonth,
//       };
//     }

//     if (req.params?.filter === "based-on-plant") {
//       queryObj = {
//         ...queryObj,
//         plantRef: mongoose.Types.ObjectId(req.params?.selectedId),
//       };

//       queryObjForPM = {
//         plant_names: mongoose.Types.ObjectId(req.params?.selectedId),
//       };
//     } else if (req.params?.filter === "based-on-section") {
//       queryObj = {
//         ...queryObj,
//         sectionRef: mongoose.Types.ObjectId(req.params?.selectedId),
//       };

//       queryObjForPM = {
//         section_names: mongoose.Types.ObjectId(req.params?.selectedId),
//       };
//     } else if (req.params?.filter === "based-on-subSection") {
//       queryObj = {
//         ...queryObj,
//         subSectionRef: mongoose.Types.ObjectId(req.params?.selectedId),
//       };

//       queryObjForPM = {
//         subSection_names: mongoose.Types.ObjectId(req.params?.selectedId),
//       };
//     } else if (req.params?.filter === "based-on-cell") {
//       queryObj = {
//         ...queryObj,
//         cellRef: mongoose.Types.ObjectId(req.params?.selectedId),
//       };

//       queryObjForPM = {
//         cell_names: mongoose.Types.ObjectId(req.params?.selectedId),
//       };
//     } else if (req.params?.filter === "based-on-line") {
//       queryObj = {
//         ...queryObj,
//         lineRef: mongoose.Types.ObjectId(req.params?.selectedId),
//       };

//       queryObjForPM = {
//         line_names: mongoose.Types.ObjectId(req.params?.selectedId),
//       };
//     } else if (req.params?.filter === "based-on-machine") {
//       queryObj = {
//         ...queryObj,
//         machineRef: mongoose.Types.ObjectId(req.params?.selectedId),
//       };

//       queryObjForPM = {
//         _id: mongoose.Types.ObjectId(req.params?.selectedId),
//       };
//     } else if (req.params?.filter === "based-on-requestSheetIdOfBM") {
//       queryObj = {
//         ...queryObj,
//         requestSheetOfBMRef: mongoose.Types.ObjectId(req.params?.selectedId),
//       };
//     } else if (req.params?.filter === "based-on-requestSheetIdOfBM") {
//       queryObj = {
//         ...queryObj,
//         requestSheetOfBMRef: mongoose.Types.ObjectId(req.params?.selectedId),
//       };
//     }

//     req.queryObj = queryObj;
//     req.queryObjForPM = queryObjForPM;
//     next();
//   } catch (error) {
//     res.status(500).json({ message: error?.message, error });
//   }
// });

module.exports = tryCatchHandler(async (req, res, next) => {
  try {
    let queryObj = {},
      queryObjForPM = {};

    if (req.query?.selectedYear)
      queryObj = {
        commonDataFilledByAssignUser: {
          $elemMatch: {
            "preAggregationTimeStampOfRequestSheet.requestSheet_year":
              req.query?.selectedYear,
          },
        },
      };

    if (req.query?.selectedMonth) {
      if (queryObj?.commonDataFilledByAssignUser?.$elemMatch)
        queryObj.commonDataFilledByAssignUser.$elemMatch = {
          ...queryObj?.commonDataFilledByAssignUser?.$elemMatch,
          "preAggregationTimeStampOfRequestSheet.requestSheet_month":
            req.query?.selectedMonth,
        };
      else
        queryObj = {
          commonDataFilledByAssignUser: {
            $elemMatch: {
              "preAggregationTimeStampOfRequestSheet.requestSheet_month":
                req.query?.selectedMonth,
            },
          },
        };
    }

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
