import React from "react";
import { Chart } from "react-chartjs-2";
import { Box, Divider, Paper, Typography } from "@mui/material";
import { chartColors } from "../../Utils/ChartUtils/chartEnums";
import { Row, Col } from "react-bootstrap";
import { FilterMenu } from "./SubComponents/FilterMenu";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  PointElement,
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
      ticks: {
        maxRotation: 90,
        minRotation: 90,
        // padding: 10,
        color: "black",
      },
    },
    y: {
      stacked: true,
      title: {
        display: true,
        text: "Hours",
      },
      ticks: {
        color: "black",
      },
    },
  },
};

const TM_Names = [
  "Jatindar",
  "Mangal",
  "Ujjawal",
  "NeeraK",
  "Dalip",
  "Gagandeep",
  "Inderjeet",
  "Shubhash",
  "Ashish",
  "Sandeep",
  "Anshul",
  "Shreekant",
];

export const data = {
  labels: TM_Names,
  datasets: [
    {
      type: "line",
      label: "Dataset 1",
      data: [432, 863, 543, 123, 474, 653, 655, 378, 302, 945, 234, 743],
      borderColor: chartColors.blue[1],
      //borderWidth: 2,
      fill: false,
      backgroundColor: chartColors.blue[1],
      pointBorderColor: chartColors.blue[1],
    },
    {
      type: "bar",
      stack: "bar-stacked",
      label: "Dataset 2",
      data: [432, 863, 543, 123, 474, 653, 655, 378, 302, 945, 234, 743],
      backgroundColor: chartColors.brown[0],
      borderColor: chartColors.brown[0],
      borderWidth: 0,
      pointStyle: "rect",
    },
    {
      type: "bar",
      stack: "bar-stacked",
      label: "Dataset 3",
      data: [432, 263, 543, 223, 574, 653, 255, 778, 1032, 145, 734, 243],
      backgroundColor: chartColors.red[0],
      borderColor: chartColors.red[0],
      borderWidth: 0,
      pointStyle: "rect",
    },
  ],
};

const MTTRTrend = () => {
  return (
    <Box className="cell p-3">
      <Row style={{ marginBottom: "1rem" }}>
        <Typography className="col" variant="h5" component="h5">
          MTTR Trend
        </Typography>

        <Col className="col-auto d-flex">
          <FilterMenu DropdownValue="hour" />
        </Col>
      </Row>
      <Divider sx={{ mb: 4, borderColor: "black" }} />
      <Chart options={options} data={data} />
    </Box>
    // <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
    //   <Typography variant="h5" component="h4">
    //     TM Load
    //   </Typography>

    //   <Divider sx={{ mb: 4, borderColor: "black" }} />

    //   <Chart options={options} data={data} />
    // </Paper>
  );
};

export default MTTRTrend;
