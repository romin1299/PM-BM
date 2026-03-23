import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import { Box,Paper, Typography } from "@mui/material";
import ChartsToolbar from "./SubComponents/ChartsToolbar";
import MTTRTrendChart from "./MTBF_Trend";
import LineTrend from "./LineTrend";
import MachineTrend from "./MachineTrend";
import MachineDataTable from "../MTTRReport/MachineDataTable";

const MTBFDashboard = () => {
  return (
    <Container fluid>
      <Box className="cell p-3 mb-3 mt-3">
      <Row style={{ marginBottom: "1rem" }}>
          <Col className="d-flex align-items-center">
            <Typography variant="h4" component="h4">
              MTBF Report
            </Typography>
          </Col>

          <ChartsToolbar />
        </Row>
      

      <Row className="mt-3">
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
      </Box>
    </Container>
  );
};

export default MTBFDashboard;
