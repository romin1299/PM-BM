import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import Paper from "@mui/material/Paper";
import { Box, Divider, Grid, Typography } from "@mui/material";
import { FilterMenu } from "./ChartUtils/FilterMenu";
import { Col, Row } from "react-bootstrap";
import DownloadMenu from "./ChartUtils/DownloadMenu";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const options = {
  // maintainAspectRatio: false,
  plugins: {
    title: {
      display: false,
      text: "Hourly Trend",
    },
    legend: {
      // align: "end",
      labels: {
        usePointStyle: true,
      },
      padding: 1,
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
      ticks: {
        // autoSkip: false,
        maxRotation: 90,
        minRotation: 90,
      },
      title: {
        display: true,
        text: "Months",
        // color: "#2196f3",
      },
    },
    y: {
      stacked: true,
      // title: {
      //   display: true,
      //   text: "Hours",
      // },
    },
  },
};

const labels = [
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
];

export const data = {
  labels,
  datasets: [
    {
      label: "BM",
      data: [432, 863, 543, 123, 474, 653, 655, 378, 302, 945, 234, 743],
      backgroundColor: "rgba(255, 205, 86, 0.7)",
      borderColor: "rgba(255, 205, 86, 1)",
      borderWidth: 1,
    },
    {
      label: "PM",
      data: [432, 263, 543, 223, 574, 653, 255, 778, 1032, 145, 734, 243],
      backgroundColor: "rgba(75, 192, 192, 0.7)",
      borderColor: "rgba(75, 192, 192)",
      borderWidth: 1,
    },
  ],
};

const HourTrend = () => {
  return (
    <Box className="cell p-3">
      <Row style={{ marginBottom: "1rem" }}>
        <Typography
          className="col"
          variant="h5"
          component="h5"
          sx={{ fontWeight: "500" }}
        >
          Hour Trend
        </Typography>

        <Col className="col-auto d-flex">
          <FilterMenu DropdownValue="hour" />
          <DownloadMenu />
        </Col>
      </Row>

      {/* <Divider sx={{ mb: 4, borderColor: "black" }} /> */}

      <Bar
        options={options}
        data={data}
        // plugins={[htmlLegendPlugin]}
        redraw={true}
        //  width={"100%"} height={"400px"}
      />
    </Box>
  );
};

// const htmlLegendPlugin = {
//   id: "htmlLegend",
//   afterUpdate(chart, args, options) {
//     items.forEach((item, index) => {
//       // Build your html for label
//     });
//   },
// };

export default HourTrend;
