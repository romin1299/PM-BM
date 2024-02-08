import React, { useState, useEffect } from "react";

import LineBarChart from "../Common/LineBarChart";
import downloadFile from "../../../util";

const MachineWiseMTTRAndMTBF = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
  chartFor,
}) => {
  const [loading, setLoading] = React.useState(true);
  const [machineWiseMTTROrMTBF, setMachineWiseMTTROrMTBF] = useState({
    labels: [],
    data: [],
    target: [],
  });
  const getMachineWiseMTTROrMTBFTrendData = async () => {
    setLoading(true);
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
      setLoading(false);
    } catch (error) {
      console.log(error);
    }
  };

  const header = ["Labels"].concat(machineWiseMTTROrMTBF?.labels);

  const handleDownload = async (fileType) => {
    try {
      // const bodyData = [
      //   [machineWiseMTTROrMTBF?.labels, machineWiseMTTROrMTBF?.data],
      // ];

      let bodyData = [];
      if (fileType === "csv") {
        bodyData = [
          [["Labels"].concat(machineWiseMTTROrMTBF?.labels)?.toString() + "\n"],
          [["Hours"].concat(machineWiseMTTROrMTBF?.data)?.toString() + "\n"],
        ];
      } else {
        bodyData = [["Hours"].concat(machineWiseMTTROrMTBF?.data)];
      }

      downloadFile(
        bodyData,
        fileType,
        header,
        `MachineWise_MTTRorMTBF_${selectedYear}`
      );
    } catch (error) {
      console.error("Error downloading data:", error);
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
        loading={loading}
        dataset={machineWiseMTTROrMTBF}
        label={{
          barLabel: chartFor,
        }}
        onClickDownload={handleDownload}
      />
    </>
  );
};

export default MachineWiseMTTRAndMTBF;
