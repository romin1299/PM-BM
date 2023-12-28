import React, { useState, useReducer } from "react";
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
import ReportTitleBar from "../Common/ReportTitleBar";

import DownloadMenu from "../ManHourReport/SubComponents/DownloadMenu";
import { EXPORT_REPORT, exportPPTX } from "../../Utils/ExportPPTX/exportPPTX";

const MTTRReportDashboard = () => {
  const [reduceState, reducerDispatch] = useReducer(reducer, initialState);
  const baseUrlForFiltering = "/getFiltrationValue/all-filtration";

  const [documentLimitInTheGraph, setDocumentLimitInTheGraph] = useState(20);

  return (
    <Container fluid>
      <Box>
        <ReportTitleBar
          title="MTTR Report"
          Toolbar={
            <>
              <ChartsToolbar
                baseUrlForFiltering={baseUrlForFiltering}
                reduceState={reduceState}
                reducerDispatch={reducerDispatch}
                monthFiltration
              />

              <Col className="col-auto">
                <DownloadMenu
                  handleDownloadPPTX={() => {
                    exportPPTX(EXPORT_REPORT.COMMON_TEMPLATE_REPORT, {
                      ...reduceState,
                      name: "MTTR",
                      documentLimitInTheGraph,
                    });
                  }}
                />
              </Col>
            </>
          }
        />

        <Row className="mt-3 gx-3">
          <Col md={12} lg={6}>
            <MTTRTrend
              selectedValue={reduceState?.selectedValue}
              flagForTogglingFilter={reduceState?.flagForTogglingFilter}
              selectedYear={reduceState?.selectedYear}
            />
          </Col>
          <Col md={12} lg={6}>
            <LineTrend
              selectedValue={reduceState?.selectedValue}
              flagForTogglingFilter={reduceState?.flagForTogglingFilter}
              selectedYear={reduceState?.selectedYear}
              selectedMonth={reduceState?.selectedMonth}
            />
          </Col>
        </Row>

        <Row className="mt-3">
          <Col>
            <MachineTrend
              selectedValue={reduceState?.selectedValue}
              flagForTogglingFilter={reduceState?.flagForTogglingFilter}
              selectedYear={reduceState?.selectedYear}
              selectedMonth={reduceState?.selectedMonth}
              documentLimitInTheGraph={documentLimitInTheGraph}
              setDocumentLimitInTheGraph={setDocumentLimitInTheGraph}
            />
          </Col>
        </Row>
      </Box>
    </Container>
  );
};

export default MTTRReportDashboard;
