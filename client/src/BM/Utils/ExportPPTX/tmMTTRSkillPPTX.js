import { MONTH_LABELS, chartColors } from "../ChartUtils/chartEnums";
import { commonPptOptions, genSlideTitle } from "./exportPPTXOptions";
import axios from "axios";

export async function generateTMMTTRSkillPpt(pptx, urlOptions) {
  await genSlide01(pptx, urlOptions);
}

const fetchMTTRTrendData = async (urlOptions) => {
  const { selectedValue, selectedYear, mbdIncluded } = urlOptions;

  const url = `/mttrTrend/tmMTTRSkill/based-on-subSection/${selectedValue}`;
  const params = { selectedYear, includeMBD: mbdIncluded ? "include-mbd" : "" };

  try {
    const res = await axios.get(url, {
      params,
      withCredentials: true,
      credentials: "include",
    });

    const data = res?.data?.tmLoadData[0];
    console.log("data:", data);
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

async function genSlide01(pptx, urlOptions) {
  let slide = pptx.addSlide();

  genSlideTitle(pptx, slide, "TM MTTR Skill Report");

  /*
   * @add first chart
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
  console.log("mttrTrendOptions:", mttrTrendOptions);
  // Add chart to the slide with specified options
  slide.addChart(pptx.ChartType.bar, mttrTrendData, mttrTrendOptions);
  slide.addChart(pptx.ChartType.bar, mttrTrendData, {
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
