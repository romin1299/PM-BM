import React, { useEffect, useReducer } from "react";

import SmallChartCardComponent from "./SmallChartCardComponent";

import LineBarChartForProductionLineWise from "./Charts/LineBarChartForProductionLineWise";

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
  };

  useEffect(() => {
    if (selectedValue) getMTBFReportData();
  }, [selectedValue, selectedYear]);

  return (
    <SmallChartCardComponent title="MTBF">
      <LineBarChartForProductionLineWise
        MTBF={true}
        ReportData={reduceState?.MTBFReportData}
      />
    </SmallChartCardComponent>
  );
};

export default MTBFComponent;
