import React, { useMemo } from "react";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { BarElement } from "chart.js";

const StackedBarChart = ({ ChartComponent, chartData }) => {
  const options = useMemo(
    () => ({
      maintainAspectRatio: false,
      responsive: true,
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
        x: {
          stacked: true,
          grid: {
            display: false,
          },
          title: {
            display: false,
            text: "Months",
          },
          ticks: {
            color: "black",
          },
        },
        y: {
          stacked: true,
          grid: {
            display: false,
          },
          position: "left",
          title: {
            display: false,
            text: "BD Hours",
          },
          ticks: {
            color: "black",
          },
        },
        y1: {
          stacked: true,
          grid: {
            display: false,
          },
          position: "right",
          title: {
            display: false,
            text: "BD Hours",
          },
          ticks: {
            color: "black",
          },
        },
      },
    }),
    [],
  );

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
