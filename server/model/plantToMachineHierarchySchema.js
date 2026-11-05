const mongoose = require("mongoose");

const plantToMachineHierarchySchema = new mongoose.Schema({
  machine: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MachinesAllData",
    },
    machine_code: {
      type: String,
    },
    machine_name: {
      type: String,
    },
    machine_nickname: {
      type: String,
    },
  },
  line: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lines",
    },
    line_name: {
      type: String,
    },
  },
  cell: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cells",
    },
    cell_name: {
      type: String,
    },
  },
  subSection: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubSections",
    },
    subSection_name: {
      type: String,
    },
  },
  section: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sections",
    },
    section_name: {
      type: String,
    },
    dashboardLevel: {
      type: String,
    },
  },
  plant: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plants",
    },
    plant_name: {
      type: String,
    },
  },
});

/**
 * Every BM sheet, every CM sheet and every reflected CM resolves its snapshot
 * by `machine._id`, and without an index each of those writes scans the whole
 * collection first. The lookup is an exact match used by a findOneAndUpdate,
 * so an index cannot change which document is chosen or the order of anything
 * — it only stops the scan.
 */
plantToMachineHierarchySchema.index(
  { "machine._id": 1 },
  { name: "PlantToMachineHierarchyMachineIndex", background: true },
);

const PlantToMachineHierarchy = new mongoose.model(
  "PlantToMachineHierarchy",
  plantToMachineHierarchySchema
);

module.exports = PlantToMachineHierarchy;
