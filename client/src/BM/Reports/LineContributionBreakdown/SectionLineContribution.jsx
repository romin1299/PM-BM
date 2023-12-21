import React from "react";
import { Chart } from "react-chartjs-2";
import { Box, Divider, Paper, Typography } from "@mui/material";
import { chartColors } from "../../Utils/ChartUtils/chartEnums";
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
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Row, Col } from "react-bootstrap";
import axios from "axios";
import SectionCellSelectionDropdown from "./SectionCellSelectionDropdown";
import DataNotFound from "../Common/DataNotFound";
import ChartTitleBar from "../Common/ChartTitleBar";

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
  maxBarThickness: 100,
  plugins: {
    legend: {
      align: "end",
      labels: {
        usePointStyle: true,
      },
    },
    datalabels: {
      formatter: (value, context) => {
        if (context.dataset.type === "bar") {
          return value !== 0 ? `${Math.round(value * 100) / 100} %` : null;
        } else if (context.dataset.type === "line") {
          return value !== 0 ? `${Math.round(value * 100) / 100}` : null;
        } else return value;
      },
      font: { weight: "bold", size: 12 },
      // backgroundColor: (context) => {
      //   if (context.dataset.type === "bar") {
      //     return chartColors.palettes[0][0];
      //   } else if (context.dataset.type === "line") {
      //     return "blue";
      //   } else return "red";
      // },
      // color: "white",
      borderRadius: 3,
      anchor: (context) => (context.dataset.type === "line" ? "end" : "center"),
      align: (context) => (context.dataset.type === "line" ? "top" : "center"),
      offset: (context) => (context.dataset.type === "line" ? 4 : 0),
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
        // maxRotation: 90,
        // minRotation: 90,
        color: "black",
      },
    },
    y: {
      stacked: true,
      title: {
        display: true,
        text: "% Contribution",
      },

      min: 0,
      // max: 20,
      stepSize: 5,
      ticks: {
        callback: function (value, index, values) {
          return value + " %";
        },
        color: "black",
      },
    },
    y2: {
      position: "right",
      title: {
        display: true,
        text: "Breakdown Hours",
      },
      min: 0,
      // max: 50,
      stepSize: 5,
      ticks: {
        color: "black",
      },
    },
  },
};

const SectionContribution = ({ reduceState, reducerDispatch }) => {
  const [data, setData] = React.useState({});

  const { selectedYear, selectedMonth, flagForTogglingFilter, selectedValue } =
    reduceState;

  const fetchChartData = async () => {
    const url = `/lineWiseBdContributionForSection/${flagForTogglingFilter}/${selectedValue}`;
    const params = { selectedYear, selectedMonth };

    try {
      const res = await axios.get(url, {
        params, //uncomment when database is updated with agrregated year and month values
        withCredentials: true,
        credentials: "include",
      });

      // console.log("line res:", res?.data?.lineWiseBDData[0]);
      setData(res?.data?.lineWiseBDData[0]);
    } catch (error) {
      console.log("error:", error);
    }
  };

  React.useEffect(() => {
    selectedValue && fetchChartData();
  }, [selectedValue, selectedYear, selectedMonth]);

  // React.useEffect(() => {
  //   console.log("section data:", data);
  // }, [data]);

  const chartData = {
    labels: data?.lineNames,
    datasets: [
      {
        type: "line",
        label: "Breakdown Hrs",
        data: data?.bdHours,
        fill: false,
        borderWidth: 2,
        borderColor: chartColors.magenta[1],
        backgroundColor: chartColors.magenta[1],
        pointStyle: "rectRot",
        pointRadius: 5,
        pointBorderColor: chartColors.magenta[1],
        yAxisID: "y2",
      },
      {
        type: "bar",
        stack: "bar-stacked",
        label: "% Contribution",
        data: data?.percentages,
        backgroundColor: chartColors.palettes[0][2],
        pointStyle: "rect",
        yAxisID: "y",
      },
    ],
  };

  return (
    <Box className="cell p-3">
      <ChartTitleBar title="Section Contribution" Toolbar={null} />

      <Row>
        <SectionCellSelectionDropdown
          {...reduceState}
          reducerDispatch={reducerDispatch}
        />
      </Row>

      <Box sx={{ height: { xs: "300px", md: "400px" } }}>
        {data === undefined ? (
          <DataNotFound sx={{ mt: 2 }} />
        ) : (
          <Chart
            options={options}
            data={chartData}
            plugins={[ChartDataLabels]}
          />
        )}
      </Box>
    </Box>
  );
};

export default SectionContribution;
