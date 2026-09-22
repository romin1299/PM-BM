const path = require("path");
const fs = require("fs/promises");
const fsSync = require("fs");
const multer = require("multer");

const tryCatchHandler = require("../../errorHandler/tryCatchHandler");
const logger = require("../../utils/LoggingController/loggers");
const {
  importSpareMasterFromExcel,
} = require("../../services/spareMaster/spareMasterImporter");

/**
 * Thin transport layer over the Spare Master import service: it takes the upload,
 * hands the file to the service, and returns what the service reports. Every
 * mapping, validation and write rule lives in services/spareMaster.
 */

const ACCEPTED_EXTENSIONS = [".xlsx", ".xlsm"];

// Ignored by git, so a fresh checkout has no folder for multer to write into.
const IMPORT_UPLOAD_DIR = path.join(__dirname, "../../spareMasterImports");
fsSync.mkdirSync(IMPORT_UPLOAD_DIR, { recursive: true });

const storageForMasterImport = multer.diskStorage({
  destination: (req, file, cb) => cb(null, IMPORT_UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`),
});

exports.uploadSpareMasterFile = multer({
  storage: storageForMasterImport,
  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(extension))
      return cb(new Error(`Only ${ACCEPTED_EXTENSIONS.join(" / ")} files can be imported`));
    return cb(null, true);
  },
});

exports.handleSpareMasterImport = tryCatchHandler(async (req, res, next) => {
  if (!req.file)
    return res.status(400).json({
      message: "Please attach the Spare Master Excel file to import",
      showToast: true,
    });

  /**
   * Defaults to a dry run. The legacy export resolves to a machine for well under
   * half its rows, so the Tool Room should always be able to read the outcome
   * before anything is written; committing is an explicit choice.
   */
  const dryRun = req.query?.commit !== "Yes";

  // Which catalogue: an uploaded master when the route named one (see
  // resolveSpareMasterType), otherwise the stock-in master.
  const masterType = req.spareMasterType;
  const label = masterType?.label ?? "Spare Master";

  try {
    const result = await importSpareMasterFromExcel(req.file.path, {
      dryRun,
      sheetName: req.query?.sheetName,
      plantId: req.query?.plantId,
      createdBy: req.rootUser,
      ...(masterType ? { model: masterType.model } : {}),
      // The response carries every warning; a workbook left beside a deleted
      // upload would only accumulate on disk.
      unresolvedMachinesReportPath: null,
    });

    return res.status(201).json({
      message: dryRun
        ? `${label} file validated. Re-send with commit=Yes to apply.`
        : `${label} imported successfully`,
      showToast: true,
      result,
    });
  } finally {
    // The upload is only an input to the import: once read, the data is in the
    // database and the workbook has no further use, so the temporary copy is
    // removed whether the run validated, imported or failed. A copy that could
    // not be removed is logged rather than left silently behind.
    await fs
      .unlink(req.file.path)
      .catch((error) =>
        logger.error(error, { spareMasterImportUpload: req.file.path }),
      );
  }
});

/**
 * Anything multer leaves in the upload folder from a request that never
 * reached the handler (an interrupted upload, a process restart mid-import)
 * is cleared at startup, so the folder only ever holds the file being read.
 */
const clearStaleUploads = async () => {
  try {
    const entries = await fs.readdir(IMPORT_UPLOAD_DIR);
    await Promise.all(
      entries.map((name) =>
        fs.unlink(path.join(IMPORT_UPLOAD_DIR, name)).catch(() => {}),
      ),
    );
    if (entries.length)
      logger.info(`Removed ${entries.length} stale spare master upload(s)`);
  } catch (error) {
    logger.error(error, { spareMasterImportUpload: IMPORT_UPLOAD_DIR });
  }
};
clearStaleUploads();
