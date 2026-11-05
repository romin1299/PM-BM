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
 * A request to delete a spare part (FO/MTD/05/05/02). The paper form has one
 * part — unlike the change request's NEW/OLD pair — but the same approval route
 * and the same tool-room section, so it reuses the shared shapes.
 */
const spareDeleteRequestSchema = new mongoose.Schema(
  {
    /** "DR-0001" — the plant's running number. */
    requestNo: String,

    requestFor: {
      type: String,
      enum: ["MTD", "PRD"],
      required: true,
    },

    partName: {
      type: String,
      required: true,
    },
    partNo: {
      type: String,
      required: true,
    },
    /** Chosen from the makers catalogue, as on the request-sheet form. */
    maker: String,
    price: Number,
    qty: Number,

    line: { ...lineRefSchema },
    machine: { ...machineRefSchema },

    reason: {
      type: String,
      required: true,
    },
    requestDate: String,

    /** "ONLY FOR TOOL ROOM USE" on the form. */
    toolRoom: {
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

spareDeleteRequestSchema.index(
  { requestNo: 1 },
  { unique: true, sparse: true },
);
spareDeleteRequestSchema.index({ createdAt: -1 });
spareDeleteRequestSchema.index({ requestStatus: 1, createdAt: -1 });
spareDeleteRequestSchema.index({ pendingApprovalBy: 1, createdAt: -1 });
spareDeleteRequestSchema.index({
  "rsTimeStamp.year.inString": 1,
  createdAt: -1,
});

const SpareDeleteRequest = new mongoose.model(
  "SpareDeleteRequest",
  spareDeleteRequestSchema,
);

module.exports = SpareDeleteRequest;
