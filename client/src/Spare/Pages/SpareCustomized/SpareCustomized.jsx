import { Container, Row, Col } from "react-bootstrap";

import DynamicApproval from "./DynamicApproval";
import OrderTrackingBackendData from "./OrderTrackingBackendData";

const SpareCustomized = () => {
  return (
    <Container fluid>
      <Row>
        <Col className="col-5">
          <DynamicApproval />
        </Col>
        <Col className="col-6">
          <OrderTrackingBackendData />
        </Col>
      </Row>
    </Container>
  );
};

export default SpareCustomized;
