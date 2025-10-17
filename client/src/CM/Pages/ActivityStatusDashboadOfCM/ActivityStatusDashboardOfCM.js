import { Box, Button, Grid, Typography, Paper } from "@mui/material";
import MaterialTable from "@material-table/core";
import React, { useContext, useEffect, useReducer, useState } from "react";
import { FaEye } from "react-icons/fa";
import tableIcons from "../../../components/MatrialTableIcon";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import { ExportCsv, ExportPdf } from "@material-table/exporters";
import {
  MaterialTableOptions,
  MaterialTableStyle,
  MaterialTableSX,
} from "../../../BM/Utils/TableUtils/MaterialTableProps";
import moment from "moment";
import { Container } from "react-bootstrap";
import ChartsToolbar from "../../../BM/Reports/ManHourReport/SubComponents/ChartsToolbar";
import {
  initialState,
  reducer,
} from "../../../BM/Reports/ManHourReport/SubComponents/CommonFiltrationComponent";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ExistingMachineReqSheetView from "../../Components/ReqestSheetOfCM/ExistingMachineRequestSheet/ExistingMachineReqSheetView";
import RoutingContext from "../../../context/routing/RoutingContext";

const ActivityStatusDashboardOfCM = () => {
  const navigate = useNavigate();

  const baseUrlForFiltering = "/getFiltrationValue/all-filtration";
  const [reduceState, reducerDispatch] = useReducer(
    reducer,
    initialState("Yes")
  );

  const handleGenerateBMNavigation = async () => {
    navigate(`/cm/generateCMRequestSheetMainDashboard`);
  };

  const initialStateForRS = {
    loading: true,
    reqSheetCM: [],
    counters: {
      total_request_sheet_count: 0,
      open_request_sheet_count: 0,
      closed_request_sheet_count: 0,
    },
  };

  const [activityStatusDashboardData, setActivityStatusDashboardData] =
    useState(initialStateForRS);

  const defaultState = {
    cmReqSheetView: false,
    isEditable: false,
    selectedRowRequestSheetId: "",
  };

  const [selectedCMRequestSheetPopupData, setSelectedCMRequestSheetPopupData] =
    useState(defaultState);

  const handlePopupStatus = () =>
    setSelectedCMRequestSheetPopupData(defaultState);

  const getAllCMSheetData = async () => {
    try {
      setActivityStatusDashboardData({
        ...initialStateForRS,
        loading: true,
      });
      const response = await axios.get(
        `/getAllCmReqSheet/${reduceState?.flagForTogglingFilter}/${reduceState?.selectedValue}/?selectedYear=${reduceState?.selectedYear}&&selectedMonth=${reduceState?.selectedMonth}&&selectedRSStatus=${reduceState?.selectedRSStatus}&&selectedCategoryType=${reduceState?.selectedCategoryType}&&selectedQuarter=${reduceState?.selectedQuarter}`
      );

      if (response?.status === 201) {
        return setActivityStatusDashboardData({
          loading: false,
          ...response.data,
        });
      }
    } catch (error) {
      console.log(error);
    }
    setActivityStatusDashboardData({
      ...initialStateForRS,
      loading: false,
    });
  };
  useEffect(() => {
    if (reduceState?.selectedValue) getAllCMSheetData();
  }, [
    reduceState?.selectedValue,
    reduceState?.selectedYear,
    reduceState?.selectedMonth,
    reduceState?.selectedRSStatus,
    reduceState?.selectedCategoryType,
    reduceState?.selectedQuarter,
  ]);
  const cmApprovalHeaders = [
    {
      title: "Sr. No.",
      render: (rowData) => `${rowData.tableData.id + 1}`,
      editable: false,
      width: "5%",
    },
    {
      title: "Line Name",
      field: "line",
      editable: false,
    },
    {
      title: "Machine No",
      field: "machineNo",
      editable: false,
    },
    {
      title: "Machine Name",
      field: "machineName",
      editable: false,
    },
    {
      title: "Req No.",
      field: "requestSheetNoOfCM",
      editable: false,
    },
    {
      title: "Category",
      field: "cmBasicDataFilledByMTD_TL.categories",
      editable: false,
    },
    {
      title: "Acivity",
      field: "cmBasicDataFilledByMTD_TL.activityOfCM",
      editable: false,
    },
    {
      title: "status",
      field: "current_commonDataFilledByAssignUser.requestSheetStatusOfCM",
      editable: false,
    },
    {
      title: "Planned Date",
      field: "cmBasicDataFilledByMTD_TL.plannedDateAndTimeOfCM",
      type: "date",
      editable: false,
    },
    {
      title: "Target Date",
      field: "current_commonDataFilledByAssignUser.targetDateOfCM",
      type: "date",
      editable: false,
    },
  ];

  // const [greaterValue, setGreaterValue] = useState(
  //   localStorage.getItem("greaterValue")
  // );
  // const [lesserValue, setLesserValue] = useState(
  //   localStorage.getItem("lesserValue")
  // );

  const requestSheetApprovalAction = [
    (row) => ({
      icon: () => <FaEye className="text-primary" />,
      tooltip: "View",
      position: "row",
      onClick: (event, selectedRow) => {
        setSelectedCMRequestSheetPopupData(
          (selectedCMRequestSheetPopupData) => ({
            ...selectedCMRequestSheetPopupData,
            cmReqSheetView: true,
            selectedRowRequestSheetId: selectedRow?._id,
          })
        );
      },
    }),
  ];
  const context = useContext(RoutingContext);

  // ============== This might change in CM =================
  const RSStatusArray = [
    "Generated",
    "Assigned",
    "Rejected",
    "Under MTD TL Approval",
    "Under MTD HOSS Approval",
    "Under PRD TL Approval",
    "Under MTD HOS Approval",
    "Completed",
  ];
  const CM_CategoryArrayForFilter = [
    "Overhauling",
    "Upgradation",
    "BM Reflection",
    "LTPM",
    "Others",
  ];
  // ==============================================================

  const filtration = [
    <div className="d-flex justify-content-between">
      <Box sx={{ mx: "10px", my: "10px" }}>
        <ChartsToolbar
          baseUrlForFiltering={baseUrlForFiltering}
          reduceState={reduceState}
          reducerDispatch={reducerDispatch}
          // monthFiltration
          yearFiltration
          sectionFiltration
          subSectionFiltration
          cellFiltration
          lineFiltration
          machineFiltration
          RSStatusArray={RSStatusArray}
          RSStatusFiltration
          CM_Category={CM_CategoryArrayForFilter}
          CM_CategoryFiltration
          quarterFiltration
          resetButtonFiltration
          isWithLocalStorageForFiltration="Yes"
        />
      </Box>
      &nbsp;&nbsp;&nbsp;&nbsp;
      {/* <Box
        component="form"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <TextField
          type="number"
          id="outlined-basic"
          placeholder="From"
          variant="outlined"
          sx={{
            width: "5rem",
            pl: 0,
            "& .MuiOutlinedInput-root": { pl: 0 },
            "& .MuiOutlinedInput-input": { pt: "6px", pb: "6px" },
          }}
          InputProps={{
            sx: { fontSize: 14 },
            startAdornment: (
              <InputAdornment position="start">&gt; &#61;</InputAdornment>
            ),
          }}
          size="small"
          onChange={(e) => {
            setLesserValue(e.target.value);
            localStorage.setItem("lesserValue", e.target.value);
          }}
          value={lesserValue}
        />
        <TextField
          type="number"
          id="outlined-basic"
          placeholder="To"
          variant="outlined"
          sx={{
            width: "5rem",
            pl: 0,
            "& .MuiOutlinedInput-root": { pl: 0 },
            "& .MuiOutlinedInput-input": { pt: "6px", pb: "6px" },
          }}
          InputProps={{
            sx: { fontSize: 14 },
            startAdornment: (
              <InputAdornment position="start">&lt; &#61;</InputAdornment>
            ),
          }}
          size="small"
          onChange={(e) => {
            setGreaterValue(e.target.value);
            localStorage.setItem("greaterValue", e.target.value);
          }}
          value={greaterValue}
        />
        <Button
          disableElevation
          className="bg-button text-center"
          variant="contained"
          style={{
            minWidth: "25px",
            height: "33px",
            paddingInline: "10px",
          }}
        >
          Go
        </Button>
      </Box> */}
    </div>,
  ];
  return (
    <>
      <Container fluid>
        <Grid
          container
          className="cell py-2 px-3 mt-3 gap-2 g-0 align-items-center"
        >
          <Grid item xs={12} display={"flex"} justifyContent={"space-between"}>
            <Typography
              noWrap
              variant="h4"
              component="h4"
              fontSize={25}
              fontWeight={600}
              sx={{ mr: 3 }}
            >
              CM Activity Status Monitoring
            </Typography>
            <Box display="flex" gap="16px" className="col-auto">
              <Button
                variant="contained"
                disableElevation
                onClick={handleGenerateBMNavigation}
                disabled={context?.user_type !== "TL/HOSS"}
                sx={{
                  fontWeight: 400,
                  bgcolor: "#004b5b",
                  "&:hover": { bgcolor: "#026378" },
                }}
              >
                <AddCircleIcon sx={{ mr: "8px" }} />
                Generate Existing Machine CM RS
              </Button>
            </Box>
          </Grid>
        </Grid>
        <Box display="flex" gap="16px" className="mt-3 cell p-2 overflow-auto">
          {[
            {
              title: "Total Requests",
              value:
                activityStatusDashboardData?.counters
                  ?.total_request_sheet_count,
              backgroundColor: "#c7defb",
            },
            {
              title: "Open Requests",
              value:
                activityStatusDashboardData?.counters?.open_request_sheet_count,
              backgroundColor: "#feb4b4ba",
            },
            {
              title: "Closed Requests",
              value:
                activityStatusDashboardData?.counters
                  ?.closed_request_sheet_count,
              backgroundColor: "#c6efce",
            },
          ].map((item) => (
            <Box className="col-auto">
              <Paper
                variant="outlined"
                sx={{
                  backgroundColor: item.backgroundColor,
                  p: "4px",
                  px: "10px",
                  borderRadius: "8px",
                }}
              >
                <Typography
                  variant="body2"
                  component="div"
                  textAlign="center"
                  fontWeight={500}
                >
                  {item.title}
                </Typography>

                <Typography
                  variant="h5"
                  component="h5"
                  textAlign="center"
                  fontWeight={600}
                >
                  {item.value}
                </Typography>
              </Paper>
            </Box>
          ))}
        </Box>
        <Grid container>
          <Grid item xs={12} className="mt-1 cell p-0 border-0">
            <MaterialTable
              localization={{
                header: {
                  actions: "Actions",
                },
              }}
              title={filtration}
              isLoading={activityStatusDashboardData?.loading}
              actions={requestSheetApprovalAction}
              icons={tableIcons}
              columns={cmApprovalHeaders}
              data={activityStatusDashboardData?.reqSheetCM}
              editable={{}}
              options={{
                ...MaterialTableOptions,
                pageSize: 50,
                showTitle: true,
                exportMenu: [
                  {
                    label: "Export PDF",
                    exportFunc: (cols, data) =>
                      ExportPdf(
                        cols,
                        data,
                        `Approval List of Request-Sheet ${moment().format(
                          "DD-MM-YYYY"
                        )}`
                      ),
                  },
                  {
                    label: "Export CSV",
                    exportFunc: (cols, data) =>
                      ExportCsv(
                        cols,
                        data,
                        `Approval List of Request-Sheet ${moment().format(
                          "DD-MM-YYYY"
                        )}`
                      ),
                  },
                ],
              }}
              style={MaterialTableStyle}
              sx={MaterialTableSX}
            />
          </Grid>
        </Grid>
      </Container>

      {selectedCMRequestSheetPopupData?.cmReqSheetView && (
        <ExistingMachineReqSheetView
          handlePopupStatus={handlePopupStatus}
          selectedYear={reduceState?.selectedYear}
          {...selectedCMRequestSheetPopupData}
          quarterOfSelectedRq={reduceState?.selectedQuarter}
        />
      )}
    </>
  );
};

export default ActivityStatusDashboardOfCM;
