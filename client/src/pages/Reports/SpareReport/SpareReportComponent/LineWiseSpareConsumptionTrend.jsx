import React from "react";
import { Container, Row, Col } from "react-bootstrap";

import LineWiseSpareConsumptionTrendGraph from "./GraphForSpareReports/LineWiseSpareConsumptionTrendGraph";

const LineWiseSpareConsumptionTrend = ({ lineData }) => {
  return (
    <div className="p-3 ">
      <Container className="cell">
        <Row>
          <h5 className="d-flex justify-content-center align-items-center m-2">
            Line Wise Spare Consumption Trend
          </h5>
        </Row>
        <Row>
          <Col
          // style={{ height: "25rem" }}
          >
            <LineWiseSpareConsumptionTrendGraph lineData={lineData} />
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default LineWiseSpareConsumptionTrend;
