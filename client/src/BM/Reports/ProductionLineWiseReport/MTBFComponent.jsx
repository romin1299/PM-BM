import React, { useEffect, useReducer } from "react";

import SmallChartCardComponent from "./SmallChartCardComponent";

import LineBarChartForProductionLineWise from "./Charts/LineBarChartForProductionLineWise";
import Loading from "../../../components/Loading/Loading";
import { Box } from "@mui/material";
import DataNotFound from "../Common/DataNotFound";

const MTBFComponent = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
}) => {
  const [loading, setLoading] = React.useState(true);

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
    setLoading(true);

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

      const response = await res.json();
      // console.log("response:", response);

      if (res?.status === 201) {
        reducerDispatch({
          type: ACTION.GET,
          message: response.message,
          MTBFReportData: response.data,
        });
      }
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (selectedValue) getMTBFReportData();
  }, [selectedValue, selectedYear]);


  
  let isDataExists = reduceState?.MTBFReportData?.data?.length > 0 || false;

  return (
    <SmallChartCardComponent title="MTBF">
      <Box sx={{ height: { xs: "200px" } }}>
        {loading ? (
          <Loading height={200} />
        ) : !isDataExists ? (
          <DataNotFound />
        )  : (
          <LineBarChartForProductionLineWise
            MTBF={true}
            ReportData={reduceState?.MTBFReportData}
          />
        )}
      </Box>
    </SmallChartCardComponent>
  );
};

export default MTBFComponent;
