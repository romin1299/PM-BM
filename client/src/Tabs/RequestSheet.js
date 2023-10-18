// import React from "react";
// import Table from "react-bootstrap/Table";
import denso_log from "../static/images/denso_logo.png";
import { Row, Col, Form } from "react-bootstrap";

import React, { useState } from "react";
import { Table } from "react-bootstrap";
import { useForm } from "react-hook-form";

function MyTable() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    // reset,
  } = useForm();

  const [selectedMaintenanceType, setSelectedMaintenanceType] = useState(""); // Initialize with an empty string or default value

  const handleMaintenanceType = (event) => {
    setSelectedMaintenanceType(event.target.value);
  };

  const newRequestSheetRegistration = async (requestSheetData) => {
    const machineRef = "63b67ccea716e21c95cd471a";
    requestSheetData.maintenanceType = selectedMaintenanceType;
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

  return (
    <form onSubmit={handleSubmit(newRequestSheetRegistration)}>
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
          <td className="mb-0 pb-0">
            <p>MAINT. TYPE</p>
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
          <td style={{ width: "20%" }} className="mb-0 pb-0">
            <p>PRIORITY CODE (MARK CIRCLE)</p>
            <ol className="fs-6 fw-normal">
              <li>EMERGENCY</li>
              <li>IMPORTANT</li>
              <li>DATA NEEDED</li>
              <li>KAIZEN</li>
            </ol>
          </td>
          <td colSpan={9} style={{ width: "50%" }} className="mb-0 pb-0">
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
              <Col lg={4} className="border">
                <p className="mb-0">
                  <b>Sr. No.</b>
                </p>
                <p className="fs-6 fw-normal">
                  <input
                    style={{ width: "80px" }}
                    {...register("serialNo", {
                      required: "Serial No. is required",
                    })}
                  />
                  {errors?.["serialNo"] && (
                    <p>{errors?.["serialNo"]?.message}</p>
                  )}
                </p>
              </Col>
              <Col lg={8} className="border">
                {/* <p className="mb-0">
                  <b>Month</b>
                </p>
                <p className="fs-6 fw-normal">Jan</p> */}
                {/* </Col>
              <Col lg={4} className="border"> */}
                {/* <p className="mb-0">
                  <b>Year</b>
                </p>
                <p className="fs-6 fw-normal">2023</p> */}
              </Col>
            </Row>
            <Row className="pt-0 mb-0 " style={{ marginLeft: "-8px" }}>
              <Col lg={6} className="border pb-2 pt-1">
                <p className="mb-0">Dept./Line</p>
                <input
                  style={{ width: "100px" }}
                  {...register("deptname", {
                    required: "Department/Line Name is required",
                  })}
                />
                {errors?.["deptname"] && <p>{errors?.["deptname"]?.message}</p>}
              </Col>
              <Col lg={6} className="border pb-2 pt-1">
                <p className="fs-6 mb-0">TL [PRD]</p>
                <input
                  style={{ width: "100px" }}
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
          <td colSpan={12}>
            <Row className="m-0">
              <Col className="border">
                <p className="mb-0">
                  <b>Machine Name:</b>{" "}
                  <input
                    id="Mach"
                    name="machinename"
                    className="m-1"
                    style={{ width: "350px" }}
                    {...register("machineName", {
                      required: "Machine Name is required",
                    })}
                  />
                  {errors?.["machineName"] && (
                    <p>{errors?.["machineName"]?.message}</p>
                  )}
                </p>
              </Col>
              <Col className="border">
                <p className="mb-0">
                  <b>Machine No.:</b>
                  <input
                    id="Mach"
                    name="machineno"
                    className="m-1"
                    style={{ width: "350px" }}
                    {...register("machineNo", {
                      required: "Machine No is required",
                    })}
                  />
                  {errors?.["machineNo"] && (
                    <p>{errors?.["machineNo"]?.message}</p>
                  )}
                </p>
              </Col>
            </Row>
            <Row className="m-0">
              <Col className="border">
                <p className="mb-0">
                  <b>Problem faced: </b>
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
                </p>
              </Col>
            </Row>
            <Row className="m-0">
              <Col className="border">
                <p className="mb-0">
                  <b>PRD OBSERVATION FOR THIS PROBLEM BASED ON (5WHY-1HOW) </b>
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
                </p>
              </Col>
            </Row>
            <Row className="m-0">
              <Col className="border">
                <p className="mb-0">
                  <b>WHY (5M+1E): </b>
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
                </p>
              </Col>
            </Row>
            <Row className="m-0">
              <Col className="border">
                <p className="mb-0">
                  <b>WHERE (Process): </b>
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
                </p>
              </Col>
            </Row>
            <Row className="m-0">
              <Col className="border">
                <p className="mb-0">
                  <b>WHEN (Frequency): </b>
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
                </p>
              </Col>
            </Row>
            <Row className="m-0">
              <Col className="border">
                <p className="mb-0">
                  <b>WHO (Person): </b>
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
                </p>
              </Col>
            </Row>
            <Row className="m-0">
              <Col className="border">
                <p className="mb-0">
                  <b>WHICH (Defect Location): </b>
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
                </p>
              </Col>
            </Row>
            <Row className="m-0">
              <Col className="border">
                <p className="mb-0">
                  <b>HOW (Detail/ Observation): </b>
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
                </p>
              </Col>
            </Row>
          </td>

          <td>Row 2, Cell 4</td>
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
    </form>
  );
}

export default MyTable;
