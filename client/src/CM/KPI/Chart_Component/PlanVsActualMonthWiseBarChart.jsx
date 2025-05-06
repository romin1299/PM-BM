import React, { useEffect } from "react";
import BarChartCommon from "./BarChartCommon";
import axios from "axios";

const PlanVsActualMonthWiseBarChart = ({
  filterValues,
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
}) => {
  const PlanVsActualMonthWiseBarChartData = async () => {
    try {
      const url = `/getDataOfPlanVsActualMonthWise/${flagForTogglingFilter}/${selectedValue}`;
      const res = await axios.get(url, {
        withCredentials: true,
        credentials: "include",
      });
      if (res.status === 201) {
        console.log(res?.data);
      }
    } catch (error) {
      console.log("error:", error);
    }
  };

  useEffect(() => {
    PlanVsActualMonthWiseBarChartData();
  }, [selectedValue, selectedYear]);

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
