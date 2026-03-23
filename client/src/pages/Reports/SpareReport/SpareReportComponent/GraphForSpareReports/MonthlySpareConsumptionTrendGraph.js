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

const MonthlySpareConsumptionTrendGraph = ({ graphData }) => {
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
    // plugins: {
    //     title: {
    //         display: true,
    //         text: 'Chart.js Bar Chart - Stacked',
    //     },
    // },
    responsive: true,
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
      },
    },
  };

  const labels = [
    "Apr",
    "May",
    "June",
    "July",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
    "Jan",
    "Feb",
    "Mar",
  ];

  const data = {
    labels,
    datasets: [
      {
        type: "line",
        label: "Total",
        borderColor: "red",
        //borderWidth: 2,
        // fill: false,
        // backgroundColor: "red",
        data: graphData?.totalMonthlyPMSpareConsumption?.map((key, idx) => {
          return (
            key +
            graphData?.totalMonthlyBMSpareConsumption[idx] +
            graphData?.totalMonthlyCorrectiveSpareConsumption[idx] +
            graphData?.totalMonthlyPridictiveSpareConsumption[idx] +
            graphData?.totalMonthlyKaizenSpareConsumption[idx]
          );
        }),
      },
      {
        type: "bar",
        label: "PM",
        backgroundColor: "rgb(53, 162, 235)",
        data: graphData?.totalMonthlyPMSpareConsumption,
        // borderColor: 'white',
        // //borderWidth: 2,
      },
      {
        type: "bar",
        label: "BM",
        backgroundColor: "rgb(255, 99, 132)",
        data: graphData?.totalMonthlyBMSpareConsumption,
      },
      {
        type: "bar",
        label: "Corrective",
        backgroundColor: "rgb(75, 192, 192)",
        data: graphData?.totalMonthlyCorrectiveSpareConsumption,
      },
      {
        type: "bar",
        label: "Predictive",
        backgroundColor: "rgb(132, 63, 128)",
        data: graphData?.totalMonthlyPridictiveSpareConsumption,
      },
      {
        type: "bar",
        label: "Kaizen",
        backgroundColor: "#b3b745",
        data: graphData?.totalMonthlyKaizenSpareConsumption,
      },
    ],
  };

  return <Chart type="bar" data={data} options={options} />;
};

export default MonthlySpareConsumptionTrendGraph;
