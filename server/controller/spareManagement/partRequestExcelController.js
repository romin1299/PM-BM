const multer = require("multer");
const path = require("path");

const tryCatchHandler = require("../../errorHandler/tryCatchHandler");
const { jsonUploadErrors } = require("../../utils/jsonUploadErrors");
const {
  MAX_PARTS,
  buildTemplateWorkbook,
  readPartsFromWorkbook,
} = require("../../services/spare/partRequestExcelService");

/**
 * Thin transport over the part-request Excel service: it takes the upload,
 * hands the bytes to the service and reports what comes back. The column list,
 * the template and every rule about a row live in the service.
 */

const MAX_FILE_MB = 2;
const REQUEST_TYPES = ["For use", "For stock in"];
const TEMPLATE_FILE_NAME = "Spare_Part_Request_Template.xlsx";

// Read straight from memory: the file is small, parsed once and not kept.
exports.uploadPartsWorkbook = jsonUploadErrors(
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_MB * 1024 * 1024 },
    fileFilter: (req, file, cb) =>
      path.extname(file.originalname).toLowerCase() === ".xlsx"
        ? cb(null, true)
        : cb(new Error("Only an Excel (.xlsx) file can be uploaded")),
  }).single("file"),
  { fileLabel: "The Excel file", maxMb: MAX_FILE_MB },
);

exports.downloadPartRequestTemplate = tryCatchHandler(async (req, res) => {
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${TEMPLATE_FILE_NAME}"`,
  );

  await buildTemplateWorkbook().xlsx.write(res);
  res.end();
});

exports.importPartRequestParts = tryCatchHandler(async (req, res) => {
  const { newPartFor } = req.query;

  // Min / Max Quantity are read only for a stock-in request, so the type has to
  // be known before the file can be read.
  if (!REQUEST_TYPES.includes(newPartFor))
    return res.status(400).json({
      message: "Please select For use or For stock in before uploading",
      showToast: true,
    });

  if (!req.file)
    return res.status(400).json({
      message: "Please attach the Excel file",
      showToast: true,
    });

  const { parts, errors } = await readPartsFromWorkbook(req.file.buffer, {
    newPartFor,
  });

  if (errors.length)
    return res.status(400).json({
      message: `The file has ${errors.length} problem${errors.length === 1 ? "" : "s"}; nothing was filled in`,
      errors,
      showToast: true,
    });

  return res.status(201).json({
    message: `${parts.length} part${parts.length === 1 ? "" : "s"} read from the file`,
    parts,
    maxParts: MAX_PARTS,
  });
});
