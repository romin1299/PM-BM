import React, { useState, useEffect } from "react";
import { Container, Row, Col } from "reactstrap";

import DoughnutChart from "./DoughnutChart";

const BDCategoryAndFactor = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
  selectedMonth,

  title,
}) => {
  const BDCategoryAndFactor = async () => {
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
      const { message, pieChartData } = await res.json();
      if (res.status === 201) {
        console.log(pieChartData);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (selectedValue) {
      BDCategoryAndFactor();
    }
  }, [selectedValue, selectedYear, selectedMonth]);

  return (
    <Container>
      <Row>
        <Col xxl={6} lg={6} md={6}>
          <DoughnutChart title="Breakdown Category" />
        </Col>
        <Col xxl={6} lg={6} md={6}>
          <DoughnutChart title="Breakdown Factor" />
        </Col>
      </Row>
    </Container>
  );
};

export default BDCategoryAndFactor;
