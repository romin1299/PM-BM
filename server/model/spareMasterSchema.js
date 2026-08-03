const mongoose = require("mongoose");

const spareMasterSchema = new mongoose.Schema(
  {
    whichParts: String,
    location: String,
    uniqueID: String,
    partName: String,
    unit: String,
    partModel: String,
    partGroup: String,
    maker: String,
    registerSection: String,
    supplierName: String,
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
        availableQty: Number,
        overAllCost: Number,
      },
    ],
    vendorGroup: String,
    minQuantity: Number,
    maxQuantity: Number,
    leadTime: Number,
    quantityRequired: Number,
    status: {
      type: String,
      default: "requestSubmitted",
      enum: ["requestSubmitted", "masterCreated"],
    },

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

    machine: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MachinesAllData",
      },
      machine_code: String,
      machine_name: String,
      machine_nickname: String,
    },

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
spareMasterSchema.index({ "machine._id": 1, createdAt: -1 });

const SpareMaster = new mongoose.model("SpareMaster", spareMasterSchema);

module.exports = SpareMaster;
