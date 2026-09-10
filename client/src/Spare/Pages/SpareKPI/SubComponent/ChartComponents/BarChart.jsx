import React, { useMemo } from "react";
import { BarElement } from "chart.js";
// import { ArcElement, Tooltip, Legend } from "chart.js";

/**
 * Single-series ranking chart: one bar per line, machine or part, labelled with
 * its quantity and cost.
 *
 * Horizontal by default because everything it ranks is named — "WAVE SOLDERING
 * (Spare)", "SEALER ENG-01" — and those names can only be read lying flat. Laid
 * vertically they are rotated under bars narrower than the text itself.
 */
const BarChart = ({ ChartComponent, counters, indexAxis = "y" }) => {
  const isHorizontal = indexAxis === "y";

  const dataset = useMemo(
    () => ({
      labels: counters?.labels,
      datasets: [
        {
          data: counters?.data1,
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
        datalabels: {
          anchor: "end",
          align: "end",
          clamp: true,
          // An empty bar has nothing to report, and its label would only crowd
          // the one beside it.
          display: (context) => context.dataset?.data?.[context.dataIndex] > 0,
          formatter: (value, context) => {
            return `${value} (${counters?.data2?.[context.dataIndex]})`;
          },
          font: { size: 12 },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
        },
        y: {
          grid: {
            display: false,
          },
          // Every ranked row must keep its name. Chart.js drops labels to save
          // room, which on a ranking leaves bars with nothing to identify them.
          ...(isHorizontal ? { ticks: { autoSkip: false } } : {}),
        },
      },
    }),
    [counters, indexAxis, isHorizontal],
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
