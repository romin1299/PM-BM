import axios from "axios";
import { commonPptOptions } from "./exportPPTXOptions";

const fetchDailyBdTrendData = async (urlOptions) => {
  const { selectedYear, selectedMonth, flagForTogglingFilter, selectedValue } =
    urlOptions;

  const url = `/getDailyBreakdownTrendData/${flagForTogglingFilter}/${selectedValue}`;
  const params = { selectedYear, selectedMonth };

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

  /*
   * @add Title
   *
   */
  slide.addText(
    [
      {
        text: "Product/Line Wise KPI",
        options: { fontSize: 32, breakLine: true },
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
  const data = await fetchDailyBdTrendData(urlOptions);

  const chartData01 = [
    {
      type: pptx.charts.BAR,
      data: [
        {
          name: "< 1",
          labels: data?.labels,
          values: data?.lessThanOrEqualToOneHourData,
        },
        {
          name: "< 2",
          labels: data?.labels,
          values: data?.greaterThenOneAndLessThanOrEqualToTwoHourData,
        },
        {
          name: "> 2",
          labels: data?.labels,
          values: data?.greaterThenTwoHourData,
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
          values: data?.dayWiseCount,
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
    y: 1.6,
    w: 12.3,
    h: 5.0,
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
