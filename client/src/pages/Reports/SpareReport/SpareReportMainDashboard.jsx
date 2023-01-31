import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col } from "react-bootstrap";

import {
  MonthlySpareConsumptionTrend,
  Top20MachineSparePartConsumption,
  LineWiseSpareConsumptionTrend,
  SpareConsumptionTrendType,
} from "./SpareReportComponent/FileExports";

import RoutingContext from "../../../context/routing/RoutingContext";

const SpareReportMainDashboard = () => {
  const context = useContext(RoutingContext);

  const [lineData, setLineData] = useState([]);

  const postSectionToGetAllDataForMainDashboard = async () => {
    // setSubSection(undefined);
    try {
      const res = await fetch("/postSectionToGetLineData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section: context.section_data,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // console.log(data);
        setLineData(data?.lineData);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    postSectionToGetAllDataForMainDashboard();
  }, []);

  return (
    <>
      <Container fluid>
        <Row>
          <Col>
            <MonthlySpareConsumptionTrend lineData={lineData} context={context} />
          </Col>
          <Col>
            <Top20MachineSparePartConsumption context={context}/>
          </Col>
        </Row>

        <Row className="d-flex justify-content-center align-items-center">
          <Col>
            <LineWiseSpareConsumptionTrend lineData={lineData} context={context} />
          </Col>
          <Col
            // className="d-flex justify-content-center align-items-center"
            sm={4}
          >
            <SpareConsumptionTrendType context={context}/>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default SpareReportMainDashboard;
