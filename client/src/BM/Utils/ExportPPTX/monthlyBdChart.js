import axios from "axios";
import { commonPptOptions } from "./exportPPTXOptions";
import { MONTH_LABELS } from "../ChartUtils/chartEnums";
import { getRandomDataArray } from "../math/generateRandomValues";

const fetchMonthlyBDChartData = async (urlOptions) => {
  const { filter, flagForTogglingFilter, selectedValue, selectedYear } =
    urlOptions;

  const url = `/${filter}MonthlyBdTrend/${flagForTogglingFilter}/${selectedValue}`;
  // console.log("url:", url);

  const params = { selectedYear };

  try {
    const res = await axios.get(url, {
      params,
      withCredentials: true,
      credentials: "include",
    });

    const data = res?.data?.bdTrendData;
    const target = res?.data?.bdTrendTarget;

    if (data) {
      const chartData = [
        {
          type: "bar",
          data: data?.map((item, index) => ({
            name: item?.label || item?._id,
            labels: MONTH_LABELS,
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
              values: target || getRandomDataArray(12, 6, 6),
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

export async function monthlyBdChart(pptx, slide, urlOptions) {
  const monthlyBdChartData = await fetchMonthlyBDChartData(urlOptions);

  let comboProps = {
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
  slide.addChart(monthlyBdChartData, comboProps);
}
