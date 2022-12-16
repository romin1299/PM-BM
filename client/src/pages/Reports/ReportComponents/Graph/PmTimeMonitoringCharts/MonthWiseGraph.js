import React from "react";

import { Bar } from "react-chartjs-2";

import Gradient from "javascript-color-gradient";
import { Title } from "chart.js";


const MonthWiseGraph = ({ xValue, yValue }) => {


  const colorArr = new Gradient()
    .setColorGradient("#B91414", "#F7BE36")
    .setMidpoint(12)
    .getColors();

  const options = {
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


  const data1 = [
    {
      name: "Jul-22",
      uv: 27,
      pv: 39,
      amt: 20,
    },
    {
      name: "Aug-22",
      uv: 18,
      pv: 48,
      amt: 21,
    },
    {
      name: "Sep-22",
      uv: 23,
      pv: 38,
      amt: 25,
    },
    {
      name: "Oct-22",
      uv: 34,
      pv: 43,
      amt: 21,
    },
    {
      name: "Nov-22",
      uv: 40,
      pv: 24,
      amt: 24,
    },
    {
      name: "Dec-22",
      uv: 30,
      pv: 13,
      amt: 22,
    },
    {
      name: "Jan-23",
      uv: 20,
      pv: 98,
      amt: 22,
    },
    {
      name: "Feb-23",
      uv: 20,
      pv: 98,
      amt: 22,
    },
    {
      name: "Mar-23",
      uv: 20,
      pv: 98,
      amt: 22,
    },
    {
      name: "Apr-23",
      uv: 20,
      pv: 98,
      amt: 22,
    },
    {
      name: "May-23",
      uv: 20,
      pv: 98,
      amt: 22,
    },
  ];

  const monthKeyArray = [
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

  //   const labels = monthKeyArray;

  const data =

  {
    labels: xValue,
    datasets: [
      {
        label: "Minute",
        data: yValue,
        backgroundColor: colorArr.map((color) => color),
        borderWidth: 1,
      },
    ],
  };
  return <Bar options={options} height={200} data={data} />;

}

export default MonthWiseGraph

