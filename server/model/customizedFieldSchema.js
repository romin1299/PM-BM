const mongoose = require("mongoose");

const makerSchema = new mongoose.Schema({
  maker: {
    type: String,
  },
});

const Maker = new mongoose.model("Makers", makerSchema);

const supplierSchema = new mongoose.Schema({
  supplierName: {
    type: String,
  },
});

const Supplier = new mongoose.model("Suppliers", supplierSchema);

const unitSchema = new mongoose.Schema({
  unit: {
    type: String,
  },
});

const Unit = new mongoose.model("Units", unitSchema);

const partGroupSchema = new mongoose.Schema({
  partGroup: {
    type: String,
  },
});

const PartGroup = new mongoose.model("PartGroups", partGroupSchema);

const vendorGroupSchema = new mongoose.Schema({
  vendorGroup: {
    type: String,
  },
});

const VendorGroup = new mongoose.model("VendorGroups", vendorGroupSchema);

const supplierCategorySchema = new mongoose.Schema({
  supplierCategory: {
    type: String,
  },
});

const SupplierCategory = new mongoose.model(
  "SupplierCategories",
  supplierCategorySchema,
);

module.exports = {
  Maker,
  Supplier,
  Unit,
  PartGroup,
  VendorGroup,
  SupplierCategory,
};
