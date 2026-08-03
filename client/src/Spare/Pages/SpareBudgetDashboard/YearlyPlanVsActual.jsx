import React from "react";
import { Box } from "@mui/material";
import { Bar } from "react-chartjs-2";
import { chartColors } from "../../../BM/Utils/ChartUtils/chartEnums";
import useSafeGetRequest from "../../../CustomHooks/useSafeGetRequest";
import ChartTitleBar from "../../../BM/Reports/Common/ChartTitleBar";
import SpareStatusOkNGTab from "../../Component/SpareStatusOkNGTab";

const options = {
  maintainAspectRatio: false,
  responsive: true,
  interaction: {
    mode: "index",
    intersect: false,
  },
  plugins: {
    legend: {
      display: false,
    },
    datalabels: {
      font: { weight: "bold", size: 12 },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: "black",
      },
    },
    y: {
      grid: {
        display: false,
      },
      ticks: {
        color: "black",
      },
    },
  },
};

const YearlyPlanVsActual = ({
  axiosConfig = {},
  referenceArrayForUseEffect = [],
}) => {
  const [{ isLoading, data }] = useSafeGetRequest({
    url: "/v1/spare/FYplanVsActualBudget",
    axiosConfig,
    referenceArrayForUseEffect,
    initialState: {
      isLoading: true,
      isError: false,
      data: {
        plantVsActual: [],
      },
    },
  });

  return (
    <>
      <ChartTitleBar
        title="Yearly"
        fontWeight={500}
        Toolbar={
          <SpareStatusOkNGTab
            requestedFor="cumulative"
            axiosConfig={axiosConfig}
            referenceArrayForUseEffect={referenceArrayForUseEffect}
          />
        }
      />

      <Box className="d-flex container-fluid p-1 h-100">
        <Box
          sx={{
            position: "relative",
            flex: "1 1 auto",
            minHeight: 0,
            width: "100%",
          }}
        >
          {isLoading ? (
            <h4>Loading...</h4>
          ) : (
            <Bar
              options={options}
              data={{
                labels: ["Plan", "Actual"],
                datasets: [
                  {
                    label: ["Plan", "Actual"],
                    data: data?.plantVsActual,
                    backgroundColor: chartColors.barChart,
                    borderRadius: 4,
                  },
                ],
              }}
            />
          )}
        </Box>
      </Box>
    </>
  );
};

export default YearlyPlanVsActual;
