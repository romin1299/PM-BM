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
import ChartTitleBar, { ChartDownloadMenu } from "../Common/ChartTitleBar";
import Loading from "../../../components/Loading/Loading";
import DataNotFound from "../Common/DataNotFound";
import { isChartDataExist } from "../../Utils/functions/isChartDataExist";
import downloadFile from "../../../util";

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
        text: "Lines",
      },
      ticks: {
        maxRotation: 90,
        minRotation: 90,
        // padding: 10,
        color: "black",
        // font: {
        //   size: 11,
        // },
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

const LineTrend = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
  selectedMonth,
}) => {
  const [loading, setLoading] = React.useState(true);
  const [labels, setLabels] = useState([]);

  const [lineTrendData, setLineTrendData] = useState({
    lines: [],
    totalSumOf_PM: [],
    totalSumOf_BM: [],
    percentage: [],
  });

  const getLineTrendData = async () => {
    setLoading(true);

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

    setLoading(false);
  };

  const header = ["Lines", "Total Sum of PM", "Total Sum of BM", "Percentage"];

  const handleDownload = async (fileType) => {
    try {
      const bodyData = [
        [
          lineTrendData?.lines,
          lineTrendData?.totalSumOf_PM,
          lineTrendData?.totalSumOf_BM,
          lineTrendData?.percentage,
        ],
      ];

      downloadFile(bodyData, fileType, header, "Line_trend");
    } catch (error) {
      console.error("Error downloading data:", error);
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
        borderColor: chartColors.percentLine,
        borderWidth: 2,
        fill: false,
        backgroundColor: chartColors.percentLine,
        // pointStyle: "rectRot",
        pointRadius: 3,
        pointBorderColor: chartColors.percentLine,
        yAxisID: "y1",
      },
      {
        type: "bar",
        stack: "bar-stacked",
        label: "BM",
        data: lineTrendData?.totalSumOf_BM,
        backgroundColor: chartColors.bmpm[0],
        borderRadius: 4,
        yAxisID: "y2",
      },
      {
        type: "bar",
        stack: "bar-stacked",
        label: "PM",
        data: lineTrendData?.totalSumOf_PM,
        backgroundColor: chartColors.bmpm[1],
        borderRadius: 4,
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

  let isDataExists = isChartDataExist(data);

  return (
    <>
      <Box className="cell p-3">
        <ChartTitleBar
          title="Line Trend"
          Toolbar={
            <div className="col-auto">
              <ChartDownloadMenu
                handleDownloadCSV={() => {
                  handleDownload("csv");
                }}
                handleDownloadPDF={() => {
                  handleDownload("pdf");
                }}
              />
            </div>
          }
        />

        {/* {loading ? (
        <Loading height={200} />
      ) : (
        <Chart options={options} data={data} />
      )} */}

        <Box sx={{ height: { xs: "350px", md: "400px" } }}>
          {loading ? (
            <Loading height={"100%"} />
          ) : !isDataExists ? (
            <DataNotFound />
          ) : (
            <Chart options={options} data={data} />
          )}
        </Box>
      </Box>
      {/* <button onClick={dummyAPI}>For Test</button> */}
    </>

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
