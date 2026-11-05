import React from "react";
import { Box } from "@mui/material";
import { Bar } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { valueDataLabels } from "../../Utils/chartDataLabels";
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
    datalabels: valueDataLabels,
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      title: { display: true, text: "Financial year" },
      ticks: {
        color: "black",
      },
    },
    y: {
      grid: {
        display: false,
      },
      title: { display: true, text: "Budget (INR)" },
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
        planVsActual: [],
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
              plugins={[ChartDataLabels]}
              options={options}
              data={{
                labels: ["Plan", "Actual"],
                datasets: [
                  {
                    label: ["Plan", "Actual"],
                    data: data?.planVsActual,
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
