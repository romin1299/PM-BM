import React, { memo } from "react";
import AllKPIAndReportWrapper from "./AllKPIAndReportWrapper";

import KPIRow1 from "./KPIRow1";
import KPIRow2 from "./KPIRow2";
import KPIRow3 from "./KPIRow3";

const PropComp = memo(({ yearAndMonth }) => {
  return (
    <>
      <KPIRow1 {...yearAndMonth} />
      <KPIRow2 {...yearAndMonth} />
      <KPIRow3 {...yearAndMonth} />
    </>
  );
});

const SpareKPI = () => <AllKPIAndReportWrapper PropComp={PropComp} />;

export default SpareKPI;
