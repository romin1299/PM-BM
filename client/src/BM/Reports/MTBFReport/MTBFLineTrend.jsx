import React, { useEffect, useState } from "react";
import LineBarChart from "../Common/LineBarChart";

const MTBFLineTrend = ({ selectedValue, flagForCellAndLineToggle }) => {
  const [lineWiseMTBFTrend, setLineWiseMTBFTrend] = useState({
    labels: [],
    data: [],
    target: [],
  });

  const getLineWiseMTBFTrendData = async () => {
    try {
      const res = await fetch(
        `/getLineWiseMTBFTrendData/${flagForCellAndLineToggle}/632c41261d1becfedab325f9`,
        // `/getLineWiseMTBFTrendData/${flagForCellAndLineToggle}/${selectedValue}`,
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
    getLineWiseMTBFTrendData();
    if (selectedValue) {
    }
  }, [selectedValue]);

  return (
    <>
      <LineBarChart
        title="Line Trend"
        dataset={lineWiseMTBFTrend}
        xAxisTitle="Lines"
        label={{
          lineLabel: "Target",
          barLabel: "MTBF",
        }}
      />
    </>
  );
};

export default MTBFLineTrend;
