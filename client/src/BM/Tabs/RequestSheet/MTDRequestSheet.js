import denso_log from "../../../static/images/denso_logo.png";
import { Row, Col, Form } from "react-bootstrap";
import { DropdownButton, Dropdown } from "react-bootstrap";

import React, { useState, useEffect, useContext } from "react";
import { Table } from "react-bootstrap";
import { AddBoxIcon } from "../../../modules/PageModules";
import ProblemList from "./SubComponents/ProblemList";
import ActionList from "./SubComponents/ActionList";
import PartList from "./SubComponents/PartList";
import { Controller, useForm } from "react-hook-form";
import moment from "moment";
import DropdownElem from "../../Component/DropdownElem";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import RoutingContext from "../../../context/routing/RoutingContext";
import { SuccessToast, WarningToast } from "../../Component/ShowTostify";
import Multiselect from "multiselect-react-dropdown";
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
    },
  });

  var curr = new Date();
  var currentDate = curr.toISOString().substring(0, 10);

  let timeDifferenceMinutes = moment(watch("workEndedDateOfBM"))
    .tz("Asia/Kolkata")
    .diff(
      moment(requestSheetDataOfBM?.problemOccurredDateAndTimeOfBM).tz(
        "Asia/Kolkata"
      ),
      "minutes"
    );

  const newRequestSheetRegistration = async (requestSheetData) => {
    requestSheetData.problemsOfBM = problems;
    requestSheetData.actionAndCounterMeasureStep = actions;
    requestSheetData.breakDownTime = timeDifferenceMinutes;
    requestSheetData.minorBD = timeDifferenceMinutes <= 120 ? "Yes" : "No";
    requestSheetData.majorBD = timeDifferenceMinutes > 120 ? "Yes" : "No";
    requestSheetData.changedParts = parts;
    requestSheetData.supportingTM =
      selectedSupportedTM?.length > 0
        ? selectedSupportedTM?.map((obj) => obj?._id)
        : requestSheetDataOfBM?.supportingTM?.map((obj) => obj?._id);
    requestSheetData.partQualityCheckedByPRD =
      approvalListOfBM?.prdTL?.[requestSheetData?.partQualityCheckedByPRD]?._id;
    requestSheetData.partQualityCheckedByMTD =
      approvalListOfBM?.mtdTL?.[requestSheetData?.partQualityCheckedByMTD]?._id;
    requestSheetData.dataSheetOfRequestSheet =
      timeDifferenceMinutes > 120
        ? "Yes"
        : requestSheetData.dataSheetOfRequestSheet;

    const formData = new FormData();
    const { ...otherFields } = requestSheetData;
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

    formData.append("otherData", JSON.stringify(otherFields));

    try {
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
        if (requestSheetDataOfBM?.assignUser?._id === loggedUserDetails?._id) {
          navigate("/bm/requestListDashboard", { replace: true });
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
    if (Object?.keys(dirtyFields)?.length > 0) {
      WarningToast(
        "Save/submit the change value before sending it for approval!!!"
      );
      return true;
    }
    if (requestSheetDataOfBM?.assignUser?._id !== loggedUserDetails?._id) {
      if (!watch("approvalOfRequestSheet")) {
        setError("root.handleApprovalErrorFromServerSide", {
          type: "approvalOfRequestSheet",
          message: "Please select approval value (Yes/No)",
        });
        return true;
      }

      if (
        watch("approvalOfRequestSheet") === "No" &&
        !watch("rejectedRemarksOfRequestSheet")
      ) {
        setError("root.handleApprovalErrorFromServerSide", {
          message: "Please fill rejected remarks",
          type: "rejectedRemarksOfRequestSheet",
        });
        return true;
      }
    }
  };

  const sendApprovalForRequestSheetOfBM = async (assignApprovalList) => {
    try {
      let checkWhetherAnyErrorOccurredOrNot = handleCustomErrors();
      if (checkWhetherAnyErrorOccurredOrNot) {
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
                },
                MTD_HOSS: {
                  id: approvalListOfBM?.mtdTL?.[assignApprovalList?.MTD_HOSS]
                    ?._id,
                  name: approvalListOfBM?.mtdTL?.[assignApprovalList?.MTD_HOSS]
                    ?.tm_name,
                },
                PRD_TL: {
                  id: approvalListOfBM?.prdTL?.[assignApprovalList?.PRD_TL]
                    ?._id,
                  name: approvalListOfBM?.prdTL?.[assignApprovalList?.PRD_TL]
                    ?.tm_name,
                },
                PRD_HOS: {
                  id: approvalListOfBM?.prdHOS?.[assignApprovalList?.PRD_HOS]
                    ?._id,
                  name: approvalListOfBM?.prdHOS?.[assignApprovalList?.PRD_HOS]
                    ?.tm_name,
                },
                MTD_HOS: {
                  id: approvalListOfBM?.mtdHOS?.[assignApprovalList?.MTD_HOS]
                    ?._id,
                  name: approvalListOfBM?.mtdHOS?.[assignApprovalList?.MTD_HOS]
                    ?.tm_name,
                },
                PRD_HOD: {
                  id: approvalListOfBM?.prdHOD?.[assignApprovalList?.PRD_HOD]
                    ?._id,
                  name: approvalListOfBM?.prdHOD?.[assignApprovalList?.PRD_HOD]
                    ?.tm_name,
                },
                MTD_HOD: {
                  id: approvalListOfBM?.mtdHOD?.[assignApprovalList?.MTD_HOD]
                    ?._id,
                  name: approvalListOfBM?.mtdHOD?.[assignApprovalList?.MTD_HOD]
                    ?.tm_name,
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
          if (
            requestSheetDataOfBM?.assignUser?._id === loggedUserDetails?._id
          ) {
            navigate("/bm/requestListDashboard", { replace: true });
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

  const approveRequestSheetFromHigherAuthority = async () => {
    let checkWhetherAnyErrorOccurredOrNot = handleCustomErrors();
    if (checkWhetherAnyErrorOccurredOrNot) {
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
        "maintenanceTime",
        requestSheetDataOfBM?.maintenanceReportFilledByMTD?.maintenanceTime
      );
      setValue(
        "qualityCheckTime",
        requestSheetDataOfBM?.maintenanceReportFilledByMTD?.qualityCheckTime
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
        "firstTime",
        requestSheetDataOfBM?.maintenanceReportFilledByMTD?.firstTime
      );
      setValue(
        "repeat",
        requestSheetDataOfBM?.maintenanceReportFilledByMTD?.repeat
      );
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
      <Table bordered className="mb-5">
        <thead>
          <tr>{/* <th colSpan="4">Header with 4 Columns</th> */}</tr>
        </thead>
        <tbody>
          <tr className="row m-2 mb-0" style={{ width: "100vw" }}>
            <td class="col-lg-8 col-md-6 col-sm-12">
              <h4 className="mt-0 d-flex align-items-center justify-content-center">
                MAINTENANCE REPORT ( To be filled by MTD)
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
                      approvalList={
                        selectedMachineDetails?.line_names?.cell_names
                          ?.subSection_names?.section_names?.plant_names
                          ?.approvalListOfMinorAndMajor
                      }
                      register={register}
                      errors={errors}
                      displayOrNot={
                        requestSheetDataOfBM?.assignUser?._id ===
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

          <tr className="row m-2 mt-0">
            <td lg={12} md={12} sm={12}>
              <div className="mb-2" style={{ width: "100vw" }}>
                <Row className="m-0">
                  <Col className="border border-left-0" lg={12} md={12} sm={12}>
                    <Row className="d-flex align-items-center ">
                      <Col
                        lg={1}
                        md={2}
                        sm={6}
                        className="d-flex align-items-center border border-right-0 border-top-0 border-bottom"
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
                        className="border border-right-0 border-top-0 border-bottom"
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
                                // defaultValue={currentDate}
                                {...register("workStartedDateOfBM", {
                                  required: "Work start date is required",
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
                        className="border border-right-0 border-top-0 border-bottom d-flex align-items-center"
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
                        className="border border-right-0 border-top-0 border-bottom-0"
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
                                defaultValue={currentDate}
                                {...register("workEndedDateOfBM", {
                                  required: "Work Ended date is required",
                                })}
                                disabled={
                                  requestSheetDataOfBM?.assignUser?._id !==
                                    loggedUserDetails?._id &&
                                  requestSheetDataOfBM?.approvalOfMTD_TL
                                    ?._id !== loggedUserDetails?._id
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
                      <Col lg={3} md={6} sm={12} style={{ height: "100px" }}>
                        <Row className="border border-top-0 border-left-0 border-right-0">
                          <small className="mb-0 mt-1">
                            <b>SECTION IN-CHARGE</b>
                          </small>
                          <br />
                        </Row>
                        <Row className="border border-top-0 border-left-0 border-right-0">
                          <Col
                            lg={6}
                            md={6}
                            className="d-block border border-bottom-0 border-top-0 border-left-0 border-bottom-0"
                          >
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
                                {
                                  requestSheetDataOfBM?.approvalOfMTD_HOSS
                                    ?.tm_name
                                }
                              </p>
                            ) : (
                              <DropdownElem
                                name={"MTD_HOSS"}
                                selectedMinor={selectedMinor}
                                selectedMajor={selectedMajor}
                                approvalList={
                                  selectedMachineDetails?.line_names?.cell_names
                                    ?.subSection_names?.section_names
                                    ?.plant_names?.approvalListOfMinorAndMajor
                                }
                                displayOrNot={
                                  requestSheetDataOfBM?.approvalOfMTD_TL
                                    ?._id === loggedUserDetails?._id
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
                          <Col
                            lg={6}
                            md={6}
                            className="d-block border-0 border-bottom-0"
                          >
                            {selectedMajor === "Yes" &&
                              selectedMachineDetails?.line_names?.cell_names?.subSection_names?.section_names?.plant_names?.approvalListOfMinorAndMajor?.majorApprovalList?.includes(
                                "MTD_HOS"?.replace("_", " ")
                              ) && <small>MTD HOS</small>}
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
                                approvalList={
                                  selectedMachineDetails?.line_names?.cell_names
                                    ?.subSection_names?.section_names
                                    ?.plant_names?.approvalListOfMinorAndMajor
                                }
                                displayOrNot={
                                  requestSheetDataOfBM?.approvalOfMTD_TL
                                    ?._id === loggedUserDetails?._id
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
                        lg={2}
                        md={6}
                        sm={12}
                        className="border border-bottom-0 pb-2 "
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
                        ) : (
                          ""
                        )}
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </div>
            </td>

            {/* <td className="mb-0 pb-0 pt-0 col-lg-4">
              <div className="mb-2" style={{ width: "100vw" }}>
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
                            class="mb-2"
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

          <tr class="row m-2">
            <td class="col-lg-4 col-md-6 col-sm-12 border-bottom">
              <ProblemList problems={problems} setProblems={setProblems} />

              <Row className="m-0">
                <Col
                  lg={3}
                  md={6}
                  sm={6}
                  className="border text-center pb-2 pt-2"
                >
                  <small className="mb-0" style={{ fontSize: "12px" }}>
                    <b>BREAKDOWN TIME</b>
                  </small>
                  <p>{timeDifferenceMinutes || null}</p>
                </Col>
                <Col
                  lg={3}
                  md={6}
                  sm={6}
                  className="border text-center pb-2 pt-2"
                >
                  <small className="mb-0" style={{ fontSize: "12px" }}>
                    <b>MAINTENANCE TIME</b>
                  </small>
                  <input
                    type="number"
                    style={{ width: "100%" }}
                    id="mainTime"
                    name="mainTime"
                    {...register("maintenanceTime", {
                      required: "This field is required",
                    })}
                    // onChange={handleMaintenanceTime}
                  />
                  {errors?.["maintenanceTime"] && (
                    <p className="text-error">
                      {errors?.["maintenanceTime"]?.message}
                    </p>
                  )}
                </Col>
                <Col
                  lg={3}
                  md={6}
                  sm={6}
                  className="border text-center pb-2 pt-2"
                >
                  <p className="mb-0" style={{ fontSize: "12px" }}>
                    <b>QUALITY CHECK TIME</b>
                  </p>
                  <input
                    type="number"
                    className="mb-2"
                    style={{ width: "100%" }}
                    id="qualityTime"
                    name="qualityTime"
                    {...register("qualityCheckTime", {
                      required: "This field is required",
                    })}
                    // onChange={handleQualityCheckTime}
                  />
                  {errors?.["qualityCheckTime"] && (
                    <p className="text-error">
                      {errors?.["qualityCheckTime"]?.message}
                    </p>
                  )}
                </Col>
                <Col
                  lg={3}
                  md={6}
                  sm={6}
                  className="border text-center pb-2 pt-2"
                >
                  <small className="mb-0" style={{ fontSize: "12px" }}>
                    <b>BREAK TIME</b>
                  </small>
                  <input
                    type="number"
                    className="mb-2"
                    style={{ width: "100%" }}
                    id="breaktime"
                    name="breaktime"
                    {...register("breakTime", {
                      required: "This field is required",
                    })}
                    // onChange={handleBreakTime}
                  />
                  {errors?.["breakTime"] && (
                    <p className="text-error">
                      {errors?.["breakTime"]?.message}
                    </p>
                  )}
                </Col>
              </Row>
              {parseInt(watch("maintenanceTime")) +
                parseInt(watch("qualityCheckTime")) +
                parseInt(watch("breakTime")) !==
                timeDifferenceMinutes && (
                <p
                  class="mt-1 m-2 p-2 border"
                  style={{ color: "red", marginLeft: "8px" }}
                >
                  Total time exceeds!!!
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
                      <p className="mb-0" style={{ fontSize: "12px" }}>
                        <b>FIRST TIME </b>
                      </p>
                      &nbsp;&nbsp;&nbsp;
                      <Form className="d-flex align-items-center justify-content-center">
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
                          &nbsp;&nbsp;
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
                    <Col
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
                    </Col>
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
            <td class="col-lg-3 col-md-6 col-sm-12 border-bottom">
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

            <td class="col-lg-4 col-md-12 col-sm-12  border-bottom">
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
                          required: "This field is required",
                        })}
                        // onChange={handleQuality}
                      />
                      <Form.Check
                        flex
                        label="No"
                        name="qualityConfirmed"
                        type="radio"
                        value="No"
                        id="qualityConfirmed"
                        {...register("qualityConfirmed", {
                          required: "This field is required",
                        })}
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
                  {requestSheetDataOfBM?.partQualityCheckedByPRD ? (
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
                        // onChange={handledataSheetOfRequestSheet}
                        {...register("dataSheetOfRequestSheet", {
                          required: "This field is required",
                        })}
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
                        // onChange={handledataSheetOfRequestSheet}
                        {...register("dataSheetOfRequestSheet", {
                          required: "This field is required",
                        })}
                      />
                    </div>
                    {errors?.["dataSheetOfRequestSheet"] && (
                      <p className="text-error">
                        {errors?.["dataSheetOfRequestSheet"]?.message}
                      </p>
                    )}
                    {requestSheetDataOfBM?.attachedDataSheets ? (
                      <p>{requestSheetDataOfBM?.attachedDataSheets}</p>
                    ) : timeDifferenceMinutes > 120 ||
                      watch("dataSheetOfRequestSheet") === "Yes" ? (
                      <Form.Group controlId="formFileMultiple" className="mb-3">
                        <Form.Control
                          type="file"
                          {...register("attachedDataSheets", {
                            required:
                              timeDifferenceMinutes > 120 ||
                              watch("dataSheetOfRequestSheet") === "Yes"
                                ? true
                                : false,
                          })}
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
                    <b>DRAWING ATTACHED</b>&nbsp;&nbsp;&nbsp;
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
                      <p>
                        {(requestSheetDataOfBM?.attachedDrawings).join("\r\n")}
                      </p>
                    ) : watch("drawingOfRequestSheet") === "Yes" ? (
                      <Form.Group controlId="formFileMultiple" className="mb-3">
                        <Form.Control
                          type="file"
                          multiple
                          {...register("attachedDrawings", {
                            required:
                              watch("dataSheetOfRequestSheet") === "Yes"
                                ? true
                                : false,
                          })}
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

          <tr class="row m-2">
            <td class="col-lg-6 col-md-12 col-sm-12">
              <ActionList actions={actions} setActions={setActions} />
            </td>
            <td class="col-lg-6 col-md-12 col-sm-12">
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
                  />
                  {/* {errors?.["preventive_corrective_maintenance"] && (
                  <p className="text-error">
                    {errors?.["preventive_corrective_maintenance"]?.message}
                  </p>
                )} */}
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
                  />
                  {/* {errors?.["yokotenkai"] && (
                  <p className="text-error">
                    {errors?.["yokotenkai"]?.message}
                  </p>
                )} */}
                </Col>
              </Row>
            </td>
          </tr>

          <tr className="row">
            <td className="col-lg-6 col-md-6">
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
                          required: "This field is required",
                        })}
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
                          required: "This field is required",
                        })}
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
            <td className="col-lg-6 col-md-6">
              {requestSheetDataOfBM?.plantRef?.categories?.map(
                (categoryObj, idxOfCategory) => (
                  <>
                    <Row className="m-0">
                      <Col lg={4} className="border p-2">
                        <p className="mb-0 d-flex align-items-center justify-content-start">
                          <b>{categoryObj?.name}</b>&nbsp;&nbsp;&nbsp;
                        </p>
                      </Col>

                      <Col
                        lg={6}
                        md={12}
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
                                  className="col-lg-4 col-md-4"
                                  // onChange={handleactionTemporaryOrNot}
                                  {...register(
                                    `categories.${categoryObj?.name}`,
                                    {
                                      required: "This field is required",
                                    }
                                  )}
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
                <Col className="col-lg-auto">
                  <Row className="ms-0 border">
                    <b
                      style={{
                        writingMode: "vertical-rl",
                        transform: "rotate(180deg)",
                        whiteSpace: "normal",
                        fontSize: "12px",
                      }}
                    >
                      CHANGED PARTS
                    </b>
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
                    <Col lg={8} md={8} className="text-center border p-1">
                      <b>CHECKED BY</b>
                    </Col>
                  </Row>
                  <Row>
                    <Col lg={2} md={2} className="border p-1 text-center">
                      <small>
                        <b>* GM-MTD</b>
                      </small>
                    </Col>
                    <Col lg={2} md={2} className="border p-1 text-center">
                      <small>
                        <b>* GM-PRD</b>
                      </small>
                    </Col>
                    <Col lg={2} md={2} className="border p-1 text-center">
                      <small>
                        <b>SECTION INCHARGE (PRD)</b>
                      </small>
                    </Col>
                    <Col lg={2} md={2} className="border p-1 text-center">
                      <small>
                        <b>TEAM LEADER (PRD)</b>
                      </small>
                    </Col>
                  </Row>
                  <Row>
                    <Col lg={2} md={2} className="border">
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
                    <Col lg={2} md={2} className="border">
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
                    <Col lg={2} md={2} className="border">
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
                    <Col lg={2} md={2} className="border">
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
        </tbody>

        {/* for Assign user send for approval */}
        {requestSheetDataOfBM?.assignUser?._id === loggedUserDetails?._id &&
        (requestSheetDataOfBM?.requestSheetStatus === "Fill Sheet" ||
          requestSheetDataOfBM?.requestSheetStatus === "Work Order Pending" ||
          requestSheetDataOfBM?.requestSheetStatus === "Work Order Closed" ||
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
          requestSheetDataOfBM?.assignUser?._id !== loggedUserDetails?._id) ? (
          <>
            <Row
              className="m-1 d-flex justify-content-start"
              style={{ width: "100vw" }}
            >
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
                  <p>Do you want to send for approval the request sheet?</p>
                  <div className="d-flex">
                    <Form.Check
                      flex
                      label="Yes"
                      name="approvalOfRequestSheet"
                      type="radio"
                      value="Yes"
                      id="approvalOfRequestSheet"
                      onChange={(e) => {
                        setValue("approvalOfRequestSheet", e.target.value);
                        clearErrors("root.handleApprovalErrorFromServerSide");
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
                        setValue("approvalOfRequestSheet", e.target.value);
                        clearErrors("root.handleApprovalErrorFromServerSide");
                      }}
                    />
                  </div>
                  {errors?.root?.handleApprovalErrorFromServerSide?.type ===
                    "approvalOfRequestSheet" && (
                    <p className="text-error">
                      {errors?.root?.handleApprovalErrorFromServerSide?.message}
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
                          clearErrors("root.handleApprovalErrorFromServerSide");
                        }}
                      />
                      {errors?.root?.handleApprovalErrorFromServerSide?.type ===
                        "rejectedRemarksOfRequestSheet" && (
                        <p className="text-error">
                          {
                            errors?.root?.handleApprovalErrorFromServerSide
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
                        : "btn bg-darkyellow mt-3"
                    }
                    onClick={handleSubmit(sendApprovalForRequestSheetOfBM)}
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
        requestSheetDataOfBM?.requestSheetStatus !== "Work Order Pending" &&
        requestSheetDataOfBM?.requestSheetStatus !== "Work Order Closed" &&
        requestSheetDataOfBM?.approvalOfMTD_TL?._id !==
          loggedUserDetails?._id &&
        requestSheetDataOfBM?.assignUser?._id !== loggedUserDetails?._id ? (
          // &&requestSheetDataOfBM?.assignUser?._id !==
          //   requestSheetDataOfBM?.approvalOfMTD_TL?._id
          <>
            <Row>
              {loggedUserDetails?.tm_department === "MTD" && (
                <Col>
                  <button
                    type="submit"
                    className="btn bg-button"
                    style={{ marginTop: "1rem" }}
                    onClick={handleSubmit(newRequestSheetRegistration)}
                  >
                    Save Changes
                  </button>
                </Col>
              )}
            </Row>
            <Row>
              <Col>
                Kindly approve request-sheet.{" "}
                <Form>
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
                    />
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
                  {errors?.root?.handleApprovalErrorFromServerSide?.type ===
                    "approvalOfRequestSheet" && (
                    <p className="text-error">
                      {errors?.root?.handleApprovalErrorFromServerSide?.message}
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
                          required: "Please fill this field",
                        })}
                      />
                      {errors?.root?.handleApprovalErrorFromServerSide?.type ===
                        "rejectedRemarksOfRequestSheet" && (
                        <p className="text-error">
                          {
                            errors?.root?.handleApprovalErrorFromServerSide
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
                    className="btn bg-button"
                    onClick={handleSubmit(
                      approveRequestSheetFromHigherAuthority
                    )}
                  >
                    Submit
                  </button>
                </Form>
              </Col>
            </Row>
          </>
        ) : (
          ""
        )}
      </Table>
      <br />
      <br />
      <br />
      <br />
    </form>
  );
}

export default MyTable;
