import React, { useEffect, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Chart } from "react-chartjs-2";
import { Col, Container, Row } from "react-bootstrap";
import { Box, Divider, Typography } from "@mui/material";
import axios from "axios";
import { chartColors } from "../../Utils/ChartUtils/chartEnums";

ChartJS.register(ArcElement, Tooltip, Legend);

const initialData = {
  labels: [],
  datasets: [
    {
      label: "",
      data: [],
      backgroundColor: [],
    },
  ],
};

const CategoryPieCharts = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
  selectedMonth,
}) => {
  const ChartCard = ({ category }) => {
    const [data, setData] = useState(initialData);

    useEffect(() => {
      fetchChartData();
    }, [selectedValue, selectedYear, selectedMonth]);

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
            return `${value}:${data?.hours?.[context?.dataIndex]}`;
          },
        },
      },
    };

    const fetchChartData = async () => {
      try {
        const res = await axios.get(
          // `/get${category}CategoryPieChart/${flagForTogglingFilter}/6322e5b1fdb4a3119153b9d9`,
          `/get${category}CategoryPieChart/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}&&selectedMonth=${selectedMonth}`,
          {
            withCredentials: true,
            credentials: "include",
          }
        );

        let resData;
        if (category === "Bd") {
          resData = res?.data?.bdCategoryPieChart;
        } else {
          resData = res?.data?.problemCategoriesPieChart;
        }
        setData(resData);
      } catch (error) {
        console.log("error:", error);
      }
    };

    const chartData = {
      labels: data?.labels,
      datasets: [
        {
          label: "count",
          data: data?.count,
          // backgroundColor: Array.from(
          //   { length: data?.labels?.length },
          //   (_, i) => chartColors[i]
          // ),
          backgroundColor: data?.labels?.map((item, i) => chartColors[i]),
        },
      ],
    };

    return (
      <Box className="cell p-3">
        <Typography variant="body1" style={{ fontSize: "1rem" }}>
          Problem Category
        </Typography>

        <Divider sx={{ mt: 1, mb: 2, borderColor: "gray" }} />

        <Chart type="pie" data={chartData} options={options} />
      </Box>
    );
  };

  return (
    <Row className="g-2">
      <Col className="" lg={6} md={6} sm={12}>
        <ChartCard category="Problem" />
      </Col>

      <Col className="" lg={6} md={6} sm={12}>
        <ChartCard category="Bd" />
      </Col>
    </Row>
  );
};

export default CategoryPieCharts;
