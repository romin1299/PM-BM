import React, { memo } from "react";
import { Chart } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import ChartDataLabels from "chartjs-plugin-datalabels";
import annotationPlugin from "chartjs-plugin-annotation";

import { Box } from "@mui/material";
import ChartTitleBar, {
  ChartDownloadMenu,
} from "../../../../../BM/Reports/Common/ChartTitleBar";

import useSafeGetRequest from "../../../../../CustomHooks/useSafeGetRequest";
import Loading from "../../../../../components/Loading/Loading";
import DataNotFound from "../../../../../BM/Reports/Common/DataNotFound";

const DEFAULT_INITIAL_STATE = {
  isLoading: true,
  isError: false,
  data: {
    chartData: [],
  },
};

export const ChartComponent = ({ chartProps, registerProps }) => {
  ChartJS.register({
    CategoryScale,
    LinearScale,
    Title,
    Tooltip,
    Legend,
    ChartDataLabels,
    annotationPlugin,
    ...registerProps,
  });
  return <Chart {...chartProps} />;
};

const ChartWrapper = ({
  title = "Consumption trend (Cost & Qty)",
  url = "/v1/spare/kpi/consumptionTrend",
  params = {},
  otherParams = {},
  referenceArrayForUseEffect = [],
  otherEffectReference = [],
  ChartMiddlewareComponent = null,
  OtherToolbar = null,
  otherProps = {},
  handleDownloadCSVOrPDF = ({ format = "csv", data = {} }) => {},
  filters = [],
  csvOrPDfFileNamePostPix = "",
  header = ["Sections", "Quantity", "Cost in Mil"],
  chartHeight = { xs: "250px", md: "300px" },
}) => {
  const [{ isLoading, isError, data }] = useSafeGetRequest({
    url,
    axiosConfig: {
      params: { ...params, ...otherParams },
    },
    referenceArrayForUseEffect: [
      ...referenceArrayForUseEffect,
      ...otherEffectReference,
    ],
    initialState: DEFAULT_INITIAL_STATE,
  });

  return (
    <Box className="cell p-3 mb-3">
      <ChartTitleBar
        title={title}
        titleProps={{
          fontSize: 16,
        }}
        Toolbar={
          <>
            {OtherToolbar}
            <div className="col-auto">
              <ChartDownloadMenu
                handleDownloadCSV={() => {
                  handleDownloadCSVOrPDF({
                    format: "csv",
                    fileName: title,
                    csvOrPDfFileNamePostPix,
                    header,
                    filters,
                    ...data,
                  });
                }}
                handleDownloadPDF={() => {
                  handleDownloadCSVOrPDF({
                    format: "pdf",
                    fileName: title,
                    csvOrPDfFileNamePostPix,
                    header,
                    filters,
                    ...data,
                  });
                }}
              />
            </div>
          </>
        }
      />

      <Box
        sx={{
          height: chartHeight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isLoading ? (
          <Loading />
        ) : isError ? (
          <DataNotFound />
        ) : (
          <ChartMiddlewareComponent
            {...data}
            ChartComponent={ChartComponent}
            {...otherProps}
          />
        )}
      </Box>
    </Box>
  );
};

export default memo(ChartWrapper);
