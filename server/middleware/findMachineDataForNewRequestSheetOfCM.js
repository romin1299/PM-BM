const {
  getFinancialQuarter,
  gettingMonthForSelectedDate,
} = require("./gettingFYMonthForPreAgg");
const { globalReqSheetNo } = require("./globalReqSheetNo");
const moment = require("moment-timezone");
const timezone = "Asia/Kolkata";
const RequestSheetOfCM = require("../model/requestSheetDataOfCM");
const mongoose = require("mongoose");

const quarterlyDataAdd = (
  frequencyValue,
  assignUserForCM,
  frequencyType,
  targetDateOfCM,
  activityEndDateOfCM,
  requestSheetStatusOfCM
) => {
  const generalDateFormat = (propDate = new Date()) =>
    moment(propDate).tz("Asia/Kolkata").format("YYYY-MM-DDTHH:mm");

  const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];
  const plannedQuarter = getFinancialQuarter(targetDateOfCM); // Get the starting quarter
  const plannedQuarterIndex = QUARTERS.indexOf(plannedQuarter);
  const plannedData = [];

  const totalYears = 5; // Generate data for 4 years
  // let currentDate = moment(new Date()).tz(timezone);
  let currentDate = targetDateOfCM;

  let currentYear = moment(currentDate).year();

  if ([0, 1, 2]?.includes(moment(currentDate).month())) {
    currentYear -= 1;
  }

  // const currentQuarterIndex = Math.floor(moment(currentDate).month() / 3);
  let modifiedPlannedDateAndTimeOfCM;

  let yearlyDataObject1 = {
    preAggregationTimeStampOfRequestSheet: {},
    quarterlyDataOfTheCM: [],
  };

  if (["1/1 M", "1/3 M", "1/6 M", "1/Y", "1/5 Y"]?.includes(frequencyValue)) {
    yearlyDataObject1.preAggregationTimeStampOfRequestSheet = {
      requestSheet_year: `${currentYear}-${currentYear + 1}`,
      requestSheet_month: gettingMonthForSelectedDate(targetDateOfCM),
    };
    // quarterlyDataOfTheCM: [],

    yearlyDataObject1?.quarterlyDataOfTheCM?.push({
      targetDateOfCM: generalDateFormat(targetDateOfCM),
      requestSheet_quarter: getFinancialQuarter(targetDateOfCM),
      statusOfPlannedCM: "Planned",
      requestSheetStatusOfCM,
      assignUserForCM,
    });
    plannedData?.push(yearlyDataObject1);
  } else {
    for (let year = currentYear; year < currentYear + totalYears; year++) {
      const yearlyDataObject = {
        preAggregationTimeStampOfRequestSheet: {
          requestSheet_year: `${year}-${year + 1}`,
          requestSheet_month: gettingMonthForSelectedDate(targetDateOfCM),
        },
        quarterlyDataOfTheCM: [],
      };

      for (let i = 0; i < QUARTERS.length; i++) {
        const quarter = QUARTERS[i];
        let isPlanned = false;

        if (frequencyValue === "1/2 Y") {
          // Plan the starting quarter every two years
          const currentQuarter = (year - currentYear) * 4 + i;
          isPlanned = currentQuarter % 8 === plannedQuarterIndex;
        } else if (frequencyValue === "1/3 Y") {
          // Plan the starting quarter every three years
          const currentQuarter = (year - currentYear) * 4 + i;
          isPlanned = currentQuarter % 12 === plannedQuarterIndex;
        } else if (frequencyValue === "1/4 Y") {
          // Plan the starting quarter every four years
          // Plan the quarter 4 years later (not in between)
          // Current year plan: should happen in next cycle 4 years later
          if (year - currentYear >= 4 && (year - currentYear) % 4 === 0) {
            isPlanned = i === plannedQuarterIndex;
          }
        }
        // else if (frequencyValue === "1/6 M") {
        //   // Alternate quarters based on the starting quarter
        //   const alternatingQuarters = [
        //     plannedQuarterIndex,
        //     (plannedQuarterIndex + 2) % 4, // Alternate quarters
        //   ];
        //   if (year === currentYear) {
        //     // Current year: exclude past quarters

        //     if (
        //       alternatingQuarters.includes(i) &&
        //       i >= currentQuarterIndex &&
        //       currentQuarterIndex !== 0
        //     ) {
        //       isPlanned = true;
        //       modifiedPlannedDateAndTimeOfCM = targetDateOfCM;
        //     }
        //     // isPlanned =
        //     //   alternatingQuarters.includes(i) && i >= currentQuarterIndex;

        //     // if (alternatingQuarters.includes(i) && i >= currentQuarterIndex)
        //   } else {
        //     // Future years: alternate as per the pattern
        //     isPlanned = alternatingQuarters.includes(i);
        //   }
        // }
        let assignUserOnlyForFirstQuarterWhileGenerate = {};
        // Ensure that the starting quarter is planned for the current year
        if (year === currentYear && i === plannedQuarterIndex) {
          isPlanned = true;
          assignUserOnlyForFirstQuarterWhileGenerate = {
            assignUserForCM: assignUserForCM,
          };
        }

        if (isPlanned) {
          //for other frequency
          // console.log(
          //   frequencyValue,
          //   typeof frequencyValue,
          //   year,
          //   currentYear,
          // );
          // if (frequencyValue !== "1/6 M") {
          // }
          const changeTheYearOfThePlannedDateBasedOnTheFY = (passingYear) => {
            return [0, 1, 2]?.includes(moment(currentDate).month())
              ? passingYear + 1
              : passingYear;
          };
          modifiedPlannedDateAndTimeOfCM = targetDateOfCM.replace(
            changeTheYearOfThePlannedDateBasedOnTheFY(currentYear),
            changeTheYearOfThePlannedDateBasedOnTheFY(year)
          );
          yearlyDataObject?.quarterlyDataOfTheCM?.push({
            targetDateOfCM: generalDateFormat(
              modifiedPlannedDateAndTimeOfCM || targetDateOfCM
            ),
            requestSheet_quarter: quarter,
            statusOfPlannedCM: "Planned",
            ...assignUserOnlyForFirstQuarterWhileGenerate,
            requestSheetStatusOfCM,
            activityEndDateOfCM: activityEndDateOfCM
              ? generalDateFormat(
                  moment(
                    generalDateFormat(
                      modifiedPlannedDateAndTimeOfCM || targetDateOfCM
                    )
                  ).add(activityEndDateOfCM, "days")
                )
              : targetDateOfCM,
          });

          // if (frequencyValue === "1/6 M") {
          //   modifiedPlannedDateAndTimeOfCM = moment(
          //     modifiedPlannedDateAndTimeOfCM || targetDateOfCM
          //   ).add(6, "month");
          // }
        }
      }

      if (yearlyDataObject?.quarterlyDataOfTheCM?.length > 0) {
        plannedData?.push(yearlyDataObject);
      }

      if (frequencyType === "One-time") break;
    }
  }
  return plannedData;
};

