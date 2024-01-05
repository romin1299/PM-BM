import React, { useState, useReducer, useEffect } from "react";
import { Container, Row, Col } from "reactstrap";
import { useForm } from "react-hook-form";

import DailyBDTrendChart from "../DailyBreakdownTrend/DailyBDTrendChart";
import BDRequestSheetAntDesignTable from "../Common/DailyBDRequestSheetAntDesignTable.jsx";

import BDRequestSheetTable from "../Common/DailyBDRequestSheetTable";
import BDHoursVsCountComponent from "./BDHoursVsCountComponent";
import MTTRComponent from "./MTTRComponent";
import MTBFComponent from "./MTBFComponent.jsx";
import BDhours from "./BDhours";
import { Box, Button, Paper, Typography } from "@mui/material";
import BDPercentageChart from "./BDPercentage.jsx";
import CategoryPieCharts from "./CategoryPieCharts.jsx";

import ChartsToolbar from "../ManHourReport/SubComponents/ChartsToolbar";
import currentMonth from "../../../pages/Dashboard/DashboardComponent/currentMonth";

import {
  initialState,
  reducer,
} from "../ManHourReport/SubComponents/CommonFiltrationComponent";
import ReportTitleBar from "../Common/ReportTitleBar.jsx";
import DownloadMenu from "../ManHourReport/SubComponents/DownloadMenu.jsx";
import {
  EXPORT_REPORT,
  exportPPTX,
} from "../../Utils/ExportPPTX/exportPPTX.js";

