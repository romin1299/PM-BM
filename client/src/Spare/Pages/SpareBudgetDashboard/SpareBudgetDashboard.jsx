import React, { useState, useMemo, useReducer, memo } from "react";

import ChartsToolbar from "../../../BM/Reports/ManHourReport/SubComponents/ChartsToolbar";
import {
  initialState,
  reducer,
} from "../../../BM/Reports/ManHourReport/SubComponents/CommonFiltrationComponent";

import useSafeGetRequest from "../../../CustomHooks/useSafeGetRequest";
import YearlyPlanVsActual from "./YearlyPlanVsActual";
import MonthWisePlanVsActualGraph from "./MonthWisePlanVsActualGraph";
import BudgetConfigurationTable from "./BudgetConfigurationTable";
import { useCallback } from "react";

const url = "/v1/spare/budget";

// const SectionWiseBudgetRightComponent = () => {
//   return (
//     <div className="col-2 d-flex align-items-center justify-content-center m-5">
//       Right
//     </div>
//   );
// };

const BudgetGraphAndTableComponent = ({
  axiosConfig = {},
  referenceArrayForUseEffect = [],
  handleUpdateState = null,
}) => {
  const [{ isLoading, data }] = useSafeGetRequest({
    url,
    axiosConfig,
    referenceArrayForUseEffect,
    initialState: {
      isLoading: true,
      isError: false,
      data: {
        budget: {},
      },
    },
  });

  const params = useMemo(() => {
    let returnObj = {};

    if (Object.values(data?.budget)?.length > 0)
      returnObj = {
        _id: data?.budget?._id,
      };

    if (axiosConfig?.params)
      returnObj = {
        ...returnObj,
        ...axiosConfig?.params,
      };

    return returnObj;
  }, [data?.budget, axiosConfig]);

  if (isLoading) return <h4>Loading...</h4>;

  return (
    <div className="d-flex flex-column h-100">
      <div style={{ flex: "0 0 auto" }} className="cell p-2">
        <MonthWisePlanVsActualGraph
          budget={data?.budget}
          axiosConfig={axiosConfig}
          referenceArrayForUseEffect={referenceArrayForUseEffect}
        />
      </div>
      <div style={{ flex: "1 1 auto" }} className="cell p-2">
        <BudgetConfigurationTable
          budget={data?.budget}
          params={params}
          handleUpdateState={handleUpdateState}
        />
      </div>
    </div>
  );
};

const BudgetWithDefaultDataWrapper = memo(
  ({
    axiosConfig = {},
    referenceArrayForUseEffect = [],
    // RightCompo = null,
    handleUpdateState = null,
  }) => {
    return (
      <div className="d-flex gap-1 align-items-stretch">
        <div className="d-flex h-90 flex-column cell p-2">
          <YearlyPlanVsActual
            axiosConfig={axiosConfig}
            referenceArrayForUseEffect={referenceArrayForUseEffect}
          />
        </div>

        <BudgetGraphAndTableComponent
          axiosConfig={axiosConfig}
          referenceArrayForUseEffect={referenceArrayForUseEffect}
          handleUpdateState={handleUpdateState}
        />

        {/* {RightCompo && (
          <div className="d-flex flex-column h-100">
            <RightCompo />
          </div>
        )} */}
      </div>
    );
  },
);

const SectionWiseBudget = ({ handleRecallAPI, handleUpdateState = null }) => {
  const [reduceState, reducerDispatch] = useReducer(reducer, initialState());

  const dropdownProps = useMemo(() => {
    if (reduceState?.selectedValue)
      return {
        axiosConfig: {
          params: {
            flagForTogglingFilter: reduceState?.flagForTogglingFilter,
            selectedValue: reduceState?.selectedValue,
          },
        },
        referenceArrayForUseEffect: [
          reduceState?.selectedValue,
          handleRecallAPI,
        ],
      };
    return {
      axiosConfig: {},
      referenceArrayForUseEffect: [],
    };
  }, [reduceState, handleRecallAPI]);

  return (
    <div>
      <div className="cell p-2 pt-0 pb-0">
        <ChartsToolbar
          baseUrlForFiltering="/getFiltrationValue/plant-level-filtration"
          queryParams={{ moduleType: "Spare" }}
          reduceState={reduceState}
          reducerDispatch={reducerDispatch}
          sectionFiltration
          subSectionFiltration
          cellFiltration
        />
      </div>

      {(reduceState?.selectedSection ||
        reduceState?.selectedSubSection ||
        reduceState?.selectedCell) && (
        <BudgetWithDefaultDataWrapper
          {...dropdownProps}
          handleUpdateState={handleUpdateState}
          // RightCompo={SectionWiseBudgetRightComponent}
        />
      )}
    </div>
  );
};

const SpareBudgetDashboard = () => {
  const [handleRecallAPI, setHandleRecallAPI] = useState(0);

  const handleUpdateState = useCallback(
    () => setHandleRecallAPI((prev) => prev + 1),
    [setHandleRecallAPI],
  );

  return (
    <div className="d-flex flex-column gap-1">
      <div className=" m-2">
        <BudgetWithDefaultDataWrapper
          referenceArrayForUseEffect={[handleRecallAPI]}
          handleUpdateState={handleUpdateState}
        />
      </div>
      <div className="m-2 mt-0">
        <SectionWiseBudget
          handleRecallAPI={handleRecallAPI}
          handleUpdateState={handleUpdateState}
        />
      </div>
    </div>
  );
};

export default SpareBudgetDashboard;
