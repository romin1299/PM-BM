import React, { useState, useReducer, useContext } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { Box, Button, Paper, Typography } from "@mui/material";
import DailyBDTrendChart from "./DailyBDTrendChart";
import MTTRChart from "./MTTRChart";
import ReportTitleBar from "../Common/ReportTitleBar";
import ChartsToolbar from "../ManHourReport/SubComponents/ChartsToolbar";

import MonthlyBDTrendChart from "../MonthlyBDTrend/MonthlyBDTrendChart";

import {
  initialState,
  reducer,
} from "../ManHourReport/SubComponents/CommonFiltrationComponent";
import BDRSTableWithDateFiltration from "../Common/BDRSTableWithDateFiltration";

import currentMonth from "../../../pages/Dashboard/DashboardComponent/currentMonth";

import DownloadMenu from "../ManHourReport/SubComponents/DownloadMenu";
import { EXPORT_REPORT, exportPPTX } from "../../Utils/ExportPPTX/exportPPTX";
import RoutingContext from "../../../context/routing/RoutingContext";
import BDHoursAndCountStatus from "./BDHoursAndCountStatus";

const DailyBTDashboard = () => {
  const [currentTabView, setCurrentTabView] = React.useState(0);
  const [sectionId, setSectionId] = React.useState("");
  const [filter, setFilter] = React.useState("hourly");
  // const [selectedYear, setSelectedYear] = React.useState("");
  const currentTabViewName = currentTabView === 0 ? "Plant" : "Section";

  const [reduceState, reducerDispatch] = useReducer(reducer, initialState());
  const baseUrlForFiltering = "/getFiltrationValue/plant-level-filtration";

  const [dailyBDSelectedMonth, setDailyBDSelectedMonth] =
    useState(currentMonth);
  const loggedUserDetails = useContext(RoutingContext);

  return (
    <Container fluid>
      <Box>
        <ReportTitleBar
          title="KPI From Database"
          Toolbar={
            <>
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

              <Col className="col-auto">
                <DownloadMenu
                  handleDownloadPPTX={() => {
                    exportPPTX(EXPORT_REPORT.KPI_FROM_DB, {
                      ...reduceState,
                      filter,
                      dailyBDSelectedMonth,
                    });
                  }}
                />
              </Col>
            </>
          }
        />

        <Row className="gx-3 mt-3">
          <BDHoursAndCountStatus {...reduceState} />
        </Row>

        <Box className="mb-3 mt-0">
          <DailyBDTrendChart
            userDetails={loggedUserDetails}
            filterValues={reduceState}
            {...reduceState}
            dailyBDSelectedMonth={dailyBDSelectedMonth}
            setDailyBDSelectedMonth={setDailyBDSelectedMonth}
          />
        </Box>

        <BDRSTableWithDateFiltration
          flagForTogglingFilter={reduceState?.flagForTogglingFilter}
          selectedValue={reduceState?.selectedValue}
          selectedYear={reduceState?.selectedYear}
        />

        <Row className="mb-3 gx-3 mt-3">
          <Col md={12} lg={6}>
            {/* <MonthlyPlanVsActualChart /> */}

            {/* <Box className="row cell p-3 pt-2 pb-2 mt-3 g-0">
              <Box
                className="col"
                sx={{ display: "flex", alignItems: "center" }}
                // sx={{ borderBottom: 1, borderColor: "divider" }}
              >
                <Tabs
                  value={currentTabView}
                  onChange={handleChange}
                  indicatorColor="transparent"
                  textColor="inherit"
                  aria-label="tabs-switch"
                  sx={{
                    "& .MuiTab-root": { minHeight: "auto" },
                    "& .MuiTabs-scroller": {
                      display: "flex",
                      alignItems: "center",
                      minHeight: "50px",
                    },
                  }}
                  TabIndicatorProps={{
                    style: { display: "none" },
                  }}
                >
                  <Tab label="Plant" {...a11yProps(0)} />
                  <Tab label="Section" {...a11yProps(1)} />
                </Tabs>
              </Box>

              <Box
                className="col-auto"
                sx={{ display: "flex", alignItems: "center", gap: 2 }}
              >
                {currentTabView === 1 && (
                  <SectionsDropdown
                    sectionId={sectionId}
                    setSectionId={setSectionId}
                  />
                )}
           
                <DownloadMenu
                  handleDownloadPPTX={() => {
                    exportPPTX(EXPORT_REPORT.MONTHLY_BD, urlOptions);
                  }}
                />
              </Box>
            </Box> */}

            <MonthlyBDTrendChart
              filterState={reduceState}
              userDetails={loggedUserDetails}
              filter={filter}
              setFilter={setFilter}
              currentTabViewName={currentTabViewName}
              sectionId={sectionId}
              selectedYear={reduceState.selectedYear}
              showFilterSwitch={true}
            />
          </Col>
          <Col md={12} lg={6}>
            <MTTRChart
              userDetails={loggedUserDetails}
              filterValues={reduceState}
              {...reduceState}
            />
          </Col>
        </Row>
      </Box>
    </Container>
  );
};

export default DailyBTDashboard;
