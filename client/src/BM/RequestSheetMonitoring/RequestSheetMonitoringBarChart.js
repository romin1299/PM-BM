import React, { useState, useEffect } from "react";
import { cyan, deepPurple, green, indigo } from "@mui/material/colors";
import { lightBlue, lightGreen, orange, red, teal } from "@mui/material/colors";

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
import Loading from "../../components/Loading/Loading";

const RequestSheetMonitoringBarChart = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
  selectedMonth,
}) => {
  const [loading, setLoading] = React.useState(true);

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
    Generated: lightBlue["A700"],
    Assigned: cyan["A400"],
    "Work Order Open": red["A400"],
    "Work Order Pending": orange["A200"],
    "Work Order Closed": lightGreen["A700"],
    "Fill Sheet": lightBlue["A100"],
    "Under MTD TL Approval": deepPurple[300],
    "Under MTD HOSS Approval": indigo[300],
    "Under PRD TL Approval": indigo[500],
    "Under PRD HOS Approval": cyan[300],
    "Under MTD HOS Approval": cyan[500],
    "Under MTD HOD Approval": teal[300],
    "Under PRD HOD Approval": teal[500],
    Completed: green["A700"],
    // "Under MTD TL Approval": cyan[100],
    // "Under MTD HOSS Approval": cyan[200],
    // "Under PRD TL Approval": cyan[300],
    // "Under PRD HOS Approval": cyan[400],
    // "Under MTD HOS Approval": cyan[500],
    // "Under MTD HOD Approval": cyan[700],
    // "Under PRD HOD Approval": cyan[900],
  };

  const [allStatusCounterForGraph, setAllStatusCounterForGraph] = useState([
    {
      label: "",
      data: [],
    },
  ]);

  const getRequestSheetMonitoringData = async () => {
    setLoading(true);

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

    setLoading(false);
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
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        align: "end",
        position: "bottom",
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
      borderRadius: 4,
    })),
  };

  return (
    <Box className="cell p-3">
      {loading ? (
        <Loading height={400} />
      ) : (
        <Box sx={{ height: { xs: "400px", md: "500px" } }}>
          <Bar options={options} height={75} data={data} />
        </Box>
      )}
    </Box>
  );
};

export default RequestSheetMonitoringBarChart;
