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
import { Box, Typography } from "@mui/material";
import { Col, Row } from "react-bootstrap";
import { chartColors } from "../../Utils/ChartUtils/chartEnums";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const options = {
  plugins: {
    annotation: {
      annotations: {
        line1: {
          // Indicates the type of annotation
          type: "line",
          yMin: 1,
          yMax: 1,
          borderColor: chartColors[3],
          //borderWidth: 2,
        },
      },
    },
    legend: {
      display: false,
      labels: {
        usePointStyle: true,
      },
    },
    datalabels: {
      display: false,
    },
  },
  responsive: true,
  scales: {
    x: {
      stacked: true,
      grid: {
        display: false,
      },
      title: {
        display: true,
        text: "Months",
      },
      ticks: {
        color: "black",
      },
    },
    y: {
      stacked: true,
      ticks: {
        color: "black",
      },
    },
  },
};

const serverResLabels = [
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
];

const serverResDataset = [
  {
    label: "BM",
    data: [1.5, 2.4, 1.3, 1.8, 0.5, 0.3, 1.3, 1.3, 1, 1.2, 0.5, 2.5],
  },
];

export const data = {
  labels: serverResLabels,
  datasets: serverResDataset.map((dataset, i) => ({
    ...dataset,
    backgroundColor: chartColors.green[1],
  })),
};

const MTBFTrendChart = () => {
  return (
    <Box className="cell p-3">
      <Row style={{ marginBottom: "1rem" }}>
        <Typography className="col" variant="h5" component="h5">
          MTBF Trend
        </Typography>
      </Row>

      <Bar options={options} data={data} />
    </Box>
  );
};

export default MTBFTrendChart;
