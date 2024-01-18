import React, { useState, useEffect } from "react";
import { Chart } from "react-chartjs-2";
import { Box, Divider, Paper, Typography } from "@mui/material";
import { chartColors } from "../../Utils/ChartUtils/chartEnums";
import { Col, Row } from "react-bootstrap";
import { CountFilters } from "./DailyBDTrendChart";
import ChartTitleBar from "../Common/ChartTitleBar";

export const options = {
  maintainAspectRatio: false,
  responsive: true,
  plugins: {
    legend: {
      align: "end",
      labels: {
        usePointStyle: true,
        // padding: 50,
      },
    },
    datalabels: {
      formatter: (value, context) => {
        if (context.dataset.type === "bar") {
          return "";
        }
      },
      font: { weight: "bold", size: 10 },
      anchor: "end",
      align: "top",
      offset: -2,
    },
  },
  elements: {
    bar: {
      borderColor: "000",
      borderWidth: 1,
    },
  },
  scales: {
    x: {
      stacked: true,
      grid: {
        display: false, // Hide vertical grid lines
      },
      title: {
        display: true,
        text: "Months",
      },
      ticks: {
        // maxRotation: 90,
        // minRotation: 90,
        // padding: 10,
        color: "black",
      },
    },
    y: {
      stacked: true,
      title: {
        display: true,
        text: "Total Hours",
      },
      ticks: {
        color: "black",
      },
    },
    y1: {
      position: "right", // Align the y-axis to the right
      title: {
        display: true,
        text: "Cummulative Avg Hrs",
      },
      ticks: {
        color: "black",
      },
    },
  },
};

const labels = [
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
];

const MTTRChart = ({ flagForTogglingFilter, selectedValue, selectedYear }) => {
  const [mttrData, setMttrData] = useState({
    bdTrendData: [{ label: "", data: [] }],
    averageData: [],
  });

  const getMTTRData = async () => {
    let urlString = "";

    if (flagForTogglingFilter === "based-on-plant") {
      urlString = "mttrForPlant";
    } else if (
      flagForTogglingFilter === "based-on-section" ||
      flagForTogglingFilter === "based-on-subSection"
    ) {
      urlString = "mttrForSection";
    } else if (flagForTogglingFilter === "based-on-cell") {
      urlString = "mttrForCell";
    }

    try {
      const res = await fetch(
        `/${urlString}/kpiFromDatabase/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const { message, bdTrendData, averageData } = await res.json();

      if (res?.status === 200) {
        setMttrData({
          bdTrendData,
          averageData
        })
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (selectedValue) getMTTRData();
  }, [selectedValue, selectedYear]);


  const data = {
    labels,
    datasets: [
      {
        type: "line",
        label: "Average",
        data: mttrData?.averageData,
        borderColor: chartColors.blue[1],
        borderWidth: 2,
        backgroundColor: chartColors.blue[1],
        pointStyle: "rectRot",
        yAxisID: "y1",
      },
      ...mttrData?.bdTrendData?.map((item) => ({
        type: "bar",
        stack: "bar-stacked",
        label: item?.label,
        data: item?.data,
        backgroundColor: chartColors.yellow[1],
        borderColor: chartColors.yellow[1],
        pointStyle: "rect",
      })),
      // {
      //   type: "bar",
      //   stack: "bar-stacked",
      //   label: "FP",
      //   data: [3, 15, 10, 8, 12, 18, 20, 25, 30, 5, 15, 10],
      //   backgroundColor: chartColors.yellow[1],
      //   borderColor: chartColors.yellow[1],
      //   pointStyle: "rect",
      // },
      // {
      //   type: "bar",
      //   stack: "bar-stacked",
      //   label: "INJ",
      //   data: [20, 8, 15, 10, 5, 18, 12, 25, 30, 3, 10, 15],
      //   backgroundColor: chartColors.aqua[3],
      //   borderColor: chartColors.aqua[3],
      //   pointStyle: "rect",
      // },
      // {
      //   type: "bar",
      //   stack: "bar-stacked",
      //   label: "VCT",
      //   data: [10, 15, 20, 8, 5, 25, 18, 30, 12, 3, 15, 10],
      //   backgroundColor: chartColors.purple[4],
      //   borderColor: chartColors.purple[4],
      //   pointStyle: "rect",
      // },
      // {
      //   type: "bar",
      //   stack: "bar-stacked",
      //   label: "O2",
      //   data: [15, 10, 8, 20, 18, 5, 12, 25, 30, 3, 15, 10],
      //   backgroundColor: chartColors.green[3],
      //   borderColor: chartColors.green[3],
      //   pointStyle: "rect",
      // },
      // {
      //   type: "bar",
      //   stack: "bar-stacked",
      //   label: "ETB",
      //   data: [8, 15, 10, 5, 18, 20, 25, 30, 12, 3, 15, 10],
      //   backgroundColor: chartColors.magenta[2],
      //   borderColor: chartColors.magenta[2],
      //   pointStyle: "rect",
      // },
      // {
      //   type: "bar",
      //   stack: "bar-stacked",
      //   label: "VCT PARTS",
      //   data: [10, 5, 20, 8, 12, 15, 18, 30, 3, 25, 15, 10],
      //   backgroundColor: chartColors.blue[3],
      //   borderColor: chartColors.blue[3],
      //   pointStyle: "rect",
      // },
      // {
      //   type: "bar",
      //   stack: "bar-stacked",
      //   label: "FP PARTS",
      //   data: [5, 15, 10, 8, 12, 18, 20, 25, 30, 3, 15, 10],
      //   backgroundColor: chartColors.brown[1],
      //   borderColor: chartColors.brown[1],
      //   pointStyle: "rect",
      // },
    ],
  };

  return (
    <Box className="cell p-3 mb-3">
      <ChartTitleBar title="Mean Time to Repair (MTTR)" />

      <Box sx={{ height: { xs: "300px", md: "350px" } }}>
        <Chart data={data} options={options} />
      </Box>
    </Box>
  );
};

export default MTTRChart;
