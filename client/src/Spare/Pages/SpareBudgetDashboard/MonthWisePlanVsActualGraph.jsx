import React, { useMemo } from "react";
import { Chart } from "react-chartjs-2";
import { Box } from "@mui/material";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { valueDataLabels } from "../../Utils/chartDataLabels";
import { chartColors } from "../../../BM/Utils/ChartUtils/chartEnums";
import ChartTitleBar, {
  ChartDownloadMenu,
} from "../../../BM/Reports/Common/ChartTitleBar";
import SpareStatusOkNGTab from "../../Component/SpareStatusOkNGTab";
import { currentFyMonthIndex } from "../../../Utils/fy";
import { handleDownloadBudgetCSVOrPDF } from "../SpareKPI/SubComponent/handleDownloadCSVOrPDF";

const options = {
  maintainAspectRatio: false,
  responsive: true,
  interaction: {
    mode: "index",
    intersect: false,
  },
  plugins: {
    legend: {
      align: "end",
      labels: {
        usePointStyle: true,
        // padding: 50,
      },
    },
    // Values shown on the chart: inside each bar, above each line.
    datalabels: valueDataLabels,
  },
  scales: {
    x: {
      stacked: true,
      grid: {
        display: false,
      },
      title: {
        display: true,
        text: "Month",
      },
      ticks: {
        color: "black",
      },
    },
    y: {
      grid: {
        display: false,
      },
      // Plan, actual and their cumulatives are all rupee figures.
      title: {
        display: true,
        text: "Budget (INR)",
      },
      ticks: {
        color: "black",
      },
    },
    // Cumulatives grow far larger than the monthly figures, so they ride a
    // secondary axis on the right to keep the monthly bars readable.
    y1: {
      position: "right",
      // Start at zero and keep headroom above the top line so the higher
      // cumulative (Cum Plan) and its value label stay inside the plot area
      // instead of being clipped against the chart's top edge.
      beginAtZero: true,
      grace: "12%",
      grid: {
        display: false,
      },
      title: {
        display: true,
        text: "Cumulative (INR)",
      },
      ticks: {
        color: "black",
      },
    },
  },
};

const labels = [
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
];

/** Blanks the months after the current one: a result cannot exist for them. */
const uptoCurrentMonth = (values, currentMonthIndex) =>
  values?.map((value, i) => (i > currentMonthIndex ? null : value));

const MonthWisePlanVsActualGraph = ({
  title = "Month-wise Plan vs Actual",
  requestedFor = "simple",
  budget,
  axiosConfig,
  referenceArrayForUseEffect,
  csvOrPDfFileNamePostPix = "",
  filters = [],
}) => {
  const data = useMemo(
    () => ({
      labels,
      datasets: [
        {
          type: "line",
          label: "Cum Plan",
          data: uptoCurrentMonth(budget?.cumulativePlan, currentFyMonthIndex()),
          borderColor: chartColors[0],
          backgroundColor: chartColors[0],
          pointStyle: "rectRot",
          yAxisID: "y1",
        },
        {
          type: "line",
          label: "Cum Actual",
          data: uptoCurrentMonth(budget?.cumulativeActual, currentFyMonthIndex()),
          borderColor: chartColors[10],
          backgroundColor: chartColors[10],
          pointStyle: "rectRot",
          yAxisID: "y1",
        },
        {
          type: "bar",
          stack: "bar-stacked",
          label: "Monthly Plan",
          data: budget?.plan,
          backgroundColor: chartColors.barChart,
          borderRadius: 4,
          pointStyle: "rect",
        },
        {
          type: "bar",
          label: "Monthly Actual",
          data: uptoCurrentMonth(budget?.actual, currentFyMonthIndex()),
          backgroundColor: chartColors.dailyBDTrendBorder[1],
          borderRadius: 4,
          pointStyle: "rect",
        },
      ],
    }),
    [budget],
  );

  return (
    <>
      <ChartTitleBar
        title={title}
        fontWeight={500}
        Toolbar={
          <>
            <SpareStatusOkNGTab
              requestedFor={requestedFor}
              axiosConfig={axiosConfig}
              referenceArrayForUseEffect={referenceArrayForUseEffect}
            />
            <div className="col-auto">
              <ChartDownloadMenu
                handleDownloadCSV={() => {
                  handleDownloadBudgetCSVOrPDF({
                    format: "csv",
                    fileName: title,
                    csvOrPDfFileNamePostPix,
                    filters,
                    budget,
                  });
                }}
                handleDownloadPDF={() => {
                  handleDownloadBudgetCSVOrPDF({
                    format: "pdf",
                    fileName: title,
                    csvOrPDfFileNamePostPix,
                    filters,
                    budget,
                  });
                }}
              />
            </div>
          </>
        }
      />

      <Box className="d-flex container-fluid p-1 ">
        <Box
          sx={{
            position: "relative",
            flex: "1 1 auto",
            minHeight: "200Px",
            width: "100%",
            height: { xs: "280px", sm: "380px", md: "400px" },
          }}
        >
          <Chart data={data} options={options} plugins={[ChartDataLabels]} />
        </Box>
      </Box>
    </>
  );
};

export default MonthWisePlanVsActualGraph;
