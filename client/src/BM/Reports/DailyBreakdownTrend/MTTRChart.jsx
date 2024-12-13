import React, { useState, useEffect } from "react";
import { Chart } from "react-chartjs-2";
import { Box, Divider, Paper, Typography } from "@mui/material";
import { chartColors } from "../../Utils/ChartUtils/chartEnums";
import { Col, Row } from "react-bootstrap";
import { CountFilters } from "./DailyBDTrendChart";
import ChartTitleBar, { ChartDownloadMenu } from "../Common/ChartTitleBar";
import Loading from "../../../components/Loading/Loading";
import DataNotFound from "../Common/DataNotFound";
import { isChartDataExist } from "../../Utils/functions/isChartDataExist";
import downloadFile from "../../../util";
import findFilters from "../../../filterNames";

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
        // padding: 50,
      },
    },
    datalabels: {
      formatter: (value, context) => {
        if (context.dataset.type === "bar") {
          return "";
        }
      },
      font: { weight: "bold", size: 10 },
      anchor: "end",
      align: "top",
      offset: -2,
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
        display: false, // Hide vertical grid lines
      },
      title: {
        display: true,
        text: "Months",
      },
      ticks: {
        // maxRotation: 90,
        // minRotation: 90,
        // padding: 10,
        color: "black",
      },
    },
    y: {
      stacked: true,
      grid: {
        display: false,
      },
      title: {
        display: true,
        text: "Total Hours",
      },
      ticks: {
        color: "black",
      },
    },
    y1: {
      position: "right", // Align the y-axis to the right
      grid: {
        display: false,
      },
      title: {
        display: true,
        text: "Cummulative Avg Hrs",
      },
      ticks: {
        color: "black",
      },
    },
  },
};

const labels = [
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
];

const MTTRChart = ({
  flagForTogglingFilter,
  selectedValue,
  selectedYear,
  filterValues,
  userDetails,
}) => {
  const [loading, setLoading] = React.useState(true);
  const [mttrData, setMttrData] = useState({
    bdTrendData: [{ label: "", data: [] }],
    averageData: [],
  });

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

  let filterMaker = {
    plant: "Plant",
    section: "Section",
    subSection: "Section",
    cell: "Cell",
    line: "Line",
  };

  const getMTTRData = async () => {
    setLoading(true);
    let [, , currFilterState] = flagForTogglingFilter?.split("-");
    let filterFlag = filterMaker[currFilterState];

    try {
      const res = await fetch(
        `/mttrFor${filterFlag}/kpiFromDatabase/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const { message, bdTrendData, averageData } = await res.json();

      if (res?.status === 200) {
        setMttrData({
          bdTrendData,
          averageData,
        });
      }
    } catch (error) {
      console.log(error);
      setMttrData({
        bdTrendData: [{ label: "", data: [] }],
        averageData: [],
      });
    }

    setLoading(false);
  };

  const header = ["Months"].concat(labels);

  const handleDownload = async (fileType) => {
    try {
      // const bodyData = [
      //   [
      //     mttrData?.bdTrendData[0]?.label,
      //     mttrData?.bdTrendData[0]?.data,
      //     mttrData?.averageData,
      //   ],
      // ];

      let bodyData = [];
      let filterData = [];

      if (fileType === "csv") {
        bodyData = [
          ["Filters", ...arrayItems]?.toString() + "\n",
          ["\n"],
          [["Months"].concat(labels)?.toString() + "\n"],
          [["Hours"].concat(mttrData?.bdTrendData[0]?.data)?.toString() + "\n"],
          [["Average Hours"].concat(mttrData?.averageData)?.toString() + "\n"],
        ];
      } else {
        bodyData = [
          ["Hours"].concat(mttrData?.bdTrendData[0]?.data),
          ["Average Hours"].concat(mttrData?.averageData),
        ];
        filterData = ["Filters", ...arrayItems];
      }

      downloadFile(
        filterData,
        bodyData,
        fileType,
        header,
        `MTTR_${selectedYear}`
      );
    } catch (error) {
      console.error("Error downloading data:", error);
    }
  };

  useEffect(() => {
    setLoading(false);
    if (selectedValue) getMTTRData();
  }, [selectedValue, selectedYear]);

  const data = {
    labels,
    datasets: [
      {
        type: "line",
        label: "Average",
        data: mttrData?.averageData,
        borderColor: chartColors.blue[1],
        //borderWidth: 2,
        backgroundColor: chartColors.blue[1],
        pointStyle: "rectRot",
        yAxisID: "y1",
      },
      ...mttrData?.bdTrendData?.map((item, index) => ({
        type: "bar",
        stack: "bar-stacked",
        label: item?.label,
        data: item?.data,
        backgroundColor: chartColors.monthlyBDTrend[index],
        borderRadius: 4,
        pointStyle: "rect",
        //borderColor: "#312A7D",
        //borderWidth: 2,
      })),
    ],
  };

  const isDataExists = isChartDataExist(data);

  return (
    <Box className="cell p-3 mb-3">
      <ChartTitleBar
        title="Mean Time to Repair (MTTR)"
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

      <Box sx={{ height: { xs: "250px", md: "300px" } }}>
        {loading ? (
          <Loading height={"100%"} />
        ) : !isDataExists ? (
          <DataNotFound />
        ) : (
          <Chart data={data} options={options} />
        )}
      </Box>
    </Box>
  );
};

export default MTTRChart;
