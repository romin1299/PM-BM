import React, { useState } from "react";
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

export const initialData = {
  labels,
  datasets: [
    {
      type: "line",
      label: "Average",
      data: [12, 18, 15, 5, 23, 18, 20, 10, 8, 16, 20, 15],
      borderColor: chartColors.blue[1],
      borderWidth: 2,
      backgroundColor: chartColors.blue[1],
      pointStyle: "rectRot",
      yAxisID: "y1",
    },
    {
      type: "bar",
      stack: "bar-stacked",
      label: "FP",
      data: [3, 15, 10, 8, 12, 18, 20, 25, 30, 5, 15, 10],
      backgroundColor: chartColors.yellow[1],
      borderColor: chartColors.yellow[1],
      pointStyle: "rect",
    },
    {
      type: "bar",
      stack: "bar-stacked",
      label: "INJ",
      data: [20, 8, 15, 10, 5, 18, 12, 25, 30, 3, 10, 15],
      backgroundColor: chartColors.aqua[3],
      borderColor: chartColors.aqua[3],
      pointStyle: "rect",
    },
    {
      type: "bar",
      stack: "bar-stacked",
      label: "VCT",
      data: [10, 15, 20, 8, 5, 25, 18, 30, 12, 3, 15, 10],
      backgroundColor: chartColors.purple[4],
      borderColor: chartColors.purple[4],
      pointStyle: "rect",
    },
    {
      type: "bar",
      stack: "bar-stacked",
      label: "O2",
      data: [15, 10, 8, 20, 18, 5, 12, 25, 30, 3, 15, 10],
      backgroundColor: chartColors.green[3],
      borderColor: chartColors.green[3],
      pointStyle: "rect",
    },
    {
      type: "bar",
      stack: "bar-stacked",
      label: "ETB",
      data: [8, 15, 10, 5, 18, 20, 25, 30, 12, 3, 15, 10],
      backgroundColor: chartColors.magenta[2],
      borderColor: chartColors.magenta[2],
      pointStyle: "rect",
    },
    {
      type: "bar",
      stack: "bar-stacked",
      label: "VCT PARTS",
      data: [10, 5, 20, 8, 12, 15, 18, 30, 3, 25, 15, 10],
      backgroundColor: chartColors.blue[3],
      borderColor: chartColors.blue[3],
      pointStyle: "rect",
    },
    {
      type: "bar",
      stack: "bar-stacked",
      label: "FP PARTS",
      data: [5, 15, 10, 8, 12, 18, 20, 25, 30, 3, 15, 10],
      backgroundColor: chartColors.brown[1],
      borderColor: chartColors.brown[1],
      pointStyle: "rect",
    },
  ],
};

const MTTRChart = () => {
  const [data, setData] = useState(initialData);

  const [filterOptions, setFilterOptions] = useState({
    lessThan60: false,
    lessThan120: false,
    greaterThan120: false,
  });

  const handleCheckboxChange = (option) => {
    setFilterOptions((prevOptions) => ({
      ...prevOptions,
      [option]: !prevOptions[option],
    }));
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
