const tryCatchHandler = require("../../errorHandler/tryCatchHandler");
const User = require("../../model/userSchema");

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
