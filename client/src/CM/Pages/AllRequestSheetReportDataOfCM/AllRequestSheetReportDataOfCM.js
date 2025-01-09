import React, { useEffect, useReducer, useState } from "react";
import { Box, Grid, Slide, Typography, SvgIcon, Paper } from "@mui/material";
import { FaEye } from "react-icons/fa";
import { ReactComponent as EditSheetIcon } from "../../../static/svg/edit-sheet-2.svg";

import { ExportCsv, ExportPdf } from "@material-table/exporters";
import moment from "moment";
import { Container } from "react-bootstrap";
import ChartsToolbar from "../../../BM/Reports/ManHourReport/SubComponents/ChartsToolbar";
import {
  initialState,
  reducer,
} from "../../../BM/Reports/ManHourReport/SubComponents/CommonFiltrationComponent";
import axios from "axios";
import tableIcons from "../../../components/MatrialTableIcon";
import {
  MaterialTableOptions,
  MaterialTableStyle,
  MaterialTableSX,
} from "../../../BM/Utils/TableUtils/MaterialTableProps";
import MaterialTable from "@material-table/core";
import ExistingMachineReqSheetView from "../../Components/ReqestSheetOfCM/ExistingMachineRequestSheet/ExistingMachineReqSheetView";

const AllRequestSheetReportDataOfCM = () => {
  const [approvalRequestSheetDataOfCM, setApprovalRequestSheetDataOfCM] =
    useState([]);
  const [reduceState, reducerDispatch] = useReducer(
    reducer,
    initialState("Yes")
  );

  const [loading, setLoading] = useState(false);
  const [counters, setCounters] = useState([]);

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
      setLoading(true);
      const response = await axios.get(
        `/getAllCmReqSheet/${reduceState?.flagForTogglingFilter}/${reduceState?.selectedValue}/?selectedYear=${reduceState?.selectedYear}&&selectedMonth=${reduceState?.selectedMonth}&&selectedRSStatus=${reduceState?.selectedRSStatus}&&selectedMaintenanceType=${reduceState?.selectedMaintenanceType}`
      );
      setCounters(response.data.counters);
      setApprovalRequestSheetDataOfCM(response.data.reqSheetCM);
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
    selectedCMRequestSheetPopupData?.cmReqSheetView,
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
      title: "Activity",
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
      field: "current_commonDataFilledByAssignUser.plannedDateAndTimeOfCM",
      type: "date",
      editable: false,
    },
    {
      title: "Assigned To",
      render: (rowData) =>
        rowData?.assignUserForCM?.map((users) => users?.tm_name)?.join(", "),
    },
  ];

  // const [greaterValue, setGreaterValue] = useState(
  //   localStorage.getItem("greaterValue")
  // );
  // const [lesserValue, setLesserValue] = useState(
  //   localStorage.getItem("lesserValue")
  // );
  const baseUrlForFiltering = "/getFiltrationValue/all-filtration";
  const requestSheetApprovalAction = [
    (row) => ({
      icon: () => (
        <SvgIcon
          component={EditSheetIcon}
          sx={{
            color: row?.isEditableRS ? "#FF6F00" : "",
          }}
        />
      ),
      tooltip: "Update Req-sheet",
      position: "row",
      disabled: !row?.isEditableRS,
      onClick: (event, selectedRow) => {
        setSelectedCMRequestSheetPopupData({
          isEditable: true,
          cmReqSheetView: true,
          selectedRowRequestSheetId: selectedRow?._id,
        });
      },
    }),
    (row) => ({
      icon: () => <FaEye className="text-primary" />,
      tooltip: "View",
      position: "row",
      onClick: (event, selectedRow) => {
        setSelectedCMRequestSheetPopupData({
          isEditable: false,
          cmReqSheetView: true,
          selectedRowRequestSheetId: selectedRow?._id,
        });
      },
    }),
  ];

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
          className="bg-button text-center"
          variant="contained"
          style={{
            minWidth: "25px",
            height: "33px",
            paddingInline: "10px",
          }}
          // onClick={getAllRequestSheetData} //This will be used when we will use the api
        >
          Go
        </Button>
      </Box> */}
    </div>,
  ];
  const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="down" ref={ref} {...props} />;
  });
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
              CM Reports
            </Typography>
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
              backgroundColor: "#feb4b4ba", // d6c7fbba, e1c7fb , d6c7fb
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
                  // maxWidth: "100px",
                  p: "4px",
                  px: "10px",
                  borderRadius: "8px",
                }}
              >
                <Typography
                  variant="body2"
                  component="div"
                  textAlign="center"
                  // width={120}
                  fontWeight={500}
                  // color={"#15005c"}
                  // pt={"4px"}
                  // mb={"2px"}
                >
                  {item.title}
                </Typography>

                <Typography
                  variant="h5"
                  component="h5"
                  textAlign="center"
                  fontWeight={600}
                  // pb={"4px"}
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
                // toolbar: {
                //   exportCSVName: "Export some Excel format",
                //   exportPDFName: "Export as pdf!!"
                // }
              }}
              title={filtration}
              isLoading={loading}
              actions={requestSheetApprovalAction}
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
      {selectedCMRequestSheetPopupData?.cmReqSheetView && (
        <>
          <div>
            {selectedCMRequestSheetPopupData?.cmReqSheetView && (
              <ExistingMachineReqSheetView
                handlePopupStatus={handlePopupStatus}
                selectedYear={reduceState?.selectedYear}
                {...selectedCMRequestSheetPopupData}
              />
            )}
          </div>
        </>
      )}
    </>
  );
};

export default AllRequestSheetReportDataOfCM;
