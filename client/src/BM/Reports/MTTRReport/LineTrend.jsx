import React, { useEffect, useState } from "react";
import LineBarChart from "../Common/LineBarChart";
import downloadFile from "../../../util";
import findFilters from "../../../filterNames";

const LineTrend = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
  selectedMonth,
  filterValues,
  userDetails,
}) => {
  const [loading, setLoading] = React.useState(true);

  const [lineWiseMTTRTrend, setLineWiseMTTRTrend] = useState({
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

  const getLineWiseMTTRTrendData = async () => {
    setLoading(true);

    try {
      const res = await fetch(
        // `/getLineWiseMTTRTrendData/${flagForTogglingFilter}/632c41261d1becfedab325f9`,
        `/getLineWiseMTTRTrendData/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}&&selectedMonth=${selectedMonth}&&monthTargetKey=monthlyMTTRTarget&&yearTargetKey=yearTotalMTTRTarget`,
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

    setLoading(false);
  };

  const header = ["Line Names", "Hours"];

  const handleDownload = async (fileType) => {
    try {
      // const bodyData = [[lineWiseMTTRTrend?.labels, lineWiseMTTRTrend?.data]];

      let bodyData = [];
      let filterData = [];

      if (fileType === "csv") {
        bodyData = [
          ["Filters", ...arrayItems]?.toString() + "\n",
          ["\n"],
          [["Line Names"].concat(lineWiseMTTRTrend?.labels)?.toString() + "\n"],
          [["Hours"].concat(lineWiseMTTRTrend?.data)?.toString() + "\n"],
        ];
      } else {
        bodyData = [
          [
            lineWiseMTTRTrend?.labels?.join("\n"),
            lineWiseMTTRTrend?.data?.join("\n"),
          ],
        ];
        filterData = ["Filters", ...arrayItems];
      }

      downloadFile(
        filterData,
        bodyData,
        fileType,
        header,
        `MTTR_LineTrend_${selectedMonth}_${selectedYear}`
      );
    } catch (error) {
      console.error("Error downloading data:", error);
    }
  };

  useEffect(() => {
    if (selectedValue && flagForTogglingFilter !== "based-on-line") {
      getLineWiseMTTRTrendData();
    }
  }, [selectedValue, selectedYear, selectedMonth]);

  return (
    <>
      <LineBarChart
        title="Line Trend"
        xAxisTitle="Lines"
        y1AxisTitle="MTTR Hours"
        loading={loading}
        dataset={lineWiseMTTRTrend}
        label={{
          lineLabel: "Target",
          barLabel: "MTTR",
        }}
        onClickDownload={handleDownload}
      />
    </>
  );
};

export default LineTrend;
