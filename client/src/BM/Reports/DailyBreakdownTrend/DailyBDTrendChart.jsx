import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import { Box } from "@mui/material";
import { Col } from "react-bootstrap";
import { chartColors } from "../../Utils/ChartUtils/chartEnums";

import { MonthDropdown } from "../ManHourReport/SubComponents/LineSelectionDropdown";
import ChartTitleBar, { ChartDownloadMenu } from "../Common/ChartTitleBar";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { commonDatalabels } from "../../Utils/ChartUtils/chartOptions";

import Loading from "../../../components/Loading/Loading";
import DataNotFound from "../Common/DataNotFound";
import { isChartDataExist } from "../../Utils/functions/isChartDataExist";
import downloadFile from "../../../util";
import { CSVLink, CSVDownload } from "react-csv";
import findFilters from "../../../filterNames";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const options = {
  maintainAspectRatio: false,
  responsive: true,
  interaction: {
    mode: "index",
    intersect: false,
  },
  plugins: {
    legend: {
      align: "end",
      labels: {
        usePointStyle: true,
      },
    },
    datalabels: {
      ...commonDatalabels,
      // color: chartColors.dailyBDTrendFont
    },
  },
  // elements: {
  //   bar: {
  //     borderColor: "000",
  //     borderWidth: 1,
  //   },
  // },
  scales: {
    x: {
      stacked: true,
      grid: {
        display: false,
      },
      title: {
        display: true,
        text: "Days",
      },
      ticks: {
        color: "black",
      },
    },
    y: {
      stacked: true,
      grid: {
        display: false,
      },
      position: "left",
      title: {
        display: true,
        text: "Hours",
      },
      ticks: {
        color: "black",
      },
    },
    y2: {
      position: "right",
      grid: {
        display: false,
      },
      title: {
        display: true,
        text: "Count",
      },
      ticks: {
        color: "black",
      },
    },
  },
};

const daysLabels = Array.from({ length: 30 }, (_, i) => (i + 1).toString());

const getRandomDataArray = (max = 30) => {
  return Array.from({ length: 30 }, () => Math.floor(Math.random() * max));
};

