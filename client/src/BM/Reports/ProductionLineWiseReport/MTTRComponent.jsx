import React, { useEffect, useReducer } from "react";
import SmallChartCardComponent from "./SmallChartCardComponent";

import LineBarChartForProductionLineWise from "./Charts/LineBarChartForProductionLineWise";

const MTTRComponent = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
}) => {
  const initialState = {
    MTTRReportData: {
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
          MTTRReportData: action?.MTTRReportData,
        };

      default:
        return state;
    }
  };

  const [reduceState, reducerDispatch] = useReducer(reducer, initialState);

  const getMTTRReportData = async () => {
    try {
      const res = await fetch(
        // `/getMTTRGraphData/${flagForTogglingFilter}/632c41261d1becfedab325f9/?selectedYear=${selectedYear}`,
        `/getMTTRGraphData/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}`,
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
    if (selectedValue) {
      getMTTRReportData();
    }
  }, [selectedValue, selectedYear]);

  return (
    <SmallChartCardComponent title="MTTR">
      <LineBarChartForProductionLineWise
        ReportData={reduceState?.MTTRReportData}
      />
    </SmallChartCardComponent>
  );
};

export default MTTRComponent;
