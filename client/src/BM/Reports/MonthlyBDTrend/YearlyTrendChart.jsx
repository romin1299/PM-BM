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
import { commonDatalabels } from "../../Utils/ChartUtils/chartOptions";
import { getRandomDataArray } from "../../Utils/math/generateRandomValues";

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
    datalabels: commonDatalabels,
  },
  scales: {
    x: {
      stacked: true,
      grid: {
        display: false,
      },
      title: {
        display: true,
        text: "Financial Year",
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
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });

  React.useEffect(() => {
    if (currentTabViewName === "Plant" && filter === "cell")
      setFilter("section");
    else if (currentTabViewName === "Section" && filter === "section")
      setFilter("cell");
  }, [currentTabViewName]);

  const fetchChartData = async () => {
    const basedON = currentTabViewName === "Plant" ? "plantId" : "subSection";
    const selectedId = currentTabViewName === "Plant" ? "undefined" : sectionId;

    // console.log("sectionId:", sectionId);
    // const url =
    //   currentTabViewName === "Plant"
    //     ? `/${filter}YearlyBdTrendForPlant`
    //     : `/${filter}YearlyBdTrendForSection/based-on-subSection/${sectionId}`;
    const url = `/${filter}YearlyBdTrend/based-on-${basedON}/${selectedId}`;
    // console.log("url:", url);

    const params = { selectedYear };

    try {
      const res = await axios.get(url, {
        params,
        withCredentials: true,
        credentials: "include",
      });
      console.log("yearly bd trend res:", res);

      const data = res?.data?.bdTrendData;
      const barDatasets = res?.data?.bdTrendData?.map((item, index) => ({
        type: "bar",
        stack: "bar-stacked",
        label: item?.label || item?._id,
        data: item?.data,
        backgroundColor: chartColors.palettes[0][index],
      }));
      // const targetData = res?.data?.targetData;
      const targetData = getRandomDataArray(2, 5, 8);

      if (data) {
        setChartData({
          labels: res?.data?.labels,
          datasets: [
            {
              type: "line",
              label: "Target",
              data: targetData,
              borderWidth: 2,
              borderColor: chartColors.red[2],
              backgroundColor: chartColors.red[2],
              pointStyle: "rectRot",
            },
            ...barDatasets,
          ],
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
          <Chart
            type="bar"
            options={options}
            data={chartData}
            plugins={[ChartDataLabels]}
          />
        )}
      </Box>
    </Box>
  );
};

export default YearlyTrendChart;
