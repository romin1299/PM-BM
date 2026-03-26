import { MONTH_LABELS, chartColors } from "../ChartUtils/chartEnums";
import {
  commonPptOptions,
  genSlideTitle,
  genSlideTitleFilterNames,
  genSlideTitleYearFilters,
} from "./exportPPTXOptions";
import axios from "axios";

export async function generateTopMachineBdDefaultPpt(pptx, urlOptions) {
  await genSlide01(pptx, urlOptions);
}

const fetchCategoryPieData = async (urlOptions) => {
  const { selectedYear, selectedMonth, flagForTogglingFilter, selectedValue } =
    urlOptions;

  const url = `/getPieChartData/${flagForTogglingFilter}/${selectedValue}`;
  const params = { selectedYear, selectedMonth };

  try {
    const res = await axios.get(url, {
      params,
      withCredentials: true,
      credentials: "include",
    });

    const data = res?.data?.categoriesPieChartData;
    if (data) {
      return data;
    }

    return [];
  } catch (error) {
    console.log("error:", error);
    return [];
  }
};

async function genSlide01(pptx, urlOptions) {
  let slide = pptx.addSlide();

  genSlideTitle(pptx, slide, "Top Machine Report");
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

  /**
   *
   * @add first chart
   *
   */
  const pieData = await fetchCategoryPieData(urlOptions);

  let categoryOptions = {
    ...commonPptOptions,

    showPercent: false,
    showValue: true,
    dataLabelColor: "FFFFFF",
    dataLabelFontSize: 8,
    showLegend: true,
    legendPos: "b",
    showTitle: true,
    // firstSliceAng: 90,
  };

  function convertData(category) {
    return [
      {
        name: category.category,
        labels: category?.subcategories,
        values: category?.bdTime,
      },
    ];
  }

  slide.addChart(pptx.charts.PIE, convertData(pieData[0]), {
    ...categoryOptions,
    x: 0.25,
    y: 1,
    w: 3,
    h: 3,
    title: `${pieData[0].category}`,
  });

  slide.addChart(pptx.charts.PIE, convertData(pieData[1]), {
    ...categoryOptions,
    x: 0.25,
    y: 4.25,
    w: 3,
    h: 3,
    title: `${pieData[1].category}`,
  });

  /**
   *
   * @add second chart
   *
   */
  let resData02 = await fetchMTTRData(urlOptions, "MTTR");
  let chartData02 = convertResData(pptx, resData02);

  let chartOptions02 = {
    ...commonPptOptions,
    x: 3.55,
    y: 1,
    w: 9.5,
    h: 3.0,
    //
    title: "MTTR Trend",
    valAxisTitle: "Hours",
  };

  // Add chart to the slide with specified options
  slide.addChart(chartData02, chartOptions02);

  /**
   *
   * @add third chart
   *
   */
  let resData03 = await fetchMTTRData(urlOptions, "MTBF");
  let chartData03 = convertResData(pptx, resData03);

  let chartOptions03 = {
    ...commonPptOptions,
    x: 3.55,
    y: 4.25,
    w: 9.5,
    h: 3.0,
    //
    title: "MTBF Trend",
    valAxisTitle: "Hours",
  };

  // Add chart to the slide with specified options
  slide.addChart(chartData03, chartOptions03);
}

const fetchMTTRData = async (urlOptions, chartFor) => {
  const { selectedYear, flagForTogglingFilter, selectedValue } = urlOptions;

  const url = `/getTrendData/${chartFor}/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}`;

  const params = { selectedYear, targetKey: "monthlyMTTRTarget" };

  try {
    const res = await axios.get(url, {
      // params,
      withCredentials: true,
      credentials: "include",
    });

    console.log("res:", res);

    const data = res?.data?.data;
    if (data) {
      return data;
    }

    return [];
  } catch (error) {
    console.log("error:", error);
    return [];
  }
};

function convertResData(pptx, data) {
  const comboData = [
    {
      type: pptx.charts.BAR,
      data: [
        {
          name: "BD Hours",
          labels: data?.labels,
          values: data?.data?.replaceZeroWithNull(),
        },
      ],
      options: {
        chartColors: [
          "0aa3d2",
          "65cc97",
          "DE5274",
          "646089",
          "bbd0e5",
          "DE6152",
        ],
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
