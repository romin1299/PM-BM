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

    const section = await sectionModel.findOne({
      section_id: req?.rootUser?.section_data?.split("-")?.[0],
    });

    let queryObj = {
      plant_data: req?.rootUser?.plant_data,
    };

    // console.log("queryObj", queryObj);

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
        ...queryObj,
        tm_department: "MTD",
        tm_grade: "HOD",
      },
      { tm_name: 1, line_names: 1 }
    );
    const prdHOD = await userModel.find(
      {
        ...queryObj,
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
