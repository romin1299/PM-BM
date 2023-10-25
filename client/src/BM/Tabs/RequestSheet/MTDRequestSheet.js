// import React from "react";
// import Table from "react-bootstrap/Table";
import denso_log from "../../../static/images/denso_logo.png";
import { Row, Col, Form } from "react-bootstrap";
import { DropdownButton, Dropdown } from "react-bootstrap";

import React, { useState, useEffect } from "react";
import { Table } from "react-bootstrap";
import { AddBoxIcon } from "../../../modules/PageModules";
import ProblemList from "./SubComponents/ProblemList";
import ActionList from "./SubComponents/ActionList";
import PartList from "./SubComponents/PartList";
import { useForm } from "react-hook-form";
const list = [
  { key: "A", value: "A" },
  { key: "B", value: "B" },
  { key: "C", value: "C" },
  { key: "D", value: "D" },
];

function MyTable() {
  const [selected, setSelected] = useState({});
  const [actions, setActions] = useState([]);
  const [problems, setProblems] = useState([]);
  const [parts, setParts] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    // reset,
  } = useForm();

  const [selectedQuality, setSelectedQuality] = useState("");
  const [selectedDataSheet, setSelectedDataSheet] = useState("");
  const [selectedDrawing, setSelectedDrawing] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("Yes");
  const [selectedMinor, setSelectedMinor] = useState("No");
  const [selectedFirstTime, setSelectedFirstTime] = useState("");
  const [selectedRepeat, setSelectedRepeat] = useState("");
  const [selectedStartTime, setSelectedStartTime] = useState("");
  const [selectedEndTime, setSelectedEndTime] = useState("");
  const [selectedMaintenanceTime, setSelectedMaintenanceTime] = useState("");
  const [selectedQualityCheckTime, setSelectedQualityCheckTime] = useState("");
  const [selectedBreakTime, setSelectedBreakTime] = useState("");
  const [totalTime, setTotalTime] = useState(0);

  const handleQuality = (event) => {
    setSelectedQuality(event.target.value);
  };
  const handleDataSheet = (event) => {
    setSelectedDataSheet(event.target.value);
  };
  const handleDrawing = (event) => {
    setSelectedDrawing(event.target.value);
  };

  // const handleMajor = (event) => {
  //   setSelectedMajor(event.target.value);
  // };
  // const handleMinor = (event) => {
  //   setSelectedMinor(event.target.value);
  // };
  const handleFirstTime = (event) => {
    setSelectedFirstTime(event.target.value);
  };
  const handleRepeated = (event) => {
    setSelectedRepeat(event.target.value);
  };
  const handleStartTime = (event) => {
    setSelectedStartTime(event.target.value);
  };
  const handleEndTime = (event) => {
    setSelectedEndTime(event.target.value);
  };
  const handleMaintenanceTime = (event) => {
    setSelectedMaintenanceTime(event.target.value);
  };
  const handleQualityCheckTime = (event) => {
    setSelectedQualityCheckTime(event.target.value);
  };
  const handleBreakTime = (event) => {
    setSelectedBreakTime(event.target.value);
  };

  var curr = new Date();
  var currentDate = curr.toISOString().substring(0, 10);

  const currTime = new Date().toLocaleTimeString();
  console.log("currTime:", currTime);

  var startTimeParts = selectedStartTime.split(":");
  var endTimeParts = selectedEndTime.split(":");

  var startDate = new Date();
  startDate.setHours(parseInt(startTimeParts[0], 10));
  startDate.setMinutes(parseInt(startTimeParts[1], 10));

  var endDate = new Date();
  endDate.setHours(parseInt(endTimeParts[0], 10));
  endDate.setMinutes(parseInt(endTimeParts[1], 10));

  var timeDifferenceMs = endDate - startDate;

  var timeDifferenceMinutes = timeDifferenceMs / (1000 * 60);

  // console.log("Time difference in minutes:", timeDifferenceMinutes);

  const newRequestSheetRegistration = async (requestSheetData) => {
    const machineRef = "63b67ccea716e21c95cd471a";
    requestSheetData.changedParts = parts;
    requestSheetData.problemsOfBM = problems;
    requestSheetData.actionAndCounterMeasureStep = actions;
    requestSheetData.qualityConfirmed = selectedQuality;
    requestSheetData.dataSheetOfBM = selectedDataSheet;
    requestSheetData.drawingOfBM = selectedDrawing;
    requestSheetData.breakDownTime = timeDifferenceMinutes;

    requestSheetData.majorBD = selectedMajor;
    requestSheetData.minorBD = selectedMinor;
    requestSheetData.firstTime = selectedFirstTime;
    requestSheetData.repeat = selectedRepeat;

    const reqid = "65324cb00dc427ec2a098ef4";

    try {
      const res = await fetch(
        `/newRequestSheetRegistration/?reqId=${reqid}&&machineRef=${machineRef}`,
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
        console.log(data);
      } else {
        console.log("error", data);
      }
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    if (timeDifferenceMinutes > 120) {
      setSelectedMajor("Yes");
      setSelectedMinor("No");
    } else {
      setSelectedMajor("No");
      setSelectedMinor("Yes");
    }
  }, [timeDifferenceMinutes]);

  useEffect(() => {
    const maintenanceTime = parseInt(selectedMaintenanceTime) || 0;
    const qualityCheckTime = parseInt(selectedQualityCheckTime) || 0;
    const breakTime = parseInt(selectedBreakTime) || 0;
    const totalTime = maintenanceTime + qualityCheckTime + breakTime;
    setTotalTime(totalTime);
  }, [selectedMaintenanceTime, selectedQualityCheckTime, selectedBreakTime]);

  return (
    <form onSubmit={handleSubmit(newRequestSheetRegistration)}>
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
                  <input
                    type="text"
                    id="reqMTD"
                    name="reqMTD"
                    style={{ width: "100%" }}
                    {...register("requestReceivedMTD", {
                      required: "This field is required",
                    })}
                  />
                  {errors?.["requestReceivedMTD"] && (
                    <p>{errors?.["requestReceivedMTD"]?.message}</p>
                  )}
                </Col>
                <Col lg={6} className="border pb-2 pt-1">
                  <p className="fs-6 mb-0">
                    <b>MTD T.L.</b>
                  </p>
                  <input
                    type="text"
                    id="MTDTL"
                    name="MTDTL"
                    style={{ width: "100%" }}
                    {...register("MTD_TL", {
                      required: "This field is required",
                    })}
                  />
                  {errors?.["MTD_TL"] && <p>{errors?.["MTD_TL"]?.message}</p>}
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
                              <b>Date: </b>

                              <input
                                type="date"
                                defaultValue={currentDate}
                                {...register("workStartedDateOfBM", {
                                  required: "Work Start date is required",
                                })}
                              />
                              {errors?.["workStartedDateOfBM"] && (
                                <p>
                                  {errors?.["workStartedDateOfBM"]?.message}
                                </p>
                              )}
                            </p>
                          </div>{" "}
                          &nbsp;&nbsp;&nbsp;&nbsp;
                          <div className="text-center">
                            <p className="mb-0">
                              <b>Time: </b>

                              <input
                                type="time"
                                defaultValue={currTime}
                                {...register("workStartedTimeOfBM", {
                                  required: "Work Start Time is required",
                                })}
                                onChange={handleStartTime}
                              />
                              {errors?.["workStartedTimeOfBM"] && (
                                <p>
                                  {errors?.["workStartedTimeOfBM"]?.message}
                                </p>
                              )}
                            </p>
                          </div>
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
                              <b>Date: </b>
                              <input
                                type="date"
                                defaultValue={currentDate}
                                {...register("workEndedDateOfBM", {
                                  required: "Work Ended date is required",
                                })}
                              />
                              {errors?.["workEndedDateOfBM"] && (
                                <p>{errors?.["workEndedDateOfBM"]?.message}</p>
                              )}
                            </p>
                          </div>{" "}
                          &nbsp;&nbsp;&nbsp;&nbsp;
                          <div className="text-center">
                            <p className="mb-0">
                              <b>Time: </b>
                              <input
                                type="time"
                                defaultValue={currTime}
                                {...register("workEndedTimeOfBM", {
                                  required: "Work Ended Time is required",
                                })}
                                onChange={handleEndTime}
                              />
                              {errors?.["workEndedTimeOfBM"] && (
                                <p>{errors?.["workEndedTimeOfBM"]?.message}</p>
                              )}
                            </p>
                          </div>
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
                  <input
                    type="text"
                    id="sectionIncharge"
                    name="sectionIncharge"
                    style={{ width: "100%" }}
                    {...register("sectionIncharge", {
                      required: "This field is required",
                    })}
                  />
                  {errors?.["sectionIncharge"] && (
                    <p>{errors?.["sectionIncharge"]?.message}</p>
                  )}
                </Col>
                <Col lg={6} className="border pb-2 pt-1">
                  <p className="fs-6 mb-0">
                    <b>FEEDBACK</b>
                  </p>
                  <input
                    type="text"
                    id="feedback"
                    name="feedback"
                    style={{ width: "100%" }}
                    {...register("feedbackMTD", {
                      required: "This field is required",
                    })}
                  />
                  {errors?.["feedbackMTD"] && (
                    <p>{errors?.["feedbackMTD"]?.message}</p>
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
                    BREAKDOWN TIME
                  </p>

                  <p>{timeDifferenceMinutes}</p>
                </Col>
                <Col
                  lg={3}
                  className="border border-top-0 text-center pb-0 pt-2"
                >
                  <p className="mb-0" style={{ fontSize: "12px" }}>
                    MAINTENANCE TIME
                  </p>
                  <input
                    type="number"
                    style={{ width: "100%" }}
                    id="mainTime"
                    name="mainTime"
                    {...register("maintenanceTime", {
                      required: "This field is required",
                    })}
                    onChange={handleMaintenanceTime}
                  />
                  {errors?.["maintenanceTime"] && (
                    <p>{errors?.["maintenanceTime"]?.message}</p>
                  )}
                </Col>
                <Col
                  lg={3}
                  className="border border-top-0 text-center pb-0 pt-2"
                >
                  <p className="mb-0" style={{ fontSize: "12px" }}>
                    QUALITY CHECK TIME
                  </p>
                  <input
                    type="number"
                    style={{ width: "100%" }}
                    id="qualityTime"
                    name="qualityTime"
                    {...register("qualityCheckTime", {
                      required: "This field is required",
                    })}
                    onChange={handleQualityCheckTime}
                  />
                  {errors?.["qualityCheckTime"] && (
                    <p>{errors?.["qualityCheckTime"]?.message}</p>
                  )}
                </Col>
                <Col
                  lg={3}
                  className="border border-top-0 text-center pb-0 pt-2"
                >
                  <p className="mb-0" style={{ fontSize: "12px" }}>
                    BREAK TIME
                  </p>
                  <input
                    type="number"
                    style={{ width: "100%" }}
                    id="breaktime"
                    name="breaktime"
                    {...register("breakTime", {
                      required: "This field is required",
                    })}
                    onChange={handleBreakTime}
                  />
                  {errors?.["breakTime"] && (
                    <p>{errors?.["breakTime"]?.message}</p>
                  )}
                </Col>
              </Row>
              {totalTime > timeDifferenceMinutes && (
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
                        {["radio"].map((type) => (
                          <div key={`inline-${type}`} className="d-flex">
                            <Form.Check
                              flex
                              label="Yes"
                              name="majorRadio"
                              type={type}
                              value="Yes"
                              id={`inline-${type}-1`}
                              // onChange={handleMajor}
                              checked={selectedMajor === "Yes"}
                              onChange={() => {
                                setSelectedMajor("Yes");
                                setSelectedMinor("No");
                              }}
                            />
                            <Form.Check
                              flex
                              label="No"
                              name="majorRadio"
                              type={type}
                              value="No"
                              id={`inline-${type}-2`}
                              // onChange={handleMajor}
                              checked={selectedMajor === "No"}
                              onChange={() => {
                                setSelectedMajor("No");
                                setSelectedMinor("Yes");
                              }}
                            />
                          </div>
                        ))}
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
                        {["radio"].map((type) => (
                          <div key={`inline-${type}`} className="d-flex">
                            <Form.Check
                              flex
                              label="Yes"
                              name="group1"
                              type={type}
                              value="Yes"
                              id={`inline-${type}-1`}
                              onChange={handleFirstTime}
                            />
                            <Form.Check
                              flex
                              label="No"
                              name="group1"
                              type={type}
                              value="No"
                              id={`inline-${type}-2`}
                              onChange={handleFirstTime}
                            />
                          </div>
                        ))}
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
                        {["radio"].map((type) => (
                          <div key={`inline-${type}`} className="d-flex">
                            <Form.Check
                              flex
                              label="Yes"
                              name="minorRadio"
                              type={type}
                              // value="Yes"
                              id={`inline-${type}-1`}
                              // onChange={handleMinor}
                              checked={selectedMinor === "Yes"}
                              onChange={() => {
                                setSelectedMajor("No");
                                setSelectedMinor("Yes");
                              }}
                            />
                            {/* {console.log(selectedMinor === "Yes")} */}
                            <Form.Check
                              flex
                              label="No"
                              name="minorRadio"
                              type={type}
                              // value="No"
                              id={`inline-${type}-2`}
                              // onChange={handleMinor}
                              checked={selectedMinor === "No"}
                              onChange={() => {
                                setSelectedMajor("Yes");
                                setSelectedMinor("No");
                              }}
                            />
                          </div>
                        ))}
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
                        {["radio"].map((type) => (
                          <div key={`inline-${type}`} className="d-flex">
                            <Form.Check
                              flex
                              label="Yes"
                              name="group1"
                              type={type}
                              value="Yes"
                              id={`inline-${type}-1`}
                              onChange={handleRepeated}
                            />
                            <Form.Check
                              flex
                              label="No"
                              name="group1"
                              type={type}
                              value="No"
                              id={`inline-${type}-2`}
                              onChange={handleRepeated}
                            />
                          </div>
                        ))}
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
                    <Col>
                      <p className="mb-0" style={{ fontSize: "12px" }}>
                        <b>WHY-1 </b>
                      </p>
                    </Col>
                    <Col>
                      <input
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
                        <p>{errors?.["whyAnalysis"]?.message}</p>
                      )} */}
                    </Col>
                  </Row>
                  <Row className="d-flex align-items-center justify-content-center border">
                    <Col>
                      <p className="mb-0" style={{ fontSize: "12px" }}>
                        <b>WHY-2 </b>
                      </p>
                    </Col>
                    <Col>
                      <input
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
                    <Col>
                      <p className="mb-0" style={{ fontSize: "12px" }}>
                        <b>WHY-3 </b>
                      </p>
                    </Col>
                    <Col>
                      <input
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
                    <Col>
                      <p className="mb-0" style={{ fontSize: "12px" }}>
                        <b>WHY-4 </b>
                      </p>
                    </Col>
                    <Col>
                      <input
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
                    <Col>
                      <p className="mb-0" style={{ fontSize: "12px" }}>
                        <b>WHY-5 </b>
                      </p>
                    </Col>
                    <Col>
                      <input
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
                    {["radio"].map((type) => (
                      <div key={`inline-${type}`} className="d-flex">
                        <Form.Check
                          flex
                          label="Yes"
                          name="group1"
                          type={type}
                          value="Yes"
                          id={`inline-${type}-1`}
                          onChange={handleQuality}
                        />
                        <Form.Check
                          flex
                          label="No"
                          name="group1"
                          type={type}
                          value="No"
                          id={`inline-${type}-2`}
                          onChange={handleQuality}
                        />
                      </div>
                    ))}
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
                  <input
                    type="text"
                    id="prdcheck"
                    name="prdcheck"
                    style={{ width: "100%" }}
                    {...register("partQualityByPRD", {
                      required: "This field is required",
                    })}
                  />
                  {errors?.["partQualityByPRD"] && (
                    <p>{errors?.["partQualityByPRD"]?.message}</p>
                  )}
                </Col>
                <Col lg={6} className="border pb-2 pt-1">
                  <p className="fs-6 mb-0">
                    <b>MTD</b>
                  </p>
                  <input
                    type="text"
                    id="mtdcheck"
                    name="mtdcheck"
                    style={{ width: "100%" }}
                    {...register("partQualityByMTD", {
                      required: "This field is required",
                    })}
                  />
                  {errors?.["partQualityByMTD"] && (
                    <p>{errors?.["partQualityByMTD"]?.message}</p>
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
                          onChange={handleDataSheet}
                        />
                        <Form.Check
                          flex
                          label="No"
                          name="group1"
                          type={type}
                          value="No"
                          id={`inline-${type}-2`}
                          onChange={handleDataSheet}
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
                          onChange={handleDrawing}
                        />
                        <Form.Check
                          flex
                          label="No"
                          name="group1"
                          type={type}
                          value="No"
                          id={`inline-${type}-2`}
                          onChange={handleDrawing}
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
            <td>
              <Row className="">
                <b
                  style={{
                    writingMode: "vertical-lr",
                    transform: "rotate(180deg)",
                    whiteSpace: "normal",
                  }}
                >
                  CHANGED PARTS
                </b>
              </Row>
            </td>
            <td>
              <PartList parts={parts} setParts={setParts} />
            </td>
          </tr>
        </tbody>

        <Row>
          <Col>
            <button
              type="submit"
              className="btn bg-button"
              style={{ marginTop: "1rem" }}
            >
              Register
            </button>
          </Col>
        </Row>
      </Table>
    </form>
  );
}

export default MyTable;
