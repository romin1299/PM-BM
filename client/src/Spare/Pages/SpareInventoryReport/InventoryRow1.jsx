import React from "react";
import { LoadSummeryData } from "../SpareKPI/KPIRow1";
import { Row } from "react-bootstrap";

const InventoryRow1 = (props) => {
  return (
    <Row className="mt-3 gx-3 d-flex align-items-center justify-content-between flex-wrap p-1">
      <LoadSummeryData {...props} />
      <LoadSummeryData {...props} url="/v1/spare/kpi/summery/stockLifeTime" />
    </Row>
  );
};

export default InventoryRow1;
