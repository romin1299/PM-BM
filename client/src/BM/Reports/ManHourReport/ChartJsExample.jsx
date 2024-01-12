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
import { Bar } from "react-chartjs-2";
import { Box, Divider, Typography } from "@mui/material";
import { Col, Row } from "react-bootstrap";
import { chartColors } from "../../Utils/ChartUtils/chartEnums";
import { FilterMenu } from "./SubComponents/FilterMenu";
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
        display: false,
      },
      title: {
        display: true,
        text: "Months",
      },
      ticks: {
        color: "black",
        // font: {
        //   size: 12,
        // },
      },
    },
    y: {
      stacked: true,
      ticks: {
        color: "black",
      },
      title: {
        display: true,
        text: "Hours",
      },
    },
  },
};

const serverResLabels = [
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
];

const serverResDataset = [
  {
    label: "BM",
    data: [432, 863, 543, 123, 474, 653, 655, 378, 302, 945, 234, 743],
    pointStyle: "rect",
  },
  {
    label: "PM",
    data: [432, 263, 543, 223, 574, 653, 255, 778, 1032, 145, 734, 243],
    pointStyle: "rect",
  },
];

// for multi charts i.e. line and bar combined
const otherDataConfigs = [
  {
    type: "line",
    borderColor: chartColors.orange[1],
    borderWidth: 2,
    fill: false,
  },
  {
    type: "bar",
    stack: "bar-stacked",
  },
  {
    type: "bar",
    stack: "bar-stacked",
  },
];

const colorPreset = [chartColors[1], chartColors[2]];

const ChartToPPTExample = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
}) => {
  const [HourTrendData, setHourTrendData] = useState({
    BMHourTrend: [],
    PMHourTrend: [],
  });

  const getHourTrendData = async () => {
    try {
      const res = await fetch(
        // `/manHourReport/hourTrend/${flagForTogglingFilter}/632c41261d1becfedab325f9`,
        `/manHourReport/hourTrend/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const { message, hourTrendData } = await res.json();

      if (res?.status === 201) {
        setHourTrendData(hourTrendData);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (selectedValue && flagForTogglingFilter) {
      getHourTrendData();
    }
  }, [selectedValue, selectedYear]);

  const data = {
    labels: serverResLabels,
    datasets: [
      {
        label: "BM",
        data: HourTrendData?.BMHourTrend,
        backgroundColor: chartColors.palettes.bmpm[0],
      },
      {
        label: "PM",
        data: HourTrendData?.PMHourTrend,
        backgroundColor: chartColors.palettes.bmpm[1],
      },
    ],

    // serverResDataset.map((dataset, i) => ({
    //   ...dataset,
    //   backgroundColor: i === 0 ? "rgba(202, 31, 75)" : chartColors[i - 1],
    // })),
  };

  return (
    <Box className="cell p-3">
      <ChartTitleBar title="Hour Trend" />

      <Bar options={options} data={data} />
    </Box>
  );
};

export default ChartToPPTExample;
