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
        text: "Months",
      },
      ticks:{
        color:'black',
      }
    },
    y: {
      min: 0,
      max: 3,
      maxRotation: 90,
        minRotation: 90,
      ticks:{
        color:'black',
      }
    },
  },
};

const serverResLabels = [
  "Mc1",
  "Mc2",
  "Mc3",
  "Mc4",
  "Mc5",
  "Mc6",
  "Mc7",
  "Mc8",
  "Mc9",
  "Mc10",
  "Mc11",
  "Mc12",
];

const serverResDataset = [
  {
    label: "Top 20",
    data: [0.5, 0.5, 1, 1, 1.3, 1.5, 2.0, 2.1, 2.3, 2.3, 2.4, 2.5],
  },
];

export const data = {
  labels: serverResLabels,
  datasets: serverResDataset.map((dataset, i) => ({
    ...dataset,
    backgroundColor: chartColors.orange[2],
    borderColor: chartColors.orange[2],
    borderWidth: 1,
  })),
};

const MachineTrend = () => {
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

export default MachineTrend;
