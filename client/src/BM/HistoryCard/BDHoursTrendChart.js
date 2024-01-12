import React from "react";
import { Box, Paper } from "@mui/material";

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
import ChartTitleBar from "../Reports/Common/ChartTitleBar";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const BDHoursTrendChart = ({
  bdHourTrend,
  chartHeight = { xs: "250px", md: "300px" },
  labelsFontSize = 12,
  axisLabelsFontSize = 14,
}) => {
  // Chart.defaults.font.size = 16;
  const options = {
    maintainAspectRatio: false,
    responsive: true,
    maxBarThickness: 100,
    plugins: {
      legend: {
        align: "end",
        labels: {
          usePointStyle: true,
          font: {
            size: labelsFontSize,
          },
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
          font: {
            size: axisLabelsFontSize,
          },
        },
        ticks: {
          color: "black",
          font: {
            size: labelsFontSize,
          },
        },
      },
      y: {
        stacked: true,
        position: "left",
        ticks: {
          color: "black",
          font: {
            size: labelsFontSize,
          },
        },
      },
      y2: {
        position: "right",
        ticks: {
          color: "black",
          font: {
            size: labelsFontSize,
          },
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
        backgroundColor: chartColors.monthlyBDTrend[0],
      },
      {
        type: "bar",
        stack: "bar-stacked",
        label: "<2",
        data: bdHourTrend?.lessThanTwo,
        backgroundColor: chartColors.monthlyBDTrend[1],
      },
      {
        type: "bar",
        stack: "bar-stacked",
        label: ">2",
        data: bdHourTrend?.greaterThanTwo,
        backgroundColor: chartColors.monthlyBDTrend[2],
      },
    ],

    // bdHourTrend?.map((item, index) => ({
    //   type: "bar",
    //   stack: "bar-stacked",
    //   label: item?.label,
    //   data: item?.data,
    // })),
  };

  return (
    <Box>
      {/* <ChartTitleBar title="BD Hour Trend" /> */}

      <Box sx={{ height: chartHeight }}>
        <Chart options={options} data={data} plugins={[ChartDataLabels]} />
      </Box>
    </Box>
  );
};

export default BDHoursTrendChart;
