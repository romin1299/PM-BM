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
import { MONTH_LABELS, chartColors } from "../../Utils/ChartUtils/chartEnums";
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
    },
  },
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
  },
};

const YearlyTrendChart = ({
  currentTabViewName,
  sectionId,
  filter,
  setFilter,
}) => {
  const [data, setData] = React.useState([]);
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });

  // Register the data-labels plugin to this component:
  ChartJS.register(ChartDataLabels);

  React.useEffect(() => {
    if (currentTabViewName === "Plant" && filter === "cell")
      setFilter("section");
    else if (currentTabViewName === "Section" && filter === "section")
      setFilter("cell");
  }, [currentTabViewName]);

  const fetchChartData = async () => {
    const url =
      currentTabViewName === "Plant"
        ? `/${filter}YearlyBdTrendForPlant`
        : `/${filter}YearlyBdTrendForSection/based-on-subSection/${sectionId}`;

    try {
      const res = await axios.get(url, {
        withCredentials: true,
        credentials: "include",
      });

      console.log("yearly hourly res:", res);
      setData(res?.data?.bdTrendData);
    } catch (error) {
      console.log("error:", error);
    }
  };

  React.useEffect(() => {
    fetchChartData();
  }, [currentTabViewName, sectionId, filter]);

  // React.useEffect(() => {
  //   console.log("yearly data state:", data);
  // }, [data]);

  React.useEffect(() => {
    setChartData({
      labels: data?.labels || ["FY'22", "FY'23 Cumm"],
      datasets: data?.map((item, index) => ({
        type: "bar",
        stack: "bar-stacked",
        label: item?.label || item?._id,
        data: item?.data,
        backgroundColor: chartColors.palettes[0][index],
      })),
    });
  }, [data]);

  return (
    <Box className="cell p-3 mt-1">
      <ChartTitleBar
        title="Yearly Trend"
        // titleProps={{
        //   sx: { fontWeight: "500" },
        // }}
      />

      <Box sx={{ height: { xs: "300px", md: "350px" } }}>
        {data?.length < 0 ? (
          <DataNotFound />
        ) : (
          <Chart options={options} data={chartData} />
        )}
      </Box>
    </Box>
  );
};

export default YearlyTrendChart;
