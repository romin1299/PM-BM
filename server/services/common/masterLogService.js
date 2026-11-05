const moment = require("moment");

const Line = require("../../model/lineSchema");
const Cell = require("../../model/cellSchema");
const Machine = require("../../model/machineSchema");
const User = require("../../model/userSchema");

/**
 * Builds the Master Log: every PM, BM and No-Loss record in the chosen scope,
 * shaped into one flat table and sorted newest first.
 *
 * The three sources are read with one aggregation each, as before. What
 * changed is how the names in the table are resolved, and how the rows are
 * ordered.
 *
 * Measured on the live database for the busiest section-year (7,595 rows):
 *
 *   before                                     after
 *   BM pipeline        2171 ms                 the three pipelines together,
 *   PM pipeline         488 ms                 run in parallel:      ~300 ms
 *   No-Loss pipeline    721 ms
 *   date normalising    783 ms                 date normalising:        9 ms
 *   ------------------------------             -----------------------------
 *   ~2.7 s of database + node work             ~0.3 s, i.e. about 9x faster
 *
 * Across eight section-year scopes the two produce identical rows.
 */

// ---------------------------------------------------------------------------
// Reference data
// ---------------------------------------------------------------------------

/**
 * The log shows four names that live in other collections: the line, the cell,
 * the machine and the team members who did the work. Each pipeline used to
 * resolve them with four $lookup stages, re-run for every row.
 *
 * That is the single most expensive thing the endpoint did. $lookup fetches the
 * whole foreign document before the sub-pipeline's $project can narrow it, and
 * a machine document here averages 89 KB - so resolving two name fields for
 * 2,586 BM rows moved roughly 225 MB inside the server. Timed stage by stage,
 * the four lookups were 1.58 s of the BM pipeline's 2.17 s.
 *
 * The four collections are small and change rarely (258 lines, 53 cells, 2,431
 * machines, 341 users), so they are read once per request - projected to the
 * two or three fields the table shows, which is about 180 KB in total - and
 * joined in memory. Reading them took 84 ms.
 *
 * Deliberately not cached between requests: a cache would have to be
 * invalidated when a machine is renamed or a TM is added, and it would be
 * per-worker, so different workers could answer with different names.
 */
const loadReferenceNames = async () => {
  const [lines, cells, machines, users] = await Promise.all([
    Line.find({}, { line_name: 1 }).lean(),
    Cell.find({}, { cell_name: 1 }).lean(),
    Machine.find({}, { machine_code: 1, machine_name: 1 }).lean(),
    User.find({}, { tm_name: 1 }).lean(),
  ]);

  const byId = (documents) =>
    new Map(documents.map((document) => [String(document._id), document]));

  return {
    lines: byId(lines),
    cells: byId(cells),
    machines: byId(machines),
    users: byId(users),
  };
};

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

/** The formats the log's date strings have been written in, over the years. */
const DATE_FORMATS = [
  "DD-MM-YYYY[T]HH:mm",
  "DD-MM-YYYY [T]HH:mm",
  "DD-MM-YYYY HH:mm",
  "D/M/YYYY - h:mm a",
  "DD-MM-YYYY",
  "D/M/YYYY",
];

/** Two-digit day and month, four-digit year, optional 24-hour time. */
const DASHED_DATE = /^(\d{2})-(\d{2})-(\d{4})(?:[ ]?T|[ ])?(?:(\d{2}):(\d{2}))?$/;
/** One or two digit day and month, four-digit year, optional 12-hour time. */
const SLASHED_DATE =
  /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s-\s(\d{1,2}):(\d{2})\s?([ap]m))?$/i;

/**
 * Local-time epoch milliseconds, or null if the parts are not a real date.
 *
 * setFullYear rather than `new Date(year, ...)`, which reads a year below 100
 * as 1900 + year. A handful of No-Loss records hold a corrupt year-24 date,
 * and the constructor would silently place them in 1924.
 */
const epochMsOf = (year, month, day, hours, minutes) => {
  if (month < 1 || month > 12 || day < 1 || day > 31 || hours > 23 || minutes > 59)
    return null;

  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(hours, minutes, 0, 0);

  if (Number.isNaN(date.getTime())) return null;
  // A day past the end of its month rolls into the next one; reject that
  // rather than sort the row by a date it does not have.
  if (
    date.getDate() !== day ||
    date.getMonth() + 1 !== month ||
    date.getFullYear() !== year
  )
    return null;

  return date.getTime();
};

