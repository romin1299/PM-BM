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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const options = {
  maintainAspectRatio: false,
  responsive: true,
  plugins: {
    legend: {
      position: "top",
    },
    title: {
      display: false,
      text: "Chart.js Bar Chart",
    },
  },
  // interaction: {
  //   mode: 'index' as const,
  //   intersect: false,
  // },
  scales: {
    x: {
      stacked: true,
      title: {
        display: true,
        text: "Months",
      },
      ticks: {
        autoSkip: false,
        maxRotation: 90,
        minRotation: 90,
      },
    },
    y: {
      stacked: true,
      title: {
        display: true,
        text: "No. of Machine",
      },
    },
  },
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

const labels = monthKeyArray;

export function MonthlyTrendGraph({ annualGraph }) {
  const data = {
    labels,
    datasets: [
      {
        label: "Current Month Schedule",
        data: annualGraph?.annual_total_current_schedule,
        backgroundColor: "#CFE1FD",
        borderColor: "rgba(54, 162, 235, 1)",
        stack: "Stack 0",
      },
      {
        label: "Last Month Pending",
        data: annualGraph?.annual_previous_pending,
        backgroundColor: "rgb(250, 178, 178)",
        stack: "Stack 0",
      },
      {
        label: "Completed",
        data: annualGraph?.annual_completed,
        backgroundColor: "#bde28f",
        borderColor: "#adec71",
        stack: "Stack 1",
      },
    ],
  };

  return <Bar options={options} height={200} data={data} />;
}
