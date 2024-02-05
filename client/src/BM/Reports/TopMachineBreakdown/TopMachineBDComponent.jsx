import React, { useState, useEffect } from "react";
import BarChart from "../MTBFReport/Chart/BarChart";
import { Col } from "react-bootstrap";

import { Box, Button, InputAdornment, TextField } from "@mui/material";

import "jspdf-autotable";

import downloadFile from "../../../util";

import { ChartDownloadMenu } from "../Common/ChartTitleBar";

const TopMachineBDComponent = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
  selectedMonth,
}) => {
  const [loading, setLoading] = React.useState(true);

  const [topMachineBd, setTopMachineBd] = useState({
    machineId: [],
    labels: [],
    data: [],
  });
  const [documentLimitInTheGraph, setDocumentLimitInTheGraph] = useState(10);
  const topMachineBreakdown = async () => {
    setLoading(true);

    try {
      const res = await fetch(
        `/topMachineBreakdown/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}&&selectedMonth=${selectedMonth}&&documentLimitInTheGraph=${documentLimitInTheGraph}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );
      const { message, topMachineBd } = await res.json();
      if (res.status === 201) {
        setTopMachineBd(topMachineBd);
      }
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  const header = ["Labels", "Data"];

  const handleDownload = async (fileType) => {
    try {
      const bodyData = [[topMachineBd?.labels, topMachineBd?.data]];
      downloadFile(bodyData, fileType, header, "Top_Machine_BD");
    } catch (error) {
      console.error("Error downloading data:", error);
    }
  };

  useEffect(() => {
    if (selectedValue) {
      topMachineBreakdown();
    }
  }, [selectedValue, selectedYear, selectedMonth]);

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
            onClick={topMachineBreakdown}
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

  return (
    <>
      <BarChart
        title="Top Machine"
        loading={loading}
        dataset={topMachineBd}
        AppendToolComponents={TopDataFilterInput}
      />
    </>
  );
};

export default TopMachineBDComponent;
