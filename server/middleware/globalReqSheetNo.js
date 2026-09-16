const mongoose = require("mongoose");
const tryCatchHandler = require("../errorHandler/tryCatchHandler");
const Machine = require("../model/machineSchema");
const moment = require("moment-timezone");
const Line = require("../model/lineSchema");

/**
 * Each maintenance type numbers its sheets from its own counter on the line.
 *
 * New-Machine-CM used to fall through to the BM branch: it advanced BM's
 * counter and then read the number out of CM's, so every New-Machine-CM sheet
 * on a line carried the same number while quietly consuming BM's sequence.
 */
const COUNTER_FIELD_BY_TYPE = {
  BM: "requestSheetNos",
  CM: "requestSheetNoOfCM",
  "New-Machine-CM": "requestSheetNoOfNewMachineCM",
};

exports.globalReqSheetNo = tryCatchHandler(
  async (machineRef, maintenanceType) => {
    try {
      const counterField = COUNTER_FIELD_BY_TYPE[maintenanceType];
      if (!counterField)
        throw new Error(`No request-sheet counter for "${maintenanceType}"`);

      const machine = await Machine.findOne({
        _id: machineRef,
      })
        .populate({
          path: "line_names",
          populate: {
            path: "cell_names",
            populate: {
              path: "subSection_names",
              populate: {
                path: "section_names",
                populate: {
                  path: "plant_names",
                  model: "Plants",
                },
              },
            },
          },
        })
        .exec();

      // $inc is atomic, so two sheets raised at the same moment cannot read
      // the same count; a line that has never numbered this type starts at 1.
      const line = await Line.findOneAndUpdate(
        { _id: machine.line_names._id },
        { $inc: { [counterField]: 1 } },
        { new: true }
      );

      const subSection = machine?.line_names?.cell_names?.subSection_names;
      const section = subSection?.section_names;
      const prefixSource =
        section?.dashboardLevel === "Yes"
          ? section?.section_name
          : subSection?.subSection_name;

      return [
        prefixSource.trim().substring(0, 2).toUpperCase(),
        machine?.line_names?.line_name.trim(),
        moment().tz("Asia/Kolkata").month() + 1,
        maintenanceType,
        line?.[counterField],
      ].join("-");
    } catch (error) {
      console.log(error);
    }
  }
);
