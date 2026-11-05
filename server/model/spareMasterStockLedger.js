const mongoose = require("mongoose");

/**
 * Stock-ledger for a spare-part master.
 *
 * Every movement — an order placed, a receipt from the ordering dashboard, or
 * a Tool-Room issuance approval — is written here as an immutable row so there
 * is a full, auditable history of how the stock level changed over time.
 *
 * New vs. Used classification:
 *   The user has not yet decided which movements are "new" and which are
 *   "used". All qty fields are therefore nullable; the New/Used split is
 *   preserved in the schema so the columns appear in the UI and the logic can
 *   be filled in later without a migration.
 */
const spareMasterStockLedgerSchema = new mongoose.Schema(
  {
    /** The stock-in master this row belongs to. */
    masterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SpareMaster",
      required: true,
      index: true,
    },

    /**
     * What kind of movement created this row.
     *   ORDER     – a Spare Part Request (Order / Stock-in) sheet was generated.
     *   STOCK_IN  – a part receipt was recorded in the Ordering Dashboard.
     *   STOCK_OUT – Tool Room approved an issuance sheet line.
     */
    entryType: {
      type: String,
      enum: ["ORDER", "STOCK_IN", "STOCK_OUT"],
      required: true,
    },

    /** The date the movement occurred (ISO Date). */
    processingDate: {
      type: Date,
      required: true,
    },

    /* ─── Stock Out ─────────────────────────────────────────────────────── */
    stockOutQtyNew: { type: Number, default: null },
    stockOutQtyUsed: { type: Number, default: null },

    /* ─── Stock In ──────────────────────────────────────────────────────── */
    stockInQtyNew: { type: Number, default: null },
    stockInQtyUsed: { type: Number, default: null },

    /* ─── Adjusted (reserved for future manual corrections) ────────────── */
    adjustedQtyNew: { type: Number, default: null },
    adjustedQtyUsed: { type: Number, default: null },

    /* ─── Running balance snapshot at the time of this entry ───────────── */
    stockQtyNew: { type: Number, default: 0 },
    stockQtyUsed: { type: Number, default: 0 },

    /* ─── Order fields (populated for ORDER entries) ────────────────────── */
    /** Quantity ordered on the spare request sheet. */
    orderQty: { type: Number, default: null },

    /**
     * Where the stock went out to, for STOCK_OUT entries: copied from the
     * issuance sheet's own section and machine so the ledger can answer "which
     * section / machine used this stock" without joining back to the sheet.
     * Empty on ORDER and STOCK_IN rows.
     */
    section: {
      _id: { type: mongoose.Schema.Types.ObjectId },
      section_id: String,
      section_name: String,
    },
    machine: {
      _id: { type: mongoose.Schema.Types.ObjectId },
      machine_code: String,
      machine_name: String,
    },

    /**
     * Order / PO reference number.
     * For ORDER entries: the requestSheetNo.
     * For STOCK_IN / STOCK_OUT entries: the PO number from the ordering dashboard.
     */
    orderNo: { type: String, default: null },

    /* ─── Back-reference to the source document ─────────────────────────── */
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    referenceModel: {
      type: String,
      enum: ["RequestSheetOfSpare", "SpareMaster", "SpareIssuanceSummary"],
      default: null,
    },

    /** The user whose action triggered this entry. */
    createdBy: {
      tm_no: Number,
      tm_name: String,
    },
  },
  {
    timestamps: true,
  },
);

/* Compound index: history for one master, newest first. */
spareMasterStockLedgerSchema.index({ masterId: 1, processingDate: -1 });

const SpareMasterStockLedger = mongoose.model(
  "SpareMasterStockLedger",
  spareMasterStockLedgerSchema,
);

module.exports = SpareMasterStockLedger;
