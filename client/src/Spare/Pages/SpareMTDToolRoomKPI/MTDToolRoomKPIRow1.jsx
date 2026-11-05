import React from "react";
import { Row, Col } from "react-bootstrap";

import NewOrStockInOrder from "../SpareKPI/SubComponent/NewOrStockInOrder";

/**
 * Each month's bar is stacked from every cell that ordered, with a cost line per
 * cell, so the chart needs far more room than a standard card gives: the full
 * width of the page and a tall plot.
 */
const ORDERING_TREND_HEIGHT = { xs: "420px", md: "520px" };

const MTDToolRoomKPIRow1 = ({ selectedYear }) => {
  return (
    <Row className="mt-3 gx-3 p-1 ">
      <Col xs={12}>
        <NewOrStockInOrder
          selectedYear={selectedYear}
          chartHeight={ORDERING_TREND_HEIGHT}
        />
      </Col>
    </Row>
  );
};

export default MTDToolRoomKPIRow1;
