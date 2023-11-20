import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import { Paper, Typography } from "@mui/material";
import MTTRChart from "../DailyBreakdownTrend/MTTRChart";
import MonthlyBDTrendChart from "./MonthlyBDTrendChart";
import YearlyTrendChart from "./YearlyTrendChart";
import MajorBDCount from "./MajorBDCount";

const MonthlyBDTDashboard = () => {
  const data = ["Plant", "Elec", "Gasoline", "Ceramic", "Part"];

  return (
    <Container fluid className="d-flex flex-column gap-3 mt-3 mb-5">
      <Row>
        {data.map((text, i) => (
          <Col className="col-auto d-flex gap-2">
            <Paper
              elevation={0}
              variant="outlined"
              sx={{ p: 1, pl: 2, pr: 2 }}
              key={i}
            >
              <Typography variant="h6" component="h6">
                {text}
              </Typography>
            </Paper>
          </Col>
        ))}
      </Row>

      <Paper elevation={0} variant="outlined">
        <Row className="m-2 mb-3 pt-3 pb-1">
          <Col md={12} lg={9}>
            <MonthlyBDTrendChart />
          </Col>
          <Col md={12} lg={3}>
            <YearlyTrendChart />
          </Col>
        </Row>

        <hr />

        <MajorBDCount />
      </Paper>
    </Container>
  );
};

export default MonthlyBDTDashboard;
