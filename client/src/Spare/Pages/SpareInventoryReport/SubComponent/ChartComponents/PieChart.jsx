import React, { useMemo } from "react";
import { ArcElement, Tooltip, Legend } from "chart.js";

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

const FONT_COLORS = [
  "#000",
  "#fff",
  "#000",
  "#000",
  "#000",
  "#000",
  "#fff",
  "#fff",
  "#fff",
  "#000",
  "#fff",
];

const PieChart = ({ ChartComponent, counters }) => {
  const dataset = useMemo(
    () => ({
      labels: counters?.labels,
      datasets: [
        {
          data: counters?.data1,
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
      plugins: {
        legend: {
          display: true,
          position: "right",
        },
        title: {
          display: false,
        },
        datalabels: {
          formatter: (value, context) => {
            return `${value} %`;
          },
          color: FONT_COLORS,
          font: { size: 12 },
        },
      },
    }),
    [],
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
