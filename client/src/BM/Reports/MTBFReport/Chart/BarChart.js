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
import { Bar, Line } from "react-chartjs-2";
import { Box, Typography } from "@mui/material";
import { Col, Row } from "react-bootstrap";
import { chartColors } from "../../../Utils/ChartUtils/chartEnums";

const BarChart = ({ title, dataset, setValue, clearErrors }) => {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
  );

  const options = {
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
    maintainAspectRatio: false,
    responsive: true,
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
        min: 0,
        max: 3,
      },
    },

    onClick: (event, element) => {
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
      <Row style={{ marginBottom: "1rem" }}>
        <Typography className="col" variant="h5" component="h5">
          Machine Trend
        </Typography>
      </Row>

      <div style={{ width: "100%", height: "250px" }}>
        <Bar options={options} data={data} />
      </div>
    </Box>
  );
};

export default BarChart;
