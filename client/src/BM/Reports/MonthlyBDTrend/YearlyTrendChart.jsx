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
import YearDropdown from "./YearDropdown";

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
  selectedYear,
}) => {
  // const [data, setData] = React.useState([]);
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
    console.log("sectionId:", sectionId);
    const url =
      currentTabViewName === "Plant"
        ? `/${filter}YearlyBdTrendForPlant`
        : `/${filter}YearlyBdTrendForSection/based-on-subSection/${sectionId}`;

    const params = { selectedYear };

    try {
      const res = await axios.get(url, {
        params,
        withCredentials: true,
        credentials: "include",
      });

      // console.log("labells:", res.data.labels);
      // setData(res?.data?.labels);

      const data = res?.data?.bdTrendData;
      if (data) {
        // console.log("yearly hourly res:", res);
        
        setChartData({
          labels: res?.data?.labels,
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

  React.useEffect(() => {
    if (selectedYear) fetchChartData();
  }, [currentTabViewName, sectionId, filter, selectedYear]);

  // console.log('chartData:', chartData)

  return (
    <Box className="cell p-3 mt-1">
      <ChartTitleBar
        title="Yearly Trend"
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

export default YearlyTrendChart;
