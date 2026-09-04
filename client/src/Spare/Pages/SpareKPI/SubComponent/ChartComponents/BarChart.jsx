import React, { useMemo } from "react";
// import { ArcElement, Tooltip, Legend } from "chart.js";

const BarChart = ({ ChartComponent, counters, indexAxis = "y" }) => {
  const dataset = useMemo(
    () => ({
      labels: counters?.labels,
      datasets: [
        {
          data: counters?.data1,
          backgroundColor: "#70AD47",
          borderColor: "#fff",
          borderWidth: 1,
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
      plugins: {
        legend: {
          display: false,
          position: "right",
        },
        title: {
          display: false,
        },
        datalabels: {
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
        },
      },
    }),
    [counters, indexAxis],
  );

  return (
    <ChartComponent
      chartProps={{
        type: "bar",
        data: dataset,
        options,
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
