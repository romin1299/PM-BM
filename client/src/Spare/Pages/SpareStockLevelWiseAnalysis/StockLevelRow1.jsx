import React, { useMemo } from "react";
import { Row, Col } from "react-bootstrap";
import ChartWrapper from "../SpareKPI/SubComponent/ChartComponents/ChartWrapper";
import StackedBarChart from "../SpareInventoryReport/SubComponent/ChartComponents/StackedBarChart";
import PieChart from "../SpareInventoryReport/SubComponent/ChartComponents/PieChart";
import handleDownloadCSVOrPDF, {
  handleDownloadDynamicDataCSVOrPDF,
} from "../SpareKPI/SubComponent/handleDownloadCSVOrPDF";

/**
 * Both charts count masters by the max quantity set on them (1 to 10, then
 * above 10) - how many masters share each level - rather than adding up the
 * quantity on the shelf.
 */
const BAR_TITLE = "Max Stock Level - Count (Cost in Mil INR)";
const PIE_TITLE = "Max Stock Level - Share of Count";

const ALL_LABEL = "All";

const StockLevelRow1 = ({ selectedYear, selectedMonth }) => {
  // No year chosen means all of them; downloads say so rather than print "".
  const yearLabel = selectedYear || ALL_LABEL;

  const csvOrPDfFileNamePostPix = useMemo(
    () => (selectedMonth ? `${selectedMonth}_${yearLabel}` : yearLabel),
    [selectedMonth, yearLabel],
  );

  const filters = useMemo(
    () => (selectedMonth ? [yearLabel, selectedMonth] : [yearLabel]),
    [selectedMonth, yearLabel],
  );

  return (
    <Row className="mt-3 gx-3 p-1">
      <Col md={12} lg={8}>
        <ChartWrapper
          params={{
            requestFor: "barline",
            selectedYear,
            selectedMonth,
          }}
          referenceArrayForUseEffect={[selectedYear, selectedMonth]}
          title={BAR_TITLE}
          url="/v1/spare/kpi/stockLevelWiseAnalysis"
          ChartMiddlewareComponent={StackedBarChart}
          // Masters grouped by their max quantity: the number of masters as bars
          // on the left axis, the cost of their stock as a line on the right.
          otherProps={{
            axisTitles: {
              x: "Max quantity set on the master (Nos.)",
              y: "Number of masters",
              y1: "Cost (Mil INR)",
            },
          }}
          // Match the neighbouring pie card so both cards form one aligned row.
          chartHeight={{ xs: "330px", md: "380px" }}
          csvOrPDfFileNamePostPix={csvOrPDfFileNamePostPix}
          filters={filters}
          handleDownloadCSVOrPDF={handleDownloadDynamicDataCSVOrPDF}
        />
      </Col>
      <Col md={12} lg={4}>
        <ChartWrapper
          params={{
            requestFor: "pie",
            selectedYear,
            selectedMonth,
          }}
          referenceArrayForUseEffect={[selectedYear, selectedMonth]}
          title={PIE_TITLE}
          url="/v1/spare/kpi/stockLevelWiseAnalysis"
          ChartMiddlewareComponent={PieChart}
          otherProps={{
            legendPosition: "bottom",
            compactLegend: true,
            showDataLabels: false,
            tooltipValueSuffix: "%",
          }}
          chartHeight={{ xs: "330px", md: "380px" }}
          csvOrPDfFileNamePostPix={csvOrPDfFileNamePostPix}
          filters={filters}
          handleDownloadCSVOrPDF={handleDownloadCSVOrPDF}
          header={["", "Percentage", "Masters"]}
        />
      </Col>
    </Row>
  );
};

export default StockLevelRow1;
