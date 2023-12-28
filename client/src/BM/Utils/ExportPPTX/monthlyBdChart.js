import axios from "axios";
import { commonPptOptions } from "./exportPPTXOptions";
import { MONTH_LABELS } from "../ChartUtils/chartEnums";

const fetchMonthlyBDChartData = async (urlOptions) => {
  const { filter, currentTabViewName, sectionId, selectedYear } = urlOptions;

  const url =
    currentTabViewName === "Plant"
      ? `/${filter}MonthlyBdTrendForPlant`
      : `/${filter}MonthlyBdTrendForSection/based-on-subSection/${sectionId}`;

  const params = { selectedYear };

  try {
    const res = await axios.get(url, {
      params,
      withCredentials: true,
      credentials: "include",
    });

    const data = res?.data?.bdTrendData;
    if (data) {
      // console.log("Monthly hourly res:", res);
      return data?.map((item, index) => ({
        name: item?.label || item?._id,
        labels: MONTH_LABELS,
        values: item?.data,
      }));
    }

    return [];
  } catch (error) {
    console.log("error:", error);
    return [];
  }
};

export async function monthlyBdChart(pptx, slide, urlOptions) {
  const monthlyChartData = await fetchMonthlyBDChartData(urlOptions);

  const MonthlyBDChartOptions = {
    ...commonPptOptions,
    x: 0.5,
    y: 1.6,
    w: 8.4,
    h: 5.0,
    //
    title: "Monthly BD Trend",
    catAxisTitle: "Months",
    valAxisTitle: "BD Hours",
  };
  // Add chart to the slide with specified options
  slide.addChart(pptx.ChartType.bar, monthlyChartData, MonthlyBDChartOptions);
}
