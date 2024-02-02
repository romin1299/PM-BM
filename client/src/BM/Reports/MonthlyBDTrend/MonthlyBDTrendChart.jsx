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
import { Box, Paper, Typography } from "@mui/material";
import { Row, Container, Col } from "react-bootstrap";
import { MONTH_LABELS, chartColors } from "../../Utils/ChartUtils/chartEnums";
import ChartDataLabels from "chartjs-plugin-datalabels";
import axios from "axios";
import DataNotFound from "../Common/DataNotFound";
import ChartTitleBar, { ChartDownloadMenu } from "../Common/ChartTitleBar";
import { commonDatalabels } from "../../Utils/ChartUtils/chartOptions";
import { getRandomDataArray } from "../../Utils/math/generateRandomValues";
import Loading from "../../../components/Loading/Loading";
import FilterSwitchButtons from "./FilterSwitchButtons";
import { isChartDataExist } from "../../Utils/functions/isChartDataExist";
import downloadFile from "../../../util";

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
  maxBarThickness: 100,
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
        text: "Months",
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
        text: "BD Hours",
      },
      ticks: {
        color: "black",
      },
    },
    // y2: {
    //   position: "right",
    //   ticks: {
    //     color: "black",
    //   },
    // },
  },
};

const MonthlyBDTrendChart = ({
  filterState,
  currentTabViewName,
  filter,
  setFilter,
  selectedYear,
  showFilterSwitch = false,
}) => {
  const [loading, setLoading] = React.useState(true);

  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });

  const { flagForTogglingFilter, selectedValue } = filterState;

  useEffect(() => {
    if (currentTabViewName === "Plant" && filter === "cell")
      setFilter("section");
    else if (currentTabViewName === "Section" && filter === "section")
      setFilter("cell");
  }, [currentTabViewName]);

  const fetchChartData = async () => {
    setLoading(true);

    // console.count("Monthly BD Report");
    // console.log("filterState:", filterState.flagForTogglingFilter);

    // let basedON = currentTabViewName === "Plant" ? "plantId" : "subSection";
    // const selectedId = currentTabViewName === "Plant" ? "undefined" : sectionId;

    // const url =
    //   currentTabViewName === "Plant"
    //     ? `/${filter}MonthlyBdTrend/based-on-plant/${sectionId}`
    //     : `/${filter}MonthlyBdTrend/based-on-subSection/${sectionId}`;

    const url = `/${filter}MonthlyBdTrend/${flagForTogglingFilter}/${selectedValue}`;
    // console.log("url:", url);

    const params = { selectedYear };

    try {
      const res = await axios.get(url, {
        params,
        withCredentials: true,
        credentials: "include",
        headers: { "content-type": "application/json" },
      });
      // console.log("monthly bd trend res:", res);

      const data = res?.data?.bdTrendData;

      const barDatasets = res?.data?.bdTrendData?.map((item, index) => ({
        type: "bar",
        stack: "bar-stacked",
        label: item?.label || item?._id,
        data: item?.data,
        backgroundColor: chartColors.monthlyBDTrend[index],
        borderRadius: 4,
      }));

      const targetData = res?.data?.bdTrendDataTarget;
      // const targetData = getRandomDataArray(12, 5, 8);

      if (data) {
        setChartData({
          labels: MONTH_LABELS,
          datasets: [
            {
              type: "line",
              label: "Target",
              data: targetData,
              borderWidth: 2,
              borderColor: chartColors.target2,
              backgroundColor: chartColors.target2,
              pointStyle: "rectRot",
            },
            ...barDatasets,
          ],
        });
      }
    } catch (error) {
      console.log("error:", error);
      setChartData({
        labels: [],
        datasets: [],
      });
    }

    setLoading(false);
  };

  const header = ["Labels", "Data"];
  const handleDownload = async (fileType) => {
    try {
      const bodyData = [chartData].map((item) => [
        item.datasets.map((a) => a.label).join("\n"),
        item.datasets.map((a) => a.data).join("\n"),
      ]);

      downloadFile(bodyData, fileType, header, "Monthly_Bd_Trend");
    } catch (error) {
      console.error("Error downloading data:", error);
    }
  };

  console.log("chartData:", chartData);

  useEffect(() => {
    if (flagForTogglingFilter && selectedValue && selectedYear && filter)
      fetchChartData();
  }, [flagForTogglingFilter, selectedValue, filter, selectedYear]);

  const isDataExists = isChartDataExist(chartData);

  // console.count("render");

  return (
    <Box className="container-fluid cell p-3">
      <ChartTitleBar
        title="Monthly Breakdown Trend"
        // titleProps={{
        //   sx: { fontWeight: "500" },
        // }}
        Toolbar={
          <>
            {showFilterSwitch && (
              <Col className="col-auto">
                <FilterSwitchButtons
                  filter={filter}
                  setFilter={setFilter}
                  filterState={filterState}
                />
              </Col>
            )}

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

      <Box sx={{ height: { xs: "300px", md: "350px" } }}>
        {loading ? (
          <Loading height={"100%"} />
        ) : !isDataExists ? (
          <DataNotFound />
        ) : (
          <Chart
            type="bar"
            options={options}
            data={chartData}
            plugins={[ChartDataLabels]}
          />
        )}
      </Box>
    </Box>
  );
};

export default MonthlyBDTrendChart;
