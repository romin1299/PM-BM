import { MONTH_LABELS, chartColors } from "../ChartUtils/chartEnums";
import {
  commonPptOptions,
  genNoDataFoundText,
  genSlideTitle,
  genSlideTitleFilterNames,
  genSlideTitleYearFilters,
} from "./exportPPTXOptions";
import axios from "axios";

export async function generateTMMTTRSkillPpt(pptx, urlOptions) {
  await genSlide01(pptx, urlOptions);
}

const fetchMTTRTrendData = async (urlOptions) => {
  const {
    flagForTogglingFilter,
    timeFilter,
    selectedValue,
    selectedYear,
    selectedSection,
    selectedSubSection,
  } = urlOptions;

  console.log("urlOptions:", urlOptions);
  const url = `/mttrTrend/tmMTTRSkill/${flagForTogglingFilter}/${selectedValue}/?selectedSection=${selectedSection}&&selectedSubSection=${selectedSubSection}`;
  // console.log("url:", url);
  const params = {
    // selectedSection,
    // selectedSubSection,
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
    flagForTogglingFilter,
    timeFilter,
    selectedValue,
    selectedYear,
    selectedSection,
    selectedSubSection,
    tmId,
  } = urlOptions;

  console.log("urlOptions:", urlOptions);
  const url = `/tmProgress/tmMTTRSkill/${flagForTogglingFilter}/${selectedValue}/${tmId}`;

  const params = {
    // selectedSection,
    // selectedSubSection,
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

    return [];
  } catch (error) {
    console.log("error:", error);
    return [];
  }
};

async function genSlide01(pptx, urlOptions) {
  let slide = pptx.addSlide();

  genSlideTitle(pptx, slide, "TM MTTR Skill Report");
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
  console.log("mttrTrendData:", mttrTrendData);
  // Add chart to the slide with specified options
  if (mttrTrendData.length > 0) {
    slide.addChart(pptx.ChartType.bar, mttrTrendData, mttrTrendOptions);
  } else {
    genNoDataFoundText(slide, { x: 0.5, y: 1.15, w: 5.95, h: 5.9 });
  }

  /**
   * @Second chart
   *
   */

  let tmProgressData = await fetchTMProgressData(urlOptions);

  if (urlOptions.tmId && tmProgressData.length > 0) {
    console.log("tmProgressData:", tmProgressData);

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
  } else {
    genNoDataFoundText(slide, {
      x: 6.95,
      y: 1.15,
      w: 5.95,
      h: 5.9,
    });
  }
}
