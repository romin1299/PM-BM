import React, { useReducer } from "react";
import { Container, Row } from "react-bootstrap";

import BMTitlebar from "../../BM/Component/BMTitlebar";
import ChartsToolbar from "../../BM/Reports/ManHourReport/SubComponents/ChartsToolbar";
import {
  initialState,
  reducer,
} from "../../BM/Reports/ManHourReport/SubComponents/CommonFiltrationComponent";

import SpareSheetTable from "../Component/SpareSheetTable";

const SpareTableWithFilters = ({
  title = "Approval Dashboard",
  OtherCompo = () => <></>,
  url = "/v1/spare/spareRequestSheet/approval",
  tableProps = {
    exportMenu: {
      exportFileNamePrefix: "Approval List of Request-Sheet",
    },
  },
}) => {
  const [reduceState, reducerDispatch] = useReducer(reducer, initialState());

  return (
    <>
      <Container fluid>
        <BMTitlebar
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
              resetButtonFiltration
              // quarterFiltration
              // isWithLocalStorageForFiltration="Yes"
            />
          }
        />
        {reduceState?.selectedValue && (
          <>
            <Row className="gap-2 g-0">
              <OtherCompo {...reduceState} />
            </Row>
            <Row className="g-0">
              <SpareSheetTable
                {...reduceState}
                url={url}
                tableProps={tableProps}
              />
            </Row>
          </>
        )}
      </Container>
    </>
  );
};

export default SpareTableWithFilters;
