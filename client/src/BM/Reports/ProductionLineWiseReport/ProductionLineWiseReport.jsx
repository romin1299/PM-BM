import React, { useState, useReducer, useEffect } from "react";
import { Container, Row, Col } from "reactstrap";

import DailyBDTrendChart from "../DailyBreakdownTrend/DailyBDTrendChart";

import BDHoursVsCountComponent from "./BDHoursVsCountComponent";
import MTTRComponent from "./MTTRComponent";
import MTBFComponent from "./MTBFComponent.jsx";
import BDhours from "./BDhours";
import { Box } from "@mui/material";
import BDPercentageChart from "./BDPercentage.jsx";
import CategoryPieCharts from "./CategoryPieCharts.jsx";

import BDRSTableWithDateFiltration from "../Common/BDRSTableWithDateFiltration";
import AntDesignRSTableWithFiltration from "../Common/AntDesignRSTableWithFiltration";

import ChartsToolbar from "../ManHourReport/SubComponents/ChartsToolbar";
import currentMonth from "../../../pages/Dashboard/DashboardComponent/currentMonth";

import {
  initialState,
  reducer,
} from "../ManHourReport/SubComponents/CommonFiltrationComponent";
import ReportTitleBar from "../Common/ReportTitleBar.jsx";
import DownloadMenu from "../ManHourReport/SubComponents/DownloadMenu.jsx";
import {
  EXPORT_REPORT,
  exportPPTX,
} from "../../Utils/ExportPPTX/exportPPTX.js";

const ProductionLineWiseReport = () => {
  const [reduceState, reducerDispatch] = useReducer(reducer, initialState);
  const baseUrlForFiltering = "/getFiltrationValue/cell-level-filtration";

  const [dailyBDSelectedMonth, setDailyBDSelectedMonth] =
    useState(currentMonth);

  return (
    <Container fluid>
      <Box>
        <ReportTitleBar
          title="Product/Line Wise KPI"
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
                  handleDownloadPPTXForLineWiseKPI={() => {
                    exportPPTX(EXPORT_REPORT.LINE_WISE_KPI_STATUS, reduceState);
                  }}
                  handleDownloadPPTX={() => {
                    exportPPTX(EXPORT_REPORT.PRODUCT_LINE_WISE, {
                      ...reduceState,
                      dailyBDSelectedMonth,
                    });
                  }}
                />
              </Col>
            </>
          }
        />

        <DailyBDTrendChart
          selectedValue={reduceState?.selectedValue}
          flagForTogglingFilter={reduceState?.flagForTogglingFilter}
          selectedYear={reduceState?.selectedYear}
          dailyBDSelectedMonth={dailyBDSelectedMonth}
          setDailyBDSelectedMonth={setDailyBDSelectedMonth}
        />

        <BDRSTableWithDateFiltration
          flagForTogglingFilter={reduceState?.flagForTogglingFilter}
          selectedValue={reduceState?.selectedValue}
        />

        <Row className="mt-3 g-2">
          <Col xxl={3} lg={6} md={6}>
            <BDhours
              selectedValue={reduceState?.selectedValue}
              flagForTogglingFilter={reduceState?.flagForTogglingFilter}
              selectedYear={reduceState?.selectedYear}
            />
          </Col>
          <Col xxl={3} lg={6} md={6}>
            <MTTRComponent
              selectedValue={reduceState?.selectedValue}
              flagForTogglingFilter={reduceState?.flagForTogglingFilter}
              selectedYear={reduceState?.selectedYear}
            />
          </Col>
          <Col xxl={3} lg={6} md={6}>
            <MTBFComponent
              selectedValue={reduceState?.selectedValue}
              flagForTogglingFilter={reduceState?.flagForTogglingFilter}
              selectedYear={reduceState?.selectedYear}
            />
          </Col>
          <Col xxl={3} lg={6} md={6}>
            <BDPercentageChart
              selectedValue={reduceState?.selectedValue}
              flagForTogglingFilter={reduceState?.flagForTogglingFilter}
              selectedYear={reduceState?.selectedYear}
            />
          </Col>
        </Row>

        <Row className="mt-1 g-2">
          <Col lg={6} md={12}>
            <BDHoursVsCountComponent
              selectedValue={reduceState?.selectedValue}
              flagForTogglingFilter={reduceState?.flagForTogglingFilter}
              selectedYear={reduceState?.selectedYear}
              selectedMonth={reduceState?.selectedMonth}
            />
          </Col>
          <Col lg={6} md={12}>
            <CategoryPieCharts
              selectedValue={reduceState?.selectedValue}
              flagForTogglingFilter={reduceState?.flagForTogglingFilter}
              selectedYear={reduceState?.selectedYear}
              selectedMonth={reduceState?.selectedMonth}
            />
          </Col>
        </Row>

        <AntDesignRSTableWithFiltration
          selectedValue={reduceState?.selectedValue}
          flagForTogglingFilter={reduceState?.flagForTogglingFilter}
          selectedYear={reduceState?.selectedYear}
          downloadFileName="Product/Line wise KPI"
        />
      </Box>
    </Container>
  );
};

export default ProductionLineWiseReport;
