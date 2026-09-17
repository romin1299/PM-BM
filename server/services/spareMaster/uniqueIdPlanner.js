const SpareMaster = require("../../model/spareMasterSchema");

const { readMappedRows } = require("./excelReader");
const { transformRow } = require("./rowTransformer");
const { validateRow } = require("./rowValidator");
const {
  resolvePlantIdentity,
  reserveMasterUniqueIds,
  formatMasterUniqueId,
} = require("./masterUniqueIdService");

/**
 * Decides, before anything is written, which unique id each new master gets.
 *
 * The sequence follows the source's own history rather than the file's row
 * order: parts with no CreateDate come first, then the rest from the oldest
 * creation date to the newest, so the newest parts carry the highest ids. That
 * needs the whole file to be seen before the first id is handed out, which is
 * why this is a separate pass over the file — a cheap one, since it keeps only
 * a part number and a date per row, not the row.
 *
 * Parts the catalogue already holds keep their id and are not planned; a
 * re-import of the same file therefore assigns nothing. Ids are reserved per
 * plant, because each plant runs its own sequence.
 */

const EXISTING_LOOKUP_CHUNK = 5000;

/** Blank dates first, then ascending; ties keep file order. */
const byCreateDate = (a, b) => {
  if (!a.createDate && !b.createDate) return a.excelRow - b.excelRow;
  if (!a.createDate) return -1;
  if (!b.createDate) return 1;
  return a.createDate - b.createDate || a.excelRow - b.excelRow;
};

const findExistingPartNumbers = async (partNumbers) => {
  const existing = new Set();
  for (let i = 0; i < partNumbers.length; i += EXISTING_LOOKUP_CHUNK) {
    const chunk = partNumbers.slice(i, i + EXISTING_LOOKUP_CHUNK);
    const docs = await SpareMaster.find(
      { partNumber: { $in: chunk } },
      { partNumber: 1 },
    ).lean();
    docs.forEach((doc) => existing.add(doc.partNumber));
  }
  return existing;
};

/**
 * Returns { idByPartNumber, summary }. With `reserve: false` (a dry run) the
 * ordering is computed and reported but no sequence numbers are taken.
 */
const planUniqueIds = async (
  filePath,
  { sheetName, references, createdBy, reserve = true },
) => {
  const candidates = [];
  const seen = new Set();

  for await (const { excelRow, raw } of readMappedRows(filePath, { sheetName })) {
    const { document, costDetails, currency, createDate } = transformRow({
      raw,
      references,
    });
    const { errors } = validateRow({ excelRow, document, costDetails, currency, raw });

    // The same acceptance rules as the import itself: a row that will not be
    // written must not take an id.
    if (errors.length || seen.has(document.partNumber)) continue;
    seen.add(document.partNumber);

    candidates.push({
      excelRow,
      partNumber: document.partNumber,
      createDate,
      plant: resolvePlantIdentity({ master: document, fallbackUser: createdBy }),
    });
  }

  const existing = await findExistingPartNumbers(candidates.map((c) => c.partNumber));
  const fresh = candidates.filter((c) => !existing.has(c.partNumber));

  /**
   * One sequence per plant, each ordered on its own. Keyed by plant name: a row
   * whose machine resolved names its plant by id, a row whose machine did not
   * falls back to the importing user's plant by name, and both are the same
   * plant with the same counter — keyed apart they would take two blocks and
   * the ordering would hold only within each block.
   */
  const byPlant = new Map();
  fresh.forEach((candidate) => {
    const key = String(candidate.plant.plantName ?? candidate.plant.plantId ?? "");
    if (!byPlant.has(key)) byPlant.set(key, { plant: candidate.plant, parts: [] });
    const group = byPlant.get(key);
    // Prefer reserving by id when any row in the group knows it.
    if (!group.plant.plantId && candidate.plant.plantId) group.plant = candidate.plant;
    group.parts.push(candidate);
  });

  const idByPartNumber = new Map();
  const plants = [];

  for (const { plant, parts } of byPlant.values()) {
    parts.sort(byCreateDate);

    const reserved = reserve
      ? await reserveMasterUniqueIds({ ...plant, count: parts.length })
      : null;

    if (reserved)
      parts.forEach((part, index) =>
        idByPartNumber.set(
          part.partNumber,
          formatMasterUniqueId(reserved.prefix, reserved.firstSequence + index),
        ),
      );

    const dated = parts.filter((p) => p.createDate);
    plants.push({
      plant: plant.plantName ?? String(plant.plantId),
      toAssign: parts.length,
      withoutCreateDate: parts.length - dated.length,
      oldestCreateDate: dated[0]?.createDate ?? null,
      newestCreateDate: dated[dated.length - 1]?.createDate ?? null,
      firstId: reserved ? formatMasterUniqueId(reserved.prefix, reserved.firstSequence) : null,
      lastId:
        reserved && parts.length
          ? formatMasterUniqueId(reserved.prefix, reserved.firstSequence + parts.length - 1)
          : null,
    });
  }

  return {
    idByPartNumber,
    summary: {
      candidates: candidates.length,
      alreadyInCatalogue: candidates.length - fresh.length,
      planned: fresh.length,
      reserved: reserve,
      plants,
    },
  };
};

module.exports = { planUniqueIds, byCreateDate };
