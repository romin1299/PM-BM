import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import { Box, Paper, Typography } from "@mui/material";
import ChartsToolbar from "./SubComponents/ChartsToolbar";
import MTTRTrendChart from "./MTTR_Trend";
import MachineTrend from "./MachineTrend";
import MachineDataTable from "./MachineDataTable";
import LineTrend from "./LineTrend";

const MTTRDashboard = () => {
  return (
    <Container fluid>
      <Box className="cell p-3 mt-3">
        <Row>
          <Col className="d-flex align-items-center">
            <Typography variant="h4" component="h4">
              MTTR Report
            </Typography>
          </Col>

          <ChartsToolbar />
        </Row>


        <Row className="mt-3">
          <Col md={12}>
            <MTTRTrendChart />
          </Col>

          <Col md={12}>
            <LineTrend />
          </Col>

          <Col md={12}>
            <MachineTrend />
          </Col>

          <Col md={12}>
            <MachineDataTable />
          </Col>
        </Row>
      </Box>
    </Container>
  );
};

export default MTTRDashboard;
