/**
 * Month-by-month inventory of each cell, carried forward.
 *
 * Inventory is a running balance, not something that belongs to one month: what
 * is on the shelf at the end of a month is what was there at the end of the
 * month before, plus what came in, minus what went out. Grouping masters by the
 * month they were registered showed only the stock received that month and made
 * the figure drop to nothing the month after.
 *
 * For each master, at the end of every month of the financial year:
 *
 *   stock = quantity received up to that month - quantity issued up to that month
 *
 * Everything received or issued before the year opens is the opening balance,
 * which is why the history is never cut at the start of the year.
 *
 * The balance is then summed per cell, split by the rotation bucket each master
 * falls in today (see addFieldsForInventoryBifurcation). The bucket is today's
 * classification applied to the whole history - a master's past movement is not
 * re-judged month by month - so the buckets of an old month show where today's
 * stock sat then, not how it was classed then.
 *
 * Pure: it takes the rows already read and returns the figures, so it can be
 * checked without a database.
 */
const MONTHS_IN_YEAR = 12;
const FIRST_MONTH_OF_FY = 4; // April

/** A calendar month as one comparable number. */
const monthKey = (year, month) => year * 12 + (month - 1);

/** The calendar month the nth month (0 = April) of a financial year falls in. */
const monthKeyOfFyMonth = (fyStartYear, index) => {
  const month = ((FIRST_MONTH_OF_FY - 1 + index) % 12) + 1;
  const year = month >= FIRST_MONTH_OF_FY ? fyStartYear : fyStartYear + 1;
  return monthKey(year, month);
};

/**
 * @param {object} args
 * @param {Array} args.masters one per master: { cell, ageBucket, quantity,
 *   cost, receivedMonthKey, legacyIssuedQty, legacyIssuedMonthKey }
 * @param {Array} args.issues stock-outs recorded as issuances:
 *   { masterId, quantity, monthKey }, keyed by the master they came out of
 * @param {number} args.fyStartYear 2026 for 2026-2027
 * @param {number|null} args.lastMonthIndex the last month to report (0 = April),
 *   or null for all twelve. A year still running has no figure for months that
 *   have not happened.
 * @returns {Array} one entry per cell with stock in the year:
 *   { cell, buckets: { [bucket]: { qty: number[12], cost: number[12] } } },
 *   with null in months that are not reported.
 */
const buildCumulativeCellInventory = ({
  masters,
  issues,
  fyStartYear,
  lastMonthIndex = null,
}) => {
  const reportedMonths = lastMonthIndex === null ? MONTHS_IN_YEAR : lastMonthIndex + 1;
  const cutoffs = Array.from({ length: MONTHS_IN_YEAR }, (_, index) =>
    monthKeyOfFyMonth(fyStartYear, index),
  );

  const issuesByMaster = new Map();
  issues.forEach(({ masterId, quantity, monthKey: key }) => {
    const id = String(masterId);
    if (!issuesByMaster.has(id)) issuesByMaster.set(id, []);
    issuesByMaster.get(id).push({ quantity, monthKey: key });
  });

  const cells = new Map();

  masters.forEach((master) => {
    const received = Number(master.quantity) || 0;
    if (!received || master.receivedMonthKey === null) return;

    const unitCost = master.cost && received ? master.cost / received : 0;

    // Every outflow with the month it happened in. The master's own issued
    // quantity is the total that went out - it is what its available quantity
    // is calculated from, so the balance has to end where the master does. The
    // issuances recorded here give the months, newest ones last; any part of
    // the total they do not account for (stock issued before issuances were
    // recorded, or a record the master no longer reflects) is dated by the
    // master's last issue, the only date it holds for it.
    const totalIssued = Number(master.legacyIssuedQty) || 0;
    const recorded = (issuesByMaster.get(String(master._id)) ?? [])
      .slice()
      .sort((first, second) => first.monthKey - second.monthKey);

    const outflows = [];
    let dated = 0;

    recorded.forEach((issue) => {
      const quantity = Math.min(issue.quantity, totalIssued - dated);
      if (quantity <= 0) return;
      outflows.push({ quantity, monthKey: issue.monthKey });
      dated += quantity;
    });

    if (totalIssued - dated > 0)
      outflows.push({
        quantity: totalIssued - dated,
        monthKey: master.legacyIssuedMonthKey ?? master.receivedMonthKey,
      });

    const cellKey = String(master.cell?._id ?? "unassigned");
    if (!cells.has(cellKey))
      cells.set(cellKey, { cell: master.cell ?? null, buckets: {} });
    const { buckets } = cells.get(cellKey);

    if (!buckets[master.ageBucket])
      buckets[master.ageBucket] = {
        qty: Array(MONTHS_IN_YEAR).fill(0),
        cost: Array(MONTHS_IN_YEAR).fill(0),
      };
    const bucket = buckets[master.ageBucket];

    for (let index = 0; index < reportedMonths; index += 1) {
      const cutoff = cutoffs[index];
      if (master.receivedMonthKey > cutoff) continue;

      const issued = outflows
        .filter((outflow) => outflow.monthKey <= cutoff)
        .reduce((sum, outflow) => sum + outflow.quantity, 0);

      // A master cannot hold less than nothing; a date that puts an issue
      // before its receipt must not pull the cell's balance below the stock
      // that really is there.
      const stock = Math.max(0, received - issued);

      bucket.qty[index] += stock;
      bucket.cost[index] += stock * unitCost;
    }
  });

  // Months that are not reported carry no figure at all, not a zero.
  const blank = (values) =>
    values.map((value, index) => (index < reportedMonths ? value : null));

  return [...cells.values()]
    .map(({ cell, buckets }) => ({
      cell,
      buckets: Object.fromEntries(
        Object.entries(buckets).map(([name, { qty, cost }]) => [
          name,
          { qty: blank(qty), cost: blank(cost) },
        ]),
      ),
    }))
    .filter(({ buckets }) =>
      Object.values(buckets).some(({ qty }) => qty.some((value) => value > 0)),
    );
};

module.exports = {
  monthKey,
  monthKeyOfFyMonth,
  buildCumulativeCellInventory,
};
