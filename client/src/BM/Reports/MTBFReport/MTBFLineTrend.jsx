import React, { useEffect, useState } from "react";
import LineBarChart from "../Common/LineBarChart";

const MTBFLineTrend = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
  selectedMonth,
}) => {
  const [loading, setLoading] = React.useState(true);

  const [lineWiseMTBFTrend, setLineWiseMTBFTrend] = useState({
    labels: [],
    data: [],
    target: [],
  });

  const getLineWiseMTBFTrendData = async () => {
    setLoading(true);

    try {
      const res = await fetch(
        // `/getLineWiseMTBFTrendData/${flagForTogglingFilter}/632c41261d1becfedab325f9`,
        `/getLineWiseMTBFTrendData/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}&&selectedMonth=${selectedMonth}&&monthTargetKey=monthlyMTBFTarget&&yearTargetKey=yearTotalMTBFTarget`,
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

    setLoading(false);
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
        loading={loading}
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
