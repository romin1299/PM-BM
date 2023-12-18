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
import ChartTitleBar from "../Common/ChartTitleBar";
import axios from "axios";
import DataNotFound from "../Common/DataNotFound";

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
  responsive: true,
  maintainAspectRatio: false,
  maxBarThickness: 100,
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
        // maxRotation: 90,
        // minRotation: 90,
        // padding: 10,
        color: "black",
      },
    },
    y: {
      stacked: true,
      title: {
        display: true,
        text: "Hours",
      },
      ticks: {
        color: "black",
      },
    },
  },
};

const TMLoad = ({ selectedValue }) => {
  const [data, setData] = React.useState({});

  const fetchChartData = async () => {
    console.log("selectedValue:", selectedValue);
    const url = `/mttrTrend/tmMTTRSkill/based-on-subSection/${selectedValue}`;
    try {
      const res = await axios.get(url, {
        withCredentials: true,
        credentials: "include",
      });
      // console.log("MTTR Trend res:", res);

      setData(res?.data?.tmLoadData?.[0]);
    } catch (error) {
      console.log("error:", error);
    }
  };

  React.useEffect(() => {
    if (selectedValue) fetchChartData();
  }, [selectedValue]);

  const chartData = {
    labels: data?.tm_names,
    datasets: [
      {
        type: "bar",
        stack: "bar-stacked",
        label: "Hours",
        data: data?.data,
        backgroundColor: chartColors.palettes[0][2],
        pointStyle: "rect",
        yAxisID: "y",
      },
    ],
  };

  // React.useEffect(() => {
  //   console.log("MTTR skill data:", data);
  // }, [data]);

  return (
    <Box className="cell p-3">
      <ChartTitleBar title="MTTR Trend" />

      <Box sx={{ height: { xs: "300px", md: "350px" } }}>
        {data?.length <= 0 ? (
          <DataNotFound />
        ) : (
          <Chart options={options} data={chartData} />
        )}
      </Box>
    </Box>
  );
};

export default TMLoad;
