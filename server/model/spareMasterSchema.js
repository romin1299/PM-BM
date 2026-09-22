const mongoose = require("mongoose");
const { plantToMachineHierarchyObj } = require("./common");

const spareMasterSchema = new mongoose.Schema(
  {
    whichParts: String,

    /**
     * Storage location code, e.g. "A01A01". For an imported master this is the
     * legacy parts-master's PartsNumber column — that system keyed parts by
     * where they were kept — and it is what a re-import matches on.
     */
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
     * The manufacturer's part number, entered on the master form. The legacy
     * export carries no such column, so an imported master has none until
     * someone fills it in; uniqueID is this application's own identity for the
     * same part and the two are deliberately separate.
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
    /**
     * Drawings for the part, in the same shape a request-sheet part holds them
     * and sharing the same files under spareDocuments. Drawings attached to a
     * part on a request-sheet are added here for its master; the master's own
     * edit page can add to and prune the list independently of any sheet.
     */
    drawingAttach: [
      {
        filename: String,
        originalname: String,
      },
    ],
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
     * The legacy system's record dates (its CreateDate / ChangeDate columns),
     * kept as they were. createDate stays unset when the source had none;
     * dateTime below is the application's own creation stamp and always exists.
     */
    createDate: Date,
    changeDate: Date,

    /** Exchange rate the source quoted for the part's currency at import. */
    currencyRate: Number,

    /**
     * The legacy system's own keys and flags, kept for traceability and for
     * matching on a future re-import. Namespaced rather than promoted because the
     * codes duplicate values already stored by name and the flags are constant
     * across the export, so none of them are business fields on their own.
     * machineName / equipmentCodes are the source's machine columns verbatim,
     * whether or not they resolved to a machine in this application.
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
      machineName: String,
      equipmentCodes: [String],
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
 * location is the key the Excel importer upserts on (the legacy PartsNumber).
 * Without this index every upsert in a bulk load scans the whole collection,
 * which turns an import into quadratic work — indexing the upsert key took a
 * 17.6k-row import from ~171s to a few seconds. Not declared unique: the
 * collection predates the key and may still hold records that never had one.
 */
spareMasterSchema.index(
  { location: 1 },
  {
    name: "SpareMasterLocationIndex",
    background: true,
  },
);

/** partNumber is searched on directly (part search, master search). */
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

/**
 * The Recycle and Repaired parts masters hold the same record shape but are
 * separate catalogues in separate collections: they are uploaded by the Tool
 * Room from their own workbooks, and nothing that counts stock-in inventory
 * (KPIs, reorders, issuance) may see them. See model/spareMasterTypes.js.
 */
mongoose.model("RecyclePartsMaster", spareMasterSchema);
mongoose.model("RepairedPartsMaster", spareMasterSchema);

module.exports = SpareMaster;
