import React from "react";
import { Chart } from "react-chartjs-2";
import { Box } from "@mui/material";
import { chartColors } from "../../../BM/Utils/ChartUtils/chartEnums";
import ChartTitleBar from "../../../BM/Reports/Common/ChartTitleBar";
import SpareStatusOkNGTab from "../../Component/SpareStatusOkNGTab";

const options = {
  maintainAspectRatio: false,
  responsive: true,
  interaction: {
    mode: "index",
    intersect: false,
  },
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
      grid: {
        display: false,
      },
      title: {
        display: true,
      },
      ticks: {
        color: "black",
      },
    },
    // y1: {
    //   position: "right",
    //   grid: {
    //     display: false,
    //   },
    //   title: {
    //     display: false,
    //     text: "Cummulative Avg Hrs",
    //   },
    //   ticks: {
    //     color: "black",
    //   },
    // },
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

const MonthWisePlanVsActualGraph = ({
  budget,
  axiosConfig,
  referenceArrayForUseEffect,
}) => {
  const data = {
    labels,
    datasets: [
      {
        type: "line",
        label: "Cum Plant",
        data: budget?.cumulativePlan,
        borderColor: chartColors[0],
        backgroundColor: chartColors[0],
        pointStyle: "rectRot",
        // yAxisID: "y1",
      },
      {
        type: "line",
        label: "Cum Actual",
        data: budget?.cumulativeActual,
        borderColor: chartColors[10],
        backgroundColor: chartColors[10],
        pointStyle: "rectRot",
        // yAxisID: "y1",
      },
      {
        type: "bar",
        stack: "bar-stacked",
        label: "Monthly Plant",
        data: budget?.plan,
        backgroundColor: chartColors.barChart,
        borderRadius: 4,
        pointStyle: "rect",
      },
      {
        type: "bar",
        label: "Monthly Actual",
        data: budget?.actual,
        backgroundColor: chartColors.dailyBDTrendBorder[1],
        borderRadius: 4,
        pointStyle: "rect",
      },
    ],
  };

  return (
    <>
      <ChartTitleBar
        title="Month-wise Plan vs Actual"
        fontWeight={500}
        Toolbar={
          <SpareStatusOkNGTab
            requestedFor="simple"
            axiosConfig={axiosConfig}
            referenceArrayForUseEffect={referenceArrayForUseEffect}
          />
        }
      />

      <Box className="d-flex container-fluid p-1 ">
        <Box
          sx={{
            position: "relative",
            flex: "1 1 auto",
            minHeight: "200Px",
            width: "100%",
          }}
        >
          <Chart data={data} options={options} />
        </Box>
      </Box>
    </>
  );
};

export default MonthWisePlanVsActualGraph;
