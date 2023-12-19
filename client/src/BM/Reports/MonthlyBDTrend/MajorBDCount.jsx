import { Box, Paper, Typography } from "@mui/material";
import React from "react";
import { Col, Row } from "react-bootstrap";
import { Bar } from "react-chartjs-2";
import { MONTH_LABELS, chartColors } from "../../Utils/ChartUtils/chartEnums";
import axios from "axios";
import DataNotFound from "../Common/DataNotFound";

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
    datalabels: {
      display: false,
    },
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

const MajorBDCount = ({ currentTabViewName, sectionId, selectedYear }) => {
  const [data, setData] = React.useState([]);
  const [chartData, setChartData] = React.useState({
    labels: [],
    datasets: [],
  });

  // const d = new Date();
  // let year = d.getFullYear().toString().slice(-2);
  // let month = d.getMonth().toString();

  const fetchChartData = async () => {
    const url =
      currentTabViewName === "Plant"
        ? `/majorBDCountForPlant`
        : `/majorBDCountForSection/based-on-subSection/${sectionId}`;

    const params = { selectedYear };

    // /majorBDCountForPlant
    // /majorBDCountForSection/based-on-subSection/6322e5dffdb4a3119153b9e7

    try {
      const res = await axios.get(url, {
        params,
        withCredentials: true,
        credentials: "include",
      });

      // console.log("BD count res:", res?.data?.bdTrendData);
      const data = res?.data?.bdTrendData;
      setData(data);

      if (data) {
        setChartData({
          labels: labels,
          datasets: data?.map((item, index) => ({
            type: "bar",
            stack: "bar-stacked",
            label: item?.label || item?._id,
            data: item?.data,
            backgroundColor: chartColors.palettes[0][index],
          })),
        });
      }
    } catch (error) {
      console.log("error:", error);
      setData([]);
      setChartData({
        labels: [],
        datasets: [],
      });
    }
  };

  React.useEffect(() => {
    if (selectedYear) fetchChartData();
  }, [currentTabViewName, sectionId, selectedYear]);

  function sumOfArray(array) {
    return array?.reduce((accumulator, currentValue) => {
      return accumulator + currentValue;
    }, 0);
  }

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
            FY 23:
          </Typography>

          <Typography variant="h6" component="h6" className="mt-3">
            <b>Target →</b> 12 Nos/Year
          </Typography>

          <Box className="row cell" sx={{ m: 0, mt: 3, display: "flex" }}>
            {data?.map((item, index) => (
              <Box className="col col-4" sx={sectionBoxStyle} key={index}>
                <Typography variant="h6" textAlign="center" fontWeight={600}>
                  {item.label}
                </Typography>
                <Box sx={sectionBodyBoxStyle}>
                  <Typography variant="h4" textAlign="center" fontWeight={600}>
                    {sumOfArray(item?.data)}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Col>

        <Col md={12} lg={6}>
          <Paper variant="outlined" className="cell p-3">
            <Typography
              className="col"
              variant="h5"
              component="h5"
              sx={{ fontWeight: "500" }}
            >
              Sections
            </Typography>
            <Box sx={{ height: { xs: "300px", md: "350px" } }}>
              {chartData === undefined || chartData?.datasets?.length < 1 ? (
                <DataNotFound />
              ) : (
                <Bar options={options} data={chartData} />
              )}
            </Box>
          </Paper>
        </Col>
      </Row>
    </Box>
  );
};

export default MajorBDCount;
