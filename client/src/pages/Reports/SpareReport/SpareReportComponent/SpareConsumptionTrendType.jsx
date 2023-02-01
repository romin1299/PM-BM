import React, {useState, useEffect} from "react";
import { Container, Row, Col } from "react-bootstrap";
import currentYear from "../../../Dashboard/DashboardComponent/currentYear";

import SpareConsumptionTrendTypeGraph from "./GraphForSpareReports/SpareConsumptionTrendTypeGraph";

const SpareConsumptionTrendType = ({context}) => {
  const [graphData, setGraphData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const postSectionToGetAllDataForLineWiseSpareConsumption = async () => {
    try {
      const res = await fetch(
        "/postSectionToGetAllDataForLineWiseSpareConsumption",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            section: context.section_data,
            selectedYear,
          }),
        }
      );
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // console.log(data);
        setGraphData(data?.lineWiseSpareCost);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    postSectionToGetAllDataForLineWiseSpareConsumption();
  }, []);
console.log(graphData)
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
            <SpareConsumptionTrendTypeGraph graphData={graphData} />
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default SpareConsumptionTrendType;
