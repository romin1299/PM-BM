import axios from "axios";
import {
  commonPptOptions,
  genSlideTitle,
  genSlideTitleFilterNames,
  genSlideTitleYearFilters,
} from "./exportPPTXOptions";

const fetchDailyBdTrendData = async (urlOptions) => {
  const {
    selectedYear,
    dailyBDSelectedMonth,
    flagForTogglingFilter,
    selectedValue,
  } = urlOptions;

  const url = `/getDailyBreakdownTrendData/${flagForTogglingFilter}/${selectedValue}`;
  const params = { selectedYear, selectedMonth: dailyBDSelectedMonth };

  try {
    const res = await axios.get(url, {
      params,
      withCredentials: true,
      credentials: "include",
    });

    const data = res?.data?.dailyBreakdownTrendData;
    if (data) {
      return data;
    }

    return [];
  } catch (error) {
    console.log("error:", error);
    return [];
  }
};

export async function genSlideDailyBDTrend(pptx, urlOptions) {
  let slide = pptx.addSlide();
  let comboProps;

  console.log("urlOptions:", urlOptions);

  genSlideTitle(pptx, slide, urlOptions?.text);
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

  /*
   * @add first chart
   *
   */
  const data = await fetchDailyBdTrendData(urlOptions);

  const chartData01 = [
    {
      type: pptx.charts.BAR,
      data: [
        {
          name: "< 1",
          labels: data?.labels,
          values: data?.lessThanOrEqualToOneHourData.replaceZeroWithNull(),
        },
        {
          name: "< 2",
          labels: data?.labels,
          values:
            data?.greaterThenOneAndLessThanOrEqualToTwoHourData.replaceZeroWithNull(),
        },
        {
          name: "> 2",
          labels: data?.labels,
          values: data?.greaterThenTwoHourData.replaceZeroWithNull(),
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
          values: data?.dayWiseCount.replaceZeroWithNull(),
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
    y: 1.1,
    w: 12.3,
    h: 6.0,
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
}
