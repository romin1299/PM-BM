import React, { useState, useReducer } from "react";
import { Container, Row, Col } from "reactstrap";
import { useForm } from "react-hook-form";

import DailyBDTrendChart from "../DailyBreakdownTrend/DailyBDTrendChart";
import BDRequestSheetTable from "../Common/DailyBDRequestSheetTable";
import BDHoursVsCountComponent from "./BDHoursVsCountComponent";
import MTTRComponent from "./MTTRComponent";
import MTBFComponent from "./MTBFComponent.jsx";
import BDhours from "./BDhours";
import { Box, Button, Paper, Typography } from "@mui/material";
import BDPercentageChart from "./BDPercentage.jsx";
import CategoryPieCharts from "./CategoryPieCharts.jsx";

import ChartsToolbar from "../ManHourReport/SubComponents/ChartsToolbar";

import {
  initialState,
  reducer,
} from "../ManHourReport/SubComponents/CommonFiltrationComponent";
import ReportTitleBar from "../Common/ReportTitleBar.jsx";

const ProductionLineWiseReport = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
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
  const baseUrlForFiltering = "/getFiltrationValue/all-filtration";

  const [requestSheetData, setRequestSheetData] = useState([]);

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

  return (
    <Container fluid>
      <Box>
        <ReportTitleBar
          title="Product/Line Wise KPI"
          Toolbar={
            <ChartsToolbar
              baseUrlForFiltering={baseUrlForFiltering}
              reduceState={reduceState}
              reducerDispatch={reducerDispatch}
            />
          }
        />

        <DailyBDTrendChart
          selectedValue={reduceState?.selectedValue}
          flagForTogglingFilter={reduceState?.flagForTogglingFilter}
          selectedYear={reduceState?.selectedYear}
          selectedMonth={reduceState?.selectedMonth}
        />

        <Paper variant="outlined" sx={{ p: 2 }} className="mt-3 g-0">
          <form
            onSubmit={handleSubmit(getRequestSheetDataBasedOnSelectedDate)}
            className="pt-1 d-flex align-items-center justify-content-end"
          >
            <input
              type="date"
              {...register("selectedDate", {
                required: "Please select date",
              })}
            />
            {errors?.["selectedDate"] && (
              <p className="text-error">{errors?.["selectedDate"]?.message}</p>
            )}
            <Button
              size="small"
              disableElevation
              className="bg-button"
              variant="contained"
              type="submit"
              sx={{
                minWidth: "30px",
                height: "30px",
                paddingInline: "10px",
              }}
            >
              Go
            </Button>
          </form>

          <BDRequestSheetTable requestSheetData={requestSheetData} />
        </Paper>

        <Row className="mt-3 g-2">
          <Col lg={3} md={6}>
            <BDhours
              selectedValue={reduceState?.selectedValue}
              flagForTogglingFilter={reduceState?.flagForTogglingFilter}
              selectedYear={reduceState?.selectedYear}
            />
          </Col>
          <Col lg={3} md={6}>
            <MTTRComponent
              selectedValue={reduceState?.selectedValue}
              flagForTogglingFilter={reduceState?.flagForTogglingFilter}
              selectedYear={reduceState?.selectedYear}
            />
          </Col>
          <Col lg={3} md={6}>
            <MTBFComponent
              selectedValue={reduceState?.selectedValue}
              flagForTogglingFilter={reduceState?.flagForTogglingFilter}
              selectedYear={reduceState?.selectedYear}
            />
          </Col>
          <Col lg={3} md={6}>
            <BDPercentageChart
              selectedValue={reduceState?.selectedValue}
              flagForTogglingFilter={reduceState?.flagForTogglingFilter}
              selectedYear={reduceState?.selectedYear}
            />
          </Col>
        </Row>

        <Row className="mt-1 g-2">
          <Col lg={6}>
            <BDHoursVsCountComponent
              selectedValue={reduceState?.selectedValue}
              flagForTogglingFilter={reduceState?.flagForTogglingFilter}
              selectedYear={reduceState?.selectedYear}
              selectedMonth={reduceState?.selectedMonth}
            />
          </Col>
          <Col lg={6}>
            <CategoryPieCharts
              selectedValue={reduceState?.selectedValue}
              flagForTogglingFilter={reduceState?.flagForTogglingFilter}
              selectedYear={reduceState?.selectedYear}
              selectedMonth={reduceState?.selectedMonth}
            />
          </Col>
        </Row>
      </Box>
    </Container>
  );
};

export default ProductionLineWiseReport;
