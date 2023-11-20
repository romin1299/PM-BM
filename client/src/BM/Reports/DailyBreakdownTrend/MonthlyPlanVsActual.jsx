import React, { useState } from "react";
import { Chart } from "react-chartjs-2";
import { Paper, Typography } from "@mui/material";
import { chartColors } from "../../Utils/ChartUtils/chartEnums";
import { Row } from "react-bootstrap";

export const options = {
  plugins: {
    legend: {
      align: "end",
      labels: {
        usePointStyle: true,
      },
    },
    datalabels: {
      formatter: (value, context) => (value > 30 ? value : ""),
      font: { weight: "bold", size: 8 },
      anchor: (context) => (context.dataset.type === "line" ? "end" : "center"),
      align: (context) => (context.dataset.type === "line" ? "top" : "center"),
      offset: (context) => (context.dataset.type === "line" ? -2 : 0),
    },
  },
  responsive: true,
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
        maxRotation: 90,
        minRotation: 90,
      },
    },
    y: {
      stacked: true,
      title: {
        display: false,
        text: "Hours",
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
      label: "Target",
      data: [120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120],
      borderColor: chartColors.palettes.palette3[0],
      borderWidth: 2,
      fill: false,
    },
    {
      type: "bar",
      stack: "bar-stacked",
      label: "< 60",
      data: [45, 58, 32, 50, 22, 60, 55, 30, 40, 55, 48, 58], // Random data less than 60
      backgroundColor: chartColors.orange[2],
    },
    {
      type: "bar",
      stack: "bar-stacked",
      label: "< 120",
      data: [90, 105, 110, 80, 95, 100, 75, 115, 120, 90, 100, 110], // Random data less than 120
      backgroundColor: chartColors.aqua[1],
    },
    {
      type: "bar",
      stack: "bar-stacked",
      label: "> 120",
      data: [130, 140, 125, 155, 130, 145, 160, 135, 150, 170, 180, 160], // Random data greater than 120
      backgroundColor: chartColors.aqua[2],
    },
  ],
};

const MonthlyPlanVsActualChart = () => {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Row style={{ marginBottom: "1rem" }}>
        <Typography
          className="col"
          variant="h6"
          component="h6"
          sx={{ fontWeight: "500" }}
        >
          Monthly Plan Vs Actual
        </Typography>
      </Row>
      <Chart data={initialData} options={options} />
    </Paper>
  );
};

export default MonthlyPlanVsActualChart;
