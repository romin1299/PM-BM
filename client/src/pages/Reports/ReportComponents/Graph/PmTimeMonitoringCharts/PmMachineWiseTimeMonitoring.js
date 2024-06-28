import React, { useState, useEffect } from "react";
import BarChart from "../../../../../BM/Reports/MTBFReport/Chart/BarChart";
import { Col } from "react-bootstrap";
import { Box, Button, InputAdornment, TextField } from "@mui/material";
import { ChartDownloadMenu } from "../../../../../BM/Reports/Common/ChartTitleBar";
import findFilters from "../../../../../filterNames";
import downloadFile from "../../../../../util";
import "jspdf-autotable";

const PmMachineWiseTimeMonitoring = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
  selectedMonth,
  filterValues,
  userDetails,
}) => {
  const [loading, setLoading] = React.useState(true);

  const [documentLimitInTheGraph, setDocumentLimitInTheGraph] = useState(10);

  const [topMachineTimeMonitoring, setTopMachineTimeMonitoring] = useState({
    machineId: [],
    labels: [],
    data: [],
  });

  let arrayItems;
  let filterHeaders;

  const { filteredValuesWithHOD, filteredValues } = findFilters(
    flagForTogglingFilter,
    filterValues,
    selectedValue
  );

  const header = ["Machine Names", "Hours"];

  const handleDownload = async (fileType) => {
    try {
      // const bodyData = [[topMachineBd?.labels, topMachineBd?.data]];
      let bodyData = [];
      let filterData = [];

      if (fileType === "csv") {
        bodyData = [
          ["Filters", ...arrayItems]?.toString() + "\n",
          ["\n"],
          [
            ["Machine Names"]
              .concat(topMachineTimeMonitoring?.labels)
              ?.toString() + "\n",
          ],
          [["Hours"].concat(topMachineTimeMonitoring?.data)?.toString() + "\n"],
        ];
      } else {
        bodyData = [
          [
            topMachineTimeMonitoring?.labels.join("\n"),
            topMachineTimeMonitoring?.data.join("\n"),
          ],
        ];
        filterData = ["Filters", ...arrayItems];
      }

      downloadFile(
        filterData,
        bodyData,
        fileType,
        header,
        `Top_Machine_PM_Time_Monitoring_${selectedMonth}_${selectedYear}`
      );
    } catch (error) {
      console.error("Error downloading data:", error);
    }
  };

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

  const topMachinePmTimeMonitoringData = async () => {
    setLoading(true);

    try {
      const res = await fetch(
        `/topMachinePmTimeMonitoringData/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}&&selectedMonth=${selectedMonth}&&documentLimitInTheGraph=${documentLimitInTheGraph}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );
      const { message, topMachineTimeMonitoring } = await res.json();
      if (res.status === 201) {
        setTopMachineTimeMonitoring(topMachineTimeMonitoring);
      }
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  const TopDataFilterInput = (
    <>
      <Col className="col-auto">
        <Box
          component="form"
          sx={{ display: "flex", alignItems: "center", gap: "10px" }}
        >
          {/* <p style={{ fontSize: "1rem" }}>Top:</p> */}
          <TextField
            type="number"
            id="outlined-basic"
            // sx={{ width: "80px" }}
            variant="outlined"
            sx={{
              // width: "12ch",
              width: "6rem",
              pl: 0,
              "& .MuiOutlinedInput-root": { pl: 0 },
              "& .MuiOutlinedInput-input": { pt: "6px", pb: "6px" },
            }}
            InputProps={{
              sx: { fontSize: 14 },
              startAdornment: (
                <InputAdornment position="start">TOP</InputAdornment>
              ),
            }}
            size="small"
            onChange={(e) => {
              setDocumentLimitInTheGraph(e.target.value);
            }}
            value={documentLimitInTheGraph}
          />
          <Button
            // size="small"
            disableElevation
            className="bg-button"
            variant="contained"
            sx={{
              minWidth: "30px",
              height: "32px",
              paddingInline: "10px",
            }}
            onClick={topMachinePmTimeMonitoringData}
          >
            Go
          </Button>
        </Box>
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
  );

  useEffect(() => {
    if (selectedValue) {
      topMachinePmTimeMonitoringData();
    }
  }, [selectedValue, selectedYear, selectedMonth]);

  return (
    <>
      <BarChart
        title="Top Machine Wise Time Monitoring"
        loading={loading}
        dataset={topMachineTimeMonitoring}
        AppendToolComponents={TopDataFilterInput}
        hoverLabel = "Hours"
      />
    </>
  );
};

export default PmMachineWiseTimeMonitoring;
