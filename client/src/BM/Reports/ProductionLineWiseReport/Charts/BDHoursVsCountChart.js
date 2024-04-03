import React from "react";
import {
  Chart as ChartJS,
  LinearScale,
  CategoryScale,
  BarElement,
  PointElement,
  LineElement,
  Legend,
  Tooltip,
  LineController,
  BarController,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import { Box } from "@mui/material";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { barDatalabels } from "../../../Utils/ChartUtils/chartOptions";
import { chartColors } from "../../../Utils/ChartUtils/chartEnums";
import DataNotFound from "../../Common/DataNotFound";
import Loading from "../../../../components/Loading/Loading";
import { isChartDataExist } from "../../../Utils/functions/isChartDataExist";

const BDHoursVsCountChart = ({ labels, totalBDCount, BDCount, BDhours }) => {
  ChartJS.register(
    LinearScale,
    CategoryScale,
    BarElement,
    PointElement,
    LineElement,
    Legend,
    Tooltip,
    LineController,
    BarController
  );

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    maxBarThickness: 100,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
        text: "",
      },
      datalabels: {
        ...barDatalabels,
        // font: { weight: "500", size: 12 },
        // color: chartColors.machineBarLabels,
      },
    },
    interaction: {
      mode: "index",
      intersect: false,
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false, // Hide vertical grid lines
        },
        title: {
          display: true,
          text: "Machines",
        },
        ticks: {
          // autoSkip: false,
          maxRotation: 0,
          minRotation: 0,

          fontSize: 14,
        },
      },
      y1: {
        stacked: true,
        grid: {
          display: false,
        },
        position: "right",
        title: {
          display: true,
          text: "Counts",
        },
      },
      y2: {
        stacked: true,
        grid: {
          display: false,
        },
        position: "left",
        title: {
          display: true,
          text: "Hours",
        },
      },
    },
  };

  const data = {
    labels,
    datasets: [
      ...totalBDCount?.map((item, index) => ({
        type: "line",
        label: `Count ${item?.groupId}`,
        backgroundColor: chartColors.machineChartCounts[index],
        borderColor: chartColors.machineChartCounts[index],
        //borderWidth: 2,
        fill: false,
        data: item?.count,
        yAxisID: "y1",
      })),

      ...BDCount?.map((item, index) => ({
        type: "line",
        label: `Count ${item?.groupId}`,
        backgroundColor: chartColors.machineChartCounts[index],
        borderColor: chartColors.machineChartCounts[index],
        //borderWidth: 2,
        fill: false,
        data: item?.count,
        yAxisID: "y1",
      })),

      ...BDhours?.map((item, index) => ({
        type: "bar",
        backgroundColor: chartColors.machineBarChart?.[index],
        stack: "same-bar-stack",
        label: `Hours ${item?.groupId}`,
        data: item?.sumOfBDhours,
        //borderColor: "#312A7D",
        //borderWidth: 2,
        yAxisID: "y2",
        borderRadius: 4,
      })),
    ],
  };

  const isDataExists = isChartDataExist(data);

  return (
    <Box sx={{ height: { xs: "300px", md: "300px", lg: "300px" }, mt: 1 }}>
      {!isDataExists ? (
        <DataNotFound />
      ) : (
        <Chart
          type="bar"
          data={data}
          options={options}
          plugins={[ChartDataLabels]}
        />
      )}
    </Box>
  );
};

export default BDHoursVsCountChart;
