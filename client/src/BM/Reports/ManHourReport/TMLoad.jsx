import React, { useEffect, useState } from "react";
import { Chart } from "react-chartjs-2";
import { Box, Divider, Paper, Typography } from "@mui/material";
import { chartColors } from "../../Utils/ChartUtils/chartEnums";
import { Row, Col } from "react-bootstrap";
import { FilterMenu } from "./SubComponents/FilterMenu";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
} from "chart.js";
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
  PointElement,
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
        display: false, // Hide vertical grid lines
      },
      title: {
        display: true,
        text: "Team Members",
      },
      ticks: {
        maxRotation: 90,
        minRotation: 90,
        // padding: 10,
        color: "black",
      },
    },
    y1: {
      stacked: true,
      position: "right",

      grid: {
        display: false,
      },
      title: {
        display: true,
        text: "Percentage",
      },
      ticks: {
        color: "black",
      },
    },
    y2: {
      stacked: true,
      grid: {
        display: false,
      },
      title: {
        display: true,
        text: "Hours",
      },
      ticks: {
        color: "black",
      },
    },
  },
};

// export const data = {
//   labels: TM_Names,
//   datasets: [
//     {
//       type: "line",
//       label: "Dataset 1",
//       data: [432, 863, 543, 123, 474, 653, 655, 378, 302, 945, 234, 743],
//       borderColor: chartColors.percentLine,
//       borderWidth: 2,
//       fill: false,
//       backgroundColor: chartColors.percentLine,
//       pointBorderColor: chartColors.percentLine,
//     },
//     {
//       type: "bar",
//       stack: "bar-stacked",
//       label: "Dataset 2",
//       data: [432, 863, 543, 123, 474, 653, 655, 378, 302, 945, 234, 743],
//       backgroundColor: chartColors.brown[0],
//       borderColor: chartColors.brown[0],
//       borderWidth: 0,
//       pointStyle:'rect',
//     },
//     {
//       type: "bar",
//       stack: "bar-stacked",
//       label: "Dataset 3",
//       data: [432, 263, 543, 223, 574, 653, 255, 778, 1032, 145, 734, 243],
//       backgroundColor: chartColors.red[0],
//       borderColor: chartColors.red[0],
//       borderWidth: 0,
//       pointStyle:'rect',
//     },
//   ],
// };

const TMLoad = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
  selectedMonth,
  chartTitle,
  filterValues,
  userDetails,
}) => {
  const [loading, setLoading] = React.useState(true);

  const [tmLoadData, setTmLoadData] = useState({
    tm_names: [],
    totalSumOf_PM: [],
    totalSumOf_BM: [],
    percentage: [],
  });

  const { filteredValuesWithHOD, filteredValues } = findFilters(
    flagForTogglingFilter,
    filterValues,
    selectedValue
  );

  let arrayItems;
  let filterHeaders;
  if (userDetails?.tm_grade === "HOD") {
    arrayItems = [
      userDetails?.plant_data?.split("-")?.[0],
      ...filteredValuesWithHOD,
    ];
    // filterHeaders = ["Plant", "Section", "Sub-Section", "Cell", "Line"];
  } else {
    arrayItems = [
      userDetails?.plant_data?.split("-")?.[0],
      userDetails?.section_data?.split("-")?.[1],
      ...filteredValues,
    ];
    // filterHeaders = ["Plant", "Section", "Sub-Section", "Cell", "Line"];
  }

  const getTmLoadData = async () => {
    setLoading(true);

    try {
      const res = await fetch(
        // `/manHourReport/tmLoad/${flagForTogglingFilter}/632c41261d1becfedab325f9`,
        `/manHourReport/tmLoad/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}&&selectedMonth=${selectedMonth}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const { message, tmLoadData } = await res.json();

      if (res?.status === 201) {
        setTmLoadData(tmLoadData);
      }
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  const header = [
    "TM Names",
    "Total Sum of PM",
    "Total Sum of BM",
    "Percentages",
  ];

  const handleDownload = async (fileType) => {
    try {
      // const bodyData = [
      //   [
      //     tmLoadData?.tm_names,
      //     tmLoadData?.totalSumOf_PM,
      //     tmLoadData?.totalSumOf_BM,
      //     tmLoadData?.percentage,
      //   ],
      // ];

      let bodyData = [];
      let filterData = [];

      if (fileType === "csv") {
        bodyData = [
          ["Filters", ...arrayItems]?.toString() + "\n",
          ["\n"],
          [["Line Names"].concat(tmLoadData?.tm_names)?.toString() + "\n"],
          [
            ["PM Hour Trend"].concat(tmLoadData?.totalSumOf_PM)?.toString() +
              "\n",
          ],
          [
            ["BM Hour Trend"].concat(tmLoadData?.totalSumOf_BM)?.toString() +
              "\n",
          ],
          [["Percentages"].concat(tmLoadData?.percentage)?.toString() + "\n"],
        ];
      } else {
        bodyData = [
          ["PM Hour Trend"].concat(tmLoadData?.totalSumOf_PM),
          ["BM Hour Trend"].concat(tmLoadData?.totalSumOf_BM),
        ];

        bodyData = [
          [
            tmLoadData?.tm_names.join("\n"),
            tmLoadData?.totalSumOf_PM.join("\n"),
            tmLoadData?.totalSumOf_BM.join("\n"),
            tmLoadData?.percentage.join("\n"),
          ],
        ];
        filterData = ["Filters", ...arrayItems];
      }

      downloadFile(
        filterData,
        bodyData,
        fileType,
        header,
        `TM_Load_${selectedMonth}_${selectedYear}`
      );
    } catch (error) {
      console.error("Error downloading data:", error);
    }
  };

  useEffect(() => {
    if (selectedValue && flagForTogglingFilter !== "based-on-line") {
      getTmLoadData();
    }
  }, [selectedValue, selectedYear, selectedMonth]);

  const data = {
    labels: tmLoadData?.tm_names,
    datasets: [
      {
        type: "line",
        label: "%",
        data: tmLoadData?.percentage,
        borderColor: chartColors.percentLine,
        borderWidth: 2,
        pointRadius: 3,
        fill: false,
        backgroundColor: chartColors.percentLine,
        pointBorderColor: chartColors.percentLine,
        yAxisID: "y1",
      },
      {
        type: "bar",
        stack: "bar-stacked",
        label: "BM",
        data: tmLoadData?.totalSumOf_BM,
        backgroundColor: chartColors.bmpm[0],
        borderRadius: 4,
        yAxisID: "y2",
        borderColor: "#312A7D",
        borderWidth: 2,
      },
      {
        type: "bar",
        stack: "bar-stacked",
        label: "PM",
        data: tmLoadData?.totalSumOf_PM,
        backgroundColor: chartColors.bmpm[1],
        borderRadius: 4,
        yAxisID: "y2",
        borderColor: "#312A7D",
        borderWidth: 2,
      },
    ],
  };

  let isDataExists = isChartDataExist(data);

  return (
    <Box className="cell p-3">
      <ChartTitleBar
        title={chartTitle}
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

      <Box sx={{ height: { xs: "350px", md: "400px" } }}>
        {loading ? (
          <Loading height={"100%"} />
        ) : !isDataExists ? (
          <DataNotFound />
        ) : (
          <Chart options={options} data={data} />
        )}
      </Box>
    </Box>
    // <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
    //   <Typography variant="h5" component="h4">
    //     TM Load
    //   </Typography>

    //   <Divider sx={{ mb: 4, borderColor: "black" }} />

    //   <Chart options={options} data={data} />
    // </Paper>
  );
};

export default TMLoad;
