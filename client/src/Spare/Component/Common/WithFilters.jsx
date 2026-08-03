import React, { useReducer } from "react";
import { Container } from "react-bootstrap";

import SpareTitlebar from "../SpareTitlebar";
import ChartsToolbar from "../../../BM/Reports/ManHourReport/SubComponents/ChartsToolbar";
import {
  initialState,
  reducer,
} from "../../../BM/Reports/ManHourReport/SubComponents/CommonFiltrationComponent";

const WithFilters = ({
  title = "Approval Dashboard",
  PropComp = () => <></>,
}) => {
  const [reduceState, reducerDispatch] = useReducer(reducer, initialState());

  return (
    <Container fluid>
      <SpareTitlebar
        title={title}
        Toolbar={
          <ChartsToolbar
            baseUrlForFiltering="/getFiltrationValue/all-filtration"
            reduceState={reduceState}
            reducerDispatch={reducerDispatch}
            // monthFiltration
            yearFiltration
            sectionFiltration
            subSectionFiltration
            cellFiltration
            lineFiltration
            machineFiltration
            resetButtonFiltration
            // quarterFiltration
            // isWithLocalStorageForFiltration="Yes"
          />
        }
      />
      {reduceState?.selectedValue && <PropComp {...reduceState} />}
    </Container>
  );
};

export default WithFilters;
