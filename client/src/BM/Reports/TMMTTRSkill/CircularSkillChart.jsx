import React from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Chart } from "react-chartjs-2";
import { Box } from "@mui/material";

export const CircularSkillChart = ({ score = 1, highestScore }) => {
  ChartJS.register(ArcElement, Tooltip, Legend);

  // const percentage = score * (100 / highestScore);
  // const data = [percentage, 100 - percentage];
  const data = [score, highestScore - score];

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false, // <-- this option disables tooltips
      },
    },
  };

  const chartData = {
    labels: [""],
    datasets: [
      {
        label: "Score",
        data: data,
        backgroundColor: ["#23313f", "#cfd8dc"],
        // borderWidth: 0,
      },
    ],
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: { xs: "120px", md: "150px", lg: "200px" },
        p: { xs: "2px", md: "4px" },
      }}
    >
      <Chart type="pie" data={chartData} options={options} />
    </Box>
  );
};
