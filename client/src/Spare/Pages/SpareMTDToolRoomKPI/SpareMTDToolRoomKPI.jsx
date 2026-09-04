import React, { memo } from "react";

import AllKPIAndReportWrapper from "../SpareKPI/AllKPIAndReportWrapper";

import MTDToolRoomKPIRow1 from "./MTDToolRoomKPIRow1";
import MTDToolRoomKPIRow2 from "./MTDToolRoomKPIRow2";

const PropComp = memo(({ yearAndMonth }) => {
  return (
    <>
      <MTDToolRoomKPIRow1 {...yearAndMonth} />
      <MTDToolRoomKPIRow2 {...yearAndMonth} />
    </>
  );
});

const SpareMTDToolRoomKPI = () => (
  <AllKPIAndReportWrapper
    PropComp={PropComp}
    title="MTD Tool Room KPI"
    // otherParentProps={{
    //   componentFor: "eachCellWiseBifurcation",
    // }}
  />
);

export default SpareMTDToolRoomKPI;
