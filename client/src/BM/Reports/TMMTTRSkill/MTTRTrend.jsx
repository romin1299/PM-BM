import React from "react";
import { Chart } from "react-chartjs-2";
import { Box } from "@mui/material";
import { chartColors } from "../../Utils/ChartUtils/chartEnums";
import { Row, Col } from "react-bootstrap";

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
import ChartTitleBar, { ChartDownloadMenu } from "../Common/ChartTitleBar";
import axios from "axios";
import DataNotFound from "../Common/DataNotFound";
import Loading from "../../../components/Loading/Loading";
import { isChartDataExist } from "../../Utils/functions/isChartDataExist";
import DownloadButton from "../Common/DownloadButton";

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

const TMLoad = ({ tm_names, data, loading = false, onClickDownload }) => {
  const chartData = {
    labels: tm_names,
    datasets: [
      {
        type: "bar",
        stack: "bar-stacked",
        label: "Hours",
        data: data,
        backgroundColor: chartColors.bmpm,
        borderRadius: 4,
        yAxisID: "y",
      },
    ],
  };

  // const RenderChartComponent = ({
  //   options,
  //   data,
  //   loading = false,
  //   dataNotFound = false,
  // }) => {
  //   if (loading) {
  //     return <Loading height={200} />;
  //   } else if (dataNotFound) {
  //     return <DataNotFound />;
  //   }

  //   return <Chart options={options} data={data} />;
  // };

  const isDataExists = isChartDataExist(chartData);

  return (
    <Box className="cell p-3">
      <ChartTitleBar
        title="MTTR Trend"
        Toolbar={
          <div className="col-auto">
            <ChartDownloadMenu
              handleDownloadCSV={() => {
                onClickDownload("csv");
              }}
              handleDownloadPDF={() => {
                onClickDownload("pdf");
              }}
            />
          </div>
        }
      />

      <Box sx={{ height: { xs: "300px", md: "350px" } }}>
        {loading ? (
          <Loading height={"100%"} />
        ) : !isDataExists ? (
          <DataNotFound />
        ) : (
          <Chart options={options} data={chartData} />
        )}
      </Box>
    </Box>
  );
};

export default TMLoad;
