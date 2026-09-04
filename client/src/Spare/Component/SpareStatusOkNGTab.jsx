import React, { useState, useMemo } from "react";
import currentMonth from "../../pages/Dashboard/DashboardComponent/currentMonth";
import { MonthDropdown } from "../../BM/Reports/ManHourReport/SubComponents/LineSelectionDropdown";
import colorsBasedOnOkNGStatus from "../../Utils/colorsBasedOnOkNGStatus";
import useSafeGetRequest from "../../CustomHooks/useSafeGetRequest";

const SpareStatusOkNGTab = ({
  requestedFor = "simple",
  axiosConfig,
  referenceArrayForUseEffect,
}) => {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const configProps = useMemo(
    () => ({
      axiosConfig: {
        ...axiosConfig,
        params: {
          ...axiosConfig?.params,
          requestedFor,
          selectedMonth,
        },
      },
      referenceArrayForUseEffect: [
        ...referenceArrayForUseEffect,
        requestedFor,
        selectedMonth,
      ],
    }),
    [axiosConfig, referenceArrayForUseEffect, requestedFor, selectedMonth],
  );

  const [{ isLoading, data }] = useSafeGetRequest({
    url: "/v1/spare/monthlyStatus",
    ...configProps,
    initialState: {
      isLoading: true,
      isError: false,
      data: {
        status: [],
      },
    },
  });

  if (isLoading) return <h5>Loading...</h5>;

  return (
    <>
      <div className="col-auto">
        <MonthDropdown
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          selectProps={{
            sx: {
              width: 130,
              "& .MuiSelect-select": {
                p: "3px 10px",
              },
            },
          }}
        />
      </div>
      {data?.status?.map((item) => (
        <span
          className="border col-auto d-flex align-items-center justify-content-center m-1"
          style={{
            width: "5rem",
            height: "1.5rem",
            color: "white",
            background: colorsBasedOnOkNGStatus(item?.value),
          }}
        >
          {item?.label}
        </span>
      ))}
    </>
  );
};

export default SpareStatusOkNGTab;
