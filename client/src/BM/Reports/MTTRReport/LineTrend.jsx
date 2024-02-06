import React, { useEffect, useState } from "react";
import LineBarChart from "../Common/LineBarChart";
import downloadFile from "../../../util";

const LineTrend = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
  selectedMonth,
}) => {
  const [loading, setLoading] = React.useState(true);

  const [lineWiseMTTRTrend, setLineWiseMTTRTrend] = useState({
    labels: [],
    data: [],
    target: [],
  });

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
      if (fileType === "csv") {
        bodyData = [
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
      }

      downloadFile(
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
