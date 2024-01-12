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
import { Box } from "@mui/material";
import { chartColors } from "../../Utils/ChartUtils/chartEnums";
import ChartTitleBar from "../Common/ChartTitleBar";
import Loading from "../../../components/Loading/Loading";

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

const ChartToPPTExample = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
}) => {
  const [loading, setLoading] = React.useState(true);

  const [HourTrendData, setHourTrendData] = useState({
    BMHourTrend: [],
    PMHourTrend: [],
  });

  const getHourTrendData = async () => {
    setLoading(true);

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

    setLoading(false);
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
        backgroundColor: chartColors.bmpm[0],
        borderRadius: 4,
      },
      {
        label: "PM",
        data: HourTrendData?.PMHourTrend,
        backgroundColor: chartColors.bmpm[1],
        borderRadius: 4,
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
      {loading ? (
        <Loading height={200} />
      ) : (
        <Bar options={options} data={data} />
      )}
    </Box>
  );
};

export default ChartToPPTExample;
