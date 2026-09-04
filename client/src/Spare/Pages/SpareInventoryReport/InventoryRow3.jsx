import React, { useMemo } from "react";
import { Row, Col } from "react-bootstrap";
import HierarchyFilterWrapper from "./SubComponent/ChartComponents/HierarchyFilterWrapper";

import BarChart from "../SpareKPI/SubComponent/ChartComponents/BarChart";
import StackedBarChart from "./SubComponent/ChartComponents/StackedBarChart";
import handleDownloadCSVOrPDF from "../SpareKPI/SubComponent/handleDownloadCSVOrPDF";

const InventoryRow3 = ({ selectedYear, selectedMonth }) => {
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
      <Col md={12} lg={6}>
        <HierarchyFilterWrapper
          title="Top inventory"
          params={{
            showToast: "No",
            selectedYear,
            selectedMonth,
          }}
          referenceArrayForUseEffect={[selectedYear, selectedMonth]}
          url="/v1/spare/kpi/topInventory"
          ChartMiddlewareComponent={BarChart}
          otherProps={{
            indexAxis: "x",
          }}
          otherToolbarCompProps={{
            queryParams: { moduleType: "Spare" },
            sectionFiltration: true,
            subSectionFiltration: true,
            cellFiltration: true,
            lineFiltration: true,
          }}
          csvOrPDfFileNamePostPix={csvOrPDfFileNamePostPix}
          filters={filters}
          handleDownloadCSVOrPDF={handleDownloadCSVOrPDF}
          header={["Lines", "Quantity", "Cost in Mil"]}
        />
      </Col>
      <Col md={12} lg={6}>
        <HierarchyFilterWrapper
          title="Spare Part Details"
          params={{
            showToast: "No",
            selectedYear,
            selectedMonth,
          }}
          referenceArrayForUseEffect={[selectedYear, selectedMonth]}
          url="/v1/spare/kpi/supplierCategoryWise"
          ChartMiddlewareComponent={StackedBarChart}
          otherProps={{
            indexAxis: "x",
          }}
          otherToolbarCompProps={{
            queryParams: { moduleType: "Spare" },
            sectionFiltration: true,
            subSectionFiltration: true,
            cellFiltration: true,
            lineFiltration: true,
          }}
          filters={filters}
          csvOrPDfFileNamePostPix={csvOrPDfFileNamePostPix}
          handleDownloadCSVOrPDF={handleDownloadCSVOrPDF}
          header={["Lines", "Quantity", "Cost in Mil"]}
        />
      </Col>
    </Row>
  );
};

export default InventoryRow3;
