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
    // y2: {
    //   position: "right",
    //   ticks: {
    //     color: "black",
    //   },
    // },
  },
};

const StackedBarChart = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });

  const fetchChartData = async () => {
    const url = ``;
    const params = {};

    try {
      const res = await axios.get(url, {
        params,
        withCredentials: true,
        credentials: "include",
        headers: { "content-type": "application/json" },
      });
      // console.log("monthly bd trend res:", res);

      const data = res?.data?.bdTrendData;
      const barDatasets = res?.data?.bdTrendData?.map((item, index) => ({
        type: "bar",
        stack: "bar-stacked",
        label: item?.label || item?._id,
        data: item?.data,
        backgroundColor: chartColors.palettes[0][index],
      }));

      const targetData = res?.data?.bdTrendDataTarget;
      // const targetData = getRandomDataArray(12, 5, 8);

      if (data) {
        setChartData({
          labels: MONTH_LABELS,
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

  // console.log("chartData:", chartData);

  //   useEffect(() => {
  //     if (flagForTogglingFilter && selectedValue && selectedYear && filter)
  //       fetchChartData();
  //   }, [flagForTogglingFilter, selectedValue, filter, selectedYear]);

  useEffect(() => {
    setChartData({
      labels: MONTH_LABELS,
      datasets: [
        // {
        //   type: "line",
        //   label: "Target",
        //   data: [221, 220, 220, 220, 220, 221, 220, 220, 220, 220, 220, 218],
        //   borderWidth: 2,
        //   borderColor: "#9F0000",
        //   backgroundColor: "#9F0000",
        //   pointStyle: "rectRot",
        // },
        {
          type: "bar",
          stack: "bar-stacked",
          label: "Grp1",
          data: [0, 0, 0, 0, 0, 0, 0, 0, 2.94, 0.48, 0, 0],
          backgroundColor: "#c2c933",
        },
        {
          type: "bar",
          stack: "bar-stacked",
          label: "Grp2",
          data: [0, 0, 0, 0, 0, 0, 0, 0, 1.53, 0, 0, 0],
          backgroundColor: "#778899",
        },
        {
          type: "bar",
          stack: "bar-stacked",
          label: "Grp3",
          data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 3.11, 0, 0],
          backgroundColor: "#0BB4CB",
        },
      ],
    });
  }, []);

  return (
    <Box className="container-fluid cell p-3">
      <ChartTitleBar
        title="Machine Age"
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

export default StackedBarChart;
