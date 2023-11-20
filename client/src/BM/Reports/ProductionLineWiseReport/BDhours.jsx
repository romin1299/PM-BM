import React, { useEffect, useReducer } from "react";

import { Container, Row, Col } from "reactstrap";
import LineBarChartForProductionLineWise from "./Charts/LineBarChartForProductionLineWise";

const BDhours = ({ selectedValue, flagForCellAndLineToggle }) => {
  const initialState = {
    BDHours: {
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
          BDHours: action?.BDHours,
        };

      default:
        return state;
    }
  };

  const [reduceState, reducerDispatch] = useReducer(reducer, initialState);

  const getBDHours = async () => {
    try {
      const res = await fetch(
        `/getBDHoursGraphData/by-default/${flagForCellAndLineToggle}/632c41261d1becfedab325f9`,
        // `/getBDHoursGraphData/${flagForCellAndLineToggle}/${selectedValue}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const { message, BDHours } = await res.json();

      if (res?.status === 201) {
        reducerDispatch({
          type: ACTION.GET,
          message,
          BDHours,
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (selectedValue) {
      getBDHours();
    }
  }, [selectedValue]);

  return (
    <Container>
      <Row>
        <Col>
          <LineBarChartForProductionLineWise
            ReportData={reduceState?.BDHours}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default BDhours;
