import React, { useMemo } from "react";
import { BarElement } from "chart.js";
import { axisTitle } from "../../../SpareInventoryReport/SubComponent/ChartComponents/StackedBarChart";
import { valueDataLabels } from "../../../../Utils/chartDataLabels";
// import { ArcElement, Tooltip, Legend } from "chart.js";

/**
 * Single-series ranking chart: one bar per line, machine or part, labelled with
 * its quantity and cost.
 *
 * Horizontal by default because everything it ranks is named — "WAVE SOLDERING
 * (Spare)", "SEALER ENG-01" — and those names can only be read lying flat. Laid
 * vertically they are rotated under bars narrower than the text itself.
 */
const BarChart = ({
  ChartComponent,
  counters,
  indexAxis = "y",
  // What each axis measures — { x, y } — set per chart by the caller.
  axisTitles = {},
}) => {
  const isHorizontal = indexAxis === "y";

  const dataset = useMemo(
    () => ({
      labels: counters?.labels,
      datasets: [
        {
          data: counters?.data1,
          // Shown in brackets after the value, e.g. quantity (cost).
          secondaryValues: counters?.data2,
          backgroundColor: "#70AD47",
          borderColor: "#fff",
          borderWidth: 1,
          // Keeps a short list from turning into a few enormous slabs.
          maxBarThickness: 32,
        },
      ],
    }),
    [counters],
  );

  const options = useMemo(
    () => ({
      maintainAspectRatio: false,
      indexAxis,
      responsive: true,
      // The value sits past the tip of its bar, so the plot has to give up the
      // space it needs on whichever side the bars grow towards.
      layout: { padding: isHorizontal ? { right: 80 } : { top: 24 } },
      plugins: {
        legend: {
          display: false,
          position: "right",
        },
        title: {
          display: false,
        },
        // The same value labels as every other Spare chart: inside the bar,
        // or over it when the bar is too short to hold them.
        datalabels: valueDataLabels,
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          title: axisTitle(axisTitles.x),
        },
        y: {
          grid: {
            display: false,
          },
          title: axisTitle(axisTitles.y),
          // Every ranked row must keep its name. Chart.js drops labels to save
          // room, which on a ranking leaves bars with nothing to identify them.
          ...(isHorizontal ? { ticks: { autoSkip: false } } : {}),
        },
      },
    }),
    [indexAxis, isHorizontal, axisTitles.x, axisTitles.y],
  );

  return (
    <ChartComponent
      chartProps={{
        type: "bar",
        data: dataset,
        options,
      }}
      // Registered here rather than relying on whichever other chart happens to
      // have mounted first on the same page.
      registerProps={{
        BarElement,
      }}
      // registerProps={{
      //   ArcElement,
      //   Tooltip,
      //   Legend,
      // }}
    />
  );
};

export default BarChart;
