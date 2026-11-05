const mongoose = require("mongoose");
const { USER_NAME_SORT, USER_NAME_COLLATION } = require("../../utils/userSort");
const tryCatchHandler = require("../../errorHandler/tryCatchHandler");
const {
  mongoDBUserFilters,
  hooksFormReferenceOfApproval,
  hooksFormReferenceOfEmailReminder,
} = require("../../utils/spareManagementUtils");

const {
  manageableUserTypes,
  validateToolRoomUserInput,
  toToolRoomUserRow,
} = require("../../services/spare/toolRoomUserService");
const { isToolRoomUser } = require("../../utils/userScope");

const User = require("../../model/userSchema");
const Section = require("../../model/sectionSchema");
const SubSection = require("../../model/subSectionSchema");

/**
 * Approval steps filled by tool-room staff. They are not tied to the
 * requester's section - a tool-room user serves the whole plant - so they are
 * looked up by plant alone. Matching them on the requester's section and
 * sub-sections meant a request from any section other than the one the tool-room
 * user happened to be registered under found nobody to approve it.
 */
const PLANT_WIDE_APPROVAL_KEYS = new Set(["TOOL_ROOM"]);

/** Mongo's { locale: "en", strength: 2 } collation, for ordering names in node. */
const NAME_ORDER = new Intl.Collator("en", { sensitivity: "accent" });

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

    /**
     * Section-scoped approvers (TL, HOSS, HOS) must come from the section the
     * SHEET is raised for, not from the logged-in user's own section. For a
     * normal requester the two are the same; for a tool-room user raising a
     * sheet on behalf of another section they are not. Scoping to the requester
     * meant a tool-room user could pick, say, an Electronics TL for a Powertrain
     * sheet - and that approver never saw the sheet on their dashboard, so it
     * could not be approved. The sheet's section (its Mongo _id) is sent by the
     * form; the default-keys admin flow has no sheet and keeps the old scope.
     */
    const useSheetScope = Boolean(req.query?.sectionId) && !req.query?.withDefaultKeys;

    const section = await Section.findOne(
      useSheetScope
        ? { _id: req.query.sectionId }
        : { section_id: req?.rootUser?.section_data?.split("-")?.[0] },
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

    /**
     * Whose section (and sub-sections) the approvers are drawn from. The sheet's
     * section is rebuilt into the `section_id-section_name` string that users
     * carry, exactly as a sheet stamps it, so the match is identical to the
     * requester-scoped one - only against the right section. The plant stays the
     * requester's: a tool-room user raises sheets within their own plant.
     */
    let scopeSectionData = req?.rootUser?.section_data,
      scopeSubSectionData = req?.rootUser?.subSection_data;

    if (useSheetScope) {
      scopeSectionData = `${section.section_id}-${section.section_name}`;
      scopeSubSectionData = [];

      // A section that is not itself a dashboard level scopes approvers down to
      // the sheet's sub-section, so resolve the one the form selected.
      if (section?.dashboardLevel === "No" && req.query?.subSectionId) {
        const subSection = await SubSection.findOne(
          { _id: req.query.subSectionId },
          { subSection_id: 1, subSection_name: 1 },
        );
        if (subSection)
          scopeSubSectionData = [
            `${subSection.subSection_id}-${subSection.subSection_name}`,
          ];
      }
    }

    let filters = [],
      hooksFormRefFilter = [],
      otherFilters = {
        plant_data: req?.rootUser?.plant_data,
        section_data: scopeSectionData,
      };

    if (section?.dashboardLevel === "No") {
      // On the sheet-scoped path, narrow to the sub-section only when it was
      // resolved; otherwise stay section-wide rather than match nobody.
      if (!useSheetScope || scopeSubSectionData.length)
        otherFilters["subSection_data"] = { $in: scopeSubSectionData };
    }

    for (let i = 0; i < dynamicApproval.length; i++) {
      let obj = mongoDBUserFilters?.[dynamicApproval[i]];
      hooksFormRefFilter.push({
        ...(req.query?.requestFor === "EmailReminder"
          ? hooksFormReferenceOfEmailReminder
          : hooksFormReferenceOfApproval)?.[dynamicApproval[i]],
        ...obj,
      });
      /**
       * Whose approval is asked for decides where to look: the tool room and
       * the HODs belong to the plant, everyone else to the requester's own
       * section (and sub-sections). A HOD is not registered under a section, and
       * with no scope at all the HOD dropdown listed the HODs of every plant.
       */
      if (
        PLANT_WIDE_APPROVAL_KEYS.has(dynamicApproval[i]) ||
        obj?.tm_grade === "HOD"
      )
        obj = {
          ...obj,
          plant_data: req?.rootUser?.plant_data,
        };
      else
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
            /**
             * Carried in the key so a plant-wide step can find its people
             * without guessing from user_type. Tool-room staff hold
             * "Office Person", but a PM user who also works in the tool room
             * keeps their PM type, so the two cannot be told apart otherwise.
             */
            isToolRoom: {
              $or: [
                { $eq: ["$toolRoomPerson", "Yes"] },
                { $eq: ["$alsoToolRoomPerson", "Yes"] },
                { $eq: ["$user_type", "Office Person"] },
              ],
            },
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
      const matchingGroups = allUsers?.filter((item) => {
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

      /**
       * Every group that fits, not the first. Users are grouped by department,
       * type, grade and whether they also work in the tool room, so a HOD or TL
       * who does is in a group of their own - taking only the first group left
       * them out of the very dropdown for their own role (a tool-room-flagged
       * PRD HOD was missing from "PRD HOD" altogether).
       */
      let obj = matchingGroups?.length
        ? {
            _id: matchingGroups[0]._id,
            users:
              matchingGroups.length === 1
                ? matchingGroups[0].users
                : matchingGroups
                    .flatMap((group) => group.users)
                    .sort((a, b) => NAME_ORDER.compare(a.tm_name, b.tm_name)),
          }
        : undefined;

      /**
       * The users above were grouped by department, type and grade, and the
       * lookup keeps the first group that fits. For a step that belongs to the
       * whole plant that drops people: tool-room staff made through user
       * management have no department, an older one may have "MTD", and a PM
       * user who also works in the tool room has their own PM type and
       * department. All of those land in different groups, so the dropdown
       * showed one of them - and which one depended on the department the
       * request happened to be raised for.
       *
       * So a plant-wide step gathers every tool-room group and lists them
       * together, sorted by name the way each group already was.
       */
      if (PLANT_WIDE_APPROVAL_KEYS.has(dynamicApproval[i])) {
        const groups = allUsers.filter((item) => item?._id?.isToolRoom);

        if (groups.length > 0)
          obj = {
            _id: groups[0]._id,
            users: groups
              .flatMap((group) => group.users)
              .sort((a, b) => NAME_ORDER.compare(a.tm_name, b.tm_name)),
          };
      }

      if (obj) {
        sortedUsers.push({ fieldRef: element, ...obj });
      } else if (!req.query?.withDefaultKeys) {
        /**
         * Nobody is registered for this step in the requester's hierarchy. The
         * step used to be left out of the list, so the form showed no dropdown
         * for it, raised no error, and the sheet then failed on submit with a
         * message about a field the person never saw. It is returned with an
         * empty list instead, so the form can say so up front.
         */
        sortedUsers.push({ fieldRef: element, users: [] });
      }
    }

    return res.status(201).json({
      message: "Users get successfully",
      allUsers: sortedUsers,
    });
  },
);

/**
 * The users the caller may manage: tool-room users of their own plant, of the
 * types below them in the hierarchy. The list and the by-id routes both start
 * from this, so a user that is not in the list cannot be reached by id either.
 * Before, the by-id routes matched on _id alone, so any signed-in user could
 * read, change or delete any account - a PM operator included - by its id.
 */
const manageableUsersScope = (caller) => ({
  plant_data: caller?.plant_data,
  toolRoomPerson: "Yes",
  user_type: { $in: manageableUserTypes(caller?.user_type) },
});

const rejectIfCannotManageUsers = (req, res) => {
  if (
    // A PM user who also works in the tool room reaches this too; what they
    // may do is still decided by their user_type below.
    !isToolRoomUser(req.rootUser) ||
    !req.rootUser?.plant_data ||
    manageableUserTypes(req.rootUser?.user_type).length === 0
  ) {
    res.status(403).json({
      message: "You are not authorised to manage tool room users",
      showToast: true,
    });
    return true;
  }
  return false;
};

exports.toolRoomUserByIdFilter = tryCatchHandler(async (req, res, next) => {
  if (rejectIfCannotManageUsers(req, res)) return;

  if (!req.query?._id || !mongoose.isValidObjectId(req.query._id))
    return res.status(400).json({
      message: "Please provide the required ID",
      showToast: true,
    });

  req.queryObj = {
    _id: mongoose.Types.ObjectId(req.query._id),
    ...manageableUsersScope(req.rootUser),
  };
  req.requiredArrayFields = true;
  return next();
});

exports.getToolRoomUserById = tryCatchHandler(async (req, res, next) => {
  return res.status(201).json({
    message: "User get successfully",
    user: req.users?.[0],
  });
});

const TM_NUMBER_TAKEN = {
  message: "Team number already exists",
  showToast: true,
};

exports.addToolRoomUser = tryCatchHandler(async (req, res, next) => {
  if (rejectIfCannotManageUsers(req, res)) return;

  const { error, values } = validateToolRoomUserInput({
    body: req.body,
    mode: "create",
    callerUserType: req.rootUser?.user_type,
  });

  if (error) return res.status(400).json({ message: error, showToast: true });

  if (await User.exists({ tm_no: values.tm_no }))
    return res.status(409).json(TM_NUMBER_TAKEN);

  // A tool-room user belongs to the plant. Section, sub-section and cell are
  // not taken from the request and are not stored.
  const user = new User({
    ...values,
    plant_data: req.rootUser.plant_data,
    toolRoomPerson: "Yes",
    password: process.env.COMMON_PASSWORD,
  });

  try {
    await user.save();
  } catch (saveError) {
    // two people adding the same number at once both pass the check above;
    // the unique index decides between them
    if (saveError?.code === 11000) return res.status(409).json(TM_NUMBER_TAKEN);
    throw saveError;
  }

  return res.status(201).json({
    message: "User added successfully",
    user: toToolRoomUserRow(user),
  });
});

exports.updateToolRoomUser = tryCatchHandler(async (req, res, next) => {
  // findUsers has just fetched the user (and refused if the caller may not
  // manage them), so the stored values are on hand for the validation.
  const { error, values } = validateToolRoomUserInput({
    body: req.body,
    mode: "edit",
    callerUserType: req.rootUser?.user_type,
    existing: req.users?.[0],
  });

  if (error) return res.status(400).json({ message: error, showToast: true });

  if (
    values.tm_no !== undefined &&
    values.tm_no !== req.users?.[0]?.tm_no &&
    (await User.exists({ tm_no: values.tm_no, _id: { $ne: req.queryObj._id } }))
  )
    return res.status(409).json(TM_NUMBER_TAKEN);

  if (Object.keys(values).length > 0) {
    try {
      await User.updateOne(req.queryObj, { $set: values });
    } catch (updateError) {
      if (updateError?.code === 11000)
        return res.status(409).json(TM_NUMBER_TAKEN);
      throw updateError;
    }
  }

  req.requiredArrayFields = false;
  return next();
});

exports.deleteToolRoomUser = tryCatchHandler(async (req, res, next) => {
  const { deletedCount } = await User.deleteOne(req.queryObj);

  if (!deletedCount)
    return res.status(404).json({
      message: "User not found",
      showToast: true,
    });

  return res.status(201).json({
    message: "User deleted successfully",
    user: { _id: req.query?._id },
  });
});

exports.findUsers = tryCatchHandler(async (req, res, next) => {
  // A tool-room user has no section, sub-section or cell to show, so none are
  // read. The edit form additionally needs the contact details.
  let $project = {
    tm_no: 1,
    tm_name: 1,
    email: 1,
    user_type: 1,
    tm_grade: 1,
    plant_data: 1,
  };

  if (req.requiredArrayFields) {
    $project = {
      ...$project,
      joining_date: 1,
      contact_no: 1,
      address: 1,
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

  /**
   * An empty result is an error for the by-id routes - it is how a user the
   * caller may not manage is refused - but not for the list, where it just
   * means nobody has been added yet. It used to answer that with a 400, so the
   * table showed an error toast instead of an empty table; the first Admin to
   * open Spare User Management would always see it.
   */
  if (!users || users?.length <= 0) {
    if (!req.allowEmptyUserList)
      return res.status(400).json({
        message: "No data to display",
        showToast: true,
      });

    req.users = [];
    return next();
  }

  req.users = users;
  return next();
});

exports.toolRoomUserFilters = tryCatchHandler(async (req, res, next) => {
  // A caller with nobody beneath them used to fall through with no user_type
  // condition at all, and was handed every tool-room user in the plant.
  if (rejectIfCannotManageUsers(req, res)) return;

  req.queryObj = manageableUsersScope(req.rootUser);
  req.allowEmptyUserList = true;

  return next();
});

exports.getToolRoomUsers = tryCatchHandler(async (req, res, next) => {
  return res.status(201).json({
    message: "User get successfully",
    tableData: req.users,
  });
});
