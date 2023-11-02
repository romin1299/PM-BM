import React, { useEffect, useReducer } from "react";
import { Container, Row, Col, Table } from "reactstrap";

import RequestSheetMonitoringBarChart from "./RequestSheetMonitoringBarChart";

const RequestSheetMonitoring = () => {
  const initialState = {
    allStatusCounterForGraph: [
      {
        label: "",
        count: [],
      },
    ],
    generatedAndCompletedStatusMonthlyData: {
      generatedCounterData: [
        {
          month: "",
          value: 0,
        },
      ],
      completedCounterData: [
        {
          month: "",
          value: 0,
        },
      ],
    },

    // generatedAndCompletedStatusMonthlyData: [
    //   {
    //     month: "",
    //     data: {
    //       _id: "",
    //       generated: 0,
    //       completed: 0,
    //     },
    //   },
    // ],

    message: "",
    isLoading: true,
    isError: false,
  };

  const ACTION = {
    GET: "get-request-sheet-monitoring-dashboard-data",
  };

  const reducer = (state, action) => {
    switch (action?.type) {
      case ACTION?.GET:
        return {
          ...state,
          isLoading: false,
          message: action?.message,
          allStatusCounterForGraph: action?.allStatusCounterForGraph,
          generatedAndCompletedStatusMonthlyData:
            action?.generatedAndCompletedStatusMonthlyData,
        };

      default:
        return state;
    }
  };

  const [reduceState, reducerDispatch] = useReducer(reducer, initialState);

  const getRequestSheetMonitoringData = async () => {
    try {
      const res = await fetch(
        `/getRequestSheetMonitoringData/63317de11d1becfedab3381c`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const {
        message,
        allStatusCounterForGraph,
        generatedAndCompletedStatusMonthlyData,
      } = await res.json();

      if (res?.status === 201) {
        reducerDispatch({
          type: ACTION.GET,
          message,
          allStatusCounterForGraph,
          generatedAndCompletedStatusMonthlyData,
        });
      }
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    getRequestSheetMonitoringData();
  }, []);

  return (
    <Container fluid className="p-2">
      <Row>
        <Col style={{ height: "35rem" }} sm={12} md={6} lg={4} className="p-2">
          <RequestSheetMonitoringBarChart
            allStatusCounterForGraph={reduceState?.allStatusCounterForGraph}
          />
        </Col>
        <Col className="p-2">
          <Row>
            <Col>
              <Table striped bordered hover>
                <tr>
                  <th></th>
                  {reduceState?.generatedAndCompletedStatusMonthlyData?.generatedCounterData?.map(
                    (item) => (
                      <th>{item?.month}</th>
                    )
                  )}
                </tr>
                <tr>
                  <th>Generated</th>
                  {reduceState?.generatedAndCompletedStatusMonthlyData?.generatedCounterData?.map(
                    (item) => (
                      <td>{item?.value}</td>
                    )
                  )}
                </tr>
                <tr>
                  <th>Completed</th>
                  {reduceState?.generatedAndCompletedStatusMonthlyData?.completedCounterData?.map(
                    (item) => (
                      <td>{item?.value}</td>
                    )
                  )}
                </tr>
              </Table>
            </Col>
          </Row>
          <Row className="d-flex align-items-center justify-content-center">
            <Col className="d-flex align-items-center justify-content-center">
              <h3>Row-2</h3>
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
};

export default RequestSheetMonitoring;
