import React, { useEffect, useState } from "react";
import LineBarChart from "../Common/LineBarChart";

const MTBFLineTrend = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
  selectedMonth,
}) => {
  const [lineWiseMTBFTrend, setLineWiseMTBFTrend] = useState({
    labels: [],
    data: [],
    target: [],
  });

  const getLineWiseMTBFTrendData = async () => {
    try {
      const res = await fetch(
        // `/getLineWiseMTBFTrendData/${flagForTogglingFilter}/632c41261d1becfedab325f9`,
        `/getLineWiseMTBFTrendData/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}&&selectedMonth=${selectedMonth}`,
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
        setLineWiseMTBFTrend(data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (selectedValue) {
      getLineWiseMTBFTrendData();
    }
  }, [selectedValue, selectedYear, selectedMonth]);

  return (
    <>
      <LineBarChart
        title="Line Trend"
        dataset={lineWiseMTBFTrend}
        xAxisTitle="Lines"
        y1AxisTitle="MTBF Hours"
        label={{
          lineLabel: "Target",
          barLabel: "MTBF",
        }}
      />
    </>
  );
};

export default MTBFLineTrend;
