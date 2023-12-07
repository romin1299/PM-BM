import React, { useEffect, useReducer } from "react";
import { Col, Container, Row } from "react-bootstrap";
import ManHourTrend from "./ManHourTrend";
import { Box, Typography } from "@mui/material";
import LineTrend from "./LineTrend";
import TMLoad from "./TMLoad";
import ChartToPPTExample from "./ChartJsExample";
import ChartsToolbar from "./SubComponents/ChartsToolbar";

import {
  initialState,
  reducer,
} from "./SubComponents/CommonFiltrationComponent";

const ManHourDashboard = () => {
  // const initialState = {
  //   selectedValue: "",
  //   flagForTogglingFilter: "",

  //   selectedValueForLineAnTMLoadGraph: "",
  //   togglingFilterFlagForLineAnTMLoadGraph: "",

  //   selectedSection: "",
  //   sections: [],

  //   selectedSubSection: "",
  //   subSections: [],

  //   selectedCell: "",
  //   cells: [],

  //   selectedLine: "",
  //   lines: [],

  //   selectedYear:
  //     new Date().getMonth() < 3
  //       ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
  //       : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
  //   selectedMonth: "",

  //   message: "",
  //   isLoading: true,
  //   isError: false,
  // };

  // const getFiltrationValueBasedOnSection = async ({ section }) => {
  //   try {
  //     const { res, data } = await getFiltrationValue({
  //       url: `/getFiltrationValue/sectionBased/${section}`,
  //     });

  //     const {
  //       message,

  //       flagForTogglingFilter,
  //       selectedValue,

  //       selectedSubSection,
  //       subSections,
  //       selectedCell,
  //       cells,
  //       selectedLine,
  //       lines,
  //     } = data;

  //     if (res?.status === 201) {
  //       reducerDispatch({
  //         type: ACTION.GET_DATA_BASED_ON_SECTION,

  //         flagForTogglingFilter,
  //         selectedValue,

  //         selectedSubSection,
  //         subSections,
  //         cells,
  //         selectedCell,
  //         selectedLine,
  //         lines,
  //         message,
  //       });
  //     }
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  // const getFiltrationValueBasedOnSubSection = async ({ subSection }) => {
  //   try {
  //     const { res, data } = await getFiltrationValue({
  //       url: `/getFiltrationValue/subSectionBased/${subSection}`,
  //     });

  //     const { message, cells, selectedLine, lines } = data;

  //     if (res?.status === 201) {
  //       reducerDispatch({
  //         type: ACTION.GET_DATA_BASED_ON_SUBSECTION,

  //         cells,
  //         selectedLine,
  //         lines,
  //         message,
  //       });
  //     }
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  // const getFiltrationValueBasedOnCell = async ({ cell }) => {
  //   try {

  //     const { res, data } = await getFiltrationValue({
  //       url: `/getFiltrationValue/cellBased/${cell}`,
  //     });
  //     const { message, lines } = data;

  //     if (res?.status === 201) {
  //       reducerDispatch({
  //         type: ACTION.GET_DATA_BASED_ON_CELL,

  //         lines,
  //         message,
  //       });
  //     }
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  // const reducer = (state, action) => {
  //   switch (action?.type) {
  //     case ACTION?.GET_DATA:
  //       return {
  //         ...state,
  //         isLoading: false,
  //         message: action?.message,

  //         selectedValue: action?.selectedValue,
  //         flagForTogglingFilter: action?.flagForTogglingFilter,

  //         selectedValueForLineAnTMLoadGraph: action?.selectedValue,
  //         togglingFilterFlagForLineAnTMLoadGraph: action?.flagForTogglingFilter,

  //         selectedSection: action?.selectedSection,
  //         sections: action?.sections,
  //         selectedSubSection: action?.selectedSubSection,
  //         subSections: action?.subSections,
  //         selectedCell: action?.selectedCell,
  //         cells: action?.cells,
  //       };

  //     case ACTION?.GET_DATA_BASED_ON_SECTION:
  //       return {
  //         ...state,
  //         isLoading: false,
  //         message: action?.message,

  //         selectedValue: action?.selectedValue,
  //         flagForTogglingFilter: action?.flagForTogglingFilter,

  //         selectedValueForLineAnTMLoadGraph: action?.selectedValue,
  //         togglingFilterFlagForLineAnTMLoadGraph: action?.flagForTogglingFilter,

  //         selectedSubSection: action?.selectedSubSection,
  //         subSections: action?.subSections,
  //         selectedCell: action?.selectedCell,
  //         cells: action?.cells,
  //         selectedLine: action?.selectedLine,
  //         lines: action?.lines,
  //       };

  //     case ACTION?.GET_DATA_BASED_ON_SUBSECTION:
  //       return {
  //         ...state,
  //         isLoading: false,
  //         message: action?.message,

  //         cells: action?.cells,
  //         selectedLine: action?.selectedLine,
  //         lines: action?.lines,
  //       };

  //     case ACTION?.GET_DATA_BASED_ON_CELL:
  //       return {
  //         ...state,
  //         isLoading: false,
  //         message: action?.message,

  //         lines: action?.lines,
  //       };

  //     case ACTION?.HANDLE_SELECT_SECTION:
  //       getFiltrationValueBasedOnSection({ section: action?.selectedSection });

  //       return {
  //         ...state,

  //         flagForTogglingFilter: action?.flagForTogglingFilter,
  //         selectedValue: action?.selectedSection,

  //         selectedValueForLineAnTMLoadGraph: action?.selectedSection,
  //         togglingFilterFlagForLineAnTMLoadGraph: action?.flagForTogglingFilter,

  //         selectedSection: action?.selectedSection,
  //         selectedSubSection: "",
  //         subSections: [],
  //         selectedCell: "",
  //         cells: [],
  //         selectedLine: "",
  //         lines: [],
  //       };

  //     case ACTION?.HANDLE_SELECT_SUBSECTION:
  //       getFiltrationValueBasedOnSubSection({
  //         subSection: action?.selectedSubSection,
  //       });
  //       return {
  //         ...state,

  //         flagForTogglingFilter: action?.flagForTogglingFilter,
  //         selectedValue: action?.selectedSubSection,

  //         selectedValueForLineAnTMLoadGraph: action?.selectedSubSection,
  //         togglingFilterFlagForLineAnTMLoadGraph: action?.flagForTogglingFilter,

  //         selectedSubSection: action?.selectedSubSection,
  //         selectedCell: "",
  //         cells: [],
  //         selectedLine: "",
  //         lines: [],
  //       };

  //     case ACTION?.HANDLE_SELECT_CELL:
  //       getFiltrationValueBasedOnCell({
  //         cell: action?.selectedCell,
  //       });
  //       return {
  //         ...state,

  //         flagForTogglingFilter: action?.flagForTogglingFilter,
  //         selectedValue: action?.selectedCell,

  //         selectedValueForLineAnTMLoadGraph: action?.selectedCell,
  //         togglingFilterFlagForLineAnTMLoadGraph: action?.flagForTogglingFilter,

  //         selectedCell: action?.selectedCell,
  //         selectedLine: "",
  //         lines: [],
  //       };

  //     case ACTION?.HANDLE_SELECT_LINE:
  //       return {
  //         ...state,

  //         flagForTogglingFilter: action?.flagForTogglingFilter,
  //         selectedValue: action?.selectedLine,

  //         selectedLine: action?.selectedLine,
  //       };

  //     case ACTION?.HANDLE_SELECT_YEAR:
  //       return {
  //         ...state,
  //         selectedYear: action?.selectedYear,
  //         selectedMonth: "",
  //       };

  //     case ACTION?.HANDLE_SELECT_MONTH:
  //       return {
  //         ...state,
  //         selectedMonth: action?.selectedMonth,
  //       };

  //     default:
  //       return state;
  //   }
  // };

  // useEffect(() => {
  //   (async () => {
  //     const { res, data } = await getFiltrationValue({
  //       url: "/getFiltrationValue/byDefault",
  //     });

  //     const {
  //       message,

  //       flagForTogglingFilter,
  //       selectedValue,

  //       selectedSection,
  //       sections,
  //       selectedSubSection,
  //       subSections,
  //       selectedCell,
  //       cells,
  //     } = data;

  //     if (res?.status === 201) {
  //       reducerDispatch({
  //         type: ACTION.GET_DATA,

  //         flagForTogglingFilter,
  //         selectedValue,

  //         selectedSection,
  //         sections,
  //         selectedSubSection,
  //         subSections,
  //         cells,
  //         selectedCell,
  //         message,
  //       });
  //     }

  //     console.log(data);
  //   })();
  // }, []);

  const [reduceState, reducerDispatch] = useReducer(reducer, initialState);
  const baseUrlForFiltering = "/getFiltrationValue/all-filtration";
  return (
    <Container fluid>
      <Box className="cell p-3 mt-3">
        <Row>
          <Col className="d-flex align-items-center">
            <Typography variant="h4" component="h4">
              Man-Hour Report
            </Typography>
          </Col>

          <ChartsToolbar
            baseUrlForFiltering={baseUrlForFiltering}
            reduceState={reduceState}
            reducerDispatch={reducerDispatch}
            monthFiltration
          />
        </Row>

        <Row className="mt-3">
          <Col md={12} lg={6}>
            <ChartToPPTExample
              selectedValue={reduceState?.selectedValue}
              flagForTogglingFilter={reduceState?.flagForTogglingFilter}
              selectedYear={reduceState?.selectedYear}
            />
          </Col>

          <Col md={12} lg={6}>
            <ManHourTrend
              selectedValue={reduceState?.selectedValue}
              flagForTogglingFilter={reduceState?.flagForTogglingFilter}
              selectedYear={reduceState?.selectedYear}
            />
          </Col>

          <Col
            md={12}
            lg={6}
            style={{ marginTop: "1.25rem", paddingBottom: "4rem" }}
          >
            <LineTrend
              selectedValue={reduceState?.selectedValueForLineAnTMLoadGraph}
              flagForTogglingFilter={
                reduceState?.togglingFilterFlagForLineAnTMLoadGraph
              }
              selectedYear={reduceState?.selectedYear}
              selectedMonth={reduceState?.selectedMonth}
            />
          </Col>

          <Col
            md={12}
            lg={6}
            style={{ marginTop: "1.25rem", paddingBottom: "4rem" }}
          >
            <TMLoad
              selectedValue={reduceState?.selectedValueForLineAnTMLoadGraph}
              flagForTogglingFilter={
                reduceState?.togglingFilterFlagForLineAnTMLoadGraph
              }
              selectedYear={reduceState?.selectedYear}
              selectedMonth={reduceState?.selectedMonth}
            />
          </Col>
        </Row>
      </Box>
      {/* <Paper elevation={0} variant="outlined" sx={{ mt: 2, p: 1, pl: 2 }}>
        <Row>
          <Col className="d-flex align-items-center">
            <Typography variant="h4" component="h4">
              Man-Hour Report
            </Typography>
          </Col>

          <ChartsToolbar />
        </Row>
      </Paper>

      <Row className="mt-3">
        <Col md={6}>
          <ChartToPPTExample />
        </Col>

        <Col md={6}>
          <ManHourTrend />
        </Col>

        <Col md={6} style={{ marginTop: "1.25rem", paddingBottom: "4rem" }}>
          <LineTrend />
        </Col>

        <Col md={6} style={{ marginTop: "1.25rem", paddingBottom: "4rem" }}>
          <TMLoad />
        </Col>
      </Row> */}
    </Container>

    // <Container fluid>
    //   <Box className="cell p-3 mt-3">
    //     <Row>
    //       <Col className="d-flex align-items-center">
    //         <Typography variant="h4" component="h4">
    //           Man-Hour Report
    //         </Typography>
    //       </Col>

    //       <ChartsToolbar />
    //     </Row>

    //     <Row className="mt-3">
    //       <Col md={6}>
    //         <ChartToPPTExample />
    //       </Col>

    //       <Col md={6}>
    //         <ManHourTrend />
    //       </Col>

    //       <Col md={6} style={{ marginTop: "1.25rem", paddingBottom: "4rem" }}>
    //         <LineTrend />
    //       </Col>

    //       <Col md={6} style={{ marginTop: "1.25rem", paddingBottom: "4rem" }}>
    //         <TMLoad />
    //       </Col>
    //     </Row>
    //   </Box>
    //   {/* <Paper elevation={0} variant="outlined" sx={{ mt: 2, p: 1, pl: 2 }}>
    //     <Row>
    //       <Col className="d-flex align-items-center">
    //         <Typography variant="h4" component="h4">
    //           Man-Hour Report
    //         </Typography>
    //       </Col>

    //       <ChartsToolbar />
    //     </Row>
    //   </Paper>

    //   <Row className="mt-3">
    //     <Col md={6}>
    //       <ChartToPPTExample />
    //     </Col>

    //     <Col md={6}>
    //       <ManHourTrend />
    //     </Col>

    //     <Col md={6} style={{ marginTop: "1.25rem", paddingBottom: "4rem" }}>
    //       <LineTrend />
    //     </Col>

    //     <Col md={6} style={{ marginTop: "1.25rem", paddingBottom: "4rem" }}>
    //       <TMLoad />
    //     </Col>
    //   </Row> */}
    // </Container>
  );
};

export default ManHourDashboard;
