import React from "react";
import { Chart } from "react-chartjs-2";
import { Box, Divider, Paper, Typography } from "@mui/material";
import { chartColors } from "../../Utils/ChartUtils/chartEnums";
import annotationPlugin from "chartjs-plugin-annotation";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
} from "chart.js";
import { Col, Row } from "react-bootstrap";
import { FilterMenu } from "../MTTRReport/SubComponents/FilterMenu";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  PointElement,
  Legend
);
ChartJS.register(annotationPlugin);

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
          borderWidth: 2,
        },
      },
    },
    legend: {
      align: "end",
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
        display: false, // Hide vertical grid lines
      },
      title: {
        display: true,
        text: "Machines",
      },
      ticks: {
        maxRotation: 90,
        minRotation: 90,
        // padding: 10,
      },
      ticks:{
        color:'black',
      }
    },
    y: {
      stacked: true,
      grid: {
        display: false,
      },
      title: {
        display: true,
        text: "Hours",
      },
      ticks:{
        color:'black',
      }
    },
  },
};

const machineNames = [
  "MA5",
  "FANW21",
  "MFI21",
  "OEPS21",
  "PPLIN1",
  "SHN1",
  "JLD2",
  "ABT2",
  "MIK1",
  "LPD2",
  "PWL12",
  "AWQ4",
];

export const data = {
  labels: machineNames,
  datasets: [
    {
      type: "bar",
      stack: "bar-stacked",
      label: "BM",
      data: [2.5, 2.4, 2.3, 2.3, 2.1, 2.0, 1.5, 1.3, 1, 1, 0.5, 0.5],
      backgroundColor: chartColors.blue[3],
      tension: 0.1
    },
  ],
};

const LineTrend = () => {
  return (
    <Box className="cell p-3">
      <Row style={{ marginBottom: "1rem" }}>
        <Typography className="col" variant="h5" component="h5">
          Line Trend
        </Typography>

        <Col className="col-auto d-flex">
          <FilterMenu DropdownValue="hour" />
        </Col>
      </Row>

      <Chart options={options} data={data} />
    </Box>
  );
};

export default LineTrend;
