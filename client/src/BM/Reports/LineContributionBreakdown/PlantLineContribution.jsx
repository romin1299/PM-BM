import React, { useState } from "react";
import { Chart } from "react-chartjs-2";
import { Box, Divider, Paper, Typography } from "@mui/material";
import { chartColors } from "../../Utils/ChartUtils/chartEnums";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
} from "chart.js";
import { Row, Col } from "react-bootstrap";
import { FilterMenu } from "../ManHourReport/SubComponents/FilterMenu";
import axios from "axios";
import DataNotFound from "../Common/DataNotFound";
import ChartTitleBar from "../Common/ChartTitleBar";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
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
      // title: {
      //     display: true,
      //     text: "Lines",

      // },
      ticks: {
        // maxRotation: 90,
        // minRotation: 90,
        color: "black",
      },
    },
    y: {
      stacked: true,
      title: {
        display: true,
        text: "% Contribution",
      },

      min: 0,
      // max: 20,
      stepSize: 5,
      ticks: {
        callback: function (value, index, values) {
          return value + " %";
        },
        color: "black",
      },
    },
    y2: {
      position: "right",
      title: {
        display: true,
        text: "Breakdown Hours",
      },
      min: 0,
      // max: 50,
      stepSize: 5,
      ticks: {
        color: "black",
      },
    },
  },
};

const PlantLineContribution = ({ selectedYear, selectedMonth }) => {
  const [data, setData] = React.useState({});

  const fetchChartData = async () => {
    const url = `/lineWiseBdContributionForPlant`;
    const params = { selectedYear: selectedYear, selectedMonth: selectedMonth };

    try {
      const res = await axios.get(url, {
        params,   //uncomment when database is updated with agrregated year and month values
        withCredentials: true,
        credentials: "include",
      });

      // console.log("plant contri res:", res.data);
      setData(res?.data?.lineWiseBDData[0]);
    } catch (error) {
      console.log("error:", error);
    }
  };

  React.useEffect(() => {
    fetchChartData();
  }, [selectedYear, selectedMonth]);

  const chartData = {
    labels: data?.lineNames,
    datasets: [
      {
        type: "line",
        label: "Breakdown Hrs",
        data: data?.bdHours,
        fill: false,
        borderWidth: 2,
        borderColor: chartColors.magenta[1],
        backgroundColor: chartColors.magenta[1],
        pointStyle: "rectRot",
        pointRadius: 5,
        pointBorderColor: chartColors.magenta[1],
        yAxisID: "y2",
      },
      {
        type: "bar",
        stack: "bar-stacked",
        label: "% Contribution",
        data: data?.percentages,
        backgroundColor: chartColors.palettes[0][2],
        pointStyle: "rect",
        yAxisID: "y",
      },
    ],
  };

  // React.useEffect(() => {
  //   console.log("plant data:", data);
  // }, [data]);

  return (
    <Box className="cell p-3">
      <ChartTitleBar title="Plant Contribution" />

      <Box sx={{ height: { xs: "300px", md: "400px" } }}>
        {data === undefined ? (
          <DataNotFound />
        ) : (
          <Chart options={options} data={chartData} />
        )}
      </Box>
    </Box>
  );
};

export default PlantLineContribution;