exports.newRequestSheetDataStore = async (
  machineDataUseInCretionOfCM,
  requestSheetIdOfBM,
  shiftOfCMFromBM,
  requestSheetDataFilledByMTDUserForCM,
  plantToMachineHierarchyRef,
  rootUser,
  attachedFilesByMTDUser = []
) => {
  try {
    const generalDateFormat = (propDate = new Date()) =>
      moment(propDate).tz("Asia/Kolkata").format("YYYY-MM-DDTHH:mm");

    let _idObject = {},
      machineIdToPlantId = machineDataUseInCretionOfCM;

    if (machineIdToPlantId) {
      _idObject = {
        machineRef: machineIdToPlantId?._id,
        lineRef: machineIdToPlantId?.line_names?._id,
        cellRef: machineIdToPlantId?.line_names?.cell_names?._id,
        subSectionRef:
          machineIdToPlantId?.line_names?.cell_names?.subSection_names?._id,
        sectionRef:
          machineIdToPlantId?.line_names?.cell_names?.subSection_names
            ?.section_names?._id,
        plantRef:
          machineIdToPlantId?.line_names?.cell_names?.subSection_names
            ?.section_names?.plant_names?._id,
      };
    }

    const requestSheetNoOfCM = await globalReqSheetNo(
      machineDataUseInCretionOfCM?._id,
      "CM"
    );

    const assignUserForCM =
      requestSheetDataFilledByMTDUserForCM?.assignUserForCM?.map((item) => {
        let userRef = item?._id;
        delete item?.["_id"];
        return {
          ...item,
          userRef,
        };
      });
    const commonDataFilledByAssignUser = quarterlyDataAdd(
      requestSheetDataFilledByMTDUserForCM?.cmBasicDataFilledByMTD_TL
        ?.frequencyValue,
      assignUserForCM || [],
      requestSheetDataFilledByMTDUserForCM?.cmBasicDataFilledByMTD_TL
        ?.frequencyType,
      requestSheetDataFilledByMTDUserForCM?.targetDateOfCM,
      requestSheetDataFilledByMTDUserForCM?.cmBasicDataFilledByMTD_TL
        ?.activityEndDateOfCM,
      requestSheetIdOfBM ? "Generated" : "Assigned"
    );
    // requestSheetDataFilledByMTDUserForCM.sheetIssuedDateAndTimeOfCM =
    //   generalDateFormat(
    //     requestSheetDataFilledByMTDUserForCM?.sheetIssuedDateAndTimeOfCM
    //   );
    if (requestSheetIdOfBM) {
      requestSheetDataFilledByMTDUserForCM = {
        ...requestSheetDataFilledByMTDUserForCM,
        cmBasicDataFilledByMTD_TL: {
          ...requestSheetDataFilledByMTDUserForCM.cmBasicDataFilledByMTD_TL,
          plannedDateAndTimeOfCM: generalDateFormat(new Date()),
          attachedFilesByMTDUser: attachedFilesByMTDUser?.map(
            (value) => value?.filename
          ),
        },
      };
    }

    if (
      requestSheetDataFilledByMTDUserForCM?._id !== "" &&
      requestSheetDataFilledByMTDUserForCM?._id !== undefined
    ) {
      const updateTheAlredygeneratedRequestSheetOfCM =
        await RequestSheetOfCM?.findOneAndUpdate(
          {
            _id: mongoose?.Types?.ObjectId(
              requestSheetDataFilledByMTDUserForCM?._id
            ),
          },
          {
            $set: {
              ..._idObject,
              plantToMachineHierarchyRef,
              requestSheetCreatedBy: rootUser,
              cmBasicDataFilledByMTD_TL:
                requestSheetDataFilledByMTDUserForCM?.cmBasicDataFilledByMTD_TL,
              commonDataFilledByAssignUser,
            },
          },
          { new: true }
        );

      return updateTheAlredygeneratedRequestSheetOfCM;
    } else {
      delete requestSheetDataFilledByMTDUserForCM?._id;
      // console.log(
      //   "Inside else---------",
      //   requestSheetNoOfCM,
      //   _idObject,
      //   plantToMachineHierarchyRef,
      //   requestSheetDataFilledByMTDUserForCM?.cmBasicDataFilledByMTD_TL,
      //   requestSheetDataFilledByMTDUserForCM?.shiftOfBM || shiftOfCMFromBM,
      //   commonDataFilledByAssignUser,
      //   requestSheetIdOfBM,
      //   { ...requestSheetDataFilledByMTDUserForCM }
      // );
      let requestSheetOfCM = new RequestSheetOfCM({
        requestSheetNoOfCM,
        ..._idObject,
        plantToMachineHierarchyRef,
        requestSheetCreatedBy: rootUser,
        cmBasicDataFilledByMTD_TL:
          requestSheetDataFilledByMTDUserForCM?.cmBasicDataFilledByMTD_TL,
        shiftOfCM:
          requestSheetDataFilledByMTDUserForCM?.shiftOfBM || shiftOfCMFromBM,
        commonDataFilledByAssignUser,
        requestSheetOfBMRef: requestSheetIdOfBM,
        ...requestSheetDataFilledByMTDUserForCM,
      });

      return await requestSheetOfCM.save();
    }
  } catch (error) {
    console.error();
  }
};
