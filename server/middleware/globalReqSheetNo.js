const tryCatchHandler = require("../errorHandler/tryCatchHandler");
const Machine = require("../model/machineSchema");
const Line = require("../model/lineSchema");
const moment = require("moment-timezone");

/**
 * Generate a unique Request Sheet number for BM / CM / New-Machine-CM
 * @param {String} machineRef - Machine ObjectId
 * @param {String} maintenanceType - One of "BM", "CM", "New-Machine-CM"
 */
exports.globalReqSheetNo = tryCatchHandler(
  async (machineRef, maintenanceType) => {
    try {
      // 1️⃣ Get machine hierarchy
      const machine = await Machine.findById(machineRef)
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

      if (!machine || !machine.line_names) {
        throw new Error("Machine or Line reference not found");
      }

      // 2️⃣ Decide counter field based on maintenance type
      let counterField;
      if (maintenanceType === "BM") counterField = "requestSheetNos";
      else if (maintenanceType === "CM") counterField = "requestSheetNoOfCM";
      else if (maintenanceType === "New-Machine-CM")
        counterField = "requestSheetNoOfNewMachineCM";
      else throw new Error("Invalid maintenance type provided");

      // 3️⃣ Atomically increment the counter for this line
      const updatedLine = await Line.findOneAndUpdate(
        { _id: machine.line_names._id },
        { $inc: { [counterField]: 1 } },
        { new: true, upsert: true }
      );

      const counterValue = updatedLine?.[counterField] || 1;

      // 4️⃣ Safely extract name hierarchy
      const sectionInfo =
        machine?.line_names?.cell_names?.subSection_names?.section_names;
      const dashboardLevel = sectionInfo?.dashboardLevel === "Yes";

      const sectionName = dashboardLevel === "Yes"
        ? sectionInfo?.section_name
        : machine?.line_names?.cell_names?.subSection_names?.subSection_name;

      const sectionPrefix =
        sectionName?.trim()?.substring(0, 2)?.toUpperCase() || "XX";
      const lineName = machine?.line_names?.line_name?.trim() || "LINE";

      // 5️⃣ Generate formatted month and request sheet number
      const month = moment().tz("Asia/Kolkata").format("MM");

      // Example: SE-LINE1-11-CM-2  or SU-LINE2-11-New-Machine-CM-5
      const requestSheetNo =
        `${sectionPrefix}-${lineName}-${month}-${maintenanceType}-${counterValue}`.trim();

      return requestSheetNo;
    } catch (error) {
      console.error("❌ Error generating Request Sheet Number:", error);
      throw new Error("Failed to generate unique Request Sheet number");
    }
  }
);
