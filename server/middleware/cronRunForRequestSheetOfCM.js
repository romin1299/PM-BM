const cron = require("node-cron");
const mongoose = require("mongoose");
const RequestSheetOfCM = require("../model/requestSheetDataOfCM");
const { currentYear } = require("../GlobalData/RequestSheetApprovalStatus");
const moment = require("moment");
const {
  gettingMonthForSelectedDate,
  getFinancialQuarter,
} = require("./gettingFYMonthForPreAgg");

/**
 * FUNCTION: commonDataAdditionForOncePerMonthAndThree
 *
 * PURPOSE: Automatically generate new maintenance request entries based on frequency
 *
 * MAINTENANCE FREQUENCY TYPES:
 * - "1/1 M" = Monthly (every 1 month)
 * - "1/3 M" = Quarterly (every 3 months)
 * - "1/6 M" = Semi-annual (every 6 months)
 * - "1/Y" = Yearly (every 1 year)
 * - "1/2 Y" = Bi-yearly (every 2 years)
 * - "1/3 Y" = Every 3 years
 * - "1/4 Y" = Every 4 years
 * - "One-time" = Single maintenance (no recurrence)
 *
 * WORKFLOW:
 * 1. Find all request sheets matching the provided frequency(ies)
 * 2. Extract the last scheduled maintenance date from each sheet
 * 3. Calculate next maintenance date by adding frequency interval
 * 4. Create new "Generated" status maintenance entries
 * 5. Push to MongoDB in bulk to minimize database hits
 *
 * BENEFIT: Eliminates manual data entry for recurring maintenance
 * Ensures no scheduled maintenance is missed
 * Automatically manages yearly/quarterly cycles
 *
 * @param frequencyValue - Array of frequencies to match, or single string
 *                        Example: ["1/1 M", "1/3 M"] or "1/1 M"
 * @returns Array of MongoDB bulk operation objects for bulkWrite
 */
