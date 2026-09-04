import React, { memo } from "react";
import AllKPIAndReportWrapper from "../SpareKPI/AllKPIAndReportWrapper";

import InventoryRow1 from "./InventoryRow1";
import InventoryRow2 from "./InventoryRow2";
import InventoryRow3 from "./InventoryRow3";

const PropComp = memo(({ yearAndMonth }) => {
  return (
    <>
      <InventoryRow1 {...yearAndMonth} />
      <InventoryRow2 {...yearAndMonth} />
      <InventoryRow3 {...yearAndMonth} />
    </>
  );
});

const SpareInventoryReport = () => (
  <AllKPIAndReportWrapper PropComp={PropComp} title="Inventory Dashboard" />
);

export default SpareInventoryReport;
