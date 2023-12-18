import React, { useReducer } from "react";
import { Container, Row, Col } from "react-bootstrap";

import { Box, Paper, Typography } from "@mui/material";
import ChartsToolbar from "../ManHourReport/SubComponents/ChartsToolbar";
import MTTRTrend from "./MTTRTrend";
import TMProgress from "./TMProgress";
import ReportTitleBar from "../Common/ReportTitleBar";
import {
  initialState,
  reducer,
} from "../ManHourReport/SubComponents/CommonFiltrationComponent";
import TmMttrSkillScore from "./TmMttrSkillScore";

const TMMTRMain = () => {
  const [reduceState, reducerDispatch] = useReducer(reducer, initialState);
  const baseUrlForFiltering = "/getFiltrationValue/all-filtration";

  // console.log("reduceState:", reduceState);
  return (
    <Container fluid>
      <Box>
        <ReportTitleBar
          title="TM MTTR Skill"
          Toolbar={
            <ChartsToolbar
              baseUrlForFiltering={baseUrlForFiltering}
              reduceState={reduceState}
              reducerDispatch={reducerDispatch}
            />
          }
        />

        <Row className="mt-3">
          <Col md={12} lg={6}>
            <MTTRTrend
              selectedValue={reduceState?.selectedValue}
              flagForTogglingFilter={reduceState?.flagForTogglingFilter}
              selectedYear={reduceState?.selectedYear}
              selectedMonth={reduceState?.selectedMonth}
            />
          </Col>

          <Col md={12} lg={6}>
            <TMProgress
              selectedValue={reduceState?.selectedValue}
              flagForTogglingFilter={reduceState?.flagForTogglingFilter}
              selectedYear={reduceState?.selectedYear}
              selectedMonth={reduceState?.selectedMonth}
            />
          </Col>

          <Col md={12} style={{ marginTop: "1rem" }}>
            <TmMttrSkillScore />
          </Col>

          {/* <Col
            md={12}
            style={{ marginTop: "1rem", paddingBottom: "4rem" }}
          ></Col> */}
        </Row>
      </Box>
    </Container>
  );
};

export default TMMTRMain;
