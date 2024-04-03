import { Box, Paper, Typography } from "@mui/material";
import React from "react";
import { Col, Row } from "react-bootstrap";
import { Bar } from "react-chartjs-2";
import { chartColors } from "../../Utils/ChartUtils/chartEnums";
import axios from "axios";
import DataNotFound from "../Common/DataNotFound";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { commonDatalabels } from "../../Utils/ChartUtils/chartOptions";
import { getRandomDataArray } from "../../Utils/math/generateRandomValues";
import Loading from "../../../components/Loading/Loading";
import { isChartDataExist } from "../../Utils/functions/isChartDataExist";
import ChartTitleBar, { ChartDownloadMenu } from "../Common/ChartTitleBar";
import downloadFile from "../../../util";
import findFilters from "../../../filterNames";

const sectionBoxStyle = {
  p: 1,
  // width: "100%",
};

const sectionBodyBoxStyle = {
  height: "100px",
  display: "flex",
  borderRadius: "6px",
  gap: "10px",
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "#c6efce", //alternative color #deebf7
};

export const options = {
  maintainAspectRatio: false,
  responsive: true,
  interaction: {
    mode: "index",
    intersect: false,
  },
  plugins: {
    title: {
      display: false,
      text: "Hourly Trend",
    },
    legend: {
      align: "end",
      labels: {
        usePointStyle: true,
      },
      padding: 1,
    },
    datalabels: commonDatalabels,
  },
  scales: {
    x: {
      stacked: true,
      grid: {
        display: false, // Hide vertical grid lines
      },
      ticks: {
        // autoSkip: false,
        maxRotation: 90,
        minRotation: 90,
        color: "black",
      },
    },
    y: {
      stacked: true,
      grid: {
        display: false,
      },
      title: {
        display: true,
        text: "Nos",
      },
      ticks: {
        color: "black",
      },
    },
  },
};

const labels = [
  "Apr-23",
  "May-23",
  "Jun-23",
  "Jul-23",
  "Aug-23",
  "Sep-23",
  "Oct-23",
  "Nov-23",
  "Dec-23",
  "Jan-24",
  "Feb-24",
  "Mar-24",
];

