import React, { useEffect, useState } from "react";
import LineBarChart from "../Common/LineBarChart";
import downloadFile from "../../../util";
import findFilters from "../../../filterNames";

const MTBFTrend = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
  filterValues,
  userDetails,
}) => {
  const [loading, setLoading] = React.useState(true);

  const [MTBFTrendData, setMTBFTrendData] = useState({
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

  const getMTBFTrendData = async () => {
    setLoading(true);

    try {
      const res = await fetch(
        // `/getTrendData/MTBF/${flagForTogglingFilter}/632c41261d1becfedab325f9`,
        `/getTrendData/MTBF/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}&&targetKey=monthlyMTBFTarget`,
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

    setLoading(false);
  };
  const header = ["Labels"].concat(MTBFTrendData?.labels);

  const handleDownload = async (fileType) => {
    try {
      // const bodyData = [[MTBFTrendData?.labels, MTBFTrendData?.data]];

      let bodyData = [];
      let filterData = [];

      if (fileType === "csv") {
        bodyData = [
          ["Filters", ...arrayItems]?.toString() + "\n",
          ["\n"],
          [["Labels"].concat(MTBFTrendData?.labels)?.toString() + "\n"],
          [["Hours"].concat(MTBFTrendData?.data)?.toString() + "\n"],
        ];
      } else {
        bodyData = [["Hours"].concat(MTBFTrendData?.data)];
        filterData = ["Filters", ...arrayItems];
      }

      downloadFile(
        filterData,
        bodyData,
        fileType,
        header,
        `MTBF_TrendData_${selectedYear}`
      );
    } catch (error) {
      console.error("Error downloading data:", error);
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
        y1AxisTitle="MTBF Hours"
        loading={loading}
        dataset={MTBFTrendData}
        label={{
          lineLabel: "Target",
          barLabel: "MTBF",
        }}
        onClickDownload={handleDownload}
      />
    </>
  );
};

export default MTBFTrend;
