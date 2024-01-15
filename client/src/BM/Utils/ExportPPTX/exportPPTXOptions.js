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
  dataLabelPosition: "inEnd",
  // showValue: true,

  //
  legendFontSize: userOptions.textSize + 2,
  //
  catAxisLabelFontSize: userOptions.textSize,
  valAxisLabelFontSize: userOptions.textSize,
};

export function genSlideTitle(pptx, slide, title) {
  slide.addText(
    [
      {
        text: title,
        options: { fontSize: 32, breakLine: true },
      },
    ],
    {
      x: 0,
      y: 0,
      w: 13.33,
      h: 0.75,
      color: "FFFFFF",
      fill: { color: pptx.colors.ACCENT1, transparency: 5 },
      valign: "middle",
      align: "center",
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
