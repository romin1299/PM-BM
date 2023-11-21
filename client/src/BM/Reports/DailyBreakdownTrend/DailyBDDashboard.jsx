import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import { Box, Paper, Typography, } from "@mui/material";
import DailyBDTrendChart from "./DailyBDTrendChart";
import MonthlyPlanVsActualChart from "./MonthlyPlanVsActual";
import MTTRChart from "./MTTRChart";

const CustomPaper = ({ children }) => (
  <Paper elevation={0} variant="outlined" sx={{ p: 1, pl: 2, pr: 2 }}>
    {children}
  </Paper>
);

const sectionBoxStyle = {
  p: 1,
  borderRight: "1px solid lightgray",
  borderBottom: "1px solid lightgray",
  width: "100%",
};

const sectionBodyBoxStyle = {
  minHeight: "80px",
  display: "flex",
  gap: "10px",
  justifyContent: "center",
  alignItems: "center",
};

const StatusBox = ({ title, value }) => (
  <div>
    <div>{title}</div>
    <Paper variant="outlined">
      <Typography variant="body1" component="p" sx={{ textAlign: "center" }}>
        {value}
      </Typography>
    </Paper>
  </div>
);

const DailyBTDashboard = () => {
  const data = ["Plant", "Elec", "Gasoline", "Ceramic", "Part"];

  return (
    <Container fluid className="d-flex flex-column gap-3 mt-3 mb-5">
      <Row>
        <Col className="col-auto">
          <CustomPaper>
            <Typography variant="h6" component="h6">
              KPI From Database
            </Typography>
          </CustomPaper>
        </Col>

        {data.map((text, i) => (
          <Col className="col-auto d-flex gap-2">
            <CustomPaper key={i}>
              <Typography variant="h6" component="h6">
                {text}
              </Typography>
            </CustomPaper>
          </Col>
        ))}
      </Row>

      <Paper elevation={0} variant="outlined">
        <Box sx={{ display: "flex" }}>
          <Box sx={sectionBoxStyle}>
            <Typography variant="h6" textAlign="center" fontWeight={600}>
              BD Counts Status
            </Typography>
            <Box sx={sectionBodyBoxStyle}>
              <StatusBox title="MBD Target" value="84" />
              <StatusBox title="MBD Actual" value="54" />
              <StatusBox title="Minor BD Count" value="200" />
            </Box>
          </Box>

          <Box sx={{ ...sectionBoxStyle, borderRight: "none" }}>
            <Typography variant="h6" textAlign="center" fontWeight={600}>
              BD Hours Status
            </Typography>
            <Box sx={sectionBodyBoxStyle}>
              <StatusBox title="BD Target" value="84" />
              <StatusBox title="BD Actual" value="54" />
              <StatusBox title="BD Yearly Actual" value="54" />
            </Box>
          </Box>
        </Box>

        <Box>
          <DailyBDTrendChart />
        </Box>

        <Row className="m-2 mb-3">
          <Col md={12} lg={6}>
            <MonthlyPlanVsActualChart />
          </Col>
          <Col md={12} lg={6}>
            <MTTRChart />
          </Col>
        </Row>
      </Paper>
    </Container>
  );
};

export default DailyBTDashboard;
