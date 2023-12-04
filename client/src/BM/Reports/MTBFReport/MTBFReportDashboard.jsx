import React, { useEffect, useReducer } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { Box, Typography } from "@mui/material";

import MTBFTrend from "./MTBFTrend";
import MTBFLineTrend from "./MTBFLineTrend";
import MTBFMachineTrend from "./MTBFMachineTrend";

import ChartsToolbar from "../ManHourReport/SubComponents/ChartsToolbar";

import {
  initialState,
  reducer,
} from "../ManHourReport/SubComponents/CommonFiltrationComponent";

const MTBFReportDashboard = () => {
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
            <MTBFTrend
              selectedValue={reduceState?.selectedValue}
              flagForTogglingFilter={reduceState?.flagForTogglingFilter}
            />
          </Col>
          <Col>
            <MTBFLineTrend
              selectedValue={reduceState?.selectedValue}
              flagForTogglingFilter={reduceState?.flagForTogglingFilter}
            />
          </Col>
        </Row>
        <Row>
          <Col>
            <MTBFMachineTrend
              selectedValue={reduceState?.selectedValue}
              flagForTogglingFilter={reduceState?.flagForTogglingFilter}
            />
          </Col>
        </Row>
      </Box>
    </Container>
  );
};

export default MTBFReportDashboard;
