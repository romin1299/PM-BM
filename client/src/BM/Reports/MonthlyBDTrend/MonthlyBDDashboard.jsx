import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import { Box, Paper, Typography } from "@mui/material";
import MTTRChart from "../DailyBreakdownTrend/MTTRChart";
import MonthlyBDTrendChart from "./MonthlyBDTrendChart";
import YearlyTrendChart from "./YearlyTrendChart";
import MajorBDCount from "./MajorBDCount";

const MonthlyBDTDashboard = () => {
  const data = ["Plant", "Elec", "Gasoline", "Ceramic", "Part"];

  return (


    <Container fluid>
      <Box className="cell p-3 mt-3">
        <Row>
          {data.map((text, i) => (
            <Col className="col-auto d-flex gap-1">
              <Paper
                elevation={0} variant="contained" sx={{ p: 1, pl: 1, pr: 2, bgcolor: '#017C7E' }}
                key={i}
              >
                <Typography variant="p" sx={{ color: 'white' }} component="p">
                  {text}
                </Typography>
              </Paper>
            </Col>
          ))}
        </Row>


        <Row className="mt-3">
          <Col md={12} lg={9}>
            <MonthlyBDTrendChart />
          </Col>
          <Col md={12} lg={3}>
            <YearlyTrendChart />
          </Col>
        </Row>

        <MajorBDCount />

      </Box>
    </Container>
  );
};

export default MonthlyBDTDashboard;
