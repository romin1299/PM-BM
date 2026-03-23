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

const LineWiseSpareConsumptionTrendGraph = ({ lineData, graphData }) => {
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

  const labels = graphData?.lineWiseSpareCost?.map((item) => item?.line_name);

  const data = {
    labels,
    datasets: [
      {
        type: "line",
        label: "Total",
        borderColor: "red",
        // //borderWidth: 2,
        // fill: false,
        // backgroundColor: "red",
        data: graphData?.lineWiseSpareCost?.map((key) => {
          return (
            key?.sumOfTotalPMSpareCost +
            key.sumOfTotalBMSpareCost +
            key.sumOfTotalCorrectiveSpareCost +
            key.sumOfTotalPridictiveSpareCost +
            key.sumOfTotalKaizenSpareCost
          );
        }),
      },
      {
        type: "bar",
        label: "PM",
        backgroundColor: "rgb(53, 162, 235)",
        data: graphData?.lineWiseSpareCost?.map(
          (item) => item?.sumOfTotalPMSpareCost
        ),
        // borderColor: 'white',
        // //borderWidth: 2,
      },
      {
        type: "bar",
        label: "BM",
        backgroundColor: "rgb(255, 99, 132)",
        data: graphData?.lineWiseSpareCost?.map(
          (item) => item?.sumOfTotalBMSpareCost
        ),
      },
      {
        type: "bar",
        label: "Corrective",
        backgroundColor: "rgb(75, 192, 192)",
        data: graphData?.lineWiseSpareCost?.map(
          (item) => item?.sumOfTotalCorrectiveSpareCost
        ),
      },
      {
        type: "bar",
        label: "Predictive",
        backgroundColor: "rgb(132, 63, 128)",
        data: graphData?.lineWiseSpareCost?.map(
          (item) => item?.sumOfTotalPridictiveSpareCost
        ),
      },
      {
        type: "bar",
        label: "Kaizen",
        backgroundColor: "#b3b745",
        data: graphData?.lineWiseSpareCost?.map(
          (item) => item?.sumOfTotalKaizenSpareCost
        ),
      },
    ],
  };

  return <Chart type="bar" data={data} options={options} />;
};

export default LineWiseSpareConsumptionTrendGraph;
