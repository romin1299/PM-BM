import { MONTH_LABELS } from "../ChartUtils/chartEnums";
import { commonPptOptions } from "./exportPPTXOptions";
import axios from "axios";

import { monthlyBdChart } from "./monthlyBdChart";

export async function generateMonthlyBdPpt(pptx, urlOptions) {
  await genSlide01(pptx, urlOptions);
  await genSlide02(pptx, urlOptions);
}

async function genSlide01(pptx, urlOptions) {
  let slide = pptx.addSlide();

  let yearlyBDChartOptions;
  const yearlyChartData = await fetchYearlyBDChartData(urlOptions);

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

  /*
   * @add first chart
   *
   */

  await monthlyBdChart(pptx, slide, urlOptions);

  /*
   * @add second chart
   *
   */
  yearlyBDChartOptions = {
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
  slide.addChart(pptx.ChartType.bar, yearlyChartData, yearlyBDChartOptions);
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
  slide.addChart(
    pptx.ChartType.bar,
    sectionNosChartData,
    sectionNosChartOptions
  );
}

const fetchYearlyBDChartData = async (urlOptions) => {
  const { filter, setFilter, currentTabViewName, sectionId, selectedYear } =
    urlOptions;

  // console.log("sectionId:", sectionId);
  const url =
    currentTabViewName === "Plant"
      ? `/${filter}YearlyBdTrendForPlant`
      : `/${filter}YearlyBdTrendForSection/based-on-subSection/${sectionId}`;

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
      // console.log("Monthly hourly res:", res);
      return data?.map((item, index) => ({
        name: item?.label || item?._id,
        labels: res?.data?.labels,
        values: item?.data,
      }));
    }

    return [];
  } catch (error) {
    console.log("error:", error);

    return [];
  }
};

const fetchSectionNosData = async (urlOptions) => {
  const { filter, setFilter, currentTabViewName, sectionId, selectedYear } =
    urlOptions;

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

  const url =
    currentTabViewName === "Plant"
      ? `/majorBDCountForPlant`
      : `/majorBDCountForSection/based-on-subSection/${sectionId}`;

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
      // console.log("Monthly hourly res:", res);
      return data?.map((item, index) => ({
        name: item?.label || item?._id,
        labels: labels,
        values: item?.data,
      }));
    }

    return [];
  } catch (error) {
    console.log("error:", error);

    return [];
  }
};
