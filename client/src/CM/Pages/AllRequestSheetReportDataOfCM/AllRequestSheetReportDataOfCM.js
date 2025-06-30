import React, { useContext, useEffect, useReducer, useState } from "react";
import {
  Box,
  Grid,
  Slide,
  Typography,
  SvgIcon,
  Paper,
  Button,
} from "@mui/material";
import { FaEye } from "react-icons/fa";
import { ReactComponent as EditSheetIcon } from "../../../static/svg/edit-sheet-2.svg";
import AddCircleIcon from "@mui/icons-material/AddCircle";
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
import RoutingContext from "../../../context/routing/RoutingContext";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const AllRequestSheetReportDataOfCM = () => {
  const [approvalRequestSheetDataOfCM, setApprovalRequestSheetDataOfCM] =
    useState([]);
  const [reduceState, reducerDispatch] = useReducer(
    reducer,
    initialState("Yes")
  );
  const navigate = useNavigate();

  const context = useContext(RoutingContext);

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
      setApprovalRequestSheetDataOfCM();
      const response = await axios.get(
        `/getAllCmReqSheet/${reduceState?.flagForTogglingFilter}/${reduceState?.selectedValue}/?selectedYear=${reduceState?.selectedYear}&&selectedMonth=${reduceState?.selectedMonth}&&selectedRSStatus=${reduceState?.selectedRSStatus}&&selectedCategoryType=${reduceState?.selectedCategoryType}&&selectedQuarter=${reduceState?.selectedQuarter}`
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
    reduceState?.selectedCategoryType,
    selectedCMRequestSheetPopupData?.cmReqSheetView,
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
    {
      title: "Assigned To",
      render: (rowData) =>
        rowData?.assignUserForCM?.map((users) => users?.tm_name)?.join(", "),
    },
  ];

  const notifyForDeleteChecksheet = () => {
    toast.success("CM CheckSheet deleted successfully", {
      position: "top-center",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
      progress: undefined,
      theme: "dark",
    });
  };

  const deleteRequestSheetOfCM = async (selectedRow) => {
    try {
      const res = await fetch(`/deleteRequestSheetOfCM/${selectedRow?._id}`, {
        method: "DELETE",
      });
      if (res?.status === 201) {
        notifyForDeleteChecksheet();
        getAllCMSheetData();
      }
    } catch (error) {
      console.log(error);
    }
  };
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
          isEditable: row?.isEditableRS && row?.assignUserForCM?.length > 0,
          assignUserCondition: row?.assignUserForCM?.length <= 0,
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
          // maintenanceTypeArrayForFilter={maintenanceTypeArrayForFilter}
          CM_Category={CM_CategoryArrayForFilter}
          quarterFiltration
          CM_CategoryFiltration
          // maintenanceTypeFiltration
          resetButtonFiltration
          isWithLocalStorageForFiltration="Yes"
        />
      </Box>
      &nbsp;&nbsp;&nbsp;&nbsp;
    </div>,
  ];
  const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="down" ref={ref} {...props} />;
  });

  const handleGenerateBMNavigation = async () => {
    navigate(`/cm/generateCMRequestSheetMainDashboard`);
  };

  return (
    <>
      <ToastContainer style={{ width: "30rem" }} />

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

              editable={{
                // onRowUpdate: (updatedRow, oldRow) =>
                // new Promise(async (resolve, reject) => {
                //   //   await updateRequestSheet(updatedRow);
                //   resolve();
                // }),
                isDeleteHidden: (rowData) =>
                  context?.isAuthorizedUserForUpdatingRequestSheetInAnyStatus !==
                  "Yes",

                onRowDelete: (selectedRow) =>
                  new Promise(async (resolve, reject) => {
                    // setTimeout(() => {
                    await deleteRequestSheetOfCM(selectedRow);
                    resolve();
                    // }, 500);
                  }),
              }}
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
        <>
          <div>
            {selectedCMRequestSheetPopupData?.cmReqSheetView && (
              <ExistingMachineReqSheetView
                handlePopupStatus={handlePopupStatus}
                selectedYear={reduceState?.selectedYear}
                {...selectedCMRequestSheetPopupData}
                quarterOfSelectedRq={reduceState?.selectedQuarter}
              />
            )}
          </div>
        </>
      )}
    </>
  );
};

export default AllRequestSheetReportDataOfCM;
