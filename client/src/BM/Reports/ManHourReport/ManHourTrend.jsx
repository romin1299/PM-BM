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
import { Box } from "@mui/material";
import { chartColors, MONTH_LABELS } from "../../Utils/ChartUtils/chartEnums";
import ChartTitleBar from "../Common/ChartTitleBar";
import Loading from "../../../components/Loading/Loading";
import DataNotFound from "../Common/DataNotFound";
import { isChartDataExist } from "../../Utils/functions/isChartDataExist";

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
  responsive: true,
  maintainAspectRatio: false,
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
  const [loading, setLoading] = React.useState(true);

  const [manHourTrendData, setManHourTrendData] = useState({
    BMManHourTrend: [],
    PMManHourTrend: [],
  });

  const getManHourTrendData = async () => {
    setLoading(true);

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

    setLoading(false);
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
        backgroundColor: chartColors.bmpm[0],
        borderRadius: 4,
      },
      {
        label: "PM",
        data: manHourTrendData?.PMManHourTrend,
        backgroundColor: chartColors.bmpm[1],
        borderRadius: 4,
      },
    ],
  };

  let isDataExists = isChartDataExist(data);

  return (
    <Box className="cell p-3">
      <ChartTitleBar title="Man-Hour Trend" />

      <Box sx={{ height: { xs: "250px", md: "300px" } }}>
        {loading ? (
          <Loading />
        ) : !isDataExists ? (
          <DataNotFound />
        ) : (
          <Bar options={options} data={data} />
        )}
      </Box>
    </Box>
  );
};

export default ManHourTrend;
