import { genSlideDailyBDTrend } from "./dailyBdTrendSlide";
import { commonPptOptions } from "./exportPPTXOptions";

import { monthlyBdChart } from "./monthlyBdChart";

export async function generateKPIFromDBPpt(pptx, urlOptions) {
  await genSlideDailyBDTrend(pptx, {
    ...urlOptions,
    text: "KPI From Database",
  });
  await genSlide02(pptx, urlOptions);
}

async function genSlide02(pptx, urlOptions) {
  let slide = pptx.addSlide();

  await monthlyBdChart(pptx, slide, urlOptions);
}
