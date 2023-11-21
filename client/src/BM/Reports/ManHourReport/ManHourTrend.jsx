import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import Paper from "@mui/material/Paper";
import { Box, Divider, Typography } from "@mui/material";
import { chartColors, MONTH_LABELS } from "../../Utils/ChartUtils/chartEnums";
import { Col, Row } from "react-bootstrap";
import { FilterMenu } from "./SubComponents/FilterMenu";

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const options = {
  plugins: {
    legend: {
      align: "end",
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
        display: false, // Hide vertical grid lines
      },
      title: {
        display: true,
        text: "Months",
      },
    },
    y: {
      stacked: true,
      title: {
        display: true,
        text: "Hours",
      },
    },
  },
};

export const data = {
  labels: MONTH_LABELS,
  datasets: [
    {
      label: "BM",
      data: [432, 863, 543, 123, 474, 653, 655, 378, 302, 945, 234, 743],
      backgroundColor: chartColors.orange[2],
    },
    {
      label: "PM",
      data: [432, 263, 543, 223, 574, 653, 255, 778, 1032, 145, 734, 243],
      backgroundColor: chartColors.aqua[1],
    },
  ],
};

const ManHourTrend = () => {
  return (
    <Box className="cell p-3">
      <Row style={{ marginBottom: "1rem" }}>
        <Typography
          className="col"
          variant="h5"
          component="h5"
        >
          Man-Hour Trend
        </Typography>

        <Col className="col-auto d-flex">
          <FilterMenu DropdownValue="hour" />
        </Col>
      </Row>

      <Bar options={options} data={data} />
    </Box>
  );
};

export default ManHourTrend;
