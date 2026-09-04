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
