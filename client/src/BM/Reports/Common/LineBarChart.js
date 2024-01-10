import React from "react";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import { Box } from "@mui/material";
import { chartColors } from "../../Utils/ChartUtils/chartEnums";
import ChartTitleBar from "./ChartTitleBar";
import Loading from "../../../components/Loading/Loading";

const LineBarChart = ({
  title,
  label,
  xAxisTitle,
  y1AxisTitle,
  y2AxisTitle,
  loading = false,
  dataset,
}) => {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
  );

  // const options = {
  //   maintainAspectRatio: false,
  //   responsive: true,
  //   plugins: {
  //     legend: {
  //       labels: {
  //         usePointStyle: true,
  //       },
  //     },
  //     datalabels: {
  //       formatter: (value, context) => value || "",
  //       font: { weight: "bold", size: 8 },
  //       anchor: (context) =>
  //         context.dataset.type === "line" ? "end" : "center",
  //       align: (context) =>
  //         context.dataset.type === "line" ? "top" : "center",
  //       offset: (context) => (context.dataset.type === "line" ? -2 : 0),
  //     },
  //   },

  //   scales: {
  //     x: {
  //       stacked: true,
  //       grid: {
  //         display: false,
  //       },
  //       title: {
  //         display: true,
  //         text: "Days",
  //       },
  //     },
  //     y: {
  //       stacked: true,
  //       position: "left",
  //     },
  //     y2: {
  //       position: "right",
  //     },
  //   },
  // };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    maxBarThickness: 100,
    plugins: {
      // annotation: {
      //   annotations: {
      //     line1: {
      //       // Indicates the type of annotation
      //       type: "line",
      //       yMin: 1,
      //       yMax: 1,
      //       borderColor: chartColors[3],
      //       borderWidth: 2,
      //     },
      //   },
      // },
      legend: {
        display: false,
        labels: {
          usePointStyle: true,
        },
      },
      datalabels: {
        display: false,
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
        title: {
          display: xAxisTitle ? true : false,
          text: xAxisTitle,
        },
      },
      y1: {
        stacked: true,
        title: {
          display: y1AxisTitle ? true : false,
          text: y1AxisTitle,
        },
      },
      // y2: {
      //   position: "right",
      //   grid: {
      //     display: false,
      //   },
      //   title: {
      //     display: y2AxisTitle ? true : false,
      //     text: y2AxisTitle,
      //   },
      // },
    },
  };

  let lineArr = [];

  if (label?.lineLabel && dataset?.target) {
    lineArr = [
      {
        type: "line",
        label: label?.lineLabel,
        data: dataset?.target,
        borderColor: chartColors[1],
        borderWidth: 2,
        fill: false,
        yAxisID: "y1",
      },
    ];
  }

  const datasets = [
    ...lineArr,
    {
      type: "bar",
      stack: "bar-stacked",
      label: label?.barLabel,
      data: dataset?.data,
      yAxisID: "y1",
      backgroundColor: chartColors[0],
    },
  ];

  const data = {
    labels: dataset?.labels,
    datasets,
  };

  return (
    <Box className="cell p-3">
      <ChartTitleBar title={title} />

      {/* <div style={{ width: "100%", height: "300px" }}>
        <Chart data={data} options={options} />
      </div> */}

      {loading ? (
        <Loading height={200} />
      ) : (
        <Box sx={{ height: { xs: "300px", md: "350px" } }}>
          <Chart data={data} options={options} />
        </Box>
      )}
    </Box>
  );
};

export default LineBarChart;