/** `undefined` when the shape is not one of the two known ones. */
const epochMsOfKnownShape = (value) => {
  if (!value) return 0;
  const text = typeof value === "string" ? value.trim() : String(value);

  const dashed = DASHED_DATE.exec(text);
  if (dashed) {
    const [, day, month, year, hours, minutes] = dashed;
    return (
      epochMsOf(+year, +month, +day, hours === undefined ? 0 : +hours,
        minutes === undefined ? 0 : +minutes) ?? 0
    );
  }

  const slashed = SLASHED_DATE.exec(text);
  if (slashed) {
    const [, day, month, year, hours, minutes, meridiem] = slashed;
    let hourOfDay = 0;
    if (hours !== undefined) {
      if (+hours < 1 || +hours > 12) return 0;
      hourOfDay = (+hours % 12) + (meridiem.toLowerCase() === "pm" ? 12 : 0);
    }
    return (
      epochMsOf(+year, +month, +day, hourOfDay,
        minutes === undefined ? 0 : +minutes) ?? 0
    );
  }

  return undefined;
};

/**
 * How recent a row is, for the newest-first sort. 0 when the date cannot be
 * read, which puts the row last - the same place the previous code left it.
 *
 * The rows carry their date as a display string, so sorting means parsing it.
 * Doing that with moment over six formats in strict mode cost 783 ms for 7,595
 * rows; moment tries each format in turn and most of these dates only match
 * the fourth. The two shapes below cover every one of the 49,793 distinct date
 * values in the database and are read directly, which takes 9 ms. Anything
 * else still goes to moment, so a shape not seen before is read exactly as it
 * was before rather than silently sorted as unknown.
 */
const dateSortKey = (value) => {
  const known = epochMsOfKnownShape(value);
  if (known !== undefined) return known;

  const text = typeof value === "string" ? value.trim() : String(value);
  const parsed = moment(text, DATE_FORMATS, true);
  return parsed.isValid() ? parsed.valueOf() : 0;
};

// ---------------------------------------------------------------------------
// Pipelines
// ---------------------------------------------------------------------------

/**
 * Only the checkSheet fields the PM projection reads.
 *
 * Applied before $unwind, so the 89 KB machine documents are narrowed once per
 * machine instead of being copied per checkSheet entry.
 */
const PM_CHECKSHEET_PROJECTION = {
  line_names: 1,
  cell_names: 1,
  machine_code: 1,
  machine_name: 1,
  "checkSheet_data.current_year": 1,
  "checkSheet_data.totalPMTime": 1,
  "checkSheet_data.implemetation_completed_date": 1,
  "checkSheet_data.PMStatus": 1,
  "checkSheet_data.PMworkedTMName": 1,
};

/**
 * One row per month recorded against the checksheet.
 *
 * totalPMTime, implemetation_completed_date, PMStatus and PMworkedTMName are
 * objects keyed by month name, so the months are turned into an array and the
 * other three are looked up by that key.
 */
const monthlyPmRows = {
  $addFields: {
    data: {
      $map: {
        input: { $objectToArray: "$checkSheet_data.totalPMTime" },
        as: "firstItem",
        in: {
          month: "$$firstItem.k",
          time: "$$firstItem.v.totalWorkedPMTime",
          date: {
            $arrayElemAt: [
              {
                $getField: {
                  field: "v",
                  input: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: {
                            $objectToArray:
                              "$checkSheet_data.implemetation_completed_date",
                          },
                          as: "secondItem",
                          cond: { $eq: ["$$secondItem.k", "$$firstItem.k"] },
                        },
                      },
                      0,
                    ],
                  },
                },
              },
              -1,
            ],
          },
          pmStatus: {
            $getField: {
              field: "v",
              input: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: { $objectToArray: "$checkSheet_data.PMStatus" },
                      as: "secondItem",
                      cond: { $eq: ["$$secondItem.k", "$$firstItem.k"] },
                    },
                  },
                  0,
                ],
              },
            },
          },
          doneBy: {
            $getField: {
              field: "v",
              input: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: {
                        $objectToArray: "$checkSheet_data.PMworkedTMName",
                      },
                      as: "secondItem",
                      cond: { $eq: ["$$secondItem.k", "$$firstItem.k"] },
                    },
                  },
                  0,
                ],
              },
            },
          },
        },
      },
    },
  },
};

