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
import { FilterMenu } from "./SubComponents/FilterMenu";

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
      anchor: "end",
      align: "top",
      offset: 1,
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
    },
    y: {
      min: 0,
      max: 3,
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
    data: [2.5, 2.4, 2.3, 2.3, 2.1, 2.0, 1.5, 1.3, 1, 1, 0.5, 0.5],
  },
];
export const data = {
  labels: serverResLabels,
  datasets: serverResDataset.map((dataset, i) => ({
    ...dataset,
    backgroundColor: chartColors[3],
    borderColor: chartColors[3],
  })),
};

const MachineTrend = () => {
  return (
    <Box className="cell p-3 mb-3">
      <Row style={{ marginBottom: "1rem" }}>
        <Typography className="col" variant="h5" component="h5">
          Machine Trend
        </Typography>

        <Col className="col-auto d-flex">
          <FilterMenu DropdownValue="hour" />
        </Col>
      </Row>

      <div style={{ height: "250px" }}>
        <Line height={100} options={options} data={data} />
      </div>
    </Box>
  );
};

export default MachineTrend;
