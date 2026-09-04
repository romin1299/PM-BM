import React from "react";
import ChartWrapper from "./ChartComponents/ChartWrapper";
import StackedBarChart from "../../SpareInventoryReport/SubComponent/ChartComponents/StackedBarChart";
import { handleDownloadDynamicDataCSVOrPDF } from "./handleDownloadCSVOrPDF";

const NewOrStockInOrder = ({
  selectedYear,
  url = "/v1/spare/kpi/newSparesOrderingTrend",
  title = "New Spares Ordering Trend",
}) => {
  return (
    <ChartWrapper
      params={{
        selectedYear,
      }}
      referenceArrayForUseEffect={[selectedYear]}
      title={title}
      url={url}
      ChartMiddlewareComponent={StackedBarChart}
      csvOrPDfFileNamePostPix={selectedYear}
      filters={[selectedYear]}
      handleDownloadCSVOrPDF={handleDownloadDynamicDataCSVOrPDF}
    />
  );
};

export default NewOrStockInOrder;
