import React, { useEffect, useReducer } from "react";
import { Col, Container, Row } from "react-bootstrap";

import MTBFTrend from "./MTBFTrend";
import MTBFLineTrend from "./MTBFLineTrend";
import MTBFMachineTrend from "./MTBFMachineTrend";

const MTBFReportDashboard = () => {
  const initialState = {
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
          selectedValue: action?.selectedCell,
        };

      default:
        return state;
    }
  };

  const [reduceState, reducerDispatch] = useReducer(reducer, initialState);

  return (
    <Container fluid>
      <Row>
        <Col>
          <MTBFTrend
            selectedValue={reduceState?.selectedValue}
            flagForCellAndLineToggle={reduceState?.flagForCellAndLineToggle}
          />
        </Col>
        <Col>
          <MTBFLineTrend
            selectedValue={reduceState?.selectedValue}
            flagForCellAndLineToggle={reduceState?.flagForCellAndLineToggle}
          />
        </Col>
      </Row>
      <Row>
        <Col>
          <MTBFMachineTrend
            selectedValue={reduceState?.selectedValue}
            flagForCellAndLineToggle={reduceState?.flagForCellAndLineToggle}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default MTBFReportDashboard;
