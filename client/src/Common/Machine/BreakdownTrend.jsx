import React, { useState, useEffect } from "react";
import { Row, Col, ListGroup } from "react-bootstrap";
import { Bar } from "react-chartjs-2";

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
      },
    ],
  };

  return (
    <Row >
      <Col lg={6}>
        <Bar
          data={dataset}
          options={{
            legend: {
              display: true,
              position: "top",
            },
          }}
        />
      </Col>
      <Col>
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
