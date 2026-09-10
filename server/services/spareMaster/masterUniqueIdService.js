const Plant = require("../../model/plantSchema");

/**
 * Assigns the Spare Master's own identity, e.g. "DNHAP1-0000001".
 *
 * The number comes from a per-plant counter incremented with $inc, following the
 * same approach the request-sheet numbers already use on Line. Reserving a block
 * up front rather than one number per record keeps a bulk import to one update
 * per plant instead of one per row.
 *
 * Gaps in the sequence are accepted. A reserved number that ends up unused —
 * because the record turned out to already exist — is simply skipped; the id has
 * to be unique, not contiguous.
 */

const SEQUENCE_PAD = 7;

/**
 * "DNHA-P1" -> "DNHAP1". Separators are stripped so the prefix stays a single
 * token and the hyphen in the id always marks the start of the sequence.
 */
const plantPrefix = (plantName) =>
  String(plantName ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

const formatMasterUniqueId = (prefix, sequence) =>
  `${prefix}-${String(sequence).padStart(SEQUENCE_PAD, "0")}`;

/**
 * A master's plant, falling back to the plant of whoever is creating it.
 *
 * Roughly half the imported catalogue has no resolved machine and therefore no
 * plant block, but those parts still belong to the plant whose catalogue is being
 * loaded, and every master needs an id. plant_data is stored as "P1-DNHA-P1".
 */
const resolvePlantIdentity = ({ master, fallbackUser }) => {
  if (master?.plant?._id)
    return { plantId: master.plant._id, plantName: master.plant.plant_name };

  const plantData = fallbackUser?.plant_data;
  if (!plantData) return { plantId: null, plantName: null };

  const [, ...nameParts] = String(plantData).split("-");
  return { plantId: null, plantName: nameParts.join("-") };
};

/**
 * Reserves `count` sequence numbers for a plant and returns the first one.
 * Identified by plant name when the caller has no id, which is the case for
 * imported masters whose machine never resolved.
 */
const reserveMasterUniqueIds = async ({ plantId, plantName, count }) => {
  if (count <= 0) return null;

  const filter = plantId ? { _id: plantId } : { plant_name: plantName };

  const plant = await Plant.findOneAndUpdate(
    filter,
    { $inc: { spareMasterUniqueIDSeq: count } },
    { new: true, projection: { plant_name: 1, spareMasterUniqueIDSeq: 1 } },
  );

  if (!plant) return null;

  return {
    prefix: plantPrefix(plant.plant_name),
    // $inc returns the value after the block was taken, so the block starts
    // `count` back from it.
    firstSequence: plant.spareMasterUniqueIDSeq - count + 1,
  };
};

/**
 * Reserves one id at a time, for the single-master registration path.
 */
const generateMasterUniqueId = async ({ master, fallbackUser }) => {
  const { plantId, plantName } = resolvePlantIdentity({ master, fallbackUser });
  if (!plantId && !plantName) return null;

  const reserved = await reserveMasterUniqueIds({ plantId, plantName, count: 1 });
  if (!reserved) return null;

  return formatMasterUniqueId(reserved.prefix, reserved.firstSequence);
};

module.exports = {
  plantPrefix,
  formatMasterUniqueId,
  resolvePlantIdentity,
  reserveMasterUniqueIds,
  generateMasterUniqueId,
};
