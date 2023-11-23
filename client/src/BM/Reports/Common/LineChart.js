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
import { Box, Typography } from "@mui/material";
import { Row } from "react-bootstrap";
import { chartColors } from "../../Utils/ChartUtils/chartEnums";

const LineChart = ({ title, dataset, setValue, clearErrors }) => {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
  );

  const options = {
    plugins: {
      annotation: {
        annotations: {
          line1: {
            // Indicates the type of annotation
            type: "line",
            yMin: 1,
            yMax: 1,
            borderColor: chartColors[3],
            borderWidth: 2,
          },
        },
      },
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
    responsive: true,
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
      backgroundColor: chartColors[3],
      borderColor: chartColors[3],
      borderWidth: 2,
      fill: false,
      yAxisID: "y2",
    },
  ];

  const data = {
    labels: dataset?.labels,
    datasets,
  };

  return (
    <Box className="cell p-3">
      <Row style={{ marginBottom: "1rem" }}>
        <Typography
          className="col"
          variant="h5"
          component="h5"
          sx={{ fontWeight: "500" }}
        >
          {title}
        </Typography>
      </Row>

      <div style={{ width: "100%", height: "300px" }}>
        {/* <Chart data={data} options={options} /> */}
        <Line options={options} data={data} />
      </div>
    </Box>
  );
};

export default LineChart;
