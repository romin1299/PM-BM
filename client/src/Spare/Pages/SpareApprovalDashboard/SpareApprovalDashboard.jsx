import React, { useReducer } from "react";
import { Container, Row } from "react-bootstrap";

import BMTitlebar from "../../../BM/Component/BMTitlebar";
import ChartsToolbar from "../../../BM/Reports/ManHourReport/SubComponents/ChartsToolbar";
import {
  initialState,
  reducer,
} from "../../../BM/Reports/ManHourReport/SubComponents/CommonFiltrationComponent";

import MonthlyGeneratedAndCompletedCountTable from "./MonthlyGeneratedAndCompletedCountTable";
import ApprovalTable from "./ApprovalTable";

const baseUrlForFiltering = "/getFiltrationValue/all-filtration";

const SpareApprovalDashboard = () => {
  const [reduceState, reducerDispatch] = useReducer(reducer, initialState());

  return (
    <>
      <Container fluid>
        <BMTitlebar
          title="Approval Dashboard"
          Toolbar={
            <ChartsToolbar
              baseUrlForFiltering={baseUrlForFiltering}
              reduceState={reduceState}
              reducerDispatch={reducerDispatch}
              // monthFiltration
              yearFiltration
              sectionFiltration
              subSectionFiltration
              cellFiltration
              lineFiltration
              resetButtonFiltration
              // quarterFiltration
              isWithLocalStorageForFiltration="Yes"
            />
          }
        />
        <Row className="mt-3 gap-2 g-0">
          <MonthlyGeneratedAndCompletedCountTable />
        </Row>
        <Row className="g-0">
          <ApprovalTable {...reduceState} />
        </Row>
      </Container>
    </>
  );
};

export default SpareApprovalDashboard;
