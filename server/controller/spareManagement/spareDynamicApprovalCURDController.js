const tryCatchHandler = require("../../errorHandler/tryCatchHandler");

const Plant = require("../../model/plantSchema");

exports.authorizedToCustomize = tryCatchHandler(async (req, res, next) => {
  if (!["Plant-Admin", "Section-Admin"]?.includes(req.rootUser?.user_type))
    return res.status(400).json({
      message:
        "You are not authorized to configured this, please contact Plant-Admin or Section-Admin",
      showToast: true,
    });

  return next();
});

exports.configureSpareDynamicApproval = tryCatchHandler(
  async (req, res, next) => {
    if (!req.body?.spareSheetDynamicApproval)
      return res.status(400).json({
        message: "Please select approval",
        showToast: true,
      });

    const plant = await Plant.findOneAndUpdate(
      {
        plant_id: req.rootUser?.plant_data?.split("-")?.[0],
      },
      req.body,
      {
        new: true,
      },
    );

    if (!plant)
      return res.status(400).json({
        message: "Plant doest not exist",
        showToast: true,
      });

    return res.status(201).json({
      message: "Spare dynamic approval configured successfully",
      showToast: true,
      approvalObj: {
        spareSheetDynamicApproval: plant?.spareSheetDynamicApproval,
      },
    });
  },
);

exports.getSpareDynamicApproval = tryCatchHandler(async (req, res, next) => {
  const plant = await Plant.findOne({
    plant_id: req.rootUser?.plant_data?.split("-")?.[0],
  });

  if (!plant)
    return res.status(400).json({
      message: "Plant doest not exist",
      showToast: true,
    });

  if (plant?.spareSheetDynamicApproval?.length <= 0)
    return res.status(400).json({
      message: "Need to configure the approval",
      showToast: true,
    });

  return res.status(201).json({
    message: "Approval get successfully",
    approvalObj: {
      spareSheetDynamicApproval: plant?.spareSheetDynamicApproval,
    },
  });
});

exports.configureLeadTime = tryCatchHandler(async (req, res, next) => {
  if (!req.body?.leadTime)
    return res.status(400).json({
      message: "Please enter the lead time",
      showToast: true,
    });

  let $set = Object.keys(req.body?.leadTime).reduce((acc, key) => {
    acc[`leadTime.${key}`] = req.body?.leadTime[key];
    return acc;
  }, {});

  const plant = await Plant.findOneAndUpdate(
    {
      plant_id: req.rootUser?.plant_data?.split("-")?.[0],
    },
    {
      $set,
    },
    {
      new: true,
    },
  );

  if (!plant)
    return res.status(400).json({
      message: "Plant doest not exist",
      showToast: true,
    });

  return res.status(201).json({
    message: "Lead time configured successfully",
    showToast: true,
    trackingObj: {
      leadTime: plant?.leadTime,
    },
  });
});

exports.getLeadTime = tryCatchHandler(async (req, res, next) => {
  const plant = await Plant.findOne({
    plant_id: req.rootUser?.plant_data?.split("-")?.[0],
  });

  if (!plant)
    return res.status(400).json({
      message: "Plant doest not exist",
      showToast: true,
    });

  if (Object.keys(plant?.leadTime)?.length <= 0)
    return res.status(400).json({
      message: "Need to configure the leadTime",
      showToast: true,
    });

  return res.status(201).json({
    message: "Lead time get successfully",
    trackingObj: {
      leadTime: plant?.leadTime,
    },
  });
});
