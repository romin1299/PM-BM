import React from "react";
import { Container, Row, Col } from "react-bootstrap";

import { Box, Paper, Typography } from "@mui/material";
import ChartsToolbar from "../ManHourReport/SubComponents/ChartsToolbar";
import MTTRTrend from "./MTTRTrend";
import TMProgress from "./TMProgress";
import ReportTitleBar from "../Common/ReportTitleBar";

const TMMTRMain = () => {
  return (
    <Container fluid>
      <Box>
        <ReportTitleBar title="TM MTTR Skill" Toolbar={<ChartsToolbar />} />

        <Row className="mt-3">
          <Col md={12} lg={6}>
            <MTTRTrend />
          </Col>

          <Col md={12} lg={6}>
            <TMProgress />
          </Col>

          <Col md={12} style={{ marginTop: "1rem" }}></Col>

          <Col
            md={12}
            style={{ marginTop: "1rem", paddingBottom: "4rem" }}
          ></Col>
        </Row>
      </Box>
    </Container>
  );
};

export default TMMTRMain;
