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
import { Chart } from "react-chartjs-2";
import { Box, Divider, Paper, Typography } from "@mui/material";
import { Row, Container, Col } from "react-bootstrap";
import { MONTH_LABELS, chartColors } from "../../Utils/ChartUtils/chartEnums";
import ChartDataLabels from "chartjs-plugin-datalabels";
import ChartTitleBar from "../Common/ChartTitleBar";
import { FilterMenu } from "../ManHourReport/SubComponents/FilterMenu";
import DataNotFound from "../Common/DataNotFound";
import axios from "axios";
import TeamMembersDropdown from "./TeamMembersDropdown";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const options = {
  maintainAspectRatio: false,
  responsive: true,
  plugins: {
    legend: {
      align: "end",
      labels: {
        usePointStyle: true,
      },
    },
    datalabels: { display: false },
  },
  // elements: {
  //   bar: {
  //     borderColor: "000",
  //     borderWidth: 1,
  //   },
  // },
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
        // maxRotation: 90,
        // minRotation: 90,
      },
    },
    y: {
      stacked: true,
      position: "left",
      ticks: {
        color: "black",
      },
    },
  },
};

const TMProgress = ({ selectedValue, flagForTogglingFilter }) => {
  const [data, setData] = React.useState({});
  const [tmId, setTmId] = React.useState("");

  const fetchChartData = async () => {
    // console.log("selectedValue:", selectedValue);
    const url = `/tmProgress/tmMTTRSkill/${flagForTogglingFilter}/${selectedValue}/${tmId}`;
    try {
      const res = await axios.get(url, {
        withCredentials: true,
        credentials: "include",
      });
      // console.log("MTTR Trend res:", res.data.data);

      setData(res?.data?.data);
    } catch (error) {
      console.log("error:", error);
    }
  };

  React.useEffect(() => {
    if (selectedValue) fetchChartData();
  }, [selectedValue, tmId]);

  const chartData = {
    labels: MONTH_LABELS,
    datasets: [
      {
        type: "line",
        stack: "bar-stacked",
        label: "Hours",
        data: data?.data,
        backgroundColor: chartColors[3],
        borderColor: chartColors[3],
        borderWidth: 2,
        pointStyle: "circle",
        yAxisID: "y",
      },
    ],
  };

  React.useEffect(() => {
    console.log("TM progress data:", data);
  }, [data]);

  return (
    <Box className="cell p-3">
      <ChartTitleBar
        title="TM Load"
        Toolbar={
          <Col className="col-auto">
            <TeamMembersDropdown
              tmId={tmId}
              setTmId={setTmId}
              selectedValue={selectedValue}
              flagForTogglingFilter={flagForTogglingFilter}
            />
          </Col>
        }
      />

      <Box sx={{ height: { xs: "300px", md: "350px" } }}>
        {data === undefined ? (
          <DataNotFound />
        ) : (
          <Chart options={options} data={chartData} />
        )}
      </Box>
    </Box>
  );
};

export default TMProgress;
