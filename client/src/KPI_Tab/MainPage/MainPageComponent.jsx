import React, { useReducer } from "react";
import { Col, Container, Row } from "react-bootstrap";
import ChartsToolbar from "../../BM/Reports/ManHourReport/SubComponents/ChartsToolbar";
import ReportTitleBar from "../../BM/Reports/Common/ReportTitleBar";
import { Box } from "@mui/material";
import {
  initialState,
  reducer,
} from "../../BM/Reports/ManHourReport/SubComponents/CommonFiltrationComponent";
import AllSpareConsumptionCostMTDKPI from "./AllSpareConsumptionCostMTDKPI";

const MainPageComponent = () => {
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
        <AllSpareConsumptionCostMTDKPI
          selectedValue={reduceState?.selectedValue}
          flagForTogglingFilter={reduceState?.flagForTogglingFilter}
          selectedYear={reduceState?.selectedYear}
          selectedMonth={reduceState?.selectedMonth}
        />
      </Container>
    </>
  );
};

export default MainPageComponent;
