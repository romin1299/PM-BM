import React, { useMemo } from "react";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { BarElement } from "chart.js";
import { valueDataLabels } from "../../../../Utils/chartDataLabels";

/** A scale title only when the caller named the axis. */
export const axisTitle = (text) => ({ display: Boolean(text), text: text ?? "" });

const StackedBarChart = ({
  ChartComponent,
  chartData,
  indexAxis = "x",
  /**
   * What each axis measures — { x, y, y1 } — as shown beside the scale. Set
   * per chart by the caller, since the same component draws months against
   * budget, lines against quantity, and stock levels against cost.
   */
  axisTitles = {},
  /**
   * Chart-specific overrides, both optional so every existing caller is
   * unaffected: the value labels drawn on the chart, and the tooltip callbacks.
   * A dataset flagged `hideInLegend` is kept off the legend either way.
   */
  dataLabels = valueDataLabels,
  tooltip,
  /** Optional headroom for labels above a vertical chart's primary bars. */
  primaryAxisGrace,
}) => {
  // The right-hand axis only earns its place when a dataset is plotted on it;
  // drawn empty it showed a meaningless 0–1 scale down the side.
  const usesY1 = Boolean(
    chartData?.datasets?.some((dataset) => dataset?.yAxisID === "y1"),
  );

  const options = useMemo(() => {
    const isHorizontal = indexAxis === "y";

    // Built per axis rather than shared, so the three scales never end up
    // pointing at one another's grid and tick objects.
    const axis = (title) => ({
      stacked: true,
      grid: { display: false },
      ticks: { color: "black" },
      title: axisTitle(title),
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
            // A dataset can opt out of the legend (e.g. a helper series that
            // only carries a label) while still showing in the tooltip.
            filter: (item, data) =>
              !data.datasets?.[item.datasetIndex]?.hideInLegend,
          },
        },
        // Values shown on the chart: inside each bar, above each line. A caller
        // can pass its own for a chart that labels differently.
        datalabels: dataLabels,
        ...(tooltip ? { tooltip } : {}),
      },
      scales: {
        x: axis(axisTitles.x),
        y: {
          ...axis(axisTitles.y),
          position: "left",
          // Headroom above the data, so a line drawn at the top keeps its value
          // label inside the plot instead of over the legend. beginAtZero pins
          // the floor at 0: Chart.js otherwise splits grace between both ends
          // ((max-min)/2 each), which would waste half of it below zero.
          ...(primaryAxisGrace
            ? { beginAtZero: true, grace: primaryAxisGrace }
            : {}),
          // Ranked rows are named, and chart.js would otherwise drop some of
          // those names to save space.
          ...(isHorizontal
            ? { ticks: { color: "black", autoSkip: false } }
            : {}),
        },
        // The right-hand value axis belongs to the vertical charts that assign
        // datasets to it. Laid horizontally it would only add a second, unasked
        // for category axis down the other side.
        ...(isHorizontal
          ? {}
          : {
              y1: {
                ...axis(axisTitles.y1),
                position: "right",
                display: usesY1,
                // A second value axis is not stacked with the first.
                stacked: false,
                // Headroom so the highest line on this axis and its value
                // label stay inside the plot area instead of clipping against
                // the top edge. grace pads the range without forcing a zero
                // baseline, so percentage/ratio axes keep their natural span.
                grace: "12%",
              },
            }),
      },
    };
  }, [
    indexAxis,
    axisTitles.x,
    axisTitles.y,
    axisTitles.y1,
    usesY1,
    dataLabels,
    tooltip,
    primaryAxisGrace,
  ]);

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
