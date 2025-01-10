import React, { useReducer, useState } from "react";
import { Container } from "react-bootstrap";
import RequestSheetOfLTPM from "./RequestSheetOfLTPM";
import BMTitlebar from "../../../../BM/Component/BMTitlebar";
import ChartsToolbar from "../../../../BM/Reports/ManHourReport/SubComponents/ChartsToolbar";
import {
  initialState,
  reducer,
} from "../../../../BM/Reports/ManHourReport/SubComponents/CommonFiltrationComponent";

const DashboardOfLTPM = () => {
  const baseUrlForFiltering = "/getFiltrationValue/cell-level-filtration";
  const [reduceState, reducerDispatch] = useReducer(reducer, initialState(""));

  return (
    <>
      <Container fluid>
        <BMTitlebar
          title="LTPM Dashboard"
          Toolbar={
            <ChartsToolbar
              baseUrlForFiltering={baseUrlForFiltering}
              reduceState={reduceState}
              reducerDispatch={reducerDispatch}
              // monthFiltration
              // yearFiltration
              sectionFiltration
              subSectionFiltration
              cellFiltration
              lineFiltration
              resetButtonFiltration
              selectedLineOrNot="Yes"
              // isWithLocalStorageForFiltration="Yes"
            />
          }
        />
      </Container>

      {reduceState?.selectedValue && (
        <RequestSheetOfLTPM
          reduceState={reduceState}
          selectedLine={reduceState?.selectedLine}
        />
      )}
    </>
  );
};

export default DashboardOfLTPM;