const DailyBDTrendChart = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
  // selectedMonth,
  // dailyBDSelectedMonth,
  // setDailyBDSelectedMonth
  setDailyBDSelectedMonth,
  dailyBDSelectedMonth,
  filterValues,
  userDetails,
}) => {
  let initialState = {
    labels: [],

    dayWiseCount: [],
    lessThanOrEqualToOneHourData: [],
    greaterThenOneAndLessThanOrEqualToTwoHourData: [],
    greaterThenTwoHourData: [],
  };

  const [loading, setLoading] = React.useState(true);
  const [dailyBreakdownTrendData, setDailyBreakdownTrendData] =
    useState(initialState);

  // const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const { filteredValuesWithHOD, filteredValues } = findFilters(
    flagForTogglingFilter,
    filterValues,
    selectedValue
  );

  let arrayItems;
  let filterHeaders;

  if (userDetails.tm_grade === "HOD") {
    arrayItems = [
      userDetails?.plant_data.split("-")?.[0],
      ...filteredValuesWithHOD,
    ];
    // filterHeaders = ["Plant", "Section", "Sub-Section", "Cell", "Line"];
  } else {
    arrayItems = [
      userDetails?.plant_data.split("-")?.[0],
      userDetails?.section_data.split("-")?.[1],
      ...filteredValues,
    ];
    // filterHeaders = ["Plant", "Section", "Sub-Section", "Cell", "Line"];
  }

  const getDailyBreakdownTrendData = async () => {
    setLoading(true);

    try {
      const res = await fetch(
        // `/getDailyBreakdownTrendData/${flagForTogglingFilter}/632c41261d1becfedab325f9/?selectedYear=${selectedYear}&&selectedMonth=${selectedMonth}`,
        `/getDailyBreakdownTrendData/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}&&selectedMonth=${dailyBDSelectedMonth}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const { message, dailyBreakdownTrendData } = await res.json();

      if (res?.status === 201) {
        setDailyBreakdownTrendData(dailyBreakdownTrendData);
      } else {
        setDailyBreakdownTrendData(initialState);
      }
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  const header = ["Days"].concat(dailyBreakdownTrendData?.labels);
  const handleDownload = async (fileType) => {
    try {
      let bodyData = [];
      let filterData = [];

      if (fileType === "csv") {
        bodyData = [
          ["Filters", ...arrayItems]?.toString() + "\n",
          ["\n"],
          [["Days"].concat(dailyBreakdownTrendData?.labels)?.toString() + "\n"],

          [
            ["Total Counts"]
              .concat(dailyBreakdownTrendData?.dayWiseCount)
              ?.toString() + "\n",
          ],
          [
            ["<1"]
              .concat(dailyBreakdownTrendData?.lessThanOrEqualToOneHourData)
              ?.toString() + "\n",
          ],
          [
            ["<2"]
              .concat(
                dailyBreakdownTrendData?.greaterThenOneAndLessThanOrEqualToTwoHourData
              )
              ?.toString() + "\n",
          ],
          [
            [">2"]
              .concat(dailyBreakdownTrendData?.greaterThenTwoHourData)
              ?.toString() + "\n",
          ],
        ];
      } else {
        bodyData = [
          ["Total Counts"].concat(dailyBreakdownTrendData?.dayWiseCount),
          ["<1"].concat(dailyBreakdownTrendData?.lessThanOrEqualToOneHourData),
          ["<2"].concat(
            dailyBreakdownTrendData?.greaterThenOneAndLessThanOrEqualToTwoHourData
          ),
          [">2"].concat(dailyBreakdownTrendData?.greaterThenTwoHourData),
        ];
        filterData = ["Filters", ...arrayItems];
      }

      downloadFile(
        filterData,
        bodyData,
        fileType,
        header,
        `Daily_Breakdown_Trend_${dailyBDSelectedMonth}`
      );
    } catch (error) {
      console.error("Error downloading data:", error);
    }
  };

  useEffect(() => {
    setLoading(false);
    if (
      selectedValue
      // &&
      // (flagForTogglingFilter === "based-on-cell" ||
      //   flagForTogglingFilter === "based-on-line")
    ) {
      getDailyBreakdownTrendData();
    }
  }, [selectedValue, selectedYear, dailyBDSelectedMonth]);

  // const datasets = [
  //   {
  //     type: "line",
  //     label: "Total Count",
  //     data: dailyBreakdownTrendData?.dayWiseCount,
  //     backgroundColor: chartColors.count,
  //     borderColor: chartColors.count,
  //     borderWidth: 2,
  //     fill: false,
  //     yAxisID: "y2",
  //   },
  //   {
  //     type: "bar",
  //     stack: "bar-stacked",
  //     label: "< 1",
  //     yAxisID: "y",
  //     data: dailyBreakdownTrendData?.lessThanOrEqualToOneHourData,
  //     backgroundColor: chartColors.dailyBDTrend[0],
  //     // borderColor: chartColors.dailyBDTrendBorder[0],
  //     // borderWidth: 1,
  //     borderRadius: 4,
  //   },
  //   {
  //     type: "bar",
  //     stack: "bar-stacked",
  //     label: "< 2",
  //     yAxisID: "y",
  //     data: dailyBreakdownTrendData?.greaterThenOneAndLessThanOrEqualToTwoHourData,
  //     backgroundColor: chartColors.dailyBDTrend[1],
  //     // borderColor: chartColors.dailyBDTrendBorder[1],
  //     // borderWidth: 1,
  //     borderRadius: 4,
  //   },
  //   {
  //     type: "bar",
  //     stack: "bar-stacked",
  //     label: "> 2",
  //     yAxisID: "y",
  //     data: dailyBreakdownTrendData?.greaterThenTwoHourData,
  //     backgroundColor: chartColors.dailyBDTrend[2],
  //     // borderColor: chartColors.dailyBDTrendBorder[2],
  //     // borderWidth: 1,
  //     borderRadius: 4,
  //   },
  // ];

  /*
   * ***********  COLORS  ***********
   * 1. FF1744  3949AB  43A047  FFD740
   * 2. 000000  0F6292  16FF00  FFED00
   * 3. D04848  34aa30  eccc14  1f6fdf
   * ********************************
   */

  const datasets = [
    {
      type: "line",
      label: "Total Count",
      // data: [1, 2, 3, 3, 4, 4, 4],
      data: dailyBreakdownTrendData?.dayWiseCount,
      backgroundColor: "#db3131",
      borderColor: "#db3131",
      // borderColor: "#db3131",
      borderWidth: 2,
      fill: false,
      yAxisID: "y2",
    },
    {
      type: "bar",
      stack: "bar-stacked",
      label: "< 1",
      yAxisID: "y",
      // data: [1, 2, 3, 3, 4, 4, 4],
      data: dailyBreakdownTrendData?.lessThanOrEqualToOneHourData,
      backgroundColor: "#f8f85d",
      borderColor: "#312A7D",
      borderWidth: 2,
      borderRadius: 4,
      
      // backgroundColor: "#8EBA0E",
      // (context) => {
      //   const chart = context.chart;
      //   const { ctx, chartArea } = chart;

      //   console.log(ctx);

      //   if (!chartArea) {
      //     // This case happens on initial chart load
      //     return;
      //   }

      //   let width, height, gradient;

      //   const chartWidth = chartArea.right - chartArea.left;
      //   const chartHeight = chartArea.bottom - chartArea.top;
      //   if (!gradient || width !== chartWidth || height !== chartHeight) {
      //     // Create the gradient because this is either the first render
      //     // or the size of the chart has changed
      //     width = chartWidth;
      //     height = chartHeight;
      //     gradient = ctx.createLinearGradient(
      //       0,
      //       chartArea.bottom,
      //       0,
      //       chartArea.top
      //     );
      //     gradient.addColorStop(0.5, "yellow");
      //     gradient.addColorStop(1, "red");
      //   }

      //   return gradient;
      // },
      
    },
    {
      type: "bar",
      stack: "bar-stacked",
      label: "< 2",
      yAxisID: "y",
      // data: [1, 2, 3, 3, 4, 4, 4],
      // data: dailyBreakdownTrendData?.lessThanOrEqualToOneHourData,
      data: dailyBreakdownTrendData?.greaterThenOneAndLessThanOrEqualToTwoHourData,
      // backgroundColor: "#f7cf69",
      backgroundColor: "#eb8f18",
      // borderColor: chartColors.dailyBDTrendBorder[1],
      borderWidth: 2,
      borderColor: "#312A7D",
      borderRadius: 4,
    },
    {
      type: "bar",
      stack: "bar-stacked",
      label: "> 2",
      yAxisID: "y",
      // data: [1, 2, 3, 3, 4, 4, 4, 10],
      data: dailyBreakdownTrendData?.lessThanOrEqualToOneHourData,
      // data: dailyBreakdownTrendData?.greaterThenTwoHourData,
      borderColor: "#312A7D",
      backgroundColor: "#eb6b6b",
      // borderColor: chartColors.dailyBDTrendBorder[2],
      borderWidth: 2,
      borderRadius: 4,
    },
  ];

  const data = {
    // labels: ["a", "b", "c", "d", "e", "f", "g"],
    labels: dailyBreakdownTrendData?.labels,
    datasets,
  };
  const isDataExists = isChartDataExist(data);

  return (
    <Box className="cell p-3 mt-3 mb-0">
      <ChartTitleBar
        title="Daily Breakdown Trend"
        Toolbar={
          <>
            <Col className="col-auto">
              <MonthDropdown
                selectedMonth={dailyBDSelectedMonth}
                setSelectedMonth={setDailyBDSelectedMonth}
              />
            </Col>
            <div className="col-auto">
              <ChartDownloadMenu
                handleDownloadCSV={() => {
                  handleDownload("csv");
                }}
                handleDownloadPDF={() => {
                  handleDownload("pdf");
                }}
              />
            </div>
          </>
        }
      />

      {/* <div style={{ width: "100%", height: "300px" }}>
        {loading ? (
          <Loading />
        ) : (
          <Chart data={data} options={options} plugins={[ChartDataLabels]} />
        )}
      </div> */}

      {/* {loading ? (
        <Loading height={300} />
      ) : (
        <Box sx={{ height: { xs: "300px", md: "400px" } }}>
          {data === undefined || Object.keys(data).length === 0 ? (
            <DataNotFound />
          ) : (
            <Chart data={data} options={options} plugins={[ChartDataLabels]} />
          )}
        </Box>
      )} */}

      <Box sx={{ height: { xs: "250px", md: "300px" } }}>
        {loading ? (
          <Loading height={"100%"} />
        ) : !isDataExists ? (
          <DataNotFound />
        ) : (
          <Chart data={data} options={options} plugins={[ChartDataLabels]} />
        )}
      </Box>
    </Box>
  );
};

export default DailyBDTrendChart;
