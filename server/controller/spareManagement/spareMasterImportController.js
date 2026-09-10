const path = require("path");
const fs = require("fs/promises");
const multer = require("multer");

const tryCatchHandler = require("../../errorHandler/tryCatchHandler");
const {
  importSpareMasterFromExcel,
} = require("../../services/spareMaster/spareMasterImporter");

/**
 * Thin transport layer over the Spare Master import service: it takes the upload,
 * hands the file to the service, and returns what the service reports. Every
 * mapping, validation and write rule lives in services/spareMaster.
 */

const ACCEPTED_EXTENSIONS = [".xlsx", ".xlsm"];

const storageForMasterImport = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../../spareMasterImports")),
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

  try {
    const result = await importSpareMasterFromExcel(req.file.path, {
      dryRun,
      sheetName: req.query?.sheetName,
      plantId: req.query?.plantId,
      createdBy: req.rootUser,
    });

    return res.status(201).json({
      message: dryRun
        ? "Spare Master file validated. Re-send with commit=Yes to apply."
        : "Spare Master imported successfully",
      showToast: true,
      result,
    });
  } finally {
    // The upload is only an input to the import; the result is the record worth
    // keeping, so the temporary copy does not accumulate on disk.
    await fs.unlink(req.file.path).catch(() => {});
  }
});
