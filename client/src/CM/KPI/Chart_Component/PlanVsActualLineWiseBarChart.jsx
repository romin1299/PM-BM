import React from "react";
import BarChartCommon from "./BarChartCommon";

const PlanVsActualLineWiseBarChart = () => {
  return (
    <>
      <BarChartCommon
        stacked={false}
        xTitleText={"Lines"}
        yTitleText={"%"}
        title="Line Plan vs Actual"
      />
    </>
  );
};

export default PlanVsActualLineWiseBarChart;
