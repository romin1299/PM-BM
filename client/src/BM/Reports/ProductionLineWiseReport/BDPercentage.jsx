import React, { useEffect, useReducer } from "react";
import LineBarChartForProductionLineWise from "./Charts/LineBarChartForProductionLineWise";
import SmallChartCardComponent from "./SmallChartCardComponent";
import Loading from "../../../components/Loading/Loading";
import { Box } from "@mui/material";
import DataNotFound from "../Common/DataNotFound";

const BDPercentageChart = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
}) => {
  const [loading, setLoading] = React.useState(true);

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
    setLoading(true);

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

    setLoading(false);
  };

  useEffect(() => {
    if (selectedValue) {
      getBDPercentageReportData();
    }
  }, [selectedValue, selectedYear]);

  let isDataExists =
    reduceState?.BDPercentageReportData?.data?.length > 0 || false;

  return (
    <SmallChartCardComponent title="BD %">
      <Box sx={{ height: { xs: "200px" } }}>
        {loading ? (
          <Loading height={200} />
        ) : !isDataExists ? (
          <DataNotFound />
        ) : (
          <LineBarChartForProductionLineWise
            ReportData={reduceState?.BDPercentageReportData}
            xAxisVerticleTicks
          />
        )}
      </Box>
    </SmallChartCardComponent>
  );
};

export default BDPercentageChart;
