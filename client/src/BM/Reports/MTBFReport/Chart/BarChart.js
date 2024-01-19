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
import { chartColors } from "../../../Utils/ChartUtils/chartEnums";
import ChartTitleBar from "../../Common/ChartTitleBar";
import Loading from "../../../../components/Loading/Loading";

const BarChart = ({
  title,
  loading = false,
  dataset,
  setValue,
  clearErrors,
  AppendToolComponents,
}) => {
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
    maintainAspectRatio: false,
    maxBarThickness: 100,
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
          display: true,
          text: "Machines",
        },
      },
      y: {
        title: {
          display: true,
          text: "Total Hours",
        },
        // beginAtZero: false,
      },
    },

    onClick:
      setValue &&
      ((event, element) => {
        if (element?.length > 0) {
          setValue(
            "selectedMachine._id",
            dataset?.machineId?.[element?.[0]?.index]
          );
          setValue(
            "selectedMachine.machine_code",
            dataset?.labels?.[element?.[0]?.index]
          );
          clearErrors("selectedMachine");
        }
      }),
  };
  const datasets = [
    {
      label: "Top 20",
      data: dataset?.data,
      backgroundColor: chartColors.barChart,
      // borderColor: "#243552",
      // borderWidth: 1,
      borderRadius: 4,
    },
  ];

  const data = {
    labels: dataset?.labels,
    datasets,
  };

  return (
    <Box className="cell p-3">
      <ChartTitleBar title={title} Toolbar={AppendToolComponents} />

      {loading ? (
        <Loading height={200} />
      ) : (
        <Box sx={{ height: { xs: "300px", md: "350px" } }}>
          <Bar options={options} data={data} />
        </Box>
      )}
    </Box>
  );
};

export default BarChart;
