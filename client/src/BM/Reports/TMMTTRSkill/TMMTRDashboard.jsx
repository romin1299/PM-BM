import React from 'react'
import { Container, Row, Col } from 'react-bootstrap';

import { Box, Paper, Typography } from "@mui/material";
import ChartsToolbar from "../ManHourReport/SubComponents/ChartsToolbar";
import MTTRTrend from './MTTRTrend';
import TMProgress from './TMProgress';


const TMMTRMain = () => {
  return (
    <Container fluid>
      <Box className="cell p-3 mb-3 mt-3">
        <Row style={{ marginBottom: "1rem" }}>
          <Col className="d-flex align-items-center">
            <Typography variant="h4" component="h4">
              TM MTTR Skill
            </Typography>
          </Col>

          <ChartsToolbar />
        </Row>


        <Row className="mt-3">
          <Col md={6}>
            <MTTRTrend />
          </Col>

          <Col md={6}>
            <TMProgress />
          </Col>

          <Col md={12} style={{ marginTop: "1rem" }}>

          </Col>

          <Col md={12} style={{ marginTop: "1rem", paddingBottom: "4rem" }}>

          </Col>
        </Row>
      </Box>
    </Container>
  )
}

export default TMMTRMain