import React, { useEffect, useReducer } from "react";
import { Col, Container, Row } from "react-bootstrap";

import MTTRTrend from "./MTTRTrend";
import LineTrend from "./LineTrend";
import MachineTrend from "./MachineTrend";

const MTTRReportDashboard = () => {
  const initialState = {
    subSectionArray: [],

    selectedValue: "",
    flagForTogglingFilter: "based-on-cell",

    message: "",
    isLoading: true,
    isError: false,
  };

  const ACTION = {
    GET_DATA: "get-data",
  };

  const reducer = (state, action) => {
    switch (action?.type) {
      case ACTION?.GET_DATA:
        return {
          ...state,
          isLoading: false,
          message: action?.message,
          cellData: action?.cellData,
          selectedCell: action?.selectedCell,
          selectedValue: action?.selectedCell,
        };

      default:
        return state;
    }
  };

  const [reduceState, reducerDispatch] = useReducer(reducer, initialState);

  const getSectionOrSubSectionDropdownValue = async () => {
    try {
      const res = await fetch("/getSectionOrSubSectionDropdownValue", {
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
    getSectionOrSubSectionDropdownValue();
  }, []);

  return (
    <Container fluid>
      <Row>
        <Col>
          <MTTRTrend
            selectedValue={reduceState?.selectedValue}
            flagForCellAndLineToggle={reduceState?.flagForCellAndLineToggle}
          />
        </Col>
        <Col>
          <LineTrend
            selectedValue={reduceState?.selectedValue}
            flagForCellAndLineToggle={reduceState?.flagForCellAndLineToggle}
          />
        </Col>
      </Row>
      <Row>
        <Col>
          <MachineTrend
            selectedValue={reduceState?.selectedValue}
            flagForCellAndLineToggle={reduceState?.flagForCellAndLineToggle}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default MTTRReportDashboard;
