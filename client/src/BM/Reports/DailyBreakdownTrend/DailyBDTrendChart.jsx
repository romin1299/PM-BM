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
      formatter: (value, context) => value || "",
      // formatter: (value, context) => {
      //   if (context.dataset.type === "bar") {
      //     return value > 30 ? value : "";
      //   }
      //   return value;
      // },
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

const DailyBDTrendChart = ({ selectedValue, flagForCellAndLineToggle }) => {
  const [filteredData, setFilteredData] = useState([]);

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

  const [dailyBreakdownTrendData, setDailyBreakdownTrendData] = useState({
    // labels: daysLabels,

    // dayWiseCount: getRandomDataArray(30),
    // lessThanOrEqualToOneHourData: getRandomDataArray(60),
    // greaterThenOneAndLessThanOrEqualToTwoHourData: getRandomDataArray(120),
    // greaterThenTwoHourData: getRandomDataArray(180),

    labels: [],

    dayWiseCount: [],
    lessThanOrEqualToOneHourData: [],
    greaterThenOneAndLessThanOrEqualToTwoHourData: [],
    greaterThenTwoHourData: [],
  });

  const getDailyBreakdownTrendData = async () => {
    try {
      const res = await fetch(
        `/getDailyBreakdownTrendData/${flagForCellAndLineToggle}/632c41261d1becfedab325f9`,
        // `/getMTTRGraphData/${flagForCellAndLineToggle}/${selectedValue}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const { message, dailyBreakdownTrendData } = await res.json();

      if (res?.status === 201) {
        setDailyBreakdownTrendData(dailyBreakdownTrendData);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (selectedValue) {
      getDailyBreakdownTrendData();
    }
  }, [selectedValue]);

  const datasets = [
    {
      type: "line",
      label: "Total Count",
      data: dailyBreakdownTrendData?.dayWiseCount,
      borderColor: chartColors[3],
      borderWidth: 2,
      fill: false,
      yAxisID: "y2",
    },
    {
      type: "bar",
      stack: "bar-stacked",
      label: "< 1",
      data: dailyBreakdownTrendData?.lessThanOrEqualToOneHourData,
      yAxisID: "y",
      backgroundColor: chartColors[0],
    },
    {
      type: "bar",
      stack: "bar-stacked",
      label: "< 2",
      data: dailyBreakdownTrendData?.greaterThenOneAndLessThanOrEqualToTwoHourData,
      backgroundColor: chartColors[1],
      yAxisID: "y",
    },
    {
      type: "bar",
      stack: "bar-stacked",
      label: "> 2",
      data: dailyBreakdownTrendData?.greaterThenTwoHourData,
      backgroundColor: chartColors[2],
      yAxisID: "y",
    },
  ];

  const data = {
    labels: dailyBreakdownTrendData?.labels,
    datasets,
  };

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
