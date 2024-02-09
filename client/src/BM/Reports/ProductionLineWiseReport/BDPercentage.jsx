import React, { useEffect, useReducer, useContext } from "react";
import LineBarChartForProductionLineWise from "./Charts/LineBarChartForProductionLineWise";
import SmallChartCardComponent from "./SmallChartCardComponent";
import Loading from "../../../components/Loading/Loading";
import { Box } from "@mui/material";
import DataNotFound from "../Common/DataNotFound";
import downloadFile from "../../../util";
import DownloadButton from "../Common/DownloadButton";
import { ChartDownloadMenu } from "../Common/ChartTitleBar";
import RoutingContext from "../../../context/routing/RoutingContext";
import findFilters from "../../../filterNames";

const BDPercentageChart = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
  filterValues,
  userDetails,
}) => {
  const [loading, setLoading] = React.useState(true);
  // const loggedUserDetails = useContext(RoutingContext);

  const initialState = {
    BDPercentageReportData: {
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
          BDPercentageReportData: action?.BDPercentageReportData,
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

  const getBDPercentageReportData = async () => {
    setLoading(true);

    try {
      const res = await fetch(
        // `/getBdPercentage/${flagForTogglingFilter}/632c41261d1becfedab325f9/?selectedYear=${selectedYear}`,
        `/getBdPercentage/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );
      const response = await res.json();

      if (res?.status === 201) {
        reducerDispatch({
          type: ACTION.GET,
          message: response.message,
          BDPercentageReportData: response.data,
        });
      }
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  const header = ["Months"].concat(reduceState.BDPercentageReportData?.labels);

  const handleDownload = async (fileType) => {
    try {
      let bodyData = [];
      let filterData = [];
      if (fileType === "csv") {
        bodyData = [
          ["Filters", ...arrayItems]?.toString() + "\n",
          ["\n"],

          [
            ["Months"]
              .concat(reduceState.BDPercentageReportData?.labels)
              ?.toString() + "\n",
          ],
          [
            ["Hours"]
              .concat(reduceState.BDPercentageReportData?.data)
              ?.toString() + "\n",
          ],
        ];
      } else {
        bodyData = [["Hours"].concat(reduceState.BDPercentageReportData?.data)];

        filterData = ["Filters", ...arrayItems];
      }

      downloadFile(
        filterData,
        bodyData,
        fileType,
        header,
        `BD_Percentage_${selectedYear}`
      );
    } catch (error) {
      console.error("Error downloading data:", error);
    }
  };

  useEffect(() => {
    if (selectedValue) {
      getBDPercentageReportData();
    }
  }, [selectedValue, selectedYear]);

  let isDataExists =
    reduceState?.BDPercentageReportData?.data?.length > 0 || false;

  return (
    <SmallChartCardComponent
      title="BD %"
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
            ReportData={reduceState?.BDPercentageReportData}
            xAxisVerticleTicks
          />
        )}
      </Box>
    </SmallChartCardComponent>
  );
};

export default BDPercentageChart;
