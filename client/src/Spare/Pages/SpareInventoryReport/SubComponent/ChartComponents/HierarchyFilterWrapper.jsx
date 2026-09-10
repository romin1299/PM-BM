import React, { useMemo, useReducer } from "react";
import ChartWrapper from "../../../SpareKPI/SubComponent/ChartComponents/ChartWrapper";
import ChartsToolbar from "../../../../../BM/Reports/ManHourReport/SubComponents/ChartsToolbar";
import {
  reducer,
  initialState,
} from "../../../../../BM/Reports/ManHourReport/SubComponents/CommonFiltrationComponent";
import { findOtherFilters } from "../../../SpareKPI/SubComponent/handleDownloadCSVOrPDF";

const HierarchyFilterWrapper = ({
  otherToolbarCompProps = {},
  filters = [],
  ExtraToolbar = null,
  ...props
}) => {
  const [reduceState, reducerDispatch] = useReducer(reducer, initialState());

  const updatedFilters = useMemo(() => {
    const otherFilters = findOtherFilters({
      reduceState,
      flagForTogglingFilter: reduceState?.flagForTogglingFilter,
      selectedValue: reduceState?.selectedValue,
    });

    return [...filters, ...otherFilters];
  }, [reduceState, filters]);

  return (
    <ChartWrapper
      {...props}
      filters={updatedFilters}
      otherParams={{
        flagForTogglingFilter: reduceState?.flagForTogglingFilter,
        selectedValue: reduceState?.selectedValue,
      }}
      otherEffectReference={[reduceState?.selectedValue]}
      OtherToolbar={
        <>
          {ExtraToolbar}
          <ChartsToolbar
            baseUrlForFiltering="/getFiltrationValue/plant-level-filtration"
            reduceState={reduceState}
            reducerDispatch={reducerDispatch}
            {...otherToolbarCompProps}
          />
        </>
      }
    />
  );
};

export default HierarchyFilterWrapper;
