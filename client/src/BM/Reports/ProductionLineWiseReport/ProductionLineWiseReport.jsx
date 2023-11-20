import React, { useEffect, useReducer } from "react";
import { Container, Row, Col } from "reactstrap";

import BDHoursVsCountComponent from "./BDHoursVsCountComponent";
import MTTRComponent from "./MTTRComponent";
import MTBFComponent from "./MTBFComponent";
import BDhours from "./BDhours";

const ProductionLineWiseReport = () => {
  const initialState = {
    selectedCell: "",
    cellData: [],

    selectedValue: "",
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
          selectedValue: action?.selectedCell,
        };

      case ACTION?.SELECT_CELL:
        return {
          ...state,
          selectedCell: action?.selectedCell,
          selectedValue: action?.selectedCell,
          selectedLine: "",
        };

      case ACTION?.SELECT_LINE:
        return {
          ...state,
          selectedLine: action?.selectedLine,
          selectedValue: action?.selectedLine,
        };

      // case ACTION?.SELECT_SUBSECTION:
      //   return {
      //     ...state,
      //     selectedSubSection: action?.selectedSubSection,
      //     selectedCell: "",
      //     selectedLine: "",
      //   };

      // case ACTION?.SELECT_CELL:
      //   return {
      //     ...state,
      //     selectedCell: action?.selectedCell,
      //     selectedLine: "",
      //   };

      // case ACTION?.SELECT_LINE:
      //   return {
      //     ...state,
      //     selectedLine: action?.selectedCell,
      //   };

      // case ACTION?.RESET_DROPDOWN_VALUE:
      //   return {
      //     ...state,
      //     selectedSubSection: "",
      //     selectedCell: "",
      //     selectedLine: "",
      //   };

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
          <BDhours
            selectedValue={reduceState?.selectedValue}
            flagForCellAndLineToggle={reduceState?.flagForCellAndLineToggle}
          />
        </Col>
        <Col>
          <MTTRComponent
            selectedValue={reduceState?.selectedValue}
            flagForCellAndLineToggle={reduceState?.flagForCellAndLineToggle}
          />
        </Col>
        <Col>
          <MTBFComponent />
        </Col>
      </Row>
      <Row>
        <Col>
          <BDHoursVsCountComponent
            selectedValue={reduceState?.selectedValue}
            flagForCellAndLineToggle={reduceState?.flagForCellAndLineToggle}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default ProductionLineWiseReport;
