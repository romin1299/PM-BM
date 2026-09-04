import React, { useMemo } from "react";
import { Row, Col } from "react-bootstrap";

import ChartWrapper from "../SpareKPI/SubComponent/ChartComponents/ChartWrapper";
import StackedBarChart from "../SpareInventoryReport/SubComponent/ChartComponents/StackedBarChart";
import PieChart from "../SpareInventoryReport/SubComponent/ChartComponents/PieChart";

import handleDownloadCSVOrPDF, {
  handleDownloadDynamicDataCSVOrPDF,
} from "../SpareKPI/SubComponent/handleDownloadCSVOrPDF";

const MTDToolRoomKPICol1 = ({ selectedYear }) => {
  return (
    <Col md={12} lg={6}>
      <ChartWrapper
        params={{
          selectedYear,
        }}
        referenceArrayForUseEffect={[selectedYear]}
        title="Temporary Part Issue trend"
        url="/v1/spare/kpi/temporaryPartIssueTrend"
        ChartMiddlewareComponent={StackedBarChart}
        csvOrPDfFileNamePostPix={selectedYear}
        filters={[selectedYear]}
        handleDownloadCSVOrPDF={handleDownloadDynamicDataCSVOrPDF}
      />
    </Col>
  );
};

const MTDToolRoomKPICol2 = ({ selectedYear, selectedMonth }) => {
  const csvOrPDfFileNamePostPix = useMemo(
    () => (selectedMonth ? `${selectedMonth}_${selectedYear}` : selectedYear),
    [selectedMonth, selectedYear],
  );

  const filters = useMemo(
    () => (selectedMonth ? [selectedYear, selectedMonth] : [selectedYear]),
    [selectedMonth, selectedYear],
  );

  return (
    <Col md={12} lg={3}>
      <ChartWrapper
        params={{
          selectedYear,
          selectedMonth,
        }}
        referenceArrayForUseEffect={[selectedYear, selectedMonth]}
        title="Receiving Inspection Manufacturing Parts"
        url="/v1/spare/kpi/receivingInspectionManufacturingParts"
        ChartMiddlewareComponent={PieChart}
        csvOrPDfFileNamePostPix={csvOrPDfFileNamePostPix}
        filters={filters}
        handleDownloadCSVOrPDF={handleDownloadCSVOrPDF}
        header={["", "Percentage", "Quantity"]}
      />
    </Col>
  );
};

const MTDToolRoomKPIRow2 = (props) => {
  return (
    <Row className="mt-3 gx-3 p-1 ">
      <MTDToolRoomKPICol1 {...props} />
      <MTDToolRoomKPICol2 {...props} />
    </Row>
  );
};

export default MTDToolRoomKPIRow2;
