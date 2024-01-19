import React, { useEffect } from "react";
import { Row, Col } from "reactstrap";
import { Box } from "@mui/material";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

import ChartDataLabels from "chartjs-plugin-datalabels";
import { Doughnut } from "react-chartjs-2";

import { chartColors } from "../../Utils/ChartUtils/chartEnums";
import DataNotFound from "../Common/DataNotFound";
import ChartTitleBar from "../Common/ChartTitleBar";
import Loading from "../../../components/Loading/Loading";

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
          (item, i) => chartColors.categoryPie[i]
        ),
        // borderColor: chartColors.tmSkillPie,
        borderWidth: 0,
      },
    ],
  };

  return (
    <Box variant="outlined" className="cell">
      <div className="p-3 pb-0">
        <ChartTitleBar title={`${category?.category}`} />
      </div>
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

const BDCategoryAndFactor = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
  selectedMonth,
}) => {
  const [loading, setLoading] = React.useState(true);
  const [categories, setCategories] = React.useState([]);

  const BDCategoryAndFactor = async () => {
    setLoading(true);

    try {
      const res = await fetch(
        `/getPieChartData/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}&&selectedMonth=${selectedMonth}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );
      const response = await res.json();
      if (res.status === 201) {
        // console.log(response);
        setCategories(response?.categoriesPieChartData);
        setLoading(false);
        return;
      }
      setCategories([]);
    } catch (error) {
      setCategories([]);
      console.log(error);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (selectedValue) {
      BDCategoryAndFactor();
    }
  }, [selectedValue, selectedYear, selectedMonth]);

  /**
   * [0,1] is implemented to show only first two categories
   * If dynamic categories is needed to show then map through categories array
   * categories.map((cat)=>{})
   *
   * For Chart Component
   * If API call promise is not fullfiled then show loading component and wait for the response
   *
   * When response is received, check if data array has values
   * If the data array has values then plot the chart
   * else data array is empty then show No Data Found component
   */

  return (
    <>
      <Row className="g-3">
        {[0, 1]?.map((key) => (
          <Col key={key} sm={6} xs={12}>
            {loading ? (
              <Box className="cell p-3">
                <Loading height={200} />
              </Box>
            ) : categories?.[key] ? (
              <ChartCard category={categories?.[key]} />
            ) : (
              <Box className="cell p-3" sx={{ height: 250 }}>
                <DataNotFound sx={{ mb: 0 }} />
              </Box>
            )}
          </Col>
        ))}
      </Row>
    </>
  );
};

export default BDCategoryAndFactor;
