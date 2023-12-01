import { Box, Button, ButtonGroup } from "@mui/material";
import React from "react";
import pptxgen from "pptxgenjs";
import {
  chartColors,
  MONTH_LABELS,
} from "../../../Utils/ChartUtils/chartEnums";
import DownloadMenu from "./DownloadMenu";
import LineSelectionDropdown from "./LineSelectionDropdown";

const ChartsToolbar = ({ reduceState, reducerDispatch, ACTION }) => {
  const generatePPT = () => {
    const pptx = new pptxgen();
    const slide = pptx.addSlide();

    // Format the data for the chart
    const pptChartData = [
      {
        name: "BM",
        labels: MONTH_LABELS,
        values: [432, 863, 543, 123, 474, 653, 655, 378, 302, 945, 234, 743],
      },
      {
        name: "PM",
        labels: MONTH_LABELS,
        values: [432, 263, 543, 223, 574, 653, 255, 778, 1032, 145, 734, 243],
      },
    ];

    // Chart options
    let pptChartOptions = {
      x: 0.5,
      y: 0.5,
      w: "90%",
      h: "90%",
      barDir: "col",
      barGrouping: "stacked",
      chartColors: [chartColors.orange[2], chartColors.aqua[1]],
      invertedColors: ["C0504D"],
      showLegend: true,
      //
      showTitle: true,
      title: "Hour Trend Chart",
      titleFontFace: "Roboto",
      titleFontSize: 24,
      titleColor: "#23313f",
      titlePos: { x: 1.5, y: 0 },
      //titleRotate: 10,
      //
      showCatAxisTitle: true,
      catAxisLabelColor: "#23313f",
      catAxisTitleColor: "#23313f",
      catAxisTitle: "Months",
      catAxisTitleFontSize: 12,
      //
      showValAxisTitle: true,
      valAxisLabelColor: "#23313f",
      valAxisTitleColor: "#23313f",
      valAxisTitle: "Hours",
      valAxisTitleFontSize: 12,
    };

    // Add chart to the slide with specified options
    slide.addChart(pptx.ChartType.bar, pptChartData, pptChartOptions);

    // Save the PPT file
    pptx.writeFile({
      fileName: `Man-Hour-Report_${new Date().toISOString()}.pptx`,
    });
  };

  return (
    <Box
      className="col-auto"
      sx={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <LineSelectionDropdown
        {...reduceState}
        reducerDispatch={reducerDispatch}
        ACTION={ACTION}
      />

      <ButtonGroup
        size="small"
        disableElevation
        variant="outlined"
        aria-label="outlined button group"
      >
        <Button>Year</Button>
        <Button variant="contained">Month</Button>
      </ButtonGroup>

      <DownloadMenu handleDownloadCSV={generatePPT} />
    </Box>
  );
};

export default ChartsToolbar;
