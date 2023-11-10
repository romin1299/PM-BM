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

const BDHoursVsCountChart = ({ labels, totalBDCount, BDCount, BDhours }) => {
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
      legend: {
        display: false,
      },
      title: {
        display: false,
        text: "",
      },
    },
    maintainAspectRatio: false,
    responsive: true,
    interaction: {
      mode: "index",
      intersect: false,
    },
    scales: {
      x: {
        stacked: true,
      },
      y2: {
        stacked: true,
      },
    },
  };

  // const labels = ["M-EN-O2-WSA-030-2", "EFMO-01"];

  let colorArray = ["rgb(75, 192, 192)", "rgb(53, 162, 235)"];
  let colorArray1 = ["red", "green"];

  const data = {
    labels,
    datasets: [
      ...totalBDCount?.map((item, index) => ({
        type: "line",
        label: `Count ${item?.groupId}`,
        backgroundColor: "gray",
        borderWidth: 2,
        fill: false,
        data: item?.count,
        yAxisID: "y1",
      })),

      ...BDCount?.map((item, index) => ({
        type: "line",
        label: `Count ${item?.groupId}`,
        backgroundColor: colorArray1?.[index],
        borderWidth: 2,
        fill: false,
        data: item?.count,
        yAxisID: "y1",
      })),

      ...BDhours?.map((item, index) => ({
        type: "bar",
        backgroundColor: colorArray?.[index],
        stack: "same-bar-stack",
        label: `Hours ${item?.groupId}`,
        data: item?.sumOfBDhours,
        borderColor: "white",
        borderWidth: 2,
        yAxisID: "y2",
      })),
    ],
  };
  return <Chart type="bar" data={data} options={options} />;
};

export default BDHoursVsCountChart;