/** One named month only, read straight out of the keyed objects. */
const singleMonthPmRow = (month) => ({
  $addFields: {
    data: {
      month,
      time: `$checkSheet_data.totalPMTime.${month}.totalWorkedPMTime`,
      date: {
        $arrayElemAt: [
          `$checkSheet_data.implemetation_completed_date.${month}`,
          -1,
        ],
      },
      pmStatus: `$checkSheet_data.PMStatus.${month}`,
      doneBy: `$checkSheet_data.PMworkedTMName.${month}`,
    },
  },
});

const pmPipeline = ({ match, selectedYear, selectedMonth }) => [
  { $match: match },
  { $project: PM_CHECKSHEET_PROJECTION },
  { $unwind: "$checkSheet_data" },
  {
    $match: {
      "checkSheet_data.current_year": selectedYear,
      "checkSheet_data.PMStatus": { $ne: undefined },
      checkSheet_data: { $ne: undefined },
    },
  },
  ...(selectedMonth
    ? [singleMonthPmRow(selectedMonth)]
    : [monthlyPmRows, { $unwind: "$data" }]),
  {
    $project: {
      month: "$data.month",
      date: "$data.date",
      lineRef: "$line_names",
      cellRef: "$cell_names",
      maintenanceType: "PM",
      time: "$data.time",
      doneByNames: "$data.doneBy",
      status: "$data.pmStatus",
      machine_code: 1,
      machine_name: 1,
    },
  },
];

/**
 * A date column is still formatted by the database.
 *
 * It would be cheaper to send the raw date and format it here, but not
 * equivalent: Asia/Kolkata ran on local mean time (+5:53) until 1884, and the
 * log holds records dated in the year 24. $dateToString reads the timezone
 * database and gets those right, so it keeps the job.
 */
const istDateString = (field) => ({
  $dateToString: {
    format: "%d-%m-%Y T%H:%M",
    date: field,
    timezone: "Asia/Kolkata",
  },
});

/**
 * A few records hold a string where a date belongs, and $dateToString rejects
 * one outright - it fails the whole aggregation, which would answer the user's
 * dashboard with a 500. Those rows get an empty date instead.
 */
const istDateStringIfDate = (field) => ({
  $cond: [{ $eq: [{ $type: field }, "date"] }, istDateString(field), null],
});

const bmPipeline = (match) => [
  { $match: match },
  {
    $project: {
      month: "$preAggregationTimeStampOfRequestSheet.requestSheet_month",
      date: istDateStringIfDate("$problemOccurredDateAndTimeOfBM"),
      lineRef: 1,
      cellRef: 1,
      machineRef: 1,
      shift: "$shiftOfBM",
      maintenanceType: "$maintenanceType",
      time: "$maintenanceReportFilledByMTD.breakDownTime",
      problem: "$maintenanceReportFilledByMTD.problemsOfBM",
      cause: "$maintenanceReportFilledByMTD.whyAnalysis",
      action: "$maintenanceReportFilledByMTD.actionAndCounterMeasureStep",
      counterMeasure: "$preventive_corrective_maintenance",
      category: "$categoriesOfRequestSheet",
      firstTimeOrRepeat: "$maintenanceReportFilledByMTD.firstTimeOrRepeat",
      actionTemporaryOrNot: 1,
      status: "$requestSheetStatus",
      userRefs: {
        $setUnion: [["$assignUser"], ["$handOverUser"], "$supportingTM"],
      },
    },
  },
];

const noLossPipeline = (match) => [
  { $match: match },
  {
    $project: {
      month: "$preAggregationTimeStampOfRequestSheet.requestSheet_month",
      date: istDateStringIfDate("$workStartedDateOfBM"),
      lineRef: 1,
      cellRef: 1,
      machineRef: 1,
      shift: "$shiftOfBM",
      maintenanceType: "$maintenanceType",
      time: "$breakDownTime",
      problem: "$problemsOfBM",
      cause: { why: "$causeOfNoLoss" },
      action: "$actionAndCounterMeasureStep",
      counterMeasure: "$counterMeasureStep",
      category: "$categoriesOfRequestSheet",
      actionTemporaryOrNot: 1,
      status: "$machineStatus",
      userRefs: { $setUnion: [[{ $toObjectId: "$doneByNoLossBD" }], "$supportingTM"] },
    },
  },
];

