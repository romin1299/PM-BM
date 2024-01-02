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
import currentMonth from "../../../pages/Dashboard/DashboardComponent/currentMonth";
import ChartTitleBar from "../Common/ChartTitleBar";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { commonDatalabels } from "../../Utils/ChartUtils/chartOptions";

import { EXPORT_REPORT, exportPPTX } from "../../Utils/ExportPPTX/exportPPTX";

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
  plugins: {
    legend: {
      align: "end",
      labels: {
        usePointStyle: true,
      },
    },
    datalabels: commonDatalabels,
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
}) => {
  console.log(selectedValue, flagForTogglingFilter);

  const [dailyBreakdownTrendData, setDailyBreakdownTrendData] = useState({
    // labels: daysLabels,

    // dayWiseCount: getRandomDataArray(30),
    // lessThanOrEqualToOneHourData: getRandomDataArray(60),
    // greaterThenOneAndLessThanOrEqualToTwoHourData: getRandomDataArray(120),
    // greaterThenTwoHourData: getRandomDataArray(180),

    labels: [],

    dayWiseCount: [],
    lessThanOrEqualToOneHourData: [],
    greaterThenOneAndLessThanOrEqualToTwoHourData: [],
    greaterThenTwoHourData: [],
  });

  // const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const getDailyBreakdownTrendData = async () => {
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
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (
      selectedValue
      // &&
      // (flagForTogglingFilter === "based-on-cell" ||
      //   flagForTogglingFilter === "based-on-line")
    ) {
      getDailyBreakdownTrendData();
    }
  }, [selectedValue, selectedYear, dailyBDSelectedMonth]);

  const datasets = [
    {
      type: "line",
      label: "Total Count",
      data: dailyBreakdownTrendData?.dayWiseCount,
      backgroundColor: "rgba(202, 31, 75)",
      borderColor: chartColors[3],
      borderWidth: 2,
      fill: false,
      yAxisID: "y2",
    },
    {
      type: "bar",
      stack: "bar-stacked",
      label: "< 1",
      data: dailyBreakdownTrendData?.lessThanOrEqualToOneHourData,
      yAxisID: "y",
      backgroundColor: chartColors.orange[2],
    },
    {
      type: "bar",
      stack: "bar-stacked",
      label: "< 2",
      data: dailyBreakdownTrendData?.greaterThenOneAndLessThanOrEqualToTwoHourData,
      backgroundColor: chartColors.green[0],
      yAxisID: "y",
    },
    {
      type: "bar",
      stack: "bar-stacked",
      label: "> 2",
      data: dailyBreakdownTrendData?.greaterThenTwoHourData,
      backgroundColor: chartColors.aqua[1],
      yAxisID: "y",
    },
  ];

  const data = {
    labels: dailyBreakdownTrendData?.labels,
    datasets,
  };

  return (
    <Box className="cell p-3 mt-3 mb-0">
      <ChartTitleBar
        title="Daily Breakdown Trend"
        Toolbar={
          <Col className="col-auto">
            <MonthDropdown
              selectedMonth={dailyBDSelectedMonth}
              setSelectedMonth={setDailyBDSelectedMonth}
            />
          </Col>
        }
      />

      <div style={{ width: "100%", height: "300px" }}>
        <Chart data={data} options={options} plugins={[ChartDataLabels]} />
      </div>
    </Box>
  );
};

export default DailyBDTrendChart;
