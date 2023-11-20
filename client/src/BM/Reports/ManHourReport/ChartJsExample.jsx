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
    },
    y: {
      stacked: true,
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
    data: [432, 863, 543, 123, 474, 653, 655, 378, 302, 945, 234, 743],
  },
  {
    label: "PM",
    data: [432, 263, 543, 223, 574, 653, 255, 778, 1032, 145, 734, 243],
  },
];

// for multi charts i.e. line and bar combined
const otherDataConfigs = [
  {
    type: "line",
    borderColor: chartColors.orange[1],
    borderWidth: 2,
    fill: false,
  },
  {
    type: "bar",
    stack: "bar-stacked",
  },
  {
    type: "bar",
    stack: "bar-stacked",
  },
];

const colorPreset = [chartColors[1], chartColors[2]];

export const data = {
  labels: serverResLabels,
  datasets: serverResDataset.map((dataset, i) => ({
    ...dataset,
    backgroundColor: chartColors[i],
  })),
};

const ChartToPPTExample = () => {
  return (
    <Box className="cell p-3">
      <Row style={{ marginBottom: "1rem" }}>
        <Typography
          className="col"
          variant="h5"
          component="h5"
        >
          Hour Trend - Example
        </Typography>

        <Col className="col-auto d-flex">
          <FilterMenu DropdownValue="hour" />
        </Col>
      </Row>

      <Bar options={options} data={data} />
    </Box>
  );
};

export default ChartToPPTExample;
