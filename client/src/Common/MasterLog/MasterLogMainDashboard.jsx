import React, { useState, useReducer, useEffect } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { Box } from "@mui/material";

import ReportTitleBar from "../../BM/Reports/Common/ReportTitleBar";
import ChartsToolbar from "../../BM/Reports/ManHourReport/SubComponents/ChartsToolbar";

import {
  initialState,
  reducer,
} from "../../BM/Reports/ManHourReport/SubComponents/CommonFiltrationComponent";

import MasterLogTable from "./MasterLogTable";
import { useLocation } from "react-router-dom";
import { MuiNavigateBack } from "../ButtonComponents/CustomHooksForBackNavigation";

const MasterLogInnerComponent = () => {
  const [reduceState, reducerDispatch] = useReducer(reducer, initialState);
  const baseUrlForFiltering = "/getFiltrationValue/all-filtration";

  return (
    <Container fluid>
      <Box>
        <Row>
          <Col>
            <ReportTitleBar
              title="Master Log"
              Toolbar={
                <>
                  <ChartsToolbar
                    baseUrlForFiltering={baseUrlForFiltering}
                    reduceState={reduceState}
                    reducerDispatch={reducerDispatch}
                    monthFiltration
                    yearFiltration
                    sectionFiltration
                    subSectionFiltration
                    cellFiltration
                    lineFiltration
                    machineFiltration
                    resetButtonFiltration
                  />
                </>
              }
            />
          </Col>
        </Row>
        <Row>
          <Col>
            <MasterLogTable {...reduceState} />
          </Col>
        </Row>
      </Box>
    </Container>
  );
};
const MasterLogMainDashboard = () => {
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);

  // for (const [key, value] of searchParams.entries()) {
  //   console.log(`${key}, ${value}`);
  // }
  // console.log(searchParams.get("machine"));

  if (search) {
    return (
      <Container fluid>
        <Box>
          <Row>
            <Col>
              <ReportTitleBar
                title="Master Log"
                PreTools={<MuiNavigateBack />}
              />
            </Col>
          </Row>
          <Row>
            <Col>
              <MasterLogTable
                flagForTogglingFilter="based-on-machine"
                selectedValue={searchParams.get("machine")}
                selectedYear={searchParams.get("selectedYear")}
                selectedMonth={searchParams.get("selectedMonth")}
              />
            </Col>
          </Row>
        </Box>
      </Container>
    );
  }
  return <MasterLogInnerComponent />;
};

export default MasterLogMainDashboard;
