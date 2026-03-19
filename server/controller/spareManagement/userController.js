const tryCatchHandler = require("../../errorHandler/tryCatchHandler");
const {
  mongoDBUserFilters,
  hooksFormReferenceOfApproval,
} = require("../../utils/spareManagementUtils");

const User = require("../../model/userSchema");
const Section = require("../../model/sectionSchema");

exports.findRequestedUser = tryCatchHandler(async (req, res, next) => {
  const users = await User.find(
    {
      plant_data: req?.rootUser?.plant_data,
      ...req.query,
    },
    { tm_name: 1, line_names: 1, email: 1 }
  );

  if (!users)
    return res.status(400).json({
      message: "Need to add MTD HOD",
      showToast: true,
    });

  return res.status(201).json({
    message: "MTD HOD users get successfully",
    users,
  });
});

exports.getDynamicApprovalListForSpareSheet = tryCatchHandler(
  async (req, res, next) => {
    if (!req?.rootUser?.plant_data)
      return res.status(400).json({
        message: "Need to assign plant to user",
        showToast: true,
      });

    const section = await Section.findOne(
      {
        section_id: req?.rootUser?.section_data?.split("-")?.[0],
      },
      { section_id: 1, section_name: 1, dashboardLevel: 1, plant_names: 1 }
    ).populate({
      path: "plant_names",
      select: "spareSheetDynamicApproval",
    });

    if (!section)
      return res.status(400).json({
        message: "Section does not exist",
        showToast: true,
      });

    const plant = section?.plant_names;

    if (
      !plant?.spareSheetDynamicApproval ||
      plant?.spareSheetDynamicApproval?.length <= 0
    )
      return res.status(400).json({
        message: "Please select dynamic approval first",
        showToast: true,
      });

    let filters = [],
      hooksFormRefFilter = [],
      otherFilters = {
        plant_data: req?.rootUser?.plant_data,
        section_data: req?.rootUser?.section_data,
      };

    if (section?.dashboardLevel === "No")
      otherFilters["subSection_data"] = { $in: req?.rootUser?.subSection_data };

    for (let i = 0; i < plant?.spareSheetDynamicApproval.length; i++) {
      let obj = mongoDBUserFilters?.[plant?.spareSheetDynamicApproval[i]];
      hooksFormRefFilter.push({
        ...hooksFormReferenceOfApproval?.[plant?.spareSheetDynamicApproval[i]],
        ...obj,
      });
      if (obj?.tm_grade !== "HOD")
        obj = {
          ...obj,
          ...otherFilters,
        };

      filters.push(obj);
    }

    const allUsers = await User.aggregate([
      {
        $match: {
          $or: filters,
        },
      },
      {
        $group: {
          _id: {
            tm_department: "$tm_department",
            user_type: "$user_type",
            tm_grade: "$tm_grade",
          },
          users: {
            $push: {
              _id: "$_id",
              tm_name: "$tm_name",
              email: "$email",
              tm_department: "$tm_department",
              user_type: "$user_type",
              tm_grade: "$tm_grade",
            },
          },
        },
      },
    ]);

    if (!allUsers)
      return res.status(400).json({
        message: "Approval users not found",
        showToast: true,
      });

    let sortedUsers = [];
    for (let i = 0; i < hooksFormRefFilter?.length; i++) {
      const element = hooksFormRefFilter?.[i];
      let obj = allUsers?.find((item) => {
        if (element?.user_type)
          return (
            item?._id?.tm_department === element?.tm_department &&
            item?._id?.user_type === element?.user_type
          );
        return (
          item?._id?.tm_department === element?.tm_department &&
          item?._id?.tm_grade === element?.tm_grade
        );
      });

      if (obj) {
        sortedUsers.push({ fieldRef: element, ...obj });
      }
    }

    return res.status(201).json({
      message: "MTD HOD users get successfully",
      allUsers: sortedUsers,
    });
  }
);
