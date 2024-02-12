import React, { useEffect, useReducer } from "react";
import SmallChartCardComponent from "./SmallChartCardComponent";

import LineBarChartForProductionLineWise from "./Charts/LineBarChartForProductionLineWise";
import Loading from "../../../components/Loading/Loading";
import { Box } from "@mui/material";
import DataNotFound from "../Common/DataNotFound";
import downloadFile from "../../../util";
import DownloadButton from "../Common/DownloadButton";
import { ChartDownloadMenu } from "../Common/ChartTitleBar";
import findFilters from "../../../filterNames";

const MTTRComponent = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
  filterValues,
  userDetails,
}) => {
  const [loading, setLoading] = React.useState(true);

  const initialState = {
    MTTRReportData: {
      labels: [],
      data: [],
      target: [],
      backgroundColor: [],
    },

    message: "",
    isLoading: true,
    isError: false,
  };

  const ACTION = {
    GET: "get-MTTR-report-data",
  };

  const reducer = (state, action) => {
    switch (action?.type) {
      case ACTION?.GET:
        return {
          ...state,
          isLoading: false,
          message: action?.message,
          MTTRReportData: action?.MTTRReportData,
        };

      default:
        return state;
    }
  };

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

  const [reduceState, reducerDispatch] = useReducer(reducer, initialState);

  const getMTTRReportData = async () => {
    setLoading(true);

    try {
      const res = await fetch(
        // `/getMTTRGraphData/${flagForTogglingFilter}/632c41261d1becfedab325f9/?selectedYear=${selectedYear}`,
        `/getMTTRGraphData/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}&&targetKey=monthlyMTTRTarget`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const { message, MTTRReportData } = await res.json();

      if (res?.status === 201) {
        reducerDispatch({
          type: ACTION.GET,
          message,
          MTTRReportData,
        });
      }
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  const header = ["Months"].concat(reduceState.MTTRReportData?.labels);

  const handleDownload = async (fileType) => {
    try {
      let bodyData = [];
      let filterData = [];
      if (fileType === "csv") {
        bodyData = [
          ["Filters", ...arrayItems]?.toString() + "\n",
          ["\n"],
          [
            ["Months"].concat(reduceState.MTTRReportData?.labels)?.toString() +
              "\n",
          ],
          [
            ["Hours"].concat(reduceState.MTTRReportData?.data)?.toString() +
              "\n",
          ],
          // [reduceState.BDHours?.labels, reduceState.BDHours?.data],
        ];
      } else {
        filterData = ["Filters", ...arrayItems];
        bodyData = [["Hours"].concat(reduceState.MTTRReportData?.data)];
      }

      downloadFile(filterData, bodyData, fileType, header, `MTTR_${selectedYear}`);
    } catch (error) {
      console.error("Error downloading data:", error);
    }
  };

  useEffect(() => {
    if (selectedValue) {
      getMTTRReportData();
    }
  }, [selectedValue, selectedYear]);

  let isDataExists = reduceState?.MTTRReportData?.data?.length > 0 || false;

  return (
    <SmallChartCardComponent
      title="MTTR"
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
    >
      <Box sx={{ height: { xs: "200px" } }}>
        {loading ? (
          <Loading height={200} />
        ) : !isDataExists ? (
          <DataNotFound />
        ) : (
          <LineBarChartForProductionLineWise
            ReportData={reduceState?.MTTRReportData}
          />
        )}
      </Box>
    </SmallChartCardComponent>
  );
};

export default MTTRComponent;
