import React, { useState } from "react";
import { Chart } from "react-chartjs-2";
import { Divider, Paper, Typography } from "@mui/material";
import { chartColors } from "../../Utils/ChartUtils/chartEnums";
import { Col, Row } from "react-bootstrap";
import { CountFilters } from "./DailyBDTrendChart";

export const options = {
  plugins: {
    legend: {
      align: "end",
      labels: {
        usePointStyle: true,
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
  responsive: true,
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
        maxRotation: 90,
        minRotation: 90,
        // padding: 10,
      },
    },
    y: {
      stacked: true,
      title: {
        display: true,
        text: "Total Hours",
      },
    },
    y1: {
      position: "right", // Align the y-axis to the right
      title: {
        display: true,
        text: "Cummulative Avg Hrs",
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
      data: [12, 24, 15, 5, 23, 18, 30, 10, 8, 25, 20, 15],
      borderColor: chartColors.palettes.palette3[0],
      borderWidth: 2,
      fill: false,
      yAxisID: "y1",
    },
    {
      type: "bar",
      stack: "bar-stacked",
      label: "FP",
      data: [3, 15, 10, 8, 12, 18, 20, 25, 30, 5, 15, 10],
      backgroundColor: chartColors[0],
    },
    {
      type: "bar",
      stack: "bar-stacked",
      label: "INJ",
      data: [20, 8, 15, 10, 5, 18, 12, 25, 30, 3, 10, 15],
      backgroundColor: chartColors[1],
    },
    {
      type: "bar",
      stack: "bar-stacked",
      label: "VCT",
      data: [10, 15, 20, 8, 5, 25, 18, 30, 12, 3, 15, 10],
      backgroundColor: chartColors[2],
    },
    {
      type: "bar",
      stack: "bar-stacked",
      label: "O2",
      data: [15, 10, 8, 20, 18, 5, 12, 25, 30, 3, 15, 10],
      backgroundColor: chartColors[3],
    },
    {
      type: "bar",
      stack: "bar-stacked",
      label: "ETB",
      data: [8, 15, 10, 5, 18, 20, 25, 30, 12, 3, 15, 10],
      backgroundColor: chartColors[4],
    },
    {
      type: "bar",
      stack: "bar-stacked",
      label: "VCT PARTS",
      data: [10, 5, 20, 8, 12, 15, 18, 30, 3, 25, 15, 10],
      backgroundColor: chartColors[5],
    },
    {
      type: "bar",
      stack: "bar-stacked",
      label: "FP PARTS",
      data: [5, 15, 10, 8, 12, 18, 20, 25, 30, 3, 15, 10],
      backgroundColor: chartColors[7],
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
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Row style={{ marginBottom: "1rem" }}>
        <Typography
          className="col"
          variant="h6"
          component="h6"
          sx={{ fontWeight: "500" }}
        >
          Mean Time to Repair (MTTR)
        </Typography>
      </Row>

      <Chart data={data} options={options} />
    </Paper>
  );
};

export default MTTRChart;
