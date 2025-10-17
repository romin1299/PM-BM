import { Row, Col } from "react-bootstrap";

import React, { useState, useEffect, useContext } from "react";
import { Table } from "react-bootstrap";
import { useForm } from "react-hook-form";
import moment from "moment";
import DropdownElem from "../../Component/DropdownElem";
import DownloadIcon from "@mui/icons-material/Download";
import RoutingContext from "../../../context/routing/RoutingContext";
import { Button, Typography } from "@mui/material";
import { BASE_URL } from "../../../ConditionsForDNINandDNHA/ConditionBasedDisplay";
import BMReflectionYokotenkai from "../SubComponents/BMReflectionYokotenkai";
import axios from "axios";
function MTDRequestSheetForView({
  selectedMachineDetails,
  approvalListOfBM,
  requestSheetDataOfBM,
  supportingTMList,
  selectedYear,
  currentCount
}) {
  const loggedUserDetails = useContext(RoutingContext);

  const [actions, setActions] = useState([]);
  const [problems, setProblems] = useState([]);
  const [parts, setParts] = useState([]);
  const [selectedMinor, setSelectedMinor] = useState();
  const [selectedMajor, setSelectedMajor] = useState();
  const [dataOfTheCM, setDataOfTheCM] = useState([]);

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
      ) - requestSheetDataOfBM?.maintenanceReportFilledByMTD?.maintenanceTime;

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
        requestSheetDataOfBM?.maintenanceReportFilledByMTD?.breakDownTime || 0
      );
      setValue(
        "analysisTime",
        requestSheetDataOfBM?.maintenanceReportFilledByMTD?.analysisTime || 0
      );
      setValue(
        "spareWaitingTime",
        requestSheetDataOfBM?.maintenanceReportFilledByMTD?.spareWaitingTime ||
          0
      );
      setValue(
        "maintenanceTime",
        requestSheetDataOfBM?.maintenanceReportFilledByMTD?.maintenanceTime || 0
      );
      setValue(
        "replacementTime",
        requestSheetDataOfBM?.maintenanceReportFilledByMTD?.replacementTime || 0
      );
      setValue(
        "adjustmentTime",
        requestSheetDataOfBM?.maintenanceReportFilledByMTD?.adjustmentTime || 0
      );
      setValue(
        "qualityCheckTime",
        requestSheetDataOfBM?.maintenanceReportFilledByMTD?.qualityCheckTime ||
          0
      );
      setValue(
        "breakTime",
        requestSheetDataOfBM?.maintenanceReportFilledByMTD?.breakTime || 0
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
      setValue("IsYokotenkai", requestSheetDataOfBM?.IsYokotenkai);

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

  const getAllCMSheetData = async () => {
    try {
      setDataOfTheCM([])
      const response = await axios.get(
        `/getAllCmReqSheet/based-on-requestSheetIdOfBM/${requestSheetDataOfBM?._id}/?selectedYear=${selectedYear}`
      );
      setDataOfTheCM(response?.data?.reqSheetCM);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (requestSheetDataOfBM?._id || currentCount) {
      getAllCMSheetData();
    }
  }, [requestSheetDataOfBM?._id, currentCount]);

  return (
    <form className="">
      {/* <fieldset disabled={loggedUserDetails?.tm_department === "PRD" && true}> */}
      <Table className="mb-0">
        <tbody className="m-1 border p-3">
          <tr className="row m-0 mb-0">
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

                  <input
                    disabled
                    type="text"
                    style={{ width: "160px" }}
                    defaultValue={
                      requestSheetDataOfBM?.approvalOfMTD_TL &&
                      requestSheetDataOfBM?.approvalStatusOfMTD_TL !==
                        "Rejected"
                        ? requestSheetDataOfBM?.approvalOfMTD_TL?.tm_name
                        : null
                    }
                  />

                  {/* {requestSheetDataOfBM?.approvalOfMTD_TL &&
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
                          loggedUserDetails?._id ||
                        requestSheetDataOfBM?.handOverUser?._id ===
                          loggedUserDetails?._id
                      }
                      options={approvalListOfBM?.mtdTL}
                    />
                  )} */}
                </Col>
              </Row>
            </td>
          </tr>

          <tr className="row m-0 mt-0">
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
                  className="border  border-bottom"
                  lg={2}
                  md={3}
                  sm={6}
                  style={{ height: "100px" }}
                >
                  <div className="d-flex align-items-center justify-content-center mt-3 mb-2">
                    <div className="text-center">
                      <small className="mb-0 d-block">
                        <b>DATE & TIME: </b>
                        <input
                          disabled
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
                          disabled
                          type="datetime-local"
                          style={{ width: "160px" }}
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
                        <input
                          disabled
                          type="text"
                          style={{ maxWidth: "160px", width: "100%" }}
                        />
                      )}
                    </Col>
                    <Col lg={6} md={6} className="d-block border">
                      {selectedMajor === "Yes" &&
                        selectedMachineDetails?.line_names?.cell_names?.subSection_names?.section_names?.plant_names?.approvalListOfMinorAndMajor?.majorApprovalList?.includes(
                          "MTD_HOS"?.replace("_", " ")
                        ) && (
                          <>
                            <small>MTD HOS</small>
                            {requestSheetDataOfBM?.approvalOfMTD_HOS &&
                            requestSheetDataOfBM?.approvalStatusOfMTD_HOS ===
                              "Accepted" &&
                            requestSheetDataOfBM?.requestSheetStatus !==
                              "Rejected" ? (
                              requestSheetDataOfBM?.approvalOfMTD_HOS?.tm_name
                            ) : (
                              <input
                                disabled
                                type="text"
                                style={{ maxWidth: "160px", width: "100%" }}
                              />
                            )}
                          </>
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
                        disabled
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
                                disabled
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
                                disabled
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
              <div className="mtd-problem-section">
                <small
                  className="border d-flex align-items-center"
                  style={{ height: "26px", paddingLeft: "12px" }}
                >
                  <b>PROBLEM</b>
                </small>

                {problems.map((problem, index) => {
                  return (
                    <small
                      key={problem.id}
                      className="border d-flex align-items-center gap-2"
                      style={{ height: "26px", paddingLeft: "12px" }}
                    >
                      <b>Problem {index + 1}:</b>
                      {problem.problem}
                    </small>
                  );
                })}

                {Array.from({ length: 5 - problems.length }).map((_, index) => (
                  <small
                    key={index}
                    className="border d-flex align-items-center gap-2"
                    style={{ height: "26px", paddingLeft: "12px" }}
                  ></small>
                ))}
              </div>

              <input
                disabled
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
                  {/* <p>{timeDifferenceMinutes || null}</p> */}
                  <Col>
                    <input
                      disabled
                      type="number"
                      style={{ width: "100%" }}
                      id="breakDownTime"
                      name="breakDownTime"
                      {...register("breakDownTime", {
                        // required: "This field is required",
                      })}
                      onChange={(e) => {
                        setValue("breakDownTime", e.target.value, {
                          shouldDirty: true,
                        });
                        clearErrors("breakDownTime");
                        clearErrors("totalTimeValidation");
                      }}
                      // onChange={handlebreakDownTime}
                    />
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
                      disabled
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
                      disabled
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
                      disabled
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
                      disabled
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
                      disabled
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
                      disabled
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
                      disabled
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
                disabled
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
                      sm={6}
                      className="border d-flex align-items-center gap-3"
                    >
                      <p className="mb-0" style={{ fontSize: "12px" }}>
                        <b>MAJOR B/D </b>
                      </p>
                      <div>{timeDifferenceMinutes > 120 ? "Yes" : "No"}</div>
                    </Col>

                    <Col
                      sm={6}
                      className="border d-flex align-items-center gap-3"
                    >
                      {["First Time", "Repeat"].map((text) => (
                        <span
                          style={{
                            textDecoration:
                              requestSheetDataOfBM?.maintenanceReportFilledByMTD
                                ?.firstTimeOrRepeat !== text
                                ? "line-through"
                                : "",
                          }}
                        >
                          {text}
                        </span>
                      ))}
                    </Col>

                    <Col
                      sm={6}
                      className="border d-flex align-items-center gap-3"
                    >
                      <p className="mb-0" style={{ fontSize: "12px" }}>
                        <b>MINOR B/D </b>
                      </p>
                      <div>{timeDifferenceMinutes < 120 ? "Yes" : "No"}</div>
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
                    disabled
                    rows={2}
                    type="text"
                    id="Why1"
                    name="why1"
                    className="widthwhy"
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
                    disabled
                    rows={2}
                    type="text"
                    id="Why2"
                    name="why2"
                    className="widthwhy"
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
                    disabled
                    rows={2}
                    type="text"
                    id="Why3"
                    name="why3"
                    className="widthwhy"
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
                    disabled
                    rows={2}
                    type="text"
                    id="Why4"
                    name="why4"
                    className="widthwhy"
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
                    disabled
                    rows={2}
                    type="text"
                    id="Why5"
                    name="why5"
                    className="widthwhy"
                    {...register("why5", {
                      // required: "This field is required",
                    })}
                  />
                </Col>
                {/* <Col lg={8} md={8}>
                      <textarea
                    disabled
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
                  {requestSheetDataOfBM?.qualityConfirmed}
                </Col>
              </Row>
              <Row className="m-0">
                <Col className="border p-2">
                  <small className="mb-0 d-flex align-items-center justify-content-start">
                    <b>SAFETY CHECK</b>&nbsp;&nbsp;&nbsp;
                  </small>
                </Col>
                <Col className="border p-2 d-flex align-items-center">
                  {requestSheetDataOfBM?.IsSafetyFormCreated ? "Yes" : "No"}
                </Col>
              </Row>

              <Row className="m-0 border border-bottom-0">
                <p className="text-center mb-0">**PART QUALITY CHECKED (IPP)</p>
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
                    <input className="w-100" disabled />
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
                    <input className="w-100" disabled />
                  )}
                </Col>
              </Row>
              <Row className="m-0 border border-bottom-0">
                <p className="text-center mb-0">***MACHINE SAFETY CHECKED</p>
              </Row>
              <Row className="pt-0 mb-0 m-0" style={{ marginLeft: "-8px" }}>
                <Col lg={6} md={6} className="border pb-2 pt-1">
                  <small className="mb-0">
                    <b>PRD</b>
                  </small>
                  {requestSheetDataOfBM?.machineSafetyCheckedByPRD ? (
                    <p className="mb-0">
                      {requestSheetDataOfBM?.machineSafetyCheckedByPRD?.tm_name}
                    </p>
                  ) : (
                    <input className="w-100" disabled />
                  )}
                </Col>

                <Col lg={6} md={6} className="border pb-2 pt-1">
                  <small className="mb-0">
                    <b>MTD</b>
                  </small>
                  {requestSheetDataOfBM?.machineSafetyCheckedByMTD ? (
                    <p className="mb-0">
                      {requestSheetDataOfBM?.machineSafetyCheckedByMTD?.tm_name}
                    </p>
                  ) : (
                    <input className="w-100" disabled />
                  )}
                </Col>
              </Row>
              <Row className="m-0">
                <Col className="border p-2">
                  <small className="mb-0 d-flex align-items-center justify-content-start">
                    <b>DATA SHEET ATTACHED</b>&nbsp;&nbsp;&nbsp;
                  </small>
                </Col>
                <Col className="border p-2">
                  <div>
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
                    ) : (
                      <div>{requestSheetDataOfBM?.dataSheetOfRequestSheet}</div>
                    )}
                  </div>
                </Col>
              </Row>
              <Row className="m-0">
                <Col className="border p-2">
                  <small className="mb-0 d-flex align-items-center justify-content-start">
                    <b>DRAWING ATTACHED</b>&nbsp;&nbsp;&nbsp;
                  </small>
                </Col>
                <Col className="border p-2">
                  <div>
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
                    ) : (
                      <div>{requestSheetDataOfBM?.drawingOfRequestSheet}</div>
                    )}
                  </div>
                </Col>
              </Row>
            </td>
          </tr>

          <tr className="row m-0">
            <td className="col-lg-6 col-md-12 col-sm-12">
              <div className="mtd-actions-section">
                <Row className="m-0">
                  <Col
                    md={10}
                    className="border col-auto d-flex align-items-center gap-1"
                  >
                    <small>
                      <b>ACTION & COUNTERMEASURE STEPS</b>
                    </small>
                  </Col>
                  <Col
                    md={2}
                    className="border col-auto d-flex align-items-center gap-1 p-1"
                  >
                    <small>
                      <b>STATUS</b>
                    </small>
                  </Col>
                </Row>

                {actions.map((action, index) => (
                  <Row key={action.id} className="m-0">
                    <Col
                      md={10}
                      className={`border col-auto d-flex align-items-center gap-1`}
                    >
                      <small>
                        <b>Action {index + 1}: </b>
                      </small>
                      {action.action}
                    </Col>
                    <Col
                      md={2}
                      className="border col-auto d-flex align-items-center gap-1 p-1"
                    >
                      {action.status}
                    </Col>
                  </Row>
                ))}

                {Array.from({ length: 5 - actions.length }).map((_, index) => (
                  <Row key={index} className="m-0">
                    <Col
                      md={10}
                      className={`border col-auto d-flex align-items-center gap-1`}
                      style={{ height: "26px" }}
                    ></Col>
                    <Col
                      md={2}
                      className="border col-auto d-flex align-items-center gap-1 p-1"
                      style={{ height: "26px" }}
                    ></Col>
                  </Row>
                ))}
              </div>
            </td>
            <td className="col-lg-6 col-md-12 col-sm-12">
              {watch("preventive_corrective_maintenance") && (
                <Row className="m-0">
                  <Col className="border col-lg-12 col-md-12 col-sm-12">
                    <small>
                      <b>PREVENTIVE / CORRECTIVE MAINTENANCE</b>
                    </small>
                    <br />
                    <textarea
                      disabled
                      rows={2}
                      type="text"
                      id="preventive_corrective_maintenance"
                      name="preventive_corrective_maintenance"
                      style={{ width: "100%" }}
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
              )}

              {/* <Row className="m-0 p-1 border">
                <AddBoxIcon onClick={() => {}} />
              </Row> */}

              {watch("yokotenkai") && (
                <Row className="m-0">
                  <Col className="border col-lg-12 col-md-12 col-sm-12">
                    <small>
                      {" "}
                      <b>YOKOTENKAI</b>
                    </small>

                    <br />
                    <textarea
                      disabled
                      rows={2}
                      type="text"
                      id="yokotenkai"
                      name="yokotenkai"
                      style={{ width: "100%" }}
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
              )}

              <div className="mtd-parts-section">
                <Row className="m-0 d-flex">
                  <Col
                    sm={2}
                    className="border col-auto d-flex align-items-center gap-1"
                  >
                    <small>
                      <b>LINE</b>
                    </small>
                  </Col>
                  <Col
                    sm={2}
                    className="border col-auto d-flex align-items-center gap-1"
                  >
                    <small>
                      <b>MACHINE</b>
                    </small>
                  </Col>
                  <Col
                    sm={2}
                    className="border col-auto d-flex align-items-center gap-1"
                  >
                    <small>
                      <b>ACTIVITY</b>
                    </small>
                  </Col>
                </Row>
              </div>
              {dataOfTheCM?.map(
                (data, index) =>
                  data?.machineId === requestSheetDataOfBM?.machineRef?._id && (
                    <Row key={index} className="m-0 d-flex">
                      <Col sm={2} className="border">
                        {data?.cmBasicDataFilledByMTD_TL?.line}
                      </Col>
                      <Col sm={2} className="border">
                        {data?.cmBasicDataFilledByMTD_TL?.machineName}
                      </Col>
                      <Col sm={2} className="border">
                        {data?.cmBasicDataFilledByMTD_TL?.activityOfCM}
                      </Col>
                    </Row>
                  )
              )}
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
                  {requestSheetDataOfBM?.actionTemporaryOrNot}
                </Col>
              </Row>
            </td>
            <td className="col-sm-12 col-md-6">
              <Row className="m-0">
                <Col className="border p-2">
                  <small className="mb-0 d-flex align-items-center justify-content-start">
                    <b>Is YOKOTENKAI required?</b>&nbsp;&nbsp;&nbsp;
                  </small>
                </Col>
                <Col className="border p-2 d-flex align-items-center">
                  {requestSheetDataOfBM?.IsYokotenkai}
                </Col>
              </Row>
            </td>
          </tr>
          <tr>
            <td className="col-lg-12 col-md-12 col-sm-12">
              <Row className="m-0">
                <Col className="border col-lg-12 col-md-12 col-sm-12">
                  <small>
                    {" "}
                    <b>Permanent Countermeasure/YOKOTENKAI</b>
                  </small>
                  <BMReflectionYokotenkai
                    dataOfTheCM={dataOfTheCM}
                    setDataOfTheCM={setDataOfTheCM}
                    setActions={setActions}
                    clearErrors={clearErrors}
                    isEditable={false}
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
                    <b>No. Of TM Attended.</b>&nbsp;&nbsp;&nbsp;
                  </small>
                </Col>
                <Col className="border p-2 d-flex align-items-center">
                  <div className="d-flex flex-column text-nowrap">
                    {requestSheetDataOfBM?.supportingTM?.map((tm, index) => (
                      <div key={index}>{tm.tm_name}</div>
                    ))}
                  </div>
                </Col>
              </Row>
            </td>
            <td className="col-sm-12 col-md-6">
              {requestSheetDataOfBM?.categoriesOfRequestSheet?.map(
                (item, index) => (
                  <>
                    <Row className="m-0" key={index}>
                      <Col md={4} className="border p-2">
                        <p className="mb-0 d-flex align-items-center justify-content-start">
                          <b>{item?.category}</b>&nbsp;&nbsp;&nbsp;
                        </p>
                      </Col>
                      <Col
                        md={8}
                        className="border p-2 d-flex align-items-center"
                      >
                        {item?.subCategory}
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
                    <div className="mtd-parts-section">
                      <Row className="m-0 d-flex">
                        <Col sm={2} className="border">
                          <small style={{ fontSize: "12px" }}>
                            <b>PART NO.</b>
                          </small>
                        </Col>
                        <Col sm={3} className="border">
                          <small style={{ fontSize: "12px" }}>
                            <b>PART NAME</b>
                          </small>
                        </Col>
                        <Col sm={3} className="border">
                          <small style={{ fontSize: "12px" }}>
                            <b>MAKER</b>
                          </small>
                        </Col>
                        <Col sm={2} className="border">
                          <small style={{ fontSize: "12px" }}>
                            <b>QUANTITY</b>
                          </small>
                        </Col>
                        <Col sm={2} className="border">
                          <small style={{ fontSize: "12px" }}>
                            <b>Cost</b>
                          </small>
                        </Col>
                      </Row>
                    </div>

                    {parts.map((part) => (
                      <Row key={part._id} className="m-0">
                        {/* Render part information */}
                        <Col sm={2} className="border">
                          {part.partNo}
                        </Col>
                        <Col sm={3} className="border">
                          {part.partName}
                        </Col>
                        <Col sm={3} className="border">
                          {part.makerName}
                        </Col>
                        <Col sm={2} className="border">
                          {part.quantity}
                        </Col>
                        <Col sm={2} className="border">
                          {part.cost}
                        </Col>
                      </Row>
                    ))}

                    {Array.from({ length: 3 - parts.length }).map(
                      (_, index) => (
                        <Row key={index} className="m-0">
                          {/* Render part information */}
                          <Col
                            sm={2}
                            className="border"
                            style={{ height: "26px" }}
                          ></Col>
                          <Col
                            sm={3}
                            className="border"
                            style={{ height: "26px" }}
                          ></Col>
                          <Col
                            sm={3}
                            className="border"
                            style={{ height: "26px" }}
                          ></Col>
                          <Col
                            sm={2}
                            className="border"
                            style={{ height: "26px" }}
                          ></Col>
                          <Col
                            sm={2}
                            className="border"
                            style={{ height: "26px" }}
                          ></Col>
                        </Row>
                      )
                    )}
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
                      style={{ fontSize: "14px" }}
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
                    <Col md={12} className="text-center border p-1">
                      <b>CHECKED BY</b>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={3} className="border p-1 text-center">
                      <small>
                        <b>* GM-MTD</b>
                      </small>
                    </Col>
                    <Col md={3} className="border p-1 text-center">
                      <small>
                        <b>* GM-PRD</b>
                      </small>
                    </Col>
                    <Col md={3} className="border p-1 text-center">
                      <small>
                        <b>SECTION INCHARGE (PRD)</b>
                      </small>
                    </Col>
                    <Col md={3} className="border p-1 text-center">
                      <small>
                        <b>TEAM LEADER (PRD)</b>
                      </small>
                    </Col>
                  </Row>
                  <Row style={{ minHeight: "40px" }}>
                    <Col md={3} className="border">
                      <div className="p-1">
                        {/* {requestSheetDataOfBM?.approvalOfMTD_HOD?.length > 0 ? (
                          requestSheetDataOfBM?.approvalOfMTD_HOD?.[
                            requestSheetDataOfBM?.approvalOfMTD_HOD?.length - 1
                          ]?.tm_name
                        ) : ( */}
                        {requestSheetDataOfBM?.approvalOfMTD_HOD &&
                        requestSheetDataOfBM?.approvalStatusOfMTD_HOD ===
                          "Accepted" &&
                        requestSheetDataOfBM?.requestSheetStatus !== "Rejected"
                          ? requestSheetDataOfBM?.approvalOfMTD_HOD?.tm_name
                          : null}
                      </div>
                    </Col>
                    <Col md={3} className="border">
                      <div className="p-1">
                        {/* {requestSheetDataOfBM?.approvalOfPRD_HOD?.length > 0 ? (
                          requestSheetDataOfBM?.approvalOfPRD_HOD?.[
                            requestSheetDataOfBM?.approvalOfPRD_HOD?.length - 1
                          ].tm_name
                        ) : ( */}
                        {requestSheetDataOfBM?.approvalOfPRD_HOD &&
                        requestSheetDataOfBM?.approvalStatusOfPRD_HOD ===
                          "Accepted" &&
                        requestSheetDataOfBM?.requestSheetStatus !== "Rejected"
                          ? requestSheetDataOfBM?.approvalOfPRD_HOD?.tm_name
                          : null}
                      </div>
                    </Col>
                    <Col md={3} className="border">
                      <div className="p-1">
                        {/* {requestSheetDataOfBM?.approvalOfPRD_HOS?.length > 0 ? (
                          requestSheetDataOfBM?.approvalOfPRD_HOS?.[
                            requestSheetDataOfBM?.approvalOfPRD_HOS?.length - 1
                          ]?.tm_name
                        ) : ( */}
                        {requestSheetDataOfBM?.approvalOfPRD_HOS &&
                        requestSheetDataOfBM?.approvalStatusOfPRD_HOS ===
                          "Accepted" &&
                        requestSheetDataOfBM?.requestSheetStatus !== "Rejected"
                          ? requestSheetDataOfBM?.approvalOfPRD_HOS?.tm_name
                          : null}
                      </div>
                    </Col>
                    <Col md={3} className="border">
                      <div className="p-1">
                        {/* {requestSheetDataOfBM?.approvalOfPRD_TL?.length > 0 ? (
                          requestSheetDataOfBM?.approvalOfPRD_TL?.[
                            requestSheetDataOfBM?.approvalOfPRD_TL?.length - 1
                          ]?.tm_name
                        ) : ( */}
                        {requestSheetDataOfBM?.approvalOfPRD_TL &&
                        requestSheetDataOfBM?.approvalStatusOfPRD_TL ===
                          "Accepted" &&
                        requestSheetDataOfBM?.requestSheetStatus !== "Rejected"
                          ? requestSheetDataOfBM?.approvalOfPRD_TL?.tm_name
                          : null}
                      </div>
                    </Col>
                  </Row>
                </Col>
              </Row>
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

export default MTDRequestSheetForView;
