import React from "react";
import { Row, Col } from "react-bootstrap";

const KPIBDHoursAndCountStatus = () => {
  const styleObjAndClassNameForSpanValue = {
    className: "border d-flex justify-content-center align-items-center",
    style: { fontSize: "12px", fontWeight: "bold" },
  };
  return (
    <Row className="mb-2">
      <Col>
        <span className="d-block  " style={{ fontSize: "12px" }}>
          MBD Target
        </span>
        <span {...styleObjAndClassNameForSpanValue}>{10}</span>
      </Col>
      <Col>
        <span className="d-block  " style={{ fontSize: "12px" }}>
          MBD Actual
        </span>
        <span {...styleObjAndClassNameForSpanValue}>{20}</span>
      </Col>
      <Col>
        <span className="d-block  " style={{ fontSize: "12px" }}>
          BD Target
        </span>
        <span {...styleObjAndClassNameForSpanValue}>{20}</span>
      </Col>
      <Col>
        <span className="d-block  " style={{ fontSize: "12px" }}>
          BD Actual
        </span>
        <span {...styleObjAndClassNameForSpanValue}>{20}</span>
      </Col>
    </Row>
  );
};

export default KPIBDHoursAndCountStatus;
