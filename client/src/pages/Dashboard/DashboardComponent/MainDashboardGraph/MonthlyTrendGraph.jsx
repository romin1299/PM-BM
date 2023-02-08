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
      display: true,
      text: "Annual Plan vs Actual",
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

        min: 0,
        stepSize: 1,
        max: 4,
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

  return <Bar options={options} height={200} data={data} title={"Hello"} />;
}
