import React, { useMemo, useReducer } from "react";
import { Box } from "@mui/material";
import ChartsToolbar from "../../../../BM/Reports/ManHourReport/SubComponents/ChartsToolbar";
import {
  initialState,
  reducer,
} from "../../../../BM/Reports/ManHourReport/SubComponents/CommonFiltrationComponent";
import useSafeGetRequest from "../../../../CustomHooks/useSafeGetRequest";
import MonthWisePlanVsActualGraph from "../../SpareBudgetDashboard/MonthWisePlanVsActualGraph";
import { findOtherFilters } from "./handleDownloadCSVOrPDF";

const SectionWiseBudget = ({ selectedYear }) => {
  const [reduceState, reducerDispatch] = useReducer(reducer, initialState());

  const dropdownProps = useMemo(() => {
    if (reduceState?.selectedValue)
      return {
        axiosConfig: {
          params: {
            flagForTogglingFilter: reduceState?.flagForTogglingFilter,
            selectedValue: reduceState?.selectedValue,
            selectedYear,
          },
        },
        referenceArrayForUseEffect: [reduceState?.selectedValue, selectedYear],
      };
    return {
      axiosConfig: {},
      referenceArrayForUseEffect: [],
    };
  }, [reduceState, selectedYear]);

  const [{ isLoading, data }] = useSafeGetRequest({
    url: "/v1/spare/budget",
    axiosConfig: dropdownProps?.axiosConfig,
    referenceArrayForUseEffect: dropdownProps?.referenceArrayForUseEffect,
    initialState: {
      isLoading: true,
      isError: false,
      data: {
        budget: {},
      },
    },
  });

  const filters = useMemo(() => {
    const otherFilters = findOtherFilters({
      reduceState,
      flagForTogglingFilter: reduceState?.flagForTogglingFilter,
      selectedValue: reduceState?.selectedValue,
    });

    return [selectedYear, ...otherFilters];
  }, [selectedYear, reduceState]);

  return (
    <Box className="cell p-3 mb-3">
      <ChartsToolbar
        baseUrlForFiltering="/getFiltrationValue/plant-level-filtration"
        queryParams={{ moduleType: "Spare" }}
        reduceState={reduceState}
        reducerDispatch={reducerDispatch}
        sectionFiltration
        subSectionFiltration
        cellFiltration
      />

      {isLoading ? (
        <h5>Loading....</h5>
      ) : (
        (reduceState?.selectedSection ||
          reduceState?.selectedSubSection ||
          reduceState?.selectedCell) && (
          <MonthWisePlanVsActualGraph
            budget={data?.budget}
            {...dropdownProps}
            requestedFor="both"
            csvOrPDfFileNamePostPix={selectedYear}
            filters={filters}
          />
        )
      )}
    </Box>
  );
};

export default SectionWiseBudget;
