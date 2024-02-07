import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import React, { useState, useEffect } from "react";
import { Row, Col, ListGroup } from "react-bootstrap";
import { Bar } from "react-chartjs-2";
import ChartTitleBar from "../../BM/Reports/Common/ChartTitleBar";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { barChartOptions } from "../../BM/Utils/ChartUtils/chartOptions";
import { chartColors } from "../../BM/Utils/ChartUtils/chartEnums";
import { useLocation, useNavigate } from "react-router-dom";
import currentYear from "../../pages/Dashboard/DashboardComponent/currentYear";

const BreakdownTrend = ({ machine_code, search }) => {
  const [BdTrendAndLastFiveProblem, setBdTrendAndLastFiveProblem] = useState({
    breakdownTrendData: {
      labels: [],
      data: [],
    },
    lastFiveProblem: [],
  });

  const navigate = useNavigate();
  const location = useLocation();

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
      console.log("BdTrendAndLastFiveProblem:", BdTrendAndLastFiveProblem);
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
        <Box className="cell p-3">
          <ChartTitleBar title={"Last Five Problems"} />

          <ListGroup as="ol" numbered>
            {BdTrendAndLastFiveProblem?.lastFiveProblem?.map((item) => (
              <ListGroup.Item
                as="li"
                className="d-flex align-items-center py-1"
              >
                {item?.problem}

                <div style={{ marginLeft: "auto" }}>
                  <Tooltip title="View Request Sheet" disableInteractive>
                    <IconButton size="small"
                      onClick={() => {
                        navigate(
                          `/bm/view/request-sheet/${machine_code}/${item?._id}/${currentYear}`,
                          {
                            state: {
                              prevPath: location?.pathname,
                              prevPathSearch: location?.search,
                            },
                          }
                        );
                      }}
                    >
                      <VisibilityIcon className="text-primary" />
                    </IconButton>
                  </Tooltip>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Box>
      </Col>
    </Row>
  );
};

export default BreakdownTrend;
