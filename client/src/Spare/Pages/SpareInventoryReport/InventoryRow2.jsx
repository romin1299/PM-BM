import React, { useMemo } from "react";
import { Row, Col } from "react-bootstrap";
import ChartWrapper from "../SpareKPI/SubComponent/ChartComponents/ChartWrapper";
import StackedBarChart from "./SubComponent/ChartComponents/StackedBarChart";
import HierarchyFilterWrapper from "./SubComponent/ChartComponents/HierarchyFilterWrapper";
import {
  handleDownloadDynamicDataCSVOrPDF,
  handleDownloadDynamicDataOtherFormatCSVOrPDF,
} from "../SpareKPI/SubComponent/handleDownloadCSVOrPDF";
import {
  inventoryBifurcationDataLabels,
  inventoryTrendDataLabels,
  inventoryTrendTooltip,
} from "./inventoryTrendChartOptions";

import { getDefaultFinancialYear } from "../../Component/Common/YearAndMonthFilter";

const NO_PARAMS = {};
const NO_PARAMS_REFERENCE = [];
const ALL_DATA_FILTERS = ["All"];

const SectionWiseBifurcation = ({
  params,
  referenceArrayForUseEffect,
  csvOrPDfFileNamePostPix,
  filters,
}) => {
  return (
    <HierarchyFilterWrapper
      params={params}
      referenceArrayForUseEffect={referenceArrayForUseEffect}
      title="Section Inventory Bifurcation"
      url="/v1/spare/kpi/inventoryBifurcation/hierarchyWise"
      ChartMiddlewareComponent={StackedBarChart}
      // One stacked bar per cell; the segments are the rotation buckets.
      otherProps={{
        axisTitles: { x: "Cell", y: "Masters (Nos.)" },
        dataLabels: inventoryBifurcationDataLabels,
        primaryAxisGrace: "15%",
      }}
      otherToolbarCompProps={{
        queryParams: {
          showToast: "No",
          moduleType: "Spare",
          upTo: "subSection",
        },
        sectionFiltration: true,
        subSectionFiltration: true,
      }}
      filters={filters}
      csvOrPDfFileNamePostPix={csvOrPDfFileNamePostPix}
      handleDownloadCSVOrPDF={handleDownloadDynamicDataOtherFormatCSVOrPDF}
    />
  );
};

const ALL_DATA_LABEL = "All";

/**
 * No year or month filter on this dashboard: the bifurcations cover all the
 * stock. The trend is the one chart drawn per month, so it shows the current
 * financial year.
 */
const InventoryRow2 = () => {
  const trendYear = useMemo(() => getDefaultFinancialYear(), []);

  return (
    <>
      {/* The trend has a row to itself, full width and tall, so its twelve
          months, many cell series, legend and secondary axis all have room. */}
      <Row className="mt-3 gx-3 p-1">
        <Col xs={12}>
          <ChartWrapper
            params={{ selectedYear: trendYear }}
            referenceArrayForUseEffect={[trendYear]}
            title="Inventory Trend Vs Holding ratio"
            url="/v1/spare/kpi/inventoryTrend"
            ChartMiddlewareComponent={StackedBarChart}
            /**
             * Cell-wise inventory value stacked on the left axis (Mil INR), with
             * the total above each bar; holding ratio is label-only on the
             * right axis (%), while the inventory target line uses the left
             * inventory-value axis. See inventoryTrendChartOptions.
             */
            otherProps={{
              axisTitles: {
                x: "Month",
                y: "Inventory value (Mil INR)",
                y1: "Holding ratio (%)",
              },
              dataLabels: inventoryTrendDataLabels,
              tooltip: inventoryTrendTooltip,
              // Two labels sit above each stack: holding ratio above total
              // inventory. Reserve room on the main axis for both.
              primaryAxisGrace: "25%",
            }}
            chartHeight={{ xs: "380px", md: "480px" }}
            handleDownloadCSVOrPDF={handleDownloadDynamicDataCSVOrPDF}
            csvOrPDfFileNamePostPix={trendYear}
            filters={[trendYear]}
          />
        </Col>
      </Row>

      {/* The two bifurcations share the second row. */}
      <Row className="mt-3 gx-3 p-1">
        <Col md={12} lg={6}>
          <ChartWrapper
            params={NO_PARAMS}
            referenceArrayForUseEffect={NO_PARAMS_REFERENCE}
            title="Inventory Bifurcation"
            url="/v1/spare/kpi/inventoryBifurcation/overAll"
            ChartMiddlewareComponent={StackedBarChart}
            // A single stacked bar of master counts per rotation bucket.
            otherProps={{
              axisTitles: { x: "Overall inventory", y: "Masters (Nos.)" },
              dataLabels: inventoryBifurcationDataLabels,
              primaryAxisGrace: "15%",
            }}
            handleDownloadCSVOrPDF={handleDownloadDynamicDataCSVOrPDF}
            csvOrPDfFileNamePostPix={ALL_DATA_LABEL}
            filters={ALL_DATA_FILTERS}
          />
        </Col>
        <Col md={12} lg={6}>
          <SectionWiseBifurcation
            params={NO_PARAMS}
            referenceArrayForUseEffect={NO_PARAMS_REFERENCE}
            csvOrPDfFileNamePostPix={ALL_DATA_LABEL}
            filters={ALL_DATA_FILTERS}
          />
        </Col>
      </Row>
    </>
  );
};

export default InventoryRow2;
