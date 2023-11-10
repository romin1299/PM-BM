import React, { useEffect, useReducer } from "react";

import { Container, Row, Col } from "reactstrap";
import MTTRChart from "./Charts/MTTRChart";

const MTTRComponent = ({ flagForCellAndLineToggle, selectedCell }) => {
  const initialState = {
    MTTRReportData: {
      labels: [],
      MTTR: [],
      target: [],
      backgroundColor: [],
    },

    message: "",
    isLoading: true,
    isError: false,
  };

  const ACTION = {
    GET: "get-MTTR-report-data",
  };

  const reducer = (state, action) => {
    switch (action?.type) {
      case ACTION?.GET:
        return {
          ...state,
          isLoading: false,
          message: action?.message,
          MTTRReportData: action?.MTTRReportData,
        };

      case ACTION?.SELECT_SUBSECTION:
        return {
          ...state,
          selectedSubSection: action?.selectedSubSection,
          selectedCell: "",
          selectedLine: "",
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

      case ACTION?.RESET_DROPDOWN_VALUE:
        return {
          ...state,
          selectedSubSection: "",
          selectedCell: "",
          selectedLine: "",
        };

      default:
        return state;
    }
  };

  const [reduceState, reducerDispatch] = useReducer(reducer, initialState);

  const getMTTRReportData = async () => {
    try {
      const res = await fetch(
        `/getMTTRGraphData/${flagForCellAndLineToggle}/632c41261d1becfedab325f9`,
        // `/getMTTRGraphData/${flagForCellAndLineToggle}/${selectedCell}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const { message, MTTRReportData } = await res.json();

      if (res?.status === 201) {
        reducerDispatch({
          type: ACTION.GET,
          message,
          MTTRReportData,
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (selectedCell) {
      getMTTRReportData();
    }
  }, [selectedCell]);

  return (
    <Container>
      <Row>
        <Col lg={4}>
          <MTTRChart MTTRReportData={reduceState?.MTTRReportData} />
        </Col>
      </Row>
    </Container>
  );
};

export default MTTRComponent;
