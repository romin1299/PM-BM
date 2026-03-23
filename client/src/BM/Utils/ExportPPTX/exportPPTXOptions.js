import { chartColors } from "../ChartUtils/chartEnums";

const userOptions = {
  textColor: chartColors.text,
  textSize: 10,
  titleSize: 18,
  chartColors: chartColors.exportPpt,
};

export const commonPptOptions = {
  x: 0,
  y: 0.6,
  w: "70%",
  h: 3.0,
  barDir: "col",
  barGrouping: "stacked",
  // barGapWidthPct: 100,
  chartColors: userOptions.chartColors,
  invertedColors: ["C0504D"],
  showLegend: true,
  legendPos: "t",
  //
  chartArea: {
    fill: { color: "F1F1F1", transparency: 50 },
    border: { color: "56B4E4", pt: 0.1 },
    roundedCorners: false,
  },
  //
  showTitle: true,
  title: "Chart Title",
  //   titleFontFace: "Roboto",
  titleFontSize: userOptions.titleSize,
  titleColor: userOptions.textColor,
  // titlePos: { x: 10, y: 0 },
  //titleRotate: 10,
  //
  showCatAxisTitle: true,
  catAxisTitle: "x-axis Labels",
  catAxisLabelColor: userOptions.textColor,
  catAxisTitleColor: userOptions.textColor,
  catAxisTitleFontSize: userOptions.textSize + 1,
  catGridLine: { style: "none" },
  valGridLine: { style: "none" },
  //
  showValAxisTitle: true,
  valAxisTitle: "y-axis Labels",
  valAxisLabelColor: userOptions.textColor,
  valAxisTitleColor: userOptions.textColor,
  valAxisTitleFontSize: userOptions.textSize + 1,
  // valGridLine: { style: "dash", color:"gray" },
  // valGridLine: {
  //   style: "dash",
  //   color: pptx.colors.ACCENT3,
  // },
  //
  // dataBorder: { pt: 1, color: "000000" },
  dataLabelColor: "000000",
  dataLabelFontFace: "Arial",
  dataLabelFontSize: 10,
  // dataLabelFormatCode: "#.#",
  // dataLabelPosition: "inEnd",
  showValue: true,

  //
  legendFontSize: userOptions.textSize + 2,
  //
  catAxisLabelFontSize: userOptions.textSize,
  valAxisLabelFontSize: userOptions.textSize,
};

export function genSlideTitle(
  pptx,
  slide,
  title,
  coordinates = { x: 0, y: 0, w: 13.33, h: 0.75 }
) {
  slide.addText(
    [
      {
        text: title,
        options: { fontSize: 32, breakLine: true },
      },
    ],
    {
      ...coordinates,
      color: "FFFFFF",
      fill: { color: pptx.colors.ACCENT1, transparency: 5 },
      valign: "middle",
      align: "center",
      isTextBox: true,
    }
  );
}

export function genSlideTitleFilterNames(
  pptx,
  slide,
  urlOptions,
  coordinates = { x: 0, y: 0, w: 13.33, h: 0.75 }
) {
  const filters = generateFilterNames(urlOptions);
  let title = "";

  for (var objKey in filters) {
    title = title + "/" + filters[objKey];
  }

  slide.addText(
    [
      {
        text: title,
        options: { fontSize: 16, breakLine: true },
      },
    ],
    {
      ...coordinates,
      color: "FFFFFF",
      // fill: { color: pptx.colors.ACCENT1, transparency: 5 },
      valign: "middle",
      align: "left",
      isTextBox: true,
    }
  );
}

export function genSlideTitleYearFilters(
  pptx,
  slide,
  urlOptions,
  coordinates = { x: 0, y: 0, w: 13.33, h: 0.75 }
) {
  // console.log("urlOptions:", urlOptions);

  let month =
    urlOptions?.selectedMonth !== "" && urlOptions?.selectedMonth !== undefined
      ? `/${urlOptions?.selectedMonth}`
      : "";

  slide.addText(
    [
      {
        text: urlOptions.selectedYear + month,
        options: { fontSize: 16, breakLine: true },
      },
    ],
    {
      ...coordinates,
      color: "FFFFFF",
      // fill: { color: pptx.colors.ACCENT1, transparency: 5 },
      valign: "middle",
      align: "right",
      isTextBox: true,
    }
  );
}

export function genNoDataFoundText(
  slide,
  coordinates = {
    x: 0,
    y: 0,
    w: 5,
    h: 5,
  }
) {
  slide.addText(
    [
      {
        text: "No data Found",
        options: { fontSize: 18, breakLine: true },
      },
    ],
    {
      color: "#212529",
      valign: "middle",
      align: "center",
      fill: { color: "#e2e3e5" },
      line: { width: "2", color: "A9A9A9" },
      isTextBox: true,
      ...coordinates,
    }
  );
}

export function getFilterNames(state) {
  let names = {};

  if (state?.selectedSection) {
    const currSection = state.sections.find(
      (item) => item._id === state.selectedSection
    );
    names = { ...names, sectionName: currSection.section_name };
  }

  if (state?.selectedSubSection) {
    const currSubSection = state.subSections.find(
      (item) => item._id === state.selectedSubSection
    );
    names = { ...names, subSectionName: currSubSection.subSection_name };
  }

  if (state?.selectedCell) {
    const currCell = state.cells.find(
      (item) => item._id === state.selectedCell
    );
    names = { ...names, cellName: currCell.cell_name };
  }

  if (state?.selectedLine) {
    const currLine = state.lines.find(
      (item) => item._id === state.selectedLine
    );
    names = { ...names, lineName: currLine.line_name };
  }

  return names;
}

export function generateFilterNames(state) {
  const names = {};

  const extractName = (key, collection) => {
    if (state[key]) {
      const currentItem = state[collection].find(
        (item) => item._id === state[key]
      );

      names[collection.slice(0, -1) + "Name"] = currentItem
        ? currentItem[collection.slice(0, -1) + "_name"]
        : "";
    }
  };

  extractName("selectedSection", "sections");
  extractName("selectedSubSection", "subSections");
  extractName("selectedCell", "cells");
  extractName("selectedLine", "lines");

  return names;
}
