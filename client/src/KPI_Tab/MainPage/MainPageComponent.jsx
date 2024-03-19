import React, { useState, useReducer, useContext } from "react";
import { Col, Container, Row } from "react-bootstrap";
import ChartsToolbar from "../../BM/Reports/ManHourReport/SubComponents/ChartsToolbar";
import ReportTitleBar from "../../BM/Reports/Common/ReportTitleBar";
import { Box } from "@mui/material";
import {
  initialState,
  reducer,
} from "../../BM/Reports/ManHourReport/SubComponents/CommonFiltrationComponent";
import AllSpareConsumptionCostMTDKPI from "./AllSpareConsumptionCostMTDKPI";
import PMStatusComponent from "./PMStatusComponent";
import MonthlyBDTrendChart from "../../BM/Reports/MonthlyBDTrend/MonthlyBDTrendChart";
import TMLoad from "../../BM/Reports/ManHourReport/TMLoad";
import KPIBDHoursAndCountStatus from "./KPIBDHoursAndCountStatus";
import DataNotFound from "../../BM/Reports/Common/DataNotFound";
import ChartTitleBar from "../../BM/Reports/Common/ChartTitleBar";
import MTTRChart from "../../BM/Reports/DailyBreakdownTrend/MTTRChart";
import RoutingContext from "../../context/routing/RoutingContext";
import ManHourTrend from "../../BM/Reports/ManHourReport/ManHourTrend";

const MainPageComponent = () => {
  const [filter, setFilter] = useState("hourly");
  const currentTabViewName = "Plant";

  const [reduceState, reducerDispatch] = useReducer(reducer, initialState);
  const baseUrlForFiltering = "/getFiltrationValue/plant-level-filtration";
  const loggedUserDetails = useContext(RoutingContext);

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
                monthFiltration
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
          <Col md={12} lg={3}>
            <AllSpareConsumptionCostMTDKPI
              selectedValue={reduceState?.selectedValue}
              flagForTogglingFilter={reduceState?.flagForTogglingFilter}
              selectedYear={reduceState?.selectedYear}
              selectedMonth={reduceState?.selectedMonth}
            />
          </Col>
        </Row>

        <Row className="mt-2">
          <Col md={12} lg={7}>
            <MTTRChart
              userDetails={loggedUserDetails}
              filterValues={reduceState}
              {...reduceState}
            />
          </Col>
          <Col md={12} lg={5}>
            <ManHourTrend
              userDetails={loggedUserDetails}
              filterValues={reduceState}
              selectedValue={reduceState?.selectedValue}
              flagForTogglingFilter={reduceState?.flagForTogglingFilter}
              selectedYear={reduceState?.selectedYear}
            />
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default MainPageComponent;
