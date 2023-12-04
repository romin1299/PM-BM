import React, { useEffect, useReducer } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { Box, Typography } from "@mui/material";

import MTTRTrend from "./MTTRTrend";
import LineTrend from "./LineTrend";
import MachineTrend from "./MachineTrend";
import ChartsToolbar from "../ManHourReport/SubComponents/ChartsToolbar";

import {
  initialState,
  reducer,
} from "../ManHourReport/SubComponents/CommonFiltrationComponent";

const MTTRReportDashboard = () => {
  const [reduceState, reducerDispatch] = useReducer(reducer, initialState);

  return (
    <Container fluid>
      <Box className="cell p-3 mt-3">
        <Row>
          <Col className="d-flex align-items-center">
            <Typography variant="h4" component="h4">
              MTTR Report
            </Typography>
          </Col>

          <ChartsToolbar
            reduceState={reduceState}
            reducerDispatch={reducerDispatch}
          />
        </Row>
        <Row>
          <Col>
            <MTTRTrend
              selectedValue={reduceState?.selectedValue}
              flagForTogglingFilter={reduceState?.flagForTogglingFilter}
              selectedYear={reduceState?.selectedYear}
            />
          </Col>
          <Col>
            <LineTrend
              selectedValue={reduceState?.selectedValue}
              flagForTogglingFilter={reduceState?.flagForTogglingFilter}
              selectedYear={reduceState?.selectedYear}
              selectedMonth={reduceState?.selectedMonth}
            />
          </Col>
        </Row>
        <Row>
          <Col>
            <MachineTrend
              selectedValue={reduceState?.selectedValue}
              flagForTogglingFilter={reduceState?.flagForTogglingFilter}
              selectedYear={reduceState?.selectedYear}
              selectedMonth={reduceState?.selectedMonth}
            />
          </Col>
        </Row>
      </Box>
    </Container>
  );
};

export default MTTRReportDashboard;
