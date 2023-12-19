import React, { useEffect, useState } from "react";
import LineBarChart from "../Common/LineBarChart";

const MTBFTrend = ({ selectedValue, flagForTogglingFilter, selectedYear }) => {
  const [MTBFTrendData, setMTBFTrendData] = useState({
    labels: [],
    data: [],
    target: [],
  });

  const getMTBFTrendData = async () => {
    try {
      const res = await fetch(
        // `/getTrendData/MTBF/${flagForTogglingFilter}/632c41261d1becfedab325f9`,
        `/getTrendData/MTBF/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}`,
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
        // console.log(data);
        setMTBFTrendData(data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (selectedValue) {
      getMTBFTrendData();
    }
  }, [selectedValue, selectedYear]);

  return (
    <>
      <LineBarChart
        title="MTBF Trend"
        xAxisTitle="Months"
        dataset={MTBFTrendData}
        label={{
          lineLabel: "Target",
          barLabel: "MTBF",
        }}
      />
    </>
  );
};

export default MTBFTrend;
