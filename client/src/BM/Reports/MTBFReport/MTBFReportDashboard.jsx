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
import ReportTitleBar from "../Common/ReportTitleBar";

const MTBFReportDashboard = () => {
  const [reduceState, reducerDispatch] = useReducer(reducer, initialState);
  const baseUrlForFiltering = "/getFiltrationValue/all-filtration";

  return (
    <Container fluid>
      <Box>
        <ReportTitleBar
          title="MTBF Report"
          Toolbar={
            <ChartsToolbar
              baseUrlForFiltering={baseUrlForFiltering}
              reduceState={reduceState}
              reducerDispatch={reducerDispatch}
              monthFiltration
            />
          }
        />

        <Row className="mt-3 gx-3">
          <Col md={12} lg={6}>
            <MTBFTrend
              selectedValue={reduceState?.selectedValue}
              flagForTogglingFilter={reduceState?.flagForTogglingFilter}
              selectedYear={reduceState?.selectedYear}
            />
          </Col>
          <Col md={12} lg={6}>
            <MTBFLineTrend
              selectedValue={reduceState?.selectedValue}
              flagForTogglingFilter={reduceState?.flagForTogglingFilter}
              selectedYear={reduceState?.selectedYear}
              selectedMonth={reduceState?.selectedMonth}
            />
          </Col>
        </Row>

        <Row className="mt-3">
          <Col>
            <MTBFMachineTrend
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

export default MTBFReportDashboard;
