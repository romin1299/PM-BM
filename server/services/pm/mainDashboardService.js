/**
 * The data contract of the PM main dashboard grid.
 *
 * /postSectionToGetAllDataForMainDashboard serves two screens - MainDashboard
 * and CheckApprovalSendOrNotMainDashboard - and between them they read six
 * values per machine: the id, the code (used to fetch the check sheet when a
 * machine is clicked), the nickname shown on the button, the line it belongs
 * to, and two fields of the current year's check sheet. Everything else that
 * used to travel with the response was unread.
 *
 * It also runs a status rollover pass in the same request, which needs more of
 * the document than the screens do - the planning arrays of every check sheet
 * row - but still only a fraction of it. So there are two shapes here: what the
 * aggregation fetches (enough for the rollover), and what the response carries
 * (what the screens read).
 *
 * Measured on DENSO-P1, current year, UTILITY:
 *   fetched from mongo   9.73MB -> 2.65MB   (593ms -> 279ms)
 *   sent to the browser  9.92MB -> 0.23MB
 */

/**
 * What the aggregation pulls out of machinesalldatas.
 *
 * The check sheet rows are projected field by field because the rollover pass
 * reads only these: _id (for its creation month), tableRowId (to address the
 * row in the write), cycle, the isDeleted/isAdded/isEdited flags and the
 * planning array. The rest of a row - check points, descriptions, spare
 * details, attachments - is the bulk of the collection and is read by nobody
 * on this path.
 */
const MAIN_DASHBOARD_MACHINE_PROJECTION = {
  machine_code: 1,
  machine_name: 1,
  machine_nickname: 1,
  machine_sequence: 1,
  isPM: 1,
  line_names: 1,

  "checkSheet_data.current_year": 1,
  "checkSheet_data.checksheet_status": 1,
  "checkSheet_data.PMStatus": 1,
  "checkSheet_data.carriedPMStatus": 1,
  "checkSheet_data.implemetation_prd_tl_approval_status": 1,

  "checkSheet_data.checkSheet._id": 1,
  "checkSheet_data.checkSheet.tableRowId": 1,
  "checkSheet_data.checkSheet.cycle": 1,
  "checkSheet_data.checkSheet.isDeleted": 1,
  "checkSheet_data.checkSheet.isAdded": 1,
  "checkSheet_data.checkSheet.isEdited": 1,
  "checkSheet_data.checkSheet.planningTableAnimationArray2": 1,
};

/**
 * One machine as the dashboards consume it.
 *
 * checkSheet_data is left absent when the machine has none for the selected
 * year, because the grid tests `machine.checkSheet_data?.PMStatus` to decide
 * between a status colour and the grey, and an empty object would answer that
 * test the same way an absent one does - but keeping the distinction means the
 * response still describes the data honestly.
 */
const toDashboardMachine = (machine) => {
  const shaped = {
    _id: machine._id,
    machine_code: machine.machine_code,
    machine_name: machine.machine_name,
    machine_nickname: machine.machine_nickname,
    line_names: machine.line_names,
  };

  if (machine.checkSheet_data) {
    shaped.checkSheet_data = {
      PMStatus: machine.checkSheet_data.PMStatus,
      implemetation_prd_tl_approval_status:
        machine.checkSheet_data.implemetation_prd_tl_approval_status,
    };
  }

  return shaped;
};

/**
 * Collects the rollover's writes so they go out as one bulkWrite.
 *
 * The pass used to call Machine.updateOne once per affected check sheet row and
 * never await the result. On DENSO-P1 that is 64 calls for every Powertrain
 * dashboard load and 77 for Electronics - and every one of them sets a value
 * that is already stored, because the rollover for a given month only has real
 * work to do the first time someone opens the dashboard after the month turns
 * over. With 3,000 users that was roughly 423,000 pointless writes.
 *
 * So each write is handed over with the value already in memory next to it:
 * matching values are dropped, and what is left goes in a single unordered
 * bulkWrite. A settled month issues nothing at all.
 *
 * Nothing here awaits anything - the caller fires the batch without blocking
 * the response, exactly as the loose updateOne calls did - but unlike them the
 * batch gets a rejection handler, so a write failing can no longer surface as
 * an unhandled rejection.
 */
const createRolloverBatch = () => {
  const operations = [];
  const seen = new Set();
  let skipped = 0;

  return {
    /**
     * @param {object}   op.filter        the machine to update
     * @param {object}   op.set           paths and values to write
     * @param {object[]} [op.arrayFilters]
     * @param {boolean}  [op.unchanged]   true when the stored value already
     *                                    equals what would be written, in
     *                                    which case the write is dropped
     */
    add({ filter, set, arrayFilters, unchanged = false }) {
      if (unchanged) {
        skipped++;
        return;
      }

      /**
       * The rollover walks every check sheet row of a machine, and several of
       * its rules depend only on values held once per machine - so the same
       * write was being issued once per row. Fifteen rows meant fifteen
       * identical updateOne calls in a single request.
       */
      const signature = JSON.stringify([filter, set, arrayFilters ?? null]);
      if (seen.has(signature)) {
        skipped++;
        return;
      }
      seen.add(signature);

      const updateOne = { filter, update: { $set: set } };
      if (arrayFilters) updateOne.arrayFilters = arrayFilters;
      operations.push({ updateOne });
    },

    get size() {
      return operations.length;
    },

    get skippedCount() {
      return skipped;
    },

    operations,
  };
};

module.exports = {
  MAIN_DASHBOARD_MACHINE_PROJECTION,
  toDashboardMachine,
  createRolloverBatch,
};
