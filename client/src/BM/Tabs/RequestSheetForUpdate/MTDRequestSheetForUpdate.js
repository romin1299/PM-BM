// import React from "react";
// import Table from "react-bootstrap/Table";
import denso_log from "../../../static/images/denso_logo.png";
import { Row, Col, Form } from "react-bootstrap";
import { DropdownButton, Dropdown } from "react-bootstrap";

import React, { useState, useEffect } from "react";
import { Table } from "react-bootstrap";
import { AddBoxIcon } from "../../../modules/PageModules";
import ProblemList from "./SubComponentsForUpdate/ProblemList";
import ActionList from "./SubComponentsForUpdate/ActionList";
import PartList from "./SubComponentsForUpdate/PartList";
import { useForm } from "react-hook-form";
import moment from "moment";
import DropdownElem from "../../Component/DropdownElem";

const list = [
  { key: "A", value: "A" },
  { key: "B", value: "B" },
  { key: "C", value: "C" },
  { key: "D", value: "D" },
];

function MyTable({ selectedMachineDetails, approvalListOfBM }) {
  const [selected, setSelected] = useState({});
  const [actions, setActions] = useState([]);
  const [problems, setProblems] = useState([]);
  const [parts, setParts] = useState([]);
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    // reset,
  } = useForm({
    defaultValues: {
      // workStartedTimeOfBM: new Date().toLocaleTimeString("en-US", {
      //   timeZone: "Asia/Kolkata",
      //   hour: "2-digit",
      //   minute: "2-digit",
      //   hour12: false,
      // }),
      workEndedTimeOfBM: new Date().toLocaleTimeString("en-US", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    },
  });
  console.log(approvalListOfBM);

  // const [selectedQuality, setSelectedQuality] = useState("");
  // const [selectedDataSheet, setSelectedDataSheet] = useState("");
  // const [selectedDrawing, setSelectedDrawing] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("Yes");
  const [selectedMinor, setSelectedMinor] = useState("No");
  // const [selectedFirstTime, setSelectedFirstTime] = useState("");
  // const [selectedRepeat, setSelectedRepeat] = useState("");
  // const [selectedMaintenanceTime, setSelectedMaintenanceTime] = useState("");
  // const [selectedQualityCheckTime, setSelectedQualityCheckTime] = useState("");
  // const [selectedBreakTime, setSelectedBreakTime] = useState("");
  // const [totalTime, setTotalTime] = useState(0);

  // const handleQuality = (event) => {
  //   setSelectedQuality(event.target.value);
  // };
  // const handleDataSheet = (event) => {
  //   setSelectedDataSheet(event.target.value);
  // };
  // const handleDrawing = (event) => {
  //   setSelectedDrawing(event.target.value);
  // };
  // const handleFirstTime = (event) => {
  //   setSelectedFirstTime(event.target.value);
  // };
  // const handleRepeated = (event) => {
  //   setSelectedRepeat(event.target.value);
  // };
  // const handleMaintenanceTime = (event) => {
  //   setSelectedMaintenanceTime(event.target.value);
  // };
  // const handleQualityCheckTime = (event) => {
  //   setSelectedQualityCheckTime(event.target.value);
  // };
  // const handleBreakTime = (event) => {
  //   setSelectedBreakTime(event.target.value);
  // };

  // const handleSection = (e) => {
  //   setSelectedMtdUser({ selectedMtdUser: e.target.value });
  // };

  // console.log(selectedMtdTL);

  var curr = new Date();
  var currentDate = curr.toISOString().substring(0, 10);

  const currTime = new Date().toLocaleTimeString("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  // var startTimeParts = selectedStartTime.split(":");
  // var endTimeParts = selectedEndTime.split(":");

  // var startDate = new Date();
  // startDate.setHours(parseInt(startTimeParts[0], 10));
  // startDate.setMinutes(parseInt(startTimeParts[1], 10));

  // var endDate = new Date();
  // endDate.setHours(parseInt(endTimeParts[0], 10));
  // endDate.setMinutes(parseInt(endTimeParts[1], 10));

  // console.log(startDate, "---",endDate)

  // var timeDifferenceMs = watch('workEndedTimeOfBM') - watch("workStartedTimeOfBM");
  var timeDifferenceMinutes = moment(watch("workEndedTimeOfBM"), "HH:mm").diff(
    moment(watch("workStartedTimeOfBM"), "HH:mm"),
    "minutes"
  );
  // var timeDifferenceMinutes = timeDifferenceMs / (1000 * 60);

  const newRequestSheetRegistration = async (requestSheetData) => {
    const machineRef = "63b67ccea716e21c95cd471a";
    // requestSheetData.changedParts = parts;
    // requestSheetData.problemsOfBM = problems;
    // requestSheetData.actionAndCounterMeasureStep = actions;
    // requestSheetData.qualityConfirmed = selectedQuality;
    // requestSheetData.dataSheetOfBM = selectedDataSheet;
    // requestSheetData.drawingOfBM = selectedDrawing;
    // requestSheetData.breakDownTime = timeDifferenceMinutes;

    // requestSheetData.majorBD = selectedMajor;
    // requestSheetData.minorBD = selectedMinor;
    // requestSheetData.firstTime = selectedFirstTime;
    // requestSheetData.repeat = selectedRepeat;
    // requestSheetData.approvalOfMTD_TL = selectedMtdTL;
    // requestSheetData.approvalOfMTD_SL = selectedMtdSL;
    // requestSheetData.approvalOfMTD_HOS = selectedMtdUser;

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

  // const MTD = "MTD";
  // const user_type = "TL/HOSS";
  // const tm_grade = "HOS";

  // const getMtdUserDetails = async () => {
  //   try {
  //     const res = await fetch(
  //       `/getMtdUserDetails/?tm_department=${MTD}&&user_type=${user_type}&&tm_grade=${tm_grade}`,
  //       {
  //         method: "GET",
  //         headers: {
  //           Accept: "application/json",
  //           "Content-Type": "application/json",
  //         },
  //         credentials: "include",
  //       }
  //     );

  //     const { mtdUser, mtdUserTL, mtdHod, prdHod, prdHos, prdTL } =
  //       await res.json();

  //     setSelectedAllMtdUsers(mtdUser);
  //     setSelectedAllMtdTL(mtdUserTL);
  //     setSelectedAllMtdHOD(mtdHod);
  //     setSelectedAllPrdHOD(prdHod);
  //     setSelectedAllPrdHOS(prdHos);
  //     setSelectedAllPrdTL(prdTL);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  // useEffect(() => {
  //   getMtdUserDetails();
  // }, [MTD]);

  useEffect(() => {
    if (timeDifferenceMinutes > 120) {
      setSelectedMajor("Yes");
      setSelectedMinor("No");
    } else {
      setSelectedMajor("No");
      setSelectedMinor("Yes");
    }
  }, [timeDifferenceMinutes]);

  // useEffect(() => {
  //   const maintenanceTime = parseInt(selectedMaintenanceTime) || 0;
  //   const qualityCheckTime = parseInt(selectedQualityCheckTime) || 0;
  //   const breakTime = parseInt(selectedBreakTime) || 0;
  //   const totalTime = maintenanceTime + qualityCheckTime + breakTime;
  //   setTotalTime(totalTime);
  // }, [selectedMaintenanceTime, selectedQualityCheckTime, selectedBreakTime]);

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

                  {/* <select
                    // class="form-select form-select-sm"
                    // aria-label=".form-select-sm example"
                    style={{ borderRadius: "5px" }}
                    // id="standard-select-currency"
                    id="outlined-number"
                    name="selectedmtd"
                    className="textField mt-1 w-50"
                    fullWidth
                    select // label="Select"
                    autoComplete="off"
                    value={selectedMtdSL}
                    onChange={(e) => {
                      // handleMtdUser(e.target.value);

                      setSelectedMtdSL(e.target.value);
                    }}
                    variant="standard"
                  >
                    <option selected disabled value="">
                      Please select
                    </option>
                    {selectedAllMtdTL?.map((option) => {
                      return (
                        <option value={option?._id}>{option?.tm_name}</option>
                      );
                    })}
                  </select> */}
                </Col>
                <Col lg={6} className="border pb-2 pt-1">
                  <p className="fs-6 mb-0">
                    <b>MTD TL</b>
                  </p>
                  <DropdownElem
                    name={"MTD TL"}
                    selectedMinor={selectedMinor}
                    approvalList={
                      selectedMachineDetails?.line_names?.cell_names
                        ?.subSection_names?.section_names?.plant_names
                        ?.approvalListOfMinorAndMajor
                    }
                    options={approvalListOfBM?.mtdUserTL}
                    setValue={setValue}
                    onChange={(e) => {
                      // setSelectedUser(e.target.value);
                    }}
                  />
                  {/* <select
                    // class="form-select form-select-sm"
                    // aria-label=".form-select-sm example"
                    style={{ borderRadius: "5px" }}
                    // id="standard-select-currency"
                    id="outlined-number"
                    name="selectedLine"
                    className="textField mt-1 w-50"
                    fullWidth
                    select // label="Select"
                    autoComplete="off"
                    value={selectedMtdTL}
                    onChange={(e) => {
                      setSelectedMtdTL(e.target.value);
                    }}
                    variant="standard"
                  >
                    <option selected disabled value="">
                      Please select
                    </option>
                    {selectedAllMtdTL?.map((option) => {
                      return (
                        <option value={option?._id}>{option?.tm_name}</option>
                      );
                    })}
                  </select> */}
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
                              <b>DATE: </b>

                              <input
                                type="date"
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
                          &nbsp;&nbsp;&nbsp;&nbsp;
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
                              <b>DATE: </b>
                              <input
                                type="date"
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
                          &nbsp;&nbsp;&nbsp;&nbsp;
                          <div className="text-center">
                            <p className="mb-0">
                              <b>TIME: </b>
                              <input
                                type="time"
                                // defaultValue={currTime}
                                {...register("workEndedTimeOfBM", {
                                  required: "Work Ended Time is required",
                                })}
                                // onChange={handleEndTime}
                              />
                              {errors?.["workEndedTimeOfBM"] && (
                                <p className="text-error">
                                  {errors?.["workEndedTimeOfBM"]?.message}
                                </p>
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
                  <label>MTD HOSS</label>
                  <DropdownElem
                    name={"MTD HOSS"}
                    selectedMinor={selectedMinor}
                    approvalList={
                      selectedMachineDetails?.line_names?.cell_names
                        ?.subSection_names?.section_names?.plant_names
                        ?.approvalListOfMinorAndMajor
                    }
                    options={approvalListOfBM?.mtdUserTL}
                    setValue={setValue}
                    onChange={(e) => {
                      // setSelectedUser(e.target.value);
                    }}
                  />
                  {selectedMajor === "Yes" && <label>MTD HOS</label>}
                  <DropdownElem
                    name={"MTD HOS"}
                    selectedMinor={selectedMinor}
                    approvalList={
                      selectedMachineDetails?.line_names?.cell_names
                        ?.subSection_names?.section_names?.plant_names
                        ?.approvalListOfMinorAndMajor
                    }
                    options={approvalListOfBM?.mtdUser}
                    setValue={setValue}
                    onChange={(e) => {
                      // setSelectedUser(e.target.value);
                    }}
                  />

                  {/* <select
                    // class="form-select form-select-sm"
                    // aria-label=".form-select-sm example"
                    style={{ borderRadius: "5px" }}
                    // id="standard-select-currency"
                    id="outlined-number"
                    name="selectedLine"
                    className="textField mt-1 w-50"
                    fullWidth
                    select // label="Select"
                    autoComplete="off"
                    value={selectedMtdUser}
                    onChange={(e) => {
                      setSelectedMtdUser(e.target.value);
                    }}
                    variant="standard"
                  >
                    <option selected disabled value="">
                      Please select
                    </option>
                    {selectedAllMtdUsers?.map((option) => {
                      return (
                        <option value={option?._id}>{option?.tm_name}</option>
                      );
                    })}
                  </select> */}
                  {/* {errors.feedbackMTD && <p className="text-error">{errors.feedbackMTD.message}</p>} */}
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
                    <p className="text-error">
                      {errors?.["feedbackMTD"]?.message}
                    </p>
                  )}
                </Col>
              </Row>
            </td>
          </tr>

          <tr>
            <td colSpan={8}>
              <ProblemList problems={problems} setProblems={setProblems} />

              <Row className="m-2">
                <Col lg={3} className="border text-center pb-0 pt-2">
                  <p className="mb-0" style={{ fontSize: "12px" }}>
                    <b>BREAKDOWN TIME</b>
                  </p>

                  <p>{timeDifferenceMinutes || null}</p>
                </Col>
                <Col lg={3} className="border text-center pb-0 pt-2">
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
                <Col lg={3} className="border text-center pb-0 pt-2">
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
                <Col lg={3} className="border text-center pb-0 pt-2">
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
              {watch("maintenanceTime") +
                watch("qualityCheckTime") +
                watch("breakTime") >
                timeDifferenceMinutes && (
                <p class="mt-1 m-2 border p-2" style={{ color: "red" }}>Total time exceeds!!!</p>
              )}
              <Row className="m-2">
                <Col>
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
                              disabled
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
                              disabled
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
                              // onChange={handleFirstTime}
                            />
                            <Form.Check
                              flex
                              label="No"
                              name="group1"
                              type={type}
                              value="No"
                              id={`inline-${type}-2`}
                              // onChange={handleFirstTime}
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
                              disabled
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
                              disabled
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
                              // onChange={handleRepeated}
                            />
                            <Form.Check
                              flex
                              label="No"
                              name="group1"
                              type={type}
                              value="No"
                              id={`inline-${type}-2`}
                              // onChange={handleRepeated}
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
                    {["radio"].map((type) => (
                      <div key={`inline-${type}`} className="d-flex">
                        <Form.Check
                          flex
                          label="Yes"
                          name="group1"
                          type={type}
                          value="Yes"
                          id={`inline-${type}-1`}
                          // onChange={handleQuality}
                        />
                        <Form.Check
                          flex
                          label="No"
                          name="group1"
                          type={type}
                          value="No"
                          id={`inline-${type}-2`}
                          // onChange={handleQuality}
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
                    <p className="text-error">
                      {errors?.["partQualityByPRD"]?.message}
                    </p>
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
                    <p className="text-error">
                      {errors?.["partQualityByMTD"]?.message}
                    </p>
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
                        {/* <input className="w-100" type="text" /> */}
                        <DropdownElem
                          name={"MTD HOD"}
                          // selectedMajor={selectedMajor}
                          selectedMinor={selectedMinor}
                          approvalList={
                            selectedMachineDetails?.line_names?.cell_names
                              ?.subSection_names?.section_names?.plant_names
                              ?.approvalListOfMinorAndMajor
                          }
                          options={approvalListOfBM?.mtdHod}
                          setValue={setValue}
                        />
                      </div>
                    </Col>
                    <Col className="border">
                      <div className="p-1">
                        {/* <input className="w-100" type="text" /> */}
                        <DropdownElem
                          name={"PRD HOD"}
                          selectedMinor={selectedMinor}
                          approvalList={
                            selectedMachineDetails?.line_names?.cell_names
                              ?.subSection_names?.section_names?.plant_names
                              ?.approvalListOfMinorAndMajor
                          }
                          options={approvalListOfBM?.prdHod}
                          setValue={setValue}
                        />
                      </div>
                    </Col>
                    <Col className="border">
                      <div className="p-1">
                        {/* <input className="w-100" type="text" /> */}
                        <DropdownElem
                          name={"PRD HOS"}
                          selectedMinor={selectedMinor}
                          approvalList={
                            selectedMachineDetails?.line_names?.cell_names
                              ?.subSection_names?.section_names?.plant_names
                              ?.approvalListOfMinorAndMajor
                          }
                          options={approvalListOfBM?.prdHos}
                          setValue={setValue}
                        />
                      </div>
                    </Col>
                    <Col className="border">
                      <div className="p-1">
                        {/* <input className="w-100" type="text" /> */}
                        <DropdownElem
                          name={"PRD TL"}
                          selectedMinor={selectedMinor}
                          approvalList={
                            selectedMachineDetails?.line_names?.cell_names
                              ?.subSection_names?.section_names?.plant_names
                              ?.approvalListOfMinorAndMajor
                          }
                          options={approvalListOfBM?.prdTL}
                          setValue={setValue}
                        />
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
