import React from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import "./chart.css";

const DoughnutChart = ({ TableData }) => {
  ChartJS.register(ArcElement, Tooltip, Legend);

  const data = {
    labels: TableData?.map((item) => item.name),
    datasets: [
      {
        // label: TableData?.map((item) => item.name),
        data: TableData?.map((item) => item.value),
        backgroundColor: [
          "rgba(118, 235, 64, 0.2)",
          "rgb(253, 193, 132)",
          "rgba(255, 255, 255, 0.2)",
          "rgba(201, 203, 207, 0.2)",

          // "rgba(255, 206, 86, 0.2)",
          // "rgba(75, 192, 192, 0.2)",
          // "rgba(255, 159, 64, 0.2)",
        ],
        borderColor: [
          "#adec71",
          "rgb(243, 167, 92)",
          "rgb(211, 223, 223)",
          "rgb(201, 203, 207)",

          // "rgba(255, 159, 64, 1)",
          // "rgba(255, 206, 86, 1)",
          // "rgba(75, 192, 192, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    // maintainAspectRatio: false,

    responsive: true,
    plugins: {
      legend: {
        display: false,
        position: "bottom",
      },
      title: {
        display: false,
        text: "Chart.js Bar Chart",
      },
    },
  };

  return (
    <Doughnut data={data} options={options} width={150} height={50} />
    // <div style={styles.relative}>

    //   <div
    //     style={styles.pieContainer}
    //     className="d-flex justify-content-center align-items-center"
    //   >
    //     40%
    //   </div>
    //   <div id="legend" />
    // </div>
  );
};

export default DoughnutChart;
