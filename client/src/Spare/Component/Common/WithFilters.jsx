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
            /**
             * Tells the shared filtration endpoint this is a Spare page, so a
             * PM user who also works in the tool room gets plant-wide filters
             * here while staying section-scoped in PM and BM — see
             * server/utils/userScope.js.
             *
             * Deliberately not `moduleType`, which is already read by
             * responseFilterMiddleWareForSpare and would change the shape of
             * the response for every user of this page. This one is read only
             * by the scope helpers.
             */
            queryParams={{ scopeModule: "Spare" }}
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
