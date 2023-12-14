import React from "react";
import RequestSheetCustomizedApproval from "./CustomizedApproval/RequestSheetCustomizedApproval";
import ManageCategories from "./CustomizedCategory/ManageCategories";
import { Col, Container, Row } from "react-bootstrap";
import ManageShifts from "./CustomizedShifts/ManageShifts";
import CustomManageShifts from "./CustomizedShifts/CustomManageShifts";
import BMTitlebar from "../Component/BMTitlebar";

const MainCustomized = () => {
  return (
    <Container fluid className="mt-1 pb-5">
      <BMTitlebar title="Customization Dashboard" />

      <Row className="gx-3">
        <Col md={12} lg={6} className="mt-2">
          <RequestSheetCustomizedApproval />
        </Col>

        <Col md={12} lg={6} className="mt-2">
          <ManageCategories />
        </Col>

        <Col md={12} lg={6} className="mt-2">
          <CustomManageShifts />
        </Col>
      </Row>
    </Container>
  );
};

export default MainCustomized;
