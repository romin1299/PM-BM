import React from "react";
import { Row, Col } from "react-bootstrap";

import NewOrStockInOrder from "../SpareKPI/SubComponent/NewOrStockInOrder";

const MTDToolRoomKPIRow1 = ({ selectedYear }) => {
  return (
    <Row className="mt-3 gx-3 p-1 ">
      <Col md={12} lg={6}>
        <NewOrStockInOrder selectedYear={selectedYear} />
      </Col>
    </Row>
  );
};

export default MTDToolRoomKPIRow1;
