import React, { useEffect, useReducer } from "react";

import { Container, Row, Col } from "reactstrap";
import LineBarChartForProductionLineWise from "./Charts/LineBarChartForProductionLineWise";
import { Box, Divider, Typography } from "@mui/material";

const MTBFComponent = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
}) => {
  const initialState = {
    MTBFReportData: {
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
    GET: "get-MTBF-report-data",
  };

  const reducer = (state, action) => {
    switch (action?.type) {
      case ACTION?.GET:
        return {
          ...state,
          isLoading: false,
          message: action?.message,
          MTBFReportData: action?.MTBFReportData,
        };

      default:
        return state;
    }
  };

  const [reduceState, reducerDispatch] = useReducer(reducer, initialState);

  const getMTBFReportData = async () => {
    try {
      const res = await fetch(
        // `/getMtbfData/${flagForTogglingFilter}/632c41261d1becfedab325f9/?selectedYear=${selectedYear}`,
        `/getMtbfData/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const { message, getMtbf } = await res.json();

      if (res?.status === 200) {
        reducerDispatch({
          type: ACTION.GET,
          message,
          MTBFReportData: getMtbf,
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (selectedValue) {
      getMTBFReportData();
    }
  }, [selectedValue, selectedYear]);

  return (
    <Box className="cell p-3">
      <Row>
        <Typography className="col" variant="h6" component="h6">
          MTBF
        </Typography>
      </Row>
      <Divider sx={{ mb: 1, borderColor: "black" }} />
      <LineBarChartForProductionLineWise
        MTBF={true}
        ReportData={reduceState?.MTBFReportData}
      />
    </Box>
  );
};

export default MTBFComponent;
