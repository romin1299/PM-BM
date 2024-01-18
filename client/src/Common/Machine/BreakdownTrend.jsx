import { Box } from "@mui/material";
import React, { useState, useEffect } from "react";
import { Row, Col, ListGroup } from "react-bootstrap";
import { Bar } from "react-chartjs-2";
import ChartTitleBar from "../../BM/Reports/Common/ChartTitleBar";
import { barChartOptions } from "../../BM/Utils/ChartUtils/chartOptions";
import { chartColors } from "../../BM/Utils/ChartUtils/chartEnums";

const BreakdownTrend = ({ search }) => {
  const [BdTrendAndLastFiveProblem, setBdTrendAndLastFiveProblem] = useState({
    breakdownTrendData: {
      labels: [],
      data: [],
    },
    lastFiveProblem: [],
  });
  const getBreakdownTrendData = async () => {
    try {
      let currentYear =
        new Date().getMonth() < 3
          ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
          : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

      const res = await fetch(
        `/getBreakdownTrendData/${search}&&selectedYear=${currentYear}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );
      const { BdTrendAndLastFiveProblem } = await res.json();
      if (res.status === 201) {
        setBdTrendAndLastFiveProblem(BdTrendAndLastFiveProblem);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getBreakdownTrendData();
  }, [search]);

  const dataset = {
    labels: BdTrendAndLastFiveProblem?.breakdownTrendData?.labels,
    datasets: [
      {
        label: "Breakdown Trend",
        data: BdTrendAndLastFiveProblem?.breakdownTrendData?.data,
        backgroundColor: chartColors.dailyBDTrend[2],
        // borderColor: chartColors.dailyBDTrendBorder[2],
        // borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  return (
    <Row className="mt-1 gy-2 gx-3">
      <Col lg={6}>
        <Box className="cell p-3">
          <ChartTitleBar title={"Breakdown Trend"} />

          <Box sx={{ height: { xs: "300px", md: "350px" } }}>
            <Bar
              data={dataset}
              options={{
                ...barChartOptions,
                legend: {
                  display: true,
                  position: "top",
                },
              }}
            />
          </Box>
        </Box>
      </Col>

      <Col lg={6}>
        <ListGroup as="ol" numbered>
          {BdTrendAndLastFiveProblem?.lastFiveProblem?.map((item) => (
            <ListGroup.Item as="li">{item?.problem}</ListGroup.Item>
          ))}
        </ListGroup>
      </Col>
    </Row>
  );
};

export default BreakdownTrend;
