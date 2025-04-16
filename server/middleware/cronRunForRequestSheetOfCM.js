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
      // _id: mongoose.Types.ObjectId("67b3264523290745c8eb14e6"),
      "cmBasicDataFilledByMTD_TL.frequencyValue":
        typeof frequencyValue === "object" ? frequencyValue : "1/1 M",
    },
    {
      _id: 1,
      "cmBasicDataFilledByMTD_TL.frequencyValue": 1,
      "commonDataFilledByAssignUser.quarterlyDataOfTheCM.targetDateOfCM": 1,
    }
  );

  if (!requestSheets.length) return console.log("No records to update.");

  const bulkOps = requestSheets?.map((requestSheet) => {
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
      lastTargetDate =
        lastEntry?.quarterlyDataOfTheCM?.[
          lastEntry?.quarterlyDataOfTheCM?.length - 1
        ]?.targetDateOfCM;
    }

    let splitTheFrequencyForTheAddValue =
      requestSheet?.cmBasicDataFilledByMTD_TL?.frequencyValue?.split(" ");

    const newTargetDate = lastTargetDate
      ? moment(lastTargetDate)
          .add(
            splitTheFrequencyForTheAddValue?.[0]?.split("/")[1] === "Y"
              ? 1
              : splitTheFrequencyForTheAddValue?.[0]?.split("/")[1],
            splitTheFrequencyForTheAddValue?.[1] === "M" ? "months" : "years"
          )
          .format("YYYY-MM-DDTHH:mm")
      : moment().format("YYYY-MM-DDTHH:mm");

    let quarterlyDataEntries;

    if (requestSheet?.cmBasicDataFilledByMTD_TL?.frequencyValue === "1/3 M") {
      if (moment().diff(lastTargetDate, "months") === 3) {
        quarterlyDataEntries = [
          {
            requestSheet_quarter: getFinancialQuarter(moment()),
            statusOfPlannedCM: "Planned",
            targetDateOfCM: newTargetDate,
            requestSheetStatusOfCM: "Generated",
          },
        ];
      }
    } else {
      quarterlyDataEntries = [
        {
          requestSheet_quarter: getFinancialQuarter(moment()),
          statusOfPlannedCM: "Planned",
          targetDateOfCM: newTargetDate,
          requestSheetStatusOfCM: "Generated",
        },
      ];
    }

    if (requestSheet?.cmBasicDataFilledByMTD_TL?.frequencyValue === "1/6 M") {
      quarterlyDataEntries?.push({
        requestSheet_quarter: getFinancialQuarter(moment().add(6, "months")),
        statusOfPlannedCM: "Planned",
        targetDateOfCM: moment(newTargetDate)
          .add(6, "months")
          .format("YYYY-MM-DDTHH:mm"),
        requestSheetStatusOfCM: "Generated",
      });
    }

    return {
      updateOne: {
        filter: { _id: requestSheet?._id },
        update: {
          $push: {
            commonDataFilledByAssignUser: {
              preAggregationTimeStampOfRequestSheet: {
                requestSheet_year: currentYear,
                requestSheet_month: gettingMonthForSelectedDate(moment()),
              },
              quarterlyDataOfTheCM: { $each: quarterlyDataEntries },
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
    let valueOfTheFunction = await commonDataAdditionForOncePerMonthAndThree([
      "1/1 M",
      "1/3 M",
    ]);
    if (valueOfTheFunction?.length) {
      const result = await RequestSheetOfCM.bulkWrite(valueOfTheFunction);
    }
  } catch (error) {
    console.log(error);
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
  }
});

cron.schedule("0 0 1 4 *", async () => {
  try {
    const valueOfTheFunction = await commonDataAdditionForOncePerMonthAndThree([
      "1/6 M",
      "1/Y",
      "1/2 Y",
      "1/3 Y",
      "1/4 Y",
    ]);
    if (valueOfTheFunction?.length) {
      const result = await RequestSheetOfCM.bulkWrite(valueOfTheFunction);
    }
  } catch (error) {
    console.log(error);
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
  }
});

// const valueOfTheFunction = commonDataAdditionForOncePerMonthAndThree([
//   "1/6 M",
//   "1/Y",
//   "1/2 Y",
//   "1/3 Y",
//   "1/4 Y",
// ]);

// console.log(valueOfTheFunction);