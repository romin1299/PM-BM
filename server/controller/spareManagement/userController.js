const mongoose = require("mongoose");
const {
  USER_NAME_SORT,
  USER_NAME_COLLATION,
} = require("../../utils/userSort");
const tryCatchHandler = require("../../errorHandler/tryCatchHandler");
const {
  mongoDBUserFilters,
  hooksFormReferenceOfApproval,
  hooksFormReferenceOfEmailReminder,
} = require("../../utils/spareManagementUtils");

const User = require("../../model/userSchema");
const Section = require("../../model/sectionSchema");

exports.findRequestedUser = tryCatchHandler(async (req, res, next) => {
  const users = await User.find(
    {
      plant_data: req?.rootUser?.plant_data,
      ...req.query,
    },
    { tm_name: 1, line_names: 1, email: 1 },
  );

  if (!users)
    return res.status(400).json({
      message: "No users found",
      showToast: true,
    });

  return res.status(201).json({
    message: "Users get successfully",
    users,
  });
});

exports.getDynamicApprovalListForSpareSheet = tryCatchHandler(
  async (req, res, next) => {
    if (!req.query?.withDefaultKeys) {
      if (!req?.rootUser?.plant_data)
        return res.status(400).json({
          message: "Need to assign plant to user",
          showToast: true,
        });

      if (!req.query?.department)
        return res.status(400).json({
          message:
            "Please provide the department for which you are requesting the part",
          showToast: true,
        });

      if (!req.query?.approvalKey)
        return res.status(400).json({
          message: "Something went wrong!!!",
          showToast: true,
        });
    }

    const section = await Section.findOne(
      {
        section_id: req?.rootUser?.section_data?.split("-")?.[0],
      },
      { section_id: 1, section_name: 1, dashboardLevel: 1, plant_names: 1 },
    ).populate({
      path: "plant_names",
      select: req.query?.approvalKey,
    });

    if (!section)
      return res.status(400).json({
        message: "Section does not exist",
        showToast: true,
      });

    let dynamicApproval = [];

    if (!req.query?.withDefaultKeys)
      dynamicApproval =
        section?.plant_names?.[req.query?.approvalKey]?.[req.query?.department];
    else if (req.query?.withDefaultKeys === "Yes")
      dynamicApproval = ["TL", "HOSS", "HOS", "HOD"]?.map(
        (item) => `${req.rootUser?.tm_department}_${item}`,
      );

    if (!dynamicApproval || dynamicApproval?.length <= 0)
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

    for (let i = 0; i < dynamicApproval.length; i++) {
      let obj = mongoDBUserFilters?.[dynamicApproval[i]];
      hooksFormRefFilter.push({
        ...(req.query?.requestFor === "EmailReminder"
          ? hooksFormReferenceOfEmailReminder
          : hooksFormReferenceOfApproval)?.[dynamicApproval[i]],
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
      /**
       * Sorted before the grouping, because $push keeps the order documents
       * arrive in — sorting afterwards would mean sorting each group's array by
       * hand. Collation so mixed-case names interleave alphabetically instead of
       * every capitalised name sorting ahead of the rest.
       */
      {
        $sort: USER_NAME_SORT,
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
    ]).collation(USER_NAME_COLLATION);

    if (!allUsers)
      return res.status(400).json({
        message: "Approval users not found",
        showToast: true,
      });

    let sortedUsers = [];
    for (let i = 0; i < hooksFormRefFilter?.length; i++) {
      const element = hooksFormRefFilter?.[i];
      let obj = allUsers?.find((item) => {
        if (element?.user_type && element?.tm_department)
          return (
            item?._id?.tm_department === element?.tm_department &&
            item?._id?.user_type === element?.user_type
          );
        else if (element?.user_type)
          return item?._id?.user_type === element?.user_type;
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
      message: "Users get successfully",
      allUsers: sortedUsers,
    });
  },
);

exports.toolRoomUserByIdFilter = tryCatchHandler(async (req, res, next) => {
  if (!req.query?._id)
    return res.status(400).json({
      message: "Please provide the required ID",
      showToast: true,
    });

  req.queryObj = { _id: mongoose.Types.ObjectId(req.query?._id) };
  req.requiredArrayFields = true;
  return next();
});

exports.getToolRoomUserById = tryCatchHandler(async (req, res, next) => {
  return res.status(201).json({
    message: "User get successfully",
    user: req.users?.[0],
  });
});

exports.addToolRoomUser = tryCatchHandler(async (req, res, next) => {
  if (!req.body?.tm_no)
    return res.status(400).json({
      message: "Please provide required team number",
      showToast: true,
    });

  const userExist = await User.findOne({ tm_no: req.body?.tm_no });

  if (userExist)
    return res.status(409).json({
      message: "Team number already exists",
      showToast: true,
    });

  const user = new User({
    ...req.body,
    toolRoomPerson: "Yes",
    password: process.env.COMMON_PASSWORD,
  });
  await user.save();

  return res.status(201).json({
    message: "User added successfully",
    user,
  });
});

exports.updateToolRoomUser = tryCatchHandler(async (req, res, next) => {
  await User.findOneAndUpdate(req.queryObj, req.body);
  req.requiredArrayFields = false;
  return next();
});

exports.deleteToolRoomUser = tryCatchHandler(async (req, res, next) => {
  await User.deleteOne(req.queryObj);
  return res.status(201).json({
    message: "User updated successfully",
    user: { _id: req.query?._id },
  });
});

exports.findUsers = tryCatchHandler(async (req, res, next) => {
  let $project = {
    tm_no: 1,
    tm_name: 1,
    email: 1,
    user_type: 1,
    tm_grade: 1,
    plant_data: 1,
    section_data: 1,
    subSection_data: {
      $reduce: {
        input: "$subSection_data",
        initialValue: "",
        in: {
          $concat: [
            "$$value",
            { $cond: [{ $eq: ["$$value", ""] }, "", ", "] },
            { $toString: "$$this" },
          ],
        },
      },
    },
    cell_data: {
      $reduce: {
        input: "$cell_data",
        initialValue: "",
        in: {
          $concat: [
            "$$value",
            { $cond: [{ $eq: ["$$value", ""] }, "", ", "] },
            { $toString: "$$this" },
          ],
        },
      },
    },
  };

  if (req.requiredArrayFields) {
    $project = {
      ...$project,
      joining_date: 1,
      contact_no: 1,
      address: 1,
      subSection_data: 1,
      cell_data: 1,
    };
  }

  const users = await User.aggregate([
    {
      $match: req.queryObj,
    },
    {
      $project,
    },
  ]);

  if (!users || users?.length <= 0)
    return res.status(400).json({
      message: "No data to display",
      showToast: true,
    });

  req.users = users;
  return next();
});

exports.toolRoomUserFilters = tryCatchHandler(async (req, res, next) => {
  req.queryObj = {
    plant_data: req?.rootUser?.plant_data,
    toolRoomPerson: "Yes",
  };

  if (req.rootUser?.user_type === "Plant-Admin")
    req.queryObj["user_type"] = "Section-Admin";
  else if (req.rootUser?.user_type === "Section-Admin")
    req.queryObj["user_type"] = {
      $in: ["HOSS", "Supervisor", "Office Person"],
    };
  else if (req.rootUser?.user_type === "HOSS")
    req.queryObj["user_type"] = {
      $in: ["Supervisor", "Office Person"],
    };
  else if (req.rootUser?.user_type === "Supervisor")
    req.queryObj["user_type"] = "Office Person";

  return next();
});

exports.getToolRoomUsers = tryCatchHandler(async (req, res, next) => {
  return res.status(201).json({
    message: "User get successfully",
    tableData: req.users,
  });
});
