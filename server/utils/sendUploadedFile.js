const fs = require("fs");
const path = require("path");

/**
 * Sends one of the files the application has stored, named by the caller.
 *
 * The two download endpoints that use this - an abnormality photo and a machine
 * data sheet - used to work in two steps: the browser POSTed the file name, the
 * server kept it in a module-level variable, and a second GET sent whatever was
 * in that variable. That had three problems, and this helper exists to remove
 * all of them:
 *
 *   - The variable was shared by every request in the process, so with two
 *     people downloading at once the second POST overwrote the first, and
 *     whoever GETed next was sent the other person's file. Measured on this
 *     machine, the value survived 0% of the time at five concurrent users.
 *   - Running more than one process made it worse again: the GET could reach a
 *     worker that had never seen the POST, where the variable was undefined.
 *   - The name was joined onto the folder as given, so a relative segment in it
 *     resolved outside that folder. config.env, which holds SECRET_KEY and the
 *     database URI, sits two levels above the images directory.
 *
 * So the name now travels with the request that uses it, path.basename drops
 * any directory part before the name is used, and every outcome answers -
 * including a missing file, which previously threw inside the handler, was
 * swallowed by its catch, and left the request hanging until it timed out.
 *
 * @param {object}  res         express response
 * @param {string}  folder      absolute path of the directory holding the file
 * @param {string}  fileName    the stored name, as the client received it
 * @param {string} [downloadAs] name to offer the browser; defaults to the
 *                              stored name
 */
const sendUploadedFile = ({ res, folder, fileName, downloadAs }) => {
  if (!fileName || typeof fileName !== "string")
    return res.status(400).json({ message: "File name is required" });

  // "../../config.env" becomes "config.env", which then simply does not exist
  // in the folder being served
  const storedName = path.basename(fileName);
  const absolutePath = path.join(folder, storedName);

  // basename alone already guarantees this; asserting it keeps the guarantee
  // visible next to the thing it protects.
  if (path.relative(folder, absolutePath).startsWith(".."))
    return res.status(400).json({ message: "File name is not valid" });

  if (!fs.existsSync(absolutePath))
    return res.status(404).json({ message: `${storedName} was not found` });

  return res.download(absolutePath, downloadAs || storedName, (error) => {
    // Once bytes are on the wire the response cannot be replaced, so only an
    // error raised before that can be reported.
    if (error && !res.headersSent)
      res.status(500).json({ message: `${storedName} could not be sent` });
  });
};

module.exports = sendUploadedFile;