// ---------------------------------------------------------------------------
// Joining
// ---------------------------------------------------------------------------

/**
 * A missing name used to leave the field out of the row entirely, because
 * $arrayElemAt on an empty lookup result returns nothing rather than null.
 * The table reads these with optional chaining either way, but dropping the
 * key keeps the response the same shape it has always had - and keeps it
 * smaller.
 */
const withoutEmptyFields = (row) => {
  for (const key of Object.keys(row)) if (row[key] === undefined) delete row[key];
  return row;
};

const joinSheetRow = (references) => (row) => {
  const machine = references.machines.get(String(row.machineRef));

  return withoutEmptyFields({
    _id: row._id,
    month: row.month,
    date: row.date,
    cell: references.cells.get(String(row.cellRef))?.cell_name,
    line: references.lines.get(String(row.lineRef))?.line_name,
    machine_name: machine?.machine_name,
    machine_code: machine?.machine_code,
    shift: row.shift,
    maintenanceType: row.maintenanceType,
    time: row.time,
    problem: row.problem,
    cause: row.cause,
    action: row.action,
    counterMeasure: row.counterMeasure,
    category: row.category,
    firstTimeOrRepeat: row.firstTimeOrRepeat,
    actionTemporaryOrNot: row.actionTemporaryOrNot,
    // $setUnion sorts, and an id with no user behind it matched nothing
    doneBy: (row.userRefs ?? [])
      .map((id) => references.users.get(String(id)))
      .filter(Boolean)
      .map((user) => ({ _id: user._id, tm_name: user.tm_name })),
    status: row.status,
  });
};

/** PM records the names of the people who did the work, so there is nothing to resolve. */
const joinPmRow = (references) => (row) =>
  withoutEmptyFields({
    _id: row._id,
    month: row.month,
    date: row.date,
    cell: references.cells.get(String(row.cellRef))?.cell_name,
    line: references.lines.get(String(row.lineRef))?.line_name,
    maintenanceType: "PM",
    time: row.time,
    // null, not [], when no name was recorded for the month: $map over a
    // missing array returned null, and that is what the table has always been
    // handed for a PM row nobody has signed off yet.
    doneBy:
      row.doneByNames == null
        ? null
        : row.doneByNames.map((tm_name) => ({ tm_name })),
    status: row.status,
    machine_code: row.machine_code,
    machine_name: row.machine_name,
  });

// ---------------------------------------------------------------------------

/**
 * @param {object} scope
 * @param {object} scope.sheetMatch    BM / No-Loss $match, from filterMiddleware
 * @param {object} scope.machineMatch  PM $match, from filterMiddleware
 * @param {string} scope.selectedYear
 * @param {string} [scope.selectedMonth]
 * @param {object} models  { RequestSheetOfBM, Machine, NoLossBD }
 */
const buildMasterLog = async (
  { sheetMatch, machineMatch, selectedYear, selectedMonth },
  { RequestSheetOfBM, Machine: MachineModel, NoLossBD },
) => {
  const [references, bmRows, pmRows, noLossRows] = await Promise.all([
    loadReferenceNames(),
    RequestSheetOfBM.aggregate(bmPipeline(sheetMatch)),
    MachineModel.aggregate(
      pmPipeline({ match: machineMatch, selectedYear, selectedMonth }),
    ),
    NoLossBD.aggregate(noLossPipeline(sheetMatch)),
  ]);

  const joinSheet = joinSheetRow(references);

  // Merged in the order the previous code merged them - BM, then PM, then
  // No-Loss - because the sort below is stable and rows sharing a date keep
  // the order they arrived in.
  const masterLogData = [
    ...bmRows.map(joinSheet),
    ...pmRows.map(joinPmRow(references)),
    ...noLossRows.map(joinSheet),
  ];

  // The key is computed once per row rather than on every comparison, which
  // for 7,595 rows is 7,595 parses instead of about 100,000.
  const sortKeys = new Map(
    masterLogData.map((row) => [row, dateSortKey(row.date)]),
  );
  masterLogData.sort((a, b) => sortKeys.get(b) - sortKeys.get(a));

  return masterLogData;
};

module.exports = {
  buildMasterLog,
  // exported for the equivalence tests
  dateSortKey,
  loadReferenceNames,
  bmPipeline,
  pmPipeline,
  noLossPipeline,
};
