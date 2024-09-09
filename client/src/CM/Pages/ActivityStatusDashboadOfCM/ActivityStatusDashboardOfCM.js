import {
  Box,
  Button,
  Grid,
  InputAdornment,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import MaterialTable, { MTableToolbar } from "@material-table/core";
import React, { useReducer, useState } from "react";
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

const ActivityStatusDashboardOfCM = () => {
  // const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const handleGenerateBMNavigation = async () => {
    navigate(`/cm/generateCMRequestSheetMainDashboard`);
  };

  const [approvalRequestSheetDataOfCM, setApprovalRequestSheetDataOfCM] =
    useState([]);
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
      field: "reqNo",
      editable: false,
    },
    {
      title: "Category",
      field: "category",
      editable: false,
    },
    {
      title: "Acivity",
      field: "activity",
      editable: false,
    },
    {
      title: "status",
      field: "status",
      editable: false,
    },
    {
      title: "Problem Occured",
      field: "problemOccured",
      editable: false,
    },
  ];
  const [reduceState, reducerDispatch] = useReducer(
    reducer,
    initialState("Yes")
  );
  const [greaterValue, setGreaterValue] = useState(
    localStorage.getItem("greaterValue")
  );
  const [lesserValue, setLesserValue] = useState(
    localStorage.getItem("lesserValue")
  );
  const baseUrlForFiltering = "/getFiltrationValue/all-filtration";

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
          monthFiltration
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
          resetButtonFiltration
          isWithLocalStorageForFiltration="Yes"
        />
      </Box>
      &nbsp;&nbsp;&nbsp;&nbsp;
      {/* <Box display="flex" alignItems="center">
        <Tooltip title="Show/Hide Column">
          <Switch
            size="medium"
            checked={displayColumnOrNot}
            onClick={() =>
              setDisplayColumnOrNot((displayColumnOrNot) => !displayColumnOrNot)
            }
          />
        </Tooltip>
      </Box> */}
      <Box
        component="form"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        {/* <p style={{ fontSize: "1rem" }}>Top:</p> */}

        <TextField
          type="number"
          id="outlined-basic"
          // sx={{ width: "80px" }}
          placeholder="From"
          variant="outlined"
          sx={{
            // width: "12ch",
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
          // sx={{ width: "80px" }}
          placeholder="To"
          variant="outlined"
          sx={{
            // width: "12ch",
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
          // size="small"
          disableElevation
          className="bg-button"
          variant="contained"
          sx={{
            minWidth: "30px",
            height: "32px",
            paddingInline: "10px",
          }}
          // onClick={getAllRequestSheetData} //This will be used when we will use the api
        >
          Go
        </Button>
      </Box>
    </div>,
    // "sd;kfgksn"
  ];

  return (
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
              // disabled={context?.tm_department !== "PRD"}
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
      <Grid container>
        <Grid item xs={12} className="mt-1 cell p-0 border-0">
          <MaterialTable
            localization={{
              header: {
                actions: "Actions",
              },
              // toolbar: {
              //   exportCSVName: "Export some Excel format",
              //   exportPDFName: "Export as pdf!!"
              // }
            }}
            title={filtration}
            // isLoading={loading}
            // actions={requestSheetApprovalAction}
            icons={tableIcons}
            columns={cmApprovalHeaders}
            data={approvalRequestSheetDataOfCM}
            // title="User Management"
            // tableRef={this.tableRef.current.onQueryChange()}

            editable={
              {
                // onRowUpdate: (updatedRow, oldRow) =>
                // new Promise(async (resolve, reject) => {
                //   //   await updateRequestSheet(updatedRow);
                //   resolve();
                // }),
              }
            }
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
  );
};

export default ActivityStatusDashboardOfCM;
