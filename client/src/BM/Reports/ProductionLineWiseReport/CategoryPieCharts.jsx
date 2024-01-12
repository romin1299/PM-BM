import React, { useEffect } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Chart } from "react-chartjs-2";
import { Col, Row } from "react-bootstrap";
import { Box, Divider, Typography } from "@mui/material";
import axios from "axios";
import { chartColors } from "../../Utils/ChartUtils/chartEnums";
import DataNotFound from "../Common/DataNotFound";
import ChartDataLabels from "chartjs-plugin-datalabels";
import Loading from "../../../components/Loading/Loading";
import ChartTitleBar from "../Common/ChartTitleBar";

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
        font: {  size: 12 },
        // color: chartColors.categoryPieFont,
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
          (item, i) => chartColors.categoryPie[i]
        ),
        // borderColor: chartColors.tmSkillPie,
        borderWidth: 1,
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
        sx={{ maxHeight: "350px" }}
      >
        {category?.bdCount === undefined ? (
          <DataNotFound />
        ) : (
          <Chart
            type="pie"
            data={chartData}
            options={options}
            plugins={[ChartDataLabels]}
          />
        )}
      </Box>
    </Box>
  );
};

const CategoryPieCharts = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
  selectedMonth,
}) => {
  const [categories, setCategories] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const fetchChartData = async () => {
    setLoading(true);

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
      // setCategories([]);
      console.log("error:", error);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (selectedValue) fetchChartData();
  }, [selectedValue, selectedYear]);

  if (loading) {
    return (
      <Box className="cell p-3">
        <ChartTitleBar title="Categories" />
        <Loading height={300} />
      </Box>
    );
  }

  return (
    <Row className="g-2">
      {categories?.map((category, index) => (
        <Col key={index} sm={6} xs={12}>
          <ChartCard category={category} />
        </Col>
      ))}
    </Row>
  );
};

export default CategoryPieCharts;
