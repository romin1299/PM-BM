import React, { useState, useEffect } from "react";
import { SummeryBarChart } from "./ChartsForSummeryDashboard/SummeryBarChart";
import DoughnutChart from "./ChartsForSummeryDashboard/DoughnutChart";
import NotFound from "../../Reports/ReportComponents/NotFound";
import { Card, Button, ListGroup, Row, Col, Table } from "react-bootstrap";
import LoadingAnimation from "../../Reports/ReportComponents/LoadingAnimation";

const SummeryDashboardCard = ({ cartTitle, data, filter }) => {
  let TotalPlan = [
    {
      name: "Completed",
      value: data?.monthData?.total_completed,
    },
    {
      name: "Ongoing",
      value: data?.monthData?.total_ongoing,
    },
    {
      name: "Pending",
      value: data?.monthData?.total_remaining_current_month,
    },
  ];
  let TableData = [
    {
      name: "Planned",
      bgColor: "table-primary",
      value: data?.monthData?.total_pmSchedule,
    },
    {
      name: "Pending(Previous Month)",
      bgColor: "table-danger",
      value: data?.monthData?.total_previous_pending,
    },
    {
      name: "Completed",
      bgColor: "table-success",
      value: data?.monthData?.total_completed,
    },
    {
      name: "Ongoing",
      bgColor: "table-warning",
      value: data?.monthData?.total_ongoing,
    },
  ];

  let PendingStatusData = {
    name: "Remaining(Current Month)",
    value: data?.monthData?.total_remaining_current_month,
  };

  return (
    <Col className="col-lg-3 col-md-12 col-sm-12 d-flex justify-content-center d-flex align-items-center">
      <Card
        className="pt-0"
        style={
          filter === "Cell"
            ? {
                marginTop: "10px",
              }
            : {}
        }
      >
        <h5 className="text-dark">{cartTitle}</h5>
        {data?.monthData ? (
          <div>
            <Row className=" gy-4 ">
              <Col
                sm
                className="d-flex justify-content-center align-items-center"
              >
                <div class="container1">
                  <DoughnutChart TableData={TotalPlan} />
                  <div class="centered">
                    <h5 className="text-dark">
                      {data?.monthData?.percentage}%
                    </h5>
                  </div>
                </div>
              </Col>
              <Col
                sm
                className="d-flex justify-content-center align-items-center"
              >
                <Table bordered hover size="sm">
                  <tbody>
                    {/* <tr>
                  <td>{TotalPlan.name}</td>
                  <td>{TotalPlan.value}</td>
                </tr> */}
                    {TableData.map((item) => (
                      <tr className={item.bgColor}>
                        <td style={{ fontSize: "12px", fontWeight: "bold" }}>
                          {item.name}
                        </td>

                        <td style={{ fontSize: "12px", fontWeight: "bold" }}>
                          {item.value}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td style={{ fontSize: "12px", fontWeight: "bold" }}>
                        {PendingStatusData.name}
                      </td>
                      <td style={{ fontSize: "12px", fontWeight: "bold" }}>
                        {PendingStatusData.value}
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
            </Row>
            <Row className=" gy-4 mt-1">
              <Col
                sm
                className="d-flex justify-content-center align-items-center "
              >
                <h6
                  className="text-dark "
                  // style={{ background: "rgba(255, 159, 64, 1)" }}
                >
                  Achievement Ratio
                </h6>
              </Col>
            </Row>
            <Row className=" gy-4">
              <Col
                sm
                className="d-flex justify-content-center align-items-center"
              >
                <SummeryBarChart annualChartData={data?.annualData} />
              </Col>
            </Row>
          </div>
        ) : (
          <div className="d-flex align-items-center justify-content-center">
            <NotFound />
          </div>
        )}
      </Card>
    </Col>
  );
};

export default SummeryDashboardCard;
