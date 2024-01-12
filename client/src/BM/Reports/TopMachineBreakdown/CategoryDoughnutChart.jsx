import React, { useEffect } from "react";
import { Row, Col } from "reactstrap";
import { Box } from "@mui/material";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

import ChartDataLabels from "chartjs-plugin-datalabels";
import { Doughnut } from "react-chartjs-2";

import { chartColors } from "../../Utils/ChartUtils/chartEnums";
import DataNotFound from "../Common/DataNotFound";
import ChartTitleBar from "../Common/ChartTitleBar";

import { CommonDropdown } from "../ManHourReport/SubComponents/LineSelectionDropdown";

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

const CategoryDoughnutChart = ({
  flagForTogglingFilter,
  selectedValue,
  selectedYear,
  groupData,
}) => {
  const [categories, setCategories] = React.useState([]);

  const [selectedGroup, setSelectedGroup] = React.useState("");

  const getMachineAgePieChart = async () => {
    try {
      const res = await fetch(
        `/getMachineAgePieChart/${flagForTogglingFilter}/${selectedValue}/${selectedGroup}/?selectedYear=${selectedYear}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );
      const { data } = await res.json();
      if (res.status === 201 || data) {
        setCategories(data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (selectedGroup) {
      getMachineAgePieChart();
    }
  }, [selectedYear, selectedGroup]);

  useEffect(() => {
    setSelectedGroup(groupData?.[0]?._id);
  }, [groupData?.[0]?._id]);

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
      <CommonDropdown
        selectedItem={selectedGroup}
        setSelectedItem={setSelectedGroup}
        arr={groupData}
        defaultTitle="Group"
        objKeyName="group"
      />
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
