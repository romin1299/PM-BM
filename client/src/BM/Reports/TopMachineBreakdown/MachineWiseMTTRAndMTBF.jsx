import React, { useState, useEffect } from "react";

import LineBarChart from "../Common/LineBarChart";
import downloadFile from "../../../util";
import findFilters from "../../../filterNames";

const MachineWiseMTTRAndMTBF = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
  chartFor,
  filterValues,
  userDetails,
}) => {
  const [loading, setLoading] = React.useState(true);
  const [machineWiseMTTROrMTBF, setMachineWiseMTTROrMTBF] = useState({
    labels: [],
    data: [],
    target: [],
  });

  const { filteredValuesWithHOD, filteredValues } = findFilters(
    flagForTogglingFilter,
    filterValues,
    selectedValue
  );

  let arrayItems;
  let filterHeaders;

  if (userDetails.tm_grade === "HOD") {
    arrayItems = [
      userDetails?.plant_data.split("-")?.[0],
      ...filteredValuesWithHOD,
    ];
    // filterHeaders = ["Plant", "Section", "Sub-Section", "Cell", "Line"];
  } else {
    arrayItems = [
      userDetails?.plant_data.split("-")?.[0],
      userDetails?.section_data.split("-")?.[1],
      ...filteredValues,
    ];
    // filterHeaders = ["Plant", "Section", "Sub-Section", "Cell", "Line"];
  }

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
      let filterData = [];

      if (fileType === "csv") {
        bodyData = [
          ["Filters", ...arrayItems]?.toString() + "\n",
          ["\n"],
          [["Labels"].concat(machineWiseMTTROrMTBF?.labels)?.toString() + "\n"],
          [["Hours"].concat(machineWiseMTTROrMTBF?.data)?.toString() + "\n"],
        ];
      } else {
        filterData = ["Filters", ...arrayItems];

        bodyData = [["Hours"].concat(machineWiseMTTROrMTBF?.data)];
      }

      downloadFile(
        filterData,
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
