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
import { Bar } from "react-chartjs-2";
import { Box } from "@mui/material";

const TopMachineBDChart = () => {
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
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
        text: "",
      },
    },
    maintainAspectRatio: false,
    responsive: true,
    interaction: {
      mode: "index",
      intersect: false,
    },
  };

  const data = {
    labels: ["a", "b"],
    datasets: [
      {
        label: `BD hours`,
        data: [20, 30],
        borderColor: "white",
        borderWidth: 2,
      },
    ],
  };
  return (
    <Box className="cell p-3">
      <Bar type="bar" data={data} options={options} />
    </Box>
  );
};

export default TopMachineBDChart;
