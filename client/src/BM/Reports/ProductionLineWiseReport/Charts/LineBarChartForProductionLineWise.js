import React from "react";
import { Chart } from "react-chartjs-2";
import { barDatalabels } from "../../../Utils/ChartUtils/chartOptions";
import ChartDataLabels from "chartjs-plugin-datalabels";

const LineBarChartForProductionLineWise = ({
  ReportData,
  xAxisVerticleTicks,
}) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        align: "end",
        labels: {
          usePointStyle: true,
        },
      },
      title: {
        display: false,
        text: "",
      },
      datalabels: barDatalabels,
    },
    interaction: {
      mode: "index",
      intersect: false,
    },
    scales: {
      x: {
        stacked: true,
        ticks: {
          maxRotation: 90,
          minRotation: 90,
        },
        // grid: {
        //   display: false, // Hide vertical grid lines
        // },
      },
      y: {
        stacked: true,
      },
    },

    // scales: {
    //   x: {
    //     ticks: xAxisVerticleTicks
    //       ? {
    //           maxRotation: 90,
    //           minRotation: 90,
    //         }
    //       : {},
    //   },
    // },
  };

  // console.log("ReportData:", ReportData);

  const data = {
    labels: ReportData?.labels,
    datasets: [
      {
        type: "line",
        label: "Target",
        borderColor: "rgb(75, 192, 192)",
        borderWidth: 2,
        fill: false,
        data: ReportData?.target,
      },
      {
        type: "bar",
        label: "Hours",
        backgroundColor: ReportData?.backgroundColor,
        data: ReportData?.data,
        borderColor: "white",
        borderWidth: 2,
        stack: "s-1",
      },
    ],
  };
  return (
    <Chart
      type="bar"
      data={data}
      options={options}
      plugins={[ChartDataLabels]}
    />
  );
};

export default LineBarChartForProductionLineWise;
