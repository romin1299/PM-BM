import React, { useReducer, useContext } from "react";
import { Container } from "react-bootstrap";

import SpareTitlebar from "../SpareTitlebar";
import ChartsToolbar from "../../../BM/Reports/ManHourReport/SubComponents/ChartsToolbar";
import {
  initialState,
  reducer,
} from "../../../BM/Reports/ManHourReport/SubComponents/CommonFiltrationComponent";
import RoutingContext from "../../../context/routing/RoutingContext";
import { hasNoDefaultFilterSelection } from "../../../Utils/userScope";

const WithFilters = ({
  title = "Approval Dashboard",
  PropComp = () => <></>,
}) => {
  const loggedUser = useContext(RoutingContext);
  const [reduceState, reducerDispatch] = useReducer(reducer, initialState());

  /**
   * Users scoped to a section get one selected for them, so waiting for that
   * selection avoids a throwaway unfiltered request. Users who get no default
   * would otherwise wait forever, so they open on the whole plant instead.
   */
  const showContent =
    Boolean(reduceState?.selectedValue) ||
    hasNoDefaultFilterSelection(loggedUser);

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
      {showContent && <PropComp {...reduceState} />}
    </Container>
  );
};

export default WithFilters;
