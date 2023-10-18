// import React from "react";
// import Table from "react-bootstrap/Table";
import denso_log from "../../../static/images/denso_logo.png";
import { Row, Col, Form } from "react-bootstrap";
import { DropdownButton, Dropdown } from "react-bootstrap";

import React, { useState } from "react";
import { Table } from "react-bootstrap";

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
    <Table bordered>
      <thead>
        <tr>{/* <th colSpan="4">Header with 4 Columns</th> */}</tr>
      </thead>
      <tbody>
        <tr>
          <td width={100}>
            <img
              src={denso_log}
              width="120"
              height="30"
              className="d-inline-block align-top mt-2"
              alt="React Bootstrap logo"
            />
          </td>
          <td colSpan={12}>
            <h2 className="mt-0 d-flex align-items-center justify-content-center">
              MAINTENANCE WORK REQUEST/REPORT
            </h2>
          </td>
        </tr>
        <tr>
          <td className="mb-0 pb-0">
            <p>
              <b>MAINT. TYPE</b>
            </p>
            <Form>
              {["radio"].map((type) => (
                <div key={`inline-${type}`}>
                  <Form.Check
                    flex
                    label="BM"
                    name="group1"
                    type={type}
                    id={`inline-${type}-1`}
                  />
                  <Form.Check
                    flex
                    label="PM"
                    name="group1"
                    type={type}
                    id={`inline-${type}-2`}
                  />
                  <Form.Check
                    flex
                    label="CM"
                    type={type}
                    id={`inline-${type}-3`}
                  />
                  <Form.Check
                    flex
                    label="TPM"
                    type={type}
                    id={`inline-${type}-3`}
                  />
                </div>
              ))}
            </Form>
          </td>
          <td style={{ width: "15%" }} className="mb-0 pb-0">
            <p>
              <b>PRIORITY CODE</b>
            </p>
            <Form>
              {["radio"].map((type) => (
                <div key={`inline-${type}`}>
                  <Form.Check
                    flex
                    label="EMERGENCY"
                    name="group1"
                    type={type}
                    id={`inline-${type}-1`}
                  />
                  <Form.Check
                    flex
                    label="IMPORTANT"
                    name="group1"
                    type={type}
                    id={`inline-${type}-2`}
                  />
                  <Form.Check
                    flex
                    label="DATA NEEDED"
                    type={type}
                    id={`inline-${type}-3`}
                  />
                  <Form.Check
                    flex
                    label="KAIZEN"
                    type={type}
                    id={`inline-${type}-3`}
                  />
                </div>
              ))}
            </Form>
          </td>
          <td colSpan={9} style={{ width: "50%" }} className="mb-0 pb-0">
            <div className="mb-2">
              <h5 className="text-center border p-1">
                <strong>REQUEST SHEET ( To be filled by PRD)</strong>
              </h5>
              <p className="text-left border p-1 mb-2">
                <b>REQUEST No.</b> <span>Req-123</span>
              </p>
              <Row className="m-0">
                <Col className="border">
                  <Row>
                    <p className="border border-left-0 border-right-0 border-top-0 text-center m-0">
                      Problem Occurred
                    </p>
                    <div className="d-flex align-items-center justify-content-center mt-1 mb-1">
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
                  </Row>
                </Col>
                <Col className="border">
                  <Row>
                    <p className="border border-left-0 border-right-0 border-top-0 text-center m-0">
                      Sheet Issued
                    </p>
                    <div className="d-flex align-items-center justify-content-center mt-1 mb-1">
                      <div className="text-center">
                        <p className="mb-0">
                          <b>Date: </b>
                          <br />
                          17/10/2023
                        </p>
                      </div>{" "}
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                      <div className="text-center">
                        <p className="mb-0">
                          <b>Time: </b>
                          <br />
                          09:22 AM
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
              <Col lg={4} md={4} sm={4} xs={4} className="border">
                <p className="mb-0">
                  <b>Sr. No.</b>
                </p>
                <p className="fs-6 fw-normal">123</p>
              </Col>
              <Col lg={4} md={4} sm={4} xs={4} className="border">
                <p className="mb-0">
                  <b>Month</b>
                </p>
                <p className="fs-6 fw-normal">Jan</p>
              </Col>
              <Col lg={4} md={4} sm={4} xs={4} className="border">
                <p className="mb-0">
                  <b>Year</b>
                </p>
                <p className="fs-6 fw-normal">2023</p>
              </Col>
            </Row>
            <Row className="pt-0 mb-0 " style={{ marginLeft: "-8px" }}>
              <Col lg={6} className="border pb-2 pt-1">
                <p className="mb-0">Dept./Line</p>
                <input
                  type="text"
                  id="Dept"
                  name="deptname"
                  style={{ width: "100%" }}
                />
              </Col>
              <Col lg={6} className="border pb-2 pt-1">
                <p className="fs-6 mb-0">TL [PRD]</p>
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
              <Col className="border">
                <p className="mb-0">
                  <b>Machine Name:</b> ABC
                </p>
              </Col>
              <Col className="border">
                <p className="mb-0">
                  <b>Machine No.:</b> Machine1
                </p>
              </Col>
            </Row>
            <Row className="m-0">
              <Col className="border">
                <Row className="d-flex align-items-center justify-content-center">
                  <Col>
                    <p className="mb-0" style={{ fontSize: "12px" }}>
                      <b>Problem faced: </b>
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
                      <b>
                        PRD OBSERVATION FOR THIS PROBLEM BASED ON (5WHY-1HOW){" "}
                      </b>
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
                      <b>WHY (5M+1E): </b>
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
                      <b>WHERE (Process): </b>
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
                      <b>WHEN (Frequency): </b>
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
                      <b>WHO (Person): </b>
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
                      <b>WHICH (Defect Location): </b>
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
                      <b>HOW (Detail/ Observation): </b>
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
                <p className="mb-0 d-flex align-items-center">
                  <b>Shift</b>&nbsp;&nbsp;&nbsp;
                  <DropdownButton
                    id="dropdown-basic-button"
                    variant="secondary"
                    className="floatRight"
                    onSelect={handleSelect}
                    title={selected?.key || list[0].key}
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
            <Row className="pt-0 mb-0 m-0">
              <Col lg={12} className="border pb-2 pt-1">
                <p className="mb-0">
                  <b>BREAKDOWN ATTENDED BY</b>
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
      </tbody>
    </Table>
  );
}

export default MyTable;