const commonDataAdditionForOncePerMonthAndThree = async (frequencyValue) => {
  /**
   * QUERY: FIND MATCHING REQUEST SHEETS
   *
   * Condition: Match sheets with specified frequency values
   * Projection: Only fetch needed fields to reduce memory usage
   * - _id: Document identifier
   * - frequencyValue: Need to calculate next date
   * - targetDateOfCM: Get last scheduled maintenance date
   *
   * frequencyValue comparison:
   * - If input is array: {$in: frequencyArray} matches any in array
   * - If input is string: Use single string match
   * Example: frequencyValue = ["1/1 M", "1/3 M"]
   *          Query: {"cmBasicDataFilledByMTD_TL.frequencyValue": {$in: [...]}}
   */
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

  /**
   * EARLY EXIT: No matching request sheets
   *
   * If no sheets found with specified frequency, exit
   * Example: No monthly maintenance on first run = nothing to do
   */
  if (!requestSheets.length) return console.log("No records to update.");

  /**
   * BUILD BULK OPERATIONS ARRAY
   *
   * Map each found request sheet to a MongoDB updateOne operation
   * Returns array of bulk update commands executed atomically
   *
   * Benefit: Single database round-trip for all updates
   * vs. Individual updates = N database calls
   */
  const bulkOps = requestSheets?.map((requestSheet) => {
    /**
     * EXTRACT LAST SCHEDULED MAINTENANCE DATE
     *
     * Data Structure Navigation:
     * commonDataFilledByAssignUser: [           // Array of yearly data
     *   {
     *     preAggregationTimeStampOfRequestSheet: {year, month},
     *     quarterlyDataOfTheCM: [               // Array of quarterly entries
     *       {targetDateOfCM, status, ...},
     *       {targetDateOfCM, status, ...},
     *     ]
     *   },
     *   { ... more years ... }
     * ]
     *
     * Process:
     * 1. Get last year entry: commonDataFilledByAssignUser[length-1]
     * 2. Get last quarter of that year: quarterlyDataOfTheCM[length-1]
     * 3. Extract targetDateOfCM: latest scheduled date
     *
     * Used to calculate NEXT maintenance: add frequency interval to this date
     */
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

    /**
     * FREQUENCY PARSING
     *
     * Format: "<value>/<unit> <period>"
     * Examples:
     * - "1/1 M" = Add 1 month each time
     * - "1/3 M" = Add 3 months each time
     * - "1/Y M" = Add 1 month (but period is months)
     * - "1/1 Y" = Add 1 year
     * - "1/2 Y" = Add 2 years
     *
     * Parsing:
     * 1. Split by space: [0] = "<value>/<unit>", [1] = "M" or "Y"
     * 2. Split [0] by "/": [0] = value (unused here), [1] = unit (1, 2, 3, 4, Y)
     * 3. Check if [1] === "Y": if yes, always add 1; if no, use unit value
     * 4. Check if [1] === "M": if yes, period="months"; if no, period="years"
     *
     * Example Processing "1/3 M":
     * splitTheFrequencyForTheAddValue = ["1/3", "M"]
     * unit = "3" (from split by "/")
     * period = "months" (from split by space, "M")
     * Result: add(3, "months")
     */
    let splitTheFrequencyForTheAddValue =
      requestSheet?.cmBasicDataFilledByMTD_TL?.frequencyValue?.split(" ");

    /**
     * CALCULATE NEXT MAINTENANCE DATE
     *
     * Logic:
     * IF lastTargetDate exists:
     *   nextDate = lastTargetDate + frequency interval
     * ELSE (first time):
     *   nextDate = today (current moment)
     *
     * Time Calculation:
     * - Parse unit: "Y" in second part = yearly, "M" = monthly
     * - Parse quantity: "1/3" = 3 months, "1/1" = 1 month
     * - Format: ISO format with time "YYYY-MM-DDTHH:mm"
     *
     * Example:
     * lastTargetDate = "2025-12-09T15:30"
     * frequency = "1/3 M" → add 3 months
     * Result: "2026-03-09T15:30"
     */
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

    /**
     * CREATE QUARTERLY DATA ENTRIES
     *
     * Each maintenance creates quarterly entry with:
     * - requestSheet_quarter: Q1/Q2/Q3/Q4 based on current date
     * - statusOfPlannedCM: "Planned" (awaiting assignment)
     * - targetDateOfCM: Next scheduled maintenance date
     * - requestSheetStatusOfCM: "Generated" (initial status, awaiting TL assignment)
     *
     * SPECIAL CASE: 3-monthly maintenance (1/3 M)
     * Condition: Only create if exactly 3 months have passed
     * Prevents duplicate quarterly entries if cron runs multiple times
     *
     * Example:
     * - Last maintenance: 2025-09-01 (Q3)
     * - Current date: 2025-12-01 (Q4) → diff = 3 months = True → Create entry
     * - If we ran again: 2025-12-02 (Q4) → diff = 3 months = True → Create again (OK, quarterly check)
     *
     * Why this check?
     * - Ensures quarterly maintenance doesn't create duplicate entries
     * - If cron runs mid-month, prevents creating multiple entries for same cycle
     * - Maintains data consistency for quarterly schedules
     */
    let quarterlyDataEntries;

    if (requestSheet?.cmBasicDataFilledByMTD_TL?.frequencyValue === "1/3 M") {
      /**
       * QUARTERLY MAINTENANCE SPECIFIC LOGIC
       *
       * Check: Has exactly 3 months passed since last maintenance?
       * moment().diff(lastTargetDate, "months") calculates elapsed months
       *
       * Example:
       * lastTargetDate = 2025-09-01
       * current = 2025-12-09
       * diff = 3.25 months → Floor comparison = 3 (true)
       *
       * If true: Create maintenance entry
       * If false: quarterlyDataEntries remains undefined, skip this sheet
       */
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
      /**
       * DEFAULT: All other frequencies
       *
       * Monthly (1/1 M), Semi-annual (1/6 M), Yearly (1/Y), Bi-yearly (1/2 Y), etc.
       * Create maintenance entry without additional conditions
       *
       * These frequencies have longer intervals, so no duplicate risk
       * (Monthly: Won't create two in same month)
       * (Yearly: Won't create two in same year)
       */
      quarterlyDataEntries = [
        {
          requestSheet_quarter: getFinancialQuarter(moment()),
          statusOfPlannedCM: "Planned",
          targetDateOfCM: newTargetDate,
          requestSheetStatusOfCM: "Generated",
        },
      ];
    }

    /**
     * SEMI-ANNUAL MAINTENANCE (6-MONTH) SPECIAL HANDLING
     *
     * Purpose: 6-monthly maintenance requires TWO entries per cron run
     * (One now, one 6 months from now)
     *
     * Why two entries?
     * - Semi-annual = maintenance every 6 months
     * - Cron runs on April 1st (financial year start)
     * - Creates: April entry + October entry (6 months later)
     * - Ensures both half-yearly maintenance dates are planned
     *
     * Process:
     * 1. Create first entry: now (April) with newTargetDate
     * 2. Push second entry: 6 months later (October)
     *    - Quarter: recalculate for 6-month-ahead date
     *    - Date: add 6 months to newTargetDate
     *
     * Example:
     * newTargetDate = "2025-04-09T15:30"
     * Push: "2025-10-09T15:30" (6 months later)
     * Quarters: Q1 (April) + Q3 (October)
     */
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

    /**
     * BUILD MONGODB BULK UPDATE OPERATION
     *
     * MongoDB bulkWrite format: {updateOne: {filter, update}}
     *
     * Operation: $push with $each
     * - $push: Add elements to array field
     * - $each: Add multiple elements in single operation (not one at a time)
     *
     * Target Path:
     * commonDataFilledByAssignUser
     *   → Creates new year entry with preAggregationTimeStampOfRequestSheet
     *   → quarterlyDataOfTheCM: $each pushes all quarterly entries
     *
     * Structure Pushed:
     * {
     *   preAggregationTimeStampOfRequestSheet: {
     *     requestSheet_year: "2024-2025",
     *     requestSheet_month: "Dec"
     *   },
     *   quarterlyDataOfTheCM: [        // Created entries array
     *     {quarter, date, status},
     *     {quarter, date, status}    // For 6-monthly: second entry
     *   ]
     * }
     *
     * MongoDB $each Benefit:
     * Atomically pushes array of entries instead of multiple $push operations
     * Maintains data consistency
     */
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

  /**
   * RETURN BULK OPERATIONS ARRAY
   *
   * Return bulkOps array containing all MongoDB updateOne operations
   * Each operation will be executed atomically by bulkWrite
   *
   * Example bulkOps structure:
   * [
   *   {
   *     updateOne: {
   *       filter: {_id: ObjectId("...")},
   *       update: {$push: {commonDataFilledByAssignUser: {...}}}
   *     }
   *   },
   *   {
   *     updateOne: {
   *       filter: {_id: ObjectId("...")},
   *       update: {$push: {commonDataFilledByAssignUser: {...}}}
   *     }
   *   }
   * ]
   */
  return bulkOps;
};

/**
 * CRON SCHEDULE 1: MONTHLY & QUARTERLY MAINTENANCE GENERATION
 *
 * Schedule: "0 0 1 * *" = Every 1st day of month at 00:00 (midnight)
 *
 * MAINTENANCE FREQUENCIES PROCESSED:
 * - "1/1 M": Monthly maintenance (runs every month)
 * - "1/3 M": Quarterly maintenance (runs every 3 months, but creates once if 3 months passed)
 *
 * WORKFLOW:
 * 1. Find all request sheets with monthly or quarterly frequency
 * 2. For each sheet:
 *    - Extract last scheduled date
 *    - Calculate next maintenance date (now + 1 or 3 months)
 *    - Create "Generated" status entry ready for assignment
 * 3. Execute all updates in single bulk operation
 * 4. Request sheets now have new maintenance entries in current quarter
 *
 * EXECUTION TIME:
 * - Runs at midnight on first day of every month
 * - Allows maintenance team entire month to plan and assign
 * - Example: Runs Dec 1, Jan 1, Feb 1, etc.
 *
 * ERROR HANDLING:
 * - Catches errors and logs via logger.error
 * - Continues processing even if some updates fail (bulkWrite partial success)
 *
 * MONITORING:
 * - Check logs for: "No records to update" (no matching frequency)
 * - Check DB for new generated entries
 */
cron.schedule("0 0 1 * *", async () => {
  try {
    /**
     * CALL FUNCTION WITH FREQUENCY ARRAY
     *
     * Pass array: ["1/1 M", "1/3 M"]
     * Function will find sheets with EITHER frequency and create entries
     *
     * Result: bulkOps array with updateOne operations for matching sheets
     */
    let valueOfTheFunction = await commonDataAdditionForOncePerMonthAndThree([
      "1/1 M",
      "1/3 M",
    ]);

    /**
     * EXECUTE BULK WRITE
     *
     * If valueOfTheFunction has operations, execute them atomically
     * MongoDB bulkWrite:
     * - Processes all operations in order
     * - Continues on individual operation failures (ordered: false default)
     * - Returns result with: insertedCount, modifiedCount, deletedCount, etc.
     *
     * If no operations (no matching sheets), valueOfTheFunction is undefined
     * Check prevents error from bulkWrite call
     */
    if (valueOfTheFunction?.length) {
      const result = await RequestSheetOfCM.bulkWrite(valueOfTheFunction);
    }
  } catch (error) {
    /**
     * ERROR HANDLING
     *
     * Log errors for debugging
     * Example errors:
     * - MongoDB connection issues
     * - Invalid frequency values
     * - Schema validation failures
     *
     * Logger parameters:
     * - error: The error object
     * - metadata: {maintenanceType: "CM"} for filtering logs
     */
    console.log(error);
    logger.error(error, { maintenanceType: maintenanceType?.[0] });
  }
});

/**
 * CRON SCHEDULE 2: SEMI-ANNUAL & YEARLY MAINTENANCE GENERATION
 *
 * Schedule: "0 0 1 4 *" = 1st April at 00:00 (midnight)
 * April 1st = Start of Financial Year in India
 *
 * MAINTENANCE FREQUENCIES PROCESSED:
 * - "1/6 M": Semi-annual (twice yearly - April & October)
 * - "1/Y": Yearly maintenance
 * - "1/2 Y": Bi-yearly maintenance (every 2 years)
 * - "1/3 Y": Every 3 years
 * - "1/4 Y": Every 4 years
 *
 * WHY SEPARATE SCHEDULE?
 * - Longer maintenance intervals (6 months to 4 years)
 * - Only need to process once per financial year
 * - April 1st is start of financial year → logical time to generate annual plan
 * - Eliminates redundant processing (monthly cron would be overkill)
 *
 * FINANCIAL YEAR CONSIDERATION:
 * - India uses April 1 - March 31 fiscal year
 * - By running April 1, captures entire year's maintenance plan
 * - currentYear variable already reflects "2024-2025" format
 *
 * PROCESSING:
 * 1. Find all request sheets with semi-annual or yearly frequencies
 * 2. For each sheet:
 *    - Extract last scheduled date
 *    - Calculate next maintenance(s):
 *      - Semi-annual (1/6 M): Creates TWO entries (April + October)
 *      - Yearly+ (1/Y, 1/2Y, etc.): Creates ONE entry (April)
 *    - Create entries in "Generated" status
 * 3. Execute all updates atomically
 *
 * SPECIAL CASE: Semi-annual (1/6 M)
 * - First push creates April entry with newTargetDate
 * - Second push (in function) creates October entry (6 months later)
 * - Ensures maintenance team has both dates planned upfront
 *
 * TIMING BENEFIT:
 * - Runs once yearly (April 1) = minimal database load
 * - Plans entire year's maintenance upfront
 * - Maintenance team has full year visibility
 *
 * ERROR HANDLING:
 * - Same pattern as monthly schedule
 * - Logs errors, continues on failures
 */
cron.schedule("0 0 1 4 *", async () => {
  try {
    /**
     * CALL FUNCTION WITH LONGER FREQUENCY ARRAY
     *
     * Pass array: ["1/6 M", "1/Y", "1/2 Y", "1/3 Y", "1/4 Y"]
     * Function finds sheets with ANY of these frequencies
     *
     * Process:
     * - "1/6 M": Creates 2 entries (April + October)
     * - Others: Create 1 entry each
     *
     * Result: bulkOps for all yearly/semi-annual maintenance
     */
    const valueOfTheFunction = await commonDataAdditionForOncePerMonthAndThree([
      "1/6 M",
      "1/Y",
      "1/2 Y",
      "1/3 Y",
      "1/4 Y",
    ]);

    /**
     * EXECUTE BULK WRITE
     *
     * If operations exist, execute them
     * For semi-annual: Each sheet may add 2 quarterly entries
     * For yearly+: Each sheet adds 1 quarterly entry
     */
    if (valueOfTheFunction?.length) {
      const result = await RequestSheetOfCM.bulkWrite(valueOfTheFunction);
    }
  } catch (error) {
    /**
     * ERROR HANDLING
     *
     * Log any errors during annual maintenance generation
     * Critical to catch: If this fails, yearly maintenance won't be planned
     */
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
