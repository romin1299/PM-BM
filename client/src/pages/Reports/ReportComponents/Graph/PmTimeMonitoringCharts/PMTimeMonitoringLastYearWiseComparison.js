import React, { useState, useEffect } from "react";
import BarChart from "../../../../../BM/Reports/MTBFReport/Chart/BarChart";
import { Col } from "react-bootstrap";
import { Box, Button, InputAdornment, TextField } from "@mui/material";
import { ChartDownloadMenu } from "../../../../../BM/Reports/Common/ChartTitleBar";
import downloadFile from "../../../../../util";
import findFilters from "../../../../../filterNames";
const PMTimeMonitoringLastYearWiseComparison = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
  selectedMonth,
  filterValues,
  userDetails,
}) => {
  const [loading, setLoading] = React.useState(true);

  const { filteredValuesWithHOD, filteredValues } = findFilters(
    flagForTogglingFilter,
    selectedValue
  );
  const [
    yearlyTrendMachineTimeMonitoring,
    setYearlyTrendMachineTimeMonitoring,
  ] = useState({
    labels: [],
    data: [],
  });

  const yearlyTrendPmTimeMonitoringData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/yearlyTrendPmTimeMonitoringData/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}&&selectedMonth=${selectedMonth}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );
      const { message, yearTrendMachineTimeMonitoring } = await res.json();
      if (res.status === 201) {
        setYearlyTrendMachineTimeMonitoring(yearTrendMachineTimeMonitoring);
      }
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

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

  const header = ["Years", "Data"];
  const handleDownload = async (fileType) => {
    try {

      let bodyData = [];
      let filterData = [];

      if (fileType === "csv") {
        bodyData = [
          ["Filters", ...arrayItems]?.toString() + "\n",
          ["\n"],
          ["Years", yearlyTrendMachineTimeMonitoring.labels]?.toString() + "\n",
          ["", yearlyTrendMachineTimeMonitoring.data]?.toString() + "\n",
        ];
      } else {
        bodyData = [
          [yearlyTrendMachineTimeMonitoring?.labels.join("\n"), yearlyTrendMachineTimeMonitoring?.data.join("\n")],
        ];
        filterData = ["Filters", ...arrayItems];
      }

      downloadFile(filterData, bodyData, fileType, header, "Yearly_Trend_Of_PM_Time");
    } catch (error) {
      console.error("Error downloading data:", error);
    }
  };

  useEffect(() => {
    if (selectedValue) {
      yearlyTrendPmTimeMonitoringData();
    }
  }, [selectedValue, selectedYear]);

  const TopDataFilterInput = (
    <>
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
  );
  return (
    <>
      <BarChart
        title="Yearly Trend Time Monitoring"
        loading={loading}
        dataset={yearlyTrendMachineTimeMonitoring}
        AppendToolComponents={TopDataFilterInput}
        xAxisLabel = "Financial Year"
        hoverLabel = "Hours"
      />
    </>
  );
};

export default PMTimeMonitoringLastYearWiseComparison;
