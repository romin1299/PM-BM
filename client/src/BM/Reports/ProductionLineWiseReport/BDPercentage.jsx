import React, { useEffect, useReducer } from "react";
import LineBarChartForProductionLineWise from "./Charts/LineBarChartForProductionLineWise";
import SmallChartCardComponent from "./SmallChartCardComponent";



const BDPercentageChart = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
}) => {
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
        // `/getBdPercentage/${flagForTogglingFilter}/632c41261d1becfedab325f9/?selectedYear=${selectedYear}`,
        `/getBdPercentage/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}`,
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

      if (res?.status === 201) {
        reducerDispatch({
          type: ACTION.GET,
          message: response.message,
          BDPercentageReportData: response.data,
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
  }, [selectedValue, selectedYear]);

  return (
    <SmallChartCardComponent title="BD %">
      <LineBarChartForProductionLineWise
        ReportData={reduceState?.BDPercentageReportData}
        xAxisVerticleTicks
      />
    </SmallChartCardComponent>
  );
};

export default BDPercentageChart;
