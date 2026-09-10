const RequestSheetOfBM = require("../model/requestSheetDataOfBM");
const { sortedByName } = require("../utils/userSort");
const moment = require("moment-timezone");
const timezone = "Asia/Kolkata";
const logger = require("../utils/LoggingController/loggers");
const maintenanceType = require("../utils/maintenanceType");

exports.getUserData =
  (machineModel, sectionModel, userModel) => async (req, res) => {
    try {
      const machine = await machineModel
        .findOne({ machine_code: req.query?.machine_code })
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

      // console.log("machine", machine);

      const startDate = moment().tz(timezone).year();
      const endDate = moment().tz(timezone).year() + 1;
      // console.log(startDate);
      // console.log(endDate);

      // const currentMonth = moment().format("MMMM");
      let currentMonth;
      if (moment().format("MMM") === "Jun") {
        currentMonth = "June";
      } else if (moment().format("MMM") === "Jul") {
        currentMonth = "July";
      } else {
        currentMonth = moment().format("MMM");
      }

      const pmStatus = await machineModel.aggregate([
        {
          $match: { machine_code: req.query?.machine_code },
        },
        {
          $unwind: "$checkSheet_data",
        },
        {
          $match: {
            "checkSheet_data.current_year":
              req?.query?.current_year || `${startDate}-${endDate}`,
            // [`checkSheet_data.PMStatus.${currentMonth}`]: currentMonth,
          },
        },
        {
          $project: {
            _id: 0,
            PMStatus: `$checkSheet_data.PMStatus.${currentMonth}`,
            PMdate: {
              $arrayElemAt: [
                `$checkSheet_data.implemetation_completed_date.${currentMonth}`,
                0,
              ],
            },
          },
        },
      ]);

      //  console.log("pmstatus",pmStatus?.[0])

      const bmData = await RequestSheetOfBM.aggregate([
        // {
        //   $match : {
        //     machineRef : mongoose.Types.ObjectId(req.query?.selectedId),
        //   }
        // },
        {
          $lookup: {
            from: "machinesalldatas",
            localField: "machineRef",
            foreignField: "_id",
            as: "machines",
          },
        },
        {
          $unwind: "$machines",
        },
        {
          $match: {
            "machines.machine_code": req?.query?.machine_code,
            // "machines.machine_code" : "M-EN-O2-BOA-030-1",
          },
        },

        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalHours: {
              $sum: {
                // $trunc: [
                //   {
                $divide: ["$maintenanceReportFilledByMTD.breakDownTime", 60],
                //   },
                //   1,
                // ],
              },
            },
          },
        },
      ]);

      // console.log("bmstatus",bmData?.[0])

      const section = await sectionModel.findOne({
        section_id: req?.rootUser?.section_data?.split("-")?.[0],
      });

      /**
       * The caller is intentionally NOT excluded. A user may be an approver on a
       * sheet assigned to them; the submit-versus-approve decision is made from
       * the sheet's state in /sendApprovalForRequestSheetOfBM, not from whether
       * the caller happens to appear in this list.
       */
      let queryObj = {
        plant_data: req?.rootUser?.plant_data,
      };

      if (req?.rootUser?.tm_grade !== "HOD") {
        if (section.dashboardLevel === "Yes") {
          queryObj = {
            ...queryObj,
            section_data: req?.rootUser?.section_data,
          };
        } else {
          queryObj = {
            ...queryObj,
            section_data: req?.rootUser?.section_data,
            subSection_data: { $in: req?.rootUser?.subSection_data },
          };
        }
      }

      const mtdHOSQuery = sortedByName(userModel.find(
        {
          ...queryObj,
          tm_department: "MTD",
          tm_grade: "HOS",
        },
        { userRef: "$_id", tm_name: 1, line_names: 1, email: 1 }
      ));
      const mtdTLQuery = sortedByName(userModel.find(
        {
          ...queryObj,
          tm_department: "MTD",
          user_type: "TL/HOSS",
        },
        { userRef: "$_id", tm_name: 1, line_names: 1, email: 1 }
      ));
      const mtdHODQuery = sortedByName(userModel.find(
        {
          plant_data: req?.rootUser?.plant_data,
          tm_department: "MTD",
          tm_grade: "HOD",
        },
        { tm_name: 1, line_names: 1, email: 1 }
      ));
      const prdHODQuery = sortedByName(userModel.find(
        {
          plant_data: req?.rootUser?.plant_data,
          tm_department: "PRD",
          tm_grade: "HOD",
        },
        { tm_name: 1, line_names: 1, email: 1 }
      ));
      const prdHOSQuery = sortedByName(userModel.find(
        {
          ...queryObj,
          tm_department: "PRD",
          tm_grade: "HOS",
        },
        { tm_name: 1, line_names: 1, email: 1 }
      ));
      const prdTLQuery = sortedByName(userModel.find(
        {
          ...queryObj,
          tm_department: "PRD",
          user_type: "TL/HOSS",
        },
        { userRef: "$_id", tm_name: 1, line_names: 1, email: 1 }
      ));

      const pedHODQuery = sortedByName(userModel.find(
        {
          plant_data: req?.rootUser?.plant_data,
          tm_department: "PED",
          tm_grade: "HOD",
        },
        { tm_name: 1, line_names: 1, email: 1 }
      ));
      const pedHOSQuery = sortedByName(userModel.find(
        {
          ...queryObj,
          tm_department: "PED",
          tm_grade: "HOS",
        },
        { tm_name: 1, line_names: 1, email: 1 }
      ));
      const pedTLQuery = sortedByName(userModel.find(
        {
          ...queryObj,
          tm_department: "PED",
          user_type: "TL/HOSS",
        },
        { userRef: "$_id", tm_name: 1, line_names: 1, email: 1 }
      ));

      /**
       * The nine lookups are independent, so they run together instead of as
       * nine sequential round trips to the database.
       */
      const [
        mtdHOS,
        mtdTL,
        mtdHOD,
        prdHOD,
        prdHOS,
        prdTL,
        pedHOD,
        pedHOS,
        pedTL,
      ] = await Promise.all([
        mtdHOSQuery,
        mtdTLQuery,
        mtdHODQuery,
        prdHODQuery,
        prdHOSQuery,
        prdTLQuery,
        pedHODQuery,
        pedHOSQuery,
        pedTLQuery,
      ]);

      const requestSheetApprovalList = {
        mtdHOS,
        mtdTL,
        mtdHOD,
        prdHOD,
        prdHOS,
        prdTL,
        pedHOD,
        pedHOS,
        pedTL,
      };

      if (machine) {
        res.status(201).json({
          message: "Sheet data get successfully",
          machine,
          requestSheetApprovalList,
          pmStatusData: pmStatus?.[0],
          bmStatusData: bmData?.[0],
        });
      } else {
        res.status(404).json({ message: "Machine not found" });
      }
    } catch (error) {
      logger.error(error, { maintenanceType: maintenanceType?.[1] });
    }
  };
