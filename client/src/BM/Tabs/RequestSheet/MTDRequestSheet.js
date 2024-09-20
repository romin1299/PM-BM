import denso_log from "../../../static/images/denso_logo.png";
import { Row, Col, Form } from "react-bootstrap";
import { DropdownButton, Dropdown } from "react-bootstrap";

import React, { useState, useEffect, useContext } from "react";
import { Table } from "react-bootstrap";
import DownloadIcon from "@mui/icons-material/Download";
import { AddBoxIcon } from "../../../modules/PageModules";
import ProblemList from "../SubComponents/ProblemList";
import ActionList from "../SubComponents/ActionList";
import PartList from "../SubComponents/PartList";
import { Controller, useForm } from "react-hook-form";
import moment from "moment";
import DropdownElem from "../../Component/DropdownElem";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import RoutingContext from "../../../context/routing/RoutingContext";
import { SuccessToast, WarningToast } from "../../Component/ShowTostify";
import Multiselect from "multiselect-react-dropdown";
import { Button, Typography } from "@mui/material";
import { BASE_URL } from "../../../ConditionsForDNINandDNHA/ConditionBasedDisplay";

const list = [
  { key: "A", value: "A" },
  { key: "B", value: "B" },
  { key: "C", value: "C" },
  { key: "D", value: "D" },
];

