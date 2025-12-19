router.patch(
  "/approveOrRejectRequestSheet/:requestSheetID",
  authenticate,
  commonKeyGenerationMiddleware,
  tryCatchHandler(async (req, res, next) => {
    const { requestSheetID } = req.params;

    const isRequestSheetExist = await RequestSheetOfCM.findById(requestSheetID);

    if (!isRequestSheetExist) {
      return res.status(404).json({ message: "Request sheet not found" });
    }

    const {
      approvalOfRequestSheet,
      rejectedRemarksOfRequestSheet,
      current_commonDataFilledByAssignUser,

      approvalOfMTD_HOSS,
      approvalOfMTD_HOS,
      isPermissionOfPRDTL,
      approvalOfPRD_TL,
      targetDateOfCM,
    } = req.body;

    let department;
    // if (
    //   req?.rootUser?.user_type === "TL/HOSS" &&
    //   req?.rootUser?.tm_department === "MTD"
    // ) {
    //   department = "MTD_TL";
    // } else if (req?.rootUser?.user_type === "Section-Admin") {
    //   department = "MTD_HOS";
    // } else if (
    //   req?.rootUser?.tm_department === "PRD" &&
    //   req?.rootUser?.user_type === "TL/HOSS"
    // ) {
    //   department = "PRD_TL";
    // }
    switch (current_commonDataFilledByAssignUser?.requestSheetStatusOfCM) {
      case "Under MTD TL Approval":
        department = "MTD_TL";
        break;

      case "Under MTD HOSS Approval":
        department = "MTD_HOSS";
        break;

      case "Under MTD HOS Approval":
        department = "MTD_HOS";
        break;

      case "Under PRD TL Approval":
        department = "PRD_TL";
        break;
    }

    // if (
    //   current_commonDataFilledByAssignUser?.requestSheetStatusOfCM ===
    //   "Under MTD TL Approval"
    // ) {
    //   department = "MTD_TL";
    // } else if (req?.rootUser?.user_type === "Section-Admin") {
    //   department = "MTD_HOS";
    // } else if (
    //   req?.rootUser?.tm_department === "PRD" &&
    //   req?.rootUser?.user_type === "TL/HOSS"
    // ) {
    //   department = "PRD_TL";
    // }

    if (!department) {
      return res
        .status(400)
        .json({ message: "Unauthorized department user!!!" });
    }

    let ObjForUserFilter = req.body?.[`approvalOf${department}`];

    if (!ObjForUserFilter) {
      return res.status(404).json({ message: "User not assigned" });
    }

    if (ObjForUserFilter?.approvalStatus !== "Pending") {
      return res.status(400).json({
        message: `${ObjForUserFilter?.tm_no} : ${ObjForUserFilter?.tm_name}'s status is not pending`,
      });
    }

    if (ObjForUserFilter?.userRef !== req?.rootUser?._id?.toString()) {
      return res
        .status(404)
        .json({ message: "Unauthorized user for approval" });
    }

    const allKeys = {
      ...req.allKeys,
      getDataForApprovalDashboard: `${req?.commonKey}.getDataForApprovalDashboard`,
      approvalObj: `${req?.allKeys?.[`approvalOf${department}`]}.$[userFilter]`,
    };

    let updateObj = {
      $set: {
        [`${allKeys?.approvalObj}.approvalDateAndTime`]: new Date(),
      },
    };

    let NULL_Obj_getDataForApprovalDashboard = {
      Id: null,
      departmentAndGradeOfUser: null,
    };

    let pushOperation = null;

    if (approvalOfRequestSheet === "No") {
      updateObj.$set = {
        ...updateObj?.$set,
        [`${allKeys?.approvalObj}.approvalStatus`]: "Rejected",
        [`${req?.commonKey}.rejectedRemarksOfRequestSheet`]:
          rejectedRemarksOfRequestSheet,
        [allKeys?.requestSheetStatusOfCM]: "Rejected",
        [allKeys?.getDataForApprovalDashboard]:
          NULL_Obj_getDataForApprovalDashboard,
      };
    } else if (approvalOfRequestSheet === "Yes") {
      let nextApprovalObj = {
        requestSheetStatusOfCM: "",
        getDataForApprovalDashboard: NULL_Obj_getDataForApprovalDashboard,
      };

      const completeApproval = () => {
        nextApprovalObj.requestSheetStatusOfCM = "Completed";

        if (
          isRequestSheetExist?.cmBasicDataFilledByMTD_TL?.frequencyValue ===
          "1/3 M"
        ) {
          let lastEntry =
            isRequestSheetExist?.commonDataFilledByAssignUser?.[
              isRequestSheetExist?.commonDataFilledByAssignUser?.length - 1
            ];

          let lastTragetDate =
            lastEntry?.quarterlyDataOfTheCM?.[
              lastEntry?.quarterlyDataOfTheCM?.length - 1
            ]?.targetDateOfCM;

          let newTargetDate = moment(lastTragetDate).add(3, "months");
          let quarterlyDataEntries = [
            {
              requestSheet_quarter: getFinancialQuarter(newTargetDate),
              statusOfPlannedCM: "Planned",
              targetDateOfCM: newTargetDate,
              requestSheetStatusOfCM: "Generated",
            },
          ];
          pushOperation = {
            preAggregationTimeStampOfRequestSheet: {
              requestSheet_year: currentYear,
              requestSheet_month: gettingMonthForSelectedDate(newTargetDate),
            },
            quarterlyDataOfTheCM: { $each: quarterlyDataEntries },
          };
        }
      };

      switch (current_commonDataFilledByAssignUser?.requestSheetStatusOfCM) {
        case "Under MTD TL Approval":
          nextApprovalObj.requestSheetStatusOfCM = "Under MTD HOSS Approval";
          nextApprovalObj.getDataForApprovalDashboard = {
            Id: approvalOfMTD_HOSS?.userRef,
            departmentAndGradeOfUser: approvalOfMTD_HOSS?.user_type,
          };

          break;

        case "Under MTD HOSS Approval":
          nextApprovalObj.requestSheetStatusOfCM = "Under MTD HOS Approval";
          nextApprovalObj.getDataForApprovalDashboard = {
            Id: approvalOfMTD_HOS?.userRef,
            departmentAndGradeOfUser: approvalOfMTD_HOS?.user_type,
          };
          break;

        case "Under MTD HOS Approval":
          if (isPermissionOfPRDTL === "Yes") {
            nextApprovalObj.requestSheetStatusOfCM = "Under PRD TL Approval";
            nextApprovalObj.getDataForApprovalDashboard = {
              Id: approvalOfPRD_TL?.userRef,
              departmentAndGradeOfUser: approvalOfPRD_TL?.user_type,
            };
          } else completeApproval();

          break;

        case "Under PRD TL Approval":
          completeApproval();
          break;
      }
      updateObj.$set = {
        ...updateObj?.$set,
        [`${allKeys?.approvalObj}.approvalStatus`]: "Accepted",
        [allKeys?.requestSheetStatusOfCM]:
          nextApprovalObj?.requestSheetStatusOfCM,
        [allKeys?.getDataForApprovalDashboard]:
          nextApprovalObj?.getDataForApprovalDashboard,
      };
    }

    const requestSheetOfCM = await RequestSheetOfCM.findOneAndUpdate(
      {
        _id: mongoose.Types.ObjectId(requestSheetID),
      },
      updateObj,
      {
        arrayFilters: [
          {
            "yearFilter.preAggregationTimeStampOfRequestSheet.requestSheet_year":
              currentYear,
          },
          {
            "quarterFilter.requestSheet_quarter":
              getFinancialQuarter(targetDateOfCM),
          },
          { "userFilter._id": mongoose.Types.ObjectId(ObjForUserFilter?._id) },
        ],
        new: true,
      }
    );

    if (pushOperation) {
      await RequestSheetOfCM.findByIdAndUpdate(requestSheetID, {
        $push: {
          commonDataFilledByAssignUser: pushOperation,
        },
      });
    }

    successResponse(res, "Request-sheet approved successfully", {
      requestSheetOfCM,
    });
  })
);