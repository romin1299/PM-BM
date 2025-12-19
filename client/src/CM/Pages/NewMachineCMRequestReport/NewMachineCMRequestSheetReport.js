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
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
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
import Multiselect from "multiselect-react-dropdown";
import { SuccessToast } from "../../../BM/Component/ShowTostify";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";
import MainRequestSheetForView from "../../../BM/Tabs/RequestSheetForView/MainRequestSheetForView";
import NewMachineRequestForViewAndUpdate from "./NewMachineRequestForViewAndUpdate";

const NewMachineCMRequestSheetReport = () => {
  const [approvalRequestSheetDataOfCM, setApprovalRequestSheetDataOfCM] =
    useState([]);
  const [reduceState, reducerDispatch] = useReducer(
    reducer,
    initialState("Yes")
  );
  const navigate = useNavigate();
  const [supportingTMList, setSupportingTMList] = useState([]);

  const context = useContext(RoutingContext);

  const [loading, setLoading] = useState(false);
  const [counters, setCounters] = useState([]);

  const defaultState = {
    newMachineCmReqSheetView: false,
    isEditable: false,
    selectedRowRequestSheetId: "",
    isOtherFieldsEditableOrNot: "No",
    // targetDateOfCM: "",
  };

  const [
    selectedNewMachineCMRequestSheetPopupData,
    setSelectedNewMachineCMRequestSheetPopupData,
  ] = useState(defaultState);

  const defaultStateForBmRequestSheet = {
    requestSheetID: "",
    machine_code: "",
    modalOpenClose: false,
  };

  const [requestSheetModalOpenClose, setRequestSheetModalOpenClose] = useState(
    defaultStateForBmRequestSheet
  );

  const handlePopupStatus = () =>
    setSelectedNewMachineCMRequestSheetPopupData(defaultState);

  const getAllCMSheetData = async () => {
    try {
      setLoading(true);
      setApprovalRequestSheetDataOfCM();
      const response = await axios.get(
        `/getAllNewMachineCmReqSheet/${reduceState?.flagForTogglingFilter}/${reduceState?.selectedValue}/?selectedYear=${reduceState?.selectedYear}&&selectedMonth=${reduceState?.selectedMonth}&&selectedRSStatus=${reduceState?.selectedRSStatus}`
      );
      // setCounters(response.data.counters);
      setApprovalRequestSheetDataOfCM(response.data.newMachineReqSheetCM);
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
    selectedNewMachineCMRequestSheetPopupData?.newMachineCmReqSheetView,
    reduceState?.selectedQuarter,
  ]);

  const getMachineDetails = async () => {
    try {
      const res = await fetch(`/getSupportingTMDetailsForRequestSheetOfCM`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (res.status === 201) {
        const { TLHOSS_and_TM_user_list } = await res.json();
        setSupportingTMList(TLHOSS_and_TM_user_list);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getMachineDetails();
  }, []);

  const dropDownComponent = ({ value = [], onChange, dropDownArray = [] }) => {
    const selectedValues = dropDownArray.filter((item) =>
      value?.includes(item._id)
    );

    return (
      <Multiselect
        options={dropDownArray}
        selectedValues={selectedValues}
        displayValue="tm_name"
        onSelect={(selectedList) => {
          onChange(selectedList);
        }}
        onRemove={(selectedList) => {
          onChange(selectedList);
        }}
        style={{
          chips: { background: "#007bff" },
          searchBox: { border: "1px solid #ccc", borderRadius: "4px" },
        }}
      />
    );
  };

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
      field: "requestSheetNoOfNewMachineCM",
      editable: false,
      width: "10%",
    },
    {
      title: "Scope of CM",
      field: "newMachineRequestFilledByPED.scopeOfCM",
      editable: false,
      width: "15%",
    },
    {
      title: "Request On",
      field: "newMachineRequestFilledByPED.requestOn",
      editable: false,
    },
    {
      title: "Required On",
      field: "newMachineRequestFilledByPED.requiredOn",
      editable: false,
    },
    {
      title: "Request-Sheet Status",
      field: "statusOfNewRequestOfCM",
      editable: false,
    },
    // {
    //   title: "Planned Date",
    //   field: "cmBasicDataFilledByMTD_TL.plannedDateAndTimeOfCM",
    //   type: "date",
    //   editable: false,
    // },
    // {
    //   title: "Target Date",
    //   field: "current_commonDataFilledByAssignUser.targetDateOfCM",
    //   type: "date",
    //   editable: false,
    // },
    {
      title: "Assigned To",
      field: `assignUserForCM`,
      render: (rowData) =>
        rowData?.assignUserForCM?.map((users) => users?.tm_name)?.join(", "),
      editComponent: ({ value, onChange, rowData }) =>
        dropDownComponent({
          value: value || [],
          onChange,
          dropDownArray: supportingTMList,
          rowData,
        }),
      customFilterAndSearch: (search, rowData) =>
        rowData?.assignUserForCM?.some((user) =>
          user?.tm_name?.toLowerCase().includes(search.toLowerCase())
        ),
      exportTransformer: (rowData) =>
        rowData?.assignUserForCM?.map((u) => u?.tm_name).join(", ") || "",
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
  let requestSheetApprovalAction = [
    (row) => ({
      icon: () => (
        <SvgIcon
          component={EditSheetIcon}
          sx={{
            color:
              row?.isEditableRS && context?.tm_no !== Number("9999")
                ? "#FF6F00"
                : "",
          }}
        />
      ),
      tooltip: "Update Req-sheet",
      position: "row",
      disabled: !row?.isEditableRS || context?.tm_no === Number("9999"),
      onClick: (event, selectedRow) => {
        setSelectedNewMachineCMRequestSheetPopupData({
          ...selectedNewMachineCMRequestSheetPopupData,
          isEditable: selectedRow?.isEditableRS,
          // assignUserCondition: row?.assignUserForCM?.length <= 0,
          newMachineCmReqSheetView: true,
          selectedRowRequestSheetId: selectedRow?._id,
          machine_code: selectedRow?.machineNo,
          isOtherFieldsEditableOrNot:
            context?.isAuthorizedUserForUpdatingRequestSheetInAnyStatus,
        });
      },
    }),
    (row) => ({
      icon: () => <FaEye className="text-primary" />,
      tooltip: "View",
      position: "row",
      onClick: (event, selectedRow) => {
        setSelectedNewMachineCMRequestSheetPopupData({
          ...selectedNewMachineCMRequestSheetPopupData,
          isEditable: false,
          newMachineCmReqSheetView: true,
          selectedRowRequestSheetId: selectedRow?._id,
          machine_code: selectedRow?.machineNo,
        });
      },
    }),
    // (row) => ({
    //   icon: () => <ReceiptLongIcon className="text-primary" />,
    //   tooltip: "BD Sheet",
    //   position: "row",
    //   hidden: row?.requestSheetOfBMRef === null,
    //   onClick: (event, selectedRow) => {
    //     setRequestSheetModalOpenClose({
    //       ...requestSheetModalOpenClose,
    //       requestSheetID: selectedRow?.requestSheetOfBMRef,
    //       machine_code: selectedRow?.machineNo,
    //       modalOpenClose: true,
    //     });
    //   },
    // }),
  ];
  if (context?.isAuthorizedUserForUpdatingRequestSheetInAnyStatus === "Yes") {
    requestSheetApprovalAction?.push((row) => ({
      icon: () =>
        row?.statusOfNewRequestOfCM === "Completed" ? (
          <DriveFileRenameOutlineIcon color="primary" />
        ) : (
          <DriveFileRenameOutlineIcon color="disabled" />
        ),
      tooltip: "Edit After All Approval",
      position: "row",
      disabled: row?.statusOfNewRequestOfCM !== "Completed",
      onClick: (event, selectedRow) => {
        setSelectedNewMachineCMRequestSheetPopupData({
          isEditable: true,
          // assignUserCondition: row?.assignUserForCM?.length <= 0,
          cmReqSheetView: true,
          selectedRowRequestSheetId: selectedRow?._id,
          isOtherFieldsEditableOrNot:
            context?.isAuthorizedUserForUpdatingRequestSheetInAnyStatus,
        });
      },
    }));
  }

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
    {
      title: "Overhauling",
      background: "#ffb4a1ff",
      count: counters?.overhaulingCMCategory,
    },
    {
      title: "Upgradation",
      background: "#FFFF9D",
      count: counters?.upgradationCMCategory,
    },
    {
      title: "BM Reflection",
      background: "#BEEB9F",
      count: counters?.BM_ReflectionCMCategory,
    },
    {
      title: "Others",
      background: "#9fbfe0ff",
      count: counters?.othersCMCategory,
    },
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
          // CM_Category={CM_CategoryArrayForFilter}
          // quarterFiltration
          // CM_CategoryFiltration
          // maintenanceTypeFiltration
          resetButtonFiltration
          isWithLocalStorageForFiltration="Yes"
        />
      </Box>
      &nbsp;&nbsp;&nbsp;&nbsp;
    </div>,
  ];

  const handleGenerateBMNavigation = async () => {
    navigate(`/cm/generateCMRequestSheetMainDashboard`);
  };

  const updateAssignUser = async (updatedRow) => {
    try {
      const response = await axios.patch(
        `/updateAssignUser/?requestSheet_id=${updatedRow?._id}`,
        {
          data: {
            targetDateOfCM: updatedRow?.targetDateOfCM,
            assignUserForCM: updatedRow?.assignUserForCM,
          },
        },
        {
          withCredentials: true,
          credentials: "include",
        }
      );
      if (response.status === 201) {
        handlePopupStatus();
        SuccessToast("Assign user updated successfully");
        getAllCMSheetData();
      }
    } catch (error) {
      console.log(error);
    }
  };

  //Open and close BM request-sheet
  const handleRequestSheetShowAndCloseState = () => {
    setRequestSheetModalOpenClose({
      ...requestSheetModalOpenClose,
      modalOpenClose: !requestSheetModalOpenClose?.modalOpenClose,
    });
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
              New Machine CM Reports
            </Typography>
            <Box display="flex" gap="16px" className="col-auto">
              {/* <Button
                variant="contained"
                disableElevation
                onClick={handleGenerateBMNavigation}
                disabled={
                  context?.user_type !== "TL/HOSS" ||
                  context?.tm_department !== "MTD"
                }
                sx={{
                  fontWeight: 400,
                  bgcolor: "#004b5b",
                  "&:hover": { bgcolor: "#026378" },
                }}
              >
                <AddCircleIcon sx={{ mr: "8px" }} />
                Generate Existing Machine CM RS
              </Button> */}
              <Button
                variant="contained"
                disableElevation
                onClick={handleGenerateBMNavigation}
                disabled={
                  context?.user_type !== "TL/HOSS" ||
                  context?.tm_department !== "PED"
                }
                sx={{
                  fontWeight: 400,
                  bgcolor: "#ff8432ff",
                  "&:hover": { bgcolor: "#ff9c59ff" },
                }}
              >
                <AddCircleIcon sx={{ mr: "8px" }} />
                Generate New Machine CM RS
              </Button>
            </Box>
          </Grid>
        </Grid>
        <Box
          display="flex"
          className="mt-3 cell p-2 overflow-auto justify-content-between"
        >
          <div className="d-flex gap-2">
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
          </div>
          {/* <div className="d-flex gap-2 m-3">
            {CM_CategoryArrayForFilter.map((value) => (
              <Box className="col-auto">
                <Paper
                  variant="outlined"
                  sx={{
                    p: "4px",
                    px: "10px",
                    borderRadius: "8px",
                    background: value?.background,
                  }}
                >
                  <Typography
                    variant="body2"
                    component="div"
                    textAlign="center"
                    // width={120}
                    fontWeight={600}
                    // color={"#15005c"}
                    // pt={"4px"}
                    // mb={"2px"}
                  >
                    {value?.icon} &nbsp;
                    {value.title} {" - "}
                    {value?.count}
                  </Typography>
                </Paper>
              </Box>
            ))}
          </div> */}
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
                isDeleteHidden: () =>
                  context?.isAuthorizedUserForUpdatingRequestSheetInAnyStatus !==
                  "Yes",
                isEditHidden: (selectedRow) =>
                  context?.tm_no === Number("9999") ||
                  !["Generated", "Assigned"].includes(
                    selectedRow?.statusOfNewRequestOfCM
                  ),

                onRowDelete: (selectedRow) =>
                  new Promise(async (resolve, reject) => {
                    // setTimeout(() => {
                    await deleteRequestSheetOfCM(selectedRow);
                    resolve();
                    // }, 500);
                  }),

                isEditable: () =>
                  context?.tm_department === "PED" &&
                  context?.user_type === "TL/HOSS",

                onRowUpdate: (updatedRow) =>
                  new Promise(async (resolve, reject) => {
                    await updateAssignUser(updatedRow);
                    resolve();
                  }),
              }}
              options={{
                ...MaterialTableOptions,
                maxBodyHeight: "auto",
                pageSize:
                  approvalRequestSheetDataOfCM?.length > 10
                    ? 50
                    : approvalRequestSheetDataOfCM?.length,
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
      <>
        <div>
          {selectedNewMachineCMRequestSheetPopupData?.newMachineCmReqSheetView && (
            <NewMachineRequestForViewAndUpdate
              handlePopupStatus={handlePopupStatus}
              selectedYear={reduceState?.selectedYear}
              {...selectedNewMachineCMRequestSheetPopupData}
              // quarterOfSelectedRq={reduceState?.selectedQuarter}
            />
          )}
        </div>
      </>
      {/* {requestSheetModalOpenClose?.modalOpenClose && (
        <MainRequestSheetForView
          selectedYear={reduceState?.selectedYear}
          machine_code={requestSheetModalOpenClose?.machine_code}
          requestSheetID={requestSheetModalOpenClose?.requestSheetID}
          modelProp={{
            show: requestSheetModalOpenClose?.modalOpenClose,
            onHide: () => handleRequestSheetShowAndCloseState(),
          }}
          flagForTogglingFilter={reduceState?.flagForTogglingFilter}
          selectedValue={reduceState?.selectedValue}
        />
      )} */}
    </>
  );
};

export default NewMachineCMRequestSheetReport;
