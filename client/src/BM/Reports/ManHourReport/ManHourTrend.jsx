import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import Paper from "@mui/material/Paper";
import { Box, Divider, Typography } from "@mui/material";
import { chartColors, MONTH_LABELS } from "../../Utils/ChartUtils/chartEnums";
import { Col, Row } from "react-bootstrap";
import { FilterMenu } from "./SubComponents/FilterMenu";
import ChartTitleBar from "../Common/ChartTitleBar";

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  BarElement,
  Title,
  Tooltip,
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
        text: "Months",
      },
      ticks: {
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

const ManHourTrend = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
}) => {
  const [manHourTrendData, setManHourTrendData] = useState({
    BMManHourTrend: [],
    PMManHourTrend: [],
  });

  const getManHourTrendData = async () => {
    try {
      const res = await fetch(
        // `/manHourReport/manHourTrend/${flagForTogglingFilter}/632c41261d1becfedab325f9`,
        `/manHourReport/manHourTrend/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const { message, manHourTrendData } = await res.json();

      if (res?.status === 201) {
        setManHourTrendData(manHourTrendData);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (selectedValue) {
      getManHourTrendData();
    }
  }, [selectedValue, selectedYear]);

  const data = {
    labels: MONTH_LABELS,
    datasets: [
      {
        label: "BM",
        data: manHourTrendData?.BMManHourTrend,
        backgroundColor: chartColors.green[0],
        pointStyle: "rect",
      },
      {
        label: "PM",
        data: manHourTrendData?.PMManHourTrend,
        backgroundColor: chartColors.aqua[1],
        pointStyle: "rect",
      },
    ],
  };

  return (
    <Box className="cell p-3">
      <ChartTitleBar title="Man-Hour Trend" />

      <Bar options={options} data={data} />
    </Box>
  );
};

export default ManHourTrend;
