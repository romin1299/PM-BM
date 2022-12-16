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

export const data = {
  labels,
  datasets: [
    {
      label: "Plan",
      data: data1.map((item) => item.uv),
      backgroundColor: "#CFE1FD",
      borderColor: "rgba(54, 162, 235, 1)",
      borderWidth: 2,
    },
    {
      label: "Actual",
      data: data1.map((item) => item.pv),
      backgroundColor: "#bde28f",
      borderColor: "#90b466",
      borderWidth: 2,
    },
  ],
};

export function MonthlyTrendGraph() {
  return <Bar options={options} height={200} data={data} />;
}
