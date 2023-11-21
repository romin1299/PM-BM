import React from "react";
import { Chart } from "react-chartjs-2";
import { Divider, Paper, Typography } from "@mui/material";
import { chartColors } from "../../Utils/ChartUtils/chartEnums";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  PointElement,
  Legend
);

export const options = {
  plugins: {
    legend: {
      align: "end",
      labels: {
        usePointStyle: true,
      },
    },
    datalabels: {
      display: false,
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
        text: "Hours",
      },
    },
  },
};

const TM_Names = [
  "Jatindar",
  "Mangal",
  "Ujjawal",
  "NeeraK",
  "Dalip",
  "Gagandeep",
  "Inderjeet",
  "Shubhash",
  "Ashish",
  "Sandeep",
  "Anshul",
  "Shreekant",
];

export const data = {
  labels: TM_Names,
  datasets: [
    {
      type: "line",
      label: "Dataset 1",
      data: [432, 863, 543, 123, 474, 653, 655, 378, 302, 945, 234, 743],
      borderColor: chartColors.orange[1],
      borderWidth: 2,
      fill: false,
    },
    {
      type: "bar",
      stack: "bar-stacked",
      label: "Dataset 2",
      data: [432, 863, 543, 123, 474, 653, 655, 378, 302, 945, 234, 743],
      backgroundColor: chartColors.orange[2],
      borderColor: chartColors.orange[2],
      borderWidth: 0,
    },
    {
      type: "bar",
      stack: "bar-stacked",
      label: "Dataset 3",
      data: [432, 263, 543, 223, 574, 653, 255, 778, 1032, 145, 734, 243],
      backgroundColor: chartColors.aqua[1],
      borderColor: chartColors.aqua[1],
      borderWidth: 0,
    },
  ],
};

const TMLoad = () => {
  return (
    <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
      <Typography variant="h5" component="h4">
        TM Load
      </Typography>

      <Divider sx={{ mb: 4, borderColor: "black" }} />

      <Chart options={options} data={data} />
    </Paper>
  );
};

export default TMLoad;
