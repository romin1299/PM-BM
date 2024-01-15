import React, { useEffect } from "react";
import { Row, Col } from "reactstrap";
import { Box } from "@mui/material";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

import ChartDataLabels from "chartjs-plugin-datalabels";
import { Doughnut } from "react-chartjs-2";

import { chartColors } from "../../Utils/ChartUtils/chartEnums";
import DataNotFound from "../Common/DataNotFound";
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
          (item, i) => chartColors.monthlyBDTrend[i]
        ),
        // borderWidth: 0,
      },
    ],
  };

  return (
    <Box className="cell p-3">
      <ChartTitleBar title={`${category?.category} Category`} />
      {/* <ChartTitleBar title="BD Hours Vs Count" /> */}
      {/* <Typography variant="body1" style={{ fontSize: "1rem" }}>
        {category?.category} Category
      </Typography> */}

      {/* <Divider sx={{ mt: 1, mb: 2, borderColor: "gray" }} /> */}

      <Box
        className="ratio ratio-1x1"
        // sx={{ height: { xs: "300px", md: "350px" } }}
        sx={{ maxHeight: "350px" }}
      >
        {category?.bdCount === undefined ? (
          <DataNotFound />
        ) : (
          <Doughnut
            data={chartData}
            options={options}
            plugins={[ChartDataLabels]}
          />
        )}
      </Box>
    </Box>
  );
};

const CategoryDoughnutChart = () => {
  const [categories, setCategories] = React.useState([]);

  //   const BDCategoryAndFactor = async () => {
  //     try {
  //       const res = await fetch(
  //         `/getPieChartData/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}&&selectedMonth=${selectedMonth}`,
  //         {
  //           method: "GET",
  //           headers: {
  //             Accept: "application/json",
  //             "Content-Type": "application/json",
  //           },
  //           credentials: "include",
  //         }
  //       );
  //       const response = await res.json();
  //       if (res.status === 201) {
  //         console.log(response);
  //         setCategories(response?.categoriesPieChartData);
  //       }
  //     } catch (error) {
  //       console.log(error);
  //     }
  //   };

  //   useEffect(() => {
  //     if (selectedValue) {
  //       BDCategoryAndFactor();
  //     }
  //   }, [selectedValue, selectedYear, selectedMonth]);

  useEffect(() => {
    setCategories([
      {
        category: "BD",
        subcategories: ["Minor"],
        bdCount: [1],
        bdTime: [1.5333333333333334],
      },
      {
        category: "Problem",
        subcategories: ["Electronics"],
        bdCount: [1],
        bdTime: [1.5333333333333334],
      },
    ]);
  }, []);

  return (
    <>
      <Row className="g-3">
        {categories?.map((category, index) => (
          <Col key={index} sm={6} xs={12}>
            <ChartCard category={category} />
          </Col>
        ))}
      </Row>
    </>
  );
};

export default CategoryDoughnutChart;
