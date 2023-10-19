// import React from "react";
// import Table from "react-bootstrap/Table";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import denso_log from "../../../static/images/denso_logo.png";
import { Row, Col, Form } from "react-bootstrap";
import { DropdownButton, Dropdown } from "react-bootstrap";

import { Table } from "react-bootstrap";

const list = [
  { key: "A", value: "A" },
  { key: "B", value: "B" },
  { key: "C", value: "C" },
  { key: "D", value: "D" },
];

function MyTable() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    // reset,
  } = useForm();

  const [selectedShift, setSelectedShift] = useState({});
  const [selectedMaintenanceType, setSelectedMaintenanceType] = useState("");
  const [selectedPriorityCode, setSelectedPriorityCode] = useState("");
  const [selectedQuality, setSelectedQuality] = useState("");

  const handleSelectShift = (key, event) => {
    setSelectedShift({ key, value: event.target.value });
  };

  const handleMaintenanceType = (event) => {
    setSelectedMaintenanceType(event.target.value);
  };
  const handlePriorityCode = (event) => {
    setSelectedPriorityCode(event.target.value);
  };
  const handleQuality = (event) => {
    setSelectedQuality(event.target.value);
  };

  const newRequestSheetRegistration = async (requestSheetData) => {
    const machineRef = "63b67ccea716e21c95cd471a";
    requestSheetData.maintenanceType = selectedMaintenanceType;
    requestSheetData.priorityCode = selectedPriorityCode;
    requestSheetData.qualityRelated = selectedQuality;
    requestSheetData.shiftOfBM = selectedShift.key;
    try {
      const res = await fetch(
        `/newRequestSheetRegistration/?machineRef=${machineRef}`,
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
  const getMachineDetails = async () => {
    const machineRef = "63b67ccea716e21c95cd471a";

    try {
      const res = await fetch(
        `/getMachineDetailsOnScanningRequest/?machineRef=${machineRef}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );
      const { machine } = await res.json();
      // setMachine(machine);

      console.log(machine);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getMachineDetails();
  }, []);

  return (
    <form onSubmit={handleSubmit(newRequestSheetRegistration)}>
      <Table>
        <thead>
          <tr>
            <th colSpan="4">Header with 4 Columns</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td width={100}>
              <img
                src={denso_log}
                width="120"
                height="30"
                className="d-inline-block align-top"
                alt="React Bootstrap logo"
              />
            </td>
            <td colSpan={12}>
              <h2 className="d-flex align-items-center justify-content-center">
                MAINTENANCE WORK REQUEST/REPORT
              </h2>
            </td>
          </tr>
          <tr>
            <td className="mb-0 pb-0 border">
              <p>
                <b>MAINT. TYPE</b>
              </p>
              <Form>
                <div key={`inline-radio`}>
                  <Form.Check
                    flex
                    label="BM"
                    name="group1"
                    type="radio"
                    id={`inline-radio-1`}
                    value="BM"
                    onChange={handleMaintenanceType}
                    checked={selectedMaintenanceType === "BM"}
                  />
                  <Form.Check
                    flex
                    label="PM"
                    name="group1"
                    type="radio"
                    id={`inline-radio-2`}
                    value="PM"
                    onChange={handleMaintenanceType}
                    checked={selectedMaintenanceType === "PM"}
                  />
                  <Form.Check
                    flex
                    label="CM"
                    type="radio"
                    id={`inline-radio-3`}
                    value="CM"
                    onChange={handleMaintenanceType}
                    checked={selectedMaintenanceType === "CM"}
                  />
                  <Form.Check
                    flex
                    label="TPM"
                    type="radio"
                    id={`inline-radio-4`}
                    value="TPM"
                    onChange={handleMaintenanceType}
                    checked={selectedMaintenanceType === "TPM"}
                  />
                </div>
              </Form>
            </td>
            <td style={{ width: "20%" }} className="mb-0 pb-0 border">
              <p>
                {" "}
                <b>PRIORITY CODE</b>
              </p>
              <Form>
                <div key={`inline-radio`}>
                  <Form.Check
                    flex
                    label="EMERGENCY"
                    name="group1"
                    type="radio"
                    id={`inline-radio-1`}
                    value="EMERGENCY"
                    onChange={handlePriorityCode}
                    checked={selectedPriorityCode === "EMERGENCY"}
                  />
                  <Form.Check
                    flex
                    label="IMPORTANT"
                    name="group1"
                    type="radio"
                    id={`inline-radio-2`}
                    value="IMPORTANT"
                    onChange={handlePriorityCode}
                    checked={selectedPriorityCode === "IMPORTANT"}
                  />
                  <Form.Check
                    flex
                    label="DATA NEEDED"
                    type="radio"
                    id={`inline-radio-3`}
                    value="DATA NEEDED"
                    onChange={handlePriorityCode}
                    checked={selectedPriorityCode === "DATA NEEDED"}
                  />
                  <Form.Check
                    flex
                    label="KAIZEN"
                    type="radio"
                    id={`inline-radio-4`}
                    value="KAIZEN"
                    onChange={handlePriorityCode}
                    checked={selectedPriorityCode === "KAIZEN"}
                  />
                </div>
              </Form>
            </td>
            <td
              colSpan={9}
              style={{ width: "50%" }}
              className="mb-0 pb-0 border"
            >
              <div className="mb-2">
                <h6 className="text-center border p-1">
                  <b>REQUEST SHEET ( To be filled by PRD)</b>
                </h6>
                <p className="text-left border p-1 mb-2">
                  <b>REQUEST No.</b>{" "}
                  <input
                    {...register("requestSheetNoOfBM", {
                      required: "RequestSheet no is required",
                    })}
                  />
                  {errors?.["requestSheetNoOfBM"] && (
                    <p>{errors?.["requestSheetNoOfBM"]?.message}</p>
                  )}
                </p>
                <Row className="m-0">
                  <Col className="border">
                    <Row>
                      <p className="border border-right-0 text-center m-0">
                        Problem Occurred
                      </p>
                      <div className="d-flex align-items-center justify-content-center mt-1 mb-1">
                        <div className="text-center">
                          <p className="mb-0">
                            <b>Date: </b>

                            <input
                              type="date"
                              {...register("requestSheetdate", {
                                required: "RequestSheet date is required",
                              })}
                            />
                            {errors?.["requestSheetdate"] && (
                              <p>{errors?.["requestSheetdate"]?.message}</p>
                            )}
                          </p>
                        </div>{" "}
                        &nbsp;&nbsp;&nbsp;&nbsp;
                        <div className="text-center">
                          <p className="mb-0">
                            <b>Time: </b>

                            <input
                              type="time"
                              {...register("requestSheettime", {
                                required: "RequestSheet time is required",
                              })}
                            />
                            {errors?.["requestSheettime"] && (
                              <p>{errors?.["requestSheettime"]?.message}</p>
                            )}
                          </p>
                        </div>
                      </div>
                    </Row>
                  </Col>
                  <Col className="border">
                    <Row>
                      <p className="border border-left-0 text-center m-0">
                        Sheet Issued
                      </p>
                      <div className="d-flex align-items-center justify-content-center mt-1 mb-1">
                        <div className="text-center">
                          <p className="mb-0">
                            <b>Date: </b>
                            <br />
                            <input
                              type="date"
                              {...register("sheetIssuedDate", {
                                required: "Sheet Issued date is required",
                              })}
                            />
                            {errors?.["sheetIssuedDate"] && (
                              <p>{errors?.["sheetIssuedDate"]?.message}</p>
                            )}
                          </p>
                        </div>{" "}
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        <div className="text-center">
                          <p className="mb-0">
                            <b>Time: </b>
                            <br />
                            <input
                              type="time"
                              {...register("sheetIssuedTime", {
                                required: "Sheet Issued time is required",
                              })}
                            />
                            {errors?.["sheetIssuedTime"] && (
                              <p>{errors?.["sheetIssuedTime"]?.message}</p>
                            )}
                          </p>
                        </div>
                      </div>
                    </Row>
                  </Col>
                </Row>
              </div>
            </td>

            <td colSpan={2} className="mb-0 pb-0 pt-0">
              <Row className="pt-0 pb-0" style={{ marginLeft: "-8px" }}>
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
                      <p>{errors?.["serialNo"]?.message}</p>
                    )}
                  </p>
                </Col>
              </Row>
              <Row className="pt-0 mb-0 " style={{ marginLeft: "-8px" }}>
                <Col lg={6} className="border pb-2 pt-1">
                  <p className="mb-0">Dept./Line</p>
                  <input
                    style={{ width: "100%" }}
                    {...register("deptname", {
                      required: "Department/Line Name is required",
                    })}
                  />
                  {errors?.["deptname"] && (
                    <p>{errors?.["deptname"]?.message}</p>
                  )}
                </Col>
                <Col lg={6} className="border pb-2 pt-1">
                  <p className="fs-6 mb-0">TL [PRD]</p>
                  <input
                    style={{ width: "100%" }}
                    {...register("TLName", {
                      required: "Team Leader Name is required",
                    })}
                  />
                  {errors?.["TLName"] && <p>{errors?.["TLName"]?.message}</p>}
                </Col>
              </Row>
            </td>
          </tr>
          <tr>
            <td className="border" colSpan={8}>
              <Row className="m-0 border d-flex align-items-center">
                <Col lg={2}>
                  <p className="mb-0">
                    <b>Machine Name:</b>{" "}
                  </p>
                </Col>
                <Col lg={3}>
                  <input
                    id="Mach"
                    name="machinename"
                    className="m-1"
                    style={{ width: "100%" }}
                    {...register("machineName", {
                      required: "Machine Name is required",
                    })}
                  />
                  {errors?.["machineName"] && (
                    <p>{errors?.["machineName"]?.message}</p>
                  )}
                </Col>
                <Col lg={2}>
                  <p className="mb-0">
                    <b>Machine No.:</b>
                  </p>
                </Col>
                <Col lg={3}>
                  <input
                    id="Mach"
                    name="machineno"
                    className="m-1"
                    style={{ width: "100%" }}
                    {...register("machineNo", {
                      required: "Machine No is required",
                    })}
                  />
                  {errors?.["machineNo"] && (
                    <p>{errors?.["machineNo"]?.message}</p>
                  )}
                </Col>
              </Row>
              <Row className="m-0 border d-flex align-items-center">
                <Col lg={5}>
                  <p className="mb-0" style={{ fontSize: "12px" }}>
                    <b>Problem faced: </b>
                  </p>
                </Col>
                <Col lg={7}>
                  <input
                    type="text"
                    id="prob"
                    name="problemfaced"
                    className="m-1"
                    style={{ width: "350px" }}
                    {...register("problemFaced", {
                      required: "This field is required",
                    })}
                  />
                  {errors?.["problemFaced"] && (
                    <p>{errors?.["problemFaced"]?.message}</p>
                  )}
                </Col>
              </Row>
              <Row className="m-0 border d-flex align-items-center">
                <Col lg={5}>
                  <p className="mb-0" style={{ fontSize: "12px" }}>
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
                    className="m-1"
                    style={{ width: "350px" }}
                    {...register("PRD_ObservationForProblem_5Why_1How", {
                      required: "This field is required",
                    })}
                  />
                  {errors?.["PRD_ObservationForProblem_5Why_1How"] && (
                    <p>
                      {errors?.["PRD_ObservationForProblem_5Why_1How"]?.message}
                    </p>
                  )}
                </Col>
              </Row>
              <Row className="m-0 border d-flex align-items-center">
                <Col lg={5}>
                  <p className="mb-0" style={{ fontSize: "12px" }}>
                    <b>WHY (5M+1E): </b>
                  </p>
                </Col>
                <Col lg={7}>
                  <input
                    type="text"
                    id="why"
                    name="why"
                    className="m-1"
                    style={{ width: "350px" }}
                    {...register("why_5M_1E", {
                      required: "This field is required",
                    })}
                  />
                  {errors?.["why_5M_1E"] && (
                    <p>{errors?.["why_5M_1E"]?.message}</p>
                  )}
                </Col>
              </Row>
              <Row className="m-0 border d-flex align-items-center">
                <Col lg={5}>
                  <p className="mb-0" style={{ fontSize: "12px" }}>
                    <b>WHERE (Process): </b>
                  </p>
                </Col>
                <Col lg={7}>
                  <input
                    type="text"
                    id="where"
                    name="where"
                    className="m-1"
                    style={{ width: "350px" }}
                    {...register("where_process", {
                      required: "This field is required",
                    })}
                  />
                  {errors?.["where_process"] && (
                    <p>{errors?.["where_process"]?.message}</p>
                  )}
                </Col>
              </Row>
              <Row className="m-0 border d-flex align-items-center">
                <Col lg={5}>
                  <p className="mb-0" style={{ fontSize: "12px" }}>
                    <b>WHEN (Frequency): </b>
                  </p>
                </Col>
                <Col lg={7}>
                  <input
                    type="text"
                    id="when"
                    name="when"
                    className="m-1"
                    style={{ width: "350px" }}
                    {...register("when_frequency", {
                      required: "This field is required",
                    })}
                  />
                  {errors?.["when_frequency"] && (
                    <p>{errors?.["when_frequency"]?.message}</p>
                  )}
                </Col>
              </Row>
              <Row className="m-0 border d-flex align-items-center">
                <Col lg={5}>
                  <p className="mb-0" style={{ fontSize: "12px" }}>
                    <b>WHO (Person): </b>
                  </p>
                </Col>
                <Col lg={7}>
                  <input
                    type="text"
                    id="who"
                    name="who"
                    className="m-1"
                    style={{ width: "350px" }}
                    {...register("who_person", {
                      required: "This field is required",
                    })}
                  />
                  {errors?.["who_person"] && (
                    <p>{errors?.["who_person"]?.message}</p>
                  )}
                </Col>
              </Row>
              <Row className="m-0 border d-flex align-items-center">
                <Col lg={5}>
                  <p className="mb-0" style={{ fontSize: "12px" }}>
                    <b>WHICH (Defect Location): </b>
                  </p>
                </Col>
                <Col lg={7}>
                  <input
                    type="text"
                    id="which"
                    name="which"
                    className="m-1"
                    style={{ width: "350px" }}
                    {...register("which_defectLocation", {
                      required: "This field is required",
                    })}
                  />
                  {errors?.["which_defectLocation"] && (
                    <p>{errors?.["which_defectLocation"]?.message}</p>
                  )}
                </Col>
              </Row>
              <Row className="m-0 border d-flex align-items-center">
                <Col lg={5}>
                  <p className="mb-0" style={{ fontSize: "12px" }}>
                    <b>HOW (Detail/ Observation): </b>
                  </p>
                </Col>
                <Col lg={7}>
                  <input
                    type="text"
                    id="how"
                    name="how"
                    className="m-1"
                    style={{ width: "350px" }}
                    {...register("how_details", {
                      required: "This field is required",
                    })}
                  />
                  {errors?.["how_details"] && (
                    <p>{errors?.["how_details"]?.message}</p>
                  )}
                </Col>
              </Row>
            </td>

            <td colSpan={4} className="border">
              <Row className="m-0">
                <Col className="border p-2">
                  <p className="mb-0 d-flex align-items-center">
                    <b>Shift</b>&nbsp;&nbsp;&nbsp;
                    <DropdownButton
                      id="dropdown-basic-button"
                      variant="secondary"
                      className="floatRight"
                      onSelect={handleSelectShift}
                      title={selectedShift?.key || list[0].key}
                    >
                      {list.map((item, index) => {
                        return (
                          <Dropdown.Item key={index} eventKey={item.key}>
                            {item.value}
                          </Dropdown.Item>
                        );
                      })}
                    </DropdownButton>
                  </p>
                </Col>
              </Row>
              <Row className="m-0">
                <Col className="border p-2">
                  <p className="mb-0 d-flex align-items-center justify-content-start">
                    <b>Quality Related</b>&nbsp;&nbsp;&nbsp;
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
                          id={`inline-${type}-1`}
                          value="Yes"
                          onChange={handleQuality}
                          checked={selectedQuality === "Yes"}
                        />
                        <Form.Check
                          flex
                          label="No"
                          name="group1"
                          type={type}
                          id={`inline-${type}-2`}
                          value="No"
                          onChange={handleQuality}
                          checked={selectedQuality === "No"}
                        />
                      </div>
                    ))}
                  </Form>
                </Col>
              </Row>
              <Row className="pt-0 mb-0 m-0">
                <Col lg={12} className="border pb-2 pt-1">
                  <p className="mb-0">
                    <b>BREAKDOWN ATTENDED BY</b>
                  </p>
                  <input
                    id="Break"
                    type="text"
                    name="breakdownAttended"
                    style={{ width: "100%" }}
                    {...register("breakDownAttendedBy", {
                      required: "This field is required",
                    })}
                  />
                  {errors?.["breakDownAttendedBy"] && (
                    <p>{errors?.["breakDownAttendedBy"]?.message}</p>
                  )}
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
