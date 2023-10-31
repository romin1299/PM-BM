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

   

    const section = await sectionModel.findOne({
      section_id: req?.rootUser?.section_data?.split("-")?.[0],
    });

    let queryObj = {
      plant_data: req?.rootUser?.plant_data,  
    };

    if (req?.query?.tm_grade !== "HOD") {
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

    const mtdUser = await userModel.find({
      ...queryObj,
      tm_department: "MTD",
      tm_grade: "HOS",
    });
    const mtdUserTL = await userModel.find({
      ...queryObj,
      tm_department: "MTD",
      user_type: "TL/HOSS",
    });
    const mtdHod = await userModel.find({
      ...queryObj,
      tm_department: "MTD",
      tm_grade: "HOD",
    });
    const prdHod = await userModel.find({
      ...queryObj,
      tm_department: "PRD",
      tm_grade: "HOD",
    });
    const prdHos = await userModel.find({
      ...queryObj,
      tm_department: "PRD",
      tm_grade: "HOS",
    });
    const prdTL = await userModel.find({
      ...queryObj,
      tm_department: "PRD",
      user_type: "TL/HOSS",
    });

    const requestSheetApprovalList = {
      mtdUser,
      mtdUserTL,
      mtdHod,
      prdHod,
      prdHos,
      prdTL,
    };

    if (machine) {
      res.status(201).json({
        message: "Sheet data get successfully",
        machine,
        breakDownAttendedBy: req.rootUser.tm_name,
        requestSheetApprovalList,
      });
    } else {
      res.status(404).json({ message: "Machine not found" });
    }
  };
