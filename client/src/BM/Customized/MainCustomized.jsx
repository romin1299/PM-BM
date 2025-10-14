import React, { useContext } from "react";
import RequestSheetCustomizedApproval from "./CustomizedApproval/RequestSheetCustomizedApproval";
import ManageCategories from "./CustomizedCategory/ManageCategories";
import { Col, Container, Row } from "react-bootstrap";
import ManageShifts from "./CustomizedShifts/ManageShifts";
import CustomManageShifts from "./CustomizedShifts/CustomManageShifts";
import BMTitlebar from "../Component/BMTitlebar";
import RoutingContext from "../../context/routing/RoutingContext";

const MainCustomized = () => {
  const context = useContext(RoutingContext);
  const notEditable = context?.tm_no === Number("9999");

  return (
    <Container fluid className="mt-1 pb-5">
      <BMTitlebar title="Customization Dashboard" />

      <Row className="gx-3">
        <Col md={12} lg={6} className="mt-2">
          <RequestSheetCustomizedApproval notEditable />
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
