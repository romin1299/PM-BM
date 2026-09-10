import React, { useMemo } from "react";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { BarElement } from "chart.js";

const StackedBarChart = ({ ChartComponent, chartData, indexAxis = "x" }) => {
  const options = useMemo(() => {
    const isHorizontal = indexAxis === "y";

    // Built per axis rather than shared, so the three scales never end up
    // pointing at one another's grid and tick objects.
    const axis = () => ({
      stacked: true,
      grid: { display: false },
      ticks: { color: "black" },
    });

    return {
      maintainAspectRatio: false,
      responsive: true,
      indexAxis,
      interaction: {
        mode: "index",
        intersect: false,
      },
      maxBarThickness: 100,
      plugins: {
        legend: {
          align: "end",
          labels: {
            usePointStyle: true,
          },
        },
        datalabels: false,
      },
      scales: {
        x: axis(),
        y: {
          ...axis(),
          position: "left",
          // Ranked rows are named, and chart.js would otherwise drop some of
          // those names to save space.
          ...(isHorizontal
            ? { ticks: { color: "black", autoSkip: false } }
            : {}),
        },
        // The right-hand value axis belongs to the vertical charts that assign
        // datasets to it. Laid horizontally it would only add a second, unasked
        // for category axis down the other side.
        ...(isHorizontal ? {} : { y1: { ...axis(), position: "right" } }),
      },
    };
  }, [indexAxis]);

  return (
    <ChartComponent
      chartProps={{
        type: "bar",
        data: chartData,
        options,
        plugins: [ChartDataLabels],
      }}
      registerProps={{
        BarElement,
      }}
    />
  );
};

export default StackedBarChart;
