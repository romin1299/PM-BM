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
import { Bar } from "react-chartjs-2";

export function SummeryBarChart({ currentMonthCompletionData }) {
  // console.log(currentMonthCompletionData);

  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
  );
  const options = {
    responsive: true,
    ticks: {
      stepSize: 25,
      max: 100,
    },
    plugins: {
      legend: {
        position: "top",
      },
    },
    maintainAspectRatio: false,
    borderRadius: 5,
    scales: {
      // y: [{}],
      x: {
        ticks: {
          // color: ["blue", "red"],
          // align: ["center", "start"],
        },

        // display: true,
        // title: {
        //   display: true,
        //   text: "Month",
        //   color: "#911",
        //   font: {
        //     family: "Comic Sans MS",
        //     size: 20,
        //     weight: "bold",
        //     lineHeight: 1.2,
        //   },
        //   padding: { top: 0, left: 0, right: 0, bottom: 0 },
        // },
      },
    },
  };

  // {
  //   responsive: true,
  //   plugins: {
  //     legend: {
  //       position: "top",
  //     },
  //     title: {
  //       display: false,
  //       text: "Chart.js Bar Chart",
  //     },
  //     scales: {
  //       xAxis: {
  //         // The axis for this scale is determined from the first letter of the id as `'x'`
  //         // It is recommended to specify `position` and / or `axis` explicitly.
  //         type: "time",
  //       },
  //     },
  //   },
  // };

  const data1 = [
    {
      name: "Apr-22",
      uv: 100,
      pv: 39,
      amt: 20,
    },
    {
      name: "May-22",
      uv: 100,
      pv: 48,
      amt: 21,
    },
    {
      name: "Jun-22",
      uv: 100,
      pv: 38,
      amt: 25,
    },
    {
      name: "Jul-22",
      uv: 100,
      pv: 43,
      amt: 21,
    },
    {
      name: "Aug-22",
      uv: 100,
      pv: 24,
      amt: 24,
    },
    {
      name: "Sep-22",
      uv: 100,
      pv: 13,
      amt: 22,
    },
    {
      name: "Oct-22",
      uv: 100,
      pv: 98,
      amt: 22,
    },
    {
      name: "Nov-22",
      uv: 100,
      pv: 98,
      amt: 22,
    },
    {
      name: "Dec-22",
      uv: currentMonthCompletionData,
      pv: 98,
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
      uv: 40,
      pv: 24,
      amt: 24,
    },
    {
      name: "Apr-23",
      uv: 20,
      pv: 98,
      amt: 22,
    },
  ];

  const labels = data1.map((item) => item.name);
  const data = {
    labels,
    datasets: [
      {
        label: "Completion %",
        data: data1.map((item) => item.uv),
        backgroundColor: "red",
      },
      // {
      //   label: "Dataset 2",
      //   data: data1.map((item) => item.pv),
      //   backgroundColor: "blue",
      // },
    ],
  };
  return <Bar options={options} data={data} />;
}
