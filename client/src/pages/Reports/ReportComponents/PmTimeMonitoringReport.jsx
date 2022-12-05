import React, { useState, useEffect, useContext } from "react";
import { Row, Col, Container } from "react-bootstrap";

//file imports
import TotalMonthWiseGraph from "./Graph/TotalMonthWiseGraph";
import TotalTimeManHourMonthWise from "./Graph/TotalTimeManHourMonthWise";
import TotalTimeTMWise from "./Graph/TotalTimeTMWise";

import RoutingContext from "../../../context/routing/RoutingContext";

const PmTimeMonitoringReport = () => {
  const context = useContext(RoutingContext);

  return (
    <>
      <div>
        <Container>
          <Row>
            <Col className="pt-3">
              <TotalMonthWiseGraph context={context} />
            </Col>
            <Col className="pt-3">
              <TotalTimeManHourMonthWise context={context} />
            </Col>
          </Row>
          <Row>
            <Col className="pt-3">
              <TotalTimeTMWise context={context} />
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
};

export default PmTimeMonitoringReport;
