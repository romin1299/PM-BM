import { commonPptOptions } from "./exportPPTXOptions";
import axios from "axios";
import { MONTH_LABELS } from "../ChartUtils/chartEnums";
import {
  getRandomColorsArray,
  getRandomDataArray,
} from "../math/generateRandomValues";

export async function generateLineWiseKpiStatusPpt(pptx, urlOptions) {
  // const resData = await fetchData(pptx, urlOptions);
  const resData = await getLineWiseKpiStatusData(urlOptions);

  await genChartMatrix(pptx, resData);
}

const getLineWiseKpiStatusData = async (urlOptions) => {
  // console.log('urlOptions:', urlOptions)
  try {
    const res = await fetch(
      `/getLineWiseKpiStatusData/${urlOptions?.selectedCell}?selectedYear=${urlOptions?.selectedYear}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    const kpiRes = await res.json();
    // console.log("kpiRes:", kpiRes);
    const { message, lineWisePptExportationData } = kpiRes;

    if (res?.status === 201) {
      return lineWisePptExportationData;
    }
  } catch (error) {
    console.log(error);
  }
};

// implement data fetching logic here
function fetchData() {
  let prevDataType = [
    {
      lineName: "line1",
      target: getRandomDataArray(12, 100, 120),
      bdHours: getRandomDataArray(12, 0, 150),
      bdPercentage: getRandomDataArray(12, 0, 150),
      mttrData: getRandomDataArray(12, 0, 150),
      mtbfData: getRandomDataArray(12, 0, 150),
    },
  ];

  let colorOptions = ["9ccc65", "9ccc65", "9ccc65", "ef5350"];
  let generateData = [
    {
      lineName: "line1",
      target: getRandomDataArray(12, 100, 120),
      allData: {
        bdHours: getRandomDataArray(12, 0, 150),
        bdPercentage: getRandomDataArray(12, 0, 150),
        mttrData: getRandomDataArray(12, 0, 150),
        mtbfData: getRandomDataArray(12, 0, 150),

        backgroundColorForBDHrs: getRandomColorsArray(12, colorOptions),
        backgroundColorForMTTR: getRandomColorsArray(12, colorOptions),
        backgroundColorForMTBF: getRandomColorsArray(12, colorOptions),
        backgroundColorForBDPercentage: getRandomColorsArray(12, colorOptions),
      },
    },
    {
      lineName: "line1",
      target: getRandomDataArray(12, 100, 120),
      allData: {
        bdHours: getRandomDataArray(12, 0, 150),
        bdPercentage: getRandomDataArray(12, 0, 150),
        mttrData: getRandomDataArray(12, 0, 150),
        mtbfData: getRandomDataArray(12, 0, 150),

        backgroundColorForBDHrs: getRandomColorsArray(12, colorOptions),
        backgroundColorForMTTR: getRandomColorsArray(12, colorOptions),
        backgroundColorForMTBF: getRandomColorsArray(12, colorOptions),
        backgroundColorForBDPercentage: getRandomColorsArray(12, colorOptions),
      },
    },
    {
      lineName: "line1",
      target: getRandomDataArray(12, 100, 120),
      allData: {
        bdHours: getRandomDataArray(12, 0, 150),
        bdPercentage: getRandomDataArray(12, 0, 150),
        mttrData: getRandomDataArray(12, 0, 150),
        mtbfData: getRandomDataArray(12, 0, 150),

        backgroundColorForBDHrs: getRandomColorsArray(12, colorOptions),
        backgroundColorForMTTR: getRandomColorsArray(12, colorOptions),
        backgroundColorForMTBF: getRandomColorsArray(12, colorOptions),
        backgroundColorForBDPercentage: getRandomColorsArray(12, colorOptions),
      },
    },
    {
      lineName: "line1",
      target: getRandomDataArray(12, 100, 120),
      allData: {
        bdHours: getRandomDataArray(12, 0, 150),
        bdPercentage: getRandomDataArray(12, 0, 150),
        mttrData: getRandomDataArray(12, 0, 150),
        mtbfData: getRandomDataArray(12, 0, 150),

        backgroundColorForBDHrs: getRandomColorsArray(12, colorOptions),
        backgroundColorForMTTR: getRandomColorsArray(12, colorOptions),
        backgroundColorForMTBF: getRandomColorsArray(12, colorOptions),
        backgroundColorForBDPercentage: getRandomColorsArray(12, colorOptions),
      },
    },
  ];

  return generateData;
}

function convertResData(data) {
  // console.log("data:", data);
  const comboData = [
    {
      type: "bar",
      data: [
        {
          name: "BD Hours",
          labels: MONTH_LABELS,
          values: data?.data,
        },
      ],
      options: {
        chartColors: data.chartColors, // ["9ccc65", "9ccc65", "9ccc65", "ef5350"], // previous green: c2c933 // previous red "ca1f4b"
      },
    },
    {
      type: "line",
      data: [
        {
          name: "Target",
          labels: MONTH_LABELS,
          values: data?.target,
        },
      ],
      options: {
        chartColors: ["6ea5ff"],
        lineDataSymbolSize: 3,
      },
    },
  ];

  return comboData;
}

export async function genChartMatrix(pptx, dataArray) {
  // console.log("dataArray:", dataArray);
  const noOfLines = dataArray?.length;

  if (noOfLines <= 0) {
    // console.log("return");
    return;
  }

  function calculateCols() {
    if (noOfLines > 4) return 4;
    else return noOfLines;
  }

  function equalColsCalculator() {
    let length = noOfLines;
    let noOfCols;

    if (length > 8) noOfCols = 4;
    else if (length > 4) noOfCols = Math.ceil(length / 2);
    else noOfCols = length;

    return noOfCols;
  }

  let noOfRows = 4;
  // let noOfCols = 4;
  let noOfCols = calculateCols();

  let slide = pptx.addSlide();

  let fontSize = 6;
  let borderColor = "#607d8b";
  let chartOptions = {
    ...commonPptOptions,
    //
    chartArea: {
      fill: { color: "F1F1F1", transparency: 50 },
      border: { color: borderColor, pt: 0.1 },
      roundedCorners: false,
    },
    //
    showLegend: false,
    titleFontSize: 8,
    //
    showCatAxisTitle: false,
    catAxisTitle: "Months",
    catAxisTitleFontSize: fontSize,
    //
    // showValAxisTitle: false,
    valAxisTitle: "Hours",
    valAxisTitleFontSize: fontSize,
    legendFontSize: 7,
    catAxisLabelFontSize: fontSize,
    valAxisLabelFontSize: fontSize,
    showTitle: false,
    title: "BD Hours",
  };

  function addTitle(slide, title, coordinates) {
    slide.addText(
      [
        {
          text: title,
          options: { fontSize: 18, breakLine: true },
        },
      ],
      {
        color: "FFFFFF",
        valign: "middle",
        align: "center",
        fill: { color: borderColor },
        isTextBox: true,
        // line: { color: borderColor, width: "2" },
        ...coordinates,
      }
    );
  }

  let chartTypeNamesArray = ["BD Hours", "BD %", "MTTR", "MTBF"];
  let chartTypeArray = ["bdHours", "bdPercentage", "mttrData", "mtbfData"];
  let chartTypeTargetArray = [
    "monthlyBDHrsTarget",
    "monthlyBDPercentageTarget",
    "monthlyMTTRTarget",
    "monthlyMTBFTarget",
  ];
  let chartTypeColorKeyArray = [
    "backgroundColorForBDHrs",
    "backgroundColorForBDPercentage",
    "backgroundColorForMTTR",
    "backgroundColorForMTBF",
  ];

  const titleBarOffset = 0.4;
  const totalWidth = 13.33 - titleBarOffset;
  const totalHeight = 7.5 - titleBarOffset;

  function calculateWidth() {
    let newWidth = totalWidth / noOfCols;

    if (newWidth > totalWidth / 2) return totalWidth / 2;
    else return newWidth;
  }
  // const width = totalWidth / noOfCols;
  const width = calculateWidth();

  const height = totalHeight / noOfRows;

  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: titleBarOffset,
    h: titleBarOffset,
    fill: { color: borderColor },
    line: { type: "none" },
  });

  // loop for every line
  for (let i = 0; i < noOfCols; i++) {
    let lineTitleCoordinates = {
      x: i * width + titleBarOffset,
      y: 0,
      w: width,
      h: titleBarOffset,
    };

    addTitle(slide, dataArray?.[i]?.["lineName"], lineTitleCoordinates);

    // loop for every chart types : here ---> 4;
    for (let j = 0; j < noOfRows; j++) {
      if (i === 0) {
        let chartTypeTitleCoordinates = {
          x: 0,
          y: j * height + titleBarOffset,
          w: titleBarOffset,
          h: height,
          vert: "vert270",
        };

        addTitle(slide, chartTypeNamesArray[j], chartTypeTitleCoordinates);
      }

      let chartData = convertResData({
        data: dataArray?.[i]?.allData?.[chartTypeArray[j]],
        target: dataArray?.[i]?.[chartTypeTargetArray?.[j]] || [],
        chartColors: dataArray?.[i]?.allData?.[chartTypeColorKeyArray[j]],
      });

      let coordinates = {
        x: i * width + titleBarOffset,
        y: j * height + titleBarOffset,
        w: width,
        h: height,
      };

      slide.addChart(chartData, {
        ...chartOptions,
        ...coordinates,
        valAxisTitle: chartTypeNamesArray[j],
      });
    }
  }

  // dataArray.splice(0, noOfCols);

  const slicedArray = await dataArray?.slice(noOfCols, dataArray.length);

  await genChartMatrix(pptx, slicedArray);
}

export function genMatrix(noOfRows = 3, noOfCols = 3) {
  let matrix = [];

  const totalWidth = 13.35;
  const totalHeight = 7.5;

  const width = totalWidth / noOfCols;
  const height = totalHeight / noOfRows;

  for (let i = 0; i < noOfCols; i++) {
    for (let j = 0; j < noOfRows; j++) {
      matrix.push({
        x: i * width,
        y: j * height,
        w: width,
        h: height,
      });
    }
  }

  console.log("Matrix========>");
  console.table(matrix);
}

export function calcEqualCols(length) {
  if (length < 1) return;
  // let length = dataArray?.length;

  let noOfCols;

  if (length > 8) noOfCols = 4;
  else if (length > 4) noOfCols = Math.ceil(length / 2);
  else noOfCols = length;

  console.log("length:", length);
  console.log("noOfCols:", noOfCols);

  const newLength = length - noOfCols;
  calcEqualCols(newLength);
  // return noOfCols;
}
