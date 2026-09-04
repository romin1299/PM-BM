import React, { useMemo } from "react";
import { Row, Col } from "react-bootstrap";
import ChartWrapper from "../SpareKPI/SubComponent/ChartComponents/ChartWrapper";
import StackedBarChart from "../SpareInventoryReport/SubComponent/ChartComponents/StackedBarChart";
import PieChart from "../SpareInventoryReport/SubComponent/ChartComponents/PieChart";
import handleDownloadCSVOrPDF, {
  handleDownloadDynamicDataCSVOrPDF,
} from "../SpareKPI/SubComponent/handleDownloadCSVOrPDF";

const StockLevelRow1 = ({ selectedYear, selectedMonth }) => {
  const csvOrPDfFileNamePostPix = useMemo(
    () => (selectedMonth ? `${selectedMonth}_${selectedYear}` : selectedYear),
    [selectedMonth, selectedYear],
  );

  const filters = useMemo(
    () => (selectedMonth ? [selectedYear, selectedMonth] : [selectedYear]),
    [selectedMonth, selectedYear],
  );

  return (
    <Row className="mt-3 gx-3 p-1">
      <Col md={12} lg={9}>
        <ChartWrapper
          params={{
            requestFor: "barline",
            selectedYear,
            selectedMonth,
          }}
          referenceArrayForUseEffect={[selectedYear, selectedMonth]}
          title="Stock Level Wise Analysis"
          url="/v1/spare/kpi/stockLevelWiseAnalysis"
          ChartMiddlewareComponent={StackedBarChart}
          csvOrPDfFileNamePostPix={csvOrPDfFileNamePostPix}
          filters={filters}
          handleDownloadCSVOrPDF={handleDownloadDynamicDataCSVOrPDF}
        />
      </Col>
      <Col md={12} lg={3}>
        <ChartWrapper
          params={{
            requestFor: "pie",
            selectedYear,
            selectedMonth,
          }}
          referenceArrayForUseEffect={[selectedYear, selectedMonth]}
          title="Stock Level Wise Analysis"
          url="/v1/spare/kpi/stockLevelWiseAnalysis"
          ChartMiddlewareComponent={PieChart}
          csvOrPDfFileNamePostPix={csvOrPDfFileNamePostPix}
          filters={filters}
          handleDownloadCSVOrPDF={handleDownloadCSVOrPDF}
          header={["", "Percentage", "Cost in Mil"]}
        />
      </Col>
    </Row>
  );
};

export default StockLevelRow1;
