import { MONTH_LABELS } from "../ChartUtils/chartEnums";
import {
  commonPptOptions,
  genSlideTitleFilterNames,
  genSlideTitleYearFilters,
} from "./exportPPTXOptions";
import axios from "axios";

import { monthlyBdChart } from "./monthlyBdChart";
import { getRandomDataArray } from "../math/generateRandomValues";

export async function generateMonthlyBdPpt(pptx, urlOptions) {
  await genSlide01(pptx, urlOptions);
  await genSlide02(pptx, urlOptions);
}

async function genSlide01(pptx, urlOptions) {
  let slide = pptx.addSlide();

  /*
   * @add Title
   *
   */
  slide.addText(
    [
      {
        text: "Breakdown Trend",
        options: { fontSize: 32, breakLine: true },
      },
      {
        text: "Monthly & Yearly",
        options: { fontSize: 14, charSpacing: 6, breakLine: true },
      },
    ],
    {
      x: 0,
      y: 0,
      w: 13.33,
      h: 1,
      color: "FFFFFF",
      fill: { color: pptx.colors.ACCENT1, transparency: 5 },
      valign: "middle",
      align: "center",
      isTextBox: true,
    }
  );
  genSlideTitleFilterNames(pptx, slide, urlOptions, {
    x: 0.5,
    y: 0,
    w: 4,
    h: 1,
  });
  genSlideTitleYearFilters(pptx, slide, urlOptions, {
    x: 8.85,
    y: 0,
    w: 4,
    h: 1,
  });

  /**
   *
   * @first chart
   *
   */

  await monthlyBdChart(pptx, slide, urlOptions);

  /**
   *
   * @second chart
   *
   */
  const yearlyChartData = await fetchYearlyBDChartData(urlOptions);
  // console.log("yearlyChartData:", yearlyChartData);

  // const yearlyChartData = [
  //   {
  //     type: pptx.charts.BAR,
  //     data: [
  //       {
  //         name: "< 1",
  //         labels: data?.labels,
  //         values: data?.bdTrendData?.[0]?.data,
  //       },
  //       {
  //         name: "< 2",
  //         labels: data?.labels,
  //         values: data?.bdTrendData?.[1]?.data,
  //       },
  //       {
  //         name: "> 2",
  //         labels: data?.labels,
  //         values: data?.bdTrendData?.[2]?.data,
  //       },
  //     ],
  //     options: {
  //       chartColors: ["2f79bf", "bbd0e5", "2693ff", "ffcd38", "ff7b64"],
  //     },
  //   },
  //   {
  //     type: pptx.charts.LINE,
  //     data: [
  //       {
  //         name: "Target",
  //         labels: data?.labels,
  //         values: [8, 8],
  //       },
  //     ],
  //     options: {
  //       chartColors: ["F38940"],
  //       secondaryValAxis: true,
  //       secondaryCatAxis: true,
  //     },
  //   },
  // ];

  let comboProps = {
    ...commonPptOptions,
    x: 9.4,
    y: 1.6,
    w: 3.45,
    h: 5.0,
    //
    title: "Yearly BD Trend",
    //
    catAxisTitle: "Years",
    //
    valAxisTitle: "BD Hours",
  };
  // Add chart to the slide with specified options
  slide.addChart(yearlyChartData, comboProps);
}

async function genSlide02(pptx, urlOptions) {
  let slide = pptx.addSlide();

  let sectionNosChartOptions;

  const sectionNosChartData = await fetchSectionNosData(urlOptions);

  /*
   * @add Title
   *
   */
  slide.addText(
    [
      {
        text: "No. Of Sheets",
        options: { fontSize: 32, breakLine: true },
      },
      {
        text: "Section",
        options: { fontSize: 14, charSpacing: 6, breakLine: true },
      },
    ],
    {
      x: 0,
      y: 0,
      w: 13.33,
      h: 1,
      color: "FFFFFF",
      fill: { color: pptx.colors.ACCENT1, transparency: 5 },
      valign: "middle",
      align: "center",
      isTextBox: true,
    }
  );

  /*
   * @add first chart
   *
   */
  sectionNosChartOptions = {
    ...commonPptOptions,
    x: 0.5,
    y: 1.6,
    w: 12.35,
    h: 5.0,
    //
    title: "Section Nos ",
    catAxisTitle: "Months",
    valAxisTitle: "BD Hours",
  };
  // Add chart to the slide with specified options
  slide.addChart(sectionNosChartData, sectionNosChartOptions);
}

const fetchYearlyBDChartData = async (urlOptions) => {
  const { filter, flagForTogglingFilter, selectedValue, selectedYear } =
    urlOptions;

  const url = `/${filter}YearlyBdTrend/${flagForTogglingFilter}/${selectedValue}`;
  const params = { selectedYear };

  try {
    const res = await axios.get(url, {
      params,
      withCredentials: true,
      credentials: "include",
    });

    // console.log("res:", res);
    // setData(res?.data?.labels);

    const data = res?.data?.bdTrendData;
    const labels = res?.data?.labels;
    const target = res?.data?.bdTrendTarget;

    if (data) {
      const chartData = [
        {
          type: "bar",
          data: data?.map((item, index) => ({
            name: item?.label || item?._id,
            labels: labels,
            values: item?.data,
          })),
          options: {
            chartColors: ["2f79bf", "bbd0e5", "2693ff", "ffcd38", "ff7b64"],
          },
        },
        {
          type: "line",
          data: [
            {
              name: "Target",
              labels: labels,
              values: target || [7, 7],
            },
          ],
          options: {
            chartColors: ["F38940"],
          },
        },
      ];

      return chartData;
    }

    return [];
  } catch (error) {
    console.log("error:", error);

    return [];
  }
};

const fetchSectionNosData = async (urlOptions) => {
  const {
    flagForTogglingFilter,
    selectedValue,
    currentTabViewName,
    selectedYear,
  } = urlOptions;

  // console.log("sectionId:", sectionId);
  const labels = [
    "Apr-23",
    "May-23",
    "Jun-23",
    "Jul-23",
    "Aug-23",
    "Sep-23",
    "Oct-23",
    "Nov-23",
    "Dec-23",
    "Jan-24",
    "Feb-24",
    "Mar-24",
  ];

  console.log('currentTabViewName:', currentTabViewName)
  const url = `/majorBDCount${
    currentTabViewName === "Section" ? "ForSection" : ""
  }/${flagForTogglingFilter}/${selectedValue}`;
  console.log("url:", url);

  const params = { selectedYear };

  try {
    const res = await axios.get(url, {
      params,
      withCredentials: true,
      credentials: "include",
    });

    // console.log("labells:", res.data.labels);
    // setData(res?.data?.labels);

    const data = res?.data?.bdTrendData;
    if (data) {
      const chartData = [
        {
          type: "bar",
          data: data?.map((item, index) => ({
            name: item?.label || item?._id,
            labels: labels,
            values: item?.data,
          })),

          options: {
            chartColors: ["2f79bf", "bbd0e5", "2693ff", "ffcd38", "ff7b64"],
          },
        },
        {
          type: "line",
          data: [
            {
              name: "Target",
              labels: MONTH_LABELS,
              values: getRandomDataArray(12, 6, 6),
            },
          ],
          options: {
            chartColors: ["F38940"],
          },
        },
      ];
      // console.log("Monthly hourly res:", res);
      // return data?.map((item, index) => ({
      //   name: item?.label || item?._id,
      //   labels: labels,
      //   values: item?.data,
      // }));

      return chartData;
    }

    return [];
  } catch (error) {
    console.log("error:", error);

    return [];
  }
};
