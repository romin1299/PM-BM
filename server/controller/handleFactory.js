const RequestSheetOfBM = require("../model/requestSheetDataOfBM");


exports.getUserData =
  (machineModel, sectionModel, userModel) => async (req, res) => {
    const machine = await machineModel
      .findOne(req.query)
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

//     const getPMStatus = async(req,res,next)=>{

//       const pmStatus = await machineModel.aggregate([
//         {
//           $match : 
//         }
//       ])
// console.log(machine?.checkSheet_data[0]?.PMStatus)
//     }

//     getPMStatus();





   

      // console.log("req.query?.machine_code",req?.query?.machine_code)

      const getBMData = await RequestSheetOfBM.aggregate([
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
          $match : {
            "machines.machine_code" : req?.query?.machine_code,
            // "machines.machine_code" : "M-EN-O2-BOA-030-1",
          }
        },

        {
          $group : {
            _id : null,
            count : {$sum : 1},
            sumOfHours : {$sum : "$maintenanceReportFilledByMTD.breakDownTime" }
          }
        }
      ]);
// console.log(machine?.checkSheet_data[0]?.BM)
console.log("bmbmbmbm",getBMData?.[0])
   

   




    const section = await sectionModel.findOne({
      section_id: req?.rootUser?.section_data?.split("-")?.[0],
    });

    let queryObj = {
      plant_data: req?.rootUser?.plant_data,
      _id: { $ne: req?.rootUser?._id },
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

    const mtdHOS = await userModel.find(
      {
        ...queryObj,
        tm_department: "MTD",
        tm_grade: "HOS",
      },
      { tm_name: 1, line_names: 1 }
    );
    const mtdTL = await userModel.find(
      {
        ...queryObj,
        tm_department: "MTD",
        user_type: "TL/HOSS",
      },
      { tm_name: 1, line_names: 1 }
    );
    const mtdHOD = await userModel.find(
      {
        plant_data: req?.rootUser?.plant_data,
        _id: { $ne: req?.rootUser?._id },
        tm_department: "MTD",
        tm_grade: "HOD",
      },
      { tm_name: 1, line_names: 1 }
    );
    const prdHOD = await userModel.find(
      {
        plant_data: req?.rootUser?.plant_data,
        _id: { $ne: req?.rootUser?._id },
        tm_department: "PRD",
        tm_grade: "HOD",
      },
      { tm_name: 1, line_names: 1 }
    );
    const prdHOS = await userModel.find(
      {
        ...queryObj,
        tm_department: "PRD",
        tm_grade: "HOS",
      },
      { tm_name: 1, line_names: 1 }
    );
    const prdTL = await userModel.find(
      {
        ...queryObj,
        tm_department: "PRD",
        user_type: "TL/HOSS",
      },
      { tm_name: 1, line_names: 1 }
    );

    const requestSheetApprovalList = {
      mtdHOS,
      mtdTL,
      mtdHOD,
      prdHOD,
      prdHOS,
      prdTL,
    };

    if (machine) {
      res.status(201).json({
        message: "Sheet data get successfully",
        machine,
        requestSheetApprovalList,
    
      });
    } else {
      res.status(404).json({ message: "Machine not found" });
    }
  };
