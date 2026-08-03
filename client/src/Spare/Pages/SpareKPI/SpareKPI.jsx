import React, { useReducer } from "react";
import { Container } from "react-bootstrap";
import SpareTitlebar from "../../Component/SpareTitlebar";
import ChartsToolbar from "../../../BM/Reports/ManHourReport/SubComponents/ChartsToolbar";
import {
  initialState,
  reducer,
} from "../../../BM/Reports/ManHourReport/SubComponents/CommonFiltrationComponent";
import KPISummery from "./KPISummery";

const SpareKPI = () => {
  const [reduceState, reducerDispatch] = useReducer(reducer, initialState());

  return (
    <Container fluid>
      <SpareTitlebar
        title="Spare KPI"
        Toolbar={
          <ChartsToolbar
            baseUrlForFiltering="/getFiltrationValue/all-filtration"
            reduceState={reduceState}
            reducerDispatch={reducerDispatch}
            monthFiltration
            yearFiltration
            resetButtonFiltration
          />
        }
      />
      <KPISummery {...reduceState} />
    </Container>
  );
};

export default SpareKPI;
