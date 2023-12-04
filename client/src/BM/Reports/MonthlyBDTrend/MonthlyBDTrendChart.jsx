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
import { Row, Container } from "react-bootstrap";
import { MONTH_LABELS, chartColors } from "../../Utils/ChartUtils/chartEnums";
import ChartDataLabels from "chartjs-plugin-datalabels";
import axios from "axios";

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
        color: "black",
      },
    },
    y: {
      stacked: true,
      position: "left",
      ticks: {
        color: "black",
      },
    },
    y2: {
      position: "right",
      ticks: {
        color: "black",
      },
    },
  },
};

const getRandomDataArray = (max = 30) => {
  return Array.from({ length: 8 }, () => Math.floor(Math.random() * max));
};

const MonthlyBDTrendChart = ({ filter, currentTabViewName, sectionId }) => {
  const [resData, setResData] = useState({});
  const [chartDatasets, setChartDatasets] = useState([]);

  const fetchChartData = async () => {
    const url =
      currentTabViewName === "Plant"
        ? `/${filter}MonthlyBdTrendForPlant`
        : `/${filter}MonthlyBdTrendForSection/${sectionId}`;

    try {
      const res = await axios.get(url, {
        withCredentials: true,
        credentials: "include",
      });

      // setResData(res.data.monthlyBDTrendHourly);

      if (currentTabViewName === "Plant") {
        if (filter === "hourly") {
          console.log("plant hourly res:", res.data.monthlyBDTrendHourly);

          // let object = {
          //   labels: ["Apr", "May", "Mar"],
          //   lessThanOne: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          //   lessThanTwo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          //   greaterThanTwo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          // };

          // let hourlyArray = [
          //   {
          //     label: "< 1",
          //     data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          //   },
          //   {
          //     label: "< 2",
          //     data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          //   },
          // ];
        } else {
          console.log("plant section res:", res.data.monthlyBDTrendSection);

          // let sectionArray = [
          //   {
          //     label: "Parts",
          //     data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          //   },
          //   {
          //     label: "Gasoline",
          //     data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          //   },
          // ];
        }
      } else {
        console.log("section res:", res);
      }
    } catch (error) {
      console.log("error:", error);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, [currentTabViewName, sectionId, filter]);

  const dummyDatasets = [
    {
      type: "bar",
      stack: "bar-stacked",
      label: "< 1",
      // data: getRandomDataArray(10),
      data: resData?.lessThanOne,
      backgroundColor: chartColors.palettes[0][0],
    },
    {
      type: "bar",
      stack: "bar-stacked",
      label: "< 2",
      // data: getRandomDataArray(10),
      data: resData?.lessThanTwo,
      backgroundColor: chartColors.palettes[0][1],
    },
    {
      type: "bar",
      stack: "bar-stacked",
      label: "> 2",
      // data: getRandomDataArray(10),
      data: resData?.greaterThanTwo,
      backgroundColor: chartColors.palettes[0][2],
    },
  ];

  function convertToChartDatasets(resData) {
    const chartDatasets = [];

    Object.keys(resData).forEach((key, index) => {
      chartDatasets.push({
        type: "bar",
        stack: "bar-stacked",
        label: key.replace("lessThan", "< ").replace("greaterThan", "> "),
        data: resData[key],
        backgroundColor: chartColors.palettes[0][index],
      });
    });

    return chartDatasets;
  }

  // useEffect(() => {
  //   const { labels, _id, ...resDatasets } = resData;

  //   setChartDatasets(convertToChartDatasets(resDatasets));
  // }, [resData]);

  const chartData = {
    labels: MONTH_LABELS,
    datasets: dummyDatasets,
  };

  return (
    <Box className="container-fluid cell p-3 mt-1">
      <Row>
        <Typography
          className="col"
          variant="h5"
          component="h5"
          sx={{ fontWeight: "500" }}
        >
          Electronics: Monthly Breakdown Trend
        </Typography>
      </Row>

      <div style={{ width: "100%", height: "300px" }}>
        <Chart data={chartData} options={options} />
      </div>
    </Box>
  );
};

export default MonthlyBDTrendChart;
