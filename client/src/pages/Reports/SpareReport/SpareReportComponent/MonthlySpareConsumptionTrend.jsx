import React, { useState } from "react";
import { Container, Row, Col } from "react-bootstrap";

import MonthlySpareConsumptionTrendGraph from "./GraphForSpareReports/MonthlySpareConsumptionTrendGraph";

import currentYear from "../../../Dashboard/DashboardComponent/currentYear";
import YearDropDown from "../../../Dashboard/DashboardComponent/YearDropDown";

const MonthlySpareConsumptionTrend = ({ lineData }) => {
  const [selectedYear, setSelectedYear] = useState(currentYear);

  return (
    <div className="p-3 ">
      <Container className="cell">
        <Row>
          <h5 className="d-flex justify-content-center align-items-center m-2">
            Monthly Spare Consumption Trend
          </h5>
        </Row>
        <Row className="pt-2 ">
          <Col>
            <Row className="p-2 ">
              <Col sm={12} lg={3}>
                <span>Line:</span>
              </Col>
              <Col>
                <div>
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
                      return (
                        <option value={option._id}>{option.line_name}</option>
                      );
                    })}
                  </select>
                </div>
              </Col>
            </Row>
          </Col>
          <Col>
            <YearDropDown
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
            />
          </Col>
        </Row>

        <Row>
          <Col>
            <MonthlySpareConsumptionTrendGraph />
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default MonthlySpareConsumptionTrend;
