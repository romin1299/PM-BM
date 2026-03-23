import { MONTH_LABELS, chartColors } from "../ChartUtils/chartEnums";
import { commonPptOptions, genSlideTitle, genSlideTitleFilterNames, genSlideTitleYearFilters } from "./exportPPTXOptions";
import axios from "axios";

export async function generateTopMachineBdPpt(pptx, urlOptions) {
  await genSlide01(pptx, urlOptions);
}

const fetchHourTrendData = async (urlOptions) => {
  const { flagForTogglingFilter, selectedValue, selectedYear, selectedMonth } =
    urlOptions;

  const url = `/topMachineBreakdown/${flagForTogglingFilter}/${selectedValue}`;
  const params = { selectedYear, selectedMonth, documentLimitInTheGraph: 20 };

  try {
    const res = await axios.get(url, {
      params,
      withCredentials: true,
      credentials: "include",
    });

    const data = res?.data?.topMachineBd;
    // console.log("data:", data);
    if (data) {
      return [
        {
          name: "BM",
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
    w: 12.3,
    h: 5.9,
    //
    showLegend: false,
    chartColors: "#2f79bf",
    title: "Counts",
    catAxisTitle: "Machines",
    valAxisTitle: "Hours",
  };

  // Add chart to the slide with specified options
  slide.addChart(pptx.ChartType.bar, hourTrendData, chartOptions01);
}
