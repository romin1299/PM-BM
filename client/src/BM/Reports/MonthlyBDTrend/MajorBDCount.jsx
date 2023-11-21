import { Box, Typography } from "@mui/material";
import React from "react";
import { Col, Row } from "react-bootstrap";
import { Bar } from "react-chartjs-2";
import { chartColors } from "../../Utils/ChartUtils/chartEnums";

const sectionBoxStyle = {
  p: 1,
  width: "100%",
};

const sectionBodyBoxStyle = {
  height: "100px",
  display: "flex",
  borderRadius: "6px",
  gap: "10px",
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "#c6efce", //alternative color #deebf7
};

const MajorBDCount = () => {
  return (
    <Box className="cell p-3 mt-3">
      <Row className="mb-3">
        <Col md={12} lg={6} >
          <Typography
            variant="h5"
            component="h5"
            sx={{ fontWeight: "500", textDecoration: "underline" }}
          >
            Major Breakdown Count
          </Typography>

          <Typography variant="h6" component="h6" className="mt-3">
            FY 23:
          </Typography>

          <Typography variant="h6" component="h6" className="mt-3">
            <b>Target →</b> 12 Nos/Year
          </Typography>

          <Box className="cell" sx={{ mt: 3, display: "flex" }}>
            <Box sx={sectionBoxStyle}>
              <Typography variant="h6" textAlign="center" fontWeight={600}>
                Mounting MBD Count
              </Typography>
              <Box sx={sectionBodyBoxStyle}>
                <Typography variant="h4" textAlign="center" fontWeight={600}>
                  1
                </Typography>
              </Box>
            </Box>

            <Box sx={{ ...sectionBoxStyle, borderLeft: "none" }}>
              <Typography variant="h6" textAlign="center" fontWeight={600}>
                Final MBD Count
              </Typography>
              <Box sx={sectionBodyBoxStyle}>
                <Typography variant="h4" textAlign="center" fontWeight={600}>
                  3
                </Typography>
              </Box>
            </Box>
          </Box>
        </Col>

        <Col md={12} lg={6} style={{ borderLeft: "1px solid lightgray" }}>

          <Bar options={options} data={data} />


        </Col>
      </Row>
    </Box>
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
      align: "end",
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
        color: 'black',
      },
    },
    y: {
      stacked: true,
      title: {
        display: true,
        text: "Nos",
      },
      ticks: {
        color: 'black',
      }
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
      pointStyle: 'rect',
    },
    {
      label: "FA",
      data: [1, 1, 0, 0, 1, 0],
      backgroundColor: chartColors.aqua[1],
      pointStyle: 'rect',
    },
  ],
};

export default MajorBDCount;
