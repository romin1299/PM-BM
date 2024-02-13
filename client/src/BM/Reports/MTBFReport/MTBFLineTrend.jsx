import React, { useEffect, useState } from "react";
import LineBarChart from "../Common/LineBarChart";
import downloadFile from "../../../util";
import findFilters from "../../../filterNames";

const MTBFLineTrend = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
  selectedMonth,
  filterValues,
  userDetails,
}) => {
  const [loading, setLoading] = React.useState(true);

  const [lineWiseMTBFTrend, setLineWiseMTBFTrend] = useState({
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

  const header = ["Labels", "Hours"];

  const handleDownload = async (fileType) => {
    try {
      // const bodyData = [[lineWiseMTBFTrend?.labels, lineWiseMTBFTrend?.data]];

      let bodyData = [];
      let filterData = [];

      if (fileType === "csv") {
        bodyData = [
          ["Filters", ...arrayItems]?.toString() + "\n",
          ["\n"],

          [["Line Names"].concat(lineWiseMTBFTrend?.labels)?.toString() + "\n"],
          [["Hours"].concat(lineWiseMTBFTrend?.data)?.toString() + "\n"],
        ];
      } else {
        bodyData = [
          [
            lineWiseMTBFTrend?.labels?.join("\n"),
            lineWiseMTBFTrend?.data?.join("\n"),
          ],
        ];
        filterData = ["Filters", ...arrayItems];
      }

      downloadFile(
        filterData,
        bodyData,
        fileType,
        header,
        `MTBF_LineTrend_${selectedMonth}_${selectedYear}`
      );
    } catch (error) {
      console.error("Error downloading data:", error);
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
        loading={loading}
        dataset={lineWiseMTBFTrend}
        xAxisTitle="Lines"
        y1AxisTitle="MTBF Hours"
        label={{
          lineLabel: "Target",
          barLabel: "MTBF",
        }}
        onClickDownload={handleDownload}
      />
    </>
  );
};

export default MTBFLineTrend;
