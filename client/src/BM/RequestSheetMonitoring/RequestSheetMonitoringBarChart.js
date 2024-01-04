import React, { useState, useEffect } from "react";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Colors,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { Box } from "@mui/material";

const RequestSheetMonitoringBarChart = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
  selectedMonth,
}) => {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Colors
  );

  const statusColorMap = {
    Generated: "#9bcbdb",
    Assigned: "#ffe031",
    "Work Order Open": "#ca2626",
    "Work Order Pending": "#F59F00",
    "Work Order Closed": "#70b332",
    "Fill Sheet": "#89e9eb",
    "Under MTD TL Approval": "#c196d4",
    "Under MTD HOSS Approval": "#c196d4",
    "Under PRD TL Approval": "#c196d4",
    "Under PRD HOS Approval": "#c196d4",
    "Under MTD HOS Approval": "#c196d4",
    "Under MTD HOD Approval": "#c196d4",
    "Under PRD HOD Approval": "#c196d4",
    Completed: "#3fad3f",
  };

  const [allStatusCounterForGraph, setAllStatusCounterForGraph] = useState([
    {
      label: "",
      data: [],
    },
  ]);

  const getRequestSheetMonitoringData = async () => {
    try {
      const res = await fetch(
        `/getRequestSheetMonitoringData/status-chart-data/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}&&selectedMonth=${selectedMonth}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const { message, allStatusCounterForGraph } = await res.json();

      if (res?.status === 201) {
        setAllStatusCounterForGraph(allStatusCounterForGraph);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (selectedValue) {
      getRequestSheetMonitoringData();
    }
  }, [selectedValue, flagForTogglingFilter, selectedYear, selectedMonth]);

  const options = {
    maintainAspectRatio: false,
    responsive: true,
    maxBarThickness: 100,
    plugins: {
      legend: {
        align: "end",
        labels: {
          usePointStyle: true,
        },
      },
      title: {
        display: false,
        text: "Request sheet monitoring",
        color: "black",
        font: {
          size: 16,
        },
      },
    },
    // interaction: {
    //   mode: 'index' as const,
    //   intersect: false,
    // },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
        title: {
          display: false,
          text: "status",
        },
        ticks: {
          // mirror: true,
          fontSize: 16,
          padding: 10,

          autoSkip: false,
          maxRotation: 0,
          minRotation: 0,
        },
      },

      // xaxis: {
      //   tickmode: "array", // If "array", the placement of the ticks is set via `tickvals` and the tick text is `ticktext`.
      //   tickvals: showValueInXAxis.position,
      //   ticktext: showValueInXAxis.label,
      // },

      y: {
        stacked: true,
        title: {
          display: true,
          text: "No. of request-sheet",
        },
        ticks: {
          min: 0,
          stepSize: 1,
          // max: 4,
        },
      },
    },
  };

  const data = {
    labels: ["Generated", "Status", "Completed"],
    datasets: allStatusCounterForGraph?.map((item) => ({
      ...item,
      backgroundColor: statusColorMap?.[item?.label],
    })),
  };

  return (
    <Box className="cell p-3">
      <Box sx={{ height: { xs: "400px", md: "500px" } }}>
        <Bar options={options} height={75} data={data} />
      </Box>
    </Box>
  );
};

export default RequestSheetMonitoringBarChart;
