import React, { useMemo } from "react";
import { Row, Col } from "react-bootstrap";
import ChartWrapper from "../SpareKPI/SubComponent/ChartComponents/ChartWrapper";
import StackedBarChart from "./SubComponent/ChartComponents/StackedBarChart";
import HierarchyFilterWrapper from "./SubComponent/ChartComponents/HierarchyFilterWrapper";
import {
  handleDownloadDynamicDataCSVOrPDF,
  handleDownloadDynamicDataOtherFormatCSVOrPDF,
} from "../SpareKPI/SubComponent/handleDownloadCSVOrPDF";

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
        axisTitles: { x: "Cell", y: "Available quantity (Nos.)" },
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

const InventoryRow2 = ({ selectedYear, selectedMonth }) => {
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
      <Col md={12} lg={5}>
        <ChartWrapper
          params={{
            selectedYear,
            selectedMonth,
          }}
          referenceArrayForUseEffect={[selectedYear, selectedMonth]}
          title="Inventory Trend Vs Holding ratio"
          url="/v1/spare/kpi/inventoryTrend"
          ChartMiddlewareComponent={StackedBarChart}
          // Cell bars and the target line are both holding-ratio percentages.
          otherProps={{
            axisTitles: { x: "Month", y: "Holding ratio (%)" },
          }}
          handleDownloadCSVOrPDF={handleDownloadDynamicDataCSVOrPDF}
          csvOrPDfFileNamePostPix={csvOrPDfFileNamePostPix}
          filters={[selectedYear]}
        />
      </Col>
      <Col md={12} lg={3}>
        <ChartWrapper
          params={{
            selectedYear,
            selectedMonth,
          }}
          referenceArrayForUseEffect={[selectedYear, selectedMonth]}
          title="Inventory Bifurcation"
          url="/v1/spare/kpi/inventoryBifurcation/overAll"
          ChartMiddlewareComponent={StackedBarChart}
          // A single stacked bar of master counts per rotation bucket.
          otherProps={{
            axisTitles: { x: "Overall inventory", y: "Masters (Nos.)" },
          }}
          handleDownloadCSVOrPDF={handleDownloadDynamicDataCSVOrPDF}
          csvOrPDfFileNamePostPix={csvOrPDfFileNamePostPix}
          filters={filters}
        />
      </Col>
      <Col md={12} lg={4}>
        <SectionWiseBifurcation
          params={{
            selectedYear,
            selectedMonth,
          }}
          referenceArrayForUseEffect={[selectedYear, selectedMonth]}
          csvOrPDfFileNamePostPix={csvOrPDfFileNamePostPix}
          filters={filters}
        />
      </Col>
    </Row>
  );
};

export default InventoryRow2;
