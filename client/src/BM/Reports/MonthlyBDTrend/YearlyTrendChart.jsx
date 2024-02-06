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
import { Row } from "react-bootstrap";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { MONTH_LABELS, chartColors } from "../../Utils/ChartUtils/chartEnums";
import axios from "axios";
import DataNotFound from "../Common/DataNotFound";
import ChartTitleBar, { ChartDownloadMenu } from "../Common/ChartTitleBar";
import { commonDatalabels } from "../../Utils/ChartUtils/chartOptions";
import { getRandomDataArray } from "../../Utils/math/generateRandomValues";
import Loading from "../../../components/Loading/Loading";
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
  scales: {
    x: {
      stacked: true,
      grid: {
        display: false,
      },
      title: {
        display: true,
        text: "Financial Year",
      },
      ticks: {
        color: "black",
      },
    },
    y: {
      stacked: true,
      position: "left",
      ticks: {
        color: "black",
      },
    },
  },
};

const YearlyTrendChart = ({
  filterState,
  currentTabViewName,
  sectionId,
  filter,
  setFilter,
  selectedYear,
}) => {
  const [loading, setLoading] = React.useState(true);

  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });

  const { flagForTogglingFilter, selectedValue } = filterState;

  React.useEffect(() => {
    if (currentTabViewName === "Plant" && filter === "cell")
      setFilter("section");
    else if (currentTabViewName === "Section" && filter === "section")
      setFilter("cell");
  }, [currentTabViewName]);

  const fetchChartData = async () => {
    setLoading(true);

    // console.log("filterState:", filterState.flagForTogglingFilter);

    // const basedON = currentTabViewName === "Plant" ? "plantId" : "subSection";
    // const selectedId = currentTabViewName === "Plant" ? "undefined" : sectionId;
    // const url = `/${filter}YearlyBdTrend/based-on-${basedON}/${selectedId}`;

    // console.log("sectionId:", sectionId);
    // const url =
    //   currentTabViewName === "Plant"
    //     ? `/${filter}YearlyBdTrendForPlant`
    //     : `/${filter}YearlyBdTrendForSection/based-on-subSection/${sectionId}`;

    const url = `/${filter}YearlyBdTrend/${flagForTogglingFilter}/${selectedValue}`;
    console.log("url:", url);

    const params = { selectedYear };

    try {
      const res = await axios.get(url, {
        params,
        withCredentials: true,
        credentials: "include",
      });
      // console.log("yearly bd trend res:", res);

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
      // const targetData = getRandomDataArray(2, 5, 8);

      if (data) {
        setChartData({
          labels: res?.data?.labels,
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
      // const bodyData = [chartData].map((item) => [item.labels, item.datasets]);
      // const bodyData = [chartData].map((item) => [
      //   item.datasets.map((a) => a.label).join("\n"),
      //   item.datasets.map((a) => a.data).join("\n"),
      // ]);

      let bodyData = [];
      if (fileType === "csv") {
        bodyData = [
          [["Labels"].concat(chartData?.labels)?.toString() + "\n"],
          [["Hours"].concat(chartData?.data)?.toString() + "\n"],
        ];
      } else {
        bodyData = [["Hours"].concat(chartData?.data)];
      }

      downloadFile(bodyData, fileType, header, "Yearly_Bd_Trend");
    } catch (error) {
      console.error("Error downloading data:", error);
    }
  };

  React.useEffect(() => {
    if (flagForTogglingFilter && selectedValue && selectedYear && filter)
      fetchChartData();
  }, [flagForTogglingFilter, selectedValue, filter, selectedYear]);

  // console.log('chartData:', chartData)
  const isDataExists = isChartDataExist(chartData);

  return (
    <Box className="cell p-3">
      <ChartTitleBar
        title="Yearly Trend"
        // titleProps={{
        //   sx: { fontWeight: "500" },
        // }}
        Toolbar={
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

export default YearlyTrendChart;
