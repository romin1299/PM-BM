import React, { useState } from "react";
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
import ChartTitleBar, {
  ChartDownloadMenu,
} from "../../../BM/Reports/Common/ChartTitleBar";
import Loading from "../../../components/Loading/Loading";
import DataNotFound from "../../../BM/Reports/Common/DataNotFound";
import { isChartDataExist } from "../../../BM/Utils/functions/isChartDataExist";
import {
  chartColors,
  MONTH_LABELS,
} from "../../../BM/Utils/ChartUtils/chartEnums";

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const BarChartCommon = ({ stacked, xTitleText, yTitleText, title }) => {
  const [loading, setLoading] = useState(false);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
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
        stacked: stacked,
        grid: {
          display: false, // Hide vertical grid lines
        },
        title: {
          display: true,
          text: xTitleText,
        },
        ticks: {
          color: "black",
        },
      },
      y: {
        stacked: stacked,
        grid: {
          display: false,
        },
        title: {
          display: true,
          text: yTitleText,
        },
        ticks: {
          color: "black",
        },
      },
    },
  };

  const data = {
    labels: MONTH_LABELS,
    datasets: [
      {
        label: "BM",
        //   data: manHourTrendData?.BMManHourTrend,
        backgroundColor: chartColors.bmpm[0],
        borderRadius: 4,
      },
      {
        label: "PM",
        //   data: manHourTrendData?.PMManHourTrend,
        backgroundColor: chartColors.bmpm[1],
        borderRadius: 4,
      },
    ],
  };

  let isDataExists = isChartDataExist(data);

  return (
    <Box className="cell p-3">
      <ChartTitleBar
        title={title}
        Toolbar={
          <div className="col-auto">
            <ChartDownloadMenu
              handleDownloadCSV={() => {
                // handleDownload("csv");
              }}
              handleDownloadPDF={() => {
                // handleDownload("pdf");
              }}
            />
          </div>
        }
      />

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

export default BarChartCommon;
