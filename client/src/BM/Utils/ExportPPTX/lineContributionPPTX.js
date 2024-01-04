import { MONTH_LABELS, chartColors } from "../ChartUtils/chartEnums";
import { commonPptOptions } from "./exportPPTXOptions";
import axios from "axios";

export async function generateLineContributionPpt(pptx, urlOptions) {
  await genSlide01(pptx, urlOptions);
  await genSlide02(pptx, urlOptions);
}

const fetchPlantId = async ({ url }) => {
  try {
    const res = await axios.get(url, {
      withCredentials: true,
      credentials: "include",
    });

    if (res.status === 201) {
      return res?.data?.selectedValue;
    }
  } catch (error) {
    console.log("error:", error);
  }
};

const fetchPlantData = async (urlOptions) => {
  const { selectedYear } = urlOptions;

  const plantId = await fetchPlantId({
    url: `/getFiltrationValue/monthly-breakdown-filter/byDefault`,
  });

  const url = `/lineWiseBdContribution/based-on-plant/${plantId}`;
  const params = { selectedYear };

  try {
    const res = await axios.get(url, {
      params,
      withCredentials: true,
      credentials: "include",
    });

    const data = res?.data?.lineWiseBDData[0];
    if (data) {
      // return data?.map((item, index) => ({
      //   name: "% Contribution",
      //   labels: item?.lineNames,
      //   values: item?.percentages,
      // }));
      return data;
    }

    return [];
  } catch (error) {
    console.log("error:", error);
    return [];
  }
};
const fetchSectionData = async (urlOptions) => {
  const { selectedYear, selectedMonth, flagForTogglingFilter, selectedValue } =
    urlOptions;

  const url = `/lineWiseBdContribution/${flagForTogglingFilter}/${selectedValue}`;
  const params = { selectedYear, selectedMonth };

  try {
    const res = await axios.get(url, {
      params,
      withCredentials: true,
      credentials: "include",
    });

    const data = res?.data?.lineWiseBDData[0];
    if (data) {
      return data;

      // console.log("Monthly hourly res:", res);
      // return data?.map((item, index) => ({
      //   name: "% Contribution",
      //   labels: item?.lineNames,
      //   values: item?.percentages,
      // }));
    }

    return {};
  } catch (error) {
    console.log("error:", error);
    return {};
  }
};

async function genSlide01(pptx, urlOptions) {
  let slide = pptx.addSlide();
  let comboProps;

  /*
   * @add Title
   *
   */
  slide.addText(
    [
      {
        text: "Line Contribution",
        options: { fontSize: 32, breakLine: true },
      },
      {
        text: "Plant",
        options: { fontSize: 14, charSpacing: 4, breakLine: true },
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
  const data = await fetchPlantData(urlOptions);
  const chartData01 = [
    {
      type: pptx.charts.BAR,
      data: [
        {
          name: "% Contribution",
          labels: data?.lineNames,
          values: data?.percentages,
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
          name: "BD Hours",
          labels: data?.lineNames,
          values: data?.bdHours,
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
    catAxisTitle: "Lines",
    //
    title: "Plant: Line Contibution",
    //
    valAxes: [
      {
        showValAxisTitle: true,
        valAxisTitle: "% Contribution",
        valGridLine: { style: "none" },
      },
      {
        showValAxisTitle: true,
        valAxisTitle: "BD Hours",
      },
    ],
    //
    catAxes: [{ catAxisHidden: true }, { showCatAxisTitle: false }],
  };
  // Add chart to the slide with specified options
  slide.addChart(chartData01, comboProps);
}

async function genSlide02(pptx, urlOptions) {
  let slide = pptx.addSlide();
  let comboProps;

  /*
   * @add Title
   *
   */
  slide.addText(
    [
      {
        text: "Line Contribution",
        options: { fontSize: 32, breakLine: true },
      },
      {
        text: "Section",
        options: { fontSize: 14, charSpacing: 4, breakLine: true },
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

  const data = await fetchSectionData(urlOptions);
  console.log("data:", data);
  let chartData01 = [];
  console.log("chartData01.length:", chartData01.length);

  if (data) {
    chartData01 = [
      {
        type: pptx.charts.BAR,
        data: [
          {
            name: "% Contribution",
            labels: data?.lineNames,
            values: data?.percentages,
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
            name: "BD Hours",
            labels: data?.lineNames,
            values: data?.bdHours,
          },
        ],
        options: {
          chartColors: ["F38940"],
          secondaryValAxis: true,
          secondaryCatAxis: true,
        },
      },
    ];
  }
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
    catAxisTitle: "Lines",
    //
    title: "Section: Line Contibution",
    //
    valAxes: [
      {
        showValAxisTitle: true,
        valAxisTitle: "BD Hours",
      },
      {
        showValAxisTitle: true,
        valAxisTitle: "% Contribution",
        valGridLine: { style: "none" },
      },
    ],
    //
    catAxes: [{ catAxisHidden: true }, { showCatAxisTitle: false }],
  };
  // Add chart to the slide with specified options
  if (data) {
    slide.addChart(chartData01, comboProps);
  }
}
