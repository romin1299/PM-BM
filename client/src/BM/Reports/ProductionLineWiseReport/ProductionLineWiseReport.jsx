import React, { useEffect, useReducer } from "react";
import { Container, Row, Col } from "reactstrap";

import BDHoursVsCountComponent from "./BDHoursVsCountComponent";
import MTTRComponent from "./MTTRComponent";

const ProductionLineWiseReport = () => {
  const initialState = {
    selectedCell: "",
    cellData: [],

    flagForCellAndLineToggle: "based-on-cell",

    message: "",
    isLoading: true,
    isError: false,
  };

  const ACTION = {
    GET_CELL_INFO: "get-cell-dropdown-data",
  };

  const reducer = (state, action) => {
    switch (action?.type) {
      case ACTION?.GET_CELL_INFO:
        return {
          ...state,
          isLoading: false,
          message: action?.message,
          cellData: action?.cellData,
          selectedCell: action?.selectedCell,
        };

      case ACTION?.SELECT_CELL:
        return {
          ...state,
          selectedCell: action?.selectedCell,
          selectedLine: "",
        };

      case ACTION?.SELECT_LINE:
        return {
          ...state,
          selectedLine: action?.selectedCell,
        };

      default:
        return state;
    }
  };

  const [reduceState, reducerDispatch] = useReducer(reducer, initialState);

  const getProductionLineWiseReportData = async () => {
    try {
      const res = await fetch("/getCellDropdownValueBasedOnDashboardLevel", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const { message, selectedCell, cellData } = await res.json();

      if (res?.status === 201) {
        reducerDispatch({
          type: ACTION.GET_CELL_INFO,
          cellData,
          selectedCell,
          message,
        });
      }
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    getProductionLineWiseReportData();
  }, []);

  return (
    <Container fluid>
      <Row>
        <Col>
          <MTTRComponent
            selectedCell={reduceState?.selectedCell}
            flagForCellAndLineToggle={reduceState?.flagForCellAndLineToggle}
          />
        </Col>
      </Row>
      <Row>
        <Col>
          <BDHoursVsCountComponent
            selectedCell={reduceState?.selectedCell}
            flagForCellAndLineToggle={reduceState?.flagForCellAndLineToggle}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default ProductionLineWiseReport;
