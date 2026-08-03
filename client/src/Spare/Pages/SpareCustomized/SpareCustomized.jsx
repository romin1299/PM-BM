import { Container, Row, Col } from "react-bootstrap";

import DynamicApproval from "./DynamicApproval";
import OrderTrackingBackendData from "./OrderTrackingBackendData";
import DynamicCRUDTable from "./DynamicCRUDTable";

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
      <Row>
        <Col className="col-5">
          <DynamicApproval
            approvalKey="spareIssuanceDynamicApproval"
            title="Spare Issuance Dynamic Approval"
          />
        </Col>
        <Col>
          <DynamicCRUDTable />
        </Col>
      </Row>
      {/* <Row>
        <Col>
          <DynamicCRUDTable
            title="Maker"
            url="/v1/spare/customization/makerConfiguration"
            dynamicTableKey="spareCurrenciesWithUnit"
            columns={[{ label: "Maker", field: "maker", type: "text" }]}
          />
        </Col>
        <Col>
          <DynamicCRUDTable
            title="Supplier name"
            url="/v1/spare/customization/supplierConfiguration"
            dynamicTableKey="spareCurrenciesWithUnit"
            columns={[
              { label: "Supplier name", field: "supplierName", type: "text" },
            ]}
          />
        </Col>
      </Row>
      <Row>
        <Col>
          <DynamicCRUDTable
            title="unit"
            url="/v1/spare/customization/unitConfiguration"
            dynamicTableKey="spareCurrenciesWithUnit"
            columns={[{ label: "Unit", field: "unit", type: "text" }]}
          />
        </Col>
        <Col>
          <DynamicCRUDTable
            title="Part Group"
            url="/v1/spare/customization/partGroupConfiguration"
            dynamicTableKey="spareCurrenciesWithUnit"
            columns={[
              { label: "Part Group", field: "partGroup", type: "text" },
            ]}
          />
        </Col>
      </Row> */}
    </Container>
  );
};

export default SpareCustomized;
