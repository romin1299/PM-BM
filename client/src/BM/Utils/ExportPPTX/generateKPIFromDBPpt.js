import axios from "axios";
import { MONTH_LABELS } from "../ChartUtils/chartEnums";
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

  await monthlyBdChart(pptx, slide, urlOptions, {
    x: 0.5,
    y: 0.5,
    w: 5.95,
    h: 6.55,
  });

  /**
   *
   * @second_chart
   */

  const mttrData = await fetchMttrData(urlOptions);

  let comboProps = {
    ...commonPptOptions,
    x: 6.95,
    y: 0.5,
    w: 5.95,
    h: 6.55,
    //
    title: "Mean Time To Repair (MTTR)",
    catAxisTitle: "Months",
    valAxisTitle: "BD Hours",
  };
  // Add chart to the slide with specified options
  slide.addChart(mttrData, comboProps);

  // x: 6.95,
  // y: 0.5,
  // w: 5.95,
  // h: 6.55,
}

const fetchMttrData = async (urlOptions) => {
  const { filter, flagForTogglingFilter, selectedValue, selectedYear } =
    urlOptions;

  let filterMaker = {
    plant: "Plant",
    section: "Section",
    subSection: "Section",
    cell: "Cell",
    line: "Line",
  };

  let [, , currFilterState] = flagForTogglingFilter?.split("-");
  let filterFlag = filterMaker[currFilterState];

  const url = `/mttrFor${filterFlag}/kpiFromDatabase/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}`;
  // console.log("url:", url);

  const params = { selectedYear };

  try {
    const res = await axios.get(url, {
      // params,
      withCredentials: true,
      credentials: "include",
    });

    console.log("res:", res);

    const data = res?.data?.bdTrendData;
    const target = res?.data?.averageData;

    if (data) {
      const chartData = [
        {
          type: "bar",
          data: data?.map((item, index) => ({
            name: item?.label || item?._id,
            labels: MONTH_LABELS,
            values: item?.data.replaceZeroWithNull(),
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
              values: target,
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
