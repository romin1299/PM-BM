import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import { Box, Typography } from "@mui/material";
import { Row } from "react-bootstrap";
import { chartColors } from "../../Utils/ChartUtils/chartEnums";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Register the plugin to all charts:
ChartJS.register(ChartDataLabels);

export const options = {
  maintainAspectRatio: false,
  responsive: true,
  plugins: {
    legend: {
      labels: {
        usePointStyle: true,
      },
    },
    datalabels: {
      formatter: (value, context) => {
        return value > 30 ? value : "";
      },
      formatter: (value, context) => {
        if (context.dataset.type === "bar") {
          return value > 30 ? value : "";
        }
        return value;
      },
      font: { weight: "bold", size: 8 },
      // color: (context) => context.dataset.type === "line" ? chartColors[3] : "gray",
      anchor: (context) => (context.dataset.type === "line" ? "end" : "center"),
      align: (context) => (context.dataset.type === "line" ? "top" : "center"),
      offset: (context) => (context.dataset.type === "line" ? -2 : 0),
    },
  },
  // elements: {
  //   bar: {
  //     borderColor: "000",
  //     borderWidth: 1,
  //   },
  // },
  scales: {
    x: {
      stacked: true,
      grid: {
        display: false,
      },
      title: {
        display: true,
        text: "Days",
      },
    },
    y: {
      stacked: true,
      position: "left",
    },
    y2: {
      position: "right",
    },
  },
};

const daysLabels = Array.from({ length: 30 }, (_, i) => (i + 1).toString());

const getRandomDataArray = (max = 30) => {
  return Array.from({ length: 30 }, () => Math.floor(Math.random() * max));
};

const dataset = [
  {
    type: "line",
    label: "Total Count",
    data: getRandomDataArray(30),
    borderColor: chartColors[3],
    borderWidth: 2,
    fill: false,
    yAxisID: "y2",
  },
  {
    type: "bar",
    stack: "bar-stacked",
    label: "< 60",
    data: getRandomDataArray(60),
    yAxisID: "y",
  },
  {
    type: "bar",
    stack: "bar-stacked",
    label: "< 120",
    data: getRandomDataArray(120),
    yAxisID: "y",
  },
  {
    type: "bar",
    stack: "bar-stacked",
    label: "> 120",
    data: getRandomDataArray(140),
    yAxisID: "y",
  },
];

export const data = {
  labels: daysLabels,
  datasets: dataset.map((dataset, i) => ({
    ...dataset,
    backgroundColor: chartColors[i - 1],
  })),
};

const DailyBDTrendChart = () => {
  const [filteredData, setFilteredData] = useState(data);

  const [filterOptions, setFilterOptions] = useState({
    lessThan60: false,
    lessThan120: false,
    greaterThan120: false,
  });

  const handleCheckboxChange = (option) => {
    setFilterOptions((prevOptions) => ({
      ...prevOptions,
      [option]: !prevOptions[option],
    }));
  };

  //   const filterData = () => {
  //     // Implement filtering logic here based on checkbox states
  //   };

  //   useEffect(() => {
  //     filterData();
  //   }, [filterOptions]);

  return (
    <Box className="p-3">
      <Row style={{ marginBottom: "1rem" }}>
        <Typography
          className="col"
          variant="h5"
          component="h5"
          sx={{ fontWeight: "500" }}
        >
          Daily Breakdown Trend
        </Typography>
      </Row>

      <div style={{ width: "100%", height: "300px" }}>
        <Chart data={data} options={options} />
      </div>
    </Box>
  );
};

export default DailyBDTrendChart;
