const tryCatchHandler = require("../../errorHandler/tryCatchHandler");

const Plant = require("../../model/plantSchema");

const NOT_AUTHORIZED =
  "You are not authorized to configured this, please contact Plant-Admin or Section-Admin";

const isAdmin = (user) =>
  ["Plant-Admin", "Section-Admin"]?.includes(user?.user_type);

/**
 * Includes a PM user who also works in the tool room, not just dedicated
 * tool-room staff. See utils/userScope.js.
 */
const { isToolRoomUser } = require("../../utils/userScope");

const isToolRoomPerson = (user) => isToolRoomUser(user);

exports.authorizedToCustomize = tryCatchHandler(async (req, res, next) => {
  if (!isAdmin(req.rootUser))
    return res.status(400).json({
      message: NOT_AUTHORIZED,
      showToast: true,
    });

  return next();
});

exports.toolRoomAuthorizedToCustomize = tryCatchHandler(
  async (req, res, next) => {
    if (!isToolRoomPerson(req.rootUser))
      return res.status(400).json({
        message: NOT_AUTHORIZED,
        showToast: true,
      });

    return next();
  },
);

/**
 * The approval chains are maintained by the Tool Room as well as by the admins,
 * so this is deliberately wider than `authorizedToCustomize`. Lead time and the
 * rest of the customization page keep the admin-only rule.
 */
exports.approvalSelectionAuthorizedToCustomize = tryCatchHandler(
  async (req, res, next) => {
    if (!isAdmin(req.rootUser) && !isToolRoomPerson(req.rootUser))
      return res.status(400).json({
        message: NOT_AUTHORIZED,
        showToast: true,
      });

    return next();
  },
);

exports.configureSpareDynamicApproval = tryCatchHandler(
  async (req, res, next) => {
    if (!req.query?.approvalKey)
      return res.status(500).json({
        message: "Something went wrong",
        showToast: true,
      });

    if (!req.body?.[req.query?.approvalKey])
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
        [req.query?.approvalKey]: plant?.[req.query?.approvalKey],
      },
    });
  },
);

exports.getSpareDynamicApproval = tryCatchHandler(async (req, res, next) => {
  if (!req.query?.approvalKey)
    return res.status(500).json({
      message: "Something went wrong",
      showToast: true,
    });

  const plant = await Plant.findOne({
    plant_id: req.rootUser?.plant_data?.split("-")?.[0],
  });

  if (!plant)
    return res.status(400).json({
      message: "Plant doest not exist",
      showToast: true,
    });

  if (plant?.[req.query?.approvalKey]?.length <= 0)
    return res.status(400).json({
      message: "Need to configure the approval",
      showToast: true,
    });

  return res.status(201).json({
    message: "Approval get successfully",
    approvalObj: {
      [req.query?.approvalKey]: plant?.[req.query?.approvalKey],
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

exports.configureCurrencyConversion = tryCatchHandler(
  async (req, res, next) => {
    if (!req.body?.spareCurrenciesWithUnit)
      return res.status(400).json({
        message: "Please enter currencies",
        showToast: true,
      });

    const plant = await Plant.findOneAndUpdate(
      {
        plant_id: req.rootUser?.plant_data?.split("-")?.[0],
      },
      {
        $set: req.body,
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
      message: "Currency configured successfully",
      showToast: true,
      spareCurrenciesWithUnit: plant?.spareCurrenciesWithUnit,
    });
  },
);

exports.getCurrencyConversion = tryCatchHandler(async (req, res, next) => {
  const plant = await Plant.findOne({
    plant_id: req.rootUser?.plant_data?.split("-")?.[0],
  });

  if (!plant)
    return res.status(400).json({
      message: "Plant doest not exist",
      showToast: true,
    });

  if (plant?.spareCurrenciesWithUnit?.length <= 0)
    return res.status(400).json({
      message: "Need to configure the currency with unit",
      showToast: true,
    });

  return res.status(201).json({
    message: "Currencies get successfully",
    spareCurrenciesWithUnit: plant?.spareCurrenciesWithUnit,
  });
});
