import { MONTH_LABELS, chartColors } from "../ChartUtils/chartEnums";
import { commonPptOptions, genSlideTitle } from "./exportPPTXOptions";
import axios from "axios";

export async function generateTMMTTRSkillPpt(pptx, urlOptions) {
  await genSlide01(pptx, urlOptions);
}

const fetchMTTRTrendData = async (urlOptions) => {
  const { flagForTogglingFilter, timeFilter, selectedValue, selectedYear } =
    urlOptions;

  // console.log("timeFilter:", timeFilter);
  const url = `/mttrTrend/tmMTTRSkill/${flagForTogglingFilter}/${selectedValue}`;
  const params = {
    selectedYear: selectedYear,
    time: timeFilter,
  };

  try {
    const res = await axios.get(url, {
      params,
      withCredentials: true,
      credentials: "include",
    });
    // console.log("res:", res);

    const data = res?.data?.data;
    // console.log("data:", data);
    if (data) {
      return [
        {
          name: "MTTR Hour",
          labels: data?.tm_names,
          values: data?.data,
        },
      ];
    }

    return [];
  } catch (error) {
    console.log("error:", error);
    return [];
  }
};

const fetchTMProgressData = async (urlOptions) => {
  const {
    tmId,
    flagForTogglingFilter,
    timeFilter,
    selectedValue,
    selectedYear,
  } = urlOptions;

  const url = `/tmProgress/tmMTTRSkill/${flagForTogglingFilter}/${selectedValue}/${tmId}`;
  const params = {
    selectedYear,
    time: timeFilter,
  };

  try {
    const res = await axios.get(url, {
      params,
      withCredentials: true,
      credentials: "include",
    });

    const data = res?.data?.data;
    // console.log("data:", data);
    if (data) {
      return [
        {
          name: "MTTR Hour",
          labels: data?.labels,
          values: data?.data,
        },
      ];
    }
  } catch (error) {
    console.log("error:", error);
  }
};

async function genSlide01(pptx, urlOptions) {
  let slide = pptx.addSlide();

  genSlideTitle(pptx, slide, "TM MTTR Skill Report");

  /**
   * @first chart
   *
   */
  let mttrTrendData = await fetchMTTRTrendData(urlOptions);

  let mttrTrendOptions = {
    ...commonPptOptions,
    x: 0.5,
    y: 1.15,
    w: 5.95,
    h: 5.9,
    //
    title: "MTTR Trend",
    catAxisTitle: "Team Members",
    valAxisTitle: "Hours",
    //
    chartColors: ["2f79bf"],
  };
  // console.log("mttrTrendOptions:", mttrTrendOptions);
  // Add chart to the slide with specified options
  slide.addChart(pptx.ChartType.bar, mttrTrendData, mttrTrendOptions);

  /**
   * @Second chart
   *
   */

  let tmProgressData = await fetchTMProgressData(urlOptions);
  // console.log("tmProgressData:", tmProgressData);

  slide.addChart(pptx.ChartType.line, tmProgressData, {
    ...commonPptOptions,
    x: 6.95,
    y: 1.15,
    w: 5.95,
    h: 5.9,
    //
    title: "TM Progress",
    catAxisTitle: "Months",
    valAxisTitle: "Hours",
    //
    chartColors: ["2f79bf"],
  });
}
