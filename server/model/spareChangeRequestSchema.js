const mongoose = require("mongoose");

const {
  lineRefSchema,
  machineRefSchema,
  approvalStepSchema,
  createdBySchema,
  dateTimeSchema,
  rsTimeStampSchema,
} = require("./spareRequestCommon");

/**
 * One side of a change request: the part as it is (OLD) or as it should
 * become (NEW). Both sides carry the same fields the paper form has, so they
 * share this shape.
 */
const partDetailsSchema = new mongoose.Schema(
  {
    partName: String,
    partNo: String,
    /** Chosen from the makers catalogue, as on the request-sheet form. */
    maker: String,
    maxQty: Number,
    minQty: Number,
    monthlyRequirement: Number,
    stockInQty: Number,
    /**
     * Where this side of the change sits. Each column has its own line →
     * machine cascade on the form, so the OLD part can be on one machine and the
     * NEW part on another; both are resolved server-side from the machine id.
     */
    line: { ...lineRefSchema },
    machine: { ...machineRefSchema },
  },
  { _id: false },
);

const spareChangeRequestSchema = new mongoose.Schema(
  {
    /** "CR-0001" — the plant's running number, shown on the dashboard. */
    requestNo: String,

    requestFor: {
      type: String,
      enum: ["MTD", "PRD"],
      required: true,
    },
    partsCategory: {
      type: String,
      enum: ["NEW", "RE-USE"],
      required: true,
    },

    newPart: partDetailsSchema,
    oldPart: partDetailsSchema,

    reason: {
      type: String,
      required: true,
    },
    requestDate: String,

    /** "ONLY FOR TOOL ROOM USE" on the form; the tool room may fill it. */
    toolRoom: {
      locationNo: String,
      requestStatus: {
        type: String,
        enum: ["OK", "NOT OK"],
        default: null,
      },
    },

    approvals: [approvalStepSchema],
    currentApprovalIndex: {
      type: Number,
      default: 0,
    },
    pendingApprovalBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    },
    /** "Under MTD TL approval", ... "Completed" or "Rejected". */
    requestStatus: String,

    createdBy: { ...createdBySchema },

    dateTime: { ...dateTimeSchema },
    rsTimeStamp: { ...rsTimeStampSchema },
  },
  {
    timestamps: true,
  },
);

spareChangeRequestSchema.index(
  { requestNo: 1 },
  { unique: true, sparse: true },
);
spareChangeRequestSchema.index({ createdAt: -1 });
spareChangeRequestSchema.index({ requestStatus: 1, createdAt: -1 });
spareChangeRequestSchema.index({ pendingApprovalBy: 1, createdAt: -1 });
spareChangeRequestSchema.index({
  "rsTimeStamp.year.inString": 1,
  createdAt: -1,
});

const SpareChangeRequest = new mongoose.model(
  "SpareChangeRequest",
  spareChangeRequestSchema,
);

module.exports = SpareChangeRequest;
