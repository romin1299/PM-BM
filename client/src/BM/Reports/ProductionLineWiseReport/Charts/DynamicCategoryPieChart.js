import React, { useEffect, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Chart } from "react-chartjs-2";
import { Col, Container, Row } from "react-bootstrap";
import { Box, Divider, Typography } from "@mui/material";
import axios from "axios";
import { chartColors } from "../../../Utils/ChartUtils/chartEnums";

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
  },
};

const CategoryPieChartCard = ({ category }) => {
  const noOfData = 3 + Math.floor(Math.random() * 6);
  const daysLabels = Array.from({ length: noOfData }, (_, i) =>
    (i + 1).toString()
  );

  const [data, setData] = useState({
    labels: daysLabels,
    datasets: [
      {
        label: "# of Votes",
        data: Array.from(
          { length: noOfData },
          () => 4 + Math.floor(Math.random() * 15)
        ),
        backgroundColor: Array.from(
          { length: noOfData },
          (_, i) => chartColors[i]
        ),
      },
    ],
  });

  useEffect(() => {
    // fetchChartData();
  }, []);

  // we have category._id
  // we can use it to get data for this particular category
  console.log("category id:", category._id);

  const fetchChartData = async () => {
    try {
      const res = await axios.get(`/get-category-chart-data`, {
        withCredentials: true,
        credentials: "include",
      });
      setData(res.data);
    } catch (error) {
      console.log("error:", error);
    }
  };

  return (
    <Box className="cell p-3">
      <Row>
        <Typography
          // className="col"
          variant="body1"
          style={{ fontSize: "1rem" }}
        >
          {category.name} Category
        </Typography>
      </Row>

      <Divider sx={{ mt: 1, mb: 2, borderColor: "gray" }} />

      <Row>
        <Chart type="pie" data={data} options={options} />
      </Row>
    </Box>
  );
};

const CategoryChartComponent = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get("/getCategories", {
        withCredentials: true,
        credentials: "include",
      });
      console.log("res:", res);
      console.log("getCategory:", res.data.getCategory);
      setCategories(res.data.getCategory);
    } catch (error) {
      console.log("error:", error);
    }
  };

  return (
    <Container>
      <Row>
        {categories.map((category) => {
          return (
            <Col lg={6}>
              <CategoryPieChartCard category={category} />
            </Col>
          );
        })}
      </Row>
    </Container>
  );
};

export default CategoryChartComponent;
