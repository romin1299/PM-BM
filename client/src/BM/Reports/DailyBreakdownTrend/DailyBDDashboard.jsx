import React, { useReducer } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { Box, Paper, Typography } from "@mui/material";
import DailyBDTrendChart from "./DailyBDTrendChart";
import MonthlyPlanVsActualChart from "./MonthlyPlanVsActual";
import MTTRChart from "./MTTRChart";
import ReportTitleBar from "../Common/ReportTitleBar";
import ChartsToolbar from "../ManHourReport/SubComponents/ChartsToolbar";

import {
  initialState,
  reducer,
} from "../ManHourReport/SubComponents/CommonFiltrationComponent";

const sectionBodyBoxStyle = {
  // display: "flex",
  justifyContent: "center",
  alignItems: "center",
  // gap: "10px",

  mt: "2px",
  // minHeight: "80px",
};

const StatusBox = ({ title, value }) => (
  <Col>
    <Typography
      variant="body2"
      component="div"
      textAlign="center"
      // width={120}
      fontWeight={500}
      mb={"2px"}
      // sx={{ md: { width: "120px" }, sm: { width: "100%" } }}
    >
      {title}
    </Typography>

    <Paper
      variant="outlined"
      sx={{
        backgroundColor: "#c6efce", //alternative color #deebf7
        // md: { width: "120px" },
        // sm: { width: "100%" },
      }}
    >
      <Typography
        variant="h5"
        component="h5"
        textAlign="center"
        fontWeight={500}
        p={1}
      >
        {value}
      </Typography>
    </Paper>
  </Col>
);

const DailyBTDashboard = () => {
  const [reduceState, reducerDispatch] = useReducer(reducer, initialState);
  const baseUrlForFiltering = "/getFiltrationValue/plant-level-filtration";

  return (
    <Container fluid>
      <Box>
        <ReportTitleBar
          title="KPI From Database"
          Toolbar={
            <ChartsToolbar
              baseUrlForFiltering={baseUrlForFiltering}
              reduceState={reduceState}
              reducerDispatch={reducerDispatch}
            />
          }
        />

        <Row className="g-3 mt-2">
          <Col md={12} lg={6}>
            <Box className="cell p-3 mb-0">
              <Typography variant="h6" textAlign="center" fontWeight={600}>
                BD Counts Status
              </Typography>
              <Box className="row gx-3" sx={sectionBodyBoxStyle}>
                <StatusBox title="MBD Target" value="84" />
                <StatusBox title="MBD Actual" value="54" />
                <StatusBox title="Minor BD Count" value="200" />
              </Box>
            </Box>
          </Col>

          <Col md={12} lg={6}>
            <Box className="cell p-3 mb-0">
              <Typography variant="h6" textAlign="center" fontWeight={600}>
                BD Hours Status
              </Typography>
              <Box className="row gx-3" sx={sectionBodyBoxStyle}>
                <StatusBox title="BD Target" value="84" />
                <StatusBox title="BD Actual" value="54" />
                <StatusBox title="BD Yearly Actual" value="54" />
              </Box>
            </Box>
          </Col>
        </Row>

        <Box className="mb-3 mt-3">
          <DailyBDTrendChart {...reduceState} />
        </Box>

        <Row className="mb-3 gx-3">
          <Col md={12} lg={6}>
            <MonthlyPlanVsActualChart />
          </Col>
          <Col md={12} lg={6}>
            <MTTRChart />
          </Col>
        </Row>
      </Box>
    </Container>
  );
};

export default DailyBTDashboard;
