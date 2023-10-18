// import React from "react";
// import Table from "react-bootstrap/Table";
import denso_log from "../../../static/images/denso_logo.png";
import { Row, Col, Form } from "react-bootstrap";
import { DropdownButton, Dropdown } from "react-bootstrap";

import React, { useState } from "react";
import { Table } from "react-bootstrap";
import { AddBoxIcon } from "../../../modules/PageModules";
const list = [
  { key: "A", value: "A" },
  { key: "B", value: "B" },
  { key: "C", value: "C" },
  { key: "D", value: "D" },
];

function MyTable() {
  const [selected, setSelected] = useState({});
  const handleSelect = (key, event) => {
    setSelected({ key, value: event.target.value });
  };
  return (
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
                  id="Dept"
                  name="deptname"
                  style={{ width: "100%" }}
                />
              </Col>
              <Col lg={6} className="border pb-2 pt-1">
                <p className="fs-6 mb-0">
                  <b>MTD T.L.</b>
                </p>
                <input
                  type="text"
                  id="Dept"
                  name="deptname"
                  style={{ width: "100%" }}
                />
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

                            <input type="date" id="date" name="date" />
                          </p>
                        </div>{" "}
                        &nbsp;&nbsp;&nbsp;&nbsp;
                        <div className="text-center">
                          <p className="mb-0">
                            <b>Time: </b>

                            <input type="time" id="time" name="time" />
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

                            <input type="date" id="date" name="date" />
                          </p>
                        </div>{" "}
                        &nbsp;&nbsp;&nbsp;&nbsp;
                        <div className="text-center">
                          <p className="mb-0">
                            <b>Time: </b>

                            <input type="time" id="time" name="time" />
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
                  id="Dept"
                  name="deptname"
                  style={{ width: "100%" }}
                />
              </Col>
              <Col lg={6} className="border pb-2 pt-1">
                <p className="fs-6 mb-0">
                  <b>FEEDBACK</b>
                </p>
                <input
                  type="text"
                  id="Dept"
                  name="deptname"
                  style={{ width: "100%" }}
                />
              </Col>
            </Row>
          </td>
        </tr>

        <tr>
          <td colSpan={8}>
            <Row className="m-0">
              <Col className="border d-flex justify-content-between align-items-lg-center">
                <p className="mb-0">
                  <b>Problem:</b>
                </p>
                <p className="mb-0">
                  <AddBoxIcon />
                </p>
              </Col>
            </Row>
            <Row className="m-0">
              <Col className="border border-top-0">
                <Row className="border">
                  <p className="mb-0" style={{ fontSize: "14px" }}>
                    <b>Problem 1</b>
                  </p>
                </Row>
                <Row className="border">
                  <p className="mb-0" style={{ fontSize: "14px" }}>
                    <b>Problem 1</b>
                  </p>
                </Row>
                <Row className="border">
                  <p className="mb-0" style={{ fontSize: "14px" }}>
                    <b>Problem 1</b>
                  </p>
                </Row>
              </Col>
            </Row>

            <Row className="m-0">
              <Col lg={3} className="border border-top-0 text-center pb-0 pt-2">
                <p className="mb-0" style={{ fontSize: "12px" }}>
                  BREAKDOWN TIME
                </p>
                <p>11:15 AM</p>
              </Col>
              <Col lg={3} className="border border-top-0 text-center pb-0 pt-2">
                <p className="mb-0" style={{ fontSize: "12px" }}>
                  MAINTENANCE TIME
                </p>
                <input
                  type="datetime-local"
                  style={{ width: "100%" }}
                  id="date"
                  name="date"
                />
              </Col>
              <Col lg={3} className="border border-top-0 text-center pb-0 pt-2">
                <p className="mb-0" style={{ fontSize: "12px" }}>
                  QUALITY CHECK TIME
                </p>
                <input
                  type="datetime-local"
                  style={{ width: "100%" }}
                  id="date"
                  name="date"
                />
              </Col>
              <Col lg={3} className="border border-top-0 text-center pb-0 pt-2">
                <p className="mb-0" style={{ fontSize: "12px" }}>
                  BREAK TIME
                </p>
                <input
                  type="datetime-local"
                  style={{ width: "100%" }}
                  id="date"
                  name="date"
                />
              </Col>
            </Row>
            <Row className="m-0">
              <Col className="border">
                <Row className="d-flex align-items-center justify-content-center">
                  <Col>
                    <p className="mb-0" style={{ fontSize: "12px" }}>
                      <b>MAJOR B/D </b>
                    </p>
                  </Col>
                  <Col>
                    <input
                      type="text"
                      id="Dept"
                      name="deptname"
                      className="m-1"
                      style={{ width: "100%", maxWidth: "100%" }}
                    />
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
                    <input
                      type="text"
                      id="Dept"
                      name="deptname"
                      className="m-1"
                      style={{ width: "100%", maxWidth: "100%" }}
                    />
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
                    <input
                      type="text"
                      id="Dept"
                      name="deptname"
                      className="m-1"
                      style={{ width: "100%", maxWidth: "100%" }}
                    />
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
                    <input
                      type="text"
                      id="Dept"
                      name="deptname"
                      className="m-1"
                      style={{ width: "100%", maxWidth: "100%" }}
                    />
                  </Col>
                </Row>
              </Col>
            </Row>
            <Row className="m-0">
              <Col lg={8} className="border d-flex justify-content-between align-items-lg-center">
                <p className="mb-0">
                  <b>ACTION & COUNTERMEASURE STEPS</b>
                </p>
                <p className="mb-0">
                  <AddBoxIcon />
                </p>
              </Col>
              <Col lg={4} className="border d-flex justify-content-between align-items-lg-center">
                <p className="mb-0">
                  <b>Status</b>
                </p>
                <p className="mb-0"></p>
              </Col>
            </Row>
            <Row className="m-0">
              <Col  lg={8} className="border d-flex justify-content-between align-items-lg-center">
                <p className="mb-0">
                  <b>Action 1</b>
                </p>
                
              </Col>
              <Col  lg={4} className="border d-flex justify-content-between align-items-lg-center">
                <p className="mb-0">
                  <b>Status</b>
                </p>
                <p className="mb-0">Edit/Delete</p>
              </Col>
            </Row>
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
                      id="Dept"
                      name="deptname"
                      className="m-1"
                      style={{ width: "100%", maxWidth: "100%" }}
                    />
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
                      id="Dept"
                      name="deptname"
                      className="m-1"
                      style={{ width: "100%", maxWidth: "100%" }}
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
                      id="Dept"
                      name="deptname"
                      className="m-1"
                      style={{ width: "100%", maxWidth: "100%" }}
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
                      id="Dept"
                      name="deptname"
                      className="m-1"
                      style={{ width: "100%", maxWidth: "100%" }}
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
                      id="Dept"
                      name="deptname"
                      className="m-1"
                      style={{ width: "100%", maxWidth: "100%" }}
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
                        id={`inline-${type}-1`}
                      />
                      <Form.Check
                        flex
                        label="No"
                        name="group1"
                        type={type}
                        id={`inline-${type}-2`}
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
                  id="Dept"
                  name="deptname"
                  style={{ width: "100%" }}
                />
              </Col>
              <Col lg={6} className="border pb-2 pt-1">
                <p className="fs-6 mb-0">
                  <b>MTD</b>
                </p>
                <input
                  type="text"
                  id="Dept"
                  name="deptname"
                  style={{ width: "100%" }}
                />
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
                        id={`inline-${type}-1`}
                      />
                      <Form.Check
                        flex
                        label="No"
                        name="group1"
                        type={type}
                        id={`inline-${type}-2`}
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
                        id={`inline-${type}-1`}
                      />
                      <Form.Check
                        flex
                        label="No"
                        name="group1"
                        type={type}
                        id={`inline-${type}-2`}
                      />
                    </div>
                  ))}
                </Form>
              </Col>
            </Row>
          </td>
        </tr>
      </tbody>
    </Table>
  );
}

export default MyTable;
