import React, { useState, useEffect } from "react";
import { SummeryBarChart } from "./ChartsForSummeryDashboard/SummeryBarChart";
import DoughnutChart from "./ChartsForSummeryDashboard/DoughnutChart";

import { Card, Button, ListGroup, Row, Col, Table } from "react-bootstrap";

const SummeryDashboardCard = ({ cartTitle, data }) => {
  const fetchAllSummeryData = async () => {
    try {
      const res = await fetch("/fetchAllSummeryData", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      const data = await res.json();
      //   console.log(data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    // fetchAllSummeryData();
  }, []);

  let currentMonthCompletionData =
    parseInt(data._id.replace(/[^\d.]/g, "")) % 100;

  // console.log(
  //   parseInt(data._id.replace(/[^\d.]/g, "")),
  //   parseInt(data._id.replace(/[^\d.]/g, "")) % 100
  // );

  let TotalPlan = [
    {
      name: "Completed",
      value: currentMonthCompletionData,
    },
    {
      name: "Pending",
      value: 5,
    },
    {
      name: "SomeValue",
      value: 15, //SomeValue = Planned + Last Month Pending - Completed - Ongoing - Pending
    },
  ];
  let TableData = [
    {
      name: "Planned",
      bgColor: "table-primary",
      value: 100,
    },
    {
      name: "Last Month Pending",
      bgColor: "table-danger",
      value: 20,
    },
    {
      name: "Completed",
      bgColor: "table-success",
      value: currentMonthCompletionData,
    },
    {
      name: "Ongoing",
      bgColor: "table-warning",
      value: 15,
    },
  ];

  let PendingStatusData = {
    name: "Pending",
    // bgColor: "table-danger",
    value:
      TableData[0].value +
      TableData[1].value -
      TableData[2].value -
      TableData[3].value,
  };

  // console.log(
  //   TableData[0].value +
  //     TableData[1].value -
  //     TableData[2].value -
  //     TableData[3].value
  // );

  // let TableData = [
  //   {
  //     name: "Planned",
  //     bgColor: "#5bc0de",
  //     value: 100,
  //   },
  //   {
  //     name: "Last Month Pending",
  //     bgColor: "#e2a06b",
  //     value: 5,
  //   },
  //   {
  //     name: "Completed",
  //     bgColor: "#789c50",
  //     // bgColor: "table-success",
  //     value: 70,
  //   },
  //   {
  //     name: "Ongoing",
  //     bgColor: "#ddb14d",
  //     // bgColor: "table-warning",
  //     value: 15,
  //   },
  //   {
  //     name: "Pending",
  //     bgColor: "#fff",
  //     value: 10,
  //   },
  // ];

  return (
    <Col className="col-lg-3 col-md-12 col-sm-12 d-flex justify-content-center d-flex align-items-center">
      <Card className="pt-0">
        <h4 className="text-dark">{cartTitle}</h4>
        <Row className=" gy-4 ">
          <Col sm className="d-flex justify-content-center align-items-center">
            <div class="container1">
              <DoughnutChart TableData={TotalPlan} />
              <div class="centered">
                <h2 className="text-dark">{currentMonthCompletionData}%</h2>
              </div>
            </div>
          </Col>
          <Col sm className="d-flex justify-content-center align-items-center">
            <Table bordered hover size="sm">
              <tbody>
                {/* <tr>
                  <td>{TotalPlan.name}</td>
                  <td>{TotalPlan.value}</td>
                </tr> */}
                {TableData.map((item) => (
                  <tr className={item.bgColor}>
                    <td style={{ fontSize: "8px" }}>{item.name}</td>

                    <td style={{ fontSize: "8px" }}>{item.value}</td>
                  </tr>
                ))}
                <tr>
                  <td style={{ fontSize: "8px" }}>{PendingStatusData.name}</td>
                  <td style={{ fontSize: "8px" }}>{PendingStatusData.value}</td>
                </tr>
              </tbody>
            </Table>
          </Col>
        </Row>
        <Row className=" gy-4 mt-1">
          <Col sm className="d-flex justify-content-center align-items-center ">
            <h5
              className="text-dark "
              // style={{ background: "rgba(255, 159, 64, 1)" }}
            >
              Achievement Ratio
            </h5>
          </Col>
        </Row>
        <Row className=" gy-4">
          <Col sm className="d-flex justify-content-center align-items-center">
            <SummeryBarChart
              currentMonthCompletionData={currentMonthCompletionData}
            />
          </Col>
        </Row>
      </Card>
    </Col>
  );
};

export default SummeryDashboardCard;