const MajorBDCount = ({
  filterState,
  currentTabViewName,
  sectionId,
  selectedYear,
  userDetails,
}) => {
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState([]);
  const [targetTotal, setTargetTotal] = React.useState([]);
  const [chartData, setChartData] = React.useState({
    labels: [],
    datasets: [],
  });

  const { flagForTogglingFilter, selectedValue } = filterState;

  const { filteredValuesWithHOD, filteredValues } = findFilters(
    flagForTogglingFilter,
    filterState,
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

  const fetchChartData = async () => {
    setLoading(true);

    // const basedON = currentTabViewName === "Plant" ? "plantId" : "subSection";
    // const selectedId = currentTabViewName === "Plant" ? "undefined" : sectionId;

    // const url =
    //   currentTabViewName === "Plant"
    //     ? `/majorBDCountForPlant`
    //     : `/majorBDCountForSection/based-on-subSection/${sectionId}`;
    // const url = `/majorBDCount${
    //   currentTabViewName === "Section" ? "ForSection" : ""
    // }/based-on-${basedON}/${selectedId}`;

    const url = `/majorBDCount${
      currentTabViewName === "Section" ? "ForSection" : ""
    }/${flagForTogglingFilter}/${selectedValue}`;
    // console.log("url:", url);

    const params = { selectedYear };

    try {
      const res = await axios.get(url, {
        params,
        withCredentials: true,
        credentials: "include",
      });
      // console.log("major bd count trend res:", res);

      const data = res?.data?.bdTrendData;
      const barDatasets = res?.data?.bdTrendData?.map((item, index) => ({
        type: "bar",
        stack: "bar-stacked",
        label: item?.label || item?._id,
        data: item?.data,
        backgroundColor: chartColors.sections[index],
        borderRadius: 4,
        //borderColor: "#312A7D",
        //borderWidth: 2,
      }));

      const targetData = res?.data?.bdTrendDataTarget;
      const targetDataTotal = setTargetTotal(res?.data?.targetTotal);
      // const targetData = getRandomDataArray(12, 5, 8);

      if (data) {
        setData(data);
        setChartData({
          labels: res?.data?.labels,
          datasets: [
            {
              type: "line",
              label: "Target",
              data: targetData,
              //borderWidth: 2,
              borderColor: chartColors.target2,
              backgroundColor: chartColors.target2,
              pointStyle: "rectRot",
            },
            ...barDatasets,
          ],
        });
      }

      // if (data) {
      //   setChartData({
      //     labels: labels,
      //     datasets: data?.map((item, index) => ({
      //       type: "bar",
      //       stack: "bar-stacked",
      //       label: item?.label || item?._id,
      //       data: item?.data,
      //     })),
      //   });
      // }
    } catch (error) {
      console.log("error:", error);
      setData([]);
      setChartData({
        labels: [],
        datasets: [],
      });
    }

    setLoading(false);
  };

  const header = ["Labels", ...labels];
  const handleDownload = async (fileType) => {
    try {
      // const bodyData = [chartData].map((item) => [
      //   item.datasets.map((a) => a.label).join("\n"),
      //   item.datasets.map((a) => a.data).join("\n"),
      // ]);

      let bodyData = [];
      let filterData = [];

      if (fileType === "csv") {
        bodyData = [
          ["Filters", ...arrayItems]?.toString() + "\n",
          ["\n"],
          ["Months", ...labels]?.toString() + "\n",
          ...chartData?.datasets.map(
            (dataset) => [dataset.label, ...dataset.data]?.toString() + "\n"
          ),
        ];
      } else {
        bodyData = [
          ...chartData?.datasets.map((dataset) => [
            dataset.label,
            ...dataset.data,
          ]),
        ];
        filterData = ["Filters", ...arrayItems];
      }

      downloadFile(filterData, bodyData, fileType, header, "Major_Bd_Count");
    } catch (error) {
      console.error("Error downloading data:", error);
    }
  };

  React.useEffect(() => {
    if (flagForTogglingFilter && selectedValue && selectedYear)
      fetchChartData();
  }, [flagForTogglingFilter, selectedValue, selectedYear]);

  function sumOfArray(array) {
    return array?.reduce((accumulator, currentValue) => {
      return accumulator + currentValue;
    }, 0);
  }

  console.log("chartData:", chartData);

  const isDataExists = isChartDataExist(chartData);

  return (
    <Box className="cell p-3 mt-3">
      <Row className="gy-3">
        <Col md={12} lg={6}>
          <Typography
            variant="h5"
            component="h5"
            sx={{ fontWeight: "500", textDecoration: "underline" }}
          >
            Major Breakdown Count
          </Typography>

          <Typography variant="h6" component="h6" className="mt-3">
            FY : {selectedYear}
          </Typography>

          <Typography variant="h6" component="h6" className="mt-3">
            <b>Target →</b> {targetTotal}/year
          </Typography>

          <Box className="row cell" sx={{ m: 0, mt: 3, display: "flex" }}>
            {loading ? (
              <Loading height={100} />
            ) : (
              <>
                {data?.map((item, index) => (
                  <Box className="col col-4" sx={sectionBoxStyle} key={index}>
                    <Typography
                      variant="h6"
                      textAlign="center"
                      fontWeight={600}
                    >
                      {item.label}
                    </Typography>
                    <Box sx={sectionBodyBoxStyle}>
                      <Typography
                        variant="h4"
                        textAlign="center"
                        fontWeight={600}
                      >
                        {sumOfArray(item?.data)}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </>
            )}
          </Box>
        </Col>

        <Col md={12} lg={6}>
          <Paper variant="outlined" className="cell p-3">
            {/* <Typography
              className="col"
              variant="h5"
              component="h5"
              sx={{ fontWeight: "500" }}
            >
              Sections
            </Typography> */}

            <ChartTitleBar
              title="Sections"
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
                <Bar
                  options={options}
                  data={chartData}
                  plugins={[ChartDataLabels]}
                />
              )}
            </Box>
          </Paper>
        </Col>
      </Row>
    </Box>
  );
};

export default MajorBDCount;
