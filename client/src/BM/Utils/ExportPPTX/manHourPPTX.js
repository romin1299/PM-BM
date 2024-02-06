import { MONTH_LABELS } from "../ChartUtils/chartEnums";
import {
  commonPptOptions,
  genSlideTitle,
  genSlideTitleFilterNames,
  genSlideTitleYearFilters,
} from "./exportPPTXOptions";
import axios from "axios";

export async function generateManHourPpt(pptx, urlOptions) {
  await genSlide01(pptx, urlOptions);
  await genSlide02(pptx, urlOptions);
}

/**
 *
 * @First - Slide
 *
 */

const fetchHourTrendData = async (urlOptions) => {
  const { flagForTogglingFilter, selectedValue, selectedYear } = urlOptions;

  const url = `/manHourReport/hourTrend/${flagForTogglingFilter}/${selectedValue}`;
  const params = { selectedYear };

  try {
    const res = await axios.get(url, {
      params,
      withCredentials: true,
      credentials: "include",
    });

    const data = res?.data?.hourTrendData;
    if (data) {
      return [
        {
          name: "BM",
          labels: MONTH_LABELS,
          values: data?.BMHourTrend.replaceZeroWithNull(),
        },
        {
          name: "PM",
          labels: MONTH_LABELS,
          values: data?.PMHourTrend.replaceZeroWithNull(),
        },
      ];
    }

    return [];
  } catch (error) {
    console.log("error:", error);
    return [];
  }
};

const fetchManHourTrendData = async (urlOptions) => {
  const { flagForTogglingFilter, selectedValue, selectedYear } = urlOptions;

  const url = `/manHourReport/manHourTrend/${flagForTogglingFilter}/${selectedValue}`;
  const params = { selectedYear };

  try {
    const res = await axios.get(url, {
      params,
      withCredentials: true,
      credentials: "include",
    });

    const data = res?.data?.manHourTrendData;
    if (data) {
      return [
        {
          name: "BM",
          labels: MONTH_LABELS,
          values: data?.BMManHourTrend.replaceZeroWithNull(),
        },
        {
          name: "PM",
          labels: MONTH_LABELS,
          values: data?.PMManHourTrend.replaceZeroWithNull(),
        },
      ];
    }

    return [];
  } catch (error) {
    console.log("error:", error);
    return [];
  }
};

async function genSlide01(pptx, urlOptions) {
  let slide = pptx.addSlide();

  genSlideTitle(pptx, slide, "Man Hour Report");
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
  let hourTrendData = await fetchHourTrendData(urlOptions);

  let chartOptions01 = {
    ...commonPptOptions,
    x: 0.5,
    y: 1.15,
    w: 5.95,
    // h: 2.75,
    h: 5.9,
    //
    title: "Hour Trend",
    catAxisTitle: "Months",
    valAxisTitle: "Hours",
  };

  // Add chart to the slide with specified options
  slide.addChart(pptx.ChartType.bar, hourTrendData, chartOptions01);

  /**
   *
   * @add Second chart
   *
   */
  let chartData02 = await fetchManHourTrendData(urlOptions);

  let chartOptions02 = {
    ...commonPptOptions,
    x: 6.95,
    y: 1.15,
    w: 5.95,
    // h: 2.75,
    h: 5.9,
    //
    title: "Man-Hour Trend",
    catAxisTitle: "Months",
    valAxisTitle: "Hours",
  };

  // Add chart to the slide with specified options
  slide.addChart(pptx.ChartType.bar, chartData02, chartOptions02);
}

/**
 *
 * @add Second - Slide
 *
 */

const fetchLineTrendData = async (urlOptions) => {
  const { flagForTogglingFilter, selectedValue, selectedYear } = urlOptions;

  const url = `/manHourReport/lineTrend/${flagForTogglingFilter}/${selectedValue}`;
  const params = { selectedYear };

  try {
    const res = await axios.get(url, {
      params,
      withCredentials: true,
      credentials: "include",
    });

    const data = res?.data?.BMLineTrend;
    if (data) {
      return data;
    }

    return [];
  } catch (error) {
    console.log("error:", error);
    return [];
  }
};

const fetchTMHourTrendData = async (urlOptions) => {
  const { flagForTogglingFilter, selectedValue, selectedYear } = urlOptions;

  const url = `/manHourReport/tmLoad/${flagForTogglingFilter}/${selectedValue}`;
  const params = { selectedYear };

  try {
    const res = await axios.get(url, {
      params,
      withCredentials: true,
      credentials: "include",
    });

    const data = res?.data?.tmLoadData;
    if (data) {
      return data;
    }

    return [];
  } catch (error) {
    console.log("error:", error);
    return [];
  }
};

async function genSlide02(pptx, urlOptions) {
  let slide = pptx.addSlide();

  /**
   *
   * @first chart
   *
   */
  let data = await fetchLineTrendData(urlOptions);
  console.log("pptx.charts.BAR:", pptx.charts.LINE);
  let lineTrendData = [
    {
      type: pptx.charts.BAR,
      data: [
        {
          name: "BM",
          labels: data?.lines,
          values: data?.totalSumOf_BM.replaceZeroWithNull(),
        },
        {
          name: "PM",
          labels: data?.lines,
          values: data?.totalSumOf_PM.replaceZeroWithNull(),
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
          labels: data?.lines,
          values: data?.percentage.replaceZeroWithNull(),
        },
      ],
      options: {
        chartColors: ["F38940"],
        secondaryValAxis: true,
        secondaryCatAxis: true,
      },
    },
  ];

  let lineTrendOptions = {
    ...commonPptOptions,
    x: 0.5,
    y: 0.5,
    w: 5.95,
    h: 6.55,
    //
    title: "Line Trend",
    catAxisTitle: "Lines",
    valAxisTitle: "Hours",
    //
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
    //
    catAxes: [{ catAxisHidden: true }, { showCatAxisTitle: false }],
  };

  // Add chart to the slide with specified options
  slide.addChart(lineTrendData, lineTrendOptions);

  /**
   *
   * @second_chart
   *
   */
  let data02 = await fetchTMHourTrendData(urlOptions);
  console.log("data02:", data02);
  let TMHourData = [
    {
      type: pptx.charts.BAR,
      data: [
        {
          name: "BM",
          labels: data02?.tm_names,
          values: data02?.totalSumOf_BM.replaceZeroWithNull(),
        },
        {
          name: "PM",
          labels: data02?.tm_names,
          values: data02?.totalSumOf_PM.replaceZeroWithNull(),
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
          name: "Percentage",
          labels: data02?.tm_names,
          values: data02?.percentage.replaceZeroWithNull(),
        },
      ],
      options: {
        chartColors: ["F38940"],
        secondaryValAxis: true,
        secondaryCatAxis: true,
      },
    },
  ];

  let TMHourTrendOptions = {
    ...commonPptOptions,
    x: 6.95,
    y: 0.5,
    w: 5.95,
    h: 6.55,
    //
    title: "TM Hour Trend",
    catAxisTitle: "TM Names",
    valAxisTitle: "Hours",
    //
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
    //
    catAxes: [{ catAxisHidden: true }, { showCatAxisTitle: false }],
  };

  // Add chart to the slide with specified options
  slide.addChart(TMHourData, TMHourTrendOptions);
}
