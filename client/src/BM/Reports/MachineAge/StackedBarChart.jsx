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
import { MONTH_LABELS, chartColors } from "../../Utils/ChartUtils/chartEnums";
import ChartDataLabels from "chartjs-plugin-datalabels";
import axios from "axios";
import DataNotFound from "../Common/DataNotFound";
import ChartTitleBar, { ChartDownloadMenu } from "../Common/ChartTitleBar";
import { commonDatalabels } from "../../Utils/ChartUtils/chartOptions";
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
  },
};

const StackedBarChart = ({
  flagForTogglingFilter,
  selectedValue,
  selectedYear,
}) => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: "",
        data: [],
      },
    ],
  });

  const fetchChartData = async () => {
    const url = `/getMachineAgeMonthwise/${flagForTogglingFilter}/${selectedValue}`;
    const params = { selectedYear };

    try {
      const res = await axios.get(url, {
        params,
        withCredentials: true,
        credentials: "include",
        headers: { "content-type": "application/json" },
      });

      if (res.status === 201) {
        const barDatasets = res?.data?.machineData?.map((item, index) => ({
          type: "bar",
          stack: "bar-stacked",
          label: item?.label || item?._id,
          data: item?.data,
          backgroundColor: chartColors.monthlyBDTrend[index],
        }));

        setChartData({
          labels: MONTH_LABELS,
          datasets: barDatasets,
        });
      }
    } catch (error) {
      console.log("error:", error);
    }
  };

  const header = ["Labels", "Data"];

  const handleDownload = async (fileType) => {
    try {
      const bodyData = [
        [chartData?.datasets[0].label, chartData?.datasets[0].data],
      ];

      downloadFile(bodyData, fileType, header, "Machine_Age_Monthly");
    } catch (error) {
      console.error("Error downloading data:", error);
    }
  };

  useEffect(() => {
    if (selectedValue) fetchChartData();
  }, [selectedValue, selectedYear]);

  return (
    <Box className="container-fluid cell p-3">
      <ChartTitleBar
        title="Machine Age"
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
        {chartData === undefined || chartData?.datasets?.length < 1 ? (
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

export default StackedBarChart;
