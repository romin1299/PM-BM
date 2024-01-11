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
import { Box } from "@mui/material";
import { chartColors } from "../../Utils/ChartUtils/chartEnums";
import ChartTitleBar from "../Common/ChartTitleBar";

const YearlyContributionBarChart = () => {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
  );

  const dataset = {
    _id: null,
    machineId: [],
    labels: ["Group 1", "Group 2", "Group 3", "Group 4", "Group 5"],
    data: [100, 80, 65, 20, 200],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    maxBarThickness: 100,
    indexAxis: "y",
    plugins: {
      legend: {
        display: false,
        labels: {
          usePointStyle: true,
        },
      },
      datalabels: {
        font: { weight: "bold", size: 12 },
        // anchor: "end",
        // align: "top",
        // offset: 1,
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
        title: {
          display: false,
          text: "Machines",
        },
      },
      y: {
        grid: {
          display: false,
        },
        title: {
          display: false,
          text: "Total Hours",
        },
      },
    },
  };
  const datasets = [
    {
      label: "Top 20",
      data: dataset?.data,
      backgroundColor: chartColors[0],
      borderColor: chartColors[7],
      borderWidth: 1,
    },
  ];

  const data = {
    labels: dataset?.labels,
    datasets,
  };

  return (
    <Box className="cell p-3">
      <ChartTitleBar title={"Yearly Contribution"} />

      <Box sx={{ height: { xs: "300px", md: "350px" } }}>
        <Bar options={options} data={data} />
      </Box>
    </Box>
  );
};

export default YearlyContributionBarChart;
