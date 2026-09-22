import React from "react";
import ChartWrapper from "./ChartComponents/ChartWrapper";
import StackedBarChart from "../../SpareInventoryReport/SubComponent/ChartComponents/StackedBarChart";
import { handleDownloadDynamicDataCSVOrPDF } from "./handleDownloadCSVOrPDF";

const NewOrStockInOrder = ({
  selectedYear,
  url = "/v1/spare/kpi/newSparesOrderingTrend",
  title = "New Spares Ordering Trend",
  // Bars are order quantities by month; the cost lines sit on the right axis.
  axisTitles = { x: "Month", y: "Orders (Qty)", y1: "Cost (Mil INR)" },
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
      otherProps={{ axisTitles }}
      csvOrPDfFileNamePostPix={selectedYear}
      filters={[selectedYear]}
      handleDownloadCSVOrPDF={handleDownloadDynamicDataCSVOrPDF}
    />
  );
};

export default NewOrStockInOrder;
