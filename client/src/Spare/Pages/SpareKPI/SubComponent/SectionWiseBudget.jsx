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

/**
 * The levels the budget can be narrowed to.
 *
 * The toolbar reports "nothing chosen" as the plant itself — flag
 * "based-on-plant" with the plant's id as the value — which is the overall
 * view, not a filter. Treating it as one sent the plant's id where a cell id
 * was expected and returned no budget at all.
 */
const BUDGET_FILTER_LEVELS = new Set([
  "based-on-section",
  "based-on-subSection",
  "based-on-cell",
]);

const SectionWiseBudget = ({ selectedYear }) => {
  const [reduceState, reducerDispatch] = useReducer(reducer, initialState());

  const flag = reduceState?.flagForTogglingFilter;
  const selectedValue = reduceState?.selectedValue;

  const isFiltered = BUDGET_FILTER_LEVELS.has(flag) && Boolean(selectedValue);

  /**
   * One identity for "which budget is on screen": the whole plant, or one
   * hierarchy selection. Only a real filter change (or a year change) reloads
   * the chart — the toolbar resolving its plant-level default must not.
   */
  const filterKey = isFiltered ? `${flag}:${selectedValue}` : "overall";

  const request = useMemo(
    () => ({
      axiosConfig: {
        params: {
          selectedYear,
          // No hierarchy parameter at all is the plant-wide sum; a plant id
          // here would be read as a cell id by the budget filter.
          ...(isFiltered
            ? { flagForTogglingFilter: flag, selectedValue }
            : {}),
        },
      },
      referenceArrayForUseEffect: [filterKey, selectedYear],
    }),
    [filterKey, flag, selectedValue, isFiltered, selectedYear],
  );

  const [{ isLoading, data }] = useSafeGetRequest({
    url: "/v1/spare/budget",
    axiosConfig: request.axiosConfig,
    referenceArrayForUseEffect: request.referenceArrayForUseEffect,
    initialState: {
      isLoading: true,
      isError: false,
      data: {
        budget: {},
      },
    },
  });

  const filters = useMemo(() => {
    if (!isFiltered) return [selectedYear, "Overall"];

    const otherFilters = findOtherFilters({
      reduceState,
      flagForTogglingFilter: flag,
      selectedValue,
    });

    return [selectedYear, ...otherFilters];
  }, [selectedYear, reduceState, flag, selectedValue, isFiltered]);

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
        // Back to the plant-wide view, which is the page's default.
        resetButtonFiltration
      />

      {isLoading ? (
        <h5>Loading....</h5>
      ) : (
        <MonthWisePlanVsActualGraph
          title={
            isFiltered
              ? "Month-wise Plan vs Actual"
              : "Plant-wise Plan vs Actual"
          }
          budget={data?.budget}
          axiosConfig={request.axiosConfig}
          referenceArrayForUseEffect={request.referenceArrayForUseEffect}
          requestedFor="both"
          csvOrPDfFileNamePostPix={selectedYear}
          filters={filters}
        />
      )}
    </Box>
  );
};

export default SectionWiseBudget;
