import React from "react";
import DownloadMenu from "../ManHourReport/SubComponents/DownloadMenu";
import { MONTH_LABELS, chartColors } from "../../Utils/ChartUtils/chartEnums";
import pptxgen from "pptxgenjs";
import { commonPptOptions } from "../../Utils/ChartUtils/exportAsPptx";
import axios from "axios";

const PptxMonthlyBDReport = ({
  filter,
  setFilter,
  currentTabViewName,
  sectionId,
  selectedYear,
}) => {
    console.log("For update----");

  const fetchMonthlyBDChartData = async () => {
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

  const fetchYearlyBDChartData = async () => {
    console.log("sectionId:", sectionId);
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

  const fetchSectionNosData = async () => {
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

  async function genSlide01(pptx) {
    let slide = pptx.addSlide();

    let yearlyBDChartOptions;
    let MonthlyBDChartOptions;

    const monthlyChartData = await fetchMonthlyBDChartData();
    const yearlyChartData = await fetchYearlyBDChartData();

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
    MonthlyBDChartOptions = {
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

  async function genSlide02(pptx) {
    let slide = pptx.addSlide();

    let sectionNosChartOptions;

    const sectionNosChartData = await fetchSectionNosData();

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

  async function generatePPTX() {
    const pptx = new pptxgen();
    pptx.layout = "LAYOUT_WIDE";

    await genSlide01(pptx);
    await genSlide02(pptx);

    // Save the PPT file
    pptx.writeFile({
      fileName: `Man-Hour-Report_${new Date().toISOString()}.pptx`,
      compression: true,
    });
  }

  return <DownloadMenu handleDownloadPPTX={generatePPTX} />;
};

export default PptxMonthlyBDReport;
