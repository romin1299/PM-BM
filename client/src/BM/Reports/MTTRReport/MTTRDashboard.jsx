import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import { Paper, Typography } from "@mui/material";
import ChartsToolbar from "./SubComponents/ChartsToolbar";
import MTTRTrendChart from "./MTTR_Trend";
import MachineTrend from "./MachineTrend";
import MachineDataTable from "./MachineDataTable";
import LineTrend from "./LineTrend";

const MTTRDashboard = () => {
  return (
    <Container fluid>
      <Paper elevation={0} variant="outlined" sx={{ mt: 2, p: 1, pl: 2 }}>
        <Row>
          <Col className="d-flex align-items-center">
            <Typography variant="h4" component="h4">
              MTTR Report
            </Typography>
          </Col>

          <ChartsToolbar />
        </Row>
      </Paper>

      <Row style={{ marginTop: "1.25rem" }}>
        <Col md={6}>
          <MTTRTrendChart />
        </Col>

        <Col md={6}>
          <LineTrend />
        </Col>

        <Col md={12} style={{ marginTop: "1rem" }}>
          <MachineTrend />
        </Col>

        <Col md={12} style={{ marginTop: "1rem", paddingBottom: "4rem" }}>
          <MachineDataTable />
        </Col>
      </Row>
    </Container>
  );
};

export default MTTRDashboard;
