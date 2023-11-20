import { Box, Typography } from "@mui/material";
import React from "react";
import { Col, Row } from "react-bootstrap";
import { Bar } from "react-chartjs-2";
import { chartColors } from "../../Utils/ChartUtils/chartEnums";

const sectionBoxStyle = {
  p: 1,
  border: "1px solid lightgray",
  width: "100%",
};

const sectionBodyBoxStyle = {
  height: "200px",
  display: "flex",
  borderTop: "1px solid lightgray",
  gap: "10px",
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "#c6efce", //alternative color #deebf7
};

const MajorBDCount = () => {
  return (
    <Row className="m-2 mb-3">
      <Col md={12} lg={6}>
        <Typography
          variant="h5"
          component="h5"
          sx={{ fontWeight: "500", textDecoration: "underline" }}
        >
          Major Breakdown Count
        </Typography>

        <Typography variant="h6" component="p" className="mt-3">
          FY 23:
        </Typography>

        <Typography variant="h6" component="p">
          Target → 12 Nos/Year
        </Typography>

        <Box sx={{ mt: 3, display: "flex" }}>
          <Box sx={sectionBoxStyle}>
            <Typography variant="h6" textAlign="center" fontWeight={600}>
              Mounting MBD Count
            </Typography>
            <Box sx={sectionBodyBoxStyle}>
              <Typography variant="h2" textAlign="center" fontWeight={600}>
                1
              </Typography>
            </Box>
          </Box>

          <Box sx={{ ...sectionBoxStyle, borderLeft: "none" }}>
            <Typography variant="h6" textAlign="center" fontWeight={600}>
              Final MBD Count
            </Typography>
            <Box sx={sectionBodyBoxStyle}>
              <Typography variant="h2" textAlign="center" fontWeight={600}>
                3
              </Typography>
            </Box>
          </Box>
        </Box>
      </Col>

      <Col
        md={12}
        lg={6}
        className="d-flex justify-content-center align-items-center"
        style={{ borderLeft: "1px solid lightgray" }}
      >
        <Bar options={options} data={data} />
      </Col>
    </Row>
  );
};

export const options = {
  // maintainAspectRatio: false,
  responsive: true,
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
    },
    y: {
      stacked: true,
      title: {
        display: true,
        text: "Nos",
      },
    },
  },
};

const labels = [
  "Apr-23",
  "May-23",
  "Jun-23",
  "Jul-23",
  "Aug-23",
  "Sep-23",
  "Oct-23",
  "Nov-23",
  "Dec-23",
  "Jan-24",
  "Feb-24",
  "Mar-24",
];

export const data = {
  labels,
  datasets: [
    {
      label: "MA",
      data: [1, 0, 0, 2, 0, 0],
      backgroundColor: chartColors.orange[2],
    },
    {
      label: "FA",
      data: [1, 1, 0, 0, 1, 0],
      backgroundColor: chartColors.aqua[1],
    },
  ],
};

export default MajorBDCount;
