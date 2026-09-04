import React, { useMemo } from "react";
import { Row, Col } from "react-bootstrap";
import NewOrStockInOrder from "./SubComponent/NewOrStockInOrder";
import ChartWrapper from "./SubComponent/ChartComponents/ChartWrapper";
import Doughnut from "./SubComponent/ChartComponents/Doughnut";
import handleDownloadCSVOrPDF from "./SubComponent/handleDownloadCSVOrPDF";

const ColWrapper = ({ children }) => (
  <Col md={12} lg={3}>
    {children}
  </Col>
);

const KPIRow2 = ({ selectedYear, selectedMonth }) => {
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
      <ColWrapper>
        <ChartWrapper
          params={{
            requestFor: "costWise",
            consumptionFor: "section",
            selectedYear,
            selectedMonth,
          }}
          referenceArrayForUseEffect={[selectedYear, selectedMonth]}
          ChartMiddlewareComponent={Doughnut}
          handleDownloadCSVOrPDF={handleDownloadCSVOrPDF}
          csvOrPDfFileNamePostPix={csvOrPDfFileNamePostPix}
          filters={filters}
        />
      </ColWrapper>
      <ColWrapper>
        <ChartWrapper
          params={{
            requestFor: "costWise",
            consumptionFor: "section",
            selectedYear,
            selectedMonth,
          }}
          referenceArrayForUseEffect={[selectedYear, selectedMonth]}
          title="Consumption trend Category (Cost & Qty)"
          ChartMiddlewareComponent={Doughnut}
          handleDownloadCSVOrPDF={handleDownloadCSVOrPDF}
          csvOrPDfFileNamePostPix={csvOrPDfFileNamePostPix}
          filters={filters}
        />
      </ColWrapper>
      <ColWrapper>
        <ChartWrapper
          title="Temporary Parts Status (Cost & Qty)"
          params={{
            requestFor: "temporaryPart",
            consumptionFor: "section",
            selectedYear,
            selectedMonth,
          }}
          referenceArrayForUseEffect={[selectedYear, selectedMonth]}
          ChartMiddlewareComponent={Doughnut}
          handleDownloadCSVOrPDF={handleDownloadCSVOrPDF}
          csvOrPDfFileNamePostPix={csvOrPDfFileNamePostPix}
          filters={filters}
        />
      </ColWrapper>
      <ColWrapper>
        <NewOrStockInOrder
          selectedYear={selectedYear}
          url="/v1/spare/kpi/newAndStockInSparesOrderingTrend"
          title="New Ordering/Stock In Trend"
        />
      </ColWrapper>
    </Row>
  );
};

export default KPIRow2;