function MyTable({
  selectedMachineDetails,
  approvalListOfBM,
  requestSheetDataOfBM,
  supportingTMList,
}) {
  const loggedUserDetails = useContext(RoutingContext);

  const navigate = useNavigate();

  const { machine_code, requestSheetID, generateType } = useParams();

  const [actions, setActions] = useState([]);
  const [problems, setProblems] = useState([]);
  const [parts, setParts] = useState([]);
  const [selectedMinor, setSelectedMinor] = useState();
  const [selectedMajor, setSelectedMajor] = useState();

  const [selectedSupportedTM, setSelectedSupportedTM] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields },
    watch,
    setValue,
    setError,
    control,
    clearErrors,
    // reset,
  } = useForm({
    defaultValues: {
      workEndedDateOfBM: moment(new Date()).format("YYYY-MM-DDTHH:mm"),
      spareWaitingTime: 0,
    },
  });

  var curr = new Date();
  var currentDate = curr.toISOString().substring(0, 10);

  let timeDifferenceMinutes =
    moment(watch("workEndedDateOfBM"))
      .tz("Asia/Kolkata")
      .diff(
        moment(requestSheetDataOfBM?.problemOccurredDateAndTimeOfBM).tz(
          "Asia/Kolkata"
        ),
        "minutes"
      ) - (watch("maintenanceTime") || 0);

  const newRequestSheetRegistration = async (requestSheetData) => {
    try {
      requestSheetData.problemsOfBM = problems;
      requestSheetData.actionAndCounterMeasureStep = actions;
      requestSheetData.breakDownTime = timeDifferenceMinutes;
      requestSheetData.minorBD = timeDifferenceMinutes <= 120 ? "Yes" : "No";
      requestSheetData.majorBD = timeDifferenceMinutes > 120 ? "Yes" : "No";
      // requestSheetData.changedParts = parts?.map(({ _id, ...rest }) => ({
      //   ...rest,
      // }));
      requestSheetData.changedParts = parts;
      requestSheetData.supportingTM =
        // selectedSupportedTM?.length > 0
        //   ?
        selectedSupportedTM?.map((obj) => obj?._id);
      // : requestSheetDataOfBM?.supportingTM?.map((obj) => obj?._id);
      requestSheetData.partQualityCheckedByPRD =
        approvalListOfBM?.prdTL?.[
          requestSheetData?.partQualityCheckedByPRD
        ]?._id;
      requestSheetData.partQualityCheckedByMTD =
        approvalListOfBM?.mtdTL?.[
          requestSheetData?.partQualityCheckedByMTD
        ]?._id;
      requestSheetData.dataSheetOfRequestSheet =
        timeDifferenceMinutes > 120
          ? "Yes"
          : requestSheetData.dataSheetOfRequestSheet;

      const formData = new FormData();
      formData.append("prdDataUpdatedByOtherUser", false);
      // Append the file field
      formData.append(
        "attachedDataSheets",
        requestSheetData?.attachedDataSheets?.[0]
      );

      for (let i = 0; i < requestSheetData?.attachedDrawings?.length; i++) {
        formData.append(
          "attachedDrawings",
          requestSheetData?.attachedDrawings[i]
        );
      }
      const { ...otherFields } = requestSheetData;

      formData.append("otherData", JSON.stringify(otherFields));

      const res = await fetch(
        `/newRequestSheetRegistration/?reqId=${requestSheetID}&&machineRef=${machine_code}`,
        {
          method: "POST",
          // headers: {
          //   "Content-Type": "application/json",
          // },
          body: formData,
        }
      );
      const data = await res.json();
      if (res.status === 201) {
        SuccessToast(data?.message);
        if (
          requestSheetDataOfBM?.assignUser?._id === loggedUserDetails?._id ||
          requestSheetDataOfBM?.handOverUser?._id === loggedUserDetails?._id
        ) {
          navigate("/bm", { replace: true });
        } else {
          navigate("/bm/approval", { replace: true });
        }
      } else {
        WarningToast(data?.message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const deleteDirtyFieldsWhichIsNotRequiredToValidate = () => {
    delete dirtyFields?.["approvalOfRequestSheet"];
    delete dirtyFields?.["MTD_TL"];
    delete dirtyFields?.["MTD_HOSS"];
    delete dirtyFields?.["PRD_TL"];
    delete dirtyFields?.["PRD_HOS"];
    delete dirtyFields?.["MTD_HOS"];
    delete dirtyFields?.["PRD_HOD"];
    delete dirtyFields?.["MTD_HOD"];
    delete dirtyFields?.["rejectedRemarksOfRequestSheet"];
  };

  const handleCustomErrors = () => {
    deleteDirtyFieldsWhichIsNotRequiredToValidate();
    //This validation for not submit/save value while send for approval
    // if (
    //   Object?.keys(dirtyFields)?.length > 0 &&
    //   (loggedUserDetails?.tm_department === "MTD" ||
    //     loggedUserDetails?.user_type === "Operator")
    // ) {
    //   WarningToast(
    //     "Save/submit the change value before sending it for approval!!!"
    //   );
    //   return true;
    // }
    let flagCountForHandlingError = 0;
    if (
      requestSheetDataOfBM?.requestSheetStatus === "Fill Sheet" ||
      requestSheetDataOfBM?.requestSheetStatus === "Work Order Pending" ||
      requestSheetDataOfBM?.requestSheetStatus === "Work Order Closed" ||
      loggedUserDetails?.tm_department === "MTD"
    ) {
      // if (!watch("workStartedDateOfBM")) {
      //   setError("root.handleApprovalErrorFromServerSide", {
      //     type: "workStartedDateOfBM",
      //     message: "This field is required !",
      //   });
      // }
      // if (!watch("workEndedDateOfBM")) {
      //   setError("root.handleApprovalErrorFromServerSide", {
      //     type: "workEndedDateOfBM",
      //     message: "This field is required !",
      //   });
      // }
      if (
        !watch("feedbackMTD_HOS") &&
        loggedUserDetails?.tm_department === "MTD" &&
        loggedUserDetails?.tm_grade === "HOS" &&
        timeDifferenceMinutes > 120
      ) {
        setError(
          "feedbackMTD_HOS",
          {
            message: "This field is required !",
          },
          { shouldFocus: true }
        );
        flagCountForHandlingError++;
        // console.log(flagCountForHandlingError);
      }

      if (watch("analysisTime") === undefined) {
        setError(
          "analysisTime",
          {
            message: "This field is required !",
          },
          { shouldFocus: true }
        );
        flagCountForHandlingError++;
        // console.log(flagCountForHandlingError);

        // return true;
      }
      if (watch("spareWaitingTime") === undefined) {
        setError(
          "spareWaitingTime",
          {
            message: "This field is required !",
          },
          { shouldFocus: true }
        );
        flagCountForHandlingError++;
        // console.log(flagCountForHandlingError);
      }
      if (watch("maintenanceTime") === undefined) {
        setError(
          "maintenanceTime",
          {
            message: "This field is required !",
          },
          { shouldFocus: true }
        );
        flagCountForHandlingError++;
        // console.log(flagCountForHandlingError);
      }
      if (watch("replacementTime") === undefined) {
        setError(
          "replacementTime",
          {
            message: "This field is required !",
          },
          { shouldFocus: true }
        );
        flagCountForHandlingError++;
        // console.log(flagCountForHandlingError);
      }
      if (watch("adjustmentTime") === undefined) {
        setError(
          "adjustmentTime",
          {
            message: "This field is required !",
          },
          { shouldFocus: true }
        );
        flagCountForHandlingError++;
        // console.log(flagCountForHandlingError);
      }
      if (watch("qualityCheckTime") === undefined) {
        setError(
          "qualityCheckTime",
          {
            message: "This field is required !",
          },
          { shouldFocus: true }
        );
        flagCountForHandlingError++;
        // console.log(flagCountForHandlingError);
      }
      if (watch("breakTime") === undefined) {
        setError(
          "breakTime",
          {
            message: "This field is required !",
          },
          { shouldFocus: true }
        );
        flagCountForHandlingError++;
        // console.log(flagCountForHandlingError);
      }

      if (
        parseInt(watch("analysisTime")) +
          parseInt(watch("spareWaitingTime")) +
          parseInt(watch("replacementTime")) +
          // parseInt(watch("maintenanceTime")) +
          parseInt(watch("adjustmentTime")) +
          parseInt(watch("qualityCheckTime")) +
          parseInt(watch("breakTime")) !==
        timeDifferenceMinutes
      ) {
        setError(
          "totalTimeValidation",
          {
            message: "Total time is not valid!",
          },
          { shouldFocus: true }
        );
        flagCountForHandlingError++;
        // console.log(flagCountForHandlingError);
      }

      if (!watch("qualityConfirmed")) {
        setError(
          "qualityConfirmed",
          {
            message: "This field is required !",
          },
          { shouldFocus: true }
        );
        flagCountForHandlingError++;
        // console.log(flagCountForHandlingError);
      }

      if (!watch("firstTimeOrRepeat")) {
        setError(
          "firstTimeOrRepeat",
          {
            message: "This field is required !",
          },
          { shouldFocus: true }
        );
        flagCountForHandlingError++;
        // console.log(flagCountForHandlingError);
      }

      if (!watch("actionTemporaryOrNot")) {
        setError(
          "actionTemporaryOrNot",
          {
            message: "This field is required !",
          },
          { shouldFocus: true }
        );
        flagCountForHandlingError++;
        // console.log(flagCountForHandlingError);
      }

      if (
        !watch("preventive_corrective_maintenance") &&
        timeDifferenceMinutes > 120
      ) {
        setError(
          "preventive_corrective_maintenance",
          {
            message: "This field is required !",
          },
          { shouldFocus: true }
        );
        flagCountForHandlingError++;
        // console.log(flagCountForHandlingError);
      }

      if (!watch("yokotenkai") && timeDifferenceMinutes > 120) {
        setError(
          "yokotenkai",
          {
            message: "This field is required !",
          },
          { shouldFocus: true }
        );
        flagCountForHandlingError++;
        // console.log(flagCountForHandlingError);
      }

      if (problems?.length === 0) {
        setError(
          "problemValidation",
          {
            message: "This field is required !",
          },
          { shouldFocus: true }
        );
        flagCountForHandlingError++;
        // console.log(flagCountForHandlingError);
      }

      if (actions?.length === 0) {
        setError(
          "actionValidation",
          {
            message: "This field is required !",
          },
          { shouldFocus: true }
        );
        flagCountForHandlingError++;
        // console.log(flagCountForHandlingError);
      }

      if (
        !watch("dataSheetOfRequestSheet") &&
        !requestSheetDataOfBM?.dataSheetOfRequestSheet
        //    ||
        // (timeDifferenceMinutes > 120 &&
        //   requestSheetDataOfBM?.dataSheetOfRequestSheet === "Yes")
      ) {
        setError("dataSheetOfRequestSheet", {
          message: "This field is required !",
        });
        flagCountForHandlingError++;
        // console.log(requestSheetDataOfBM?.dataSheetOfRequestSheet);
      }

      if (Object.keys(watch("categories"))?.length > 0) {
        Object.keys(watch("categories"))?.map((obj) => {
          if (watch("categories")[obj] === null) {
            setError(`categories.${obj}`, {
              message: "This field is required !",
            });
            flagCountForHandlingError++;
            // console.log(flagCountForHandlingError);
          }
        });
      }

      if (
        (timeDifferenceMinutes > 120 ||
          watch("dataSheetOfRequestSheet") === "Yes") &&
        !requestSheetDataOfBM?.attachedDataSheets &&
        !watch("attachedDataSheets")
      ) {
        setError("attachedDataSheets", {
          message: "This field is required !",
        });
        flagCountForHandlingError++;
        // console.log(flagCountForHandlingError);
      }

      if (
        watch("drawingOfRequestSheet") === "Yes" &&
        !requestSheetDataOfBM?.attachedDrawings
      ) {
        setError("attachedDrawings", {
          message: "This field is required !",
        });
        flagCountForHandlingError++;
        // console.log(flagCountForHandlingError);
      }

      if (!watch("partQualityCheckedByPRD")) {
        setError("partQualityCheckedByPRD", {
          message: "This field is required !",
        });
        flagCountForHandlingError++;
        // console.log(flagCountForHandlingError);
      }

      if (!watch("partQualityCheckedByMTD")) {
        setError("partQualityCheckedByMTD", {
          message: "This field is required !",
        });
        flagCountForHandlingError++;
        // console.log(flagCountForHandlingError);
      }
    }
    if (
      requestSheetDataOfBM?.assignUser?._id !== loggedUserDetails?._id &&
      requestSheetDataOfBM?.handOverUser?._id !== loggedUserDetails?._id
    ) {
      if (!watch("approvalOfRequestSheet")) {
        setError("approvalOfRequestSheet", {
          message: "Please select approval value (Yes/No)",
        });
        flagCountForHandlingError++;
        // console.log(flagCountForHandlingError);
      }

      if (
        watch("approvalOfRequestSheet") === "No" &&
        !watch("rejectedRemarksOfRequestSheet")
      ) {
        setError("rejectedRemarksOfRequestSheet", {
          message: "Please fill rejected remarks",
        });
        flagCountForHandlingError++;
        // console.log(flagCountForHandlingError);
      }
    }
    return flagCountForHandlingError;
  };
  const sendApprovalForRequestSheetOfBM = async (assignApprovalList) => {
    try {
      let checkWhetherAnyErrorOccurredOrNot = await handleCustomErrors();
      if (checkWhetherAnyErrorOccurredOrNot > 0) {
        return;
      } else {
        const res = await fetch(
          `/sendApprovalForRequestSheetOfBM/${requestSheetID}/${machine_code}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              assignApprovalList: {
                MTD_TL: {
                  id: approvalListOfBM?.mtdTL?.[assignApprovalList?.MTD_TL]
                    ?._id,
                  name: approvalListOfBM?.mtdTL?.[assignApprovalList?.MTD_TL]
                    ?.tm_name,
                  email:
                    approvalListOfBM?.mtdTL?.[assignApprovalList?.MTD_TL]
                      ?.email,
                },
                MTD_HOSS: {
                  id: approvalListOfBM?.mtdTL?.[assignApprovalList?.MTD_HOSS]
                    ?._id,
                  name: approvalListOfBM?.mtdTL?.[assignApprovalList?.MTD_HOSS]
                    ?.tm_name,
                  email:
                    approvalListOfBM?.mtdTL?.[assignApprovalList?.MTD_HOSS]
                      ?.email,
                },
                PRD_TL: {
                  id: approvalListOfBM?.prdTL?.[assignApprovalList?.PRD_TL]
                    ?._id,
                  name: approvalListOfBM?.prdTL?.[assignApprovalList?.PRD_TL]
                    ?.tm_name,
                  email:
                    approvalListOfBM?.prdTL?.[assignApprovalList?.PRD_TL]
                      ?.email,
                },
                PRD_HOS: {
                  id: approvalListOfBM?.prdHOS?.[assignApprovalList?.PRD_HOS]
                    ?._id,
                  name: approvalListOfBM?.prdHOS?.[assignApprovalList?.PRD_HOS]
                    ?.tm_name,
                  email:
                    approvalListOfBM?.prdHOS?.[assignApprovalList?.PRD_HOS]
                      ?.email,
                },
                MTD_HOS: {
                  id: approvalListOfBM?.mtdHOS?.[assignApprovalList?.MTD_HOS]
                    ?._id,
                  name: approvalListOfBM?.mtdHOS?.[assignApprovalList?.MTD_HOS]
                    ?.tm_name,
                  email:
                    approvalListOfBM?.mtdHOS?.[assignApprovalList?.MTD_HOS]
                      ?.email,
                },
                PRD_HOD: {
                  id: approvalListOfBM?.prdHOD?.[assignApprovalList?.PRD_HOD]
                    ?._id,
                  name: approvalListOfBM?.prdHOD?.[assignApprovalList?.PRD_HOD]
                    ?.tm_name,
                  email:
                    approvalListOfBM?.prdHOD?.[assignApprovalList?.PRD_HOD]
                      ?.email,
                },
                MTD_HOD: {
                  id: approvalListOfBM?.mtdHOD?.[assignApprovalList?.MTD_HOD]
                    ?._id,
                  name: approvalListOfBM?.mtdHOD?.[assignApprovalList?.MTD_HOD]
                    ?.tm_name,
                  email:
                    approvalListOfBM?.mtdHOD?.[assignApprovalList?.MTD_HOD]
                      ?.email,
                },
              },
              requestSheetDataOfBM,
              minorBD: assignApprovalList?.minorBD,
              majorBD: assignApprovalList?.majorBD,
              approvalOfRequestSheet:
                assignApprovalList?.approvalOfRequestSheet,
              rejectedRemarksOfRequestSheet:
                assignApprovalList?.rejectedRemarksOfRequestSheet,
            }),
          }
        );
        const data = await res.json();
        if (res.status === 201) {
          SuccessToast(data?.message);
          newRequestSheetRegistration(assignApprovalList);
          if (
            requestSheetDataOfBM?.assignUser?._id === loggedUserDetails?._id ||
            requestSheetDataOfBM?.handOverUser?._id === loggedUserDetails?._id
          ) {
            // assignApprovalList.submitDataWhileSendingApproval = true;
            navigate("/bm", { replace: true });
          } else {
            navigate("/bm/approval", { replace: true });
          }
        } else {
          WarningToast(data?.message);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const approveRequestSheetFromHigherAuthority = async (
    updatedRequestSheetData
  ) => {
    let checkWhetherAnyErrorOccurredOrNot = handleCustomErrors();
    if (checkWhetherAnyErrorOccurredOrNot > 0) {
      return;
    } else {
      try {
        const res = await fetch(
          `/approveRequestSheetFromHigherAuthority/${requestSheetID}/${machine_code}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              approvalOfRequestSheet: watch("approvalOfRequestSheet"),
              rejectedRemarksOfRequestSheet: watch(
                "rejectedRemarksOfRequestSheet"
              ),
              requestSheetDataOfBM,
            }),
          }
        );
        const data = await res.json();
        if (res.status === 201) {
          if (data?.errorType === "Approve") {
            SuccessToast(data?.message);
          } else {
            WarningToast(data?.message);
          }
          if (loggedUserDetails?.tm_department !== "PRD")
            newRequestSheetRegistration(updatedRequestSheetData);
          navigate("/bm/approval", { replace: true });
        } else {
          WarningToast(data?.message);
        }
      } catch (error) {
        console.log(error);
      }
    }
  };

  useEffect(() => {
    if (requestSheetDataOfBM?._id) {
      setValue(
        "workStartedDateOfBM",
        moment(
          requestSheetDataOfBM?.maintenanceReportFilledByMTD
            ?.workStartedDateOfBM
        )
          .tz("Asia/Kolkata")
          .format("YYYY-MM-DDTHH:mm")
      );

      setValue(
        "workEndedDateOfBM",
        moment(
          requestSheetDataOfBM?.maintenanceReportFilledByMTD?.workEndedDateOfBM
        )
          .tz("Asia/Kolkata")
          .format("YYYY-MM-DDTHH:mm")
      );

      setValue(
        "breakDownTime",
        requestSheetDataOfBM?.maintenanceReportFilledByMTD?.breakDownTime
      );
      setValue(
        "analysisTime",
        requestSheetDataOfBM?.maintenanceReportFilledByMTD?.analysisTime
      );
      setValue(
        "spareWaitingTime",
        requestSheetDataOfBM?.maintenanceReportFilledByMTD?.spareWaitingTime
      );
      setValue(
        "replacementTime",
        requestSheetDataOfBM?.maintenanceReportFilledByMTD?.replacementTime
      );
      setValue(
        "adjustmentTime",
        requestSheetDataOfBM?.maintenanceReportFilledByMTD?.adjustmentTime
      );
      setValue(
        "qualityCheckTime",
        requestSheetDataOfBM?.maintenanceReportFilledByMTD?.qualityCheckTime
      );
      setValue(
        "maintenanceTime",
        requestSheetDataOfBM?.maintenanceReportFilledByMTD?.maintenanceTime
      );
      setValue(
        "breakTime",
        requestSheetDataOfBM?.maintenanceReportFilledByMTD?.breakTime
      );
      setValue(
        "minorBD",
        requestSheetDataOfBM?.maintenanceReportFilledByMTD?.minorBD
      );
      setValue(
        "majorBD",
        requestSheetDataOfBM?.maintenanceReportFilledByMTD?.majorBD
      );
      setValue(
        "firstTimeOrRepeat",
        requestSheetDataOfBM?.maintenanceReportFilledByMTD?.firstTimeOrRepeat
      );
      // setValue(
      //   "repeat",
      //   requestSheetDataOfBM?.maintenanceReportFilledByMTD?.repeat
      // );
      setValue("feedbackMTD_HOS", requestSheetDataOfBM?.feedbackMTD_HOS);
      setValue(
        "why1",
        requestSheetDataOfBM?.maintenanceReportFilledByMTD?.whyAnalysis?.why1
      );
      setValue(
        "why2",
        requestSheetDataOfBM?.maintenanceReportFilledByMTD?.whyAnalysis?.why2
      );
      setValue(
        "why3",
        requestSheetDataOfBM?.maintenanceReportFilledByMTD?.whyAnalysis?.why3
      );
      setValue(
        "why4",
        requestSheetDataOfBM?.maintenanceReportFilledByMTD?.whyAnalysis?.why4
      );
      setValue(
        "why5",
        requestSheetDataOfBM?.maintenanceReportFilledByMTD?.whyAnalysis?.why5
      );

      // setValue('MTD_TL', requestSheetDataOfBM?.approvalOfMTD_TL)
      setValue("qualityConfirmed", requestSheetDataOfBM?.qualityConfirmed);
      setValue(
        "partQualityCheckedByPRD",
        requestSheetDataOfBM?.partQualityCheckedByPRD
      );
      setValue(
        "partQualityCheckedByMTD",
        requestSheetDataOfBM?.partQualityCheckedByMTD
      );

      setValue(
        "dataSheetOfRequestSheet",
        requestSheetDataOfBM?.dataSheetOfRequestSheet
      );

      setValue("attachedDataSheets", requestSheetDataOfBM?.attachedDataSheets);

      setValue(
        "drawingOfRequestSheet",
        requestSheetDataOfBM?.drawingOfRequestSheet
      );

      setValue(
        "actionTemporaryOrNot",
        requestSheetDataOfBM?.actionTemporaryOrNot
      );

      requestSheetDataOfBM?.categoriesOfRequestSheet?.map((obj) => {
        setValue(`categories.${obj?.category}`, obj?.subCategory);
      });

      setValue(
        "preventive_corrective_maintenance",
        requestSheetDataOfBM?.preventive_corrective_maintenance
      );

      setValue("yokotenkai", requestSheetDataOfBM?.yokotenkai);

      setProblems(
        requestSheetDataOfBM?.maintenanceReportFilledByMTD?.problemsOfBM
      );
      setActions(
        requestSheetDataOfBM?.maintenanceReportFilledByMTD
          ?.actionAndCounterMeasureStep
      );
      setParts(requestSheetDataOfBM?.changedParts);

      setSelectedSupportedTM(requestSheetDataOfBM?.supportingTM);
    }
  }, [requestSheetDataOfBM]);

  useEffect(() => {
    if (timeDifferenceMinutes > 120) {
      setSelectedMajor("Yes");
      setSelectedMinor("No");
    } else {
      setSelectedMajor("No");
      setSelectedMinor("Yes");
    }
  }, [timeDifferenceMinutes]);

  return (
    <form onSubmit={handleSubmit(newRequestSheetRegistration)}>
      {/* <fieldset disabled={loggedUserDetails?.tm_department === "PRD" && true}> */}
      <Table className="mb-0">
        <tbody className="m-1 border p-3">
          <tr className="row m-0">
            <td className="col-lg-8 col-md-6 col-sm-12">
              <h4 className="mt-0 d-flex align-items-center justify-content-center">
                MAINTENANCE REPORT (To be filled by MTD)
              </h4>
            </td>
            <td className="mb-0 pb-0 pt-0 col-lg-4 col-md-6 col-sm-12">
              <Row className="pt-0 mb-0 ">
                <Col
                  className="border border-top-0 col-md-4 pb-2 pt-1"
                  style={{ marginLeft: "3px" }}
                >
                  <small className="mb-0">
                    <b>REQUEST RECEIVED MTD S.L</b>
                  </small>
                  <p>{requestSheetDataOfBM?.approvalOfMTD_SL?.tm_name}</p>
                </Col>
                <Col
                  className="pb-2 pt-1 col-md-3"
                  style={{ marginLeft: "3px" }}
                >
                  <small className="fs-6 mb-0">
                    <b>MTD TL</b>
                  </small>
                  <br />
                  {/* {requestSheetDataOfBM?.approvalOfMTD_TL?.length > 0 ? (
                    requestSheetDataOfBM?.approvalOfMTD_TL?.[
                      requestSheetDataOfBM?.approvalOfMTD_TL?.length - 1
                    ]?.tm_name
                  ) : ( */}
                  {requestSheetDataOfBM?.approvalOfMTD_TL &&
                  requestSheetDataOfBM?.approvalStatusOfMTD_TL !==
                    "Rejected" ? (
                    requestSheetDataOfBM?.approvalOfMTD_TL?.tm_name
                  ) : (
                    <DropdownElem
                      name={"MTD_TL"}
                      selectedMinor={selectedMinor}
                      selectedMajor={selectedMajor}
                      maintenanceType={requestSheetDataOfBM?.maintenanceType}
                      approvalList={
                        selectedMachineDetails?.line_names?.cell_names
                          ?.subSection_names?.section_names?.plant_names
                          ?.approvalListOfMinorAndMajor
                      }
                      register={register}
                      errors={errors}
                      displayOrNot={
                        requestSheetDataOfBM?.assignUser?._id ===
                          loggedUserDetails?._id ||
                        requestSheetDataOfBM?.handOverUser?._id ===
                          loggedUserDetails?._id
                      }
                      options={approvalListOfBM?.mtdTL}
                      // required={
                      //   selectedMinor === "Yes" &&
                      //   selectedMachineDetails?.line_names?.cell_names?.subSection_names?.section_names?.plant_names?.approvalListOfMinorAndMajor?.minorApprovalList?.includes(
                      //     "MTD_TL".replace("_", " ")
                      //   )
                      //     ? true
                      //     : selectedMajor === "Yes" &&
                      //       selectedMachineDetails?.line_names?.cell_names?.subSection_names?.section_names?.plant_names?.approvalListOfMinorAndMajor?.majorApprovalList?.includes(
                      //         "MTD_TL".replace("_", " ")
                      //       )
                      //     ? true
                      //     : false
                      // }
                    />
                  )}
                </Col>
              </Row>
            </td>
          </tr>

          <tr className="row m-0">
            <td lg={12} md={12} sm={12}>
              <Row className="mx-0">
                <Col
                  lg={1}
                  md={2}
                  sm={6}
                  className="d-flex align-items-center border  border-bottom"
                  style={{ height: "100px" }}
                >
                  <small
                    style={{ fontSize: "12px" }}
                    className="text-center m-0 "
                  >
                    <b>WORK STARTED</b>
                  </small>
                </Col>
                <Col
                  className="border border-bottom"
                  lg={2}
                  md={4}
                  sm={6}
                  style={{ height: "100px" }}
                >
                  <div className="d-flex align-items-center justify-content-center mt-3 mb-2">
                    <div className="text-center">
                      <small className="mb-0 d-block">
                        <b>DATE & TIME: </b>
                        <br />
                        <input
                          type="datetime-local"
                          style={{ width: "165px" }}
                          // defaultValue={currentDate}
                          // onChange={(e) => {
                          //   setValue(
                          //     "workStartedDateOfBM",
                          //     e.target.value
                          //   );
                          //   clearErrors(
                          //     "root.handleApprovalErrorFromServerSide"
                          //   );
                          // }}
                          {...register("workStartedDateOfBM", {
                            // required: "Work start date is required",
                          })}
                        />
                        {errors?.["workStartedDateOfBM"] && (
                          <p className="text-error">
                            {errors?.["workStartedDateOfBM"]?.message}
                          </p>
                        )}
                      </small>
                    </div>{" "}
                    {/* &nbsp;&nbsp;&nbsp;&nbsp;
                          <div className="text-center">
                            <p className="mb-0">
                              <b>TIME: </b>

                              <input
                                disabled
                                type="time"
                                // defaultValue={currTime}
                                {...register("workStartedTimeOfBM", {
                                  required: "Work start time is required",
                                })}
                                // onChange={handleStartTime}
                              />
                              {errors?.["workStartedTimeOfBM"] && (
                                <p className="text-error">
                                  {errors?.["workStartedTimeOfBM"]?.message}
                                </p>
                              )}
                            </p>
                          </div> */}
                  </div>
                </Col>
                <Col
                  className="border  border-bottom d-flex align-items-center"
                  lg={1}
                  md={2}
                  sm={6}
                  style={{ height: "100px" }}
                >
                  <small
                    style={{ fontSize: "12px" }}
                    className="text-center m-0"
                  >
                    <b>WORK ENDED</b>
                  </small>
                </Col>
                <Col
                  className="border"
                  lg={2}
                  md={3}
                  sm={6}
                  style={{ height: "100px" }}
                >
                  <div className="d-flex align-items-center justify-content-center mt-3 mb-2">
                    <div className="text-center">
                      <small className="mb-0 d-block">
                        <b>DATE & TIME: </b>
                        <br />
                        <input
                          type="datetime-local"
                          style={{ width: "165px" }}
                          defaultValue={currentDate}
                          {...register("workEndedDateOfBM", {
                            // required: "Work Ended date is required",
                          })}
                          // onChange={(e) => {
                          //   setValue("workEndedDateOfBM", e.target.value);
                          //   clearErrors(
                          //     "root.handleApprovalErrorFromServerSide"
                          //   );
                          // }}
                          disabled={
                            requestSheetDataOfBM?.assignUser?._id !==
                              loggedUserDetails?._id &&
                            requestSheetDataOfBM?.handOverUser?._id !==
                              loggedUserDetails?._id &&
                            requestSheetDataOfBM?.approvalOfMTD_TL?._id !==
                              loggedUserDetails?._id
                          }
                        />
                        {errors?.["workEndedDateOfBM"] && (
                          <p className="text-error">
                            {errors?.["workEndedDateOfBM"]?.message}
                          </p>
                        )}
                      </small>
                    </div>{" "}
                    {/* &nbsp;&nbsp;&nbsp;&nbsp;
                          <div className="text-center">
                            <p className="mb-0">
                              <b>TIME: </b>
                              <input
                                disabled
                                type="time"
                                // defaultValue={currTime}
                                {...register("workEndedTimeOfBM", {
                                  required: "Work Ended Time is required",
                                })}
                                // onChange={handleBreakDownTime}
                              />
                              {errors?.["workEndedTimeOfBM"] && (
                                <p className="text-error">
                                  {errors?.["workEndedTimeOfBM"]?.message}
                                </p>
                              )}
                            </p>
                          </div> */}
                  </div>
                </Col>

                <Col
                  lg={3}
                  md={6}
                  sm={12}
                  style={{ height: "100px" }}
                  className="border"
                >
                  <Row className="">
                    <small className="mb-0 mt-1">
                      <b>SECTION IN-CHARGE</b>
                    </small>
                    <br />
                  </Row>
                  <Row>
                    <Col lg={6} md={6} className="d-block border">
                      {(selectedMinor === "Yes" &&
                        selectedMachineDetails?.line_names?.cell_names?.subSection_names?.section_names?.plant_names?.approvalListOfMinorAndMajor?.minorApprovalList?.includes(
                          "MTD_HOSS".replace("_", " ")
                        )) ||
                      (selectedMajor === "Yes" &&
                        selectedMachineDetails?.line_names?.cell_names?.subSection_names?.section_names?.plant_names?.approvalListOfMinorAndMajor?.majorApprovalList?.includes(
                          "MTD_HOSS"?.replace("_", " ")
                        )) ? (
                        <small>
                          <b>MTD HOSS</b>
                        </small>
                      ) : (
                        ""
                      )}
                      {requestSheetDataOfBM?.approvalOfMTD_HOSS &&
                      requestSheetDataOfBM?.approvalStatusOfMTD_HOSS ===
                        "Accepted" &&
                      requestSheetDataOfBM?.requestSheetStatus !==
                        "Rejected" ? (
                        <p>
                          {requestSheetDataOfBM?.approvalOfMTD_HOSS?.tm_name}
                        </p>
                      ) : (
                        <DropdownElem
                          name={"MTD_HOSS"}
                          selectedMinor={selectedMinor}
                          selectedMajor={selectedMajor}
                          maintenanceType={
                            requestSheetDataOfBM?.maintenanceType
                          }
                          approvalList={
                            selectedMachineDetails?.line_names?.cell_names
                              ?.subSection_names?.section_names?.plant_names
                              ?.approvalListOfMinorAndMajor
                          }
                          displayOrNot={
                            requestSheetDataOfBM?.approvalOfMTD_TL?._id ===
                            loggedUserDetails?._id
                          }
                          options={approvalListOfBM?.mtdTL}
                          register={register}
                          errors={errors}
                          // required={
                          //   selectedMinor === "Yes" &&
                          //   selectedMachineDetails?.line_names?.cell_names?.subSection_names?.section_names?.plant_names?.approvalListOfMinorAndMajor?.minorApprovalList?.includes(
                          //     "MTD_HOSS".replace("_", " ")
                          //   )
                          //     ? true
                          //     : selectedMajor === "Yes" &&
                          //       selectedMachineDetails?.line_names?.cell_names?.subSection_names?.section_names?.plant_names?.approvalListOfMinorAndMajor?.majorApprovalList?.includes(
                          //         "MTD_HOSS".replace("_", " ")
                          //       )
                          //     ? true
                          //     : false
                          // }
                        />
                      )}
                    </Col>
                    <Col lg={6} md={6} className="d-block border">
                      {selectedMajor === "Yes" &&
                        selectedMachineDetails?.line_names?.cell_names?.subSection_names?.section_names?.plant_names?.approvalListOfMinorAndMajor?.majorApprovalList?.includes(
                          "MTD_HOS"?.replace("_", " ")
                        ) && <b>MTD HOS</b>}
                      {requestSheetDataOfBM?.approvalOfMTD_HOS &&
                      requestSheetDataOfBM?.approvalStatusOfMTD_HOS ===
                        "Accepted" &&
                      requestSheetDataOfBM?.requestSheetStatus !==
                        "Rejected" ? (
                        requestSheetDataOfBM?.approvalOfMTD_HOS?.tm_name
                      ) : (
                        <DropdownElem
                          name={"MTD_HOS"}
                          selectedMinor={selectedMinor}
                          selectedMajor={selectedMajor}
                          maintenanceType={
                            requestSheetDataOfBM?.maintenanceType
                          }
                          approvalList={
                            selectedMachineDetails?.line_names?.cell_names
                              ?.subSection_names?.section_names?.plant_names
                              ?.approvalListOfMinorAndMajor
                          }
                          displayOrNot={
                            requestSheetDataOfBM?.approvalOfMTD_TL?._id ===
                            loggedUserDetails?._id
                          }
                          options={approvalListOfBM?.mtdHOS}
                          register={register}
                          errors={errors}
                          // required={
                          //   selectedMinor === "Yes" &&
                          //   selectedMachineDetails?.line_names?.cell_names?.subSection_names?.section_names?.plant_names?.approvalListOfMinorAndMajor?.minorApprovalList?.includes(
                          //     "MTD_HOS".replace("_", " ")
                          //   )
                          //     ? true
                          //     : selectedMajor === "Yes" &&
                          //       selectedMachineDetails?.line_names?.cell_names?.subSection_names?.section_names?.plant_names?.approvalListOfMinorAndMajor?.majorApprovalList?.includes(
                          //         "MTD_HOS".replace("_", " ")
                          //       )
                          //     ? true
                          //     : false
                          // }
                        />
                      )}
                    </Col>
                  </Row>
                </Col>

                <Col
                  lg={3}
                  md={6}
                  sm={12}
                  className="border pb-2 "
                  style={{ height: "100px" }}
                >
                  {loggedUserDetails?.tm_department === "MTD" &&
                  loggedUserDetails?.tm_grade === "HOS" &&
                  timeDifferenceMinutes > 120 ? (
                    <>
                      <small className="mb-0">
                        <b>FEEDBACK</b>
                      </small>
                      <br />
                      <input
                        type="text"
                        className="widthwhy"
                        id="feedbackMTD_HOS"
                        name="feedbackMTD_HOS"
                        // {...register("feedbackMTD_HOS", {
                        //   required: "This field is required",
                        // })}
                        onChange={(e) => {
                          setValue("feedbackMTD_HOS", e.target.value, {
                            shouldDirty: true,
                          });
                          clearErrors("feedbackMTD_HOS");
                        }}
                      />

                      {errors?.["feedbackMTD_HOS"] && (
                        <p className="text-error">
                          {errors?.["feedbackMTD_HOS"]?.message}
                        </p>
                      )}
                    </>
                  ) : (
                    ""
                  )}
                </Col>
              </Row>
            </td>

            {/* <td className="mb-0 pb-0 pt-0 col-lg-4">
              <div className="mb-2" >
                <Row className="m-0">
                  <Col lg={6} md={6} sm={12} className="border">
                    <p className="mb-0">
                      <b>SECTION INCHARGE</b>
                    </p>
                    {selectedMinor === "Yes" &&
                    selectedMachineDetails?.line_names?.cell_names?.subSection_names?.section_names?.plant_names?.approvalListOfMinorAndMajor?.minorApprovalList?.includes(
                      "MTD_HOSS".replace("_", " ")
                    ) ? (
                      <label>
                        <b>MTD HOSS</b>
                      </label>
                    ) : (
                      ""
                    )}
                    {requestSheetDataOfBM?.approvalOfMTD_HOSS &&
                    requestSheetDataOfBM?.approvalStatusOfMTD_HOSS ===
                      "Accepted" &&
                    requestSheetDataOfBM?.requestSheetStatus !== "Rejected" ? (
                      <p>{requestSheetDataOfBM?.approvalOfMTD_HOSS?.tm_name}</p>
                    ) : (
                      <DropdownElem
                        name={"MTD_HOSS"}
                        selectedMinor={selectedMinor}
                        selectedMajor={selectedMajor}
                        approvalList={
                          selectedMachineDetails?.line_names?.cell_names
                            ?.subSection_names?.section_names?.plant_names
                            ?.approvalListOfMinorAndMajor
                        }
                        displayOrNot={
                          requestSheetDataOfBM?.approvalOfMTD_TL?._id ===
                          loggedUserDetails?._id
                        }
                        options={approvalListOfBM?.mtdTL}
                        register={register}
                        errors={errors}
                        // required={
                        //   selectedMinor === "Yes" &&
                        //   selectedMachineDetails?.line_names?.cell_names?.subSection_names?.section_names?.plant_names?.approvalListOfMinorAndMajor?.minorApprovalList?.includes(
                        //     "MTD_HOSS".replace("_", " ")
                        //   )
                        //     ? true
                        //     : selectedMajor === "Yes" &&
                        //       selectedMachineDetails?.line_names?.cell_names?.subSection_names?.section_names?.plant_names?.approvalListOfMinorAndMajor?.majorApprovalList?.includes(
                        //         "MTD_HOSS".replace("_", " ")
                        //       )
                        //     ? true
                        //     : false
                        // }
                      />
                    )}
                    {selectedMajor === "Yes" && (
                      <label>
                        <b>MTD HOS</b>
                      </label>
                    )}
                    {requestSheetDataOfBM?.approvalOfMTD_HOS &&
                    requestSheetDataOfBM?.approvalStatusOfMTD_HOS ===
                      "Accepted" &&
                    requestSheetDataOfBM?.requestSheetStatus !== "Rejected" ? (
                      requestSheetDataOfBM?.approvalOfMTD_HOS?.tm_name
                    ) : (
                      <DropdownElem
                        name={"MTD_HOS"}
                        selectedMinor={selectedMinor}
                        selectedMajor={selectedMajor}
                        approvalList={
                          selectedMachineDetails?.line_names?.cell_names
                            ?.subSection_names?.section_names?.plant_names
                            ?.approvalListOfMinorAndMajor
                        }
                        displayOrNot={
                          requestSheetDataOfBM?.approvalOfMTD_TL?._id ===
                          loggedUserDetails?._id
                        }
                        options={approvalListOfBM?.mtdHOS}
                        register={register}
                        errors={errors}
                        // required={
                        //   selectedMinor === "Yes" &&
                        //   selectedMachineDetails?.line_names?.cell_names?.subSection_names?.section_names?.plant_names?.approvalListOfMinorAndMajor?.minorApprovalList?.includes(
                        //     "MTD_HOS".replace("_", " ")
                        //   )
                        //     ? true
                        //     : selectedMajor === "Yes" &&
                        //       selectedMachineDetails?.line_names?.cell_names?.subSection_names?.section_names?.plant_names?.approvalListOfMinorAndMajor?.majorApprovalList?.includes(
                        //         "MTD_HOS".replace("_", " ")
                        //       )
                        //     ? true
                        //     : false
                        // }
                      />
                    )}
                  </Col>
                  {loggedUserDetails?.tm_department === "MTD" &&
                  loggedUserDetails?.tm_grade === "HOS" &&
                  timeDifferenceMinutes > 120 ? (
                    <Col lg={6} md={6} sm={12} className="border">
                      <p className="fs-6 mb-0">
                        <b>FEEDBACK</b>
                      </p>
                      <input
                        type="text"
                        id="feedbackMTD_HOS"
                        name="feedbackMTD_HOS"
                        style={{ width: "100%" }}
                        {...register("feedbackMTD_HOS", {
                          required: "This field is required",
                        })}
                      />
                      {errors?.["feedbackMTD_HOS"] && (
                        <>
                          <p className="text-error">
                            {errors?.["feedbackMTD_HOS"]?.message}
                          </p>
                          <input
                            type="text"
                            className="mb-2"
                            id="feedbackMTD_HOS"
                            name="feedbackMTD_HOS"
                            style={{ width: "60%" }}
                            {...register("feedbackMTD_HOS", {
                              required: "This field is required",
                            })}
                          />
                          {errors?.["feedbackMTD_HOS"] && (
                            <p className="text-error">
                              {errors?.["feedbackMTD_HOS"]?.message}
                            </p>
                          )}
                        </>
                      )}
                    </Col>
                  ) : (
                    ""
                  )}
                </Row>
              </div>
            </td> */}
          </tr>

          <tr className="row m-0">
            <td className="col-lg-5 col-md-6 col-sm-12 border-bottom">
              <ProblemList
                problems={problems}
                setProblems={setProblems}
                clearErrors={clearErrors}
              />
              <input
                {...register("problemValidation", {
                  // required: "This field is required",
                })}
                className="visually-hidden"
              ></input>
              {errors?.["problemValidation"] && (
                <p className="text-error">
                  {errors?.["problemValidation"]?.message}
                </p>
              )}

              <Row className="m-0">
                <Col
                  lg={3}
                  md={6}
                  sm={6}
                  className="border text-center pb-2 pt-2"
                >
                  <Col className="h-50">
                    <small className="mb-0" style={{ fontSize: "12px" }}>
                      <b>BREAKDOWN</b>
                    </small>
                  </Col>
                  <Col>
                    <p>
                      {
                        // watch("maintenanceTime")
                        //   ? timeDifferenceMinutes - watch("maintenanceTime") || null
                        //   :
                        timeDifferenceMinutes
                      }
                    </p>
                  </Col>
                </Col>
                <Col
                  lg={3}
                  md={6}
                  sm={6}
                  className="border text-center pb-2 pt-2"
                >
                  <Col className="h-50">
                    <small className="mb-0" style={{ fontSize: "12px" }}>
                      <b>ANALYSIS</b>
                    </small>
                  </Col>
                  <Col>
                    <input
                      type="number"
                      style={{ width: "100%" }}
                      id="analysisTime"
                      name="analysisTime"
                      {...register("analysisTime", {
                        // required: "This field is required",
                      })}
                      onChange={(e) => {
                        setValue("analysisTime", e.target.value, {
                          shouldDirty: true,
                        });
                        clearErrors("analysisTime");
                        clearErrors("totalTimeValidation");
                      }}
                      // onChange={handleanalysisTime}
                    />
                    {errors?.["analysisTime"] && (
                      <p className="text-error">
                        {errors?.["analysisTime"]?.message}
                      </p>
                    )}
                  </Col>
                </Col>
                <Col
                  lg={3}
                  md={6}
                  sm={6}
                  className="border text-center pb-2 pt-2"
                >
                  <Col className="h-50">
                    <small className="mb-0" style={{ fontSize: "12px" }}>
                      <b>SPARE WAITING</b>
                    </small>
                  </Col>
                  <Col>
                    <input
                      type="number"
                      className="mb-2"
                      style={{ width: "100%" }}
                      id="spareWaitingTime"
                      name="spareWaitingTime"
                      {...register("spareWaitingTime", {
                        // required: "This field is required",
                      })}
                      onChange={(e) => {
                        setValue("spareWaitingTime", e.target.value, {
                          shouldDirty: true,
                        });
                        clearErrors("spareWaitingTime");
                        clearErrors("totalTimeValidation");
                      }}
                      // onChange={handlespareWaitingTime}
                    />
                    {errors?.["spareWaitingTime"] && (
                      <p className="text-error">
                        {errors?.["spareWaitingTime"]?.message}
                      </p>
                    )}
                  </Col>
                </Col>
                <Col
                  lg={3}
                  md={6}
                  sm={6}
                  className="border text-center pb-2 pt-2"
                >
                  <Col className="h-50">
                    <small className="mb-0" style={{ fontSize: "12px" }}>
                      <b>REPLACEMENT</b>
                    </small>
                  </Col>
                  <Col>
                    <input
                      type="number"
                      className="mb-2"
                      style={{ width: "100%" }}
                      id="replacementTime"
                      name="replacementTime"
                      {...register("replacementTime", {
                        // required: "This field is required",
                      })}
                      onChange={(e) => {
                        setValue("replacementTime", e.target.value, {
                          shouldDirty: true,
                        });
                        clearErrors("replacementTime");
                        clearErrors("totalTimeValidation");
                      }}
                      // onChange={handlereplacementTime}
                    />
                    {errors?.["replacementTime"] && (
                      <p className="text-error">
                        {errors?.["replacementTime"]?.message}
                      </p>
                    )}
                  </Col>
                </Col>
              </Row>
              <Row className="m-0">
                <Col
                  lg={3}
                  md={6}
                  sm={6}
                  className="border text-center pb-2 pt-2"
                >
                  <Col className="h-50">
                    <small className="mb-0" style={{ fontSize: "12px" }}>
                      <b>MAINTENANCE</b> <br />{" "}
                      <p>
                        <b>(No Loss)</b>
                      </p>
                    </small>
                  </Col>
                  <Col>
                    <input
                      type="number"
                      style={{ width: "100%" }}
                      id="maintenance"
                      name="maintenance"
                      {...register("maintenanceTime", {
                        // required: "This field is required",
                      })}
                      onChange={(e) => {
                        setValue("maintenanceTime", e.target.value, {
                          shouldDirty: true,
                        });
                        clearErrors("maintenanceTime");
                        clearErrors("totalTimeValidation");
                      }}
                      // onChange={handlemaintenanceTime}
                    />
                    {errors?.["maintenanceTime"] && (
                      <p className="text-error">
                        {errors?.["maintenanceTime"]?.message}
                      </p>
                    )}
                  </Col>
                </Col>
                <Col
                  lg={3}
                  md={6}
                  sm={6}
                  className="border text-center pb-2 pt-2"
                >
                  <Col className="h-50">
                    <small className="mb-0" style={{ fontSize: "12px" }}>
                      <b>ADJUSTMENT</b>
                    </small>
                  </Col>
                  <Col>
                    <input
                      type="number"
                      style={{ width: "100%" }}
                      id="mainTime"
                      name="mainTime"
                      {...register("adjustmentTime", {
                        // required: "This field is required",
                      })}
                      onChange={(e) => {
                        setValue("adjustmentTime", e.target.value, {
                          shouldDirty: true,
                        });
                        clearErrors("adjustmentTime");
                        clearErrors("totalTimeValidation");
                      }}
                      // onChange={handleadjustmentTime}
                    />
                    {errors?.["adjustmentTime"] && (
                      <p className="text-error">
                        {errors?.["adjustmentTime"]?.message}
                      </p>
                    )}
                  </Col>
                </Col>
                <Col
                  lg={3}
                  md={6}
                  sm={6}
                  className="border text-center pb-2 pt-2"
                >
                  <Col className="h-50">
                    <small className="mb-0" style={{ fontSize: "12px" }}>
                      <b>QUALITY CHECK</b>
                    </small>
                  </Col>
                  <Col>
                    <input
                      type="number"
                      className="mb-2"
                      style={{ width: "100%" }}
                      id="qualityTime"
                      name="qualityTime"
                      {...register("qualityCheckTime", {
                        // required: "This field is required",
                      })}
                      onChange={(e) => {
                        setValue("qualityCheckTime", e.target.value, {
                          shouldDirty: true,
                        });
                        clearErrors("qualityCheckTime");
                        clearErrors("totalTimeValidation");
                      }}
                      // onChange={handleQualityCheckTime}
                    />
                    {errors?.["qualityCheckTime"] && (
                      <p className="text-error">
                        {errors?.["qualityCheckTime"]?.message}
                      </p>
                    )}
                  </Col>
                </Col>
                <Col
                  lg={3}
                  md={6}
                  sm={6}
                  className="border text-center pb-2 pt-2"
                >
                  <Col className="h-50">
                    <small className="mb-0" style={{ fontSize: "12px" }}>
                      <b>BREAK</b>
                    </small>
                  </Col>
                  <Col>
                    <input
                      type="number"
                      className="mb-2"
                      style={{ width: "100%" }}
                      id="breakTime"
                      name="breakTime"
                      {...register("breakTime", {
                        // required: "This field is required",
                      })}
                      onChange={(e) => {
                        setValue("breakTime", e.target.value, {
                          shouldDirty: true,
                        });
                        clearErrors("breakTime");
                        clearErrors("totalTimeValidation");
                      }}
                      // onChange={handleBreakTime}
                    />
                    {errors?.["breakTime"] && (
                      <p className="text-error">
                        {errors?.["breakTime"]?.message}
                      </p>
                    )}
                  </Col>
                </Col>
              </Row>

              <input
                {...register("totalTimeValidation", {
                  // required: "This field is required",
                })}
                className="visually-hidden"
              ></input>
              {errors?.["totalTimeValidation"] && (
                <p className="text-error">
                  {errors?.["totalTimeValidation"]?.message}
                </p>
              )}
              <Row className="m-0">
                <Col>
                  <Row>
                    <Col
                      lg={6}
                      md={6}
                      sm={6}
                      className="border d-flex align-items-center"
                    >
                      <p className="mb-0" style={{ fontSize: "12px" }}>
                        <b>MAJOR B/D </b>
                      </p>
                      &nbsp;&nbsp;&nbsp;
                      <Form className="d-flex align-items-center justify-content-center">
                        <div className="d-flex">
                          <Form.Check
                            flex
                            label="Yes"
                            name="majorBD"
                            type="radio"
                            value="Yes"
                            id="majorBD"
                            disabled
                            checked={timeDifferenceMinutes > 120 ? true : false}
                          />
                          &nbsp;&nbsp;
                          <Form.Check
                            flex
                            label="No"
                            name="majorBD"
                            type="radio"
                            value="No"
                            id="majorBD"
                            disabled
                            checked={timeDifferenceMinutes > 120 ? false : true}
                          />
                        </div>
                      </Form>
                    </Col>
                    <Col
                      lg={6}
                      md={6}
                      sm={6}
                      className="border d-flex align-items-center"
                    >
                      <Form className="align-items-center justify-content-center">
                        <div className="d-flex">
                          <Form.Check
                            flex
                            label="FIRST TIME"
                            name="firstTimeOrRepeat"
                            type="radio"
                            value="First Time"
                            id="firstTimeOrRepeat"
                            // onChange={handleFirstTime}
                            {...register("firstTimeOrRepeat", {
                              // required: "This field is required",
                            })}
                            onChange={(e) => {
                              setValue("firstTimeOrRepeat", e.target.value, {
                                shouldDirty: true,
                              });
                              clearErrors("firstTimeOrRepeat");
                            }}
                          />
                          &nbsp;&nbsp;
                          <Form.Check
                            flex
                            label="REPEAT"
                            name="firstTimeOrRepeat"
                            type="radio"
                            value="Repeat"
                            id="firstTimeOrRepeat"
                            {...register("firstTimeOrRepeat", {
                              // required: "This field is required",
                            })}
                            // onChange={handleFirstTime}
                            onChange={(e) => {
                              setValue("firstTimeOrRepeat", e.target.value, {
                                shouldDirty: true,
                              });
                              clearErrors("firstTimeOrRepeat");
                            }}
                          />
                        </div>
                        {errors?.["firstTimeOrRepeat"] && (
                          <p className="text-error">
                            {errors?.["firstTimeOrRepeat"]?.message}
                          </p>
                        )}
                      </Form>
                    </Col>
                    <Col
                      lg={6}
                      md={6}
                      sm={6}
                      className="border d-flex align-items-center"
                    >
                      <p className="mb-0" style={{ fontSize: "12px" }}>
                        <b>MINOR B/D </b>
                      </p>
                      &nbsp;&nbsp;&nbsp;
                      <Form className="d-flex align-items-center justify-content-center">
                        <div className="d-flex">
                          <Form.Check
                            flex
                            label="Yes"
                            name="minorBD"
                            type="radio"
                            disabled
                            value="Yes"
                            id="minorBD"
                            checked={
                              timeDifferenceMinutes <= 120 ? true : false
                            }
                          />
                          &nbsp;&nbsp;
                          {/* {console.log(selectedMinor === "Yes")} */}
                          <Form.Check
                            flex
                            label="No"
                            name="minorBD"
                            type="radio"
                            disabled
                            value="No"
                            id="minorBD"
                            checked={
                              timeDifferenceMinutes <= 120 ? false : true
                            }
                          />
                        </div>
                      </Form>
                    </Col>
                    {/* <Col
                        lg={6}
                        md={6}
                        sm={6}
                        className="border d-flex align-items-center"
                      >
                        <p className="mb-0" style={{ fontSize: "12px" }}>
                          <b>REPEAT </b>
                        </p>{" "}
                        &nbsp;&nbsp;&nbsp;
                        <Form>
                          <div className="d-flex">
                            <Form.Check
                              flex
                              label="Yes"
                              name="repeat"
                              type="radio"
                              value="Yes"
                              id="repeat"
                              // onChange={handleRepeated}
                              {...register("repeat", {
                                required: "This field is required",
                              })}
                            />{" "}
                            &nbsp;&nbsp;
                            <Form.Check
                              flex
                              label="No"
                              name="repeat"
                              type="radio"
                              value="No"
                              id="repeat"
                              // onChange={handleRepeated}
                              {...register("repeat", {
                                required: "This field is required",
                              })}
                            />
                          </div>
                          {errors?.["repeat"] && (
                            <p className="text-error">
                              {errors?.["repeat"]?.message}
                            </p>
                          )}
                        </Form>
                      </Col> */}
                  </Row>
                </Col>
                {/* <Col className="border">
                  <Row className="d-flex align-items-center justify-content-center">
                    <Col>
                      <p className="mb-0" style={{ fontSize: "12px" }}>
                        <b>FIRST TIME </b>
                      </p>
                    </Col>
                    <Col>
                      <Form>
                        <div className="d-flex">
                          <Form.Check
                            flex
                            label="Yes"
                            name="firstTime"
                            type="radio"
                            value="Yes"
                            id="firstTime"
                            // onChange={handleFirstTime}
                            {...register("firstTime", {
                              required: "This field is required",
                            })}
                          />
                          <Form.Check
                            flex
                            label="No"
                            name="firstTime"
                            type="radio"
                            value="No"
                            id="firstTime"
                            // onChange={handleFirstTime}
                            {...register("firstTime", {
                              required: "This field is required",
                            })}
                          />
                        </div>
                        {errors?.["firstTime"] && (
                          <p className="text-error">
                            {errors?.["firstTime"]?.message}
                          </p>
                        )}
                      </Form>
                    </Col>
                  </Row>
                </Col> */}
              </Row>
              {/* <Row className="m-0">
                <Col className="border">
                  <Row className="d-flex align-items-center justify-content-center">
                    <Col>
                      <p className="mb-0" style={{ fontSize: "12px" }}>
                        <b>MINOR B/D </b>
                      </p>
                    </Col>
                    <Col>
                      <Form>
                        <div className="d-flex">
                          <Form.Check
                            flex
                            label="Yes"
                            name="minorBD"
                            type="radio"
                            disabled
                            value="Yes"
                            id="minorBD"
                            checked={
                              timeDifferenceMinutes <= 120 ? true : false
                            }
                          />
                          {/* {console.log(selectedMinor === "Yes")}
                          <Form.Check
                            flex
                            label="No"
                            name="minorBD"
                            type="radio"
                            disabled
                            value="No"
                            id="minorBD"
                            checked={
                              timeDifferenceMinutes <= 120 ? false : true
                            }
                          />
                        </div>
                      </Form>
                    </Col>
                  </Row>
                </Col>
                <Col className="border">
                  <Row className="d-flex align-items-center justify-content-center">
                    <Col>
                      <p className="mb-0" style={{ fontSize: "12px" }}>
                        <b>REPEAT </b>
                      </p>
                    </Col>
                    <Col>
                      <Form>
                        <div className="d-flex">
                          <Form.Check
                            flex
                            label="Yes"
                            name="repeat"
                            type="radio"
                            value="Yes"
                            id="repeat"
                            // onChange={handleRepeated}
                            {...register("repeat", {
                              required: "This field is required",
                            })}
                          />
                          <Form.Check
                            flex
                            label="No"
                            name="repeat"
                            type="radio"
                            value="No"
                            id="repeat"
                            // onChange={handleRepeated}
                            {...register("repeat", {
                              required: "This field is required",
                            })}
                          />
                        </div>
                        {errors?.["repeat"] && (
                          <p className="text-error">
                            {errors?.["repeat"]?.message}
                          </p>
                        )}
                      </Form>
                    </Col>
                  </Row>
                </Col>
              </Row> */}

              {/* <ActionList actions={actions} setActions={setActions} /> */}
            </td>
            <td className="col-lg-3 col-md-6 col-sm-12 border-bottom">
              <Row className="m-0">
                <Col className="border">
                  <small className="mb-0">
                    <b>WHY WHY ANALYSIS [ ROOT CAUSE ]</b>
                  </small>
                </Col>
              </Row>

              <Row className="m-0">
                <Col lg={12} className="d-block align-items-center border">
                  <p className="mb-0" style={{ fontSize: "12px" }}>
                    <b>WHY-1 </b>
                  </p>{" "}
                  <textarea
                    rows={2}
                    type="text"
                    id="Why1"
                    name="why1"
                    className="m-1 widthwhy"
                    {...register("why1", {
                      // required: "This field is required",
                    })}
                  />
                </Col>
                <Col lg={12} className="d-block align-items-center border">
                  <p className="mb-0" style={{ fontSize: "12px" }}>
                    <b>WHY-2 </b>
                  </p>{" "}
                  <textarea
                    rows={2}
                    type="text"
                    id="Why2"
                    name="why2"
                    className="m-1 widthwhy"
                    {...register("why2", {
                      // required: "This field is required",
                    })}
                  />
                </Col>
                <Col lg={12} className="d-block align-items-center border">
                  <p className="mb-0" style={{ fontSize: "12px" }}>
                    <b>WHY-3 </b>
                  </p>{" "}
                  <textarea
                    rows={2}
                    type="text"
                    id="Why3"
                    name="why3"
                    className="m-1 widthwhy"
                    {...register("why3", {
                      // required: "This field is required",
                    })}
                  />
                </Col>
                <Col lg={12} className="d-block align-items-center border">
                  <p className="mb-0" style={{ fontSize: "12px" }}>
                    <b>WHY-4 </b>
                  </p>{" "}
                  <textarea
                    rows={2}
                    type="text"
                    id="Why4"
                    name="why4"
                    className="m-1 widthwhy"
                    {...register("why4", {
                      // required: "This field is required",
                    })}
                  />
                </Col>
                <Col lg={12} className="d-block align-items-center border">
                  <p className="mb-0" style={{ fontSize: "12px" }}>
                    <b>WHY-5 </b>
                  </p>{" "}
                  <textarea
                    rows={2}
                    type="text"
                    id="Why5"
                    name="why5"
                    className="m-1 widthwhy"
                    {...register("why5", {
                      // required: "This field is required",
                    })}
                  />
                </Col>
                {/* <Col lg={8} md={8}>
                      <textarea
                        rows={1}
                        type="text"
                        id="Why1"
                        name="why1"
                        className="m-1"
                        style={{ width: "100%", maxWidth: "100%" }}
                        {...register("why1", {
                          // required: "This field is required",
                        })}
                      /> */}
                {/* {errors?.["whyAnalysis"] && (
                        <p className="text-error">{errors?.["whyAnalysis"]?.message}</p>
                      )} */}
                {/* </Col> */}
              </Row>
            </td>

            <td className="col-lg-4 col-md-12 col-sm-12  border-bottom">
              <Row className="m-0">
                <Col className="border p-2">
                  <small className="mb-0 d-flex align-items-center justify-content-start">
                    <b>QUALITY CONFIRMED (IPP)</b>&nbsp;&nbsp;&nbsp;
                  </small>
                </Col>
                <Col className="border p-2 d-flex align-items-center">
                  <Form>
                    <div className="d-flex">
                      <Form.Check
                        flex
                        label="Yes"
                        name="qualityConfirmed"
                        type="radio"
                        value="Yes"
                        id="qualityConfirmed"
                        {...register("qualityConfirmed", {
                          // required: "This field is required",
                        })}
                        onChange={(e) => {
                          setValue("qualityConfirmed", e.target.value, {
                            shouldDirty: true,
                          });
                          clearErrors("qualityConfirmed");
                        }}
                        // onChange={handleQuality}
                      />
                      &nbsp;&nbsp;
                      <Form.Check
                        flex
                        label="No"
                        name="qualityConfirmed"
                        type="radio"
                        value="No"
                        id="qualityConfirmed"
                        {...register("qualityConfirmed", {
                          // required: "This field is required",
                        })}
                        onChange={(e) => {
                          setValue("qualityConfirmed", e.target.value, {
                            shouldDirty: true,
                          });
                          clearErrors("qualityConfirmed");
                        }}
                        // onChange={handleQuality}
                      />
                    </div>
                    {errors?.["qualityConfirmed"] && (
                      <p className="text-error">
                        {errors?.["qualityConfirmed"]?.message}
                      </p>
                    )}
                  </Form>
                </Col>
              </Row>
              <Row className="m-0 border border-bottom-0">
                <p className="text-center mb-0">**PART QUALITY CHECKED</p>
              </Row>
              <Row className="pt-0 mb-0 m-0" style={{ marginLeft: "-8px" }}>
                <Col lg={6} md={6} className="border pb-2 pt-1">
                  <small className="mb-0">
                    <b>PRD</b>
                  </small>
                  {requestSheetDataOfBM?.partQualityCheckedByPRD ? (
                    <p className="mb-0">
                      {requestSheetDataOfBM?.partQualityCheckedByPRD?.tm_name}
                    </p>
                  ) : (
                    <DropdownElem
                      name={"partQualityCheckedByPRD"}
                      options={approvalListOfBM?.prdTL}
                      className={"d-inline"}
                      register={register}
                      errors={errors}
                    />
                  )}
                </Col>
                <Col lg={6} md={6} className="border pb-2 pt-1">
                  <small className="mb-0">
                    <b>MTD</b>
                  </small>
                  {requestSheetDataOfBM?.partQualityCheckedByMTD ? (
                    <p className="mb-0">
                      {requestSheetDataOfBM?.partQualityCheckedByMTD?.tm_name}
                    </p>
                  ) : (
                    <DropdownElem
                      name={"partQualityCheckedByMTD"}
                      options={approvalListOfBM?.mtdTL}
                      className={"d-inline"}
                      register={register}
                      errors={errors}
                    />
                  )}
                </Col>
              </Row>
              <Row className="m-0">
                <Col className="border p-2">
                  <small className="mb-0 d-flex align-items-center justify-content-start">
                    <b>DATA SHEET ATTACHED</b>&nbsp;&nbsp;&nbsp;
                  </small>
                </Col>
                <Col className="border p-2 d-flex align-items-center">
                  <Form>
                    <div className="d-flex">
                      <Form.Check
                        flex
                        label="Yes"
                        name="dataSheetOfRequestSheet"
                        type="radio"
                        value="Yes"
                        id="dataSheetOfRequestSheet"
                        checked={
                          timeDifferenceMinutes > 120
                            ? true
                            : watch("dataSheetOfRequestSheet") === "Yes"
                            ? true
                            : false
                        }
                        {...register("dataSheetOfRequestSheet")}
                        onChange={(e) => {
                          setValue("dataSheetOfRequestSheet", e.target.value, {
                            shouldDirty: true,
                          });
                          clearErrors("dataSheetOfRequestSheet");
                        }}
                      />
                      &nbsp;&nbsp;
                      <Form.Check
                        flex
                        label="No"
                        name="dataSheetOfRequestSheet"
                        type="radio"
                        value="No"
                        id="dataSheetOfRequestSheet"
                        disabled={timeDifferenceMinutes > 120 && true}
                        {...register("dataSheetOfRequestSheet")}
                        onChange={(e) => {
                          setValue("dataSheetOfRequestSheet", e.target.value, {
                            shouldDirty: true,
                          });
                          clearErrors("dataSheetOfRequestSheet");
                        }}
                      />
                    </div>
                    {errors?.["dataSheetOfRequestSheet"] && (
                      <p className="text-error">
                        {errors?.["dataSheetOfRequestSheet"]?.message}
                      </p>
                    )}

                    {requestSheetDataOfBM?.attachedDataSheets ? (
                      <>
                        <Typography mt={2} variant="body2">
                          {requestSheetDataOfBM?.attachedDataSheets}
                        </Typography>
                        <Button
                          target="_blank"
                          // href={`http://localhost:7000/${requestSheetDataOfBM?.attachedDataSheets}`}
                          href={`${process.env.REACT_APP_BASE_URL}/${requestSheetDataOfBM?.attachedDataSheets}`}
                          disableElevation
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<DownloadIcon fontSize="small" />}
                        >
                          Download
                        </Button>
                      </>
                    ) : timeDifferenceMinutes > 120 ||
                      watch("dataSheetOfRequestSheet") === "Yes" ? (
                      <Form.Group controlId="formFileMultiple" className="mb-3">
                        <Form.Control
                          type="file"
                          // {...register("attachedDataSheets", {
                          //   // required:
                          //   //   timeDifferenceMinutes > 120 ||
                          //   //   watch("dataSheetOfRequestSheet") === "Yes"
                          //   //     ? true
                          //   //     : false,
                          // })}
                          // {...register("attachedDataSheets", {
                          //   // required:
                          //   //   timeDifferenceMinutes > 120 ||
                          //   //   watch("dataSheetOfRequestSheet") === "Yes"
                          //   //     ? true
                          //   //     : false,
                          // })}
                          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                          onChange={(e) => {
                            setValue("attachedDataSheets", e.target.files, {
                              shouldDirty: true,
                            });
                            clearErrors("attachedDataSheets");
                          }}
                        />
                        {errors?.["attachedDataSheets"] && (
                          <p className="text-error">
                            {"This field is required"}
                          </p>
                        )}
                      </Form.Group>
                    ) : (
                      ""
                    )}
                  </Form>
                </Col>
              </Row>
              <Row className="m-0">
                <Col className="border p-2">
                  <small className="mb-0 d-flex align-items-center justify-content-start">
                    <b>DRAWING ATTACHED</b>
                  </small>
                </Col>
                <Col className="border p-2 d-flex align-items-center">
                  <Form>
                    <div className="d-flex">
                      <Form.Check
                        flex
                        label="Yes"
                        name="drawingOfRequestSheet"
                        type="radio"
                        value="Yes"
                        id="drawingOfRequestSheet"
                        // onChange={handledrawingOfRequestSheet}
                        {...register("drawingOfRequestSheet")}
                      />
                      &nbsp;&nbsp;
                      <Form.Check
                        flex
                        label="No"
                        name="drawingOfRequestSheet"
                        type="radio"
                        value="No"
                        id="drawingOfRequestSheet"
                        // onChange={handledrawingOfRequestSheet}
                        {...register("drawingOfRequestSheet")}
                      />
                    </div>

                    {requestSheetDataOfBM?.attachedDrawings?.length > 0 ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        {requestSheetDataOfBM?.attachedDrawings?.map(
                          (image) => (
                            <a
                              target="_blank"
                              // href={`http://localhost:7000/${image}`}
                              href={`${process.env.REACT_APP_BASE_URL}/${image}`}
                              style={{
                                width: "100%",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              <img
                                // src={`http://localhost:7000/${image}`}
                                src={`${process.env.REACT_APP_BASE_URL}/${image}`}
                                style={{
                                  maxWidth: "100px",
                                  maxHeight: "100px",
                                }}
                              />
                              <span
                                style={{
                                  fontSize: "10px",
                                  textAlign: "center",
                                }}
                              >
                                {image}
                              </span>
                            </a>
                          )
                        )}
                      </div>
                    ) : watch("drawingOfRequestSheet") === "Yes" ? (
                      <Form.Group controlId="formFileMultiple" className="mb-3">
                        <Form.Control
                          type="file"
                          multiple
                          // {...register("attachedDrawings", {
                          //   // required:
                          //   //   watch("drawingOfRequestSheet") === "Yes"
                          //   //     ? true
                          //   //     : false,
                          // })}
                          // accept="image/png, image/gif, image/jpeg"
                          onChange={(e) => {
                            setValue("attachedDrawings", e.target.files, {
                              shouldDirty: true,
                            });
                            clearErrors("attachedDrawings");
                          }}
                        />
                        {errors?.["attachedDrawings"] && (
                          <p className="text-error">
                            {"This field is required"}
                          </p>
                        )}
                      </Form.Group>
                    ) : (
                      ""
                    )}
                  </Form>
                </Col>
              </Row>
            </td>
          </tr>

          <tr className="row m-0">
            <td className="col-lg-6 col-md-12 col-sm-12">
              <ActionList
                actions={actions}
                setActions={setActions}
                clearErrors={clearErrors}
              />
              <input
                {...register("actionValidation", {
                  // required: "This field is required",
                })}
                className="visually-hidden"
              ></input>
              {errors?.["actionValidation"] && (
                <p className="text-error">
                  {errors?.["actionValidation"]?.message}
                </p>
              )}
            </td>
            <td className="col-lg-6 col-md-12 col-sm-12">
              <Row className="m-0">
                <Col className="border col-lg-12 col-md-12 col-sm-12">
                  <small>
                    <b>PREVENTIVE / CORRECTIVE MAINTENANCE</b>
                  </small>
                  <br />
                  <textarea
                    rows={2}
                    type="text"
                    id="preventive_corrective_maintenance"
                    name="preventive_corrective_maintenance"
                    style={{ width: "80%" }}
                    {...register("preventive_corrective_maintenance", {
                      // required: "This field is required",
                    })}
                    onChange={(e) => {
                      setValue(
                        "preventive_corrective_maintenance",
                        e.target.value,
                        { shouldDirty: true }
                      );
                      clearErrors("preventive_corrective_maintenance");
                    }}
                  />
                  {errors?.["preventive_corrective_maintenance"] && (
                    <p className="text-error">
                      {errors?.["preventive_corrective_maintenance"]?.message}
                    </p>
                  )}
                </Col>
              </Row>

              {/* <Row className="m-0 p-1 border">
                <AddBoxIcon onClick={() => {}} />
              </Row> */}
              <Row className="m-0">
                <Col className="border col-lg-12 col-md-12 col-sm-12">
                  <small>
                    {" "}
                    <b>YOKOTENKAI</b>
                  </small>

                  <br />
                  <textarea
                    rows={2}
                    type="text"
                    id="yokotenkai"
                    name="yokotenkai"
                    className="m-1"
                    style={{ width: "80%" }}
                    {...register("yokotenkai", {
                      // required: "This field is required",
                    })}
                    onChange={(e) => {
                      setValue("yokotenkai", e.target.value, {
                        shouldDirty: true,
                      });
                      clearErrors("yokotenkai");
                    }}
                  />
                  {errors?.["yokotenkai"] && (
                    <p className="text-error">
                      {errors?.["yokotenkai"]?.message}
                    </p>
                  )}
                </Col>
              </Row>
            </td>
          </tr>

          <tr className="row m-0">
            <td className="col-sm-12 col-md-6">
              <Row className="m-0">
                <Col className="border p-2">
                  <small className="mb-0 d-flex align-items-center justify-content-start">
                    <b>Is Action Temporary?</b>&nbsp;&nbsp;&nbsp;
                  </small>
                </Col>
                <Col className="border p-2 d-flex align-items-center">
                  <Form>
                    <div className="d-flex">
                      <Form.Check
                        flex
                        label="Yes"
                        name="actionTemporaryOrNot"
                        type="radio"
                        value="Yes"
                        id="actionTemporaryOrNot"
                        // onChange={handleactionTemporaryOrNot}
                        {...register("actionTemporaryOrNot", {
                          // required: "This field is required",
                        })}
                        onChange={(e) => {
                          setValue("actionTemporaryOrNot", e.target.value, {
                            shouldDirty: true,
                          });
                          clearErrors("actionTemporaryOrNot");
                        }}
                      />{" "}
                      &nbsp;&nbsp;
                      <Form.Check
                        flex
                        label="No"
                        name="actionTemporaryOrNot"
                        type="radio"
                        value="No"
                        id="actionTemporaryOrNot"
                        // onChange={handleactionTemporaryOrNot}
                        {...register("actionTemporaryOrNot", {
                          // required: "This field is required",
                        })}
                        onChange={(e) => {
                          setValue("actionTemporaryOrNot", e.target.value, {
                            shouldDirty: true,
                          });
                          clearErrors("actionTemporaryOrNot");
                        }}
                      />
                    </div>
                    {errors?.["actionTemporaryOrNot"] && (
                      <p className="text-error">
                        {errors?.["actionTemporaryOrNot"]?.message}
                      </p>
                    )}
                  </Form>
                </Col>
              </Row>
              <Row className="m-0">
                <Col className="border p-2">
                  <small className="mb-0 d-flex align-items-center justify-content-start">
                    <b>No. Of TM Attended.</b>&nbsp;&nbsp;&nbsp;
                  </small>
                </Col>
                <Col className="border p-2 d-flex align-items-center">
                  <Controller
                    name="supportingTM"
                    control={control}
                    render={({ field }) => (
                      <Multiselect
                        {...field}
                        displayValue="tm_name"
                        className="col-9 "
                        options={supportingTMList} // Options to display in the dropdown
                        // selectedValues={departmentList} // Preselected value to persist in dropdown
                        onSelect={async (selectedList) => {
                          await setSelectedSupportedTM(selectedList);
                        }} // Function will trigger on select event
                        onRemove={async (selectedList) => {
                          await setSelectedSupportedTM(selectedList);
                        }} // Function will trigger on remove event
                        style={{
                          multiselectContainer: {
                            width: "15rem",
                          },
                        }}
                        selectedValues={requestSheetDataOfBM?.supportingTM}
                      />
                    )}
                  />
                </Col>
              </Row>
            </td>
            <td className="col-sm-12 col-md-6">
              {requestSheetDataOfBM?.plantRef?.categories?.map(
                (categoryObj, idxOfCategory) => (
                  <>
                    <Row className="m-0">
                      <Col md={4} className="border p-2">
                        <p className="mb-0 d-flex align-items-center justify-content-start">
                          <b>{categoryObj?.name}</b>&nbsp;&nbsp;&nbsp;
                        </p>
                      </Col>

                      <Col
                        md={8}
                        className="border p-2 d-flex align-items-center"
                      >
                        <Form>
                          <div className="d-flex row p-2">
                            {categoryObj?.subCategories?.map(
                              (subCategoryObj, idxOfSubCategory) => (
                                <Form.Check
                                  flex
                                  label={subCategoryObj?.name}
                                  type="radio"
                                  value={subCategoryObj?.name}
                                  name={`categories`}
                                  className="col-auto"
                                  // onChange={handleactionTemporaryOrNot}
                                  {...register(
                                    `categories.${categoryObj?.name}`
                                    // {
                                    //   required: "This field is required",
                                    // }
                                  )}
                                  onChange={(e) => {
                                    setValue(
                                      `categories.${categoryObj?.name}`,
                                      e.target.value,
                                      { shouldDirty: true }
                                    );
                                    clearErrors(
                                      `categories.${categoryObj?.name}`
                                    );
                                  }}
                                />
                              )
                            )}
                          </div>
                          {errors?.[`categories`]?.[`${categoryObj?.name}`] && (
                            <p className="text-error">
                              {
                                errors?.[`categories`]?.[`${categoryObj?.name}`]
                                  ?.message
                              }
                            </p>
                          )}
                        </Form>
                      </Col>
                    </Row>
                  </>
                )
              )}
            </td>
          </tr>

          <tr>
            <td colSpan={16}>
              <Row>
                <Col md={1}>
                  <Row className="ms-0 border" style={{ height: "100%" }}>
                    <Col
                      className="d-flex flex-column align-items-center justify-content-center"
                      style={{
                        // writingMode: "vertical-rl",
                        transform: "rotate(270deg)",
                        whiteSpace: "normal",
                        overflowWrap: "break-word",
                        fontSize: "12px",
                        height: "100%",
                      }}
                    >
                      <b>CHANGED</b>
                      <b>PARTS</b>
                    </Col>
                  </Row>
                </Col>
                <Col lg={11} md={11}>
                  <Row className="">
                    <PartList parts={parts} setParts={setParts} />
                  </Row>
                </Col>
              </Row>
            </td>
          </tr>

          <tr>
            <td colSpan={16}>
              <Row className="m-0">
                <Col lg={4} md={12} className="border">
                  <Row>
                    <small>
                      <b className="text-decoration-underline">NOTE:</b>
                    </small>
                  </Row>
                  <Row>
                    <p
                      className="text-justify mb-0"
                      style={{ fontSize: "12px" }}
                    >
                      * IN CASE OF MAJOR BREKDOWN, IT IS NECESSARY TO GET THE
                      SIGNATURE OF "GM-PRD" & "GM-MTD" IN "CHECKED BY" BOX.
                    </p>
                    <p
                      className="text-justify mb-0"
                      style={{ fontSize: "12px" }}
                    >
                      ** PART QUALITY RELATED TO MAINTENANCE WORK.
                    </p>
                  </Row>
                </Col>

                <Col lg={8} md={12} className="border">
                  <Row>
                    <Col sm={12} className="text-center border p-1">
                      <b>CHECKED BY</b>
                    </Col>
                  </Row>
                  <Row>
                    <Col sm={3} className="border p-1 text-center">
                      <small>
                        <b>* GM-MTD</b>
                      </small>
                    </Col>
                    <Col sm={3} className="border p-1 text-center">
                      <small>
                        <b>* GM-PRD</b>
                      </small>
                    </Col>
                    <Col sm={3} className="border p-1 text-center">
                      <small>
                        <b>SECTION INCHARGE (PRD)</b>
                      </small>
                    </Col>
                    <Col sm={3} className="border p-1 text-center">
                      <small>
                        <b>TEAM LEADER (PRD)</b>
                      </small>
                    </Col>
                  </Row>
                  <Row style={{ minHeight: "40px" }}>
                    <Col sm={3} className="border">
                      <div className="p-1">
                        {/* {requestSheetDataOfBM?.approvalOfMTD_HOD?.length > 0 ? (
                          requestSheetDataOfBM?.approvalOfMTD_HOD?.[
                            requestSheetDataOfBM?.approvalOfMTD_HOD?.length - 1
                          ]?.tm_name
                        ) : ( */}
                        {requestSheetDataOfBM?.approvalOfMTD_HOD &&
                        requestSheetDataOfBM?.approvalStatusOfMTD_HOD ===
                          "Accepted" &&
                        requestSheetDataOfBM?.requestSheetStatus !==
                          "Rejected" ? (
                          requestSheetDataOfBM?.approvalOfMTD_HOD?.tm_name
                        ) : (
                          <DropdownElem
                            name={"MTD_HOD"}
                            selectedMinor={selectedMinor}
                            selectedMajor={selectedMajor}
                            maintenanceType={
                              requestSheetDataOfBM?.maintenanceType
                            }
                            approvalList={
                              selectedMachineDetails?.line_names?.cell_names
                                ?.subSection_names?.section_names?.plant_names
                                ?.approvalListOfMinorAndMajor
                            }
                            displayOrNot={
                              requestSheetDataOfBM?.approvalOfMTD_TL?._id ===
                              loggedUserDetails?._id
                            }
                            options={approvalListOfBM?.mtdHOD}
                            register={register}
                            errors={errors}
                            // required={
                            //   selectedMinor === "Yes" &&
                            //   selectedMachineDetails?.line_names?.cell_names?.subSection_names?.section_names?.plant_names?.approvalListOfMinorAndMajor?.minorApprovalList?.includes(
                            //     "MTD_HOD".replace("_", " ")
                            //   )
                            //     ? true
                            //     : selectedMajor === "Yes" &&
                            //       selectedMachineDetails?.line_names?.cell_names?.subSection_names?.section_names?.plant_names?.approvalListOfMinorAndMajor?.majorApprovalList?.includes(
                            //         "MTD_HOD".replace("_", " ")
                            //       )
                            //     ? true
                            //     : false
                            // }
                          />
                        )}
                      </div>
                    </Col>
                    <Col sm={3} className="border">
                      <div className="p-1">
                        {/* {requestSheetDataOfBM?.approvalOfPRD_HOD?.length > 0 ? (
                          requestSheetDataOfBM?.approvalOfPRD_HOD?.[
                            requestSheetDataOfBM?.approvalOfPRD_HOD?.length - 1
                          ].tm_name
                        ) : ( */}
                        {requestSheetDataOfBM?.approvalOfPRD_HOD &&
                        requestSheetDataOfBM?.approvalStatusOfPRD_HOD ===
                          "Accepted" &&
                        requestSheetDataOfBM?.requestSheetStatus !==
                          "Rejected" ? (
                          requestSheetDataOfBM?.approvalOfPRD_HOD?.tm_name
                        ) : (
                          <DropdownElem
                            name={"PRD_HOD"}
                            selectedMinor={selectedMinor}
                            selectedMajor={selectedMajor}
                            maintenanceType={
                              requestSheetDataOfBM?.maintenanceType
                            }
                            approvalList={
                              selectedMachineDetails?.line_names?.cell_names
                                ?.subSection_names?.section_names?.plant_names
                                ?.approvalListOfMinorAndMajor
                            }
                            displayOrNot={
                              requestSheetDataOfBM?.approvalOfMTD_TL?._id ===
                              loggedUserDetails?._id
                            }
                            options={approvalListOfBM?.prdHOD}
                            register={register}
                            errors={errors}
                            // required={
                            //   selectedMinor === "Yes" &&
                            //   selectedMachineDetails?.line_names?.cell_names?.subSection_names?.section_names?.plant_names?.approvalListOfMinorAndMajor?.minorApprovalList?.includes(
                            //     "PRD_HOD".replace("_", " ")
                            //   )
                            //     ? true
                            //     : selectedMajor === "Yes" &&
                            //       selectedMachineDetails?.line_names?.cell_names?.subSection_names?.section_names?.plant_names?.approvalListOfMinorAndMajor?.majorApprovalList?.includes(
                            //         "PRD_HOD".replace("_", " ")
                            //       )
                            //     ? true
                            //     : false
                            // }
                          />
                        )}
                      </div>
                    </Col>
                    <Col sm={3} className="border">
                      <div className="p-1">
                        {/* {requestSheetDataOfBM?.approvalOfPRD_HOS?.length > 0 ? (
                          requestSheetDataOfBM?.approvalOfPRD_HOS?.[
                            requestSheetDataOfBM?.approvalOfPRD_HOS?.length - 1
                          ]?.tm_name
                        ) : ( */}
                        {requestSheetDataOfBM?.approvalOfPRD_HOS &&
                        requestSheetDataOfBM?.approvalStatusOfPRD_HOS ===
                          "Accepted" &&
                        requestSheetDataOfBM?.requestSheetStatus !==
                          "Rejected" ? (
                          requestSheetDataOfBM?.approvalOfPRD_HOS?.tm_name
                        ) : (
                          <DropdownElem
                            name={"PRD_HOS"}
                            selectedMinor={selectedMinor}
                            selectedMajor={selectedMajor}
                            approvalList={
                              selectedMachineDetails?.line_names?.cell_names
                                ?.subSection_names?.section_names?.plant_names
                                ?.approvalListOfMinorAndMajor
                            }
                            displayOrNot={
                              requestSheetDataOfBM?.approvalOfMTD_TL?._id ===
                              loggedUserDetails?._id
                            }
                            options={approvalListOfBM?.prdHOS}
                            register={register}
                            errors={errors}
                            // required={
                            //   selectedMinor === "Yes" &&
                            //   selectedMachineDetails?.line_names?.cell_names?.subSection_names?.section_names?.plant_names?.approvalListOfMinorAndMajor?.minorApprovalList?.includes(
                            //     "PRD_HOS".replace("_", " ")
                            //   )
                            //     ? true
                            //     : selectedMajor === "Yes" &&
                            //       selectedMachineDetails?.line_names?.cell_names?.subSection_names?.section_names?.plant_names?.approvalListOfMinorAndMajor?.majorApprovalList?.includes(
                            //         "PRD_HOS".replace("_", " ")
                            //       )
                            //     ? true
                            //     : false
                            // }
                          />
                        )}
                      </div>
                    </Col>
                    <Col sm={3} className="border">
                      <div className="p-1">
                        {/* {requestSheetDataOfBM?.approvalOfPRD_TL?.length > 0 ? (
                          requestSheetDataOfBM?.approvalOfPRD_TL?.[
                            requestSheetDataOfBM?.approvalOfPRD_TL?.length - 1
                          ]?.tm_name
                        ) : ( */}
                        {requestSheetDataOfBM?.approvalOfPRD_TL &&
                        requestSheetDataOfBM?.approvalStatusOfPRD_TL ===
                          "Accepted" &&
                        requestSheetDataOfBM?.requestSheetStatus !==
                          "Rejected" ? (
                          requestSheetDataOfBM?.approvalOfPRD_TL?.tm_name
                        ) : (
                          <DropdownElem
                            name={"PRD_TL"}
                            selectedMinor={selectedMinor}
                            selectedMajor={selectedMajor}
                            maintenanceType={
                              requestSheetDataOfBM?.maintenanceType
                            }
                            approvalList={
                              selectedMachineDetails?.line_names?.cell_names
                                ?.subSection_names?.section_names?.plant_names
                                ?.approvalListOfMinorAndMajor
                            }
                            displayOrNot={
                              requestSheetDataOfBM?.approvalOfMTD_TL?._id ===
                              loggedUserDetails?._id
                            }
                            options={approvalListOfBM?.prdTL}
                            register={register}
                            errors={errors}
                            // required={
                            //   selectedMinor === "Yes" &&
                            //   selectedMachineDetails?.line_names?.cell_names?.subSection_names?.section_names?.plant_names?.approvalListOfMinorAndMajor?.minorApprovalList?.includes(
                            //     "PRD_TL".replace("_", " ")
                            //   )
                            //     ? true
                            //     : selectedMajor === "Yes" &&
                            //       selectedMachineDetails?.line_names?.cell_names?.subSection_names?.section_names?.plant_names?.approvalListOfMinorAndMajor?.majorApprovalList?.includes(
                            //         "PRD_TL".replace("_", " ")
                            //       )
                            //     ? true
                            //     : false
                            // }
                          />
                        )}
                      </div>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </td>
          </tr>

          <tr>
            <td>
              {/* for Assign user send for approval */}
              {(requestSheetDataOfBM?.assignUser?._id ===
                loggedUserDetails?._id ||
                requestSheetDataOfBM?.handOverUser?._id ===
                  loggedUserDetails?._id) &&
              (requestSheetDataOfBM?.requestSheetStatus === "Fill Sheet" ||
                requestSheetDataOfBM?.requestSheetStatus ===
                  "Work Order Pending" ||
                requestSheetDataOfBM?.requestSheetStatus ===
                  "Work Order Closed" ||
                requestSheetDataOfBM?.approvalStatusOfMTD_TL === "Rejected") ? (
                <Row className="m-0 d-flex justify-content-between">
                  <Col lg={6} md={6} sm={12}>
                    <button
                      type="submit"
                      className="btn bg-success"
                      style={{ marginTop: "1rem" }}
                      onClick={handleSubmit(newRequestSheetRegistration)}
                    >
                      Save Changes
                    </button>
                    &nbsp;&nbsp;&nbsp;&nbsp;
                    <button
                      type="submit"
                      className="btn bg-warning"
                      style={{ marginTop: "1rem" }}
                      onClick={handleSubmit(sendApprovalForRequestSheetOfBM)}
                    >
                      Send For Approval
                    </button>
                  </Col>
                </Row>
              ) : (
                ""
              )}

              {/* for MTD TL send for approval or rejection */}
              {requestSheetDataOfBM?.approvalOfMTD_TL?._id ===
                loggedUserDetails?._id ||
              ((requestSheetDataOfBM?.approvalStatusOfMTD_HOSS === "Rejected" ||
                requestSheetDataOfBM?.approvalStatusOfMTD_HOS === "Rejected" ||
                requestSheetDataOfBM?.approvalStatusOfPRD_TL === "Rejected" ||
                requestSheetDataOfBM?.approvalStatusOfPRD_HOS === "Rejected" ||
                requestSheetDataOfBM?.approvalStatusOfPRD_HOD === "Rejected" ||
                requestSheetDataOfBM?.approvalStatusOfMTD_HOD === "Rejected") &&
                (requestSheetDataOfBM?.assignUser?._id !==
                  loggedUserDetails?._id ||
                  requestSheetDataOfBM?.handOverUser?._id !==
                    loggedUserDetails?._id)) ? (
                <>
                  <Row className="m-1 d-flex justify-content-start">
                    <Col className="col-lg-6 col-md-6 m-1 p-0">
                      <button
                        type="submit"
                        className="btn bg-succ"
                        style={{ marginTop: "1rem" }}
                        // onClick={handleSubmit(newRequestSheetRegistration)}
                      >
                        Save Changes
                      </button>
                    </Col>
                    <Col className="col-lg-5 col-md-4 m-1 p-2 bg-lightyellow rounded">
                      <Form>
                        <p>
                          Do you want to send for approval the request sheet?
                        </p>
                        <div className="d-flex">
                          <Form.Check
                            flex
                            label="Yes"
                            name="approvalOfRequestSheet"
                            type="radio"
                            value="Yes"
                            id="approvalOfRequestSheet"
                            onChange={(e) => {
                              setValue(
                                "approvalOfRequestSheet",
                                e.target.value
                              );
                              clearErrors("approvalOfRequestSheet");
                            }}
                          />{" "}
                          &nbsp;&nbsp;
                          <Form.Check
                            flex
                            label="No"
                            name="approvalOfRequestSheet"
                            type="radio"
                            value="No"
                            id="approvalOfRequestSheet"
                            onChange={(e) => {
                              setValue(
                                "approvalOfRequestSheet",
                                e.target.value
                              );
                              clearErrors("approvalOfRequestSheet");
                            }}
                          />
                        </div>
                        {errors?.["approvalOfRequestSheet"] && (
                          <p className="text-error">
                            {errors?.["approvalOfRequestSheet"]?.message}
                          </p>
                        )}
                        {watch("approvalOfRequestSheet") === "No" ? (
                          <>
                            <input
                              type="text"
                              name="rejectedRemarksOfRequestSheet"
                              placeholder="Enter rejected remarks"
                              className="p-1 m-1"
                              onChange={(e) => {
                                setValue(
                                  "rejectedRemarksOfRequestSheet",
                                  e.target.value
                                );
                                clearErrors("rejectedRemarksOfRequestSheet");
                              }}
                            />
                            {errors?.["rejectedRemarksOfRequestSheet"] && (
                              <p className="text-error">
                                {
                                  errors?.["rejectedRemarksOfRequestSheet"]
                                    ?.message
                                }
                              </p>
                            )}
                          </>
                        ) : (
                          ""
                        )}
                        &nbsp;
                        {/* <button
                    type="submit"
                    className="btn bg-dang"
                    onClick={handleSubmit(sendApprovalForRequestSheetOfBM)}
                  >
                    {watch("approvalOfRequestSheet") === "No"
                      ? "Reject"
                      : "Send for approval"}
                  </button> */}
                        <button
                          type="submit"
                          className={
                            watch("approvalOfRequestSheet") === "No"
                              ? "btn bg-dang"
                              : "btn bg-warning mt-3"
                          }
                          onClick={handleSubmit(
                            sendApprovalForRequestSheetOfBM
                          )}
                        >
                          {watch("approvalOfRequestSheet") === "No"
                            ? "Reject"
                            : "Send for approval"}
                        </button>
                      </Form>
                    </Col>
                  </Row>
                </>
              ) : (
                ""
              )}

              {/* for higher authority approval */}
              {requestSheetDataOfBM?.requestSheetStatus !== "Fill Sheet" &&
              requestSheetDataOfBM?.requestSheetStatus !==
                "Work Order Pending" &&
              requestSheetDataOfBM?.requestSheetStatus !==
                "Work Order Closed" &&
              requestSheetDataOfBM?.approvalOfMTD_TL?._id !==
                loggedUserDetails?._id &&
              requestSheetDataOfBM?.assignUser?._id !==
                loggedUserDetails?._id &&
              requestSheetDataOfBM?.handOverUser?._id !==
                loggedUserDetails?._id ? (
                // &&requestSheetDataOfBM?.assignUser?._id !==
                //   requestSheetDataOfBM?.approvalOfMTD_TL?._id
                <>
                  <Row className="m-1 d-flex justify-content-start">
                    {loggedUserDetails?.tm_department === "MTD" && (
                      <Col className="col-lg-6 col-md-6 m-1 p-0">
                        <button
                          type="submit"
                          className="btn bg-succ"
                          style={{ marginTop: "1rem" }}
                          onClick={handleSubmit(newRequestSheetRegistration)}
                        >
                          Save Changes
                        </button>
                      </Col>
                    )}

                    <Col className="col-lg-5 col-md-4 m-1 p-2 bg-lightyellow rounded">
                      Kindly approve request-sheet.{" "}
                      <div className="d-flex">
                        <Form.Check
                          flex
                          label="Yes"
                          name="approvalOfRequestSheet"
                          type="radio"
                          value="Yes"
                          id="approvalOfRequestSheet"
                          {...register("approvalOfRequestSheet", {
                            // required: "This field is required",
                          })}
                          // onChange={handleQuality}
                        />{" "}
                        &nbsp;
                        <Form.Check
                          flex
                          label="No"
                          name="approvalOfRequestSheet"
                          type="radio"
                          value="No"
                          id="approvalOfRequestSheet"
                          {...register("approvalOfRequestSheet", {
                            // required: "This field is required",
                          })}
                          // onChange={handleQuality}
                        />
                      </div>
                      {errors?.["approvalOfRequestSheet"] && (
                        <p className="text-error">
                          {errors?.["approvalOfRequestSheet"]?.message}
                        </p>
                      )}
                      {watch("approvalOfRequestSheet") === "No" ? (
                        <>
                          <input
                            type="text"
                            name="rejectedRemarksOfRequestSheet"
                            placeholder="Enter rejected remarks"
                            className="p-1 m-1"
                            {...register("rejectedRemarksOfRequestSheet", {
                              // required: "Please fill this field",
                            })}
                          />
                          {errors?.["rejectedRemarksOfRequestSheet"] && (
                            <p className="text-error">
                              {
                                errors?.["rejectedRemarksOfRequestSheet"]
                                  ?.message
                              }
                            </p>
                          )}
                        </>
                      ) : (
                        ""
                      )}
                      &nbsp;
                      <button
                        type="submit"
                        className="btn bg-warning"
                        onClick={handleSubmit(
                          approveRequestSheetFromHigherAuthority
                        )}
                      >
                        Submit
                      </button>
                    </Col>
                  </Row>
                </>
              ) : (
                ""
              )}
            </td>
          </tr>
          <tr>
            <b>FO/MTD/01/04/04</b>
          </tr>
        </tbody>
      </Table>
    </form>
  );
}

export default MyTable;
