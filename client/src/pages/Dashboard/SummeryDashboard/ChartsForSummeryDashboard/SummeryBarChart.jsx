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

export function SummeryBarChart({ annualChartData }) {
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
          autoSkip: false,
          maxRotation: 90,
          minRotation: 90,
        },

        //     // color: ["blue", "red"],
        //     // align: ["center", "start"],
            title: {
              display: true,
              text: 'Months'
            }

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
      y: {
        title: {
          display: true,
          text: 'Completed (%)'
        },
        max:100,

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

  const labels = monthKeyArray;
  const data = {
    labels,
    datasets: [
      {
        label: "Completion %",
        data: annualChartData,
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
