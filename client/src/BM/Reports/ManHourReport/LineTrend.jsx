import React, { useEffect, useState } from "react";
import { Chart } from "react-chartjs-2";
import { Box, Divider, Paper, Typography } from "@mui/material";
import { Row, Col } from "react-bootstrap";
import { chartColors } from "../../Utils/ChartUtils/chartEnums";
import { FilterMenu } from "./SubComponents/FilterMenu";
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
  responsive: true,
  scales: {
    x: {
      stacked: true,
      grid: {
        display: false, // Hide vertical grid lines
      },
      title: {
        display: true,
        text: "Lines",
      },
      ticks: {
        maxRotation: 90,
        minRotation: 90,
        // padding: 10,
        color: "black",
      },
    },

    y1: {
      stacked: true,
      position: "right",

      title: {
        display: true,
        text: "Percentage",
      },
      ticks: {
        color: "black",
      },
    },
    y2: {
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

const machineNames = [
  "MA5",
  "FANW21",
  "MFI21",
  "OEPS21",
  "PPLIN1",
  "SHN1",
  "JLD2",
  "ABT2",
  "MIK1",
  "LPD2",
  "PWL12",
  "AWQ4",
];

const LineTrend = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
  selectedMonth,
}) => {
  const [labels, setLabels] = useState([]);

  const [lineTrendData, setLineTrendData] = useState({
    lines: [],
    totalSumOf_PM: [],
    totalSumOf_BM: [],
    percentage: [],
  });

  const getLineTrendData = async () => {
    try {
      const res = await fetch(
        // `/manHourReport/lineTrend/${flagForTogglingFilter}/632c41261d1becfedab325f9`,
        `/manHourReport/lineTrend/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}&&selectedMonth=${selectedMonth}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const { message, BMLineTrend } = await res.json();

      if (res?.status === 201) {
        setLineTrendData(BMLineTrend);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (selectedValue && flagForTogglingFilter !== "based-on-line") {
      getLineTrendData();
    }
  }, [selectedValue, selectedYear, selectedMonth]);

  const data = {
    labels: lineTrendData?.lines,
    datasets: [
      {
        type: "line",
        label: "%",
        data: lineTrendData?.percentage,
        borderColor: chartColors.target,
        borderWidth: 2,
        fill: false,
        backgroundColor: chartColors.target,
        pointStyle: "rectRot",
        pointRadius: 4,
        pointBorderColor: chartColors.target,
        yAxisID: "y1",
      },
      {
        type: "bar",
        stack: "bar-stacked",
        label: "BM",
        data: lineTrendData?.totalSumOf_BM,
        backgroundColor: chartColors.palettes.bmpm[0],
        pointStyle: "rect",
        yAxisID: "y2",
      },
      {
        type: "bar",
        stack: "bar-stacked",
        label: "PM",
        data: lineTrendData?.totalSumOf_PM,
        backgroundColor: chartColors.palettes.bmpm[1],
        pointStyle: "rect",
        yAxisID: "y2",
      },
    ],
  };

  const dummyAPI = async () => {
    try {
      const res = await fetch(`/dummyAPI`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const { message } = await res.json();

      if (res?.status === 201) {
        console.log(message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Box className="cell p-3">
      <ChartTitleBar title="Line Trend" />

      <Chart options={options} data={data} />
      {/* <button onClick={dummyAPI}>For Test</button> */}
    </Box>
    // <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
    //   <Typography variant="h5" component="h4">
    //     Line Trend
    //   </Typography>

    //   <Divider sx={{ mb: 4, borderColor: "black" }} />

    //   <Chart options={options} data={data} />
    // </Paper>
  );
};

export default LineTrend;
