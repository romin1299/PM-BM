import React from "react";
import { Chart } from "react-chartjs-2";
import { Box, Divider, Paper, Typography } from "@mui/material";
import { chartColors } from "../../Utils/ChartUtils/chartEnums";
import { Row, Col } from "react-bootstrap";
import { FilterMenu } from "../ManHourReport/SubComponents/FilterMenu";

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
        text: "TM Names",
      },
      ticks: {
        maxRotation: 90,
        minRotation: 90,
        // padding: 10,
        color:'black',
      },
    },
    y: {
      stacked: true,
      title: {
        display: true,
        text: "Hours",
      },
      ticks: {
        color: 'black'
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
      type: "bar",
      stack: "bar-stacked",
      label: "Dataset 2",
      data: [432, 863, 543, 123, 474, 653, 655, 378, 302, 945, 234, 743],
      backgroundColor: chartColors.brown[0],
      borderColor: chartColors.brown[0],
      borderWidth: 0,
      pointStyle:'rect',
    },
    
  ],
};

const TMLoad = () => {
  return (
    <Box className="cell p-3">
      <Row style={{ marginBottom: "1rem" }}>
        <Typography
          className="col"
          variant="h5"
          component="h5"
        >
          TM Load
        </Typography>

        <Col className="col-auto d-flex">
          <FilterMenu DropdownValue="hour" />
        </Col>
      </Row>
      <Divider sx={{ mb: 4, borderColor: "black" }} />
      <Chart options={options} data={data} />
    </Box>
  );
};

export default TMLoad;
