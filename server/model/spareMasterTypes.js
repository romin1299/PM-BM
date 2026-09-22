const mongoose = require("mongoose");
const SpareMaster = require("./spareMasterSchema");

/**
 * The three parts masters, keyed by the segment a route names them with.
 *
 * Stock-in is the working inventory: loaded once from the legacy export by the
 * backend script and then maintained through registration and receipts. The
 * other two are reference catalogues the Tool Room uploads from Excel, on the
 * same column layout, and re-uploads as they change. They live in their own
 * collections so that nothing counting stock-in inventory ever sees them.
 */
const SPARE_MASTER_TYPES = {
  stockIn: {
    key: "stockIn",
    label: "Stock-in Parts Master",
    model: SpareMaster,
    uploadable: false,
  },
  recycle: {
    key: "recycle",
    label: "Recycle Parts Master",
    model: mongoose.model("RecyclePartsMaster"),
    uploadable: true,
  },
  repaired: {
    key: "repaired",
    label: "Repaired Parts Master",
    model: mongoose.model("RepairedPartsMaster"),
    uploadable: true,
  },
};

/** The type a route segment names, or undefined for anything else. */
const spareMasterTypeFor = (key) => SPARE_MASTER_TYPES[key];

/** Types the Tool Room may load from an uploaded workbook. */
const uploadableSpareMasterTypes = () =>
  Object.values(SPARE_MASTER_TYPES).filter((type) => type.uploadable);

module.exports = {
  SPARE_MASTER_TYPES,
  spareMasterTypeFor,
  uploadableSpareMasterTypes,
};
