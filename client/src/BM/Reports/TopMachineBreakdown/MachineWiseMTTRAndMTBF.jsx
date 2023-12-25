import React, { useState, useEffect } from "react";

import LineBarChart from "../Common/LineBarChart";

const MachineWiseMTTRAndMTBF = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
  chartFor,
}) => {
  const [machineWiseMTTROrMTBF, setMachineWiseMTTROrMTBF] = useState({
    labels: [],
    data: [],
    target: [],
  });
  const getMachineWiseMTTROrMTBFTrendData = async () => {
    try {
      const res = await fetch(
        `/getTrendData/${chartFor}/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}`,
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
        setMachineWiseMTTROrMTBF(data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (selectedValue) {
      getMachineWiseMTTROrMTBFTrendData();
    }
  }, [selectedValue, selectedYear]);

  return (
    <>
      <LineBarChart
        title={`${chartFor} Trend`}
        xAxisTitle="Months"
        y1AxisTitle={`${chartFor} Hours`}
        dataset={machineWiseMTTROrMTBF}
        label={{
          barLabel: chartFor,
        }}
      />
    </>
  );
};

export default MachineWiseMTTRAndMTBF;
