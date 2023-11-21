// import React from "react";
// import Table from "react-bootstrap/Table";
import denso_log from "../../../static/images/denso_logo.png";
import { Row, Col, Form } from "react-bootstrap";
import { DropdownButton, Dropdown } from "react-bootstrap";

import React, { useState, useEffect, useContext } from "react";
import { Table } from "react-bootstrap";
import { AddBoxIcon } from "../../../modules/PageModules";
import ProblemList from "./SubComponents/ProblemList";
import ActionList from "./SubComponents/ActionList";
import PartList from "./SubComponents/PartList";
import { useForm } from "react-hook-form";
import moment from "moment";
import DropdownElem from "../../Component/DropdownElem";
import { useNavigate, useParams } from "react-router-dom";
import RoutingContext from "../../../context/routing/RoutingContext";
import { SuccessToast, WarningToast } from "../../Component/ShowTostify";
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
}) {
  const loggedUserDetails = useContext(RoutingContext);

  const navigate = useNavigate();

  const { machine_code, requestSheetNoOfBM, generateType } = useParams();

  const [actions, setActions] = useState([]);
  const [problems, setProblems] = useState([]);
  const [parts, setParts] = useState([]);
  const [selectedMinor, setSelectedMinor] = useState();
  const [selectedMajor, setSelectedMajor] = useState();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
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
    console.log(requestSheetData);
    try {
      const res = await fetch(
        `/newRequestSheetRegistration/?reqId=${requestSheetNoOfBM}&&machineRef=${machine_code}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...requestSheetData,
          }),
        }
      );
      const data = await res.json();
      if (res.status === 201) {
        SuccessToast(data?.message);
        navigate("/bm/requestListDashboard", { replace: true });
      } else {
        WarningToast(data?.message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const sendApprovalForRequestSheetOfBM = async (assignApprovalList) => {
    console.log(assignApprovalList);

    try {
      const res = await fetch(
        `/sendApprovalForRequestSheetOfBM/${requestSheetNoOfBM}/${machine_code}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            assignApprovalList: {
              MTD_TL: assignApprovalList?.MTD_TL,
              MTD_HOSS: assignApprovalList?.MTD_HOSS,
              PRD_TL: assignApprovalList?.PRD_TL,
              PRD_HOS: assignApprovalList?.PRD_HOS,
              MTD_HOS: assignApprovalList?.MTD_HOS,
              PRD_HOD: assignApprovalList?.PRD_HOD,
              MTD_HOD: assignApprovalList?.MTD_HOD,
              minorBD: assignApprovalList?.minorBD,
              majorBD: assignApprovalList?.majorBD,
            },
            requestSheetDataOfBM,
          }),
        }
      );
      const data = await res.json();
      if (res.status === 201) {
        SuccessToast(data?.message);
        navigate("/bm/requestListDashboard", { replace: true });
      } else {
        WarningToast(data?.message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (requestSheetDataOfBM?.requestSheetNoOfBM) {
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
    <form>
      <Table bordered className="mb-5">
        <thead>
          <tr>{/* <th colSpan="4">Header with 4 Columns</th> */}</tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={12}>
              <h2 className="mt-0 d-flex align-items-center justify-content-center">
                MAINTENANCE REPORT ( To be filled by MTD)
              </h2>
            </td>
            <td colSpan={4} className="mb-0 pb-0 pt-0">
              <Row className="pt-0 mb-0 " style={{ marginLeft: "-8px" }}>
                <Col lg={6} className="border pb-2 pt-1">
                  <p className="mb-0">
                    <b>REQUEST RECEIVED MTD S.L</b>
                  </p>
                </Col>
                <Col lg={6} className="border pb-2 pt-1">
                  <p className="fs-6 mb-0">
                    <b>MTD TL</b>
                  </p>
                  {requestSheetDataOfBM?.approvalOfMTD_TL ? (
                    requestSheetDataOfBM?.approvalOfMTD_TL.tm_name
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
                      options={approvalListOfBM?.mtdUserTL}
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

          <tr>
            <td colSpan={12}>
              <div className="mb-2">
                <Row className="m-0">
                  <Col className="border border-left-0">
                    <Row className="d-flex align-items-center ">
                      <Col>
                        <p className="text-center m-0">
                          <b>WORK STARTED</b>
                        </p>
                      </Col>
                      <Col className="border border-right-0 border-top-0 border-bottom-0">
                        <div className="d-flex align-items-center justify-content-center mt-1 mb-2">
                          <div className="text-center">
                            <p className="mb-0">
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
                            </p>
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
                    </Row>
                  </Col>
                  <Col className="border">
                    <Row className="d-flex align-items-center ">
                      <Col>
                        <p className="text-center m-0">
                          <b>WORK ENDED</b>
                        </p>
                      </Col>
                      <Col className="border border-right-0 border-top-0 border-bottom-0">
                        <div className="d-flex align-items-center justify-content-center mt-1 mb-2">
                          <div className="text-center">
                            <p className="mb-0">
                              <b>DATE & TIME: </b>
                              <br />
                              <input
                                type="datetime-local"
                                defaultValue={currentDate}
                                {...register("workEndedDateOfBM", {
                                  required: "Work Ended date is required",
                                })}
                              />
                              {errors?.["workEndedDateOfBM"] && (
                                <p className="text-error">
                                  {errors?.["workEndedDateOfBM"]?.message}
                                </p>
                              )}
                            </p>
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
                    </Row>
                  </Col>
                </Row>
              </div>
            </td>
            <td colSpan={6} className="mb-0 pb-0 pt-0">
              <Row className="pt-0 mb-0 " style={{ marginLeft: "-8px" }}>
                <Col lg={6} className="border pb-2 pt-1">
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
                  ) : selectedMajor === "Yes" &&
                    selectedMachineDetails?.line_names?.cell_names?.subSection_names?.section_names?.plant_names?.approvalListOfMinorAndMajor?.majorApprovalList?.includes(
                      "MTD_HOSS".replace("_", " ")
                    ) ? (
                    <label>
                      <b>MTD HOSS</b>
                    </label>
                  ) : (
                    ""
                  )}

                  {requestSheetDataOfBM?.approvalOfMTD_HOSS ? (
                    <p>{requestSheetDataOfBM?.approvalOfMTD_HOSS.tm_name}</p>
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
                      options={approvalListOfBM?.mtdUserTL}
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
                  {selectedMajor === "Yes" && <label>MTD HOS</label>}
                  {requestSheetDataOfBM?.approvalOfMTD_HOS ? (
                    requestSheetDataOfBM?.approvalOfMTD_HOS.tm_name
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
                      options={approvalListOfBM?.mtdUser}
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
                <Col lg={6} className="border pb-2 pt-1">
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
                    <p className="text-error">
                      {errors?.["feedbackMTD_HOS"]?.message}
                    </p>
                  )}
                </Col>
              </Row>
            </td>
          </tr>

          <tr>
            <td colSpan={8}>
              <ProblemList problems={problems} setProblems={setProblems} />

              <Row className="m-0">
                <Col
                  lg={3}
                  className="border border-top-0 text-center pb-0 pt-2"
                >
                  <p className="mb-0" style={{ fontSize: "12px" }}>
                    <b>BREAKDOWN TIME</b>
                  </p>
                  <p>{timeDifferenceMinutes || null}</p>
                </Col>
                <Col
                  lg={3}
                  className="border border-top-0 text-center pb-0 pt-2"
                >
                  <p className="mb-0" style={{ fontSize: "12px" }}>
                    <b>MAINTENANCE TIME</b>
                  </p>
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
                  className="border border-top-0 text-center pb-0 pt-2"
                >
                  <p className="mb-0" style={{ fontSize: "12px" }}>
                    <b>QUALITY CHECK TIME</b>
                  </p>
                  <input
                    type="number"
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
                  className="border border-top-0 text-center pb-0 pt-2"
                >
                  <p className="mb-0" style={{ fontSize: "12px" }}>
                    <b>BREAK TIME</b>
                  </p>
                  <input
                    type="number"
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
                <p style={{ color: "red" }}>Total time exceeds!!!</p>
              )}
              <Row className="m-0">
                <Col className="border">
                  <Row className="d-flex align-items-center justify-content-center">
                    <Col>
                      <p className="mb-0" style={{ fontSize: "12px" }}>
                        <b>MAJOR B/D </b>
                      </p>
                    </Col>
                    <Col>
                      <Form>
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
                  </Row>
                </Col>
                <Col className="border">
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
                </Col>
              </Row>
              <Row className="m-0">
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
              </Row>

              {/* <ActionList actions={actions} setActions={setActions} /> */}
            </td>
            <td colSpan={4}>
              <Row className="m-0">
                <Col className="border">
                  <p className="mb-0">
                    <b>WHY WHY ANALYSIS [ ROOT CAUSE ]</b>
                  </p>
                </Col>
              </Row>

              <Row className="m-0">
                <Col className="border">
                  <Row className="d-flex align-items-center justify-content-center border border-top-0">
                    <Col md={4}>
                      <p className="mb-0" style={{ fontSize: "12px" }}>
                        <b>WHY-1 </b>
                      </p>
                    </Col>
                    <Col md={8}>
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
                      />
                      {/* {errors?.["whyAnalysis"] && (
                        <p className="text-error">{errors?.["whyAnalysis"]?.message}</p>
                      )} */}
                    </Col>
                  </Row>
                  <Row className="d-flex align-items-center justify-content-center border">
                    <Col md={4}>
                      <p className="mb-0" style={{ fontSize: "12px" }}>
                        <b>WHY-2 </b>
                      </p>
                    </Col>
                    <Col md={8}>
                      <textarea
                        rows={1}
                        type="text"
                        id="Why2"
                        name="why2"
                        className="m-1"
                        style={{ width: "100%", maxWidth: "100%" }}
                        {...register("why2")}
                      />
                    </Col>
                  </Row>
                  <Row className="d-flex align-items-center justify-content-center border">
                    <Col md={4}>
                      <p className="mb-0" style={{ fontSize: "12px" }}>
                        <b>WHY-3 </b>
                      </p>
                    </Col>
                    <Col md={8}>
                      <textarea
                        rows={1}
                        type="text"
                        id="Why3"
                        name="why3"
                        className="m-1"
                        style={{ width: "100%", maxWidth: "100%" }}
                        {...register("why3")}
                      />
                    </Col>
                  </Row>
                  <Row className="d-flex align-items-center justify-content-center border">
                    <Col md={4}>
                      <p className="mb-0" style={{ fontSize: "12px" }}>
                        <b>WHY-4 </b>
                      </p>
                    </Col>
                    <Col md={8}>
                      <textarea
                        rows={1}
                        type="text"
                        id="Why4"
                        name="why4"
                        className="m-1"
                        style={{ width: "100%", maxWidth: "100%" }}
                        {...register("why4")}
                      />
                    </Col>
                  </Row>
                  <Row className="d-flex align-items-center justify-content-center border">
                    <Col md={4}>
                      <p className="mb-0" style={{ fontSize: "12px" }}>
                        <b>WHY-5 </b>
                      </p>
                    </Col>
                    <Col md={8}>
                      <textarea
                        rows={1}
                        type="text"
                        id="Why5"
                        name="why5"
                        className="m-1"
                        style={{ width: "100%", maxWidth: "100%" }}
                        {...register("why5")}
                      />
                    </Col>
                  </Row>
                </Col>
              </Row>
            </td>

            <td colSpan={4}>
              <Row className="m-0">
                <Col className="border p-2">
                  <p className="mb-0 d-flex align-items-center justify-content-start">
                    <b>QUALITY CONFIRMED (IPP)</b>&nbsp;&nbsp;&nbsp;
                  </p>
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
                <Col lg={6} className="border pb-2 pt-1">
                  <p className="mb-0">
                    <b>PRD</b>
                  </p>
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
                <Col lg={6} className="border pb-2 pt-1">
                  <p className="fs-6 mb-0">
                    <b>MTD</b>
                  </p>
                  {requestSheetDataOfBM?.partQualityCheckedByPRD ? (
                    <p className="mb-0">
                      {requestSheetDataOfBM?.partQualityCheckedByMTD?.tm_name}
                    </p>
                  ) : (
                    <DropdownElem
                      name={"partQualityCheckedByMTD"}
                      options={approvalListOfBM?.mtdUserTL}
                      className={"d-inline"}
                      register={register}
                      errors={errors}
                    />
                  )}
                </Col>
              </Row>
              <Row className="m-0">
                <Col className="border p-2">
                  <p className="mb-0 d-flex align-items-center justify-content-start">
                    <b>DATA SHEET ATTACHED</b>&nbsp;&nbsp;&nbsp;
                  </p>
                </Col>
                <Col className="border p-2 d-flex align-items-center">
                  <Form>
                    {["radio"].map((type) => (
                      <div key={`inline-${type}`} className="d-flex">
                        <Form.Check
                          flex
                          label="Yes"
                          name="group1"
                          type={type}
                          value="Yes"
                          id={`inline-${type}-1`}
                          // onChange={handleDataSheet}
                        />
                        <Form.Check
                          flex
                          label="No"
                          name="group1"
                          type={type}
                          value="No"
                          id={`inline-${type}-2`}
                          // onChange={handleDataSheet}
                        />
                      </div>
                    ))}
                  </Form>
                </Col>
              </Row>
              <Row className="m-0">
                <Col className="border p-2">
                  <p className="mb-0 d-flex align-items-center justify-content-start">
                    <b>DRAWING ATTACHED</b>&nbsp;&nbsp;&nbsp;
                  </p>
                </Col>
                <Col className="border p-2 d-flex align-items-center">
                  <Form>
                    {["radio"].map((type) => (
                      <div key={`inline-${type}`} className="d-flex">
                        <Form.Check
                          flex
                          label="Yes"
                          name="group1"
                          type={type}
                          value="Yes"
                          id={`inline-${type}-1`}
                          // onChange={handleDrawing}
                        />
                        <Form.Check
                          flex
                          label="No"
                          name="group1"
                          type={type}
                          value="No"
                          id={`inline-${type}-2`}
                          // onChange={handleDrawing}
                        />
                      </div>
                    ))}
                  </Form>
                </Col>
              </Row>
            </td>
          </tr>

          <tr>
            <td colSpan={8}>
              <ActionList actions={actions} setActions={setActions} />
            </td>
            <td colSpan={8}>
              <Row className="m-0">
                <Col className="border">
                  <b>PREVENTIVE / CORRECTIVE MAINTENANCE</b>
                </Col>
              </Row>
              <Row className="m-0 p-1 border">
                <AddBoxIcon onClick={() => {}} />
              </Row>
              <Row className="m-0 p-1 border">
                <AddBoxIcon onClick={() => {}} />
              </Row>
              <Row className="m-0">
                <Col className="border">
                  <b>YOKOTENKAI</b>
                </Col>
              </Row>
              <Row className="m-0 p-1 border">
                <AddBoxIcon onClick={() => {}} />
              </Row>
              <Row className="m-0 p-1 border">
                <AddBoxIcon onClick={() => {}} />
              </Row>
            </td>
          </tr>

          <tr>
            <td colSpan={16}>
              <Row>
                <Col className="col-auto">
                  <Row className="ms-0 border p-1">
                    <b
                      style={{
                        writingMode: "vertical-rl",
                        transform: "rotate(180deg)",
                        whiteSpace: "normal",
                      }}
                    >
                      CHANGED PARTS
                    </b>
                  </Row>
                </Col>
                <Col>
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
                <Col lg={4} className="border">
                  <Row>
                    <b className="text-decoration-underline">NOTE:</b>
                  </Row>
                  <Row>
                    <span>* IN CASE OF MAJOR BREKDOWN, IT IS NECESSARY TO</span>
                    <span>GET THE SIGNATURE OF "GM-PRD" & "GM-MTD" IN</span>
                    <span>"CHECKED BY" BOX.</span>
                    <span>** PART QUALITY RELATED TO MAINTENANCE WORK.</span>
                  </Row>
                </Col>

                <Col lg={8} className="border">
                  <Row>
                    <Col className="text-center border p-1">
                      <b>CHECKED BY</b>
                    </Col>
                  </Row>
                  <Row>
                    <Col className="border p-1 text-center">
                      <b>* GM-MTD</b>
                    </Col>
                    <Col className="border p-1 text-center">
                      <b>* GM-PRD</b>
                    </Col>
                    <Col className="border p-1 text-center">
                      <b>SECTION INCHARGE (PRD)</b>
                    </Col>
                    <Col className="border p-1 text-center">
                      <b>TEAM LEADER (PRD)</b>
                    </Col>
                  </Row>
                  <Row>
                    <Col className="border">
                      <div className="p-1">
                        {requestSheetDataOfBM?.approvalOfMTD_HOD ? (
                          requestSheetDataOfBM?.approvalOfMTD_HOD.tm_name
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
                            options={approvalListOfBM?.mtdHod}
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
                    <Col className="border">
                      <div className="p-1">
                        {requestSheetDataOfBM?.approvalOfPRD_HOD ? (
                          requestSheetDataOfBM?.approvalOfPRD_HOD.tm_name
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
                            options={approvalListOfBM?.prdHod}
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
                    <Col className="border">
                      <div className="p-1">
                        {requestSheetDataOfBM?.approvalOfPRD_HOS ? (
                          requestSheetDataOfBM?.approvalOfPRD_HOS.tm_name
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
                            options={approvalListOfBM?.prdHos}
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
                    <Col className="border">
                      <div className="p-1">
                        {requestSheetDataOfBM?.approvalOfPRD_TL ? (
                          requestSheetDataOfBM?.approvalOfPRD_TL.tm_name
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

        <Row>
          <Col>
            <button
              type="submit"
              className="btn bg-button"
              style={{ marginTop: "1rem" }}
              onClick={handleSubmit(newRequestSheetRegistration)}
            >
              Submit
            </button>
          </Col>
          <Col>
            <button
              type="submit"
              className="btn bg-button"
              style={{ marginTop: "1rem" }}
              onClick={handleSubmit(sendApprovalForRequestSheetOfBM)}
            >
              Send for approval
            </button>
          </Col>
        </Row>
      </Table>
    </form>
  );
}

export default MyTable;
