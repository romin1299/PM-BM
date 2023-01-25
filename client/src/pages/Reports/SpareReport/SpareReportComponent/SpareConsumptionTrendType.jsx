import React from "react";
import { Container, Row, Col } from "react-bootstrap";

import SpareConsumptionTrendTypeGraph from "./GraphForSpareReports/SpareConsumptionTrendTypeGraph";

const SpareConsumptionTrendType = () => {
  return (
    <div className="p-3 ">
      <Container className="cell">
        <Row>
          <h5 className="d-flex justify-content-center align-items-center m-2">
            Spare Consumption Trend Type
          </h5>
        </Row>

        <Row>
          <Col
            className="d-flex justify-content-center align-items-center m-4"
            style={{ height: "20rem" }}
          >
            <SpareConsumptionTrendTypeGraph />
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default SpareConsumptionTrendType;
