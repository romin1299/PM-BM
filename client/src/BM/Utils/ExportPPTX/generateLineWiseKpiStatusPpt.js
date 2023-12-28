import { commonPptOptions } from "./exportPPTXOptions";
import axios from "axios";
import { MONTH_LABELS } from "../ChartUtils/chartEnums";

export async function generateLineWiseKpiStatusPpt(pptx, urlOptions) {
  await genSlide01(pptx, urlOptions);
}

function convertResData(pptx, data) {
  const comboData = [
    {
      type: pptx.charts.BAR,
      data: [
        {
          name: "BD Hours",
          labels: data?.labels,
          values: data?.data,
        },
      ],
      options: {
        chartColors: ["c2c933"], //green
        // "ca1f4b"  red
      },
    },
    {
      type: pptx.charts.LINE,
      data: [
        {
          name: "Target",
          labels: data?.labels,
          values: data?.target,
        },
      ],
      options: {
        chartColors: ["F38940"],
      },
    },
  ];

  return comboData;
}

async function genSlide01(pptx, urlOptions) {
  let slide = pptx.addSlide();

  let textWidth = 2.75;
  let xValue = 0.1;
  let gap = 0.2;

  let x = xValue;

  for (let i = 0; i < 4; i++) {
    slide.addText(
      [
        {
          text: `Line ${i}`,
          options: { fontSize: 10, breakLine: true },
        },
      ],
      {
        x,
        y: 0,
        w: 3.3375,
        h: 0.3,
      }
    );

    x = x + textWidth + gap;

    console.log(`Line ${i}`, "x", x + textWidth);
  }

  let options = {
    titleFontSize: 5,
    catAxisTitle: "Months",
    catAxisTitleFontSize: 5,
    valAxisTitle: "Hours",
    valAxisTitleFontSize: 5,
    legendFontSize: 7,
    catAxisLabelFontSize: 5,
    valAxisLabelFontSize: 5,
  };

  let resData01 = {
    labels: MONTH_LABELS,
    data: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120],
    target: [200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200],
  };
  //   let resData01 = await fetchBdHoursData(urlOptions);
  let chartData01 = convertResData(pptx, resData01);

  let chartOptions01 = {
    ...commonPptOptions,
    x: 0.1,
    y: 0.3,
    w: 2.75,
    h: 2,
    //
    ...options,
    title: "BD Hours",
  };

  slide.addChart(chartData01, chartOptions01);
}
