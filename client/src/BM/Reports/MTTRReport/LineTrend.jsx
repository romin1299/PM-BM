import React, { useEffect, useState } from "react";
import LineBarChart from "../Common/LineBarChart";

const LineTrend = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
  selectedMonth,
}) => {
  const [lineWiseMTTRTrend, setLineWiseMTTRTrend] = useState({
    labels: [],
    data: [],
    target: [],
  });

  const getLineWiseMTTRTrendData = async () => {
    try {
      const res = await fetch(
        // `/getLineWiseMTTRTrendData/${flagForTogglingFilter}/632c41261d1becfedab325f9`,
        `/getLineWiseMTTRTrendData/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}&&selectedMonth=${selectedMonth}&&monthTargetKey=monthlyMTTRTarget&&yearTargetKey=yearTotalMTTRTarget`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const { message, data } = await res.json();

      if (res?.status === 201) {
        setLineWiseMTTRTrend(data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (selectedValue && flagForTogglingFilter !== "based-on-line") {
      getLineWiseMTTRTrendData();
    }
  }, [selectedValue, selectedYear, selectedMonth]);

  return (
    <>
      <LineBarChart
        title="Line Trend"
        xAxisTitle="Lines"
        y1AxisTitle="MTTR Hours"
        dataset={lineWiseMTTRTrend}
        label={{
          lineLabel: "Target",
          barLabel: "MTTR",
        }}
      />
    </>
  );
};

export default LineTrend;
