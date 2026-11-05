import React, { useMemo } from "react";
import { ArcElement, Tooltip, Legend } from "chart.js";
import { generateColors } from "../../../../../BM/Utils/ChartUtils/chartEnums";
import {
  pieDataLabels,
  PIE_LABEL_PADDING,
} from "../../../../Utils/chartDataLabels";

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
          // Shown in brackets after the value.
          secondaryValues: counters?.data2,
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
      // Room for the labels of slices too small to hold their own.
      layout: { padding: PIE_LABEL_PADDING },
      plugins: {
        legend: {
          display: true,
          position: "right",
        },
        title: {
          display: false,
        },
        datalabels: pieDataLabels(),
      },
    }),
    [],
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
