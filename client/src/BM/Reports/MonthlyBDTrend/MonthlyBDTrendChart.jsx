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
import DataNotFound from "../Common/DataNotFound";
import ChartTitleBar from "../Common/ChartTitleBar";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const options = {
  maintainAspectRatio: false,
  responsive: true,
  maxBarThickness: 100,
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
      title: {
        display: true,
        text: "BD Hours",
      },
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

const MonthlyBDTrendChart = ({
  currentTabViewName,
  sectionId,
  filter,
  setFilter,
  selectedYear,
}) => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });

  useEffect(() => {
    if (currentTabViewName === "Plant" && filter === "cell")
      setFilter("section");
    else if (currentTabViewName === "Section" && filter === "section")
      setFilter("cell");
  }, [currentTabViewName]);

  const fetchChartData = async () => {
    const url =
      currentTabViewName === "Plant"
        ? `/${filter}MonthlyBdTrendForPlant`
        : `/${filter}MonthlyBdTrendForSection/based-on-subSection/${sectionId}`;

    const params = { selectedYear };

    try {
      const res = await axios.get(url, {
        params,
        withCredentials: true,
        credentials: "include",
      });

      const data = res?.data?.bdTrendData;
      if (data) {
        // console.log("Monthly hourly res:", res);

        setChartData({
          labels: MONTH_LABELS,
          datasets: res?.data?.bdTrendData?.map((item, index) => ({
            type: "bar",
            stack: "bar-stacked",
            label: item?.label || item?._id,
            data: item?.data,
            backgroundColor: chartColors.palettes[0][index],
          })),
        });
      }
    } catch (error) {
      console.log("error:", error);
      setChartData({
        labels: [],
        datasets: [],
      });
    }
  };

  // console.log("chartData:", chartData);

  useEffect(() => {
    if (selectedYear && filter) fetchChartData();
  }, [currentTabViewName, sectionId, filter, selectedYear]);

  return (
    <Box className="container-fluid cell p-3 mt-1">
      <ChartTitleBar
        title="Monthly Breakdown Trend"
        // titleProps={{
        //   sx: { fontWeight: "500" },
        // }}
      />

      <Box sx={{ height: { xs: "300px", md: "350px" } }}>
        {chartData === undefined || chartData?.datasets?.length < 1 ? (
          <DataNotFound />
        ) : (
          <Chart type="bar" options={options} data={chartData} />
        )}
      </Box>
    </Box>
  );
};

export default MonthlyBDTrendChart;
