import React from "react";
import { Container, Row, Col } from "react-bootstrap";

import GraphForMonthlySpareConsumptionTrend from "./GraphForSpareReports/GraphForMonthlySpareConsumptionTrend";

const MonthlySpareConsumptionTrend = ({ lineData }) => {
  return (
    <div className="p-3 ">
      <Container className="cell">
        <Row>
          <h5 className="d-flex justify-content-center align-items-center m-2">
            Monthly Spare Consumption Trend
          </h5>
        </Row>
        <Row className="pt-2 ">
          <Col sm={2}>
            <span>Line:</span>
          </Col>
          <Col>
            <select
              class="form-select form-select-sm"
              aria-label=".form-select-sm example"
              style={{ width: "100%" }}
              id="standard-select-currency"
              name="selectedReport"
              // value={selectedReport}
              className="textField"
              // onChange={(e) => {
              //   setSelectedReport(e.target.value);
              // }}
              fullWidth
              select // label="Select"
              autoComplete="off"
              variant="standard"
            >
              <option selected disabled value="">
                Please select
              </option>
              {lineData?.map((option) => {
                return <option value={option._id}>{option.line_name}</option>;
              })}
            </select>
          </Col>
          <Col sm={2}>
            <span>Year:</span>
          </Col>
          <Col>
            <select
              class="form-select form-select-sm"
              aria-label=".form-select-sm example"
              style={{ width: "100%" }}
              id="standard-select-currency"
              name="selectedReport"
              // value={selectedReport}
              className="textField"
              // onChange={(e) => {
              //   setSelectedReport(e.target.value);
              // }}
              fullWidth
              select // label="Select"
              autoComplete="off"
              variant="standard"
            >
              <option selected disabled value="">
                Please select
              </option>
              {[1, 2, 3, 4]?.map((option) => {
                return <option value={option}>{option}</option>;
              })}
            </select>
          </Col>
        </Row>

        <Row>
          <Col>
            <GraphForMonthlySpareConsumptionTrend />
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default MonthlySpareConsumptionTrend;
