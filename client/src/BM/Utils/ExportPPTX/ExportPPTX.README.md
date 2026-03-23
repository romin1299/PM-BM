# Export PPTX Feature

## Table of Contents

1. [Overview](#overview)
2. [Folder Structure](#folder-structure)
3. [Dependencies](#dependencies)
4. [Key Components](#key-components)
5. [Available Reports](#available-reports)
6. [Extending Functionality](#extending-functionality)
7. [Common Options](#common-options)
8. [Utility Functions](#utility-functions)
   - [genSlideTitle](#1-genslidetitle)
   - [genSlideTitleFilterNames](#2-genslidetitlefilternames)
   - [genSlideTitleYearFilters](#3-genslidetitleyearfilters)
   - [genNoDataFoundText](#4-gennodatafoundtext)
   - [getFilterNames and generateFilterNames](#5-getfilternames-and-generatefilternames)
9. [Usage](#usage)
10. [Example (Generator Functions)](#example-generator-functions)
    - [Basic Example](#1-basic-example)
    - [Multi Axis Example](#2-multi-axis-example)
11. [Considerations](#considerations)
12. [References](#references)

## Overview

This documentation illustrates our project's integration of PPTXgen for dynamic PowerPoint presentation (PPTX) generation. It demonstrates how functions call one another for reusability, enabling efficient report generation. Through this approach, reports like Product Line Wise, Man Hour, and Monthly Breakdown are exported effortlessly. PPTXgen's dynamic chart creation and customization features enhance data visualization, fostering effective team communication and decision-making. This guide offers insights into our implementation, facilitating seamless utilization and extension of PPTXgen within our project.

## Folder Structure

```
BM/
├── Reports
│   └── MonthlyBDTrend
│       └── MonthlyBDDashboard.jsx
└── Utils
    └── ExportPPTX
        ├── commonPPTGeneratorForSameTemplate.js
        ├── dailyBdTrendSlide.js
        ├── exportPPTX.js
        ├── ExportPPTX.README.md
        ├── exportPPTXOptions.js
        ├── generateKPIFromDBPpt.js
        ├── generateLineWiseKpiStatusPpt.js
        ├── lineContributionPPTX.js
        ├── manHourPPTX.js
        ├── monthlyBdChart.js
        ├── monthlyBdPPTX.js
        ├── productLineWisePPTX.js
        ├── testPPTX.js
        ├── tmMTTRSkillPPTX.js
        ├── topMachineBbDefaultPPTX.js
        └── topMachineBbPPTX.js
```

## Dependencies

use the following command to install the dependencies using npm:

```
npm install pptxgenjs axios
```

1. **pptxgenjs:**

   - Used for generating PowerPoint presentations (PPTX) programmatically.
   - Provides functionality to create slides, add text, insert charts, and customize styling.

2. **axios:**

   - Facilitates making HTTP requests to fetch data required for report generation.
   - Enables asynchronous communication with the server to retrieve necessary information.

3. **Other Internal Modules:**
   - Various internal modules within the project, such as `ChartUtils/chartEnums` and custom utility functions, are utilized for data manipulation, chart generation, and other tasks specific to report generation.

## Key Components

### 1. **EXPORT_REPORT Object**

- Defines constants representing different types of reports for export.
- It provides a centralized way to reference report names throughout the codebase, ensuring consistency and avoiding hardcoded strings.

### 2. **exportPPTX Function**

- **Purpose:** This function serves as the entry point for exporting PPTX reports.
- **Parameters:**
  - `reportName`: A string representing the type of report to be exported, selected from the constants defined in `EXPORT_REPORT`.
  - `urlOptions`: An object containing options or parameters required for generating the specific report.
- **Functionality:**
  - Instantiates a new `pptxgen` object.
  - Based on the provided `reportName`, it calls respective generator functions to populate the PowerPoint slides with relevant data.
  - Finally, it saves the generated PPTX file with a timestamped filename.

### 3. **Generator Functions for Each Report Type**

- Each report type has its generator function responsible for populating slides with data specific to that report.
- Generator functions are asynchronous to handle any asynchronous operations, such as data fetching.
- They accept the `pptx` object (PowerPoint instance) and `urlOptions` as parameters.
- Generator functions populate slides with charts, text, and other visual elements based on the report requirements.

## Available Reports

The following reports are available for export:

- Product-Line-Wise-Report
- Man-Hour-Report
- Monthly-BD-Report
- Line-Contribution-Report
- TM-MTTR-Skill-Report
- Line-Wise-Kpi-Status
- COMMON-TEMPLATE-REPORT
- KPI-From-Database
- Top-Machine-Breakdown
- Top-Machine-Bd-Default
- Test-Report

To export a specific report, provide its corresponding `reportName` from the `EXPORT_REPORT` object. Ensure valid input for the `reportName` parameter. For `COMMON_TEMPLATE_REPORT`, customize the filename in `urlOptions`.

### Usage Example

```jsx
// Import necessary modules
import { EXPORT_REPORT } from "./path/to/exportPPTX";
import { exportPPTX } from "./path/to/exportPPTX";

// optional object that you can use while applying dynamic api call
const urlOptions = {}

// Trigger PPTX export for Monthly BD Report
<DownloadMenu
  handleDownloadPPTX={() => {
    exportPPTX(EXPORT_REPORT.MONTHLY_BD, urlOptions);
  }}
/>;
```

## Extending Functionality

1. **Adding New Report Types:**

   - Define a new constant in `EXPORT_REPORT` for the new report type.
   - Implement a generator function specific to the new report type.
   - Update the `exportPPTX` function to handle the new report type.

2. **Customizing Report Generation:**

   - Modify existing generator functions to adjust slide layouts, chart types, or data representations.
   - Update styling options and chart configurations in `commonPPTOptions`.

3. **Error Handling and Validation:**
   - Enhance error handling within generator functions to gracefully handle data fetching errors or invalid inputs.
   - Validate input parameters in `exportPPTX` to ensure correct usage and prevent runtime errors.

## Common Options

The `commonPptOptions` object contains commonly used options for chart generation. Here's a categorized overview of each property and its purpose:

### Position and Size:

- `x`, `y`, `w`, `h`: Define the position and dimensions of the chart on the slide.

### Bar Chart Configuration:

- `barDir`: Specifies the direction of the bars (e.g., "col" for vertical bars).
- `barGrouping`: Determines the grouping mode for bars (e.g., "stacked" for stacked bars).

### Color and Styling:

- `chartColors`: Sets the color palette for the chart elements.
- `invertedColors`: Specifies colors to be inverted for better contrast.
- `chartArea`: Defines the style and appearance of the chart area, including fill color, border, and rounded corners.

### Legend Configuration:

- `showLegend`: Controls the visibility of the legend.
- `legendPos`: Sets the position of the legend on the chart.
- `legendFontSize`: Configures the font size of the legend.

### Title Configuration:

- `showTitle`: Determines whether to display the chart title.
- `title`, `titleFontSize`, `titleColor`: Configures the title text, font size, and color.

### Axis Configuration:

- `showCatAxisTitle`: Controls the visibility of the category axis title.
- `catAxisTitle`, `catAxisLabelColor`: Sets the category axis title text and label color.
- `catAxisTitleFontSize`, `catAxisLabelFontSize`: Configures the font size of the category axis title and labels.
- `showValAxisTitle`: Controls the visibility of the value axis title.
- `valAxisTitle`, `valAxisLabelColor`: Sets the value axis title text and label color.
- `valAxisTitleFontSize`, `valAxisLabelFontSize`: Configures the font size of the value axis title and labels.

### Data Label Configuration:

- `dataLabelColor`, `dataLabelFontFace`, `dataLabelFontSize`: Defines the style of data labels.
- `showValue`: Determines whether to display the data values on the chart.

These options provide extensive control over the appearance and behavior of charts generated using PPTXgen, allowing for customization to suit specific visualization requirements.

## Utility Functions

These utility functions facilitate the creation of slide titles and text elements within PowerPoint slides. Here's a brief overview of each function along with its purpose and usage:

### 1. `genSlideTitle`:

- **Purpose:** Generates a slide title with customizable text content and styling.
- **Parameters:**
  - `pptx`: PowerPoint instance.
  - `slide`: Slide object where the title will be added.
  - `titleText`: Text content for the title.
  - `coordinates`: Coordinates specifying the position and dimensions of the title on the slide.
- **Usage Example:**
  ```javascript
  genSlideTitle(pptx, slide, "Title Text", { x: 0, y: 0, w: 13.33, h: 0.75 });
  ```

### 2. `genSlideTitleFilterNames`

- **Purpose:** Generates a slide title displaying filter names extracted from URL options.
- **Parameters:**
  - `pptx`: PowerPoint instance.
  - `slide`: Slide object where the title will be added.
  - `urlOptions`: URL options containing filter names.
  - `coordinates`: Coordinates for positioning the title on the slide.
- **Usage Example:**
  ```javascript
  genSlideTitleFilterNames(pptx, slide, urlOptions, {
    x: 0,
    y: 0,
    w: 13.33,
    h: 0.75,
  });
  ```

### 3. `genSlideTitleYearFilters`

- **Purpose:** Generates a slide title displaying selected year and month extracted from URL options.
- **Parameters:**
  - `pptx`: PowerPoint instance.
  - `slide`: Slide object where the title will be added.
  - `urlOptions`: URL options containing selected year and month.
  - `coordinates`: Coordinates for positioning the title on the slide.
- **Usage Example:**
  ```javascript
  genSlideTitleYearFilters(pptx, slide, urlOptions, {
    x: 0,
    y: 0,
    w: 13.33,
    h: 0.75,
  });
  ```

### 4. `genNoDataFoundText`

- **Purpose:** Adds a text element to the slide indicating that no data was found.
- **Parameters:**
  - `slide`: Slide object where the text element will be added.
  - `coordinates`: Coordinates for positioning the text element on the slide.
- **Usage Example:**
  ```javascript
  genNoDataFoundText(slide, { x: 0, y: 0, w: 5, h: 5 });
  ```

### 5. `getFilterNames` and `generateFilterNames`

- **Purpose:** Extract and generate filter names based on the current state, facilitating dynamic display of filter names in slide titles.

## Usage

1. **Import the `exportPPTX` Function:**

   ```javascript
   import { exportPPTX, EXPORT_REPORT } from "./exportPPTX";
   ```

2. **Trigger Export for a Specific Report:**

   ```javascript
   exportPPTX(EXPORT_REPORT.MONTHLY_BD, urlOptions);
   ```

   - Replace `EXPORT_REPORT.MONTHLY_BD` with the desired report type constant.
   - `urlOptions` should contain any necessary parameters for report generation.

3. **Handle Report Generation:**
   - Ensure the necessary generator functions (`generateMonthlyBdPpt`, etc.) are implemented to support the desired report types.
   - Customize generator functions and styling options as per requirements.

## Example (Generator Functions)

### 1. Basic Example

```javascript
import { commonPptOptions } from "./exportPPTXOptions";

// Function to generate a slide with a basic bar chart related to user age
export function generateTestPpt(pptx) {
  let slide = pptx.addSlide();

  // Options for the chart, including position and size
  let optsChart = {
    ...commonPptOptions,
    x: 0.5,
    y: 0.5,
    w: "90%",
    h: "90%",
  };

  // Add the chart to the slide with specified options
  slide.addChart(pptx.charts.BAR, userData, optsChart);
}
```

This function creates a slide with a basic bar chart related to user age. Here's what it does:

- The function takes the `pptx` object as a parameter, representing the PowerPoint instance where the slide will be added.
- It imports common options for the chart from the `exportPPTXOptions` module.
- A new slide is created using `pptx.addSlide()`.
- The `optsChart` object contains options for the chart, including its position (`x` and `y` coordinates) and size (`w` and `h` dimensions), which are spread with `commonPptOptions`.
- The `slide.addChart()` method adds the chart to the slide. It takes three parameters: the chart type (`pptx.charts.BAR`), the data for the chart (`userData`), and the options (`optsChart`).

```javascript
// Dummy data for the basic bar chart related to user age
const getRandomDataArray = (arrayLength, min = 30, max = 30) => {
  return Array.from({ length: arrayLength }, () =>
    Math.floor(Math.random() * (max - min) + min)
  );
};

const ageLabels = [
  "18-24",
  "25-29",
  "30-34",
  "35-39",
  "40-44",
  "45-49",
  "50-54",
  "55+",
];

const userData = [
  {
    name: "User Group 1",
    labels: ageLabels,
    values: getRandomDataArray(8, 60, 120),
  },
  {
    name: "User Group 2",
    labels: ageLabels,
    values: getRandomDataArray(8, 20, 80),
  },
  {
    name: "User Group 3",
    labels: ageLabels,
    values: getRandomDataArray(8, 40, 180),
  },
];
```

- This part of the code provides dummy data for the basic bar chart related to user age.
- The `getRandomDataArray` function generates an array of random data within a specified range (`min` to `max`).
- `ageLabels` contains labels for different age groups.
- `userData` is an array of objects, each representing a user group. Each object contains the group name (`name`), age labels (`labels`), and corresponding random data values (`values`) generated using `getRandomDataArray`.
- This data will be used to populate the chart in the PowerPoint slide.

### 2. Multi Axis Example

```javascript
import { commonPptOptions } from "./exportPPTXOptions";

export function generateNewPpt(pptx, urlOptions) {
  await genSlide(pptx, urlOptions);
}

function genSlide(pptx, urlOptions) {
  let slide = pptx.addSlide();

  // Dummy data for labels (e.g., months) and values (e.g., total sum of BM and PM hours)
  const months = [
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
    "JAN",
    "FEB",
    "MAR",
  ];
  const totalSumOfBM = [
    100, 150, 200, 180, 250, 300, 280, 320, 280, 200, 180, 150,
  ];
  const totalSumOfPM = [
    80, 120, 150, 140, 180, 200, 190, 220, 180, 150, 130, 100,
  ];

  let data = {
    lines: months,
    totalSumOf_BM: totalSumOfBM,
    totalSumOf_PM: totalSumOfPM,
  };

  // Define chart data and options
  let chartData = [
    {
      type: pptx.charts.BAR,
      data: [
        {
          name: "BM",
          labels: data.lines,
          values: data.totalSumOf_BM,
        },
        {
          name: "PM",
          labels: data.lines,
          values: data.totalSumOf_PM,
        },
      ],
      options: {
        chartColors: ["2f79bf", "bbd0e5", "2693ff", "ffcd38", "ff7b64"],
      },
    },
    {
      type: pptx.charts.LINE,
      data: [
        {
          name: "Counts",
          labels: data.lines,
          values: data.totalSumOf_BM,
        },
      ],
      options: {
        chartColors: ["F38940"],
        secondaryValAxis: true,
        secondaryCatAxis: true,
      },
    },
  ];

  let chartOptions = {
    ...commonPptOptions,
    x: 0.5,
    y: 4.3,
    w: 5.95,
    h: 2.75,

    title: "Hour Trend",
    catAxisTitle: "Lines",
    valAxisTitle: "Hours",
    valAxes: [
      {
        showValAxisTitle: true,
        valAxisTitle: "Hours",
        valGridLine: { style: "none" },
      },
      {
        showValAxisTitle: true,
        valAxisTitle: "Percentage",
      },
    ],
    catAxes: [{ catAxisHidden: true }, { showCatAxisTitle: false }],
  };

  // Add chart to the slide with specified options
  slide.addChart(chartData, chartOptions);
}
```

- The `generateNewPpt` function is declared to asynchronously generate a new PowerPoint slide using the `genSlide` function.
- `genSlide` function is responsible for creating the slide content.
- Dummy data is provided for demonstration, including months and corresponding total sums of BM and PM hours.
- Chart data and options are defined to specify the content and styling of the bar and line charts.
- The `chartOptions` object includes settings for axis titles, chart colors, and visibility.
- The `slide.addChart()` method adds the chart to the slide using the specified data and options.

## Considerations:

1. **Performance Impact:**

   - Asynchronous HTTP requests are made to fetch data for report generation, potentially impacting performance based on network latency and data size. Optimize data fetching and processing for improved performance.

2. **Error Handling:**
   - If the server fails to provide a response, the PPTX generation process will throw an error due to the absence of data. This can lead to silent termination without indicating the cause to the user, potentially causing confusion. Ensure proper error handling mechanisms are in place to provide informative feedback in such scenarios.

### References

- [PptxGenJs](https://gitbrent.github.io/PptxGenJS/)
- [PptxGenJs Charts API](https://gitbrent.github.io/PptxGenJS/docs/api-charts/)
- [Download Charts Demo](https://gitbrent.github.io/PptxGenJS/demo/browser/index.html#charts)
