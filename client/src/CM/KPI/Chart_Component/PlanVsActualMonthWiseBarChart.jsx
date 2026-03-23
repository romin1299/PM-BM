import React, { useEffect } from "react";
import BarChartCommon from "./BarChartCommon";

const PlanVsActualMonthWiseBarChart = ({}) => {
  return (
    <>
      <BarChartCommon
        stacked={false}
        xTitleText={"Months"}
        yTitleText={"Nos"}
        title="Plan vs Actual"
      />
    </>
  );
};

export default PlanVsActualMonthWiseBarChart;
