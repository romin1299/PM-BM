import {
  Box,
  Button,
  Grid,
  InputAdornment,
  TextField,
  Typography,
  Paper,
} from "@mui/material";
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

  const handleGenerateBMNavigation = async () => {
    navigate(`/cm/generateCMRequestSheetMainDashboard`);
  };

  const [approvalRequestSheetDataOfCM, setApprovalRequestSheetDataOfCM] =
    useState([]);
  const [loading, setLoading] = useState(false);
  const [reduceState, reducerDispatch] = useReducer(
    reducer,
    initialState("Yes")
  );
  const [CmReqSheetView, setCmReqSheetView] = useState(false);
  const [counters, setCounters] = useState([]);

  const getAllCMSheetData = async () => {
    try {
      setLoading(true);
      setApprovalRequestSheetDataOfCM()
      const response = await axios.get(
        `/getAllCmReqSheet/${reduceState?.flagForTogglingFilter}/${reduceState?.selectedValue}/?selectedYear=${reduceState?.selectedYear}&&selectedMonth=${reduceState?.selectedMonth}&&selectedRSStatus=${reduceState?.selectedRSStatus}&&selectedMaintenanceType=${reduceState?.selectedMaintenanceType}&&selectedQuarter=${reduceState?.selectedQuarter}`
      );
      setApprovalRequestSheetDataOfCM(response.data.reqSheetCM);
      setCounters(response.data.counters);
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };
  useEffect(() => {
    if (reduceState?.selectedValue) getAllCMSheetData();
  }, [
    reduceState?.selectedValue,
    reduceState?.selectedYear,
    reduceState?.selectedMonth,
    reduceState?.selectedRSStatus,
    reduceState?.selectedMaintenanceType,
    reduceState?.selectedQuarter
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
      title: "Target Date",
      field: "cmBasicDataFilledByMTD_TL.targetDateOfCM",
      type: "date",
      editable: false,
    },
    {
      title: "Planned Date",
      field: "current_commonDataFilledByAssignUser.plannedDateAndTimeOfCM",
      type: "date",
      editable: false,
    },
  ];

  const [greaterValue, setGreaterValue] = useState(
    localStorage.getItem("greaterValue")
  );
  const [isEditable, setIsEditable] = useState(false);
  const [lesserValue, setLesserValue] = useState(
    localStorage.getItem("lesserValue")
  );
  const [selectedRowRequestSheetId, setSelectedRowRequestSheetId] = useState();
  const baseUrlForFiltering = "/getFiltrationValue/all-filtration";
  const requestSheetApprovalAction = [
    (row) => ({
      icon: () => <FaEye className="text-primary" />,
      tooltip: "View",
      position: "row",
      onClick: (event, selectedRow) => {
        setCmReqSheetView(true);
        setIsEditable(false);
        setSelectedRowRequestSheetId(selectedRow?._id);
      },
    }),
  ];
  const context = useContext(RoutingContext);

  // ============== This might change in CM =================
  const RSStatusArray = [
    "Generated",
    "Assigned",
    "Work Order Open",
    "Work Order Pending",
    "Work Order Closed",
    "Fill Sheet",
    "Rejected",
    "Under MTD TL approval",
    "Under MTD HOSS approval",
    "Under PRD TL Approval",
    "Under PRD HOS Approval",
    "Under MTD HOS Approval",
    "Under MTD HOD Approval",
    "Under PRD HOD Approval",
    "Completed",
  ];
  const maintenanceTypeArrayForFilter = ["PM", "BM", "CM", "TPM"];
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
          maintenanceTypeArrayForFilter={maintenanceTypeArrayForFilter}
          maintenanceTypeFiltration
          quarterFiltration
          resetButtonFiltration
          isWithLocalStorageForFiltration="Yes"
        />
      </Box>
      &nbsp;&nbsp;&nbsp;&nbsp;
      <Box
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
        <h6
          style={{
            color: "red",
          }}
        >
          Planned Date is remaining
        </h6>
      </Box>
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
              value: counters?.total_request_sheet_count || 0,
              backgroundColor: "#c7defb",
            },
            {
              title: "Open Requests",
              value: counters?.open_request_sheet_count || 0,
              backgroundColor: "#feb4b4ba",
            },
            {
              title: "Closed Requests",
              value: counters?.closed_request_sheet_count || 0,
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
              isLoading={loading}
              actions={requestSheetApprovalAction}
              icons={tableIcons}
              columns={cmApprovalHeaders}
              data={approvalRequestSheetDataOfCM}
              editable={{}}
              options={{
                ...MaterialTableOptions,
                pageSize: 5,
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

      {CmReqSheetView && (
        <ExistingMachineReqSheetView
          selectedYear={reduceState?.selectedYear}
          selectedRowRequestSheetId={selectedRowRequestSheetId}
          isEditable={isEditable}
          setCmReqSheetView={setCmReqSheetView}
          CmReqSheetView={CmReqSheetView}
        />
      )}
    </>
  );
};

export default ActivityStatusDashboardOfCM;
