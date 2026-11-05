const Plant = require("../../model/plantSchema");

/**
 * Takes the next request number for a plant from a counter on the plant
 * document ("CR-0001", "DR-0001", ...).
 *
 * `$inc` is atomic, so two requests raised at the same moment cannot read the
 * same number; gaps are acceptable, collisions are not.
 */
const nextRequestNo = async ({ plantData, counterField, prefix }) => {
  const plantId = String(plantData ?? "").split("-")[0];
  const plant = await Plant.findOneAndUpdate(
    { plant_id: plantId },
    { $inc: { [counterField]: 1 } },
    { new: true },
  );

  if (!plant) return { error: `Plant "${plantId}" does not exist` };

  return {
    requestNo: `${prefix}-${String(plant[counterField] ?? 1).padStart(4, "0")}`,
  };
};

module.exports = { nextRequestNo };
