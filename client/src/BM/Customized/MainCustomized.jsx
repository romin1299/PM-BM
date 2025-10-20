import React, { useContext, useEffect, useState } from "react";
import RequestSheetCustomizedApproval from "./CustomizedApproval/RequestSheetCustomizedApproval";
import ManageCategories from "./CustomizedCategory/ManageCategories";
import { Col, Container, Row } from "react-bootstrap";
import ManageShifts from "./CustomizedShifts/ManageShifts";
import CustomManageShifts from "./CustomizedShifts/CustomManageShifts";
import BMTitlebar from "../Component/BMTitlebar";
import RoutingContext from "../../context/routing/RoutingContext";
import axios from "axios";
import CustomizedMajorBD from "./CustomizedMajorBD.jsx/CustomizedMajorBD";

const MainCustomized = () => {
  const context = useContext(RoutingContext);
  const notEditable = context?.tm_no === Number("9999");

  const userData = useContext(RoutingContext);
  // console.log("userData", userData);
  const [majorBDTime, setMajorBDTime] = useState(120);
  const [selectedSection, setSelectedSection] = useState(
    "6322e549fdb4a3119153b9b2"
  );
  const [selectedSubSection, setSelectedSubSection] = useState(
    "6322e5b1fdb4a3119153b9d9"
  );

  const getMajorBDTime = async () => {
    try {
      // console.log(selectedSection, selectedSubSection);
      const response = await axios.get(
        `/getMajorBDTime?section=${selectedSection}&subSection=${selectedSubSection}`
      );
      console.log(response.data.majorBDTime);
      setMajorBDTime(
        response?.data?.majorBDTime ? response?.data?.majorBDTime : 120
      );
      console.log(majorBDTime);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    getMajorBDTime();
  }, [selectedSection, selectedSubSection]);

  return (
    <Container fluid className="mt-1 pb-5">
      <BMTitlebar title="Customization Dashboard" />

      <Row className="gx-3">
        <Col md={12} lg={6} className="mt-2">
          <RequestSheetCustomizedApproval notEditable />
          {userData?.tm_grade === "HOD" && (
            <CustomizedMajorBD
              setSelectedSection={setSelectedSection}
              setSelectedSubSection={setSelectedSubSection}
              majorBDTime={majorBDTime}
            />
          )}
          <ManageCategories />
        </Col>
        <Col md={12} lg={6} className="mt-2">
          <RequestSheetCustomizedApproval
            majorBDTime={majorBDTime ? majorBDTime : 120}
          />
        </Col>

        <Col md={12} lg={6} className="mt-2">
          <ManageCategories notEditable />
        </Col>

        <Col md={12} lg={6} className="mt-2">
          <CustomManageShifts notEditable />
        </Col>
      </Row>
    </Container>
  );
};

export default MainCustomized;
