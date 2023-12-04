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
import { Box, Paper, Typography } from "@mui/material";
import { Row } from "react-bootstrap";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { chartColors } from "../../Utils/ChartUtils/chartEnums";

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
      align: "end",
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
        text: "Months",
      },
      ticks: {
        color: 'black'
      },
    },
    y: {
      stacked: true,
      position: "left",
      ticks: {
        color: 'black'
      },
    },
  },
};

const dataset = [
  {
    type: "bar",
    stack: "bar-stacked",
    label: "< 60",
    data: [35, 41],
    yAxisID: "y",
    pointStyle: 'rect',
  },
  {
    type: "bar",
    stack: "bar-stacked",
    label: "< 120",
    data: [68, 35],
    yAxisID: "y",
    pointStyle: 'rect',
  },
  {
    type: "bar",
    stack: "bar-stacked",
    label: "> 120",
    data: [126, 215],
    yAxisID: "y",
    pointStyle: 'rect',
  },
];

export const data = {
  labels: ["Fy22", "Fy23Cumm"],
  datasets: dataset.map((dataset, i) => ({
    ...dataset,
    backgroundColor: chartColors[i - 1],
  })),
};

const YearlyTrendChart = () => {
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
    <Box className="cell p-3 mt-1">
      <Row>
        <Typography
          className="col"
          variant="h5"
          component="h5"
          sx={{ fontWeight: "500" }}
        >
          Yearly Trend
        </Typography>
      </Row>

      <div style={{ width: "100%", height: "300px" }}>
        <Chart data={data} options={options} />
      </div>
    </Box>
  );
};

export default YearlyTrendChart;
