import React, { useMemo } from "react";
import currentMonth from "../../pages/Dashboard/DashboardComponent/currentMonth";
import colorsBasedOnOkNGStatus from "../../Utils/colorsBasedOnOkNGStatus";
import useSafeGetRequest from "../../CustomHooks/useSafeGetRequest";

/**
 * The OK / NG badges for the running month.
 *
 * These used to carry their own month dropdown. They answer "how is this month
 * going", on charts that already plot every month, so the month is not a
 * choice at this spot: it is fixed to the current one.
 */
const SpareStatusOkNGTab = ({
  requestedFor = "simple",
  axiosConfig,
  referenceArrayForUseEffect,
}) => {
  const configProps = useMemo(
    () => ({
      axiosConfig: {
        ...axiosConfig,
        params: {
          ...axiosConfig?.params,
          requestedFor,
          selectedMonth: currentMonth,
        },
      },
      referenceArrayForUseEffect: [
        ...referenceArrayForUseEffect,
        requestedFor,
        currentMonth,
      ],
    }),
    [axiosConfig, referenceArrayForUseEffect, requestedFor],
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
    <div
      className="col-auto d-flex align-items-center"
      title={`Status for ${currentMonth}`}
    >
      <small className="text-muted me-1">{currentMonth}</small>
      {data?.status?.map((item) => (
        <span
          key={item?.label}
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
    </div>
  );
};

export default SpareStatusOkNGTab;
