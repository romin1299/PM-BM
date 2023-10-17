// import React from "react";
// import Table from "react-bootstrap/Table";
import denso_log from "../static/images/denso_logo.png";
import { Row, Col, Form } from "react-bootstrap";


import React from "react";
import { Table } from "react-bootstrap";

function MyTable() {
  return (
    <Table bordered>
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
                <b>REQUEST No.</b> <span>Req-123</span>
              </p>
              <Row className="m-0">
                <Col className="border">
                  <Row>
                    <p className="border border-right-0 text-center m-0">Problem Occurred</p>
                    <div className="d-flex align-items-center justify-content-center mt-1 mb-1">
                      <div className="text-center">
                        <p className="mb-0">
                          <b>Date: </b>
                          
                          <input type="date" id="date" name="date"/>
                        </p>
                      </div>{" "}
                      &nbsp;&nbsp;&nbsp;&nbsp;
                      <div className="text-center">
                        <p className="mb-0">
                          <b>Time: </b>
                          
                          <input type="time" id="time" name="time"/>
                        </p>
                      </div>
                    </div>
                  </Row>
                </Col>
                <Col className="border">
                  <Row>
                    <p className="border border-left-0 text-center m-0">Sheet Issued</p>
                    <div className="d-flex align-items-center justify-content-center mt-1 mb-1">
                      <div className="text-center">
                        <p className="mb-0">
                          <b>Date: </b>
                          <br/>
                          17/10/2023
                        </p>
                      </div>{" "}
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                      <div className="text-center">
                        <p className="mb-0">
                          <b>Time: </b>
                          <br/>
                         
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
              <Col lg={4} className="border">
                <p className="mb-0">
                  <b>Sr. No.</b>
                </p>
                <p className="fs-6 fw-normal">123</p>
              </Col>
              <Col lg={4} className="border">
                <p className="mb-0">
                  <b>Month</b>
                </p>
                <p className="fs-6 fw-normal">Jan</p>
              </Col>
              <Col lg={4} className="border">
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
                  style={{ width: "100px" }}
                />
              </Col>
              <Col lg={6} className="border pb-2 pt-1">
                <p className="fs-6 mb-0">TL [PRD]</p>
                <input
                  type="text"
                  id="Dept"
                  name="deptname"
                  style={{ width: "100px" }}
                />
              </Col>
            </Row>
          </td>
        </tr>
        <tr>
          <td colSpan={12}>
            <Row className="m-0">
              <Col className="border"><p className="mb-0"><b>Machine Name:</b> ABC</p></Col>
              <Col className="border"><p className="mb-0"><b>Machine No.:</b> Machine1</p></Col>
            </Row>
            <Row className="m-0">
              <Col className="border"><p className="mb-0"><b>Problem faced: </b> 
              <input
                  type="text"
                  id="Dept"
                  name="deptname"
                  className="m-1"
                  style={{ width: "350px" }}
                />
                </p>
                </Col>
              
            </Row>
            <Row className="m-0">
              <Col className="border"><p className="mb-0"><b>PRD OBSERVATION FOR THIS PROBLEM BASED ON (5WHY-1HOW) </b> 
              <input
                  type="text"
                  id="Dept"
                  name="deptname"
                  className="m-1"
                  style={{ width: "350px" }}
                />
                </p>
                </Col>
              
            </Row>
            <Row className="m-0">
              <Col className="border"><p className="mb-0"><b>WHY (5M+1E): </b> 
              <input
                  type="text"
                  id="Dept"
                  name="deptname"
                  className="m-1"
                  style={{ width: "350px" }}
                />
                </p>
                </Col>
              
            </Row>
            <Row className="m-0">
              <Col className="border"><p className="mb-0"><b>WHERE (Process): </b> 
              <input
                  type="text"
                  id="Dept"
                  name="deptname"
                  className="m-1"
                  style={{ width: "350px" }}
                />
                </p>
                </Col>
              
            </Row>
            <Row className="m-0">
              <Col className="border"><p className="mb-0"><b>WHEN (Frequency): </b> 
              <input
                  type="text"
                  id="Dept"
                  name="deptname"
                  className="m-1"
                  style={{ width: "350px" }}
                />
                </p>
                </Col>
              
            </Row>
            <Row className="m-0">
              <Col className="border"><p className="mb-0"><b>WHO (Person): </b> 
              <input
                  type="text"
                  id="Dept"
                  name="deptname"
                  className="m-1"
                  style={{ width: "350px" }}
                />
                </p>
                </Col>
              
            </Row>
            <Row className="m-0">
              <Col className="border"><p className="mb-0"><b>WHICH (Defect Location): </b> 
              <input
                  type="text"
                  id="Dept"
                  name="deptname"
                  className="m-1"
                  style={{ width: "350px" }}
                />
                </p>
                </Col>
              
            </Row>
            <Row className="m-0">
              <Col className="border"><p className="mb-0"><b>HOW (Detail/ Observation): </b> 
              <input
                  type="text"
                  id="Dept"
                  name="deptname"
                  className="m-1"
                  style={{ width: "350px" }}
                />
                </p>
                </Col>
              
            </Row>
            
          </td>
          
          <td>Row 2, Cell 4</td>
        </tr>
      </tbody>
    </Table>
  );
}

export default MyTable;
