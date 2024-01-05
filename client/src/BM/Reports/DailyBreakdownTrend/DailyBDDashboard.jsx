import React, { useState, useReducer } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { Box, Button, Paper, Typography } from "@mui/material";
import DailyBDTrendChart from "./DailyBDTrendChart";
import MonthlyPlanVsActualChart from "./MonthlyPlanVsActual";
import MTTRChart from "./MTTRChart";
import ReportTitleBar from "../Common/ReportTitleBar";
import ChartsToolbar from "../ManHourReport/SubComponents/ChartsToolbar";

import MonthlyBDTrendChart from "../MonthlyBDTrend/MonthlyBDTrendChart";

import {
  initialState,
  reducer,
} from "../ManHourReport/SubComponents/CommonFiltrationComponent";
import { useForm } from "react-hook-form";
import BDRequestSheetTable from "../Common/DailyBDRequestSheetTable";

import currentMonth from "../../../pages/Dashboard/DashboardComponent/currentMonth";

import DownloadMenu from "../ManHourReport/SubComponents/DownloadMenu";
import { EXPORT_REPORT, exportPPTX } from "../../Utils/ExportPPTX/exportPPTX";

const sectionBodyBoxStyle = {
  // display: "flex",
  justifyContent: "center",
  alignItems: "center",
  // gap: "10px",

  mt: "2px",
  // minHeight: "80px",
};

const StatusBox = ({ title, value }) => (
  <Col>
    <Typography
      variant="body2"
      component="div"
      textAlign="center"
      // width={120}
      fontWeight={500}
      mb={"2px"}
      // sx={{ md: { width: "120px" }, sm: { width: "100%" } }}
    >
      {title}
    </Typography>

    <Paper
      variant="outlined"
      sx={{
        backgroundColor: "#c6efce", //alternative color #deebf7
        // md: { width: "120px" },
        // sm: { width: "100%" },
      }}
    >
      <Typography
        variant="h5"
        component="h5"
        textAlign="center"
        fontWeight={500}
        p={1}
      >
        {value}
      </Typography>
    </Paper>
  </Col>
);

const DailyBTDashboard = () => {
  const [currentTabView, setCurrentTabView] = React.useState(0);
  const [sectionId, setSectionId] = React.useState("");
  const [filter, setFilter] = React.useState("hourly");
  // const [selectedYear, setSelectedYear] = React.useState("");
  const currentTabViewName = currentTabView === 0 ? "Plant" : "Section";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({});

  const [reduceState, reducerDispatch] = useReducer(reducer, initialState);
  const baseUrlForFiltering = "/getFiltrationValue/plant-level-filtration";

  const [requestSheetData, setRequestSheetData] = React.useState([]);

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

  return (
    <Container fluid>
      <Box>
        <ReportTitleBar
          title="KPI From Database"
          Toolbar={
            <>
              <ChartsToolbar
                baseUrlForFiltering={baseUrlForFiltering}
                reduceState={reduceState}
                reducerDispatch={reducerDispatch}
              />

              <Col className="col-auto">
                <DownloadMenu
                  handleDownloadPPTX={() => {
                    exportPPTX(EXPORT_REPORT.KPI_FROM_DB, {
                      ...reduceState,
                      filter,
                      dailyBDSelectedMonth,
                    });
                  }}
                />
              </Col>
            </>
          }
        />

        <Row className="gx-3 mt-1">
          <Col md={12} lg={6} className="mt-2">
            <Box className="cell p-3 mb-0">
              <Typography variant="h6" textAlign="center" fontWeight={600}>
                BD Counts Status
              </Typography>
              <Box className="row gx-3" sx={sectionBodyBoxStyle}>
                <StatusBox title="MBD Target" value="84" />
                <StatusBox title="MBD Actual" value="54" />
                <StatusBox title="Minor BD Count" value="200" />
              </Box>
            </Box>
          </Col>

          <Col md={12} lg={6} className="mt-2">
            <Box className="cell p-3 mb-0">
              <Typography variant="h6" textAlign="center" fontWeight={600}>
                BD Hours Status
              </Typography>
              <Box className="row gx-3" sx={sectionBodyBoxStyle}>
                <StatusBox title="BD Target" value="84" />
                <StatusBox title="BD Actual" value="54" />
                <StatusBox title="BD Yearly Actual" value="54" />
              </Box>
            </Box>
          </Col>
        </Row>

        <Box className="mb-3 mt-3">
          <DailyBDTrendChart
            {...reduceState}
            dailyBDSelectedMonth={dailyBDSelectedMonth}
            setDailyBDSelectedMonth={setDailyBDSelectedMonth}
          />
        </Box>

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
            downloadFileName={"Daily breakdown trend"}
          />
        </Paper>

        <Row className="mb-3 gx-3 mt-3">
          <Col md={12} lg={6}>
            {/* <MonthlyPlanVsActualChart /> */}

            {/* <Box className="row cell p-3 pt-2 pb-2 mt-3 g-0">
              <Box
                className="col"
                sx={{ display: "flex", alignItems: "center" }}
                // sx={{ borderBottom: 1, borderColor: "divider" }}
              >
                <Tabs
                  value={currentTabView}
                  onChange={handleChange}
                  indicatorColor="transparent"
                  textColor="inherit"
                  aria-label="tabs-switch"
                  sx={{
                    "& .MuiTab-root": { minHeight: "auto" },
                    "& .MuiTabs-scroller": {
                      display: "flex",
                      alignItems: "center",
                      minHeight: "50px",
                    },
                  }}
                  TabIndicatorProps={{
                    style: { display: "none" },
                  }}
                >
                  <Tab label="Plant" {...a11yProps(0)} />
                  <Tab label="Section" {...a11yProps(1)} />
                </Tabs>
              </Box>

              <Box
                className="col-auto"
                sx={{ display: "flex", alignItems: "center", gap: 2 }}
              >
                {currentTabView === 1 && (
                  <SectionsDropdown
                    sectionId={sectionId}
                    setSectionId={setSectionId}
                  />
                )}
           
                <DownloadMenu
                  handleDownloadPPTX={() => {
                    exportPPTX(EXPORT_REPORT.MONTHLY_BD, urlOptions);
                  }}
                />
              </Box>
            </Box> */}

            <MonthlyBDTrendChart
              filterState={reduceState}
              filter={filter}
              setFilter={setFilter}
              currentTabViewName={currentTabViewName}
              sectionId={sectionId}
              selectedYear={reduceState.selectedYear}
            />
          </Col>
          <Col md={12} lg={6}>
            <MTTRChart />
          </Col>
        </Row>
      </Box>
    </Container>
  );
};

export default DailyBTDashboard;
