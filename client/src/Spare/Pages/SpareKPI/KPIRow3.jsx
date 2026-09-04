import React from "react";
import { Row, Col } from "react-bootstrap";
import SectionWiseBudget from "./SubComponent/SectionWiseBudget";
import TopConsumption from "./SubComponent/TopConsumption";

const KPIRow3 = (props) => {
  return (
    <Row className="mt-3 gx-3">
      <Col className="col-6">
        <SectionWiseBudget selectedYear={props?.selectedYear} />
      </Col>
      <Col>
        <TopConsumption {...props} title="Top Spare Usage" />
      </Col>
      <Col>
        <TopConsumption
          {...props}
          title="Top M/c wise Spare Usage"
          visualizationBasedOn="machine"
          headerKey0="Machine name"
        />
      </Col>
    </Row>
  );
};

export default KPIRow3;
