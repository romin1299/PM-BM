import React from "react";
import RequestSheetCustomizedApproval from "./CustomizedApproval/RequestSheetCustomizedApproval";
import ManageCategories from "./CustomizedCategory/ManageCategories";
import { Col, Container, Row } from "react-bootstrap";
import ManageShifts from "./CustomizedShifts/ManageShifts";

const MainCustomized = () => {
  return (
    <Container fluid className="mt-3 pb-5">
      <Row>
        <Col md={12} lg={6}>
          <RequestSheetCustomizedApproval />
        </Col>

        <Col md={12} lg={6}>
          <ManageCategories />
        </Col>

        <Col md={12} lg={6}>
          <ManageShifts />
        </Col>
      </Row>
    </Container>
  );
};

export default MainCustomized;
