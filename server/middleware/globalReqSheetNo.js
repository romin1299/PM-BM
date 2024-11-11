const mongoose = require("mongoose");
const tryCatchHandler = require("../errorHandler/tryCatchHandler");
const Machine = require("../model/machineSchema");
const moment = require("moment-timezone");
const Line = require("../model/lineSchema");

// function globalReqSheetNo(machineRef, maintenanceType) {

// }

exports.globalReqSheetNo = tryCatchHandler(
  async (machineRef, maintenanceType) => {
    try {
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
      let generateRequestSheetNo;
      // console.log(machine.line_names.requestSheetNoOfCM);
      if (maintenanceType === "CM") {
        generateRequestSheetNo = {
          requestSheetNoOfCM: machine.line_names.requestSheetNoOfCM
            ? machine.line_names.requestSheetNoOfCM + 1
            : 1,
        };
      } else {
        generateRequestSheetNo = {
          requestSheetNos: machine.line_names.requestSheetNos
            ? machine.line_names.requestSheetNos + 1
            : 1,
        };
      }
      let increaseCountOfRequestSheetInLine = await Line.findOneAndUpdate(
        { _id: machine.line_names._id },
        { $set: generateRequestSheetNo },
        { new: true }
      );
      // console.log(increaseCountOfRequestSheetInLine);

      const requestSheetNo =
        machine?.line_names?.cell_names?.subSection_names?.section_names
          ?.dashboardLevel === "Yes"
          ? `${(machine?.line_names?.cell_names?.subSection_names?.section_names?.section_name)
              .trim()
              .substring(0, 2)
              .toUpperCase()}-${(machine?.line_names?.line_name).trim()}-${
              moment().tz("Asia/Kolkata").month() + 1
            }-${maintenanceType}-${
              increaseCountOfRequestSheetInLine?.requestSheetNoOfCM
            }`.trim()
          : `${(machine?.line_names?.cell_names?.subSection_names?.subSection_name)
              .trim()
              .substring(0, 2)
              .toUpperCase()}-${(machine?.line_names?.line_name).trim()}-${
              moment().tz("Asia/Kolkata").month() + 1
            }-${maintenanceType}-${
              increaseCountOfRequestSheetInLine?.requestSheetNoOfCM
            }`.trim();

      return requestSheetNo;
    } catch (error) {
      console.log(error);
    }
  }
);
