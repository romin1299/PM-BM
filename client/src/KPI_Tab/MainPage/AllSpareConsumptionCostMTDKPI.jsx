import React, { useEffect, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Chart } from "react-chartjs-2";
import { Col, Row } from "react-bootstrap";
import { Box, Divider, Typography } from "@mui/material";
import DataNotFound from "../../BM/Reports/Common/DataNotFound";
import ChartDataLabels from "chartjs-plugin-datalabels";
import axios from "axios";
import { chartColors } from "../../BM/Utils/ChartUtils/chartEnums";

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
        {/* <ChartTitleBar title="BD Hours Vs Count" /> */}
        <Typography variant="body1" style={{ fontSize: "1rem" }}>
          Plant Maintenance Cost
        </Typography>

        <Divider sx={{ mt: 1, mb: 2, borderColor: "gray" }} />

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
