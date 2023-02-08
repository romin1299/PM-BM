import React, { useState, useEffect, useContext } from "react";
import { Row, Col, Container } from "react-bootstrap";

//file imports
import TotalMonthWiseGraph from "./Graph/TotalMonthWiseGraph";
import TotalTimeManHourMonthWise from "./Graph/TotalTimeManHourMonthWise";
import TotalTimeTMWise from "./Graph/TotalTimeTMWise";

import RoutingContext from "../../../context/routing/RoutingContext";
import Footer from "../../../components/Footer/Footer";

const PmTimeMonitoringReport = () => {
  const context = useContext(RoutingContext);

  return (
    <>
      <div>
        <Container fluid>
          <Row>
            <Col sm={12} md={12} lg={6} className=" mt-3">
              <TotalMonthWiseGraph context={context} />
            </Col>
            <Col sm={12} md={12} lg={6} className=" mt-3">
              <TotalTimeManHourMonthWise context={context} />
            </Col>
          </Row>
          <Row>
            <Col sm={12} md={12} lg={6}className=" mt-3">
              <TotalTimeTMWise context={context} />
            </Col>
            {/* <Col></Col> */}
          </Row>
        </Container>
        <Footer/>
      </div>
    </>
  );
};

export default PmTimeMonitoringReport;
