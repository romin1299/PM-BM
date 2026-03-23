import React, { useEffect, useReducer } from "react";
import { Container, Row, Col, Table } from "reactstrap";
import { Box, Typography } from "@mui/material";

import DropdownElem from "../Component/DropdownElem";

import RequestSheetMonitoringBarChart from "./RequestSheetMonitoringBarChart";
import MonthlyGeneratedAndCompletedCount from "./MonthlyGeneratedAndCompletedCount";
import UserWisePendingCount from "./UserWisePendingCount";

import ChartsToolbar from "../Reports/ManHourReport/SubComponents/ChartsToolbar";

import {
  initialState,
  reducer,
} from "../Reports/ManHourReport/SubComponents/CommonFiltrationComponent";
import BMTitlebar from "../Component/BMTitlebar";

const RequestSheetMonitoring = () => {
  // const baseUrl = "/getRequestSheetMonitoringData";

  // const initialState = {
  //   allStatusCounterForGraph: [
  //     {
  //       label: "",
  //       count: [],
  //     },
  //   ],
  //   allMonths: [
  //     {
  //       monthName: "",
  //       monthInDecimal: 0,
  //     },
  //   ],
  //   generatedAndCompletedStatusMonthlyData: {
  //     generatedCounterData: [
  //       {
  //         month: "",
  //         value: 0,
  //       },
  //     ],
  //     completedCounterData: [
  //       {
  //         month: "",
  //         value: 0,
  //       },
  //     ],
  //   },

  //   userBasedApprovalPending: {},

  //   // generatedAndCompletedStatusMonthlyData: [
  //   //   {
  //   //     month: "",
  //   //     data: {
  //   //       _id: "",
  //   //       generated: 0,
  //   //       completed: 0,
  //   //     },
  //   //   },
  //   // ],

  //   section: {},

  //   subSectionsData: [],
  //   selectedSubSection: "",

  //   cellData: [],
  //   selectedCell: "",

  //   lineData: [],
  //   selectedLine: "",

  //   message: "",
  //   isLoading: true,
  //   isError: false,
  // };

  // const ACTION = {
  //   GET: "get-request-sheet-monitoring-dashboard-data",

  //   SELECT_SUBSECTION: "handle-selected-subSection",
  //   SELECT_CELL: "handle-selected-cell",
  //   SELECT_LINE: "handle-selected-line",

  //   RESET_DROPDOWN_VALUE: "handle-reset-all-selected-value",
  // };

  // const reducer = (state, action) => {
  //   switch (action?.type) {
  //     case ACTION?.GET:
  //       return {
  //         ...state,
  //         isLoading: false,
  //         message: action?.message,
  //         allStatusCounterForGraph: action?.allStatusCounterForGraph,
  //         allMonths: action?.allMonths,
  //         userBasedApprovalPending: action?.userBasedApprovalPending,
  //         generatedAndCompletedStatusMonthlyData:
  //           action?.generatedAndCompletedStatusMonthlyData,
  //         section: action?.section || state?.section,
  //         subSectionsData: action?.subSectionsData || state?.subSectionsData,
  //         cellData: action?.cellData || state?.cellData,
  //         lineData: action?.lineData || state?.lineData,
  //       };

  //     case ACTION?.SELECT_SUBSECTION:
  //       return {
  //         ...state,
  //         selectedSubSection: action?.selectedSubSection,
  //         selectedCell: "",
  //         selectedLine: "",
  //       };

  //     case ACTION?.SELECT_CELL:
  //       return {
  //         ...state,
  //         selectedCell: action?.selectedCell,
  //         selectedLine: "",
  //       };

  //     case ACTION?.SELECT_LINE:
  //       return {
  //         ...state,
  //         selectedLine: action?.selectedCell,
  //       };

  //     case ACTION?.RESET_DROPDOWN_VALUE:
  //       return {
  //         ...state,
  //         selectedSubSection: "",
  //         selectedCell: "",
  //         selectedLine: "",
  //       };

  //     default:
  //       return state;
  //   }
  // };

  const [reduceState, reducerDispatch] = useReducer(reducer, initialState());
  const baseUrlForFiltering = "/getFiltrationValue/all-filtration";

  const allMonths = [
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
    "Jan",
    "Feb",
    "Mar",
  ];
  // const getRequestSheetMonitoringData = async ({ url }) => {
  //   try {
  //     const res = await fetch(url, {
  //       method: "GET",
  //       headers: {
  //         Accept: "application/json",
  //         "Content-Type": "application/json",
  //       },
  //       credentials: "include",
  //     });

  //     const {
  //       message,
  //       allStatusCounterForGraph,
  //       allMonths,
  //       generatedAndCompletedStatusMonthlyData,
  //       section,
  //       subSectionsData,
  //       cellData,
  //       lineData,
  //       userBasedApprovalPending,
  //     } = await res.json();

  //     if (res?.status === 201) {
  //       // reducerDispatch({
  //       //   type: ACTION.GET,
  //       //   message,
  //       //   allStatusCounterForGraph,
  //       //   allMonths,
  //       //   generatedAndCompletedStatusMonthlyData,
  //       //   section,
  //       //   subSectionsData,
  //       //   cellData,
  //       //   lineData,
  //       //   userBasedApprovalPending,
  //       // });
  //     }
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  // const getFiltrationValue = async () => {
  //   try {
  //     const res = await fetch("/getFiltrationValue/cell-level", {
  //       method: "GET",
  //       headers: {
  //         Accept: "application/json",
  //         "Content-Type": "application/json",
  //       },
  //       credentials: "include",
  //     });

  //     const data = await res.json();
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  // useEffect(() => {
  //   // getRequestSheetMonitoringData({
  //   //   url: baseUrl,
  //   // });
  //   getFiltrationValue();
  // }, []);

  return (
    <Container fluid>
      {/* <Row>
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
      </Row> */}

      <BMTitlebar
        title="Request-sheet Status Monitoring"
        Toolbar={
          <ChartsToolbar
            baseUrlForFiltering={baseUrlForFiltering}
            reduceState={reduceState}
            reducerDispatch={reducerDispatch}
            monthFiltration
              yearFiltration
              sectionFiltration
              subSectionFiltration
              cellFiltration
              lineFiltration
              resetButtonFiltration
          />
        }
      />

      <Row className="mt-3 gx-3">
        <Col sm={12} lg={4}>
          <RequestSheetMonitoringBarChart
            selectedValue={reduceState?.selectedValue}
            flagForTogglingFilter={reduceState?.flagForTogglingFilter}
            selectedYear={reduceState?.selectedYear}
            selectedMonth={reduceState?.selectedMonth}
          />
        </Col>
        <Col sm={12} lg={8}>
          <MonthlyGeneratedAndCompletedCount
            selectedValue={reduceState?.selectedValue}
            flagForTogglingFilter={reduceState?.flagForTogglingFilter}
            selectedYear={reduceState?.selectedYear}
            allMonths={allMonths}
          />

          <UserWisePendingCount
            selectedValue={reduceState?.selectedValue}
            flagForTogglingFilter={reduceState?.flagForTogglingFilter}
            selectedYear={reduceState?.selectedYear}
            allMonths={allMonths}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default RequestSheetMonitoring;
