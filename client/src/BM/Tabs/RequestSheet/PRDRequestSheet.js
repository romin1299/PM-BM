// import React from "react";
// import Table from "react-bootstrap/Table";
import React, { useState, useContext, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Row, Col, Form, Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { Table } from "react-bootstrap";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import { denso_logo } from "../../../components/NavbarComponent/ImportModules";

import moment from "moment-timezone";
import { ToastContainer } from "react-toastify";
import { useParams } from "react-router-dom";
import { SuccessToast, WarningToast } from "../../Component/ShowTostify";
import RoutingContext from "../../../context/routing/RoutingContext";
import { Box, Divider, Paper, Typography } from "@mui/material";
import { useLocation } from "react-router-dom";
import axios from "axios";
import MachineStatusBox from "../SubComponents/MachineStatusBox";

const list = [
  { key: "A", value: "A" },
  { key: "B", value: "B" },
  { key: "C", value: "C" },
  { key: "D", value: "D" },
];

function MyTable({ selectedMachineDetails, machineStatus }) {
  // let [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { machine_code, generateType } = useParams();
  const context = useContext(RoutingContext);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue,
  } = useForm({
    defaultValues: {
      problemOccurredDateAndTimeOfBM: moment(new Date()).format(
        "YYYY-MM-DDTHH:mm"
      ),
      // requestSheettime: new Date().toLocaleString("en-US", {
      //   timeZone: "Asia/Kolkata",
      //   hour: "2-digit",
      //   minute: "2-digit",
      //   hour12: false,
      // }),
      sheetIssuedDateAndTimeOfBM: moment(new Date()).format("YYYY-MM-DDTHH:mm"),
      // sheetIssuedTime: new Date().toLocaleString("en-US", {
      //   timeZone: "Asia/Kolkata",
      //   hour: "2-digit",
      //   minute: "2-digit",
      //   hour12: false,
      // }),
    },
  });

  const selectedRequestSheetData = useLocation();

  const [plantShiftsData, setPlantShiftsData] = useState([]);
  // const [problemOccurredDateAndTimeOfBM, setProblemOccurredDateAndTimeOfBM] =
  useState("");

  // const [selectedShift, setSelectedShift] = useState("");
  // const [selectedMaintenanceType, setSelectedMaintenanceType] = useState("");
  // const [selectedPriorityCode, setSelectedPriorityCode] = useState("");
  // const [selectedQuality, setSelectedQuality] = useState("");
  // const [selectedMachineDetails, setMachineDetails] = useState("");

  // const handleSelectShift = (key, event) => {
  //   setSelectedShift({ key, value: event.target.value });
  // };

  // const handleMaintenanceType = (event) => {
  //   setSelectedMaintenanceType(event.target.value);
  // };
  // const handlePriorityCode = (event) => {
  //   setSelectedPriorityCode(event.target.value);
  // };
  // const handleQuality = (event) => {
  //   setSelectedQuality(event.target.value);
  // };

  const newRequestSheetRegistration = async (requestSheetData) => {
    // const machineRef = "63b67ccea716e21c95cd471a";
    // requestSheetData.maintenanceType = selectedMaintenanceType;
    // requestSheetData.priorityCode = selectedPriorityCode;
    // requestSheetData.qualityRelated = selectedQuality;
    // requestSheetData.shiftOfBM = selectedShift;

    try {
      const res = await fetch(
        `/newRequestSheetRegistration/?machineRef=${machine_code}`,
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
        reset();
        // if (generateType === "scanned") {
        //   navigate("/", { replace: true });
        // } else {
        navigate("/bm/requestListDashboard", { replace: true });
        // }
      } else {
        WarningToast(data?.message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const timezone = "Asia/Kolkata";
  const startedDate = moment().tz(timezone).month() + 1;

  let sheetIssuedTime = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  // console.log("watch", defaultValues);
  // const momentTime = moment(sheetIssuedTime, "HH:mm");
  const problemOccurredDateAndTimeOfBM = watch(
    "problemOccurredDateAndTimeOfBM"
  );
  const [date, time] = problemOccurredDateAndTimeOfBM.split("T");
  const momentTime = moment(time, "HH:mm");

  useEffect(() => {
    const getCurrentShiftName = () => {
      for (let shiftInfo of plantShiftsData) {
        const startTime = moment(shiftInfo.shiftStartTime, "HH:mm");
        const endTime = moment(shiftInfo.shiftEndTime, "HH:mm");

        // if (
        //   momentTime > moment(shiftInfo?.shiftStartTime, "HH:mm") &&
        //   momentTime < moment(shiftInfo?.shiftEndTime, "HH:mm")
        // )

        if (endTime.isBefore(startTime)) {
          if (
            momentTime.isSameOrAfter(startTime) ||
            momentTime.isSameOrBefore(endTime)
          ) {
            return shiftInfo.shiftName;
          }
        } else {
          if (momentTime.isBetween(startTime, endTime)) {
            return shiftInfo.shiftName;
          }
        }
      }
      // }

      return "";
    };

    setValue("shiftOfBM", getCurrentShiftName());
  }, [problemOccurredDateAndTimeOfBM]);

  React.useEffect(() => {
    const fetchShiftData = async () => {
      const url = "/getAllShifts";

      try {
        const res = await axios.get(url, {
          withCredentials: true,
          credentials: "include",
        });

        // console.log("fetch shifts res:", res);
        setPlantShiftsData(res?.data?.getShifts);
      } catch (error) {
        console.log("error:", error);
      }
    };

    fetchShiftData();
  }, []);

  const handleBack = () => {
    navigate("/bm/requestListDashboard", { replace: true });
  };

  return (
    <>
      <ToastContainer />
      <form onSubmit={handleSubmit(newRequestSheetRegistration)}>
        <Table className="m-0">
          <tbody className="m-1 border p-3">
            <tr class="">
              {/* <td width={100}>
              <img
                src={denso_logo}
                width="120"
                height="30"
                className="d-inline-block align-top"
                alt="React Bootstrap logo"
              />
              
            </td> */}

              <td className="">
                <Container fluid>
                  <Row>
                    <Col
                      id="rs-top-btns"
                      data-html2canvas-ignore="true"
                      className="col-auto d-flex gap-2 align-items-center"
                    >
                      <button className="btn bg-button" onClick={handleBack}>
                        Back
                      </button>
                      <button
                        className="btn bg-button"
                        onClick={() => {
                          navigate(
                            `/machine-history/${machine_code}/?machineId=${selectedMachineDetails?._id}`
                          );
                        }}
                      >
                        Machine History
                      </button>
                    </Col>

                    <Col className="d-flex align-items-center justify-content-center text-center">
                      <h4 className="m-0">MAINTENANCE WORK REQUEST/REPORT</h4>
                    </Col>

                    <Col className="col-auto">
                      <Box
                        display="flex"
                        justifyContent="end"
                        gap={1}
                        // sx={{ position: "absolute", top: "10px", right: "20px" }}
                      >
                        <MachineStatusBox
                          title="PM Status"
                          bodyText1={machineStatus?.pmStatusData?.PMStatus}
                          bodyText2={machineStatus?.pmStatusData?.PMdate}
                        />
                        <MachineStatusBox
                          title="BM"
                          bodyText1={
                            machineStatus?.bmStatusData?.totalHours &&
                            `${machineStatus?.bmStatusData?.totalHours} Hrs./${machineStatus?.bmStatusData?.count} Count`
                          }
                        />
                        <MachineStatusBox title="CM" />
                      </Box>
                    </Col>
                  </Row>
                </Container>
              </td>
            </tr>

            <tr className="row m-2">
              <td className="mb-0 pb-0 border col-6 col-md-2">
                <small>
                  <b>MAINT. TYPE</b>
                </small>
                <Form style={{ fontSize: "16px !important" }}>
                  <div key={`inline-radio`}>
                    <Form.Check
                      flex
                      style={{ fontSize: "12px" }}
                      label="BM"
                      name="maintenanceType"
                      type="radio"
                      id={`inline-radio-1`}
                      value="BM"
                      {...register("maintenanceType", {
                        required: "Please select maintenance type",
                      })}
                      // onChange={handleMaintenanceType}
                      // checked={selectedMaintenanceType === "BM"}
                    />
                    <Form.Check
                      flex
                      style={{ fontSize: "12px" }}
                      label="PM"
                      name="maintenanceType"
                      type="radio"
                      id={`inline-radio-2`}
                      value="PM"
                      // onChange={handleMaintenanceType}
                      // checked={selectedMaintenanceType === "PM"}
                      {...register("maintenanceType", {
                        required: "Please select maintenance type",
                      })}
                    />
                    <Form.Check
                      flex
                      style={{ fontSize: "12px" }}
                      label="CM"
                      type="radio"
                      name="maintenanceType"
                      id={`inline-radio-3`}
                      value="CM"
                      // onChange={handleMaintenanceType}
                      // checked={selectedMaintenanceType === "CM"}
                      {...register("maintenanceType", {
                        required: "Please select maintenance type",
                      })}
                    />
                    <Form.Check
                      flex
                      style={{ fontSize: "12px" }}
                      label="TPM"
                      type="radio"
                      name="maintenanceType"
                      id={`inline-radio-4`}
                      value="TPM"
                      // onChange={handleMaintenanceType}
                      // checked={selectedMaintenanceType === "TPM"}
                      {...register("maintenanceType", {
                        required: "Please select maintenance type",
                      })}
                    />
                  </div>
                  {errors?.["maintenanceType"] && (
                    <p className="text-error">
                      {errors?.["maintenanceType"]?.message}
                    </p>
                  )}
                </Form>
              </td>

              <td className="mb-0 pb-0 border col-6 col-md-2">
                <small>
                  {" "}
                  <b>PRIORITY CODE</b>
                </small>
                <Form>
                  <div key={`inline-radio`}>
                    <Form.Check
                      flex
                      style={{ fontSize: "12px" }}
                      label="EMERGENCY"
                      name="priorityCode"
                      type="radio"
                      id={`inline-radio-1`}
                      value="EMERGENCY"
                      // onChange={handlePriorityCode}
                      // checked={selectedPriorityCode === "EMERGENCY"}
                      {...register("priorityCode", {
                        required: "Please select priority code",
                      })}
                    />
                    <Form.Check
                      flex
                      style={{ fontSize: "12px" }}
                      label="IMPORTANT"
                      name="priorityCode"
                      type="radio"
                      id={`inline-radio-2`}
                      value="IMPORTANT"
                      // onChange={handlePriorityCode}
                      // checked={selectedPriorityCode === "IMPORTANT"}
                      {...register("priorityCode", {
                        required: "Please select priority code",
                      })}
                    />
                    <Form.Check
                      flex
                      style={{ fontSize: "12px" }}
                      label="DATA NEEDED"
                      name="priorityCode"
                      type="radio"
                      id={`inline-radio-3`}
                      value="DATA NEEDED"
                      // onChange={handlePriorityCode}
                      // checked={selectedPriorityCode === "DATA NEEDED"}
                      {...register("priorityCode", {
                        required: "Please select priority code",
                      })}
                    />
                    <Form.Check
                      flex
                      style={{ fontSize: "12px" }}
                      label="KAIZEN"
                      name="priorityCode"
                      type="radio"
                      id={`inline-radio-4`}
                      value="KAIZEN"
                      // onChange={handlePriorityCode}
                      // checked={selectedPriorityCode === "KAIZEN"}
                      {...register("priorityCode", {
                        required: "Please select priority code",
                      })}
                    />
                  </div>
                  {errors?.["priorityCode"] && (
                    <p className="text-error">
                      {errors?.["priorityCode"]?.message}
                    </p>
                  )}
                </Form>
              </td>

              <td className="mb-0 pb-0 border col-12 col-md-6">
                <div className="mb-2 border">
                  <Row className="m-0">
                    <Col className="border">
                      <p className="text-center p-1">
                        <b>REQUEST SHEET ( To be filled by PRD)</b>
                      </p>
                    </Col>
                  </Row>
                  <Row className="m-0">
                    <Col className="border">
                      <small className="text-left p-1 mb-2">
                        <b>REQUEST No.</b>{" "}
                        {selectedMachineDetails?.line_names?.cell_names
                          ?.subSection_names?.section_names?.dashboardLevel ===
                        "Yes"
                          ? selectedMachineDetails?.line_names?.cell_names?.subSection_names?.section_names?.section_name
                              ?.trim()
                              ?.substring(0, 2)
                              ?.toUpperCase()
                          : selectedMachineDetails?.line_names?.cell_names?.subSection_names?.subSection_name
                              ?.trim()
                              ?.substring(0, 2)
                              ?.toUpperCase()}
                        -{selectedMachineDetails?.line_names?.line_name?.trim()}
                        -{startedDate}-
                        {selectedMachineDetails?.line_names?.requestSheetNos +
                          1 || 1}
                      </small>
                    </Col>
                  </Row>
                  <Row className="m-0">
                    <Col className="border">
                      <Row>
                        <small className="border-right-0 text-center m-0">
                          <b>PROBLEM OCCURRED</b>
                        </small>
                        <div className="d-flex align-items-center justify-content-center mt-1 mb-1 border-top">
                          <div className="text-center">
                            <p className="mb-0">
                              <b>DATE & TIME: </b>
                              <br />
                              <input
                                type="datetime-local"
                                {...register("problemOccurredDateAndTimeOfBM", {
                                  required: "RequestSheet date is required",
                                  onChange: (event) =>
                                    setValue(
                                      "problemOccurredDateAndTimeOfBM",
                                      event.target.value
                                    ),
                                })}
                              />
                              {errors?.["problemOccurredDateAndTimeOfBM"] && (
                                <p className="text-error">
                                  {
                                    errors?.["problemOccurredDateAndTimeOfBM"]
                                      ?.message
                                  }
                                </p>
                              )}
                            </p>
                          </div>{" "}
                          {/* &nbsp;&nbsp;&nbsp;&nbsp;
                          <div className="text-center">
                            <p className="mb-0">
                              <b>TIME: </b>
                              <br />
                              <input
                                type="time"
                                {...register("requestSheettime", {
                                  required: "RequestSheet time is required",
                                })}
                              />
                              {errors?.["requestSheettime"] && (
                                <p className="text-error">
                                  {errors?.["requestSheettime"]?.message}
                                </p>
                              )}
                            </p>
                          </div> */}
                        </div>
                      </Row>
                    </Col>
                    <Col className="border">
                      <Row>
                        <small className="border-left-0 text-center m-0">
                          <b>SHEET ISSUED</b>
                        </small>
                        <div className="d-flex align-items-center justify-content-center mt-1 mb-1 border-top">
                          <div className="text-center">
                            <small className="mb-0">
                              <b>DATE & TIME: </b>
                              <br />
                              <input
                                type="datetime-local"
                                {...register(
                                  "sheetIssuedDateAndTimeOfBM"
                                  //  {
                                  //   required: "Sheet Issued date is required",
                                  // }
                                )}
                                disabled
                              />
                              {/* {errors?.["sheetIssuedDateAndTimeOfBM"] && (
                              <p className="text-error">{errors?.["sheetIssuedDateAndTimeOfBM"]?.message}</p>
                            )} */}
                            </small>
                          </div>{" "}
                          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                          {/* <div className="text-center">
                            <p className="mb-0">
                              <b>TIME: </b>
                              <br />
                              <input
                                type="time"
                                {...register(
                                  "sheetIssuedTime"
                                  //  {
                                  //   required: "Sheet Issued time is required",
                                  // }
                                )}
                                disabled
                              />
                            </p>
                          </div> */}
                        </div>
                      </Row>
                    </Col>
                  </Row>
                </div>
              </td>

              <td className="border mb-0 col-12 col-md-2">
                {/* <Row className="pt-0 pb-0" style={{ marginLeft: "-8px" }}>
                <Col className="border border-left-0">
                  <p className="mb-0">
                    <b>Sr. No.</b>
                  </p>
                  <p className="fs-6 fw-normal">
                    <input
                      style={{ width: "100%" }}
                      {...register("serialNo", {
                        required: "Serial No. is required",
                      })}
                    />
                    {errors?.["serialNo"] && (
                      <p className="text-error">{errors?.["serialNo"]?.message}</p>
                    )}
                  </p>
                </Col>
              </Row> */}
                <div className="border">
                  <Row className="m-0">
                    <Col className="border pb-2 pt-1">
                      <small className="mb-0">
                        <b>DEPT./LINE</b>
                      </small>
                      <br />
                      <small>
                        {
                          selectedMachineDetails?.line_names?.cell_names
                            ?.cell_name
                        }
                        /{selectedMachineDetails?.line_names?.line_name}
                      </small>
                    </Col>
                  </Row>

                  <Row className="m-0">
                    <Col className="border pb-2">
                      <small className="fs-6 mb-0">
                        <b>TL [PRD]</b>
                      </small>
                      <br />
                      <small>{context?.tm_name}</small>
                      {/* <input
                    style={{ width: "100%" }}
                    {...register("TLName", {
                      required: "Team Leader Name is required",
                    })}
                  />
                  {errors?.["TLName"] && <p className="text-error">{errors?.["TLName"]?.message}</p>} */}
                    </Col>
                  </Row>
                </div>
              </td>
            </tr>

            <tr class="row m-2">
              <td className="border p-2 col-lg-8 col-md-7 col-sm-12">
                <Row className="m-0 border d-flex align-items-center">
                  <Col lg={4} md={6}>
                    <small className="mb-0">
                      <b>MACHINE NAME:</b>{" "}
                    </small>{" "}
                    &nbsp;&nbsp;
                    {selectedMachineDetails.machine_name}
                  </Col>
                  <Col lg={4} md={6}>
                    <small className="mb-0">
                      <b>MACHINE NO.:</b>
                    </small>
                    &nbsp;&nbsp;
                    {selectedMachineDetails.machine_code}
                  </Col>
                </Row>
                <Row className="m-0 border d-flex align-items-center">
                  <Col lg={5}>
                    <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
                      <b>PROBLEM FACED: </b>
                    </p>
                  </Col>
                  <Col lg={7}>
                    <input
                      type="text"
                      id="prob"
                      name="problemfaced"
                      className="m-1 mb-2"
                      style={{ width: "350px" }}
                      {...register("problemFaced", {
                        required: "Please fill this field",
                      })}
                    />
                    {errors?.["problemFaced"] && (
                      <p className="text-error">
                        {errors?.["problemFaced"]?.message}
                      </p>
                    )}
                  </Col>
                </Row>
                <Row className="m-0 border d-flex align-items-center">
                  <Col lg={5}>
                    <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
                      <b>
                        PRD OBSERVATION FOR THIS PROBLEM BASED ON (5WHY-1HOW){" "}
                      </b>
                    </p>
                  </Col>
                  <Col lg={7}>
                    <input
                      type="text"
                      id="prdobv"
                      name="prdobv"
                      className="m-1 mb-2"
                      style={{ width: "350px" }}
                      {...register("PRD_ObservationForProblem_5Why_1How", {
                        required: "Please fill this field",
                      })}
                    />
                    {errors?.["PRD_ObservationForProblem_5Why_1How"] && (
                      <p className="text-error">
                        {
                          errors?.["PRD_ObservationForProblem_5Why_1How"]
                            ?.message
                        }
                      </p>
                    )}
                  </Col>
                </Row>
                <Row className="m-0 border d-flex align-items-center">
                  <Col lg={5}>
                    <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
                      <b>WHY (5M+1E): </b>
                    </p>
                  </Col>
                  <Col lg={7}>
                    <input
                      type="text"
                      id="why"
                      name="why"
                      className="m-1 mb-2"
                      style={{ width: "350px" }}
                      {...register("why_5M_1E", {
                        // required: "Please fill this field",
                      })}
                    />
                    {/* {errors?.["why_5M_1E"] && (
                      <p className="text-error">{errors?.["why_5M_1E"]?.message}</p>
                    )} */}
                  </Col>
                </Row>
                <Row className="m-0 border d-flex align-items-center">
                  <Col lg={5}>
                    <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
                      <b>WHERE (Process): </b>
                    </p>
                  </Col>
                  <Col lg={7}>
                    <input
                      type="text"
                      id="where"
                      name="where"
                      className="m-1 mb-2"
                      style={{ width: "350px" }}
                      {...register("where_process", {
                        // required: "Please fill this field",
                      })}
                    />
                    {/* {errors?.["where_process"] && (
                      <p className="text-error">{errors?.["where_process"]?.message}</p>
                    )} */}
                  </Col>
                </Row>
                <Row className="m-0 border d-flex align-items-center">
                  <Col lg={5}>
                    <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
                      <b>WHEN (Frequency): </b>
                    </p>
                  </Col>
                  <Col lg={7}>
                    <input
                      type="text"
                      id="when"
                      name="when"
                      className="m-1 mb-2"
                      style={{ width: "350px" }}
                      {...register("when_frequency", {
                        // required: "Please fill this field",
                      })}
                    />
                    {/* {errors?.["when_frequency"] && (
                      <p className="text-error">{errors?.["when_frequency"]?.message}</p>
                    )} */}
                  </Col>
                </Row>
                <Row className="m-0 border d-flex align-items-center">
                  <Col lg={5}>
                    <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
                      <b>WHO (Person): </b>
                    </p>
                  </Col>
                  <Col lg={7}>
                    <input
                      type="text"
                      id="who"
                      name="who"
                      className="m-1 mb-2"
                      style={{ width: "350px" }}
                      {...register("who_person", {
                        // required: "Please fill this field",
                      })}
                    />
                    {/* {errors?.["who_person"] && (
                      <p className="text-error">{errors?.["who_person"]?.message}</p>
                    )} */}
                  </Col>
                </Row>
                <Row className="m-0 border d-flex align-items-center">
                  <Col lg={5}>
                    <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
                      <b>WHICH (Defect Location): </b>
                    </p>
                  </Col>
                  <Col lg={7}>
                    <input
                      type="text"
                      id="which"
                      name="which"
                      className="m-1 mb-2"
                      style={{ width: "350px" }}
                      {...register("which_defectLocation", {
                        // required: "Please fill this field",
                      })}
                    />
                    {/* {errors?.["which_defectLocation"] && (
                      <p className="text-error">{errors?.["which_defectLocation"]?.message}</p>
                    )} */}
                  </Col>
                </Row>
                <Row className="m-0 border d-flex align-items-center">
                  <Col lg={5}>
                    <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
                      <b>HOW (Detail/ Observation): </b>
                    </p>
                  </Col>
                  <Col lg={7}>
                    <input
                      type="text"
                      id="how"
                      name="how"
                      className="m-1 mb-2"
                      style={{ width: "350px" }}
                      {...register("how_details", {
                        // required: "Please fill this field",
                      })}
                    />
                    {/* {errors?.["how_details"] && (
                      <p className="text-error">{errors?.["how_details"]?.message}</p>
                    )} */}
                  </Col>
                </Row>
              </td>

              <td className="border p-2 col-lg-4 col-md-4 col-sm-12">
                <Row className="m-0">
                  <Col className="border p-2">
                    <FormControl>
                      <FormLabel id="demo-radio-buttons-group-label">
                        <small>
                          <b>SHIFT</b>
                        </small>
                      </FormLabel>

                      {watch("shiftOfBM") && (
                        <RadioGroup
                          row
                          value={watch("shiftOfBM")}
                          // value={"B"}
                          aria-labelledby="demo-radio-buttons-group-label"
                          name="radio-buttons-group"
                        >
                          {plantShiftsData?.map((shiftInfo) => (
                            <FormControlLabel
                              value={shiftInfo.shiftName}
                              control={<Radio color="default" size="small" />}
                              label={shiftInfo.shiftName}
                              disabled={
                                watch("shiftOfBM") !== shiftInfo.shiftName
                              }
                            />
                          ))}
                        </RadioGroup>
                      )}
                    </FormControl>
                  </Col>
                </Row>

                <Row className="m-0">
                  <Col className="border p-2">
                    <small className="mb-0 d-flex align-items-center justify-content-start">
                      <b>QUALITY RELATED</b>&nbsp;&nbsp;&nbsp;
                    </small>
                  </Col>
                  <Col className="border p-2 d-flex align-items-center">
                    <Form>
                      {["radio"].map((type) => (
                        <div key={`inline-${type}`} className="d-block">
                          <Form.Check
                            flex
                            label="Yes"
                            name="group1"
                            type={type}
                            id={`inline-${type}-1`}
                            value="Yes"
                            {...register("qualityRelated", {
                              required: "Please select quality related",
                            })}
                          />
                          <Form.Check
                            flex
                            label="No"
                            name="group1"
                            type={type}
                            id={`inline-${type}-2`}
                            value="No"
                            {...register("qualityRelated", {
                              required: "Please select quality related",
                            })}
                          />
                        </div>
                      ))}
                      {errors?.["qualityRelated"] && (
                        <p className="text-error">
                          {errors?.["qualityRelated"]?.message}
                        </p>
                      )}
                    </Form>
                  </Col>
                </Row>
                <Row className="pt-0 mb-0 m-0">
                  <Col lg={12} className="border pb-2 pt-1">
                    <small className="mb-0">
                      <b>BREAKDOWN ATTENDED BY</b>
                    </small>
                    <br />
                    {/* {selectedAttendee} */}
                  </Col>
                </Row>
              </td>
            </tr>

            <tr>
              <td>
                <button type="submit" className="btn bg-success">
                  Submit Request-Sheet
                </button>
              </td>
            </tr>
          </tbody>
        </Table>
      </form>
    </>
  );
}

export default MyTable;
