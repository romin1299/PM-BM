import axios from "axios";
import {
  commonPptOptions,
  genSlideTitle,
  genSlideTitleFilterNames,
  genSlideTitleYearFilters,
} from "./exportPPTXOptions";

export async function commonPPTGeneratorForSameTemplate(pptx, urlOptions) {
  await genSlide01(pptx, urlOptions);
  await genSlide02(pptx, urlOptions);
}

const fetchDataAPI = async ({ url }) => {
  try {
    const res = await axios.get(url, {
      withCredentials: true,
      credentials: "include",
    });

    if (res?.status === 201) {
      return res?.data?.data;
    }
  } catch (error) {
    console.log(error);
  }
};

const chartDataMake = async (pptx, chartData, name) => [
  {
    type: pptx.charts.BAR,
    data: [
      {
        name,
        labels: chartData?.labels,
        values: chartData?.data.replaceZeroWithNull(),
      },
    ],
    options: {
      chartColors: chartData?.backgroundColor || ["ffcd38"],
    },
  },
  {
    type: pptx.charts.LINE,
    data: [
      {
        name: "Target",
        labels: chartData?.labels,
        values: chartData?.target.replaceZeroWithNull(),
      },
    ],
    options: {
      chartColors: ["2f79bf"],
    },
  },
];

async function genSlide01(pptx, urlOptions) {
  let slide = pptx.addSlide();

  const {
    name,
    selectedYear,
    selectedMonth,
    flagForTogglingFilter,
    documentLimitInTheGraph,
    selectedValue,
    targetKey,
  } = urlOptions;

  console.log("mtbf export urlOptions:", urlOptions);

  genSlideTitle(pptx, slide, `${name} Report`, {
    x: 0,
    y: 0,
    w: 13.33,
    h: 0.75,
  });
  genSlideTitleFilterNames(pptx, slide, urlOptions, {
    x: 0.5,
    y: 0,
    w: 4,
    h: 0.75,
  });
  genSlideTitleYearFilters(pptx, slide, urlOptions, {
    x: 8.85,
    y: 0,
    w: 4,
    h: 0.75,
  });

  const trendData = await fetchDataAPI({
    url: `/getTrendData/${name}/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}&&targetKey=${targetKey}`,
  });

  const chartData01 = await chartDataMake(pptx, trendData, name);

  const chartOptions01 = {
    ...commonPptOptions,
    x: 0.5,
    y: 1.25,
    w: 5.95,
    h: 5.75,

    title: `${name} Trend`,

    titleFontSize: 14,
    catAxisTitle: "Months",
    catAxisTitleFontSize: 10,
    valAxisTitle: name,
    valAxisTitleFontSize: 10,
  };

  // Add chart to the slide with specified options
  slide.addChart(chartData01, chartOptions01);

  const lineWiseData = await fetchDataAPI({
    url: `/getLineWise${name}TrendData/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}&&selectedMonth=${selectedMonth}`,
  });

  const chartData02 = await chartDataMake(pptx, lineWiseData);

  const chartOptions02 = {
    ...chartOptions01,
    x: 6.95,
    catAxisTitle: "Lines",
    title: "Line Trend",
  };

  slide.addChart(chartData02, chartOptions02);

  // const chartData03 = await fetchDataAPI({
  //   url: `/getMachineWise${name}TrendData/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}&&selectedMonth=${selectedMonth}&&documentLimitInTheGraph=${documentLimitInTheGraph}`,
  // });

  // const data = [
  //   {
  //     name,
  //     labels: chartData03?.labels,
  //     values: chartData03?.data,
  //   },
  // ];

  // const comboProps = {
  //   ...commonPptOptions,
  //   x: 0.5,
  //   y: 4.375,
  //   w: 12.3,
  //   h: 2.625,
  //   catAxisTitle: "Machines",
  //   valAxisTitle: name,
  //   title: "Machine Trend",
  // };

  // // Add chart to the slide with specified options
  // slide.addChart(pptx.ChartType.line, data, comboProps);
}

async function genSlide02(pptx, urlOptions) {
  let slide = pptx.addSlide();

  const {
    name,
    documentLimitInTheGraph,
    selectedYear,
    selectedMonth,
    flagForTogglingFilter,
    selectedValue,
  } = urlOptions;

  const chartData03 = await fetchDataAPI({
    url: `/getMachineWise${name}TrendData/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}&&selectedMonth=${selectedMonth}&&documentLimitInTheGraph=${documentLimitInTheGraph}`,
  });

  const data = [
    {
      name,
      labels: chartData03?.labels,
      values: chartData03?.data.replaceZeroWithNull(),
    },
  ];

  const comboProps = {
    ...commonPptOptions,
    x: 0.5,
    y: 1.0,
    w: 12.3,
    h: 5.5,
    catAxisTitle: "Machines",
    valAxisTitle: name,
    title: "Machine Trend",
  };

  // Add chart to the slide with specified options
  slide.addChart(pptx.ChartType.line, data, comboProps);
}
