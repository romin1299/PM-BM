import React, { useEffect, useReducer } from "react";
import { Box, Divider, Typography } from "@mui/material";
import { Container, Row, Col } from "reactstrap";
import LineBarChartForProductionLineWise from "./Charts/LineBarChartForProductionLineWise";

const BDhours = ({ selectedValue, flagForTogglingFilter, selectedYear }) => {
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
        // `/getBDHoursGraphData/${flagForTogglingFilter}/632c41261d1becfedab325f9/?selectedYear=${selectedYear}`,
        `/getBDHoursGraphData/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}`,
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
  }, [selectedValue, selectedYear]);

  return (
    <Box className="cell p-3">
      <Row>
        <Typography className="col" variant="h6" component="h6">
          BD Hours
        </Typography>
      </Row>
      <Divider sx={{ mb: 1, borderColor: "black" }} />
      <LineBarChartForProductionLineWise ReportData={reduceState?.BDHours} />
    </Box>
  );
};

export default BDhours;
