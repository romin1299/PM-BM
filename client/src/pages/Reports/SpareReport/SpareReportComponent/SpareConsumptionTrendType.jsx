import React, { useState, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import currentYear from "../../../Dashboard/DashboardComponent/currentYear";
import LoadingAnimation from "../../ReportComponents/LoadingAnimation";
import SpareConsumptionTrendTypeGraph from "./GraphForSpareReports/SpareConsumptionTrendTypeGraph";
import NotFound from "../../ReportComponents/NotFound";
const SpareConsumptionTrendType = ({ context, selectedSectionOrSubSection }) => {
  const [graphData, setGraphData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [loadingAnimationState, setLoadingAnimationState] = useState(
    <LoadingAnimation />
  );
  const postSectionToGetAllDataForLineWiseSpareConsumption = async (sectionData) => {
    try {
      const res = await fetch(
        "/postSectionToGetAllDataForLineWiseSpareConsumption",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            section: sectionData,
            selectedYear,
          }),
        }
      );
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        setGraphData(data?.lineWiseSpareCost);
        setLoadingAnimationState(<NotFound/>)
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    postSectionToGetAllDataForLineWiseSpareConsumption(selectedSectionOrSubSection || context?.section_data);
  }, [selectedSectionOrSubSection]);
  // console.log(graphData)
  return (
    <div className="pt-3 ">
      <Container fluid>
        <h4 className="mb-3">Spare Consumption Trend Type</h4>
        <Row className="pt-2 cell gy-2">
          <Col
            className="d-flex justify-content-center align-items-center m-4"
            style={{ height: "20rem" }}
          >
            {graphData?.length > 0 ? (
              <SpareConsumptionTrendTypeGraph graphData={graphData} />
            ) : (
              <Col className="d-flex justify-content-center align-items-center mb-2">
                {loadingAnimationState}
              </Col>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default SpareConsumptionTrendType;
