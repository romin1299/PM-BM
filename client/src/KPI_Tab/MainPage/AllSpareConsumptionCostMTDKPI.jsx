import React, { useEffect, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Chart } from "react-chartjs-2";
import { Col, Row } from "react-bootstrap";
import { Box, Divider, Typography } from "@mui/material";
import DataNotFound from "../../BM/Reports/Common/DataNotFound";
import ChartDataLabels from "chartjs-plugin-datalabels";
import axios from "axios";
import { chartColors } from "../../BM/Utils/ChartUtils/chartEnums";
import ChartTitleBar from "../../BM/Reports/Common/ChartTitleBar";

const AllSpareConsumptionCostMTDKPI = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
  selectedMonth,
}) => {
  ChartJS.register(ArcElement, Tooltip, Legend);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  const options = {
    plugins: {
      legend: {
        position: "bottom",
        align: "center",
        labels: {
          usePointStyle: true,
        },
      },
      datalabels: {
        formatter: (value, context) => {
          return `RS. (${value})`;
        },
        font: { size: 12 },
      },
    },
  };

  const chartData = {
    labels: ["PM", "BM", "Corrective", "Predictive", "Kaizen"],
    datasets: [
      {
        label: "Total Cost",
        data: data,
        backgroundColor: chartColors?.MTDSpareKPIPie,
        // borderColor: chartColors.tmSkillPie,
        borderWidth: 1,
      },
    ],
  };

  const styleObjAndClassNameForSpanValue = {
    className: "border d-flex justify-content-center align-items-center",
    style: { fontSize: "13px", fontWeight: "bold" },
  };

  const getAllSpareConsumptionCostMTDKPI = async () => {
    setLoading(true);

    const url = `/common/getAllSpareConsumptionCostMTDKPI/${flagForTogglingFilter}/${selectedValue}`;
    const params = { selectedYear, selectedMonth };

    try {
      const res = await axios.get(url, {
        params,
        withCredentials: true,
        credentials: "include",
      });

      setData(res?.data?.TotalSpareCostWithDifferentTypes);
    } catch (error) {
      console.log("error:", error);
    }

    setLoading(false);
  };

  useEffect(() => {
    setLoading(false);
    if (selectedValue) getAllSpareConsumptionCostMTDKPI();
  }, [selectedValue, selectedMonth, selectedYear]);

  return (
    <>
      <Box className="cell p-3">
        <ChartTitleBar title="Plant Maintenance Cost" fontWeight={500} />

        <Row className="mb-2">
          <Col>
            <span className="d-block  " style={{ fontSize: "13px" }}>
              Planned Budget
            </span>
            <span {...styleObjAndClassNameForSpanValue}>100%</span>
          </Col>
          <Col>
            <span className="d-block  " style={{ fontSize: "13px" }}>
              Actual Budget
            </span>
            <span {...styleObjAndClassNameForSpanValue}>90%</span>
          </Col>
        </Row>

        <Box
          className="ratio ratio-1x1"
          // sx={{ height: { xs: "300px", md: "350px" } }}
          sx={{ maxHeight: "350px" }}
        >
          {/* {category?.bdCount === undefined ? (
          <DataNotFound />
        ) : ( */}
          <Chart
            type="pie"
            data={chartData}
            options={options}
            plugins={[ChartDataLabels]}
          />
          {/* )} */}
        </Box>
      </Box>
    </>
  );
};

export default AllSpareConsumptionCostMTDKPI;
