import React, { useMemo } from "react";
import { ArcElement, Tooltip, Legend } from "chart.js";
import {
  pieDataLabels,
  PIE_LABEL_PADDING,
} from "../../../../Utils/chartDataLabels";

const PIE_COLORS = [
  "#70AD47",
  "#4472C4",
  "#ED7D31",
  "#FFC000",
  "#5B9BD5",
  "#A5A5A5",
  "#264478",
  "#9E480E",
  "#636363",
  "#997300",
  "#255E91",
];

const PieChart = ({
  ChartComponent,
  counters,
  // Most pies keep the established right-side legend. Dense category charts
  // can opt into the compact bottom layout to preserve the pie's diameter.
  legendPosition = "right",
  compactLegend = false,
  showDataLabels = true,
  tooltipValueSuffix = "",
}) => {
  const dataset = useMemo(
    () => ({
      labels: counters?.labels,
      datasets: [
        {
          data: counters?.data1,
          // Shown in brackets after the share, e.g. 45.39% (1482).
          secondaryValues: counters?.data2,
          backgroundColor: PIE_COLORS,
          borderColor: "#fff",
          borderWidth: 1,
        },
      ],
    }),
    [counters],
  );

  const options = useMemo(
    () => ({
      responsive: true,
      // Room for the labels of slices too small to hold their own.
      layout: { padding: PIE_LABEL_PADDING },
      plugins: {
        legend: {
          display: true,
          position: legendPosition,
          labels: compactLegend
            ? {
                boxWidth: 10,
                boxHeight: 10,
                padding: 8,
                font: { size: 10 },
              }
            : undefined,
        },
        title: {
          display: false,
        },
        ...(tooltipValueSuffix
          ? {
              tooltip: {
                callbacks: {
                  label: (context) =>
                    `${context.label}: ${context.formattedValue}${tooltipValueSuffix}`,
                },
              },
            }
          : {}),
        datalabels: showDataLabels
          ? pieDataLabels({ percentage: true })
          : { display: false },
      },
    }),
    [compactLegend, legendPosition, showDataLabels, tooltipValueSuffix],
  );

  return (
    <ChartComponent
      chartProps={{
        type: "pie",
        data: dataset,
        options,
      }}
      registerProps={{
        ArcElement,
        Tooltip,
        Legend,
      }}
    />
  );
};

export default PieChart;
