const fs = require("fs");
const path = require("path");

const SpareMaster = require("../../model/spareMasterSchema");
const RequestSheetOfSpare = require("../../model/requestSheetDataOfSpare");

const DOCUMENTS_DIR = path.join(__dirname, "../../spareDocuments");

/**
 * Drawings live in one place — spareDocuments — and can be referenced from a
 * request-sheet part, from the part's master, or from both. This service keeps
 * the two in step and owns the one rule about the files themselves: a file is
 * deleted only when nothing references it any more.
 */

const toFileEntry = ({ filename, originalname }) => ({ filename, originalname });

/**
 * Adds drawings to a master, skipping any it already holds (by filename).
 * Returns the number added.
 */
const attachDrawingsToMaster = async (masterId, drawings = []) => {
  const incoming = drawings.filter((file) => file?.filename).map(toFileEntry);
  if (!masterId || !incoming.length) return 0;

  const master = await SpareMaster.findById(masterId, {
    drawingAttach: 1,
  }).lean();
  if (!master) return 0;

  const held = new Set((master.drawingAttach ?? []).map((f) => f.filename));
  const fresh = incoming.filter((file) => !held.has(file.filename));
  if (!fresh.length) return 0;

  await SpareMaster.updateOne(
    { _id: masterId },
    { $push: { drawingAttach: { $each: fresh } } },
  );

  return fresh.length;
};

/**
 * Carries every drawing on a sheet's parts across to the masters those parts
 * are linked to. Parts without a master yet are left for master registration,
 * which copies their drawings when the master is created.
 */
const syncSheetDrawingsToMasters = async (sheet) => {
  const parts = (sheet?.changeParts ?? []).filter(
    (part) => part?.masterId && part?.drawingAttach?.length,
  );

  let added = 0;
  for (const part of parts)
    added += await attachDrawingsToMaster(part.masterId, part.drawingAttach);

  return added;
};

/**
 * Whether any request-sheet part or any master still points at the file.
 * `except` names a document whose own reference is being removed and so
 * should not count.
 */
const isDrawingReferenced = async (filename, { except = {} } = {}) => {
  const [onMaster, onSheet] = await Promise.all([
    SpareMaster.exists({
      "drawingAttach.filename": filename,
      ...(except.masterId ? { _id: { $ne: except.masterId } } : {}),
    }),
    RequestSheetOfSpare.exists({
      "changeParts.drawingAttach.filename": filename,
      ...(except.sheetId ? { _id: { $ne: except.sheetId } } : {}),
    }),
  ]);

  return Boolean(onMaster || onSheet);
};

/**
 * Deletes a drawing's file unless something else still references it. The
 * name is resolved inside spareDocuments only, so a crafted request cannot
 * reach elsewhere.
 */
const removeDrawingFileIfUnreferenced = async (filename, options) => {
  if (!filename || path.basename(filename) !== filename) return false;
  if (await isDrawingReferenced(filename, options)) return false;

  await fs.promises.unlink(path.join(DOCUMENTS_DIR, filename)).catch((err) => {
    if (err.code !== "ENOENT") console.error(err);
  });

  return true;
};

module.exports = {
  toFileEntry,
  attachDrawingsToMaster,
  syncSheetDrawingsToMasters,
  isDrawingReferenced,
  removeDrawingFileIfUnreferenced,
};
