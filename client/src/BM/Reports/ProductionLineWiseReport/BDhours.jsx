import React, { useEffect, useReducer } from "react";
import LineBarChartForProductionLineWise from "./Charts/LineBarChartForProductionLineWise";

import SmallChartCardComponent from "./SmallChartCardComponent";
import Loading from "../../../components/Loading/Loading";
import DataNotFound from "../Common/DataNotFound";
import { Box } from "@mui/material";

const BDhours = ({ selectedValue, flagForTogglingFilter, selectedYear }) => {
  const [loading, setLoading] = React.useState(true);
  const initialState = {
    BDHours: {
      labels: [],
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
    setLoading(true);

    try {
      const res = await fetch(
        // `/getBDHoursGraphData/${flagForTogglingFilter}/632c41261d1becfedab325f9/?selectedYear=${selectedYear}`,
        `/getBDHoursGraphData/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}&&targetKey=monthlyBDHrsTarget`,
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

    setLoading(false);
  };

  useEffect(() => {
    if (selectedValue) {
      getBDHours();
    }
  }, [selectedValue, selectedYear]);

  let isDataExists = reduceState?.BDHours?.data?.length > 0 || false;

  return (
    <SmallChartCardComponent title="BD Hours">
      <Box sx={{ height: { xs: "200px" } }}>
        {loading ? (
          <Loading />
        ) : !isDataExists ? (
          <DataNotFound />
        ) : (
          <LineBarChartForProductionLineWise
            ReportData={reduceState?.BDHours}
          />
        )}
      </Box>
    </SmallChartCardComponent>
  );
};

export default BDhours;
