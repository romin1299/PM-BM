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
import { Bar } from "react-chartjs-2";
import { Box } from "@mui/material";
import { chartColors } from "../../Utils/ChartUtils/chartEnums";
import ChartTitleBar, { ChartDownloadMenu } from "../Common/ChartTitleBar";
import Loading from "../../../components/Loading/Loading";
import DataNotFound from "../Common/DataNotFound";
import { isChartDataExist } from "../../Utils/functions/isChartDataExist";
import downloadFile from "../../../util";
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
  responsive: true,
  maintainAspectRatio: false,
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
      display: false,
    },
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
        // font: {
        //   size: 12,
        // },
      },
    },
    y: {
      stacked: true,
      grid: {
        display: false,
      },
      ticks: {
        color: "black",
      },
      title: {
        display: true,
        text: "Hours",
      },
    },
  },
};

const serverResLabels = [
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

const ChartToPPTExample = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
  filterValues,
  userDetails,
}) => {
  const [loading, setLoading] = React.useState(true);

  const [HourTrendData, setHourTrendData] = useState({
    BMHourTrend: [],
    PMHourTrend: [],
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

  const getHourTrendData = async () => {
    setLoading(true);

    try {
      const res = await fetch(
        // `/manHourReport/hourTrend/${flagForTogglingFilter}/632c41261d1becfedab325f9`,
        `/manHourReport/hourTrend/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const { message, hourTrendData } = await res.json();

      if (res?.status === 201) {
        setHourTrendData(hourTrendData);
      }
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  const header = ["Months"].concat(serverResLabels);

  const handleDownload = async (fileType) => {
    try {
      // const bodyData = [
      //   [HourTrendData?.PMHourTrend, HourTrendData?.BMHourTrend],
      // ];

      let bodyData = [];
      let filterData = [];

      if (fileType === "csv") {
        bodyData = [
          ["Filters", ...arrayItems]?.toString() + "\n",
          ["\n"],

          [["Months"].concat(serverResLabels)?.toString() + "\n"],
          [
            ["PM Hour Trend"].concat(HourTrendData?.PMHourTrend)?.toString() +
              "\n",
          ],
          [
            ["BM Hour Trend"].concat(HourTrendData?.BMHourTrend)?.toString() +
              "\n",
          ],
        ];
      } else {
        bodyData = [
          ["PM Hour Trend"].concat(HourTrendData?.PMHourTrend),
          ["BM Hour Trend"].concat(HourTrendData?.BMHourTrend),
        ];
        filterData = ["Filters", ...arrayItems];
      }

      downloadFile(
        filterData,
        bodyData,
        fileType,
        header,
        `Hour_Trend_${selectedYear}`
      );
    } catch (error) {
      console.error("Error downloading data:", error);
    }
  };

  useEffect(() => {
    if (selectedValue && flagForTogglingFilter) {
      getHourTrendData();
    }
  }, [selectedValue, selectedYear]);

  const data = {
    labels: serverResLabels,
    datasets: [
      {
        label: "BM",
        data: HourTrendData?.BMHourTrend,
        backgroundColor: chartColors.bmpm[0],
        borderRadius: 4,
        //borderColor: "#312A7D",
        //borderWidth: 2,
      },
      {
        label: "PM",
        data: HourTrendData?.PMHourTrend,
        backgroundColor: chartColors.bmpm[1],
        borderRadius: 4,
        //borderColor: "#312A7D",
        //borderWidth: 2,
      },
    ],

    // serverResDataset.map((dataset, i) => ({
    //   ...dataset,
    //   backgroundColor: i === 0 ? "rgba(202, 31, 75)" : chartColors[i - 1],
    // })),
  };

  let isDataExists = isChartDataExist(data);

  return (
    <Box className="cell p-3">
      <ChartTitleBar
        title="Hour Trend"
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
          <Loading />
        ) : !isDataExists ? (
          <DataNotFound />
        ) : (
          <Bar options={options} data={data} />
        )}
      </Box>
    </Box>
  );
};

export default ChartToPPTExample;
