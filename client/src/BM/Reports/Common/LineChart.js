import React from "react";
import { Chart, Line } from "react-chartjs-2";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Box, Divider, Typography } from "@mui/material";
import { Col, Row } from "react-bootstrap";
import { chartColors } from "../../Utils/ChartUtils/chartEnums";
import ChartTitleBar from "./ChartTitleBar";
import Loading from "../../../components/Loading/Loading";
import DataNotFound from "./DataNotFound";
import { isChartDataExist } from "../../Utils/functions/isChartDataExist";

const LineChart = ({
  title,
  loading = false,
  dataset,
  setValue,
  clearErrors,
  AppendToolComponents,
}) => {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
  );

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    maxBarThickness: 100,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      // annotation: {
      //   annotations: {
      //     line1: {
      //       // Indicates the type of annotation
      //       type: "line",
      //       yMin: 1,
      //       yMax: 1,
      //       borderColor: chartColors[3],
      //       borderWidth: 2,
      //     },
      //   },
      // },
      legend: {
        align: "end",
        display: false,
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
          text: "Machines",
        },
        // ticks: {
        //   maxRotation: 90,
        //   minRotation: 90,
        //   // padding: 10,
        // },
      },
      y2: {
        stacked: true,
        grid: {
          display: false,
        },
        title: {
          display: true,
          text: "Hours",
        },
      },
    },
    onClick: (event, element) => {
      if (element?.length > 0) {
        setValue(
          "selectedMachine._id",
          dataset?.machineId?.[element?.[0]?.index]
        );
        setValue(
          "selectedMachine.machine_code",
          dataset?.labels?.[element?.[0]?.index]
        );
        clearErrors("selectedMachine");

        // setValue(
        //   "selectedMachine",
        //   {
        //     _id: dataset?.machineId?.[element?.[0]?.index],
        //   }
        //   // {
        //   //   _id: dataset?.machineId?.[element?.[0]?.index],
        //   //   machine_code: dataset?.labels?.[element?.[0]?.index],
        //   // }
        // );
        // setValue("selectedMachine", {
        //   machine_code: dataset?.labels?.[element?.[0]?.index],
        // });
      }
    },
  };

  const datasets = [
    {
      type: "line",
      data: dataset?.data,
      backgroundColor: chartColors.target,
      borderColor: chartColors.targetBorder,
      borderWidth: 2,
      fill: false,
      yAxisID: "y2",
    },
  ];

  const data = {
    labels: dataset?.labels,
    datasets,
  };

  const isDataExists = isChartDataExist(data);

  return (
    <Box className="cell p-3">
      <ChartTitleBar title={title} Toolbar={AppendToolComponents} />

      <Box sx={{ height: { xs: "300px", md: "350px" } }}>
        {loading ? (
          <Loading height={"100%"} />
        ) : !isDataExists ? (
          <DataNotFound />
        ) : (
          <Line options={options} data={data} />
        )}
      </Box>
    </Box>
  );
};

export default LineChart;
