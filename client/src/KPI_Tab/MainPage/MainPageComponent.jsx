import React, { useReducer } from "react";
import { Col, Container, Row } from "react-bootstrap";
import ChartsToolbar from "../../BM/Reports/ManHourReport/SubComponents/ChartsToolbar";
import ReportTitleBar from "../../BM/Reports/Common/ReportTitleBar";
import { Box } from "@mui/material";
import { initialState, reducer } from "../../BM/Reports/ManHourReport/SubComponents/CommonFiltrationComponent";

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
                sectionFiltration
                subSectionFiltration
                cellFiltration
                lineFiltration
                resetButtonFiltration
              />
            }
          />
        </Box>
      </Container>
    </>
  );
};

export default MainPageComponent;
