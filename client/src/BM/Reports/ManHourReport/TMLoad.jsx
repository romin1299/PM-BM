import React, { useEffect, useState } from "react";
import { Chart } from "react-chartjs-2";
import { Box, Divider, Paper, Typography } from "@mui/material";
import { chartColors } from "../../Utils/ChartUtils/chartEnums";
import { Row, Col } from "react-bootstrap";
import { FilterMenu } from "./SubComponents/FilterMenu";

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
import Loading from "../../../components/Loading/Loading";
import DataNotFound from "../Common/DataNotFound";
import { isChartDataExist } from "../../Utils/functions/isChartDataExist";

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
        text: "Team Members",
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

// export const data = {
//   labels: TM_Names,
//   datasets: [
//     {
//       type: "line",
//       label: "Dataset 1",
//       data: [432, 863, 543, 123, 474, 653, 655, 378, 302, 945, 234, 743],
//       borderColor: chartColors.percentLine,
//       borderWidth: 2,
//       fill: false,
//       backgroundColor: chartColors.percentLine,
//       pointBorderColor: chartColors.percentLine,
//     },
//     {
//       type: "bar",
//       stack: "bar-stacked",
//       label: "Dataset 2",
//       data: [432, 863, 543, 123, 474, 653, 655, 378, 302, 945, 234, 743],
//       backgroundColor: chartColors.brown[0],
//       borderColor: chartColors.brown[0],
//       borderWidth: 0,
//       pointStyle:'rect',
//     },
//     {
//       type: "bar",
//       stack: "bar-stacked",
//       label: "Dataset 3",
//       data: [432, 263, 543, 223, 574, 653, 255, 778, 1032, 145, 734, 243],
//       backgroundColor: chartColors.red[0],
//       borderColor: chartColors.red[0],
//       borderWidth: 0,
//       pointStyle:'rect',
//     },
//   ],
// };

const TMLoad = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
  selectedMonth,
}) => {
  const [loading, setLoading] = React.useState(true);

  const [tmLoadData, setTmLoadData] = useState({
    tm_names: [],
    totalSumOf_PM: [],
    totalSumOf_BM: [],
    percentage: [],
  });

  const getTmLoadData = async () => {
    setLoading(true);

    try {
      const res = await fetch(
        // `/manHourReport/tmLoad/${flagForTogglingFilter}/632c41261d1becfedab325f9`,
        `/manHourReport/tmLoad/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}&&selectedMonth=${selectedMonth}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const { message, tmLoadData } = await res.json();

      if (res?.status === 201) {
        setTmLoadData(tmLoadData);
      }
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (selectedValue && flagForTogglingFilter !== "based-on-line") {
      getTmLoadData();
    }
  }, [selectedValue, selectedYear, selectedMonth]);

  const data = {
    labels: tmLoadData?.tm_names,
    datasets: [
      {
        type: "line",
        label: "%",
        data: tmLoadData?.percentage,
        borderColor: chartColors.percentLine,
        borderWidth: 2,
        pointRadius: 3,
        fill: false,
        backgroundColor: chartColors.percentLine,
        pointBorderColor: chartColors.percentLine,
        yAxisID: "y1",
      },
      {
        type: "bar",
        stack: "bar-stacked",
        label: "BM",
        data: tmLoadData?.totalSumOf_BM,
        backgroundColor: chartColors.bmpm[0],
        borderRadius: 4,
        yAxisID: "y2",
      },
      {
        type: "bar",
        stack: "bar-stacked",
        label: "PM",
        data: tmLoadData?.totalSumOf_PM,
        backgroundColor: chartColors.bmpm[1],
        borderRadius: 4,
        yAxisID: "y2",
      },
    ],
  };

  let isDataExists = isChartDataExist(data);

  return (
    <Box className="cell p-3">
      <ChartTitleBar title="TM Load" />

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
    // <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
    //   <Typography variant="h5" component="h4">
    //     TM Load
    //   </Typography>

    //   <Divider sx={{ mb: 4, borderColor: "black" }} />

    //   <Chart options={options} data={data} />
    // </Paper>
  );
};

export default TMLoad;
