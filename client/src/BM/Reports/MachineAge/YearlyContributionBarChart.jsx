import React, { useState, useEffect } from "react";
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
import DataNotFound from "../Common/DataNotFound";
import { isChartDataExist } from "../../Utils/functions/isChartDataExist";
import Loading from "../../../components/Loading/Loading";
import downloadFile from "../../../util";
import findFilters from "../../../filterNames";

const YearlyContributionBarChart = ({
  selectedValue,
  selectedYear,
  flagForTogglingFilter,
  filterValues,
  userDetails,
}) => {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
  );
  const [loading, setLoading] = React.useState(true);

  const [yearlyContributionData, setYearlyContributionData] = useState({
    label: [],
    data: [],
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

  const getYearContributionChartData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/getMachineAgeYearwise/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const { message, machineData } = await res.json();

      if (res?.status === 201) {
        setYearlyContributionData(machineData?.[0]);
      }
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  const header = ["Labels", "Hours"];

  const handleDownload = async (fileType) => {
    try {
      // const bodyData = [
      //   [yearlyContributionData?.label, yearlyContributionData?.data],
      // ];

      let bodyData = [];
      let filterData = [];

      if (fileType === "csv") {
        bodyData = [
          ["Filters", ...arrayItems]?.toString() + "\n",
          ["\n"],
          [["Labels"].concat(yearlyContributionData?.label)?.toString() + "\n"],
          [["Hours"].concat(yearlyContributionData?.data)?.toString() + "\n"],
        ];
      } else {
        bodyData = [
          [
            yearlyContributionData?.label.join("\n"),
            yearlyContributionData?.data.join("\n"),
          ],
        ];
        filterData = ["Filters", ...arrayItems];
      }

      downloadFile(
        filterData,
        bodyData,
        fileType,
        header,
        `Machine_Age_Yearly_Contribution_${selectedYear}`
      );
    } catch (error) {
      console.error("Error downloading data:", error);
    }
  };

  useEffect(() => {
    setLoading(false);
    if (selectedValue) {
      getYearContributionChartData();
    }
  }, [selectedValue, selectedYear]);

  // const dataset = {
  //   _id: null,
  //   machineId: [],
  //   labels: ["Group 1", "Group 2", "Group 3", "Group 4", "Group 5"],
  //   data: [100, 80, 65, 20, 200],
  // };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    maxBarThickness: 100,
    indexAxis: "y",
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
        labels: {
          usePointStyle: true,
        },
      },
      datalabels: {
        font: { weight: "bold", size: 12 },
        // anchor: "end",
        // align: "top",
        // offset: 1,
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
        title: {
          display: false,
          text: "Machines",
        },
      },
      y: {
        grid: {
          display: false,
        },
        title: {
          display: false,
          text: "Total Hours",
        },
      },
    },
  };
  const datasets = [
    {
      label: "Top 20",
      data: yearlyContributionData?.data,
      backgroundColor: chartColors.monthlyBDTrend,
      // borderColor: chartColors[7],
      borderWidth: 1,
    },
  ];

  const data = {
    labels: yearlyContributionData?.label,
    datasets,
  };

  const isDataExists = isChartDataExist(data);

  return (
    <Box className="cell p-3">
      <ChartTitleBar
        title={"Yearly Contribution"}
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
          <Bar options={options} data={data} />
        )}
      </Box>
    </Box>
  );
};

export default YearlyContributionBarChart;
