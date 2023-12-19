import React from "react";
import { Box } from "@mui/material";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

import { Chart } from "react-chartjs-2";
import { MONTH_LABELS, chartColors } from "../Utils/ChartUtils/chartEnums";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const BDHoursTrendChart = ({ bdHourTrend }) => {
  ChartJS.register(ChartDataLabels);

  const options = {
    maintainAspectRatio: false,
    responsive: true,
    maxBarThickness: 100,
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
            return value > 30 ? value : "";
          }
          return value;
        },
        font: { weight: "bold", size: 8 },
        // color: (context) => context.dataset.type === "line" ? chartColors[3] : "gray",
        anchor: (context) =>
          context.dataset.type === "line" ? "end" : "center",
        align: (context) =>
          context.dataset.type === "line" ? "top" : "center",
        offset: (context) => (context.dataset.type === "line" ? -2 : 0),
      },
    },
    // elements: {
    //   bar: {
    //     borderColor: "000",
    //     borderWidth: 1,
    //   },
    // },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
        title: {
          display: true,
          text: "Months",
        },
        ticks: {
          color: "black",
        },
      },
      y: {
        stacked: true,
        position: "left",
        ticks: {
          color: "black",
        },
      },
      y2: {
        position: "right",
        ticks: {
          color: "black",
        },
      },
    },
  };

  const data = {
    labels: MONTH_LABELS,
    datasets: [
      {
        type: "bar",
        stack: "bar-stacked",
        label: "<1",
        data: bdHourTrend?.lessThanOne,
        backgroundColor: chartColors.palettes[0][0],
      },
      {
        type: "bar",
        stack: "bar-stacked",
        label: "<2",
        data: bdHourTrend?.lessThanTwo,
        backgroundColor: chartColors.palettes[0][1],
      },
      {
        type: "bar",
        stack: "bar-stacked",
        label: ">2",
        data: bdHourTrend?.greaterThanTwo,
        backgroundColor: chartColors.palettes[0][2],
      },
    ],

    // bdHourTrend?.map((item, index) => ({
    //   type: "bar",
    //   stack: "bar-stacked",
    //   label: item?.label,
    //   data: item?.data,
    //   backgroundColor: chartColors.palettes[0][index],
    //   // backgroundColor: chartColors.palettes[0][index],
    // })),
  };

  return (
    <Box className="container-fluid cell p-3 mt-1">
      <Box sx={{ height: { xs: "300px", md: "350px" } }}>
        <Chart options={options} data={data} />
      </Box>
    </Box>
  );
};

export default BDHoursTrendChart;
