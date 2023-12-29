import { commonPptOptions } from "./exportPPTXOptions";
import axios from "axios";
import { MONTH_LABELS } from "../ChartUtils/chartEnums";

export async function generateLineWiseKpiStatusPpt(pptx, urlOptions) {
  const resData = await fetchData(pptx, urlOptions);
  // const resData = await getLineWiseKpiStatusData(urlOptions);

  await genChartMatrix(pptx, resData);
}

const getLineWiseKpiStatusData = async (urlOptions) => {
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

    const dataaa = await res.json();
    console.log("dataaa:", dataaa);
    const { message, lineWisePptExportationData } = dataaa;

    if (res?.status === 201) {
      return lineWisePptExportationData;
    }
  } catch (error) {
    console.log(error);
  }
};

// implement data fetching logic here
function fetchData() {
  let generateData = [
    {
      lineName: "line1",
      target: getRandomDataArray(12, 100, 120),
      bdHours: getRandomDataArray(12, 40, 150),
      bdPercentage: getRandomDataArray(12, 40, 150),
      mttrData: getRandomDataArray(12, 40, 150),
      mtbfData: getRandomDataArray(12, 40, 150),
    },
    {
      lineName: "line2",
      target: getRandomDataArray(12, 100, 120),
      bdHours: getRandomDataArray(12, 40, 150),
      bdPercentage: getRandomDataArray(12, 40, 150),
      mttrData: getRandomDataArray(12, 40, 150),
      mtbfData: getRandomDataArray(12, 40, 150),
    },
    {
      lineName: "line3",
      target: getRandomDataArray(12, 100, 120),
      bdHours: getRandomDataArray(12, 40, 150),
      bdPercentage: getRandomDataArray(12, 40, 150),
      mttrData: getRandomDataArray(12, 40, 150),
      mtbfData: getRandomDataArray(12, 40, 150),
    },
    {
      lineName: "line4",
      target: getRandomDataArray(12, 100, 120),
      bdHours: getRandomDataArray(12, 40, 150),
      bdPercentage: getRandomDataArray(12, 40, 150),
      mttrData: getRandomDataArray(12, 40, 150),
      mtbfData: getRandomDataArray(12, 40, 150),
    },
    {
      lineName: "line5",
      target: getRandomDataArray(12, 100, 120),
      bdHours: getRandomDataArray(12, 40, 150),
      bdPercentage: getRandomDataArray(12, 40, 150),
      mttrData: getRandomDataArray(12, 40, 150),
      mtbfData: getRandomDataArray(12, 40, 150),
    },
    {
      lineName: "line6",
      target: getRandomDataArray(12, 100, 120),
      bdHours: getRandomDataArray(12, 40, 150),
      bdPercentage: getRandomDataArray(12, 40, 150),
      mttrData: getRandomDataArray(12, 40, 150),
      mtbfData: getRandomDataArray(12, 40, 150),
    },
    {
      lineName: "line7",
      target: getRandomDataArray(12, 100, 120),
      bdHours: getRandomDataArray(12, 40, 150),
      bdPercentage: getRandomDataArray(12, 40, 150),
      mttrData: getRandomDataArray(12, 40, 150),
      mtbfData: getRandomDataArray(12, 40, 150),
    },
    {
      lineName: "line5",
      target: getRandomDataArray(12, 100, 120),
      bdHours: getRandomDataArray(12, 40, 150),
      bdPercentage: getRandomDataArray(12, 40, 150),
      mttrData: getRandomDataArray(12, 40, 150),
      mtbfData: getRandomDataArray(12, 40, 150),
    },
    {
      lineName: "line6",
      target: getRandomDataArray(12, 100, 120),
      bdHours: getRandomDataArray(12, 40, 150),
      bdPercentage: getRandomDataArray(12, 40, 150),
      mttrData: getRandomDataArray(12, 40, 150),
      mtbfData: getRandomDataArray(12, 40, 150),
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
        chartColors: ["9ccc65", "9ccc65", "9ccc65", "ef5350"], // previous green: c2c933 // previous red "ca1f4b"
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

// Generates an array of random numbers for dummy data set
const getRandomDataArray = (arrayLength, min = 30, max = 30) => {
  return Array.from({ length: arrayLength }, () =>
    Math.floor(Math.random() * (max - min) + min)
  );
};

export async function genChartMatrix(pptx, dataArray) {
  console.log("dataArray:", dataArray);
  if (dataArray?.length <= 0) {
    console.log("return");
    return;
  }

  function calculateCols() {
    if (dataArray?.length > 4) return 4;
    else return dataArray?.length;
  }

  function equalColsCalculator() {
    let length = dataArray?.length;
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

  let chartTypeArray = ["bdHours", "bdPercentage", "mttrData", "mtbfData"];
  let chartTypeNamesArray = ["BD Hours", "BD %", "MTTR", "MTBF"];

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
        data: dataArray?.[i]?.[chartTypeArray[j]],
        target: dataArray?.[i]?.["target"],
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

  const slicedArray = await dataArray.slice(noOfCols, dataArray.length);

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
