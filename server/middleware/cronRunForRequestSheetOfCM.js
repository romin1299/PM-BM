const cron = require("node-cron");
const mongoose = require("mongoose");
const RequestSheetOfCM = require("../model/requestSheetDataOfCM");
const { currentYear } = require("../GlobalData/RequestSheetApprovalStatus");
const moment = require("moment");
const {
  gettingMonthForSelectedDate,
  getFinancialQuarter,
} = require("./gettingFYMonthForPreAgg");

const commonDataAdditionForOncePerMonthAndThree = async (frequencyValue) => {
  const requestSheets = await RequestSheetOfCM.find(
    {
      // _id: mongoose.Types.ObjectId("67b2e18e0ed27a39afcdf206"),
      "cmBasicDataFilledByMTD_TL.frequencyValue":
        frequencyValue === "1/1 M" ? "1/1 M" : "1/3 M",
    },
    {
      _id: 1,
      "commonDataFilledByAssignUser.quarterlyDataOfTheCM.targetDateOfCM": 1,
    }
  );

  if (!requestSheets.length) return console.log("No records to update.");

  const bulkOps = requestSheets.map((requestSheet) => {
    let lastTargetDate;

    // Extract the most recent targetDateOfCM
    if (
      requestSheet?.commonDataFilledByAssignUser?.length &&
      requestSheet?.commonDataFilledByAssignUser?.[0]?.quarterlyDataOfTheCM
    ) {
      const lastEntry =
        requestSheet?.commonDataFilledByAssignUser?.[
          requestSheet?.commonDataFilledByAssignUser?.length - 1
        ];
      lastTargetDate = lastEntry.quarterlyDataOfTheCM?.[0]?.targetDateOfCM;
    }
    const newTargetDate = lastTargetDate
      ? moment(lastTargetDate)
          .add(frequencyValue === "1/1 M" ? 1 : 3, "month")
          .format("YYYY-MM-DDTHH:mm")
      : moment().format("YYYY-MM-DDTHH:mm");

    return {
      updateOne: {
        filter: { _id: requestSheet._id },
        update: {
          $push: {
            commonDataFilledByAssignUser: {
              preAggregationTimeStampOfRequestSheet: {
                requestSheet_year: currentYear,
                requestSheet_month: gettingMonthForSelectedDate(moment()),
              },
              quarterlyDataOfTheCM: {
                requestSheet_quarter: getFinancialQuarter(moment()),
                statusOfPlannedCM: "Planned",
                targetDateOfCM: newTargetDate,
                requestSheetStatusOfCM: "Generated",
              },
            },
          },
        },
      },
    };
  });

  return bulkOps;
};

cron.schedule("0 0 1 * *", async () => {
  try {
    const valueOfTheFunction =
      await commonDataAdditionForOncePerMonthAndThree("1/1 M");
    console.log("---", valueOfTheFunction)
    if (valueOfTheFunction?.length) {
      const result = await RequestSheetOfCM.bulkWrite(valueOfTheFunction);
      console.log(`Updated ${result.modifiedCount} request sheets.`);
    }
  } catch (error) {
    console.log(error);
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
  }
});

cron.schedule("* * * */3 *", async () => {
  try {
    const valueOfTheFunction =
      await commonDataAdditionForOncePerMonthAndThree("1/3 M");

    if (valueOfTheFunction?.length) {
      const result = await RequestSheetOfCM.bulkWrite(valueOfTheFunction);
      console.log(`Updated ${result.modifiedCount} request sheets 3.`);
    }
  } catch (error) {
    console.log(error);
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
  }
});
