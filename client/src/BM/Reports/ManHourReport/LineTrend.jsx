import React from "react";
import { Chart } from "react-chartjs-2";
import { Divider, Paper, Typography } from "@mui/material";
import { chartColors } from "../../Utils/ChartUtils/chartEnums";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
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

const machineNames = [
  "MA5",
  "FANW21",
  "MFI21",
  "OEPS21",
  "PPLIN1",
  "SHN1",
  "JLD2",
  "ABT2",
  "MIK1",
  "LPD2",
  "PWL12",
  "AWQ4",
];

export const data = {
  labels: machineNames,
  datasets: [
    {
      type: "line",
      label: "Total",
      data: [432, 863, 543, 123, 474, 653, 655, 378, 302, 945, 234, 743],
      borderColor: chartColors.orange[1],
      borderWidth: 2,
      fill: false,
    },
    {
      type: "bar",
      stack: "bar-stacked",
      label: "BM",
      data: [432, 863, 543, 123, 474, 653, 655, 378, 302, 945, 234, 743],
      backgroundColor: chartColors.orange[2],
    },
    {
      type: "bar",
      stack: "bar-stacked",
      label: "PM",
      data: [432, 263, 543, 223, 574, 653, 255, 778, 1032, 145, 734, 243],
      backgroundColor: chartColors.aqua[1],
    },
  ],
};

const LineTrend = () => {
  return (
    <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
      <Typography variant="h5" component="h4">
        Line Trend
      </Typography>

      <Divider sx={{ mb: 4, borderColor: "black" }} />

      <Chart options={options} data={data} />
    </Paper>
  );
};

export default LineTrend;
