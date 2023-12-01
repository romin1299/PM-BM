import React, { useEffect, useReducer } from "react";

import { Container, Row, Col } from "reactstrap";
import LineBarChartForProductionLineWise from "./Charts/LineBarChartForProductionLineWise";
import { Box, Divider, Typography } from "@mui/material";

const BDPercentageChart = ({ flagForCellAndLineToggle, selectedValue }) => {
  const initialState = {
    BDPercentageReportData: {
      labels: [],
      data: [],
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
          BDPercentageReportData: action?.BDPercentageReportData,
        };

      default:
        return state;
    }
  };

  const [reduceState, reducerDispatch] = useReducer(reducer, initialState);

  const getBDPercentageReportData = async () => {
    try {
      const res = await fetch(
        `/getBdPercentage/${flagForCellAndLineToggle}/632c41261d1becfedab325f9`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const { message, getBdPercentage } = await res.json();

      if (res?.status === 200) {
        reducerDispatch({
          type: ACTION.GET,
          message,
          BDPercentageReportData: getBdPercentage,
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (selectedValue) {
      getBDPercentageReportData();
    }
  }, [selectedValue]);

  return (
    <Box className="cell p-3">
      <Row>
        <Typography className="col" variant="h6" component="h6">
          BD %
        </Typography>
      </Row>
      <Divider sx={{ mb: 1, borderColor: "black" }} />
      <LineBarChartForProductionLineWise
        ReportData={reduceState?.BDPercentageReportData}
      />
    </Box>
  );
};

export default BDPercentageChart;
