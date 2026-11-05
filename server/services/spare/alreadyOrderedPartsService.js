/**
 * Parts that are already on a request-sheet in the ordering dashboard.
 *
 * A sheet is in the Ordered Spare Part Tracking dashboard once its budget is
 * settled - OK, or NG with the MTD HOD's acceptance (the same rule the
 * dashboard's own query applies). A part model on such a sheet is already being
 * ordered, so raising it again would order it twice.
 *
 * Rejected sheets are left out: a rejection is final and the requester is told
 * to raise a new sheet, so the same parts must be free to request again.
 */
const RequestSheetOfSpare = require("../../model/requestSheetDataOfSpare");
const { spareRejectedStatus } = require("../../utils/spareManagementUtils");

/**
 * @param {string[]} partModels trimmed part models about to be requested
 * @returns {Promise<{ partModel: string, requestSheetNo: string }[]>} one entry
 *   per model already ordered, with the sheet it is on
 */
const findAlreadyOrderedParts = async (partModels = []) => {
  if (!partModels.length) return [];

  const found = await RequestSheetOfSpare.aggregate([
    {
      $match: {
        requestSheetStatus: { $ne: spareRejectedStatus },
        "changeParts.partModel": { $in: partModels },
        $or: [
          { "budget.budgetStatus": "OK" },
          {
            "budget.budgetStatus": "NG",
            "mtdHODApprovalIfBudgetIsNG.approvalStatus": "Accepted",
          },
        ],
      },
    },
    { $unwind: "$changeParts" },
    { $match: { "changeParts.partModel": { $in: partModels } } },
    {
      $group: {
        _id: "$changeParts.partModel",
        requestSheetNo: { $first: "$requestSheetNo" },
      },
    },
  ]).collation({ locale: "en", strength: 2 });
  // Strength 2: "ab-1" and "AB-1" are one part.

  return found.map(({ _id, requestSheetNo }) => ({
    partModel: _id,
    requestSheetNo,
  }));
};

module.exports = { findAlreadyOrderedParts };
