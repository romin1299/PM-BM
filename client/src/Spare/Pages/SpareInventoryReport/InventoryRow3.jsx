import React, { useCallback, useMemo, useState } from "react";
import { Row, Col } from "react-bootstrap";
import HierarchyFilterWrapper from "./SubComponent/ChartComponents/HierarchyFilterWrapper";

import BarChart from "../SpareKPI/SubComponent/ChartComponents/BarChart";
import StackedBarChart from "./SubComponent/ChartComponents/StackedBarChart";
import TopLimit from "../SpareKPI/SubComponent/TopLimit";
import handleDownloadCSVOrPDF, {
  handleDownloadDynamicDataOtherFormatCSVOrPDF,
} from "../SpareKPI/SubComponent/handleDownloadCSVOrPDF";

/** Kept in step with the ceiling the two endpoints clamp their limit to. */
const DEFAULT_TOP_LIMIT = 10;
const MAX_TOP_LIMIT = 50;

/**
 * A horizontal bar needs vertical room per row, so the card grows with the
 * ranking rather than squeezing thirty lines into the height of ten.
 */
const chartHeightFor = (limit) => {
  const rows = Number(limit) > 0 ? Number(limit) : DEFAULT_TOP_LIMIT;
  return `${Math.max(300, Math.min(rows, MAX_TOP_LIMIT) * 34)}px`;
};

const handleDownloadLineWiseCSVOrPDF = (props) =>
  handleDownloadDynamicDataOtherFormatCSVOrPDF({
    ...props,
    labelColumnHeader: "Line",
  });

/**
 * One line-wise ranking chart.
 *
 * Both charts on this row rank the same production lines and differ only in
 * what they plot, so they share the "top N" control, the horizontal layout and
 * the height the chosen depth implies. Ranking is what makes them readable at
 * all: the catalogue spans 76 lines, of which the first ten hold about four
 * fifths of the stock, and drawing every one of them left bars a pixel wide
 * under a row of overlapping labels.
 */
const LineWiseTopChart = ({
  title,
  url,
  ChartMiddlewareComponent,
  handleDownload,
  header,
  selectedYear,
  selectedMonth,
}) => {
  const [limit, setLimit] = useState(DEFAULT_TOP_LIMIT);

  const handleSetParentLimit = useCallback(
    (propLimit) => setLimit(propLimit),
    [],
  );

  const csvOrPDfFileNamePostPix = useMemo(
    () => (selectedMonth ? `${selectedMonth}_${selectedYear}` : selectedYear),
    [selectedMonth, selectedYear],
  );

  const filters = useMemo(
    () =>
      selectedMonth
        ? [selectedYear, selectedMonth, `Top ${limit}`]
        : [selectedYear, `Top ${limit}`],
    [selectedMonth, selectedYear, limit],
  );

  return (
    <HierarchyFilterWrapper
      title={title}
      url={url}
      params={{
        showToast: "No",
        selectedYear,
        selectedMonth,
        limit,
      }}
      referenceArrayForUseEffect={[selectedYear, selectedMonth, limit]}
      ChartMiddlewareComponent={ChartMiddlewareComponent}
      otherProps={{
        indexAxis: "y",
      }}
      chartHeight={chartHeightFor(limit)}
      ExtraToolbar={<TopLimit handleSetParentLimit={handleSetParentLimit} />}
      otherToolbarCompProps={{
        queryParams: { moduleType: "Spare" },
        sectionFiltration: true,
        subSectionFiltration: true,
        cellFiltration: true,
        lineFiltration: true,
      }}
      filters={filters}
      csvOrPDfFileNamePostPix={csvOrPDfFileNamePostPix}
      handleDownloadCSVOrPDF={handleDownload}
      header={header}
    />
  );
};

const InventoryRow3 = ({ selectedYear, selectedMonth }) => {
  return (
    <Row className="mt-3 gx-3 p-1">
      <Col md={12} lg={6}>
        <LineWiseTopChart
          title="Top inventory"
          url="/v1/spare/kpi/topInventory"
          ChartMiddlewareComponent={BarChart}
          handleDownload={handleDownloadCSVOrPDF}
          header={["Lines", "Quantity", "Cost in Mil"]}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
        />
      </Col>
      <Col md={12} lg={6}>
        <LineWiseTopChart
          title="Spare Part Details"
          url="/v1/spare/kpi/supplierCategoryWise"
          ChartMiddlewareComponent={StackedBarChart}
          handleDownload={handleDownloadLineWiseCSVOrPDF}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
        />
      </Col>
    </Row>
  );
};

export default InventoryRow3;
