import React from "react";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Colors,
} from "chart.js";
import { Bar } from "react-chartjs-2";

const RequestSheetMonitoringBarChart = ({ allStatusCounterForGraph }) => {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Colors
  );

  const options = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
      },
      title: {
        display: true,
        text: "Request sheet monitoring",
        color: "black",
        font: {
          size: 16,
        },
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
          display: false,
          text: "status",
        },
        ticks: {
          // mirror: true,
          fontSize: 16,
          padding: 10,
        },
      },

      // xaxis: {
      //   tickmode: "array", // If "array", the placement of the ticks is set via `tickvals` and the tick text is `ticktext`.
      //   tickvals: showValueInXAxis.position,
      //   ticktext: showValueInXAxis.label,
      // },

      y: {
        stacked: true,
        title: {
          display: true,
          text: "No. of request-sheet",
        },
        ticks: {
          min: 0,
          stepSize: 1,
          // max: 4,
        },
      },
    },
  };

  const data = {
    labels: ["Sheet Generated", "Status", "Completed"],
    datasets: allStatusCounterForGraph,
  };

  return <Bar options={options} height={75} data={data} />;
};

export default RequestSheetMonitoringBarChart;
