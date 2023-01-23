import React, { useState, useEffect, useContext } from "react";
import { Row, Col, Container } from "react-bootstrap";

import MachineWisePmMonthlyReport from "./ReportComponents/MachineWisePmMonthlyReport";
import LineWisePmMonthlyReport from "./ReportComponents/LineWisePmMonthlyReport";
import AnnualPmStatus from "./ReportComponents/AnnualPmStatus";
import AnnualPMSchedule from "./ReportComponents/AnnualPMSchedule";
import PmTimeMonitoringReport from "./ReportComponents/PmTimeMonitoringReport";

const PmAllReportDashboard = () => {
  const ReportType = [
    "Monthly PM Status(Machine)",
    "Monthly PM Status(Line)",
    "Annual PM Status",
    "Annual PM Schedule",
    // "Machine Monthly PM Indicator",
    "PM Time Monitoring",
    // "Open Pm Point",
    // "PM Status of Line",
    // "Audit Trail",
  ];

  const [selectedReport, setSelectedReport] = useState(ReportType[0]);
  return (
    <>
      <div>
        <Container fluid>
          <Row className="pt-2 ">
            <Col sm={12} lg={3}>
              <span><b>Month Wise PM Status:</b></span>
            </Col>
            <Col sm={12} lg={3}>
              <div>
                <select
                  class="form-select form-select-sm"
                  aria-label=".form-select-sm example"
                  style={{ width: "100%" }}
                  id="standard-select-currency"
                  name="selectedReport"
                  value={selectedReport}
                  className="textField"
                  onChange={(e) => {
                    setSelectedReport(e.target.value);
                  }}
                  fullWidth
                  select // label="Select"
                  autoComplete="off"
                  variant="standard"
                >
                  <option selected disabled value="">
                    Please select
                  </option>
                  {ReportType?.map((option) => {
                    return <option value={option}>{option}</option>;
                  })}
                </select>
              </div>
            </Col>
          </Row>
        </Container>

        {selectedReport === ReportType[0] ? (
          <MachineWisePmMonthlyReport />
        ) : selectedReport === ReportType[1] ? (
          <LineWisePmMonthlyReport />
        ) : selectedReport === ReportType[2] ? (
          <AnnualPmStatus />
        ) : selectedReport === ReportType[3] ? (
          <AnnualPMSchedule />
        ) : selectedReport === ReportType[4] ? (
          <PmTimeMonitoringReport />
        ) : (
          <h4>Other Report</h4>
        )}
      </div>
    </>
  );
};

export default PmAllReportDashboard;
