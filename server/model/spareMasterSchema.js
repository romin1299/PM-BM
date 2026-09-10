const mongoose = require("mongoose");
const { plantToMachineHierarchyObj } = require("./common");

const spareMasterSchema = new mongoose.Schema(
  {
    whichParts: String,
    location: String,

    /**
     * System-assigned identity for the part, e.g. "DNHAP1-0000001": the plant name
     * with separators stripped, then a zero-padded sequence from that plant's
     * counter. Assigned once when the master is created and never reassigned, so
     * every request-sheet raised for the part — the first order and every reorder
     * after it — reports the same id. Not user-editable.
     */
    uniqueID: String,

    /**
     * The manufacturer's / legacy system's part number (the parts-master
     * PartsNumber column). This is the human-facing key people search by and the
     * key a re-import matches on; uniqueID is this application's own identity for
     * the same part and the two are deliberately separate.
     */
    partNumber: String,

    partName: String,
    unit: String,
    partModel: String,
    partGroup: String,
    maker: String,
    registerSection: String,
    supplierName: String,
    supplierCategory: String,
    costDetails: [
      {
        partId: {
          type: mongoose.Schema.Types.ObjectId,
        },
        quantity: Number, // stock quantity
        currencyUnit: String,
        cost: Number,
        costInINR: Number,
        issuedQty: Number,
        issuedCost: Number,
        balanceQty: Number,
        availableQty: Number,
        overAllCost: Number,
      },
    ],
    vendorGroup: String,

    /**
     * Secondary equipment codes a part also serves, carried over from the legacy
     * parts master (Equipment2 / Equipment3). Codes only — the plant hierarchy is
     * resolved from the primary machine alone, so these deliberately hold no
     * reference and drive no dashboard filtering.
     */
    additionalMachineCodes: [String],
    minQuantity: Number,
    maxQuantity: Number,
    leadTime: Number,
    quantityRequired: Number,

    /**
     * Ordering policy carried over from the legacy parts master. orderPoint is
     * that system's reorder trigger and is kept distinct from minQuantity, which
     * maps to its MinOrder column.
     */
    orderPoint: Number,
    orderQty: Number,
    orderType: String,
    controlType: String,
    stockTaking: String,
    remarks: String,

    /**
     * Issue history as it stood in the legacy system at the point of import.
     * Separate from costDetails.issuedQty, which counts only issues this
     * application has processed, so the two must not be added together.
     */
    lastIssuedDate: Date,
    previousIssuedDate: Date,
    totalIssuedQty: Number,
    secondaryTotalIssuedQty: Number,

    /**
     * The legacy system's own keys and flags, kept for traceability and for
     * matching on a future re-import. Namespaced rather than promoted because the
     * codes duplicate values already stored by name and the flags are constant
     * across the export, so none of them are business fields on their own.
     */
    legacyRef: {
      supplierCode: String,
      makerCode: String,
      unitCode: String,
      currencyCode: String,
      sectionCode: String,
      mcSectionCode: String,
      mcSectionName: String,
      secondaryUnitPrice: Number,
      drawingYN: String,
      drawingPrintYN: String,
      drawingPrintQty: Number,
      subPartsSwitch: String,
      changedOn: Date,
    },
    status: {
      type: String,
      default: "requestSubmitted",
      enum: ["requestSubmitted", "masterCreated"],
    },
    reasonForZeroStockRemarks: String,
    reasonForKeepingDeadStockRemarks: String,

    createdBy: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
      },
      tm_no: Number,
      tm_name: String,
      email: String,
      plant_data: String,
    },

    dateTime: {
      inString: String,
      inDate: Date,
    },

    ...plantToMachineHierarchyObj,

    rsTimeStamp: {
      year: {
        inString: String, //financial
        inNumber: Number,
      },
      month: {
        inString: String,
        inNumber: Number,
      },
    },
  },
  {
    timestamps: true,
  },
);

spareMasterSchema.index(
  {
    location: "text",
    "machine.machine_name": "text",
    "machine.machine_code": "text",
  },
  {
    name: "SpareMasterFullTextIndex",
    weights: {
      location: 10,
      "machine.machine_code": 9,
      "machine.machine_name": 8,
    },
  },
);
spareMasterSchema.index({ createdAt: -1 });
spareMasterSchema.index({ spareSheetId: 1, createdAt: -1 });
spareMasterSchema.index(
  {
    "rsTimeStamp.year.inString": -1,
    "rsTimeStamp.month.inString": -1,
  },
  {
    name: "YearMonthIndex",
    background: true,
  },
);
spareMasterSchema.index(
  {
    "rsTimeStamp.year.inString": 1,
    maxQuantity: 1,
  },
  {
    name: "StockLevelAnalysisIndex",
    partialFilterExpression: { maxQuantity: { $gte: 1 } },
    background: true,
  },
);
spareMasterSchema.index({ "machine._id": 1, createdAt: -1 });

/**
 * partNumber is the business key the Excel importer upserts on. Without this
 * index every upsert in a bulk load scans the whole collection, which turns an
 * import into quadratic work — indexing it took a 17.6k-row import from ~171s to
 * a few seconds. Not declared unique: the collection predates the key and may
 * still hold records that never had one.
 */
spareMasterSchema.index(
  { partNumber: 1 },
  {
    name: "SpareMasterPartNumberIndex",
    background: true,
  },
);

/** uniqueID is looked up directly from search and the dashboards. */
spareMasterSchema.index(
  { uniqueID: 1 },
  {
    name: "SpareMasterUniqueIDIndex",
    background: true,
  },
);

const SpareMaster = new mongoose.model("SpareMaster", spareMasterSchema);

module.exports = SpareMaster;
