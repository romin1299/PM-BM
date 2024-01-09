import { MONTH_LABELS, chartColors } from "../ChartUtils/chartEnums";
import { genSlideDailyBDTrend } from "./dailyBdTrendSlide";
import { commonPptOptions } from "./exportPPTXOptions";
import axios from "axios";

export async function generateProductLineWisePpt(pptx, urlOptions) {
  await genSlideDailyBDTrend(pptx, {
    ...urlOptions,
    text: "Product/Line Wise KPI",
  });
  await genSlide02(pptx, urlOptions);
  await genSlide03(pptx, urlOptions);
}

const fetchBdHoursData = async (urlOptions) => {
  const { selectedYear, flagForTogglingFilter, selectedValue } = urlOptions;

  const url = `/getBDHoursGraphData/${flagForTogglingFilter}/${selectedValue}`;

  const params = { selectedYear,targetKey:"monthlyBDHrsTarget" };

  try {
    const res = await axios.get(url, {
      params,
      withCredentials: true,
      credentials: "include",
    });

    const data = res?.data?.BDHours;
    if (data) {
      // console.log("data:", data);
      return data;
    }

    return [];
  } catch (error) {
    console.log("error:", error);
    return [];
  }
};
const fetchMTTRData = async (urlOptions) => {
  const { selectedYear, flagForTogglingFilter, selectedValue } = urlOptions;

  const url = `/getMTTRGraphData/${flagForTogglingFilter}/${selectedValue}`;

  const params = { selectedYear,targetKey:"monthlyMTTRTarget" };

  try {
    const res = await axios.get(url, {
      params,
      withCredentials: true,
      credentials: "include",
    });

    const data = res?.data?.MTTRReportData;
    if (data) {
      return data;
    }

    return [];
  } catch (error) {
    console.log("error:", error);
    return [];
  }
};
const fetchMTBFData = async (urlOptions) => {
  const { selectedYear, flagForTogglingFilter, selectedValue } = urlOptions;

  const url = `/getMtbfData/${flagForTogglingFilter}/${selectedValue}`;

  const params = { selectedYear };

  try {
    const res = await axios.get(url, {
      params,
      withCredentials: true,
      credentials: "include",
    });

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
const fetchBdPercentageData = async (urlOptions) => {
  const { selectedYear, flagForTogglingFilter, selectedValue } = urlOptions;

  const url = `/getBdPercentage/${flagForTogglingFilter}/${selectedValue}`;

  const params = { selectedYear };

  try {
    const res = await axios.get(url, {
      params,
      withCredentials: true,
      credentials: "include",
    });

    const data = res?.data?.data;
    if (data) {
      // console.log("data:", data);
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
          values: data?.data,
        },
      ],
      options: {
        chartColors: data?.backgroundColor?.map((color) => {
          if (color === "green") return "c2c933"; //green
          else if (color === "red") return "ca1f4b";
          else return "2f79bf";
        }),
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

/**
 *
 * @add Second - Slide
 *
 */

async function genSlide02(pptx, urlOptions) {
  let slide = pptx.addSlide();
  let options = {
    titleFontSize: 14,
    catAxisTitle: "Months",
    catAxisTitleFontSize: 10,
    valAxisTitle: "Hours",
    valAxisTitleFontSize: 10,
  };

  /*
   *
   * @add first chart
   * Top - Left
   *
   */
  let resData01 = await fetchBdHoursData(urlOptions);
  let chartData01 = convertResData(pptx, resData01);

  let chartOptions01 = {
    ...commonPptOptions,
    x: 0.5,
    y: 0.5,
    w: 5.95,
    h: 3.0,
    //
    ...options,
    title: "BD Hours",
  };

  // Add chart to the slide with specified options
  slide.addChart(chartData01, chartOptions01);

  /*
   *
   * @add Second chart
   * Top - Right
   *
   */
  let resData02 = await fetchMTTRData(urlOptions);
  let chartData02 = convertResData(pptx, resData02);

  let chartOptions02 = {
    ...commonPptOptions,
    x: 6.95,
    y: 0.5,
    w: 5.95,
    h: 3.0,
    //
    ...options,
    title: "MTTR",
  };

  // Add chart to the slide with specified options
  slide.addChart(chartData02, chartOptions02);

  /*
   *
   * @add Third chart
   * Bottom - Left
   *
   */
  let resData03 = await fetchMTBFData(urlOptions);
  let chartData03 = convertResData(pptx, resData03);

  let chartOptions03 = {
    ...commonPptOptions,
    x: 0.5,
    y: 4,
    w: 5.95,
    h: 3.0,
    //
    ...options,
    title: "MTBF",
  };

  // Add chart to the slide with specified options
  slide.addChart(chartData03, chartOptions03);

  /*
   *
   * @add Fourth chart
   * Bottom - Right
   *
   */
  let resData04 = await fetchBdPercentageData(urlOptions);
  let chartData04 = convertResData(pptx, resData04);

  let chartOptions04 = {
    ...commonPptOptions,
    x: 6.95,
    y: 4,
    w: 5.95,
    h: 3.0,
    //
    ...options,
    title: "BD Percentage",
  };

  // Add chart to the slide with specified options
  slide.addChart(chartData04, chartOptions04);
}

/**
 *
 * @add Third - Slide
 *
 */
const fetchBdHoursVsCountData = async (urlOptions) => {
  const { selectedYear, selectedMonth, flagForTogglingFilter, selectedValue } =
    urlOptions;

  const url = `/getBDhoursVsCountDataFunction/by-default/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}&&selectedMonth=${undefined}`;

  const params = { selectedYear, selectedMonth };

  try {
    const res = await axios.post(url, {
      // params,
      withCredentials: true,
      credentials: "include",
    });

    const data = res?.data?.BDHoursVsCountData;
    if (data) {
      return {
        labels: data?.labels[0]?.machine_code,
        BDhours: data?.BDhours[0].sumOfBDhours,
        BDCount: data?.BDCount[0].count,
      };
    }

    return [];
  } catch (error) {
    console.log("error:", error);
    return [];
  }
};

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

async function genSlide03(pptx, urlOptions) {
  let slide = pptx.addSlide();
  let comboProps;

  /**
   *
   * @add first chart
   *
   */
  const data = await fetchBdHoursVsCountData(urlOptions);

  const chartData01 = [
    {
      type: pptx.charts.BAR,
      data: [
        {
          name: "Total Hours",
          labels: data?.labels,
          values: data?.BDhours,
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
          labels: data?.labels,
          values: data?.BDCount,
        },
      ],
      options: {
        chartColors: ["F38940"],
        secondaryValAxis: true,
        secondaryCatAxis: true,
      },
    },
  ];
  // console.log("chartData01:", chartData01);

  comboProps = {
    ...commonPptOptions,
    x: 0.5,
    y: 0.5,
    w: 8.85,
    h: 6.5,
    //
    catAxisLabelFontSize: 10,
    catAxisOrientation: "minMax",
    showCatAxisTitle: true,
    catAxisTitle: "Days",
    //
    title: "Daily Breakdown Trend",
    //
    valAxes: [
      {
        showValAxisTitle: true,
        valAxisTitle: "Hours",
        valGridLine: { style: "none" },
      },
      {
        showValAxisTitle: true,
        valAxisTitle: "Counts",
      },
    ],
    //
    catAxes: [{ catAxisHidden: true }, { showCatAxisTitle: false }],
  };
  // Add chart to the slide with specified options
  slide.addChart(chartData01, comboProps);

  /**
   *
   * @add second PIE chart
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
    x: 9.85,
    y: 0.5,
    w: 3,
    h: 3,
    title: `${pieData[0].category} Category`,
  });

  slide.addChart(pptx.charts.PIE, convertData(pieData[1]), {
    ...categoryOptions,
    x: 9.85,
    y: 4,
    w: 3,
    h: 3,
    title: `${pieData[1].category} Category`,
  });
}
