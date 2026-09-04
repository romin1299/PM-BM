import React from "react";
import { Box } from "@mui/material";
import ChartTitleBar from "../../../../BM/Reports/Common/ChartTitleBar";
import StackedBarChart from "../../SpareInventoryReport/SubComponent/ChartComponents/StackedBarChart";
import { ChartComponent } from "../../SpareKPI/SubComponent/ChartComponents/ChartWrapper";
import colorsBasedOnOkNGStatus from "../../../../Utils/colorsBasedOnOkNGStatus";

const EachChartComponent = ({
  title = "",
  monthlyStatus = [],
  chartData = {
    labels: [],
    datasets: [],
  },
}) => {
  // const handleDownload = async () => {};

  return (
    <Box className="cell p-3">
      <ChartTitleBar
        title={title}
        titleProps={{
          fontSize: 16,
        }}
        Toolbar={
          <>
            {monthlyStatus?.length > 0 &&
              monthlyStatus?.map(({ label = "", value = "" }) => (
                <div className="col-auto">
                  <span
                    className="border col-auto d-flex align-items-center justify-content-center m-1"
                    style={{
                      width: "5rem",
                      height: "1.5rem",
                      color: "white",
                      background: colorsBasedOnOkNGStatus(value),
                    }}
                  >
                    {label}
                  </span>
                </div>
              ))}
            {/* <div className="col-auto">
              <ChartDownloadMenu
                handleDownloadCSV={() => {
                  handleDownload("csv");
                }}
                handleDownloadPDF={() => {
                  handleDownload("pdf");
                }}
              />
            </div> */}
          </>
        }
      />

      <Box
        sx={{
          height: { xs: "250px", md: "300px" },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <StackedBarChart
          chartData={chartData}
          ChartComponent={ChartComponent}
        />
      </Box>
    </Box>
  );
};

export default EachChartComponent;
