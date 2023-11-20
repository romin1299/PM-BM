import React, { useEffect, useReducer } from "react";
import { Container, Row, Col, Table } from "reactstrap";

import DropdownElem from "../Component/DropdownElem";

import RequestSheetMonitoringBarChart from "./RequestSheetMonitoringBarChart";

const RequestSheetMonitoring = () => {
  const baseUrl = "/getRequestSheetMonitoringData";
  const initialState = {
    allStatusCounterForGraph: [
      {
        label: "",
        count: [],
      },
    ],
    allMonths: [
      {
        monthName: "",
        monthInDecimal: 0,
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

    userBasedApprovalPending: {},

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

    section: {},

    subSectionsData: [],
    selectedSubSection: "",

    cellData: [],
    selectedCell: "",

    lineData: [],
    selectedLine: "",

    message: "",
    isLoading: true,
    isError: false,
  };

  const ACTION = {
    GET: "get-request-sheet-monitoring-dashboard-data",

    SELECT_SUBSECTION: "handle-selected-subSection",
    SELECT_CELL: "handle-selected-cell",
    SELECT_LINE: "handle-selected-line",

    RESET_DROPDOWN_VALUE: "handle-reset-all-selected-value",
  };

  const reducer = (state, action) => {
    switch (action?.type) {
      case ACTION?.GET:
        return {
          ...state,
          isLoading: false,
          message: action?.message,
          allStatusCounterForGraph: action?.allStatusCounterForGraph,
          allMonths: action?.allMonths,
          userBasedApprovalPending: action?.userBasedApprovalPending,
          generatedAndCompletedStatusMonthlyData:
            action?.generatedAndCompletedStatusMonthlyData,
          section: action?.section || state?.section,
          subSectionsData: action?.subSectionsData || state?.subSectionsData,
          cellData: action?.cellData || state?.cellData,
          lineData: action?.lineData || state?.lineData,
        };

      case ACTION?.SELECT_SUBSECTION:
        return {
          ...state,
          selectedSubSection: action?.selectedSubSection,
          selectedCell: "",
          selectedLine: "",
        };

      case ACTION?.SELECT_CELL:
        return {
          ...state,
          selectedCell: action?.selectedCell,
          selectedLine: "",
        };

      case ACTION?.SELECT_LINE:
        return {
          ...state,
          selectedLine: action?.selectedCell,
        };

      case ACTION?.RESET_DROPDOWN_VALUE:
        return {
          ...state,
          selectedSubSection: "",
          selectedCell: "",
          selectedLine: "",
        };

      default:
        return state;
    }
  };

  const [reduceState, reducerDispatch] = useReducer(reducer, initialState);

  const getRequestSheetMonitoringData = async ({ url }) => {
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const {
        message,
        allStatusCounterForGraph,
        allMonths,
        generatedAndCompletedStatusMonthlyData,
        section,
        subSectionsData,
        cellData,
        lineData,
        userBasedApprovalPending,
      } = await res.json();

      if (res?.status === 201) {
        reducerDispatch({
          type: ACTION.GET,
          message,
          allStatusCounterForGraph,
          allMonths,
          generatedAndCompletedStatusMonthlyData,
          section,
          subSectionsData,
          cellData,
          lineData,
          userBasedApprovalPending,
        });
      }
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    getRequestSheetMonitoringData({
      url: baseUrl,
    });
  }, []);


  return (
    <Container fluid className="p-2">
      <Row>
        <Col className="border" lg={1}>
          <div className="p-1">
            <button
              className="btn bg-button"
              onClick={() => {
                getRequestSheetMonitoringData({
                  url: `${baseUrl}`,
                });
                reducerDispatch({
                  type: ACTION.RESET_DROPDOWN_VALUE,
                });
              }}
            >
              Total
            </button>
          </div>
        </Col>
        <Col className="border d-flex align-items-center justify-content-start">
          <div className="p-1">
            <select
              name="subSection"
              value={reduceState?.selectedSubSection}
              onChange={(e) => {
                getRequestSheetMonitoringData({
                  url: `${baseUrl}/?subSectionRef=${e.target.value}`,
                });

                reducerDispatch({
                  type: ACTION.SELECT_SUBSECTION,
                  selectedSubSection: e.target.value,
                });
              }}
              style={{ fontSize: "14px" }}
            >
              <option selected disabled value="">
                Please select
              </option>
              {reduceState?.subSectionsData?.map((item) => (
                <option value={item?._id}>{item?.subSection_name}</option>
              ))}
            </select>
          </div>
        </Col>
        <Col className="border d-flex align-items-center justify-content-start">
          <div className="p-1">
            <select
              name="cell"
              value={reduceState?.selectedCell}
              onChange={(e) => {
                getRequestSheetMonitoringData({
                  url: `${baseUrl}/?cellRef=${e.target.value}`,
                });

                reducerDispatch({
                  type: ACTION.SELECT_CELL,
                  selectedCell: e.target.value,
                });
              }}
              style={{ fontSize: "14px" }}
            >
              <option selected disabled value="">
                Please select
              </option>
              {reduceState?.cellData?.map((item) => (
                <option value={item?._id}>{item?.cell_name}</option>
              ))}
            </select>
          </div>
        </Col>

        <Col className="border d-flex align-items-center justify-content-start">
          <div className="p-1">
            <select
              name="line"
              value={reduceState?.selectedLine}
              onChange={(e) => {
                getRequestSheetMonitoringData({
                  url: `${baseUrl}/?lineRef=${e.target.value}`,
                });
                reducerDispatch({
                  type: ACTION.SELECT_LINE,
                  selectedLine: e.target.value,
                });
              }}
              style={{ fontSize: "14px" }}
            >
              <option selected disabled value="">
                Please select
              </option>
              {reduceState?.lineData?.map((item) => (
                <option value={item?._id}>{item?.line_name}</option>
              ))}
            </select>
          </div>
        </Col>
      </Row>
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
                  {reduceState?.allMonths?.map((item) => (
                    <th>{item?.monthName}</th>
                  ))}
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
              <Table striped bordered hover>
                <tr>
                  <th></th>
                  {reduceState?.allMonths?.map((item) => (
                    <th>{item?.monthName}</th>
                  ))}
                </tr>

                {/* <tr>
              <td rowSpan={2}>abcd</td>
              <td>afs</td>
            </tr>
            <tr>
              <td>abcd</td>
              <td>afs</td>
            </tr> */}
              </Table>
            </Col>
          </Row>
        </Col>
        {/* 
        <Col className="p-2">
          <Table striped bordered hover>
            <tr>
              <th></th>
              <th></th>
              {reduceState?.allMonths?.map((item) => (
                <th>{item?.monthName}</th>
              ))}
            </tr>
          </Table>
        </Col> */}
      </Row>
    </Container>
  );
};

export default RequestSheetMonitoring;