const ProductionLineWiseReport = () => {
  const {
    register: registerBasedOnSelectedDate,
    handleSubmit: handleSubmitBasedOnSelectedDate,
    formState: { errors: errorsBasedOnSelectedDate },
    reset: resetBasedOnSelectedDate,
  } = useForm({});

  const {
    register: registerBasedOnFromAndToDate,
    handleSubmit: handleSubmitBasedOnFromAndToDate,
    formState: { errors: errorsBasedOnFromAndToDate },
    reset: resetBasedOnFromAndToDate,
  } = useForm({});

  // const initialState = {
  //   cellData: [],

  //   selectedValue: "",
  //   flagForCellAndLineToggle: "based-on-cell",

  //   requestSheetData: [],

  //   message: "",
  //   isLoading: true,
  //   isError: false,
  // };

  // const ACTION = {
  //   GET_CELL_INFO: "get-cell-dropdown-data",
  //   GET_RS_DATA: "get-requestSheet-data-based-on-selected-date",
  // };

  // const reducer = (state, action) => {
  //   switch (action?.type) {
  //     case ACTION?.GET_CELL_INFO:
  //       return {
  //         ...state,
  //         isLoading: false,
  //         message: action?.message,
  //         cellData: action?.cellData,
  //         selectedValue: action?.selectedCell,
  //       };

  //     case ACTION?.GET_RS_DATA:
  //       return {
  //         ...state,
  //         requestSheetData: action?.requestSheetData,
  //       };

  //     // case ACTION?.SELECT_CELL:
  //     //   return {
  //     //     ...state,
  //     //     selectedCell: action?.selectedCell,
  //     //     selectedValue: action?.selectedCell,
  //     //     selectedLine: "",
  //     //   };

  //     // case ACTION?.SELECT_LINE:
  //     //   return {
  //     //     ...state,
  //     //     selectedLine: action?.selectedLine,
  //     //     selectedValue: action?.selectedLine,
  //     //   };

  //     // case ACTION?.SELECT_SUBSECTION:
  //     //   return {
  //     //     ...state,
  //     //     selectedSubSection: action?.selectedSubSection,
  //     //     selectedCell: "",
  //     //     selectedLine: "",
  //     //   };

  //     // case ACTION?.SELECT_CELL:
  //     //   return {
  //     //     ...state,
  //     //     selectedCell: action?.selectedCell,
  //     //     selectedLine: "",
  //     //   };

  //     // case ACTION?.SELECT_LINE:
  //     //   return {
  //     //     ...state,
  //     //     selectedLine: action?.selectedCell,
  //     //   };

  //     // case ACTION?.RESET_DROPDOWN_VALUE:
  //     //   return {
  //     //     ...state,
  //     //     selectedSubSection: "",
  //     //     selectedCell: "",
  //     //     selectedLine: "",
  //     //   };

  //     default:
  //       return state;
  //   }
  // };

  // const [reduceState, reducerDispatch] = useReducer(reducer, initialState);

  // const getProductionLineWiseReportData = async () => {
  //   try {
  //     const res = await fetch("/getCellDropdownValueBasedOnDashboardLevel", {
  //       method: "GET",
  //       headers: {
  //         Accept: "application/json",
  //         "Content-Type": "application/json",
  //       },
  //       credentials: "include",
  //     });

  //     const { message, selectedCell, cellData } = await res.json();

  //     if (res?.status === 201) {
  //       reducerDispatch({
  //         type: ACTION.GET_CELL_INFO,
  //         cellData,
  //         selectedCell,
  //         message,
  //       });
  //     }
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };
  // useEffect(() => {
  //   getProductionLineWiseReportData();
  // }, []);

  const [reduceState, reducerDispatch] = useReducer(reducer, initialState);
  const baseUrlForFiltering = "/getFiltrationValue/cell-level-filtration";

  const [requestSheetData, setRequestSheetData] = useState([]);

  const [
    requestSheetDataForProductAndLineWise,
    setRequestSheetDataForProductAndLineWise,
  ] = useState([]);

  const [dailyBDSelectedMonth, setDailyBDSelectedMonth] =
    useState(currentMonth);

  const getRequestSheetDataBasedOnSelectedDate = async (data) => {
    try {
      const res = await fetch(
        // `/getRequestSheetDataBasedOnSelectedDate/${reduceState?.flagForTogglingFilter}/632c41261d1becfedab325f9/${data?.selectedDate}/?selectedYear=${reduceState?.selectedYear}`,
        `/getRequestSheetDataBasedOnSelectedDate/${reduceState?.flagForTogglingFilter}/${reduceState?.selectedValue}/${data?.selectedDate}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const { message, requestSheetData } = await res.json();

      if (res?.status === 201) {
        setRequestSheetData(requestSheetData);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getRequestSheetDataBasedOnFromAndToDateSelection = async (data) => {
    try {
      const res = await fetch(
        `/getRequestSheetDataBasedOnFromAndToDateSelection/${reduceState?.flagForTogglingFilter}/${reduceState?.selectedValue}/${data?.selectedToDate}/${data?.selectedFromDate}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const { message, requestSheetData } = await res.json();

      if (res?.status === 201) {
        setRequestSheetDataForProductAndLineWise(requestSheetData);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // const getLineWiseKpiStatusData = async (req, res, next) => {
  //   try {
  //     const res = await fetch(
  //       `/getLineWiseKpiStatusData/${reduceState?.selectedCell}?selectedYear=${reduceState?.selectedYear}`,
  //       {
  //         method: "GET",
  //         headers: {
  //           Accept: "application/json",
  //           "Content-Type": "application/json",
  //         },
  //         credentials: "include",
  //       }
  //     );

  //     const { message, lineWisePptExportationData } = await res.json();

  //     if (res?.status === 201) {
  //       console.log(lineWisePptExportationData);
  //     }
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  // useEffect(() => {
  //   if (reduceState?.selectedCell) {
  //     getLineWiseKpiStatusData();
  //   }
  // }, [reduceState?.selectedCell]);

  useEffect(() => {
    if (reduceState?.selectedValue) {
      getRequestSheetDataBasedOnFromAndToDateSelection();
    }
  }, [reduceState?.selectedValue, reduceState?.selectedYear]);

  return (
    <Container fluid>
      <Box>
        <ReportTitleBar
          title="Product/Line Wise KPI"
          Toolbar={
            <>
              <ChartsToolbar
                baseUrlForFiltering={baseUrlForFiltering}
                reduceState={reduceState}
                reducerDispatch={reducerDispatch}
              />

              <Col className="col-auto">
                <DownloadMenu
                  handleDownloadPPTXForLineWiseKPI={() => {
                    exportPPTX(EXPORT_REPORT.LINE_WISE_KPI_STATUS, reduceState);
                  }}
                  handleDownloadPPTX={() => {
                    exportPPTX(EXPORT_REPORT.PRODUCT_LINE_WISE, {
                      ...reduceState,
                      dailyBDSelectedMonth,
                    });
                  }}
                />
              </Col>
            </>
          }
        />

        <DailyBDTrendChart
          selectedValue={reduceState?.selectedValue}
          flagForTogglingFilter={reduceState?.flagForTogglingFilter}
          selectedYear={reduceState?.selectedYear}
          dailyBDSelectedMonth={dailyBDSelectedMonth}
          setDailyBDSelectedMonth={setDailyBDSelectedMonth}
        />

        <Paper variant="outlined" sx={{ p: 2 }} className="mt-3 g-0">
          <form
            onSubmit={handleSubmitBasedOnSelectedDate(
              getRequestSheetDataBasedOnSelectedDate
            )}
            className="pt-1 d-flex align-items-center justify-content-end"
          >
            <input
              type="date"
              {...registerBasedOnSelectedDate("selectedDate", {
                required: "Please select date",
              })}
            />
            <br />
            {errorsBasedOnSelectedDate?.["selectedDate"] && (
              <p className="text-error">
                {errorsBasedOnSelectedDate?.["selectedDate"]?.message}
              </p>
            )}
            <Button
              size="small"
              disableElevation
              className="bg-button"
              variant="contained"
              type="submit"
              sx={{
                ml: 1,
                minWidth: "30px",
                height: "30px",
                paddingInline: "10px",
              }}
            >
              Go
            </Button>
          </form>

          <BDRequestSheetTable
            requestSheetData={requestSheetData}
            downloadFileName={"Product/Line wise KPI"}
          />
        </Paper>

        <Row className="mt-3 g-2">
          <Col xxl={3} lg={6} md={6}>
            <BDhours
              selectedValue={reduceState?.selectedValue}
              flagForTogglingFilter={reduceState?.flagForTogglingFilter}
              selectedYear={reduceState?.selectedYear}
            />
          </Col>
          <Col xxl={3} lg={6} md={6}>
            <MTTRComponent
              selectedValue={reduceState?.selectedValue}
              flagForTogglingFilter={reduceState?.flagForTogglingFilter}
              selectedYear={reduceState?.selectedYear}
            />
          </Col>
          <Col xxl={3} lg={6} md={6}>
            <MTBFComponent
              selectedValue={reduceState?.selectedValue}
              flagForTogglingFilter={reduceState?.flagForTogglingFilter}
              selectedYear={reduceState?.selectedYear}
            />
          </Col>
          <Col xxl={3} lg={6} md={6}>
            <BDPercentageChart
              selectedValue={reduceState?.selectedValue}
              flagForTogglingFilter={reduceState?.flagForTogglingFilter}
              selectedYear={reduceState?.selectedYear}
            />
          </Col>
        </Row>

        <Row className="mt-1 g-2">
          <Col lg={6} md={6}>
            <BDHoursVsCountComponent
              selectedValue={reduceState?.selectedValue}
              flagForTogglingFilter={reduceState?.flagForTogglingFilter}
              selectedYear={reduceState?.selectedYear}
              selectedMonth={reduceState?.selectedMonth}
            />
          </Col>
          <Col lg={6} md={6}>
            <CategoryPieCharts
              selectedValue={reduceState?.selectedValue}
              flagForTogglingFilter={reduceState?.flagForTogglingFilter}
              selectedYear={reduceState?.selectedYear}
              selectedMonth={reduceState?.selectedMonth}
            />
          </Col>
        </Row>

        <Paper variant="outlined" sx={{ p: 2 }} className="mt-3 g-0">
          <Row>
            <form
              onSubmit={handleSubmitBasedOnFromAndToDate(
                getRequestSheetDataBasedOnFromAndToDateSelection
              )}
              className="p-1 d-flex align-items-center justify-content-end"
            >
              <div>
                <span className="m-1">
                  <b>From Date:</b>
                </span>
                <input
                  type="date"
                  {...registerBasedOnFromAndToDate("selectedFromDate", {
                    required: "Please select date",
                  })}
                />
                <br />
                {errorsBasedOnFromAndToDate?.["selectedFromDate"] && (
                  <p className="text-error">
                    {errorsBasedOnFromAndToDate?.["selectedFromDate"]?.message}
                  </p>
                )}
              </div>
              <div>
                <span className="m-1">
                  <b>To Date:</b>
                </span>
                <input
                  type="date"
                  {...registerBasedOnFromAndToDate("selectedToDate", {
                    required: "Please select date",
                  })}
                />
                <br />
                {errorsBasedOnFromAndToDate?.["selectedToDate"] && (
                  <p className="text-error">
                    {errorsBasedOnFromAndToDate?.["selectedToDate"]?.message}
                  </p>
                )}
              </div>
              <Button
                size="small"
                disableElevation
                className="bg-button"
                variant="contained"
                type="submit"
                sx={{
                  ml: 1,
                  minWidth: "30px",
                  height: "30px",
                  paddingInline: "10px",
                }}
              >
                Go
              </Button>
            </form>
          </Row>
          <Button
            size="small"
            disableElevation
            className="bg-button"
            variant="contained"
            type="submit"
            sx={{
              ml: 1,
              minWidth: "30px",
              height: "30px",
              paddingInline: "10px",
            }}
            onClick={() => {
              resetBasedOnFromAndToDate();
              getRequestSheetDataBasedOnFromAndToDateSelection();
            }}
          >
            Reset
          </Button>
          <BDRequestSheetAntDesignTable
            requestSheetData={requestSheetDataForProductAndLineWise}
            downloadFileName={"Product/Line wise KPI"}
          />
        </Paper>
      </Box>
    </Container>
  );
};

export default ProductionLineWiseReport;
