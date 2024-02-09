import React, { useEffect, useReducer } from "react";

import SmallChartCardComponent from "./SmallChartCardComponent";

import LineBarChartForProductionLineWise from "./Charts/LineBarChartForProductionLineWise";
import Loading from "../../../components/Loading/Loading";
import { Box } from "@mui/material";
import DataNotFound from "../Common/DataNotFound";
import downloadFile from "../../../util";
import DownloadButton from "../Common/DownloadButton";
import { ChartDownloadMenu } from "../Common/ChartTitleBar";

const MTBFComponent = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
}) => {
  const [loading, setLoading] = React.useState(true);

  const initialState = {
    MTBFReportData: {
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
    GET: "get-MTBF-report-data",
  };

  const reducer = (state, action) => {
    switch (action?.type) {
      case ACTION?.GET:
        return {
          ...state,
          isLoading: false,
          message: action?.message,
          MTBFReportData: action?.MTBFReportData,
        };

      default:
        return state;
    }
  };

  const [reduceState, reducerDispatch] = useReducer(reducer, initialState);

  const getMTBFReportData = async () => {
    setLoading(true);

    try {
      const res = await fetch(
        // `/getMtbfData/${flagForTogglingFilter}/632c41261d1becfedab325f9/?selectedYear=${selectedYear}`,
        `/getMtbfData/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}`,
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
      // console.log("response:", response);

      if (res?.status === 201) {
        reducerDispatch({
          type: ACTION.GET,
          message: response.message,
          MTBFReportData: response.data,
        });
      }
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  const header = ["Months"].concat(reduceState.MTBFReportData?.labels);

  const handleDownload = async (fileType) => {
    try {
      let bodyData = [];
      if (fileType === "csv") {
        bodyData = [
          [
            ["Months"].concat(reduceState.MTBFReportData?.labels)?.toString() +
              "\n",
          ],
          [
            ["Hours"].concat(reduceState.MTBFReportData?.data)?.toString() +
              "\n",
          ],
        ];
      } else {
        bodyData = [["Hours"].concat(reduceState.MTBFReportData?.data)];
      }

      downloadFile(bodyData, fileType, header, `MTBF_${selectedYear}`);
    } catch (error) {
      console.error("Error downloading data:", error);
    }
  };

  useEffect(() => {
    if (selectedValue) getMTBFReportData();
  }, [selectedValue, selectedYear]);

  let isDataExists = reduceState?.MTBFReportData?.data?.length > 0 || false;

  return (
    <SmallChartCardComponent
      title="MTBF"
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
            MTBF={true}
            ReportData={reduceState?.MTBFReportData}
          />
        )}
      </Box>
    </SmallChartCardComponent>
  );
};

export default MTBFComponent;
