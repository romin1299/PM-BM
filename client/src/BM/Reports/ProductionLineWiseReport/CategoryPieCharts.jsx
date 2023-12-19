import React, { useEffect, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Chart } from "react-chartjs-2";
import { Col, Container, Row } from "react-bootstrap";
import { Box, Divider, Typography } from "@mui/material";
import axios from "axios";
import { chartColors } from "../../Utils/ChartUtils/chartEnums";
import DataNotFound from "../Common/DataNotFound";

const CategoryPieCharts = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
  selectedMonth,
}) => {
  const [categories, setCategories] = React.useState([]);

  const ChartCard = ({ category }) => {
    ChartJS.register(ArcElement, Tooltip, Legend);

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
            return `${Math.round(value * 100) / 100} (${
              Math.round(category?.bdCount?.[context?.dataIndex] * 100) / 100
            })`;
          },
        },
      },
    };

    const chartData = {
      labels: category?.subcategories,
      datasets: [
        {
          label: "Hour",
          data: category?.bdTime,
          backgroundColor: category?.subcategories?.map(
            (item, i) => chartColors[i]
          ),
        },
      ],
    };

    return (
      <Box className="cell p-3">
        {/* <ChartTitleBar title="BD Hours Vs Count" /> */}
        <Typography variant="body1" style={{ fontSize: "1rem" }}>
          {category?.category} Category
        </Typography>

        <Divider sx={{ mt: 1, mb: 2, borderColor: "gray" }} />

        <Box
          className="ratio ratio-1x1"
          // sx={{ height: { xs: "300px", md: "350px" } }}
        >
          {category?.bdCount === undefined ? (
            <DataNotFound />
          ) : (
            <Chart type="pie" data={chartData} options={options} />
          )}
        </Box>
      </Box>
    );
  };

  const fetchChartData = async () => {
    const url = `/getPieChartData/${flagForTogglingFilter}/${selectedValue}`;
    const params = { selectedYear, selectedMonth };

    try {
      const res = await axios.get(url, {
        params,
        withCredentials: true,
        credentials: "include",
      });

      // console.log("pie chart data res:", res);
      setCategories(res?.data?.categoriesPieChartData);
    } catch (error) {
      console.log("error:", error);
    }
  };

  useEffect(() => {
    if (selectedValue) fetchChartData();
  }, [selectedValue, selectedYear]);

  return (
    <Row className="g-2">
      {categories?.map((category, index) => (
        <Col key={index} className="" lg={6} md={6} sm={12}>
          <ChartCard category={category} />
        </Col>
      ))}
    </Row>
  );
};

export default CategoryPieCharts;
