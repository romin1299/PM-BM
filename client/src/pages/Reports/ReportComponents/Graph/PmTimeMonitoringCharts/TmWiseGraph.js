import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

import Gradient from "javascript-color-gradient";


const TmWiseGraph = ({ xValue, yValue }) => {

  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
  );

  const colorArr = new Gradient()
    .setColorGradient("#004b5b", "#30D5C8")
    .setMidpoint(12)
    .getColors();

  const options = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        position: "top",

      },
      // title: {
      //   display: true,
      //   text: "Chart.js Bar Chart",
      // },
    },



    scales: {
      y: {
        title: {
          display: true,
          text: 'Total Time'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Total Month'
        }
      }
    }


  };


  //   const labels = monthKeyArray;

  const data =

  {
    labels: xValue,
    datasets: [
      {
        label: "Minutes",
        data: yValue,
        backgroundColor: colorArr.map((color) => color),
        // borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };



  return <Bar options={options} height={200} data={data} />;

}

export default TmWiseGraph