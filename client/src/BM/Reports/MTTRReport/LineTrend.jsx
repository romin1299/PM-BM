import React, { useEffect, useState } from "react";
import LineBarChart from "../Common/LineBarChart";

const LineTrend = ({ selectedValue, flagForCellAndLineToggle }) => {
  const [lineWiseMTTRTrend, setLineWiseMTTRTrend] = useState({
    labels: [],
    data: [],
    target: [],
  });

  const getLineWiseMTTRTrendData = async () => {
    try {
      const res = await fetch(
        `/getLineWiseMTTRTrendData/${flagForCellAndLineToggle}/632c41261d1becfedab325f9`,
        // `/getLineWiseMTTRTrendData/${flagForCellAndLineToggle}/${selectedValue}`,
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
    getLineWiseMTTRTrendData();
    if (selectedValue) {
    }
  }, [selectedValue]);

  return (
    <>
      <LineBarChart
        title="Line Trend"
        xAxisTitle="Lines"
        dataset={lineWiseMTTRTrend}
        label={{
          lineLabel: "Target",
          barLabel: "MTBF",
        }}
      />
    </>
  );
};

export default LineTrend;
