import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import { Box, Paper, Typography, } from "@mui/material";
import DailyBDTrendChart from "./DailyBDTrendChart";
import MonthlyPlanVsActualChart from "./MonthlyPlanVsActual";
import MTTRChart from "./MTTRChart";

const CustomPaper = ({ children }) => (
  <Paper elevation={0} variant="contained" sx={{ p: 1, pl: 1, pr: 2, bgcolor: '#017C7E' }}>
    {children}
  </Paper>
);

const sectionBoxStyle = {
  p: 1,
  borderRight: "1px solid lightgray",
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
    <Box className="cell pt-2">
      <div className="d-flex align-items-center justify-content-center">
        <h4>{value}</h4>
      </div>

    </Box>
  </div>
);

const DailyBTDashboard = () => {
  const data = ["Plant", "Elec", "Gasoline", "Ceramic", "Part"];

  return (
    <Container fluid>
      <Box className="cell p-3 mt-3">
        <Row>
          <Col className="col-auto mb-2">
            <CustomPaper>
              <Typography  variant="p" sx={{ color: 'white' }} component="p">
                KPI From Database
              </Typography>
            </CustomPaper>
          </Col>

          {data.map((text, i) => (
            <Col className="col-auto d-flex gap-1 mb-2">
              <CustomPaper key={i}>
                <Typography  variant="p" sx={{ color: 'white' }} component="p">
                  {text}
                </Typography>
              </CustomPaper>
            </Col>
          ))}
        </Row>

        <Box className="cell p-3 mb-3 mt-3">
          <Row sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Col lg={6} md={12} sm={12}>
              <Box sx={sectionBoxStyle}>
                <Row className="align-items-center">
                  <Col lg={4} md={6} >
                    <Typography variant="h6" fontWeight={600}>
                      BD Counts Status
                    </Typography>
                  </Col>
                  <Col lg={8} md={6} >
                    <Box sx={sectionBodyBoxStyle}>
                    <StatusBox variant="p" component="p" title="MBD Target" value="84" />&nbsp;&nbsp;&nbsp;
                      <StatusBox variant="p" component="p" title="MBD Actual" value="54" />&nbsp;&nbsp;&nbsp;
                      <StatusBox variant="p" component="p" title="Minor BD Count" value="200" />
                    </Box>
                  </Col>
                </Row>


              </Box>
            </Col>
            <Col lg={6} md={12} sm={12}>
              <Box sx={{ ...sectionBoxStyle, borderRight: "none" }}>
                <Row className="align-items-center">
                  <Col lg={4} md={6} >
                    <Typography variant="h6" fontWeight={600}>
                      BD Hours Status
                    </Typography>
                  </Col>
                  <Col lg={8} md={6} >
                    <Box sx={sectionBodyBoxStyle}>
                      <StatusBox variant="p" component="p" title="BD Target" value="84" />&nbsp;&nbsp;&nbsp;
                      <StatusBox variant="p" component="p" title="BD Actual" value="54" />&nbsp;&nbsp;&nbsp;
                      <StatusBox variant="p" component="p" title="BD Yearly Actual" value="54" />
                    </Box>
                  </Col>
                </Row>

              </Box>
            </Col>



          </Row>
        </Box>
        <Box className="mb-3 mt-3">
          <DailyBDTrendChart />
        </Box>




        <Row className="mb-3">
          <Col md={12} lg={6}>
            <MonthlyPlanVsActualChart />
          </Col>
          <Col md={12} lg={6}>
            <MTTRChart />
          </Col>
        </Row>

      </Box>
    </Container>
  );
};

export default DailyBTDashboard;
