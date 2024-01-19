import React, { useEffect } from "react";
import { Row, Col } from "reactstrap";
import { Box, Paper } from "@mui/material";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

import ChartDataLabels from "chartjs-plugin-datalabels";
import { Doughnut } from "react-chartjs-2";

import { chartColors } from "../../Utils/ChartUtils/chartEnums";
import DataNotFound from "../Common/DataNotFound";
import ChartTitleBar from "../Common/ChartTitleBar";

import { CommonDropdown } from "../ManHourReport/SubComponents/LineSelectionDropdown";
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
        // borderWidth: 0,
      },
    ],
  };

  return (
    <Paper variant="outlined">
      <div className="p-3 pb-0">
        <ChartTitleBar title={`${category?.category}`} />
      </div>

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
    </Paper>
  );
};

const CategoryDoughnutChart = ({
  flagForTogglingFilter,
  selectedValue,
  selectedYear,
  groupData,
}) => {
  const [loading, setLoading] = React.useState(true);
  const [categories, setCategories] = React.useState([]);

  const [selectedGroup, setSelectedGroup] = React.useState("");

  const getMachineAgePieChart = async () => {
    setLoading(true);
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
        setLoading(false);
        return;
      }
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  useEffect(() => {
    setLoading(false);
    if (selectedGroup) {
      getMachineAgePieChart();
    }
  }, [selectedYear, selectedGroup]);

  useEffect(() => {
    setSelectedGroup(groupData?.[0]?._id);
  }, [groupData?.[0]?._id]);

  return (
    <Box className="cell p-3">
      <Row>
        <Col></Col>
        <Col className="col-auto">
          <CommonDropdown
            selectedItem={selectedGroup}
            setSelectedItem={setSelectedGroup}
            arr={groupData}
            defaultTitle="Group"
            objKeyName="group"
          />
        </Col>
      </Row>

      <Row className="g-3 mt-0">
        {[0, 1]?.map((key) => (
          <Col key={key} sm={6} xs={12}>
            {loading ? (
              <Loading height={200} />
            ) : categories?.[key] ? (
              <ChartCard category={categories?.[key]} />
            ) : (
              <DataNotFound sx={{ mb: 0 }} />
            )}
          </Col>
        ))}
      </Row>
    </Box>
  );
};

export default CategoryDoughnutChart;
