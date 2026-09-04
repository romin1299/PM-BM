import React, { useMemo } from "react";
import { ArcElement, Tooltip, Legend } from "chart.js";
import { generateColors } from "../../../../../BM/Utils/ChartUtils/chartEnums";

const Doughnut = ({ ChartComponent, counters }) => {
  const backgroundColor = useMemo(
    () => generateColors(4, "monthlyBDTrend"),
    [],
  );

  const dataset = useMemo(
    () => ({
      labels: counters?.labels,
      datasets: [
        {
          data: counters?.data1,
          backgroundColor,
          borderColor: "#fff",
          borderWidth: 1,
        },
      ],
    }),
    [counters, backgroundColor],
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
            return `${value} (${counters?.data2?.[context.dataIndex]})`;
          },
          font: { size: 12 },
        },
      },
    }),
    [counters],
  );

  return (
    <ChartComponent
      chartProps={{
        type: "doughnut",
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

export default Doughnut;
