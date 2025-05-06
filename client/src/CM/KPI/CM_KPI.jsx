import { Box } from "@mui/material";
import React, { useReducer } from "react";
import { Col, Container, Row } from "react-bootstrap";
import ReportTitleBar from "../../BM/Reports/Common/ReportTitleBar";
import ChartsToolbar from "../../BM/Reports/ManHourReport/SubComponents/ChartsToolbar";
import DownloadMenu from "../../BM/Reports/ManHourReport/SubComponents/DownloadMenu";
import { exportPPTX } from "../../BM/Utils/ExportPPTX/exportPPTX";
import {
  initialState,
  reducer,
} from "../../BM/Reports/ManHourReport/SubComponents/CommonFiltrationComponent";
import PlanVsActualMonthWiseBarChart from "./Chart_Component/PlanVsActualMonthWiseBarChart";
import PlanVsActualLineWiseBarChart from "./Chart_Component/PlanVsActualLineWiseBarChart";
import ActivityTimeStackedBarChart from "./Chart_Component/ActivityTimeStackedBarChart";
import ActivityManHourStackedBarChart from "./Chart_Component/ActivityManHourStackedBarChart";

const CM_KPI = () => {
  const [reduceState, reducerDispatch] = useReducer(reducer, initialState());

  const baseUrlForFiltering = "/getFiltrationValue/all-filtration";

  return (
    <Container fluid>
      <Box>
        <ReportTitleBar
          title="CM KPI"
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
                resetButtonFiltration
              />
              <Col className="col-auto">
                <DownloadMenu
                  handleDownloadPPTX={() => {
                    // exportPPTX(EXPORT_REPORT.MAN_HOUR_REPORT, reduceState);
                  }}
                />
              </Col>
            </>
          }
        />
        <Row className="mt-3 gx-3 pb-4">
          <Col md={12} lg={6}>
            <PlanVsActualMonthWiseBarChart
              // userDetails={loggedUserDetails}
              filterValues={reduceState}
              selectedValue={reduceState?.selectedValue}
              flagForTogglingFilter={reduceState?.flagForTogglingFilter}
              selectedYear={reduceState?.selectedYear}
            />
          </Col>
          <Col md={12} lg={6}>
            <PlanVsActualLineWiseBarChart
              filterValues={reduceState}
              selectedValue={reduceState?.selectedValue}
              flagForTogglingFilter={reduceState?.flagForTogglingFilter}
              selectedYear={reduceState?.selectedYear}
            />
          </Col>
        </Row>
        <Row>
          <Col md={12} lg={6}>
            <ActivityTimeStackedBarChart
              filterValues={reduceState}
              selectedValue={reduceState?.selectedValue}
              flagForTogglingFilter={reduceState?.flagForTogglingFilter}
              selectedYear={reduceState?.selectedYear}
            />
          </Col>
          <Col md={12} lg={6}>
            <ActivityManHourStackedBarChart
              filterValues={reduceState}
              selectedValue={reduceState?.selectedValue}
              flagForTogglingFilter={reduceState?.flagForTogglingFilter}
              selectedYear={reduceState?.selectedYear}
            />
          </Col>
        </Row>
      </Box>
    </Container>
  );
};

export default CM_KPI;
