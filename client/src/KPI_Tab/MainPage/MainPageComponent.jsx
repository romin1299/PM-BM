import React, { useState, useReducer } from "react";
import { Col, Container, Row } from "react-bootstrap";
import ChartsToolbar from "../../BM/Reports/ManHourReport/SubComponents/ChartsToolbar";
import ReportTitleBar from "../../BM/Reports/Common/ReportTitleBar";
import { Box } from "@mui/material";
import {
  initialState,
  reducer,
} from "../../BM/Reports/ManHourReport/SubComponents/CommonFiltrationComponent";
import PMStatusComponent from "./PMStatusComponent";
import MonthlyBDTrendChart from "../../BM/Reports/MonthlyBDTrend/MonthlyBDTrendChart";
import TMLoad from "../../BM/Reports/ManHourReport/TMLoad";
import KPIBDHoursAndCountStatus from "./KPIBDHoursAndCountStatus";

const MainPageComponent = () => {
  const [filter, setFilter] = React.useState("hourly");
  const currentTabViewName = "Plant";

  const [reduceState, reducerDispatch] = useReducer(reducer, initialState);
  const baseUrlForFiltering = "/getFiltrationValue/plant-level-filtration";

  return (
    <>
      <Container fluid>
        <Box>
          <ReportTitleBar
            title="MTD KPI"
            Toolbar={
              <ChartsToolbar
                baseUrlForFiltering={baseUrlForFiltering}
                reduceState={reduceState}
                reducerDispatch={reducerDispatch}
                yearFiltration
                sectionFiltration
                subSectionFiltration
                cellFiltration
                lineFiltration
                resetButtonFiltration
              />
            }
          />
        </Box>

        <Row className="mt-3 gx-3">
          <Col md={12} lg={3}>
            <PMStatusComponent {...reduceState} />
          </Col>
          <Col md={12} lg={6}>
            <MonthlyBDTrendChart
              filterState={reduceState}
              filter={filter}
              setFilter={setFilter}
              currentTabViewName={currentTabViewName}
              selectedYear={reduceState.selectedYear}
              showFilterSwitch={true}
              forKPI={true}
              PropComponent={<KPIBDHoursAndCountStatus {...reduceState} />}
            />
          </Col>
        </Row>
        <Row>
          <Col md={12} lg={7}></Col>
          <Col md={12} lg={5}>
            <TMLoad
              selectedValue={reduceState?.selectedValueForLineAnTMLoadGraph}
              flagForTogglingFilter={
                reduceState?.togglingFilterFlagForLineAnTMLoadGraph
              }
              selectedYear={reduceState?.selectedYear}
              selectedMonth={reduceState?.selectedMonth}
            />
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default MainPageComponent;
