const mongoose = require("mongoose");

/**
 * Shapes shared by the Spare approval requests (change request, delete
 * request): the hierarchy refs stamped on a request, one approval step, and the
 * requester/stamp fields. Declared once so both schemas — and any later request
 * type — store the chain and the audit fields identically.
 */

const lineRefSchema = {
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lines",
  },
  line_id: String,
  line_name: String,
};

const machineRefSchema = {
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MachinesAllData",
  },
  machine_code: String,
  machine_name: String,
  machine_nickname: String,
};

const approvalStepSchema = new mongoose.Schema(
  {
    /** MTD_TL, MTD_HOSS, ... — also the key into the status map. */
    key: String,
    /** Display name for the stage, e.g. "MTD TL". */
    userType: String,
    user: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
      },
      tm_no: Number,
      tm_name: String,
      email: String,
    },
    approvalStatus: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected"],
      default: "Pending",
    },
    approvalDateAndTime: String,
    rejectedRemarks: String,
  },
  { _id: false },
);

const createdBySchema = {
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },
  tm_no: Number,
  tm_name: String,
  email: String,
  plant_data: String,
  section_data: String,
};

const dateTimeSchema = {
  inString: String,
  inDate: Date,
};

const rsTimeStampSchema = {
  year: {
    inString: String,
    inNumber: Number,
  },
  month: {
    inString: String,
    inNumber: Number,
  },
};

module.exports = {
  lineRefSchema,
  machineRefSchema,
  approvalStepSchema,
  createdBySchema,
  dateTimeSchema,
  rsTimeStampSchema,
};
