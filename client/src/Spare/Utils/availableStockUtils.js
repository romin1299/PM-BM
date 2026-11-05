/**
 * Parts on an issuance sheet whose master has no stock left.
 *
 * A master with nothing available cannot be issued — there is no quantity to
 * take out. A part that is not drawn from a master (a manual "Issue Other"
 * line) has no availability figure and is not checked here. When a master-backed
 * part has no figure at all, the server checks it from the database instead.
 */
export const partsWithoutAvailableStock = (parts = []) => [
  ...new Set(
    (parts ?? [])
      .filter((part) => {
        const fromMaster = Boolean(part?.masterId || part?.budgetDetails);
        if (!fromMaster) return false;
        const available = part?.budgetDetails?.overAllAvailableQty;
        if (available === undefined || available === null) return false;
        return Number(available) <= 0;
      })
      .map(
        (part) =>
          part?.partName || part?.partNumber || part?.location || "part",
      ),
  ),
];

export default partsWithoutAvailableStock;
