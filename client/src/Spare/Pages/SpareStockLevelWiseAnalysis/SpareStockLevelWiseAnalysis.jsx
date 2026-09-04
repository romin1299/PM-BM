import React, { memo } from "react";
import AllKPIAndReportWrapper from "../SpareKPI/AllKPIAndReportWrapper";

import StockLevelRow1 from "./StockLevelRow1";
import StockLevelRow2 from "./StockLevelRow2";

const PropComp = memo(({ yearAndMonth }) => {
  return (
    <>
      <StockLevelRow1 {...yearAndMonth} />
      <StockLevelRow2 {...yearAndMonth} />
    </>
  );
});

const SpareStockLevelWiseAnalysis = () => (
  <AllKPIAndReportWrapper
    PropComp={PropComp}
    title="Stock Level Wise Analysis"
  />
);

export default SpareStockLevelWiseAnalysis;
