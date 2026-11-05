/**
 * Wraps a multer middleware so its failures (wrong file type, file too large,
 * unwritable folder) answer as JSON like every other refusal. Left alone they
 * reach Express's default handler, which sends an HTML error page that the
 * browser cannot show as a message.
 *
 * @param {Function} uploadMiddleware e.g. upload.single("file")
 * @param {{ fileLabel?: string, maxMb?: number }} [options] how the file is
 *   named in the message, and the size limit the middleware was built with
 */
const multer = require("multer");

const jsonUploadErrors =
  (uploadMiddleware, { fileLabel = "File", maxMb } = {}) =>
  (req, res, next) =>
    uploadMiddleware(req, res, (error) => {
      if (!error) return next();

      const message =
        error?.code === "LIMIT_FILE_SIZE"
          ? `${fileLabel} must be ${maxMb ?? "a smaller number of"} MB or smaller`
          : error instanceof multer.MulterError
            ? `${fileLabel} could not be uploaded (${error.message})`
            : error?.message || `${fileLabel} could not be uploaded`;

      return res.status(400).json({ message, showToast: true });
    });

module.exports = { jsonUploadErrors };
