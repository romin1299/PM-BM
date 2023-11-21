import React from "react";

import {
  Chart as ChartJS,
  LinearScale,
  CategoryScale,
  BarElement,
  PointElement,
  LineElement,
  Legend,
  Tooltip,
  LineController,
  BarController,
} from "chart.js";
import { Chart } from "react-chartjs-2";

const LineBarChartForProductionLineWise = ({ ReportData }) => {
  ChartJS.register(
    LinearScale,
    CategoryScale,
    BarElement,
    PointElement,
    LineElement,
    Legend,
    Tooltip,
    LineController,
    BarController
  );

  const options = {
    plugins: {
      title: {
        display: false,
        text: "",
      },
    },
    responsive: true,
    interaction: {
      mode: "index",
      intersect: false,
    },
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
      },
    },
  };

  const data = {
    labels: ReportData?.labels,
    datasets: [
      {
        type: "line",
        label: "Dataset 1",
        borderColor: "rgb(75, 192, 192)",
        borderWidth: 2,
        fill: false,
        data: ReportData?.target,
      },
      {
        type: "bar",
        label: "Dataset 2",
        backgroundColor: ReportData?.backgroundColor,
        data: ReportData?.data,
        borderColor: "white",
        borderWidth: 2,
        stack: "s-1",
      },
    ],
  };
  return <Chart type="bar" data={data} options={options} />;
};

export default LineBarChartForProductionLineWise;
